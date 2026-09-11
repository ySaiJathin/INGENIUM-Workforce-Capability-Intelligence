# Phase 1 Data Model: Task 1 — Data Foundation

Schema for the four curated JSON files. These shapes are what Task 2 seeds into PostgreSQL; field names
here should map directly onto the table columns defined in Task 2's plan.

## `roles.json`

```json
[
  {
    "id": "data-analyst",
    "name": "Data Analyst",
    "description": "...",
    "esco_occupation_id": "optional, traceability to occupations_en.csv",
    "required_competencies": [
      { "competency_id": "sql", "required_level": 4, "priority": 1 },
      { "competency_id": "statistics", "required_level": 3, "priority": 2 }
    ]
  }
]
```

**Rules**: `id` unique across the file. 5–8 entries. Every `required_competencies[].competency_id` must
exist in `competencies.json`. `required_level` on the referenced competency's proficiency scale.
`priority` is a small positive integer, lower = more critical (feeds Task 8's gap ranking).

## `competencies.json`

```json
[
  {
    "id": "sql_window_functions",
    "name": "SQL Window Functions",
    "description": "...",
    "parent_competency_id": "sql",
    "proficiency_scale_max": 5,
    "esco_source_id": "optional, traceability to skills_en.csv"
  }
]
```

**Rules**: `id` unique across the file. 30–50 entries. `parent_competency_id`, if present, must reference
another entry in this same file and must not create a cycle. `proficiency_scale_max` is **4** for every
entry (Foundation/Working/Advanced/Expert), matching the already-built frontend prototype's
`CompetencyLevelNumber` type (`specs/012-task-11-frontend-foundation/spec.md`'s Assumptions) — this
supersedes this document's original "recommended: 5" note, decided before that prototype was adopted as
ground truth.

## `courses.json`

```json
[
  {
    "id": "advanced-sql-analytics",
    "title": "Advanced SQL Analytics",
    "description": "...",
    "provider": "...",
    "level": "intermediate",
    "duration_hours": 6,
    "priority": 1,
    "competencies_covered": [
      { "competency_id": "sql_window_functions", "coverage_weight": 1.0 },
      { "competency_id": "sql_ctes", "coverage_weight": 0.7 }
    ]
  }
]
```

**Rules**: `id` unique across the file. 30–50 entries. Every `competencies_covered[].competency_id` must
exist in `competencies.json`. `level` is one of `beginner`, `intermediate`, `advanced`.

## `assessment_seed.json`

```json
[
  {
    "id": "seed-001",
    "competency_id": "sql_window_functions",
    "question": "...",
    "type": "mcq",
    "options": ["...", "...", "...", "..."],
    "correct_answer_index": 2,
    "difficulty": 3,
    "explanation": "..."
  }
]
```

**Rules**: `id` unique across the file. 20–30 entries. `competency_id` must exist in `competencies.json`.
`type` is `mcq` only for the MVP (open-ended is P1/out of scope). This is the exact shape Task 6's
fallback path substitutes in place of a failed Mistral generation, per Rule 5.

## Cross-file referential integrity (validated by `quickstart.md`)

```
roles[].required_competencies[].competency_id      ⊆ competencies[].id
competencies[].parent_competency_id                ⊆ competencies[].id  (or null)
courses[].competencies_covered[].competency_id      ⊆ competencies[].id
assessment_seed[].competency_id                     ⊆ competencies[].id
```
