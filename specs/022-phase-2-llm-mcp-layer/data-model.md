# Phase 1 Data Model: LLM + MCP Layer

(Moved here from the now-deleted umbrella spec `019-mcp-faiss-implementation/data-model.md`,
which covered all phases together before they were split into separate per-phase specs. The
`get_gap_analysis`/`get_course_recommendations`/`get_relevant_evidence` result shapes are included
here since their tool signatures are defined by this phase, even though `get_relevant_evidence`
isn't wired to a real implementation until Phase 6.)

No existing database table changes. Every type below is an in-memory/schema-only type used at the
MCP tool boundary — a typed view over existing tables, never persisted itself.

## Existing entities read by these tools (unchanged)

Reused as-is from `backend/src/models/reference.py` and `backend/src/models/assessment.py`:
`Candidate`, `CandidateSkill`, `Competency`, `Role`, `RoleCompetency`, `AssessmentSession`,
`Question`, `SkillEvidence`, `SkillGap`, `CourseRecommendation`. No columns added to any of them.

## New schema-only types (`backend/src/schemas/mcp.py`)

Each MCP tool has one input type and one output type. All are Pydantic models (schema-validated
in both directions — a tool never returns an un-validated dict).

- **CandidateProfileRequest** `{candidate_id: UUID}` → **CandidateProfileResult**
  `{candidate_id: UUID, skills: list[CandidateSkillItem]}` where `CandidateSkillItem` mirrors
  `CandidateSkill` (`competency_id`, `resume_estimated_level`, `resume_confidence`,
  `evidence_snippet`).
- **TargetRoleRequest** `{role_id: str}` → **TargetRoleResult** `{role_id: str, role_name: str,
  required_competencies: list[RequiredCompetencyItem]}` — reuses the same shape
  `roles.py::build_role_detail()` already returns (no duplicate query logic).
- **RoleRequirementsRequest** `{role_id: str}` → same **TargetRoleResult** shape (alias tool per
  the master doc's naming — `get_target_role` vs `get_role_requirements` return the same
  underlying data; kept as two tool names because the master doc lists both, both backed by one
  internal function).
- **CompetencyFrameworkRequest** `{competency_ids: list[str] | None}` (omit for the full
  framework) → **CompetencyFrameworkResult** `{competencies: list[CompetencyItem]}` where
  `CompetencyItem` is `{id, name, description, parent_competency_id}` — never more than what's in
  the `competencies` table.
- **AssessmentContextRequest** `{session_id: UUID}` → **AssessmentContextResult**
  `{candidate_id: UUID, target_role_id: str, target_competency_id: str, current_estimated_level:
  float, required_level: float, difficulty_level: int, previous_questions: list[str],
  questions_remaining: int}` — the controlled context an adaptive-question-generation call is
  allowed to see.
- **PreviousQuestionsRequest** `{session_id: UUID}` → **PreviousQuestionsResult**
  `{questions: list[str]}`.
- **SkillEvidenceRequest** `{session_id: UUID, competency_id: str | None}` →
  **SkillEvidenceResult** `{evidence: list[SkillEvidenceItem]}` mirroring `SkillEvidence` rows.
- **GapAnalysisRequest** `{analysis_id: UUID}` → **GapAnalysisResult** `{gaps:
  list[SkillGapItem]}` — same shape as the existing `GapsResponse` schema, reused not duplicated.
- **CourseRecommendationsRequest** `{analysis_id: UUID}` → **CourseRecommendationsResult**
  `{recommendations: list[CourseRecommendationItem], unmatched_gaps: list[str]}` — same shape as
  the existing `CoursesResponse` schema, reused not duplicated.
- **RelevantEvidenceRequest** `{query: str, top_k: int = 5}` → **RelevantEvidenceResult**
  `{items: list[EvidenceItem]}` — `EvidenceItem` is defined in Phase 6's own data-model.md
  (`specs/026-phase-6-evidence-rag-mcp/data-model.md`), since that's where its real implementation
  and full field-level detail live; this phase only needs the request/result envelope shape and
  stubs the tool to raise a typed "index_unavailable" error until Phase 6 wires it up.

Every `*Request` failure mode (unknown id) raises a typed `MCPToolError` (one shared class with a
`tool_name`/`reason` field) — never a raw exception, never a silently-empty success result, per
spec Edge Cases and `CLAUDE.md` Rule 4.
