---
description: "Task list for Task 10 — Learning Path"
---

# Tasks: Task 10 — Learning Path

**Input**: Design documents from `/specs/011-task-10-learning-path/`
**Prerequisites**: plan.md, spec.md, research.md, contracts/api.md

**Tests**: Not explicitly requested; `contracts/api.md`'s quickstart (prerequisite ordering, repeat-fetch
identity, no-gap case) serves as verification.

**Organization**: Single user story (P1). This is the last backend engine — Phases 11+ (frontend) begin
only once this is API-verified (Rule 11).

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup (Shared Infrastructure)

*(None — reuses Task 2's `learning_paths`/`learning_path_steps` tables, Task 8's ranked `skill_gaps`,
and Task 9's course-matching logic, all already in place.)*

## Phase 2: Foundational (Blocking Prerequisites)

*(None.)*

## Phase 3: User Story 1 - Get One Clear, Ordered Plan to Close My Gaps (Priority: P1) 🎯 MVP

**Goal**: `POST /learning-path` assembles Task 8's ranked gaps and Task 9's course matches into one
ordered, persisted sequence, prerequisites before dependents, with an explicit "no further learning
required" state and unmatched gaps always surfaced — the final backend phase before frontend work
begins.

**Independent Test**: Given known ranked gaps and course matches including a prerequisite/dependent
pair, confirm the resulting order places the prerequisite's step first.

### Implementation for User Story 1

- [X] T001 [US1] Create `backend/src/schemas/learning_path.py`: `LearningPathRequest`
      (`analysis_id`), `LearningPathStepItem` (`step_number`, `course_id`, `title`, `addresses_gaps`,
      `rationale`), `LearningPathResponse` (`learning_path_id`, `analysis_id`, `steps`,
      `gaps_without_courses`, `message` optional) — matching `contracts/api.md` exactly
- [X] T002 [US1] Create `backend/src/services/learning_path_engine.py`: `order_steps()` — pure
      function taking course-recommendation groups (each with `matched_gaps` and the earliest/best
      Task 8 rank among them) and the competency hierarchy, implementing research.md §1: start from
      rank order, then topologically promote a step to before any step addressing a competency that is
      one of its addressed competencies' children (Kahn's algorithm, original rank order used to break
      ties so the result stays stable and reproducible) — no database dependency (Rule 9)
- [X] T003 [US1] Add `build_learning_path()` to the engine: call Task 9's
      `course_recommendation_engine.match_courses_for_analysis()` to get fresh recommendations +
      `unmatched_gaps` for the analysis, run `order_steps()`, persist a new `LearningPath` row and its
      `LearningPathStep` rows (FR-001/FR-002/FR-003/FR-005); if there are no gaps at all, return the
      explicit "no further learning required" shape instead (FR-004); `gaps_without_courses` in the
      response is Task 9's `unmatched_gaps` passed through unchanged (FR-007)
- [X] T004 [US1] Add `generate_rationale()` to `backend/src/services/mistral_client.py`: one batched
      call listing every step, asking for a short "why this step, why now" explanation per
      `step_number` (Rule 13 — one call for the whole path, not one per step); on any failure, log and
      return an empty mapping (no retry — this call is optional/best-effort per research.md §3, not
      part of the retry-then-fallback discipline the required-evidence operations use) — `rationale`
      stays `null` for every step when this returns nothing (FR-006)
- [X] T005 [US1] Create `backend/src/api/learning_path.py`: `POST /learning-path` (calls
      `build_learning_path()`, 201) and `GET /learning-path/{id}` (reads the persisted `LearningPath`/
      `LearningPathStep` rows back, never recomputes, FR-005/SC-003), register the router in
      `backend/src/main.py`
- [X] T006 [US1] Run `contracts/api.md`'s quickstart against a live analysis with a known prerequisite/
      dependent competency pair present in the gaps: confirm the prerequisite's step comes first
      (SC-002), confirm `GET /learning-path/{id}` called twice returns identical `steps` (SC-003), and
      confirm a no-gap analysis returns the explicit "no further learning required" message (FR-004)

**Checkpoint**: Task 10 is complete — the entire backend engine chain (Tasks 3–10) is now API-verified,
satisfying Rule 11's gate for Task 11 (Frontend Foundation) to begin.

---

## Dependencies & Execution Order

- T001 (schemas) before T005 (endpoint uses them); independent of T002-T004.
- T002 (pure ordering) before T003 (uses it).
- T004 is independent of T002/T003 but its result is consumed inside T003's persistence step.
- T003 depends on T002 and (optionally) T004.
- T005 depends on T001 and T003.
- T006 depends on T005 (needs the live endpoints).

## Implementation Strategy

### MVP (this phase's only scope)

1. Complete Phase 3 in order: schemas (T001) → ordering function (T002) → path assembly/persistence
   (T003) → optional Mistral rationale (T004) → API layer (T005) → verification (T006).
2. **STOP and VALIDATE**: T006's quickstart run (prerequisite ordering + repeat-fetch identity +
   no-gap case) is this phase's pass/fail signal — and the signal for the whole backend being ready for
   Task 11.

## Notes

- Given the currently-configured Mistral API key has 0 req/min quota (discovered during Task 4), the
  rationale call in live testing is expected to fail and leave every step's `rationale: null` — this is
  the correct, designed degradation (FR-006/research.md §3), not a bug: ordering must stay fully intact
  and correct regardless of whether the optional rationale text is present.
- This is the last backend phase. Once T006 passes, Tasks 3–10's entire chain is confirmed
  `curl`-verifiable with real data, which is the explicit precondition `total_buildplan.md` §25 and
  Rule 11 set for starting Task 11 (Frontend Foundation).
