---
description: "Task list for Phase 5 — Course Intelligence"
---

# Tasks: Phase 5 — Course Intelligence

**Input**: Design documents from `/specs/025-phase-5-course-intelligence/`

**Prerequisites**: plan.md, spec.md, quickstart.md. Depends on Phase 4's gap analysis.

**Tests**: Explicitly included — spec.md's FR-004 (exact-beats-semantic ordering) needs a
constructed scenario test.

**Organization**: US1 = explainable recommendations, US2 = semantic match only as last resort —
per spec.md.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

- [ ] T001 Confirm Phase 4 is complete (gap analysis produces the `SkillGap` rows this phase's matcher reads)

---

## Phase 2: Foundational

- [ ] T002 Create `backend/tests/test_course_recommendation_engine.py` if it doesn't already exist, with fixtures for: a gap with an exact-tagged course, a gap with only a semantically-similar course, a gap with no course at all, and a course tagged to multiple gaps

**Checkpoint**: Test fixtures ready.

---

## Phase 3: User Story 1 - Explainable course recommendations for each gap (Priority: P1) 🎯 MVP

**Goal**: Confirm every recommendation states which gap(s) it closes and why, ranked
deterministically.

### Tests for User Story 1

- [ ] T003 [P] [US1] Test in `backend/tests/test_course_recommendation_engine.py`: `match_courses_for_analysis()` returns a `match_reason` string naming the matched competency for every recommendation
- [ ] T004 [P] [US1] Test in `backend/tests/test_course_recommendation_engine.py`: calling `match_courses_for_analysis()` twice on identical gap/catalogue data returns identical rankings (SC-002)
- [ ] T005 [US1] Test in `backend/tests/test_course_recommendation_engine.py`: a gap with no matching course (exact or semantic) appears in `unmatched_gaps`, not paired with an unrelated course (FR-003)

### Implementation for User Story 1

- [ ] T006 [US1] Run T003-T005; fix `backend/src/services/course_recommendation_engine.py` only if a real gap is found (none expected per this session's audit)
- [ ] T007 [US1] Live-test: `GET /analysis/{id}/courses` for the demo candidate; confirm every recommendation has `matched_gaps` + `match_reason` populated (SC-001)

**Checkpoint**: User Story 1 verified.

---

## Phase 4: User Story 2 - Semantic matching only fills gaps the exact match missed (Priority: P2)

**Goal**: Confirm the exact-match-first ordering guarantee (FR-004) and one-course-multiple-gaps
grouping (FR-005).

### Tests for User Story 2

- [ ] T008 [US2] Test in `backend/tests/test_course_recommendation_engine.py`: for a gap with both an exact-tagged course and a merely-similar course present, `deterministic_overlap()`'s result is used (not `semantic_fallback()`'s) — confirm via `match_courses_for_analysis()`'s output `match_score` being `None` (exact match marker per current code) rather than a similarity float
- [ ] T009 [US2] Test in `backend/tests/test_course_recommendation_engine.py`: a course addressing two gaps in the same analysis appears exactly once in the recommendations list, with both gaps in `matched_gaps` (SC-004)
- [ ] T010 [US2] Test in `backend/tests/test_course_recommendation_engine.py`: forcing `semantic_fallback()` to raise is caught and treated as "no match" for that gap, never propagated as a request-level error (FR-006)

### Implementation for User Story 2

- [ ] T011 [US2] Run T008-T010; fix `backend/src/services/course_recommendation_engine.py` only if a real gap is found (none expected per this session's audit)

**Checkpoint**: Both user stories verified — Phase 5 complete.

---

## Phase 5: Polish & Cross-Cutting

- [ ] T012 Run `specs/025-phase-5-course-intelligence/quickstart.md` end to end and record actual output

---

## Dependencies & Execution Order

- **Setup → Foundational**: fixtures before tests.
- **User Story 1 (Phase 3)** and **User Story 2 (Phase 4)**: User Story 2's tests build on the
  same fixtures but exercise a different code path (`semantic_fallback`) — can run in parallel with
  User Story 1's tests.
- **Polish**: depends on both.

## Implementation Strategy

Given this session's audit already confirmed `course_recommendation_engine.py` correct, expect
T006/T011 to require zero code changes — this phase locks in that confirmed-correct behavior
against future regression via the new test file.
