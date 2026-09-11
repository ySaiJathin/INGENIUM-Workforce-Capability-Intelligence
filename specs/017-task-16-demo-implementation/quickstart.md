# Quickstart: Task 16 — Demo Implementation

Operationalizes `demo_plan.md` §16's rehearsal checklist.

## Prerequisites

- Task 15's integration pass complete (golden path already works end-to-end for real data).
- `backend/data/curated/demo_candidate.json` authored with Demo Officer's resume text and a scripted
  assessment answer sequence.

## Steps

1. Run the full demo script (`demo_plan.md` §14) twice back-to-back on a cold reload each time. Confirm
   zero crashes.
2. Confirm "Try Demo Candidate" works correctly with no cached browser state (private/incognito window).
3. Upload one real PDF/DOCX resume once, confirming the real-upload path still works alongside the demo
   path.
4. Kill network access or invalidate `MISTRAL_API_KEY`, run the assessment step, and confirm it falls
   back to seed questions and nothing crashes.
5. Capture a static screenshot set: initial profile, verified profile, gap analysis, learning path.
   Store it somewhere accessible without network access.
6. Walk every screen and confirm none render blank in their loading/empty/error states.
7. Cross-check every number shown on the gap/profile screens against the deterministic engine's actual
   logged output for this run — confirm none are hand-typed.
8. Time the script at full talking speed and confirm it completes under 2:30 (target 2:00).
9. Pre-load a backup device/browser tab with the app already open, in case of a projector/Wi-Fi issue.

## Expected Outcome

A rehearsed, reliable, ~2-minute demo that survives a Mistral outage, a failed resume upload, and a cold
reload, backed by an offline screenshot fallback set — ready for Task 17's final testing pass.
