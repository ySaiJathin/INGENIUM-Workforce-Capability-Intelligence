"""
Pydantic schemas for Task 4 — Resume Processing.

The Mistral-facing schemas (CandidateIdentity..ResumeExtractionResponse) match
total_buildplan.md §27.2's ResumeExtractionResponse shape exactly — this is Mistral's contract, not
this project's own design choice, so field names/enums are taken verbatim from that section.

API-facing schemas (InitialProfileItem, ResumeUploadResponse) match
specs/005-task-4-resume-processing/contracts/api.md.
"""

from __future__ import annotations

import uuid
from typing import Literal

from pydantic import BaseModel

from backend.src.schemas.reference import RoleDetail

EvidenceStrength = Literal["VERY_WEAK", "WEAK", "MODERATE", "STRONG", "VERY_STRONG"]
ConfidenceLevel = Literal["LOW", "MEDIUM", "HIGH"]

# LOW/MEDIUM/HIGH -> a numeric value for Task 7's scoring math (plan.md's Confidence representation
# note) — the DB column stays a float; the API response stays categorical.
CONFIDENCE_TO_FLOAT: dict[ConfidenceLevel, float] = {"LOW": 0.3, "MEDIUM": 0.6, "HIGH": 0.9}


class CandidateIdentity(BaseModel):
    name: str | None = None
    designation: str | None = None
    organization: str | None = None
    years_experience: float | None = None


class EstimatedLevelRange(BaseModel):
    min: float
    max: float

    @property
    def midpoint(self) -> float:
        return (self.min + self.max) / 2


class CompetencyEvidence(BaseModel):
    """One item of Mistral's structured-extraction response (§27.2). Validated before any further
    processing — never trusted as-is (Rule 5); competency_id is re-validated against the ids the
    backend actually supplied, separately, by the caller (FR-007)."""

    competency_id: str | None = None
    competency_name: str
    evidence: str
    source: Literal["resume"] = "resume"
    status: Literal["initial_evidence"] = "initial_evidence"
    evidence_strength: EvidenceStrength
    estimated_level_range: EstimatedLevelRange
    confidence: ConfidenceLevel
    reasoning: str = ""


class ResumeExtractionResponse(BaseModel):
    """Full §27.2 ResumeExtractionResponse shape. `candidate`/`education`/`certifications`/
    `experience` are accepted (schema-validated per Rule 5) but not persisted in this phase — see
    spec.md FR-012."""

    candidate: CandidateIdentity = CandidateIdentity()
    education: list[dict] = []
    certifications: list[dict] = []
    experience: list[dict] = []
    competency_evidence: list[CompetencyEvidence] = []
    unmapped_terms: list[str] = []
    overall_confidence: ConfidenceLevel = "LOW"


# --- API-facing (contracts/api.md) ---


class InitialProfileItem(BaseModel):
    competency_id: str
    competency_name: str
    resume_estimated_level: float
    resume_confidence: ConfidenceLevel
    evidence_snippet: str | None = None


class ResumeUploadResponse(BaseModel):
    candidate_id: uuid.UUID
    source: str
    initial_profile: list[InitialProfileItem]


class DemoCandidateOption(BaseModel):
    """One selectable entry from data/curated/demo_candidates.json — GET /candidates/demo-options'
    response shape. `label` is the only user-facing text; `id` is passed back to POST
    /candidates/demo to pick which profile to seed."""

    id: str
    label: str


class DemoCandidateRequest(BaseModel):
    """Optional body for POST /candidates/demo. Omitted or None -> the original, already-rehearsed
    default profile (Task 16), so every existing caller of this endpoint keeps working unchanged."""

    profile_id: str | None = None


# --- Task 5: Target Role & Requirement Engine ---


class TargetRoleSelectionRequest(BaseModel):
    role_id: str


class TargetRoleSelectionResponse(BaseModel):
    candidate_id: uuid.UUID
    role: RoleDetail

