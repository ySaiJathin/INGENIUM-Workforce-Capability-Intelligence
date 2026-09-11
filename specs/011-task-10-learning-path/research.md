# Phase 0 Research: Task 10 — Learning Path

## 1. Step ordering algorithm

- **Decision**: Start from Task 8's already-ranked gap order. Topologically adjust: whenever gap A's
  competency is a prerequisite (parent, per the hierarchy) of gap B's competency and both are present,
  move A's step before B's, preserving relative rank order otherwise. The resulting course sequence
  follows this adjusted gap order, deduplicated by course (Task 9's single-recommendation-per-course
  rule).
- **Rationale**: `total_buildplan.md` §12: "Ordered output from ranked gaps + matched courses, considering
  gap severity, role priority, prerequisites, estimated duration." A stable topological adjustment on top
  of the existing rank order is simple, explainable, and reuses Task 8's ranking work rather than
  re-deriving it.
- **Alternatives considered**: A full topological sort from scratch, discarding Task 8's rank — rejected,
  would lose the gap-severity/role-priority information Task 8 already computed; a pure duration-based
  ordering (shortest course first) — rejected, `total_buildplan.md` §12's example
  ("1. Advanced SQL Queries → 2. Window Functions → 3. SQL Performance Optimization") shows
  prerequisite/severity order taking precedence over duration.

## 2. Handling an unmatched gap

- **Decision**: Gaps in Task 9's `unmatched_gaps` are excluded from `steps` but listed in a separate
  `gaps_without_courses` field in the response, so the frontend can display them as "no course available
  yet" rather than the candidate wondering why a known gap vanished.
- **Rationale**: Implements FR-007/SC-004 directly.
- **Alternatives considered**: Silently omitting them — rejected, explicitly the failure mode this
  requirement guards against.

## 3. Mistral rationale call

- **Decision**: After ordering is finalized, optionally call Mistral once per step (or, to conserve calls
  per Rule 13, once for the whole path with all steps in one prompt) to generate a short natural-language
  "why this step, why now" explanation; on failure, leave `rationale: null` for the affected step(s) and
  proceed — never blocking the response.
- **Rationale**: `total_buildplan.md` §12: "Mistral may supply the natural-language explanation; ordering
  stays deterministic." Batching into one call per path (rather than one per step) directly follows
  Rule 13's "minimize LLM calls, keep prompts small."
- **Alternatives considered**: No Mistral rationale at all (pure deterministic labels) — a valid P1-cut
  fallback if time runs short, but the spec allows it as optional/best-effort rather than excluding it
  outright, since it adds explainability value cheaply when time permits.

## Outcome

All Technical Context fields in `plan.md` are resolved with no remaining `NEEDS CLARIFICATION` markers.
Proceeding to Phase 1 (contracts/ — `data-model.md`/`quickstart.md` intentionally omitted, see plan.md).
