# Implementation Plan: Task 4 — Resume Processing

**Branch**: `005-task-4-resume-processing` | **Date**: 2026-09-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-task-4-resume-processing/spec.md`

## Summary

Implement `POST /candidates/resume`: validate the upload, extract text from PDF/DOCX, call Mistral for
structured competency extraction with schema validation + one retry, map the result onto curated
competency ids, persist the candidate + initial profile, and return it. This produces the "before" half
of the resume-estimate-vs.-verified demo moment and unblocks Task 5 (role selection needs a candidate to
attach to) and, in parallel, Task 5 can be built independently since it only needs a role id
(`total_buildplan.md` §25: "Tasks 4 and 5 can proceed in parallel once Task 3 is done").

## Technical Context

**Language/Version**: Python 3.11+, FastAPI, Pydantic.

**Primary Dependencies**: FastAPI (multipart file upload), a PDF text extraction library (e.g.
`pypdf`/`pdfplumber`) and a DOCX text extraction library (e.g. `python-docx`), the Mistral API client,
`sentence-transformers` (`all-MiniLM-L6-v2`) for the competency-name mapping fallback.

**Storage**: PostgreSQL — writes to `candidates` (Task 2's schema) and `candidate_skills`.

**Testing**: Contract test with a sample PDF and DOCX resume fixture (golden-path); failure-path tests for
oversized file, unsupported type, corrupted file, and a forced Mistral schema-validation failure (mocked)
to confirm the retry-then-error path never crashes the process.

**Target Platform**: Backend FastAPI service, local/demo machine.

**Project Type**: Backend web service (`backend/src/api/candidates.py` + `backend/src/services/`).

**Performance Goals**: Under 15 seconds end-to-end per spec SC-001, dominated by the Mistral call latency.

**Constraints**: Never execute uploaded content (FR-003); validate type/size before extraction (FR-002);
retry Mistral once then fall back to a clear error, never a crash (FR-006, Rule 5/14); backend — never
Mistral — decides the final mapping of extracted skills onto curated competency ids (FR-007, Rule 4).

**Scale/Scope**: Single-file upload per request, one candidate created per successful upload.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` is unfilled boilerplate; `CLAUDE.md` is the binding rulebook gate.

| Rule | Gate | Status |
|------|------|--------|
| Rule 5 — Validate all LLM output | Schema validation + 1 retry + graceful failure (FR-005/006) | PASS |
| Rule 4 — Mistral boundaries | Backend owns competency-id mapping, not Mistral (FR-007) | PASS |
| Rule 12/14 — Demo reliability / failure handling | Parsing failure never crashes, points to demo path | PASS |
| "Validate uploaded file type and size" | FR-002 | PASS |
| "Never execute arbitrary uploaded content" | FR-003 | PASS |
| Rule 8 — No model training | MiniLM used as-is for the mapping fallback only | PASS |

No violations — Complexity Tracking table is not needed.

## Project Structure

### Documentation (this feature)

```text
specs/005-task-4-resume-processing/
├── plan.md              # This file
├── research.md           # Phase 0 output — extraction libs, Mistral schema, mapping strategy
├── contracts/
│   └── api.md             # Phase 1 output — POST /candidates/resume request/response
├── quickstart.md          # Phase 1 output — upload a sample resume, verify profile
└── checklists/
    └── requirements.md
```

`data-model.md` is omitted: this phase only writes to `candidates` and `candidate_skills`, both already
fully specified in Task 2's `data-model.md` — no new entity is introduced.

### Source Code (repository root)

```text
backend/
└── src/
    ├── api/
    │   └── candidates.py          # POST /candidates/resume (and, later, POST /candidates/demo — Task 16)
    └── services/
        ├── resume_extraction.py    # PDF/DOCX text extraction
        ├── mistral_client.py       # thin API wrapper + schema validation + retry logic (shared with Task 6)
        └── competency_mapping.py   # extracted skill name → curated competency id (exact/alias, MiniLM fallback)
```

**Structure Decision**: `mistral_client.py` is a shared service module (not duplicated) since Task 6's
question generation also calls Mistral with the same validate-retry-fallback discipline — building it
once here keeps Task 6 from re-solving the same problem. `competency_mapping.py` is kept as a standalone
service, demoted from primary mapping mechanism to an optional salvage pass for Mistral's
`unmapped_terms` (per `total_buildplan.md` §27.2 — see `research.md` §4's superseded-decision note); it
remains reusable by Task 9's course-matching regardless.

**Confidence representation** (updated for §27.2): `mistral_client.py` returns Mistral's categorical
`LOW|MEDIUM|HIGH` confidence as-is for the API response (FR-009). A small, fixed mapping
(`LOW→0.3, MEDIUM→0.6, HIGH→0.9`) converts it to the numeric value stored in
`candidate_skills.resume_confidence` (Task 2's schema, unchanged — a float column), since Task 7's
scoring formula blends it numerically. This keeps the DB schema and Task 7's math untouched while the
API-facing shape matches the frontend's categorical type exactly (Task 11's plan already anticipated
exactly this kind of translation happening in the API client / service layer).

## Complexity Tracking

*No Constitution Check violations — table intentionally left empty.*
