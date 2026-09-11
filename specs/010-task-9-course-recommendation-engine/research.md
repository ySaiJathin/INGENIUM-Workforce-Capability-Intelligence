# Phase 0 Research: Task 9 — Course Recommendation Engine

## 1. Deterministic overlap matching

- **Decision**: For each gap's competency id, find every course whose `course_competencies` includes that
  id; score = `sum(coverage_weight for each overlapping competency) * course.priority_tiebreak`. Sort
  descending.
- **Rationale**: `total_buildplan.md` §11's baseline: "deterministic matching first; explainable output
  for every recommendation."
- **Alternatives considered**: Matching on course title/description text only — rejected, far less
  precise than the already-curated `course_competencies` mapping from Task 1.

## 2. MiniLM semantic re-ranking

- **Decision**: Precompute a MiniLM embedding for every course (title + description) once at process
  startup and cache it in memory (per Rule 13's "cache embeddings"). For a gap with zero or few
  deterministic matches, compute a query embedding for the gapped competency's name/description and
  cosine-similarity it against all cached course embeddings, surfacing any course above a similarity
  threshold as an additional candidate — but always listed after any exact deterministic match for that
  gap, per FR-003.
- **Rationale**: `total_buildplan.md` §11: "If using embeddings: candidate gap → MiniLM embedding →
  course embeddings → cosine similarity → candidate courses → deterministic ranking." Caching at startup
  avoids repeated computation across requests (Rule 13).
- **Alternatives considered**: FAISS-backed similarity search — explicitly rejected at this catalogue
  size (§17). Re-embedding on every request — rejected as wasteful (Rule 13's "avoid duplicate
  computation").

## 3. Fallback when semantic matching is unavailable

- **Decision**: Wrap the MiniLM embedding/similarity step in error handling that, on any failure (model
  load error, computation error), logs the specific failure and proceeds with deterministic-only results
  rather than raising to the caller.
- **Rationale**: `total_buildplan.md` §18 risk table: "Semantic matching fails → fall back to
  deterministic competency overlap." Matches the project's standing rule against swallowing exceptions
  silently — the failure is logged with what/where/why, just not propagated as a user-facing error.
- **Alternatives considered**: Failing the whole `/analysis/{id}/courses` request if MiniLM is
  unavailable — rejected, deterministic matching alone is a fully valid, useful result on its own.

## 4. Combining recommendations across multiple gaps

- **Decision**: Build the final recommendation set by iterating gaps in rank order, and for each matched
  course already added to the result (from an earlier gap), merge the new gap into its `match_reason`
  list instead of adding a duplicate entry.
- **Rationale**: Implements FR-008 — a course covering multiple gaps should appear once, with a combined
  explanation, avoiding a confusing repeated-course list in the UI.
- **Alternatives considered**: One recommendation row per (gap, course) pair, deduplicated only at
  display time in the frontend — rejected, pushes an avoidable business-logic decision onto Task 14's UI
  layer instead of keeping it backend-owned (Rule 4's spirit).

## Outcome

All Technical Context fields in `plan.md` are resolved with no remaining `NEEDS CLARIFICATION` markers.
Proceeding to Phase 1 (contracts/ — `data-model.md`/`quickstart.md` intentionally omitted, see plan.md).
