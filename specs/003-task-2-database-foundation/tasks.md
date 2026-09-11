---
description: "Task list for Task 2 — Database Foundation"
---

# Tasks: Task 2 — Database Foundation

**Input**: Design documents from `/specs/003-task-2-database-foundation/`
**Prerequisites**: plan.md (required), spec.md (required), data-model.md, quickstart.md

**Tests**: Not explicitly requested; the seed-then-query smoke test from plan.md's Technical Context
(connect, assert row counts, assert zero dangling FKs, re-run for idempotency) is implemented directly as
part of the seed/connectivity scripts rather than a separate pytest suite, to stay within the time budget.

**Organization**: Single user story (P1).

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup (Shared Infrastructure)

- [X] T001 Create `backend/`, `backend/src/`, `backend/src/models/`, `backend/src/scripts/`, and
      `backend/migrations/` packages (each with `__init__.py`) so everything is importable via
      `python -m backend...` from the repo root

## Phase 2: Foundational (Blocking Prerequisites)

- [X] T002 Create `backend/src/db.py`: SQLAlchemy `engine` (reads `DATABASE_URL` from `.env` via
      `python-dotenv`) and `SessionLocal` factory, matching Task 0's running Docker Postgres on
      `localhost:5433`

## Phase 3: User Story 1 - Give the Backend a Working, Seeded Database to Build On (Priority: P1) 🎯 MVP

**Goal**: All 13+ tables from `data-model.md` exist with correct PKs/FKs/indexes, seeded with Task 1's
curated reference data, idempotently, with a passing connectivity check — all before Task 3 begins.

**Independent Test**: Connect with a query tool, confirm every table and its columns/indexes exist, and
confirm curated roles/competencies/courses/seed-questions are present as rows.

### Implementation for User Story 1

- [X] T003 [P] [US1] Create `backend/src/models/reference.py`: `Competency` (`id` text PK,
      `name`, `description`, `parent_competency_id` FK→`competencies.id` nullable indexed,
      `proficiency_scale_max` int, `esco_source_id` text nullable), `Role` (`id` text PK, `name`,
      `description`, `esco_occupation_id` text nullable), `RoleCompetency` (composite PK
      `role_id`+`competency_id`, both FK+indexed, `required_level` numeric, `priority` int),
      `Course` (`id` text PK, `title`, `description`, `provider`, `level`, `duration_hours` numeric,
      `priority` int), `CourseCompetency` (composite PK `course_id`+`competency_id`, both FK+indexed,
      `coverage_weight` numeric default 1.0) — per data-model.md's `competencies`/`roles`/
      `role_competencies`/`courses`/`course_competencies` tables
- [X] T004 [P] [US1] Create `backend/src/models/candidate.py`: `Candidate` (`id` uuid PK, `source`
      enum(`resume_upload`,`demo`), `created_at` timestamptz, `resume_filename` text nullable,
      `target_role_id` FK→`roles.id` nullable indexed), `CandidateSkill` (composite PK
      `candidate_id`+`competency_id`, `candidate_id` FK indexed, `competency_id` FK,
      `resume_estimated_level` numeric, `resume_confidence` numeric 0–1, `evidence_snippet` text
      nullable) — per data-model.md's `candidates`/`candidate_skills` tables
- [X] T005 [US1] Create `backend/src/models/assessment.py` (depends on T003/T004 for FK targets):
      `AssessmentSession` (table `assessments`; `id` uuid PK, `candidate_id`/`target_role_id` FK
      indexed, `status` enum(`in_progress`,`completed`,`abandoned`) indexed, `started_at`,
      `completed_at` nullable, `question_budget` int), `Question` (`id` uuid PK, `session_id` FK
      indexed, `competency_id` FK indexed, `type` enum(`mcq`), `prompt`, `options` jsonb,
      `correct_answer_index` int, `difficulty` int 1–5, `explanation`, `source`
      enum(`mistral`,`seed`), `sequence_number` int), `Answer` (`id` uuid PK, `question_id`/`session_id`
      FK indexed, `selected_index` int, `is_correct` bool, `answered_at`), `SkillEvidence` (composite
      PK `session_id`+`competency_id`, `session_id` FK indexed, `questions_answered`, `correct_count`
      int, `avg_difficulty` numeric, `confidence_state` numeric 0–1), `VerifiedSkillScore` (composite
      PK `candidate_id`+`competency_id`+`session_id`, `candidate_id`/`session_id` FK indexed,
      `resume_estimated_level`, `resume_confidence`, `verified_level`, `verified_confidence` numeric
      0–1, `computed_at`), `Analysis` (`id` uuid PK, `candidate_id`/`target_role_id` FK indexed,
      `session_id` FK, `created_at`), `SkillGap` (`id` uuid PK, `analysis_id` FK indexed,
      `competency_id` FK indexed, `required_level`, `verified_level`, `gap` numeric, `rank` int),
      `CourseRecommendation` (composite PK `analysis_id`+`gap_id`+`course_id`, `analysis_id` FK
      indexed, `match_reason` jsonb, `match_score` numeric nullable), `LearningPath` (`id` uuid PK,
      `analysis_id` FK, `created_at`), `LearningPathStep` (composite PK
      `learning_path_id`+`step_number`, `learning_path_id` FK indexed, `course_id`/`gap_id` FK,
      `rationale` text nullable) — per data-model.md's remaining 9 tables
