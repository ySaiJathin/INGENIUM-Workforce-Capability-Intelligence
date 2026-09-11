# Phase 0 Research: Task 6 — Adaptive Assessment Engine

## 1. Competency-selection routing algorithm

- **Decision**: At each `next-question` call, compute an "uncertainty score" per required competency
  as `(1 - confidence_state) * priority_weight`, where `priority_weight` comes from the role's
  `role_competencies.priority`. Select the competency with the highest score that has not yet reached the
  confidence threshold and still has an available (non-repeated) question. Ties broken by lowest
  `questions_answered` so far (spread coverage before depth).
- **Rationale**: `total_buildplan.md` §8's flow ("Select competency → Ask → Correct? increase confidence/
  difficulty : probe same competency → Update state → Choose next uncertain/weak competency → Repeat") is
  fully deterministic and explainable — no statistical model, matching the explicit non-goal against IRT/
  Bayesian estimation.
- **Alternatives considered**: Pure round-robin across competencies — rejected, wouldn't visibly "adapt"
  to weak areas, losing the product's adaptive story. IRT ability estimation — explicitly excluded.

## 2. Difficulty adjustment rule

- **Decision**: Start each competency at difficulty 2 (of 1–5). Correct answer → difficulty += 1 (capped
  at 5) and confidence += a fixed increment. Incorrect answer → difficulty stays the same (probe again at
  the same difficulty) and confidence increases by a smaller increment (some evidence is still gathered
  even from a wrong answer, just less).
- **Rationale**: Simple, transparent, and matches §8's "Correct? YES → increase confidence/difficulty;
  NO → probe same competency" instruction without introducing hidden statistical weighting.
- **Alternatives considered**: Decreasing difficulty on incorrect answers (classic adaptive-testing
  staircase) — considered but rejected in favor of the simpler "probe again at the same level" rule
  explicitly given in `total_buildplan.md` §8, to avoid re-deciding the algorithm mid-build (Rule 2).

## 3. Confidence threshold & stop condition

- **Decision**: A competency is "resolved" once `confidence_state >= 0.75` (tunable constant) or it has
  been asked 3 times, whichever comes first. The session completes when every required competency is
  resolved, or the session's total question budget (default 10, within the 8–12 range) is exhausted —
  whichever comes first.
- **Rationale**: Guarantees termination within the demo's time budget even if a competency never reaches
  high confidence, and guarantees the session doesn't end without covering every required competency at
  least once if the budget allows.
- **Alternatives considered**: A fixed number of questions per competency with no confidence check —
  simpler but less visibly "adaptive"; rejected in favor of the confidence-driven stop that better
  demonstrates the product's core claim.

## 4. Mistral question-generation schema

**Updated 2026-09-11**: superseded by `total_buildplan.md` §27.4 (Operation C — Adaptive Question
Generation), published after this document's first draft. Field names differ from the earlier §8-only
sketch this decision originally cited.

- **Decision**: Use the §27.4 schema verbatim:
  ```json
  {
    "question_id": "", "competency_id": "sql_window_functions", "competency_name": "SQL Window Functions",
    "difficulty_level": 3, "question_type": "MCQ", "question": "...", "options": ["...","...","...","..."],
    "correct_answer": "...", "explanation": "...", "assessment_signal": "..."
  }
  ```
  validated with a Pydantic model, reusing `mistral_client.py`'s shared `BASE_RULES` (built in Task 4,
  `total_buildplan.md` §27.1) plus an Operation-C-specific system prompt. Per §27.4, the request's Input
  is: `candidate_id`, target role, target competency, current estimated level, required role level,
  previous questions (so none repeat), previous answers/results, and assessment progress — the backend
  decides what's relevant, never the whole candidate profile or database (§7.2).
- **Backend validation** (§27.4, beyond generic schema validation): exactly one correct MCQ answer, all
  required fields present, `competency_id` is a known backend id (re-validated the same way Task 4
  re-validates Mistral-returned competency ids — never trusted blindly), `difficulty_level` is a valid
  value, no duplicate `question_id`, and no duplicate question content against this session's history
  (FR-005's "never repeat a question" requirement, now with an explicit backend-side content check, not
  just a prompt instruction).
- **Rationale**: This is the exact, now fully-specified contract from the build plan; reusing it verbatim
  avoids re-deciding an already-frozen interface, and reusing `mistral_client.py`'s `BASE_RULES` avoids
  duplicating the shared system prompt across Task 4 and Task 6 (Rule 13).
- **Note on `correct_answer` type**: §27.4 shows it as a string (matching an option's text or a
  letter/id), not the integer index this document's earlier draft assumed
  (`"correct_answer": 2` under the old §8-only schema) — the backend's MCQ comparison (`total_buildplan.md`
  §9: `candidate_answer == correct_answer`) is a direct equality check against whatever value Mistral
  returned in this field, not an index lookup.
- **Alternatives considered**: None — this schema is given, not chosen.
- **Reconciling with Task 2's already-built DB schema**: `questions.correct_answer_index` and
  `answers.selected_index` (Task 2's `data-model.md`, already implemented) are integers, not the string
  §27.4 shows for `correct_answer`. Rather than changing that already-working schema (Rule 10), the
  Mistral-facing boundary does the translation: after receiving a validated response, the backend computes
  `correct_answer_index = options.index(correct_answer)` (a plain string match against the returned
  `options` list); if the returned `correct_answer` doesn't match any option's text, that is itself a
  validation failure triggering the same retry-then-seed-fallback path as any other malformed response.
  The DB schema and the answer-submission endpoint's contract stay index-based throughout, matching Task
  2's schema and this feature's own `contracts/api.md`.

## 5. Seed-question fallback selection

- **Decision**: On a second consecutive Mistral failure for a given competency/difficulty request, query
  `assessment_seed.json`-seeded rows for that competency, excluding any seed question already used in this
  session, preferring the seed question whose difficulty is closest to the requested difficulty; if none
  remain unused for that competency, fall back to any unused seed question for the same role (still
  respecting "never repeat a question").
- **Rationale**: Directly implements Rule 5's fallback requirement and spec Edge Case ("Mistral generation
  and the seed bank both lack a question for the exact competency/difficulty combination").
- **Alternatives considered**: Failing the `next-question` request outright when no exact-match seed
  exists — rejected, violates "the assessment must never crash because of an LLM formatting problem"
  (`CLAUDE.md` Rule 5) and Task 1's SC-003 guarantee (at least one seed question per role-required
  competency) makes a same-competency fallback always available in practice.

## Outcome

All Technical Context fields in `plan.md` are resolved with no remaining `NEEDS CLARIFICATION` markers.
Proceeding to Phase 1 (data-model.md, contracts/, quickstart.md).
