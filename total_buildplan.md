# build_plan.md

## Competency Intelligence MVP — Build Plan (FINAL)

**Status:** Architecture frozen. Do not redesign unless a genuine implementation blocker is discovered — see `CLAUDE.md` Rule 2.
**Time remaining:** ~13 hours from kickoff.
**Primary stack:** React + TypeScript + Vite + Tailwind · FastAPI · PostgreSQL · Mistral API · `all-MiniLM-L6-v2` · ESCO v1.2.1 (4-file active subset)
**Frontend sequencing note:** frontend implementation is pushed to the last third of the timeline — see §14 and §20. Backend/data/assessment/scoring/gap/recommendation logic is built and API-tested first.

---

## 1. Project Objective

Build a system that determines a candidate's **current competency state** (resume as initial evidence, adaptive assessment as verification — not a self-report checkbox), compares it against the **competency requirements of a target role**, identifies **specific competency gaps**, and recommends **learning resources that close those gaps**, with an ordered, explainable personalized learning path.

Core "wow" moment — see `MVP_CONTEXT.md` §6 and `demo_plan.md` for the full presentation of this transformation:
```
BEFORE (resume estimate)              AFTER (verified)
SQL: 2.5/5, Confidence 54%   →        SQL: 3.1/5, Confidence 89%   Required 4.0   Gap 0.9
```

---

## 2. Final Architecture

```
                    ┌──────────────────────┐
                    │        React         │
                    │ TypeScript + Tailwind│   ← built LAST (see §14, §20)
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

Optional semantic layer:
```
all-MiniLM-L6-v2 → semantic similarity → course/competency matching
```
FAISS is optional. With curated catalogues of 30–50 items, prefer direct cosine similarity over embeddings; add FAISS only if plain cosine similarity proves too slow, which is unlikely at this scale.

**Key separation of concerns (do not blur this — see `CLAUDE.md` Rule 4):**
- **Mistral** = resume extraction, adaptive question generation, question explanation, optional open-ended answer evaluation, natural-language explanations. Never assigns the final score.
- **FastAPI** = business logic and orchestration.
- **Deterministic backend logic** = owns final skill score, gap math, course-matching rules.
- **Competency framework** (curated JSON, DB-seeded) = defines what proficiency means per competency. Mistral generates questions *within* it, never invents the hierarchy.
- **PostgreSQL** = persistent state.
- **MiniLM** = semantic similarity only, optional layer over deterministic matching.
- **MCP** = explicitly not part of this build. See §16.

---

## 3. Existing Local Resources

Already present — do not download anything not listed here unless a genuine blocker emerges:

```
data/raw/esco/
├── occupations_en.csv
├── skills_en.csv
├── occupationSkillRelations_en.csv
└── skillsHierarchy_en.csv

models/all-MiniLM-L6-v2/

backend/
frontend/
```

Any other ESCO file present in the folder is optional reference material only — not part of the active pipeline.

---

## 4. Data Strategy

**One external reference dataset: ESCO v1.2.1**, restricted to the four active files above. Do not require the full ESCO package at runtime; do not build the application around every ESCO CSV; do not spend hackathon time integrating ESCO files beyond these four.

**Curated application data** (built during implementation, not downloaded — see `MVP_CONTEXT.md` §8):

```
data/curated/
├── roles.json            5–8 target roles (e.g. Statistical Analyst, Statistical Officer,
│                          Data Analyst, Data Scientist, GIS Analyst) — exact selection based
│                          on what can be implemented and demonstrated convincingly
├── competencies.json      30–50 competencies, derived from ESCO and adapted for the MVP.
│                          Each entry: name, description, parent competency, proficiency levels.
│                          Example tree:
│                            SQL
│                            ├── SELECT
│                            ├── Filtering
│                            ├── JOINs
│                            ├── Aggregation
│                            ├── Subqueries
│                            ├── CTEs
│                            ├── Window Functions
│                            └── Query Optimization
├── courses.json           30–50 curated learning resources. Each entry: id, title, description,
│                          provider, competencies covered, level, duration, priority, optional
│                          prerequisites.
└── assessment_seed.json   20–30 seed questions. Mistral generates additional questions
                           dynamically on top of this seed bank when needed.
