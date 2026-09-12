# Phase 0 Research: LLM + MCP Layer

(Moved here from the now-deleted umbrella spec `019-mcp-faiss-implementation/research.md` §1,
which covered all phases together before they were split into separate per-phase specs.)

## MCP transport: in-process, not a separate server process

**Decision**: The MCP server runs in-process within the same FastAPI application
(`backend/src/mcp/server.py` constructs the `mcp` SDK server object and registers tools at import
time; `backend/src/mcp/tools.py`'s functions are called directly by application code — e.g.,
`assessment_engine.py` calling `mcp.tools.get_assessment_context(...)` — using the SDK's
Python-native call path, not a subprocess/stdio round-trip).

**Rationale**: The master document's own architecture diagram shows `MCP Tool Layer` sitting
between `Application Services` and `Mistral` inside one backend, not as an externally-deployed
service — there is exactly one client (this backend) and one set of tools, so a real client/server
process boundary (stdio or SSE transport, as MCP typically uses for cross-process/cross-language
tool sharing) would add operational surface (a second process to start/monitor/crash-recover) for
zero benefit at this scale. `CLAUDE.md` Rule 12 ("no new infrastructure beyond MCP+FAISS") is best
honored by the smallest correct interpretation of "MCP tool layer": typed, schema-validated,
auditable functions, registered as MCP tools so the pattern is genuinely MCP (not just "a service
module renamed"), but invoked in-process.

**Alternatives considered**: (a) A separate `mcp` stdio server process spawned by the backend —
rejected: adds a process-lifecycle failure mode (Rule 10's "MCP must never be a single point of
failure" is harder to guarantee across a process boundary) with no capability benefit since there's
only one internal consumer. (b) Exposing MCP over HTTP/SSE for a hypothetical external client —
rejected: no such client exists or is planned; would be speculative infrastructure the master doc
doesn't ask for.
