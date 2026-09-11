# Feature Specification: Task 13 — Frontend Assessment

**Feature Branch**: `014-task-13-frontend-assessment`

**Created**: 2026-09-11
**Updated**: 2026-09-11 — revised against the existing `sk/sk` `Assessment.tsx`/`AssessmentResults.tsx`
prototype, which reveals per-question correctness immediately and shows a live per-competency
"Verification Ledger," a materially different UX than this spec's original "hide scores until the end"
design. See Requirements/Assumptions for the resulting corrections.

**Status**: Draft

**Input**: Task 13 from `total_buildplan.md` §24: "Question display, answer selection, submit, progress,
loading, adaptive messaging."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Take the Adaptive Assessment in the Browser, With Live Verification Feedback (Priority: P1)

Having selected a target role, the candidate starts the Assessment screen, sees one question at a time
(with a practical scenario, the question, optional code reference, and options), submits an answer, sees
immediate correct/incorrect feedback with an explanation, watches a live "Assessment Intelligence Feed"
sidebar update with the adaptive probe reasoning and a running per-competency verification ledger, moves
through the question sequence (forward, or back to review an already-answered question), and can either
finish naturally or choose to complete early — then hands off to the Assessment Results screen.

**Why this priority**: This is the interactive heart of the demo — the screen where a judge experiences
both the "adaptive" claim and the "verification" claim directly and immediately, not just at the end.

**Independent Test**: Can be fully tested in the running app by starting a session (via Task 6's already
API-verified endpoints), answering a sequence of questions, and confirming the screen shows correctness
feedback, updates the sidebar ledger and progress after each answer, allows backward navigation to
already-answered questions, and ends in a transition to the Assessment Results screen.

**Acceptance Scenarios**:

1. **Given** a candidate on the Assessment screen, **When** it loads, **Then** it starts a session via
   Task 6's `start` endpoint and displays the first question (competency name, difficulty badge, practical
   scenario, question text, optional code snippet, and options) with a progress indicator ("Question 1 of
   ~N").
2. **Given** a displayed question, **When** the candidate selects an option, **Then** the screen
   immediately shows whether it was correct (styled distinctly for correct vs. incorrect) and an
   explanation drawer, using correctness returned by the backend's answer-submission response — never a
   client-side-known correct answer.
3. **Given** an answered question, **When** the candidate clicks "Next Question," **Then** the screen
   requests the next adaptively-selected question from the backend and advances, updating progress and the
   sidebar's "Current Probe Hypothesis" / "Adaptive Progression Note" copy to reflect the backend's actual
   routing decision for that step.
4. **Given** a candidate who has answered at least one question, **When** they click "Previous," **Then**
   the screen shows the prior, already-answered question (read from client-side history, not re-fetched)
   with its selected answer and correctness still visible, without allowing the answer to be resubmitted
   or changed.
5. **Given** the sidebar's Verification Ledger, **When** an answer is submitted, **Then** it updates to
   reflect the candidate's actual current per-competency evidence state (verified level so far, or "gap"
   flag) sourced from the backend, not static placeholder content.
6. **Given** the assessment reaches its natural stop condition (confidence threshold met or question
   budget exhausted, per Task 6), **When** the final answer is submitted, **Then** the screen shows a
   clear "assessment complete" transition and navigates to Assessment Results.
