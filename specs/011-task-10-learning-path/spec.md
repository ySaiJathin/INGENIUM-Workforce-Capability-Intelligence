# Feature Specification: Task 10 — Learning Path

**Feature Branch**: `011-task-10-learning-path`

**Created**: 2026-09-11

**Status**: Draft

**Input**: Task 10 from `total_buildplan.md` §24: "Ranked gaps + courses → ordered learning path. Persist
if useful." Detailed in §12.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Get One Clear, Ordered Plan to Close My Gaps (Priority: P1)

Given the ranked gaps (Task 8) and matched courses (Task 9) for an analysis, the system assembles them
into a single ordered sequence of learning steps the candidate can follow, considering gap severity, role
priority, prerequisites, and estimated course duration.

**Why this priority**: This is the final step of the golden path — the concrete, actionable output the
candidate leaves the demo with (`total_mvp_context.md` §1's value chain ends here).

**Independent Test**: Can be fully tested by taking a known ranked-gap list and matched-course set and
confirming the resulting path orders steps consistently with gap severity/role priority/prerequisites,
without needing the frontend.

**Acceptance Scenarios**:

1. **Given** an analysis with ranked gaps and matched courses, **When** `POST /learning-path` is called,
   **Then** the system returns an ordered list of steps, each naming a course and which gap(s) it
   addresses.
2. **Given** two gaps where one is a prerequisite of the other (per the competency hierarchy), **When**
   the path is assembled, **Then** the prerequisite competency's course step comes before the dependent
   competency's step.
3. **Given** an analysis with no gaps, **When** a learning path is requested, **Then** the system returns
   an explicit "no further learning required" result rather than an empty or broken response.
4. **Given** a completed learning path, **When** retrieved again, **Then** the same ordered sequence is
   returned (persisted, not recomputed differently each time).

### Edge Cases

- What happens when a gap has no matched course (per Task 9's `unmatched_gaps`)? → It is omitted from the
  ordered path but the response still surfaces that the gap exists and has no available course, so the
  candidate isn't left wondering why it's missing.
- What happens when the same course would be inserted at two different points because it covers gaps at
  different rank positions? → The course appears once, positioned at the earliest (highest-priority) gap
  it addresses, consistent with Task 9's single-recommendation-per-course rule.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST expose `POST /learning-path` accepting an analysis id and producing an ordered
  sequence of steps from that analysis's ranked gaps and matched courses.
- **FR-002**: System MUST order steps considering, at minimum, gap severity/rank, role priority, and
  prerequisite relationships from the competency hierarchy — never a purely arbitrary or alphabetical
  order.
- **FR-003**: System MUST place a prerequisite competency's course step before any step for a competency
  that depends on it, when both appear in the path.
- **FR-004**: System MUST return an explicit "no further learning required" result when the source
  analysis has no gaps, rather than an empty/ambiguous response.
- **FR-005**: System MUST persist the generated learning path so it can be retrieved again without
  recomputation returning a different order.
- **FR-006**: System MAY use Mistral to generate a natural-language rationale/explanation for a step, but
  MUST NOT let Mistral determine the step ordering itself (Rule 4/6).
- **FR-007**: System MUST clearly surface any gap that could not be included in the path due to having no
  matched course, rather than silently dropping it.

### Key Entities

- **Learning Path** *(Task 2's `learning_paths` table)*: tied to one analysis.
- **Learning Path Step** *(Task 2's `learning_path_steps` table)*: step number, course, gap addressed,
  optional rationale text.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: For any analysis with gaps and at least one matched course, a learning path is produced and
  persisted in under 2 seconds (ordering computation, plus an optional Mistral rationale call).
- **SC-002**: 100% of prerequisite/dependent competency pairs present in a path are ordered prerequisite-
  first.
- **SC-003**: Re-fetching a previously generated learning path returns the identical step order every
  time.
- **SC-004**: 100% of gaps with no matched course are surfaced in the response rather than silently
  disappearing between Task 9 and Task 10.

## Assumptions

- Mistral-generated rationale text (FR-006) is optional/best-effort — if the call fails, the step still
  appears in the path with ordering intact, just without a natural-language explanation, consistent with
  the project's failure-handling rules.
- "Persist if useful" (`total_buildplan.md` §24) is interpreted as: persist, since Task 14's frontend and
  Task 16's demo replay both benefit from a stable, re-fetchable path rather than recomputing on every
  view.
