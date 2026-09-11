# Implementation Plan: Task 6 — Adaptive Assessment Engine

**Branch**: `007-task-6-adaptive-assessment-engine` | **Date**: 2026-09-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/007-task-6-adaptive-assessment-engine/spec.md`

## Summary

Implement session lifecycle (`start` → repeated `next-question`/`answer` → `completed`), deterministic
competency-selection routing, Mistral-backed question generation with schema validation + retry + seed
fallback, and per-competency confidence/difficulty state tracking. This is the most complex backend phase
and the direct producer of Task 7's scoring input — it must be solid before Task 7 begins
(`total_buildplan.md` §25: Task 6 → Task 7).

## Technical Context

**Language/Version**: Python 3.11+, FastAPI, Pydantic.

**Primary Dependencies**: `mistral_client.py` (built in Task 4, reused here for question generation),
the curated `assessment_seed.json` (Task 1) as the fallback source.

**Storage**: PostgreSQL — reads/writes `assessments`, `questions`, `answers`, `skill_evidence` (Task 2).

**Testing**: Contract tests for the full start→next-question→answer→…→completed loop against a mocked
Mistral client (both success and forced-failure paths) to prove the seed fallback fires correctly and no
question ever repeats; a separate test asserts routing prioritizes required, low-confidence competencies.

**Target Platform**: Backend FastAPI service.

**Project Type**: Backend web service (`backend/src/api/assessment.py`, `backend/src/services/assessment_engine.py`).

**Performance Goals**: Each `next-question` call should return within a few seconds (dominated by the
Mistral call); `answer` submission and state update are DB-only and should be sub-second.

**Constraints**: No IRT/Bayesian estimation (Rule/§22 non-goal); routing and stop-condition logic are
fully backend-owned and deterministic (Rule 4/6); every Mistral question is schema-validated with retry
+ seed fallback (Rule 5); no identical question repeats in a session (FR-005).

**Scale/Scope**: ~8–12 questions per session, MCQ only.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` is unfilled boilerplate; `CLAUDE.md` is the binding rulebook gate.

| Rule | Gate | Status |
|------|------|--------|
| Rule 5 — Validate all LLM output | Schema validation + 1 retry + seed fallback (FR-003/004) | PASS |
| Rule 4 — Mistral boundaries | Routing/stop-condition decisions are backend-only (FR-002/008) | PASS |
| Non-goal — no IRT/Bayesian psychometrics | Deterministic confidence/difficulty state only | PASS |
| Rule 13 — Performance discipline | No duplicate/regenerated questions (FR-005); small prompts | PASS |
| Rule 9 — Test continuously | Contract tests cover success + forced-Mistral-failure paths | PASS |

No violations — Complexity Tracking table is not needed.

## Project Structure

### Documentation (this feature)

```text
specs/007-task-6-adaptive-assessment-engine/
├── plan.md              # This file
├── research.md           # Phase 0 output — routing algorithm, Mistral question schema, stop condition
├── data-model.md         # Phase 1 output — session/question/evidence state shapes (refines Task 2's tables)
├── contracts/
│   └── api.md             # Phase 1 output — start / next-question / answer / progress endpoints
├── quickstart.md          # Phase 1 output — run a full session end-to-end via curl
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
backend/
└── src/
    ├── api/
    │   └── assessment.py           # POST /assessment/start, GET .../next-question,
    │                                # POST .../answer, GET .../profile
    └── services/
        ├── assessment_engine.py     # session lifecycle, routing, stop condition
        └── mistral_client.py        # (from Task 4) generate_question() added here
```

**Structure Decision**: `assessment_engine.py` owns all routing/state-transition logic so it stays
independently testable without the FastAPI layer (per Rule 9 — test continuously); `mistral_client.py` is
extended, not duplicated, from Task 4's resume-extraction client, since both share the same
validate → retry → fallback discipline.

## Complexity Tracking

*No Constitution Check violations — table intentionally left empty.*
