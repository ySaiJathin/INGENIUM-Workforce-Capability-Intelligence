# Implementation Plan: Task 17 — Final Testing

**Branch**: `018-task-17-final-testing` | **Date**: 2026-09-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/018-task-17-final-testing/spec.md`

## Summary

Run the nine named failure/happy-path scenarios against the fully integrated, demo-polished system
(Tasks 15–16), fix only critical bugs found, re-verify the golden path and the demo script after any fix,
and stop — per `total_buildplan.md` §23's Definition of Done: "Once all of this works: stop building
features. Move to testing → bug fixing → UI polish → demo rehearsal." This is the last phase before
presenting to judges.

## Technical Context

**Language/Version**: N/A — no new code stack; this phase tests and, where critical, patches the existing
`backend/` and `frontend/` code from all prior phases.

**Primary Dependencies**: The complete integrated system from Task 15, polished per Task 16.

**Storage**: The same PostgreSQL instance already in use; this phase may include a deliberate
database-unreachable test (stopping/restarting the DB process) as one of its nine scenarios.

**Testing**: The nine scenarios themselves, each run deliberately and recorded pass/fail, per spec
FR-001/SC-001. Any fix triggers a regression re-check of the golden-path scenario (FR-004) and the demo
script (FR-005).

**Target Platform**: The full local stack, ideally including the actual presentation device/browser used
for judging.

**Project Type**: Cross-cutting test-and-fix pass over `backend/` and `frontend/`.

**Performance Goals**: N/A beyond what's already established; this phase does not add new performance
work.

**Constraints**: Only critical bugs are fixed (FR-003); every fix is re-verified against the golden path
and demo script before the phase is considered done (FR-004/FR-005); non-critical issues are logged, not
chased, to protect the deadline (Rule 1/11).

**Scale/Scope**: Nine scenarios, one pass each, fixes applied only where critical.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` is unfilled boilerplate; `CLAUDE.md` is the binding rulebook gate.

| Rule | Gate | Status |
|------|------|--------|
| Rule 1/11 — Protect the deadline / P0 before P1 | Only critical bugs fixed; non-critical logged (FR-003) | PASS |
| Rule 10 — Preserve working code | Every fix re-verified against golden path before phase ends | PASS |
| Rule 9 — Test continuously | This phase is the final continuous-testing checkpoint per §23 | PASS |

No violations — Complexity Tracking table is not needed.

## Project Structure

### Documentation (this feature)

```text
specs/018-task-17-final-testing/
├── plan.md              # This file
├── quickstart.md         # Phase 1 output — the nine-scenario test script with pass/fail recording
└── checklists/
    └── requirements.md
```

`research.md`, `data-model.md`, and `contracts/` are omitted: this phase introduces no new technology,
entity, or contract — it verifies behavior already specified across every prior phase's own spec/contract.

### Source Code (repository root)

No new files. Any critical-bug fix lands in whichever existing file actually owns the failing behavior,
per that behavior's originating task's Project Structure (e.g. a duplicate-answer regression is fixed in
`backend/src/services/assessment_engine.py` from Task 6, not patched elsewhere).

**Structure Decision**: No new structure — this is the final test-and-fix pass across the existing
`backend/` and `frontend/` trees established by every prior task.

## Complexity Tracking

*No Constitution Check violations — table intentionally left empty.*
