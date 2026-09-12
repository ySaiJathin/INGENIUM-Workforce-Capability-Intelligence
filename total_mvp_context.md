# total_mvp_context.md

## Competency Intelligence Platform — Single Source of Truth

Read this before touching `total_buildplan.md`, `demo_plan.md`, or writing any code. This is what any agent (or human) picking this project up should read first to know what the project is, what's already decided, what's built so far, and what's still left.

---

## 1. What This Project Is (Context)

A competency intelligence and personalized learning platform. It determines an employee's **current competency state**, compares it against the **competency requirements of a target role**, identifies **specific competency gaps**, and recommends **learning resources that close those gaps**.

It is explicitly **not**:
- a resume parser
- an AI chatbot

Core value chain:
```
Evidence → Current Competency → Target Role Requirements → Assessment
  → Verified Competency → Gap → Learning Intervention
```

Core demo transformation — this is the product's central "wow" moment, not a side screen:
```
BEFORE (resume estimate)              AFTER (verified)
SQL: 2.5/5, Confidence 54%    →       SQL: 3.1/5, Confidence 89%
                                       Required 4.0   Gap 0.9
```

The resume provides an initial, unverified estimate. The adaptive assessment verifies/refines it. The backend — never Mistral — owns the final score. This distinction must be visible in the UI.

**Current implementation state: 0% built.** Only documentation exists so far (`total_buildplan.md`, `total_mvp_context.md`, `CLAUDE.md`, `demo_plan.md`). No repo scaffold, no database, no API, no frontend yet. Architecture is frozen — see §3. ~13 hours remain from kickoff.

---

## 2. Datasets & Model In Use

**One external reference dataset — ESCO v1.2.1, restricted to 4 active files** (already present locally under `data/raw/esco/` — do not download anything else):

```
data/raw/esco/
├── occupations_en.csv
├── skills_en.csv
├── occupationSkillRelations_en.csv
└── skillsHierarchy_en.csv
```

Any other ESCO file present in the folder is optional reference material only — not part of the active pipeline. Do not require the full ESCO package at runtime.

**One local embedding model — already downloaded, used as-is, no training/fine-tuning:**

```
models/all-MiniLM-L6-v2/
```

Used for semantic similarity: competency matching, course matching. This is an optional layer over deterministic matching, not a replacement for it.

**Curated application data — built during implementation, NOT downloaded datasets:**

```
data/curated/
├── roles.json            5–8 target roles
├── competencies.json     30–50 competencies, derived from ESCO and adapted for the MVP
├── courses.json          30–50 curated learning resources
└── assessment_seed.json  20–30 seed assessment questions (Mistral generates more on top)
```

**Retired / explicitly not used:** Kaggle job-postings dataset, job-demand scoring, "officer selector" flow — all belonged to an earlier architecture and are dropped from this build.

**LLM: Mistral, via API only** — not a local model, no local download. Used for resume extraction, adaptive question generation, question explanation, optional open-ended answer evaluation, natural-language explanations. Mistral never owns the final skill score, role requirements, competency hierarchy, or course-matching rules — those stay deterministic and backend-owned.

---

## 3. Proposed Full Architecture (Frozen)

```
                    ┌──────────────────────┐
                    │        React         │
                    │ TypeScript + Tailwind│   ← built LAST
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │       FastAPI        │
                    └──────────┬───────────┘
                               │
              ┌────────────────┼─────────────────┐
              │                │                 │
              ▼                ▼                 ▼
       Resume Engine     Assessment Engine   Gap Engine
              │                │                 │
              ▼                ▼                 │
        Mistral API       Mistral API            │
              │                │                 │
              └────────┬───────┘                 │
                       ▼                          │
               Deterministic Logic                │
                       │                          │
                       ▼                          │
                  PostgreSQL ◄─────────────────────┘
                       │
                       ▼
                Course Matching
                       │
                       ▼
                Learning Path
                       │
                       ▼
                     React
```

Optional semantic layer: `all-MiniLM-L6-v2` → cosine similarity → course/competency matching. FAISS is optional — with 30–50 item catalogues, plain cosine similarity over embeddings is almost certainly sufficient; add FAISS only if that proves too slow.

