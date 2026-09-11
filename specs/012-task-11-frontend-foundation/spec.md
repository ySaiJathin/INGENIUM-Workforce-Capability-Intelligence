# Feature Specification: Task 11 — Frontend Foundation

**Feature Branch**: `012-task-11-frontend-foundation`

**Created**: 2026-09-11
**Updated**: 2026-09-11 — revised against the existing `sk/sk` frontend prototype (React 18.3 + TypeScript +
Vite 6 + Tailwind 3.4 + React Router 6.29 + lucide-react, built against mock data). That prototype is now
the concrete UI reference this phase wires to the real backend — see Assumptions.

**Status**: Draft

**Input**: Task 11 from `total_buildplan.md` §24: "App shell, routing, API client, design system,
layout, navigation, loading/error states." *(begins only after Tasks 1–10 are API-verified)*

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Have a Working App Shell to Build Every Screen Into (Priority: P1)

A developer starts frontend work only once every backend endpoint (Tasks 3–10) has been verified via
`curl`/httpie with real data. They take the existing `sk/sk` prototype — already routed, styled, and
componentized against mock data — as the starting point, replace its mock data source with a typed API
client wrapping every verified backend endpoint, and confirm consistent loading/error states across every
screen, so every subsequent frontend phase (Tasks 12–14) can wire real data into an already-working shell.

**Why this priority**: Every later frontend phase depends on this shell; skipping it means each screen
reinvents API calls, loading states, and navigation inconsistently, risking the deadline
(`CLAUDE.md` Rule 11 / `total_buildplan.md` §14).

**Independent Test**: Can be fully tested by loading the running app, confirming it routes between every
golden-path screen already defined in the prototype, that the API client successfully calls at least one
real backend endpoint (e.g. `GET /roles`) and renders its data in place of the mock data, and that a
simulated API failure renders a visible error state rather than a blank screen or crash.

**Acceptance Scenarios**:

1. **Given** the backend is running with all Task 3–10 endpoints verified, **When** the frontend app
   starts, **Then** it renders the existing app shell (`AppShell`/`Header`/`Sidebar`/`PageHeader`) with
   routing covering every golden-path screen already defined in the prototype (see Key Entities' route
   table).
2. **Given** the app shell, **When** any screen fetches data via the shared API client, **Then** a
   loading state is shown while the request is in flight, replacing the prototype's simulated `delay()`
   calls with real network latency handling.
3. **Given** the app shell, **When** an API call fails (network error, 4xx, 5xx), **Then** a clear error
   state is shown to the user rather than a blank screen, an unhandled exception, or a frozen loading
   spinner.
4. **Given** the design system already established in the prototype (Tailwind tokens, `card-enterprise`
   utility classes, the shared `components/ui/*` primitives), **When** any two golden-path screens are
   compared, **Then** they continue to share consistent layout, typography, and color usage.
5. **Given** the prototype's central `AppContext` (candidate, target role, extracted evidence, initial
   profile, assessment state, verified profile, skill gaps, courses, learning path, demo-mode flag),
   **When** it is adapted for this phase, **Then** its state is populated from real API responses instead
   of imported mock constants, while keeping the same action names/shape so no consuming screen's code
   needs to change beyond its data source.

### Edge Cases

- What happens when the backend is completely unreachable at app startup? → The app shell still renders;
  individual screens show their own error state when their specific data fetch fails, rather than the
  whole app failing to load.
- What happens when a candidate navigates directly to a mid-flow route (e.g. `/assessment`) without having
  completed the prior steps (no candidate/role in context)? → The app must not crash; it should redirect to
  or prompt the missing prior step rather than rendering a broken screen — the prototype's `AppContext`
  currently always has a non-null candidate/role/etc. (defaulting to demo data), so this phase must decide
  and implement what "no real data yet" looks like once mock defaults are removed.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide client-side routing (React Router) covering every screen already
  defined in the `sk/sk` prototype: Home, Candidate, Resume Upload, Initial Profile, Role Selection, Role
  Requirements, Assessment, Assessment Results, Capability Profile (verified), Skill Gaps, Courses, Course
  Detail, Learning Path, and Dashboard.
- **FR-002**: System MUST provide a single, shared, typed API client (evolving the prototype's
  `WorkforceIntelligenceAPI` static class) used by every screen to call the backend — no screen makes
  ad-hoc/duplicated fetch logic, and no screen imports directly from `mock/demoData.ts` once this phase
  is complete.
- **FR-003**: System MUST preserve the design system already established in the prototype (Tailwind
  config, `card-enterprise`/`btn-primary`/`btn-secondary` utility classes, and the shared
  `components/ui/*` and `components/layout/*` primitives) rather than introducing a new one.
- **FR-004**: System MUST show a visible loading state for any in-flight API request longer than a brief
  instant, replacing the prototype's fixed `delay()` simulation with real request-pending state.
