"""
Task 10 — Learning Path.

order_steps() is a pure function (Rule 9); build_learning_path() is the DB-aware orchestration that
reuses Task 9's course-matching logic rather than re-deriving it (Rule 10).
"""

from __future__ import annotations

import logging
import uuid
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.src.models import Analysis, Competency, LearningPath, LearningPathStep, SkillGap
from backend.src.services import course_recommendation_engine, mistral_client

logger = logging.getLogger(__name__)


def order_steps(course_groups: list[dict], competency_parent: dict[str, str | None]) -> list[dict]:
    """research.md §1: start from Task 8's rank order (via each group's `best_rank`), then
    topologically promote a step to before any step addressing one of its own addressed
    competencies' children — Kahn's algorithm, ties broken by the original rank order so the result
    stays stable/reproducible (FR-002/FR-003/SC-002).

    `course_groups`: [{"course_id", "title", "matched_gaps": [competency_id, ...], "best_rank"}, ...]
    `competency_parent`: competency_id -> parent_competency_id (or None)
    """
    if not course_groups:
        return []

    ordered_by_rank = sorted(course_groups, key=lambda g: g["best_rank"])
    index_of = {g["course_id"]: i for i, g in enumerate(ordered_by_rank)}

    # Which step addresses a given competency (first match wins, consistent with Task 9's grouping).
    step_for_competency: dict[str, int] = {}
    for i, group in enumerate(ordered_by_rank):
        for comp_id in group["matched_gaps"]:
            step_for_competency.setdefault(comp_id, i)

    # Edge i -> j means step i (a prerequisite) must come before step j (its dependent).
    edges: dict[int, set[int]] = {i: set() for i in range(len(ordered_by_rank))}
    in_degree = [0] * len(ordered_by_rank)
    for j, group in enumerate(ordered_by_rank):
        for comp_id in group["matched_gaps"]:
            parent_id = competency_parent.get(comp_id)
            if parent_id is None:
                continue
            i = step_for_competency.get(parent_id)
            if i is None or i == j or j in edges[i]:
                continue
            edges[i].add(j)
            in_degree[j] += 1

    # Kahn's algorithm, always picking the lowest-original-rank-index available node (stability).
    available = sorted(i for i in range(len(ordered_by_rank)) if in_degree[i] == 0)
    result_indices: list[int] = []
    while available:
        available.sort()
        i = available.pop(0)
        result_indices.append(i)
        for j in sorted(edges[i]):
            in_degree[j] -= 1
            if in_degree[j] == 0:
                available.append(j)

    if len(result_indices) != len(ordered_by_rank):
        # A cycle in the (small, curated) hierarchy would be a data problem, not a runtime one to
        # crash over — fall back to plain rank order rather than losing steps.
        logger.warning("Prerequisite ordering found a cycle; falling back to rank order.")
        return ordered_by_rank

    return [ordered_by_rank[i] for i in result_indices]


def build_learning_path(db: Session, analysis_id: uuid.UUID) -> dict:
    """FR-001..FR-007."""
    analysis = db.get(Analysis, analysis_id)

    gaps = db.execute(select(SkillGap).where(SkillGap.analysis_id == analysis_id)).scalars().all()
    if not gaps:
        path = LearningPath(
            id=uuid.uuid4(), analysis_id=analysis_id, created_at=datetime.now(UTC), gaps_without_courses=[]
        )
        db.add(path)
        db.commit()
        return {
            "learning_path_id": path.id,
            "analysis_id": analysis_id,
            "steps": [],
            "gaps_without_courses": [],
            "message": "No further learning required — all target role requirements are met.",
        }

    recommendations, unmatched_gaps = course_recommendation_engine.match_courses_for_analysis(db, analysis_id)

    rank_by_competency = {g.competency_id: g.rank for g in gaps}
    course_groups = [
        {
            "course_id": rec["course_id"],
            "title": rec["title"],
            "matched_gaps": rec["matched_gaps"],
            "best_rank": min(rank_by_competency.get(cid, len(gaps) + 1) for cid in rec["matched_gaps"]),
        }
        for rec in recommendations
    ]

    competency_parent = {
        c.id: c.parent_competency_id for c in db.execute(select(Competency)).scalars().all()
    }
    ordered = order_steps(course_groups, competency_parent)

    path = LearningPath(
        id=uuid.uuid4(), analysis_id=analysis_id, created_at=datetime.now(UTC), gaps_without_courses=unmatched_gaps
    )
    db.add(path)

    step_dicts = [
        {"step_number": i, "course_id": g["course_id"], "title": g["title"], "addresses_gaps": g["matched_gaps"]}
        for i, g in enumerate(ordered, start=1)
    ]
    rationales = mistral_client.generate_rationale(step_dicts)  # FR-006: optional, {} on failure

    for step in step_dicts:
        gap_id = next(
            g.id for g in gaps if g.competency_id in step["addresses_gaps"]
        )  # any addressed gap's id satisfies the FK; the step's own addresses_gaps carries the full list
        db.add(
            LearningPathStep(
                learning_path_id=path.id,
                step_number=step["step_number"],
                course_id=step["course_id"],
                gap_id=gap_id,
                rationale=rationales.get(step["step_number"]),
            )
        )
    db.commit()

    return {
        "learning_path_id": path.id,
        "analysis_id": analysis_id,
        "steps": [
            {
                "step_number": s["step_number"],
                "course_id": s["course_id"],
                "title": s["title"],
                "addresses_gaps": s["addresses_gaps"],
                "rationale": rationales.get(s["step_number"]),
            }
            for s in step_dicts
        ],
        "gaps_without_courses": unmatched_gaps,
    }


def get_learning_path(db: Session, learning_path_id: uuid.UUID) -> dict | None:
    """FR-005/SC-003: reads back persisted rows, never recomputes."""
    path = db.get(LearningPath, learning_path_id)
    if path is None:
        return None

    step_rows = db.execute(
        select(LearningPathStep).where(LearningPathStep.learning_path_id == learning_path_id).order_by(LearningPathStep.step_number)
    ).scalars().all()

    from backend.src.models import Course

    # Reconstruct addresses_gaps per step_number by re-grouping (a step may address multiple gaps,
    # but learning_path_steps has one row per (step, gap) at most one gap_id — see plan.md note).
    grouped: dict[int, dict] = {}
    for row in step_rows:
        course = db.get(Course, row.course_id)
        gap = db.get(SkillGap, row.gap_id)
        entry = grouped.setdefault(
            row.step_number,
            {"step_number": row.step_number, "course_id": row.course_id, "title": course.title, "addresses_gaps": [], "rationale": row.rationale},
        )
        if gap is not None and gap.competency_id not in entry["addresses_gaps"]:
            entry["addresses_gaps"].append(gap.competency_id)

    if not grouped:
        return {
            "learning_path_id": path.id,
            "analysis_id": path.analysis_id,
            "steps": [],
            "gaps_without_courses": path.gaps_without_courses or [],
            "message": "No further learning required — all target role requirements are met.",
        }

    return {
        "learning_path_id": path.id,
        "analysis_id": path.analysis_id,
        "steps": sorted(grouped.values(), key=lambda s: s["step_number"]),
        "gaps_without_courses": path.gaps_without_courses or [],
    }
