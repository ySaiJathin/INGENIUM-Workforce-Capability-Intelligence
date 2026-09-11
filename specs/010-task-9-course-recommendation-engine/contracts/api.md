# API Contract: Task 9 — Course Recommendation Engine

## `GET /analysis/{id}/courses`

**Response 200**
```json
{
  "analysis_id": "an-uuid",
  "recommendations": [
    {
      "course_id": "advanced-sql-analytics",
      "title": "Advanced SQL Analytics",
      "matched_gaps": ["sql_window_functions", "sql_ctes"],
      "match_reason": "Covers: ✓ Window Functions  ✓ CTEs",
      "match_score": 0.91
    }
  ],
  "unmatched_gaps": ["obscure_niche_competency"]
}
```
**Response 200** (no gaps for this analysis)
```json
{ "analysis_id": "an-uuid", "recommendations": [], "unmatched_gaps": [] }
```

## Quickstart

1. Using an `analysis_id` from Task 8 with known gaps, `curl
   http://localhost:8000/analysis/<analysis_id>/courses`.
2. Confirm every returned recommendation's `matched_gaps` genuinely overlap with `course_competencies`
   for that course (cross-check against Task 3's `GET /courses`).
3. Confirm any gap with zero covering courses appears in `unmatched_gaps`, not silently dropped.
4. Temporarily disable the MiniLM step (e.g. via a feature flag or forced exception) and repeat step 1 —
   confirm the response still returns deterministic matches with HTTP 200, not an error.
