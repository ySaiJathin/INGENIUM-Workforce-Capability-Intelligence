# Implementation Plan: Task 8 — Skill Gap Engine

**Branch**: `009-task-8-skill-gap-engine` | **Date**: 2026-09-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/009-task-8-skill-gap-engine/spec.md`

## Summary

Implement `POST /analysis` and `GET /analysis/{id}/gaps`: compute `gap = required_level - verified_level`
per required competency from Task 5's requirements and Task 7's verified scores, rank by gap magnitude +
role priority + hierarchy-derived prerequisite importance, and persist the result. Feeds Task 9's course
matching directly (`total_buildplan.md` §25: Task 8 → Task 9).

## Technical Context

**Language/Version**: Python 3.11+, FastAPI, Pydantic.

**Primary Dependencies**: None new — reads Task 2's `role_competencies` and `verified_skill_scores`.

**Storage**: PostgreSQL — writes `analyses` and `skill_gaps` (Task 2's schema).

**Testing**: Unit tests for the ranking function (pure, given a list of required-vs-verified pairs);
contract test for the full `POST /analysis` → `GET /analysis/{id}/gaps` round trip, including the
zero-gap ("no gaps") case.

**Target Platform**: Backend FastAPI service.

**Project Type**: Backend web service (`backend/src/api/analysis.py`, `backend/src/services/gap_engine.py`).

**Performance Goals**: Under 1 second per spec SC-002 — pure computation over a small (5–10 competency)
requirement set.

**Constraints**: `required_level`/`verified_level` sourced only from Tasks 5/7, never invented here
(FR-007); ranking is fully deterministic (no LLM involvement).

**Scale/Scope**: One analysis per `POST /analysis` call, typically 5–10 required competencies per role.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` is unfilled boilerplate; `CLAUDE.md` is the binding rulebook gate.

| Rule | Gate | Status |
|------|------|--------|
| Rule 4 — Mistral boundaries | Gap computation and ranking are fully backend-owned | PASS |
| Rule 2 — No architecture redesign | Reuses Task 2's `analyses`/`skill_gaps` tables as-is | PASS |
| Rule 13 — Performance discipline | Pure computation, no extra queries beyond what's needed | PASS |

No violations — Complexity Tracking table is not needed.

## Project Structure

### Documentation (this feature)

```text
specs/009-task-8-skill-gap-engine/
├── plan.md              # This file
├── research.md           # Phase 0 output — ranking formula and tiebreak rules
├── contracts/
│   └── api.md             # Phase 1 output — POST /analysis, GET /analysis/{id}/gaps
└── checklists/
    └── requirements.md
```

`data-model.md` is omitted: this phase only writes to `analyses` and `skill_gaps`, both already fully
specified in Task 2's `data-model.md`. `quickstart.md` is folded into `contracts/api.md`.

### Source Code (repository root)

```text
backend/
└── src/
    ├── api/
    │   └── analysis.py          # POST /analysis, GET /analysis/{id}/gaps
    └── services/
        └── gap_engine.py         # rank_gaps(required, verified, role_priorities, hierarchy) -> SkillGap[]
```

**Structure Decision**: `gap_engine.py` is a standalone, pure-function service (mirroring `scoring_engine.py`
from Task 7) so the ranking logic is independently unit-testable without a live database or HTTP layer.

## Complexity Tracking

*No Constitution Check violations — table intentionally left empty.*
