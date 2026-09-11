# Feature Specification: Task 1 — Data Foundation

**Feature Branch**: `002-task-1-data-foundation`

**Created**: 2026-09-11

**Status**: Draft

**Input**: Task 1 from `total_buildplan.md` §24: "Build `data/curated/roles.json`, `competencies.json`,
`courses.json`, `assessment_seed.json` from ESCO + hand-curation. Do not over-process ESCO."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Give Every Later Phase a Trustworthy Reference Dataset (Priority: P1)

Every downstream phase (roles endpoint, requirement engine, assessment, scoring, gap engine, course
recommendation) needs a small, internally-consistent set of curated roles, competencies, courses, and
seed assessment questions to build and test against. A developer produces that curated dataset once, from
the four active ESCO files plus hand-curation, before any database or API work begins.

**Why this priority**: Nothing in Tasks 2–10 can be built or tested without this data existing first
(`total_buildplan.md` §25: Task 0 → Task 1 → Task 2 → …).

**Independent Test**: Can be fully tested by validating the four curated JSON files against their schemas
and cross-checking referential integrity (every competency id referenced by a role or course actually
exists in `competencies.json`) — independently of any database or API code.

**Acceptance Scenarios**:

1. **Given** the four active ESCO files, **When** the curation process runs, **Then** `roles.json`
   contains 5–8 target roles, each with a name, description, and a set of required competencies with
   proficiency levels.
2. **Given** the curated roles, **When** `competencies.json` is produced, **Then** it contains 30–50
   competencies, each with a name, description, optional parent (for hierarchy, e.g. SQL → Window
   Functions), and a proficiency scale — and every competency referenced by any role in `roles.json`
   exists in this file.
3. **Given** the curated competencies, **When** `courses.json` is produced, **Then** it contains 30–50
   courses, each with an id, title, description, provider, the competencies it covers, level, duration,
   and priority — and every competency it references exists in `competencies.json`.
4. **Given** the curated competencies and roles, **When** `assessment_seed.json` is produced, **Then** it
   contains 20–30 seed questions, each tied to a competency that exists in `competencies.json`, usable as
   a fallback when Mistral question generation fails.

### Edge Cases

- What happens when an ESCO competency name doesn't cleanly map to a hand-curated competency? → The
  curator adapts/renames it for the MVP rather than importing it verbatim; `esco_source_id` traceability
  is preserved where a clean mapping exists, omitted where none does.
- What happens when a role requires a competency that has no course coverage at all? → Flag it during
  curation and either add a course or drop the requirement — an uncovered requirement would silently
  break the recommendation engine in Task 9.
- What happens if a competency has no seed question? → Not required for every competency, only enough
  seed coverage (20–30 questions total) to guarantee the Task 6 fallback never has zero questions for the
  competencies actually exercised by the curated roles.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST produce `data/curated/roles.json` containing 5–8 target roles, each with a
  unique id, name, description, and a list of required competencies with proficiency levels and priority.
- **FR-002**: System MUST produce `data/curated/competencies.json` containing 30–50 competencies derived
  from ESCO and adapted for the MVP, each with a unique id, name, description, optional parent competency
  (to express a hierarchy), and a proficiency scale.
- **FR-003**: System MUST produce `data/curated/courses.json` containing 30–50 curated learning resources,
  each with a unique id, title, description, provider, the competencies it covers, level, duration, and
  priority.
- **FR-004**: System MUST produce `data/curated/assessment_seed.json` containing 20–30 seed assessment
  questions, each tied to an existing competency id, usable as a schema-validated fallback per Rule 5.
- **FR-005**: System MUST ensure referential integrity across all four files: every competency id
  referenced by a role, course, or seed question exists in `competencies.json`.
- **FR-006**: System MUST derive competency and role content from the four active ESCO files
  (`occupations_en.csv`, `skills_en.csv`, `occupationSkillRelations_en.csv`, `skillsHierarchy_en.csv`)
  plus hand-curation, and MUST NOT require any other ESCO file at runtime.
- **FR-007**: System MUST NOT attempt to build a complete ESCO ontology, an exhaustive course dataset, or
  an assessment bank beyond the specified size ranges — over-processing ESCO is explicitly out of scope.
- **FR-008**: System MUST clearly mark this dataset as curated/demo application data (per the project's
  standing rule against silently fabricating real-world data), distinguishable from any real user input.

### Key Entities

- **Role** *(curated)*: id, name, description, required competencies with proficiency levels/priority.
- **Competency** *(curated)*: id, name, description, parent competency (optional), proficiency scale,
  ESCO source traceability (optional).
- **Course** *(curated)*: id, title, description, provider, competencies covered, level, duration,
  priority.
- **Seed Assessment Question** *(curated)*: id, competency id, question text, options, correct answer,
  difficulty — used only as the Task 6 fallback path.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All four curated files pass a referential-integrity check with zero dangling competency
  references.
- **SC-002**: Every one of the 5–8 curated roles has at least one course in `courses.json` covering each
  of its required competencies.
- **SC-003**: `assessment_seed.json` provides at least one seed question for every competency required by
  at least one curated role, guaranteeing Task 6's fallback path never has zero questions available for a
  competency a candidate could actually be assessed on.
- **SC-004**: A developer or reviewer can identify, from the files alone, which entries trace back to
  ESCO source data versus pure hand-curation.

## Assumptions

- "Hand-curation" means a developer manually selecting/adapting ESCO entries and authoring roles/courses/
  seed questions; no automated ESCO-to-curated-JSON pipeline is required to be reusable or re-runnable —
  a one-time curation pass producing static JSON files is sufficient for the MVP timeline.
- Course content (titles, providers, descriptions) is illustrative curated demo data, not verified
  real-world course catalogue data, and must be presented as such if a judge asks (per the project's
  standing rule on demo data).
- The specific 5–8 roles chosen are whichever can be implemented and demonstrated convincingly (e.g.
  Statistical Analyst, Data Analyst, Data Scientist, GIS Analyst), left to the curator's judgment within
  that range, per `total_buildplan.md` §4.
- `total_buildplan.md` §27.7 (Operation F, added after this spec's first draft) allows Mistral to
  optionally *assist* with course-to-competency mapping during this offline curation pass ("MAY", not
  "MUST" — never at runtime, per §7). This feature's actual implementation performed that mapping fully
  deterministically (hand-authored `competencies_covered` per course, validated by referential-integrity
  checks) without calling Mistral at all — a valid choice within §27.7's "optional," not a gap against
  this spec's FR-003/FR-006, since no requirement here mandates using Mistral for it.
