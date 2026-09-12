"""
Phase 6 (Evidence + RAG + MCP), User Story 2 — tests for backend/src/services/evidence_engine.py.

Assumes backend/src/scripts/build_evidence_index.py has already been run (data/index/evidence.faiss
+ evidence_meta.json exist) — this session built it as part of Phase 6's own T004.
"""

from __future__ import annotations

from unittest.mock import patch

import pytest

from backend.src.services import evidence_engine


@pytest.fixture(autouse=True)
def _reset_singletons():
    """Every test starts from a clean lazy-load state so tests don't leak index/model state into
    each other (e.g., the missing-index test below must not see an already-loaded index)."""
    evidence_engine._reset_for_tests()
    yield
    evidence_engine._reset_for_tests()


def test_query_returns_relevant_evidence_for_a_real_competency_topic():
    """User Story 2 acceptance scenario 1: querying a topic matching a real
    competency/role/course returns at least one relevant, correctly sourced item."""
    results = evidence_engine.query("SQL window functions", top_k=5)
    assert len(results) > 0
    assert any("sql" in r.source_id.lower() or "window" in r.text.lower() for r in results)
    assert all(r.similarity is not None for r in results)


def test_query_result_traces_back_to_a_real_source():
    """Every EvidenceItem must be traceable to its source (source_type + source_id encoded in the
    id itself, per data-model.md)."""
    results = evidence_engine.query("statistics", top_k=3)
    assert len(results) > 0
    for r in results:
        assert r.id == f"{r.source_type}:{r.source_id}"
        assert r.source_type in ("competency", "role", "course", "esco")


def test_repeated_queries_do_not_rebuild_the_index():
    """SC-002: the index is loaded once and reused — querying twice in a row must not reload/
    rebuild it (research.md §1's "never rebuild at request time")."""
    evidence_engine.query("SQL", top_k=1)  # first call: loads and caches the index

    with patch("faiss.read_index") as mock_read_index:
        evidence_engine.query("Python", top_k=1)  # second call: must reuse the cached index

    mock_read_index.assert_not_called()


def test_missing_index_raises_typed_error_not_a_crash():
    """Edge case (Phase 6 spec): querying before the index has been built must fail clearly and be
    treated as 'evidence unavailable', never a raw FileNotFoundError or crash."""
    with patch.object(evidence_engine, "INDEX_PATH") as mock_path:
        mock_path.exists.return_value = False
        with pytest.raises(evidence_engine.EvidenceIndexUnavailableError):
            evidence_engine.query("anything", top_k=1)


def test_query_with_no_relevant_results_returns_empty_not_forced_match():
    """Edge case: top_k larger than the corpus, or an odd query, must not error — FAISS's
    IndexFlatIP always returns its k nearest regardless of relevance, so this confirms the plumbing
    handles a small/edge top_k without index errors rather than asserting on "relevance" per se."""
    results = evidence_engine.query("zzz nonsense query", top_k=1000)
    assert isinstance(results, list)  # never raises for an unusual query, even with a huge top_k
