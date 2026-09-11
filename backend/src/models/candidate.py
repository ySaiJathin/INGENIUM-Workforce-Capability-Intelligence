"""
Candidate tables (Task 2 — Database Foundation, data-model.md's `candidates`/`candidate_skills`
tables). Populated by Task 4's resume-processing / demo-candidate endpoints, never by seeding.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from backend.src.models.base import Base


class Candidate(Base):
    __tablename__ = "candidates"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source: Mapped[str] = mapped_column(String, nullable=False)  # resume_upload | demo
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    resume_filename: Mapped[str | None] = mapped_column(Text, nullable=True)
    target_role_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("roles.id"), nullable=True, index=True
    )


class CandidateSkill(Base):
    __tablename__ = "candidate_skills"

    candidate_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("candidates.id"), primary_key=True, index=True
    )
    competency_id: Mapped[str] = mapped_column(String, ForeignKey("competencies.id"), primary_key=True)
    resume_estimated_level: Mapped[float] = mapped_column(Float, nullable=False)
    resume_confidence: Mapped[float] = mapped_column(Float, nullable=False)  # 0-1
    evidence_snippet: Mapped[str | None] = mapped_column(Text, nullable=True)
