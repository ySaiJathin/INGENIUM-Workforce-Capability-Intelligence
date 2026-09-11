"""
Task 2 — Database Foundation: creates all 13 tables from data-model.md.

This is the project's lightweight "migration" — Base.metadata.create_all(), per
specs/003-task-2-database-foundation/plan.md's Assumption that a formal migration-versioning
tool (Alembic etc.) isn't needed for this single-environment hackathon build (Rule 13).

Run from the repo root:
    .venv/Scripts/python.exe -m backend.migrations.create_schema
"""

from __future__ import annotations

from backend.src.db import engine
from backend.src.models import Base


def main() -> None:
    Base.metadata.create_all(engine)
    table_names = sorted(Base.metadata.tables.keys())
    print(f"Created/confirmed {len(table_names)} tables:")
    for name in table_names:
        print(f"  - {name}")


if __name__ == "__main__":
    main()
