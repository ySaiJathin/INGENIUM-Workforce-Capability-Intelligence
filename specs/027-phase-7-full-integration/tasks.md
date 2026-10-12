---
description: "Task list for Phase 7 — Full Integration"
---

# Tasks: Phase 7 — Full Integration

**Input**: Design documents from `/specs/027-phase-7-full-integration/`

**Prerequisites**: plan.md, spec.md, quickstart.md. Depends on Phases 0-6 all being complete.

**Tests**: This entire phase is a test/verification pass — no new application code is expected by
default.

**Organization**: US1 = clean-start golden path (both entry points), US2 = graceful degradation
under every documented failure — per spec.md.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

- [X] T001 Confirm Phases 0-6's own `tasks.md` checkpoints are all marked complete before starting this phase
- [X] T002 Stop and restart the full stack (Postgres container + backend + frontend) from a clean state to establish a true "freshly started environment" baseline

---

## Phase 2: Foundational

- [X] T003 Prepare a real test resume file (PDF or DOCX) and confirm `MISTRAL_API_KEY` status (rate-limited or not) going into this phase, since several test-matrix rows behave differently depending on it (both outcomes are valid per FR-003, but must be recorded, not assumed)

**Checkpoint**: Environment and test materials ready.

---

## Phase 3: User Story 1 - The whole golden path survives a clean start, both entry points (Priority: P1) 🎯 MVP

**Goal**: Prove the complete pipeline works end-to-end via both entry points from a clean start,
twice each.

**Independent Test**: Complete the golden path via "Try Demo Candidate" and via real resume
upload, each run twice from a fresh session.

### Implementation for User Story 1

- [X] T004 [US1] Run the full golden path once via `POST /candidates/demo` → target-role → assessment → profile → analysis → gaps → courses → learning-path; record each response
- [X] T005 [US1] Run the full golden path a second time via `POST /candidates/demo` (fresh candidate) immediately after T004; confirm no conflict with the first run's state (FR-004)
- [X] T006 [US1] Run the full golden path once via `POST /candidates/resume` with the real test file from T003; confirm it converges on the identical downstream endpoints/shapes as T004 (FR-002)
- [X] T007 [US1] Run the real-resume path a second time from a fresh session; confirm no conflict (FR-004)
- [X] T008 [US1] Time one full walkthrough (either entry point) end-to-end; confirm under 3 minutes of hands-on interaction (SC-001)

**Checkpoint**: User Story 1 complete — golden path proven from clean start, both entry points,
twice each.

---

## Phase 4: User Story 2 - Every documented failure condition degrades gracefully (Priority: P2)

**Goal**: Confirm all 11 documented failure conditions (quickstart.md's matrix) produce clear,
human-readable errors, never crashes or blank screens.

**Independent Test**: Trigger each condition independently against the running system; confirm
graceful degradation and that the rest of the app remains usable afterward.

### Implementation for User Story 2

- [X] T009 [P] [US2] Trigger and record: invalid resume type (quickstart.md row 1)
- [X] T010 [P] [US2] Trigger and record: empty resume (row 2)
- [X] T011 [P] [US2] Trigger and record: corrupt resume (row 3)
- [X] T012 [P] [US2] Trigger and record: LLM unavailable (row 4)
- [X] T013 [P] [US2] Trigger and record: malformed LLM output / rate-limit path (row 5 — already observed working this session; re-confirm post-Phase-2/3/6 changes)
- [X] T014 [P] [US2] Trigger and record: unknown role id (row 6)
- [X] T015 [P] [US2] Trigger and record: unknown candidate id (row 7)
- [X] T016 [P] [US2] Trigger and record: unknown/expired session (row 8)
- [X] T017 [P] [US2] Trigger and record: unavailable course data (row 9)
- [X] T018 [P] [US2] Trigger and record: unavailable evidence retrieval — rename `data/index/evidence.faiss` temporarily, confirm learning-path falls back with `grounding: null` (row 10, Phase 6's fallback)
- [X] T019 [US2] Trigger and record: database temporarily unreachable — stop the Postgres container briefly, retry a request, confirm a clear bounded-timeout error (row 11, already fixed this session via `db.py`'s `connect_timeout`)
- [X] T020 [US2] For each of T009-T019, confirm the error surfaced at the actual point of failure (not a generic downstream error) and that a subsequent normal request succeeds again once the condition is resolved (FR-005/FR-006)

**Checkpoint**: Both user stories verified — Phase 7, and the whole master-document initiative,
complete.

---

## Phase 5: Polish & Cross-Cutting

- [X] T021 Compile T004-T020's results into a single pass/fail table (reuse `specs/018-task-17-final-testing/checklists/requirements.md`'s format if helpful) and attach it to this feature's spec.md or a new `results.md`
- [X] T022 Update `CLAUDE.md`/`total_mvp_context.md`'s status trackers to reflect the completed initiative, closing out the "Known discrepancy" notes both documents currently carry
- [ ] T023 If time remains: capture the offline screenshot fallback set (per `demo_plan.md` §13/§16) now that the full grounded pipeline is in place — **deferred**: no browser-automation tool was loaded this session and the phase's required scope (T001-T022) already consumed the time budget; left for a follow-up session per this task's own "if time remains" framing

---

## Dependencies & Execution Order

- **Setup → Foundational**: environment/materials ready before any test.
- **User Story 1 (Phase 3)**: run first — establishes the happy path works before deliberately
  breaking things in User Story 2.
- **User Story 2 (Phase 4)**: all failure-condition tests (T009-T019) are independent of each
  other and highly parallelizable.
- **Polish (Phase 5)**: depends on both stories' results being recorded.

## Implementation Strategy

This phase should surface zero new code defects if Phases 0-6 were each genuinely completed and
verified per their own `tasks.md` — its value is the composed, whole-system proof, and the
explicit, honest record of that proof (T021) for whoever presents or continues this project next.
