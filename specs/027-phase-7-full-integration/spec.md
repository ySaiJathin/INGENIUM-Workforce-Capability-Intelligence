# Feature Specification: Phase 7 — Full Integration

**Feature Branch**: `027-phase-7-full-integration`

**Created**: 2026-09-12

**Status**: Draft

**Input**: User description: "Plan and specify Phase 7 (Full Integration) from
`INGENIUM_MASTER_FUNCTIONALITY_AND_MCP_IMPLEMENTATION.md`, as its own separate spec."

**Authority note**: `INGENIUM_MASTER_FUNCTIONALITY_AND_MCP_IMPLEMENTATION.md` (repo root),
Phase 7, is the authoritative source for this spec's requirements and acceptance criteria. This is
the last of eight sibling specs (`020` through `027`) each covering one phase of that document; see
`019-mcp-faiss-implementation` for the umbrella spec covering all phases together. Depends on every
prior phase (0-6) being complete — this phase is a whole-system confidence pass, not new
capability.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The whole golden path survives a clean start, both entry points (Priority: P1)

Someone walking through the complete product for the first time — real resume upload or "Try Demo
Candidate" — needs every step, from a freshly started environment, to work without any manual
database or terminal intervention, so the product can actually be demonstrated or handed to a new
user with confidence.

**Why this priority**: This is the final proof that every individual phase's work actually
composes into one working product — the entire reason this phase exists.

**Independent Test**: Can be fully tested by starting the full stack from a clean state and
completing the entire golden path twice — once via real resume upload, once via "Try Demo
Candidate" — confirming both reach the same kind of end state (a personalized learning plan) with
no manual intervention.

**Acceptance Scenarios**:

1. **Given** a freshly started environment with no prior state, **When** a user completes the
   entire golden path via "Try Demo Candidate", **Then** every screen shows real computed data with
   no manual database or terminal intervention required.
2. **Given** the same clean start, **When** a user completes the entire golden path via a real
   resume upload, **Then** the outcome is consistent with the demo-candidate path's downstream
   behavior (same pipeline, same screens, same kinds of results).
3. **Given** both paths have been completed once each, **When** either is repeated again from a
   fresh session, **Then** it succeeds again with no leftover state from the previous run causing a
   conflict or failure.

---

### User Story 2 - Every documented failure condition degrades gracefully (Priority: P2)

Whoever is responsible for the product's reliability needs confidence that every known way the
system can fail — an unavailable language model, a bad upload, an unreachable database, an unknown
identifier, an expired session — produces a clear, human-readable message rather than a crash or a
blank screen, anywhere in the product.

**Why this priority**: A single ungraceful failure during a live demonstration is the single
biggest credibility risk to the whole project; this closes that risk systematically rather than
hoping it doesn't come up.

**Independent Test**: Can be fully tested by deliberately triggering each documented failure
condition one at a time against a running instance and confirming a clear, specific, human-readable
message appears and the rest of the application remains usable afterward.

**Acceptance Scenarios**:

1. **Given** the language model is made unavailable (e.g., network blocked or invalid credentials),
   **When** any operation depending on it is attempted, **Then** the affected step degrades to its
   documented fallback and the user sees a clear indication rather than a silent failure or crash.
2. **Given** an invalid, empty, or corrupt resume is uploaded, **When** this is processed, **Then**
   a clear, specific error is shown, with a path to "Try Demo Candidate" as an alternative.
3. **Given** a request references an unknown or expired identifier (role, candidate, assessment
   session, analysis, learning path), **When** it is made, **Then** a clear "not found" or
   "expired" message is shown rather than a generic error or a blank screen.
4. **Given** the database becomes temporarily unreachable, **When** any request needing it is made,
   **Then** the user sees a clear, temporary-failure message rather than a hang or an unhandled
   exception.
5. **Given** the evidence-retrieval layer (Phase 6) is unavailable, **When** a learning plan is
   requested, **Then** the user still receives a usable (deterministic-fallback) plan rather than an
   error.

---

### Edge Cases

- What happens when two of the documented failure conditions occur at once (e.g., the language
  model is unavailable and the uploaded resume is also invalid)? Each must still be reported
  clearly — the system must not conflate two distinct problems into one ambiguous message.
- What happens when a failure condition is triggered partway through a multi-step flow (e.g., the
  database becomes unreachable between starting an assessment and requesting its first question)?
  The user must be able to see a clear error at the point of failure, and the flow must not appear
  to silently continue in a broken state.
- What happens after a failure condition is resolved (e.g., the database becomes reachable again)?
  The user must be able to retry and successfully continue, without needing a full application
  restart.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The complete golden path (resume upload or demo candidate → initial profile → target
  role → role requirements → adaptive assessment → verified profile → gaps → courses → evidence →
  learning path) MUST be completable from a freshly started environment with no manual database or
  terminal intervention required by an end user.
- **FR-002**: Both entry points (real resume upload and "Try Demo Candidate") MUST converge on and
  complete the identical downstream pipeline.
- **FR-003**: Each of the following conditions, when deliberately triggered, MUST produce a clear,
  human-readable error or graceful degradation rather than a crash or blank screen: invalid resume,
  empty resume, corrupt resume, language model unavailable, malformed language-model output,
  unknown/missing role or candidate id, expired or already-completed assessment session,
  unavailable course data, and unavailable evidence retrieval.
- **FR-004**: Repeating either entry point from a fresh session MUST succeed again with no
  conflict from a previous run's leftover state.
- **FR-005**: A failure occurring partway through a multi-step flow MUST surface a clear error at
  the point of failure, never allow the flow to silently continue as if it had succeeded.
- **FR-006**: Once a triggered failure condition is resolved (e.g., a temporarily unreachable
  dependency recovers), the user MUST be able to retry and successfully continue without a full
  application restart.

### Key Entities *(include if feature involves data)*

- **Failure Condition Test Matrix**: The documented list of conditions this phase must verify
  (from FR-003), each with its expected user-visible outcome — the primary tracked artifact this
  phase produces/updates.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A person can walk through the entire golden path (resume upload or demo candidate
  through personalized learning path) from a freshly started environment, with no manual database
  or terminal step, in under 3 minutes of hands-on interaction, via either entry point.
- **SC-002**: 100% of the documented failure conditions produce a visible, human-readable message
  rather than a crash or blank screen, when deliberately triggered, one at a time.
- **SC-003**: Both entry points can be repeated back-to-back from fresh sessions at least twice
  each without failure or state conflict.
- **SC-004**: 100% of deliberately-triggered mid-flow failures show a clear error at the point of
  failure rather than a silent continuation or a generic downstream error.

## Assumptions

- This phase assumes Phases 0 through 6 are individually complete and their own acceptance
  criteria already pass — this phase does not re-derive their correctness, only confirms they
  compose into one working whole and that failure handling is consistent across all of them.
- The specific list of failure conditions in FR-003 is treated as the minimum required set; if
  additional failure modes are discovered during this phase's testing, they are added to the test
  matrix and verified the same way, not treated as out of scope.
- "No manual database or terminal intervention" refers to the end-user experience of the running
  application — developer-side setup (starting the database container, running the backend/frontend
  processes) is a prerequisite environment state, not a golden-path step itself.
