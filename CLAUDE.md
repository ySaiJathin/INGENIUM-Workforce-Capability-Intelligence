# CLAUDE.md

## Competency Intelligence MVP — Operating Rulebook

**Active implementation authority:** `INGENIUM_MASTER_FUNCTIONALITY_AND_MCP_IMPLEMENTATION.md`.
That document supersedes `build_plan.md`/`total_mvp_context.md` wherever they conflict on
architecture (MCP, FAISS) — this file restates its rules so a fresh session isn't misled by the
older, still-present planning docs. Implementation is substantially built already (see that
document's §0 "known discrepancy" note and this repo's `specs/` folders) — this is a live system
being extended and stabilized, not a from-scratch build.

Do not propose another architectural redesign beyond what's specified in the master document
unless a genuine implementation blocker makes it impossible.

---

## Product Goal

Ingenium is an explainable workforce competency intelligence system. It turns an unverified
resume claim into a verified, evidence-backed competency state, compares it against a target
role's requirements, and produces a specific, explainable learning path.

Golden path (never sacrifice this for an optional feature):
```
Resume Upload (or Demo Candidate) → Initial Profile → Target Role → Role Requirements
  → Adaptive Assessment → Verified Skill Profile → Skill Gaps → Priority → Courses
  → Evidence → Personalized Learning Path
```

## Architecture

```
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

MCP is a controlled tool/context interface between the application and Mistral. MCP is NOT allowed
to become the authority for: competency scores, gap calculations, priority calculations, or course
ranking. Those remain deterministic backend responsibilities, always.

## LLM Responsibility

Mistral MAY: extract structured skills, generate assessment questions, evaluate open-ended
responses where applicable, explain results, generate grounded learning plans (via the MCP/FAISS
evidence layer).

Mistral MAY NOT: invent competency frameworks, invent role requirements, assign final competency
scores, calculate final gaps, rank courses independently, or invent evidence.

## MCP Responsibility

MCP tools provide controlled, typed, schema-validated, read-oriented access to application state
and retrieval functions (candidate profile, role, competency framework, assessment context,
evidence, gap analysis, course recommendations). MCP must never expose arbitrary SQL execution,
filesystem access, shell execution, or secret access, and must never become a single point of
failure — a controlled application-service fallback always exists if MCP fails.

---

## Explicit Rule Changes vs. the Prior CLAUDE.md

Decisions confirmed 2026-09-11, so no future session is confused by the contradiction with the
still-present `build_plan.md`/`total_mvp_context.md`:

- **Old Rule 3 ("MCP Is Optional, Not a Dependency") is superseded.** MCP is now a required core
  layer, not an optional post-MVP extra.
- **Old Rule 2 ("Do Not Redesign Architecture") / old Rule 13 ("do not add infrastructure for
  performance") are superseded specifically for the MCP tool layer and the FAISS evidence index** —
  those two additions are now part of the frozen architecture. No other new infrastructure (Redis,
  Kafka, Kubernetes, microservices, etc.) is authorized by this change.
- All other original rules below (deterministic scoring stays backend-owned, no silent
  exception-swallowing, validate all LLM output, PostgreSQL only, no secrets committed, etc.)
  remain in force unchanged.

---

## Implementation Rules

**Rule 1 — Diagnose before modifying.** Never make speculative changes: reproduce → identify
layer → inspect code → modify → test.

**Rule 2 — One phase at a time.** Do not jump ahead in the master document's phase list. Complete
each phase and its acceptance criteria before starting the next.

**Rule 3 — Preserve working code.** Do not rewrite working modules unnecessarily. Understand
dependencies before changing anything that already works. Do not silently break the API contract —
before changing a response field: search all consumers, update them, test, then commit.

**Rule 4 — No silent failures.** Never `except Exception: pass`. Errors must say what failed,
where, and why.

**Rule 5 — Validate all LLM output.** No generated response enters the database without schema
validation. If parsing fails: retry once; if it still fails, fall back to a seed question from
`assessment_seed.json` or a controlled error. The assessment must never crash because of an LLM
formatting problem.

**Rule 6 — Deterministic authority.** The backend calculates final competency scores, gap math,
priority, and course ranking — never Mistral, never MCP. Assessment evidence outweighs resume
evidence in the final score.

**Rule 7 — Use existing local resources.** ESCO CSVs (`occupations_en.csv`, `skills_en.csv`,
`occupationSkillRelations_en.csv`, `skillsHierarchy_en.csv`) and the `all-MiniLM-L6-v2` model are
already present locally. Do not ask the developer to download additional models or datasets unless
absolutely necessary. Do not require the full ESCO package at runtime — only the four active files
above are part of the pipeline; other ESCO files, if present, are optional reference material only.

**Rule 8 — No model training.** No fine-tuning, no custom training, on any model.
`all-MiniLM-L6-v2` is used as-is for semantic similarity (competency matching, course matching,
evidence retrieval).

**Rule 9 — Test continuously.** After every major task: Implement → Run → Test → Fix → Continue.
No phase or task is marked complete on the strength of "the code looks right" — only on an actual
verified command/API result matching the expected result.

**Rule 10 — Fallbacks.** LLM failure must not destroy the demo. Use deterministic fallback
behavior wherever practical. If Mistral fails: retry → fallback → continue. If MCP fails:
controlled application-service fallback → continue.

**Rule 11 — Every endpoint must have:** success, loading, empty, validation error, and runtime
error states/handling.

**Rule 12 — Do not add unnecessary infrastructure.** Do not introduce Kubernetes, Redis, Kafka,
Elasticsearch, Celery, microservices, or complex authentication unless the current repository
proves it is required. MCP and FAISS are the two explicitly authorized exceptions — nothing else.

**Rule 13 — MCP must remain small and explainable.** Do not create an autonomous, uncontrolled
agent.

**Rule 14 — Demo reliability.** The demo must support both a real resume upload and "Try Demo
Candidate." Neither path may crash the app. Mistral timeouts, unexpected PDFs, parsing failures,
and MCP/FAISS unavailability must all degrade gracefully.

---

## Additional Standing Rules (carried over, still in force)

- One active shell/session at a time. No background terminals, no competing dev servers.
- Do not spawn sub-agents/parallel-agent workflows unless explicitly asked. A single final
  verification/test pass at the end is fine.
- Do not fabricate real-world data silently. Curated roles/competencies/courses/assessment data
  and the demo candidate must be clearly identifiable as demo data if a judge asks where a number
  came from.
- Do not swallow exceptions (`except Exception: pass`). Errors must say what failed, where, and
  why.
- Do not commit secrets. `.env` locally only; `.env.example` with placeholders committed; `.env`
  in `.gitignore`.
- PostgreSQL only — no second database.
- Validate uploaded file type and size on resume upload. Never execute arbitrary uploaded content.
  Use parameterized queries everywhere.

---

## Execution & Testing Protocol

Every "TEST"/"VERIFY" step means an actual, reported command or API result — never "the code looks
right." Prefer running verification directly (Bash/PowerShell/curl) when command execution is
available in-session; fall back to handing the developer exact commands only if it genuinely isn't.
If a later feature breaks an earlier phase: STOP, fix the regression, re-run the earlier test, then
continue.

---

## Hackathon Principle

The best implementation here is not the most sophisticated one. It is: simple enough to finish,
credible enough to explain, polished enough to impress, structured enough to extend. When choosing
between technically sophisticated-but-slow and simple-reliable-demonstrable, always choose the
latter.
