# Implementation Plan: Task 14 — Frontend Results

**Branch**: `015-task-14-frontend-results` | **Date**: 2026-09-11 | **Spec**: [spec.md](./spec.md)
**Updated**: 2026-09-11 — revised against the existing `sk/sk` prototype's six/seven results screens.

**Input**: Feature specification from `/specs/015-task-14-frontend-results/spec.md`

## Summary

Wire the six already-built results screens (`AssessmentResults.tsx`, `CapabilityProfile.tsx`,
`SkillGaps.tsx`, `Courses.tsx`, `CourseDetail.tsx`, `LearningPath.tsx`) plus the consolidating
`Dashboard.tsx` to Tasks 7–10's real endpoints, each independently loaded and error-handled, with the
resume-vs-verified comparison kept as the visually dominant element of Assessment Results.

## Technical Context

**Language/Version**: TypeScript, React 18.3.

**Primary Dependencies**: Task 11's `apiClient` (`getAssessmentResults`, `getVerifiedCapabilityProfile`,
`getSkillGaps`, `getCourseRecommendations`, `getCourseDetails`, `getLearningPath`), shared components
already built (`MetricCard`, `ComparisonBar`, `CompetencyCard`, `GapCard`, `CourseCard`,
`LearningPathTimeline`).

**Storage**: N/A — analysis/session id held in route/context state (per Task 11's convention).

**Testing**: Manual verification against `quickstart.md`, including independent per-screen failure
simulation (spec FR-009/SC-003).

**Target Platform**: Browser, demo machine.

**Project Type**: Frontend web app (`frontend/src/pages/AssessmentResults.tsx`, `CapabilityProfile.tsx`,
`SkillGaps.tsx`, `Courses.tsx`, `CourseDetail.tsx`, `LearningPath.tsx`, `Dashboard.tsx`).

**Performance Goals**: Each screen fetches and renders independently, so one slow/failed call never
blocks navigation to or rendering of the others; `Dashboard.tsx` reuses already-fetched context state
rather than issuing its own duplicate calls (Rule 13 — avoid duplicate computation).

**Constraints**: The resume-vs-verified comparison must be visually the most prominent element on
Assessment Results (FR-001/SC-001); every gap must be represented, even unmatched ones (FR-008/SC-002);
the Learning Path's client-side edit actions remain local-only for this MVP (spec Assumptions).

**Scale/Scope**: 7 routes/screens, matching Task 11's adopted route list for the results portion of the
golden path.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` is unfilled boilerplate; `CLAUDE.md` is the binding rulebook gate.

| Rule | Gate | Status |
|------|------|--------|
| Rule 11 — Frontend sequencing | Built only after Tasks 7–10's endpoints are already API-verified | PASS |
| Product core moment (`total_mvp_context.md` §1) | Resume-vs-verified contrast visually emphasized (FR-001) | PASS |
| Rule 12 — Demo reliability | Independent screen failure handling (FR-009) | PASS |
| Rule 10 — Preserve working code | Existing seven screens' structure/styling kept; only data source changes | PASS |
| Rule 13 — Performance discipline | Dashboard reuses fetched state instead of duplicate calls | PASS |

No violations — Complexity Tracking table is not needed.

## Project Structure

### Documentation (this feature)

```text
specs/015-task-14-frontend-results/
├── plan.md              # This file
├── quickstart.md         # Phase 1 output — scripted walkthrough of all seven screens + failure cases
└── checklists/
    └── requirements.md
```

`research.md`, `data-model.md`, and `contracts/` are omitted: no new technology decision, entity, or API
contract is introduced — this phase implements real data wiring against Tasks 7–10's already-frozen
contracts.

### Source Code (repository root)

```text
frontend/
└── src/
    └── pages/
        ├── AssessmentResults.tsx    # wired — real readiness score, comparison chart, evaluation table
        ├── CapabilityProfile.tsx     # wired — real verified-competency card grid
        ├── SkillGaps.tsx              # wired — real ranked gaps + "no gaps" state
        ├── Courses.tsx                 # wired — real course recommendations
        ├── CourseDetail.tsx            # wired — real single-course detail
        ├── LearningPath.tsx             # wired — real ordered steps + "no path needed" state
        └── Dashboard.tsx                 # wired — reuses already-fetched context state, no new calls
```

**Structure Decision**: No new files — each screen already exists with its full layout/styling; this
phase replaces each screen's mock-data source with real `apiClient` calls (routed through `AppContext`,
per Task 11), and `Dashboard.tsx` specifically is wired to read from context rather than issuing its own
network requests, keeping it duplicate-call-free.

## Complexity Tracking

*No Constitution Check violations — table intentionally left empty.*
