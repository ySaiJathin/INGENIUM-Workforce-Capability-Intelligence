# Implementation Plan: Phase 0 — Diagnose + Stabilize

**Branch**: `020-phase-0-diagnose-stabilize` | **Date**: 2026-09-12 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/020-phase-0-diagnose-stabilize/spec.md`

## Summary

Produce an honest, live-verified diagnosis of the existing system and fix any found breakage
before Phases 1-7 build on top of it. This session already ran the core of this phase: full golden
path verified live via curl against real running code (demo candidate → target role → assessment →
profile → analysis → gaps → courses → learning path), and found + worked around one real defect —
a Docker-deployed backend container built from stale code (missing a fix already present in
`candidates.py`'s source). Remaining work is closing that discrepancy properly (not just working
around it) and confirming the invalid-upload error paths.

## Technical Context

**Language/Version**: Python 3.12 (backend), unchanged. **Primary Dependencies**: none new for
this phase — no code changes to application logic, only deployment/verification. **Storage**:
PostgreSQL, unchanged. **Testing**: direct `curl`/API verification, run by this session (or any
future session with shell access) against the live backend — no developer-relay needed.
**Target Platform**: local dev (Windows), Docker for Postgres, backend via `uvicorn` from source
(current sanctioned path, pending this phase's own decision below) or a corrected Docker image.
**Project Type**: no new project — this phase touches only deployment configuration
(`Dockerfile`/`docker-compose.yml` or `README.md`) and verification, not `backend/src/`.
**Performance Goals**: N/A (verification phase). **Constraints**: no code changes to working
engines (Rule 3). **Scale/Scope**: whole-repository audit, deployment-configuration fix only.

## Constitution Check

No project constitution ratified (`.specify/memory/constitution.md` is the unfilled template).
Operative constraints are `CLAUDE.md`'s rules (Rule 3 preserve working code, Rule 9 test
continuously, Rule 4 no silent failures) — this plan follows them; no violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/020-phase-0-diagnose-stabilize/
├── plan.md              # This file
├── quickstart.md        # This command's output — verification script
└── tasks.md             # /speckit-tasks output (not created by this command)
```

### Source Code (repository root)

```text
# No backend/src/ changes. Deployment-configuration only:
Dockerfile                # NEW or confirmed-absent-and-documented — see research decision below
docker-compose.yml         # possibly extended with a backend service, or left postgres-only with
                            # README.md documenting `uvicorn` from source as the sanctioned path
README.md                  # updated if the uvicorn-from-source path is the chosen resolution
```

**Structure Decision**: This phase makes no application-code changes — it is a verification pass
plus a deployment-configuration decision (research question: fix the missing `Dockerfile`, or
formally adopt `uvicorn` from source as the dev path). Whichever is chosen, it must be reflected
consistently in `README.md` so no future session re-discovers the same ambiguity this session did.

## Research Decision (inline — single question, no separate research.md needed)

**Decision**: Adopt `uvicorn` run directly from source (as `README.md` already documents) as the
sanctioned local dev/verification path for the remainder of this project, rather than investing in
reconstructing a backend `Dockerfile`. **Rationale**: A `Dockerfile` never existed in the committed
repo for the backend service — the stale image this session found was built ad hoc outside version
control. Given time constraints (hackathon MVP) and that the source-run path is already documented
and already proven to work (this session verified health/DB/golden-path against it), reconstructing
a backend Docker image is P1 polish, not a P0 blocker. **Alternative considered**: write a new
`Dockerfile` + compose service now — rejected for this phase as unnecessary scope given a working,
documented alternative already exists; may be revisited under Phase 7 if time remains.

## Complexity Tracking

None — this phase adds no new dependencies or infrastructure.
