# Feature Specification: Task 16 — Demo Implementation

**Feature Branch**: `017-task-16-demo-implementation`

**Created**: 2026-09-11

**Status**: Draft

**Input**: Task 16 from `total_buildplan.md` §24: "Only after core backend/frontend functionality works.
Follow `demo_plan.md`. Implement 'Try Demo Candidate' and polished demo-specific transitions/content."
Detailed judge-facing experience in `demo_plan.md`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Give a Judge a Polished, Reliable, Two-Minute Demo (Priority: P1)

Once Task 15's integration pass proves the golden path works, a developer seeds a realistic, polished
demo candidate ("Demo Officer," a Statistical Analyst targeting Senior Statistical Analyst) whose resume
text and assessment answers are crafted so the real deterministic engines produce a compelling, credible
resume-vs-verified gap story, and polishes the demo-specific transitions and content named in
`demo_plan.md` so the ~2-minute judge walkthrough runs smoothly.

**Why this priority**: This is what actually gets presented to judges; it directly determines whether the
already-working backend/frontend is perceived as impressive or rough.

**Independent Test**: Can be fully tested by running the exact judge walkthrough script from
`demo_plan.md` §14/§15 start to finish, timing it, and confirming every beat (initial estimate → adaptive
assessment moment → verified profile "wow" comparison → top gap → course "because it covers" line →
learning path) lands as scripted.

**Acceptance Scenarios**:

1. **Given** the "Try Demo Candidate" action on a cold page reload (no cached state), **When** clicked,
   **Then** it loads the pre-seeded Demo Officer profile and proceeds through the identical downstream
   pipeline as a real resume upload, per `total_buildplan.md` §13.
2. **Given** the seeded demo candidate's resume text and assessment answers, **When** the real
   deterministic scoring/gap engines process them, **Then** the resulting verified profile and gaps are
   close to the illustrative numbers in `demo_plan.md` §3 (SQL/Python/Statistics gaps against a Senior
   Statistical Analyst target) — computed for real, never hand-typed into the UI.
3. **Given** the full demo script (`demo_plan.md` §14), **When** run start to finish, **Then** it
   completes within the targeted ~2:30 (trimmable to 2:00), with every named beat visible on screen.
4. **Given** Mistral is made unavailable (network killed or invalid API key), **When** the assessment
   runs, **Then** it falls back to seed questions and the demo continues without visibly breaking.
5. **Given** a real resume upload fails mid-demo, **When** it occurs, **Then** the friendly error and
   "Try Demo Candidate" fallback are polished enough to feel like a smooth, intentional part of the
   presentation flow, not a visible break in composure.

### Edge Cases

- What happens if network/Wi-Fi fails entirely mid-demo? → The demo can continue using a pre-captured
  static screenshot set (initial profile, verified profile, gap analysis, learning path) as an
  absolute last resort, per `demo_plan.md` §13.
- What happens if the database hiccups mid-demo? → One reload is attempted; if it recurs, the same
  screenshot fallback set is used to narrate the architecture without live software.
- What happens if the seeded demo candidate's real engine output has drifted (e.g. after a Task 1
  curated-data change) from the illustrative numbers in `demo_plan.md` §3? → The demo content/script is
  re-checked and adjusted to match whatever the deterministic engine actually now produces — the numbers
  shown are never hand-typed fakes, even if that means the script's exact figures change.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide "Try Demo Candidate" as a single, prominent action on the Landing
  screen that enters the exact same downstream pipeline as a real resume upload.
- **FR-002**: System MUST seed one polished demo candidate (resume text + scripted assessment answers)
  whose real, engine-computed verified profile and gaps closely match the illustrative story in
  `demo_plan.md` §3, without any hand-faked numbers appearing anywhere in the UI.
- **FR-003**: System MUST implement the demo-specific transitions and content named in `demo_plan.md`
  (e.g. the "Initial estimate" label call-out, the verified-vs-initial "wow" comparison beat, the
  adaptive-assessment narration moment) at the polish level needed for a live presentation.
- **FR-004**: System MUST remain fully functional (per Task 15's integration guarantees) when Mistral is
  unavailable during the demo, falling back to seed questions without visibly breaking.
- **FR-005**: System MUST remain fully functional when a real resume upload fails mid-demo, degrading to
  the "Try Demo Candidate" path smoothly.
- **FR-006**: System MUST have a static screenshot fallback set (initial profile, verified profile, gap
  analysis, learning path) captured and accessible offline, as an absolute last resort if live software
  fails entirely.
- **FR-007**: System MUST run the full demo script within its targeted time budget (~2:30, trimmable to
  2:00) when rehearsed.

### Key Entities

- **Demo Candidate**: a specific seeded `candidates`/`candidate_skills` record ("Demo Officer") with
  crafted resume text and pre-scripted assessment answers, distinguishable in data as `source = demo`.
- **Screenshot Fallback Set**: a static, offline-accessible capture of the four key results screens, used
  only if live software fails entirely during a presentation.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A full demo run completes at least twice back-to-back without a crash, per
  `demo_plan.md` §16's rehearsal checklist.
- **SC-002**: "Try Demo Candidate" works correctly on a cold reload with no cached state, every time.
- **SC-003**: The Mistral-unavailable fallback is tested and confirmed to keep the assessment functional,
  with nothing crashing.
- **SC-004**: The scripted walkthrough, timed at full talking speed, completes in under 2:30.
- **SC-005**: Zero hand-typed/fake numbers remain in the UI at demo time — every number shown traces to
  the real deterministic engine's output for the seeded demo candidate.

## Assumptions

- This phase happens only after Task 15's integration pass confirms the golden path already works
  end-to-end for real data — its job is seeding a specific compelling demo candidate and polishing named
  transitions, not building new functionality (`total_buildplan.md` §24: "Only after core backend/
  frontend functionality works").
- The specific demo candidate identity ("Demo Officer," Statistical Analyst → Senior Statistical
  Analyst) and illustrative numbers in `demo_plan.md` §3 are a starting target; this phase is expected to
  adjust the seeded resume text/assessment answers as needed so the real engine output lands close to
  that story, rather than treating the exact numbers as immutable requirements.