- [X] T006 [US1] Create `backend/src/models/__init__.py`: declarative `Base`, import every model
      module from T003–T005 so `Base.metadata` sees all 13 tables, and re-export `Base` +
      all model classes
- [X] T007 [US1] Create `backend/migrations/create_schema.py`: import `Base` (T006) and `engine`
      (T002), call `Base.metadata.create_all(engine)` — the project's lightweight migration approach
      per plan.md's Assumptions (no Alembic/formal versioning needed for this timeline)
- [X] T008 [US1] Run `python -m backend.migrations.create_schema` and confirm all 13 tables exist via
      `\dt` against the Docker Postgres instance (FR-001/SC-001)
- [X] T009 [US1] Create `backend/src/scripts/seed_reference_data.py`: load
      `data/curated/{competencies,roles,courses}.json`, upsert into `competencies`, `roles`,
      `role_competencies` (from each role's `required_competencies`), `courses`,
      `course_competencies` (from each course's `competencies_covered`) using
      `INSERT ... ON CONFLICT DO UPDATE` (idempotent, FR-005) — never touching `candidates`,
      `assessments`, `answers`, or any other candidate-generated table (Edge Cases), and raising with
      the specific table/row on any FK violation rather than silently skipping (FR-009)
- [X] T010 [US1] Run `python -m backend.src.scripts.seed_reference_data` twice in a row; confirm row
      counts match Task 1's curated file counts after the first run and are unchanged after the second
      (FR-004/SC-002/SC-003)
- [X] T011 [US1] Create `backend/src/scripts/check_db.py`: open a connection, run `SELECT 1`, report
      row counts for every seeded table, and time the whole check, confirming it completes in under 2
      seconds (FR-006/SC-004)
- [X] T012 [US1] Run `python -m backend.src.scripts.check_db` and confirm it reports success with the
      expected row counts within the time budget

**Checkpoint**: Task 2 is complete — the database is schema-complete, seeded, idempotent, and
connectivity-verified, ready for Task 3's API endpoints to read from it.

---

## Dependencies & Execution Order

- T001 → T002 (package scaffolding before the engine module).
- T003/T004 are `[P]` — independent files with no cross-dependency between them.
- T005 depends on T003/T004 (its models FK-reference `Role`, `Competency`, `Candidate`).
- T006 depends on T003–T005 (imports all of them).
- T007/T008 depend on T006 (need `Base.metadata` populated) and T002 (need `engine`).
- T009/T010 depend on T008 (schema must exist before seeding) and on Task 1's curated files.
- T011/T012 depend on T010 (checking row counts requires seeded data).

## Implementation Strategy

### MVP (this phase's only scope)

1. Complete Phase 1 (package scaffolding).
2. Complete Phase 2 (`db.py` engine/session).
3. Complete Phase 3 in order: models (T003→T004→T005→T006) → schema creation (T007→T008) → seeding
   (T009→T010) → connectivity check (T011→T012).
4. **STOP and VALIDATE**: T012's connectivity-check output (row counts + timing) is this phase's
   pass/fail signal — Task 3 should not begin until it reports clean.

## Notes

- No Alembic/formal migration versioning introduced — `Base.metadata.create_all()` is this project's
  "migration," matching plan.md's explicit Assumption that a single DDL-equivalent script is sufficient
  for a single-environment hackathon build (Rule 13 — no added infrastructure).
- Seeding is idempotent via `ON CONFLICT DO UPDATE`, never via a destructive `DELETE`-then-`INSERT`, so a
  second run is always safe even if candidate-generated tables already reference the seeded rows.
