# Feature Specification: Task 17 — Final Testing

**Feature Branch**: `018-task-17-final-testing`

**Created**: 2026-09-11

**Status**: Draft

**Input**: Task 17 from `total_buildplan.md` §24: "Happy path, invalid resume, Mistral failure, empty
answer, duplicate question, database failure, API error, demo fallback, frontend refresh. Fix critical
bugs only."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Confirm the Product Survives Every Plausible Demo-Day Failure (Priority: P1)

With the golden path integrated (Task 15) and the demo polished (Task 16), a developer runs a final,
focused pass through the specific failure scenarios most likely to occur during a live judged
presentation, fixing only critical bugs, and stops once the product survives all of them without
crashing.

**Why this priority**: This is the last checkpoint before the demo itself; an unfixed critical bug found
here is the last chance to catch it before it happens in front of judges.

**Independent Test**: Can be fully tested by deliberately triggering each named scenario (invalid resume,
Mistral failure, empty answer, duplicate question, database failure, API error, demo fallback, frontend
refresh) one at a time against the running system and confirming none of them crash the application or
leave it in a broken state.

**Acceptance Scenarios**:

1. **Given** the fully integrated system, **When** the happy path (golden path, either entry point) is
   run, **Then** it completes successfully with no errors.
2. **Given** an invalid resume (corrupted file, wrong type, oversized), **When** uploaded, **Then** the
   system shows a clear error and offers "Try Demo Candidate," per Task 4/12's already-built behavior.
3. **Given** Mistral is unavailable, **When** resume extraction or question generation is attempted,
   **Then** the system degrades gracefully (clear error / seed fallback respectively) per Tasks 4/6's
   already-built behavior.
4. **Given** an assessment question with no answer selected, **When** a submit is attempted anyway (e.g.
   via a direct API call bypassing the frontend's disabled-button guard), **Then** the backend rejects it
   with a clear validation error rather than crashing or recording invalid evidence.
5. **Given** a question already answered, **When** the same question id is submitted again, **Then** the
   system rejects the duplicate per Task 6's already-built behavior (FR-009), confirmed here as still
   holding after integration/demo-polish changes.
6. **Given** the database becomes temporarily unreachable, **When** any request is made, **Then** the
   system returns a useful error rather than crashing the backend process or corrupting state.
7. **Given** any endpoint receives a malformed or unexpected request, **When** processed, **Then** it
   returns a clear API error (4xx) rather than an unhandled exception.
8. **Given** any failure occurs, **When** the candidate switches to "Try Demo Candidate," **Then** the
   demo path works reliably regardless of what failed in the real-data path.
9. **Given** any golden-path screen, **When** the browser is refreshed, **Then** the app recovers to a
   sensible state (per Task 11/13's resume-on-refresh behavior) rather than losing all context or
   crashing.

### Edge Cases

- What happens when a non-critical bug (e.g. a minor visual glitch) is found during this pass? → It is
  logged but not fixed in this phase, per "fix critical bugs only" — protecting the deadline over
  cosmetic completeness (Rule 1/11).
- What happens when a fix for one scenario risks destabilizing an already-working scenario? → The fix is
  evaluated against Rule 10 (understand dependencies, search consumers, test) before being applied, and a
  regression check of the other eight scenarios follows any fix touching shared code.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST be verified against all nine named scenarios (happy path, invalid resume,
  Mistral failure, empty answer, duplicate question, database failure, API error, demo fallback, frontend
  refresh) in one final pass.
- **FR-002**: System MUST NOT crash the backend process or leave the frontend in a blank/frozen state for
  any of the nine scenarios.
- **FR-003**: Only critical bugs (those that would break or visibly embarrass the live demo) discovered
  during this pass MUST be fixed; non-critical/cosmetic issues MUST be logged, not fixed, within this
  phase's time budget.
- **FR-004**: Any fix applied during this phase MUST be re-verified against the golden path (happy path
  scenario) to confirm it did not introduce a regression.
- **FR-005**: System MUST end this phase in a state where the demo script from Task 16 can still be run
  successfully.

### Key Entities

*(None new — this phase verifies behavior already defined across Tasks 1–16's specs.)*

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All nine named scenarios are individually tested with a pass/fail result recorded for each.
- **SC-002**: Zero scenarios result in a backend crash or an unrecoverable frontend state.
- **SC-003**: Every critical bug found is fixed and re-verified; the count of remaining known non-critical
  issues is explicitly documented rather than silently left unmentioned.
- **SC-004**: The full demo script (Task 16) still completes successfully after this phase's fixes are
  applied.

## Assumptions

- "Critical bug" means one that would cause a visible crash, data corruption, or a broken golden-path
  step during the live demo; a bug that only affects an out-of-scope P1/P2 feature (per
  `total_mvp_context.md` §4) or a purely cosmetic issue is explicitly not critical for this phase's
  purposes.
- This is the last planned phase before presenting to judges — per `total_buildplan.md` §23, once the
  Definition of Done items all work, the team stops building features and moves through testing → bug
  fixing → UI polish → demo rehearsal, which is exactly this phase's scope.
