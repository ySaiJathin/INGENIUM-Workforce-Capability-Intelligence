# Feature Specification: Task 7 — Deterministic Scoring Engine

**Feature Branch**: `008-task-7-deterministic-scoring-engine`

**Created**: 2026-09-11

**Status**: Draft

**Input**: Task 7 from `total_buildplan.md` §24: "Answer evidence → competency score → confidence →
overall skill score. Reproducible results." Formula detailed in §9.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See My Verified Competency Score, Not Just a Resume Guess (Priority: P1)

Once an assessment session is complete (or partially complete), the candidate's assessment evidence is
combined with their resume-estimated levels into a single, backend-computed verified score per
competency, with assessment evidence weighted more heavily. This is the core "wow" transformation of the
product: resume estimate → verified score.

**Why this priority**: This is the exact mechanism the product's central demo moment depends on
(`total_mvp_context.md` §1) and the direct input to Task 8's gap engine.

**Independent Test**: Can be fully tested by taking a completed assessment session's evidence (from
Task 6) plus a candidate's resume-estimated levels (from Task 4) and confirming the computed verified
score changes predictably and reproducibly as the underlying evidence changes — independently of the gap
or recommendation engines.

**Acceptance Scenarios**:

1. **Given** a candidate with a resume-estimated level and completed assessment evidence for a
   competency, **When** the scoring engine runs, **Then** it returns a verified level and confidence that
   weight the assessment evidence more heavily than the resume estimate.
2. **Given** the same evidence inputs run twice, **When** the scoring engine computes the result both
   times, **Then** it returns identical results (reproducible, no randomness).
3. **Given** a competency with assessment evidence but no resume estimate (Mistral found nothing on the
   resume), **When** scored, **Then** the verified score is based entirely on assessment evidence without
   error.
4. **Given** a competency with a resume estimate but no assessment evidence (not covered by the session,
   e.g. budget ran out), **When** scored, **Then** the verified score falls back to the resume estimate
   with a correspondingly lower confidence, rather than erroring or omitting the competency.
5. **Given** a completed session, **When** the score is requested, **Then** the response clearly shows,
   per competency, the resume-estimated value, the assessment-verified value, and the confidence — so the
   before/after contrast can be displayed (per `total_mvp_context.md` §1).

### Edge Cases

- What happens when a competency has neither a resume estimate nor any assessment evidence? → It is
  simply not included in the verified profile (there is nothing to score), rather than appearing as a
  zero or null entry.
- What happens when assessment evidence contradicts the resume estimate sharply (e.g. resume says
  advanced, assessment shows beginner)? → The formula still applies normally — assessment evidence
  dominates the blend by design, producing a lower verified score, which is itself the intended product
  behavior (verification correcting an overstated resume claim).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST compute a final verified competency score for every competency that has either
  resume evidence or assessment evidence (or both) for a given candidate/session.
- **FR-002**: System MUST compute scores entirely within the backend — Mistral MUST NOT determine, adjust,
  or influence the final numeric score in any way (Rule 6).
- **FR-003**: System MUST weight assessment evidence more heavily than resume evidence in the blended
  score, for every competency where both are present.
- **FR-004**: System MUST produce identical output for identical input evidence every time (no randomness,
  fully reproducible).
- **FR-005**: System MUST compute a confidence value alongside each verified score, reflecting how much
  evidence (resume + assessment) supports it.
- **FR-006**: System MUST handle competencies with only resume evidence, only assessment evidence, or
  both, without error in any case.
- **FR-007**: System MUST persist the computed verified scores so they can be retrieved later without
  recomputation, and MUST expose both the resume-estimated and verified values together in the response
  for the before/after product narrative.
- **FR-008**: System MUST be able to compute a score from partial assessment evidence (an abandoned or
  in-progress session), not only from a fully `completed` session.

### Key Entities

- **Verified Skill Score** *(Task 2's `verified_skill_scores` table)*: resume-estimated level/confidence,
  verified level/confidence, computed timestamp, linked to the candidate, competency, and session.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: For 100% of competencies with both resume and assessment evidence, the verified score
  moves further toward the assessment-derived value than the resume-only value would suggest — provably
  demonstrating assessment evidence outweighs resume evidence.
- **SC-002**: Running the scoring computation twice on identical input evidence produces byte-identical
  output every time.
- **SC-003**: A verified score is available within 1 second of a session being marked `completed` (pure
  computation, no external calls).
- **SC-004**: Zero verified-score computations error out due to missing resume or missing assessment
  evidence for a competency — every valid combination (resume-only, assessment-only, both) is handled.

## Assumptions

- The exact weighting constants in `competency_score = weighted_correctness + difficulty_adjustment +
  resume_evidence_contribution` (`total_buildplan.md` §9) are implementation details tuned during
  planning, so long as the assessment terms structurally dominate the resume term — this spec does not
  fix exact numeric weights as a scope decision.
- Scoring is triggered on-demand (`GET /assessment/{session_id}/profile` or a dedicated scoring call)
  rather than as a background job, matching the MVP's single-session, synchronous demo flow.
