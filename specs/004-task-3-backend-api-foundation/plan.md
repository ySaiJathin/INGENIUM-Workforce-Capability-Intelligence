# Implementation Plan: Task 3 — Backend API Foundation

**Branch**: `004-task-3-backend-api-foundation` | **Date**: 2026-09-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-task-3-backend-api-foundation/spec.md`

## Summary

Stand up the FastAPI app and its first five read-only endpoints (`/health`, `/roles`, `/roles/{id}`,
`/competencies`, `/courses`) reading from the schema Task 2 created and seeded. This is the first
API-verifiable slice of the backend, establishing the request/response conventions (error shapes, JSON
field naming) that every later endpoint (Tasks 4–10) reuses.

## Technical Context

**Language/Version**: Python 3.11+, FastAPI, Pydantic response models.

**Primary Dependencies**: FastAPI, Pydantic, the SQLAlchemy/psycopg session from Task 2's `db.py`.

**Storage**: Reads only, from the PostgreSQL schema/seed created in Task 2 — no writes in this phase.

**Testing**: Contract tests per endpoint (`curl`/httpie against a running server with the seeded DB) —
per Rule 9/§16, every endpoint must be verified with real, non-mock data before any later phase (or the
frontend) depends on it.

**Target Platform**: Local FastAPI dev server on the developer/demo machine.

**Project Type**: Backend web service (`backend/src/api/`).

**Performance Goals**: Sub-second response for all five endpoints at this catalogue scale (spec SC-003:
under 500ms even for an error response).

**Constraints**: No authentication (spec Assumptions); no field ever silently removed/repurposed once
verified (spec FR-007/SC-004) — any breaking change follows the project's consumer-search-and-update rule.

**Scale/Scope**: 5 endpoints, reference-data scale from Tasks 1–2 (5–8 roles, 30–50 competencies/courses).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` is unfilled boilerplate; `CLAUDE.md` is the binding rulebook gate.

| Rule | Gate | Status |
|------|------|--------|
| Rule 10 — Preserve working code / API contracts | FR-007/SC-004 freeze the shape once verified | PASS |
| Rule 11 — Frontend sequencing | Endpoints exist and are `curl`-verifiable before any frontend work | PASS |
| Rule 4 — Mistral boundaries | These endpoints never call Mistral; pure DB reads | PASS |
| Rule 13 — Performance discipline | No pagination/caching infra added at this small catalogue scale | PASS |

No violations — Complexity Tracking table is not needed.

## Project Structure

### Documentation (this feature)

```text
specs/004-task-3-backend-api-foundation/
├── plan.md              # This file
├── contracts/
│   └── api.md            # Phase 1 output — request/response shapes for all 5 endpoints
├── quickstart.md         # Phase 1 output — curl/httpie verification steps
└── checklists/
    └── requirements.md
```

`research.md` is omitted: no technology unknowns remain — FastAPI/Pydantic and the endpoint list are
already fixed by `total_buildplan.md` §6. `data-model.md` is omitted: this phase introduces no new
entities: it reads exactly the `roles`, `competencies`, `role_competencies`, `courses`,
`course_competencies` tables defined in Task 2's `data-model.md`.

### Source Code (repository root)

```text
backend/
└── src/
    ├── main.py               # FastAPI app instantiation, router registration
    └── api/
        ├── health.py          # GET /health
        ├── roles.py           # GET /roles, GET /roles/{id}
        ├── competencies.py    # GET /competencies
        └── courses.py         # GET /courses
```

**Structure Decision**: One router module per resource under `backend/src/api/`, each importing models
from `backend/src/models/` (created in Task 2) and returning Pydantic response models — no business logic
beyond simple reads/joins at this stage. This layout is what Tasks 4–10 extend with `candidates.py`,
`assessment.py`, `analysis.py`, and `learning_path.py` routers.

## Complexity Tracking

*No Constitution Check violations — table intentionally left empty.*
