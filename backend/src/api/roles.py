"""GET /roles, GET /roles/{id} — Task 3 FR-002/FR-003.

build_role_detail() is factored out so Task 5's target-role-selection endpoint returns the exact
same shape without duplicating the query (Task 5's Key Entities: "reuses the same shape as Task 3's
GET /roles/{id} response").
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.src.db import get_db
from backend.src.models import Competency, Role, RoleCompetency
from backend.src.schemas.reference import RequiredCompetency, RoleDetail, RoleSummary

router = APIRouter()


def build_role_detail(role: Role, db: Session) -> RoleDetail:
    rows = db.execute(
        select(RoleCompetency, Competency.name)
        .join(Competency, Competency.id == RoleCompetency.competency_id)
        .where(RoleCompetency.role_id == role.id)
    ).all()

    required_competencies = [
        RequiredCompetency(
            competency_id=rc.competency_id,
            name=name,
            required_level=rc.required_level,
            priority=rc.priority,
        )
        for rc, name in rows
    ]

    return RoleDetail(
        id=role.id,
        name=role.name,
        description=role.description,
        required_competencies=required_competencies,
    )


@router.get("/roles", response_model=list[RoleSummary])
def list_roles(db: Session = Depends(get_db)) -> list[RoleSummary]:
    roles = db.execute(select(Role)).scalars().all()
    return [RoleSummary(id=r.id, name=r.name, description=r.description) for r in roles]


@router.get("/roles/{role_id}", response_model=RoleDetail)
def get_role(role_id: str, db: Session = Depends(get_db)) -> RoleDetail:
    role = db.get(Role, role_id)
    if role is None:
        raise HTTPException(status_code=404, detail=f"Role '{role_id}' not found")
    return build_role_detail(role, db)