**Stack:** React + TypeScript + Vite + Tailwind · FastAPI · PostgreSQL · Mistral API · `all-MiniLM-L6-v2` · ESCO v1.2.1 (4-file active subset).

**Technical responsibility matrix:**
```
Mistral API                → generative intelligence only: resume extraction, competency
                              normalization, adaptive question generation (one at a time),
                              open-ended answer evaluation (evidence signal only),
                              explanations, offline course-competency mapping. Stateless —
                              never remembers a prior call; every request carries only the
                              context that operation needs.
FastAPI                    → business logic / API / orchestration / Mistral operation router
Deterministic scoring       → final skill scores, MCQ correctness, confidence aggregation
                              (never Mistral)
Competency framework        → proficiency definitions, role requirements, hierarchy
(curated JSON / DB-seeded)   (never invented by Mistral at runtime)
PostgreSQL                  → persistent state, keyed by candidate_id (supports many
                              concurrent candidates independently)
ESCO (4 active files)       → occupational/skill reference, used offline to derive the
                              curated competency framework — not queried live
MiniLM                      → semantic similarity only (optional layer)
React                       → interaction and visualization (built last); calls FastAPI
                              only, never Mistral directly
```

The full Mistral prompt architecture — base rules, per-operation prompts, JSON schemas, validation/retry/fallback, and call-frequency budget — is specified in `total_buildplan.md` §7 (summary) and §27 (implementation-ready detail). Mistral is never sent the full product specification on a call; every request is `BASE_RULES + operation-specific prompt + minimal request-specific data`.

Frontend is deliberately built last, after backend/data/assessment/scoring/gap/recommendation logic is working and verified via API calls (`curl`/httpie), not through the UI.

---

## 4. What's Included in This MVP (P0)

```
FastAPI, PostgreSQL, ESCO subset, curated competencies/roles/courses,
resume upload, Mistral resume extraction, target role selection,
adaptive assessment (Mistral-generated questions, deterministic routing),
deterministic scoring, skill gaps, course recommendations, learning path,
React UI, "Try Demo Candidate" fallback, end-to-end integration
```

**Golden path (the one thing that must always work):**
```
Landing → Resume Upload (or Try Demo Candidate) → Initial Candidate Profile
  → Target Role Selection → Role Requirements → Adaptive Assessment
  → Verified Skill Profile → Skill Gap Analysis → Course Recommendations
  → Personalized Learning Path
```
If time runs short, this is what survives. Everything else is negotiable.

**P1 — only if time remains after P0 works end-to-end:**
```
FAISS, advanced semantic retrieval, practical SQL assessment,
open-ended answer evaluation, advanced animations, additional charts
```

**P2 / explicitly excluded — do not build during this MVP:**
```
❌ MCP infrastructure (Mistral → MCP agent → MCP server → tools → DB)
❌ Kaggle job-postings dataset / job-demand scoring (retired earlier architecture)
❌ Two-account backend/frontend split (retired)
❌ Model training / fine-tuning, multiple LLMs, multiple embedding models
❌ Microservices, Kubernetes, Redis, Kafka, message queues
❌ IRT / Bayesian psychometrics / complex statistical scoring
❌ Production-scale authentication, enterprise cloud architecture
❌ Massive / complex recommendation engine
❌ Full ESCO ontology beyond the 4 active files
```

## 5. What to Revisit After the MVP (Post-Hackathon Backlog)

Every item in the P2 list above, plus:
```
- MCP as a real agent/tool layer, once the deterministic backend is proven
- FAISS-backed retrieval if the course catalogue grows well past ~50 items
- Practical SQL assessment against a sandboxed sample DB (dropped from MVP if it
  risks the main assessment timeline)
- Open-ended answer evaluation by Mistral (structured MCQ is the MVP baseline)
- Real job-market data (Kaggle or otherwise) to replace curated role/competency data
  with something demand-driven
- IRT-style adaptive assessment in place of the simple deterministic router
- Multi-role, multi-department competency frameworks beyond the 5–8 curated roles
- Production auth, multi-tenant support, real personnel data handling
```
Anyone continuing this project after the hackathon should treat this section as the starting backlog, not as new discovery work.

