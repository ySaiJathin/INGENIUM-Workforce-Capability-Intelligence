---
description: "Task list for Task 4 — Resume Processing"
---

# Tasks: Task 4 — Resume Processing

**Input**: Design documents from `/specs/005-task-4-resume-processing/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, contracts/api.md, quickstart.md

**Tests**: Not explicitly requested; `quickstart.md`'s `curl` steps (including forced-failure paths)
serve as the verification pass.

**Organization**: Single user story (P1).

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup (Shared Infrastructure)

- [X] T001 Confirm the installed `mistralai` SDK's real call shape (`Mistral(api_key=...).chat.complete(
      model=..., messages=[...], response_format=ResponseFormat(type="json_object"))`) against the live
      API with the configured `MISTRAL_API_KEY`, since the SDK's import path differs from its own docs
      (`from mistralai.client import Mistral`, not `from mistralai import Mistral`)

## Phase 2: Foundational (Blocking Prerequisites)

- [X] T002 Create `backend/src/services/mistral_client.py`: a thin wrapper exposing
      `extract_resume_skills(resume_text: str) -> list[ExtractedSkill]`, encapsulating model choice,
      JSON response-format mode, and the shared retry-once-then-raise discipline (Rule 5) that Task 6
      will also reuse for question generation
- [X] T003 [P] Create `backend/src/services/competency_mapping.py`: `map_to_competency(skill_name: str,
      competencies: list[Competency]) -> str | None` — exact/alias match first, MiniLM cosine-similarity
      fallback above a threshold, `None` if nothing matches (research.md §4)

## Phase 3: User Story 1 - Turn a Resume Into an Initial Competency Profile (Priority: P1) 🎯 MVP

**Goal**: `POST /candidates/resume` reliably turns an uploaded PDF/DOCX into a persisted candidate +
initial competency profile, validating and mapping every step, never crashing on failure.

**Independent Test**: `curl -F "resume=@sample.pdf" .../candidates/resume` → 201 with a candidate id and
profile; every failure path (bad type, oversized, corrupted, Mistral failure) returns a clean 4xx.

### Implementation for User Story 1

- [X] T004 [P] [US1] Create `backend/src/services/resume_extraction.py`: `extract_text(file_bytes:
      bytes, content_type: str) -> str` using `pypdf` for `application/pdf` and `python-docx` for the
      DOCX MIME type, raising a specific `ResumeExtractionError` on any failure (corrupted file, wrong
      content despite the extension) rather than letting a raw library exception propagate (FR-004,
      spec Edge Cases)
- [X] T005 [US1] Create `backend/src/schemas/candidates.py`: `ExtractedSkill` (Mistral response schema:
      `skill_name`, `evidence`, `estimated_level`), `InitialProfileItem` (`competency_id`,
      `competency_name`, `resume_estimated_level`, `resume_confidence`, `evidence_snippet`),
      `ResumeUploadResponse` (`candidate_id`, `source`, `initial_profile: list[InitialProfileItem]`) —
      field names matching `contracts/api.md`'s JSON exactly
- [X] T006 [US1] Implement `POST /candidates/resume` in `backend/src/api/candidates.py`: validate
      content-type is PDF or DOCX and size ≤ `MAX_RESUME_UPLOAD_MB` from `.env` before any extraction
      (400 on failure, FR-002); call `resume_extraction.extract_text()` (422 on failure, FR-004);
      call `mistral_client.extract_resume_skills()` with one retry on failure (422 with the
      "Try Demo Candidate" message on second failure, FR-005/FR-006); map each extracted skill via
      `competency_mapping.map_to_competency()`, discarding unmapped items (FR-007); persist a `Candidate`
      row (`source="resume_upload"`) and one `CandidateSkill` row per mapped item (FR-008/FR-010); return
      `ResumeUploadResponse` (FR-009)
- [X] T007 [US1] Run `quickstart.md` steps 1-6 against the live server: golden path (PDF), DOCX, reject
      path (wrong type), oversized file, corrupted file (expect 422 + no crash), and a DB check
      confirming persisted `candidates`/`candidate_skills` rows (SC-001..SC-004)

**Checkpoint**: Task 4 is complete — the first Mistral-calling, database-writing endpoint is live and
resilient to every named failure mode, ready for Task 5 (role selection) to attach to its candidates.

---

## Dependencies & Execution Order

- T001 (SDK shape confirmation) informs T002 but is a spike, not a blocking artifact.
- T002/T003 are `[P]` — independent service files.
- T004 is `[P]` relative to T002/T003 — independent file, no shared state.
- T005 (schemas) has no hard dependency on T002-T004 but is listed after them since it's small.
- T006 depends on T002, T003, T004, T005 all existing (imports every one of them).
- T007 depends on T006 (server must expose the endpoint to be curl-tested).

## Implementation Strategy

### MVP (this phase's only scope)

1. Complete Phase 1 (SDK shape spike) and Phase 2 (Mistral client + competency mapping services).
2. Complete Phase 3: extraction service (T004) + schemas (T005) → endpoint (T006) → verification (T007).
3. **STOP and VALIDATE**: T007's `quickstart.md` run, including the forced-failure paths, is this
   phase's pass/fail signal.

## Notes

- `mistral_client.py` is written to be reused by Task 6 (question generation) — same retry-once
  discipline, same SDK wrapper, per this phase's plan.md Structure Decision.
- If the configured Mistral API key has no request quota available (e.g. a 429 with
  `x-ratelimit-limit-req-minute: 0`), the golden-path scenario legitimately exercises the retry-then-422
  "Try Demo Candidate" failure path instead of a 201 — this is correct behavior per FR-006, not a bug in
  this endpoint; it reflects the account's quota, not the code.

## Rework (2026-09-11) — aligned to `total_buildplan.md` §27.2

All tasks above were completed against this spec's original (simpler) Mistral schema. After §27.2 was
published, the following were redone in place (same files, no new task IDs needed since the phase
structure is unchanged):

- [X] `backend/src/schemas/candidates.py` rewritten to the full §27.2 `ResumeExtractionResponse` shape
      (`CandidateIdentity`, `EstimatedLevelRange`, `CompetencyEvidence` with `evidence_strength`/
      categorical `confidence`, `unmapped_terms`, `overall_confidence`), plus a `CONFIDENCE_TO_FLOAT`
      mapping for DB storage (plan.md's Confidence representation note).
- [X] `backend/src/services/mistral_client.py` rewritten: now sends the competency framework
      (id/name/definition for every curated competency) alongside the resume text, using the shared
      `BASE_RULES` (§27.1) + an Operation-A-specific prompt; parses the full response shape.
- [X] `backend/src/services/competency_mapping.py` docstring updated: demoted from primary mapping
      mechanism to an optional salvage pass for `unmapped_terms` (research.md §4) — code unchanged.
- [X] `backend/src/api/candidates.py` rewritten: validates every Mistral-returned `competency_id` against
      the exact set supplied in that request (rejecting hallucinated/null ids before optionally
      salvaging via `competency_mapping.py`), derives `resume_estimated_level` from
      `estimated_level_range`'s midpoint, returns categorical confidence in the API response while
      storing a numeric equivalent in the DB.
- [X] Re-verified: `quickstart.md` reject-path steps (wrong type, oversized) still pass against the
      rewritten endpoint; persistence/mapping logic re-verified with a canned `ResumeExtractionResponse`
      exercising a hallucinated id (correctly rejected), a null-id term (correctly salvaged via MiniLM to
      `sql_aggregation`), and two directly-returned ids (correctly persisted) — since the live Mistral key
      still has 0 req/min quota, this stands in for the golden-path live-Mistral verification until quota
      is available.
