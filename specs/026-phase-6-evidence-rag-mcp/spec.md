# Feature Specification: Phase 6 — Evidence + RAG + MCP

**Feature Branch**: `026-phase-6-evidence-rag-mcp`

**Created**: 2026-09-12

**Status**: Draft

**Input**: User description: "Plan and specify Phase 6 (Evidence + RAG + MCP) from
`INGENIUM_MASTER_FUNCTIONALITY_AND_MCP_IMPLEMENTATION.md`, as its own separate spec."

**Authority note**: `INGENIUM_MASTER_FUNCTIONALITY_AND_MCP_IMPLEMENTATION.md` (repo root),
Phase 6, is the authoritative source for this spec's requirements and acceptance criteria,
including the architecture decision that a persistent similarity-search evidence index ("FAISS")
is now a required core layer — that decision is not re-opened here. This is one of eight sibling
specs (`020` through `027`) each covering one phase of that document; see
`019-mcp-faiss-implementation` for the umbrella spec covering all phases together. This is the
second genuinely new-work phase (no evidence corpus or retrieval capability exists yet). Depends on
Phase 2 (controlled access layer), Phase 4 (gaps), and Phase 5 (courses).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A learning plan grounded in retrievable evidence (Priority: P1)

A candidate reviewing their personalized learning plan needs each step's rationale to be traceable
to real supporting material (competency, role, and course descriptions already curated in the
platform) that the system actually retrieved — never a plausible-sounding but fabricated
explanation — so they can trust the plan is grounded in real information, not invented detail.

**Why this priority**: This is the project's most advanced explainability capability, and the
whole reason the evidence/retrieval layer exists; without a grounded output at the end of it, the
retrieval layer would have no visible purpose to the candidate.

**Independent Test**: Can be fully tested by generating a learning plan for a candidate with known
gaps and confirming every entity the plan's explanatory text references (course, provider,
competency, duration) can be matched back to a piece of retrieved evidence, with any unsupported
claim removed or flagged before the plan is shown.

**Acceptance Scenarios**:

1. **Given** a candidate's priority gaps and matched courses, **When** a learning plan is
   generated, **Then** its step ordering matches the deterministic priority/course ranking already
   computed (never reordered by the plan-generation step).
2. **Given** the plan-generation step produces explanatory text referencing a course, provider, or
   skill, **When** that text is checked against the retrieved evidence, **Then** every referenced
   entity is found in the evidence; any reference that isn't is removed or flagged rather than
   shown as fact.
3. **Given** the evidence-retrieval or plan-generation step is unavailable, **When** a learning plan
   is requested, **Then** the candidate still receives a usable plan built from the deterministic
   gap/course data, clearly distinguished from the fully-grounded version.

---

### User Story 2 - Evidence is retrievable, traceable, and never rebuilt live (Priority: P2)

Whoever operates the system needs a retrievable body of evidence — built once from the platform's
own curated competency, role, and course data — that can be queried quickly for a given topic and
always traced back to its exact source, without being rebuilt (and thus risking becoming
inconsistent or slow) on every request.

**Why this priority**: This is the infrastructure the grounding story (User Story 1) depends on;
it must exist and behave predictably before grounding can be verified.

**Independent Test**: Can be fully tested by building the evidence corpus once, querying it several
times with different topics, and confirming each result set is relevant, each item traces to a
real source record, and that no query triggers a rebuild of the underlying index.

**Acceptance Scenarios**:

1. **Given** the evidence corpus has been built, **When** it is queried with a topic related to a
   real competency/role/course in the platform's data, **Then** at least one relevant, correctly
   sourced item is returned.
2. **Given** the same query is issued multiple times in a row, **When** timing/behavior is
   observed, **Then** no rebuild of the underlying index occurs between queries — only the
   already-built index is searched.
3. **Given** the underlying curated data changes (e.g., a new course is added), **When** the
   evidence corpus is not yet rebuilt, **Then** the system's behavior is predictable (querying the
   prior, still-consistent index) rather than silently mixing old and new data.

