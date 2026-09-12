# Feature Specification: Phase 2 — LLM + MCP Layer

**Feature Branch**: `022-phase-2-llm-mcp-layer`

**Created**: 2026-09-12

**Status**: Draft

**Input**: User description: "Plan and specify Phase 2 (LLM + MCP Layer) from
`INGENIUM_MASTER_FUNCTIONALITY_AND_MCP_IMPLEMENTATION.md`, as its own separate spec."

**Authority note**: `INGENIUM_MASTER_FUNCTIONALITY_AND_MCP_IMPLEMENTATION.md` (repo root),
Phase 2, is the authoritative source for this spec's requirements and acceptance criteria,
including the architecture decision that this controlled access layer ("MCP") is now a required
core layer, not optional — that decision is not re-opened here. This is one of eight sibling specs
(`020` through `027`) each covering one phase of that document; see `019-mcp-faiss-implementation`
for the umbrella spec covering all phases together. This is the first phase in the sequence that is
genuinely new work (no such layer exists yet). Depends on Phase 0 and Phase 1.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The LLM only ever sees what a specific operation actually needs (Priority: P1)

Whoever operates or audits the system needs confidence that every time the platform hands context
to the language model, that context is limited to a specific, typed, pre-approved shape — never
open-ended access to the candidate database, the full competency framework, or arbitrary internal
state — so the system's intelligence layer cannot be misused (accidentally or adversarially) to
leak or fabricate data outside its role.

**Why this priority**: This is the foundational safety property every later phase's use of the LLM
(question generation, learning-plan generation) depends on. Without it, "controlled" is just a
claim, not a verifiable property.

