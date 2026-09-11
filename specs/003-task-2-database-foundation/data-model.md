# Phase 1 Data Model: Task 2 — Database Foundation

Full PostgreSQL schema per `total_buildplan.md` §6's minimum table list, refined into concrete
entities/fields/relationships. `roles`, `competencies`, `role_competencies`, `courses`,
`course_competencies` are seeded from Task 1's curated JSON (see Task 1's `data-model.md` for the source
JSON shapes); the rest start empty and are populated by later phases' runtime usage. Add indexes on every
field used in a WHERE/JOIN for gap and recommendation queries; do not over-normalize beyond what's listed.

## Table: `competencies`

| Column | Type | Notes |
|---|---|---|
| id | text (PK) | e.g. `sql_window_functions` |
| name | text | |
| description | text | |
| parent_competency_id | text, FK → competencies.id, nullable | hierarchy (e.g. SQL → Window Functions) |
| proficiency_scale_max | int | e.g. 5 |
| esco_source_id | text, nullable | traceability to `skills_en.csv` |

**Index**: `parent_competency_id`.

## Table: `roles`

| Column | Type | Notes |
|---|---|---|
| id | text (PK) | |
| name | text | |
| description | text | |
| esco_occupation_id | text, nullable | traceability to `occupations_en.csv` |

## Table: `role_competencies`

| Column | Type | Notes |
|---|---|---|
| role_id | text, FK → roles.id | composite PK with competency_id |
| competency_id | text, FK → competencies.id | composite PK |
| required_level | numeric | |
| priority | int | feeds Task 8 gap ranking |

**Indexes**: `role_id`, `competency_id` (both sides — role-requirements lookups and reverse lookups).

## Table: `candidates`

| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| source | text, enum(`resume_upload`, `demo`) | |
| created_at | timestamptz | |
| resume_filename | text, nullable | |
| target_role_id | text, FK → roles.id, nullable | |

**Index**: `target_role_id`.

## Table: `candidate_skills`

| Column | Type | Notes |
|---|---|---|
| candidate_id | uuid, FK → candidates.id | composite PK with competency_id |
| competency_id | text, FK → competencies.id | composite PK |
| resume_estimated_level | numeric | |
| resume_confidence | numeric | 0–1 |
| evidence_snippet | text, nullable | |

**Index**: `candidate_id`.

## Table: `assessments`

