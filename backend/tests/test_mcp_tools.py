"""
Phase 2 (LLM + MCP Layer) — tests for backend/src/mcp/tools.py.

Runs against the real Postgres dev DB (via backend.src.db.SessionLocal), reusing whatever
reference data (roles/competencies) is already seeded — consistent with how the rest of this
project's tests/live verification work in this session. No live Mistral call is involved: every
tool here is read-only and database-backed only.
"""

from __future__ import annotations

import uuid

import pytest

from backend.src.db import SessionLocal
from backend.src.mcp import tools
from backend.src.mcp.tools import MCPToolError
from backend.src.models import Candidate, CandidateSkill
from backend.src.schemas.mcp import (
    AssessmentContextRequest,
    CandidateProfileRequest,
    CompetencyFrameworkRequest,
    CourseRecommendationsRequest,
    GapAnalysisRequest,
    PreviousQuestionsRequest,
    RelevantEvidenceRequest,
    RoleRequirementsRequest,
    SkillEvidenceRequest,
    TargetRoleRequest,
)


@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def demo_candidate(db):
    """A real Candidate + CandidateSkill row, matching how backend/src/api/candidates.py's
    /candidates/demo endpoint creates one — used to test the success path of
    get_candidate_profile without depending on a live HTTP call."""
    candidate_id = uuid.uuid4()
    candidate = Candidate(id=candidate_id, source="demo", resume_filename=None, target_role_id=None)
    from datetime import UTC, datetime

    candidate.created_at = datetime.now(UTC)
    db.add(candidate)
    db.add(
        CandidateSkill(
            candidate_id=candidate_id,
            competency_id="sql",
            resume_estimated_level=2.5,
            resume_confidence=0.6,
            evidence_snippet="Wrote SQL queries.",
        )
    )
    db.commit()
    return candidate_id


# --- Not-found / typed-error tests (contracts/mcp-tools.md's error-case column) ---


def test_get_candidate_profile_unknown_id_raises_typed_error(db):
    with pytest.raises(MCPToolError) as exc_info:
        tools.get_candidate_profile(db, CandidateProfileRequest(candidate_id=uuid.uuid4()))
    assert exc_info.value.reason == "not_found"
    assert exc_info.value.tool_name == "get_candidate_profile"


def test_get_target_role_unknown_id_raises_typed_error(db):
    with pytest.raises(MCPToolError) as exc_info:
        tools.get_target_role(db, TargetRoleRequest(role_id="not-a-real-role"))
    assert exc_info.value.reason == "not_found"


def test_get_role_requirements_unknown_id_raises_typed_error(db):
    with pytest.raises(MCPToolError) as exc_info:
        tools.get_role_requirements(db, RoleRequirementsRequest(role_id="not-a-real-role"))
    assert exc_info.value.reason == "not_found"


def test_get_assessment_context_unknown_session_raises_typed_error(db):
    with pytest.raises(MCPToolError) as exc_info:
        tools.get_assessment_context(db, AssessmentContextRequest(session_id=uuid.uuid4()))
    assert exc_info.value.reason == "not_found"


def test_get_previous_questions_unknown_session_raises_typed_error(db):
    with pytest.raises(MCPToolError) as exc_info:
        tools.get_previous_questions(db, PreviousQuestionsRequest(session_id=uuid.uuid4()))
    assert exc_info.value.reason == "not_found"


def test_get_skill_evidence_unknown_session_raises_typed_error(db):
    with pytest.raises(MCPToolError) as exc_info:
        tools.get_skill_evidence(db, SkillEvidenceRequest(session_id=uuid.uuid4()))
    assert exc_info.value.reason == "not_found"


def test_get_gap_analysis_unknown_id_raises_typed_error(db):
    with pytest.raises(MCPToolError) as exc_info:
        tools.get_gap_analysis(db, GapAnalysisRequest(analysis_id=uuid.uuid4()))
    assert exc_info.value.reason == "not_found"


def test_get_course_recommendations_unknown_id_raises_typed_error(db):
    with pytest.raises(MCPToolError) as exc_info:
        tools.get_course_recommendations(db, CourseRecommendationsRequest(analysis_id=uuid.uuid4()))
    assert exc_info.value.reason == "not_found"


def test_get_relevant_evidence_always_raises_index_unavailable_this_phase(db):
    """FR (Phase 2 spec): get_relevant_evidence is stubbed until Phase 6 wires it up."""
    with pytest.raises(MCPToolError) as exc_info:
        tools.get_relevant_evidence(db, RelevantEvidenceRequest(query="SQL window functions"))
    assert exc_info.value.reason == "index_unavailable"


# --- Success-path / scoping tests (User Story 1: only declared fields, no leakage) ---


def test_get_candidate_profile_returns_only_this_candidates_skills(db, demo_candidate):
    result = tools.get_candidate_profile(db, CandidateProfileRequest(candidate_id=demo_candidate))
    assert result.candidate_id == demo_candidate
    assert len(result.skills) == 1
    assert result.skills[0].competency_id == "sql"
    assert result.skills[0].evidence_snippet == "Wrote SQL queries."
    # Only the fields CandidateSkillItem declares — no raw ORM object, no other candidate's data.
    assert set(result.skills[0].model_dump().keys()) == {
        "competency_id", "resume_estimated_level", "resume_confidence", "evidence_snippet",
    }


def test_get_competency_framework_returns_full_framework_by_default(db):
    result = tools.get_competency_framework(db, CompetencyFrameworkRequest(competency_ids=None))
    assert len(result.competencies) > 0
    assert any(c.id == "sql" for c in result.competencies)


def test_get_competency_framework_filters_when_ids_given(db):
    result = tools.get_competency_framework(db, CompetencyFrameworkRequest(competency_ids=["sql", "python"]))
    returned_ids = {c.id for c in result.competencies}
    assert returned_ids <= {"sql", "python"}
    assert "sql" in returned_ids


def test_get_target_role_matches_roles_api_shape(db):
    result = tools.get_target_role(db, TargetRoleRequest(role_id="role-sso-01"))
    assert result.role_id == "role-sso-01"
    assert len(result.required_competencies) > 0


# --- Fallback-safety test (User Story 3) ---


def test_caller_fallback_pattern_matches_tool_output(db):
    """User Story 3: a caller that catches MCPToolError and calls the same underlying function
    directly (roles.py::build_role_detail, which get_target_role itself wraps) must get output
    equivalent to what the tool would have returned for the same input."""
    from backend.src.api.roles import build_role_detail
    from backend.src.models import Role

    role = db.get(Role, "role-sso-01")
    direct = build_role_detail(role, db)
    via_tool = tools.get_target_role(db, TargetRoleRequest(role_id="role-sso-01"))

    assert via_tool.role_id == direct.id
    assert via_tool.role_name == direct.name
    assert len(via_tool.required_competencies) == len(direct.required_competencies)