```

Do not attempt a complete ESCO ontology, a massive course dataset, or a large assessment bank. No job-postings dataset and no job-demand scoring in this build (retired from an earlier architecture — see `MVP_CONTEXT.md` §8).

---

## 5. Model Strategy

One local embedding model, already downloaded: `sentence-transformers/all-MiniLM-L6-v2` at `models/all-MiniLM-L6-v2/`. Used for semantic similarity — competency matching, course matching. Do not train it, do not fine-tune it, do not download a second embedding model.

Mistral is an **API**, not a local model — see §7. Do not download a local Mistral model.

---

## 6. Backend Architecture

**Stack:** Python 3.11+, FastAPI, Pydantic, SQLAlchemy/psycopg, pandas (ESCO processing only), sentence-transformers, Mistral Python client (or plain HTTP).

**Database (PostgreSQL) — minimum tables:**
```
candidates, roles, competencies, role_competencies, candidate_skills,
assessments, questions, answers, skill_evidence, skill_gaps,
courses, course_competencies, learning_paths
```
Add indexes on every field used in a WHERE/JOIN during gap and recommendation queries. Do not over-normalize.

**API endpoints (minimum):**
```
GET  /health
GET  /roles                GET /roles/{id}
GET  /competencies
GET  /courses

POST /candidates/resume            (upload → extraction → initial profile)
POST /candidates/demo              ("Try Demo Candidate" fallback)

POST /assessment/start             { candidate_id, target_role_id }
GET  /assessment/{session_id}/next-question
POST /assessment/{session_id}/answer
GET  /assessment/{session_id}/profile      (verified competency profile)

POST /analysis                     { candidate_id, target_role_id }   (gap analysis)
GET  /analysis/{id}/gaps
GET  /analysis/{id}/courses

POST /learning-path                { analysis_id }
```
Freeze this contract the moment `/analysis` and `/learning-path` return real (non-mock) data matching the documented schema.

---

## 7. Mistral AI Architecture (API, Not Local)

Mistral is the AI intelligence layer, used via API — never local, never trained/fine-tuned. The architecture is deliberately **not** "send one giant master prompt on every call." It is:

```
FastAPI
   ↓
Mistral Service (backend/app/services/mistral_service.py)
   ↓
Operation Router
   ↓
BASE_RULES + Operation-Specific System Prompt
   ↓
Candidate/Role/Assessment Data (request-specific only)
   ↓
Mistral
   ↓
Structured JSON
   ↓
Pydantic Schema Validation
   ↓
Deterministic Backend Logic
```

Full architecture picture:
```
                    INGENIUM
                       │
                       ▼
                  FastAPI
                       │
             ┌─────────┴─────────┐
             │                   │
       Deterministic         Mistral
         Engines             AI Layer
             │                   │
      ┌──────┼──────┐      ┌─────┼──────┐
      │      │      │      │     │      │
    Score   Gap   Course  Resume Question Evaluation
                    │
                    ▼
              Learning Path
```

**What Mistral MAY do:**
```
A. Resume extraction
B. Professional experience extraction
C. Competency evidence extraction
D. Competency normalization (natural-language term → canonical competency ID)
E. Adaptive assessment question generation (one question at a time)
F. Open-ended answer evaluation (never MCQ — MCQs are deterministic, see §8/§9)
G. Assessment explanations
H. Course-to-competency semantic mapping — offline/preprocessing only, not per-request
```

**What Mistral MUST NOT do:** own the final competency score, decide role readiness, calculate skill gaps, rank/decide courses directly, or hold any state between calls. Mistral is stateless — see §7.6.

Full prompt-by-prompt specification (base rules, each operation's purpose/input/output schema/validation/fallback/call frequency, the example request, and the runtime-structure pattern) lives in **§27 Mistral Prompt Architecture** below — this section (§7) is the summary; §27 is the implementation-ready detail.

### 7.1 Deterministic Backend Responsibilities (never delegated to Mistral)

```
competency framework · competency IDs · competency definitions
role definitions · target-role competency requirements
candidate database state · assessment state
final competency scoring · confidence aggregation
skill-gap calculation · gap severity · role-readiness calculation
course matching rules · recommendation ranking · prerequisites
learning-path ordering · projected learning-path calculations
persistence · validation · authorization · error handling
```
The backend is the source of truth. Mistral provides structured intelligence/evidence and never overrides a deterministic backend decision.

### 7.2 Call Minimization (critical for the hackathon)

Target Mistral call budget **per complete candidate workflow: ~9–14 calls total**:
```
Resume extraction              1 call
Assessment question generation ~8–12 calls (one question at a time, never pre-generated in bulk)
MCQ evaluation                 0 calls (always deterministic — see §9)
Open-ended evaluation          only when an open-ended question type is actually used
Explanation                    optional, only when the UI requests it
Course mapping                 0 runtime calls — precomputed offline during data prep (§22/§27F)
```
Never: regenerate an already-asked question, send the entire course catalogue, send the entire candidate database, send the entire resume repeatedly, send the entire competency framework when only a relevant subset is needed, or call Mistral for anything deterministic. Each request carries only the context that specific operation needs (see §27 for per-operation input lists).

### 7.3 Prompt Storage

Prompts are centralized, not scattered across route files:
```
backend/app/services/mistral_prompts/
    base.py            BASE_RULES (§27.1)
    resume.py          resume extraction prompt
    normalization.py   competency normalization prompt
    assessment.py      adaptive question-generation prompt
    evaluation.py       open-answer evaluation prompt
    explanation.py      assessment explanation prompt
    course_mapping.py   course-competency mapping prompt (offline use)