7. **Given** an in-progress assessment, **When** the candidate clicks "Complete & View Verified Results"
   before the natural stop condition, **Then** the screen requests early completion, scoring is computed
   from whatever evidence was collected so far (per Task 6/7's partial-evidence support), and the app
   navigates to Assessment Results.
8. **Given** a `next-question` or `answer` call fails (network/server error), **When** it occurs, **Then**
   the screen shows a clear error state with a retry option, never a frozen or blank screen.

### Edge Cases

- What happens if the candidate refreshes the browser mid-assessment? → The screen re-fetches the
  session's current state (via the session id in the URL/context, per Task 11) and resumes at the current
  question and answered-question history, rather than restarting or crashing.
- What happens if the candidate tries to submit without selecting an option? → The "Next Question"/
  "Complete Assessment" action is effectively gated by option selection for the current question (a
  question already answered, reached via "Previous," does not need re-selection).
- What happens if a question is served from the seed fallback (Task 6's `source: seed`) rather than
  Mistral? → The candidate-facing experience is identical; the fallback is not exposed as a visible
  difference to the candidate (it may be visible in developer-facing logs/tools only).
- What happens when the candidate clicks "Previous" all the way back past the first question? → The
  "Previous" action is disabled at question 1.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display one question at a time — scenario, question text, optional code
  snippet, and options — sourced from Task 6's `start`/`next-question` endpoints.
- **FR-002**: System MUST display a progress indicator showing the current question number and the
  session's approximate total (question budget), matching the prototype's `Question X of ~N` presentation.
- **FR-003**: System MUST require an option to be selected on the current (not-yet-answered) question
  before advancing to the next question or completing.
- **FR-004**: System MUST call Task 6's `answer` endpoint on selection and show immediate correct/
  incorrect feedback and an explanation, using only the correctness and explanation returned by that
  response — the question payload delivered to the browser MUST NOT include the correct answer ahead of
  submission (a correction from the prototype's current mock-data behavior, where `correctOptionId` is
  visible client-side; this must not carry over into the real integration, per Rule 6/architecture
  security expectations).
- **FR-005**: System MUST display a live sidebar reflecting the backend's actual adaptive-routing
  reasoning for the current question ("Current Probe Hypothesis") and the resulting per-competency
  verification state so far ("Verification Ledger": competency name, current verified level or gap flag),
  sourced from real session/evidence state — not static placeholder text as in the prototype's current
  mock content.
- **FR-006**: System MUST allow the candidate to navigate back to any already-answered question in the
  current session (from client-side history) to review their answer and its correctness, without allowing
  it to be resubmitted or changed, and MUST allow navigating forward again up to the current frontier.
- **FR-007**: System MUST detect assessment completion (natural stop condition from the `next-question`/
  `answer` response, per Task 6) and transition to Assessment Results automatically.
- **FR-008**: System MUST allow the candidate to voluntarily complete the assessment early via a always-
  visible "Complete & View Verified Results" action, triggering scoring from whatever evidence exists so
  far (Task 6/7's partial-evidence support) rather than requiring every question in the budget to be
  answered.
- **FR-009**: System MUST show a clear, retryable error state if a next-question or answer call fails,
  never leaving the candidate on a frozen or blank screen.
- **FR-010**: System MUST be able to resume an in-progress session's current state and answered-question
  history after a page refresh, using the session id already present in the route (per Task 11).
- **FR-011**: System MUST NOT visually distinguish a Mistral-generated question from a seed-fallback
  question in the candidate-facing UI.

### Key Entities

- **Assessment Screen State**: current question, client-side history of already-answered questions
  (question + selected option + correctness + explanation), progress (question number/approximate
  total), live sidebar state (probe hypothesis, adaptive note, verification ledger), loading/error state.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A candidate can complete a full assessment session (start to completion, natural or early)
  using only the browser UI, with zero unhandled crashes across any number of test runs.
- **SC-002**: 100% of correctness feedback shown to the candidate is sourced from the backend's answer
  response — zero instances of a correct-answer value being present in browser-visible data before that
  question is submitted.
- **SC-003**: A judge observing the screen can tell, without being told, that the assessment is both
  adapting (via the sidebar's live probe reasoning) and being verified in real time (via the live
  verification ledger and immediate correctness feedback) rather than presenting a static fixed quiz.
- **SC-004**: A browser refresh mid-assessment resumes the session, including previously-answered-question
  history, without data loss or a restart, in under 3 seconds.

## Assumptions

- The prototype's current all-at-once `getAssessmentQuestions(roleId)` call and free `Previous`/`Next`
  array-index navigation are UI conventions, not a literal contract; the real integration instead calls
  Task 6's `next-question` endpoint one question at a time as the candidate progresses (true adaptive
  routing requires each question to depend on the prior answer), while the frontend caches each revealed
  question and its answer client-side so "Previous" can browse already-seen history without an incompatible
  batch pre-fetch of not-yet-determined future questions.
- The prototype's sidebar "Verification Ledger" currently shows hardcoded example rows (e.g. "SQL
  Aggregation & Having — Verified L3"); this phase replaces that with the real per-competency
  `skill_evidence` state Task 6 already tracks and exposes.
- Immediately revealing correctness and running verification state (rather than only revealing them at
  the end) is treated as the product's actual, intended UX for this MVP — a deliberate choice for
  engagement and transparency — superseding this spec's earlier draft, which assumed scores stayed hidden
  until a single "reveal" moment at Assessment Results.
- "Adaptive messaging" (the sidebar's probe hypothesis / progression note) is UI copy derived from
  whatever reasoning/state Task 6's backend can supply per question (e.g. target competency, difficulty
  rationale); if the backend does not supply free-text reasoning, the frontend derives short, honest
  copy from the structured fields it does receive (competency, difficulty delta) rather than inventing
  unsupported narrative.
