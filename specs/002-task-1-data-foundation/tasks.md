---
description: "Task list for Task 1 — Data Foundation"
---

# Tasks: Task 1 — Data Foundation

**Input**: Design documents from `/specs/002-task-1-data-foundation/`
**Prerequisites**: plan.md (required), spec.md (required), data-model.md, quickstart.md

**Tests**: Not explicitly requested; referential-integrity validation (FR-005/SC-001..SC-003) is built
directly into the generation script and run every time, which serves the same self-verifying purpose.

**Organization**: Single user story (P1).

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup (Shared Infrastructure)

- [X] T001 Look up real ESCO occupation ids (statistician, data analyst, data scientist, GIS specialist,
      database administrator) from `data/raw/esco/occupations_en.csv` and skill ids (SQL, Python,
      statistical analysis, GIS, machine learning, data visualisation, database management, query
      languages) from `data/raw/esco/skills_en.csv`, for traceability per FR-006/SC-004

## Phase 2: Foundational (Blocking Prerequisites)

*(None — Task 1 depends only on Task 0's ESCO files being present, already verified.)*

## Phase 3: User Story 1 - Give Every Later Phase a Trustworthy Reference Dataset (Priority: P1) 🎯 MVP

**Goal**: Produce `data/curated/{roles,competencies,courses,assessment_seed}.json`, internally consistent
and referentially sound, ready for Task 2 to seed into PostgreSQL.

**Independent Test**: Validate all four files' referential integrity (every competency id referenced by a
role/course/seed question exists in `competencies.json`) independently of any database/API code.

### Implementation for User Story 1

- [X] T002 [US1] Create `scripts/generate_curated_data.py`: define 34 curated competencies (SQL, Python,
      Statistics, Data Visualization, Machine Learning, GIS, Database Management, Data Engineering
      families + 4 standalone domain competencies), each with `id`, `name`, `description`,
      `parent_competency_id` (nullable, no cycles), `proficiency_scale_max` = 4 (Foundation/Working/
      Advanced/Expert, matching the frontend's scale — data-model.md updated accordingly), and
      `esco_source_id` where a clean ESCO skill mapping exists (T001), null otherwise (FR-002, FR-006)
- [X] T003 [US1] Add 6 curated roles to `scripts/generate_curated_data.py` (Senior Statistical Officer,
      Senior Data Analyst, Lead Data Scientist, Statistical Programmer, GIS Analyst, Data Engineer —
      matching the frontend prototype's role catalog), each with `id`, `name`, `description`,
      `esco_occupation_id` where mapped (T001), and 6–8 `required_competencies` with
      `required_level` (1–4) and `priority` (1 = most critical) (FR-001)
- [X] T004 [US1] Add 30 curated courses to `scripts/generate_curated_data.py`, providers drawn from the
      frontend's exact `Course.provider` literal set (iGOT Karmayogi, National Statistical Academy,
      Ministry of Statistics (MoSPI), UN Statistics Division, GovTech Institute), each with `id`, `title`,
      `provider`, `level`, `duration_hours`, `priority`, and `competencies_covered` (competency id +
      coverage weight), covering every one of the 29 distinct role-required competencies at least once
      (FR-003, spec SC-002)
- [X] T005 [US1] Add 29 curated seed assessment questions to `scripts/generate_curated_data.py`, one per
      distinct role-required competency (`type: mcq`, 4 options, `correct_answer_index`, `difficulty`
      1–5, `explanation`), satisfying spec SC-003 within the 20–30 question range (FR-004)
- [X] T006 [US1] Implement `fill_course_descriptions()` in `scripts/generate_curated_data.py`: FR-003
      requires every course to have a `description`; derive one from title/level/provider/covered
      competencies rather than 30 hand-authored strings
- [X] T007 [US1] Implement `validate_referential_integrity()` in `scripts/generate_curated_data.py`,
      checking: every competency's `parent_competency_id` resolves (no dangling, no cycle); every role's
      `required_competencies[].competency_id` resolves; every course's `competencies_covered[].competency_id`
      resolves; every seed question's `competency_id` resolves; every role-required competency has ≥1
      covering course (SC-002); every role-required competency has ≥1 seed question (SC-003) — raising
      with a specific error list on any violation, never silently passing (FR-005)
- [X] T008 [US1] Run `scripts/generate_curated_data.py` to write
      `data/curated/{competencies,roles,courses,assessment_seed}.json`, confirming the integrity check
      reports zero errors

**Checkpoint**: Task 1 is complete — four curated, cross-referenced JSON files exist under
`data/curated/`, ready for Task 2 (Database Foundation) to seed into PostgreSQL.

---

## Dependencies & Execution Order

- T001 (ESCO lookups) feeds T002/T003's `esco_source_id`/`esco_occupation_id` fields but does not block
  writing the rest of each entry — done first for convenience, not strict necessity.
- T002 (competencies) must exist before T003/T004/T005 reference competency ids — sequential, not `[P]`.
- T006/T007 depend on T002–T005's data structures being defined in the same script.
- T008 is the final run, depending on everything above.

## Implementation Strategy

### MVP (this phase's only scope)

1. Complete Phase 1 (ESCO id lookups).
2. Complete Phase 3 sequentially (T002 → T003 → T004 → T005 → T006 → T007 → T008), since each step
   builds on the competency id set the previous step defined.
3. **STOP and VALIDATE**: `validate_referential_integrity()`'s zero-error output on the T008 run is the
   pass/fail signal for this entire phase — Task 2 should not begin until it reports clean.

## Notes

- All four files are generated by one script (`scripts/generate_curated_data.py`) rather than hand-typed,
  so the integrity checks in T007 run automatically on every regeneration — re-running the script after a
  future edit re-validates the whole dataset for free.
- Domain and role titles (civil service / National Statistical Office) intentionally match the already-
  built frontend prototype (`sk/sk/src/mock/demoData.ts`), so curated data seeded into the real backend
  will read consistently with what the UI already displays.
- Course descriptions are derived text, not independently hand-authored per course — acceptable for MVP
  curated/demo data (FR-008), but worth a manual editorial pass before a live demo if time allows.
