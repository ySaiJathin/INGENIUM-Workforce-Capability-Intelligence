"""
Task 2 — Database Foundation: connectivity/health check (FR-006).

Opens a connection, runs a trivial query, and reports row counts for every seeded reference table
plus every other schema table (0 rows expected for candidate-generated tables until real usage
begins in later phases). Times the whole check and flags if it exceeds the 2-second budget (SC-004).

Run from the repo root:
    .venv/Scripts/python.exe -m backend.src.scripts.check_db
"""

from __future__ import annotations

import time

from sqlalchemy import text

from backend.src.db import engine
from backend.src.models import Base

TIME_BUDGET_SECONDS = 2.0


def main() -> int:
    start = time.perf_counter()
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            print("[PASS] Connected to PostgreSQL and executed SELECT 1")

            counts: dict[str, int] = {}
            for table_name in sorted(Base.metadata.tables.keys()):
                result = conn.execute(text(f'SELECT count(*) FROM "{table_name}"'))
                counts[table_name] = result.scalar_one()
    except Exception as exc:  # surfaced, never swallowed — spec Edge Case: fail with a clear error
        elapsed = time.perf_counter() - start
        print(f"[FAIL] Could not connect/query PostgreSQL after {elapsed:.2f}s: {exc}")
        return 1

    elapsed = time.perf_counter() - start

    print("\nRow counts:")
    for name, count in counts.items():
        print(f"  {name:<24} {count}")

    print(f"\nTotal check time: {elapsed:.3f}s (budget: {TIME_BUDGET_SECONDS}s)")
    if elapsed > TIME_BUDGET_SECONDS:
        print(f"[FAIL] Connectivity check exceeded the {TIME_BUDGET_SECONDS}s budget (SC-004)")
        return 1

    print("[PASS] Connectivity check completed within budget")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
