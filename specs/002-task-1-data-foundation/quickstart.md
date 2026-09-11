# Quickstart: Task 1 — Data Foundation

## Prerequisites

- Task 0 complete (ESCO files present under `data/raw/esco/`).
- Python 3.11+ with `pandas` available, if using a helper extraction script.

## Steps

1. Extract candidate competency/role/course names from the four active ESCO files (optional helper
   script), then hand-curate down to the target ranges: 5–8 roles, 30–50 competencies, 30–50 courses.
2. Author `data/curated/competencies.json` first (everything else references it).
3. Author `data/curated/roles.json`, referencing only competency ids that exist in step 2's output.
4. Author `data/curated/courses.json`, referencing only competency ids that exist in step 2's output, and
   confirm every competency required by a role in step 3 is covered by at least one course here (spec
   Success Criteria SC-002).
5. Author `data/curated/assessment_seed.json` (20–30 questions), covering at minimum every competency
   required by at least one role in step 3 (spec Success Criteria SC-003).

## Validation

Run a referential-integrity check (script or manual JSON inspection) confirming:

```
Every roles[].required_competencies[].competency_id           exists in competencies.json
Every competencies[].parent_competency_id (if set)             exists in competencies.json, no cycles
Every courses[].competencies_covered[].competency_id            exists in competencies.json
Every assessment_seed[].competency_id                            exists in competencies.json
Every role's required competency has >= 1 covering course
Every role's required competency has >= 1 seed question
```

## Expected Outcome

Four JSON files under `data/curated/` matching `data-model.md`'s shapes, with zero dangling references,
ready for Task 2 to seed into PostgreSQL.
