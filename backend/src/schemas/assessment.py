"""
Pydantic schemas for Task 6 — Adaptive Assessment Engine.

AdaptiveQuestionResponse is Mistral's contract (total_buildplan.md §27.4) — field names taken
verbatim from that section, not this project's own design choice.

Everything else matches specs/007-task-6-adaptive-assessment-engine/contracts/api.md's candidate/
frontend-facing shapes exactly.
"""

from __future__ import annotations

import uuid
from typing import Literal

from pydantic import BaseModel


class AdaptiveQuestionResponse(BaseModel):
    """§27.4 Operation C response — validated before any further processing (Rule 5)."""

    question_id: str
    competency_id: str
    competency_name: str
    difficulty_level: int
    question_type: Literal["MCQ"] = "MCQ"
    question: str
    options: list[str]
    correct_answer: str
    explanation: str
    assessment_signal: str = ""


# --- API-facing (contracts/api.md) ---


class StartAssessmentRequest(BaseModel):
    candidate_id: uuid.UUID
    target_role_id: str


class StartAssessmentResponse(BaseModel):
    session_id: uuid.UUID
    status: str
    question_budget: int


class NextQuestionResponse(BaseModel):
    question_id: uuid.UUID
    competency_id: str
    difficulty: int
    sequence_number: int
    prompt: str
    options: list[str]
    source: Literal["mistral", "seed"]


class SessionCompletedResponse(BaseModel):
    status: Literal["completed"] = "completed"
    message: str = "Assessment complete. See /profile for results."


class AnswerRequest(BaseModel):
    question_id: uuid.UUID
    selected_index: int


class AnswerResponse(BaseModel):
    is_correct: bool
    competency_id: str
    updated_confidence: float
    updated_difficulty: int
    session_status: str


class ProfileCompetencyItem(BaseModel):
    competency_id: str
    questions_answered: int
    correct_count: int
    confidence_state: float


class VerifiedProfileItem(BaseModel):
    """Task 7 — the resume-vs-verified pair the product's core demo moment depends on."""

    competency_id: str
    competency_name: str
    resume_estimated_level: float | None = None
    resume_confidence: float | None = None
    verified_level: float
    verified_confidence: float


class ProfileResponse(BaseModel):
    session_id: uuid.UUID
    status: str
    competencies: list[ProfileCompetencyItem]
    verified_profile: list[VerifiedProfileItem] = []
