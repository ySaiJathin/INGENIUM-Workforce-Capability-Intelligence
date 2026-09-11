"""GET /health — Task 3 FR-001. Reports degraded status on a DB failure rather than 5xx-ing."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from backend.src.db import get_db
from backend.src.schemas.reference import HealthStatus

router = APIRouter()


@router.get("/health", response_model=HealthStatus)
def get_health(db: Session = Depends(get_db)) -> HealthStatus:
    try:
        db.execute(text("SELECT 1"))
        return HealthStatus(status="ok", database="connected")
    except Exception as exc:  # spec Edge Cases: report clearly, never crash the process
        return HealthStatus(status="degraded", database="unreachable", detail=str(exc))
