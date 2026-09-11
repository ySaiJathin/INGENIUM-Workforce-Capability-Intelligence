# Quickstart

Full run instructions for a fresh machine/session. For the architecture and rules, see
`CLAUDE.md` and `total_mvp_context.md`. For day-to-day commands only (no setup), see `README.md`.

## 1. Prerequisites

- Python venv already created at `.venv/` with `requirements.txt` installed.
- Node/npm available; `frontend/node_modules` already installed.
- Docker available for PostgreSQL.
- A real `MISTRAL_API_KEY` in `.env` (copy from `.env.example` if `.env` doesn't exist).
- `data/raw/esco/` (4 CSVs) and `models/all-MiniLM-L6-v2/` already present locally — see
  `CLAUDE.md` Rule 7. Nothing to download.

## 2. Start PostgreSQL

```bash
docker-compose up -d
```

Runs `postgres:16` in container `competency-postgres`, mapped to **host port 5433** (not 5432 —
see `docker-compose.yml` comment: this avoids clashing with any other Postgres container already
on the machine). `DATABASE_URL` in `.env.example` already points at `5433`.

Verify: `docker ps` should show `competency-postgres` as `Up`.

## 3. Check for port conflicts before starting the app

`BACKEND_PORT=8000` and the frontend's default `5173` are just defaults — on a shared/dev machine
they can already be bound by unrelated Docker containers or other projects (this has happened on
this machine: ports 8000/5173/3000/5432 were held by paused containers from other repos). Check
first:

```bash
docker ps -a
```

If `8000` or `5173` show up under a **different** project's container, or a plain port check shows
them occupied, pick free ports instead (e.g. `8010` / `5183`) and pass them explicitly in step 4/5
— don't fight the existing container for the port.

## 4. Start the backend

```bash
# from repo root, venv active, postgres running
.venv/Scripts/uvicorn.exe backend.src.main:app --reload --port 8000
```

(Substitute `--port 8010` etc. if `8000` was occupied per step 3.) Runs at `http://localhost:<port>`
with every route mounted at the root (no `/api` prefix). CORS is open for local dev.

Verify:

```bash
curl http://localhost:8000/health
# {"status":"ok","database":"connected","detail":null}
```

## 5. Start the frontend

```bash
cd frontend
# if the backend is not on the default port 8000, point the frontend at it:
VITE_API_BASE_URL=http://localhost:8000 npx vite --port 5173
```

(Substitute your actual backend/frontend ports if step 3 forced a change — `frontend/.env` /
`.env.example` default to `http://localhost:8000` for `VITE_API_BASE_URL`.)

Verify: `http://localhost:5173/` returns 200 and loads the app shell in a browser.

## 6. Walk the golden path

In the browser:

```
Landing → "Try Demo Candidate" (or real resume upload) → Initial Candidate Profile
  → Target Role Selection → Role Requirements → Adaptive Assessment
  → Verified Skill Profile → Skill Gap Analysis → Course Recommendations
  → Personalized Learning Path
```

"Try Demo Candidate" must work even if the backend/Mistral is unreachable (offline fallback,
`CLAUDE.md` Rule 12) — the resume-upload path requires the backend and a real `MISTRAL_API_KEY`.

Equivalent API-only smoke test (useful when no browser tool is available):

```bash
curl http://localhost:8000/roles
curl -X POST http://localhost:8000/candidates/demo
```

## 7. Known gotchas

- **Port collisions**: see step 3 — don't assume 8000/5173 are free on a shared dev machine.
- **One shell/session at a time**: don't run multiple competing backend or frontend processes —
  kill the old one before starting a new one on a different port.
- Demo mode must reach the *same* downstream pipeline as a real resume upload — it is not a
  separate mocked code path (see `specs/017-task-16-demo-implementation`).
