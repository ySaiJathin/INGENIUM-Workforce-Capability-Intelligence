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

**This `uvicorn`-from-source command is the sanctioned way to run the backend** (Phase 0 decision,
`specs/020-phase-0-diagnose-stabilize/plan.md`'s Research Decision). There is no `Dockerfile` for
the backend service in this repo, and `docker-compose.yml` only runs PostgreSQL — if you build a
Docker image for the backend ad hoc, rebuild it every time `backend/src/` changes. A stale,
ad-hoc-built backend image was found running during this project's Phase 0 audit with behavior
that no longer matched the checked-in source (a resume-extraction fallback that had since been
replaced); always verify a running backend against `curl http://localhost:8000/health` plus a
resume-upload smoke test before trusting it for further testing.

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
