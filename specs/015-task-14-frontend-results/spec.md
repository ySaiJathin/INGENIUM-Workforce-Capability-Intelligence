# Feature Specification: Task 14 — Frontend Results

**Feature Branch**: `015-task-14-frontend-results`

**Created**: 2026-09-11
**Updated**: 2026-09-11 — revised against the existing `sk/sk` prototype's five results/recommendation
screens (Assessment Results, Capability Profile, Skill Gaps, Courses + Course Detail, Learning Path) plus
its Executive Summary Dashboard.

**Status**: Draft

**Input**: Task 14 from `total_buildplan.md` §24: "Verified skill profile, gap visualization, course
recommendations, learning path."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See My Verified Profile, Gaps, Courses, and Learning Path (Priority: P1)

Having completed the assessment, the candidate lands on Assessment Results — the product's core "wow"
moment: an overall readiness score, a resume-vs-verified-vs-required comparison per competency, and a
detailed evaluation table. From there they can drill into the Verified Capability Profile (competency
cards), Skill Gap Analysis (ranked gaps with impact rationale), the recommended Course Catalog (with a
Course Detail deep-dive per course), the Personalized Learning Path (an ordered, interactive timeline),
and finally an Executive Summary Dashboard consolidating everything for a single-glance overview.

**Why this priority**: This is the payoff screen set of the entire golden path — the visual proof of the
product's value proposition (`total_mvp_context.md` §1's demo transformation).

**Independent Test**: Can be fully tested in the running app by reaching Assessment Results after a
completed assessment and confirming each downstream screen (Capability Profile, Skill Gaps, Courses,
Course Detail, Learning Path, Dashboard) correctly renders data already verified via `curl` against Tasks
7–10's endpoints.

**Acceptance Scenarios**:

1. **Given** a completed assessment, **When** the candidate reaches Assessment Results, **Then** they see
   a hero "Overall Role Readiness" score, four key summary metrics (competencies assessed, role-ready
   count, developing count, priority gaps count), a per-competency comparison chart (initial vs. verified
   vs. required), and a detailed evaluation table (initial level, verified level, required level, status,
   psychometric feedback) — the resume-vs-verified contrast is the visually dominant element on the page.
2. **Given** Assessment Results, **When** the candidate proceeds to Capability Profile, **Then** they see
   a card grid of every assessed competency (verified level, target level, confidence, evidence source,
   status), plus top-line metrics (verified profile score, high-confidence item count, identified gap
   count).
3. **Given** Capability Profile, **When** the candidate proceeds to Skill Gaps, **Then** they see summary
   metrics (readiness index, total gaps, critical-priority count, moderate/high count), a fast visual
   comparison chart, and detailed gap cards each explaining operational impact and a recommended
   remediation action — ordered by the ranking from Task 8.
4. **Given** a candidate with no significant gaps, **When** they view Skill Gaps, **Then** it clearly
   states this rather than showing an empty/broken set of cards.
5. **Given** Skill Gaps, **When** the candidate proceeds to Courses, **Then** they see the gap-matched
   course catalog, each course card showing its match score and which gap(s) it closes; selecting a
   course opens Course Detail with its full module breakdown, prerequisites, learning outcomes, and
   expected proficiency-level pathway.
6. **Given** Courses, **When** the candidate proceeds to Learning Path, **Then** they see a hero
   current-vs-projected readiness comparison, summary metrics (sequenced modules, total hours, gaps
   projected closed, projected readiness lift), and an ordered timeline of steps, each showing which
   gap(s) it addresses, priority, status, and key milestones.
7. **Given** a candidate with no gaps, **When** they reach Learning Path, **Then** it clearly states no
   further learning is required rather than showing a broken/empty timeline.
8. **Given** the full results flow, **When** the candidate reaches Dashboard, **Then** they see a
   consolidated single-screen summary (candidate snapshot, four key indicators, top 3 gaps, top 3 courses,
   a quick competency comparison preview) with links back into each detailed screen.

### Edge Cases

