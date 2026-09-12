# Implementation Plan: Phase 1 — Resume Intelligence

**Branch**: `021-phase-1-resume-intelligence` | **Date**: 2026-09-12 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/021-phase-1-resume-intelligence/spec.md`

## Summary

Confirm and complete the existing resume→profile pipeline
(`backend/src/services/resume_extraction.py`, `backend/src/services/mistral_client.py`'s resume
extraction path, `backend/src/services/competency_mapping.py`, `backend/src/api/candidates.py`).
This session's audit already confirmed the pipeline's current behavior is correct (clean 422 on
LLM failure, correct unmapped-term handling) — this phase's remaining work is targeted testing
across varied resume content (FR-002/FR-003/SC-001/SC-002), not a rebuild.

## Technical Context

**Language/Version**: Python 3.12, unchanged. **Primary Dependencies**: existing —
`mistralai`, `sentence-transformers` (all-MiniLM-L6-v2), `pypdf`, `python-docx`. No new
dependencies. **Storage**: PostgreSQL, unchanged (`Candidate`, `CandidateSkill` tables). **Testing**:
`pytest` for `competency_mapping.py`'s deterministic matcher (already testable in isolation, no
DB/LLM needed) + live `curl` upload tests with varied real resume files. **Target Platform**:
unchanged. **Project Type**: no new project — targeted test additions and, if audit finds gaps,
small fixes to existing files only. **Performance Goals**: unchanged. **Constraints**: no
architecture changes (Rule 3); MiniLM used as-is (Rule 8). **Scale/Scope**: one existing pipeline,
confirm/complete only.

## Constitution Check

No project constitution ratified. Operative constraints: `CLAUDE.md` Rule 5 (validate all LLM
output), Rule 3 (preserve working code). No violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/021-phase-1-resume-intelligence/
├── plan.md              # This file
├── quickstart.md         # This command's output
└── tasks.md              # /speckit-tasks output (not created by this command)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── api/candidates.py                # existing — confirm only, fix only if audit finds a gap
│   ├── services/resume_extraction.py    # existing — confirm only
│   ├── services/mistral_client.py       # existing — confirm only (resume-extraction path)
│   └── services/competency_mapping.py   # existing — confirm only
└── tests/
    └── test_competency_mapping.py       # NEW (if not already present) — unit tests for the
                                            deterministic exact/alias/substring/MiniLM-fallback
                                            matcher, covering FR-002/SC-002's "never silently
                                            discard" requirement in isolation from the DB/LLM
```

**Structure Decision**: No new backend package. This phase's only net-new artifact is a focused
unit-test file for the already-existing deterministic mapper, plus whatever targeted fixes the
live-resume test batch in `quickstart.md` surfaces (expected: none, based on this session's audit,
but not assumed without running the batch).

## Complexity Tracking

None — no new dependencies or infrastructure.
