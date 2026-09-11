"""
Pydantic response schemas for Task 3's five reference-data endpoints.

Field names and nesting match specs/004-task-3-backend-api-foundation/contracts/api.md's JSON
examples exactly (FR-007) — this shape is the frozen contract every later phase (Tasks 4-10's own
endpoints, and eventually the frontend in Task 11+) builds against.
"""

from __future__ import annotations

from pydantic import BaseModel


class HealthStatus(BaseModel):
    status: str  # "ok" | "degraded"
    database: str  # "connected" | "unreachable"
    detail: str | None = None


class RoleSummary(BaseModel):
    id: str
    name: str
    description: str


class RequiredCompetency(BaseModel):
    competency_id: str
    name: str
    required_level: float
    priority: int


class RoleDetail(RoleSummary):
    required_competencies: list[RequiredCompetency]


class CompetencySummary(BaseModel):
    id: str
    name: str
    description: str
    parent_competency_id: str | None = None


class CourseSummary(BaseModel):
    id: str
    title: str
    description: str
    provider: str
    level: str
    duration_hours: float
    competencies_covered: list[str]
