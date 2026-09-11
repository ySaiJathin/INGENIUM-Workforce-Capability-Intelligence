---
description: "Task list for Task 7 — Deterministic Scoring Engine"
---

# Tasks: Task 7 — Deterministic Scoring Engine

**Input**: Design documents from `/specs/008-task-7-deterministic-scoring-engine/`
**Prerequisites**: plan.md, spec.md, research.md, contracts/api.md

**Tests**: Not explicitly requested; a standalone script exercising the pure scoring function across
every evidence combination (resume-only, assessment-only, both, reproducibility) serves as verification,
per plan.md's emphasis on `scoring_engine.py` being independently testable (Rule 9).

**Organization**: Single user story (P1).

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup (Shared Infrastructure)

*(None — this phase adds one pure function and extends one existing endpoint; no new package needed.)*

## Phase 2: Foundational (Blocking Prerequisites)

*(None — reuses Task 2's `verified_skill_scores` table and Task 6's `SkillEvidence`/`CandidateSkill`
models, all already in place.)*

## Phase 3: User Story 1 - See My Verified Competency Score, Not Just a Resume Guess (Priority: P1) 🎯 MVP

**Goal**: `GET /assessment/{session_id}/profile` (extended, no new endpoint) returns a `verified_profile`
list blending resume and assessment evidence, assessment weighted more heavily, fully reproducible,
persisted to `verified_skill_scores`.

**Independent Test**: Call the pure scoring function directly with resume-only, assessment-only, both,
and identical-inputs-twice cases and confirm each matches research.md §1-§3's formula exactly.

### Implementation for User Story 1

- [X] T001 [US1] Add `VerifiedProfileItem` schema to `backend/src/schemas/assessment.py`
      (`competency_id`, `competency_name`, `resume_estimated_level`, `resume_confidence`,
      `verified_level`, `verified_confidence` — matching `contracts/api.md` exactly) and add
      `verified_profile: list[VerifiedProfileItem]` to the existing `ProfileResponse` schema
      (extends, per the contract's "no new endpoint" note)
- [X] T002 [US1] Create `backend/src/services/scoring_engine.py`: pure function
      `compute_verified_score(resume_estimated_level, resume_confidence, questions_answered,
      correct_count, avg_difficulty, proficiency_scale_max) -> (verified_level, verified_confidence)`
      implementing research.md §1's formula (`ASSESSMENT_WEIGHT=0.7`/`RESUME_WEIGHT=0.3` when both
      present, `ASSESSMENT_WEIGHT=1.0` when assessment-only per §2) and §2's resume-only special case
      (`verified_level = resume_estimated_level`, `verified_confidence = resume_confidence * 0.6`) and
      §3's confidence formula — no database/HTTP dependency, so it stays unit-testable in isolation
      (FR-002/FR-003/FR-004/FR-005/FR-006)
- [X] T003 [US1] Extend `GET /assessment/{session_id}/profile` in `backend/src/api/assessment.py`:
      for every competency with `SkillEvidence` and/or `CandidateSkill` evidence for this session's
      candidate, call `compute_verified_score()`, persist a `VerifiedSkillScore` row (upsert, since
      re-requesting the same profile must not create duplicates), and include it in the response's new
      `verified_profile` field — competencies with neither kind of evidence are omitted entirely
      (spec Edge Cases), never appearing as a zero/null entry (FR-001/FR-007/FR-008)
- [X] T004 [US1] Verify: run `compute_verified_score()` directly for resume-only, assessment-only, and
      both-present cases and confirm each matches research.md's formula; run it twice on identical
      inputs and confirm byte-identical output (FR-004/SC-002); then run the `contracts/api.md`
      quickstart against a live completed session and confirm `verified_level`/`verified_confidence`
      appear alongside `resume_estimated_level`/`resume_confidence` in the response, computed in under
      1 second (SC-003)

**Checkpoint**: Task 7 is complete — verified scores are computed, persisted, and exposed as the
resume-vs-verified pair the product's core demo moment depends on, ready for Task 8's gap engine to
consume `verified_level` against each role's `required_level`.

---

## Dependencies & Execution Order

- T001 (schema) before T003 (endpoint uses it); independent of T002.
- T002 (pure function) before T003 (endpoint calls it); independent of T001.
- T003 depends on both T001 and T002.
- T004 depends on T003 (needs the live endpoint) but its pure-function checks only depend on T002.

## Implementation Strategy

### MVP (this phase's only scope)

1. Complete Phase 3: schema (T001) ∥ scoring function (T002) → endpoint extension (T003) →
   verification (T004).
2. **STOP and VALIDATE**: T004's formula checks (all evidence combinations + reproducibility) plus the
   live quickstart run are this phase's pass/fail signal.

## Notes

- No Mistral involvement in this phase at all (FR-002) — pure computation, should be the fastest phase
  to implement and verify since Task 5.
- `verified_skill_scores` upserts are keyed on (candidate_id, competency_id, session_id) — Task 2's
  composite primary key — so re-fetching the same session's profile recomputes and overwrites rather
  than accumulating duplicate rows.
