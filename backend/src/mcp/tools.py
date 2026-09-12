"""
Phase 2 — LLM + MCP Layer: the controlled tool layer's actual read-oriented functions.

Every function here: (1) takes exactly the typed request model from backend/src/schemas/mcp.py,
(2) returns exactly the typed result model or raises MCPToolError, (3) performs read-only queries
only — no tool writes to the database, (4) never accepts or constructs raw SQL, a file path, or a
shell command from its input (CLAUDE.md Rule 13 / contracts/mcp-tools.md).

FALLBACK RULE (Rule 10): every application-code call site that uses one of these functions must
catch MCPToolError and fall back to calling the underlying service/query function directly — the
same function this tool wraps — so a defect isolated to this layer never blocks the golden path.
This module is never the *only* path to any piece of data it exposes.

Deliberately has NO top-level import of backend.src.services.assessment_engine (or any other
service module that will, in a later phase, import *this* module) — get_assessment_context below
re-implements its own small, self-contained copy of the competency-routing logic rather than
importing assessment_engine.select_next_competency(), specifically to avoid a circular import once
Phase 3 wires assessment_engine.py to call into this module. If assessment_engine.py's own routing
constants/logic ever change, this copy must be updated to match — see the constants below.
"""

from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.src.models import (
    AssessmentSession,
    Candidate,
    CandidateSkill,
    Competency,
    CourseRecommendation,
    Question,
    Role,
    RoleCompetency,
    SkillEvidence,
    SkillGap,
)
from backend.src.schemas.mcp import (
    AssessmentContextRequest,
    AssessmentContextResult,
    CandidateProfileRequest,
    CandidateProfileResult,
    CandidateSkillItem,
    CompetencyFrameworkRequest,
    CompetencyFrameworkResult,
    CompetencyItem,
    CourseRecommendationItem,
    CourseRecommendationsRequest,
    CourseRecommendationsResult,
    GapAnalysisRequest,
    GapAnalysisResult,
    PreviousQuestionsRequest,
    PreviousQuestionsResult,
    RelevantEvidenceRequest,
    RelevantEvidenceResult,
    RoleRequirementsRequest,
    SkillEvidenceItem,
    SkillEvidenceRequest,
    SkillEvidenceResult,
    SkillGapItem,
    TargetRoleRequest,
    TargetRoleResult,
)

# Mirrors backend/src/services/assessment_engine.py's own constants (research.md/this module's
# docstring) — kept duplicated deliberately to avoid a circular import; must be updated together.
_START_DIFFICULTY = 2
_MAX_QUESTIONS_PER_COMPETENCY = 3
_CONFIDENCE_THRESHOLD = 0.75


class MCPToolError(RuntimeError):
    """Raised by every tool in this module on any error condition (contracts/mcp-tools.md). Never
    a raw exception, never a silently-empty success result standing in for an error."""

    def __init__(self, tool_name: str, reason: str, message: str | None = None):
        self.tool_name = tool_name
        self.reason = reason
        super().__init__(message or f"{tool_name}: {reason}")


def get_candidate_profile(db: Session, request: CandidateProfileRequest) -> CandidateProfileResult:
    candidate = db.get(Candidate, request.candidate_id)
    if candidate is None:
        raise MCPToolError("get_candidate_profile", "not_found", f"Candidate {request.candidate_id} not found")

    skills = db.execute(
        select(CandidateSkill).where(CandidateSkill.candidate_id == request.candidate_id)
    ).scalars().all()
    return CandidateProfileResult(
        candidate_id=request.candidate_id,
        skills=[
            CandidateSkillItem(
                competency_id=s.competency_id,
                resume_estimated_level=s.resume_estimated_level,
                resume_confidence=s.resume_confidence,
                evidence_snippet=s.evidence_snippet,
            )
            for s in skills
        ],
    )


def _build_target_role_result(db: Session, role_id: str, tool_name: str) -> TargetRoleResult:
    role = db.get(Role, role_id)
    if role is None:
        raise MCPToolError(tool_name, "not_found", f"Role {role_id!r} not found")

    # Reuses backend/src/api/roles.py::build_role_detail()'s query, not duplicated — imported
    # locally (not at module top) to avoid importing the api package into the mcp package at
    # import time for no reason beyond this one call.
    from backend.src.api.roles import build_role_detail

    detail = build_role_detail(role, db)
    return TargetRoleResult(
        role_id=detail.id,
        role_name=detail.name,
        required_competencies=detail.required_competencies,
    )


