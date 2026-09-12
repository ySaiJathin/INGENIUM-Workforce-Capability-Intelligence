# Contract: MCP Tool Layer

(Moved here from the now-deleted umbrella spec `019-mcp-faiss-implementation/contracts/mcp-tools.md`.)

Ten tools, registered in `backend/src/mcp/server.py`, implemented in `backend/src/mcp/tools.py`.
Every tool: (1) takes exactly the typed request model from `data-model.md`, (2) returns exactly the
typed result model or raises `MCPToolError`, (3) performs read-only queries only — no tool writes
to the database, (4) never accepts or constructs raw SQL, a file path, or a shell command from its
input.

| Tool name | Input | Output | Backed by (existing code, reused not duplicated) | Error case |
|---|---|---|---|---|
| `get_candidate_profile` | `CandidateProfileRequest` | `CandidateProfileResult` | `Candidate` + `CandidateSkill` query | Unknown `candidate_id` → `MCPToolError(reason="not_found")` |
| `get_target_role` | `TargetRoleRequest` | `TargetRoleResult` | `roles.py::build_role_detail()` | Unknown `role_id` → `not_found` |
| `get_role_requirements` | `RoleRequirementsRequest` | `TargetRoleResult` | same as above | Unknown `role_id` → `not_found` |
| `get_competency_framework` | `CompetencyFrameworkRequest` | `CompetencyFrameworkResult` | `Competency` query, optionally filtered | Unknown id in `competency_ids` → that id omitted from result, not an error |
| `get_assessment_context` | `AssessmentContextRequest` | `AssessmentContextResult` | `assessment_engine`'s existing per-question context assembly, centralized | Unknown `session_id` → `not_found`; completed session → context of the last-probed competency still returned |
| `get_previous_questions` | `PreviousQuestionsRequest` | `PreviousQuestionsResult` | `Question` query by `session_id` | Unknown `session_id` → `not_found` |
| `get_skill_evidence` | `SkillEvidenceRequest` | `SkillEvidenceResult` | `SkillEvidence` query | Unknown `session_id` → `not_found`; unknown `competency_id` filter → empty list, not an error |
| `get_gap_analysis` | `GapAnalysisRequest` | `GapAnalysisResult` | `SkillGap` query by `analysis_id` | Unknown `analysis_id` → `not_found` |
| `get_course_recommendations` | `CourseRecommendationsRequest` | `CourseRecommendationsResult` | `CourseRecommendation` query by `analysis_id` | Unknown `analysis_id` → `not_found` |
| `get_relevant_evidence` | `RelevantEvidenceRequest` | `RelevantEvidenceResult` | Phase 6's `evidence_engine.py` (stubbed this phase — raises `MCPToolError(reason="index_unavailable")` unconditionally until Phase 6 wires it up) | Index not yet built → `index_unavailable`, never a crash |

**Fallback rule (Rule 10 / spec FR-005)**: every application-code call site that uses one of these
tools (`assessment_engine.py` for `get_assessment_context`/`get_previous_questions` in Phase 3;
`learning_plan_planner.py` for `get_gap_analysis`/`get_course_recommendations`/
`get_relevant_evidence` in Phase 6) must catch `MCPToolError` and fall back to calling the
underlying service/query function directly — the same function the tool itself wraps — so an
MCP-layer defect never blocks the golden path. This makes the MCP layer, by construction, never
the sole path to any piece of data it exposes.
