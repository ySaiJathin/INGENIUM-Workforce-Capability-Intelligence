"""Pydantic schemas for Task 10 — Learning Path. Field names match contracts/api.md exactly."""

from __future__ import annotations

import uuid

from pydantic import BaseModel

from backend.src.schemas.evidence import GroundingReport


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
    # Phase 6 (specs/026-phase-6-evidence-rag-mcp): additive field, per data-model.md — non-null
    # (grounded=True, removed_claims small/empty) when the RAG planner succeeded, null when the
    # deterministic-only fallback was used (FR-007). No existing field is renamed/removed, so
    # every existing consumer (frontend/src/pages/LearningPath.tsx) works unchanged either way.
    grounding: GroundingReport | None = None
