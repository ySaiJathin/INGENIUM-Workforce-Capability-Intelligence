---
description: "Task list for Phase 4 — Competency Intelligence"
---

# Tasks: Phase 4 — Competency Intelligence

**Input**: Design documents from `/specs/024-phase-4-competency-intelligence/`

**Prerequisites**: plan.md, spec.md, quickstart.md.

**Tests**: Explicitly included — spec.md's SC-002 (determinism) needs a real repeated-run test.

**Organization**: US1 = explainable gap analysis, US2 = priority uses only real signals — per
spec.md.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

- [ ] T001 Confirm Phase 3 is complete (assessment produces verified scores this phase's gap computation reads)

---

## Phase 2: Foundational

- [ ] T002 Create `backend/tests/test_gap_engine.py` if it doesn't already exist, with fixtures for a small set of `RoleCompetency`/`VerifiedSkillScore` rows covering: a competency the candidate exceeds, one they exactly meet, one they fall short of, and one they were never assessed on

**Checkpoint**: Test fixtures ready.

---

## Phase 3: User Story 1 - An explainable, prioritized gap analysis (Priority: P1) 🎯 MVP

**Goal**: Confirm `gap_engine.py`'s `compute_and_persist_gaps()`/`rank_gaps()` satisfy every
acceptance scenario, fixing only if a real gap is found.

**Independent Test**: Run gap analysis on a completed assessment; confirm every gap shows all four
fields and the computation is deterministic.

### Tests for User Story 1

- [ ] T003 [P] [US1] Test in `backend/tests/test_gap_engine.py`: a competency the candidate meets/exceeds does not appear in `rank_gaps()`'s output
- [ ] T004 [P] [US1] Test in `backend/tests/test_gap_engine.py`: a competency the candidate was never assessed on (no `VerifiedSkillScore` row) still appears with `verified_level=0.0` (FR-004)
- [ ] T005 [US1] Test in `backend/tests/test_gap_engine.py`: calling `rank_gaps()` twice with identical input produces byte-identical output, including tie-break order (SC-002)

### Implementation for User Story 1

- [ ] T006 [US1] Run T003-T005; if any fail, fix `backend/src/services/gap_engine.py`'s `compute_and_persist_gaps()`/`rank_gaps()` accordingly (no failure expected per this session's audit)
- [ ] T007 [US1] Live-test: `POST /analysis` + `GET /analysis/{id}/gaps` for the demo candidate against `role-sso-01`; confirm every gap in the response shows `required_level`, `verified_level`, `gap`, and `rank` together (FR-003)

**Checkpoint**: User Story 1 verified — gap analysis is complete, explainable, and deterministic.

---

## Phase 4: User Story 2 - Priority ranking uses only real, currently-available signals (Priority: P2)

**Goal**: Confirm zero references to the retired third-party jobs-demand dataset in the ranking
formula.

### Implementation for User Story 2

- [ ] T008 [US2] Run `grep -rn "kaggle\|job_posting\|job_demand" backend/src/services/gap_engine.py backend/src/models/` and confirm zero matches (SC-003)
- [ ] T009 [US2] Test in `backend/tests/test_gap_engine.py`: two gaps with identical magnitude but different `RoleCompetency.priority` values rank the higher-priority one first
- [ ] T010 [US2] Document, in this feature's spec.md or a code comment in `gap_engine.py`, that `priority` inputs are limited to gap magnitude + role-declared `RoleCompetency.priority` (research.md §6's decision — no new demand source introduced)

**Checkpoint**: Both user stories verified — Phase 4 complete.

---

## Phase 5: Polish & Cross-Cutting

- [ ] T011 Run `specs/024-phase-4-competency-intelligence/quickstart.md` end to end and record actual output

---

## Dependencies & Execution Order

- **Setup → Foundational**: fixtures before tests.
- **User Story 1 (Phase 3)** and **User Story 2 (Phase 4)**: independent of each other, can run in
  parallel (different aspects of the same file, non-overlapping test cases).
- **Polish**: depends on both.

## Implementation Strategy

Given this session's audit already confirmed `gap_engine.py` correct, expect T006/T009 to require
zero code changes — this phase is primarily test-writing to lock in that confirmed-correct
behavior against future regression.
