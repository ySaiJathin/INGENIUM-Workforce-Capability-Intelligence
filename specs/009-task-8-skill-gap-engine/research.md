# Phase 0 Research: Task 8 — Skill Gap Engine

## 1. Ranking formula

- **Decision**: `rank_score = gap_magnitude_normalized * W1 + role_priority_normalized * W2 +
  prerequisite_importance_normalized * W3`, with `W1 > W2 > W3` (gap size matters most, then role
  priority, then hierarchy position), sorted descending; ties broken by competency id for determinism.
- **Rationale**: `total_buildplan.md` §10: "Rank gaps by: gap magnitude + role priority + dependency/
  prerequisite importance. Return the highest-value gaps first." This is a direct, simple weighted-sum
  instantiation of that rule.
- **Alternatives considered**: Magnitude-only ranking — rejected as too naive to reflect role-priority
  differences the demo wants to showcase (spec Assumptions/Success Criteria). A complex multi-factor
  statistical model — rejected as unneeded complexity at 5–10 competencies per role.

## 2. Prerequisite importance

- **Decision**: A competency with children in the hierarchy (`competencies.json`'s
  `parent_competency_id` relationships, e.g. "SQL" is a parent of "Window Functions") scores higher
  prerequisite importance than a leaf competency, since closing it unblocks understanding of its
  children.
- **Rationale**: Reuses the hierarchy already curated in Task 1 rather than introducing a new
  prerequisite graph/dataset, keeping this phase dependency-free per `CLAUDE.md` Rule 13.
- **Alternatives considered**: A separate explicit prerequisite-edge dataset — rejected, redundant with
  the existing competency hierarchy and out of scope for the MVP's data budget (Task 1's spec).

## 3. Zero-gap handling

- **Decision**: `POST /analysis` always succeeds and always returns an `analysis_id`; `GET
  /analysis/{id}/gaps` returns an empty array when there are no gaps, with the API contract documenting
  that an empty array means "no gaps," not "not yet computed."
- **Rationale**: Directly implements spec FR-006/SC-003 — an empty result must be unambiguous, not
  confusable with an error or a pending state.
- **Alternatives considered**: A distinct `"no_gaps": true` flag alongside an always-empty-when-true
  array — considered but rejected as redundant; an empty array is sufficient and simpler for the frontend
  to check.

## Outcome

All Technical Context fields in `plan.md` are resolved with no remaining `NEEDS CLARIFICATION` markers.
Proceeding to Phase 1 (contracts/ — `data-model.md`/`quickstart.md` intentionally omitted, see plan.md).
