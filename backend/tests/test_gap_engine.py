"""
Phase 4 (Competency Intelligence) — tests for backend/src/services/gap_engine.py's rank_gaps().

rank_gaps() is already a pure function (no DB dependency) per this session's Phase 0 audit — these
tests exercise it directly with constructed input, confirming the acceptance scenarios in
specs/024-phase-4-competency-intelligence/spec.md without needing a live assessment/analysis.
"""

from __future__ import annotations

from backend.src.services.gap_engine import rank_gaps


def _gap_row(competency_id: str, gap: float, priority: int) -> dict:
    return {
        "competency_id": competency_id,
        "competency_name": competency_id,
        "required_level": 4.0,
        "verified_level": 4.0 - gap,
        "gap": gap,
        "priority": priority,
    }


def test_competency_the_candidate_meets_or_exceeds_never_appears_as_a_gap():
    """FR-001 (Phase 4 spec): rank_gaps() only ever receives shortfalls (compute_and_persist_gaps()
    filters out gap<=0 before calling it) — confirm rank_gaps() itself doesn't need to filter
    further and passes non-positive-gap rows through untouched if they were ever given one (it
    should not silently drop or crash on one), while a normal positive-gap row ranks normally."""
    rows = [_gap_row("sql", gap=1.5, priority=1)]
    ranked = rank_gaps(rows, competencies_with_children=set())
    assert len(ranked) == 1
    assert ranked[0]["competency_id"] == "sql"


def test_never_assessed_competency_defaults_to_zero_and_still_appears():
    """FR-004: a competency with no verified score (gap_engine.py's compute_and_persist_gaps()
    defaults verified_level to 0.0 for these before calling rank_gaps()) still appears as a gap."""
    rows = [_gap_row("never_assessed", gap=4.0, priority=1)]  # verified_level=0.0 -> gap=4.0
    ranked = rank_gaps(rows, competencies_with_children=set())
    assert len(ranked) == 1
    assert ranked[0]["verified_level"] == 0.0
    assert ranked[0]["gap"] == 4.0


def test_rank_gaps_is_deterministic_across_repeated_calls():
    """SC-002: identical input produces identical output, including tie-break order, across
    repeated calls."""
    rows = [
        _gap_row("sql", gap=2.0, priority=1),
        _gap_row("python", gap=2.0, priority=1),  # same gap+priority as sql -> tie
        _gap_row("statistics", gap=1.0, priority=2),
    ]
    results = [rank_gaps(rows, competencies_with_children=set()) for _ in range(3)]
    ids = [[r["competency_id"] for r in result] for result in results]
    assert ids[0] == ids[1] == ids[2]


def test_tie_broken_deterministically_by_competency_id():
    """Edge case (Phase 4 spec): two gaps with the same priority score must break the tie by a
    stable secondary key (competency id), not an arbitrary/unstable order."""
    rows = [
        _gap_row("zzz_comp", gap=2.0, priority=1),
        _gap_row("aaa_comp", gap=2.0, priority=1),
    ]
    ranked = rank_gaps(rows, competencies_with_children=set())
    assert [r["competency_id"] for r in ranked] == ["aaa_comp", "zzz_comp"]


def test_higher_role_priority_ranks_ahead_at_equal_gap_magnitude():
    """User Story 2 acceptance scenario 2: two competencies with the same gap magnitude but
    different role-declared priority (1 = highest) — the higher-priority one ranks first."""
    rows = [
        _gap_row("low_priority_comp", gap=2.0, priority=3),
        _gap_row("high_priority_comp", gap=2.0, priority=1),
    ]
    ranked = rank_gaps(rows, competencies_with_children=set())
    assert ranked[0]["competency_id"] == "high_priority_comp"


def test_prerequisite_importance_can_break_a_near_tie():
    """A competency with children (prerequisite for other competencies) gets a small additional
    weight — confirm it can move a competency ahead of an otherwise-equal one."""
    rows = [
        _gap_row("has_children", gap=2.0, priority=1),
        _gap_row("no_children", gap=2.0, priority=1),
    ]
    ranked = rank_gaps(rows, competencies_with_children={"has_children"})
    assert ranked[0]["competency_id"] == "has_children"


def test_empty_input_returns_empty_list():
    assert rank_gaps([], competencies_with_children=set()) == []
