# Quickstart: Task 6 — Adaptive Assessment Engine

## Prerequisites

- Task 5 complete (a candidate with a selected target role exists).
- `assessment_seed.json` seeded (Task 1/2) so the fallback path has data to serve.

## Steps

1. Start a session: `curl -X POST http://localhost:8000/assessment/start -d '{"candidate_id":"<id>","target_role_id":"<role>"}'`
   → note `session_id`.
2. Loop: call `GET /assessment/<session_id>/next-question`, then `POST /assessment/<session_id>/answer`
   with a chosen option, until the response reports `status: completed` — confirm no two questions in the
   loop have identical `prompt` text.
3. Force-fail Mistral (e.g. temporarily invalidate `MISTRAL_API_KEY` or mock the client) and repeat step
   2 for one competency → confirm the returned question has `"source": "seed"` and the loop still
   completes without an error response.
4. Submit a duplicate answer to an already-answered `question_id` → expect HTTP 409.
5. Fetch `GET /assessment/<session_id>/profile` → confirm every required competency for the role has a
   `confidence_state` entry.

## Expected Outcome

A full assessment session runs start-to-finish via `curl` alone, adaptively selecting competencies,
never repeating a question, surviving a forced Mistral failure via the seed fallback, and producing a
per-competency evidence profile ready for Task 7's scoring engine — verified before any frontend
assessment screen (Task 13) is built.
