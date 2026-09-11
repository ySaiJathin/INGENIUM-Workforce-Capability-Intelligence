# Feature Specification: Task 3 — Backend API Foundation

**Feature Branch**: `004-task-3-backend-api-foundation`

**Created**: 2026-09-11

**Status**: Draft

**Input**: Task 3 from `total_buildplan.md` §24: "`GET /health`, `/roles`, `/roles/{id}`,
`/competencies`, `/courses`. Keep APIs small and focused. Then candidate endpoints."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Query Reference Data Over a Stable API (Priority: P1)

A developer (verifying via `curl`/httpie) or, later, the frontend needs to retrieve the platform's
health status and its curated reference data — roles, a single role's detail, competencies, and courses —
through a small set of read-only API endpoints, before any candidate-specific logic is built.

**Why this priority**: This is the first API surface exposed; Tasks 4–10 build candidate/assessment/
scoring/gap/recommendation endpoints on top of the same FastAPI app, and the frontend (Task 11+) cannot
start until endpoints like these return real, non-mock data (Rule 11).

**Independent Test**: Can be fully tested with `curl`/httpie alone — no browser, no frontend — by hitting
each endpoint and confirming it returns the expected shape and matches what's in the seeded database.

**Acceptance Scenarios**:

1. **Given** the backend is running and connected to a seeded database, **When** a client calls
   `GET /health`, **Then** it receives a response confirming the service and database connection are up.
2. **Given** the seeded database, **When** a client calls `GET /roles`, **Then** it receives the full list
   of curated roles (5–8) with their id, name, and description.
3. **Given** a valid role id, **When** a client calls `GET /roles/{id}`, **Then** it receives that role's
   full detail including its required competencies and proficiency levels.
4. **Given** an invalid role id, **When** a client calls `GET /roles/{id}`, **Then** it receives a clear
   "not found" response rather than a server error.
5. **Given** the seeded database, **When** a client calls `GET /competencies`, **Then** it receives the
   full list of curated competencies (30–50) with id, name, description, and hierarchy info.
6. **Given** the seeded database, **When** a client calls `GET /courses`, **Then** it receives the full
   list of curated courses (30–50) with id, title, description, and the competencies each covers.

### Edge Cases

- What happens when the database is temporarily unreachable? → `GET /health` must report the failure
  clearly (not crash the process), and other endpoints must return a useful error, not an unhandled
  exception (`total_buildplan.md` §18).
- What happens when the reference tables are empty (seeding hasn't run)? → Endpoints must return an empty
  list, not an error, so the failure mode is visible and diagnosable rather than opaque.
- What happens when a client requests a role id that doesn't exist vs. one that's malformed? → Both must
  return a clear 4xx response distinguishing "not found" from "bad request," never a 5xx.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST expose `GET /health` returning the service status and whether the database
  connection is healthy.
- **FR-002**: System MUST expose `GET /roles` returning every curated role's id, name, and description.
- **FR-003**: System MUST expose `GET /roles/{id}` returning a single role's full detail, including its
  required competencies and their proficiency levels, and MUST return a clear "not found" response for an
  unknown id.
- **FR-004**: System MUST expose `GET /competencies` returning every curated competency's id, name,
  description, and hierarchy relationship (parent, if any).
- **FR-005**: System MUST expose `GET /courses` returning every curated course's id, title, description,
  provider, level, duration, and the competencies it covers.
- **FR-006**: System MUST read all reference data from the database seeded in Task 2 — never from the
  curated JSON files directly at request time, and never invented/fetched from Mistral.
- **FR-007**: System MUST return a well-defined, documented JSON response shape for each endpoint,
  stable enough that the frontend (Task 11+) and other engines can build against it without later
  breaking changes (or, if a field must change, the full consumer-update process in the project's
  standing rules is followed).
- **FR-008**: System MUST NOT require any request body, authentication, or session state for these five
  read-only endpoints — they are open reference-data lookups for the MVP.
- **FR-009**: System MUST respond to malformed or unknown requests with a client error (4xx) rather than
  an unhandled server exception.

### Key Entities

- **Health Status**: overall status, database-connectivity status.
- **Role (API view)**: id, name, description, and (for `/roles/{id}`) required competencies with levels.
- **Competency (API view)**: id, name, description, parent id.
- **Course (API view)**: id, title, description, provider, level, duration, competencies covered.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All five endpoints (`/health`, `/roles`, `/roles/{id}`, `/competencies`, `/courses`) can be
  fully exercised and verified with `curl`/httpie alone, with no frontend code involved.
- **SC-002**: Every curated role, competency, and course from Task 1/2 is retrievable through these
  endpoints with zero missing or mismatched entries.
- **SC-003**: A request for a non-existent role id returns a clear client error in under 500ms, never a
  server crash.
- **SC-004**: Once these endpoints are verified, they remain contractually stable for the rest of the
  build — no field is removed or repurposed without the full consumer-update process.

## Assumptions

- These five endpoints are unauthenticated for the MVP (matches `total_buildplan.md` §22's explicit
  exclusion of production-scale authentication); candidate-specific endpoints in later phases may still
  require a candidate/session id in the path or body, but not a login.
- "Keep APIs small and focused" means each endpoint does exactly one read, with no combined/aggregate
  endpoints introduced at this stage — aggregation (e.g. a full candidate results view) belongs to later,
  candidate-facing phases.
- Response pagination is not required at this catalogue scale (5–8 roles, 30–50 competencies/courses);
  every list endpoint returns its full result set.
