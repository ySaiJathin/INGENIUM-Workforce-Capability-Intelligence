"""Task 6 — Adaptive Assessment Engine endpoints. Thin wrappers over assessment_engine.py."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.src.db import get_db
from backend.src.models import AssessmentSession
from backend.src.schemas.assessment import (
    AnswerRequest,
    AnswerResponse,
    NextQuestionResponse,
    ProfileCompetencyItem,
    ProfileResponse,
    SessionCompletedResponse,
    StartAssessmentRequest,
    StartAssessmentResponse,
    VerifiedProfileItem,
)
from backend.src.services import assessment_engine, scoring_engine

router = APIRouter()


def _get_session_or_404(session_id: uuid.UUID, db: Session) -> AssessmentSession:
    session = db.get(AssessmentSession, session_id)
    if session is None:
        raise HTTPException(status_code=404, detail=f"Assessment session '{session_id}' not found")
    return session


@router.post("/assessment/start", response_model=StartAssessmentResponse, status_code=201)
def start_assessment(body: StartAssessmentRequest, db: Session = Depends(get_db)) -> StartAssessmentResponse:
    session = assessment_engine.start_session(db, body.candidate_id, body.target_role_id)
    return StartAssessmentResponse(
        session_id=session.id, status=session.status, question_budget=session.question_budget
    )


@router.get("/assessment/{session_id}/next-question")
def next_question(session_id: uuid.UUID, db: Session = Depends(get_db)):
    session = _get_session_or_404(session_id, db)
    question = assessment_engine.get_next_question(db, session)
    if question is None:
        return SessionCompletedResponse()
    return NextQuestionResponse(
        question_id=question.id,
        competency_id=question.competency_id,
        difficulty=question.difficulty,
        sequence_number=question.sequence_number,
        prompt=question.prompt,
        options=question.options,
        source=question.source,
    )


@router.post("/assessment/{session_id}/answer", response_model=AnswerResponse)
def submit_answer(session_id: uuid.UUID, body: AnswerRequest, db: Session = Depends(get_db)) -> AnswerResponse:
    session = _get_session_or_404(session_id, db)
    try:
        is_correct, competency_id, updated_confidence, updated_difficulty, session_status = (
            assessment_engine.submit_answer(db, session, body.question_id, body.selected_index)
        )
    except (assessment_engine.DuplicateAnswerError, assessment_engine.QuestionNotInSessionError) as exc:
        raise HTTPException(status_code=409, detail="Question already answered for this session") from exc

    return AnswerResponse(
        is_correct=is_correct,
        competency_id=competency_id,
        updated_confidence=updated_confidence,
        updated_difficulty=int(updated_difficulty),
        session_status=session_status,
    )


@router.get("/assessment/{session_id}/profile", response_model=ProfileResponse)
def get_profile(session_id: uuid.UUID, db: Session = Depends(get_db)) -> ProfileResponse:
    session = _get_session_or_404(session_id, db)
    evidence_rows = assessment_engine.get_profile(db, session)
    verified_items = scoring_engine.build_and_persist_verified_profile(db, session)
    return ProfileResponse(
        session_id=session.id,
        status=session.status,
        competencies=[
            ProfileCompetencyItem(
                competency_id=e.competency_id,
                questions_answered=e.questions_answered,
                correct_count=e.correct_count,
                confidence_state=e.confidence_state,
            )
            for e in evidence_rows
        ],
        verified_profile=[VerifiedProfileItem(**item) for item in verified_items],
    )
