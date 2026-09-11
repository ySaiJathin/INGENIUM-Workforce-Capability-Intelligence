# Implementation Plan: Task 12 — Frontend Candidate Flow

**Branch**: `013-task-12-frontend-candidate-flow` | **Date**: 2026-09-11 | **Spec**: [spec.md](./spec.md)
**Updated**: 2026-09-11 — revised against the existing `sk/sk` prototype's six candidate-intake screens.

**Input**: Feature specification from `/specs/013-task-12-frontend-candidate-flow/spec.md`

## Summary

Wire the six already-built candidate-intake screens (`Home.tsx`, `Candidate.tsx`, `ResumeUpload.tsx`,
`InitialProfile.tsx`, `RoleSelection.tsx`, `RoleRequirements.tsx`) to the real Task 4/5/16 backend
endpoints via `AppContext`'s existing actions, replacing their mock-data defaults with real API responses,
ready to hand off into Task 13's assessment screen.

## Technical Context

**Language/Version**: TypeScript, React 18.3.

**Primary Dependencies**: Task 11's adopted `services/api.ts` (`WorkforceIntelligenceAPI`) and
`context/AppContext.tsx` (`setResumeUploaded`, `selectTargetRole`, `loadDemoCandidate`,
`resetToBlankState`) — no new dependency introduced.

**Storage**: N/A — candidate/role data set into `AppContext` via its existing actions on successful
upload/demo selection/role selection.

**Testing**: Manual verification against `quickstart.md`'s scripted click-through, covering both entry
paths, the failure path, and the extracted-evidence/initial-profile/role-requirements displays.

**Target Platform**: Browser, demo machine.

**Project Type**: Frontend web app (`frontend/src/pages/Home.tsx`, `Candidate.tsx`, `ResumeUpload.tsx`,
`InitialProfile.tsx`, `RoleSelection.tsx`, `RoleRequirements.tsx`).

**Performance Goals**: Upload feedback (staged loading indicator) appears immediately on submit; role
list/requirements render without perceptible delay once fetched.

**Constraints**: Reuses Task 11's shared API client and `AppContext` actions exclusively (no ad-hoc fetch
logic); demo and real-upload paths must converge on the identical downstream screens (spec SC-002,
Rule 12); every competency shown pre-assessment carries a confidence/verification-status tag (SC-004).

**Scale/Scope**: 6 screens, matching Task 11's adopted route list for the candidate-intake portion of the
golden path.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` is unfilled boilerplate; `CLAUDE.md` is the binding rulebook gate.

| Rule | Gate | Status |
|------|------|--------|
| Rule 12 — Demo reliability | Both paths converge; upload failure always offers demo path (FR-010) | PASS |
| Rule 11 — Frontend sequencing | Built only after Tasks 4/5's endpoints are already API-verified | PASS |
| "Demo data must be clearly labeled" | FR-004 | PASS |
| Rule 10 — Preserve working code | Existing six screens' structure/props kept; only data source changes | PASS |

No violations — Complexity Tracking table is not needed.

## Project Structure

### Documentation (this feature)

```text
specs/013-task-12-frontend-candidate-flow/
├── plan.md              # This file
├── quickstart.md         # Phase 1 output — scripted click-through for both entry paths, all six screens
└── checklists/
    └── requirements.md
```

`research.md`, `data-model.md`, and `contracts/` are omitted: no new technology decision, entity, or API
contract is introduced — this phase only implements real data wiring against the already-frozen contracts
from Tasks 4/5/16 and the shell/context from Task 11.

### Source Code (repository root)

```text
frontend/
└── src/
    └── pages/
        ├── Home.tsx              # wired — both entry actions call real AppContext actions
        ├── Candidate.tsx          # wired — real candidate summary, status badges reflect real state
        ├── ResumeUpload.tsx       # wired — real upload call, real extracted-evidence table
        ├── InitialProfile.tsx     # wired — real initial profile table
        ├── RoleSelection.tsx      # wired — real role catalog from GET /roles
        └── RoleRequirements.tsx   # wired — real role detail + real initial-estimate comparison
```

**Structure Decision**: No new files — this phase is purely about replacing each screen's mock-data
source (via `AppContext`'s existing actions, which in turn now call the real `apiClient` per Task 11) with
real backend responses, keeping every component's structure, props, and styling exactly as already built
in `sk/sk` (Rule 10).

## Complexity Tracking

*No Constitution Check violations — table intentionally left empty.*
