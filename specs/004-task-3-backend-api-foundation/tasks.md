---
description: "Task list for Task 3 — Backend API Foundation"
---

# Tasks: Task 3 — Backend API Foundation

**Input**: Design documents from `/specs/004-task-3-backend-api-foundation/`
**Prerequisites**: plan.md (required), spec.md (required), contracts/api.md, quickstart.md

**Tests**: Not explicitly requested; `quickstart.md`'s `curl` steps serve as the verification pass per
Rule 9, run directly against the live server rather than a separate pytest suite, to match Task 2's
precedent and stay within the time budget.

**Organization**: Single user story (P1).

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup (Shared Infrastructure)

- [X] T001 Create `backend/src/schemas/__init__.py` package for Pydantic response models (kept
      separate from the SQLAlchemy models in `backend/src/models/`, per the plan's API/data layering)

## Phase 2: Foundational (Blocking Prerequisites)

- [X] T002 Create `backend/src/main.py`: FastAPI app instance, CORS middleware (frontend will run on a
      different origin/port per Task 11), and router registration point for T004–T007's routers

## Phase 3: User Story 1 - Query Reference Data Over a Stable API (Priority: P1) 🎯 MVP

**Goal**: Five read-only endpoints (`/health`, `/roles`, `/roles/{id}`, `/competencies`, `/courses`),
each returning real data from Task 2's seeded database, verifiable entirely via `curl`.

**Independent Test**: Run every step in `quickstart.md` against the live server and confirm each response
shape matches `contracts/api.md`.

### Implementation for User Story 1

- [X] T003 [P] [US1] Create Pydantic response schemas in `backend/src/schemas/reference.py`:
      `HealthStatus` (`status`, `database`, `detail` optional), `RoleSummary` (`id`, `name`,
      `description`), `RequiredCompetency` (`competency_id`, `name`, `required_level`, `priority`),
      `RoleDetail` (`RoleSummary` fields + `required_competencies: list[RequiredCompetency]`),
      `CompetencySummary` (`id`, `name`, `description`, `parent_competency_id`), `CourseSummary`
      (`id`, `title`, `description`, `provider`, `level`, `duration_hours`,
      `competencies_covered: list[str]`) — field names and nesting exactly matching
      `contracts/api.md`'s JSON examples (FR-007)
- [X] T004 [US1] Create `backend/src/api/health.py`: `GET /health` — attempt a trivial DB query
      (`SELECT 1`); on success return `{"status": "ok", "database": "connected"}` (200); on failure
      return `{"status": "degraded", "database": "unreachable", "detail": "..."}` (200, per
      contracts/api.md — a health check reports degradation, it doesn't itself 5xx) (FR-001, Edge Cases)
- [X] T005 [US1] Create `backend/src/api/roles.py`: `GET /roles` returning every `Role` row as
      `RoleSummary` (FR-002); `GET /roles/{id}` joining `RoleCompetency`+`Competency` for
      `required_competencies`, returning `RoleDetail` (FR-003), and raising HTTP 404 with
      `{"detail": "Role '<id>' not found"}` for an unknown id (FR-003, Edge Cases)
- [X] T006 [P] [US1] Create `backend/src/api/competencies.py`: `GET /competencies` returning every
      `Competency` row as `CompetencySummary` (FR-004)
- [X] T007 [P] [US1] Create `backend/src/api/courses.py`: `GET /courses` returning every `Course` row
      joined with its `CourseCompetency` rows, `competencies_covered` as a plain list of competency ids,
      as `CourseSummary` (FR-005)
- [X] T008 [US1] Register all four routers (T004–T007) in `backend/src/main.py` (depends on T004–T007)
- [X] T009 [US1] Run `quickstart.md` steps 1–7 against the live `uvicorn` server and confirm every
      response matches `contracts/api.md` (SC-001/SC-002/SC-003)

**Checkpoint**: Task 3 is complete — the first `curl`-verifiable API surface is live, ready for Task 4/5
to extend the same FastAPI app with candidate/role-selection endpoints.

---

## Dependencies & Execution Order

- T001 → T003 (schemas package must exist before schema modules are added to it).
- T002 is independent of T001/T003 (different files) but must exist before T008 (router registration).
- T003 (schemas) must exist before T004–T007 (routers import from it) — not `[P]` relative to them.
- T004 is not `[P]`: `GET /health` is the simplest endpoint but shares no file with T005–T007, so it
  *could* run in parallel with T006/T007; it is listed sequentially here only because T005 (roles)
  establishes the not-found-response pattern (`contracts/api.md`'s convention) that's easiest to write
  once, first, and reuse. T006/T007 are marked `[P]` since they're independent of T004/T005's files.
- T008 depends on T004–T007 all existing (imports every router).
- T009 depends on T008 (server must expose every endpoint to be curl-tested).

## Implementation Strategy

### MVP (this phase's only scope)

1. Complete Phase 1 (schemas package) and Phase 2 (FastAPI app shell).
2. Complete Phase 3: schemas (T003) → endpoints (T004, T005, T006 ∥ T007) → registration (T008) →
   verification (T009).
3. **STOP and VALIDATE**: T009's `quickstart.md` run is this phase's pass/fail signal — Task 4/5 should
   not begin until every one of the five endpoints is confirmed live and correct.

## Notes

- No authentication/session state on any of these five endpoints, per spec Assumptions and
  `total_buildplan.md` §22's exclusion of production-scale auth from the MVP.
- The `contracts/api.md` conventions (404 shape, plain-array list responses, stable id fields) apply to
  every endpoint built in Tasks 4–10, not just this phase's five — established here once, reused after.