---

## 6. High-Level Tasks — Phases To Finish By Tomorrow

```
Phase 0  Environment & Repo Setup
Phase 1  Data Foundation (curated JSON from ESCO)
Phase 2  Database Foundation (PostgreSQL schema + seed)
Phase 3  Backend API Foundation (health, roles, competencies, courses)
Phase 4  Resume Processing (upload → Mistral extraction → initial profile)
Phase 5  Target Role & Requirement Engine
Phase 6  Adaptive Assessment Engine (Mistral question gen + deterministic routing)
Phase 7  Deterministic Scoring Engine
Phase 8  Skill Gap Engine
Phase 9  Course Recommendation Engine
Phase 10 Learning Path Engine
Phase 11 Frontend Foundation           ← starts only after Phases 1–10 are API-verified
Phase 12 Frontend Candidate Flow (upload, initial profile, role select)
Phase 13 Frontend Assessment Screen
Phase 14 Frontend Results (gap, courses, learning path)
Phase 15 Full Integration (frontend ↔ FastAPI ↔ PostgreSQL ↔ Mistral)
Phase 16 Demo Implementation ("Try Demo Candidate" + polish)
Phase 17 Final Testing & Demo Rehearsal
```

**13-hour timeline:**
```
0:00–0:20     Phase 0
0:20–1:40     Phases 1–2
1:40–3:30     Phase 3
3:30–5:30     Phase 4
5:30–7:30     Phases 6–7
7:30–9:30     Phases 11–13
9:30–10:30    Phase 14
10:30–11:15   Phase 15
11:15–12:00   Phase 16
12:00–13:00   Phase 17
```
(Phases 5, 8, 9, 10 are interleaved into the backend block, roughly 3:30–7:30.)

**Status tracker (update as you go — this is what tells the next agent/session exactly how far the project has gotten):**
```
Phase 0  – [x] complete (2026-09-12) — health/DB reachability confirmed live; see specs/020-phase-0-diagnose-stabilize/diagnosis.md
Phase 1  – [x] complete (2026-09-12) — curated data foundation confirmed present/loaded, see specs/002-task-1-data-foundation
Phase 2  – [x] complete (2026-09-12) — PostgreSQL schema/seed confirmed live via /roles, /competencies queries
Phase 3  – [x] complete (2026-09-12) — GET /health, /roles, /roles/{id} confirmed live this session
Phase 4  – [x] complete (2026-09-12) — POST /candidates/resume and /candidates/demo confirmed live, real extraction + graceful Mistral-failure fallback verified
Phase 5  – [x] complete (2026-09-12) — target-role selection (POST /candidates/{id}/target-role) confirmed live
Phase 6  – [x] complete (2026-09-12) — adaptive assessment loop (start/next-question/answer) confirmed live, seed-fallback path exercised and correct
Phase 7  – [x] complete (2026-09-12) — deterministic scoring (GET /assessment/{id}/profile) confirmed live
Phase 8  – [x] complete (2026-09-12) — skill gap engine (POST /analysis, GET .../gaps) confirmed live and deterministic
Phase 9  – [x] complete (2026-09-12) — course recommendation engine (GET .../courses) confirmed live with explainable match_reason
Phase 10 – [x] complete (2026-09-12) — learning path (POST /learning-path) confirmed live
Phase 11 – [x] complete (2026-09-12) — frontend foundation confirmed present, see specs/012-task-11-frontend-foundation
Phase 12 – [x] complete (2026-09-12) — see specs/013-task-12-frontend-candidate-flow/tasks.md
Phase 13 – [x] complete (2026-09-12) — see specs/014-task-13-frontend-assessment/tasks.md
Phase 14 – [x] complete (2026-09-12) — see specs/015-task-14-frontend-results/tasks.md
Phase 15 – [x] complete-with-caveats (2026-09-12) — API-level contract audit clean (0 mismatches, 21 shapes checked) and 2x full golden-path regression run passed; SC-001's literal browser run and SC-002's demo-path real-data requirement NOT met (no browser tool available this session; demo mode is still 100% mock, deferred to Task 16 per spec 013) — see specs/016-task-15-integration/tasks.md
Phase 16 – [x] complete-with-caveats (2026-09-12) — real POST /candidates/demo wired, all 5 demo-mode mock short-circuits in AppContext.tsx removed (closes the gap specs 013/016 flagged), live-verified end-to-end producing the intended SQL/Window-Functions gap story with real course matching; screenshot fallback set (T010) and the timed human rehearsal still outstanding — see specs/017-task-16-demo-implementation/tasks.md
Phase 17 – [x] complete-with-caveats (2026-09-12) — all 9 named scenarios tested live against a real backend; 1 critical bug found and fixed (unbounded DB-outage hang in backend/src/db.py's create_engine, now bounded to ~5-10s with a clean error via connect_timeout), re-verified against the golden path and demo script with zero regression — see specs/018-task-17-final-testing/checklists/requirements.md for the full pass/fail table
```

