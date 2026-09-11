# Implementation Plan: Task 0 — Environment & Repository Setup

**Branch**: `001-task-0-environment-setup` | **Date**: 2026-09-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-task-0-environment-setup/spec.md`

## Summary

A single verification pass (script or checklist) confirming Python, Node, npm, PostgreSQL, Git, the
Mistral API key, the local MiniLM model, and the four active ESCO files are all present, plus creation of
`.env`/`.env.example`. This unblocks every later phase (`total_buildplan.md` §25: Task 0 → Task 1 → …).
No architecture decision is made here — it only confirms the frozen stack's prerequisites exist.

## Technical Context

**Language/Version**: Shell/PowerShell (or a short Python script) — whichever runs with zero extra
dependencies, since nothing else is installed yet.

**Primary Dependencies**: None beyond the OS shell; the script itself must not require `pip install`
anything, since it exists to verify Python/pip are even present.

**Storage**: N/A — reads `.env`, `data/raw/esco/`, `models/all-MiniLM-L6-v2/` on disk; writes nothing but
`.env` (only if absent, copied from `.env.example`).

**Testing**: Manual run + visual confirmation of itemized pass/fail output; no automated test suite
justified for a one-time setup script at this scale.

**Target Platform**: Developer/demo machine (Windows, per this repository's environment) — commands must
work under PowerShell.

**Project Type**: Single setup script/checklist at repository root — not part of `backend/` or
`frontend/` source trees.

**Performance Goals**: N/A (run once, human-interactive).

**Constraints**: Must never print the Mistral API key value. Must never overwrite an existing `.env`.
Must not attempt to download ESCO files or the MiniLM model — only verify presence (`CLAUDE.md` Rule 7).

**Scale/Scope**: One-time setup for a single developer machine; not a multi-environment provisioning tool.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` is unfilled template boilerplate for this project; `CLAUDE.md` is used
as the binding rulebook gate instead.

| Rule | Gate | Status |
|------|------|--------|
| Rule 7 — Use existing local resources | Plan only verifies presence of MiniLM/ESCO, never downloads | PASS |
| "Do not commit secrets" | `.env` stays local + gitignored, `.env.example` has placeholders only | PASS |
| Rule 2 — No architecture redesign | No architecture decisions made in this phase | PASS |
| "PostgreSQL only" | Running Postgres via Docker instead of a native install is still one PostgreSQL database, no second datastore | PASS |

No violations — Complexity Tracking table is not needed.

## Project Structure

### Documentation (this feature)

```text
specs/001-task-0-environment-setup/
├── plan.md              # This file
└── checklists/
    └── requirements.md
```

Phase 0 (research.md) and Phase 1 (data-model.md, contracts/, quickstart.md) artifacts are intentionally
omitted for this phase: there are no unresolved technical unknowns to research, and no data model or API
surface is introduced by an environment-verification task. A `quickstart.md` would simply restate the
Acceptance Scenarios already in `spec.md`, so it is skipped per the "scale to relevance" decision for
this per-phase planning pass.

### Source Code (repository root)

```text
.env.example        # committed, placeholder values for MISTRAL_API_KEY, DATABASE_URL, etc.
.env                 # local only, gitignored
scripts/
└── verify_env.ps1   # or verify_env.py — itemized pass/fail check for Task 0's FR-001..FR-008
```

**Structure Decision**: A single small verification script at repository root (`scripts/verify_env.ps1`
or `.py`), run once before Task 1 begins. It is not part of `backend/` or `frontend/` since it predates
both being functional, and it is not reused as a runtime health check (that's `GET /health` in Task 3).

## Complexity Tracking

*No Constitution Check violations — table intentionally left empty.*
