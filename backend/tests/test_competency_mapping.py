"""
Phase 1 (Resume Intelligence) — unit tests for the deterministic competency mapper
(backend/src/services/competency_mapping.py).

These exercise map_to_competency() as a pure function over in-memory Competency objects — no
database session or Mistral call needed, since the function only reads .id/.name off whatever
Competency instances it's given (constructing them without persisting is fine for that; SQLAlchemy
only enforces nullable/FK constraints at flush time, which never happens here).
"""

from __future__ import annotations

from backend.src.models import Competency
from backend.src.services.competency_mapping import map_to_competency


def _make_competencies() -> list[Competency]:
    return [
        Competency(id="sql", name="SQL", description="Structured Query Language", proficiency_scale_max=5),
        Competency(id="python", name="Python", description="Python programming", proficiency_scale_max=5),
        Competency(
            id="sql_window_functions",
            name="SQL Window Functions",
            description="Window functions in SQL",
            proficiency_scale_max=5,
        ),
    ]


def test_exact_match_returns_competency_id():
    comps = _make_competencies()
    assert map_to_competency("SQL", comps) == "sql"


def test_substring_match_returns_more_general_competency():
    """FR (Phase 1 spec, Edge Cases): a term that could plausibly match two entries (e.g. "SQL"
    appearing where both "SQL" and "SQL Window Functions" exist) must prefer the more general,
    exactly-named entry over guessing at the more specific one."""
    comps = _make_competencies()
    # "SQL" itself is an exact match against the "sql" competency, not the window-functions one.
    assert map_to_competency("sql", comps) == "sql"


def test_unmapped_term_returns_none_not_a_wrong_competency():
    """FR-002/FR-003 (Phase 1 spec): a term with no confident match must return None (the caller's
    signal to treat it as unmapped) rather than being forced onto an unrelated competency."""
    comps = _make_competencies()
    result = map_to_competency("Quantum Chromodynamics", comps)
    assert result is None


def test_empty_competency_list_returns_none():
    assert map_to_competency("SQL", []) is None


def test_deterministic_layer_is_stable_across_repeated_calls():
    """SC-004 (Phase 1 spec): re-processing the same input through the deterministic layer must
    produce identical output every time."""
    comps = _make_competencies()
    results = {map_to_competency("SQL", comps) for _ in range(3)}
    assert results == {"sql"}

    # Also confirm stability for a near-miss that goes through the MiniLM fallback path, since
    # that path is the one most plausible to vary run-to-run if it were, e.g., seeded randomly.
    near_miss_results = {map_to_competency("structured query language basics", comps) for _ in range(3)}
    assert len(near_miss_results) == 1
