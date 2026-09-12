# Implementation Plan: Phase 3 — Adaptive Assessment (MCP-Wired)

**Branch**: `023-phase-3-adaptive-assessment-mcp` | **Date**: 2026-09-12 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/023-phase-3-adaptive-assessment-mcp/spec.md`

## Summary

Rewire `backend/src/services/assessment_engine.py`'s question-generation call site to fetch its
context via Phase 2's `mcp.tools.get_assessment_context()` / `get_previous_questions()` instead of
assembling that payload inline before calling `mistral_client.generate_question()` directly. The
routing/scoring/fallback logic itself (`select_next_competency`, `submit_answer`, seed fallback)
is confirmed correct by this session's live audit and does not change — only the context-assembly
step is redirected through the new controlled layer, with a fallback to the current inline
assembly if the MCP call fails (Rule 10).

## Technical Context

**Language/Version**: Python 3.12. **Primary Dependencies**: Phase 2's `backend/src/mcp/tools.py`
(new dependency of this phase, no new external package). **Storage**: unchanged. **Testing**:
re-run this session's already-passing live assessment-loop test (`quickstart.md` below) after the
rewire, confirming zero behavior change; add a unit test forcing `mcp.tools.get_assessment_context`
to raise and confirming `assessment_engine.py` falls back to its own direct assembly. **Target
Platform**: unchanged. **Project Type**: no new package — one existing file's internals change.
**Performance Goals**: unchanged (in-process call, no added latency). **Constraints**: must not
regress the already-verified golden-path assessment behavior (Rule 3/9 — re-run the earlier test
after this change, per `CLAUDE.md`'s Execution & Testing Protocol). **Scale/Scope**: one function's
internals in one existing file.

## Constitution Check

No project constitution ratified. Operative constraint: `CLAUDE.md` Rule 3 ("before changing a
response field: search all consumers... test, then commit") — this phase changes no response
field/contract at all (purely internal context-assembly source), so the API-level risk is
minimal; the regression-test requirement above is the safeguard. No violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/023-phase-3-adaptive-assessment-mcp/
├── plan.md              # This file
├── quickstart.md         # This command's output
└── tasks.md              # /speckit-tasks output (not created by this command)
```

### Source Code (repository root)

```text
backend/
├── src/
│   └── services/
│       └── assessment_engine.py   # MODIFIED — get_next_question()'s context-assembly lines
│                                     (currently building previous_questions/required_level/
│                                     evidence inline before calling generate_question()) now call
│                                     mcp.tools.get_assessment_context()/get_previous_questions()
│                                     first, falling back to the current inline assembly on
│                                     MCPToolError — routing/scoring/seed-fallback logic unchanged
└── tests/
    └── test_assessment_engine.py  # EXTENDED — one new test: MCP layer raises -> fallback path
                                      still produces a valid next question
```

**Structure Decision**: No new files beyond a test extension. This is intentionally the smallest
possible change that satisfies FR-002 ("using only the controlled context supplied... via Phase
2's access layer") without touching the already-correct routing/scoring logic — matching Rule 3's
"do not rewrite working modules unnecessarily."

## Complexity Tracking

None — no new dependencies; reuses Phase 2's already-built layer.