def get_target_role(db: Session, request: TargetRoleRequest) -> TargetRoleResult:
    return _build_target_role_result(db, request.role_id, "get_target_role")


def get_role_requirements(db: Session, request: RoleRequirementsRequest) -> TargetRoleResult:
    return _build_target_role_result(db, request.role_id, "get_role_requirements")


def get_competency_framework(db: Session, request: CompetencyFrameworkRequest) -> CompetencyFrameworkResult:
    query = select(Competency)
    if request.competency_ids is not None:
        query = query.where(Competency.id.in_(request.competency_ids))
    competencies = db.execute(query).scalars().all()
    return CompetencyFrameworkResult(
        competencies=[
            CompetencyItem(
                id=c.id, name=c.name, description=c.description, parent_competency_id=c.parent_competency_id
            )
            for c in competencies
        ]
    )


def _role_competencies(db: Session, role_id: str) -> list[RoleCompetency]:
    return list(db.execute(select(RoleCompetency).where(RoleCompetency.role_id == role_id)).scalars().all())


def _select_next_competency_id(db: Session, session: AssessmentSession) -> str | None:
    """Self-contained copy of assessment_engine.select_next_competency()'s routing logic (see
    module docstring for why this isn't a shared import)."""
    role_competencies = {rc.competency_id: rc for rc in _role_competencies(db, session.target_role_id)}
    evidence_rows = db.execute(select(SkillEvidence).where(SkillEvidence.session_id == session.id)).scalars().all()

    best_id: str | None = None
    best_score = -1.0
    best_questions_answered = float("inf")
    for evidence in evidence_rows:
        is_resolved = (
            evidence.confidence_state >= _CONFIDENCE_THRESHOLD
            or evidence.questions_answered >= _MAX_QUESTIONS_PER_COMPETENCY
        )
        if is_resolved:
            continue
        rc = role_competencies.get(evidence.competency_id)
        if rc is None:
            continue
        priority_weight = 1.0 / rc.priority
        score = (1.0 - evidence.confidence_state) * priority_weight
        if score > best_score or (score == best_score and evidence.questions_answered < best_questions_answered):
            best_id = evidence.competency_id
            best_score = score
            best_questions_answered = evidence.questions_answered

    return best_id


def get_assessment_context(db: Session, request: AssessmentContextRequest) -> AssessmentContextResult:
    session = db.get(AssessmentSession, request.session_id)
    if session is None:
        raise MCPToolError("get_assessment_context", "not_found", f"Session {request.session_id} not found")

    previous_questions = [
        q.prompt for q in db.execute(select(Question).where(Question.session_id == session.id)).scalars().all()
    ]

    competency_id = _select_next_competency_id(db, session)
    if competency_id is None:
        # Session fully resolved (or every remaining competency exhausted its budget) — per
        # contracts/mcp-tools.md, still return a typed result reflecting the last-probed
        # competency, never an error, so a caller mid-completion doesn't crash on this call.
        last_question = db.execute(
            select(Question).where(Question.session_id == session.id).order_by(Question.sequence_number.desc())
        ).scalars().first()
        if last_question is not None:
            competency_id = last_question.competency_id
        else:
            # Never-probed session (e.g., queried immediately after start()): fall back to the
            # highest-priority role competency as a sane, deterministic default context.
            role_competencies = _role_competencies(db, session.target_role_id)
            if not role_competencies:
                raise MCPToolError(
                    "get_assessment_context", "no_context_available",
                    f"Session {request.session_id} has no role competencies to build context from",
                )
            competency_id = min(role_competencies, key=lambda rc: rc.priority).competency_id

    evidence = db.get(SkillEvidence, {"session_id": session.id, "competency_id": competency_id})
    required_level = next(
        (rc.required_level for rc in _role_competencies(db, session.target_role_id) if rc.competency_id == competency_id),
        0.0,
    )

    return AssessmentContextResult(
        candidate_id=session.candidate_id,
        target_role_id=session.target_role_id,
        target_competency_id=competency_id,
        current_estimated_level=evidence.avg_difficulty if evidence else float(_START_DIFFICULTY),
        required_level=required_level,
        difficulty_level=int(evidence.avg_difficulty) if evidence else _START_DIFFICULTY,
        previous_questions=previous_questions,
        questions_remaining=max(0, session.question_budget - len(previous_questions)),
    )


