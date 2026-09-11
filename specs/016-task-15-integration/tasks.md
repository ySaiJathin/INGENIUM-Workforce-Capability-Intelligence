---

description: "Task list for Task 15 — Integration"
---

# Tasks: Task 15 — Integration

**Input**: Design documents from `/specs/016-task-15-integration/`

**Prerequisites**: plan.md, spec.md, quickstart.md

**Tests**: Not requested. This phase's own nature *is* a test — spec.md explicitly says "the golden-path
run itself is the test." No new test tasks are added beyond what quickstart.md already prescribes.

**Organization**: Single user story (US1, P1) per spec.md.

## Pre-Generation Notes — Two Real Constraints and One Spec Conflict (read before executing any task)

This phase is unlike Tasks 12-14: it adds no new code by design (plan.md: "This phase does not add new
features — it is a verification-and-fix pass"). Its job is to run the whole system as one flow and fix
any contract mismatch found. Three things materially change what's achievable in this session, stated
up front rather than discovered partway through and glossed over:

1. **No browser-automation tool is available in this environment** (confirmed earlier this session:
   `chromium-cli` is not installed, Playwright is not in `frontend/node_modules`). FR-001/SC-001
   literally require the golden path to run "through the browser UI." Per this session's earlier
   decision on the same tooling gap (declined installing Playwright for Task 13's verification), this
   phase's browser-driven steps (quickstart.md steps 1, 2, 4, 5 — the 3x-demo/2x-resume run) are done via
   **direct API calls that reproduce the exact request sequence the frontend's `AppContext.tsx` makes**
   (same technique already used earlier this session to verify the backend end-to-end), not literal
   clicking. T005 records this explicitly rather than silently claiming a browser run happened.
2. **The Mistral API key in `.env` has been rate-limited (HTTP 429) for the entire session**, confirmed
   independently on both the resume-extraction and question-generation endpoints, with no change after
   waiting. This blocks live verification of "real Mistral extraction and real assessment questions"
   (Acceptance Scenario 2) — the code's fallback-to-seed path was already verified working correctly, but
   the *Mistral-success* path itself cannot be exercised live right now. T004 documents this rather than
   fabricating a "verified" claim for a path that could not actually be run.
3. **A genuine spec-to-spec conflict, not a bug**: `specs/013-task-12-frontend-candidate-flow/spec.md`'s
   own Assumptions section explicitly defers real backend-wiring for "Try Demo Candidate" to Task 16
   ("Task 16 (Demo Implementation) is where the exact judge-facing shortcut behavior ... is finalized").
   `AppContext.tsx`'s `loadDemoCandidate()` is, today, 100% client-side mock data with zero backend
   calls — confirmed in this session's earlier audits of Tasks 12-14. This directly conflicts with this
   phase's own SC-002 ("Zero mocked or hardcoded placeholder data remains anywhere in the completed
   flow") for the demo entry point specifically. **This is not something to silently fix here** —
   spec 013 assigned that work to Task 16 for a reason (it's demo-specific shortcut design, not generic
   integration), and CLAUDE.md Rule 2 forbids unplanned scope pickup without a genuine blocker. T006
   documents this conflict explicitly for whoever runs Task 16 next, rather than either ignoring
   SC-002 or quietly building Task 16's feature inside this phase.

Given the above, this phase's real, achievable scope in this session is: **a full contract-audit pass
between every frontend API call site and its backend schema** (the literal example FR-003/Edge-Cases
gives — "a field name mismatch between frontend expectation and actual API response"), **a live
API-level regression run of the entire golden path** (re-verifying end-to-end that Tasks 13-15's
frontend changes since the original backend verification didn't desync anything), and **fixing anything
found at its source**, per FR-003.

## Phase 1: Setup

- [x] T001 Confirm the backend is reachable and seeded, and the frontend typechecks/builds cleanly (`cd frontend && npx tsc --noEmit && npm run build`) — establishes a clean baseline before the audit below.

---

## Phase 2: Foundational

**Not applicable.** This phase has no new foundational work — it audits and exercises what Tasks 0-14
already built.

---

## Phase 3: User Story 1 - Run the Entire Golden Path as One Continuous Flow (Priority: P1) 🎯 MVP

**Goal**: Find and fix, at their source, any contract mismatch between what `frontend/src/services/api.ts`
sends/expects and what the actual backend endpoints (Tasks 3-10) send/expect, then prove the whole chain
still works end-to-end after Tasks 12-14's frontend changes.

**Independent Test**: Every endpoint in `api.ts` is cross-checked against its backend Pydantic schema
field-by-field; a full request sequence matching the real resume-upload golden path succeeds end-to-end
against a live backend with no manual intervention.

### Implementation for User Story 1

- [x] T002 [US1] **(FR-003, contract audit)** Cross-check every method in `frontend/src/services/api.ts` against its backend route's actual request/response Pydantic schema, field name and type by field name and type: `uploadResume`→`ResumeUploadResponse`/`InitialProfileItem` (`backend/src/schemas/candidates.py`), `selectTargetRole`→`TargetRoleSelectionResponse`/`RoleDetail`, `startAssessment`→`StartAssessmentResponse`, `getNextQuestion`→`NextQuestionResponse`/`SessionCompletedResponse`, `submitAnswer`→`AnswerResponse`, `getAssessmentProfile`→`ProfileResponse`/`VerifiedProfileItem` (`backend/src/schemas/assessment.py`), `createAnalysis`→`AnalysisResponse`, `getSkillGaps`→`GapsResponse`, `getCourseRecommendations`→`CoursesResponse` (`backend/src/schemas/analysis.py`), `createLearningPath`/`getLearningPath`→`LearningPathResponse` (`backend/src/schemas/learning_path.py`), `getTargetRoles`/`getRoleDetail`→`RoleSummary`/`RoleDetail`, `getCompetencies`/`getAllCourses`→`CourseSummary` (`backend/src/schemas/reference.py`). Fix any mismatch found at its source (the frontend `types/index.ts`/`mappers.ts` if the frontend's assumption is wrong, or flag the backend schema for a source-level fix if the backend is wrong) — per FR-003, never patch around a mismatch only where it happens to surface.
- [x] T003 [US1] **(FR-001/FR-004/FR-005, live regression run)** With the backend running (seeded, `MISTRAL_API_KEY` set) and Postgres up, replay the exact request sequence `AppContext.tsx` issues for the real-resume-upload golden path end-to-end via direct HTTP calls in the same order the frontend makes them (`POST /candidates/resume` → `POST /candidates/{id}/target-role` → `POST /assessment/start` → repeated `GET .../next-question` + `POST .../answer` → `GET .../profile` → `POST /analysis` → `GET .../gaps` → `GET .../courses` → `POST /learning-path`), confirming each response shape matches what T002 audited and that no step requires manual intervention (FR-004). Run it twice in immediate succession with two different synthetic candidates (SC-001's "repeated reliability," adapted to this session's API-level substitute for a browser run — see the Pre-Generation Notes) to confirm the second run isn't affected by any state left over from the first (e.g. shared in-memory caches, no accidental global state).
- [x] T004 [US1] **(Acceptance Scenario 2, honestly scoped)** Attempt one real resume upload against the live Mistral API to see if the rate limit has cleared since earlier in this session; if it has, confirm the full real-Mistral-extraction path (not just the seed/fallback path already verified) produces a response `api.ts`/`mappers.ts` can consume without a mismatch. If the rate limit has not cleared, record that explicitly rather than substituting the already-verified fallback path as if it were the same thing — Acceptance Scenario 2 specifically calls for "real Mistral extraction and real assessment questions," which is a different code path (the `try` branch, not the `except MistralExtractionError`/`except MistralQuestionGenerationError` branch) from what has been exercised so far.
- [x] T005 [US1] Document, in `specs/016-task-15-integration/checklists/requirements.md`, that quickstart.md's literal browser-driven steps (1, 2, 4, 5 — the "3x demo + 2x resume through the browser UI" reliability bar in SC-001) were not executed as literal browser clicks in this session (no browser-automation tool available, and Playwright installation was previously declined for the equivalent situation in Task 13's verification) — T003's API-level replay is the substitute evidence gathered instead, and a human should still run the literal quickstart.md browser steps before relying on SC-001 as fully satisfied.
- [x] T006 [US1] Document, in the same checklist file, the SC-002/spec-013 conflict described in the Pre-Generation Notes above: "Try Demo Candidate" is still 100% client-side mock data (confirmed in `AppContext.tsx`'s `loadDemoCandidate`), which cannot satisfy this phase's SC-002 for that entry point without doing Task 16's job early. Do not silently mark SC-002 as met for the demo path — record it as a known, carried-forward gap explicitly owned by Task 16.

**Checkpoint**: Every documented API contract has been cross-checked field-by-field with zero mismatches found (or all found mismatches fixed at their source), the real-resume-upload golden path has been proven twice in a row at the API level, and both known limitations (no browser tool, Mistral rate limit, demo-mode mock gap) are recorded honestly rather than glossed over.

---

## Phase 4: Polish & Cross-Cutting Concerns

- [x] T007 Mark Phase 15 in `total_mvp_context.md`'s status tracker as complete *with the caveats from T005/T006 noted inline* (not a bare checkmark) — this phase's completion is conditional on those two carried-forward items, and the tracker should say so for whoever reads it next.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Not applicable.
- **User Story 1 (Phase 3)**: T002 (the audit) should happen before T003 (the live run) so any fix it finds is already in place before the regression run; T004 is independent (a one-shot rate-limit check) and can run any time; T005/T006 are documentation-only and depend on T003/T002's actual findings.
- **Polish (Phase 4)**: Depends on Phase 3's checkpoint.

### Parallel Opportunities

- T004 (the Mistral rate-limit recheck) is independent of T002/T003 and could be done first or in
  parallel; given it's a single quick check, sequencing it doesn't cost anything.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (baseline typecheck/build/health check).
2. Complete Phase 3: T002 (contract audit) → fix anything found → T003 (live regression run) → T004
   (Mistral recheck) → T005, T006 (honest documentation of the two carried-forward limitations).
3. **STOP and VALIDATE**: Phase 3's checkpoint.
4. Hand off to Task 16 with two explicit carry-forwards: a human browser pass against quickstart.md,
   and the demo-candidate real-backend wiring spec 013 already assigned to Task 16.

---

## Notes

- This phase deliberately does not modify `AppContext.tsx`'s demo-mode behavior — that is Task 16's
  assigned scope per spec 013's own Assumptions, and picking it up here without the user asking for it
  would be exactly the kind of unplanned scope expansion CLAUDE.md Rule 2 warns against.
- If T002 finds a genuine contract mismatch, fix it at the owning file and re-run T003 before moving on
  — per FR-003, a mismatch fixed only at the point of failure (rather than at its source) does not count
  as resolved for this phase's purposes.
