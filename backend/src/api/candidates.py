"""POST /candidates/resume — Task 4 — Resume Processing. POST /candidates/demo — Task 16 — Demo
Implementation (contracts/api.md in specs/017-task-16-demo-implementation)."""

from __future__ import annotations

import json
import logging
import os
import uuid
from datetime import UTC, datetime
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.src.api.roles import build_role_detail
from backend.src.db import get_db
from backend.src.models import Candidate, CandidateSkill, Competency, Role
from backend.src.schemas.candidates import (
    CONFIDENCE_TO_FLOAT,
    InitialProfileItem,
    ResumeUploadResponse,
    TargetRoleSelectionRequest,
    TargetRoleSelectionResponse,
)
from backend.src.services.competency_mapping import map_to_competency
from backend.src.services.mistral_client import MistralExtractionError, extract_resume_skills
from backend.src.services.resume_extraction import (
    SUPPORTED_MIME_TYPES,
    ResumeExtractionError,
    extract_text,
)

logger = logging.getLogger(__name__)
router = APIRouter()

# Same repo-root resolution pattern as backend/src/scripts/seed_reference_data.py's CURATED_DIR —
# this file lives at backend/src/api/candidates.py, the same depth under the repo root.
_CURATED_DIR = Path(__file__).resolve().parent.parent.parent.parent / "data" / "curated"
_DEMO_CANDIDATE_PATH = _CURATED_DIR / "demo_candidate.json"


def _max_upload_bytes() -> int:
    mb = float(os.environ.get("MAX_RESUME_UPLOAD_MB", "5"))
    return int(mb * 1024 * 1024)


@router.post("/candidates/resume", response_model=ResumeUploadResponse, status_code=201)
async def upload_resume(resume: UploadFile, db: Session = Depends(get_db)) -> ResumeUploadResponse:
    # FR-002: validate type and size before any extraction is attempted.
    if resume.content_type not in SUPPORTED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{resume.content_type}'. Upload a PDF or DOCX resume.",
        )

    file_bytes = await resume.read()
    if len(file_bytes) > _max_upload_bytes():
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds the {os.environ.get('MAX_RESUME_UPLOAD_MB', '5')}MB upload limit.",
        )

    # FR-004: text extraction, never let a raw parser exception reach the client as a 500.
    try:
        resume_text = extract_text(file_bytes, resume.content_type)
    except ResumeExtractionError as exc:
        logger.warning("Resume text extraction failed: %s", exc)
        raise HTTPException(
            status_code=422,
            detail={
                "detail": "Unable to parse resume. Try Demo Candidate instead.",
                "reason": "extraction_failed",
            },
        ) from exc

    competencies = db.execute(select(Competency)).scalars().all()
    valid_competency_ids = {c.id for c in competencies}
    competencies_by_id = {c.id: c for c in competencies}

    # FR-005/FR-006: Mistral extraction (full §27.2 schema), schema-validated with one retry inside
    # mistral_client. The competency framework is sent so Mistral can select ids itself (FR-005).
    try:
        extraction = extract_resume_skills(resume_text, competencies)
    except MistralExtractionError as exc:
        logger.warning("Mistral resume extraction failed after retry: %s", exc)
        raise HTTPException(
            status_code=422,
            detail={
                "detail": "Unable to parse resume. Try Demo Candidate instead.",
                "reason": "extraction_failed",
            },
        ) from exc

    initial_profile: list[InitialProfileItem] = []
    candidate_skill_rows: list[CandidateSkill] = []
    candidate_id = uuid.uuid4()

    for item in extraction.competency_evidence:
        competency_id = item.competency_id
        # FR-007/Edge Cases: never trust a Mistral-returned id blindly — confirm it's one of the
        # ids we actually supplied. A hallucinated or null id is dropped (optionally salvaged below).
        if competency_id is not None and competency_id not in valid_competency_ids:
            logger.warning(
                "Mistral returned an unrecognized competency_id %r for %r — discarding, not a "
                "backend-owned id from this request's competency framework.",
                competency_id,
                item.competency_name,
            )
            competency_id = None

        if competency_id is None:
            # Best-effort salvage pass (FR-007) over whatever Mistral itself couldn't map.
            competency_id = map_to_competency(item.competency_name, competencies)
        if competency_id is None:
            continue

        competency = competencies_by_id[competency_id]
        resume_estimated_level = item.estimated_level_range.midpoint
        resume_confidence_float = CONFIDENCE_TO_FLOAT[item.confidence]

        initial_profile.append(
            InitialProfileItem(
                competency_id=competency_id,
                competency_name=competency.name,
                resume_estimated_level=resume_estimated_level,
                resume_confidence=item.confidence,
                evidence_snippet=item.evidence,
            )
        )
        candidate_skill_rows.append(
            CandidateSkill(
                candidate_id=candidate_id,
                competency_id=competency_id,
                resume_estimated_level=resume_estimated_level,
                resume_confidence=resume_confidence_float,
                evidence_snippet=item.evidence,
            )
        )

    if extraction.unmapped_terms:
        logger.info("Resume extraction left %d unmapped terms: %s", len(extraction.unmapped_terms), extraction.unmapped_terms)

    # FR-008/FR-010: persist before returning. FR-012: candidate identity fields
    # (extraction.candidate.*) are validated but intentionally not persisted in this phase.
    candidate = Candidate(
        id=candidate_id,
        source="resume_upload",
        created_at=datetime.now(UTC),
        resume_filename=resume.filename,
        target_role_id=None,
    )
    db.add(candidate)
    db.add_all(candidate_skill_rows)
    db.commit()

    return ResumeUploadResponse(
        candidate_id=candidate_id,
        source="resume_upload",
        initial_profile=initial_profile,
    )


