# Implementation Plan: Task 13 — Frontend Assessment

**Branch**: `014-task-13-frontend-assessment` | **Date**: 2026-09-11 | **Spec**: [spec.md](./spec.md)
**Updated**: 2026-09-11 — revised against the existing `sk/sk` `Assessment.tsx` prototype.

**Input**: Feature specification from `/specs/014-task-13-frontend-assessment/spec.md`

## Summary

Rewire the existing `Assessment.tsx` screen from its current "preload all questions, check correctness
client-side" mock behavior to real per-question adaptive fetching against Task 6's `start`/
`next-question`/`answer` endpoints, with correctness and the sidebar's Verification Ledger sourced from
real backend responses, client-side history enabling `Previous` navigation, and a clean transition into
Task 14's results screens on completion (natural or early).

## Technical Context

**Language/Version**: TypeScript, React 18.3.

**Primary Dependencies**: Task 11's `apiClient` (extended with `startAssessment`, `getNextQuestion`,
`submitAnswer`), `AppContext` (extended: replace its preloaded `assessmentQuestions` array with an
incrementally-built one, and its client-side `correctOptionId` check with the backend's answer response).

**Storage**: N/A — session id and answered-question history held in route/context state (per Task 11's
`/candidate/:id/assessment/:sessionId` convention, or the prototype's `/assessment` route extended to
carry a session id), so a refresh can re-fetch current state.

**Testing**: Manual verification against `quickstart.md`, including a forced Mistral-fallback run
(reusing Task 6's own fallback test setup) to confirm FR-011 (no visible difference to the candidate), and
a check confirming no correct-answer value is ever present in network responses before submission
(FR-004/SC-002).

**Target Platform**: Browser, demo machine.

**Project Type**: Frontend web app (`frontend/src/pages/Assessment.tsx`).

**Performance Goals**: Question transitions feel responsive — a visible loading state appears within
100ms of submit or "Next Question," per Task 11's loading-state convention.

**Constraints**: Submit/advance is gated on a selection for the current question (FR-003); correctness
and ledger state come only from real backend responses (FR-004/FR-005); question source (mistral/seed)
never surfaced in the UI (FR-011); previously-answered questions are read-only on revisit (FR-006).

**Scale/Scope**: One screen, ~8–12 question render cycles per session, plus a client-side history cache
of the same size.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` is unfilled boilerplate; `CLAUDE.md` is the binding rulebook gate.

| Rule | Gate | Status |
|------|------|--------|
| Rule 11 — Frontend sequencing | Built only after Task 6's endpoints are already API-verified | PASS |
| Rule 12 — Demo reliability | Error state is retryable, never a frozen/blank screen (FR-009) | PASS |
| Rule 6 — Backend owns scoring | Correctness sourced only from backend response, never client-known pre-submission (FR-004) | PASS |
| Rule 10 — Preserve working code | Existing screen layout/styling/sidebar structure kept; data flow corrected | PASS |

No violations — Complexity Tracking table is not needed.

## Project Structure

### Documentation (this feature)

```text
specs/014-task-13-frontend-assessment/
├── plan.md              # This file
├── quickstart.md         # Phase 1 output — scripted assessment run, including a refresh mid-flow
└── checklists/
    └── requirements.md
```

`research.md`, `data-model.md`, and `contracts/` are omitted: no new technology decision, entity, or API
contract is introduced — this phase implements real data wiring against Task 6's already-frozen contract,
correcting the prototype's mock-data shortcuts along the way.

### Source Code (repository root)

```text
frontend/
└── src/
    ├── pages/
    │   └── Assessment.tsx    # rewired — per-question fetch, real correctness/ledger, history-based Previous
    ├── types/
    │   └── index.ts           # AssessmentQuestion type adjusted: no correct-answer field pre-submission
    └── context/
        └── AppContext.tsx      # assessmentQuestions becomes an incrementally-built history array
```

**Structure Decision**: Same single route component as before, consistent with Task 11's adopted
structure; the correctness/ledger data flow is corrected at the type and context level
(`AssessmentQuestion` no longer includes `correctOptionId` before an answer is submitted;
`AppContext`'s `assessmentAnswers`/evidence state is populated from the backend's `answer` response) so
the fix is centralized rather than scattered across the component.

## Complexity Tracking

*No Constitution Check violations — table intentionally left empty.*
