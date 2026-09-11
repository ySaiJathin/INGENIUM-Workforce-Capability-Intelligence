# API Contract: Task 3 — Backend API Foundation

## `GET /health`

**Response 200**
```json
{ "status": "ok", "database": "connected" }
```
**Response 200 (degraded)**
```json
{ "status": "degraded", "database": "unreachable", "detail": "..." }
```

## `GET /roles`

**Response 200**
```json
[
  { "id": "data-analyst", "name": "Data Analyst", "description": "..." }
]
```

## `GET /roles/{id}`

**Response 200**
```json
{
  "id": "data-analyst",
  "name": "Data Analyst",
  "description": "...",
  "required_competencies": [
    { "competency_id": "sql", "name": "SQL", "required_level": 4, "priority": 1 }
  ]
}
```
**Response 404**
```json
{ "detail": "Role 'xyz' not found" }
```

## `GET /competencies`

**Response 200**
```json
[
  {
    "id": "sql_window_functions",
    "name": "SQL Window Functions",
    "description": "...",
    "parent_competency_id": "sql"
  }
]
```

## `GET /courses`

**Response 200**
```json
[
  {
    "id": "advanced-sql-analytics",
    "title": "Advanced SQL Analytics",
    "description": "...",
    "provider": "...",
    "level": "intermediate",
    "duration_hours": 6,
    "competencies_covered": ["sql_window_functions", "sql_ctes"]
  }
]
```

## Conventions established here for all later endpoints (Tasks 4–10)

- Not-found → `404` with `{"detail": "<specific message>"}`.
- Validation error → `422` (FastAPI/Pydantic default) with field-level detail.
- Every list endpoint returns a plain JSON array, no envelope/wrapper object, at this catalogue scale.
- Every id referenced in a response is the same stable string/uuid used as that entity's primary key in
  the database (Task 2's `data-model.md`) — never a display-only label.
