# Feature Specification: Task 9 — Course Recommendation Engine

**Feature Branch**: `010-task-9-course-recommendation-engine`

**Created**: 2026-09-11

**Status**: Draft

**Input**: Task 9 from `total_buildplan.md` §24: "Gap → course matching → ranking → explanation.
Deterministic competency overlap as baseline; MiniLM only where it adds value." Detailed in §11.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Get Courses That Actually Close My Gaps, With a Reason Why (Priority: P1)

Given the ranked skill gaps from Task 8, the system matches each gap to one or more courses from the
curated catalogue that cover the gapped competency, ranks the matches, and returns a clear, explainable
reason for every recommendation (e.g. "covers ✓ Window Functions ✓ CTEs").

**Why this priority**: This is the "so what do I do about it" answer the candidate needs; it is the
direct input to Task 10's learning path.

**Independent Test**: Can be fully tested by taking a known gap list and a known course catalogue and
confirming every gapped competency with at least one covering course receives a recommendation whose
explanation names the actual overlapping competencies.

**Acceptance Scenarios**:

1. **Given** an analysis with one or more ranked gaps, **When** `GET /analysis/{id}/courses` is called,
   **Then** the system returns, for each gap, one or more matching courses ranked by relevance, each with
   an explanation naming which of the course's covered competencies matched the gap.
2. **Given** a gap for a competency with no covering course in the catalogue, **When** matching runs,
   **Then** that gap is clearly flagged as having no available course rather than silently omitted or
   erroring.
3. **Given** deterministic competency-overlap matching finds a course, **When** MiniLM semantic re-ranking
   is applied, **Then** the final ranking still gives deterministic overlap matches at least equal
   priority to semantic-only matches (semantic similarity broadens/re-ranks, it does not override
   an exact competency match).
4. **Given** MiniLM/embedding computation fails or is unavailable, **When** matching runs, **Then** the
   system falls back to deterministic competency-overlap matching alone, without erroring.

### Edge Cases

- What happens when a candidate has no gaps at all? → `GET /analysis/{id}/courses` returns an empty
  result, consistent with Task 8's "no gaps" analysis.
- What happens when multiple courses cover the same gapped competency equally well? → Course `priority`
  (curated tie-breaker from Task 1) decides the order among otherwise-equal matches.
- What happens when a course covers several of the candidate's gaps at once? → It should be recommended
  once, with an explanation listing every gap it addresses, rather than appearing as a separate
  recommendation per gap (avoids redundant/confusing output).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST expose `GET /analysis/{id}/courses`, matching every gap from that analysis to
  courses in the curated catalogue that cover the gapped competency.
- **FR-002**: System MUST use deterministic competency-overlap matching (a course covers a gap's
  competency) as the baseline matching mechanism.
- **FR-003**: System MAY re-rank or broaden matches using MiniLM cosine-similarity between gap and course
  embeddings, but MUST NOT let semantic similarity override or outrank an exact deterministic competency
  match.
- **FR-004**: System MUST provide a human-readable explanation for every recommended course, naming the
  specific competencies it covers that overlap with the candidate's gaps.
- **FR-005**: System MUST fall back to deterministic overlap matching alone if semantic matching fails or
  is unavailable, without erroring the request.
- **FR-006**: System MUST clearly flag a gap that has no matching course in the catalogue, rather than
  silently omitting it from the response.
- **FR-007**: System MUST NOT let Mistral determine or influence which courses are matched or how they
  are ranked — matching and ranking are fully backend-owned (Rule 4).
- **FR-008**: System MUST recommend a course at most once per analysis even if it covers multiple gaps,
  with its explanation listing every gap it addresses.

### Key Entities

- **Course Recommendation** *(Task 2's `course_recommendations` table)*: analysis, gap(s) addressed,
  course, match reason, optional match score.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of gapped competencies that have at least one covering course in the catalogue receive
  at least one course recommendation.
- **SC-002**: 100% of course recommendations include an explanation that correctly names at least one
  actually-overlapping competency (verifiable by cross-checking `course_competencies` against the gap).
- **SC-003**: Course matching for a typical analysis (a handful of gaps) completes in under 2 seconds,
  including any MiniLM similarity computation.
- **SC-004**: Zero requests fail outright when semantic matching is unavailable — deterministic matching
  alone still produces a usable result.

## Assumptions

- FAISS or any other approximate-nearest-neighbor infrastructure is not used — with 30–50 courses, plain
  in-memory cosine similarity is sufficient (`total_mvp_context.md` §3, `total_buildplan.md` §17).
- "MiniLM only where it adds value" means semantic similarity is used to catch near-miss competency-name
  matches the deterministic step alone might not surface (e.g. a gap in "SQL Aggregation" and a course
  titled around "GROUP BY techniques") — it is a recall-improving layer, not a replacement for the
  overlap baseline.
