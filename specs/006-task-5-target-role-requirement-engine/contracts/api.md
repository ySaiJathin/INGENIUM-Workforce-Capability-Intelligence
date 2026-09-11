# API Contract: Task 5 — Target Role & Requirement Engine

## `POST /candidates/{candidate_id}/target-role`

**Request**
```json
{ "role_id": "data-analyst" }
```

**Response 200**
```json
{
  "candidate_id": "b3f1...-uuid",
  "role": {
    "id": "data-analyst",
    "name": "Data Analyst",
    "description": "...",
    "required_competencies": [
      { "competency_id": "sql", "name": "SQL", "required_level": 4, "priority": 1 }
    ]
  }
}
```

**Response 404** (unknown candidate)
```json
{ "detail": "Candidate 'xyz' not found" }
```

**Response 404** (unknown role)
```json
{ "detail": "Role 'xyz' not found" }
```

## Quickstart

```
curl -X POST http://localhost:8000/candidates/<candidate_id>/target-role \
  -H "Content-Type: application/json" -d '{"role_id":"data-analyst"}'
```
Expect HTTP 200 with `required_competencies` populated, matching `GET /roles/data-analyst` from Task 3.
Then `SELECT target_role_id FROM candidates WHERE id = '<candidate_id>'` and confirm it was updated.
