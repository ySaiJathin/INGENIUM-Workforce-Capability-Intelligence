# Feature Specification: Phase 5 — Course Intelligence

**Feature Branch**: `025-phase-5-course-intelligence`

**Created**: 2026-09-12

**Status**: Draft

**Input**: User description: "Plan and specify Phase 5 (Course Intelligence) from
`INGENIUM_MASTER_FUNCTIONALITY_AND_MCP_IMPLEMENTATION.md`, as its own separate spec."

**Authority note**: `INGENIUM_MASTER_FUNCTIONALITY_AND_MCP_IMPLEMENTATION.md` (repo root),
Phase 5, is the authoritative source for this spec's requirements and acceptance criteria. This is
one of eight sibling specs (`020` through `027`) each covering one phase of that document; see
`019-mcp-faiss-implementation` for the umbrella spec covering all phases together. The course
recommendation engine already exists; this phase confirms/completes it. Depends on Phase 4's gap
analysis.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Explainable course recommendations for each gap (Priority: P1)

A candidate looking at their skill gaps needs to see specific course recommendations that visibly
trace back to the gap(s) they close, with a stated reason, so the recommendation reads as
evidence-based guidance rather than a generic suggestion.

**Why this priority**: This is the last deterministic-recommendation link before the
evidence/learning-plan phase; its correctness and explainability must be solid since the learning
path (Phase 6) presents these recommendations in sequence.

**Independent Test**: Can be fully tested by requesting course recommendations for an analysis with
known gaps and confirming every recommended course lists which specific gap(s) it closes and a
human-readable reason, ranked deterministically.

**Acceptance Scenarios**:

1. **Given** a gap analysis with one or more ranked gaps, **When** course recommendations are
   requested, **Then** each recommended course states which gap(s) it addresses and why.
2. **Given** two courses could address the same gap, **When** ranking is computed, **Then** the
   higher-ranked course is chosen consistently across repeated requests with the same input.
3. **Given** a gap has no matching course in the catalogue, **When** recommendations are computed,
   **Then** that gap is reported as unmatched rather than silently omitted or paired with an
   unrelated course.

---

### User Story 2 - Semantic matching only fills gaps the exact match missed (Priority: P2)

Whoever reviews a course recommendation needs confidence that a broader, similarity-based match is
only ever used when no direct competency-overlap match exists for a gap — never overriding or
outranking an exact match — so "closes: ✓ X" always means a real, verifiable overlap, and a looser
match is only used as a last resort, clearly distinguishable from an exact one.

**Why this priority**: This preserves the trustworthiness of the recommendation's stated reason;
without this ordering guarantee, a recommendation could look precise while actually being a loose
guess.

**Independent Test**: Can be fully tested by constructing a gap that has both an exact
competency-tagged course and a merely-similar course in the catalogue, and confirming the exact
match is always chosen; then removing the exact match and confirming the similar course is used
instead, marked as a semantic (not exact) match.

**Acceptance Scenarios**:

1. **Given** a gap with at least one course explicitly tagged to that competency, **When**
   recommendations are computed, **Then** that exact-tagged course is chosen over any merely
   similar course.
2. **Given** a gap with no exactly-tagged course but at least one similar course above the matching
   threshold, **When** recommendations are computed, **Then** the similar course is recommended and
   distinguishable (in its match data) from an exact match.
3. **Given** the semantic-matching step itself fails for any reason, **When** this happens,
   **Then** the system logs it and treats the gap as unmatched rather than raising an error that
   blocks the rest of the recommendations.

---

### Edge Cases

- What happens when a course covers multiple gaps at once? It must appear once, listing every gap
  it addresses, rather than being recommended multiple times with different stated reasons.
- What happens when the course catalogue is empty or a specific competency has zero associated
  courses at any confidence level? The gap must be reported as unmatched, and the rest of the
  recommendation response must still be returned successfully.
- What happens when a semantic-similarity score is only marginally above the matching threshold?
  It should still be treated as a valid (if lower-confidence) match, with its score visible so a
  reviewer can judge its strength themselves.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST recommend courses for identified gaps using a deterministic matching
  and ranking method; the language model MUST NOT independently decide final course rankings at
  request time.
- **FR-002**: Every course recommendation MUST state which specific gap(s) it addresses and a
  human-readable reason referencing the actual overlap found.
- **FR-003**: A gap with no matching course MUST be reported as unmatched rather than paired with an
  unrelated course or silently dropped from the response.
- **FR-004**: A broader, similarity-based match MUST only be attempted for a gap when no exact
  competency-tagged course exists for it, and MUST never outrank or replace an exact match when one
  exists.
- **FR-005**: A course addressing multiple gaps in one analysis MUST be represented once in the
  response, listing all the gaps it addresses, not duplicated per gap.
- **FR-006**: A failure in the similarity-matching step MUST be logged and treated as "no match
  found" for that gap, never as a request-level error.

### Key Entities *(include if feature involves data)*

- **Course Recommendation**: One course matched to one or more gaps for a specific analysis —
  which gap(s) it addresses, the human-readable reason, and (when applicable) a similarity score.
- **Unmatched Gap**: A gap for which no course (exact or similar) could be found — reported
  explicitly rather than omitted.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of course recommendations, across testing, state at least one specific gap they
  address and a reason referencing the actual overlap.
- **SC-002**: Repeating the same course-recommendation request on identical gap/catalogue data
  produces identical rankings across at least 3 repeated runs.
- **SC-003**: In a test scenario with both an exact-tagged and a merely-similar course available for
  the same gap, the exact-tagged course is chosen 100% of the time.
- **SC-004**: Zero instances, across testing, of a single course appearing more than once in one
  recommendation response for the same analysis.

## Assumptions

- The deterministic competency-overlap matcher and the semantic (embedding-similarity) fallback
  already exist and are confirmed working by this session's live audit; this phase's work is
  confirmation/completion, not a rebuild.
- The similarity threshold used for the fallback match is an implementation detail owned by the
  matching service; this spec requires that such a threshold exists and is applied consistently
  (FR-004), not any particular numeric value.
- Course catalogue size remains small (tens of items, per the project's curated data), so ranking
  performance is not a concern this phase needs to address.
