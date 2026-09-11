# Quickstart: Task 17 — Final Testing

## Prerequisites

- Task 15 (integration) and Task 16 (demo implementation) complete.

## Steps — run each scenario, record pass/fail

1. **Happy path**: run the full golden path via both entry points. Expect: success, no errors.
2. **Invalid resume**: upload a corrupted/wrong-type/oversized file. Expect: clear error + "Try Demo
   Candidate" offered (Task 4/12 behavior).
3. **Mistral failure**: kill network or invalidate `MISTRAL_API_KEY`, run resume extraction and the
   assessment. Expect: graceful extraction error (Task 4) and seed-question fallback (Task 6), no crash.
4. **Empty answer**: call `POST /assessment/{id}/answer` directly with no `selected_index` (bypassing the
   frontend's disabled-button guard). Expect: backend validation error, not a crash or recorded evidence.
5. **Duplicate question**: submit an answer twice for the same `question_id`. Expect: HTTP 409 per Task 6.
6. **Database failure**: stop the PostgreSQL process mid-session, make a request. Expect: useful error
   response, backend process stays up, no data corruption on restart.
7. **API error**: send a malformed request to any endpoint (bad JSON, missing required field). Expect:
   4xx response, not an unhandled exception.
8. **Demo fallback**: from a state where the real-data path just failed (any scenario above), switch to
   "Try Demo Candidate." Expect: it works reliably regardless of what failed.
9. **Frontend refresh**: refresh the browser at each golden-path screen (profile, role, mid-assessment,
   results). Expect: sensible recovery per Task 11/13, no lost context or crash.

## For each fix applied

- Re-run the happy-path scenario (step 1) to confirm no regression.
- Re-run the Task 16 demo script once more to confirm it still completes successfully.

## Expected Outcome

All nine scenarios pass (or their remaining non-critical issues are explicitly logged, not silently
dropped), the golden path and demo script both still work after any fixes, and the team stops building
features — per `total_buildplan.md` §23's Definition of Done — ready to present to judges.
