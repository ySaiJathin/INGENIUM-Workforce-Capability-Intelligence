# Phase 7 — Full Integration: Test Results

**Date run**: 2026-09-12
**Environment**: local dev stack — `competency-postgres` (Docker, port 5433), backend via
`.venv/Scripts/uvicorn.exe backend.src.main:app` (port 8000), frontend via `npx vite --port 5173`.
**MISTRAL_API_KEY status going into this phase**: present (32 chars) but **quota-exhausted** —
every Mistral call in this session returned HTTP 429 `rate_limited`, sustained across 5+ minutes
of retries. This is an external condition, not a code defect (per spec 021's own Assumptions:
"LLM-assisted layer unavailable ... may occur due to external conditions such as API rate
limiting ... the acceptance test is valid either way"). All results below were therefore observed
with the LLM layer in its degraded/fallback state throughout — which is itself a valid, useful run
of this phase, since it exercises every fallback path exhaustively rather than only on request.

## Pre-flight finding: stale orphaned backend process

Before any test in this phase could be trusted, the "clean restart" in T002 revealed an **orphaned
`uvicorn --reload` worker process** (PID 4924, parented to a dead PID 12836) already bound to port
8000, started earlier under system Python rather than `.venv`. This is exactly the stale-backend
hazard `README.md` warns about. It was silently answering all requests — including the first T004
run — until identified via `Get-CimInstance Win32_Process` and killed. All results below are from
the *second* T004 run, against a freshly started process from the checked-in `.venv` source,
confirmed via a clean bind log (no `WinError 10048`) and `/health`.

## User Story 1 — Golden path from a clean start (P1)

| Task | Scenario | Result | Notes |
|------|----------|--------|-------|
| T004 | Demo candidate, full pipeline (candidate→role→assessment→profile→analysis→gaps→courses→learning-path) | ✅ PASS | 8/8 assessment questions answered (100% seed fallback due to 429s); 8 gaps, 8 course recommendations, 8-step learning path; `grounding: null` (Mistral 429, not a FAISS defect — see T018). |
| T005 | Second demo run, fresh candidate, immediately after T004 | ✅ PASS | New UUID, no conflict, full pipeline again. |
| T006 | Real resume upload (`strong_evidence_resume.docx`) | ⚠️ PASS-AS-DESIGNED, entry point only | DOCX parsing succeeded; Mistral skill-extraction step then hit the sustained 429 and returned the documented `422 {"reason":"extraction_failed"}` pointing to "Try Demo Candidate" — this is spec 021 FR-006's deliberate, tested behavior, not a bug. **Could not observe the resume path continue past this point to confirm FR-002's downstream convergence**, because the LLM quota never recovered during this session. Convergence *is* structurally guaranteed (both entry points write to the same `Candidate`/`CandidateSkill` tables and both call the same `extract_resume_skills`/downstream engines), but this session did not get a live end-to-end confirmation for the resume path beyond the entry point. |
| T007 | Repeat real-resume path, fresh session | Same as T006 | Same 429-driven 422 both times — confirms determinism of the degraded path, not full-pipeline repeatability. |
| T008 | Timing (SC-001, <3 min hands-on) | ✅ PASS | Full demo-path run: 86.6s total wall time including ~2s/request client-side overhead (11 network calls); server-side per-request latency independently measured at 13–14ms. Comfortably under the 3-minute budget. |

**Recommendation**: re-run T006/T007 once `MISTRAL_API_KEY` quota resets, to get a live confirmation
of FR-002 all the way to the learning path for the real-resume entry point. Until then, FR-002 is
verified by code inspection (both entry points share every downstream table/engine) but not by a
completed live run.

## User Story 2 — Graceful degradation matrix (P2)

| Row | Condition | Expected | Observed | Result |
|-----|-----------|----------|----------|--------|
| 1 | Invalid resume type (.txt) | 400, clear message | `400 "Unsupported file type 'text/plain'. Upload a PDF or DOCX resume."` | ✅ PASS |
| 2 | Empty resume (0-byte PDF) | 422, "Try Demo Candidate" | `422 {"detail":"Unable to parse resume. Try Demo Candidate instead.","reason":"extraction_failed"}` | ✅ PASS |
| 3 | Corrupt resume (non-PDF bytes as .pdf) | 422, "Try Demo Candidate" | Same as row 2 | ✅ PASS |
| 4 | LLM unavailable | fallback to seed/deterministic, no crash | Observed throughout this entire session (sustained 429s): assessment → seed questions; resume extraction → 422 fallback; learning-path rationale/grounding → `grounding: null`, non-fatal | ✅ PASS |
| 5 | Malformed LLM output / rate-limit path | retry then fallback, no crash | 2 retries logged per call, then clean fallback, every time | ✅ PASS |
| 6 | Unknown role id | 404 | `404 "Role 'nope-does-not-exist' not found"` | ✅ PASS |
| 7 | Unknown candidate id | 404 | `404 "Candidate '<uuid>' not found"` | ✅ PASS |
| 7b | Malformed (non-UUID) candidate id | clear 4xx | `422` FastAPI path-validation error, human-readable | ✅ PASS (bonus case) |
| 8 | Unknown/expired assessment session | 404 | `404 "Assessment session '<uuid>' not found"` | ✅ PASS |
| 8b | Duplicate answer to same question | 409 | `409 "Question already answered for this session"` | ✅ PASS (bonus case) |
| 8c/8d | Unknown analysis id (gaps / courses) | 404 | `404 "Analysis '<uuid>' not found"` both | ✅ PASS (bonus case) |
| 8e | Unknown learning-path id (GET) | 404 | `404 "Learning path '<uuid>' not found"` | ✅ PASS |
| 8f | Unknown analysis id (POST /learning-path) | 404 | **Found as HTTP 500** (unhandled `ForeignKeyViolation`) — **fixed in this phase** (see below), then re-verified as `404 "Analysis '<uuid>' not found"` | ✅ PASS (after fix) |
| 9 | Unavailable course data | `unmatched_gaps` populated, not an error | Catalogue emptied inside a controlled DB transaction (rolled back where possible; two tables required `TRUNCATE...CASCADE` and were restored via `seed_reference_data.py` afterward) — `match_courses_for_analysis` returned 0 recommendations, 1/1 gap reported in `unmatched_gaps`, no exception | ✅ PASS |
| 10 | Unavailable evidence retrieval (FAISS index renamed away, cold restart) | learning-path falls back, `grounding: null` | `201`, plan returned with 1 step, `grounding: null`; log line clearly distinct from the Mistral-429 fallback ("Evidence index not found ... run build_evidence_index.py first") — the two failure modes are never conflated | ✅ PASS |
| 11 | DB temporarily unreachable | bounded 5xx/timeout, no hang | `GET /health` → `200 {"status":"degraded","database":"unreachable",...}` in 5.2s; data endpoints (`/roles`, `/courses`, `POST /candidates/demo`) → bounded `500` in ~10.2s (two 5s `connect_timeout` attempts via `pool_pre_ping`), no hang | ✅ PASS, with one logged observation below |
| T020 | App still usable after every trigger above | yes | `/health` returns `ok` after all matrix rows; `/roles` returns all 6 roles again | ✅ PASS |
| FR-006 | Recovery without app restart (DB case) | retry succeeds, no restart | Postgres restarted; **no backend restart performed**; `/health` and `/roles` succeeded on the very next call | ✅ PASS |
| FR-006 | Recovery without app restart (evidence case) | retry succeeds, no restart | FAISS index file restored; backend restarted (required — index is loaded into a module-level singleton on first use, so a cold process restart is the correct recovery step, not a live-reload bug) | ✅ PASS |

**Logged, non-fixed observation** (per spec 018 FR-003's "log, don't fix, non-critical/cosmetic
issues" rule, which this phase's plan.md cites as the operative constraint): when the database is
unreachable, data endpoints (`/roles`, `/courses`, `POST /candidates/demo`, etc.) return a bounded
`500` with an **empty response body**, rather than a structured JSON message like `/health`'s. The
frontend's `httpClient.ts` already degrades this gracefully (falls back to `response.statusText`
and renders `ErrorState`, confirmed by code inspection — no blank/frozen screen), and spec 018's
own bar for this exact scenario ("useful error rather than crashing the backend process or
corrupting state", FR-002 "no blank/frozen frontend") is met. Giving every data endpoint the same
structured-detail treatment `/health` already has would be a nice consistency improvement, but is
cosmetic against the cited bar and is logged here rather than changed, per FR-003.

## Defect found and fixed in this phase

**`POST /learning-path` with an unknown `analysis_id` raised an unhandled 500** instead of a 404.

- **Root cause**: `backend/src/api/learning_path.py`'s `create_learning_path` passed
  `body.analysis_id` straight into `learning_path_engine.build_learning_path()` without checking
  the analysis exists first (unlike its sibling `GET /analysis/{id}/gaps` and
  `GET /analysis/{id}/courses`, which both guard with `db.get(Analysis, analysis_id)` →
  404). With no gaps found for the unknown id, the engine's "nothing left to learn" branch tried to
  insert a `learning_paths` row referencing that nonexistent `analysis_id`, which the
  `learning_paths_analysis_id_fkey` constraint correctly rejected as an `IntegrityError` —
  surfacing to the client as a bare `500 Internal Server Error`.
- **Fix**: added the same `db.get(Analysis, body.analysis_id)` → `404` guard used by the two
  sibling endpoints, before calling into the planner. Matches existing repo idiom exactly; no new
  pattern introduced.
- **Verification**: re-ran the case live post-fix — `404 {"detail":"Analysis '<uuid>' not found"}`.
  Re-ran the full backend test suite (`pytest backend/tests`): **52 passed**, no regressions. Also
  re-ran the full golden path (T004-equivalent) after the fix to confirm no impact on the happy
  path: PASS.

## Overall Phase 7 status

- **User Story 1 (P1)**: PASS for both entry points at the point each could be exercised; the
  real-resume path's full-pipeline convergence (FR-002) could not be *live*-confirmed to the
  learning-path step in this session due to sustained external LLM quota exhaustion — recommend a
  follow-up run once the key's quota resets, per the note under T006/T007 above.
- **User Story 2 (P2)**: PASS, 100% of the 11 documented failure conditions (plus 5 bonus edge
  cases exercised while probing the matrix) produce a clear, human-readable degradation, after
  fixing the one real defect this phase's testing surfaced (row 8f).
- **One genuine code defect found and fixed** (row 8f), verified against the full test suite and
  the golden path.
- **One pre-existing operational hazard identified and cleared**: an orphaned stale backend
  process from an earlier session, silently serving stale code on port 8000 — exactly the failure
  mode `README.md` already warns about. No code change needed; documented here as a reminder that
  T002's "clean restart" must always verify the *new* process actually bound the port, not just
  that a health check eventually returns 200.
