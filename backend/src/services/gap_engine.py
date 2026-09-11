"""Task 8 — Skill Gap Engine."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from backend.src.models import (
    Analysis,
    AssessmentSession,
    Competency,
    RoleCompetency,
    SkillGap,
    VerifiedSkillScore,
)

# research.md §1
W_GAP_MAGNITUDE = 0.6
W_ROLE_PRIORITY = 0.3
W_PREREQUISITE = 0.1


def rank_gaps(gap_rows: list[dict], competencies_with_children: set[str]) -> list[dict]:
    """research.md §1/§2: weighted-sum ranking, highest-value gap first, ties broken by competency id
    for determinism (spec Edge Cases). Pure function — no DB dependency (Rule 9)."""
    if not gap_rows:
        return []

    max_gap = max(row["gap"] for row in gap_rows) or 1.0
    max_priority_inverse = 1.0  # priority>=1, so 1/priority is already in (0, 1]

    scored = []
    for row in gap_rows:
        gap_magnitude_normalized = row["gap"] / max_gap
        role_priority_normalized = (1.0 / row["priority"]) / max_priority_inverse
        prerequisite_importance = 1.0 if row["competency_id"] in competencies_with_children else 0.0
        score = (
            gap_magnitude_normalized * W_GAP_MAGNITUDE
            + role_priority_normalized * W_ROLE_PRIORITY
            + prerequisite_importance * W_PREREQUISITE
        )
        scored.append((score, row))

    scored.sort(key=lambda pair: (-pair[0], pair[1]["competency_id"]))
    return [row for _score, row in scored]


def _most_recent_session(db: Session, candidate_id: uuid.UUID, target_role_id: str) -> AssessmentSession | None:
    """spec Assumptions: most recent completed session for this candidate+role, else most recent
    in-progress one."""
    completed = db.execute(
        select(AssessmentSession)
        .where(
            AssessmentSession.candidate_id == candidate_id,
            AssessmentSession.target_role_id == target_role_id,
            AssessmentSession.status == "completed",
        )
        .order_by(AssessmentSession.started_at.desc())
        .limit(1)
    ).scalar_one_or_none()
    if completed is not None:
        return completed

    return db.execute(
        select(AssessmentSession)
        .where(
            AssessmentSession.candidate_id == candidate_id,
            AssessmentSession.target_role_id == target_role_id,
        )
        .order_by(AssessmentSession.started_at.desc())
        .limit(1)
    ).scalar_one_or_none()


class NoAssessmentSessionError(ValueError):
    """No assessment session exists yet for this candidate/role pair."""


def create_analysis(db: Session, candidate_id: uuid.UUID, target_role_id: str) -> Analysis:
    """FR-001."""
    session = _most_recent_session(db, candidate_id, target_role_id)
    if session is None:
        raise NoAssessmentSessionError(
            f"No assessment session found for candidate {candidate_id} and role {target_role_id!r}"
        )

    analysis = Analysis(
        id=uuid.uuid4(),
        candidate_id=candidate_id,
        target_role_id=target_role_id,
        session_id=session.id,
        created_at=datetime.now(UTC),
    )
    db.add(analysis)
    db.commit()
    return analysis


def compute_and_persist_gaps(db: Session, analysis: Analysis) -> list[dict]:
    """FR-002..FR-006."""
    role_competencies = db.execute(
        select(RoleCompetency).where(RoleCompetency.role_id == analysis.target_role_id)
    ).scalars().all()

    verified_scores = {
        vs.competency_id: vs
        for vs in db.execute(
            select(VerifiedSkillScore).where(
                VerifiedSkillScore.candidate_id == analysis.candidate_id,
                VerifiedSkillScore.session_id == analysis.session_id,
            )
        ).scalars().all()
    }

    competencies_with_children = {
        c.parent_competency_id
        for c in db.execute(select(Competency.parent_competency_id).where(Competency.parent_competency_id.is_not(None)))
    }

    gap_rows: list[dict] = []
    for rc in role_competencies:
        verified = verified_scores.get(rc.competency_id)
        # spec Acceptance Scenario 4: no verified_skill_scores row (never assessed, no resume
        # evidence) still appears as a gap — default to 0.0 rather than silently skipping it.
        verified_level = verified.verified_level if verified is not None else 0.0
        gap = rc.required_level - verified_level
        if gap <= 0:  # FR-003: only shortfalls appear
            continue

        competency = db.get(Competency, rc.competency_id)
        gap_rows.append(
            {
                "competency_id": rc.competency_id,
                "competency_name": competency.name,
                "required_level": rc.required_level,
                "verified_level": verified_level,
                "gap": gap,
                "priority": rc.priority,
            }
        )

    ranked = rank_gaps(gap_rows, competencies_with_children)

    # SkillGap's primary key is a bare uuid (Task 2's data-model.md), not a natural composite key on
    # (analysis_id, competency_id) — replace this analysis's prior gap rows outright rather than
    # upserting, so re-fetching the same analysis recomputes instead of accumulating duplicates.
    db.execute(delete(SkillGap).where(SkillGap.analysis_id == analysis.id))

    now_items: list[dict] = []
    for rank, row in enumerate(ranked, start=1):
        db.add(
            SkillGap(
                id=uuid.uuid4(),
                analysis_id=analysis.id,
                competency_id=row["competency_id"],
                required_level=row["required_level"],
                verified_level=row["verified_level"],
                gap=row["gap"],
                rank=rank,
            )
        )
        now_items.append(
            {
                "competency_id": row["competency_id"],
                "competency_name": row["competency_name"],
                "required_level": row["required_level"],
                "verified_level": row["verified_level"],
                "gap": row["gap"],
                "rank": rank,
            }
        )

    db.commit()
    return now_items