- What happens when a gap has no matching course (Task 9/10's `unmatched_gaps`/`gaps_without_courses`)?
  → The UI surfaces it clearly (e.g. "no course currently available for this gap") rather than silently
  omitting it.
- What happens when the verified-profile, gap, course, or learning-path data fetch fails independently?
  → Each screen shows its own error/retry state without breaking navigation to the other screens.
- What happens when the candidate interacts with the Learning Path's "add course" / "remove course" /
  "toggle step status" controls (already built in the prototype)? → These remain client-side-only
  interactive affordances for this MVP (see Assumptions) — they update the on-screen timeline immediately
  but are not required to persist to the backend within this phase's scope.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display, on Assessment Results, per relevant competency, the resume-estimated
  level, the verified level, and the target role's required level, sourced from Task 7's scoring output,
  with the comparison visually emphasized as the page's central element (not buried in a plain table
  indistinguishable from any other section).
- **FR-002**: System MUST display an overall role-readiness score and summary counts (competencies
  assessed, role-ready, developing, priority gaps) derived from real backend data, matching the
  prototype's Assessment Results hero/metrics layout.
- **FR-003**: System MUST display, on Capability Profile, a card per assessed competency with verified
  level, target level, confidence, evidence source, and status, sourced from Task 7's output.
- **FR-004**: System MUST display, on Skill Gaps, the ranked skill gaps from Task 8 as both a fast visual
  comparison chart and detailed gap cards (operational impact, recommended action), including an explicit
  "no significant gaps" state when the list is empty.
- **FR-005**: System MUST display, on Courses, the course recommendations from Task 9, each showing its
  match score and which gap(s) it addresses; selecting a course MUST navigate to a Course Detail screen
  showing that course's full detail (modules, prerequisites, learning outcomes, expected level pathway).
- **FR-006**: System MUST display, on Learning Path, the ordered learning path from Task 10 as a
  timeline, including current-vs-projected readiness metrics and an explicit "no further learning
  required" state when there are no steps.
- **FR-007**: System MUST display, on Dashboard, a consolidated summary drawing from the same already-
  fetched Assessment Results, Skill Gaps, Courses, and Learning Path data, with navigation links into
  each detailed screen — introducing no new backend calls beyond what the other results screens already
  make.
- **FR-008**: System MUST surface any gap with no matching course rather than silently omitting it.
- **FR-009**: System MUST allow each results screen (Assessment Results, Capability Profile, Skill Gaps,
  Courses/Course Detail, Learning Path, Dashboard) to load and error independently, so a failure on one
  screen does not prevent navigation to or rendering of the others.

### Key Entities

- **Assessment Results Screen**: hero readiness score, before/after/required comparison, evaluation table.
- **Capability Profile Screen**: verified-competency card grid.
- **Skill Gaps Screen**: ranked gap visualization + detail cards.
- **Courses / Course Detail Screens**: recommended-course catalog + individual course deep-dive.
- **Learning Path Screen**: ordered, interactive timeline.
- **Dashboard Screen**: consolidated executive summary.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A judge viewing Assessment Results can identify the resume-vs-verified contrast for at
  least one competency within 5 seconds of the screen loading, without an explanation from the presenter.
- **SC-002**: 100% of gaps returned by Task 8 are represented somewhere in the results flow — either as a
  course recommendation or explicitly flagged as having no available course.
- **SC-003**: A failure on any one results screen (simulated backend error) does not prevent the other
  screens from being navigated to and rendering their own data successfully.
- **SC-004**: A candidate with zero gaps sees an unambiguous "you meet the requirements" message on both
  Skill Gaps and Learning Path, rather than any empty-looking table or timeline.

## Assumptions

- The results portion of the golden path spans six screens in the adopted prototype (Assessment Results,
  Capability Profile, Skill Gaps, Courses, Course Detail, Learning Path), plus a seventh consolidating
  Dashboard screen — all six/seven are in scope for this phase, superseding this spec's earlier draft
  which treated "results" as three sub-sections of one route.
- The Learning Path screen's client-side interactivity (`addCourseToLearningPath`,
  `removeCourseFromLearningPath`, `toggleStepStatus`, already implemented in `AppContext`) is kept as a
  local, optimistic UI affordance for this MVP demo — it is not required to call a new backend mutation
  endpoint (no such endpoint is defined in Tasks 2/10's schema/contracts) unless a later phase's
  integration pass determines a judge-facing need for it to persist.
- This phase completes the frontend build; Task 15 (Integration) is where the full chain (frontend →
  FastAPI → PostgreSQL → Mistral → all engines) is exercised end-to-end for the first time as one flow.
