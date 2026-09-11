"""
All 13 tables from specs/003-task-2-database-foundation/data-model.md, imported here so
Base.metadata sees every one of them when backend/migrations/create_schema.py runs.
"""

from backend.src.models.base import Base
from backend.src.models.reference import (
    Competency,
    Course,
    CourseCompetency,
    Role,
    RoleCompetency,
)
from backend.src.models.candidate import Candidate, CandidateSkill
from backend.src.models.assessment import (
    Analysis,
    Answer,
    AssessmentSession,
    CourseRecommendation,
    LearningPath,
    LearningPathStep,
    Question,
    SkillEvidence,
    SkillGap,
    VerifiedSkillScore,
)

__all__ = [
    "Base",
    "Competency",
    "Course",
    "CourseCompetency",
    "Role",
    "RoleCompetency",
    "Candidate",
    "CandidateSkill",
    "Analysis",
    "Answer",
    "AssessmentSession",
    "CourseRecommendation",
    "LearningPath",
    "LearningPathStep",
    "Question",
    "SkillEvidence",
    "SkillGap",
    "VerifiedSkillScore",
]
