"""
Phase 2 — LLM + MCP Layer: MCP server registration.

Runs in-process within this same FastAPI application (research.md's decision) — there is exactly
one client (this backend's own application code, in Phase 3/6), and it calls the functions in
tools.py directly with its own already-open SQLAlchemy Session, never through this server object's
transport. This module exists so the tool layer is genuinely registered as MCP tools (typed,
discoverable, schema-validated) rather than just being a service module under a different name —
each registered wrapper here opens its own short-lived DB session, matching what an actual external
MCP client (stdio/SSE) would need if one is ever added later, without requiring one now.
"""

from __future__ import annotations

from backend.src.db import SessionLocal
from backend.src.mcp import tools
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

try:
    from mcp.server.mcpserver import MCPServer
except ModuleNotFoundError as exc:  # pragma: no cover - dependency is required, per requirements.txt
    raise ModuleNotFoundError(
        "The 'mcp' package is required for backend/src/mcp/server.py — add it to requirements.txt "
        "and `pip install mcp` (Phase 2 task T001)."
    ) from exc

mcp_server = MCPServer(
    name="ingenium-mcp",
    version="0.1.0",
    description=(
        "Ingenium's controlled tool layer: read-oriented, schema-validated access to candidate, "
        "role, competency, assessment, gap, course, and evidence data for the LLM. Never exposes "
        "arbitrary SQL, filesystem, or shell access (CLAUDE.md Rule 13)."
    ),
)


def _with_session(fn, request):
    db = SessionLocal()
    try:
        return fn(db, request)
    finally:
        db.close()


@mcp_server.tool(name="get_candidate_profile", description="Look up a candidate's resume-derived skill profile.")
def get_candidate_profile(candidate_id: str):
    return _with_session(tools.get_candidate_profile, CandidateProfileRequest(candidate_id=candidate_id))


@mcp_server.tool(name="get_target_role", description="Look up a role's id, name, and required competencies.")
def get_target_role(role_id: str):
    return _with_session(tools.get_target_role, TargetRoleRequest(role_id=role_id))


@mcp_server.tool(name="get_role_requirements", description="Alias of get_target_role — same data, per the master document's tool naming.")
def get_role_requirements(role_id: str):
    return _with_session(tools.get_role_requirements, RoleRequirementsRequest(role_id=role_id))


@mcp_server.tool(name="get_competency_framework", description="Look up the static competency framework, optionally filtered to specific ids.")
def get_competency_framework(competency_ids: list[str] | None = None):
    return _with_session(tools.get_competency_framework, CompetencyFrameworkRequest(competency_ids=competency_ids))


@mcp_server.tool(name="get_assessment_context", description="Look up the controlled context for generating the next assessment question in a session.")
def get_assessment_context(session_id: str):
    return _with_session(tools.get_assessment_context, AssessmentContextRequest(session_id=session_id))


@mcp_server.tool(name="get_previous_questions", description="Look up the question text already asked in an assessment session.")
def get_previous_questions(session_id: str):
    return _with_session(tools.get_previous_questions, PreviousQuestionsRequest(session_id=session_id))


@mcp_server.tool(name="get_skill_evidence", description="Look up accumulated per-competency evidence for an assessment session.")
def get_skill_evidence(session_id: str, competency_id: str | None = None):
    return _with_session(
        tools.get_skill_evidence, SkillEvidenceRequest(session_id=session_id, competency_id=competency_id)
    )


@mcp_server.tool(name="get_gap_analysis", description="Look up the ranked skill gaps for a completed analysis.")
def get_gap_analysis(analysis_id: str):
    return _with_session(tools.get_gap_analysis, GapAnalysisRequest(analysis_id=analysis_id))


@mcp_server.tool(name="get_course_recommendations", description="Look up the course recommendations for a completed analysis.")
def get_course_recommendations(analysis_id: str):
    return _with_session(tools.get_course_recommendations, CourseRecommendationsRequest(analysis_id=analysis_id))


@mcp_server.tool(name="get_relevant_evidence", description="Retrieve grounding evidence relevant to a query (Phase 6).")
def get_relevant_evidence(query: str, top_k: int = 5):
    return _with_session(tools.get_relevant_evidence, RelevantEvidenceRequest(query=query, top_k=top_k))
