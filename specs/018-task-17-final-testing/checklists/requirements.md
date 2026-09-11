# Specification Quality Checklist: Task 17 — Final Testing

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-09-11
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Notes

- The nine named test scenarios and "fix critical bugs only" are named because they are frozen decisions
  (`total_buildplan.md` §24 Task 17, Rule 1/11), not implementation choices made by this spec.
- All items pass on first validation pass.

## Implementation Status (2026-09-12) — Final Testing Results

Implemented per `tasks.md` T001-T011. All nine named scenarios tested against a live backend
(scenarios 1-9 below); one critical bug found and fixed, re-verified against both the golden path and
the demo script with zero regression.

| # | Scenario | Result | Notes |
|---|----------|--------|-------|
| 1 | Happy path | **PASS** | Full golden path via demo candidate → role-sso-01 → assessment (8 questions) → profile → analysis → gaps → courses → learning-path, all 200/201. |
| 2 | Invalid resume | **PASS** | Wrong MIME type → `400` clear message; corrupt PDF content → `422` with "Try Demo Candidate" pointer. Neither crashed. |
| 3 | Mistral failure | **PASS** | Real PDF upload against the still-rate-limited `MISTRAL_API_KEY` (confirmed unchanged all session) → clean `422`, no crash. |
| 4 | Empty answer | **PASS** | Missing `selected_index` and non-integer `selected_index` both → automatic Pydantic `422`, no evidence recorded. |
| 5 | Duplicate question | **PASS** | Second submission for an already-answered `question_id` → `409`, no double-counted evidence. |
| 6 | Database failure | **FAIL → FIXED → PASS** | See "Critical Bug Found" below. |
| 7 | API error | **PASS** | Malformed JSON, missing required field, invalid-UUID path param, nonexistent candidate id — all clean `4xx` (422/404), never an unhandled 500/stack-trace leak. |
| 8 | Demo fallback | **PASS** | `POST /candidates/demo` succeeded normally immediately after the scenario-2/3 failures above — fully independent of what failed on the real-data path. |
| 9 | Frontend refresh | **PASS (code review only — not live-browser-tested)** | Re-verified `AppContext.tsx`'s `PersistedSession` interface against every current `useState` call: all session-defining state is either persisted (23 fields) or intentionally excluded with a documented reason (`allRoles`/`allCourses` — re-fetched fresh from their own catalog-load effects; `loading`/`errors` — transient). No gap found across the state Tasks 15-17 added. **A human should still confirm this live in a real browser** — no browser-automation tool was available in this environment (consistent with specs 013/014/016/017). |

### Critical Bug Found and Fixed (Scenario 6)

**Bug**: With the `competency-postgres` Docker container stopped, every backend request hung for 60+
seconds with no response (tested up to a 60s timeout with none returned) instead of failing with a
clear error — `create_engine()` in `backend/src/db.py` had no `connect_timeout`, so on this Windows
host a connection attempt against a stopped container's port hung on the OS's own TCP retry logic
rather than psycopg raising a prompt, catchable exception. This is exactly the kind of "frozen
frontend state" FR-002 forbids — a spinner that never resolves is indistinguishable from a crash to
a judge mid-demo.

**Fix**: Added `connect_args={"connect_timeout": 5}` to `create_engine()` in `backend/src/db.py`.
Re-tested: `GET /health` now returns a clean `{"status":"degraded","database":"unreachable",...}` in
~5.4s (previously 60+s / effectively unbounded); other endpoints (e.g. `GET /roles`) return a clean
`500` in ~10.7s (two connection attempts, IPv6 then IPv4, ~5s each) instead of hanging indefinitely.
The backend process itself never crashed at any point, before or after the fix, and recovered
automatically (no manual restart) once Postgres was restarted, both before and after the fix.

**Regression check (FR-004/FR-005)**: re-ran the full golden path (demo candidate → role-sso-01 →
assessment → profile → analysis → gaps → courses → learning-path, all 200/201) on the fixed backend
with zero regression.

### Non-Critical Issues Logged, Not Fixed (SC-003)

None found that fit this phase's "critical" bar during the nine-scenario pass itself. One item carried
forward from earlier phases, not new to this pass: `data_governance_ethics`/`sql_ctes`-adjacent
competencies (and most others) have exactly one seed question each in `assessment_seed.json`, so a
session running entirely on the seed fallback (Mistral down) completes early (8 of a 10 budget) once
every required competency's single seed is used — this is documented, intentional graceful-degradation
behavior (Rule 5), not a bug, and was already noted as an observation in spec 014's implementation
notes.

### Outstanding for a Human Before the Live Demo

1. Scenario 9's live browser confirmation (refresh mid-assessment, mid-results, etc.) — code-reviewed only.
2. The full timed rehearsal from Task 16 (`demo_plan.md` §16's checklist) — still needs a human with
   the actual presentation device/browser, as noted at the end of spec 017.
3. The offline screenshot fallback set (Task 16 FR-006) — still not captured, same reason.