```
Structure may be simplified, but API route files must never construct or send a Mistral request directly — every call goes through `mistral_service.py`.

### 7.4 Mistral Service Responsibilities

`backend/app/services/mistral_service.py` owns: loading the API key from environment, selecting the operation, selecting/combining `BASE_RULES + operation prompt`, formatting request-specific input, calling Mistral, parsing the JSON response, validating it against the operation's Pydantic schema, retrying once on malformed output, returning a validated Pydantic object, and logging failures without logging sensitive resume/candidate content.

### 7.5 Output Validation & Retry

```
Mistral response → JSON parse → Pydantic validation → business-rule validation
  → database/state update
```
On validation failure: retry once with a constrained re-prompt; if the retry also fails, return a controlled application error and (on demo-critical paths) fall back to `assessment_seed.json` or the predefined demo candidate (§20/§27). No unlimited retries, no complex retry infrastructure. Malformed Mistral output must never reach the database.

### 7.6 Statelessness & Multi-User Support

Mistral holds no memory between calls — never assume it remembers a previous question, answer, resume, role, or competency state. Every request must carry the specific context that operation needs (and only that context — see §7.2). The backend (FastAPI + PostgreSQL) is what maintains state, keyed by `candidate_id` (and `assessment_id` / `question_id` where relevant), which is how the architecture supports multiple concurrent candidates safely — each candidate's Mistral calls are independent, stateless, and identified by IDs the backend controls.

### 7.7 Security

Mistral API key lives only in backend `.env` (`MISTRAL_API_KEY=`), read only by FastAPI — never in React, never in a browser-exposed env var, never in source or Git. The frontend never calls Mistral directly (§14 Frontend Architecture) and never sees system prompts or raw Mistral responses. Validate uploaded resume file type/size before it reaches Mistral; sanitize extracted text; never trust a Mistral-generated ID — only backend-owned competency IDs are valid; avoid logging full resumes or candidate-sensitive data.

### 7.8 Call Discipline (summary)

Minimize calls, never regenerate an identical question, keep prompts concise, pass only necessary state, cache static data (competency definitions, role requirements, course catalogue, embeddings — §17) rather than recomputing or re-asking Mistral for them.

---

## 8. Adaptive Assessment

Visibly adaptive, **backend-controlled deterministic routing** — no IRT, no Bayesian psychometrics. Mistral's only job in this loop is generating one question at a time; the backend decides which competency to probe next, at what difficulty, and when to stop.

```
START
 ↓
Use resume evidence (initial estimate) to set the starting level per competency
 ↓
Backend selects competency + difficulty → Mistral generates ONE question (§27C)
 ↓
Candidate answers
 ↓
Evaluate result:
   MCQ            → deterministic backend comparison (§9) — 0 Mistral calls
   Open-ended      → Mistral evaluation (§27D) → evidence signal only
 ↓
If strong  → increase difficulty / move to next competency
If weak    → probe same competency at lower difficulty
If uncertain → backend requests a discriminating question
 ↓
Update backend competency evidence (not Mistral state — Mistral is stateless, §7.6)
 ↓
Repeat until confidence threshold reached OR question budget exhausted (~8–12 questions)
```
Never repeat an identical question in-session (backend-enforced, not just prompted). Do not generate all questions in advance — one question per Mistral call, only when the assessment engine actually needs the next one.

Question JSON schema and the full question-generation prompt are specified in §27C/§27, section "Question JSON." If parsing fails: retry once; if it still fails, fall back to a seed question from `assessment_seed.json`. The assessment must never crash on an LLM formatting problem — see `CLAUDE.md` Rule 5 and §7.5.

---

## 9. Skill Scoring (Deterministic)

The backend owns the final score — always. Mistral never assigns a competency level.

**MCQ evaluation is 100% deterministic, zero Mistral calls:** `candidate_answer == correct_answer → correct`. This is a plain backend comparison against the `correct_answer` field the question-generation call already returned (§27C) — never a separate Mistral call to "check" an MCQ answer. Doing so would waste latency, cost, and add a failure point for no benefit.

**Open-ended evaluation** (only when that question type is actually used) calls Mistral for a `suggested_level_signal` + qualitative evaluation (§27D) — this is **evidence only**, not a score. The backend still computes the final level.

```
Question result (MCQ: deterministic / open-ended: Mistral evidence signal)
  → Backend scoring engine
  → Competency evidence
  → Competency score
  → Overall skill score
