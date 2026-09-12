"""
Phase 5 (Course Intelligence) — tests for backend/src/services/course_recommendation_engine.py.

Uses the real Postgres dev DB (matching this project's established testing pattern), with
purpose-built Competency/Course/CourseCompetency/SkillGap fixtures (unique "zz_test_*" ids, so they
never collide with real curated data) for exact control over exact-vs-semantic scenarios.
semantic_fallback() itself is mocked in tests that need a controlled (or absent) semantic result —
real MiniLM similarity on invented test text would be flaky to assert on directly.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from unittest.mock import patch

import pytest

from backend.src.db import SessionLocal
from backend.src.models import (
    Analysis,
    Candidate,
    Competency,
    Course,
    CourseCompetency,
    CourseRecommendation,
    SkillGap,
)
from backend.src.services import assessment_engine, course_recommendation_engine as cre


@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def analysis(db):
    """A real Analysis row tied to a real candidate + role-sso-01 assessment session, matching
    what POST /analysis creates."""
    candidate_id = uuid.uuid4()
    db.add(Candidate(id=candidate_id, source="demo", resume_filename=None, target_role_id=None, created_at=datetime.now(UTC)))
    db.commit()
    session = assessment_engine.start_session(db, candidate_id, "role-sso-01")

    analysis_row = Analysis(
        id=uuid.uuid4(), candidate_id=candidate_id, target_role_id="role-sso-01",
        session_id=session.id, created_at=datetime.now(UTC),
    )
    db.add(analysis_row)
    db.commit()
    return analysis_row


@pytest.fixture
def zz_competencies(db):
    """Two throwaway competencies: one with an exactly-tagged course, one with none."""
    comps = [
        Competency(id="zz_test_exact_comp", name="ZZ Test Exact Competency", description="test", proficiency_scale_max=5),
        Competency(id="zz_test_unmatched_comp", name="ZZ Test Unmatched Competency", description="test", proficiency_scale_max=5),
    ]
    db.add_all(comps)
    db.commit()
    yield comps
    # Cleanup so repeated test runs don't collide on the fixed ids — order matters (children
    # before parents): CourseRecommendation -> SkillGap -> CourseCompetency -> Course -> Competency.
    db.query(CourseRecommendation).filter(CourseRecommendation.course_id.in_(["zz_test_course_1", "zz_test_course_2"])).delete(synchronize_session=False)
    db.query(SkillGap).filter(SkillGap.competency_id.in_(["zz_test_exact_comp", "zz_test_unmatched_comp"])).delete(synchronize_session=False)
    db.query(CourseCompetency).filter(CourseCompetency.competency_id.in_(["zz_test_exact_comp", "zz_test_unmatched_comp"])).delete(synchronize_session=False)
    db.query(Course).filter(Course.id.in_(["zz_test_course_1", "zz_test_course_2"])).delete(synchronize_session=False)
    db.query(Competency).filter(Competency.id.in_(["zz_test_exact_comp", "zz_test_unmatched_comp"])).delete(synchronize_session=False)
    db.commit()


@pytest.fixture
def zz_course(db, zz_competencies):
    """A course exactly tagged to zz_test_exact_comp."""
    course = Course(
        id="zz_test_course_1", title="ZZ Test Course", description="test course",
        provider="Test Provider", level="advanced", duration_hours=5.0, priority=1,
    )
    db.add(course)
    db.add(CourseCompetency(course_id="zz_test_course_1", competency_id="zz_test_exact_comp", coverage_weight=1.0))
    db.commit()
    return course


def _skill_gap(db, analysis_id, competency_id, gap=2.0, rank=1) -> SkillGap:
    row = SkillGap(
        id=uuid.uuid4(), analysis_id=analysis_id, competency_id=competency_id,
        required_level=4.0, verified_level=4.0 - gap, gap=gap, rank=rank,
    )
    db.add(row)
    db.commit()
    return row


def test_exact_match_is_used_and_semantic_fallback_is_never_called(db, analysis, zz_course):
    """FR-004/SC-003: when an exact-tagged course exists for a gap, it's used, and the semantic
    fallback path is never even invoked (deterministic_overlap found something) — the strongest
    possible guarantee that a broader match can never outrank an exact one."""
    _skill_gap(db, analysis.id, "zz_test_exact_comp")

    with patch.object(cre, "semantic_fallback") as mock_semantic:
        recommendations, unmatched = cre.match_courses_for_analysis(db, analysis.id)

    mock_semantic.assert_not_called()
    assert len(recommendations) == 1
    assert recommendations[0]["course_id"] == "zz_test_course_1"
    assert recommendations[0]["match_score"] is None  # deterministic matches leave this unset
    assert unmatched == []


def test_gap_with_no_course_at_all_is_reported_unmatched(db, analysis, zz_competencies):
    """FR-003: no exact match and no semantic match -> reported as unmatched, not paired with an
    unrelated course."""
    _skill_gap(db, analysis.id, "zz_test_unmatched_comp")

    with patch.object(cre, "semantic_fallback", return_value=[]):
        recommendations, unmatched = cre.match_courses_for_analysis(db, analysis.id)

    assert recommendations == []
    assert unmatched == ["zz_test_unmatched_comp"]


def test_semantic_fallback_failure_is_treated_as_unmatched_not_an_error(db, analysis, zz_competencies):
    """FR-006: a raised exception from the semantic fallback must be caught and treated as "no
    match", never propagated as a request-level error."""
    _skill_gap(db, analysis.id, "zz_test_unmatched_comp")

    with patch.object(cre, "semantic_fallback", side_effect=RuntimeError("embedding service down")):
        recommendations, unmatched = cre.match_courses_for_analysis(db, analysis.id)

    assert recommendations == []
    assert unmatched == ["zz_test_unmatched_comp"]


