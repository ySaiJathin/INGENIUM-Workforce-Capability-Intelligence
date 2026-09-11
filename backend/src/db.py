"""
PostgreSQL engine/session setup (Task 2 — Database Foundation).

Single database, per CLAUDE.md's "PostgreSQL only" standing rule. Reads DATABASE_URL from the
repo-root .env (Task 0), which currently points at the Docker-run Postgres container on
localhost:5433 (see docker-compose.yml and specs/001-task-0-environment-setup's Assumptions).
"""

from __future__ import annotations

import os
from collections.abc import Generator
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

ROOT = Path(__file__).resolve().parent.parent.parent
load_dotenv(ROOT / ".env")

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL is not set. Copy .env.example to .env and fill it in (see Task 0)."
    )

# psycopg (v3) is the driver installed per requirements.txt; SQLAlchemy needs the explicit
# "+psycopg" dialect suffix to use it instead of defaulting to psycopg2.
_engine_url = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)

# connect_timeout: without it, a connection attempt against an unreachable/stopped Postgres can hang
# on the OS's own TCP retry logic for a minute or more (observed during Task 17's final testing pass)
# instead of failing fast — every request would appear frozen rather than returning a clear error
# (spec 018 FR-002). 5s is long enough for a real, momentarily slow DB, short enough that a demo-day
# DB outage surfaces as a prompt error instead of an indefinite hang.
engine = create_engine(_engine_url, pool_pre_ping=True, connect_args={"connect_timeout": 5})
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency: one Session per request, always closed afterward."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
