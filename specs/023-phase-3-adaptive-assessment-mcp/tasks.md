---
description: "Task list for Phase 3 — Adaptive Assessment (MCP-Wired)"
---

# Tasks: Phase 3 — Adaptive Assessment (MCP-Wired)

**Input**: Design documents from `/specs/023-phase-3-adaptive-assessment-mcp/`

**Prerequisites**: plan.md, spec.md, quickstart.md. Depends on Phase 2's MCP tool layer existing
(`get_assessment_context`, `get_previous_questions`).

**Tests**: Explicitly included — a regression test is required by plan.md to prove this phase's
change doesn't alter existing behavior.

**Organization**: US1 = MCP-sourced context, US2 = backend-controlled routing, US3 = clean stopping
points — per spec.md.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

- [ ] T001 Confirm Phase 2's `backend/src/mcp/tools.py` exposes working `get_assessment_context`/`get_previous_questions` (run `specs/022-phase-2-llm-mcp-layer/quickstart.md` if not already confirmed this session)

---

## Phase 2: Foundational

**Purpose**: Baseline regression test, captured before any change, per `CLAUDE.md`'s "test
continuously" and this plan's own regression-safety requirement.

- [ ] T002 Record the current (pre-change) live assessment-loop output for the demo candidate + `role-sso-01` (question sources, competency routing order) as a baseline snapshot, so post-change output can be diffed against it

**Checkpoint**: Baseline captured — safe to make the change in Phase 3.

---

## Phase 3: User Story 1 - Every question is generated from controlled context only (Priority: P1) 🎯 MVP

**Goal**: Redirect `assessment_engine.py`'s context-assembly through Phase 2's MCP tools, with a
fallback to the current inline assembly.

**Independent Test**: Run the assessment loop; confirm each question still targets an approved,
non-repeating competency, and that the context passed to `mistral_client.generate_question()`
matches exactly what `get_assessment_context()` declares.

### Tests for User Story 1

- [ ] T003 [P] [US1] Test in `backend/tests/test_assessment_engine.py`: `get_next_question()` still returns a question targeting one of the role's required competencies when the MCP layer is healthy
- [ ] T004 [P] [US1] Test in `backend/tests/test_assessment_engine.py`: when `mcp.tools.get_assessment_context()` raises `MCPToolError`, `get_next_question()` falls back to its current inline context assembly and still returns a valid question (satisfies plan.md's Rule 10 fallback requirement)

### Implementation for User Story 1

- [ ] T005 [US1] In `backend/src/services/assessment_engine.py::get_next_question()`, replace the inline context-assembly (currently building `previous_questions`/`required_level`/`evidence` directly before calling `generate_question()`) with a call to `mcp.tools.get_assessment_context()` + `mcp.tools.get_previous_questions()`, wrapped in a `try/except MCPToolError` that falls back to the current inline logic on failure
- [ ] T006 [US1] Re-run T002's baseline scenario and diff against current output — confirm zero behavior change (same competency routing, same fallback-to-seed behavior on Mistral failure)

**Checkpoint**: User Story 1 complete — context now flows through the controlled layer, with a
proven fallback, and zero regression against the baseline.

---

## Phase 4: User Story 2 - Backend-controlled adaptive routing, never candidate- or LLM-decided (Priority: P2)

**Goal**: Confirm (no code change expected) that routing/grading remain entirely backend-owned
after Phase 3's rewire.

**Independent Test**: Answer a sequence of questions correctly then incorrectly; confirm
difficulty/competency selection changes as expected and grading never calls the LLM.

### Implementation for User Story 2

- [ ] T007 [US2] Live-test: submit a correct answer, confirm `updated_difficulty` increases or competency advances per `submit_answer()`'s existing logic (unchanged by this phase)
- [ ] T008 [US2] Live-test: submit an incorrect answer, confirm the same competency is probed again or a prerequisite is tested, per existing logic
- [ ] T009 [US2] Code-review confirmation: `submit_answer()` in `backend/src/services/assessment_engine.py` contains zero calls to `mistral_client`/`mcp.tools` for grading — grading remains `selected_index == question.correct_answer_index` only

**Checkpoint**: User Story 2 confirmed — no code change needed unless T007-T009 reveal a
regression from Phase 3's change (none expected, since only context-assembly was touched).

---

## Phase 5: User Story 3 - The assessment always reaches a clean stopping point (Priority: P3)

**Goal**: Confirm (no code change expected) the three stopping conditions still work after the
rewire.

### Implementation for User Story 3

- [ ] T010 [P] [US3] Live-test: run a session to confidence-threshold completion, confirm clean `"completed"` status
- [ ] T011 [P] [US3] Live-test: run a session to question-budget exhaustion (already observed this session — 8/10 budget used due to seed exhaustion), confirm clean `"completed"` status rather than an error
- [ ] T012 [US3] If T011's observed early-completion (seed exhaustion before budget/confidence) is judged to undercut the demo's "visibly adaptive" story per `demo_plan.md` §7, flag this as a data-completeness follow-up (expand `assessment_seed.json` with more than one question per competency) — track as a separate follow-up task, not a Phase 3 functional defect (spec.md's Assumptions already scope this out)

**Checkpoint**: All three user stories verified — Phase 3 complete.

---

## Phase 6: Polish & Cross-Cutting

- [ ] T013 Run `specs/023-phase-3-adaptive-assessment-mcp/quickstart.md` end to end and record actual output
- [ ] T014 [P] Update `total_mvp_context.md` §6 if this phase's completion changes the tracked status

---

## Dependencies & Execution Order

- **Setup → Foundational**: baseline snapshot before the code change.
- **User Story 1 (Phase 3)**: the actual code change; must complete (and pass its regression
  check) before User Stories 2/3's live-tests are meaningful.
- **User Story 2 (Phase 4)** and **User Story 3 (Phase 5)**: both confirmation-only, can run in
  parallel with each other once User Story 1 is done.
- **Polish (Phase 6)**: depends on all three stories.

## Implementation Strategy

### MVP First

User Story 1 (T005-T006) is the only phase-3-specific code change; User Stories 2/3 are regression
confirmation of already-correct behavior. If T006's diff shows zero change, User Stories 2/3
should also pass immediately — treat any surprise there as a signal T005's fallback wiring has a
bug, not a new defect in the unrelated routing/scoring code.
