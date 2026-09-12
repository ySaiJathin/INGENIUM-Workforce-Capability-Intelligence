"""
Phase 6 (Evidence + RAG + MCP) — the EvidenceItem type, per data-model.md.

Not a database row — its authoritative content lives in data/index/evidence_meta.json, written
once by backend/src/scripts/build_evidence_index.py and read-only at runtime.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel

EvidenceSourceType = Literal["competency", "role", "course", "esco"]


class EvidenceItem(BaseModel):
    id: str  # "<source_type>:<source_id>", e.g. "competency:sql", "course:sql-foundations-01"
    source_type: EvidenceSourceType
    source_id: str
    text: str
    similarity: float | None = None  # only present on retrieval results, absent in the static index


class GroundingReport(BaseModel):
    """The outcome of validating a generated learning plan's referenced entities against
    retrieved evidence / supplied deterministic data (research.md §3's grounding validator)."""

    supported_claims: list[str] = []
    removed_claims: list[str] = []
    grounded: bool = False
