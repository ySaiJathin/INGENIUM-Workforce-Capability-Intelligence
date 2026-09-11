# Implementation Plan: Task 1 — Data Foundation

**Branch**: `002-task-1-data-foundation` | **Date**: 2026-09-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-task-1-data-foundation/spec.md`

## Summary

Produce the four curated JSON files (`roles.json`, `competencies.json`, `courses.json`,
`assessment_seed.json`) under `data/curated/` by hand-curating from the four active ESCO CSVs
(`total_mvp_context.md` §2, `total_buildplan.md` §4). This is a one-time, offline data-authoring task —
no service is exposed and no database is touched (that's Task 2). Output feeds Task 2's seed step and
every later engine's reference data.

## Technical Context

**Language/Version**: Python 3.11+ (pandas) for a throwaway ESCO extraction/filtering script; the curated
JSON files themselves are the durable artifact, not the script.

**Primary Dependencies**: pandas (ESCO CSV processing only, per `total_buildplan.md` §6 — "pandas (ESCO
processing only)"). No database driver needed for this phase.

**Storage**: Flat JSON files under `data/curated/`; ESCO source read from `data/raw/esco/` (existing, 4
files only).

**Testing**: A small referential-integrity check script (every competency id referenced by a role/course/
seed question resolves in `competencies.json`) — see `quickstart.md`.

**Target Platform**: Local developer machine, run once before Task 2.

**Project Type**: Data-authoring script + static output files, not part of `backend/` or `frontend/`
runtime code (though `backend/data/curated/` is where Task 2 will read them from — see Task 2's plan for
the seed step).

**Performance Goals**: N/A — one-time offline generation.

**Constraints**: Do not over-process ESCO (`total_buildplan.md` §4); do not require any ESCO file beyond
the four active ones at runtime (Rule 7); keep dataset sizes within the specified ranges (5–8 roles,
30–50 competencies, 30–50 courses, 20–30 seed questions) — do not build "a complete ESCO ontology, a
massive course dataset, or a large assessment bank" (`total_buildplan.md` §4).

**Scale/Scope**: 5–8 roles / 30–50 competencies / 30–50 courses / 20–30 seed questions, as specified.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` is unfilled boilerplate; `CLAUDE.md` is the binding rulebook gate.

| Rule | Gate | Status |
|------|------|--------|
| Rule 7 — Use existing local resources | Only the 4 active ESCO files are read; no new dataset downloaded | PASS |
| "Do not fabricate real-world data silently" | Curated data explicitly labeled demo/curated (FR-008) | PASS |
| Rule 2 — No architecture redesign | Output format matches the frozen `data/curated/*.json` layout | PASS |
| Rule 13 — Performance discipline | Static files → trivially cacheable by every later phase | PASS |

No violations — Complexity Tracking table is not needed.

## Project Structure

### Documentation (this feature)

```text
specs/002-task-1-data-foundation/
├── plan.md              # This file
├── data-model.md         # Phase 1 output — schema for the 4 curated JSON files
├── quickstart.md         # Phase 1 output — how to validate referential integrity
└── checklists/
    └── requirements.md
```

`research.md` is intentionally omitted: the ESCO-to-curated mapping approach ("hand-curation, adapt as
needed, preserve `esco_source_id` where a clean mapping exists") is fully specified already in
`total_buildplan.md` §4 and the spec's Assumptions — there is no open technical unknown to research.
No `contracts/` directory: this phase produces static files, not a service interface.

### Source Code (repository root)

```text
data/
├── raw/esco/                       # existing, read-only input
│   ├── occupations_en.csv
│   ├── skills_en.csv
│   ├── occupationSkillRelations_en.csv
│   └── skillsHierarchy_en.csv
└── curated/                        # output of this phase
    ├── roles.json
    ├── competencies.json
    ├── courses.json
    └── assessment_seed.json

scripts/
└── curate_data.py                  # optional helper: ESCO extraction/filtering, hand-edited afterward
```

**Structure Decision**: Curated output lives at `data/curated/` at the repository root (matching
`total_buildplan.md` §3/§4 exactly), consumed by Task 2's seed step. An optional helper script may assist
extraction from ESCO, but the JSON files themselves — not the script — are the artifact later phases
depend on, since hand-curation edits are expected on top of any automated extraction.

## Complexity Tracking

*No Constitution Check violations — table intentionally left empty.*
