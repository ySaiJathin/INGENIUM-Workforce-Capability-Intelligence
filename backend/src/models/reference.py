"""
Reference-data tables (Task 2 — Database Foundation, data-model.md's `competencies`/`roles`/
`role_competencies`/`courses`/`course_competencies` tables). Seeded from Task 1's curated JSON via
backend/src/scripts/seed_reference_data.py; never written to by candidate-facing runtime code.
"""

from __future__ import annotations

from sqlalchemy import Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.src.models.base import Base


class Competency(Base):
    __tablename__ = "competencies"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    parent_competency_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("competencies.id"), nullable=True, index=True
    )
    proficiency_scale_max: Mapped[int] = mapped_column(Integer, nullable=False)
    esco_source_id: Mapped[str | None] = mapped_column(Text, nullable=True)

    parent = relationship("Competency", remote_side=[id])


class Role(Base):
    __tablename__ = "roles"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    esco_occupation_id: Mapped[str | None] = mapped_column(Text, nullable=True)


class RoleCompetency(Base):
    __tablename__ = "role_competencies"

    role_id: Mapped[str] = mapped_column(String, ForeignKey("roles.id"), primary_key=True, index=True)
    competency_id: Mapped[str] = mapped_column(
        String, ForeignKey("competencies.id"), primary_key=True, index=True
    )
    required_level: Mapped[float] = mapped_column(Float, nullable=False)
    priority: Mapped[int] = mapped_column(Integer, nullable=False)


class Course(Base):
    __tablename__ = "courses"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    provider: Mapped[str] = mapped_column(Text, nullable=False)
    level: Mapped[str] = mapped_column(String, nullable=False)  # beginner | intermediate | advanced
    duration_hours: Mapped[float] = mapped_column(Float, nullable=False)
    priority: Mapped[int] = mapped_column(Integer, nullable=False)


class CourseCompetency(Base):
    __tablename__ = "course_competencies"

    course_id: Mapped[str] = mapped_column(String, ForeignKey("courses.id"), primary_key=True, index=True)
    competency_id: Mapped[str] = mapped_column(
        String, ForeignKey("competencies.id"), primary_key=True, index=True
    )
    coverage_weight: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)
