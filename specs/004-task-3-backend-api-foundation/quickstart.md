# Quickstart: Task 3 — Backend API Foundation

## Prerequisites

- Task 2 complete (PostgreSQL schema created and seeded, reachable via `DATABASE_URL`).
- Backend dependencies installed (`pip install -r backend/requirements.txt` or equivalent).

## Steps

1. Start the FastAPI dev server: `uvicorn backend.src.main:app --reload`.
2. Verify health: `curl http://localhost:8000/health` → expect `{"status":"ok","database":"connected"}`.
3. Verify roles list: `curl http://localhost:8000/roles` → expect 5–8 entries matching
   `data/curated/roles.json`.
4. Verify one role's detail: `curl http://localhost:8000/roles/<a real id from step 3>` → expect
   `required_competencies` populated.
5. Verify a 404: `curl -i http://localhost:8000/roles/does-not-exist` → expect HTTP 404.
6. Verify competencies list: `curl http://localhost:8000/competencies` → expect 30–50 entries.
7. Verify courses list: `curl http://localhost:8000/courses` → expect 30–50 entries, each with
   `competencies_covered` populated.

## Expected Outcome

All five endpoints return real (non-mock) data matching what Task 2 seeded, verified entirely via
`curl`/httpie with no frontend involved — satisfying Rule 11's gate before Task 11 (frontend) can begin,
per `contracts/api.md`.
