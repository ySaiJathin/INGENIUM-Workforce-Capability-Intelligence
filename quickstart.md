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

Runs `postgres:16` in the project's Postgres container, mapped to **host port 5433** (not 5432 —
see `docker-compose.yml` comment: this avoids clashing with any other Postgres container already
on the machine). `DATABASE_URL` in `.env.example` already points at `5433`.

Verify:

```bash
docker ps --filter "publish=5433"
```

should show one container `Up`. **Don't assume its name is literally `competency-postgres`** — if
a previous `docker-compose up`/`down` cycle left an orphaned container holding that name, Compose
will recreate the service under a different auto-generated name (e.g.
`43dac3ed0ccc_competency-postgres`) while keeping the same `5433:5432` port mapping. The name
doesn't matter for anything downstream; only the port mapping and container health do. Confirm
readiness with:

```bash
docker exec <container_name> pg_isready -U postgres
```

## 3. Check whether the app is already running before assuming a port conflict

`BACKEND_PORT=8000` and the frontend's default `5173` are just defaults — on a shared/dev machine
they can already be bound by unrelated Docker containers or other projects (this has happened on
this machine: ports 8000/5173/3000/5432 were held by paused containers from other repos). But
before treating an occupied port as a conflict to route around, check whether it's actually
*this* app already up from an earlier session — in that case there's nothing to start, just reuse
it:

```bash
curl -s http://localhost:8000/health   # this project's backend if it answers {"status":"ok",...}
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5173/   # this project's frontend if 200
```

Only if the port is held by something else (check `docker ps -a` for a different project's
container, or on Windows `Get-Process -Id <pid>` for the PID `netstat -ano` reports) should you
pick free ports instead (e.g. `8010` / `5183`) and pass them explicitly in step 4/5 — don't fight
another project's container/process for the port, and per `CLAUDE.md`'s "one shell/session at a
time" rule, don't start a second competing backend/frontend next to one of this project's own that
is already healthy.

## 4. Start the backend

```bash
# from repo root, venv active, postgres running
.venv/Scripts/uvicorn.exe backend.src.main:app --reload --port 8000
```

(Substitute `--port 8010` etc. if `8000` was occupied by something else per step 3.) Runs at
`http://localhost:<port>` with every route mounted at the root (no `/api` prefix). CORS is open
for local dev.

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

This is a long-running dev server — run it in its own terminal/background job, not chained with
`&&` after other commands that expect the shell back. In an agent/CI shell where a plain `&`
backgrounds it, redirect output to a log file (e.g. `... > /tmp/vite.log 2>&1 &`) and poll that log
or `curl` the port rather than assuming the launcher command's own exit means the server exited —
a detached child can keep listening after the launching shell call returns.

Verify: `http://localhost:5173/` returns 200 and loads the app shell in a browser.

## 6. Walk the golden path

In the browser:

```text
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

- **Port collisions**: see step 3 — don't assume 8000/5173 are free on a shared dev machine, and
  don't assume an occupied port means a conflict — it may already be this app running.
- **Postgres container name drift**: see step 2 — after an interrupted `docker-compose down`, a
  leftover orphan can force Compose to rename the container on the next `up`. Match on the port
  (`5433`), not the name `competency-postgres`.
- **One shell/session at a time**: don't run multiple competing backend or frontend processes —
  kill the old one before starting a new one on a different port.
- Demo mode must reach the *same* downstream pipeline as a real resume upload — it is not a
  separate mocked code path (see `specs/017-task-16-demo-implementation`).
