# Implementation Plan: Task 9 — Course Recommendation Engine

**Branch**: `010-task-9-course-recommendation-engine` | **Date**: 2026-09-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/010-task-9-course-recommendation-engine/spec.md`

## Summary

Implement `GET /analysis/{id}/courses`: match each ranked gap (Task 8) to courses via deterministic
competency-overlap first, optionally re-ranked/broadened with MiniLM cosine similarity, always producing
a human-readable "covers ✓ X ✓ Y" explanation, with a full deterministic-only fallback if semantic
matching is unavailable. Feeds Task 10's learning path directly.

## Technical Context

**Language/Version**: Python 3.11+, FastAPI, `sentence-transformers` (`all-MiniLM-L6-v2`).

**Primary Dependencies**: The already-downloaded MiniLM model (Rule 7/8 — used as-is, no training);
Task 8's `gap_engine.py` output as input.

**Storage**: PostgreSQL — reads `course_competencies`/`courses`, writes `course_recommendations`
(Task 2's schema).

**Testing**: Unit tests for deterministic-overlap matching (pure, given a gap list and course catalogue);
a test forcing the MiniLM path unavailable to confirm the deterministic-only fallback still produces
correct results; a test confirming a course covering multiple gaps appears once with a combined
explanation (FR-008).

**Target Platform**: Backend FastAPI service.

**Project Type**: Backend web service (`backend/src/api/analysis.py` extended,
`backend/src/services/recommendation_engine.py`).

**Performance Goals**: Under 2 seconds per spec SC-003, including any embedding computation, at the
30–50 course catalogue scale.

**Constraints**: No FAISS (Assumptions); matching/ranking never delegated to Mistral (FR-007); semantic
similarity never overrides an exact deterministic match (FR-003).

**Scale/Scope**: 30–50 courses, a handful of gaps per analysis — in-memory cosine similarity is
sufficient, no vector database needed.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` is unfilled boilerplate; `CLAUDE.md` is the binding rulebook gate.

| Rule | Gate | Status |
|------|------|--------|
| Rule 4 — Mistral boundaries | Matching/ranking fully backend-owned (FR-007) | PASS |
| Rule 7/8 — Existing resources, no training | MiniLM used as-is for optional re-ranking only | PASS |
| Rule 13 — Performance discipline / no FAISS | Plain cosine similarity at 30–50 item scale | PASS |
| Rule 5-adjacent — graceful degradation | Deterministic-only fallback if semantic matching fails | PASS |

No violations — Complexity Tracking table is not needed.

## Project Structure

### Documentation (this feature)

```text
specs/010-task-9-course-recommendation-engine/
├── plan.md              # This file
├── research.md           # Phase 0 output — matching algorithm, embedding caching, fallback strategy
├── contracts/
│   └── api.md             # Phase 1 output — GET /analysis/{id}/courses
└── checklists/
    └── requirements.md
```

`data-model.md` is omitted: this phase only writes to `course_recommendations`, already fully specified
in Task 2's `data-model.md`. `quickstart.md` is folded into `contracts/api.md`.

### Source Code (repository root)

```text
backend/
└── src/
    ├── api/
    │   └── analysis.py               # extended: GET /analysis/{id}/courses
    └── services/
        └── recommendation_engine.py   # match_courses(gaps, courses) -> CourseRecommendation[]
```

**Structure Decision**: `recommendation_engine.py` computes and caches course embeddings once at startup
(static catalogue, per Rule 13's "cache embeddings" instruction) rather than recomputing them per
request; it calls into `competency_mapping.py`'s deterministic-overlap logic (built in Task 4) so overlap
matching is implemented once and reused, not duplicated.

## Complexity Tracking

*No Constitution Check violations — table intentionally left empty.*
