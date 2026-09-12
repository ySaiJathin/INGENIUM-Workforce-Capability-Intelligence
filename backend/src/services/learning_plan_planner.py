"""
Phase 6 (Evidence + RAG + MCP) — grounded learning-plan generation.

Builds on top of the existing, unchanged, deterministic learning_path_engine.build_learning_path()
(Rule 3 — never re-derive working ordering/course-selection logic). This module only adds an
optional, best-effort layer on top: retrieve evidence for each step, ask Mistral for a grounded
explanation citing that evidence, then validate every citation deterministically before display.

Falls back to the plain deterministic plan (grounding=None) on ANY failure — evidence retrieval
unavailable, Mistral unavailable, or a validation problem — per FR-007. The frontend/API contract
gains one additive field (`grounding`); nothing about the existing plan shape changes.
"""

from __future__ import annotations

import logging
import uuid

from sqlalchemy.orm import Session

from backend.src.mcp.tools import MCPToolError
from backend.src.models import Competency
from backend.src.schemas.evidence import GroundingReport
from backend.src.services import learning_path_engine, mistral_client

logger = logging.getLogger(__name__)

_MAX_EVIDENCE_PER_STEP = 3


def _retrieve_evidence_for_step(db: Session, step: dict, competency_names: dict[str, str]) -> list[dict]:
    from backend.src.mcp import tools as mcp_tools
    from backend.src.schemas.mcp import RelevantEvidenceRequest

    addressed_names = [competency_names.get(cid, cid) for cid in step["addresses_gaps"]]
    query_text = f"{step['title']}. {'. '.join(addressed_names)}"

    result = mcp_tools.get_relevant_evidence(
        db, RelevantEvidenceRequest(query=query_text, top_k=_MAX_EVIDENCE_PER_STEP)
    )
    return result.items  # list[dict] — see schemas/mcp.py's RelevantEvidenceResult


def _apply_grounding_validation(
    step_explanations: dict[int, dict], evidence_ids_by_step: dict[int, set[str]]
) -> tuple[dict[int, dict], GroundingReport]:
    """research.md §4: a closed-world membership check, not open-ended fact-checking — every
    referenced_evidence_id must be one this step was actually given; strip any that isn't."""
    supported: list[str] = []
    removed: list[str] = []
    cleaned: dict[int, dict] = {}

    for step_number, explanation in step_explanations.items():
        allowed_ids = evidence_ids_by_step.get(step_number, set())
        referenced = explanation.get("referenced_evidence_ids", []) or []
        kept = [eid for eid in referenced if eid in allowed_ids]
        dropped = [eid for eid in referenced if eid not in allowed_ids]

        supported.extend(kept)
        removed.extend(dropped)
        if dropped:
            logger.warning(
                "Grounding validator stripped %d unsupported evidence citation(s) from step %d: %s",
                len(dropped), step_number, dropped,
            )

        cleaned[step_number] = {
            "explanation": explanation.get("explanation", ""),
            "referenced_evidence_ids": kept,
        }

    report = GroundingReport(supported_claims=supported, removed_claims=removed, grounded=len(removed) == 0)
    return cleaned, report


def build_grounded_learning_path(db: Session, analysis_id: uuid.UUID) -> dict:
    """Returns the same shape as learning_path_engine.build_learning_path(), plus an additive
    `grounding` key: a GroundingReport dict when the RAG path succeeded, or None on any fallback."""
    base_result = learning_path_engine.build_learning_path(db, analysis_id)

    if not base_result["steps"]:
        return {**base_result, "grounding": None}

    try:
        competency_names = {c.id: c.name for c in db.query(Competency).all()}

        steps_with_evidence = []
        evidence_ids_by_step: dict[int, set[str]] = {}
        for step in base_result["steps"]:
            evidence_items = _retrieve_evidence_for_step(db, step, competency_names)
            evidence_ids_by_step[step["step_number"]] = {item["id"] for item in evidence_items}
            steps_with_evidence.append(
                {
                    "step_number": step["step_number"],
                    "course_title": step["title"],
                    "addresses_gaps": [competency_names.get(cid, cid) for cid in step["addresses_gaps"]],
                    "evidence": [{"id": item["id"], "text": item["text"]} for item in evidence_items],
                }
            )

        raw_explanations = mistral_client.generate_grounded_plan_explanations(steps_with_evidence)
        if not raw_explanations:
            # Mistral unavailable/failed (best-effort, already logged inside mistral_client) —
            # fall back to the plain deterministic plan rather than a half-grounded one.
            return {**base_result, "grounding": None}

        cleaned_explanations, grounding_report = _apply_grounding_validation(raw_explanations, evidence_ids_by_step)

        grounded_steps = [
            {
                **step,
                "rationale": cleaned_explanations.get(step["step_number"], {}).get("explanation") or step.get("rationale"),
            }
            for step in base_result["steps"]
        ]

        return {**base_result, "steps": grounded_steps, "grounding": grounding_report.model_dump()}

    except MCPToolError as exc:
        logger.warning("Evidence retrieval unavailable for analysis %s, falling back to deterministic plan: %s", analysis_id, exc)
        return {**base_result, "grounding": None}
    except Exception as exc:  # never let the RAG-enrichment layer take down the golden path
        logger.warning("Grounded plan generation failed for analysis %s, falling back to deterministic plan: %s", analysis_id, exc)
        return {**base_result, "grounding": None}
