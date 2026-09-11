"""Task 8 — Skill Gap Engine endpoints."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.src.db import get_db
from backend.src.models import Analysis
from backend.src.schemas.analysis import (
    AnalysisRequest,
    AnalysisResponse,
    CourseRecommendationItem,
    CoursesResponse,
    GapsResponse,
    SkillGapItem,
)
from backend.src.services import course_recommendation_engine, gap_engine

router = APIRouter()


@router.post("/analysis", response_model=AnalysisResponse, status_code=201)
def create_analysis(body: AnalysisRequest, db: Session = Depends(get_db)) -> AnalysisResponse:
    try:
        analysis = gap_engine.create_analysis(db, body.candidate_id, body.target_role_id)
    except gap_engine.NoAssessmentSessionError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    return AnalysisResponse(
        analysis_id=analysis.id, candidate_id=analysis.candidate_id, target_role_id=analysis.target_role_id
    )


@router.get("/analysis/{analysis_id}/gaps", response_model=GapsResponse)
def get_gaps(analysis_id: uuid.UUID, db: Session = Depends(get_db)) -> GapsResponse:
    analysis = db.get(Analysis, analysis_id)
    if analysis is None:
        raise HTTPException(status_code=404, detail=f"Analysis '{analysis_id}' not found")

    gaps = gap_engine.compute_and_persist_gaps(db, analysis)
    return GapsResponse(analysis_id=analysis.id, gaps=[SkillGapItem(**g) for g in gaps])


@router.get("/analysis/{analysis_id}/courses", response_model=CoursesResponse)
def get_courses(analysis_id: uuid.UUID, db: Session = Depends(get_db)) -> CoursesResponse:
    analysis = db.get(Analysis, analysis_id)
    if analysis is None:
        raise HTTPException(status_code=404, detail=f"Analysis '{analysis_id}' not found")

    recommendations, unmatched_gaps = course_recommendation_engine.match_courses_for_analysis(db, analysis_id)
    return CoursesResponse(
        analysis_id=analysis_id,
        recommendations=[CourseRecommendationItem(**r) for r in recommendations],
        unmatched_gaps=unmatched_gaps,
    )