```
Simple, transparent model:
```
competency_score = weighted correctness + difficulty adjustment + resume evidence contribution
```
Assessment evidence must outweigh resume evidence in the final blend. No IRT, no complex statistical estimation, unless already available with no added implementation effort.

Worked example of the Mistral-evidence-vs-backend-decision split:
```
Mistral:  "SQL evidence suggests Level 2–3" (resume) / "suggested_level_signal: 3" (assessment)
Backend:  Verified SQL level = 3   (backend-computed from all evidence, not copied from Mistral)
Role requirement:  SQL = 4
Backend:  Gap = 1, Priority = HIGH, Recommended course = Advanced SQL Optimization
```

---

## 10. Skill Gap Engine

For each target competency:
```
gap = required_level - current_level
```
Rank gaps by: gap magnitude + role priority + dependency/prerequisite importance. Return the highest-value gaps first.

---

## 11. Course Recommendation

Runtime course recommendation is **fully deterministic** — never `Candidate → Mistral → "here are three courses"`. Instead:
```
Candidate verified competencies + Target role requirements
        ↓
Gap Engine → identified gaps
        ↓
Course competency mappings (precomputed — see below)
        ↓
Deterministic course matcher
        ↓
Ranked recommendations
```
Explainable output for every recommendation:
```
Gap: Window Functions
Recommended: Advanced SQL Analytics
Because it covers: ✓ Window Functions  ✓ CTEs
```
If using embeddings for matching:
```
candidate gap → MiniLM embedding → course embeddings → cosine similarity
  → candidate courses → deterministic ranking
```

**Mistral's only optional role here is offline/preprocessing** — assisting course-to-competency mapping once during data prep (§27F), stored in the database. Do not call Mistral per recommendation request. Mistral is never responsible for basic course matching or final ranking — see `CLAUDE.md` Rule 4.

---

## 12. Learning Path

Ordered output from ranked gaps + matched courses, considering gap severity, role priority, prerequisites, estimated duration:
```
1. Advanced SQL Queries → 2. Window Functions → 3. SQL Performance Optimization
```
Mistral may supply the natural-language explanation; ordering stays deterministic.

---

## 13. Demo Architecture

Two entry points into the same downstream pipeline:
```
Resume Upload → extraction (Mistral) → initial profile   ─┐
                                                            ├─→ same pipeline from here
Try Demo Candidate → pre-seeded initial profile            ┘
```
"Try Demo Candidate" must bypass resume upload but enter the identical downstream flow (target role → assessment → gaps → courses → learning path), so a network failure, resume-parsing failure, Mistral timeout, unexpected PDF, or demo-machine issue never prevents a judge from seeing the product. Full judge-facing script and rehearsal checklist: `demo_plan.md`.

---

## 14. Frontend Architecture

**Stack:** React, TypeScript, Vite, Tailwind.

Frontend work is **deliberately sequenced after backend/data/assessment/scoring/gap/recommendation logic is built and verified via API calls** (see §20 timeline and §24 task breakdown — Tasks 11–14 come after Tasks 1–10). Do not start frontend screens while a P0 backend piece is still broken (`CLAUDE.md` Rule 11).

Design must feel like a professional workforce competency intelligence tool — not a generic AI dashboard, not a chatbot UI, not a template admin dashboard.

**Frontend contract:** the frontend calls FastAPI only — `React → FastAPI → Mistral`, never `React → Mistral`. It receives normalized backend responses and never sees the Mistral API key, system prompts, raw Mistral output, or any internal AI implementation detail (§7.7).

**Required screens** (content detail in `demo_plan.md`):
1. Landing / Resume — upload PDF/DOCX, or "Try Demo Candidate"
2. Candidate Profile — initial competency profile, flagged as an initial estimate
3. Target Role — role list, then required competencies
4. Assessment — question N/M, competency, difficulty, adaptive messaging
5. Verified Profile — verified competency profile with confidence, strong vs. needs-improvement
6. Gap Analysis — competency / current / required / gap table
7. Learning Path — ordered, prioritized recommendations with "closes: ✓ X ✓ Y" and estimated effort

---

## 15. Adaptive Assessment — see §8 (kept together with Backend Architecture for build sequencing; cross-referenced from §24 Task 6)

---

## 16. Testing Strategy

Test continuously — Implement → Run → Test → Fix → Continue (`CLAUDE.md` Rule 9). Before frontend integration, every backend endpoint must be verified against curl/httpie with real (non-mock) data.

Final test pass (§17/Task 17) covers: happy path, invalid resume, Mistral failure, empty answer, duplicate question, database failure, API error, demo fallback, frontend refresh.

**Mistral-specific tests (see §27 for the schemas being tested):**
```
Resume extraction:      valid resume · missing fields · weak evidence · unknown/unmapped
                         competency · malformed Mistral JSON
