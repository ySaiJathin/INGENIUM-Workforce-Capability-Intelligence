# API Contract: Task 10 — Learning Path

## `POST /learning-path`

**Request**
```json
{ "analysis_id": "an-uuid" }
```

**Response 201**
```json
{
  "learning_path_id": "lp-uuid",
  "analysis_id": "an-uuid",
  "steps": [
    {
      "step_number": 1,
      "course_id": "advanced-sql-queries",
      "title": "Advanced SQL Queries",
      "addresses_gaps": ["sql_aggregation"],
      "rationale": "Builds the foundation for window functions covered next."
    },
    {
      "step_number": 2,
      "course_id": "advanced-sql-analytics",
      "title": "Advanced SQL Analytics",
      "addresses_gaps": ["sql_window_functions", "sql_ctes"],
      "rationale": null
    }
  ],
  "gaps_without_courses": ["obscure_niche_competency"]
}
```
**Response 201** (no gaps)
```json
{
  "learning_path_id": "lp-uuid",
  "analysis_id": "an-uuid",
  "steps": [],
  "gaps_without_courses": [],
  "message": "No further learning required — all target role requirements are met."
}
```

## `GET /learning-path/{id}`

Returns the same shape as the `POST` response, from the persisted record — always identical across
repeated calls (spec FR-005/SC-003).

## Quickstart

1. `curl -X POST http://localhost:8000/learning-path -d '{"analysis_id":"<id from Task 8/9>"}'`.
2. Confirm any prerequisite/dependent competency pair present appears in the correct order.
3. `curl http://localhost:8000/learning-path/<learning_path_id>` twice and confirm identical `steps`.
4. Repeat step 1 for a no-gap analysis and confirm the "no further learning required" response.
