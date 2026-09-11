"""
Task 2 — Database Foundation: idempotently seeds reference tables
(competencies, roles, role_competencies, courses, course_competencies) from Task 1's curated JSON.

Never touches candidates/assessments/answers or any other candidate-generated table (spec Edge
Cases). Uses INSERT ... ON CONFLICT DO UPDATE so re-running never creates duplicates (FR-005) and
never needs a destructive DELETE first.

Run from the repo root:
    .venv/Scripts/python.exe -m backend.src.scripts.seed_reference_data
"""

from __future__ import annotations

import json
from pathlib import Path

from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.exc import IntegrityError

from backend.src.db import engine
from backend.src.models import Competency, Course, CourseCompetency, Role, RoleCompetency

ROOT = Path(__file__).resolve().parent.parent.parent.parent
CURATED_DIR = ROOT / "data" / "curated"


def _load(name: str) -> list[dict]:
    path = CURATED_DIR / name
    if not path.exists():
        raise RuntimeError(
            f"{path} not found — run Task 1's scripts/generate_curated_data.py first."
        )
    return json.loads(path.read_text(encoding="utf-8"))


def _upsert(conn, table, rows: list[dict], conflict_cols: list[str]) -> int:
    """FR-005: idempotent upsert. FR-009: let IntegrityError surface with the offending table/row
    named, rather than being caught and silently skipped."""
    if not rows:
        return 0
    stmt = pg_insert(table).values(rows)
    update_cols = {c.name: getattr(stmt.excluded, c.name) for c in table.columns if c.name not in conflict_cols}
    stmt = stmt.on_conflict_do_update(index_elements=conflict_cols, set_=update_cols)
    try:
        conn.execute(stmt)
    except IntegrityError as exc:
        raise RuntimeError(
            f"Seeding {table.name} failed a foreign-key/integrity constraint — check the curated "
            f"JSON for a dangling reference. Original error: {exc}"
        ) from exc
    return len(rows)


def main() -> None:
    competencies = _load("competencies.json")
    roles = _load("roles.json")
    courses = _load("courses.json")

    role_competency_rows = [
        {
            "role_id": role["id"],
            "competency_id": rc["competency_id"],
            "required_level": rc["required_level"],
            "priority": rc["priority"],
        }
        for role in roles
        for rc in role["required_competencies"]
    ]
    course_competency_rows = [
        {
            "course_id": course["id"],
            "competency_id": cc["competency_id"],
            "coverage_weight": cc["coverage_weight"],
        }
        for course in courses
        for cc in course["competencies_covered"]
    ]

    competency_rows = [
        {
            "id": c["id"],
            "name": c["name"],
            "description": c["description"],
            "parent_competency_id": c["parent_competency_id"],
            "proficiency_scale_max": c["proficiency_scale_max"],
            "esco_source_id": c["esco_source_id"],
        }
        for c in competencies
    ]
    role_rows = [
        {
            "id": r["id"],
            "name": r["name"],
            "description": r["description"],
            "esco_occupation_id": r["esco_occupation_id"],
        }
        for r in roles
    ]
    course_rows = [
        {
            "id": c["id"],
            "title": c["title"],
            "description": c["description"],
            "provider": c["provider"],
            "level": c["level"],
            "duration_hours": c["duration_hours"],
            "priority": c["priority"],
        }
        for c in courses
    ]

    with engine.begin() as conn:
        # Competencies first (self-referencing parent + everything else FKs into it).
        n_comp = _upsert(conn, Competency.__table__, competency_rows, ["id"])
        n_roles = _upsert(conn, Role.__table__, role_rows, ["id"])
        n_courses = _upsert(conn, Course.__table__, course_rows, ["id"])
        n_role_comp = _upsert(conn, RoleCompetency.__table__, role_competency_rows, ["role_id", "competency_id"])
        n_course_comp = _upsert(
            conn, CourseCompetency.__table__, course_competency_rows, ["course_id", "competency_id"]
        )

    print("Seeded reference data:")
    print(f"  competencies:        {n_comp}")
    print(f"  roles:                {n_roles}")
    print(f"  courses:              {n_courses}")
    print(f"  role_competencies:    {n_role_comp}")
    print(f"  course_competencies:  {n_course_comp}")


if __name__ == "__main__":
    main()
