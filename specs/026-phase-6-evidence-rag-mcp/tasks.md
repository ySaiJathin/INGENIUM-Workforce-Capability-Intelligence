---
description: "Task list for Phase 6 — Evidence + RAG + MCP"
---

# Tasks: Phase 6 — Evidence + RAG + MCP

**Input**: Design documents from `/specs/026-phase-6-evidence-rag-mcp/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md,
contracts/evidence-and-learning-path.md, quickstart.md. Depends on Phase 2 (MCP layer), Phase 4
(gaps), and Phase 5 (courses).

**Tests**: Explicitly included — spec.md's SC-001 (zero fabricated references) is the central
guarantee this phase exists to prove, and needs a real grounding-validator test.

**Organization**: US1 = grounded learning plan, US2 = evidence retrievable/traceable/never rebuilt
live — per spec.md.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

- [ ] T001 Add `faiss-cpu` to `requirements.txt` (the second and final authorized new dependency per `CLAUDE.md`'s updated Rule 12) and install it into `.venv`
- [ ] T002 [P] Create `backend/src/schemas/evidence.py` with the `EvidenceItem` model per `data-model.md`

---

## Phase 2: Foundational

**Purpose**: The offline index build — nothing in this phase works without it.

**⚠️ CRITICAL**: Both user stories depend on a built index existing.

- [ ] T003 Write `backend/src/scripts/build_evidence_index.py`: read `data/curated/competencies.json`, `data/curated/roles.json`, `data/curated/courses.json` (+ optionally a bounded ESCO slice referenced by curated `esco_source_id`/`esco_occupation_id` fields), build one `EvidenceItem` per record (id encoding `source_type:source_id`), embed each with `all-MiniLM-L6-v2` (`normalize_embeddings=True`), build a `faiss.IndexFlatIP`, write `data/index/evidence.faiss` + `data/index/evidence_meta.json`
- [ ] T004 Run `build_evidence_index.py` once; confirm the printed item count matches `len(competencies) + len(roles) + len(courses)` (+ ESCO slice size if used)

**Checkpoint**: A real, queryable evidence index exists on disk.

---

## Phase 3: User Story 2 - Evidence is retrievable, traceable, and never rebuilt live (Priority: P2, built first as this is US1's dependency)

**Goal**: A retrieval service that loads the persisted index once and queries it without rebuilding.

**Independent Test**: Query the built index with several topics; confirm relevant, correctly
sourced results and no rebuild between queries.

### Tests for User Story 2

- [ ] T005 [P] [US2] Test in `backend/tests/test_evidence_engine.py`: querying a topic matching a real competency's name/description returns that `EvidenceItem` among the top results
- [ ] T006 [P] [US2] Test in `backend/tests/test_evidence_engine.py`: querying twice in a row does not call the index-build function again (patch/mock the loader and assert single invocation) — proves SC-002's "no rebuild between queries"
- [ ] T007 [US2] Test in `backend/tests/test_evidence_engine.py`: querying against a missing index (rename/delete `data/index/evidence.faiss` in a fixture temp dir) raises a clear, typed error — never a crash — satisfying the Edge Case "index not yet built"

### Implementation for User Story 2

- [ ] T008 [US2] Implement `backend/src/services/evidence_engine.py`: a lazy singleton loader for the FAISS index + `evidence_meta.json` (pattern matching `course_recommendation_engine.py`'s `_get_model()`/`_get_course_embeddings()`), and a `query(text: str, top_k: int = 5) -> list[EvidenceItem]` function using cosine similarity via `IndexFlatIP`
- [ ] T009 [US2] Wire `backend/src/mcp/tools.py::get_relevant_evidence` (stubbed in Phase 2 to always raise) to call `evidence_engine.query()`, returning a real `RelevantEvidenceResult` and converting "index missing" into `MCPToolError(reason="index_unavailable")`

**Checkpoint**: User Story 2 complete — evidence is retrievable and traceable.

---

## Phase 4: User Story 1 - A learning plan grounded in retrievable evidence (Priority: P1) 🎯 MVP (delivers the phase's primary user-facing value)

**Goal**: Generate learning plans whose explanatory text is grounded in real, retrieved/supplied
data, with any unsupported claim stripped before display.

**Independent Test**: Generate a plan for a candidate with known gaps; confirm every referenced
entity traces to evidence or supplied deterministic data.

### Tests for User Story 1

- [ ] T010 [P] [US1] Test in `backend/tests/test_learning_plan_planner.py`: given a mocked Mistral response referencing only real supplied courses/gaps/evidence, the grounding validator reports `grounded=True` and `removed_claims=[]`
- [ ] T011 [P] [US1] Test in `backend/tests/test_learning_plan_planner.py`: given a mocked Mistral response referencing a fabricated course name not in the supplied data, the grounding validator strips that reference and reports it in `removed_claims` (SC-001 — this is the central test of the whole phase)
- [ ] T012 [US1] Test in `backend/tests/test_learning_plan_planner.py`: the plan's step ordering always matches the input gap/course order exactly, even if the mocked Mistral response tries to reorder steps (FR-006/SC-004)
- [ ] T013 [US1] Test in `backend/tests/test_learning_plan_planner.py`: when Mistral or `evidence_engine` raises, `build_grounded_learning_path()` falls back to calling `learning_path_engine.py`'s existing deterministic function and returns a valid plan with `grounding=None` (FR-007/SC-003)

### Implementation for User Story 1

- [ ] T014 [US1] Implement `backend/src/services/learning_plan_planner.py`: assemble candidate verified profile + priority gaps (via `mcp.tools.get_gap_analysis`) + recommended courses (via `mcp.tools.get_course_recommendations`) + retrieved evidence (via `mcp.tools.get_relevant_evidence`, querying per top gap/course), call `mistral_client` with a RAG-planner prompt instructing it to use only supplied material (no new prompt constant needed beyond following `BASE_RULES`'s existing pattern in `mistral_client.py`)
- [ ] T015 [US1] Implement the grounding validator in `learning_plan_planner.py`: extract every course/provider/skill/duration string the generated plan text references, check membership against the supplied gaps/courses/evidence, strip unsupported ones, build a `GroundingReport` (`supported_claims`, `removed_claims`, `grounded`)
- [ ] T016 [US1] Implement the deterministic fallback path in `learning_plan_planner.py` (or delegate to the existing `learning_path_engine.py` unchanged) for when Mistral/evidence retrieval is unavailable, returning `grounding=None`
- [ ] T017 [US1] Modify `backend/src/api/learning_path.py`: call `learning_plan_planner.build_grounded_learning_path()` first, falling back to `learning_path_engine.py`'s existing function on any failure; add the additive `grounding: GroundingReport | None` field to the response (no existing field renamed/removed — confirm `frontend/src/pages/LearningPath.tsx` and `frontend/src/components/learning/LearningPathTimeline.tsx` still work unchanged, since `rationale` was already optional)

**Checkpoint**: User Story 1 complete — grounded learning plans work, with a proven, tested
fallback. Phase 6 (and the whole master-document initiative) is functionally complete at this
point.

---

## Phase 5: Polish & Cross-Cutting

- [ ] T018 Run `specs/026-phase-6-evidence-rag-mcp/quickstart.md` end to end and record actual output
- [ ] T019 [P] Update `README.md` with a note on when to re-run `build_evidence_index.py` (whenever `data/curated/*.json` changes) since the index is never rebuilt automatically
- [ ] T020 Confirm `frontend/src/pages/LearningPath.tsx` renders correctly with `grounding: null` (fallback case) and doesn't crash if the new field is simply absent from an older cached response — per Rule 3's "search all consumers" check

---

## Dependencies & Execution Order

- **Setup → Foundational**: the index must be built before anything queries it.
- **User Story 2 (Phase 3)** must complete before **User Story 1 (Phase 4)**, since the plan
  generator's grounding depends on real evidence retrieval working — despite US1 being P1 in the
  spec (it's the user-facing priority), US2 is this phase's technical prerequisite.
- **Polish (Phase 5)**: depends on both stories.

## Implementation Strategy

### MVP First

Setup + Foundational + User Story 2 (retrieval working) unlocks User Story 1 (the actual
grounded-plan value). T011 (the fabricated-reference-stripped test) is the single most important
test in this entire initiative — it's the direct proof of the project's core new explainability
claim. Do not consider Phase 6 done until it passes.
