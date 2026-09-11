"""
FastAPI app entrypoint (Task 3 — Backend API Foundation).

Run from the repo root:
    .venv/Scripts/uvicorn.exe backend.src.main:app --reload
"""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.src.api import (
    analysis,
    assessment,
    candidates,
    competencies,
    courses,
    health,
    learning_path,
    roles,
)

app = FastAPI(title="Competency Intelligence API")

# The frontend (Task 11+, Vite dev server) runs on a different origin/port than the backend;
# permissive for this hackathon MVP (no auth, no cookies) — see spec Assumptions on auth scope.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(roles.router)
app.include_router(competencies.router)
app.include_router(courses.router)
app.include_router(candidates.router)
app.include_router(assessment.router)
app.include_router(analysis.router)
app.include_router(learning_path.router)
