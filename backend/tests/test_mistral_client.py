"""
Phase 2 (LLM + MCP Layer), User Story 2 — confirmation tests for
backend/src/services/mistral_client.py's existing retry-once-then-fallback pattern.

This is confirmation, not new implementation (per specs/022-phase-2-llm-mcp-layer/plan.md): this
session's Phase 0 audit already observed this behavior working correctly against a real,
rate-limited Mistral API. These tests lock that behavior in with a fully mocked Mistral client, so
it's verified deterministically and isn't hostage to the external API's live rate limit.
"""

from __future__ import annotations

import json
from unittest.mock import MagicMock, patch

import pytest

from backend.src.services import mistral_client
from backend.src.services.mistral_client import (
    MistralExtractionError,
    extract_resume_skills,
)


class _FakeCompetency:
    def __init__(self, id_: str, name: str, description: str):
        self.id = id_
        self.name = name
        self.description = description


def _fake_response(content: str):
    message = MagicMock()
    message.content = content
    choice = MagicMock()
    choice.message = message
    response = MagicMock()
    response.choices = [choice]
    return response


_VALID_JSON = json.dumps(
    {
        "candidate": {"name": None, "designation": None, "organization": None, "years_experience": None},
        "education": [],
        "certifications": [],
        "experience": [],
        "competency_evidence": [],
        "unmapped_terms": [],
        "overall_confidence": "LOW",
    }
)


@pytest.fixture(autouse=True)
def _fake_api_key(monkeypatch):
    monkeypatch.setenv("MISTRAL_API_KEY", "fake-key-for-testing")


def test_malformed_json_on_first_attempt_triggers_exactly_one_retry_then_succeeds():
    """FR-004 (Phase 2 spec): a schema-validation failure retries once before giving up."""
    fake_client = MagicMock()
    fake_client.chat.complete.side_effect = [
        _fake_response("not valid json at all"),
        _fake_response(_VALID_JSON),
    ]

    with patch.object(mistral_client, "Mistral", return_value=fake_client):
        result = extract_resume_skills("some resume text", [_FakeCompetency("sql", "SQL", "SQL desc")])

    assert result.overall_confidence == "LOW"
    assert fake_client.chat.complete.call_count == 2


def test_failure_on_both_attempts_raises_documented_error_type():
    """FR-004 (Phase 2 spec): if the retry also fails, raise a controlled, documented error type —
    never a raw exception reaching the caller."""
    fake_client = MagicMock()
    fake_client.chat.complete.side_effect = [
        _fake_response("still not valid json"),
        _fake_response("also not valid json"),
    ]

    with patch.object(mistral_client, "Mistral", return_value=fake_client):
        with pytest.raises(MistralExtractionError):
            extract_resume_skills("some resume text", [_FakeCompetency("sql", "SQL", "SQL desc")])

    assert fake_client.chat.complete.call_count == 2


def test_network_error_is_also_retried_once_then_raises():
    """Confirms the retry loop covers network/timeout/API errors too, not just JSON parse
    failures (mistral_client.py's broad `except Exception` branch)."""
    fake_client = MagicMock()
    fake_client.chat.complete.side_effect = [ConnectionError("network down"), ConnectionError("network down")]

    with patch.object(mistral_client, "Mistral", return_value=fake_client):
        with pytest.raises(MistralExtractionError):
            extract_resume_skills("some resume text", [_FakeCompetency("sql", "SQL", "SQL desc")])

    assert fake_client.chat.complete.call_count == 2
