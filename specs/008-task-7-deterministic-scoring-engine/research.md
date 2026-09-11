# Phase 0 Research: Task 7 — Deterministic Scoring Engine

## 1. Scoring formula and weighting constants

- **Decision**:
  ```
  weighted_correctness      = (correct_count / questions_answered) * proficiency_scale_max      [if assessed]
  difficulty_adjustment     = avg_difficulty_of_correct_answers_normalized * a small positive constant
  resume_evidence_contribution = resume_estimated_level * resume_confidence * RESUME_WEIGHT

  verified_level = clamp(
    (weighted_correctness + difficulty_adjustment) * ASSESSMENT_WEIGHT + resume_evidence_contribution,
    0, proficiency_scale_max
  )
  ```
  with `ASSESSMENT_WEIGHT` fixed meaningfully higher than `RESUME_WEIGHT` (e.g. 0.7 / 0.3 split when both
  are present), so assessment evidence structurally dominates whenever it exists.
- **Rationale**: `total_buildplan.md` §9 gives the formula shape
  (`weighted correctness + difficulty adjustment + resume evidence contribution`) and the rule that
  "assessment evidence must outweigh resume evidence in the final blend." The 0.7/0.3 split is a concrete,
  defensible, easy-to-explain-to-a-judge instantiation of that rule.
- **Alternatives considered**: Equal weighting — rejected, violates the explicit rule. A learned/tuned
  weighting — rejected, Rule 8 forbids any training, and a hand-picked constant is sufficient and fully
  explainable.

## 2. Handling missing evidence

- **Decision**: If only assessment evidence exists, `resume_evidence_contribution = 0` and
  `ASSESSMENT_WEIGHT` effectively becomes 1.0 for that competency (no resume term to blend). If only
  resume evidence exists, `verified_level = resume_estimated_level` with `verified_confidence` capped
  lower than any assessment-backed score (e.g. capped at `resume_confidence * 0.6`) — clearly marking it
  as "not yet verified" rather than pretending equal certainty to an assessed competency.
- **Rationale**: Directly implements spec FR-006 (Acceptance Scenarios 3–4) without special-casing that
  would break FR-004's reproducibility guarantee — the formula degrades gracefully by zeroing out the
  missing term rather than branching into a different formula.
- **Alternatives considered**: Omitting resume-only competencies from the verified profile entirely —
  rejected, spec Acceptance Scenario 4 requires a fallback-to-resume-estimate value.

## 3. Confidence computation

- **Decision**: `verified_confidence = min(1.0, questions_answered / 3 * 0.6 + resume_confidence * 0.2)`
  when both are present, so confidence climbs with more assessment evidence and only modestly with resume
  evidence alone — mirroring the same assessment-dominant principle applied to the score itself.
- **Rationale**: Keeps confidence and score computed by the same "assessment dominates" philosophy for
  internal consistency, and stays simple enough to compute in one pass with no external dependency.
- **Alternatives considered**: A separate statistical confidence-interval calculation — rejected as
  unnecessary complexity/precision for a hackathon MVP (`total_buildplan.md` §9: "No IRT, no complex
  statistical estimation, unless already available with no added implementation effort").

## Outcome

All Technical Context fields in `plan.md` are resolved with no remaining `NEEDS CLARIFICATION` markers.
Proceeding to Phase 1 (contracts/ — `data-model.md`/`quickstart.md` intentionally omitted, see plan.md).
