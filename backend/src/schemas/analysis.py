"""Pydantic schemas for Task 8 — Skill Gap Engine. Field names match contracts/api.md exactly."""

from __future__ import annotations

import uuid

from pydantic import BaseModel


class AnalysisRequest(BaseModel):
    candidate_id: uuid.UUID
    target_role_id: str


class AnalysisResponse(BaseModel):
    analysis_id: uuid.UUID
    candidate_id: uuid.UUID
    target_role_id: str


class SkillGapItem(BaseModel):
    competency_id: str
    competency_name: str
    required_level: float
    verified_level: float
    gap: float
    rank: int


class GapsResponse(BaseModel):
    analysis_id: uuid.UUID
    gaps: list[SkillGapItem]


class CourseRecommendationItem(BaseModel):
    course_id: str
    title: str
    matched_gaps: list[str]
    match_reason: str
    match_score: float | None = None


class CoursesResponse(BaseModel):
    analysis_id: uuid.UUID
    recommendations: list[CourseRecommendationItem]
    unmatched_gaps: list[str]
