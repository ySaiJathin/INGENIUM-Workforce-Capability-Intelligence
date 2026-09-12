# Implementation Plan: Phase 5 — Course Intelligence

**Branch**: `025-phase-5-course-intelligence` | **Date**: 2026-09-12 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/025-phase-5-course-intelligence/spec.md`

## Summary

Confirm the existing `backend/src/services/course_recommendation_engine.py` (deterministic
competency-overlap matcher + MiniLM semantic fallback, verified correct by this session's live
audit) satisfies the exact-before-semantic ordering guarantee (FR-004) and the one-recommendation-
per-course grouping (FR-005) under targeted test scenarios the audit didn't explicitly construct.

## Technical Context

**Language/Version**: Python 3.12. **Primary Dependencies**: none new — reuses existing
`sentence-transformers`. **Storage**: PostgreSQL, unchanged. **Testing**: `pytest` for
`deterministic_overlap()` and `semantic_fallback()` in isolation, plus a constructed scenario
(a gap with both an exact-tagged and a merely-similar course present) proving FR-004's ordering.
**Target Platform**: unchanged. **Project Type**: no new package. **Performance Goals**: unchanged.
**Constraints**: Rule 3 — expect zero functional changes unless the targeted scenario test finds a
real gap. **Scale/Scope**: one existing file, confirmation only.

## Constitution Check

No project constitution ratified. Operative constraint: `CLAUDE.md` Rule 6 (deterministic
authority — course ranking never delegated to the language model), already satisfied by the
existing implementation per this session's audit. No violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/025-phase-5-course-intelligence/
├── plan.md              # This file
├── quickstart.md         # This command's output
└── tasks.md              # /speckit-tasks output (not created by this command)
```

### Source Code (repository root)

```text
backend/
├── src/services/course_recommendation_engine.py   # existing — confirm only; fix only if the
│                                                      exact-vs-semantic ordering test finds a
│                                                      real defect (none expected per audit)
└── tests/
    └── test_course_recommendation_engine.py         # NEW (if not already present) — the
                                                         exact-beats-semantic scenario (FR-004),
                                                         one-course-multiple-gaps grouping
                                                         (FR-005), and semantic-failure-treated-
                                                         as-unmatched (FR-006)
```

**Structure Decision**: No new files beyond a focused unit-test addition, matching the master
document's own framing ("Task 9 — course_recommendation_engine.py already exists").

## Complexity Tracking

None.
