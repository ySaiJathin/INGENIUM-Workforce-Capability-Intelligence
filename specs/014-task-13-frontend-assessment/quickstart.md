# Quickstart: Task 13 — Frontend Assessment

## Prerequisites

- Task 12 complete (candidate reaches the Role Requirements screen and can proceed to the assessment).
- Backend running with Task 6's endpoints verified.

## Steps

1. From Role Requirements, click "Start Adaptive Assessment." Confirm the first question renders with
   scenario, question text, options, and a progress indicator.
2. Open the browser network tab. Confirm the question response for an unanswered question contains no
   correct-answer field (FR-004/SC-002).
3. Select an option. Confirm immediate correct/incorrect feedback and an explanation appear, matching the
   backend's `answer` response.
4. Confirm the sidebar's "Verification Ledger" updates to reflect real per-competency evidence state
   (not the prototype's old hardcoded rows).
5. Click "Next Question." Confirm a new question is fetched (not read from a preloaded array) and the
   sidebar's probe/adaptive-note copy reflects the new question's actual competency/difficulty.
6. Click "Previous." Confirm the prior question, selected answer, and correctness are shown read-only,
   with no way to resubmit or change the answer.
7. Click "Next" again to return to the current frontier and continue answering.
8. Mid-assessment, refresh the browser. Confirm the screen resumes at the current question with the
   answered-question history intact, rather than restarting or breaking.
9. Click "Complete & View Verified Results" before the natural stop condition. Confirm the app completes
   the session early and navigates to Assessment Results with results computed from partial evidence.
10. Repeat a full run to natural completion (confidence threshold or question budget) and confirm the
    same automatic transition occurs.
11. Force a Mistral failure (reusing Task 6's fallback test setup) and confirm the UI shows no visible
    difference for a seed-fallback question.
12. Force a `next-question`/`answer` network failure and confirm a retryable error state appears.

## Expected Outcome

A candidate can complete an entire assessment session through the browser UI alone, with real,
backend-sourced correctness feedback and verification state, visible adaptive behavior, working
Previous/Next navigation over real history, resilient refresh handling, and a graceful transition into
the results screens — verified before Task 14 begins.
