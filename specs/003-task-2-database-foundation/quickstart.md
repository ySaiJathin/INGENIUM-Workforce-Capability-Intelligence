# Quickstart: Task 2 — Database Foundation

## Prerequisites

- Task 0 complete (PostgreSQL installed and running, `.env` has `DATABASE_URL`).
- Task 1 complete (`data/curated/roles.json`, `competencies.json`, `courses.json`, `assessment_seed.json`
  exist and pass their own referential-integrity check).

## Steps

1. Create the database (if it doesn't exist) and run the schema/migration script to create all tables
   listed in `data-model.md`, with their primary keys, foreign keys, and indexes.
2. Run `seed_reference_data.py` (or equivalent) to load `competencies`, `roles`, `role_competencies`,
   `courses`, `course_competencies` from Task 1's curated JSON.
3. Run it a second time immediately and confirm row counts are unchanged (idempotency, spec SC-003).
4. Run a connectivity check: open a connection, `SELECT count(*) FROM roles`, `SELECT count(*) FROM
   competencies`, `SELECT count(*) FROM courses`, confirm each matches the curated file's entry count.

## Validation

```sql
-- zero dangling role→competency references
SELECT rc.role_id, rc.competency_id FROM role_competencies rc
LEFT JOIN competencies c ON c.id = rc.competency_id WHERE c.id IS NULL;
-- expect 0 rows

-- zero dangling course→competency references
SELECT cc.course_id, cc.competency_id FROM course_competencies cc
LEFT JOIN competencies c ON c.id = cc.competency_id WHERE c.id IS NULL;
-- expect 0 rows
```

## Expected Outcome

A running PostgreSQL database with every table from `data-model.md` present, all reference data from
Task 1 loaded with zero dangling foreign keys, and a connectivity check completing in under 2 seconds —
ready for Task 3's API layer to read from.
