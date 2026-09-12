# INGENIUM — MASTER FUNCTIONALITY, MCP & END-TO-END IMPLEMENTATION PLAN

> **Adapted from the user-supplied draft against the actual repository state**
> (read on 2026-09-11: `backend/`, `frontend/`, `data/`, `models/`, `.specify/specs/`,
> `requirements.txt`, `backend/src/main.py`, `total_mvp_context.md`, `CLAUDE.md`).
> Corrections and open decisions from that audit are called out inline in blockquotes
> like this one — nothing below has been written into the project yet.

---

## ⚠️ ARCHITECTURE DECISIONS THIS PLAN MAKES — CONFIRM BEFORE PHASE 0

The current `CLAUDE.md` (already in the repo) contains two rules this plan directly
reverses. That may be exactly what's wanted now that the golden path is largely built —
but it should be a deliberate decision, not a side effect of pasting a new document in.

1. **Rule 3 — "MCP Is Optional, Not a Dependency."** Current rule: never put MCP on the
   critical path; attempt it only after the MVP works and there's spare time. This plan
   makes MCP a required, always-on layer between the backend and Mistral. → Confirm this
   reversal is intended.
2. **Rule 2 — "Do Not Redesign Architecture" / Rule 13 — "Do not add infrastructure... for
   performance."** FAISS is not in `requirements.txt` and no vector store exists anywhere
   in the repo. `total_mvp_context.md` §3 explicitly says *"FAISS is optional... plain
   cosine similarity over embeddings is almost certainly sufficient [at 30–50 items];
   add FAISS only if that proves too slow."* This plan makes FAISS required. → Confirm
   this reversal is intended, or keep FAISS optional/deferred and use the existing
   MiniLM-cosine approach for the evidence layer instead.

