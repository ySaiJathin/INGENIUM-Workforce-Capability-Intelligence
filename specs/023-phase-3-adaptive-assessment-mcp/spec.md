# Feature Specification: Phase 3 — Adaptive Assessment (MCP-Wired)

**Feature Branch**: `023-phase-3-adaptive-assessment-mcp`

**Created**: 2026-09-12

**Status**: Draft

**Input**: User description: "Plan and specify Phase 3 (Adaptive Assessment) from
`INGENIUM_MASTER_FUNCTIONALITY_AND_MCP_IMPLEMENTATION.md`, as its own separate spec."

**Authority note**: `INGENIUM_MASTER_FUNCTIONALITY_AND_MCP_IMPLEMENTATION.md` (repo root),
Phase 3, is the authoritative source for this spec's requirements and acceptance criteria. This is
one of eight sibling specs (`020` through `027`) each covering one phase of that document; see
`019-mcp-faiss-implementation` for the umbrella spec covering all phases together. Depends on
Phase 2's controlled access layer existing; the adaptive assessment engine itself already exists
and is being wired to use that layer, not built from scratch.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Every question is generated from controlled context only (Priority: P1)

A candidate taking the adaptive assessment needs each question to be generated using only the
specific candidate/role/competency/history context the backend controls and supplies through the
new controlled-access layer — never open-ended access to the whole system — so questions stay
relevant, non-repeating, and impossible to manipulate into revealing unrelated data.

**Why this priority**: This is the first phase where the controlled-access layer (Phase 2) is
actually exercised end-to-end in a user-facing flow; if this doesn't work, the pattern can't be
trusted for anything built on top of it later (course/evidence retrieval, learning-plan
generation).

**Independent Test**: Can be fully tested by starting an assessment session, requesting several
consecutive questions, and confirming each one targets an approved competency/role, never repeats
a prior question in the same session, and that the context request behind it returns only its
defined, schema-typed fields.

**Acceptance Scenarios**:

1. **Given** an in-progress assessment session, **When** the next question is requested, **Then**
   the returned question targets one of the role's required competencies and has not been asked
   before in this session.
2. **Given** the underlying language-model call fails or returns malformed output, **When** a
   question is requested, **Then** the system falls back to a seed question rather than surfacing
   an error to the candidate or crashing the session.
3. **Given** the context supplied for a question request is inspected, **When** compared to what
   the controlled-access layer's context capability declares it returns, **Then** it contains
   exactly those fields — no additional candidate, role, or database data leaks through.

---

### User Story 2 - Backend-controlled adaptive routing, never candidate- or LLM-decided (Priority: P2)

A candidate's progress through the assessment needs to be driven entirely by backend logic —
which competency to probe next, at what difficulty, and when to stop — using the language model
only to phrase the next question, never to decide routing or grade objectively-scorable answers.

**Why this priority**: This is the core trust property of the "adaptive" claim: the system must
demonstrably decide the path itself, not defer that decision to the language model or trust
client-supplied scoring.

**Independent Test**: Can be fully tested by answering a sequence of questions correctly and then
incorrectly and confirming the difficulty/competency selection changes in the expected direction
each time, and that grading a scorable answer never depends on a language-model call.

**Acceptance Scenarios**:

1. **Given** a candidate answers a question correctly, **When** the next question is selected,
   **Then** either the difficulty for that competency increases or the assessment moves to a new
   competency, per the backend's own routing logic.
2. **Given** a candidate answers a question incorrectly, **When** the next question is selected,
   **Then** the system either probes the same competency again or tests a prerequisite, per the
   backend's own routing logic — never simply continuing as if nothing happened.
3. **Given** an objectively-scorable answer is submitted, **When** it is graded, **Then** the
   correctness determination is made by comparing it to a backend-known correct answer, with zero
   language-model calls involved in that determination.

---

### User Story 3 - The assessment always reaches a clean stopping point (Priority: P3)

A candidate's assessment session needs to end cleanly — either because enough evidence has been
gathered to be confident in their competency levels, or because the question budget is used up, or
because no more questions are available — never hanging indefinitely or erroring out mid-session.

