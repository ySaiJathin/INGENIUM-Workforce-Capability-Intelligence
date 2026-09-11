# CLAUDE.md

## Competency Intelligence MVP — Operating Rulebook

~13 hours remain. Implementation has not meaningfully started. This is the **final architecture** — see `build_plan.md` §2. Do not propose another architectural redesign unless a genuine implementation blocker makes the current architecture impossible.

---

## Rule 1 — Protect the Deadline

Prefer working code over architectural elegance. Working end-to-end golden path > correctness > explainability > UI polish > optimization > extra features.

Golden path (never sacrifice this for an optional feature):
```
Resume Upload (or Demo Candidate) → Initial Profile → Target Role → Role Requirements
  → Adaptive Assessment → Verified Skill Profile → Skill Gaps → Course Recommendations
  → Personalized Learning Path
```

## Rule 2 — Do Not Redesign Architecture

This is the final architecture (`build_plan.md` §2). No new infrastructure without a concrete blocker discovered during implementation.

## Rule 3 — MCP Is Optional, Not a Dependency

Never make MCP part of the MVP critical path (Mistral → MCP agent → MCP server → tools → DB). Document it only under "Future Improvements." Attempt it only if the full MVP already works, the demo is stable, and there is genuine spare time.

## Rule 4 — Mistral Boundaries

Mistral provides intelligence: resume extraction, adaptive question generation, question explanations, optional open-ended answer evaluation, natural-language explanations.

Mistral does **not** own: final skill score, role requirements, competency hierarchy, course-matching rules, business logic, or database state. The backend owns all of those.

## Rule 5 — Validate All LLM Output

Never trust unvalidated Mistral JSON. Use structured/schema-constrained generation where supported. If parsing fails: retry once; if it still fails, fall back to a seed question from `assessment_seed.json`. The assessment must never crash because of an LLM formatting problem.

## Rule 6 — Deterministic Scoring

The backend calculates final competency scores. See `build_plan.md` §9 for the formula. Assessment evidence outweighs resume evidence in the final score.

## Rule 7 — Use Existing Local Resources

ESCO CSVs (`occupations_en.csv`, `skills_en.csv`, `occupationSkillRelations_en.csv`, `skillsHierarchy_en.csv`) and the `all-MiniLM-L6-v2` model are already present locally. Do not ask the developer to download additional models or datasets unless absolutely necessary. Do not require the full ESCO package at runtime — only the four active files above are part of the pipeline; other ESCO files, if present, are optional reference material only.

## Rule 8 — No Model Training

No fine-tuning, no custom training, on any model. `all-MiniLM-L6-v2` is used as-is for semantic similarity (competency matching, course matching).

## Rule 9 — Test Continuously

After every major task: Implement → Run → Test → Fix → Continue. Never wait until the final hour to discover integration failures.

## Rule 10 — Preserve Working Code

Avoid unnecessary refactoring. Understand dependencies before changing anything that already works. Do not silently break the API contract — before changing a response field: search all consumers, update them, test, then commit.

## Rule 11 — P0 Before P1

Never implement optional (P1) functionality while a P0 feature is broken. See `build_plan.md` §21 for the priority list. If a P1 feature threatens the timeline, cut it — see the stop conditions in `build_plan.md` §19.

## Rule 12 — Demo Reliability

The demo must support both a real resume upload **and** "Try Demo Candidate." Neither path may crash the app. Mistral timeouts, unexpected PDFs, and parsing failures must degrade gracefully — see `build_plan.md` §13 and `demo_plan.md` §13.

## Rule 13 — Performance Discipline

Minimize: LLM calls, DB queries, frontend rerenders, large payloads, duplicate computation. Cache static competency data and embeddings. Avoid duplicate Mistral questions. Keep prompts small. Do not add infrastructure (Redis, message queues, etc.) for performance — see `build_plan.md` §18.

## Rule 14 — Failure Handling

A Mistral failure must not destroy the demo — fall back to `assessment_seed.json`. A resume-parsing failure must not crash the backend — return a useful error and point the user to "Try Demo Candidate." Use seed/fallback behavior wherever practical; never let a single failed call take down the golden path.

---

## Additional Standing Rules (carried over, still in force)

- One active shell/session at a time. No background terminals, no competing dev servers.
- Do not spawn sub-agents/parallel-agent workflows unless explicitly asked. A single final verification/test pass at the end is fine.
- Do not fabricate real-world data silently. Curated roles/competencies/courses/assessment data and the demo candidate must be clearly identifiable as demo data if a judge asks where a number came from.
- Do not swallow exceptions (`except Exception: pass`). Errors must say what failed, where, and why.
- Do not commit secrets. `.env` locally only; `.env.example` with placeholders committed; `.env` in `.gitignore`.
- PostgreSQL only — no second database.
- Validate uploaded file type and size on resume upload. Never execute arbitrary uploaded content. Use parameterized queries everywhere.

---

## Frontend Sequencing (see `build_plan.md` §14, §20, §24)

Frontend implementation is **deliberately pushed to the later hours** of the build. Backend, data, assessment engine, scoring, gap engine, and course recommendation must all be working and testable via `curl`/API calls before frontend work begins in earnest. Do not start frontend screens while a P0 backend piece is still broken.

---

## Hackathon Principle

The best implementation here is not the most sophisticated one. It is: simple enough to finish, credible enough to explain, polished enough to impress, structured enough to extend. When choosing between technically sophisticated-but-slow and simple-reliable-demonstrable, always choose the latter.
