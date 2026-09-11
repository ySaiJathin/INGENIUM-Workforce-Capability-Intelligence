# API Contract: Task 8 — Skill Gap Engine

## `POST /analysis`

**Request**
```json
{ "candidate_id": "b3f1...-uuid", "target_role_id": "data-analyst" }
```
**Response 201**
```json
{ "analysis_id": "an-uuid", "candidate_id": "b3f1...-uuid", "target_role_id": "data-analyst" }
```

## `GET /analysis/{id}/gaps`

**Response 200** (gaps present)
```json
{
  "analysis_id": "an-uuid",
  "gaps": [
    {
      "competency_id": "sql_window_functions",
      "competency_name": "Window Functions",
      "required_level": 4,
      "verified_level": 3.1,
      "gap": 0.9,
      "rank": 1
    }
  ]
}
```
**Response 200** (no gaps)
```json
{ "analysis_id": "an-uuid", "gaps": [] }
```

## Quickstart

1. `curl -X POST http://localhost:8000/analysis -d '{"candidate_id":"<id>","target_role_id":"<role>"}'`
   → note `analysis_id`.
2. `curl http://localhost:8000/analysis/<analysis_id>/gaps` → confirm each `gap` equals
   `required_level - verified_level` and the list is ordered highest-value gap first.
3. Repeat with a candidate whose verified levels meet every requirement → confirm `"gaps": []`.
