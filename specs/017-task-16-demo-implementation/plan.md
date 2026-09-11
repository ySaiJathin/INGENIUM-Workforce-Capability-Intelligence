# Implementation Plan: Task 16 — Demo Implementation

**Branch**: `017-task-16-demo-implementation` | **Date**: 2026-09-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/017-task-16-demo-implementation/spec.md`

## Summary

Seed the "Demo Officer" candidate (resume text + scripted assessment answers) so the already-working
real engines (Tasks 4–10) produce a compelling, credible resume-vs-verified gap story close to
`demo_plan.md` §3's illustrative numbers, wire `POST /candidates/demo` as the single prominent "Try Demo
Candidate" action, add the named demo-specific UI polish (`demo_plan.md`'s "Initial estimate" call-out,
the verified-vs-initial comparison beat, adaptive-assessment narration), rehearse failure recovery, and
capture the offline screenshot fallback set.

## Technical Context

**Language/Version**: Python 3.11+ (demo-candidate seed data + endpoint), TypeScript/React (UI polish).

**Primary Dependencies**: Reuses every engine already built in Tasks 4–10 — this phase adds no new engine
logic, only demo-specific seed data, a `POST /candidates/demo` endpoint, and targeted UI refinements.

**Storage**: PostgreSQL — one seeded `candidates` row (`source = demo`) with associated
`candidate_skills` and a pre-scripted assessment answer sequence usable to reliably reproduce the
illustrative story.

**Testing**: The demo script itself, rehearsed per `demo_plan.md` §16's checklist — run at least twice
back-to-back, cold-reload tested, Mistral-unavailable tested, timed at full talking speed.

**Target Platform**: The actual presentation device/browser used for judging, plus a backup device/tab.

**Project Type**: Cross-cutting polish pass over `backend/` (demo seed + endpoint) and `frontend/`
(demo-specific transitions/content), following `total_buildplan.md` §13/§24 and `demo_plan.md` in full.

**Performance Goals**: Full script timed under 2:30 (trimmable to 2:00), per spec SC-004.

**Constraints**: No hand-typed/fake numbers in the UI at demo time (FR-002/SC-005) — every number must
trace to the real engine's output for the seeded candidate; "Try Demo Candidate" must enter the identical
pipeline as a real upload (FR-001, Rule 12).

**Scale/Scope**: One seeded demo candidate, the demo-specific UI touches named in `demo_plan.md`, one
offline screenshot fallback set.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` is unfilled boilerplate; `CLAUDE.md` is the binding rulebook gate.

| Rule | Gate | Status |
|------|------|--------|
| Rule 12 — Demo reliability | Both paths never crash; fallback rehearsed (FR-004/005/006) | PASS |
| Rule 11 (task ordering) — Demo work only after core functionality works | Explicit Assumption, matches §24 | PASS |
| "Do not fabricate real-world data silently" | Demo candidate clearly `source = demo`, numbers real-engine-computed | PASS |

No violations — Complexity Tracking table is not needed.

## Project Structure

### Documentation (this feature)

```text
specs/017-task-16-demo-implementation/
├── plan.md              # This file
├── contracts/
│   └── api.md             # Phase 1 output — POST /candidates/demo
├── quickstart.md          # Phase 1 output — demo_plan.md §16's rehearsal checklist, operationalized
└── checklists/
    └── requirements.md
```

`research.md` and `data-model.md` are omitted: no new technology decision or entity is introduced — the
demo candidate reuses the exact `candidates`/`candidate_skills`/`assessments` shapes from Task 2's
`data-model.md`, just with curated seed content instead of real Mistral extraction.

### Source Code (repository root)

```text
backend/
├── data/curated/
│   └── demo_candidate.json     # Demo Officer's resume text + scripted assessment answers
└── src/
    └── api/
        └── candidates.py        # extended: POST /candidates/demo (loads demo_candidate.json)

frontend/
└── src/
    └── routes/                  # targeted polish: "Initial estimate" label, before/after emphasis,
                                  # adaptive-assessment narration copy — per demo_plan.md
```

**Structure Decision**: The demo candidate's seed content lives in its own curated file
(`demo_candidate.json`), separate from Task 1's `roles.json`/`competencies.json`/`courses.json`
/`assessment_seed.json`, since it represents one specific candidate persona rather than shared reference
data — keeping Task 1's reference-data files untouched (Rule 10) while adding exactly what this phase
needs.

## Complexity Tracking

*No Constitution Check violations — table intentionally left empty.*
