"""
Assessment, scoring, gap, recommendation, and learning-path tables (Task 2 — Database Foundation,
data-model.md's remaining 9 tables). All populated at runtime by Tasks 6-10; never touched by
Task 2's reference-data seeding.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from backend.src.models.base import Base


class AssessmentSession(Base):
    """Table name `assessments`, per total_buildplan.md §6 — id doubles as the API's session_id."""

    __tablename__ = "assessments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    candidate_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("candidates.id"), nullable=False, index=True
    )
    target_role_id: Mapped[str] = mapped_column(
        String, ForeignKey("roles.id"), nullable=False, index=True
    )
    status: Mapped[str] = mapped_column(String, nullable=False, index=True)  # in_progress | completed | abandoned
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    question_budget: Mapped[int] = mapped_column(Integer, nullable=False, default=10)


class Question(Base):
    __tablename__ = "questions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("assessments.id"), nullable=False, index=True
    )
    competency_id: Mapped[str] = mapped_column(
        String, ForeignKey("competencies.id"), nullable=False, index=True
    )
    type: Mapped[str] = mapped_column(String, nullable=False, default="mcq")
    prompt: Mapped[str] = mapped_column(Text, nullable=False)
    options: Mapped[list] = mapped_column(JSONB, nullable=False)
    correct_answer_index: Mapped[int] = mapped_column(Integer, nullable=False)
    difficulty: Mapped[int] = mapped_column(Integer, nullable=False)  # 1-5
    explanation: Mapped[str] = mapped_column(Text, nullable=False)
    source: Mapped[str] = mapped_column(String, nullable=False)  # mistral | seed
    sequence_number: Mapped[int] = mapped_column(Integer, nullable=False)


class Answer(Base):
    __tablename__ = "answers"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    question_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("questions.id"), nullable=False, index=True
    )
    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("assessments.id"), nullable=False, index=True
    )
    selected_index: Mapped[int] = mapped_column(Integer, nullable=False)
    is_correct: Mapped[bool] = mapped_column(Boolean, nullable=False)
    answered_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class SkillEvidence(Base):
    __tablename__ = "skill_evidence"

    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("assessments.id"), primary_key=True, index=True
    )
    competency_id: Mapped[str] = mapped_column(String, ForeignKey("competencies.id"), primary_key=True)
    questions_answered: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    correct_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    avg_difficulty: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    confidence_state: Mapped[float] = mapped_column(Float, nullable=False, default=0)  # 0-1


class VerifiedSkillScore(Base):
    __tablename__ = "verified_skill_scores"

    candidate_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("candidates.id"), primary_key=True, index=True
    )
    competency_id: Mapped[str] = mapped_column(String, ForeignKey("competencies.id"), primary_key=True)
    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("assessments.id"), primary_key=True, index=True
    )
    resume_estimated_level: Mapped[float | None] = mapped_column(Float, nullable=True)
    resume_confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    verified_level: Mapped[float] = mapped_column(Float, nullable=False)
    verified_confidence: Mapped[float] = mapped_column(Float, nullable=False)  # 0-1
    computed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class Analysis(Base):
    __tablename__ = "analyses"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    candidate_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("candidates.id"), nullable=False, index=True
    )
    target_role_id: Mapped[str] = mapped_column(
        String, ForeignKey("roles.id"), nullable=False, index=True
    )
    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("assessments.id"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class SkillGap(Base):
    __tablename__ = "skill_gaps"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    analysis_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("analyses.id"), nullable=False, index=True
    )
    competency_id: Mapped[str] = mapped_column(
        String, ForeignKey("competencies.id"), nullable=False, index=True
    )
    required_level: Mapped[float] = mapped_column(Float, nullable=False)
    verified_level: Mapped[float] = mapped_column(Float, nullable=False)
    gap: Mapped[float] = mapped_column(Float, nullable=False)
    rank: Mapped[int] = mapped_column(Integer, nullable=False)


class CourseRecommendation(Base):
    __tablename__ = "course_recommendations"

    analysis_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("analyses.id"), primary_key=True, index=True
    )
    gap_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("skill_gaps.id"), primary_key=True)
    course_id: Mapped[str] = mapped_column(String, ForeignKey("courses.id"), primary_key=True)
    match_reason: Mapped[dict] = mapped_column(JSONB, nullable=False)
    match_score: Mapped[float | None] = mapped_column(Float, nullable=True)


class LearningPath(Base):
    __tablename__ = "learning_paths"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    analysis_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("analyses.id"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    # Task 10: gaps with no matched course (Task 9's unmatched_gaps) must survive a GET replay
    # unchanged (contracts/api.md — "same shape... across repeated calls"), so it is persisted here
    # rather than recomputed on every read.
    gaps_without_courses: Mapped[list | None] = mapped_column(JSONB, nullable=True)


class LearningPathStep(Base):
    __tablename__ = "learning_path_steps"

    learning_path_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("learning_paths.id"), primary_key=True, index=True
    )
    step_number: Mapped[int] = mapped_column(Integer, primary_key=True)
    course_id: Mapped[str] = mapped_column(String, ForeignKey("courses.id"), nullable=False)
    gap_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("skill_gaps.id"), nullable=False)
    rationale: Mapped[str | None] = mapped_column(Text, nullable=True)