def get_previous_questions(db: Session, request: PreviousQuestionsRequest) -> PreviousQuestionsResult:
    session = db.get(AssessmentSession, request.session_id)
    if session is None:
        raise MCPToolError("get_previous_questions", "not_found", f"Session {request.session_id} not found")

    questions = [
        q.prompt for q in db.execute(select(Question).where(Question.session_id == session.id)).scalars().all()
    ]
    return PreviousQuestionsResult(questions=questions)


def get_skill_evidence(db: Session, request: SkillEvidenceRequest) -> SkillEvidenceResult:
    session = db.get(AssessmentSession, request.session_id)
    if session is None:
        raise MCPToolError("get_skill_evidence", "not_found", f"Session {request.session_id} not found")

    query = select(SkillEvidence).where(SkillEvidence.session_id == request.session_id)
    if request.competency_id is not None:
        query = query.where(SkillEvidence.competency_id == request.competency_id)
    rows = db.execute(query).scalars().all()
    return SkillEvidenceResult(
        evidence=[
            SkillEvidenceItem(
                competency_id=e.competency_id,
                questions_answered=e.questions_answered,
                correct_count=e.correct_count,
                avg_difficulty=e.avg_difficulty,
                confidence_state=e.confidence_state,
            )
            for e in rows
        ]
    )


def get_gap_analysis(db: Session, request: GapAnalysisRequest) -> GapAnalysisResult:
    from backend.src.models import Analysis

    analysis = db.get(Analysis, request.analysis_id)
    if analysis is None:
        raise MCPToolError("get_gap_analysis", "not_found", f"Analysis {request.analysis_id} not found")

    gaps = db.execute(
        select(SkillGap).where(SkillGap.analysis_id == request.analysis_id).order_by(SkillGap.rank)
    ).scalars().all()
    return GapAnalysisResult(
        gaps=[
            SkillGapItem(
                competency_id=g.competency_id,
                required_level=g.required_level,
                verified_level=g.verified_level,
                gap=g.gap,
                rank=g.rank,
            )
            for g in gaps
        ]
    )


def get_course_recommendations(db: Session, request: CourseRecommendationsRequest) -> CourseRecommendationsResult:
    from backend.src.models import Analysis

    analysis = db.get(Analysis, request.analysis_id)
    if analysis is None:
        raise MCPToolError("get_course_recommendations", "not_found", f"Analysis {request.analysis_id} not found")

    recs = db.execute(
        select(CourseRecommendation).where(CourseRecommendation.analysis_id == request.analysis_id)
    ).scalars().all()

    all_gap_ids = {
        g.id
        for g in db.execute(select(SkillGap).where(SkillGap.analysis_id == request.analysis_id)).scalars().all()
    }
    matched_gap_ids = {r.gap_id for r in recs}
    unmatched_competency_ids = [
        g.competency_id
        for g in db.execute(select(SkillGap).where(SkillGap.analysis_id == request.analysis_id)).scalars().all()
        if g.id not in matched_gap_ids
    ]

    return CourseRecommendationsResult(
        recommendations=[
            CourseRecommendationItem(
                course_id=r.course_id, gap_id=r.gap_id, match_reason=r.match_reason, match_score=r.match_score
            )
            for r in recs
        ],
        unmatched_gaps=unmatched_competency_ids,
    )


def get_relevant_evidence(db: Session, request: RelevantEvidenceRequest) -> RelevantEvidenceResult:
    """Phase 6 (specs/026-phase-6-evidence-rag-mcp): wired to evidence_engine.py's real FAISS
    query. `db` is unused here (evidence retrieval reads the persisted index, not the database)
    but kept in the signature for consistency with every other tool's `(db, request)` shape."""
    from backend.src.services import evidence_engine

    try:
        items = evidence_engine.query(request.query, top_k=request.top_k)
    except evidence_engine.EvidenceIndexUnavailableError as exc:
        raise MCPToolError("get_relevant_evidence", "index_unavailable", str(exc)) from exc

    return RelevantEvidenceResult(items=[item.model_dump() for item in items])
