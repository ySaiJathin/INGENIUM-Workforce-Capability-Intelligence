# Implementation Plan: Task 10 — Learning Path

**Branch**: `011-task-10-learning-path` | **Date**: 2026-09-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/011-task-10-learning-path/spec.md`

## Summary

Implement `POST /learning-path`: assemble Task 8's ranked gaps and Task 9's matched courses into one
persisted, ordered sequence, respecting prerequisite order from the competency hierarchy, with an
optional Mistral-supplied rationale per step. This is the last engine in the backend chain
(`total_buildplan.md` §25: Task 9 → Task 10 → Task 11 frontend work begins).

## Technical Context

**Language/Version**: Python 3.11+, FastAPI, Pydantic.

**Primary Dependencies**: `mistral_client.py` (from Task 4/6, extended for optional rationale text) — the
only new external call in this phase, and it is non-blocking to the core ordering result.

**Storage**: PostgreSQL — reads `skill_gaps`/`course_recommendations`, writes `learning_paths` and
`learning_path_steps` (Task 2's schema).

**Testing**: Unit test for the ordering function (pure, given ranked gaps + matched courses + hierarchy);
a test with a synthetic prerequisite/dependent pair confirming ordering (FR-003/SC-002); a test
confirming re-fetch returns an identical persisted order (FR-005/SC-003); a test with a forced Mistral
failure confirming the path still returns with ordering intact but no rationale text.

**Target Platform**: Backend FastAPI service.

**Project Type**: Backend web service (`backend/src/api/learning_path.py`,
`backend/src/services/learning_path.py`).

**Performance Goals**: Under 2 seconds per spec SC-001, including an optional Mistral rationale call.

**Constraints**: Ordering is always deterministic and backend-owned; Mistral, if used, supplies only
rationale text, never ordering (FR-006, Rule 4/6); an unmatched gap must be surfaced, not silently
dropped (FR-007).

**Scale/Scope**: One learning path per analysis, typically a handful of steps (bounded by the number of
gaps from Task 8).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` is unfilled boilerplate; `CLAUDE.md` is the binding rulebook gate.

| Rule | Gate | Status |
|------|------|--------|
| Rule 4/6 — Mistral boundaries / deterministic logic | Ordering backend-only; Mistral only for rationale | PASS |
| Rule 5 — Validate all LLM output / graceful failure | Rationale call failure doesn't break the path | PASS |
| Rule 2 — No architecture redesign | Reuses Task 2's `learning_paths`/`learning_path_steps` as-is | PASS |

No violations — Complexity Tracking table is not needed.

## Project Structure

### Documentation (this feature)

```text
specs/011-task-10-learning-path/
├── plan.md              # This file
├── research.md           # Phase 0 output — ordering algorithm, prerequisite handling, rationale call
├── contracts/
│   └── api.md             # Phase 1 output — POST /learning-path
└── checklists/
    └── requirements.md
```

`data-model.md` is omitted: this phase only writes to `learning_paths`/`learning_path_steps`, already
fully specified in Task 2's `data-model.md`. `quickstart.md` is folded into `contracts/api.md`.

### Source Code (repository root)

```text
backend/
└── src/
    ├── api/
    │   └── learning_path.py          # POST /learning-path, GET /learning-path/{id}
    └── services/
        └── learning_path.py           # build_path(gaps, recommendations, hierarchy) -> LearningPathStep[]
```

**Structure Decision**: Ordering logic lives in a pure `learning_path.py` service function (same pattern
as `scoring_engine.py` and `gap_engine.py`), called by the API layer which separately, and optionally,
calls `mistral_client.py` to attach rationale text per step without that call being on the critical path
for ordering correctness.

## Complexity Tracking

*No Constitution Check violations — table intentionally left empty.*
