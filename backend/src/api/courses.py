"""GET /courses — Task 3 FR-005."""

from __future__ import annotations

from collections import defaultdict

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.src.db import get_db
from backend.src.models import Course, CourseCompetency
from backend.src.schemas.reference import CourseSummary

router = APIRouter()


@router.get("/courses", response_model=list[CourseSummary])
def list_courses(db: Session = Depends(get_db)) -> list[CourseSummary]:
    courses = db.execute(select(Course)).scalars().all()

    covered_by_course: dict[str, list[str]] = defaultdict(list)
    for course_id, competency_id in db.execute(
        select(CourseCompetency.course_id, CourseCompetency.competency_id)
    ):
        covered_by_course[course_id].append(competency_id)

    return [
        CourseSummary(
            id=c.id,
            title=c.title,
            description=c.description,
            provider=c.provider,
            level=c.level,
            duration_hours=c.duration_hours,
            competencies_covered=covered_by_course.get(c.id, []),
        )
        for c in courses
    ]