def test_semantic_match_used_only_when_no_exact_match_exists(db, analysis, zz_competencies):
    """FR-004 (the other direction): confirm the semantic path *is* used when no exact match
    exists, and its match_score is populated (distinguishing it from an exact match)."""
    db.add(Course(
        id="zz_test_course_2", title="ZZ Semantic Course", description="semantic",
        provider="Test Provider", level="advanced", duration_hours=3.0, priority=1,
    ))
    db.commit()
    _skill_gap(db, analysis.id, "zz_test_unmatched_comp")

    with patch.object(cre, "semantic_fallback", return_value=[("zz_test_course_2", 0.72)]):
        recommendations, unmatched = cre.match_courses_for_analysis(db, analysis.id)

    assert len(recommendations) == 1
    assert recommendations[0]["course_id"] == "zz_test_course_2"
    assert recommendations[0]["match_score"] == pytest.approx(0.72)
    assert unmatched == []


def test_one_course_covering_two_gaps_appears_once_with_both_listed(db, analysis, zz_course):
    """FR-005/SC-004: a course addressing multiple gaps in one analysis must appear once, listing
    every gap it addresses — never duplicated per gap."""
    db.add(CourseCompetency(course_id="zz_test_course_1", competency_id="zz_test_unmatched_comp", coverage_weight=1.0))
    db.commit()
    _skill_gap(db, analysis.id, "zz_test_exact_comp", rank=1)
    _skill_gap(db, analysis.id, "zz_test_unmatched_comp", rank=2)

    with patch.object(cre, "semantic_fallback") as mock_semantic:
        recommendations, unmatched = cre.match_courses_for_analysis(db, analysis.id)

    mock_semantic.assert_not_called()
    assert len(recommendations) == 1
    assert recommendations[0]["course_id"] == "zz_test_course_1"
    assert set(recommendations[0]["matched_gaps"]) == {"zz_test_exact_comp", "zz_test_unmatched_comp"}
    assert unmatched == []


def test_repeated_calls_on_identical_data_produce_identical_ranking(db, analysis, zz_course):
    """SC-002: deterministic ranking — repeating the same request on unchanged data yields the
    same result."""
    _skill_gap(db, analysis.id, "zz_test_exact_comp")

    with patch.object(cre, "semantic_fallback"):
        first, _ = cre.match_courses_for_analysis(db, analysis.id)
        second, _ = cre.match_courses_for_analysis(db, analysis.id)

    assert first == second
