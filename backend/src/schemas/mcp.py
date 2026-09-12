"""
Phase 2 (LLM + MCP Layer) — typed request/result schemas for every MCP tool.

Every tool's input and output is one of these Pydantic models (data-model.md). Schema-validated in
both directions — a tool never returns an un-validated dict (Rule 5's spirit extended to the
controlled-access layer itself, not just Mistral's own responses).
"""

from __future__ import annotations

import uuid

from pydantic import BaseModel

from backend.src.schemas.reference import RequiredCompetency


class CandidateProfileRequest(BaseModel):
    candidate_id: uuid.UUID


class CandidateSkillItem(BaseModel):
    competency_id: str
    resume_estimated_level: float | None = None
    resume_confidence: float | None = None
    evidence_snippet: str | None = None


class CandidateProfileResult(BaseModel):
    candidate_id: uuid.UUID
    skills: list[CandidateSkillItem]


class TargetRoleRequest(BaseModel):
    role_id: str


class RoleRequirementsRequest(BaseModel):
    role_id: str


class TargetRoleResult(BaseModel):
    role_id: str
    role_name: str
    required_competencies: list[RequiredCompetency]


class CompetencyFrameworkRequest(BaseModel):
    competency_ids: list[str] | None = None


class CompetencyItem(BaseModel):
    id: str
    name: str
    description: str
    parent_competency_id: str | None = None


class CompetencyFrameworkResult(BaseModel):
    competencies: list[CompetencyItem]


class AssessmentContextRequest(BaseModel):
    session_id: uuid.UUID


class AssessmentContextResult(BaseModel):
    candidate_id: uuid.UUID
    target_role_id: str
    target_competency_id: str
    current_estimated_level: float
    required_level: float
    difficulty_level: int
    previous_questions: list[str]
    questions_remaining: int


class PreviousQuestionsRequest(BaseModel):
    session_id: uuid.UUID


class PreviousQuestionsResult(BaseModel):
    questions: list[str]


class SkillEvidenceRequest(BaseModel):
    session_id: uuid.UUID
    competency_id: str | None = None


class SkillEvidenceItem(BaseModel):
    competency_id: str
    questions_answered: int
    correct_count: int
    avg_difficulty: float
    confidence_state: float


class SkillEvidenceResult(BaseModel):
    evidence: list[SkillEvidenceItem]


class GapAnalysisRequest(BaseModel):
    analysis_id: uuid.UUID


class SkillGapItem(BaseModel):
    competency_id: str
    required_level: float
    verified_level: float
    gap: float
    rank: int


class GapAnalysisResult(BaseModel):
    gaps: list[SkillGapItem]


class CourseRecommendationsRequest(BaseModel):
    analysis_id: uuid.UUID


class CourseRecommendationItem(BaseModel):
    course_id: str
    gap_id: uuid.UUID
    match_reason: dict
    match_score: float | None = None


class CourseRecommendationsResult(BaseModel):
    recommendations: list[CourseRecommendationItem]
    unmatched_gaps: list[str]


class RelevantEvidenceRequest(BaseModel):
    query: str
    top_k: int = 5


class RelevantEvidenceResult(BaseModel):
    # backend.src.schemas.evidence.EvidenceItem is Phase 6's own type (specs/026's data-model.md);
    # imported lazily inside evidence_engine.py's real implementation to avoid this schema module
    # depending on Phase 6 before it exists. Declared here as `list[dict]` for Phase 2's stub —
    # Phase 6 tightens this to `list[EvidenceItem]` once that type exists.
    items: list[dict]


__all__ = [
    "CandidateProfileRequest",
    "CandidateSkillItem",
    "CandidateProfileResult",
    "TargetRoleRequest",
    "RoleRequirementsRequest",
    "TargetRoleResult",
    "CompetencyFrameworkRequest",
    "CompetencyItem",
    "CompetencyFrameworkResult",
    "AssessmentContextRequest",
    "AssessmentContextResult",
    "PreviousQuestionsRequest",
    "PreviousQuestionsResult",
    "SkillEvidenceRequest",
    "SkillEvidenceItem",
    "SkillEvidenceResult",
    "GapAnalysisRequest",
    "SkillGapItem",
    "GapAnalysisResult",
    "CourseRecommendationsRequest",
    "CourseRecommendationItem",
    "CourseRecommendationsResult",
    "RelevantEvidenceRequest",
    "RelevantEvidenceResult",
]
