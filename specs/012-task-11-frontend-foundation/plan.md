# Implementation Plan: Task 11 — Frontend Foundation

**Branch**: `012-task-11-frontend-foundation` | **Date**: 2026-09-11 | **Spec**: [spec.md](./spec.md)
**Updated**: 2026-09-11 — revised against the existing `sk/sk` prototype.

**Input**: Feature specification from `/specs/012-task-11-frontend-foundation/spec.md`

## Summary

Adopt the existing `sk/sk` prototype (already routed, styled, and componentized against mock data) as
`frontend/`, and replace its mock data source with a shared, typed API client wrapping every endpoint
contract from Tasks 3–10, preserving every existing route, `AppContext` action, and design-system
primitive. This phase starts only now that every backend contract (`specs/004`–`specs/011`'s
`contracts/`) is verified, per Rule 11, and every later frontend phase (Tasks 12–14) builds directly on
top of it.

## Technical Context

**Language/Version**: TypeScript 5.7, React 18.3.1, Vite 6.1.

**Primary Dependencies** (from `sk/sk/package.json`, unchanged): `react-router-dom` 6.29, `tailwindcss`
3.4, `lucide-react` 0.475 (icons), `clsx` + `tailwind-merge` (class utilities). No new dependency
introduced in this phase; no state-management or HTTP-client library added — native `fetch` is sufficient.

**Storage**: N/A (frontend only); transient client-side state (candidate, target role, assessment
progress, results, learning path) held in the existing `AppContext`, not persisted to a browser database.

**Testing**: Manual verification against `quickstart.md`'s route-by-route checklist; no dedicated
automated frontend test framework, matching the prototype's current setup and the project's Rule 9
emphasis on `curl`-verified backend contracts.

**Target Platform**: Modern desktop browser, demo machine.

**Project Type**: Frontend web app — the existing `sk/sk` directory, relocated/renamed to `frontend/` per
`total_mvp_context.md` §3's frozen project layout (or symlinked/copied, whichever is less disruptive to
the working prototype — an implementation detail, not a scope decision).

**Performance Goals**: Route transitions feel instant (client-side routing, no full page reload); initial
load under a few seconds on the demo machine — already true of the prototype's Vite dev build.

**Constraints**: No screen may introduce its own bespoke fetch logic outside the shared API client
(FR-002/SC-002); every route handles missing prior-step state without crashing (FR-006); every existing
route, component, and `AppContext` action name is preserved (FR-001/FR-003/FR-008, Rule 10).

**Scale/Scope**: 14 routes already defined in the prototype (spec Key Entities' table), one API client
method per backend resource from Tasks 3–10.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` is unfilled boilerplate; `CLAUDE.md` is the binding rulebook gate.

| Rule | Gate | Status |
|------|------|--------|
| Rule 11 — Frontend sequencing | This phase's own spec gates it behind Tasks 1–10 being API-verified | PASS |
| Rule 10 — Preserve working code | Existing prototype's routes/components/context kept as-is; only data source changes | PASS |
| Rule 13 — Performance discipline | No unnecessary rerenders; shared client avoids duplicate fetch logic | PASS |

No violations — Complexity Tracking table is not needed.

## Project Structure

### Documentation (this feature)

```text
specs/012-task-11-frontend-foundation/
├── plan.md              # This file
├── research.md           # Phase 0 output — routing/state-management approach, reused from the prototype
└── checklists/
    └── requirements.md
```

`data-model.md` and `contracts/` are omitted: this phase consumes the API contracts already documented in
Tasks 4–10's own `contracts/api.md` files rather than defining new ones. `quickstart.md` is folded into
`research.md`'s routing section since verification here is "does every existing route still render and
handle loading/error once wired to real data," a short checklist rather than a multi-step scenario.

### Source Code (repository root)

```text
frontend/                          # = sk/sk, adopted as the project's frontend
└── src/
    ├── main.tsx
    ├── App.tsx                    # existing router setup — 14 routes, unchanged
    ├── pages/                     # existing 14 page components — unchanged in this phase
    │   ├── Home.tsx
    │   ├── Candidate.tsx
    │   ├── ResumeUpload.tsx
    │   ├── InitialProfile.tsx
    │   ├── RoleSelection.tsx
    │   ├── RoleRequirements.tsx
    │   ├── Assessment.tsx
    │   ├── AssessmentResults.tsx
    │   ├── CapabilityProfile.tsx
    │   ├── SkillGaps.tsx
    │   ├── Courses.tsx
    │   ├── CourseDetail.tsx
    │   ├── LearningPath.tsx
    │   └── Dashboard.tsx
    ├── components/                 # existing layout/ui/competency/courses/learning primitives — unchanged
    ├── context/
    │   └── AppContext.tsx           # existing state/actions — internals rewired to call apiClient, not mock data
    ├── services/
    │   └── api.ts                   # existing WorkforceIntelligenceAPI — method bodies rewired to real fetch calls
    └── types/
        └── index.ts                  # existing types — reused as the frontend's contract vocabulary
```

**Structure Decision**: Rather than scaffolding a new `frontend/` tree from scratch, this phase adopts
`sk/sk` in place — every file above already exists and already works against mock data; this phase's only
code change is inside `services/api.ts` (swap `delay()` + mock-constant returns for real `fetch` calls)
and `context/AppContext.tsx` (load real data via `apiClient` instead of importing `mock/demoData.ts`
directly). `mock/demoData.ts` itself is kept, not deleted, since it becomes the reference the seeded
`assessment_seed.json`/`demo_candidate.json` (Tasks 1/16) are authored to resemble.

## Complexity Tracking

*No Constitution Check violations — table intentionally left empty.*
