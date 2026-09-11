"""
Skill-name -> curated competency id mapping (Task 4, research.md §4). Deterministic exact/alias
match first; MiniLM cosine-similarity fallback for near-misses; discard below threshold rather than
guess wrong (Rule 4 — the backend, not Mistral, owns this mapping decision).

Since total_buildplan.md §27.2, Mistral is given the competency framework directly and returns
competency_id itself for most evidence items — this module is now used as an optional best-effort
salvage pass over whatever Mistral leaves in `unmapped_terms` (or a null competency_id), not the
primary mapping mechanism (see research.md §4's superseded-decision note).
"""

from __future__ import annotations

import re
import threading

from backend.src.models import Competency

_SIMILARITY_THRESHOLD = 0.55
_model_lock = threading.Lock()
_model = None  # lazy-loaded — Task 9 also uses MiniLM; avoid loading it if never needed (Rule 13)


def _normalize(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", text.lower()).strip()


def _get_model():
    global _model
    with _model_lock:
        if _model is None:
            from sentence_transformers import SentenceTransformer

            _model = SentenceTransformer("models/all-MiniLM-L6-v2")
    return _model


def map_to_competency(skill_name: str, competencies: list[Competency]) -> str | None:
    """Returns a curated competency id, or None if nothing matches confidently enough — a
    discarded item contributes no evidence rather than mapping to the wrong competency."""
    normalized_skill = _normalize(skill_name)

    # Exact/alias match: normalized skill name equals a competency's normalized name.
    for comp in competencies:
        if _normalize(comp.name) == normalized_skill:
            return comp.id

    # Substring match as a cheap deterministic second pass (e.g. "SQL" in "Advanced SQL").
    for comp in competencies:
        comp_norm = _normalize(comp.name)
        if comp_norm and (comp_norm in normalized_skill or normalized_skill in comp_norm):
            return comp.id

    # MiniLM cosine-similarity fallback for near-misses (e.g. "GROUP BY techniques" -> SQL Aggregation).
    if not competencies:
        return None

    model = _get_model()
    comp_names = [c.name for c in competencies]
    skill_embedding = model.encode([skill_name], normalize_embeddings=True)[0]
    comp_embeddings = model.encode(comp_names, normalize_embeddings=True)

    import numpy as np

    similarities = comp_embeddings @ skill_embedding
    best_idx = int(np.argmax(similarities))
    if similarities[best_idx] >= _SIMILARITY_THRESHOLD:
        return competencies[best_idx].id
    return None
