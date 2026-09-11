# Feature Specification: Task 15 — Integration

**Feature Branch**: `016-task-15-integration`

**Created**: 2026-09-11

**Status**: Draft

**Input**: Task 15 from `total_buildplan.md` §24: "Connect frontend → FastAPI → PostgreSQL → Mistral →
scoring → gap engine → recommendations. Run the complete golden path."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Run the Entire Golden Path as One Continuous Flow (Priority: P1)

With every backend engine (Tasks 3–10) and every frontend screen (Tasks 11–14) individually built and
verified, a developer runs the complete golden path once, end-to-end, through the actual browser UI
talking to the actual running backend, database, and Mistral API — with no mocked data anywhere in the
chain — and fixes any integration seams that don't line up.

**Why this priority**: Individually-verified pieces do not guarantee they work together; this is the
first time the whole system is exercised as a single flow, and it must work before demo polish (Task 16)
or final testing (Task 17) begins.

**Independent Test**: Can be fully tested by starting from the Landing screen in a browser and completing
every golden-path step through to the learning path, with no step requiring a manual workaround, a
restart, or direct API calls to "get past" a broken transition.

**Acceptance Scenarios**:

1. **Given** a freshly started backend (connected to PostgreSQL, with `MISTRAL_API_KEY` set) and a
   freshly started frontend, **When** a developer completes the full golden path via "Try Demo
   Candidate," **Then** every step transitions correctly with real (non-mock) data at every stage,
   ending at a populated learning path.
2. **Given** the same setup, **When** a developer completes the full golden path via a real resume
   upload, **Then** the same result holds, with real Mistral extraction and real assessment questions.
3. **Given** any single backend engine misbehaves during this run (e.g. a field name mismatch between
   frontend expectation and actual API response), **When** discovered, **Then** it is fixed following the
   project's standing rule (search all consumers, update them, test, then commit) rather than patched
   around with a one-off workaround.
4. **Given** the full run completes successfully once, **When** it is repeated a second time end-to-end,
   **Then** it succeeds again with the same reliability (not a one-time fluke).

### Edge Cases

- What happens when an integration seam reveals a genuine contract mismatch (e.g. a field the frontend
  expects that the backend doesn't return)? → Fixed at the source (the contract, per whichever phase owns
  it) and re-verified via that phase's own `contracts/api.md`/`quickstart.md`, not patched only in the
  frontend.
- What happens when the full run works but is slow enough to be a poor demo experience? → Addressed within
  this phase's scope only if it blocks the golden path from completing acceptably; deeper optimization is
  out of scope here (see Assumptions).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support completing the entire golden path (Landing → Resume Upload/Demo →
  Initial Profile → Target Role → Requirements → Assessment → Verified Profile → Skill Gaps → Course
  Recommendations → Learning Path) through the browser UI alone, with the real backend, real database,
  and real Mistral API — no mocked responses anywhere in this run.
- **FR-002**: System MUST support the golden path via both entry points (real resume upload and "Try Demo
  Candidate") without either path requiring different frontend code paths beyond the entry screen itself.
- **FR-003**: System MUST have every integration mismatch discovered during this phase fixed at its
  source, with the fix re-verified against that originating phase's own contract/quickstart, not just
  patched at the point of failure.
- **FR-004**: System MUST NOT have any step in the golden path require a manual workaround, a server
  restart, or a direct database/API intervention to proceed during a normal run.
- **FR-005**: System MUST complete the golden path reliably on repeated runs, not only on a single
  successful attempt.

### Key Entities

*(None new — this phase integrates entities already defined in Tasks 1–10's specs.)*

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The golden path completes successfully end-to-end through the browser UI at least three
  times in a row, via both entry points, with zero manual intervention.
- **SC-002**: Zero mocked or hardcoded placeholder data remains anywhere in the completed flow — every
  screen shows data that actually came from the backend/database/Mistral for that specific run.
- **SC-003**: Every integration bug found during this phase is traced to a specific originating
  phase/contract and fixed there, verifiable by that phase's `contracts/api.md` still describing the
  actual behavior after the fix.

## Assumptions

- This phase is about correctness and connectivity of the whole chain, not performance tuning or visual
  polish — those are Task 16 (demo implementation/polish) and the deeper optimization backlog items in
  `total_mvp_context.md` §5.
- "Complete golden path" for this phase's verification purposes means the P0 golden path defined in the
  overall project spec (`total_mvp_context.md` §4); P1 features are not required to be integrated here.
