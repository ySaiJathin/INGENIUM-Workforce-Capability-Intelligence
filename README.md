# Competency Intelligence MVP

See `CLAUDE.md` for the operating rulebook and `total_buildplan.md`/`total_mvp_context.md` for the
full build plan. This file documents day-to-day run instructions only.

## Backend

```bash
# from the repo root, with the venv active and PostgreSQL running (docker-compose up -d)
.venv/Scripts/uvicorn.exe backend.src.main:app --reload
```

Runs on `http://localhost:8000` by default, with every route mounted at the root (no `/api`
prefix) — see `backend/src/main.py`. CORS is open for local development.

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on a Vite dev server (default `http://localhost:5173`, or the next free port). The frontend
calls the backend through `VITE_API_BASE_URL` (see `frontend/.env.example`), which defaults to
`http://localhost:8000` — the backend above must be running separately for real (non-demo) data to
load. The "Try Demo Candidate" flow works without the backend as an offline fallback (`CLAUDE.md`
Rule 12).
