---
description: "Task list for Task 0 — Environment & Repository Setup"
---

# Tasks: Task 0 — Environment & Repository Setup

**Input**: Design documents from `/specs/001-task-0-environment-setup/`
**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Tests**: Not requested for this phase — it is a verification script, self-validating on each run.

**Organization**: Single user story (P1) — this phase has no sub-stories to parallelize across.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup (Shared Infrastructure)

- [X] T001 Create a Python virtual environment at `.venv/` for the backend (`python -m venv .venv`)
- [X] T002 Create `requirements.txt` at repo root listing the frozen backend stack (FastAPI, Pydantic,
      SQLAlchemy, psycopg, pandas, sentence-transformers, mistralai, pypdf, python-docx, pytest, httpx)
      per `total_buildplan.md` §6
- [X] T003 Install `requirements.txt` into `.venv/`
- [X] T004 Relocate the already-present local resources into the paths `total_mvp_context.md` §2 expects:
      move `hfm/data/` → `data/` and `hfm/models/` → `models/` at repo root, then remove the now-empty
      `hfm/` directory
- [X] T004a Create `docker-compose.yml` running PostgreSQL 16 in Docker (host port 5433, to avoid
      clashing with another Postgres container already on the machine) since a native install would need
      elevated/system-level changes this phase avoids; bring it up with `docker compose up -d` and point
      `DATABASE_URL` in `.env`/`.env.example` at it

## Phase 2: Foundational (Blocking Prerequisites)

*(None — Task 0 has no dependency on any other phase; it is the first phase.)*

## Phase 3: User Story 1 - Confirm the Machine Is Ready to Build On (Priority: P1) 🎯 MVP

**Goal**: A developer can determine, within 5 minutes, whether every tool/resource the rest of the build
depends on is present and working, with a clear itemized pass/fail result.

**Independent Test**: Run `scripts/verify_env.py` and confirm it reports one pass/fail line per required
tool/resource (FR-001..FR-008), with no secret value ever printed.

### Implementation for User Story 1

- [X] T005 [US1] Create `scripts/verify_env.py`: check Python/Node/npm/Git versions (FR-001) in
      `scripts/verify_env.py`
- [X] T006 [US1] Add PostgreSQL check to `scripts/verify_env.py`: TCP-connect to `DATABASE_URL`'s
      host:port as the authoritative reachability check (works identically whether Postgres runs
      natively or, as this project does, via Docker), with the native `psql` CLI reported separately as
      an optional convenience, never a blocker
- [X] T007 [US1] Add `.env`/`.env.example` handling to `scripts/verify_env.py`: create `.env` from
      `.env.example` only if `.env` is missing (FR-008), verify `MISTRAL_API_KEY` is present and
      non-placeholder without ever printing its value (FR-002/SC-003)
- [X] T008 [P] [US1] Create `.env.example` at repo root with placeholder values for every required
      environment variable (FR-005)
- [X] T009 [P] [US1] Create `.gitignore` at repo root excluding `.env` from version control (FR-006)
- [X] T010 [US1] Add MiniLM model presence check to `scripts/verify_env.py`: verify
      `models/all-MiniLM-L6-v2/` exists and is non-empty, never attempting a download (FR-003)
- [X] T011 [US1] Add ESCO files presence check to `scripts/verify_env.py`: verify all four active files
      (`occupations_en.csv`, `skills_en.csv`, `occupationSkillRelations_en.csv`, `skillsHierarchy_en.csv`)
      exist under `data/raw/esco/`, naming any specific missing file(s) (FR-004)
- [X] T012 [US1] Wire all checks in `scripts/verify_env.py` into one itemized pass/fail report (FR-007)
      with a non-zero exit code on any failure
- [X] T013 [US1] Run `scripts/verify_env.py` with the `.venv` interpreter and confirm the report is
      itemized and legible (Windows console encoding fix included)

**Checkpoint**: Task 0 is complete and self-verifying — ready for Task 1 (Data Foundation), which reads
the confirmed `data/raw/esco/` files.

---

## Dependencies & Execution Order

- Phase 1 (Setup) has no dependencies — done first.
- Phase 3 (User Story 1) depends on Phase 1's venv/requirements only for running the script with the
  project's own interpreter; the script itself has no runtime dependency beyond the Python standard
  library, so it would also run correctly outside the venv.
- T008/T009 are `[P]` — independent files, no shared state with the rest of Phase 3.

## Implementation Strategy

### MVP (this phase's only scope)

1. Complete Phase 1 (venv, requirements, resource relocation).
2. Complete Phase 3 (verification script, `.env.example`, `.gitignore`).
3. Run `scripts/verify_env.py`. Remaining `FAIL` lines (missing `MISTRAL_API_KEY` value, PostgreSQL not
   installed) are expected to require developer action outside this script's scope, per spec Assumptions
   ("this task does not install missing tools automatically").
4. **STOP** — Task 0 is done once the script itself runs cleanly and reports every check; it does not
   block on every check passing, since a secret value and a system service install are legitimately
   outside an automated script's authority to fill in.

## Notes

- No test tasks were generated — the verification script is inherently self-testing (its own output is
  the pass/fail signal), and Task 0 introduces no application code that would need unit tests.
- `PostgreSQL install` and `MISTRAL_API_KEY value` are left as explicit, developer-actionable FAILs in the
  script's report, not fixed automatically, per this phase's Assumptions section.
