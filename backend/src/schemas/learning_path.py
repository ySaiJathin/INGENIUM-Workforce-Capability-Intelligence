"""Pydantic schemas for Task 10 — Learning Path. Field names match contracts/api.md exactly."""

from __future__ import annotations

import uuid

from pydantic import BaseModel


class LearningPathRequest(BaseModel):
    analysis_id: uuid.UUID


class LearningPathStepItem(BaseModel):
    step_number: int
    course_id: str
    title: str
    addresses_gaps: list[str]
    rationale: str | None = None


class LearningPathResponse(BaseModel):
    learning_path_id: uuid.UUID
    analysis_id: uuid.UUID
    steps: list[LearningPathStepItem]
    gaps_without_courses: list[str]
    message: str | None = None