**Why this priority**: An assessment that can get stuck or crash partway through is worse than one
that ends a little early; this is the safety property for the whole interactive flow.

**Independent Test**: Can be fully tested by running a session to completion under three different
conditions (confidence threshold reached, question budget exhausted, and available question
content exhausted) and confirming each produces a clean "completed" state rather than an error or
hang.

**Acceptance Scenarios**:

1. **Given** every required competency reaches its confidence threshold, **When** the next question
   is requested, **Then** the session is marked completed and no further question is offered.
2. **Given** the question budget is used up before every competency is resolved, **When** the next
   question is requested, **Then** the session is marked completed rather than continuing past its
   budget.
3. **Given** no unused question content remains for the competencies still needing evidence,
   **When** the next question is requested, **Then** the session ends gracefully rather than
   erroring.

---

### Edge Cases

- What happens when the language model repeats a question it already asked in this session (a
  validation failure the schema alone wouldn't catch)? The system must detect the repeat itself and
  treat it as a failed generation attempt (triggering retry/fallback), not display it.
- What happens when a submitted answer references a question id that doesn't belong to the current
  session, or that has already been answered? The system must reject it with a clear error rather
  than recording a duplicate or cross-session answer.
- What happens when the resume-derived initial estimate for a competency is very high or very low
  compared to what the assessment actually reveals? The starting point may be informed by it, but
  the assessment's own evidence must be able to override it in either direction.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST determine each assessment's starting point using the candidate's
  resume-derived signals and the target role's requirements as priors, never as the final score.
- **FR-002**: The system MUST generate assessment questions one at a time, using only the
  controlled context supplied for that specific question request (via Phase 2's access layer), and
  MUST NOT present the same question twice within one session.
- **FR-003**: The system MUST grade objectively-scorable answers deterministically (never via the
  language model), and MUST route difficulty/competency selection based on backend-computed
  evidence (the correct/incorrect answer pattern), never on language-model judgment.
- **FR-004**: The system MUST stop an assessment session when either a defined confidence threshold
  is reached for all required competencies or the question budget is exhausted, whichever occurs
  first, and MUST also stop gracefully (not error) if available question content is exhausted
  first.
- **FR-005**: When question generation fails (language-model failure or a repeated/invalid
  question), the system MUST fall back to a predefined seed question for the same competency (or,
  if none remains, any unused seed question for the role) rather than surfacing an error to the
  candidate.
- **FR-006**: The system MUST reject an answer submission that references a question not belonging
  to the current session, or a question already answered, with a clear error.

### Key Entities *(include if feature involves data)*

- **Assessment Session**: Tracks a candidate's in-progress or completed assessment for a target
  role — status, question budget, and which competencies still need evidence.
- **Skill Evidence (per session, per competency)**: The accumulating record of questions answered,
  correct count, current difficulty, and confidence — the backend's own state driving routing
  decisions, never overwritten by a language-model opinion.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Across a full assessment session, zero questions repeat within that session.
- **SC-002**: 100% of objectively-scorable answers are graded with zero language-model calls
  involved in the correctness determination.
- **SC-003**: When the language model is deliberately made unavailable for an entire session, the
  session still reaches a clean completed state using only fallback questions, with zero crashes or
  hangs.
- **SC-004**: Every tested session reaches a clean stopping point (confidence reached, budget
  exhausted, or content exhausted) — zero sessions observed to hang or error mid-assessment.

## Assumptions

- The adaptive assessment engine's core routing logic (competency selection, difficulty
  adjustment, confidence accumulation) already exists and works correctly (confirmed by this
  session's live audit); this phase's work is wiring its language-model calls through Phase 2's
  controlled-access layer, not redesigning the routing logic itself.
- "One question at a time, never pre-generated in bulk" remains the operating model — this phase
  does not introduce batch question generation.
- The seed/fallback question bank's content sufficiency (how many questions exist per competency)
  is tracked as a data-completeness concern, not a functional defect of this phase's logic — this
  spec's FR-004/SC-004 accept "ends early due to content exhaustion" as a valid, graceful outcome,
  distinct from a functional failure.
