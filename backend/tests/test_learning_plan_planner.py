"""
Phase 6 (Evidence + RAG + MCP), User Story 1 — tests for
backend/src/services/learning_plan_planner.py.

Mocks mistral_client.generate_grounded_plan_explanations() to keep these tests deterministic and
independent of the live (rate-limited) Mistral API — the fabricated-reference-stripped test
(test_fabricated_evidence_reference_is_stripped_before_display) is the single most important test
in this whole initiative: it's the direct proof of the project's core new explainability claim.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from unittest.mock import patch

import pytest

from backend.src.db import SessionLocal
from backend.src.models import Analysis, Candidate, SkillGap
from backend.src.services import assessment_engine, learning_plan_planner


@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def analysis_with_one_gap_and_course(db):
    """A real Analysis with one SkillGap + matching CourseRecommendation for a real curated
    competency/course (sql / sql-foundations-01), so learning_path_engine's real deterministic
    logic has something to build a plan from."""
    candidate_id = uuid.uuid4()
    db.add(Candidate(id=candidate_id, source="demo", resume_filename=None, target_role_id=None, created_at=datetime.now(UTC)))
    db.commit()
    session = assessment_engine.start_session(db, candidate_id, "role-sso-01")

    analysis = Analysis(
        id=uuid.uuid4(), candidate_id=candidate_id, target_role_id="role-sso-01",
        session_id=session.id, created_at=datetime.now(UTC),
    )
    db.add(analysis)
    db.add(SkillGap(id=uuid.uuid4(), analysis_id=analysis.id, competency_id="sql", required_level=4.0, verified_level=2.0, gap=2.0, rank=1))
    db.commit()
    return analysis


def test_grounded_explanation_with_only_real_citations_is_kept_verbatim(db, analysis_with_one_gap_and_course):
    """Given a mocked Mistral response that cites only evidence ids it was actually given, the
    grounding validator must keep the explanation and report grounded=True with no removed claims."""

    def fake_generate(steps_with_evidence):
        step = steps_with_evidence[0]
        real_evidence_id = step["evidence"][0]["id"] if step["evidence"] else "competency:sql"
        return {
            step["step_number"]: {
                "explanation": "This course builds core SQL skills needed for the target role.",
                "referenced_evidence_ids": [real_evidence_id],
            }
        }

    with patch("backend.src.services.mistral_client.generate_grounded_plan_explanations", side_effect=fake_generate):
        result = learning_plan_planner.build_grounded_learning_path(db, analysis_with_one_gap_and_course.id)

    assert result["grounding"] is not None
    assert result["grounding"]["grounded"] is True
    assert result["grounding"]["removed_claims"] == []
    assert result["steps"][0]["rationale"] == "This course builds core SQL skills needed for the target role."


def test_fabricated_evidence_reference_is_stripped_before_display(db, analysis_with_one_gap_and_course):
    """FR-005/SC-001 — the single most important test in this initiative: a citation Mistral makes
    up (an evidence id it was never given for this step) must be stripped and recorded in
    removed_claims, never silently left in as if it were real."""

    def fake_generate(steps_with_evidence):
        step = steps_with_evidence[0]
        return {
            step["step_number"]: {
                "explanation": "This course was rated #1 by a fictional review board.",
                "referenced_evidence_ids": ["course:totally-fabricated-course-id-999"],
            }
        }

    with patch("backend.src.services.mistral_client.generate_grounded_plan_explanations", side_effect=fake_generate):
        result = learning_plan_planner.build_grounded_learning_path(db, analysis_with_one_gap_and_course.id)

    assert result["grounding"] is not None
    assert result["grounding"]["grounded"] is False
    assert "course:totally-fabricated-course-id-999" in result["grounding"]["removed_claims"]
    assert "course:totally-fabricated-course-id-999" not in result["grounding"]["supported_claims"]


def test_step_ordering_is_never_changed_by_the_planner(db, analysis_with_one_gap_and_course):
    """FR-006/SC-004: the grounded planner must never reorder steps — it only attaches an
    explanation to each step the deterministic engine already ordered."""
    from backend.src.services import learning_path_engine

    deterministic_result = learning_path_engine.build_learning_path(db, analysis_with_one_gap_and_course.id)
    deterministic_order = [s["step_number"] for s in deterministic_result["steps"]]

    with patch("backend.src.services.mistral_client.generate_grounded_plan_explanations", return_value={}):
        grounded_result = learning_plan_planner.build_grounded_learning_path(db, analysis_with_one_gap_and_course.id)

    grounded_order = [s["step_number"] for s in grounded_result["steps"]]
    assert grounded_order == deterministic_order


def test_falls_back_to_deterministic_plan_when_mistral_unavailable(db, analysis_with_one_gap_and_course):
    """FR-007/SC-003: when the grounded explanation call fails (returns {} per its own best-effort
    contract), the caller still gets a valid, usable plan — just with grounding=None."""
    with patch("backend.src.services.mistral_client.generate_grounded_plan_explanations", return_value={}):
        result = learning_plan_planner.build_grounded_learning_path(db, analysis_with_one_gap_and_course.id)

    assert result["grounding"] is None
    assert len(result["steps"]) > 0
    assert result["steps"][0]["course_id"] is not None


def test_falls_back_to_deterministic_plan_when_evidence_retrieval_unavailable(db, analysis_with_one_gap_and_course):
    """FR-007: evidence retrieval failing (index unavailable) must also fall back gracefully."""
    from backend.src.mcp.tools import MCPToolError

    with patch(
        "backend.src.mcp.tools.get_relevant_evidence",
        side_effect=MCPToolError("get_relevant_evidence", "index_unavailable"),
    ):
        result = learning_plan_planner.build_grounded_learning_path(db, analysis_with_one_gap_and_course.id)

    assert result["grounding"] is None
    assert len(result["steps"]) > 0
