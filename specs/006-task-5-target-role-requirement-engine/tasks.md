---
description: "Task list for Task 5 — Target Role & Requirement Engine"
---

# Tasks: Task 5 — Target Role & Requirement Engine

**Input**: Design documents from `/specs/006-task-5-target-role-requirement-engine/`
**Prerequisites**: plan.md (required), spec.md (required), contracts/api.md

**Tests**: Not explicitly requested; the contract's own `curl` quickstart serves as verification.

**Organization**: Single user story (P1).

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup (Shared Infrastructure)

*(None — reuses Task 4's existing `backend/src/api/candidates.py` router and Task 3's role-detail
query shape; no new package/dependency needed.)*

## Phase 2: Foundational (Blocking Prerequisites)

*(None — this phase only needs Task 2's `candidates`/`roles`/`role_competencies` tables and Task 3's
already-built role-detail query pattern, both already in place.)*

## Phase 3: User Story 1 - Attach a Candidate to a Target Role and See Its Requirements (Priority: P1) 🎯 MVP

**Goal**: `POST /candidates/{candidate_id}/target-role` persists the candidate's role selection and
returns that role's requirements, all-or-nothing on any invalid id.

**Independent Test**: Create a candidate (Task 4 or demo), `POST` a valid role id, confirm the response
matches `GET /roles/{id}` and `candidates.target_role_id` was actually updated in the DB.

### Implementation for User Story 1

- [X] T001 [US1] Add `TargetRoleSelectionRequest` (`role_id: str`) and `TargetRoleSelectionResponse`
      (`candidate_id`, `role: RoleDetail`) to `backend/src/schemas/candidates.py`, reusing Task 3's
      existing `RoleDetail`/`RequiredCompetency` schemas rather than redefining the role shape (FR-004,
      Key Entities: "reuses the same shape as Task 3's `GET /roles/{id}` response")
- [X] T002 [US1] Implement `POST /candidates/{candidate_id}/target-role` in
      `backend/src/api/candidates.py`: look up the `Candidate` (404 `"Candidate '<id>' not found"` if
      missing, FR-005), look up the `Role` (404 `"Role '<id>' not found"` if missing, FR-005) — both
      lookups before any write, so an invalid id never partially updates the record (FR-005/SC-003) —
      then set `candidate.target_role_id = role_id` and commit (FR-002, replacing any prior selection);
      build the `required_competencies` list the same way Task 3's `GET /roles/{id}` does (FR-003/FR-006:
      an empty list for a role with no curated requirements is a valid response, not an error)
- [X] T003 [US1] Run the `contracts/api.md` quickstart: create a candidate, `POST` a valid role id,
      confirm the response's `required_competencies` matches `GET /roles/{id}` exactly, confirm
      `candidates.target_role_id` was updated in the DB, confirm re-selecting a different role overwrites
      it (FR-002/SC-001), and confirm both 404 cases leave the candidate record untouched (SC-003)

**Checkpoint**: Task 5 is complete — candidates can now be linked to a target role with requirements
returned, ready for Task 6's assessment engine to read `target_role_id` and `role_competencies` from.

---

## Dependencies & Execution Order

- T001 (schemas) before T002 (endpoint uses them).
- T002 before T003 (verification needs the live endpoint).
- No parallel opportunities — three sequential steps in one small router extension.

## Implementation Strategy

### MVP (this phase's only scope)

1. Complete Phase 3 sequentially: schemas (T001) → endpoint (T002) → verification (T003).
2. **STOP and VALIDATE**: T003's quickstart run, including both 404 cases and the re-selection case, is
   this phase's pass/fail signal — Task 6 should not begin reading `target_role_id` until confirmed.

## Notes

- No Mistral involvement in this phase at all (FR-003/SC-002) — entirely reused, already-verified
  Task 2/3 data and query patterns, so this is the fastest phase to implement and verify in the whole
  backend sequence.
- Added to the existing `candidates.py` router (Task 4) rather than a new file, per this feature's own
  plan.md Structure Decision — role selection is a candidate-lifecycle action, not a distinct resource.
