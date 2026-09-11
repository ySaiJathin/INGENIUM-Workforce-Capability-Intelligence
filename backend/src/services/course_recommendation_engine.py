"""
Task 9 — Course Recommendation Engine.

Deterministic competency-overlap matching first (research.md §1); MiniLM cosine-similarity as an
optional broadening fallback for gaps the deterministic pass found nothing for (research.md §2), never
overriding an exact match (FR-003). Any MiniLM failure is logged and treated as "no semantic
candidates," never raised (research.md §3/FR-005).
"""

from __future__ import annotations

import logging
import threading
import uuid
from collections import defaultdict

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from backend.src.models import Course, CourseCompetency, CourseRecommendation, SkillGap

logger = logging.getLogger(__name__)

SEMANTIC_SIMILARITY_THRESHOLD = 0.35

_model = None
_model_lock = threading.Lock()
_course_embeddings: dict[str, object] | None = None  # course_id -> embedding vector
_embeddings_lock = threading.Lock()


def _get_model():
    """Lazy singleton — loaded on first use, reused across every request (Rule 13)."""
    global _model
    with _model_lock:
        if _model is None:
            from sentence_transformers import SentenceTransformer

            _model = SentenceTransformer("models/all-MiniLM-L6-v2")
    return _model


def _get_course_embeddings(db: Session) -> dict[str, object]:
    """research.md §2: compute once, cache in memory, reused across every request rather than
    recomputed per request."""
    global _course_embeddings
    with _embeddings_lock:
        if _course_embeddings is None:
            courses = db.execute(select(Course)).scalars().all()
            model = _get_model()
            texts = [f"{c.title}. {c.description}" for c in courses]
            vectors = model.encode(texts, normalize_embeddings=True)
            _course_embeddings = {c.id: vec for c, vec in zip(courses, vectors, strict=True)}
    return _course_embeddings


def deterministic_overlap(db: Session, competency_id: str) -> list[tuple[str, float]]:
    """research.md §1: courses whose course_competencies include this competency id, scored by
    sum(coverage_weight) * (1/course.priority), sorted descending. Returns [(course_id, score), ...]."""
    rows = db.execute(
        select(CourseCompetency, Course.priority)
        .join(Course, Course.id == CourseCompetency.course_id)
        .where(CourseCompetency.competency_id == competency_id)
    ).all()

    scored = [(cc.course_id, cc.coverage_weight * (1.0 / priority)) for cc, priority in rows]
    scored.sort(key=lambda pair: -pair[1])
    return scored


def semantic_fallback(db: Session, competency_id: str, competency_name: str, competency_description: str) -> list[tuple[str, float]]:
    """research.md §2/§3: only called when deterministic_overlap found nothing for this gap. Any
    failure here is caught by the caller (match_courses_for_analysis), never propagated."""
    embeddings = _get_course_embeddings(db)
    model = _get_model()

    import numpy as np

    query_text = f"{competency_name}. {competency_description}"
    query_vec = model.encode([query_text], normalize_embeddings=True)[0]

    scored = []
    for course_id, course_vec in embeddings.items():
        similarity = float(np.dot(query_vec, course_vec))
        if similarity >= SEMANTIC_SIMILARITY_THRESHOLD:
            scored.append((course_id, similarity))
    scored.sort(key=lambda pair: -pair[1])
    return scored


def match_courses_for_analysis(db: Session, analysis_id: uuid.UUID) -> tuple[list[dict], list[str]]:
    """FR-001..FR-008. Returns (recommendations grouped by course, unmatched_gaps)."""
    from backend.src.models import Competency

    gaps = db.execute(
        select(SkillGap).where(SkillGap.analysis_id == analysis_id).order_by(SkillGap.rank)
    ).scalars().all()

    # Task 2's course_recommendations PK includes gap_id — one row per (gap, course) match, even
    # though FR-008 groups them into one recommendation per course at the API layer.
    db.execute(delete(CourseRecommendation).where(CourseRecommendation.analysis_id == analysis_id))

    unmatched_gaps: list[str] = []
    # course_id -> {"title", "matched": {competency_id: (name, score)}}
    grouped: dict[str, dict] = {}

    for gap in gaps:
        matches = deterministic_overlap(db, gap.competency_id)
        source = "deterministic"

        if not matches:
            competency = db.get(Competency, gap.competency_id)
            try:
                matches = semantic_fallback(db, gap.competency_id, competency.name, competency.description)
                source = "semantic"
            except Exception as exc:  # research.md §3: log, never raise — deterministic-only result
                logger.warning(
                    "Semantic fallback failed for competency %s (gap %s): %s", gap.competency_id, gap.id, exc
                )
                matches = []

        if not matches:
            unmatched_gaps.append(gap.competency_id)
            continue

        course_id, score = matches[0]
        course = db.get(Course, course_id)
        competency = db.get(Competency, gap.competency_id)

        db.add(
            CourseRecommendation(
                analysis_id=analysis_id,
                gap_id=gap.id,
                course_id=course_id,
                match_reason={"competency_id": gap.competency_id, "competency_name": competency.name, "source": source},
                match_score=score if source == "semantic" else None,
            )
        )

        entry = grouped.setdefault(course_id, {"title": course.title, "matched": {}, "score": None})
        entry["matched"][gap.competency_id] = competency.name
        if source == "semantic":
            entry["score"] = score  # deterministic matches leave match_score unset (FR-003's spirit:
            # semantic scoring never implied to outrank an exact match)

    db.commit()

    recommendations = []
    for course_id, entry in grouped.items():
        matched_names = list(entry["matched"].values())
        match_reason = "Covers: " + "  ".join(f"✓ {name}" for name in matched_names)
        recommendations.append(
            {
                "course_id": course_id,
                "title": entry["title"],
                "matched_gaps": list(entry["matched"].keys()),
                "match_reason": match_reason,
                "match_score": entry["score"],
            }
        )

    return recommendations, unmatched_gaps
