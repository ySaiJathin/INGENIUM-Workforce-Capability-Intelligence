# Feature Specification: Task 2 — Database Foundation

**Feature Branch**: `003-task-2-database-foundation`

**Created**: 2026-09-11

**Status**: Draft

**Input**: Task 2 from `total_buildplan.md` §24: "Create PostgreSQL schema (§6), add indexes, seed
curated data, verify connectivity."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Give the Backend a Working, Seeded Database to Build On (Priority: P1)

A developer creates the PostgreSQL schema covering candidates, roles, competencies, role-competency
requirements, candidate skills, assessments, questions, answers, skill evidence, skill gaps, courses,
course-competency mappings, and learning paths, then seeds it with the curated data from Task 1, and
confirms the backend can connect and query successfully — before any API endpoint is written.

**Why this priority**: Task 3 onward (every API endpoint and engine) reads from and writes to this
database; nothing else can be built or tested until it exists and is reachable
(`total_buildplan.md` §25: Task 1 → Task 2 → Task 3).

**Independent Test**: Can be fully tested by connecting to the database with a query tool, confirming
every required table exists with the expected columns/indexes, and confirming the curated roles,
competencies, and courses from Task 1 are present as rows — independently of any FastAPI code.

**Acceptance Scenarios**:

1. **Given** an empty PostgreSQL instance, **When** the schema migration/creation runs, **Then** every
   table listed in `total_buildplan.md` §6 (`candidates, roles, competencies, role_competencies,
   candidate_skills, assessments, questions, answers, skill_evidence, skill_gaps, courses,
   course_competencies, learning_paths`) exists with appropriate primary keys, foreign keys, and indexes
   on every field used in a WHERE/JOIN for gap and recommendation queries.
2. **Given** the created schema, **When** the seed step runs, **Then** the roles, competencies, and
   courses from Task 1's curated JSON files are loaded as rows, with all foreign keys resolving
   correctly. (`assessment_seed.json` is read directly from disk by Task 6's fallback logic, keyed by
   competency id — it is reference/config data for that lookup, not database state, so it is not loaded
   as rows here; see Assumptions.)
3. **Given** the seeded database, **When** a connectivity check runs, **Then** it confirms the backend can
   open a connection, run a simple query, and get the expected row counts back.
4. **Given** the seed step is run a second time against an already-seeded database, **When** it completes,
   **Then** it does not create duplicate rows (idempotent seeding).

### Edge Cases

- What happens when the seed step is run against a database that already has candidate/assessment data
  (not just reference data)? → Seeding must only touch reference tables (roles, competencies, courses)
  and must never delete or duplicate candidate-generated data.
- What happens when PostgreSQL is unreachable during seeding? → The process must fail with a clear error
  naming the connection problem, not a silent no-op or a stack trace with no explanation.
- What happens when a curated JSON file from Task 1 has a referential-integrity problem that slipped
  through? → Seeding must fail loudly on the specific bad reference rather than silently skipping rows.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST create a PostgreSQL schema with, at minimum, the tables: `candidates`, `roles`,
  `competencies`, `role_competencies`, `candidate_skills`, `assessments`, `questions`, `answers`,
  `skill_evidence`, `skill_gaps`, `courses`, `course_competencies`, `learning_paths`.
- **FR-002**: System MUST define appropriate primary keys and foreign keys expressing the relationships
  between these tables (e.g. `role_competencies` links `roles` and `competencies`).
- **FR-003**: System MUST add indexes on every field used in a WHERE or JOIN clause by the gap-analysis
  and course-recommendation queries (at minimum: role id, competency id, candidate id, session id foreign
  keys).
- **FR-004**: System MUST seed the schema with the curated roles, competencies, and courses produced in
  Task 1 (including their `role_competencies`/`course_competencies` join rows), preserving all
  cross-references. `assessment_seed.json` is intentionally not loaded into the database — see
  Assumptions.
- **FR-005**: System MUST make seeding idempotent — re-running it must not create duplicate reference
  rows.
- **FR-006**: System MUST provide a connectivity/health check confirming the backend can connect to
  PostgreSQL and execute a query successfully.
- **FR-007**: System MUST use PostgreSQL exclusively — no second database technology is introduced.
- **FR-008**: System MUST use parameterized queries/statements for all seeding and schema operations —
  never string-interpolated SQL.
- **FR-009**: System MUST fail loudly and specifically (naming the table/row/constraint involved) when a
  seed row violates a foreign-key or referential-integrity constraint, rather than silently dropping it.

### Key Entities

See `total_buildplan.md` §6 minimum table list; the concrete field-level schema for each table is
finalized in this feature's own `data-model.md` (Phase 1 plan output), reusing the entity definitions
already established for roles/competencies/courses in Task 1's `data-model.md` and extending them with
the candidate/assessment/scoring/gap/recommendation tables that Task 2 is responsible for creating.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every table listed in FR-001 exists in the database with zero missing tables or columns
  when checked against the schema definition.
- **SC-002**: 100% of curated reference data from Task 1 loaded into the database (all roles,
  competencies, courses) is present as rows after seeding, with zero dangling foreign keys.
- **SC-003**: Running the seed step twice in a row results in the same row counts as running it once.
- **SC-004**: A connectivity check completes successfully in under 2 seconds on a local developer machine.

## Assumptions

- Schema management uses whatever migration approach is fastest to implement reliably within the
  timeline (a single SQL DDL script or a lightweight migration tool) — no formal migration-versioning
  system is required for a single-environment hackathon build.
- "Seed curated data" only loads Task 1's database-backed reference data (roles, competencies, courses,
  and their join tables); it never generates fake candidates, assessments, or scores — those are created
  only by real usage in later phases.
- `assessment_seed.json` is deliberately excluded from this seeding step: it has no corresponding table
  in this feature's `data-model.md` (there is no `assessment_seed_questions` table, only the runtime
  `questions` table that Task 6 populates per session). It functions as static lookup/config data for
  Task 6's Mistral-failure fallback, read directly from `data/curated/assessment_seed.json` by
  competency id, rather than as application state that benefits from living in PostgreSQL — avoiding an
  extra table whose only purpose would be mirroring a file already on disk (Rule 13).
- The database runs locally on the same machine as the backend for the demo; no remote/managed database
  provisioning is in scope.
