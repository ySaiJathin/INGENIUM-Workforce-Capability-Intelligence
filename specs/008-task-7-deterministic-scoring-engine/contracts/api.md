# API Contract: Task 7 — Deterministic Scoring Engine

Extends Task 6's `GET /assessment/{session_id}/profile` response (no new endpoint) with the verified,
backend-computed score alongside the resume estimate — this is the exact "BEFORE/AFTER" pair from
`total_mvp_context.md` §1.

## `GET /assessment/{session_id}/profile` (extended)

**Response 200**
```json
{
  "session_id": "9a2c...-uuid",
  "status": "completed",
  "verified_profile": [
    {
      "competency_id": "sql",
      "competency_name": "SQL",
      "resume_estimated_level": 2.5,
      "resume_confidence": 0.54,
      "verified_level": 3.1,
      "verified_confidence": 0.89
    }
  ]
}
```

## Quickstart

1. Complete a Task 6 session for a candidate whose resume estimated `sql = 2.5 (confidence 0.54)`.
2. Answer enough SQL questions correctly to expect a higher verified level.
3. `curl http://localhost:8000/assessment/<session_id>/profile` and confirm:
   - `verified_level` differs from `resume_estimated_level` in the direction assessment evidence supports.
   - `verified_confidence > resume_confidence` (more evidence available).
4. Run the same computation twice (re-request the endpoint) and confirm identical output (FR-004/SC-002).
