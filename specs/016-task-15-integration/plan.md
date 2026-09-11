# Implementation Plan: Task 15 — Integration

**Branch**: `016-task-15-integration` | **Date**: 2026-09-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/016-task-15-integration/spec.md`

## Summary

Run the complete golden path through the real, connected system (frontend → FastAPI → PostgreSQL →
Mistral → scoring → gap → recommendation → learning-path engines) for the first time as one continuous
flow, fixing any contract mismatches discovered at their source. This phase does not add new features —
it is a verification-and-fix pass across every phase already built in Tasks 1–14.

## Technical Context

**Language/Version**: N/A — no new code stack; this phase runs and fixes the existing Python/FastAPI and
TypeScript/React code from prior phases.

**Primary Dependencies**: All prior phases' outputs — the full running system.

**Storage**: The real PostgreSQL instance from Task 2, with real data accumulating from real runs (not a
test/mock database).

**Testing**: The golden-path run itself is the test — repeated at least three times per spec SC-001,
covering both entry points (real upload, demo candidate).

**Target Platform**: Full local stack (backend + frontend + PostgreSQL) on the developer/demo machine.

**Project Type**: Cross-cutting integration pass over `backend/` and `frontend/` together.

**Performance Goals**: The full golden path completes in a demo-acceptable time (see Task 16/17 for any
further tuning); no formal new performance target introduced here.

**Constraints**: Any fix found during this pass must be applied at its originating phase's module/contract
and that phase's own `contracts/api.md`/`quickstart.md` re-verified — not patched around at the
integration layer (FR-003, Rule 10).

**Scale/Scope**: The entire P0 golden path (`total_mvp_context.md` §4), both entry points.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` is unfilled boilerplate; `CLAUDE.md` is the binding rulebook gate.

| Rule | Gate | Status |
|------|------|--------|
| Rule 10 — Preserve working code | Fixes go to the source phase/contract, not a workaround here | PASS |
| Rule 1 — Protect the deadline | Golden path is the explicit focus; P1 integration excluded (Assumptions) | PASS |
| Rule 9 — Test continuously | Repeated runs (SC-001) rather than a single pass-then-move-on | PASS |

No violations — Complexity Tracking table is not needed.

## Project Structure

### Documentation (this feature)

```text
specs/016-task-15-integration/
├── plan.md              # This file
├── quickstart.md         # Phase 1 output — the full golden-path run script, both entry points
└── checklists/
    └── requirements.md
```

`research.md`, `data-model.md`, and `contracts/` are omitted: this phase introduces no new technology,
entity, or contract — it verifies and repairs the contracts already documented across
`specs/004`–`specs/015`.

### Source Code (repository root)

No new files. Fixes during this phase land in whichever existing file (`backend/src/...` or
`frontend/src/...`) actually owns the mismatched behavior, per its originating task's Project Structure.

**Structure Decision**: No new structure — this is a verification-and-repair pass across the existing
`backend/` and `frontend/` trees established by Tasks 0–14.

## Complexity Tracking

*No Constitution Check violations — table intentionally left empty.*
