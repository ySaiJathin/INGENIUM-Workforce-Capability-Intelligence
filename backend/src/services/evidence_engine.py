"""
Phase 6 (Evidence + RAG + MCP) — evidence retrieval service.

Lazy-loads the FAISS index + metadata built offline by build_evidence_index.py (never rebuilds at
request time — research.md §1/FR-003) and answers similarity queries. Pattern matches
course_recommendation_engine.py's _get_model()/_get_course_embeddings() lazy-singleton approach.
"""

from __future__ import annotations

import json
import threading
from pathlib import Path

from backend.src.schemas.evidence import EvidenceItem

ROOT = Path(__file__).resolve().parent.parent.parent.parent
INDEX_PATH = ROOT / "data" / "index" / "evidence.faiss"
META_PATH = ROOT / "data" / "index" / "evidence_meta.json"

_model = None
_index = None
_meta: list[dict] | None = None
_lock = threading.Lock()


class EvidenceIndexUnavailableError(RuntimeError):
    """Raised when the evidence index hasn't been built yet (fresh environment, first run) or
    its files are otherwise missing/unreadable — never a raw FileNotFoundError/crash."""


def _get_model():
    global _model
    with _lock:
        if _model is None:
            from sentence_transformers import SentenceTransformer

            _model = SentenceTransformer("models/all-MiniLM-L6-v2")
    return _model


def _load_index_and_meta():
    """Loads the persisted index + metadata once, reused across every request. Raises
    EvidenceIndexUnavailableError (never a raw exception) if the build artifacts are missing."""
    global _index, _meta
    with _lock:
        if _index is None or _meta is None:
            if not INDEX_PATH.exists() or not META_PATH.exists():
                raise EvidenceIndexUnavailableError(
                    f"Evidence index not found at {INDEX_PATH} — run "
                    "backend/src/scripts/build_evidence_index.py first."
                )
            import faiss  # imported here, not at module top, so importing this module never

            # requires faiss to be installed just to construct the (rare) "index missing" error path
            # in an environment that hasn't set it up — matches the lazy-load spirit throughout.
            _index = faiss.read_index(str(INDEX_PATH))
            _meta = json.loads(META_PATH.read_text(encoding="utf-8"))
    return _index, _meta


def query(text: str, top_k: int = 5) -> list[EvidenceItem]:
    """Returns up to top_k EvidenceItem results, ranked by cosine similarity (descending). Raises
    EvidenceIndexUnavailableError if the index hasn't been built — callers (the MCP tool) convert
    this into a typed MCPToolError; never a crash."""
    index, meta = _load_index_and_meta()
    model = _get_model()

    query_vector = model.encode([text], normalize_embeddings=True).astype("float32")
    k = min(top_k, index.ntotal) if index.ntotal > 0 else 0
    if k == 0:
        return []

    similarities, ids = index.search(query_vector, k)

    results: list[EvidenceItem] = []
    for similarity, idx in zip(similarities[0], ids[0], strict=True):
        if idx < 0 or idx >= len(meta):
            continue  # FAISS pads with -1 if fewer than k results exist — skip, never index-error
        entry = meta[idx]
        results.append(
            EvidenceItem(
                id=entry["id"],
                source_type=entry["source_type"],
                source_id=entry["source_id"],
                text=entry["text"],
                similarity=float(similarity),
            )
        )
    return results


def _reset_for_tests() -> None:
    """Test-only helper: clears the lazy-loaded singletons so a test can simulate a fresh process
    (e.g., pointing at a temporarily-missing index) without restarting the interpreter."""
    global _model, _index, _meta
    with _lock:
        _model = None
        _index = None
        _meta = None
