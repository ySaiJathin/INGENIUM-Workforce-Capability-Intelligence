# Feature Specification: Task 5 — Target Role & Requirement Engine

**Feature Branch**: `006-task-5-target-role-requirement-engine`

**Created**: 2026-09-11

**Status**: Draft

**Input**: Task 5 from `total_buildplan.md` §24: "Select role → load required competencies from curated
data/DB (never from Mistral) → return requirements."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Attach a Candidate to a Target Role and See Its Requirements (Priority: P1)

Having received an initial competency profile (from resume upload or demo candidate), the candidate picks
one target role from the curated list. The system records that choice against the candidate and returns
the role's required competencies and proficiency levels, ready to drive assessment question selection
(Task 6) and gap analysis (Task 8).

**Why this priority**: This is the pivot point of the golden path between "who am I" (profile) and "what
do I need to become" (requirements) — without it, neither the assessment nor the gap analysis has a
target to work against.

**Independent Test**: Can be fully tested by taking a candidate id already created by Task 4 (or a demo
candidate), selecting a role id from `GET /roles`, and confirming the requirement response matches exactly
what `GET /roles/{id}` already returns — with the addition that the candidate record is now linked to
that role.

**Acceptance Scenarios**:

1. **Given** a candidate id from a completed resume upload or demo candidate, **When** the candidate
   selects a valid target role id, **Then** the system persists that role selection against the candidate
   and returns the role's required competencies with proficiency levels.
2. **Given** an invalid or unknown role id, **When** selection is attempted, **Then** the system returns a
   clear error and does not modify the candidate record.
3. **Given** a candidate who already selected a role, **When** they select a different role, **Then** the
   system updates the candidate's target role rather than creating a conflicting second selection.
4. **Given** a candidate with no initial profile (an invalid/unknown candidate id), **When** role
   selection is attempted, **Then** the system returns a clear "candidate not found" error.

### Edge Cases

- What happens when a role has zero required competencies defined (a curation gap)? → The system returns
  an empty requirements list rather than an error, and this must not later crash the assessment engine
  (Task 6) — it should simply have nothing to assess for that role.
- What happens if the requirement data changes (curated data updated) after a candidate has already
  selected a role but before they finish the assessment? → Out of scope for the MVP; requirements are
  read fresh at selection time and are not expected to change mid-session in a single demo run.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow a candidate (identified by an existing candidate id) to select one target
  role from the curated role list.
- **FR-002**: System MUST persist the candidate's selected target role, replacing any prior selection for
  that candidate.
- **FR-003**: System MUST load required competencies and proficiency levels for the selected role
  exclusively from the curated/database data seeded in Tasks 1–2 — never generated or altered by Mistral.
- **FR-004**: System MUST return the role's required competencies with their proficiency levels and
  priority in the response.
- **FR-005**: System MUST return a clear error when the given role id or candidate id does not exist,
  without partially modifying any record.
- **FR-006**: System MUST return an empty (not erroring) requirements list for a role that has no curated
  requirements defined.

### Key Entities

- **Target Role Selection**: the link between a `Candidate` (Task 2/4) and a `Role`
  (`candidates.target_role_id`, already part of Task 2's schema) — this phase is what actually writes it.
- **Role Requirements (API view)**: reuses the same shape as Task 3's `GET /roles/{id}` response.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A candidate's target role selection and the resulting requirements are available in under
  1 second (pure DB read/write, no Mistral call involved).
- **SC-002**: 100% of role-requirement data returned by this phase is traceable to the curated
  `roles.json`/`role_competencies` data — zero requirements ever originate from an LLM call.
- **SC-003**: Selecting an invalid role id or candidate id never partially updates the candidate record —
  the operation is all-or-nothing.

## Assumptions

- This phase can be built in parallel with Task 4 once Task 3 exists, since it only needs an existing
  candidate id (from either path) and a role id — it does not depend on resume-extraction logic itself
  (`total_buildplan.md` §25).
- Role selection endpoint is exposed as its own step (e.g. `PATCH`/`POST` on the candidate) rather than
  bundled into the resume-upload response, so "Try Demo Candidate" and resume-upload candidates go
  through the identical role-selection step (supports the golden-path parity requirement in the overall
  MVP spec).
