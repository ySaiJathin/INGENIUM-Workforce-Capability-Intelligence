---
description: "Task list for Task 9 — Course Recommendation Engine"
---

# Tasks: Task 9 — Course Recommendation Engine

**Input**: Design documents from `/specs/010-task-9-course-recommendation-engine/`
**Prerequisites**: plan.md, spec.md, research.md, contracts/api.md

**Tests**: Not explicitly requested; `contracts/api.md`'s quickstart (including the forced-MiniLM-
failure step) serves as verification.

**Organization**: Single user story (P1).

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup (Shared Infrastructure)

*(None — reuses Task 2's `courses`/`course_competencies`/`course_recommendations` tables and Task 8's
`skill_gaps`, all already in place; MiniLM is already downloaded per Task 0.)*

## Phase 2: Foundational (Blocking Prerequisites)

*(None.)*

## Phase 3: User Story 1 - Get Courses That Actually Close My Gaps, With a Reason Why (Priority: P1) 🎯 MVP

**Goal**: `GET /analysis/{id}/courses` matches every ranked gap to covering courses (deterministic
overlap first, MiniLM broadening for near-misses), combines multi-gap matches into one recommendation
per course, and never fails outright if MiniLM is unavailable.

**Independent Test**: Cross-check every returned recommendation's `matched_gaps` against
`course_competencies`, and confirm any gap with zero covering courses appears in `unmatched_gaps`.

### Implementation for User Story 1

- [X] T001 [US1] Add `CourseRecommendationItem` (`course_id`, `title`, `matched_gaps`, `match_reason`,
      `match_score`) and `CoursesResponse` (`analysis_id`, `recommendations`, `unmatched_gaps`) to
      `backend/src/schemas/analysis.py` — matching `contracts/api.md` exactly
- [X] T002 [US1] Create `backend/src/services/course_recommendation_engine.py`: lazily compute and
      cache a MiniLM embedding per course (title + description) at first use, module-level (Rule 13 —
      compute once, reuse across requests, not per request)
- [X] T003 [US1] Add `deterministic_overlap()` to the engine: for a gap's competency id, find every
      course whose `course_competencies` includes it, score = `sum(coverage_weight) * (1/course.priority)`
      (research.md §1), sorted descending (FR-002)
- [X] T004 [US1] Add `semantic_fallback()` to the engine: for a gap with zero deterministic matches,
      embed the gap's competency name/description, cosine-similarity against the cached course
      embeddings, return candidates above a similarity threshold — wrapped so any failure (model load,
      computation error) is logged and treated as "no semantic candidates" rather than raised
      (FR-003/FR-005, research.md §2/§3)
- [X] T005 [US1] Add `match_courses_for_analysis()` to the engine: for each ranked gap (Task 8 order),
      run deterministic overlap, then semantic fallback only if deterministic found nothing; persist one
      `CourseRecommendation` row per (gap, course) match (Task 2's actual composite-PK schema); gaps
      with zero matches (both deterministic and semantic) go to `unmatched_gaps` (FR-006); group the
      persisted rows by course for the API response, combining `matched_gaps`/`match_reason` per course
      so a multi-gap course appears once (FR-008, research.md §4) — explanation text built from the
      actual overlapping competency names (`"Covers: ✓ Name1  ✓ Name2"`, FR-004/SC-002)
- [X] T006 [US1] Create `GET /analysis/{id}/courses` in `backend/src/api/analysis.py`, register nothing
      new (reuses the existing `analysis` router)
- [X] T007 [US1] Run `contracts/api.md`'s quickstart against a live analysis with known gaps: confirm
      every `matched_gaps` entry genuinely overlaps `course_competencies`, confirm an uncovered gap
      appears in `unmatched_gaps`, then force the MiniLM step to fail and confirm the response still
      returns deterministic matches with HTTP 200 (SC-001/SC-002/SC-004)

**Checkpoint**: Task 9 is complete — explainable course recommendations are live, ready for Task 10's
learning path to sequence.

---

## Dependencies & Execution Order

- T001 (schemas) before T006 (endpoint uses them); independent of T002-T005.
- T002 (embedding cache) before T004 (semantic fallback needs it).
- T003 before T005 (deterministic pass runs first per gap).
- T004 before T005 (semantic pass is the fallback within the same per-gap loop).
- T005 depends on T003 and T004.
- T006 depends on T001 and T005.
- T007 depends on T006 (needs the live endpoint).

## Implementation Strategy

### MVP (this phase's only scope)

1. Complete Phase 3 in order: schemas (T001) → embedding cache (T002) → deterministic matching (T003) →
   semantic fallback (T004) → combined matching/persistence (T005) → API layer (T006) →
   verification (T007).
2. **STOP and VALIDATE**: T007's quickstart run, including the forced-MiniLM-failure step, is this
   phase's pass/fail signal.

## Notes

- No Mistral involvement in this phase (FR-007) — deterministic-first, optional MiniLM broadening only.
- Task 2's `course_recommendations` table is naturally one row per (gap, course) pair (its composite PK
  includes `gap_id`); FR-008's "one recommendation per course" requirement is a response-shaping
  decision at the API layer, not a change to how rows are persisted.
