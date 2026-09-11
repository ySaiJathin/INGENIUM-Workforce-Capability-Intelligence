# Quickstart: Task 15 — Integration

## Prerequisites

- Every prior phase (Tasks 0–14) individually verified via its own `quickstart.md`/`contracts/api.md`.
- Backend and frontend both running simultaneously against the same PostgreSQL instance and a real
  `MISTRAL_API_KEY`.

## Steps

1. Full run, demo entry point: open the app, click "Try Demo Candidate," select a role, complete the
   assessment, view the verified profile, gaps, recommendations, and learning path — noting any step
   that fails, mismatches, or requires a workaround.
2. Full run, resume entry point: repeat step 1 starting from a real PDF/DOCX resume upload.
3. For every mismatch found in steps 1–2, trace it to the owning phase (e.g. a field-name mismatch
   between `contracts/api.md` in `specs/007-task-6-adaptive-assessment-engine` and what
   `frontend/src/routes/Assessment.tsx` expects), fix it there, and re-run that phase's own
   `quickstart.md` to confirm the fix.
4. Repeat step 1 (demo path) two more times to confirm SC-001's "at least three times in a row"
   reliability bar.
5. Repeat step 2 (resume path) once more to confirm the fix set holds for both entry points.

## Expected Outcome

The complete golden path runs successfully, end-to-end, through the real browser UI against the real
backend/database/Mistral integration, at least three times via the demo path and twice via the resume
path, with zero manual workarounds and zero mocked data — ready for Task 16's demo-specific polish.
