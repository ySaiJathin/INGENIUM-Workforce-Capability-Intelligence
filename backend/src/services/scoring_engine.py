"""
Task 7 — Deterministic Scoring Engine.

Pure function, no database/HTTP dependency (Rule 9 — independently testable). Implements
research.md §1-§3's formula exactly: assessment evidence weighted more heavily than resume evidence
(Rule 6), fully reproducible (no randomness), handles every evidence-presence combination without
error (FR-006).
"""

from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import Session

from backend.src.models import AssessmentSession, CandidateSkill, Competency, SkillEvidence, VerifiedSkillScore

ASSESSMENT_WEIGHT_BOTH = 0.7
RESUME_WEIGHT_BOTH = 0.3
DIFFICULTY_ADJUSTMENT_WEIGHT = 0.5
RESUME_ONLY_CONFIDENCE_CAP = 0.6
MAX_DIFFICULTY = 5  # matches assessment_engine.MAX_DIFFICULTY


def compute_verified_score(
    resume_estimated_level: float | None,
    resume_confidence: float | None,
    questions_answered: int,
    correct_count: int,
    avg_difficulty: float,
    proficiency_scale_max: float,
) -> tuple[float, float] | None:
    """Returns (verified_level, verified_confidence), or None if there is no evidence at all
    (spec Edge Cases: no resume estimate and no assessment evidence — nothing to score)."""
    has_resume = resume_estimated_level is not None and resume_confidence is not None
    has_assessment = questions_answered > 0

    if not has_resume and not has_assessment:
        return None

    # research.md §2: resume-only special case — no assessment evidence to blend with.
    if has_resume and not has_assessment:
        verified_level = resume_estimated_level
        verified_confidence = resume_confidence * RESUME_ONLY_CONFIDENCE_CAP
        return round(verified_level, 4), round(verified_confidence, 4)

    # From here: has_assessment is True (assessment-only or both).
    weighted_correctness = (correct_count / questions_answered) * proficiency_scale_max
    difficulty_adjustment = (avg_difficulty / MAX_DIFFICULTY) * DIFFICULTY_ADJUSTMENT_WEIGHT
    assessment_term = weighted_correctness + difficulty_adjustment

    if has_resume:
        # research.md §1: both present — assessment structurally dominates via the 0.7/0.3 split.
        resume_evidence_contribution = resume_estimated_level * resume_confidence * RESUME_WEIGHT_BOTH
        verified_level = assessment_term * ASSESSMENT_WEIGHT_BOTH + resume_evidence_contribution
        # research.md §3: confidence climbs with assessment evidence, modestly with resume evidence.
        verified_confidence = min(1.0, (questions_answered / 3) * 0.6 + resume_confidence * 0.2)
    else:
        # research.md §2: assessment-only — ASSESSMENT_WEIGHT effectively becomes 1.0.
        verified_level = assessment_term
        verified_confidence = min(1.0, (questions_answered / 3) * 0.6)

    verified_level = max(0.0, min(proficiency_scale_max, verified_level))
    return round(verified_level, 4), round(verified_confidence, 4)


def build_and_persist_verified_profile(db: Session, session: AssessmentSession) -> list[dict]:
    """FR-001/FR-007/FR-008: computes a verified score for every competency with resume and/or
    assessment evidence, persists each as an upserted VerifiedSkillScore row (re-fetching the same
    session's profile recomputes rather than duplicating), and returns the API-facing items."""
    resume_rows = {
        cs.competency_id: cs
        for cs in db.execute(
            select(CandidateSkill).where(CandidateSkill.candidate_id == session.candidate_id)
        ).scalars().all()
    }
    assessment_rows = {
        se.competency_id: se
        for se in db.execute(select(SkillEvidence).where(SkillEvidence.session_id == session.id)).scalars().all()
    }

    competency_ids = set(resume_rows) | set(assessment_rows)
    now = datetime.now(UTC)
    items: list[dict] = []

    for competency_id in competency_ids:
        competency = db.get(Competency, competency_id)
        resume = resume_rows.get(competency_id)
        evidence = assessment_rows.get(competency_id)

        result = compute_verified_score(
            resume_estimated_level=resume.resume_estimated_level if resume else None,
            resume_confidence=resume.resume_confidence if resume else None,
            questions_answered=evidence.questions_answered if evidence else 0,
            correct_count=evidence.correct_count if evidence else 0,
            avg_difficulty=evidence.avg_difficulty if evidence else 0,
            proficiency_scale_max=competency.proficiency_scale_max,
        )
        if result is None:  # spec Edge Cases: no evidence at all — omit, never a zero/null entry
            continue
        verified_level, verified_confidence = result

        stmt = pg_insert(VerifiedSkillScore).values(
            candidate_id=session.candidate_id,
            competency_id=competency_id,
            session_id=session.id,
            resume_estimated_level=resume.resume_estimated_level if resume else None,
            resume_confidence=resume.resume_confidence if resume else None,
            verified_level=verified_level,
            verified_confidence=verified_confidence,
            computed_at=now,
        )
        stmt = stmt.on_conflict_do_update(
            index_elements=["candidate_id", "competency_id", "session_id"],
            set_={
                "resume_estimated_level": stmt.excluded.resume_estimated_level,
                "resume_confidence": stmt.excluded.resume_confidence,
                "verified_level": stmt.excluded.verified_level,
                "verified_confidence": stmt.excluded.verified_confidence,
                "computed_at": stmt.excluded.computed_at,
            },
        )
        db.execute(stmt)

        items.append(
            {
                "competency_id": competency_id,
                "competency_name": competency.name,
                "resume_estimated_level": resume.resume_estimated_level if resume else None,
                "resume_confidence": resume.resume_confidence if resume else None,
                "verified_level": verified_level,
                "verified_confidence": verified_confidence,
            }
        )

    db.commit()
    return items
