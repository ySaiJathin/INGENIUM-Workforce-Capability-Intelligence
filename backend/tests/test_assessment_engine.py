"""
Phase 3 (Adaptive Assessment, MCP-Wired) — tests for the get_next_question() rewire.

Uses the real Postgres dev DB and real role/competency reference data, matching this project's
established testing pattern in this session. No live Mistral call is needed for these two tests —
question generation naturally falls back to the seed bank when Mistral is unavailable/rate-limited
(already-confirmed-correct behavior, unrelated to what this phase changes), which is exactly the
path these tests exercise.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from unittest.mock import patch

import pytest
from sqlalchemy import select

from backend.src.db import SessionLocal
from backend.src.mcp.tools import MCPToolError
from backend.src.models import Candidate, SkillEvidence
from backend.src.services import assessment_engine


@pytest.fixture
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def fresh_session(db):
    """A real Candidate + AssessmentSession for role-sso-01, matching what
    POST /candidates/demo + POST /assessment/start create."""
    candidate_id = uuid.uuid4()
    db.add(Candidate(id=candidate_id, source="demo", resume_filename=None, target_role_id=None, created_at=datetime.now(UTC)))
    db.commit()
    session = assessment_engine.start_session(db, candidate_id, "role-sso-01")
    return session


def test_get_next_question_still_targets_a_required_competency_when_mcp_is_healthy(db, fresh_session):
    """User Story 1: with the MCP layer healthy, the question returned still targets one of the
    role's required competencies — the rewire changes *how* context is assembled, not the result."""
    question = assessment_engine.get_next_question(db, fresh_session)
    assert question is not None
    role_competency_ids = {
        rc.competency_id for rc in assessment_engine._role_competencies(db, fresh_session.target_role_id)
    }
    assert question.competency_id in role_competency_ids


def test_get_next_question_falls_back_to_inline_assembly_when_mcp_context_fails(db, fresh_session):
    """User Story 1 (FR-005/Rule 10): when mcp_tools.get_assessment_context() raises,
    get_next_question() must still return a valid question via its inline fallback assembly, not
    propagate the error or return nothing."""
    with patch.object(
        assessment_engine.mcp_tools, "get_assessment_context",
        side_effect=MCPToolError("get_assessment_context", "simulated_failure_for_test"),
    ):
        question = assessment_engine.get_next_question(db, fresh_session)

    assert question is not None
    role_competency_ids = {
        rc.competency_id for rc in assessment_engine._role_competencies(db, fresh_session.target_role_id)
    }
    assert question.competency_id in role_competency_ids


# --- User Story 3: the assessment always reaches a clean stopping point ---


def test_session_completes_cleanly_when_every_competency_hits_confidence_threshold(db, fresh_session):
    """T010: with the seed bank currently at ~1 question per competency, confidence-threshold
    completion isn't reachable via a live multi-question run this session (tracked separately as a
    data-completeness follow-up) — tested directly here instead, by driving SkillEvidence state to
    the threshold and confirming get_next_question() completes the session cleanly rather than
    erroring or hanging."""
    for evidence in db.execute(
        select(SkillEvidence).filter_by(session_id=fresh_session.id)
    ).scalars().all():
        evidence.confidence_state = 0.9  # >= assessment_engine.CONFIDENCE_THRESHOLD (0.75)
    db.commit()

    result = assessment_engine.get_next_question(db, fresh_session)

    assert result is None
    db.refresh(fresh_session)
    assert fresh_session.status == "completed"


def test_session_completes_cleanly_when_question_budget_exhausted(db, fresh_session):
    """T011: budget exhaustion must also complete the session cleanly, not error."""
    fresh_session.question_budget = 0
    db.commit()

    result = assessment_engine.get_next_question(db, fresh_session)

    assert result is None
    db.refresh(fresh_session)
    assert fresh_session.status == "completed"
