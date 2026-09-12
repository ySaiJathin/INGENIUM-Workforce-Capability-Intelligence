---
description: "Task list for Phase 0 — Diagnose + Stabilize"
---

# Tasks: Phase 0 — Diagnose + Stabilize

**Input**: Design documents from `/specs/020-phase-0-diagnose-stabilize/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), quickstart.md

**Tests**: Not explicitly requested for this phase beyond the live `curl`/API verification already
specified in quickstart.md — no additional unit-test tasks are generated.

**Organization**: Tasks are grouped by user story (spec.md: US1 = diagnosis, US2 = safe upload
handling), per the master document's Phase 0.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files/checks, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2)

## Phase 1: Setup

**Purpose**: Confirm the environment this phase's verification runs against is actually up.

- [X] T001 Confirm PostgreSQL container `competency-postgres` is running and healthy (`docker ps --filter name=competency-postgres`)
- [X] T002 Confirm the backend is running from current source (not a stale container) — this session already resolved this by running `.venv/Scripts/uvicorn.exe backend.src.main:app --host 0.0.0.0 --port 8000` directly; re-confirm it's still the active instance before proceeding

**Checkpoint**: Environment is up and known to be running current source.

---

## Phase 2: Foundational

**Purpose**: The one blocking decision (research.md's Research Decision in plan.md) both user
stories' acceptance depends on.

**⚠️ CRITICAL**: US1's acceptance scenario 2 (detecting stale-vs-current deployments) needs this
decision made first.

- [X] T003 Decide and record the sanctioned backend deployment path in `README.md`: either (a) add a real `Dockerfile` + `docker-compose.yml` backend service that builds from current source, or (b) formally document `uvicorn` run from source (already the working path this session used) as the sanctioned dev/verification path — per `plan.md`'s Research Decision (option b recommended given time constraints)
- [X] T004 (option (b) chosen in T003 — skipped, N/A) If option (a) was chosen in T003: write `Dockerfile` at repo root building `backend/` and add a `backend` service to `docker-compose.yml`; if option (b): skip this task

**Checkpoint**: One documented, unambiguous way to run the backend exists — no more silent
stale-vs-current deployment risk.

---

## Phase 3: User Story 1 - An honest, live-verified diagnosis before any new work starts (Priority: P1) 🎯 MVP

**Goal**: Produce (or, since this session already produced most of it, confirm and finalize) an
accurate, live-verified diagnosis of the system, catching any remaining discrepancy between
running code and checked-in source.

**Independent Test**: Start the environment from a clean state, run the golden path via "Try Demo
Candidate", and confirm every step returns real, non-mocked, correct data; compare findings against
this session's own audit notes and this feature's spec.md.

### Implementation for User Story 1

- [X] T005 [US1] Run `GET /health` against the running backend (per T002) and confirm `{"status":"ok","database":"connected"}` — record result
- [X] T006 [P] [US1] Re-run the full golden path via `POST /candidates/demo` → target-role → assessment loop → profile → analysis → gaps → courses → learning-path (commands already captured in this session's transcript) and confirm every response is real computed data, not a mock
- [X] T007 (N/A — option (a) not chosen, no Docker image to verify) [US1] If T003 chose option (a) — a new backend Docker image — verify its actual running behavior (`docker exec <container> python -c "import inspect; from backend.src.api import candidates; print(inspect.getsource(candidates.upload_resume))"`) matches the checked-in `backend/src/api/candidates.py` exactly, closing out the specific stale-container defect this session found
- [X] T008 [US1] Write/update the Diagnosis Record (a short markdown section — reuse this feature's spec.md Key Entities description as the format) listing every major subsystem (resume processing, target-role selection, adaptive assessment, scoring, gap analysis, course recommendation, learning path, frontend) as confirmed-working, broken, missing, or partial, based on T005-T007's results
- [X] T009 [US1] Cross-check the Diagnosis Record (T008) against `total_mvp_context.md` §6's status tracker and call out, in the Diagnosis Record itself, any place the two disagree (e.g., the tracker's stale "Phase 0-11 not started" line vs. this session's confirmed-working audit)

**Checkpoint**: User Story 1 is independently complete — an accurate, current Diagnosis Record
exists and the environment is confirmed to run current source.

---

## Phase 4: User Story 2 - Uploads and errors behave safely by construction (Priority: P2)

**Goal**: Confirm the resume-upload entry point rejects bad input safely with clear errors, per
FR-002/FR-003/FR-004.

**Independent Test**: Submit a range of invalid inputs directly to `POST /candidates/resume` and
confirm each is rejected with a clear, specific error and no crash.

### Implementation for User Story 2

- [X] T010 [P] [US2] Upload an unsupported file type (e.g., `.txt`) to `POST /candidates/resume` and confirm a `400` with a message naming the problem (already confirmed once this session — re-run against the T003-decided deployment path to close the loop)
- [X] T011 [P] [US2] Upload a file exceeding `MAX_RESUME_UPLOAD_MB` and confirm a `400` before any extraction is attempted
- [X] T012 [P] [US2] Upload a corrupt/unreadable file with a valid extension/MIME type and confirm a `422` pointing to "Try Demo Candidate", never a raw exception
- [X] T013 [US2] Confirm (by code review of `backend/src/api/candidates.py`'s current source, per this session's earlier audit) that no fallback path silently returns a degraded result labeled as full-quality success — record this confirmation in the Diagnosis Record (T008)

**Checkpoint**: User Stories 1 AND 2 both independently verified.

---

## Phase 5: Polish & Cross-Cutting

**Purpose**: Final confirmation this phase's acceptance criteria hold together.

- [X] T014 Run `specs/020-phase-0-diagnose-stabilize/quickstart.md` end to end and record actual output next to each expected result
- [X] T015 Update `total_mvp_context.md` §6's status tracker to reflect Phase 0's now-confirmed state (closing the discrepancy called out in T009), per `CLAUDE.md` Rule 9 ("never wait until the final hour to discover integration failures" — keep tracking docs current as you go)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately.
- **Foundational (Phase 2)**: Depends on Setup. BLOCKS User Story 1's T007 (deployment-behavior
  check) but not the rest of US1/US2, which can proceed in parallel with Phase 2.
- **User Story 1 (Phase 3)**: Can start after Setup; T007 specifically depends on Phase 2 (T003/T004).
- **User Story 2 (Phase 4)**: Can start after Setup, independent of Phase 2/User Story 1.
- **Polish (Phase 5)**: Depends on both user stories being complete.

### Parallel Opportunities

- T006, T010, T011, T012 can run in parallel with each other (different requests, no shared state
  risk beyond independent candidate rows).
- User Story 2 (Phase 4) can be worked entirely in parallel with User Story 1 (Phase 3) except
  where both feed the same Diagnosis Record (T008/T013) — sequence those two specifically.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational (the deployment-path decision).
3. Complete Phase 3: User Story 1 — this alone delivers the phase's core value (an honest,
   confirmed diagnosis).
4. **STOP and VALIDATE**: the Diagnosis Record is accurate and current.

### Incremental Delivery

1. Setup + Foundational → environment confirmed, deployment ambiguity resolved.
2. User Story 1 → Diagnosis Record complete → this is the primary deliverable judges/developers
   read next.
3. User Story 2 → upload safety confirmed → closes the remaining P0 risk before Phase 1 (Resume
   Intelligence) builds further on this entry point.
4. Polish → quickstart run recorded, tracking docs updated.
