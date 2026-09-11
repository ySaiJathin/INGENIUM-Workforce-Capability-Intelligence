# Specification Quality Checklist: Task 16 — Demo Implementation

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-09-11
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Notes

- The demo candidate identity, script, and failure-recovery behaviors are named because they are already
  fully specified in `demo_plan.md` (the project's own judge-facing plan document), not implementation
  choices invented by this spec.
- All items pass on first validation pass.

## Implementation Status (2026-09-12)

Implemented per `tasks.md` T001-T009, T011. **This closes the demo-mode gap flagged by name in specs
013 and 016**: `AppContext.tsx`'s `loadDemoCandidate()` was 100% client-side mock data for the entire
project until now. It has been rewritten to call a new `POST /candidates/demo` endpoint
(`backend/src/api/candidates.py`, seeded from `data/curated/demo_candidate.json`) that creates a fresh
`candidates`/`candidate_skills` row (`source="demo"`) on every call, and the five `if (isDemoMode) {...}`
mock short-circuits in `selectTargetRole`/`startAssessmentSession`/`nextQuestion`/`completeAssessment`/
`generateLearningPath` have been removed — both entry points now run the identical real-backend code
path (FR-001), differing only in how the initial candidate record was created.

**Real, un-invented demo story found in existing curated data, then verified live**: seeded the demo
candidate with resume-derived SQL/Python/Statistics estimates, targeted it at `role-sso-01` (Senior
Statistical Officer, which already requires `sql_window_functions`), and ran it through a full live
assessment answering SQL and SQL-Window-Functions questions incorrectly and everything else correctly
(matching `demo_candidate.json`'s `rehearsal_answer_guidance`). The real engines produced: SQL as the
#1-ranked gap, SQL Window Functions as #2, and — entirely from real deterministic matching, not
scripted — **"Advanced SQL Analytics" as the recommended course for the Window Functions gap**,
reproducing `demo_plan.md` §10's "because it covers: Window Functions" script beat from genuinely
existing curated data (`sql-window-analytics-03`), with zero unmatched gaps. Test data cleaned up
after verification. Frontend typecheck and production build both pass clean.

**Two items not completed in this session, requiring a human with the real presentation setup**:
1. **T010 — the offline screenshot fallback set** (FR-006) requires viewing the running frontend in a
   browser to capture; no browser-automation tool is available in this environment (same limitation
   noted in specs 013/014/016). **A human must capture these four screenshots before the demo.**
2. **The timed, full-script rehearsal** (`demo_plan.md` §16's checklist in full — SC-001's "twice
   back-to-back," SC-004's "under 2:30 at full talking speed," the cold-reload/incognito test, the
   backup-device pre-load) requires a human running the actual presentation device/browser. This
   session's live API-level run (above) proves the underlying pipeline and data story are sound, but is
   not a substitute for a timed human rehearsal.
