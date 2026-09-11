# Feature Specification: Task 0 — Environment & Repository Setup

**Feature Branch**: `001-task-0-environment-setup`

**Created**: 2026-09-11

**Status**: Draft

**Input**: Task 0 from `total_buildplan.md` §24: "Verify: Python, Node, npm, PostgreSQL, Mistral API key,
local MiniLM model, ESCO files, Git. Create `.env` / `.env.example`."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Confirm the Machine Is Ready to Build On (Priority: P1)

A developer (or an agent picking up the project) starts work on the MVP and needs certainty, in minutes,
that every tool and credential the rest of the build depends on is present and working — before spending
any of the ~13-hour budget on Task 1 onward.

**Why this priority**: Every other phase depends on this one being correct (`total_buildplan.md` §25:
Task 0 → Task 1 → ...). A missing dependency discovered mid-Task-4 wastes far more time than checking now.

**Independent Test**: Can be fully tested by running the verification checks and confirming each required
tool/resource reports present and the correct version, with no code from later phases involved.

**Acceptance Scenarios**:

1. **Given** a fresh clone of the repository, **When** the developer runs the environment verification
   step, **Then** the system reports the installed versions of Python, Node, npm, PostgreSQL, and Git, and
   flags any that are missing or below the minimum required version.
2. **Given** the verification step, **When** it checks for the Mistral API key, **Then** it confirms a
   `.env` file exists with a non-empty key value without printing the key itself, and fails clearly if the
   key is absent.
3. **Given** the verification step, **When** it checks local resources, **Then** it confirms
   `models/all-MiniLM-L6-v2/` and the four active ESCO files under `data/raw/esco/` are present on disk,
   without attempting to download anything.
4. **Given** no `.env` file exists yet, **When** the developer runs setup, **Then** the system creates
   `.env` from `.env.example` (or reports that `.env.example` itself is missing) rather than failing
   silently.

### Edge Cases

- What happens when PostgreSQL is not reachable at the configured `DATABASE_URL` (whether because a
  native install isn't running, or a Docker container hasn't been started)? → Verification must report
  it as not-reachable with a concrete next step (e.g. `docker compose up -d`), not a generic failure.
- What happens when the Mistral API key is present but invalid/expired? → Out of scope for Task 0 (a live
  API call is Task 4's concern); Task 0 only confirms the key value is present and non-empty in `.env`.
- What happens when one of the four required ESCO files is missing but others are present? → Verification
  must name the specific missing file(s), not just report a generic failure.
- What happens when `.env` already exists and already has real values? → Setup must never overwrite an
  existing `.env` with `.env.example` placeholders.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST verify that Python, Node.js, npm, and Git are installed and report each one's
  version, and MUST verify that a PostgreSQL server is reachable at the configured `DATABASE_URL` —
  whichever way it is run (a native install or, as this project uses via `docker-compose.yml`, a Docker
  container); the check is about reachability, not about how PostgreSQL happens to be running.
- **FR-002**: System MUST verify that a `.env` file exists at the repository root and contains a non-empty
  Mistral API key value, without ever printing or logging the key's value.
- **FR-003**: System MUST verify that `models/all-MiniLM-L6-v2/` exists on disk and MUST NOT attempt to
  download it or any alternative model.
- **FR-004**: System MUST verify that all four active ESCO files
  (`occupations_en.csv`, `skills_en.csv`, `occupationSkillRelations_en.csv`, `skillsHierarchy_en.csv`)
  exist under `data/raw/esco/`, and MUST NOT require any other ESCO file to be present.
- **FR-005**: System MUST provide an `.env.example` file with placeholder values for every required
  environment variable, committed to the repository.
- **FR-006**: System MUST ensure `.env` is excluded from version control (present in `.gitignore`).
- **FR-007**: System MUST report a clear, itemized pass/fail result for each verification check rather
  than a single opaque success/failure signal, so a failure points directly at what to fix.
- **FR-008**: System MUST NOT modify or overwrite an existing `.env` file's values during verification.

### Key Entities

- **Environment Check Result**: One item per verified dependency/resource (tool name, required vs. found
  version or presence, pass/fail status).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A developer can determine, within 5 minutes of cloning the repository, whether the machine
  is fully ready for Task 1, with zero ambiguity about what (if anything) is missing.
- **SC-002**: 100% of the required tools/resources (Python, Node, npm, PostgreSQL, Git, Mistral key,
  MiniLM model, four ESCO files, `.env`/`.env.example`) are checked, with no required item silently
  skipped.
- **SC-003**: No secret value is ever printed to console, logs, or committed to version control during
  or as a result of this verification.

## Assumptions

- "Verify" means a scripted or manually-run checklist executed once at the start of the build, not a
  continuously-running health check (that responsibility belongs to the `GET /health` endpoint in Task 3).
- Minimum versions are whatever the chosen backend/frontend stacks in later phases require (Python 3.11+,
  a current Node LTS); this task does not pin exact versions beyond "present and reasonably current."
- This phase does not install missing tools automatically — it reports what's missing and lets the
  developer install it, to avoid unexpected system-level side effects during a time-boxed hackathon.
- PostgreSQL runs via Docker (`docker-compose.yml`, `postgres:16`, mapped to host port 5433 to avoid
  clashing with any other Postgres container already on the machine) rather than a native install — this
  is not a second database technology (still PostgreSQL only, per `CLAUDE.md`), just a different way of
  running the one required database, chosen because Docker was already available on this machine and a
  native install would have needed elevated/system-level changes this phase deliberately avoids.