- **FR-005**: System MUST show a visible, clear error state for any failed API request, distinguishing at
  minimum "couldn't reach the server" from "server returned an error."
- **FR-006**: System MUST NOT crash or render a blank screen when required prior-step state (e.g. no
  candidate id) is missing for the current route — it must redirect or prompt appropriately, replacing the
  prototype's always-populated demo defaults with an explicit "no candidate loaded yet" state.
- **FR-007**: System MUST NOT begin building this frontend foundation before the backend endpoints it
  depends on return real, non-mock data (Rule 11) — this phase starts only after Tasks 3–10 are
  API-verified.
- **FR-008**: System MUST preserve `AppContext`'s existing action names and shape (`loadDemoCandidate`,
  `resetToBlankState`, `setResumeUploaded`, `selectTargetRole`, `answerAssessmentQuestion`,
  `nextQuestion`/`previousQuestion`, `completeAssessment`, `addCourseToLearningPath`,
  `removeCourseFromLearningPath`, `toggleStepStatus`) so later phases wire real API calls behind the same
  interface every screen already consumes.

### Key Entities

- **App Route**: one entry per screen already defined in the prototype's `App.tsx`:

  | Path | Screen |
  |---|---|
  | `/` | Home (landing) |
  | `/candidate` | Candidate (profile summary + entry point) |
  | `/candidate/resume` | Resume Upload |
  | `/candidate/profile` | Initial (resume-derived) Profile |
  | `/roles` | Role Selection |
  | `/roles/:roleId` | Role Requirements |
  | `/assessment` | Adaptive Assessment |
  | `/assessment/results` | Assessment Results (resume-vs-verified reveal) |
  | `/capability` | Verified Capability Profile |
  | `/gaps` | Skill Gap Analysis |
  | `/courses` | Course Catalog |
  | `/courses/:courseId` | Course Detail |
  | `/learning-path` | Personalized Learning Path |
  | `/dashboard` | Executive Summary Dashboard |

- **API Client Method**: one typed method per backend contract established in Tasks 3–10, named to match
  (or cleanly map to) the prototype's existing `WorkforceIntelligenceAPI` methods (`getCandidate`,
  `uploadResume`, `getExtractedEvidence`, `getInitialProfile`, `getTargetRoles`, `getRoleRequirements`,
  `getAssessmentQuestions`, `submitAssessmentAnswer`, `getAssessmentResults`,
  `getVerifiedCapabilityProfile`, `getSkillGaps`, `getCourseRecommendations`, `getCourseDetails`,
  `getLearningPath`).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A developer can navigate the full route table above in the running app, with real
  (non-mock) data once wired, without a single unhandled crash.
- **SC-002**: 100% of data-fetching screens built out in Tasks 12–14 call the shared API client rather
  than importing from `mock/demoData.ts` or introducing their own fetch logic (verifiable by code review
  at the end of those phases).
- **SC-003**: Simulating a backend outage results in a visible, understandable error state on every
  screen that depends on backend data, with zero blank/frozen screens.

## Assumptions

- `sk/sk` is treated as the authoritative frontend prototype for this MVP: its routes, page inventory,
  component structure, `AppContext` shape, and `WorkforceIntelligenceAPI` method signatures are the
  concrete design this phase (and Tasks 12–14) implement against, superseding any earlier speculative
  route list or screen inventory from this spec's prior draft.
- The prototype's domain framing (Indian civil/statistical service: candidates have `designation`,
  `department`, `cadre`, `employeeCode`; roles include "Senior Statistical Officer," "Senior Data
  Analyst," "Lead Data Scientist," "Statistical Programmer"; courses cite "iGOT Karmayogi," "National
  Statistical Academy," "Ministry of Statistics (MoSPI)") is the product's actual curated-data domain —
  Task 1's curated `roles.json`/`competencies.json`/`courses.json` should be authored to match this
  framing rather than a generic corporate domain, so the frontend and backend tell one consistent story.
- The prototype's competency proficiency scale is 1–4 (`Foundation`/`Working`/`Advanced`/`Expert`) and its
  confidence values are categorical (`HIGH`/`MEDIUM`/`LOW`), not the generic 1–5 numeric scale and 0–1
  float confidence assumed in this project's earlier backend-only drafts. This phase adapts the API
  client's types to the prototype's scale; any backend contract whose numeric scale differs is reconciled
  during Task 15 integration (see that phase's own spec), not re-decided here.
- The prototype's local-only interactive features (`addCourseToLearningPath`, `removeCourseFromLearningPath`,
  `toggleStepStatus` on the Learning Path screen) are treated as client-side UI affordances for this MVP —
  they are not assumed to require a new backend mutation endpoint unless a later phase's integration pass
  determines otherwise.
- No dedicated automated frontend test framework is introduced in this phase, consistent with the
  prototype's current setup (no test dependency in `package.json`) and the project's emphasis on
  `curl`-verified backend contracts over frontend test infrastructure within the time budget.
