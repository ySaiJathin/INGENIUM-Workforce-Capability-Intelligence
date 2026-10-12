"""Task 10 — Learning Path endpoints."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.src.db import get_db
from backend.src.models import Analysis
from backend.src.schemas.learning_path import LearningPathRequest, LearningPathResponse
from backend.src.services import learning_path_engine, learning_plan_planner

router = APIRouter()


@router.post("/learning-path", response_model=LearningPathResponse, status_code=201)
def create_learning_path(body: LearningPathRequest, db: Session = Depends(get_db)) -> LearningPathResponse:
    # An unknown analysis_id must be a clear 404 at the point of failure, matching the sibling
    # /analysis/{id}/gaps and /courses endpoints. Without this guard the builder finds no gaps,
    # takes its "nothing left to learn" branch, and tries to insert a learning_paths row whose
    # analysis_id has no parent — surfacing as an unhandled ForeignKeyViolation 500 (spec 027
    # matrix row 8f), and, absent that constraint, as a misleading "all requirements are met".
    analysis = db.get(Analysis, body.analysis_id)
    if analysis is None:
        raise HTTPException(status_code=404, detail=f"Analysis '{body.analysis_id}' not found")

    # Phase 6: the grounded planner wraps the same deterministic build_learning_path() this
    # endpoint always called — it falls back to that identical, unmodified result (grounding=None)
    # on any failure, so this call can never behave worse than the pre-Phase-6 endpoint (Rule 10).
    result = learning_plan_planner.build_grounded_learning_path(db, body.analysis_id)
    return LearningPathResponse(**result)


@router.get("/learning-path/{learning_path_id}", response_model=LearningPathResponse)
def get_learning_path(learning_path_id: uuid.UUID, db: Session = Depends(get_db)) -> LearningPathResponse:
    result = learning_path_engine.get_learning_path(db, learning_path_id)
    if result is None:
        raise HTTPException(status_code=404, detail=f"Learning path '{learning_path_id}' not found")
    return LearningPathResponse(**result)
