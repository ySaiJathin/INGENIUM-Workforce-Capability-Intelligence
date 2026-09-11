# Quickstart: Task 12 — Frontend Candidate Flow

## Prerequisites

- Task 11 complete (app shell, routes, `AppContext`, API client wired to the real backend).
- Backend running with Tasks 4/5/16 endpoints verified.

## Steps

1. Open the app at Home. Confirm "Start Capability Assessment" and "Try Demo Candidate" are both visible
   and equally accessible.
2. Click "Try Demo Candidate." Confirm the app navigates to the Candidate screen showing a profile
   labeled as demo data.
3. From Candidate, proceed to Resume Upload. Confirm the extracted-evidence table shows real (or, for the
   demo path, real-engine-computed-from-demo-seed) competencies with source snippets, levels, confidence,
   and "Needs Assessment" tags.
4. Proceed to Initial Profile. Confirm the level-taxonomy guide (Foundation/Working/Advanced/Expert)
   renders and every competency row carries a confidence badge and verification-status tag.
5. Proceed to Role Selection. Confirm the real role catalog from `GET /roles` renders as cards with
   department/band/summary/focus tags.
6. Select a role and proceed to Role Requirements. Confirm the required-competency matrix and the
   candidate's initial-estimate-vs-requirement comparison both render from real data.
7. Restart from Home; this time click "Start Capability Assessment" and upload a valid sample resume via
   the Resume Upload screen. Confirm a staged loading indicator appears, then the extracted-evidence table
   shows the real extraction result (not demo data).
8. Restart from Home; upload an unsupported file (e.g. a `.png`). Confirm a clear error message appears
   with a visible "Try Demo Candidate" call-to-action.
9. Rapidly double-click the upload/demo button in either flow. Confirm only one candidate is created (no
   duplicate submission).

## Expected Outcome

Both entry paths (real upload and demo candidate) converge on the same Role Requirements screen, every
pre-assessment competency display is clearly tagged as unverified/low-confidence, upload failures always
offer the demo fallback, and no step crashes or shows a blank screen — satisfying Rule 12's
demo-reliability requirement before Task 13's assessment screen is built.
