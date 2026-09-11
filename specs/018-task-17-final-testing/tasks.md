---

description: "Task list for Task 17 — Final Testing"
---

# Tasks: Task 17 — Final Testing

**Input**: Design documents from `/specs/018-task-17-final-testing/`

**Prerequisites**: plan.md, spec.md, quickstart.md

**Tests**: This entire phase *is* the test — quickstart.md's nine named scenarios, each recorded
pass/fail per FR-001/SC-001. No additional test tasks are generated beyond that.

**Organization**: Single user story (US1, P1) per spec.md.

## Pre-Generation Notes

This is the last phase before the demo (`total_buildplan.md` §23's Definition of Done: "stop building
features, move to testing → bug fixing → UI polish → demo rehearsal"). It adds no new functionality by
design — nine named scenarios, tested and recorded, only critical bugs fixed (FR-003), any fix
re-verified against the golden path and Task 16's demo script (FR-004/FR-005).

**What's already been substantiated earlier in this session, re-verified fresh rather than re-argued
from memory**: the happy path (specs 016/017 both ran full live golden-path passes), Mistral failure
(confirmed genuinely rate-limited and gracefully falling back to seed questions in every prior phase's
testing), and the demo fallback (spec 017's live run). These get a quick re-confirmation pass here
(T002, T004, T009) rather than being treated as already "done" and skipped — FR-001 calls for testing
all nine in *this* final pass, not reusing old results unchecked.

**One scenario needs a real, if minor, live-infrastructure action**: scenario 6 (database failure)
requires stopping this project's own dedicated `competency-postgres` Docker container mid-request. This
container is exclusive to this project (confirmed earlier this session — it is not shared with any other
project on this machine), so stopping and immediately restarting it is a normal, low-risk, fully
reversible dev action, not a shared-system risk. T006 does this deliberately and restarts it
immediately after observing the failure behavior.

**One scenario cannot be live-tested in this environment**: scenario 9 (frontend refresh) requires an
actual browser, which this session does not have (no `chromium-cli`, no Playwright — the same
limitation noted in specs 013/014/016/017). T008 re-reviews the `AppContext.tsx` `localStorage`
persistence logic built in spec 014 at the code level instead, and names this as needing a human
browser pass, consistent with this session's established practice of not fabricating a "tested" claim
for something not actually run.

## Phase 1: Setup

- [x] T001 Confirm the backend is reachable and seeded, Postgres is up, and the frontend still typechecks/builds cleanly — baseline before the nine-scenario pass.

---

## Phase 2: Foundational

**Not applicable.** This phase tests what Tasks 1-16 already built; it adds nothing new.

---

## Phase 3: User Story 1 - Confirm the Product Survives Every Plausible Demo-Day Failure (Priority: P1) 🎯 MVP

**Goal**: Run all nine named scenarios, record pass/fail for each, fix only critical bugs found, and
re-verify the golden path + demo script after any fix.

**Independent Test**: Each of the nine scenarios in quickstart.md is deliberately triggered and its
outcome recorded; the golden path and Task 16's demo script both still succeed at the end.

### Implementation for User Story 1

- [x] T002 [US1] **Scenario 1 — Happy path**: run the full golden path via the real-resume-upload entry point (API-level, per this session's established substitute for a browser run) end-to-end through to a populated learning path. Record pass/fail.
- [x] T003 [US1] **Scenario 2 — Invalid resume**: `POST /candidates/resume` with an unsupported file type (e.g. a `.txt` renamed `.pdf`, or a genuinely corrupt PDF) and confirm a `422` with the `"Unable to parse resume. Try Demo Candidate instead."` detail (`backend/src/api/candidates.py`), never a `500`. Record pass/fail.
- [x] T004 [US1] **Scenario 3 — Mistral failure**: with the current (still rate-limited, per every prior phase this session) `MISTRAL_API_KEY`, run a resume upload and an assessment session, confirming resume extraction returns the graceful `422` and the assessment falls back to `assessment_seed.json` questions without crashing. Record pass/fail.
- [x] T005 [US1] **Scenario 4 — Empty answer**: `POST /assessment/{id}/answer` with a JSON body missing `selected_index` entirely, and separately with `selected_index` as a non-integer, against a real in-progress session. Confirm FastAPI/Pydantic's automatic `422` validation error fires (`AnswerRequest` in `backend/src/schemas/assessment.py` requires `selected_index: int`) rather than a crash or a recorded (invalid) answer. Record pass/fail.
- [x] T006 [US1] **Scenario 5 — Duplicate question**: submit a valid answer for a question, then submit again for the same `question_id`. Confirm the second call returns `409` (`assessment_engine.DuplicateAnswerError` → `HTTPException(409, ...)` in `backend/src/api/assessment.py`) and does not double-count the evidence. Record pass/fail.
- [x] T007 [US1] **Scenario 6 — Database failure**: with a request in flight or about to be made, stop the `competency-postgres` Docker container, make a request (e.g. `GET /health`), and confirm the backend process itself stays alive and returns a clear error (not a hung/crashed process) rather than corrupting anything — then restart the container immediately and confirm `GET /health` recovers to `"status":"ok"` with no manual backend restart needed. Record pass/fail.
- [x] T008 [US1] **Scenario 7 — API error**: send a request with malformed JSON (unparseable body) and a request missing a required field (e.g. `POST /assessment/start` with no `candidate_id`) to a couple of representative endpoints. Confirm both return `4xx`, never an unhandled `500`/stack-trace leak. Record pass/fail.
- [x] T009 [US1] **Scenario 8 — Demo fallback after a failure**: after deliberately failing scenario 2 or 3 above, call `POST /candidates/demo` and confirm it succeeds and proceeds normally regardless of the prior failure (proves Task 16's real demo-candidate wiring is independent of what failed on the real-data path). Record pass/fail.
- [x] T010 [US1] **Scenario 9 — Frontend refresh (code-level review, not live-browser-tested — see Pre-Generation Notes)**: re-read `AppContext.tsx`'s `localStorage` persistence effect and rehydration logic (spec 014's T008) end-to-end once more, confirming it still covers every piece of state Task 16's demo-mode refactor added (`recommendedCourseIds`/`unmatchedGapCompetencyIds`/`gapsWithoutCoursesCompetencyIds`/`verificationLedger` — all already included per spec 015/014's `PersistedSession` interface) and that nothing in Task 16's changes introduced a new piece of session state that bypasses persistence. Record pass/fail-by-code-review, and name this as needing a human browser pass to confirm live (T012).
- [x] T011 [US1] **Fix any critical bug found in T002-T010** at its source (per FR-003/Rule 10 — the file that actually owns the failing behavior, not a patch at the point of failure), then re-run **both** scenario 1 (happy path) and a fresh demo-candidate run (Task 16's story) to confirm no regression (FR-004/FR-005), before moving to the next fix.

**Checkpoint**: All nine scenarios have a recorded pass/fail outcome; any critical bug found is fixed and
re-verified against the golden path and demo script; non-critical issues found are listed explicitly
rather than silently dropped (SC-003).

---

## Phase 4: Polish & Cross-Cutting Concerns

- [x] T012 Update `specs/018-task-17-final-testing/checklists/requirements.md` with the full pass/fail table for all nine scenarios, the list of any critical bugs fixed (with what was re-verified), and the explicit list of any non-critical issues logged but deliberately not fixed (SC-003) — including naming T010's "needs a human browser pass" status and, if any turned up, listing every non-critical issue noticed incidentally during this whole multi-phase session (013-017) that was out of scope for its originating phase.
- [x] T013 Update `total_mvp_context.md`'s status tracker: mark Phase 17 complete-with-caveats (matching the pattern already used for Phases 15/16), and add a final one-line project-status summary given this is the last phase in the tracker.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Not applicable.
- **User Story 1 (Phase 3)**: T002-T010 are independent of each other (different scenarios) and can run in any order, though T007 (database failure) is best done in isolation since it briefly takes the whole backend offline for every other in-flight test — do it either first or last, not interleaved with the others. T011 depends on whichever of T002-T010 actually found something to fix.
- **Polish (Phase 4)**: Depends on Phase 3's checkpoint.

### Parallel Opportunities

- None meaningful for a single-session pass — each scenario is quick and sequential recording is simpler than coordinating parallel agents around one shared backend process, especially given T007's deliberate downtime window.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 3: T002-T006, T008, T009 (quick, independent, backend-up scenarios) → T007 (the one that takes the backend down, done last among the live ones so it doesn't block the others) → T010 (code review) → T011 (fix anything critical found, with regression re-checks).
3. **STOP and VALIDATE**: Phase 3's checkpoint — nine recorded outcomes, zero un-re-verified fixes.
4. Complete Phase 4: document results, close out the tracker. This is the last planned phase — per
   `total_buildplan.md` §23, feature-building stops here.

---

## Notes

- Per FR-003, do not fix anything found here that is cosmetic or affects only an out-of-scope P1/P2
  feature — log it in T012 instead. The instinct after four fix-heavy specs (013-017) in this session
  should be resisted here: this phase's job is confirming survivability, not further polish.
- If T007's database-stop reveals a real crash (not just an error response), that is the one scenario
  in this list most likely to surface a genuine, demo-critical gap — the backend should return a clear
  5xx and keep running, never exit/hang.
