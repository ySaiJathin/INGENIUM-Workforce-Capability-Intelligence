# INGENIUM — MASTER FUNCTIONALITY, MCP & END-TO-END IMPLEMENTATION PLAN

> Decisions confirmed 2026-09-11: MCP becomes a mandatory core layer (reverses CLAUDE.md
> Rule 3), FAISS is added as a required evidence-retrieval layer (reverses CLAUDE.md
> Rules 2/13 re: no new infra), and execution/testing during implementation happens by
> Claude giving exact commands and the developer running them on their own machine and
> reporting results back (Claude currently cannot execute shell commands on this machine
> directly — file read/write access works, command execution doesn't, pending a fix on
> the device side).
>
> **Update 2026-09-11 (real-resume-upload bug observed):** uploading a real PDF resume
> currently returns "Unable to parse resume. Try Demo Candidate instead." — a generic 422
> raised by either PDF text extraction failing or the Mistral extraction call failing (see
> Task 0.4/0.6 and Task 1.4 below, updated accordingly). Two concrete fixes are now folded
> into this plan:
> 1. **The "Swagger"/API-contract fix in Task 0.4/0.6 is specifically about confirming and
>    fixing real PDF acceptance** on `POST /candidates/resume` — i.e. that a real PDF's
>    `content_type` (`application/pdf`) and bytes are actually accepted and successfully
>    text-extracted end to end, not just that the route exists.
> 2. **Mistral's resume-extraction schema (Task 1.4) is narrowed**: Mistral should return
>    only the candidate's **name** and a **list of skills, each with its supporting
>    evidence snippet** — not the full candidate/education/certifications/experience
>    block the current `_RESUME_EXTRACTION_PROMPT` in `mistral_client.py` asks for.

## MASTER INSTRUCTION FOR CLAUDE CODE

You are working on the existing Ingenium / Competency Gap MVP codebase.

Your job is NOT to create a new application from scratch.

Your job is to:

