# Contract: Evidence Retrieval + Learning Path Grounding

(Moved here from the now-deleted umbrella spec
`019-mcp-faiss-implementation/contracts/mcp-tools.md`'s "Contract: REST additions/changes"
section and the `get_relevant_evidence` tool row, which covered all phases together before they
were split into separate per-phase specs.)

## `get_relevant_evidence` MCP tool (wired this phase; stubbed as always-erroring in Phase 2)

| Tool name | Input | Output | Backed by | Error case |
|---|---|---|---|---|
| `get_relevant_evidence` | `RelevantEvidenceRequest {query: str, top_k: int = 5}` | `RelevantEvidenceResult {items: list[EvidenceItem]}` | `evidence_engine.py`'s FAISS query | Index not yet built (files missing) → `MCPToolError(reason="index_unavailable")`, never a crash; caller (`learning_plan_planner.py`) falls back to FR-007's deterministic plan on this error |

## REST additions/changes

No existing endpoint's request shape changes. One additive change only (Rule 3 compliant — no
existing field renamed or removed):

1. **`GET /learning-path/{id}` and `POST /learning-path`** response gains one new optional field:
   `grounding: GroundingReport | null` (see `data-model.md`). `null` when the deterministic-only
   fallback path was used (FR-007); populated when the RAG planner + grounding validator ran.

An optional, separate `GET /evidence?query=...&top_k=5` endpoint (direct evidence browsing outside
the learning-plan flow) is explicitly marked P1/optional — not required for FR-004/FR-005 to be
satisfied, since the learning-plan generator can call `evidence_engine.py`/the MCP tool internally
without a dedicated REST route. Cut it first under `CLAUDE.md` Rule 11 (P0 before P1) if time is
short.
