# Implementation Plan: Task 2 — Database Foundation

**Branch**: `003-task-2-database-foundation` | **Date**: 2026-09-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-task-2-database-foundation/spec.md`

## Summary

Create the PostgreSQL schema covering the full candidate → assessment → scoring → gap → recommendation →
learning-path data flow (`total_buildplan.md` §6), add indexes on every gap/recommendation join field,
seed it idempotently with Task 1's curated JSON, and verify connectivity — before any API endpoint
(Task 3) is written.

## Technical Context

**Language/Version**: Python 3.11+ (backend `db.py`/migration script), SQL DDL.

**Primary Dependencies**: SQLAlchemy or psycopg (Postgres driver) — matches `total_buildplan.md` §6's
backend stack; no ORM abstraction beyond what keeps queries parameterized and readable.

**Storage**: PostgreSQL — single database, no second datastore (`CLAUDE.md`).

**Testing**: A seed-then-query smoke test: connect, assert row counts match Task 1's curated file counts,
assert zero dangling foreign keys, re-run seed and assert row counts are unchanged (idempotency).

**Target Platform**: Local PostgreSQL instance on the developer/demo machine.

**Project Type**: Backend infrastructure (`backend/` — schema + seed script), no frontend involvement.

**Performance Goals**: Connectivity check completes in under 2 seconds (spec SC-004); seed step completes
well within the Task 2 time-box (`total_buildplan.md` §20: 0:20–1:40 for Tasks 1–2 combined).

**Constraints**: Parameterized queries only (Rule/FR-008); seeding must be idempotent and must never
touch candidate-generated tables (`candidates`, `assessments`, `answers`, etc.) — only reference tables.

**Scale/Scope**: Reference data at Task 1's scale (5–8 roles, 30–50 competencies, 30–50 courses, 20–30
seed questions); candidate/assessment tables start empty and grow only through later-phase usage.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` is unfilled boilerplate; `CLAUDE.md` is the binding rulebook gate.

| Rule | Gate | Status |
|------|------|--------|
| "PostgreSQL only" | Single Postgres database, no second datastore | PASS |
| "Parameterized queries everywhere" | FR-008 mandates parameterized seed/schema operations | PASS |
| Rule 2 — No architecture redesign | Table list matches `total_buildplan.md` §6 verbatim | PASS |
| Rule 13 — Performance discipline | Indexes added specifically for gap/recommendation join fields | PASS |

No violations — Complexity Tracking table is not needed.

## Project Structure

### Documentation (this feature)

```text
specs/003-task-2-database-foundation/
├── plan.md              # This file
├── data-model.md         # Phase 1 output — full schema, all 13 tables
├── quickstart.md         # Phase 1 output — schema create + seed + verify steps
└── checklists/
    └── requirements.md
```

`research.md` is omitted: the table list, minimum indexing strategy, and seeding approach are already
fully determined by `total_buildplan.md` §6 with no open unknowns. `contracts/` is omitted: this phase
has no external API surface — that begins in Task 3.

### Source Code (repository root)

```text
backend/
├── src/
│   ├── db.py                 # PostgreSQL engine/session setup
│   ├── models/                # SQLAlchemy models mirroring data-model.md, one module per entity group
│   │   ├── reference.py       # Role, Competency, RoleCompetency, Course, CourseCompetency
│   │   ├── candidate.py       # Candidate, CandidateSkill
│   │   └── assessment.py      # AssessmentSession, Question, Answer, SkillEvidence,
│   │                          # VerifiedSkillScore, Analysis, SkillGap, CourseRecommendation,
│   │                          # LearningPath, LearningPathStep
│   └── scripts/
│       └── seed_reference_data.py   # idempotent loader for data/curated/*.json
└── migrations/                # DDL / migration scripts creating all 13+ tables and indexes
```

**Structure Decision**: Schema and seeding live entirely under `backend/`, split into `models/` (mirrors
`data-model.md` 1:1) and a standalone `seed_reference_data.py` script that is safe to re-run. This keeps
Task 3's API layer free to import ready-made models without owning any schema-creation logic itself.

## Complexity Tracking

*No Constitution Check violations — table intentionally left empty.*
