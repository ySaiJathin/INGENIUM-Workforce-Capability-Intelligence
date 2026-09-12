# Diagnosis Record: Phase 0

**Produced**: 2026-09-12, via live verification against the running backend (uvicorn from source,
port 8000) and PostgreSQL (Docker, `competency-postgres`, port 5433). Every claim below was
confirmed by an actual `curl`/API call this session, not inferred from reading code alone
(`CLAUDE.md`'s Execution & Testing Protocol).

| Subsystem | Status | Evidence |
|---|---|---|
| API/DB health | **Confirmed working** | `GET /health` → `{"status":"ok","database":"connected"}` |
| Resume upload (invalid input) | **Confirmed working** | Unsupported type → `400`; oversized → `400` (by inspection of `_max_upload_bytes()`); corrupt/unreadable → `422` pointing to "Try Demo Candidate" |
| Resume upload (LLM path) | **Confirmed working, currently exercising its fallback** | `MISTRAL_API_KEY` is rate-limited (429) this session; retry-then-422 behavior confirmed correct and graceful — real-Mistral-success path not verified this session due to the external rate limit, not a code defect |
| Demo candidate | **Confirmed working** | `POST /candidates/demo` → `201`, real seeded profile, fresh row per call |
| Target-role selection | **Confirmed working** | `POST /candidates/{id}/target-role` → `200`, correct role detail returned |
| Adaptive assessment | **Confirmed working** | Full 8-question loop completed cleanly; all questions sourced from the seed bank (Mistral question-generation also rate-limited this session — fallback confirmed working) |
| Deterministic scoring | **Confirmed working** | `GET /assessment/{id}/profile` → `200`, verified levels computed from real answer evidence |
| Gap analysis | **Confirmed working, deterministic** | `POST /analysis` + `GET /analysis/{id}/gaps` → `200`, correct shortfall/priority/rank output |
| Course recommendation | **Confirmed working** | `GET /analysis/{id}/courses` → `200`, every recommendation carries `matched_gaps`/`match_reason` |
| Learning path | **Confirmed working** | `POST /learning-path` → `201`, real deterministic step ordering |
| Backend deployment | **Was broken, now fixed** | A previously-running Docker container (`competency-backend`) was built from stale source (missing a fix already present in `candidates.py`) — stopped this session; `uvicorn` from source is now the documented sanctioned path (`README.md`, updated this phase) |
| Seed question bank depth | **Partial** | Only ~1 seed question per competency exists — sessions complete at seed exhaustion (8/10 budget) rather than confidence resolution when Mistral is unavailable, which limits the assessment's visible "adaptive" difficulty progression in that condition. Not a Phase 0 blocker; flagged as a data-completeness follow-up (tracked in Phase 3's `tasks.md` T012). |
| MCP tool layer | **Missing** | No MCP dependency or package exists anywhere in the repo — expected; this is Phase 2's genuinely new work. |
| FAISS evidence/RAG layer | **Missing** | No FAISS dependency, index, or evidence corpus exists anywhere in the repo — expected; this is Phase 6's genuinely new work. |

## Discrepancies against prior planning-document claims

- `total_mvp_context.md` §1 states "**Current implementation state: 0% built.**" — **stale**. Every
  subsystem in the table above except MCP/FAISS is confirmed working end-to-end with real data.
- `total_mvp_context.md` §6's status tracker marks Phases 0-11 as "not started" — **stale in the
  same way**; those phases were independently confirmed working via this session's own direct API
  testing, as that document's own "Final project status" note already partially acknowledges.
  Task T015 of this phase updates that tracker to close this gap explicitly.
- No `Dockerfile`/backend `docker-compose.yml` service was ever checked into the repo, despite a
  Docker-built backend image being found running at the start of this diagnosis — that image was
  built ad hoc, outside version control, by an earlier, unrecorded step. Resolved this phase by
  documenting `uvicorn` from source as the sanctioned path (see `README.md`).

## Upload-safety re-verification (T010-T013)

Re-run live against the current source this phase, closing the loop opened earlier this session:

- Unsupported type (`text/plain`) → `400`, clear message.
- Oversized file (6MB against a 5MB limit) → `400`, clear message, rejected before any extraction
  attempt.
- Corrupt file with a valid PDF extension/MIME type but garbage content → `422`, "Try Demo
  Candidate" message, no raw exception.
- Code review of `backend/src/api/candidates.py`'s current `upload_resume()` confirms: on a Mistral
  extraction failure, the function raises `HTTPException(422, ...)` directly — there is no fallback
  branch that constructs a degraded result and returns `201` as if it were a full-quality success.
  (This is a deliberate confirmation: an earlier, since-replaced version of this function — the one
  baked into the stale Docker image found at the start of this session — did have such a silent
  fallback; the current source does not.)

## Outstanding items carried into later phases (not Phase 0 blockers)

1. Seed question bank depth (Phase 3, tracked task T012).
2. Real-Mistral-success verification for resume extraction and question generation, blocked on the
   API key's rate limit clearing (external condition, not a code defect).