@router.post("/candidates/demo", response_model=ResumeUploadResponse, status_code=201)
def create_demo_candidate(db: Session = Depends(get_db)) -> ResumeUploadResponse:
    """Task 16 FR-001: 'Try Demo Candidate' must enter the identical downstream pipeline as a real
    resume upload. Returns the same ResumeUploadResponse shape (source='demo' in place of
    'resume_upload') so the frontend needs no branching beyond the entry screen. Creates a fresh
    candidate + candidate_skills row on every call (never a single shared/reused row) so repeated
    demo runs — including a cold reload with no cached state — never collide with a prior run's
    state (spec SC-002)."""
    if not _DEMO_CANDIDATE_PATH.exists():
        raise HTTPException(
            status_code=500,
            detail=f"Demo candidate seed file not found at {_DEMO_CANDIDATE_PATH}.",
        )
    demo_data = json.loads(_DEMO_CANDIDATE_PATH.read_text(encoding="utf-8"))

    competencies = db.execute(select(Competency)).scalars().all()
    valid_competency_ids = {c.id for c in competencies}

    initial_profile: list[InitialProfileItem] = []
    candidate_skill_rows: list[CandidateSkill] = []
    candidate_id = uuid.uuid4()

    for item in demo_data["initial_profile"]:
        competency_id = item["competency_id"]
        if competency_id not in valid_competency_ids:
            logger.warning(
                "demo_candidate.json references unknown competency_id %r — skipping", competency_id
            )
            continue

        confidence = item["resume_confidence"]
        initial_profile.append(
            InitialProfileItem(
                competency_id=competency_id,
                competency_name=item["competency_name"],
                resume_estimated_level=item["resume_estimated_level"],
                resume_confidence=confidence,
                evidence_snippet=item.get("evidence_snippet"),
            )
        )
        candidate_skill_rows.append(
            CandidateSkill(
                candidate_id=candidate_id,
                competency_id=competency_id,
                resume_estimated_level=item["resume_estimated_level"],
                resume_confidence=CONFIDENCE_TO_FLOAT[confidence],
                evidence_snippet=item.get("evidence_snippet"),
            )
        )

    candidate = Candidate(
        id=candidate_id,
        source="demo",
        created_at=datetime.now(UTC),
        resume_filename=None,
        target_role_id=None,
    )
    db.add(candidate)
    db.add_all(candidate_skill_rows)
    db.commit()

    return ResumeUploadResponse(
        candidate_id=candidate_id,
        source="demo",
        initial_profile=initial_profile,
    )


@router.post("/candidates/{candidate_id}/target-role", response_model=TargetRoleSelectionResponse)
def select_target_role(
    candidate_id: uuid.UUID,
    body: TargetRoleSelectionRequest,
    db: Session = Depends(get_db),
) -> TargetRoleSelectionResponse:
    # Both lookups happen before any write, so an invalid id never partially updates the record
    # (FR-005/SC-003 — all-or-nothing).
    candidate = db.get(Candidate, candidate_id)
    if candidate is None:
        raise HTTPException(status_code=404, detail=f"Candidate '{candidate_id}' not found")

    role = db.get(Role, body.role_id)
    if role is None:
        raise HTTPException(status_code=404, detail=f"Role '{body.role_id}' not found")

    # FR-002: replaces any prior selection for this candidate.
    candidate.target_role_id = body.role_id
    db.commit()

    role_detail = build_role_detail(role, db)
    return TargetRoleSelectionResponse(candidate_id=candidate_id, role=role_detail)
