# Feature Specification: Task 8 — Skill Gap Engine

**Feature Branch**: `009-task-8-skill-gap-engine`

**Created**: 2026-09-11

**Status**: Draft

**Input**: Task 8 from `total_buildplan.md` §24: "Candidate profile + target role → gap calculation →
ranked competency gaps." Detailed in §10.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See Exactly Which Competencies Fall Short of the Role (Priority: P1)

Given a candidate's verified competency profile (Task 7) and their selected target role's requirements
(Task 5), the system computes, for every required competency, how far short the candidate falls, and
returns the gaps ranked by what matters most — highest-value gaps first.

**Why this priority**: This is the pivot from "here's your score" to "here's what to work on," the input
Task 9's course recommendations need.

**Independent Test**: Can be fully tested by taking a known verified profile and a known role's
requirements and confirming the computed gap for each competency equals `required_level - verified_level`
exactly, ranked in the documented order.

**Acceptance Scenarios**:

1. **Given** a candidate's verified profile and target role requirements, **When** `POST /analysis` runs,
   **Then** the system returns a gap entry for every required competency where verified level is below
   required level, each showing the numeric gap.
2. **Given** a candidate whose verified level meets or exceeds every required competency, **When**
   analyzed, **Then** the system returns an empty (or explicitly "no gaps") result rather than an error.
3. **Given** multiple gapped competencies, **When** the result is returned, **Then** they are ordered by
   gap magnitude, role priority, and dependency/prerequisite importance — highest-value gaps first.
4. **Given** a required competency the candidate was never assessed on and has no resume evidence for
   (verified level effectively 0/unknown), **When** analyzed, **Then** it still appears as a gap (using
   whatever verified level Task 7 produced for it, even at low confidence) rather than being silently
   skipped.

### Edge Cases

- What happens when a target role has zero required competencies (a curation gap from Task 1/5)? → The
  system returns an empty gap list, not an error.
- What happens when a competency's `required_level` and `verified_level` are exactly equal? → `gap <= 0`
  means it is not included in the gapped list (no shortfall).
- What happens when two competencies have an identical gap magnitude? → Role priority breaks the tie;
  if priority also ties, order is stable/deterministic (e.g. by competency id) rather than arbitrary.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST expose `POST /analysis` accepting a candidate id and target role id (and,
  implicitly, the candidate's most recent/relevant completed or in-progress assessment session), and MUST
  create a persisted analysis record.
- **FR-002**: System MUST compute `gap = required_level - verified_level` for every competency required
  by the target role.
- **FR-003**: System MUST include in the result only competencies where `gap > 0`; competencies the
  candidate already meets or exceeds MUST NOT appear as gaps.
- **FR-004**: System MUST rank returned gaps by gap magnitude, role priority, and dependency/prerequisite
  importance, with the highest-value gaps returned first.
- **FR-005**: System MUST expose `GET /analysis/{id}/gaps` returning the persisted, ranked gap list for a
  given analysis.
- **FR-006**: System MUST return a clearly empty (not erroring) result when the candidate has no gaps for
  the selected role.
- **FR-007**: System MUST source `required_level` only from the role's curated requirements (Task 1/5) and
  `verified_level` only from Task 7's scoring output — never inventing or estimating either value itself.

### Key Entities

- **Analysis** *(Task 2's `analyses` table)*: ties a candidate + role + session to a gap-analysis run.
- **Skill Gap** *(Task 2's `skill_gaps` table)*: competency, required level, verified level, gap, rank.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: For any candidate/role pair, the computed gap for every competency equals exactly
  `required_level - verified_level`, with zero arithmetic discrepancies.
- **SC-002**: A gap analysis for a role with 5–10 required competencies completes and returns a ranked
  result in under 1 second (pure computation, no external calls).
- **SC-003**: 100% of candidates whose verified levels meet every requirement receive an explicit "no
  gaps" result rather than an empty/ambiguous response.

## Assumptions

- `POST /analysis` implicitly uses the candidate's most recently completed (or, if none, most recent
  in-progress) assessment session for that role; multiple simultaneous analyses per candidate/role pair
  are not a concern at the MVP's single-session demo scale.
- Dependency/prerequisite importance (used as a ranking tiebreaker per FR-004) is derived from the
  competency hierarchy already present in `competencies.json` (parent/child relationships) — no separate
  prerequisite graph is introduced.
