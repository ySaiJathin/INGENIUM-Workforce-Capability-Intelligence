# Implementation Plan: Phase 6 — Evidence + RAG + MCP

**Branch**: `026-phase-6-evidence-rag-mcp` | **Date**: 2026-09-12 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/026-phase-6-evidence-rag-mcp/spec.md`

**Design artifacts**: This phase's detailed technical decisions, data model, and contracts are in
this same feature directory: `research.md` (FAISS index type, evidence corpus composition,
grounding validator approach), `data-model.md` (`EvidenceItem`/`GroundingReport`/FAISS-index-as-
build-artifact), and `contracts/evidence-and-learning-path.md` (the `get_relevant_evidence` tool
and the additive `LearningPathResponse.grounding` field). (These were originally drafted under a
combined umbrella spec, `019-mcp-faiss-implementation`, before the work was split into one spec
per phase; that umbrella spec has since been deleted and its relevant content copied here and
into Phase 2's spec.)

## Summary

Build the offline evidence-index builder (`backend/src/scripts/build_evidence_index.py`), the
runtime retrieval service (`backend/src/services/evidence_engine.py`), wire
`mcp.tools.get_relevant_evidence` (stubbed in Phase 2) to it, and build the new
`backend/src/services/learning_plan_planner.py` (Mistral RAG call + grounding validator) that
`backend/src/api/learning_path.py` calls instead of `learning_path_engine.py`'s current
Mistral-rationale call, falling back to the existing deterministic path (FR-007) when either the
index or the planner call is unavailable.

## Technical Context

**Language/Version**: Python 3.12. **Primary Dependencies**: NEW — `faiss-cpu` (add to
`requirements.txt`, the second and final authorized new dependency per `CLAUDE.md`'s updated Rule
12). **Storage**: new file-based artifacts under `data/index/` (not a DB table — see
`data-model.md`). **Testing**: `pytest` for `evidence_engine.py`'s query function against a small
fixture index; a script-level smoke test for `build_evidence_index.py` (run once, assert output
files exist and item count matches curated-data count); live `curl` test of `POST /learning-path`
confirming the new `grounding` field. **Target Platform**: unchanged. **Project Type**: one new
offline script, one new service, one new service consuming both plus the existing
`gap_engine`/`course_recommendation_engine` output. **Performance Goals**: evidence query <200ms
locally (trivial at this corpus size with `IndexFlatIP`). **Constraints**: index built offline only,
never per-request (FR-003); grounding check is deterministic, no second LLM call (research.md §4).
**Scale/Scope**: low hundreds of evidence chunks (competencies + roles + courses + optional bounded
ESCO slice).

## Constitution Check

No project constitution ratified. Operative constraint: `CLAUDE.md`'s explicit rule change (FAISS
is now required core infrastructure, the second of the two authorized exceptions). No violations
to justify — FAISS is pre-authorized.

## Project Structure

### Documentation (this feature)

```text
specs/026-phase-6-evidence-rag-mcp/
├── plan.md              # This file
├── research.md           # FAISS index type, evidence corpus composition, grounding validator
├── data-model.md         # EvidenceItem, GroundingReport, FAISS index build artifact
├── contracts/
│   └── evidence-and-learning-path.md   # get_relevant_evidence tool + additive REST field
├── quickstart.md         # This command's output
└── tasks.md              # /speckit-tasks output (not created by this command)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── scripts/
│   │   └── build_evidence_index.py     # NEW — offline: reads data/curated/*.json (+ bounded
│   │                                      ESCO slice), embeds with all-MiniLM-L6-v2, writes
│   │                                      data/index/evidence.faiss + evidence_meta.json
│   ├── services/
│   │   ├── evidence_engine.py          # NEW — lazy-load the persisted index (never rebuild),
│   │   │                                  cosine-similarity query, returns EvidenceItem list
│   │   └── learning_plan_planner.py    # NEW — assembles gaps + courses + retrieved evidence,
│   │                                      calls mistral_client for the RAG-grounded plan,
│   │                                      applies the grounding validator (research.md §4),
│   │                                      falls back to learning_path_engine.py's existing
│   │                                      deterministic path on any failure
│   ├── schemas/
│   │   └── evidence.py                  # NEW — EvidenceItem, GroundingReport (data-model.md)
│   ├── mcp/tools.py                     # MODIFIED — get_relevant_evidence wired to
│   │                                       evidence_engine.py (was stubbed in Phase 2)
│   └── api/learning_path.py             # MODIFIED — calls learning_plan_planner first, falls
│                                            back to learning_path_engine.py on failure; response
│                                            gains the additive `grounding` field
└── tests/
    ├── test_evidence_engine.py          # NEW
    └── test_learning_plan_planner.py    # NEW — grounding validator strips an unsupported claim

data/
└── index/                                # NEW directory — evidence.faiss + evidence_meta.json
requirements.txt                           # add `faiss-cpu`
```

**Structure Decision**: Additive-only to `learning_path.py`'s contract (new optional field, no
existing field changed — satisfies Rule 3's "don't silently break the API contract"). The existing
`learning_path_engine.py` is preserved unchanged as the fallback path, not replaced.

## Complexity Tracking

None beyond the pre-authorized `faiss-cpu` addition itself.