Question generation:    valid question · duplicate-question prevention · invalid competency_id ·
                         invalid difficulty level · malformed JSON
Answer evaluation:      correct answer · incorrect answer · ambiguous open-ended response ·
                         malformed output
Mistral service:        timeout · API error · invalid API key · malformed JSON · retry-then-fail
Business logic:         Mistral never overrides a deterministic score · gap engine stays
                         deterministic with Mistral unavailable · course matcher stays
                         deterministic with Mistral unavailable
```

---

## 17. Performance Strategy

Do not add infrastructure for performance. Instead:
```
Cache static competency data
Cache embeddings
Avoid duplicate Mistral questions
Use small prompts
Batch DB queries
Keep API payloads small
Avoid unnecessary frontend state updates
```
If FAISS is not necessary for the small catalogue, don't use it (§2).

---

## 18. Risk Management / Failure Strategy

```
Mistral unavailable        → use assessment_seed.json for predefined questions
Resume parsing fails       → "Unable to parse resume. Try Demo Candidate." — never crash the backend
Semantic matching fails    → fall back to deterministic competency overlap
Database temporarily down  → useful error, not a frontend crash
```

Security minimum: API key only in `.env`, `.env` in `.gitignore`, validate uploaded file type, limit upload size, never execute arbitrary uploaded content, parameterized DB queries only. If the optional practical SQL assessment (§19) is built, it runs against an isolated safe sample database.

---

## 19. Optional Practical SQL Assessment (P1)

May be implemented only if time permits, after the core MCQ-based adaptive assessment is solid:
```
SQL submission → safe sample DB → execute → validate result → update competency evidence
```
If it risks delaying the main assessment: **do not build it.** MCQ + structured adaptive assessment is sufficient for the MVP.

---

## 20. 13-Hour Execution Timeline

```
0:00–0:20     Environment verification (Task 0)
0:20–1:40     Data + database foundation (Tasks 1–2)
1:40–3:30     Backend APIs + role/competency/course endpoints (Task 3)
3:30–5:30     Resume processing + Mistral integration (Task 4)
5:30–7:30     Adaptive assessment + deterministic scoring (Tasks 6–7)
7:30–9:30     Frontend core screens — landing, profile, role, assessment (Tasks 11–13)
9:30–10:30    Results + recommendations UI — gap, courses, learning path (Task 14)
10:30–11:15   Full integration (Task 15)
11:15–12:00   Demo implementation — Try Demo Candidate, polish (Task 16, demo_plan.md)
12:00–13:00   Testing + debugging + demo rehearsal (Task 17)
```
If implementation slips, cut P1 features first (§21). Never sacrifice assessment, scoring, gap analysis, recommendations, or integration for optional features.

---

## 21. P0 / P1 / P2 Feature Priorities

**P0 — MUST HAVE**
```
FastAPI, PostgreSQL, ESCO subset, curated competencies, roles, courses,
resume upload, Mistral resume extraction, target role selection,
adaptive assessment, Mistral question generation, deterministic scoring,
skill gaps, course recommendations, learning path, React UI, demo candidate,
end-to-end integration
```

**P1 — ONLY IF TIME**
```
FAISS, advanced semantic retrieval, practical SQL assessment,
open-ended answer evaluation, advanced animations, additional charts
```

**P2 — DO NOT BUILD DURING MVP**
```
MCP, microservices, Kubernetes, Redis, message queues, model training,
fine-tuning, IRT, complex agents, large datasets, complex recommendation algorithms
```

---

## 22. Explicit Non-Goals

```
❌ MCP infrastructure
❌ Large-scale data engineering
❌ Model training / fine-tuning
❌ Multiple LLMs
❌ Multiple embedding models
❌ Microservices
❌ Kubernetes
❌ Redis / Kafka
❌ Complex agents
❌ IRT
❌ Production-scale authentication
❌ Enterprise cloud architecture
❌ Massive recommendation engine
❌ Kaggle job-postings dataset / job-demand scoring (retired earlier architecture)
```
These may be documented as future improvements, never built during the core hackathon.

---

## 23. Definition of Done

A judge can:
```
1.  Open the application
2.  Upload a resume OR select Demo Candidate
3.  See the initial competency profile
4.  Select a target role
5.  See role requirements
6.  Start the assessment
7.  Answer adaptive questions
8.  See the verified competency profile
9.  See skill gaps
10. See recommended courses
11. Understand why each course was recommended
12. See a personalized learning path
```
Once all of this works: **stop building features.** Move to testing → bug fixing → UI polish → demo rehearsal.

---

## 24. High-Level & Detailed Task Breakdown

### TASK 0 — Environment & Repository Setup
Verify: Python, Node, npm, PostgreSQL, Mistral API key, local MiniLM model, ESCO files, Git. Create `.env` / `.env.example`.

### TASK 1 — Data Foundation
Build `data/curated/roles.json`, `competencies.json`, `courses.json`, `assessment_seed.json` from ESCO + hand-curation. Do not over-process ESCO.

### TASK 2 — Database Foundation
Create PostgreSQL schema (§6), add indexes, seed curated data, verify connectivity.

### TASK 3 — Backend API Foundation
`GET /health`, `/roles`, `/roles/{id}`, `/competencies`, `/courses`. Keep APIs small and focused. Then candidate endpoints.

### TASK 4 — Resume Processing
`POST /candidates/resume`: upload → extract text → Mistral structured extraction → candidate evidence → initial competency profile → persist. Support PDF and DOCX. Parsing failure returns a useful error, never crashes the backend.

### TASK 5 — Target Role & Requirement Engine
Select role → load required competencies from curated data/DB (never from Mistral) → return requirements.

### TASK 6 — Adaptive Assessment Engine
Assessment creation, question selection, Mistral generation, answer submission, adaptive routing, progress tracking. Maintain current competency estimate, confidence, difficulty, questions asked, answers.

### TASK 7 — Deterministic Scoring Engine
Answer evidence → competency score → confidence → overall skill score. Reproducible results.

### TASK 8 — Skill Gap Engine
Candidate profile + target role → gap calculation → ranked competency gaps.

### TASK 9 — Course Recommendation Engine
Gap → course matching → ranking → explanation. Deterministic competency overlap as baseline; MiniLM only where it adds value.

### TASK 10 — Learning Path
Ranked gaps + courses → ordered learning path. Persist if useful.

### TASK 11 — Frontend Foundation *(begins only after Tasks 1–10 are API-verified)*
App shell, routing, API client, design system, layout, navigation, loading/error states.

### TASK 12 — Frontend Candidate Flow
Resume upload, initial profile, role selection.

### TASK 13 — Frontend Assessment
Question display, answer selection, submit, progress, loading, adaptive messaging.

### TASK 14 — Frontend Results
Verified skill profile, gap visualization, course recommendations, learning path.

### TASK 15 — Integration
Connect frontend → FastAPI → PostgreSQL → Mistral → scoring → gap engine → recommendations. Run the complete golden path.

### TASK 16 — Demo Implementation
Only after core backend/frontend functionality works. Follow `demo_plan.md`. Implement "Try Demo Candidate" and polished demo-specific transitions/content.

### TASK 17 — Final Testing
Happy path, invalid resume, Mistral failure, empty answer, duplicate question, database failure, API error, demo fallback, frontend refresh. Fix critical bugs only.

---

## 25. Dependencies

```
Task 0 → Task 1 → Task 2 → Task 3 → Task 4/5 → Task 6 → Task 7 → Task 8 → Task 9 → Task 10
  → Task 11 → Task 12 → Task 13 → Task 14 → Task 15 → Task 16 → Task 17
