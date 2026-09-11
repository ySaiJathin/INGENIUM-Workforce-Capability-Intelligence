---

description: "Task list for Task 13 — Frontend Assessment"
---

# Tasks: Task 13 — Frontend Assessment

**Input**: Design documents from `/specs/014-task-13-frontend-assessment/`

**Prerequisites**: plan.md, spec.md, quickstart.md

**Tests**: Not requested — manual verification via quickstart.md only (per plan.md's Testing section).

**Organization**: Single user story (US1, P1) per spec.md.

## Pre-Generation Codebase Audit (read before executing any task below)

`Assessment.tsx` and `AppContext.tsx` were read in full against every FR/Edge-Case/SC in spec.md
before writing this list. Finding: **the per-question adaptive fetch, `Previous`/`Next`
client-side-history navigation, and the backend-never-leaks-the-answer contract (`NextQuestionResponse`
in `backend/src/schemas/assessment.py` has no correct-answer field) are already correctly
implemented** — this is not a from-scratch build. Seven concrete, verified gaps remain against
spec.md's literal FRs/Edge-Cases, listed below. Per Rule 10 (preserve working code), this tasks.md
only touches what's actually broken.

## Phase 1: Setup

- [x] T001 Confirm the backend is reachable (`GET /health`) and a candidate can reach the Assessment screen via the Task 12 flow (Try Demo Candidate, or a real upload + role selection) — no code change, verification only.

---

## Phase 2: Foundational

**Not applicable.** Task 11's `apiClient`/`AppContext` and Task 12's candidate-intake screens already
provide everything this phase needs; `startAssessment`/`getNextQuestion`/`submitAnswer` are already
wired in `AppContext.tsx`.

---

## Phase 3: User Story 1 - Take the Adaptive Assessment in the Browser, With Live Verification Feedback (Priority: P1) 🎯 MVP

**Goal**: Close the seven verified gaps between the current implementation and spec.md, so a candidate
can run a full assessment session in the browser with real adaptive/verification feedback, gated
submission, a live per-competency ledger, no source leakage, retryable errors, and refresh-resilience.

**Independent Test**: Run quickstart.md's 12 steps end-to-end against a live backend + demo/real
candidate, confirming SC-001 through SC-004.

### Implementation for User Story 1

- [x] T002 [US1] **(FR-003)** In `frontend/src/pages/Assessment.tsx`, gate the bottom "Next Question" and "Complete Assessment" buttons on `!!selectedOption` in addition to the existing `!!loading.assessment` check (`disabled={!!loading.assessment || !selectedOption}`) — currently only the loading state disables them, so a candidate can advance past a question with no option selected, violating FR-003 ("System MUST require an option to be selected on the current (not-yet-answered) question before advancing"). Do not add this gate to the header's "Complete & View Verified Results" button — that is the FR-008 always-visible early-exit action and must stay ungated.
- [x] T003 [US1] **(FR-011, direct spec violation)** In `frontend/src/context/AppContext.tsx`'s `mapApiQuestion`, remove the line that sets `adaptiveBranchNote` to reveal `q.source === 'seed' ? 'Sourced from the assessment seed bank (fallback).' : ...` — this is a literal, on-screen leak of the Mistral-vs-seed distinction into the candidate-facing sidebar, which FR-011 explicitly forbids ("MUST NOT visually distinguish a Mistral-generated question from a seed-fallback question in the candidate-facing UI"). Replace with honest copy derived only from structured fields the frontend already has (competency name, difficulty), per spec.md's Assumptions, e.g. `Continuing to probe ${competencyName} at difficulty level ${q.difficulty} based on your prior responses.` — identical wording regardless of `source`.
- [x] T004 [US1] **(FR-005, direct spec violation)** Replace `Assessment.tsx`'s hardcoded three-row "Verification Ledger" (`SQL Aggregation & Having — Verified L3`, `Complex Survey Variance — Verified L4`, `SQL Execution Plans — Gap L2/L4` — static JSX, same content in every session) with data sourced from real per-competency evidence:
  - In `AppContext.tsx`, add a new state map `verificationLedger: Record<string, { competencyId: string; competencyName: string; verifiedLevel: number; confidence: number; isGap: boolean }>` (or equivalent), and update one entry every time an answer is actually submitted to the backend inside `nextQuestion` (the branch that calls `WorkforceIntelligenceAPI.submitAnswer` — use that call's `competency_id`, `updated_confidence`, and `updated_difficulty` fields directly; `isGap` = `updated_confidence < 0.75` to mirror the backend's own `CONFIDENCE_THRESHOLD` from `backend/src/services/assessment_engine.py`). Reset it to `{}` in `resetToBlankState`.
  - Expose `verificationLedger` (as an array via `Object.values(...)`) through `AppContextType`/the provider value.
  - In `Assessment.tsx`, render this array in place of the hardcoded rows (empty-state: "No competencies verified yet — answer a question to begin." when the array is empty, e.g. on the first question before any answer).
  - In demo mode, populate a plausible ledger once from `VERIFIED_CAPABILITY_PROFILE`'s mock data (already imported in `AppContext.tsx`) inside `loadDemoCandidate`, rather than leaving demo mode on the old static rows either.
- [x] T005 [US1] **(FR-009)** In `frontend/src/pages/Assessment.tsx`, pass `onRetry={nextQuestion}` to the mid-assessment `<ErrorState error={errors.assessment} />` (the one rendered below the question options, distinct from the top-level "no questions loaded yet" `ErrorState` which already has `onRetry`) — currently this instance renders with no `onRetry`, leaving the candidate with a visible error but no retry affordance, short of FR-009's "clear, retryable error state." `nextQuestion` is safe to retry as-is: it already checks `!assessmentAnswerResults[currentQ.id]` before re-submitting, so a retry after a failed `submitAnswer` call re-submits once, and a retry after a failed `getNextQuestion` call (answer already recorded) skips straight to re-fetching.
- [x] T006 [US1] **(FR-002, literal wording)** In `frontend/src/pages/Assessment.tsx`, change the progress label from `Question ${currentQuestionIndex + 1} of ${totalQuestions}` to `Question ${currentQuestionIndex + 1} of ~${totalQuestions}` (both the small header badge and the `ProgressBar`'s `label` prop) to match FR-002's literal "Question X of ~N" wording — the `~` signals the budget is an approximate cap (a session can end earlier on the confidence/seed-exhaustion stop conditions already observed in backend testing), not a guaranteed exact count.
- [x] T007 [US1] **(type hygiene supporting FR-004)** In `frontend/src/types/index.ts`, change `AssessmentQuestion.correctOptionId` from `correctOptionId: string` to `correctOptionId?: string`, and in `AppContext.tsx`'s `mapApiQuestion`, omit the field entirely for real (non-demo) questions instead of setting it to `''` — makes the "no correct answer available before submission" guarantee visible at the type level for the real-question path, matching plan.md's Structure Decision ("`AssessmentQuestion` no longer includes `correctOptionId` before an answer is submitted"). Demo-mode mock data (`mock/demoData.ts`) keeps supplying it, since that data is synthetic, not backend-sourced.
- [x] T008a [US1] **(FR-006, found during T002-T007 implementation, not in the original audit)** In `frontend/src/pages/Assessment.tsx`'s option-button `onClick`, guard `handleSelectOption` to no-op when `assessmentAnswerResults[currentQ.id]` is already set, and add `disabled={!!answerResult}` to the option `<button>` — previously, revisiting an already-answered question via "Previous" and clicking a *different* option silently changed which option displayed as selected (via `answerAssessmentQuestion`) without resubmitting anything, desyncing the highlighted option from `answerResult`'s actual recorded correctness. This directly violated FR-006's "without allowing it to be resubmitted or changed."
- [x] T008 [US1] **(FR-010/SC-004, Edge Case: browser refresh mid-assessment)** Implement refresh-resilience for the assessment (and the identity state it depends on to even reach `/assessment`, since `RequireCandidate` gates on `candidateId` which is also lost on refresh today):
  - In `AppContext.tsx`, add a `useEffect` that serializes the session-defining slice of state (`candidateId`, `candidate`, `targetRole`, `resumeFileName`, `extractedEvidence`, `initialProfile`, `isDemoMode`, `sessionId`, `questionBudget`, `competencyNameById`, `assessmentQuestions`, `currentQuestionIndex`, `assessmentAnswers`, `assessmentAnswerResults`, `verificationLedger` (from T004), `isAssessmentCompleted`, `analysisId`, `verifiedProfile`, `skillGaps`, `assessmentResults`, `learningPathId`, `learningPath`) to `localStorage` under a single key (e.g. `ingenium.session.v1`) on every change to any of them, wrapped in `try/catch` (never let a `localStorage` quota/availability failure crash the app, matching this project's general failure-handling posture).
  - On `AppProvider` mount, before the existing catalog-loading effects, attempt to read and `JSON.parse` that key; on success, seed all the corresponding `useState` initial values from it instead of the current hardcoded empty defaults (guard every field with a fallback to today's default if a key is missing/malformed — never let a corrupt blob crash startup).
  - In `resetToBlankState`, also remove the `localStorage` key so starting over doesn't resurrect stale state.
  - This makes "resume after refresh" synchronous and instant (satisfies SC-004's "under 3 seconds" trivially, no network round-trip needed) and requires no backend contract change (Task 6's endpoints are frozen per Rule 2) and no new session-id route param, which the current route structure (`/assessment`, no id segment) doesn't have and plan.md itself treats as optional ("...or the prototype's `/assessment` route extended to carry a session id").

**Checkpoint**: User Story 1 is fully functional — gated submission, real live ledger, no source leakage, retryable mid-assessment errors, accurate approximate-count copy, a type-enforced no-leak guarantee, and refresh-resilience — independently verifiable via quickstart.md.

---

## Phase 4: Polish & Cross-Cutting Concerns

- [ ] T009 Run quickstart.md's 12-step script by hand (or via whatever browser-driving tool is available in the session) against a live backend + both demo and real-upload paths, including forcing a Mistral failure (already reproducible in this environment — the current Mistral API key is rate-limited) to confirm FR-011's fix in T003 holds, and forcing a network failure (e.g. stop the backend mid-session) to confirm T005's retry affordance works. Record any discrepancy and fix before considering this phase done.
- [x] T010 Update `specs/014-task-13-frontend-assessment/checklists/requirements.md` with an Implementation Status note (pattern established in `specs/013-task-12-frontend-candidate-flow/checklists/requirements.md`), and mark Phase 13 complete in `total_mvp_context.md`'s status tracker.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Not applicable.
- **User Story 1 (Phase 3)**: T002, T003, T005, T006, T007 are small, independent edits in `Assessment.tsx`/`AppContext.tsx`/`types/index.ts` and can be done in any order. T004 (the ledger) and T008 (refresh persistence) are the two substantial tasks — T008 should be done after T004 so the persisted-state shape includes `verificationLedger` from the start rather than needing a second pass.
- **Polish (Phase 4)**: Depends on Phase 3's checkpoint.

### Parallel Opportunities

- T002, T003, T005, T006, T007 touch small, mostly non-overlapping regions of the same two files (`Assessment.tsx`, `AppContext.tsx`) — safe to do sequentially in one pass rather than truly parallel subagents, since the files are shared and small edits risk merge conflicts if actually parallelized.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (environment check).
2. Complete Phase 3 in this order: T002, T003, T005, T006, T007 (quick, independent fixes) → T004 (ledger) → T008 (refresh persistence, builds on T004's ledger field).
3. **STOP and VALIDATE**: T009's manual quickstart pass.
4. Demo-ready: the assessment screen is spec-compliant end-to-end.

---

## Notes

- [P] markers are omitted — every task is a small, related edit to one of two shared files
  (`Assessment.tsx`, `AppContext.tsx`), and real parallel-agent execution would risk conflicting edits
  more than it would save time.
- Avoid: re-implementing the already-correct per-question fetch/history/Previous-Next logic, and do
  not add a new backend endpoint for "full session history" — T008's localStorage approach achieves
  FR-010/SC-004 without touching Task 6's frozen contract (Rule 2) or adding infrastructure (Rule 13).
