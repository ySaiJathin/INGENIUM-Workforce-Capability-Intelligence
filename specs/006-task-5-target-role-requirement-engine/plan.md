# Implementation Plan: Task 5 — Target Role & Requirement Engine

**Branch**: `006-task-5-target-role-requirement-engine` | **Date**: 2026-09-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/006-task-5-target-role-requirement-engine/spec.md`

## Summary

Add a candidate-facing role-selection endpoint that writes `candidates.target_role_id` and returns the
same requirement shape Task 3's `GET /roles/{id}` already exposes. Can be built in parallel with Task 4
once Task 3 exists (`total_buildplan.md` §25), since it only needs an existing candidate id and a role id.

## Technical Context

**Language/Version**: Python 3.11+, FastAPI, Pydantic.

**Primary Dependencies**: Reuses Task 2's `candidates`/`roles`/`role_competencies` models and Task 3's
role-detail query — no new dependency introduced.

**Storage**: PostgreSQL — single UPDATE on `candidates.target_role_id`, read from `role_competencies`.

**Testing**: Contract test: create a candidate (via Task 4's demo/resume path), select a role, confirm
the DB row and response match; error-path tests for unknown candidate/role id.

**Target Platform**: Backend FastAPI service.

**Project Type**: Backend web service (`backend/src/api/candidates.py`, extended).

**Performance Goals**: Under 1 second (spec SC-001) — pure DB read/write, no Mistral call.

**Constraints**: Requirements are read only from curated/DB data, never Mistral (FR-003, Rule 4);
selection must be all-or-nothing on invalid ids (FR-005/SC-003).

**Scale/Scope**: One role selection per candidate at a time (re-selection overwrites, FR-002).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` is unfilled boilerplate; `CLAUDE.md` is the binding rulebook gate.

| Rule | Gate | Status |
|------|------|--------|
| Rule 4 — Mistral boundaries | Requirements come only from curated/DB data (FR-003) | PASS |
| Rule 10 — Preserve working code | Reuses Task 3's role-detail shape rather than inventing a new one | PASS |
| Rule 2 — No architecture redesign | No new table/endpoint pattern beyond what §6/§24 specify | PASS |

No violations — Complexity Tracking table is not needed.

## Project Structure

### Documentation (this feature)

```text
specs/006-task-5-target-role-requirement-engine/
├── plan.md              # This file
├── contracts/
│   └── api.md             # Phase 1 output — role-selection endpoint
└── checklists/
    └── requirements.md
```

`research.md` and `data-model.md` are omitted: no new technology decision or entity is introduced — this
phase writes one existing column (`candidates.target_role_id`, from Task 2's `data-model.md`) and reads
data already modeled and exposed by Task 3. `quickstart.md` is folded into `contracts/api.md`'s example
since the verification is a single request/response pair, not a multi-step scenario.

### Source Code (repository root)

```text
backend/
└── src/
    └── api/
        └── candidates.py    # extended: POST /candidates/{id}/target-role
```

**Structure Decision**: Added to the existing `candidates.py` router from Task 4 rather than a new
router module — role selection is a candidate-lifecycle action, not a distinct resource, keeping "APIs
small and focused" (`total_buildplan.md` §24 Task 3) without fragmenting related candidate endpoints.

## Complexity Tracking

*No Constitution Check violations — table intentionally left empty.*