```
Tasks 4 and 5 can proceed in parallel once Task 3 is done. Frontend tasks (11–14) must not start before their corresponding backend endpoints (Tasks 3–10) return real data.

---

## 26. Core Engineering Principle

```
END-TO-END FUNCTIONALITY > CORRECTNESS > EXPLAINABILITY > UI QUALITY > OPTIMIZATION
```
Never spend an hour polishing one component while the full pipeline is still broken. When choosing between a technically sophisticated but time-consuming approach and a simple, reliable, demonstrable one — choose the simple one. See `CLAUDE.md` for the full rulebook.

---

## 27. Mistral Prompt Architecture

Implementation-ready detail for every Mistral operation referenced in §7. Runtime prompts are **operation-specific and short** — never the full product specification pasted into a request. Pattern for every call:

```
BASE_RULES + OPERATION_PROMPT + STRUCTURED_INPUT = MISTRAL_REQUEST
   ↓
Mistral
   ↓
JSON
   ↓
Pydantic
   ↓
Backend
```

### 27.1 Base Rules (reused across every operation)

A short, stable system instruction, conceptually:

> "You are the AI intelligence layer of Ingenium — Workforce Capability Intelligence. Provide structured, evidence-based intelligence. Return valid JSON only. Never fabricate information. Use supplied competency IDs and names. Treat resume information as initial evidence, not verified capability. Do not make final competency scores. Do not make final role-readiness decisions. Do not calculate final skill gaps. Do not independently determine final course rankings. The deterministic backend owns final business logic. Follow the operation-specific schema exactly."

Kept intentionally small — it's prepended to every operation prompt, not a substitute for one.

### 27.2 Operation A — Resume Extraction

**Purpose:** convert resume text into structured candidate/experience data and competency evidence.
**Called when:** the resume-upload endpoint is invoked (once per candidate — §7.2).
**Input:** `candidate_id`, resume text, the relevant slice of the competency framework, optional role context.
**Rule:** only use competency IDs supplied by the backend; a resume term that can't be confidently mapped goes into `unmapped_terms`, never an invented ID. `source` is always `"resume"`; `status` is always `"initial_evidence"` — resume evidence is never presented as verified capability (see `CLAUDE.md` and `MVP_CONTEXT.md` §6).

System prompt:
> "You are Ingenium's resume intelligence module. Extract professional experience and competency evidence from the supplied resume. Return JSON only. Never fabricate information. Use only supplied competency IDs/names. Resume evidence is INITIAL EVIDENCE, not verified capability. Be conservative when estimating proficiency. Do not calculate final competency scores, role readiness, or skill gaps. Return exactly the requested schema."

Output schema:
```json
{
  "candidate": {
    "name": null,
    "designation": null,
    "organization": null,
    "years_experience": null
  },
  "education": [],
  "certifications": [],
  "experience": [],
  "competency_evidence": [],
  "unmapped_terms": [],
  "overall_confidence": "LOW"
}
```
Each `competency_evidence` entry:
```json
{
  "competency_id": null,
  "competency_name": "",
  "evidence": "",
  "source": "resume",
  "status": "initial_evidence",
  "evidence_strength": "WEAK",
  "estimated_level_range": { "min": 1, "max": 2 },
  "confidence": "LOW",
  "reasoning": ""
}
```
Backend validates this via Pydantic before any persistence.

**Evidence strength scale:** `VERY_WEAK · WEAK · MODERATE · STRONG · VERY_STRONG`. Examples: "Python" in a skills list → `WEAK`; "Used Python for 2 years" → `MODERATE`; "Built statistical analysis pipelines using Python for 3 years" → `STRONG`; "Designed and optimized production statistical systems in Python and mentored others" → `VERY_STRONG`. Evidence strength is descriptive of the resume text, not a proxy for verified proficiency.

**Confidence scale:** `LOW · MEDIUM · HIGH`. Default conservative; specific, detailed professional evidence can raise it; a bare skill-list mention should stay `LOW`.

**Validation / fallback:** Pydantic schema validation → retry once on malformed JSON → on repeated failure, return a controlled error and route the candidate to "Try Demo Candidate" (§20/`demo_plan.md`) rather than blocking the flow. **Call frequency:** 1 per candidate.

### 27.3 Operation B — Competency Normalization

**Purpose:** map natural-language resume/free-text terms to canonical Ingenium competency IDs (e.g. "SQL querying" → `SQL`; "Python statistical programming" → `Statistical Programming`; "Power BI dashboards" → `Data Visualization`).
**Input:** candidate term(s), the competency framework and definitions.
**Rules:** never invent a competency ID; prefer the canonical supplied competency; uncertain matches return `LOW` confidence rather than a forced mapping; never silently create a new competency.

Output schema:
```json
{
  "matches": [
    {
      "input_term": "",
      "competency_id": "",
      "competency_name": "",
      "match_confidence": "HIGH",
      "reason": ""
    }
  ]
}
```
**Call frequency:** as needed during resume processing/data curation — not a fixed per-candidate count; batch where possible rather than one term at a time.

### 27.4 Operation C — Adaptive Question Generation

**Purpose:** generate the *next* assessment question — one at a time, never the full set in advance (§7.2, §8).
**Called when:** the assessment engine's backend-controlled router (§8) determines a new question is needed.
**Input:** `candidate_id`, target role, target competency, current estimated level, required role level, previous questions (so it never repeats one), previous answers/results, assessment progress. The backend decides what's relevant — it does not dump the whole candidate profile or database (§7.2, §25 of the original spec).

System prompt:
> "You are Ingenium's adaptive competency assessment module. Generate one professional assessment question based on the supplied competency, target role, estimated level, and assessment history. Return JSON only. Test the specified competency. Do not repeat previous questions. Increase difficulty when appropriate. Probe fundamentals when the candidate struggles. Prefer realistic professional/statistical scenarios. Make MCQs objectively scorable. Do not determine the final competency score."

Question JSON:
```json
{
  "question_id": "",
  "competency_id": "",
  "competency_name": "",
  "difficulty_level": 1,
  "question_type": "MCQ",
  "question": "",
  "options": [],
  "correct_answer": "",
  "explanation": "",
  "assessment_signal": ""
}
```
**Backend validates:** exactly one correct MCQ answer, all required fields present, `competency_id` is a known backend ID, `difficulty_level` is valid, no duplicate `question_id`, no duplicate question content against this session's history.

**Question quality bar:** competency-specific, role-relevant, objectively scorable, professional, concise, realistic. Avoid trivia, ambiguity, trick questions, multiple correct answers, unnecessarily complex language, irrelevant knowledge. For statistical/government-adjacent roles, realistic contexts include administrative datasets, survey data, official statistics, data quality, SQL, Python, statistical methods, data visualization, GIS, data validation, reporting.

**Validation / fallback:** malformed JSON → retry once → on repeated failure, pull a question from `assessment_seed.json` instead (this is exactly why the seed bank exists — see `CLAUDE.md` Rule 5). **Call frequency:** ~8–12 per candidate (one per question).

### 27.5 Operation D — Answer Evaluation (Open-Ended Only)

**MCQs are never sent to Mistral for evaluation** — `candidate_answer == correct_answer` is a plain backend comparison (§9). Calling Mistral to check an MCQ would add latency, cost, and a failure point for zero benefit.

For an open-ended question type (only when that type is actually used):
**Input:** the question, the expected concept, the candidate's answer, the competency.

System prompt:
> "You are Ingenium's assessment evaluation module. Evaluate the candidate's response against the supplied question and expected answer. Return JSON only. Evaluate correctness, relevance, completeness, reasoning, and technical accuracy. Return strengths, weaknesses, evidence, suggested level signal, and confidence. The suggested level is only an evidence signal. Do not calculate the final competency score or role readiness."

Output schema:
```json
{
  "correctness": "",
  "relevance": "",
  "completeness": "",
  "technical_accuracy": "",
  "strengths": [],
  "weaknesses": [],
  "evidence": "",
  "suggested_level_signal": 1,
  "confidence": "MEDIUM"
}
```
`suggested_level_signal` is evidence only — the backend computes the final competency level (§9). **Call frequency:** only when an open-ended question is used; 0 by default in the P0 MCQ-based build.

### 27.6 Operation E — Assessment Explanation (Optional)

**Purpose:** a concise, educational explanation shown to the candidate after a question, without altering the actual result.
**Input:** question, candidate answer, correct answer, competency.

Output schema:
```json
{
  "explanation": "",
  "key_concept": "",
  "common_mistake": ""
}
```
Must be concise, educational, professional, and must never modify the stored assessment result. **Call frequency:** optional, only when the UI requests it (P1 — see §21).

### 27.7 Operation F — Course-Competency Mapping (Offline / Preprocessing Only)

**Purpose:** map course descriptions in `courses.json` to competency IDs, for use by the deterministic course matcher (§11).
**Called when:** once, during data preparation/indexing (Task 1) — **never at runtime**, never per recommendation request. Result is persisted in the database and reused.
```
Course catalogue → preprocessing → Mistral-assisted (optional) competency mapping
  → store mapping in database → runtime recommendation uses deterministic matching only
