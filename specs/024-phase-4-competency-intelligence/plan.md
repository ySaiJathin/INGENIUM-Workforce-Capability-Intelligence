# Implementation Plan: Phase 4 — Competency Intelligence

**Branch**: `024-phase-4-competency-intelligence` | **Date**: 2026-09-12 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/024-phase-4-competency-intelligence/spec.md`

## Summary

Confirm the existing `backend/src/services/gap_engine.py` (verified correct and deterministic by
this session's live audit) satisfies FR-002's explicit constraint: priority ranking must never
reintroduce the retired third-party jobs-demand dataset. No code change is expected — this phase is
primarily a targeted code-review + determinism regression test, per `research.md` §6 of the
umbrella spec's already-made decision.

## Technical Context

**Language/Version**: Python 3.12. **Primary Dependencies**: none new. **Storage**: PostgreSQL,
unchanged. **Testing**: `pytest` unit test for `rank_gaps()` (already a pure function, no DB
needed) run twice on identical input to prove determinism (SC-002); a source-level check that no
import/reference to a retired dataset exists (SC-003). **Target Platform**: unchanged. **Project
Type**: no new package. **Performance Goals**: unchanged. **Constraints**: Rule 3 (preserve working
code) — this phase's default expectation is zero functional changes. **Scale/Scope**: one existing
file, confirmation only.

## Constitution Check

No project constitution ratified. Operative constraint: `CLAUDE.md`'s explicit prohibition on
reintroducing retired datasets (carried from `total_mvp_context.md` §2/§8). No violations
expected or to justify.

## Project Structure

### Documentation (this feature)

```text
specs/024-phase-4-competency-intelligence/
├── plan.md              # This file
├── quickstart.md         # This command's output
└── tasks.md              # /speckit-tasks output (not created by this command)
```

### Source Code (repository root)

```text
backend/
├── src/services/gap_engine.py   # existing — confirm only, per research.md §6's decision;
│                                   fix only if this phase's determinism/source-review check finds
│                                   an actual defect (none expected)
└── tests/
    └── test_gap_engine.py        # NEW (if not already present) — unit tests for rank_gaps():
                                     determinism across repeated calls (SC-002), tie-breaking by
                                     competency id, and a zero-gap competency never appearing
```

**Structure Decision**: No new files beyond a focused unit-test addition. This phase is
confirmation-only per the master document's own framing ("Task 8 — gap_engine.py already exists").

## Complexity Tracking

None.
