# API Contract: Task 6 — Adaptive Assessment Engine

**Note (2026-09-11)**: This is the candidate/frontend-facing contract, unchanged by
`total_buildplan.md` §27.4's Mistral-facing schema — the two are intentionally different shapes.
Mistral's internal response (`question_id`, `difficulty_level`, `question_type`, `correct_answer` as a
string, `assessment_signal`) is translated at the service boundary (see `research.md` §4) into this
contract's fields (`difficulty`, `options` as plain strings, `correct_answer_index` stored server-side
and never exposed pre-submission) before anything is persisted or returned to a client.

## `POST /assessment/start`

**Request**
```json
{ "candidate_id": "b3f1...-uuid", "target_role_id": "data-analyst" }
```
**Response 201**
```json
{ "session_id": "9a2c...-uuid", "status": "in_progress", "question_budget": 10 }
```

## `GET /assessment/{session_id}/next-question`

**Response 200**
```json
{
  "question_id": "q-uuid",
  "competency_id": "sql_window_functions",
  "difficulty": 3,
  "sequence_number": 4,
  "prompt": "...",
  "options": ["...", "...", "...", "..."],
  "source": "mistral"
}
```
**Response 200** (session already complete)
```json
{ "status": "completed", "message": "Assessment complete. See /profile for results." }
```

## `POST /assessment/{session_id}/answer`

**Request**
```json
{ "question_id": "q-uuid", "selected_index": 2 }
```
**Response 200**
```json
{
  "is_correct": true,
  "competency_id": "sql_window_functions",
  "updated_confidence": 0.42,
  "updated_difficulty": 4,
  "session_status": "in_progress"
}
```
**Response 409** (duplicate answer or question not in this session)
```json
{ "detail": "Question already answered for this session" }
```

## `GET /assessment/{session_id}/profile`

**Response 200**
```json
{
  "session_id": "9a2c...-uuid",
  "status": "completed",
  "competencies": [
    {
      "competency_id": "sql_window_functions",
      "questions_answered": 3,
      "correct_count": 2,
      "confidence_state": 0.78
    }
  ]
}
```
This is the input Task 7's scoring engine consumes — see Task 7's `contracts/api.md` for the resulting
verified score shape.

## Conventions

- `session_status` transitions only forward: `in_progress → completed`; never backward.
- `source` on a question is `"mistral"` or `"seed"` — always present, so a judge/developer can see the
  Rule 5 fallback firing in real demo traffic.
