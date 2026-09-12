"""
Phase 6 (Evidence + RAG + MCP) — offline evidence-index builder.

Reads data/curated/{competencies,roles,courses}.json (the platform's own curated data — never
external/invented content, per FR-001), embeds each record with all-MiniLM-L6-v2, and writes a
persistent FAISS index. Run this manually whenever curated data changes:

    .venv/Scripts/python.exe backend/src/scripts/build_evidence_index.py

Never run automatically at request time (FR-003, research.md §1) — evidence_engine.py only ever
loads what this script already built.
"""

from __future__ import annotations

import json
from pathlib import Path

import faiss
import numpy as np

ROOT = Path(__file__).resolve().parent.parent.parent.parent
CURATED_DIR = ROOT / "data" / "curated"
INDEX_DIR = ROOT / "data" / "index"


def _load_json(name: str) -> list[dict]:
    return json.loads((CURATED_DIR / name).read_text(encoding="utf-8"))


def _build_evidence_items() -> list[dict]:
    """Returns a list of {id, source_type, source_id, text} dicts — the same shape as
    EvidenceItem minus `similarity` (data-model.md)."""
    items: list[dict] = []

    for comp in _load_json("competencies.json"):
        items.append(
            {
                "id": f"competency:{comp['id']}",
                "source_type": "competency",
                "source_id": comp["id"],
                "text": f"{comp['name']}. {comp['description']}",
            }
        )

    for role in _load_json("roles.json"):
        items.append(
            {
                "id": f"role:{role['id']}",
                "source_type": "role",
                "source_id": role["id"],
                "text": f"{role['name']}. {role['description']}",
            }
        )

    for course in _load_json("courses.json"):
        items.append(
            {
                "id": f"course:{course['id']}",
                "source_type": "course",
                "source_id": course["id"],
                "text": f"{course['title']} ({course['provider']}). {course['description']}",
            }
        )

    # ESCO slice: intentionally not added in this pass — the three curated sources above already
    # give broad, relevant coverage for grounding (competency/role/course descriptions), and Rule 7
    # treats the ESCO CSVs as optional reference material, not a required part of this pipeline.
    # Add a bounded slice here later (referenced by competencies' esco_source_id / roles'
    # esco_occupation_id) only if a real grounding gap is found in practice.

    return items


def build_and_save_index() -> int:
    from sentence_transformers import SentenceTransformer

    items = _build_evidence_items()
    if not items:
        raise RuntimeError("No evidence items found — check data/curated/*.json exist and are non-empty")

    model = SentenceTransformer("models/all-MiniLM-L6-v2")
    texts = [item["text"] for item in items]
    vectors = model.encode(texts, normalize_embeddings=True)
    vectors = np.asarray(vectors, dtype="float32")

    dimension = vectors.shape[1]
    index = faiss.IndexFlatIP(dimension)
    index.add(vectors)

    INDEX_DIR.mkdir(parents=True, exist_ok=True)
    faiss.write_index(index, str(INDEX_DIR / "evidence.faiss"))
    (INDEX_DIR / "evidence_meta.json").write_text(json.dumps(items, indent=2), encoding="utf-8")

    return len(items)


if __name__ == "__main__":
    count = build_and_save_index()
    print(f"Built evidence index with {count} items -> {INDEX_DIR}")
