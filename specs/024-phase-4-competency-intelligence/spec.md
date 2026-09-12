# Feature Specification: Phase 4 — Competency Intelligence

**Feature Branch**: `024-phase-4-competency-intelligence`

**Created**: 2026-09-12

**Status**: Draft

**Input**: User description: "Plan and specify Phase 4 (Competency Intelligence) from
`INGENIUM_MASTER_FUNCTIONALITY_AND_MCP_IMPLEMENTATION.md`, as its own separate spec."

**Authority note**: `INGENIUM_MASTER_FUNCTIONALITY_AND_MCP_IMPLEMENTATION.md` (repo root),
Phase 4, is the authoritative source for this spec's requirements and acceptance criteria. This is
one of eight sibling specs (`020` through `027`) each covering one phase of that document; see
`019-mcp-faiss-implementation` for the umbrella spec covering all phases together. The gap-analysis
engine already exists; this phase confirms/completes it, in particular the demand-signal question
the master document raises explicitly.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - An explainable, prioritized gap analysis (Priority: P1)

Once a candidate finishes the assessment, they (and whoever reviews their profile) need to see
exactly which competencies fall short of their target role's requirements, by how much, and in
what priority order — with the reasoning visible, not a black-box number.

**Why this priority**: The gap analysis is the pivot between "assessment result" and
"recommendation" — course and learning-path phases consume its output directly, so its correctness
and explainability must be locked in before anything is built on top of it.

**Independent Test**: Can be fully tested by running a completed assessment through gap analysis
and confirming every reported gap shows its current level, required level, the numeric gap, and a
priority ranking that is reproducible from the same inputs.

**Acceptance Scenarios**:

1. **Given** a candidate's verified competency levels and a target role's required levels,
   **When** gap analysis runs, **Then** every competency where the candidate falls short of the
   requirement appears with a computed gap and a priority rank, and no competency the candidate
   already meets or exceeds appears as a gap.
2. **Given** the same verified profile and target role are analyzed twice, **When** the gap
   computation runs each time, **Then** it returns the same gaps and ranking both times
   (deterministic, not randomized or language-model-dependent).
3. **Given** a competency the candidate was never assessed on and has no resume evidence for,
   **When** gap analysis runs, **Then** it still appears as a gap (treated as zero current level)
   rather than being silently skipped.

---

### User Story 2 - Priority ranking uses only real, currently-available signals (Priority: P2)

Whoever reviews a gap ranking needs confidence that its priority score is built only from signals
the system actually has — gap size and the target role's own declared importance for that
competency — and never from a data source the project has already retired, so the ranking's basis
can always be honestly explained if questioned.

**Why this priority**: This closes a specific, explicitly-flagged risk in the master document (a
retired third-party demand dataset must not silently reappear); getting this wrong would
reintroduce a dependency the project deliberately dropped.

**Independent Test**: Can be fully tested by tracing a priority score's computation and confirming
every input it uses is either the computed gap magnitude or the role's own curated
priority/importance value — nothing sourced from outside the platform's own curated data.

**Acceptance Scenarios**:

1. **Given** a priority score is computed for a gap, **When** its inputs are traced, **Then** they
   consist only of the gap magnitude and the role's declared importance/priority for that
   competency (and, if a legitimate current demand signal exists, that signal) — never a
   reintroduced third-party jobs-market dataset.
2. **Given** two competencies with the same gap magnitude but different role-declared importance,
   **When** they are ranked, **Then** the one with higher role importance ranks ahead, all else
   equal.

---

### Edge Cases

- What happens when a candidate's verified level exactly equals the required level? That
  competency must not appear as a gap (a gap of zero is not reported as a shortfall).
- What happens when two gaps compute to the exact same priority score? The ranking must break the
  tie deterministically (e.g., by a stable secondary key) rather than by an arbitrary or unstable
  order that could differ between runs.
- What happens when a competency has "children" (more specific sub-competencies depending on it)?
  If the ranking formula accounts for prerequisite importance, that weighting must be applied
  consistently and explainably, not as an opaque bonus.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST compute, for each of a target role's required competencies, a gap as
  the shortfall between the required level and the candidate's verified level, omitting or zeroing
  out any competency the candidate already meets or exceeds.
- **FR-002**: The system MUST rank gaps using a documented, reproducible combination of gap
  magnitude and role-declared importance/priority (and, only if a legitimate current signal exists,
  demand) — and MUST NOT reintroduce the previously retired third-party jobs-demand dataset as that
  signal.
- **FR-003**: Every reported gap MUST be explainable: current level, required level, computed gap,
  and priority rank/reasoning MUST all be visible together, not just a final score.
- **FR-004**: A competency with no verified score and no resume evidence MUST still be evaluated
  for gap purposes (treated as a zero current level), not silently omitted from the analysis.
- **FR-005**: Repeated gap-ranking computations on identical input data MUST produce identical
  output, including tie-breaking order.

### Key Entities *(include if feature involves data)*

- **Skill Gap**: One competency's shortfall against a target role's requirement — required level,
  verified level, numeric gap, and priority rank, tied to a specific analysis run.
- **Analysis**: The record tying a candidate, a target role, and a specific completed (or
  in-progress) assessment session together as the basis for one gap computation.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of reported gaps display all four explanatory fields (current, required, gap,
  priority) together — zero instances of a bare, unexplained number.
- **SC-002**: Repeating the same gap analysis on identical input data produces byte-identical
  output across at least 3 repeated runs.
- **SC-003**: A review of the priority-ranking implementation confirms zero references to any
  retired third-party dataset as an input signal.
- **SC-004**: 100% of competencies a candidate was never assessed on (and has no resume evidence
  for) still appear correctly in the gap analysis when they are part of the target role's
  requirements.

## Assumptions

- The gap-ranking formula (gap magnitude weighted most heavily, then role-declared priority, then
  a smaller prerequisite-importance factor) already exists and is confirmed correct by this
  session's live audit; this phase's work is confirming it still holds under the master document's
  explicit demand-signal constraint, not redesigning it.
- No new, legitimate demand-signal data source is introduced by this phase. If one becomes
  available in the future, this spec's FR-002 already accommodates it ("only if a legitimate
  current signal exists") without requiring a rewrite.
- "Role-declared importance/priority" refers to a value curated as part of each role's competency
  requirements, not derived at runtime from any external dataset.
