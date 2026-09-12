# Phase 1 Data Model: Evidence + RAG + MCP

(Moved here from the now-deleted umbrella spec `019-mcp-faiss-implementation/data-model.md`,
which covered all phases together before they were split into separate per-phase specs.)

No database table changes — the FAISS index is a file-based build artifact, not a database row.

## New entity: EvidenceItem (`backend/src/schemas/evidence.py`)

Represents one retrievable grounding unit. Not a database row — its authoritative content lives in
`data/index/evidence_meta.json` (written once by `build_evidence_index.py`, read-only at runtime).

| Field | Type | Notes |
|---|---|---|
| `id` | `str` | Stable id, e.g. `"competency:sql"`, `"course:sql-foundations-01"`, `"role:role-sso-01"`, `"esco:<esco_id>"` — encodes source type + source id so a grounding check can map a claim back to its origin without a second lookup. |
| `source_type` | `Literal["competency","role","course","esco"]` | |
| `source_id` | `str` | The id in the source table/file (`competencies.id`, `roles.id`, `courses.id`, or an ESCO row id). |
| `text` | `str` | The chunked text that was embedded (name + description, or name + provider + description for courses). |
| `similarity` | `float` | Only present on retrieval results (cosine similarity to the query), absent in the static `evidence_meta.json`. |

## New build artifact: the FAISS index

- `data/index/evidence.faiss` — a `faiss.IndexFlatIP` binary index, one vector per `EvidenceItem`,
  L2-normalized MiniLM embeddings, vector order matching `evidence_meta.json`'s list order.
- `data/index/evidence_meta.json` — `list[EvidenceItem]` (without `similarity`), in the same order
  as the FAISS index's internal vector ids, so `index.search(...)`'s returned integer ids can be
  used directly to look up the corresponding metadata entry.

Rebuilt only by re-running `build_evidence_index.py` (offline, e.g. whenever curated data changes)
— never at request time (FR-003's decision, research.md §1).

## New entity: GroundingReport (`learning_plan_planner.py`'s return value — folded into the
existing `LearningPathResponse`'s shape as an additive, optional field, not its own DB table)

| Field | Type | Notes |
|---|---|---|
| `supported_claims` | `list[str]` | Entity strings from the generated plan text matched to evidence or deterministic input data. |
| `removed_claims` | `list[str]` | Entity strings that could not be matched and were stripped before display. |
| `grounded` | `bool` | `False` whenever `removed_claims` is non-empty or the RAG planner path wasn't used at all (deterministic fallback per FR-007) — lets the frontend (optionally, in a later feature) distinguish a fully-grounded plan from a fallback one without changing the existing required fields.

This field is additive/optional on the existing `LearningPathResponse` schema — no existing
consumer (`frontend/src/pages/LearningPath.tsx`) breaks by its absence, satisfying `CLAUDE.md`
Rule 3's "don't silently break the API contract" by construction (nothing is removed or renamed).
