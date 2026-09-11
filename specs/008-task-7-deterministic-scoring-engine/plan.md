# Implementation Plan: Task 7 — Deterministic Scoring Engine

**Branch**: `008-task-7-deterministic-scoring-engine` | **Date**: 2026-09-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/008-task-7-deterministic-scoring-engine/spec.md`

## Summary

Implement the pure, deterministic scoring function `competency_score = weighted_correctness +
difficulty_adjustment + resume_evidence_contribution` (`total_buildplan.md` §9) that turns Task 4's
resume evidence and Task 6's assessment evidence into a persisted `verified_skill_scores` row per
competency, with assessment weighted above resume. No Mistral call in this phase at all.

## Technical Context

**Language/Version**: Python 3.11+, pure functions (no FastAPI-specific logic needed beyond exposing the
result).

**Primary Dependencies**: None beyond what Tasks 2/4/6 already provide (`candidate_skills`,
`skill_evidence` rows as input).

**Storage**: PostgreSQL — reads `candidate_skills` and `skill_evidence`, writes `verified_skill_scores`
(Task 2's schema).

**Testing**: Unit tests for the scoring function itself (pure, no DB/HTTP needed) covering: assessment-
only, resume-only, both, neither (should not appear), and a reproducibility test (same input twice →
identical output).

**Target Platform**: Backend service, invoked synchronously after a session update or on profile request.

**Project Type**: Backend service module (`backend/src/services/scoring_engine.py`).

**Performance Goals**: Under 1 second (spec SC-003) — pure computation, no external calls.

**Constraints**: Formula is deterministic, no randomness (FR-004); Mistral never touches the score
(FR-002, Rule 6); assessment term must structurally dominate resume term (FR-003).

**Scale/Scope**: One computation per competency per candidate/session, at assessment-session scale
(~8–12 competencies typically assessed).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` is unfilled boilerplate; `CLAUDE.md` is the binding rulebook gate.

| Rule | Gate | Status |
|------|------|--------|
| Rule 6 — Deterministic scoring | Backend-only pure function, no LLM involvement | PASS |
| Rule 4 — Mistral boundaries | Confirmed: zero Mistral calls in this phase | PASS |
| Rule 9 — Test continuously | Unit tests specified for all evidence-combination cases | PASS |

No violations — Complexity Tracking table is not needed.

## Project Structure

### Documentation (this feature)

```text
specs/008-task-7-deterministic-scoring-engine/
├── plan.md              # This file
├── research.md           # Phase 0 output — the weighting formula's concrete constants and rationale
├── contracts/
│   └── api.md             # Phase 1 output — how verified scores surface in the assessment profile response
└── checklists/
    └── requirements.md
```

`data-model.md` is omitted: this phase only writes to `verified_skill_scores`, already fully specified in
Task 2's `data-model.md`. `quickstart.md` is folded into `contracts/api.md` since verification is a
single before/after comparison, not a multi-step scenario.

### Source Code (repository root)

```text
backend/
└── src/
    └── services/
        └── scoring_engine.py    # compute_verified_score(resume_evidence, assessment_evidence) -> VerifiedSkillScore
```

**Structure Decision**: A standalone, dependency-free service function so it can be unit-tested without
spinning up FastAPI or a database connection — directly supporting Rule 9's "test continuously" and the
reproducibility requirement (FR-004/SC-002). `GET /assessment/{session_id}/profile` (Task 6) is extended
to call this function and include its output, rather than introducing a separate new endpoint.

## Complexity Tracking

*No Constitution Check violations — table intentionally left empty.*
