"""GET /competencies — Task 3 FR-004."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.src.db import get_db
from backend.src.models import Competency
from backend.src.schemas.reference import CompetencySummary

router = APIRouter()


@router.get("/competencies", response_model=list[CompetencySummary])
def list_competencies(db: Session = Depends(get_db)) -> list[CompetencySummary]:
    competencies = db.execute(select(Competency)).scalars().all()
    return [
        CompetencySummary(
            id=c.id,
            name=c.name,
            description=c.description,
            parent_competency_id=c.parent_competency_id,
        )
        for c in competencies
    ]
