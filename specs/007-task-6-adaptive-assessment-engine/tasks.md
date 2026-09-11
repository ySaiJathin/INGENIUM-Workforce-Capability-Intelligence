---
description: "Task list for Task 6 — Adaptive Assessment Engine"
---

# Tasks: Task 6 — Adaptive Assessment Engine

**Input**: Design documents from `/specs/007-task-6-adaptive-assessment-engine/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md, quickstart.md

**Tests**: Not explicitly requested; `quickstart.md`'s scripted session run (including a forced-Mistral-
failure step) serves as the verification pass.

**Organization**: Single user story (P1).

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup (Shared Infrastructure)

- [X] T001 [P] Create `backend/src/schemas/assessment.py`: Mistral-facing
      `AdaptiveQuestionResponse` (§27.4 shape: `question_id`, `competency_id`, `competency_name`,
      `difficulty_level`, `question_type`, `question`, `options`, `correct_answer`, `explanation`,
      `assessment_signal`); API-facing `StartAssessmentRequest`/`StartAssessmentResponse`,
      `NextQuestionResponse`, `AnswerRequest`/`AnswerResponse`, `ProfileResponse`/
      `ProfileCompetencyItem` — field names matching `contracts/api.md` exactly
- [X] T002 [P] Load `data/curated/assessment_seed.json` once at module import in a new
      `backend/src/services/seed_questions.py`, indexed by `competency_id` — this is the static
      lookup table Task 6's fallback reads (spec §003's Assumptions: intentionally not a DB table)

## Phase 2: Foundational (Blocking Prerequisites)

- [X] T003 Add `generate_question()` to `backend/src/services/mistral_client.py`: Operation-C system
      prompt (§27.4) + shared `BASE_RULES` (already built in Task 4), input = candidate's current
      competency state, target competency, requested difficulty, previous question texts in this
      session (to avoid repeats), retry-once-then-raise (same discipline as
      `extract_resume_skills()`) — returns a validated `AdaptiveQuestionResponse`

## Phase 3: User Story 1 - Take an Adaptive Assessment That Verifies My Competencies (Priority: P1) 🎯 MVP

**Goal**: A full session — start → repeated next-question/answer → completed — runs via the four
contract endpoints, adaptively routing, never repeating a question, surviving Mistral failures via seed
fallback, and producing a per-competency evidence profile for Task 7.

**Independent Test**: Run `quickstart.md` start to finish, including the forced-Mistral-failure step.

### Implementation for User Story 1

- [X] T004 [US1] Create `backend/src/services/assessment_engine.py` — routing
      (`select_next_competency`, research.md §1: uncertainty score
      `(1 - confidence_state) * priority_weight`, ties broken by lowest `questions_answered`) and
      state constants (`QUESTION_BUDGET=10`, `CONFIDENCE_THRESHOLD=0.75`,
      `MAX_QUESTIONS_PER_COMPETENCY=3`, `START_DIFFICULTY=2`, `MAX_DIFFICULTY=5`)
- [X] T005 [US1] Add `start_session()` to `assessment_engine.py`: create an `AssessmentSession` row
      (`status=in_progress`, `question_budget=10`) and one `SkillEvidence` row per role-required
      competency (`confidence_state=0`, `avg_difficulty=2`, `questions_answered=0`) (FR-001,
      data-model.md's `start` transition)
- [X] T006 [US1] Add `get_next_question()` to `assessment_engine.py`: select the competency
      (T004's routing) → call `mistral_client.generate_question()` with one retry → on second failure,
      fall back to `seed_questions.py` (research.md §5: closest-difficulty match for that competency,
      excluding already-used seeds this session; if none left, any unused seed for the role) → validate
      the returned `competency_id` against the backend's own ids and `correct_answer` against
      `options` (research.md §4's reconciliation: `correct_answer_index = options.index(correct_answer)`)
      → reject on no-match (retried as a validation failure) → persist a `Question` row
      (`source="mistral"` or `"seed"`) → return it (FR-002/FR-003/FR-004/FR-005)
- [X] T007 [US1] Add `submit_answer()` to `assessment_engine.py`: reject if the `question_id` already
      has an `Answer` row for this session, or doesn't belong to this session (409, FR-009) → compute
      `is_correct` server-side (`selected_index == correct_answer_index`) → persist the `Answer` row →
      update that competency's `SkillEvidence` (research.md §2: correct → difficulty+1 capped at 5,
      confidence+0.35; incorrect → same difficulty, confidence+0.15) → recompute `resolved` → mark the
      session `completed` if every required competency is resolved or the budget is exhausted (FR-006/
      FR-007/FR-008)
- [X] T008 [US1] Add `get_profile()` to `assessment_engine.py`: return every required competency's
      `SkillEvidence` row for the session (FR-010, data-model.md's `profile` transition)
- [X] T009 [US1] Create `backend/src/api/assessment.py`: `POST /assessment/start`,
      `GET /assessment/{session_id}/next-question` (returns `{"status":"completed",...}` per
      `contracts/api.md` once resolved), `POST /assessment/{session_id}/answer`,
      `GET /assessment/{session_id}/profile` — thin wrappers over `assessment_engine.py`, translating
      its results into the exact `contracts/api.md` response shapes
- [X] T010 [US1] Register the `assessment` router in `backend/src/main.py`
- [X] T011 [US1] Run `quickstart.md` steps 1–5 against the live server: full session to completion, no
      repeated question text, forced-Mistral-failure step confirming `"source":"seed"` and no error,
      duplicate-answer 409, and a profile with every required competency's `confidence_state` (SC-001
      through SC-004)

**Checkpoint**: Task 6 is complete — the adaptive assessment engine is live and resilient, producing the
per-competency evidence Task 7's scoring engine consumes next.

---

## Dependencies & Execution Order

- T001/T002 are `[P]` — independent files.
- T003 depends on T001 (uses `AdaptiveQuestionResponse`).
- T004 has no dependency beyond Task 2's existing models.
- T005 depends on T004 (uses its constants).
- T006 depends on T003 (Mistral call), T002 (seed fallback), T004 (routing) — the most-connected task.
- T007 depends on T004 (constants/adjustment rule).
- T008 depends on nothing beyond Task 2's models.
- T009 depends on T005–T008 all existing (wraps every engine function).
- T010 depends on T009.
- T011 depends on T010 (server must expose every endpoint).

## Implementation Strategy

### MVP (this phase's only scope)

1. Complete Phase 1 (schemas, seed-question loader) and Phase 2 (Mistral question generation).
2. Complete Phase 3 in order: engine core (T004) → session lifecycle functions (T005→T006→T007→T008) →
   API layer (T009→T010) → verification (T011).
3. **STOP and VALIDATE**: T011's `quickstart.md` run, including the forced-failure step, is this phase's
   pass/fail signal.

## Notes

- Given the currently-configured Mistral API key has 0 req/min quota (discovered during Task 4), every
  `next-question` call in this session's live testing is expected to exhaust its retry and fall through
  to the seed fallback — this is the correct, designed behavior (FR-004/SC-001), not a bug, and it
  exercises the fallback path for real rather than only in a mocked test.
- `assessment_engine.py`'s functions take a `Session` (SQLAlchemy) and plain ids/values as arguments, no
  FastAPI dependency, so they remain independently testable without a running server (Rule 9).

## Bug found and fixed during live verification (2026-09-11)

A full live session run (T011) surfaced a real correctness bug the design/mock testing hadn't caught:
when `get_next_question()`'s seed fallback fell through to `get_any_unused_seed_for_role()` (because
the routing-selected competency's own single seed question was already used), the returned seed's
question could belong to a *different* competency than the one routing selected — but the code was
still persisting the `Question` row under the originally-routed `competency_id`. That meant
`submit_answer()` would silently credit/debit the wrong competency's `SkillEvidence`, corrupting the
very evidence Task 7's scoring depends on. Fixed by using the seed's own `competency_id` whenever the
role-wide fallback fires (`assessment_engine.py`, `get_next_question()`) — re-verified with a full
7-question session where every recorded competency now matches what the question actually tested, with
zero duplicate questions and correct confidence/difficulty progression throughout.