```
**Call frequency:** at most one pass over the ~30–50 curated courses, done once during Task 1/9, not per candidate.

### 27.8 Runtime Request Pattern & Example

```
SYSTEM:  BASE_RULES (§27.1) + <operation>_RULES (§27.2–§27.7)
USER:    { "operation": "<OPERATION_NAME>", ...structured, operation-specific input... }
```

Example — resume extraction:
```
SYSTEM:
You are the AI intelligence layer of Ingenium.
Return JSON only. Never fabricate information.
Resume evidence is initial evidence, not verified capability.
Use only supplied competency IDs.
Do not calculate final competency scores, role readiness, or skill gaps.

You are currently performing: RESUME_EXTRACTION
Extract professional experience and competency evidence from the supplied resume.

USER:
{
  "candidate_id": "candidate_001",
  "resume_text": "...",
  "competency_framework": [
    { "id": "COMP_SQL", "name": "SQL", "definition": "..." },
    { "id": "COMP_STAT", "name": "Statistical Analysis", "definition": "..." }
  ]
}

EXPECTED OUTPUT: validated ResumeExtractionResponse JSON (§27.2), then Pydantic-validated
  and persisted by the backend as initial_evidence.
```

This is the pattern every operation follows — never the full 50+ section product specification pasted into a single request. See §7 for the summary architecture this section implements in detail.
