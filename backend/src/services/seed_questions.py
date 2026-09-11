"""
Static seed-question lookup (Task 6's Rule 5 fallback source).

data/curated/assessment_seed.json is intentionally NOT a database table (Task 2's spec, Assumptions —
it's config/reference data read directly, like the curated JSON files themselves before Task 2 seeds
the DB-backed reference tables). Loaded once at import; the file is small (~29 rows) and static for
the life of the process.

"Already used" is tracked by prompt text, not a separate seed-id column on `questions` — Task 2's
schema has no such column, and FR-005 already requires a no-duplicate-content check against this
session's history for any question source, so seed reuse-detection reuses that same mechanism instead
of adding a new column (Rule 10/13).
"""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent.parent
_SEED_FILE = ROOT / "data" / "curated" / "assessment_seed.json"

_seed_questions: list[dict] | None = None


def _load() -> list[dict]:
    global _seed_questions
    if _seed_questions is None:
        _seed_questions = json.loads(_SEED_FILE.read_text(encoding="utf-8"))
    return _seed_questions


def get_seed_question(competency_id: str, requested_difficulty: int, already_asked_prompts: set[str]) -> dict | None:
    """research.md §5: prefer the closest-difficulty unused seed for this competency; return None
    if every seed for this competency is already used in this session (caller falls back further)."""
    candidates = [
        q
        for q in _load()
        if q["competency_id"] == competency_id and q["question"] not in already_asked_prompts
    ]
    if not candidates:
        return None
    return min(candidates, key=lambda q: abs(q["difficulty"] - requested_difficulty))


def get_any_unused_seed_for_role(competency_ids: list[str], already_asked_prompts: set[str]) -> dict | None:
    """research.md §5's further fallback: any unused seed question for the same role's competencies,
    when the exact competency has none left — still respects 'never repeat a question' (FR-005)."""
    candidates = [
        q
        for q in _load()
        if q["competency_id"] in competency_ids and q["question"] not in already_asked_prompts
    ]
    return candidates[0] if candidates else None
