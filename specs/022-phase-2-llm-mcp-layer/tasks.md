---
description: "Task list for Phase 2 — LLM + MCP Layer"
---

# Tasks: Phase 2 — LLM + MCP Layer

**Input**: Design documents from `/specs/022-phase-2-llm-mcp-layer/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/mcp-tools.md,
quickstart.md. Depends on Phase 0 and Phase 1 being complete.

**Tests**: Explicitly included — spec.md's SC-001/SC-002 require unit-testable guarantees
(typed errors for unknown ids, retry-then-fallback on malformed LLM output) that need real tests.

**Organization**: US1 = controlled context only, US2 = every LLM response validated, US3 = never a
single point of failure — per spec.md.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

- [X] T001 Add the official `mcp` Python SDK to `requirements.txt` (flagged as the deliberate, authorized new dependency per `CLAUDE.md`'s updated Rule 12) and install it into `.venv`
- [X] T002 [P] Create `backend/src/mcp/__init__.py`

---

## Phase 2: Foundational

**Purpose**: The typed request/result schemas every tool depends on.

**⚠️ CRITICAL**: No tool implementation can be written until these schemas exist.

- [X] T003 Create `backend/src/schemas/mcp.py` with all request/result Pydantic models from `data-model.md`: `CandidateProfileRequest/Result`, `TargetRoleRequest/Result`, `RoleRequirementsRequest`, `CompetencyFrameworkRequest/Result`, `AssessmentContextRequest/Result`, `PreviousQuestionsRequest/Result`, `SkillEvidenceRequest/Result`, `GapAnalysisRequest/Result`, `CourseRecommendationsRequest/Result`, `RelevantEvidenceRequest/Result`
- [X] T004 Define a shared `MCPToolError(RuntimeError)` in `backend/src/mcp/tools.py` (or a new `backend/src/mcp/errors.py`) carrying `tool_name: str` and `reason: str` fields, per contracts/mcp-tools.md's error-case column

**Checkpoint**: Schemas and the shared error type exist — tool implementations (Phase 3) can begin.

---

## Phase 3: User Story 1 - The LLM only ever sees what a specific operation actually needs (Priority: P1) 🎯 MVP

**Goal**: Implement all 10 tools as read-only, schema-validated, minimally-scoped functions.

**Independent Test**: Invoke each tool directly with valid and invalid inputs; confirm responses
are always the tool's own declared shape or a typed `MCPToolError` — never a raw exception, never
extra fields.

### Tests for User Story 1

- [X] T005 [P] [US1] Test in `backend/tests/test_mcp_tools.py`: `get_candidate_profile` with an unknown `candidate_id` raises `MCPToolError(reason="not_found")`
- [X] T006 [P] [US1] Test in `backend/tests/test_mcp_tools.py`: `get_target_role`/`get_role_requirements` with an unknown `role_id` raises `MCPToolError(reason="not_found")`
- [X] T007 [P] [US1] Test in `backend/tests/test_mcp_tools.py`: `get_assessment_context`/`get_previous_questions`/`get_skill_evidence` with an unknown `session_id` raises `MCPToolError(reason="not_found")`
- [X] T008 [P] [US1] Test in `backend/tests/test_mcp_tools.py`: `get_gap_analysis`/`get_course_recommendations` with an unknown `analysis_id` raises `MCPToolError(reason="not_found")`
- [X] T009 [P] [US1] Test in `backend/tests/test_mcp_tools.py`: `get_relevant_evidence` always raises `MCPToolError(reason="index_unavailable")` this phase (Phase 6 wires the real implementation)
- [X] T010 [P] [US1] Test in `backend/tests/test_mcp_tools.py`: `get_candidate_profile`'s successful result contains only the fields `CandidateProfileResult` declares — no other candidate's data, no raw ORM object leakage

### Implementation for User Story 1

- [X] T011 [P] [US1] Implement `get_candidate_profile(request: CandidateProfileRequest) -> CandidateProfileResult` in `backend/src/mcp/tools.py`, querying `Candidate` + `CandidateSkill` (read-only `select()`, no raw SQL)
- [X] T012 [P] [US1] Implement `get_target_role`/`get_role_requirements` in `backend/src/mcp/tools.py`, reusing `backend/src/api/roles.py::build_role_detail()` — do not duplicate its query
- [X] T013 [P] [US1] Implement `get_competency_framework(request: CompetencyFrameworkRequest) -> CompetencyFrameworkResult` in `backend/src/mcp/tools.py`, optionally filtered by `competency_ids`
- [X] T014 [US1] Implement `get_assessment_context(request: AssessmentContextRequest) -> AssessmentContextResult` in `backend/src/mcp/tools.py`, centralizing the context-assembly logic currently inline in `backend/src/services/assessment_engine.py::get_next_question()` (depends on T003)
- [X] T015 [P] [US1] Implement `get_previous_questions`/`get_skill_evidence` in `backend/src/mcp/tools.py`
- [X] T016 [P] [US1] Implement `get_gap_analysis`/`get_course_recommendations` in `backend/src/mcp/tools.py`, querying `SkillGap`/`CourseRecommendation` by `analysis_id`
- [X] T017 [US1] Implement `get_relevant_evidence` in `backend/src/mcp/tools.py` as a stub that unconditionally raises `MCPToolError(reason="index_unavailable")` — real implementation is Phase 6's `T0XX` (see `specs/026-phase-6-evidence-rag-mcp/tasks.md`)
- [X] T018 [US1] Create `backend/src/mcp/server.py`: construct the `mcp` SDK server object and register all 10 tools from `tools.py`, in-process (no network transport), per `research.md`'s decision
- [X] T019 [US1] Code-review pass: confirm (via `grep -rn "execute(" backend/src/mcp/tools.py` and manual read) zero raw SQL/shell/filesystem access anywhere in `tools.py` — satisfies FR-003

**Checkpoint**: All 10 tools exist, are individually testable, and pass T005-T010.

---

## Phase 4: User Story 2 - Every LLM response is validated before it's trusted (Priority: P2)

**Goal**: Confirm/centralize the retry-then-fallback behavior for LLM calls made through tools
that trigger one (this phase's tools themselves are all read-only/non-LLM; this story validates
the *pattern* `mistral_client.py` already implements, which Phases 3/6 will route through this
layer's context).

**Independent Test**: Force `mistral_client.py`'s underlying call to fail or return malformed
output; confirm one retry, then a documented fallback, with no raw error surfaced.

### Tests for User Story 2

- [X] T020 [P] [US2] Test in `backend/tests/test_mistral_client.py` (extend existing if present): a forced `JSONDecodeError`/`ValidationError` on the first attempt triggers exactly one retry before raising `MistralExtractionError`/`MistralQuestionGenerationError`
- [X] T021 [P] [US2] Test in `backend/tests/test_mistral_client.py`: a forced failure on both attempts raises the documented error type (not a raw exception) for the caller to handle

### Implementation for User Story 2

- [X] T022 [US2] Confirm (code review, no expected change) `backend/src/services/mistral_client.py`'s `extract_resume_skills()`/`generate_question()` already implement exactly the retry-once-then-raise pattern this story requires — per this session's earlier audit, this already exists; fix only if T020/T021 reveal a gap
- [X] T023 [US2] Document, in this feature's `research.md` or a short code comment in `mistral_client.py`, that retry ownership lives in exactly one place (mistral_client.py itself) — satisfies the Edge Case about compounding retries

**Checkpoint**: LLM-call validation/retry/fallback behavior confirmed correct and singly-owned.

---

## Phase 5: User Story 3 - The controlled-access layer is never a single point of failure (Priority: P3)

**Goal**: Every future consumer of an MCP tool has a working fallback to the same tool's
underlying function, called directly.

**Independent Test**: Disable/break the MCP layer (e.g., monkeypatch `tools.py` functions to
raise); confirm a caller using the documented fallback pattern still returns a correct result.

### Tests for User Story 3

- [X] T024 [US3] Test in `backend/tests/test_mcp_tools.py`: a caller pattern that catches `MCPToolError` and calls the underlying service function directly (e.g., `build_role_detail()`) produces output equivalent to what the tool would have returned for the same input

### Implementation for User Story 3

- [X] T025 [US3] Document the mandatory fallback rule (contracts/mcp-tools.md already states it) as a short docstring/comment at the top of `backend/src/mcp/tools.py`, so Phase 3/6 implementers can't miss it when wiring their call sites

**Checkpoint**: All three user stories independently verified — Phase 2 is complete.

---

## Phase 6: Polish & Cross-Cutting

- [X] T026 Run `specs/022-phase-2-llm-mcp-layer/quickstart.md` end to end and record actual output next to each expected result
- [X] T027 [P] Confirm `backend/src/main.py` needs no changes (MCP tools are called in-process by application code, never mounted as a FastAPI router) — document this explicitly if a reviewer might otherwise expect a new route

---

## Dependencies & Execution Order

- **Setup → Foundational**: schemas/error type before any tool implementation.
- **User Story 1 (Phase 3)**: the MVP — all 10 tools. T011-T017 are parallelizable (different
  functions in the same file, but logically independent — coordinate to avoid merge conflicts in
  `tools.py`); T018 (server registration) depends on all tool functions existing.
- **User Story 2 (Phase 4)**: independent of User Story 1's tool implementations — can run in
  parallel, since it audits `mistral_client.py`, a different file.
- **User Story 3 (Phase 5)**: depends on User Story 1's tools existing (T024 exercises real tools).
- **Polish (Phase 6)**: depends on all three stories.

## Implementation Strategy

### MVP First (User Story 1 Only)

Complete Setup + Foundational + User Story 1 (all 10 tools, individually tested) — this alone
delivers Phase 2's core value and unblocks Phase 3/6 to start wiring consumers. User Stories 2/3
are largely confirmation of already-correct existing behavior (per this session's audit) and can
follow immediately after.