Neither reversal is wrong — a judged demo that can say "controlled MCP layer + grounded
RAG" is a stronger story than "we didn't have time." But `CLAUDE.md` is the standing
rulebook other sessions/agents read first, so if these become the new rules, `CLAUDE.md`
itself must say so explicitly (this plan's own §1 instruction), not just this document.

---

## 0.5 CORRECTIONS FROM THE ACTUAL REPO (read-only audit, nothing changed)

- File is `total_buildplan.md`, not `total_buildplan_1.md`.
- `claude_account_1_backend.md` and `claude_account_2_frontend.md` **exist but are stub
  files** — each says "RETIRED... please delete this file," pointing at the two-account
  split that was abandoned. They contain no task detail to read. Recommend deleting both
  once confirmed (a small cleanup, will ask separately before doing it).
- There is **no `/vector_store` and no `/database` directory** anywhere in the repo.
  Actual data/model layout:
  ```
  data/curated/   roles.json, competencies.json, courses.json,
                  assessment_seed.json, demo_candidate.json   (all present)
  data/raw/esco/  (the 4 active ESCO CSVs)
  models/all-MiniLM-L6-v2/
  ```
- `requirements.txt` is small and explicitly frozen ("do not add libraries beyond what
  each build phase needs" — Rule 13). It currently has **no `faiss`, no `mcp`/`fastmcp`
  SDK, no vector-store client of any kind.** Adding the MCP layer and FAISS means adding
  new dependencies, which is itself worth flagging per Rule 13 above.
- `backend/src/main.py` already wires up 8 routers with **no `/api` prefix** — everything
  mounts at root (`health`, `roles`, `competencies`, `courses`, `candidates`, `assessment`,
  `analysis`, `learning_path`). The exact paths inside each router (e.g. whether
  `POST /assessment/start` already exists under a different name) are **not yet verified**
  — §8's API contract below is a target to reconcile against in Phase 0 Task 0.1, not a
  confirmed current state.
- **The project is much further along than `total_mvp_context.md` §1's "Current
  implementation state: 0% built" claims.** That line is stale. The same document's own
  §6 status tracker (and the actual files on disk) show real, non-trivial implementations
  already exist for essentially every engine this plan's Phases 0–5 ask for:
  `backend/src/services/assessment_engine.py`, `scoring_engine.py`, `gap_engine.py`,
  `course_recommendation_engine.py`, `learning_path_engine.py`, `mistral_client.py`,
  `competency_mapping.py`, `resume_extraction.py` all exist with substantial code (2–12KB
  each), and the full frontend golden path (14 pages) plus 16 demo screenshots already
  exist. §6 itself says Phases 12–17 are "complete-with-caveats," live-verified, with one
  bug already found and fixed.
  → **Phase 0's diagnosis is not optional scaffolding here — it's the difference between
  "build resume→skills→assessment→scoring→gaps→courses from scratch" (this plan's
  Phases 0–5 as literally written) and "these mostly work, audit and fix what's actually
  broken, then add the MCP/RAG layer on top" (almost certainly the real task).** Nothing
  below assumes Phase 0's outcome — treat every "objective"/"task" in Phases 0–5 as
  conditional on what the audit actually finds broken vs. working.

---

## ⚠️ EXECUTION ENVIRONMENT NOTE

I can currently read, edit, and write files in this project folder on your machine, but
**I cannot run shell commands there right now** (`docker compose up`, `pytest`, `uvicorn`,
`npm run dev`, etc.) — a recent Windows update broke the mount this session uses for
command execution on your computer (file access still works fine; command execution
doesn't). This affects almost every "TEST"/"VERIFY" step in this plan as literally
written. Before Phase 0 starts, we need to agree how testing actually happens — see the
questions below.

---

## MASTER INSTRUCTION FOR CLAUDE CODE

*(unchanged from the original draft — this is the standing instruction for whichever
session/agent executes the phases below)*

You are working on the existing Ingenium / Competency Gap MVP codebase. Your job is NOT
to create a new application from scratch. Your job is to:

1. Inspect the existing repository.
2. Understand the current implementation.
3. Diagnose broken functionality.
4. Update the project's `CLAUDE.md` rules to reflect this implementation plan.
5. Implement the missing/broken functionality.
6. Integrate Mistral through a controlled MCP/tool layer.
7. Preserve the existing architecture wherever possible.
8. Test every phase before proceeding.
9. Complete the entire golden path without manual database or terminal intervention.

*(The full golden-path diagram, per-phase task breakdown, MCP tool list, API contract,
error contract, logging spec, testing strategy, MCP safety rules, and definition-of-done
from the user's draft are preserved as-is below — only the "read before touching code"
list and the directory list in §0 have been corrected to match the real repo, per §0.5
above.)*

### 0. READ BEFORE TOUCHING CODE

First read:
- `CLAUDE.md`
- `total_mvp_context.md`
- `total_buildplan.md`  ← corrected from `total_buildplan_1.md`
- `demo_plan.md`

*(`claude_account_1_backend.md` / `claude_account_2_frontend.md` dropped from this list —
they are retired stub pointers with no content, see §0.5.)*

Then inspect:
- `/backend`
- `/frontend`
- `/data` (`data/curated/`, `data/raw/esco/`)
- `/models` (`all-MiniLM-L6-v2/`)
- `/scripts`
- `/.specify/specs/` ← the existing spec-kit task history; each of the 18 spec folders
  has its own `spec.md`/`plan.md`/`tasks.md` and should be treated as prior art, not
  duplicated
- `docker-compose.yml`
- `.env` / `.env.example`

*(`/vector_store` and `/database` removed — they don't exist in this repo.)*

Do not assume that the documentation matches the implementation. The repository is the
source of truth for current implementation. The documents are the intended architecture.

Identify:
```
WHAT EXISTS
WHAT WORKS
WHAT IS BROKEN
WHAT IS PARTIALLY IMPLEMENTED
WHAT IS MISSING
WHAT API CONTRACTS CURRENTLY EXIST
```
Before making changes, create a concise implementation diagnosis.

---

*(Sections 1 through 18 — CLAUDE.md update spec, 10 implementation rules, Phases 0–7 with
their full task lists, the required API contract, frontend state requirements, error
contract, logging spec, testing strategy, MCP safety rules, final architecture diagram,
final golden path, definition of done, and execution behavior — carry over from the
user's draft exactly as written, with two substantive edits:)*

- **Phase 0** keeps all of its tasks (0.1–0.9) but Task 0.1's output feeds directly into
  the "much further along than 0% built" reality above — expect most of Tasks 0.2–0.9 to
  be "verify and fix specific bugs" rather than "build from nothing."
- **Phase 6 (Evidence + RAG + MCP)** is where the Rule 2/Rule 13 reversal from the top of
  this document actually bites — Task 6.2 (build a persistent FAISS index) is new
  infrastructure the current stack doesn't have. If the architecture-reversal questions
  above are answered "keep it simple," Phase 6 should use MiniLM cosine similarity
  directly (matching the existing, working pattern in `course_recommendation_engine.py`
  and `competency_mapping.py`) instead of standing up FAISS.

*(Full text of the original draft's Phases 0–18 is preserved verbatim in the version I
can write into the repo once you've confirmed the decisions above — I haven't duplicated
all ~700 lines a second time here since nothing in them changes except the two notes
above; happy to paste the complete merged file in full if you'd rather review every line
before it's saved.)*
