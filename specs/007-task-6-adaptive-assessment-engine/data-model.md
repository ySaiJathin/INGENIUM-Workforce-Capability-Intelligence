# Phase 1 Data Model: Task 6 — Adaptive Assessment Engine

This phase reads/writes exclusively the `assessments`, `questions`, `answers`, and `skill_evidence`
tables already defined in Task 2's `data-model.md`. No new tables are introduced; this document specifies
the *runtime state shape* the routing algorithm (research.md §1–3) operates on, derived from those tables.

## In-memory/derived state per session (computed from DB rows, not separately stored)

```
CompetencyState {
  competency_id: string
  confidence_state: float        # 0.0–1.0, from skill_evidence.confidence_state
  current_difficulty: int        # 1–5, derived from skill_evidence.avg_difficulty + last answer outcome
  questions_answered: int        # from skill_evidence.questions_answered
  correct_count: int             # from skill_evidence.correct_count
  resolved: bool                 # confidence_state >= 0.75 OR questions_answered >= 3
}

SessionState {
  session_id: uuid
  status: "in_progress" | "completed" | "abandoned"
  question_budget: int           # default 10
  questions_used: int            # count of questions rows for this session
  competency_states: CompetencyState[]   # one per role-required competency
  asked_question_texts: string[]         # dedup guard, from questions.prompt for this session
}
```

## State transitions

```
start:
  create assessments row (status=in_progress, question_budget=10)
  create skill_evidence rows (confidence_state=0, avg_difficulty=2, questions_answered=0) for every
    competency in role_competencies for this session's target_role_id

next-question:
  if questions_used >= question_budget OR every competency_state.resolved: mark session completed, return
    "no more questions"
  else: select competency via research.md §1 routing → generate/fallback question (research.md §4/5) →
    persist questions row (source = mistral|seed) → return it

answer:
  reject if question_id already has an answers row for this session (FR-009)
  reject if question_id.session_id != given session_id (FR-009)
  else: compute is_correct server-side → persist answers row → update that competency's skill_evidence
    row per research.md §2 (difficulty/confidence adjustment) → recompute resolved flag →
    if every competency_state.resolved OR questions_used >= question_budget: mark session completed

profile (GET /assessment/{id}/profile):
  read skill_evidence for the session → feeds Task 7's scoring engine directly (no separate persistence
    needed here beyond skill_evidence — Task 7 introduces verified_skill_scores)
```

## Relationship to Task 2's schema

```
assessments.status            ←→ SessionState.status
assessments.question_budget   ←→ SessionState.question_budget
questions (rows for session)  ←→ SessionState.asked_question_texts (dedup source)
skill_evidence (rows)         ←→ SessionState.competency_states
```
