# Feature Specification: Phase 1 — Resume Intelligence

**Feature Branch**: `021-phase-1-resume-intelligence`

**Created**: 2026-09-12

**Status**: Draft

**Input**: User description: "Plan and specify Phase 1 (Resume Intelligence) from
`INGENIUM_MASTER_FUNCTIONALITY_AND_MCP_IMPLEMENTATION.md`, as its own separate spec."

**Authority note**: `INGENIUM_MASTER_FUNCTIONALITY_AND_MCP_IMPLEMENTATION.md` (repo root),
Phase 1, is the authoritative source for this spec's requirements and acceptance criteria. This is
one of eight sibling specs (`020` through `027`) each covering one phase of that document; see
`019-mcp-faiss-implementation` for the umbrella spec covering all phases together. Depends on
Phase 0 (`020-phase-0-diagnose-stabilize`) being complete.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A trustworthy initial profile from a real resume (Priority: P1)

A candidate uploading their real resume needs an initial competency profile that is genuinely
derived from their resume's actual content — combining a deterministic reading of obvious skill
mentions with an LLM-assisted reading of context and evidence strength — mapped onto the
platform's own competency framework, so what they see is a fair, evidence-backed starting point
rather than an arbitrary or fabricated-looking guess.

**Why this priority**: This is the entry point of the entire golden path; every downstream phase
(assessment, gaps, courses, learning path) is only as credible as the initial profile it starts
from.

**Independent Test**: Can be fully tested by uploading several real resumes with varying content
(strong detailed evidence, weak bare-mention evidence, resumes mentioning terms outside the
competency framework) and confirming the resulting profile's confidence levels and evidence text
plausibly reflect each resume's actual content, with unmapped terms surfaced rather than silently
dropped or forced onto the wrong competency.

**Acceptance Scenarios**:

1. **Given** a resume with detailed, specific evidence for a competency (e.g., a described project
   using it over multiple years), **When** it is processed, **Then** the resulting profile shows a
   higher confidence/evidence-strength signal than a resume that only lists the same competency by
   name with no context.
2. **Given** resume text containing a skill term that doesn't map confidently to any competency in
   the framework, **When** it is processed, **Then** that term is surfaced as unmapped rather than
   forced onto an unrelated competency or silently discarded.
3. **Given** the LLM-assisted extraction call fails or times out, **When** a readable resume is
   processed, **Then** a deterministic mapping still produces a usable (if more conservative)
   initial profile, distinguishable as such, rather than a hard failure.
4. **Given** the same resume is processed twice, **When** the deterministic portion of extraction
   runs both times, **Then** it produces the same result both times (the deterministic layer must
   not vary run to run).

---

### Edge Cases

- What happens when a resume mentions a competency in a context that could plausibly map to two
  different framework entries (e.g., "SQL" appearing where both "SQL" and "SQL Window Functions"
  exist)? The mapping must prefer the more general/obviously-matching entry over a confident guess
  at the more specific one, and never invent a new competency id.
- What happens when a resume is entirely in a format the text extractor can read but contains no
  competency-relevant content at all (e.g., a cover letter with no skills section)? The system must
  return an empty-but-valid initial profile, not an error, since a valid-but-empty result is
  different from a parsing failure.
- What happens when the LLM-assisted layer returns a competency id that isn't one of the ids it was
  given? That id must be discarded (never trusted blindly) and, where possible, remapped through
  the deterministic layer instead.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST convert an uploaded resume into extracted text, then into normalized,
  evidence-backed competency signals, using both a deterministic layer and an LLM-assisted layer —
  never relying on the LLM layer exclusively.
- **FR-002**: The system MUST map extracted skill terms to the platform's own competency
  framework using confidence-tiered matching (a confident automatic match, a cautious secondary
  match, or unresolved), and MUST NOT silently discard an unresolved term.
