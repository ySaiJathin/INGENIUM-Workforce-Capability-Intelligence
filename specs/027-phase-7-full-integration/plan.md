# Implementation Plan: Phase 7 — Full Integration

**Branch**: `027-phase-7-full-integration` | **Date**: 2026-09-12 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/027-phase-7-full-integration/spec.md`

## Summary

A whole-system confidence pass, not new capability: run the complete golden path from a clean
start via both entry points, then deliberately trigger every documented failure condition
(FR-003's list) and confirm graceful degradation everywhere. No new backend/frontend code is
expected — this phase's deliverable is a completed, reported test matrix and any bug fixes that
matrix surfaces (fixed under the relevant earlier phase's scope, per `CLAUDE.md`'s "if a later
feature breaks an earlier phase: STOP, fix the regression, re-run the earlier test" rule).

## Technical Context

**Language/Version**: N/A — no new code by default. **Primary Dependencies**: none new.
**Storage**: unchanged. **Testing**: this phase's entire content is a test matrix, run live by
this session (or any future session with shell access) against the fully-integrated system — see
`quickstart.md`. **Target Platform**: unchanged. **Project Type**: no new package. **Performance
Goals**: SC-001's "under 3 minutes hands-on" is the only quantitative target. **Constraints**:
Phases 0-6 must each already be independently complete and passing (this phase's own dependency,
per its spec's Assumptions). **Scale/Scope**: whole-system, one test matrix.

## Constitution Check

No project constitution ratified. Operative constraint: `CLAUDE.md`'s Execution & Testing Protocol
("no phase is marked complete on 'the code looks right' — only on an actual verified result") —
this phase is that protocol's final, whole-system application. No violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/027-phase-7-full-integration/
├── plan.md              # This file
├── quickstart.md         # This command's output — the full failure-condition test matrix
└── tasks.md              # /speckit-tasks output (not created by this command)
```

### Source Code (repository root)

```text
# No planned source changes. Any fix required by a failed test-matrix row is applied under the
# scope of whichever phase (020-026) owns that piece of the system, then re-verified here.
```

**Structure Decision**: No new source structure — this phase is verification-only against the
already-built system from Phases 0-6. If the test matrix finds a defect, the fix happens in the
owning phase's files (traced back via this plan's Constitution Check note), not as new files
introduced by this phase itself.

## Complexity Tracking

None.
