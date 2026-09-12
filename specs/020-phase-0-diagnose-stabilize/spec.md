# Feature Specification: Phase 0 — Diagnose + Stabilize Existing System

**Feature Branch**: `020-phase-0-diagnose-stabilize`

**Created**: 2026-09-12

**Status**: Draft

**Input**: User description: "Plan and specify Phase 0 (Diagnose + Stabilize) from
`INGENIUM_MASTER_FUNCTIONALITY_AND_MCP_IMPLEMENTATION.md`, as its own separate spec."

**Authority note**: `INGENIUM_MASTER_FUNCTIONALITY_AND_MCP_IMPLEMENTATION.md` (repo root),
Phase 0, is the authoritative source for this spec's requirements and acceptance criteria. This is
one of eight sibling specs (`020` through `027`) each covering one phase of that document; see
`019-mcp-faiss-implementation` for the umbrella spec covering all phases together.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - An honest, live-verified diagnosis before any new work starts (Priority: P1)

Whoever operates the system next (developer or automated session) needs an accurate picture of
what already works, what's broken, and what's missing in the running system — confirmed by
actually exercising it, not by trusting what planning documents claim — before any new capability
(MCP, FAISS) is built on top of it.

**Why this priority**: Every later phase assumes this foundation is sound. Building on an
unverified or silently-broken foundation produces a system that looks complete in code review but
fails unpredictably in a live demo.

**Independent Test**: Can be fully tested by starting the environment from a clean state and
running the golden path (resume upload or demo candidate → target role → assessment → verified
profile → gaps → courses → learning path) end-to-end, confirming every step returns a real,
non-mocked, correct result, and producing a written diagnosis (done/broken/missing/partial) that
matches what was actually observed.

**Acceptance Scenarios**:

1. **Given** a freshly started environment (database + backend), **When** the health endpoint is
   requested, **Then** it reports the API and database as reachable within a bounded time — never
   an indefinite hang if the database is unreachable.
2. **Given** the backend is already running from some prior state, **When** its actual behavior is
   compared against the current source code, **Then** any mismatch (e.g., a deployed build that
   predates a source change) is caught and called out explicitly, not assumed away.
3. **Given** the diagnosis is complete, **When** it is compared against prior planning-document
   claims about "what's built", **Then** every discrepancy is stated plainly rather than silently
   inherited into further planning.

---

### User Story 2 - Uploads and errors behave safely by construction (Priority: P2)

A candidate (or the developer testing on their behalf) needs the resume-upload entry point to
reject bad input safely and describe real failures clearly, so a malformed or oversized file can
never crash the backend or reach any downstream processing step.

**Why this priority**: This is the very first thing an end user touches; an ungraceful failure
here is the worst possible first impression and the most likely accidental demo-killer.

**Independent Test**: Can be fully tested by submitting a range of invalid inputs (wrong file
type, oversized file, corrupt file, empty file) directly to the upload entry point and confirming
each is rejected with a clear, specific error and no server-side crash.

**Acceptance Scenarios**:

1. **Given** a file of an unsupported type, **When** it is uploaded, **Then** the system rejects it
   before attempting any extraction, with a message naming the problem.
2. **Given** a file exceeding the configured size limit, **When** it is uploaded, **Then** the
   system rejects it before attempting any extraction.
3. **Given** a file that passes type/size checks but is corrupt or unreadable, **When** it is
   processed, **Then** the system returns a clear, actionable error (pointing to the "Try Demo
   Candidate" alternative) rather than a raw exception or a silent low-quality fallback dressed up
   as success.

---

### Edge Cases

- What happens when the database is temporarily unreachable at startup? The health check and any
  request needing the database must fail fast with a clear error, never hang indefinitely.
- What happens when a backend instance already running (e.g., in a container) was built from code
  that no longer matches the repository? This must be detected before it's relied on for further
  testing — a stale deployment silently answering requests with outdated logic is itself a Phase 0
  defect to catch and resolve.
- What happens when a resume-processing dependency (the LLM extraction call) fails outright? The
  upload path must degrade to a clear error rather than a lower-quality but silently-labeled-as-
  successful result.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a way to verify, from a freshly started environment, that the
  API and its database dependency are reachable, failing fast with a clear error rather than
  hanging indefinitely if the database is unreachable.
- **FR-002**: The system MUST validate uploaded resume file type and size before attempting any
  extraction, rejecting unsupported or oversized files with a clear, actionable error.
- **FR-003**: The system MUST return a clear, actionable error (never a raw exception, never a
  silent crash) when resume text extraction fails for any reason (corrupt file, unreadable
  content, unsupported encoding).
- **FR-004**: The system MUST NOT present a degraded/fallback result as if it were a full-quality
  success — any fallback path taken during processing must be distinguishable from the primary
  path when the two would otherwise look identical to whoever reviews the outcome.
- **FR-005**: Whoever verifies the system MUST confirm behavior directly against the actually
  running code (not against documentation or assumption) before relying on any component in later
  phases, and any deployed instance found to differ from current source MUST be corrected or
  replaced before being used for further verification.
- **FR-006**: The diagnosis produced by this phase MUST explicitly classify every major subsystem
  as one of: confirmed working, broken (with cause), missing, or partially implemented, and MUST
  call out any place where this contradicts an existing planning document's claim.

### Key Entities *(include if feature involves data)*

- **Diagnosis Record**: Captures, per major subsystem (resume processing, target-role selection,
  adaptive assessment, scoring, gap analysis, course recommendation, learning path, frontend),
  whether it is confirmed working, broken (with cause), missing, or partially implemented — the
  primary deliverable of this phase, kept current as later phases change system state.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: From a freshly started environment, the health check and one full golden-path run
  (via "Try Demo Candidate") complete successfully with zero manual database or terminal
  intervention, in under 1 minute of hands-on interaction.
- **SC-002**: 100% of the deliberately-tested invalid-upload cases (wrong type, oversized, corrupt)
  return a clear, human-readable error rather than a crash or an unhelpful generic message.
- **SC-003**: The written diagnosis is confirmed accurate by direct observation for 100% of the
  subsystems it covers, with zero remaining "looks right but untested" claims.
- **SC-004**: Any discrepancy between a currently-running deployed instance and the checked-in
  source code is identified and resolved (or explicitly documented as a known, accepted gap)
  before this phase is considered complete.

## Assumptions

- This phase inherits the substantial, already-built implementation confirmed by this session's
  own live audit (the golden path already works end-to-end against real data) — this is a
  verification/stabilization pass, not a from-scratch build.
- Where the LLM dependency (used in resume extraction) is temporarily unavailable (e.g., API rate
  limiting) during this phase's own testing, that is treated as an external condition to work
  around (verify the fallback path instead), not a Phase 0 defect in itself — provided the fallback
  behavior itself meets FR-003/FR-004.
- Any discrepancy found between a running deployment and current source (e.g., a stale container)
  is resolved by favoring the current, checked-in source as ground truth, per the master document's
  "the repository is the source of truth for current implementation" instruction.