- **FR-003**: The system MUST treat every competency id returned by the LLM-assisted layer as
  untrusted until confirmed against the actual competency framework it was given — an id outside
  that framework MUST be discarded rather than persisted.
- **FR-004**: The system MUST persist the resume-derived profile as an initial, explicitly
  unverified signal, distinct from any later, assessment-verified profile.
- **FR-005**: The system MUST record, per competency signal, the evidence text it was derived from
  and a confidence/evidence-strength indicator, so a reviewer can see why a given level was
  estimated.
- **FR-006**: When the LLM-assisted layer is unavailable, the system MUST return a clear,
  actionable error directing the candidate to "Try Demo Candidate" — **not** a silently-degraded
  profile built from the deterministic layer alone. (Revised during implementation: this phase's
  original wording called for a deterministic-only fallback profile; live testing found this
  would reintroduce the exact silent-degraded-success pattern Phase 0's diagnosis found and
  removed from a stale deployment — the current, deliberate architecture, confirmed correct in
  `build_plan.md` §7.5/§27.2 and `CLAUDE.md` Rule 14, is a clean error with a working alternative
  path, not a fabricated partial result a candidate could mistake for a genuine assessment. See
  `specs/020-phase-0-diagnose-stabilize/diagnosis.md` for the specific defect this supersedes.)

### Key Entities *(include if feature involves data)*

- **Initial Profile Item**: One competency signal derived from a resume — competency, estimated
  level (or range), confidence, and the evidence text it came from. Explicitly marked as an
  unverified, resume-derived estimate.
- **Unmapped Term**: A skill-like term found in a resume that could not be confidently matched to
  any competency in the framework — retained and surfaced rather than discarded.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Across a small varied batch of test resumes, competencies with detailed supporting
  evidence consistently receive a higher confidence signal than competencies mentioned only by
  name, with zero cases of the reverse.
- **SC-002**: Zero instances, across testing, of a resume term being silently dropped without
  either mapping to a competency or appearing in the unmapped-terms list.
- **SC-003**: When the LLM-assisted layer is deliberately made unavailable, 100% of resume uploads
  with extractable text receive a clear, actionable error directing the candidate to "Try Demo
  Candidate" — zero instances of a raw exception, a hang, or a silently-degraded profile presented
  as if it were a full result (revised per FR-006's note above).
- **SC-004**: Re-processing the same resume text through the deterministic layer twice produces
  identical output both times.

## Implementation Notes

**Confidence/evidence-strength scale actually in use** (T013): per `mistral_client.py`'s
`_RESUME_EXTRACTION_PROMPT` schema, `confidence` is `LOW|MEDIUM|HIGH` (mapped to
`0.3|0.6|0.9` for scoring math via `schemas/candidates.py::CONFIDENCE_TO_FLOAT`), and
`evidence_strength` is the finer-grained `VERY_WEAK|WEAK|MODERATE|STRONG|VERY_STRONG` (descriptive
of the resume text itself, per `build_plan.md` §27.2 — not currently surfaced in the API response,
only `confidence` and `estimated_level_range` are). `estimated_level_range` is `{min, max}` on the
competency's own proficiency scale, and the API returns its midpoint as `resume_estimated_level`.

## Assumptions

- The competency framework itself (its ids, names, and definitions) is treated as fixed input to
  this phase, owned and curated elsewhere in the system — this phase only maps resume content onto
  it, never invents or edits it.
- "LLM-assisted layer unavailable" during this phase's own testing may occur due to external
  conditions (e.g., API rate limiting) rather than a defect in this phase's own code; the
  acceptance test for FR-006/SC-003 is valid either way, since the point is confirming the
  deterministic fallback actually works when triggered.
- Confidence/evidence-strength scales and their exact thresholds are implementation detail owned by
  whichever component performs the mapping; this spec requires that such a signal exists and
  behaves monotonically with evidence quality (SC-001), not any particular scale's exact values.
