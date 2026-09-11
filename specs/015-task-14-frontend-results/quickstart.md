# Quickstart: Task 14 — Frontend Results

## Prerequisites

- Task 13 complete (a candidate can complete an assessment and land on Assessment Results).
- Backend running with Tasks 7–10's endpoints verified.

## Steps

1. Complete an assessment for a candidate with a known resume-vs-verified difference. Confirm Assessment
   Results visually emphasizes at least one competency's initial/verified/required comparison (spec
   SC-001) and its hero readiness score matches Task 7's output.
2. Proceed to Capability Profile. Confirm the competency card grid matches Task 7's verified profile,
   with correct confidence/evidence/status per card.
3. Proceed to Skill Gaps. Confirm the ranked gap cards and visual comparison match Task 8's
   `GET /analysis/{id}/gaps` order, including operational-impact text.
4. Proceed to Courses. Confirm each course card's match score and "closes" description reflect Task 9's
   `match_reason`/`match_score`. Click into a course to confirm Course Detail renders its full module/
   prerequisite/outcome breakdown.
5. Proceed to Learning Path. Confirm the ordered timeline matches Task 10's persisted step order, and the
   current-vs-projected readiness banner is populated.
6. Proceed to Dashboard. Confirm it shows a consolidated summary without issuing new network requests
   beyond what the prior screens already fetched (check the network tab).
7. Repeat with a candidate who has zero gaps. Confirm Skill Gaps and Learning Path both show explicit "no
   gaps"/"no further learning required" messaging.
8. Confirm any `unmatched_gaps`/`gaps_without_courses` entries are visibly flagged somewhere in the flow,
   not silently missing.
9. Simulate a failure in just the course-recommendations call (e.g. temporarily break that one endpoint).
   Confirm the other six screens still render and remain navigable.

## Expected Outcome

The full results flow — Assessment Results, Capability Profile, Skill Gaps, Courses, Course Detail,
Learning Path, Dashboard — renders correctly from real backend data, with the resume-vs-verified contrast
as the visually dominant element, every gap accounted for, and independent per-screen failure handling,
ready for Task 15's full integration pass.
