"""
Phase 1 (Resume Intelligence) — integration tests for POST /candidates/resume, exercising the real
FastAPI app + real Postgres DB + real text extraction, with only the Mistral call mocked.

Mocking Mistral (rather than depending on a live call) is deliberate: this project's
MISTRAL_API_KEY has been rate-limited (429) for this entire session (confirmed independently in
Phase 0's diagnosis and again directly against mistral_client.extract_resume_skills() before
writing this file) — a correctness test for "does confidence scale with evidence quality" must not
be hostage to an external API's live rate limit. The retry/fallback behavior *around* a real
Mistral failure is already covered separately (Phase 0's diagnosis.md, and
test_mistral_client-style tests belong to Phase 2).
"""

from __future__ import annotations

from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient

from backend.src.main import app
from backend.src.schemas.candidates import (
    CandidateIdentity,
    CompetencyEvidence,
    EstimatedLevelRange,
    ResumeExtractionResponse,
)

client = TestClient(app)

_FIXTURES = Path(__file__).parent / "fixtures"
_DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"


def _upload(fixture_name: str, mocked_extraction: ResumeExtractionResponse):
    with patch(
        "backend.src.api.candidates.extract_resume_skills", return_value=mocked_extraction
    ):
        with open(_FIXTURES / fixture_name, "rb") as f:
            return client.post(
                "/candidates/resume",
                files={"resume": (fixture_name, f, _DOCX_MIME)},
            )


def _strong_evidence_response() -> ResumeExtractionResponse:
    return ResumeExtractionResponse(
        candidate=CandidateIdentity(),
        competency_evidence=[
            CompetencyEvidence(
                competency_id="sql",
                competency_name="SQL",
                evidence="Designed and optimized production SQL pipelines over 3 years, writing "
                "complex queries with joins, aggregations, subqueries, and window functions.",
                evidence_strength="VERY_STRONG",
                estimated_level_range=EstimatedLevelRange(min=4, max=5),
                confidence="HIGH",
                reasoning="Detailed, multi-year, project-specific evidence.",
            )
        ],
        overall_confidence="HIGH",
    )


def _bare_mention_response() -> ResumeExtractionResponse:
    return ResumeExtractionResponse(
        candidate=CandidateIdentity(),
        competency_evidence=[
            CompetencyEvidence(
                competency_id="sql",
                competency_name="SQL",
                evidence="SQL",
                evidence_strength="VERY_WEAK",
                estimated_level_range=EstimatedLevelRange(min=1, max=2),
                confidence="LOW",
                reasoning="Bare skill-list mention with no supporting context.",
            )
        ],
        overall_confidence="LOW",
    )


def test_strong_evidence_yields_higher_confidence_than_bare_mention():
    """SC-001 (Phase 1 spec): detailed evidence must produce a strictly higher confidence signal
    than a bare-name mention of the same competency."""
    strong = _upload("strong_evidence_resume.docx", _strong_evidence_response())
    bare = _upload("bare_mention_resume.docx", _bare_mention_response())

    assert strong.status_code == 201, strong.text
    assert bare.status_code == 201, bare.text

    strong_item = next(i for i in strong.json()["initial_profile"] if i["competency_id"] == "sql")
    bare_item = next(i for i in bare.json()["initial_profile"] if i["competency_id"] == "sql")

    confidence_rank = {"LOW": 0, "MEDIUM": 1, "HIGH": 2}
    assert confidence_rank[strong_item["resume_confidence"]] > confidence_rank[bare_item["resume_confidence"]]
    assert strong_item["resume_estimated_level"] > bare_item["resume_estimated_level"]


def test_unmapped_term_is_surfaced_not_silently_dropped(caplog):
    """SC-002 (Phase 1 spec): a resume term that doesn't map to any competency must be surfaced
    (logged) as unmapped, never silently discarded nor forced onto an unrelated competency. Current
    implementation (backend/src/api/candidates.py) logs unmapped_terms via logger.info — this test
    confirms that actually happens for a controlled Mistral response containing one."""
    mocked = ResumeExtractionResponse(
        candidate=CandidateIdentity(),
        competency_evidence=[
            CompetencyEvidence(
                competency_id="sql",
                competency_name="SQL",
                evidence="Used SQL for reporting.",
                evidence_strength="WEAK",
                estimated_level_range=EstimatedLevelRange(min=1, max=2),
                confidence="LOW",
            )
        ],
        unmapped_terms=["Tobalt Streamweaver"],
        overall_confidence="LOW",
    )

    import logging

    with caplog.at_level(logging.INFO, logger="backend.src.api.candidates"):
        resp = _upload("unmapped_term_resume.docx", mocked)

    assert resp.status_code == 201, resp.text
    # The unmapped term must not appear mapped to any competency_id in the returned profile...
    mapped_names = {item["competency_name"] for item in resp.json()["initial_profile"]}
    assert "Tobalt Streamweaver" not in mapped_names
    # ...but it must be surfaced somewhere (logged), not silently vanish.
    assert any("Tobalt Streamweaver" in record.message for record in caplog.records)


def test_hallucinated_competency_id_is_discarded_not_trusted():
    """FR-003 (Phase 1 spec): a competency_id the LLM returns that isn't one of the ids it was
    actually supplied with must be discarded, never persisted or returned as-is."""
    mocked = ResumeExtractionResponse(
        candidate=CandidateIdentity(),
        competency_evidence=[
            CompetencyEvidence(
                competency_id="totally_made_up_id_not_in_framework",
                competency_name="Some Fabricated Skill",
                evidence="fabricated",
                evidence_strength="WEAK",
                estimated_level_range=EstimatedLevelRange(min=1, max=2),
                confidence="LOW",
            )
        ],
        overall_confidence="LOW",
    )

    resp = _upload("bare_mention_resume.docx", mocked)
    assert resp.status_code == 201, resp.text
    returned_ids = {item["competency_id"] for item in resp.json()["initial_profile"]}
    assert "totally_made_up_id_not_in_framework" not in returned_ids