---

### Edge Cases

- What happens when the evidence index hasn't been built yet (fresh environment, first run)? A
  query against it must fail clearly and be treated as "evidence unavailable" by any caller
  (triggering the deterministic fallback), never as a crash.
- What happens when a generated plan references an entity that sounds plausible but was never
  supplied as a gap, course, or piece of evidence (e.g., a fabricated course name or an invented
  certification)? It must be caught and removed/flagged by the grounding check before being shown.
- What happens when no evidence is relevant to a given query (a very narrow or unusual gap)? The
  system must return an empty, valid result rather than forcing an irrelevant match.
- What happens if the plan-generation step reorders the steps it was given (contrary to the
  already-decided deterministic order)? This must be detected/prevented — ordering is never the
  plan generator's decision to make.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST maintain a retrievable evidence corpus built from the platform's own
  curated/reference data (competency definitions, role descriptions, course
  descriptions/metadata) — not external or invented content.
- **FR-002**: The system MUST provide evidence retrieval as one of the controlled-access-layer
  capabilities established in Phase 2, returning only retrieved evidence items (each traceable to
  its source) for a given query.
- **FR-003**: The evidence index MUST be built offline/precomputed and persisted; it MUST NOT be
  rebuilt as part of handling a normal request.
- **FR-004**: The system MUST generate the personalized learning plan using only the candidate's
  verified profile, priority gaps, deterministically selected courses, and retrieved evidence
  supplied to it — the plan generator MUST NOT invent courses, providers, durations, ratings,
  skills, or certifications not present in that supplied material.
- **FR-005**: The system MUST validate a generated learning plan's referenced entities against the
  retrieved evidence (and the deterministic gap/course data it was given) before display, removing
  or flagging any entity that cannot be matched to that supplied material.
- **FR-006**: The learning plan's step ordering MUST always match the already-computed
  deterministic priority/course ranking — the plan-generation step MUST NOT reorder steps.
- **FR-007**: If evidence retrieval or plan generation is unavailable, the system MUST still return
  a usable learning plan built deterministically from priority gaps and recommended courses,
  clearly distinguishable from a grounded plan.

### Key Entities *(include if feature involves data)*

- **Evidence Item**: One retrievable unit of grounding material (drawn from a competency
  definition, role description, or course description/metadata), with enough identifying
  information to trace it back to its source and a relevance signal for a given query.
- **Grounding Check Result**: The outcome of validating a generated learning plan's referenced
  entities against retrieved evidence — which entities were supported, which were removed or
  flagged, and why.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every claim in a generated learning-plan's explanatory text (course, provider, skill,
  duration, certification) is traceable to a specific piece of retrieved evidence or supplied
  deterministic data, with zero fabricated references reaching the candidate-facing result, across
  testing.
- **SC-002**: Repeated evidence queries against an already-built index show no rebuild behavior —
  index build happens once, verified by timing or an explicit build-invocation count.
- **SC-003**: When evidence retrieval or plan generation is deliberately made unavailable, a
  candidate can still receive a usable learning plan for 100% of tested cases.
- **SC-004**: 100% of tested learning-plan step orderings match the already-computed deterministic
  priority/course ranking exactly — zero observed reordering by the plan-generation step.

## Assumptions

- The evidence corpus draws only from data already curated within this project (competencies,
  roles, courses, and optionally a bounded ESCO slice already referenced by that curated data) —
  no new external content source is introduced by this phase.
- "FAISS" (or an equivalent persistent similarity-search index) is the specific mechanism named in
  the master document for the retrieval layer; this spec describes its required behavior in
  technology-neutral terms so its acceptance criteria hold regardless of the exact library used.
- The deterministic gap-priority ranking (Phase 4) and course-recommendation ranking (Phase 5) are
  already correct and stable inputs to this phase — this phase does not re-verify their own
  correctness, only that the plan generator respects their output order.
- No second language-model call is required to validate grounding (a closed-world membership check
  against supplied evidence/data suffices) — this keeps the grounding check itself deterministic
  and fast.