1. Inspect the existing repository.
2. Understand the current implementation.
3. Diagnose broken functionality.
4. Update the project's `CLAUDE.md` rules to reflect this implementation plan.
5. Implement the missing/broken functionality.
6. Integrate Mistral through a controlled MCP/tool layer.
7. Preserve the existing architecture wherever possible.
8. Test every phase before proceeding.
9. Complete the entire golden path without manual database or terminal intervention
   (from the end user's point of view — during *development*, the developer running
   Claude's given commands and reporting output back is expected and required, since
   this session cannot execute commands on this machine itself. See "Execution &
   Testing Protocol" below).

The final application must work as:

```
REAL RESUME
    ↓
RESUME TEXT EXTRACTION
    ↓
SKILL EXTRACTION
    ↓
SKILL NORMALIZATION
    ↓
MINILM / ESCO MAPPING
    ↓
INITIAL CANDIDATE PROFILE
    ↓
TARGET ROLE
    ↓
MISTRAL + MCP ASSESSMENT CONTEXT
    ↓
STRUCTURED QUESTIONS
    ↓
ADAPTIVE ASSESSMENT
    ↓
DETERMINISTIC SCORING
    ↓
COMPETENCY PROFILE
    ↓
GAP ANALYSIS
    ↓
PRIORITY
    ↓
COURSE RECOMMENDATIONS
    ↓
FAISS EVIDENCE
    ↓
MCP-ACCESSIBLE EVIDENCE
    ↓
MISTRAL RAG PLANNER
    ↓
GROUNDED LEARNING PLAN
```

NO MANUAL DATABASE EDITS.
NO TERMINAL INTERVENTION BETWEEN SCREENS (in the running app, for an end user).
NO MOCK RESPONSE HIDING A BROKEN REAL PIPELINE.

---

## EXECUTION & TESTING PROTOCOL (read this before Phase 0)

This session (Claude, in Cowork) can read, search, and edit every file in this repo
directly on the developer's machine. It **cannot currently run shell commands** there —
`docker compose`, `pytest`, `uvicorn`, `npm run dev`, `curl`, etc. — because command
execution on this machine is currently broken for this session (file access is fine).
Until that's fixed, every "TEST"/"VERIFY" step in this plan works like this instead:

```
Claude edits the relevant file(s)
        ↓
Claude gives the developer the EXACT command(s) to run and what output to expect
        ↓
Developer runs them locally and pastes back the actual output (or a screenshot)
        ↓
Claude reads that output, confirms pass/fail, and only then moves to the next task
```

No phase or task is marked complete on the strength of "the code looks right" — only on
an actual reported command result matching the expected result. If command execution on
this machine starts working again mid-project, Claude should say so and switch back to
running verification itself.

---

## 0. READ BEFORE TOUCHING CODE

First read:

- `CLAUDE.md`
- `total_mvp_context.md`
- `total_buildplan.md`
- `demo_plan.md`

(`claude_account_1_backend.md` and `claude_account_2_frontend.md` are retired stub files
— each just says "RETIRED, please delete me," pointing at an abandoned two-account split.
They have no task content. Skip reading them for content; they should be deleted as a
small cleanup once confirmed, separately from this plan.)

Then inspect:

- `/backend`
- `/frontend`
- `/data` (`data/curated/` — roles.json, competencies.json, courses.json,
  assessment_seed.json, demo_candidate.json; `data/raw/esco/` — the 4 active ESCO CSVs)
- `/models` (`all-MiniLM-L6-v2/`)
- `/scripts`
- `/.specify/specs/` — 18 existing spec-kit folders (001 through 018), each with its own
  `spec.md`/`plan.md`/`tasks.md`/`contracts/`; treat these as prior art describing what
  was already planned and (per their own status notes) largely implemented — do not
  duplicate a spec that already exists here without reading it first
- `docker-compose.yml`
- `.env` / `.env.example`

Do not assume that the documentation matches the implementation.

The repository is the source of truth for current implementation.
The documents are the intended architecture.

**Known discrepancy — closed out (2026-09-12, this master document's own Phase 7):** this note
originally flagged that `total_mvp_context.md` §1 stated "Current implementation state: 0% built,"
stale even at the time this document was written, since real code already existed for every major
engine and the full frontend. That line has since been corrected in `total_mvp_context.md` §1, and
this master document's own Phase 0 through Phase 7 are now all complete and live-verified — see
`specs/020-phase-0-diagnose-stabilize/` through `specs/027-phase-7-full-integration/`, and
`specs/027-phase-7-full-integration/results.md` for the final whole-system confidence pass. This
note is left in place, rather than deleted, as the historical record of the discrepancy a fresh
session would otherwise have been misled by.

Identify:

```text
WHAT EXISTS
WHAT WORKS
WHAT IS BROKEN
WHAT IS PARTIALLY IMPLEMENTED
WHAT IS MISSING
WHAT API CONTRACTS CURRENTLY EXIST
```

Before making changes, create a concise implementation diagnosis.

## 1. UPDATE CLAUDE.MD FIRST

Update `CLAUDE.md` to make THIS document the active implementation authority.

The updated `CLAUDE.md` must explicitly state:

**Product goal**

Ingenium is an explainable workforce competency intelligence system.

Golden path:

```text
Resume
→ Candidate Skill Profile
→ Target Role
→ Adaptive Assessment
→ Validated Competency Profile
→ Skill Gaps
→ Priority
→ Courses
→ Evidence
→ Personalized Learning Plan
```

**Architecture**

```text
React
   ↓
FastAPI
   ↓
Application Services
   ├── Resume Service
   ├── Skill Extraction Service
   ├── Assessment Engine
   ├── Scoring Engine
   ├── Gap Engine
   ├── Course Engine
   └── Evidence/RAG Engine
             ↓
       MCP Tool Layer
             ↓
          Mistral
```

MCP is a controlled tool/context interface. MCP is NOT allowed to become the authority
for: competency scores, gap calculations, priority calculations, course ranking. Those
remain deterministic backend responsibilities.

**LLM responsibility**

Mistral may: extract structured skills, generate assessment questions, evaluate
open-ended responses where applicable, explain results, generate grounded learning plans.

Mistral may NOT: invent competency frameworks, invent role requirements, assign final
competency scores, calculate final gaps, rank courses independently, invent evidence.

**MCP responsibility**

MCP tools provide controlled access to application state and retrieval functions.

**Explicit rule changes vs. the prior CLAUDE.md** (state this plainly in the file so no
future session gets confused by the contradiction):

- Old Rule 3 ("MCP Is Optional, Not a Dependency") is **superseded**. MCP is now a
  required core layer, not an optional post-MVP extra.
- Old Rule 2 ("Do Not Redesign Architecture") / Rule 13 ("do not add infrastructure for
  performance") are **superseded specifically for the MCP tool layer and the FAISS
  evidence index** — those two additions are now part of the frozen architecture. No
  other new infrastructure (Redis, Kafka, Kubernetes, microservices, etc.) is authorized
  by this change.
- All other original CLAUDE.md rules (deterministic scoring stays backend-owned, no
  silent exception-swallowing, validate all LLM output, PostgreSQL only, no secrets
  committed, etc.) remain in force unchanged.

## 2. IMPLEMENTATION RULES

Follow these rules throughout the build.

**Rule 1 — Diagnose before modifying**

Never make speculative changes. Always:

```text
reproduce
→ identify layer
→ inspect code
→ modify
→ test
```

**Rule 2 — One phase at a time**

Do not jump from Phase 0 to Phase 4. Complete each phase and its acceptance criteria.

**Rule 3 — Preserve working code**

Do not rewrite working modules unnecessarily.

**Rule 4 — No silent failures**

Never:

```python
except Exception:
    pass
```

**Rule 5 — Validate all LLM responses**

No generated response enters the database without schema validation.

**Rule 6 — Deterministic authority**

Backend code owns: scoring, gap, priority, course ranking.

**Rule 7 — Fallbacks**

LLM failure must not destroy the entire demo. Use deterministic fallback behavior where
practical.

**Rule 8 — Every endpoint must have:**

```text
success
loading
empty
validation error
runtime error
```

**Rule 9 — Do not add unnecessary infrastructure.**

Do not introduce Kubernetes, Redis, Kafka, Elasticsearch, Celery, microservices, or
complex authentication unless the current repository proves it is required. (MCP and
FAISS are the two explicitly authorized exceptions per the CLAUDE.md update in §1 —
nothing else.)

**Rule 10 — MCP must remain small and explainable.**

Do not create an autonomous, uncontrolled agent.

## PHASE 0 — DIAGNOSE + STABILIZE EXISTING SYSTEM

### Objective

Get the current application into a stable, verified state before implementing new
functionality, and produce an honest picture of what actually exists (see the "known
discrepancy" note in §0).

### TASK 0.1 — Repository audit

Inspect: backend routes, frontend API client, database models, services, LLM
integrations, resume parser, assessment implementation, course matcher, and confirm
there is (currently) no FAISS implementation anywhere (`requirements.txt` has none).

Produce an internal checklist:

```text
DONE
BROKEN
MISSING
PARTIAL
```

Do not modify anything yet.

### TASK 0.2 — Verify backend port

Determine exactly which port FastAPI uses (per `quickstart.md`, default 8000, but check
for local port conflicts as that doc warns). If backend is on a different port, frontend
must set `VITE_API_BASE_URL` to match. Do not assume port 8000 — confirm.

Restart Vite after modifying `.env`. Verify through the browser Network tab or a curl the
developer runs.

### TASK 0.3 — Verify health endpoint

Developer runs:

```http
GET /health
```

Expected:

```json
{ "status": "ok" }
```

Fix this before continuing if broken.

### TASK 0.4 — Verify resume route ("Swagger fix" = confirm real PDF acceptance)

Verify the actual current route and field name in `backend/src/api/candidates.py` (do
not assume `POST /candidates/resume` with field `resume` until confirmed against the
real code — read the file first).

Frontend must send `FormData` and must NOT manually set the multipart `Content-Type`
header.

**This is where the observed "Unable to parse resume" bug lives.** Confirm, using the
route's Swagger/OpenAPI docs (`/docs`) and a real PDF, that: the endpoint actually accepts
`application/pdf` uploads end to end (not just that the content-type check passes); PDF
text extraction (`resume_extraction.py`) succeeds on a real, non-scanned PDF; and the
downstream Mistral call (Task 1.4/1.4a below) succeeds or fails independently and
distinguishably from a PDF-parsing failure — the two currently collapse into one identical
frontend message, which is itself worth fixing (see error contract in §10) once the root
cause is confirmed via the developer's backend log output.

### TASK 0.5 — Diagnose 405 (if found)

If `405 Method Not Allowed` appears: determine whether GET, OPTIONS, or POST caused it,
and fix the actual cause (frontend call, CORS config, or router registration) rather than
guessing.

### TASK 0.6 — Diagnose 422 (if found)

If `422 Unprocessable Entity` appears: inspect the FastAPI validation response body,
verify the expected field/type, and return useful structured errors.

### TASK 0.7 — CORS

Confirm CORS config in `backend/src/main.py` actually matches the frontend's real origin
in dev. (Currently `allow_origins=["*"]` — flag if this is intentionally permissive for
the hackathon, per the code's own comment, rather than "fix" it away.)

### TASK 0.8 — Resume parser

Confirm `resume_extraction.py`'s actual current behavior for: empty file, corrupt file,
unsupported extension, image-only PDF, no extracted text. Fix only what's actually
broken.

### TASK 0.9 — Regression tests

Confirm what test coverage already exists before writing new tests; add tests for gaps
found (health, resume upload, invalid extension, empty resume, unreadable resume, valid
PDF, valid DOCX).

### PHASE 0 ACCEPTANCE

Phase 0 is complete only when the developer has run and reported back a successful
`POST` to the real resume-upload route with a valid file (201, text extracted) and a
clear error for at least one invalid-file case.

## PHASE 1 — RESUME INTELLIGENCE

### Objective

Confirm/complete the pipeline that converts an uploaded resume into a reliable initial
candidate skill profile. **Read `resume_extraction.py`, `mistral_client.py`,
`competency_mapping.py`, and the `candidates` model/schema first** — much of this may
already exist; treat every task below as "confirm, then fix gaps," not "build fresh."

### TASK 1.1 — Resume extraction service

Confirm a clear boundary exists: `extract_resume_text(file) -> ResumeText`, returning
text, page count, character count. Build/fix only what's missing.

### TASK 1.2 — Text cleaning

Normalize whitespace, line breaks, encoding, duplicate text — preserving meaningful
resume evidence.

### TASK 1.3 — Raw skill extraction

Confirm skills are extracted via a deterministic keyword/rule layer plus Mistral
structured extraction — not exclusively Mistral.

### TASK 1.4 — Mistral skill schema (narrowed scope)

**Updated 2026-09-11:** Mistral's resume-extraction call should return only the
candidate's **name** and a **skills list, each with its supporting evidence snippet** —
not the full `candidate`/`education`/`certifications`/`experience` block the current
`_RESUME_EXTRACTION_PROMPT` in `mistral_client.py` requests. Narrow the prompt and
`ResumeExtractionResponse` schema accordingly:

```json
{
  "candidate_name": "...",
  "skills": [
    { "name": "Python", "confidence": 0.91, "evidence": "Used Python for data analysis" }
  ]
}
```

Validate using Pydantic. `competency_id`/mapping to the internal competency framework
still happens exactly as today (Task 1.5–1.7) — only the shape of what Mistral itself is
asked to return gets smaller; the ESCO/competency-mapping pipeline downstream is
unaffected. Dropping education/certifications/experience from the request also shrinks
the prompt payload and JSON Mistral has to produce correctly, which should make the
extraction call itself more reliable (fewer schema-validation failures triggering the
retry-then-422 path in Task 0.4).

### TASK 1.5 — Normalize skills

E.g. `py → python`, `postgres → postgresql`, `data analytics → data analysis`.

### TASK 1.6 — MiniLM

Confirm `sentence-transformers/all-MiniLM-L6-v2` (already present locally) is used to
embed normalized skills, with caching where sensible.

### TASK 1.7 — ESCO mapping

```text
raw skill → embedding → top ESCO candidates → threshold → canonical skill
```

Use: `>= .80` automatic, `.65–.79` cautious/secondary confirmation, `< .65` unresolved.
Never silently discard unresolved skills.

### TASK 1.8 — Initial candidate profile

Persist candidate_id, skill, ESCO skill, confidence, evidence, resume estimate,
source = resume. The resume profile is an INITIAL signal, not the final competency score.

### PHASE 1 ACCEPTANCE

Developer runs a real PDF upload end-to-end (extraction → skills → normalization →
MiniLM → ESCO → profile → frontend) and confirms it works without manual intervention.

## PHASE 2 — LLM + MCP LAYER

### Objective

Create a controlled, reusable Mistral + MCP architecture — this is genuinely new work
(no MCP layer currently exists in this repo). This phase establishes the intelligence
layer used by assessment and RAG.

### TASK 2.1 — Mistral client

Confirm/consolidate a single Mistral integration service (`mistral_client.py` already
exists — read it first) responsible for request, timeout, retry, structured output,
error handling, logging. Do not scatter Mistral API calls throughout route handlers.

### TASK 2.2 — MCP server

Create a small MCP server/tool layer (new — add the official `mcp` Python SDK to
`requirements.txt`, flagged explicitly as a deliberate, authorized new dependency per the
CLAUDE.md update in §1). The MCP server exposes application capabilities as controlled
tools. Do NOT expose arbitrary database execution. Do NOT create `execute_sql(query)` as
a general-purpose tool.

### TASK 2.3 — MCP tool definitions

Implement tools approximately equivalent to: `get_candidate_profile`, `get_target_role`,
`get_role_requirements`, `get_competency_framework`, `get_assessment_context`,
`get_previous_questions`, `get_skill_evidence`, `get_gap_analysis`,
`get_course_recommendations`, `get_relevant_evidence`.

Each tool must have: name, description, input schema, output schema, validation, error
behavior.

### TASK 2.4 — Candidate profile tool

Input: `{ "candidate_id": "uuid" }` → Output: `{ "candidate_id": "uuid", "skills": [...] }`

### TASK 2.5 — Role tool

Input: `{ "role_id": "uuid" }` → Output: `{ "role_id": "uuid", "role_name": "...", "required_competencies": [...] }`

### TASK 2.6 — Competency framework tool

Return only the static competency framework. Mistral must generate questions within this
framework and cannot invent new competencies.

### TASK 2.7 — Assessment context tool

Input: `{ "session_id": "uuid" }` → Return candidate profile, target role, current
competency, allowed sub-competencies, current estimated level, question history,
difficulty, remaining question budget. This becomes the controlled context used by
Mistral.

### TASK 2.8 — Evidence tool

Input: `{ "query": "SQL window functions", "top_k": 5 }` → Return retrieved evidence with
id, source, text, similarity. FAISS performs retrieval; MCP exposes the capability.

### TASK 2.9 — Structured LLM output

Every Mistral workflow: prompt → structured response → schema validation → application
validation → persistence. Never prompt → raw string → database.

### TASK 2.10 — Retry

LLM request → failure → one retry → fallback. Do not create infinite retries.

### TASK 2.11 — Persistence

Persist important LLM artifacts (generated question, structured response, timestamp,
session) — never secrets.

### PHASE 2 ACCEPTANCE

Developer-verified demonstration of: Application → MCP tool → application data →
structured context → Mistral → validated JSON, without direct arbitrary database access
from the LLM.

## PHASE 3 — ADAPTIVE ASSESSMENT

### Objective

Use the candidate's resume profile + target role + competency framework to produce a
real adaptive assessment. **`assessment_engine.py` and `scoring_engine.py` already
exist** — read them first; this phase is primarily "wire MCP context into the existing
engine," not "build an assessment engine from zero."

### TASK 3.1 — Target role

Confirm `GET /roles`, `GET /roles/{id}` display required competencies (read
`roles.py` first).

### TASK 3.2 — Assessment session

Confirm/build a session-start endpoint storing session_id, candidate_id, role_id, status,
question_budget (read `assessment.py` first — this likely already exists in some form).

### TASK 3.3 — Initial assessment state

Use resume-derived signals + target role requirements + competency framework as
priors/signals only (not the final score) to determine where the assessment starts.

### TASK 3.4 — Mistral question generation

```text
assessment session → MCP get_assessment_context → structured context → Mistral
  → question JSON → schema validation → application validation → persist
```

### TASK 3.5 — Question schema

```json
{
  "question": "...", "type": "mcq", "options": ["...", "...", "...", "..."],
  "correct_answer": 1, "skill": "SQL", "competency": "window_functions",
  "difficulty": 3, "explanation": "..."
}
```

Validate skill exists, competency exists, difficulty valid, answer valid, options valid.

### TASK 3.6 — MCP context restriction

Mistral must not receive arbitrary application state — only what defined tools/services
provide.

### TASK 3.7 — Ask question / TASK 3.8 — Submit answer

Frontend gets one valid question at a time; backend evaluates the response. Never trust
frontend scoring.

### TASK 3.9 — Adaptive routing

Correct → increase difficulty/advance. Wrong → remain on competency / test prerequisite.
Repeated success → confidence increases. Repeated failure → competency weak. Stop on
sufficient confidence or exhausted question budget. Never repeat an identical question.

### TASK 3.10 — Mistral evaluation

MCQ: backend knows correctness directly. Open-ended (if enabled): Mistral evaluates via
structured rubric → backend converts result into a deterministic score. Mistral never
becomes the final score authority.

### TASK 3.11 — Deterministic scoring

Sub-competency score → weighted skill score → 1–5 proficiency → confidence. Persist
scores.

### TASK 3.12 — Fallback question bank

Mistral fails → retry → deterministic question bank (`assessment_seed.json`, already
present) → continue assessment.

### PHASE 3 ACCEPTANCE

Developer-verified: select role → start assessment → receive Mistral-generated
structured question → answer → receive next adaptive question → finish → receive
deterministic competency profile.

## PHASE 4 — COMPETENCY INTELLIGENCE

### Objective

Transform assessment results into actionable workforce intelligence. **`gap_engine.py`
already exists** — read it first.

### TASK 4.1 — Skill profile

Per competency: current level, confidence, strong areas, weak areas, evidence.

### TASK 4.2 — Required role profile

Role, required skills, required levels, role importance.

### TASK 4.3 — Gap calculation

`gap = required - current`, clamped to zero minimum.

### TASK 4.4 — Demand

`skill_demand = jobs_requiring_skill / total_jobs`. **Note:** the Kaggle job-postings
dataset this formula implies is explicitly retired per `total_mvp_context.md` §2 ("belonged
to an earlier architecture and are dropped from this build"). Confirm with the developer
what demand signal actually exists before implementing this — do not silently reintroduce
a retired dataset.

### TASK 4.5 — Priority

`priority = gap × demand × role_importance`, normalized to 0–100.

### TASK 4.6 — Explainability

Every gap must show: current, required, gap, demand, role importance, priority.

### PHASE 4 ACCEPTANCE

A real example (e.g. SQL: current 3.1/5, required 4.0/5, gap 0.9, demand 72%, role
importance High, priority 84/100) generated from real backend calculations, confirmed by
the developer.

## PHASE 5 — COURSE INTELLIGENCE

### Objective

Recommend courses that specifically address identified gaps. **`course_recommendation_
engine.py` already exists** — read it first.

### TASK 5.1 — Course data

Verify the seeded `courses.json` dataset (course_id, title, description, provider,
skills, quality metadata, duration if available).

### TASK 5.2 — Course embeddings

Use `all-MiniLM-L6-v2` for semantic matching.

### TASK 5.3 — Gap-to-course matching

```text
gap → course skill coverage → semantic similarity → quality → coverage → course score
```

### TASK 5.4 — Deterministic ranking

`course_score = skill_match × course_quality × coverage`. Mistral must not decide final
ranking.

### TASK 5.5 — Explain recommendation

Return course, match score, skills closed, skills not closed, reason (e.g. "Recommended
because it closes: ✓ SQL CTEs ✓ Window Functions ✓ Query Optimization").

### PHASE 5 ACCEPTANCE

Every recommendation traces: gap → course → specific skill coverage → match score →
reason, confirmed by the developer.

## PHASE 6 — EVIDENCE + RAG + MCP

### Objective

Use retrieval + MCP + Mistral to create a grounded personalized learning plan. **This is
genuinely new work** — no FAISS index or evidence corpus currently exists anywhere in
this repo.

### TASK 6.1 — Evidence corpus

Build corpus from ESCO definitions, role descriptions, competency definitions, course
descriptions/metadata.

### TASK 6.2 — FAISS

Add `faiss-cpu` to `requirements.txt` (flagged as a deliberate, authorized new dependency
per the CLAUDE.md update in §1). Generate embeddings, build a persistent FAISS index. Do
NOT rebuild on every request.

### TASK 6.3 — Evidence retrieval

Query using top competency gaps, target role, recommended courses. Retrieve relevant
evidence.

### TASK 6.4 — MCP evidence tool

Expose `get_relevant_evidence()` through the MCP layer, returning only retrieved
evidence.

### TASK 6.5 — Learning-plan context

Build: candidate + target role + validated competency profile + priority gaps +
deterministically selected courses + retrieved evidence.

### TASK 6.6 — Mistral planner

Instruction to Mistral: generate a personalized learning plan using ONLY the supplied
evidence. Do not invent courses, providers, durations, ratings, skills, certifications,
or sources.

### TASK 6.7 — Structured learning plan

```json
{
  "weeks": [
    { "week": 1, "skill": "SQL Window Functions", "course": "Advanced SQL",
      "objective": "...", "activities": [...] }
  ]
}
```

Validate before displaying.

### TASK 6.8 — Grounding validator

Generated plan → extract referenced entities → compare with evidence → unsupported →
remove/flag; supported → accept.

### TASK 6.9 — Learning plan fallback

Mistral unavailable → generate a deterministic plan from priority gaps + recommended
courses + course objectives. User still receives a usable plan.

### PHASE 6 ACCEPTANCE

The final plan is traceable: priority gap → course → evidence → learning objective →
learning plan, confirmed by the developer.

## PHASE 7 — FULL INTEGRATION

### Objective

Prove the entire application works from a clean startup, with the developer running each
verification step and reporting results.

### TASK 7.1 — Clean startup

Developer runs `docker compose up` from a clean environment; confirms PostgreSQL,
FastAPI, frontend all up.

### TASK 7.2–7.11 — Full golden path walkthrough

Developer walks the entire path (resume upload → candidate profile → target role →
assessment → completion → gap analysis → course recommendations → evidence → learning
plan → Demo Candidate) and reports results at each step, per the Execution & Testing
Protocol above.

### TASK 7.12 — Error-path testing

Test: invalid resume, empty resume, corrupt resume, Mistral unavailable, invalid Mistral
JSON, missing role, invalid candidate, assessment session expired, course data
unavailable, FAISS unavailable. No screen should become blank.

## 8. REQUIRED API CONTRACT (target — reconcile against actual routes in Phase 0)

```text
GET  /health

GET  /candidates
POST /candidates/resume
POST /candidates/demo
GET  /candidates/{id}

GET  /roles
GET  /roles/{id}

GET  /competencies
GET  /competency-framework/{skill_id}

POST /assessment/start
GET  /assessment/{session_id}/next-question
POST /assessment/{session_id}/answer
GET  /assessment/{session_id}/profile

POST /analysis
GET  /analysis/{id}
GET  /analysis/{id}/gaps
GET  /analysis/{id}/courses
GET  /analysis/{id}/evidence

POST /learning-plan
GET  /learning-plan/{id}
```

Do not rename existing fields without checking all consumers. **This list is a target
end-state, not a confirmed current state** — Phase 0 Task 0.1 must read the actual
routers in `backend/src/api/*.py` and reconcile differences before assuming any of these
paths are missing.

## 9. FRONTEND REQUIREMENTS

Every screen needs these states: Resume Upload (loading/success/error), Skill Profile
(loading/success/empty/error), Assessment (loading question/question/submitting/
error/completed), Analysis (loading/success/error), Courses (loading/success/empty/
error), Evidence (loading/success/error), Learning Plan (generating/success/fallback/
error). Never show only "Request failed" when a meaningful backend error exists.

## 10. ERROR CONTRACT

```json
{ "code": "ERROR_CODE", "message": "Human-readable message", "details": null }
```

Codes: `RESUME_INVALID`, `RESUME_UNSUPPORTED`, `RESUME_PARSE_FAILED`, `RESUME_EMPTY`,
`SKILL_EXTRACTION_FAILED`, `ESCO_MAPPING_FAILED`, `LLM_UNAVAILABLE`,
`LLM_INVALID_RESPONSE`, `ASSESSMENT_NOT_FOUND`, `ASSESSMENT_COMPLETED`,
`ROLE_NOT_FOUND`, `ANALYSIS_FAILED`, `COURSE_MATCHING_FAILED`,
`EVIDENCE_RETRIEVAL_FAILED`, `LEARNING_PLAN_FAILED`.

## 11. LOGGING REQUIREMENTS

Stage-based logs: `[RESUME] [SKILLS] [ESCO] [MCP] [LLM] [ASSESSMENT] [SCORING]
[ANALYSIS] [COURSES] [EVIDENCE] [RAG]`.

## 12. TESTING STRATEGY

Every phase: unit test, integration test, manual browser verification where applicable —
run by the developer per the Execution & Testing Protocol above. Minimum full smoke test:
health → resume → candidate → roles → assessment → question → answer → profile →
analysis → gaps → courses → evidence → learning plan.

## 13. MCP SAFETY / ARCHITECTURE RULES

MCP tools must be small, typed, read-oriented where possible, schema validated,
auditable, deterministic. Do not expose arbitrary SQL execution, filesystem access, shell
execution, or secret access. The MCP layer should make the LLM more controlled, not less
controlled.

## 14. FINAL ARCHITECTURE

```text
                    ┌─────────────────┐
                    │ React Frontend  │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ FastAPI Backend │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
 Resume Service       Assessment Engine      Analysis Engine
        │                    │                    │
        ▼                    ▼                    ▼
 Skill Extraction      MCP Tool Layer        Gap Engine
        │                    │                    │
        ▼                    ▼                    ▼
 MiniLM + ESCO          Mistral API          Course Engine
                             │                    │
                             ▼                    ▼
                      Structured Output       FAISS
                             │                    │
                             └────────┬───────────┘
                                      ▼
                              Evidence / RAG
                                      │
                                      ▼
                                    Mistral
                                      │
                                      ▼
                              Learning Plan
```

## 15. FINAL GOLDEN PATH

```text
USER uploads resume → POST /candidates/resume → PDF/DOCX parser → clean resume text
→ skill extraction (deterministic + Mistral structured extraction) → normalization
→ MiniLM embeddings → ESCO mapping → initial candidate profile → target role
→ assessment session → MCP get_assessment_context → Mistral → structured question
→ schema validation → adaptive assessment → deterministic scoring
→ validated competency profile → gap engine → demand × gap × role importance
→ priority gaps → deterministic course matcher → course recommendations
→ FAISS evidence retrieval → MCP evidence tool → Mistral RAG planner
→ grounding validator → PERSONALIZED LEARNING PLAN
```

## 16. DEFINITION OF DONE

**Resume:** manual PDF/DOCX upload works, text extracted, skills detected, ESCO mapping
works, initial profile appears.

**LLM:** Mistral client works, structured responses work, invalid JSON handled, retry
works, fallback works.

**MCP:** MCP server works, tools have schemas, candidate/role/competency/assessment-
context/evidence tools all work, Mistral consumes controlled context, no arbitrary
DB/shell access exists.

**Assessment:** starts, Mistral generates questions, questions schema-validated, adaptive
routing works, answers persist, scores deterministic, final profile appears.

**Intelligence:** gaps/demand/priority calculate, results explainable.

**Courses:** ranked deterministically, skill coverage shown, recommendation reasoning
shown.

**RAG:** FAISS retrieval works, evidence displayed, Mistral generates plan, grounding
validation works, unsupported claims prevented.

**Integration:** Docker startup works, manual resume path works, Demo Candidate works, no
manual DB intervention, no terminal intervention between screens (for an end user), full
browser golden path works — each confirmed by the developer running it and reporting
back.

## 17. EXECUTION BEHAVIOR FOR CLAUDE

Execute phases sequentially. For every task:

```text
INSPECT → IMPLEMENT → developer TESTS (per protocol above) → FIX → VERIFY → COMMIT → NEXT TASK
```

Do not say a phase is complete because code was written — only after its acceptance
criteria pass with a real reported test result. If an implementation is too complex,
simplify — do not add infrastructure beyond the two explicitly authorized additions (MCP,
FAISS). If Mistral fails: retry → fallback → continue. If MCP fails: controlled
application-service fallback → continue; MCP must never be a single point of failure. If
a later feature breaks an earlier phase: STOP, fix the regression, re-run the earlier
test, then continue.

## 18. FINAL COMMAND

After implementation, the developer (guided step-by-step by Claude, per the Execution &
Testing Protocol):

1. Runs backend tests.
2. Runs frontend build.
3. Runs API smoke tests.
4. Starts a clean Docker environment.
5. Opens the frontend.
6. Uploads a real test resume.
7. Completes the entire golden path.
8. Tests Demo Candidate.
9. Tests major error paths.
10. Inspects logs for unexpected errors.
11. Confirms no secrets were committed.
12. Confirms `CLAUDE.md` reflects the final architecture.
13. Only then is the MVP declared complete.

**Final standard:**

```text
REAL RESUME → REAL SKILLS → REAL PROFILE → REAL MISTRAL QUESTIONS → REAL ASSESSMENT
→ REAL SCORES → REAL GAPS → REAL COURSES → REAL EVIDENCE → REAL MISTRAL PLAN
```

The objective is not to demonstrate that individual components exist. The objective is
to demonstrate that they work together.
