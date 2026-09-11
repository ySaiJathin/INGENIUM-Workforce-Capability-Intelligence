---
description: "Task list for Task 8 — Skill Gap Engine"
---

# Tasks: Task 8 — Skill Gap Engine

**Input**: Design documents from `/specs/009-task-8-skill-gap-engine/`
**Prerequisites**: plan.md, spec.md, research.md, contracts/api.md

**Tests**: Not explicitly requested; `contracts/api.md`'s quickstart plus a direct check of the pure
ranking function serves as verification.

**Organization**: Single user story (P1).

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup (Shared Infrastructure)

*(None — reuses Task 2's `analyses`/`skill_gaps` tables, Task 5's `role_competencies`, and Task 7's
`verified_skill_scores`, all already in place.)*

## Phase 2: Foundational (Blocking Prerequisites)

*(None.)*

## Phase 3: User Story 1 - See Exactly Which Competencies Fall Short of the Role (Priority: P1) 🎯 MVP

**Goal**: `POST /analysis` + `GET /analysis/{id}/gaps` compute `gap = required_level - verified_level`
for every role-required competency, ranked by gap magnitude/priority/hierarchy, persisted, with an
explicit empty result when there are no gaps.

**Independent Test**: Given a known verified profile and role requirements, confirm each gap equals
`required_level - verified_level` exactly and the ranking order matches research.md §1.

### Implementation for User Story 1

- [X] T001 [US1] Create `backend/src/schemas/analysis.py`: `AnalysisRequest`
      (`candidate_id`, `target_role_id`), `AnalysisResponse` (`analysis_id`, `candidate_id`,
      `target_role_id`), `SkillGapItem` (`competency_id`, `competency_name`, `required_level`,
      `verified_level`, `gap`, `rank`), `GapsResponse` (`analysis_id`, `gaps`) — matching
      `contracts/api.md` exactly
- [X] T002 [US1] Create `backend/src/services/gap_engine.py`: pure function
      `rank_gaps(gap_rows: list[dict], competency_hierarchy: set[str]) -> list[dict]` implementing
      research.md §1's weighted-sum ranking (`gap_magnitude_normalized*0.6 +
      role_priority_normalized*0.3 + prerequisite_importance*0.1`, prerequisite importance = 1.0 if the
      competency has children in the hierarchy else 0.0 per §2, ties broken by competency id per spec
      Edge Cases) — no database dependency, independently testable (Rule 9)
- [X] T003 [US1] Add `create_analysis()` to `gap_engine.py`: find the candidate's most recent
      assessment session for the target role (spec Assumptions — most recent completed, else most
      recent in-progress; 404-worthy error if none exists), persist an `Analysis` row (FR-001)
- [X] T004 [US1] Add `compute_and_persist_gaps()` to `gap_engine.py`: for every `role_competencies` row
      for the analysis's target role, look up `verified_level` from `verified_skill_scores`
      (`candidate_id` + `competency_id` + the analysis's `session_id`), defaulting to `0.0` if no row
      exists (spec Acceptance Scenario 4 — an unassessed, resume-blank competency still appears as a
      full gap, not silently skipped); compute `gap = required_level - verified_level`; keep only
      `gap > 0` (FR-002/FR-003); rank via T002; persist `SkillGap` rows (idempotent — re-fetching the
      same analysis recomputes rather than duplicating); return the ranked list, empty if there are no
      gaps (FR-004/FR-006/SC-003)
- [X] T005 [US1] Create `backend/src/api/analysis.py`: `POST /analysis` (calls `create_analysis()`,
      201) and `GET /analysis/{id}/gaps` (calls `compute_and_persist_gaps()`, 200 with `gaps: []` when
      empty — never an error, FR-005/FR-006), register the router in `backend/src/main.py`
- [X] T006 [US1] Run `contracts/api.md`'s quickstart against a live candidate with a known gap (from
      Task 7's verified test data) and a candidate whose verified levels meet every requirement;
      confirm exact `gap` arithmetic, correct ranking order, and an explicit `"gaps": []` for the
      no-gap case (SC-001/SC-002/SC-003)

**Checkpoint**: Task 8 is complete — ranked skill gaps are computed and persisted, ready for Task 9's
course recommendation engine to match against.

---

## Dependencies & Execution Order

- T001 (schemas) before T005 (endpoint uses them); independent of T002-T004.
- T002 (pure ranking) before T004 (uses it for the final sort).
- T003 before T004 (an analysis must exist before gaps can be computed/persisted against it).
- T005 depends on T001, T003, T004 all existing.
- T006 depends on T005 (needs the live endpoints).

## Implementation Strategy

### MVP (this phase's only scope)

1. Complete Phase 3 in order: schemas (T001) → ranking function (T002) → analysis creation (T003) →
   gap computation/persistence (T004) → API layer (T005) → verification (T006).
2. **STOP and VALIDATE**: T006's quickstart run (both the has-gaps and no-gaps cases) is this phase's
   pass/fail signal.

## Notes

- No Mistral involvement in this phase (FR-007) — pure computation, reusing Task 5/7's already-verified
  data, same fast pattern as Task 7.
- The "no verified_skill_scores row exists" default-to-0.0 behavior (T004) is a deliberate reading of
  spec Acceptance Scenario 4, since Task 7's scoring engine simply omits (never persists) a competency
  with no evidence at all — Task 8 is where that omission becomes a full, visible gap rather than
  silently vanishing from the analysis.
