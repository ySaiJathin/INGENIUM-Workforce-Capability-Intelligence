# Implementation Plan: Phase 2 — LLM + MCP Layer

**Branch**: `022-phase-2-llm-mcp-layer` | **Date**: 2026-09-12 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/022-phase-2-llm-mcp-layer/spec.md`

**Design artifacts**: This phase's detailed technical decisions, data model, and contracts are in
this same feature directory: `research.md` (MCP in-process transport decision), `data-model.md`
(the MCP tool request/result schemas), and `contracts/mcp-tools.md` (all 10 tool definitions).
(These were originally drafted under a combined umbrella spec, `019-mcp-faiss-implementation`,
before the work was split into one spec per phase; that umbrella spec has since been deleted and
its relevant content copied here and into Phase 6's spec.)

## Summary

Build the controlled MCP tool layer: `backend/src/mcp/server.py` (in-process MCP server
registration) and `backend/src/mcp/tools.py` (the read-oriented, schema-validated tool functions),
plus `backend/src/schemas/mcp.py` (the typed request/result models). This is genuinely new code —
no MCP dependency or package exists in the repo yet. Six of the ten tools listed in the master
document are needed by this phase's own acceptance criteria (`get_candidate_profile`,
`get_target_role`, `get_role_requirements`, `get_competency_framework`, `get_assessment_context`,
`get_previous_questions`, `get_skill_evidence`); the remaining three
(`get_gap_analysis`, `get_course_recommendations`, `get_relevant_evidence`) are stubbed with their
full contract now but only consumed starting Phase 6.

## Technical Context

**Language/Version**: Python 3.12. **Primary Dependencies**: NEW — official `mcp` Python SDK
(add to `requirements.txt`, flagged as the deliberate, authorized new dependency per `CLAUDE.md`'s
updated Rule 12). **Storage**: PostgreSQL, read-only from this layer — no schema changes. **Testing**:
`pytest` — each tool function tested directly (not through a running MCP transport) with an
in-memory/test DB session, covering the not-found and success cases from `contracts/mcp-tools.md`.
**Target Platform**: unchanged. **Project Type**: adds one new backend package (`backend/src/mcp/`)
and one new schema module. **Performance Goals**: tool calls must add no perceptible latency (all
are simple, already-indexed queries). **Constraints**: read-only, no arbitrary SQL/shell/filesystem
access (Rule 13); must not be a single point of failure (Rule 10) — every call site needs a
fallback path. **Scale/Scope**: 10 tool definitions, ~6 in active use this phase.

## Constitution Check

No project constitution ratified. Operative constraints: `CLAUDE.md`'s explicit rule change
(MCP is now required core infrastructure, the one authorized exception alongside FAISS) and Rule
13 (MCP must remain small and explainable). No violations to justify — MCP is pre-authorized, not
case-by-case justified.

## Project Structure

### Documentation (this feature)

```text
specs/022-phase-2-llm-mcp-layer/
├── plan.md              # This file
├── research.md           # MCP in-process transport decision
├── data-model.md         # MCP tool request/result schemas
├── contracts/
│   └── mcp-tools.md       # All 10 tool definitions
├── quickstart.md         # This command's output
└── tasks.md              # /speckit-tasks output (not created by this command)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── mcp/
│   │   ├── __init__.py
│   │   ├── server.py       # NEW — MCP server registration, in-process, all 10 tools registered
│   │   └── tools.py        # NEW — the 10 tool functions (6 fully wired to real queries this
│   │                          phase; get_gap_analysis/get_course_recommendations/
│   │                          get_relevant_evidence implemented against their real tables now
│   │                          too, since the tables already exist — only their *consumers*
│   │                          arrive in Phases 3/6)
│   └── schemas/
│       └── mcp.py           # NEW — Request/Result Pydantic models, per data-model.md
└── tests/
    └── test_mcp_tools.py    # NEW — one test per tool: success case + not-found case
requirements.txt              # add `mcp` SDK dependency
```

**Structure Decision**: One new backend package, additive only — no existing file's behavior
changes in this phase (application code doesn't call into `mcp/tools.py` yet; that wiring is
Phase 3/6's job). This keeps Phase 2 independently testable and mergeable before any consumer
depends on it, matching the spec's "each capability tested directly" independent-test approach.

## Complexity Tracking

None beyond the pre-authorized `mcp` SDK addition itself (not a violation requiring case-by-case
justification, per `CLAUDE.md`'s explicit rule change).
