# Phase 0 Research: Task 11 — Frontend Foundation

Updated against the existing `sk/sk` prototype — most decisions below are now "confirm/adapt the
prototype's existing choice" rather than choosing from scratch.

## 1. Routing library

- **Decision**: React Router 6.29 (already in `sk/sk`'s `package.json`), one route per screen, matching
  `App.tsx`'s existing route table exactly (see spec Key Entities).
- **Rationale**: Already implemented and working in the prototype; `total_mvp_context.md` §3 fixes React
  + TypeScript + Vite + Tailwind as the stack, and the prototype's routing choice is consistent with it.
- **Alternatives considered**: None — reusing the prototype's existing, working routing avoids
  re-deciding an already-settled choice (Rule 2's spirit applied to this sub-decision).

## 2. State management

- **Decision**: Keep the prototype's `AppContext` (React Context + `useState`) holding candidate, target
  role, all roles, extracted evidence, initial profile, assessment questions/answers/progress, assessment
  results, verified profile, skill gaps, all courses, learning path, resume filename, and demo-mode flag —
  swap its internal data sources from imported mock constants to real API client calls, keeping every
  exposed action's name and signature unchanged.
- **Rationale**: The prototype already centralizes exactly the cross-screen state this MVP's golden path
  needs; replacing its data source without changing its shape means every already-built screen keeps
  working unmodified once wired to the real API (Rule 10 — preserve working code).
- **Alternatives considered**: A global state library (Redux, Zustand) — rejected, unnecessary weight;
  the prototype already proves Context is sufficient at this scale.

## 3. Design system scope

- **Decision**: Keep the prototype's existing Tailwind config, `card-enterprise`/`btn-primary`/
  `btn-secondary` utility classes, and `components/ui/*` (MetricCard, StatusBadge, ConfidenceBadge,
  EvidenceBadge, CompetencyLevelBadge, ComparisonBar, ProgressBar) and `components/layout/*`
  (AppShell, Header, Sidebar, PageHeader) primitives.
- **Rationale**: `total_buildplan.md` §14: "Design must feel like a professional workforce competency
  intelligence tool... not a template admin dashboard" — the prototype already achieves this with a
  distinctive dark-slate/blue enterprise-government visual identity; there is no reason to redesign it.
- **Alternatives considered**: None — this is an established, working design system, not an open choice.

## 4. API client shape

- **Decision**: Evolve the prototype's `WorkforceIntelligenceAPI` static class in place: keep every
  existing method name and signature (`getCandidate`, `uploadResume`, `getExtractedEvidence`,
  `getInitialProfile`, `getTargetRoles`, `getRoleRequirements`, `getAssessmentQuestions`,
  `submitAssessmentAnswer`, `getAssessmentResults`, `getVerifiedCapabilityProfile`, `getSkillGaps`,
  `getCourseRecommendations`, `getCourseDetails`, `getLearningPath`), replacing each method's body from
  `await delay(ms); return mockData;` to a real `fetch`/typed HTTP call against the matching backend
  endpoint from Tasks 3–10, with error handling the shared `ErrorState` component understands.
- **Rationale**: Every prototype screen already calls these exact method names via `AppContext`; keeping
  the same public interface means zero changes are needed in any screen component, only in
  `services/api.ts` and `context/AppContext.tsx`'s data-loading effects (Rule 10).
- **Alternatives considered**: A ground-up rewrite of the API client with different method names/shapes —
  rejected, would force touching every already-built screen for no functional benefit.

## 5. Reconciling proficiency scale and confidence representation with backend contracts

- **Decision**: The frontend's types (`CompetencyLevelNumber` = 1–4, `ConfidenceLevel` =
  `HIGH`/`MEDIUM`/`LOW`) are the values this MVP's UI presents. The API client layer is the single place
  responsible for mapping backend values onto these frontend types (e.g. mapping a backend numeric
  confidence float to a `HIGH`/`MEDIUM`/`LOW` bucket, and a backend proficiency scale to the 1–4 levels)
  if the backend's internal scale differs — the mapping detail is finalized during Task 15's integration
  pass once both sides are running together.
- **Rationale**: Keeps the frontend's already-built, already-styled UI (badges, comparison bars, level
  guides) stable, while isolating any scale mismatch to one translation layer instead of touching every
  screen.
- **Alternatives considered**: Changing the backend's scale to match the frontend's 1–4/categorical
  scheme — a reasonable alternative but out of this phase's scope to decide; noted for Task 15 to resolve
  based on which side is more costly to change once both are integrated.

## Outcome

All Technical Context fields in `plan.md` are resolved with no remaining `NEEDS CLARIFICATION` markers —
this phase adapts an existing, working prototype rather than designing a frontend from a blank slate.