(`AssessmentSession` in product terms — table name matches `total_buildplan.md` §6's `assessments`.)

| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | == `session_id` in the API contract |
| candidate_id | uuid, FK → candidates.id | |
| target_role_id | text, FK → roles.id | |
| status | text, enum(`in_progress`, `completed`, `abandoned`) | |
| started_at | timestamptz | |
| completed_at | timestamptz, nullable | |
| question_budget | int | default ~8–12 |

**Indexes**: `candidate_id`, `target_role_id`, `status`.

## Table: `questions`

| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| session_id | uuid, FK → assessments.id | |
| competency_id | text, FK → competencies.id | |
| type | text, enum(`mcq`) | |
| prompt | text | |
| options | jsonb | |
| correct_answer_index | int | |
| difficulty | int | 1–5 |
| explanation | text | |
| source | text, enum(`mistral`, `seed`) | records whether the Rule 5 fallback fired |
| sequence_number | int | |

**Indexes**: `session_id`, `competency_id`.

## Table: `answers`

| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| question_id | uuid, FK → questions.id | |
| session_id | uuid, FK → assessments.id | |
| selected_index | int | |
| is_correct | boolean | computed server-side, never trusted from client |
| answered_at | timestamptz | |

**Indexes**: `session_id`, `question_id`.

## Table: `skill_evidence`

| Column | Type | Notes |
|---|---|---|
| session_id | uuid, FK → assessments.id | composite PK with competency_id |
| competency_id | text, FK → competencies.id | composite PK |
| questions_answered | int | |
| correct_count | int | |
| avg_difficulty | numeric | |
| confidence_state | numeric | 0–1, drives routing's stop condition |

**Index**: `session_id`.

## Table: `verified_skill_scores`

*(Not in `total_buildplan.md` §6's literal minimum list, but required to persist Task 7's output
per FR-013 of the overall spec — added as a lightweight extension of `skill_evidence`, not a new
subsystem.)*

| Column | Type | Notes |
|---|---|---|
| candidate_id | uuid, FK → candidates.id | composite PK with competency_id, session_id |
| competency_id | text, FK → competencies.id | composite PK |
| session_id | uuid, FK → assessments.id | composite PK |
| resume_estimated_level | numeric | copied from candidate_skills for display |
| resume_confidence | numeric | |
| verified_level | numeric | backend-computed, never from Mistral (Rule 6) |
| verified_confidence | numeric | 0–1 |
| computed_at | timestamptz | |

**Indexes**: `candidate_id`, `session_id`.

## Table: `skill_gaps`

| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| analysis_id | uuid, FK → analyses.id | see below |
| competency_id | text, FK → competencies.id | |
| required_level | numeric | copied from role_competencies |
| verified_level | numeric | copied from verified_skill_scores |
| gap | numeric | `required_level - verified_level` |
| rank | int | |

**Indexes**: `analysis_id`, `competency_id`.

## Table: `analyses`

*(Backing `POST /analysis`'s `analysis_id`; not itemized separately in `total_buildplan.md` §6 but
implied by the `/analysis/{id}/...` endpoints — grouped here rather than as a new subsystem.)*

| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| candidate_id | uuid, FK → candidates.id | |
| target_role_id | text, FK → roles.id | |
| session_id | uuid, FK → assessments.id | |
| created_at | timestamptz | |

**Indexes**: `candidate_id`, `target_role_id`.

## Table: `courses`

| Column | Type | Notes |
|---|---|---|
| id | text (PK) | |
| title | text | |
| description | text | |
| provider | text | |
| level | text, enum(`beginner`, `intermediate`, `advanced`) | |
| duration_hours | numeric | |
| priority | int | |

## Table: `course_competencies`

| Column | Type | Notes |
|---|---|---|
| course_id | text, FK → courses.id | composite PK with competency_id |
| competency_id | text, FK → competencies.id | composite PK |
| coverage_weight | numeric, default 1.0 | |

**Indexes**: `course_id`, `competency_id`.

## Table: `course_recommendations`

| Column | Type | Notes |
|---|---|---|
| analysis_id | uuid, FK → analyses.id | composite PK with gap_id, course_id |
| gap_id | uuid, FK → skill_gaps.id | composite PK |
| course_id | text, FK → courses.id | composite PK |
| match_reason | jsonb | matched competencies, for "covers ✓ X ✓ Y" |
| match_score | numeric, nullable | cosine similarity, if semantic re-rank used |

**Index**: `analysis_id`.

## Table: `learning_paths`

| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| analysis_id | uuid, FK → analyses.id | |
| created_at | timestamptz | |

## Table: `learning_path_steps`

| Column | Type | Notes |
|---|---|---|
| learning_path_id | uuid, FK → learning_paths.id | composite PK with step_number |
| step_number | int | composite PK |
| course_id | text, FK → courses.id | |
| gap_id | uuid, FK → skill_gaps.id | |
| rationale | text, nullable | optional Mistral-supplied text; ordering stays deterministic |

**Index**: `learning_path_id`.

## Relationships summary

```
roles 1──* role_competencies *──1 competencies
candidates 1──* candidate_skills *──1 competencies
candidates 1──* assessments *──1 roles
assessments 1──* questions 1──1 answers
assessments 1──* skill_evidence *──1 competencies
candidates + competencies + assessments ──1 verified_skill_scores
analyses 1──* skill_gaps *──1 competencies
analyses 1──* course_recommendations *──1 courses
analyses 1──1 learning_paths 1──* learning_path_steps *──1 courses
courses *──* competencies  (via course_competencies)
```

## Seeding (Task 2's runtime responsibility)

`roles`, `competencies`, `role_competencies`, `courses`, `course_competencies` are populated from Task 1's
`data/curated/*.json` by `seed_reference_data.py`, keyed on each row's natural `id`, using an upsert
(`INSERT ... ON CONFLICT (id) DO UPDATE`) so the script is idempotent (spec SC-003) and never touches
`candidates`, `assessments`, `answers`, or any other candidate-generated table.