**Independent Test**: Can be fully tested by directly invoking each defined access capability with
both valid and invalid inputs (including ids that don't exist) and confirming the response is
always one of the capability's own declared, typed shapes or a typed error — never a raw exception,
never additional fields beyond what that capability defines.

**Acceptance Scenarios**:

1. **Given** a request for a specific candidate's profile, **When** it is fulfilled, **Then** the
   response contains only that candidate's own declared fields — never another candidate's data,
   never raw database structure.
2. **Given** a request referencing an id that doesn't exist (unknown candidate, role, or session),
   **When** it is made, **Then** the system returns a clear, typed "not found" response — never an
   empty-but-successful response that could be mistaken for a real (if empty) result, and never an
   unhandled exception.
3. **Given** any of the defined access capabilities, **When** its underlying implementation is
   inspected, **Then** it is confirmed to perform only read operations and never accept a raw
   query, file path, or command as input.

---

### User Story 2 - Every LLM response is validated before it's trusted (Priority: P2)

The system needs to guarantee that no output coming back from the language model reaches the
database, another user, or a decision the platform makes until it has been checked against the
exact shape that operation expects — so a malformed, incomplete, or unexpected response can never
corrupt state or crash the request.

**Why this priority**: This is the safety net for every LLM call this phase and all subsequent
phases make; without it, phases 3 and 6 (which call the LLM through this layer) inherit an
unvalidated-trust risk.

**Independent Test**: Can be fully tested by forcing the underlying LLM call to return malformed
output (or to fail outright) and confirming the system retries once, then falls back to a
predefined deterministic alternative, without ever surfacing a raw parsing error to the end user or
persisting invalid data.

**Acceptance Scenarios**:

1. **Given** the LLM returns output that doesn't match the expected schema, **When** this is
   detected, **Then** the system retries the call once before giving up.
2. **Given** both the original attempt and the retry fail validation, **When** this happens,
   **Then** the system falls back to a predefined, deterministic alternative rather than
   propagating the failure as a user-facing crash.
3. **Given** the LLM is entirely unreachable (network/timeout), **When** any operation depending on
   it is attempted, **Then** the same retry-then-fallback behavior applies, and the rest of the
   application continues functioning normally.

---

### User Story 3 - The controlled-access layer is never a single point of failure (Priority: P3)

The system needs to keep working even if the controlled-access layer itself malfunctions or is
temporarily unavailable — falling back to a direct, still-controlled application call — so a defect
isolated to this one new component can never take down the whole golden path.

**Why this priority**: This is a resilience property specific to introducing new infrastructure;
it must be proven before other phases are allowed to depend on this layer as their primary path.

**Independent Test**: Can be fully tested by deliberately disabling or breaking the controlled-
access layer while leaving the underlying application services intact, then confirming that
operations which would normally go through it still complete via a fallback path.

**Acceptance Scenarios**:

1. **Given** the controlled-access layer is unavailable, **When** an operation that would normally
   use it is requested, **Then** the system falls back to calling the same underlying data/service
   directly and still returns a correct result.
2. **Given** the fallback path was used, **When** the result is compared to what the controlled-
   access path would have returned for the same input, **Then** the two are equivalent in content.

---

### Edge Cases

- What happens when two different operations need overlapping but not identical context (e.g.,
  "previous questions in a session" vs. "full assessment context")? Each must be exposed as its own
  distinct, minimal capability rather than one operation being forced to fetch more than it needs.
- What happens if a capability is asked for data belonging to a session/candidate/role that exists
  but is in an unexpected state (e.g., a completed assessment session asked for "current question
  context")? The capability must still return a well-defined, typed result — not undefined
  behavior — even if that result signals "no further context available" rather than an error.
- What happens when the underlying LLM client's own retry (if any) and this layer's retry could
  compound (e.g., double-retrying on a slow but eventually-successful call)? Retry behavior MUST be
  owned in exactly one place so failures don't compound into excessive latency.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a controlled, typed access layer between application services
  and the language model, through which the model receives only the specific context a given
  operation needs — never open-ended access to application or database state.
- **FR-002**: The controlled access layer MUST expose distinct, individually-schema-validated
  capabilities at minimum for: candidate profile lookup, target role/requirements lookup, the
  competency framework, current assessment context, prior questions in a session, and skill
  evidence — each with defined input, output, and error behavior.
- **FR-003**: The controlled access layer MUST NOT expose arbitrary database query execution,
  filesystem access, or shell/command execution under any circumstance.
- **FR-004**: Every response the language model returns through this layer MUST be schema-validated
  before it is used or persisted; on validation failure the system MUST retry once, and if the
  retry also fails, MUST fall back to a predefined deterministic alternative rather than
  propagating the failure to the end user as a crash.
- **FR-005**: If the controlled access layer itself is unavailable, the system MUST fall back to a
  direct, controlled application-service call so no single component is a hard point of failure.
- **FR-006**: Every capability exposed by this layer MUST return a clear, typed "not found"/error
  result for an unknown id — never an unhandled exception and never a silently-empty success
  result that could be mistaken for valid data.
- **FR-007**: This layer MUST remain small and explainable — every capability's behavior must be
  describable in one sentence and auditable without tracing through unrelated application logic.

### Key Entities *(include if feature involves data)*

- **Controlled Context Request**: A typed, schema-validated request/response pair (e.g., "get
  candidate profile," "get assessment context") with a name, an input schema, an output schema,
  and defined error behavior. Never carries free-form/arbitrary application state.
- **Validation Failure Record**: The internal record of an LLM response that failed schema
  validation — which operation, which attempt (first or retry), and what fallback was used —
  needed to confirm FR-004's behavior during testing, not necessarily user-facing.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of the controlled-access layer's capabilities, when tested with an unknown id,
  return a typed error rather than an exception or an ambiguous empty success.
- **SC-002**: 100% of deliberately-malformed LLM responses, across every operation this layer
  mediates, result in either a successful retry or a graceful fallback — zero raw errors reach the
  end user.
- **SC-003**: With the controlled-access layer deliberately disabled, every operation that depends
  on it still completes successfully via its fallback path, with no observable difference in the
  final result's correctness.
- **SC-004**: A reviewer unfamiliar with the implementation can read the list of exposed
  capabilities and correctly describe what each one does and does not allow, using only their
  names and declared schemas.

## Assumptions

- "MCP" (Model Context Protocol) is the specific mechanism named in the master document for
  implementing this controlled-access layer; this spec describes the layer's required behavior in
  technology-neutral terms so its acceptance criteria hold regardless of the exact SDK/library used
  to build it.
- This layer is consumed only by this same backend's own application code in this phase — no
  external client is in scope; Phase 3 and Phase 6 are the first actual consumers.
- The set of capabilities listed in FR-002 is a minimum, not a ceiling — additional narrowly-scoped
  capabilities may be added later (e.g., for gap analysis or course recommendations, consumed in
  Phase 6) without contradicting this spec.