**Final project status (2026-09-12, end of Phase 17)**: Phases 12-17 (the frontend candidate-intake
flow through final testing) were completed and live-verified end-to-end in this session. Phases 0-11
(backend/data foundation through frontend foundation), listed above as "not started" for a period after
Phase 17 closed, have since been formally closed out by a dedicated Phase 0 diagnosis pass
(`specs/020-phase-0-diagnose-stabilize/diagnosis.md`, 2026-09-12) — every one of them was confirmed
working via direct, live API testing (not just "the code looks right"). **Three items remain outstanding
before presenting to judges**, none of them code: (1) a human must click through `quickstart.md`'s
browser-driven steps at least once — no browser-automation tool was available in any session that
touched Phases 12-18, so every "browser" step across those specs was substituted with an equivalent
API-level replay; (2) the offline screenshot fallback set (Task 16 FR-006) has not been captured; (3)
the full timed demo rehearsal on the actual presentation device (`demo_plan.md` §16's checklist) has
not been run by a human.

**Numbering note**: the "Phase 0-17" scheme above is `build_plan.md`'s Task numbering (Task 0 =
environment setup, Task 1 = data foundation, etc. — this document's own §6 heading). It is a
**separate, unrelated numbering** from `INGENIUM_MASTER_FUNCTIONALITY_AND_MCP_IMPLEMENTATION.md`'s
own "Phase 0" through "Phase 7" (diagnose/stabilize through full integration, covering the new MCP +
FAISS work), tracked instead in `specs/020-phase-0-diagnose-stabilize/` through
`specs/027-phase-7-full-integration/`. Do not conflate the two when reading either document's "Phase
N" references.

---

## 7. Non-Negotiable Rules

See `CLAUDE.md` for the full rulebook, and `total_buildplan.md` §7/§27 for the full Mistral architecture. The essentials, restated here so this doc is self-contained for a fresh agent:

- Backend owns the final score, gap math, role readiness, and course-matching. Mistral never does.
- MCQ answers are graded deterministically by the backend (`candidate_answer == correct_answer`) — never a Mistral call. Mistral evaluation is used only for open-ended answers, and even then produces an evidence signal, not a score.
- Every Mistral response is schema-validated (Pydantic); on parse failure, retry once, then fall back to `assessment_seed.json` or a controlled error.
- Mistral is stateless and never sent the full product specification — every call is `BASE_RULES + operation prompt + minimal request-specific data`, and calls are minimized (~9–14 total per candidate workflow — see `total_buildplan.md` §7.2).
- The frontend never calls Mistral directly and never sees the API key, prompts, or raw Mistral output — only `React → FastAPI → Mistral`.
- Frontend is built last, only once backend endpoints return real (non-mock) data.
- Never sacrifice the golden path (§4) for an optional feature; cut P1 first if time runs short.
- "Try Demo Candidate" must exist and enter the identical downstream pipeline as a real resume upload.
- No new architecture without a genuine implementation blocker — this document's architecture (§3) is frozen.

---

## 8. Related Documents

```
total_buildplan.md   → detailed task breakdown, dependencies, testing/performance/risk strategy
CLAUDE.md             → full operating rulebook (what not to do, LLM boundaries, failure handling)
demo_plan.md          → judge-facing demo script, rehearsal checklist, failure recovery
```
