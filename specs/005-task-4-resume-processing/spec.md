# Feature Specification: Task 4 — Resume Processing

**Feature Branch**: `005-task-4-resume-processing`

**Created**: 2026-09-11
**Updated**: 2026-09-11 — revised against `total_buildplan.md` §7/§27 (Mistral AI Architecture / Mistral
Prompt Architecture), added after this spec's first draft and this phase's first implementation pass.
§27.2 (Operation A — Resume Extraction) specifies a materially different Mistral request/response shape
than this spec originally assumed — see Requirements/Assumptions for what changed and why.

**Status**: Draft

**Input**: Task 4 from `total_buildplan.md` §24: "`POST /candidates/resume`: upload → extract text →
Mistral structured extraction → candidate evidence → initial competency profile → persist. Support PDF
and DOCX. Parsing failure returns a useful error, never crashes the backend." Detailed Mistral contract
in `total_buildplan.md` §27.2.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Turn a Resume Into an Initial Competency Profile (Priority: P1)

A candidate uploads their resume (PDF or DOCX). The backend extracts the text, sends it to Mistral —
along with the platform's own competency framework, so Mistral can only reference competency ids the
backend actually owns — for structured evidence extraction, validates the result, computes an initial
competency profile with per-competency estimated proficiency and confidence, and persists it — ready for
the candidate to pick a target role next.

**Why this priority**: This is the first step of the golden path after "Try Demo Candidate" and the entry
point that produces the "before" half of the product's core resume-estimate-vs.-verified demo moment
(`total_mvp_context.md` §1).

**Independent Test**: Can be fully tested by `POST`ing a sample resume file to `/candidates/resume` and
confirming the response contains a persisted candidate id and a per-competency profile with estimated
level and confidence — independently of role selection or assessment.

**Acceptance Scenarios**:

1. **Given** a valid PDF resume, **When** the candidate uploads it via `POST /candidates/resume`, **Then**
   the system extracts text, sends it to Mistral together with the backend's competency framework, and
   returns a candidate id plus an initial competency profile (competency, estimated level, confidence)
   persisted to the database.
2. **Given** a valid DOCX resume, **When** uploaded, **Then** the same extraction and profile pipeline
   runs successfully as for PDF.
3. **Given** a resume whose text extraction succeeds but whose Mistral structured-extraction response
   fails schema validation, **When** the upload is processed, **Then** the system retries the Mistral call
   once; if it still fails, the system returns a clear, useful error directing the candidate to "Try Demo
   Candidate" rather than crashing.
4. **Given** an unsupported file type (e.g. `.txt`, `.jpg`) or a file exceeding the configured size limit,
   **When** the candidate attempts to upload it, **Then** the system rejects it immediately with a clear
   error, before any extraction is attempted.
5. **Given** a corrupted or unreadable PDF/DOCX, **When** uploaded, **Then** text extraction fails
   gracefully with a clear error message, never an unhandled server exception.
6. **Given** Mistral's response identifies a skill term it cannot confidently map to any competency id
   the backend supplied, **When** the response is processed, **Then** that term is recorded as unmapped
   and contributes no evidence, rather than being force-mapped to the wrong competency or given an
   invented id.

### Edge Cases

- What happens when the resume contains no recognizable competency-related content (e.g. a resume in an
  unrelated field, or mostly a photo/graphic)? → The system persists whatever evidence Mistral can extract
  (possibly an empty or very sparse profile) rather than failing outright; downstream phases must handle a
  sparse profile gracefully.
- What happens when Mistral times out mid-call? → Treated the same as a schema-validation failure: retry
  once, then fail gracefully with a useful error (never a hang or crash).
- What happens when the same candidate uploads a resume twice in one session? → Each upload creates a new
  candidate record (no dedup/merge logic in the MVP) — out of scope per the Assumptions below.
- What happens when the uploaded file passes type/size validation but is not actually a valid PDF/DOCX
  (a renamed file)? → Text extraction must fail cleanly with a useful error, not execute the file's content
  or crash the process.
- What happens when Mistral returns a `competency_id` that isn't actually one of the ids the backend
  supplied it (a hallucinated id)? → The backend MUST reject that single item (never trust a
  Mistral-generated id — only backend-owned competency ids are valid, per `total_buildplan.md` §7.7) and
  continue processing the rest of the response, rather than failing the whole extraction.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST expose `POST /candidates/resume` accepting a file upload.
- **FR-002**: System MUST validate the uploaded file's type (PDF or DOCX only) and size against a
  configured limit before attempting extraction, rejecting anything else with a clear error.
- **FR-003**: System MUST NOT execute any uploaded file's content under any circumstances.
- **FR-004**: System MUST extract plain text from a valid PDF or DOCX resume.
- **FR-005**: System MUST send the extracted text to Mistral together with the relevant slice of the
  backend's own competency framework (ids, names, definitions) so Mistral can select among backend-owned
  competency ids directly, per `total_buildplan.md` §27.2's schema — a JSON object with `candidate`
  (name/designation/organization/years_experience, all nullable), `education`, `certifications`,
  `experience`, `competency_evidence` (one entry per identified skill: `competency_id` or null,
  `competency_name`, `evidence`, `source: "resume"`, `status: "initial_evidence"`, `evidence_strength`
  one of `VERY_WEAK|WEAK|MODERATE|STRONG|VERY_STRONG`, `estimated_level_range: {min, max}`, `confidence`
  one of `LOW|MEDIUM|HIGH`, `reasoning`), `unmapped_terms`, and `overall_confidence` — validated against
  this schema before any further processing (per Rule 5).
- **FR-006**: System MUST retry the Mistral extraction call once on schema-validation failure or timeout;
  if the retry also fails, the system MUST return a clear, actionable error (pointing the candidate to
  "Try Demo Candidate") rather than crash the backend (per Rule 14 / `total_buildplan.md` §18).
- **FR-007**: System MUST treat every `competency_evidence[].competency_id` as untrusted until confirmed
  to be one of the ids the backend actually supplied to Mistral in that same request — any id that isn't
  (a hallucination) or is null is excluded from the persisted profile rather than invented or guessed
  (Rule 4, spec Edge Cases). Terms Mistral could not map itself (`unmapped_terms`, or a null
  `competency_id`) MAY additionally be run through the backend's own deterministic/MiniLM matching
  (reusing the approach from this feature's prior draft) as a best-effort salvage pass, but this is a
  bonus, not a requirement — discarding them entirely is also acceptable.
- **FR-008**: System MUST persist the candidate record and its initial competency profile to the database
  before returning a response. Each persisted competency-evidence item's `resume_estimated_level` is
  derived from Mistral's `estimated_level_range` (e.g. the midpoint), since the database and the frontend
  both store/display a single proficiency level, not a range.
- **FR-009**: System MUST return the candidate id and the initial competency profile in the response so
  the frontend/next step can proceed to target role selection. Each profile item's confidence is
  surfaced as the categorical `LOW|MEDIUM|HIGH` value Mistral returned (matching the already-built
  frontend's `ConfidenceLevel` type), while the database may additionally store a numeric equivalent for
  Task 7's scoring math (see this feature's `data-model.md`/plan.md for the mapping).
- **FR-010**: System MUST label the resulting profile as `source: resume_upload`, distinguishable from a
  `demo` candidate (per the overall project's demo-data labeling rule).
- **FR-011**: System MUST NOT let a resume-parsing failure crash the backend process — every failure path
  returns a normal HTTP error response.
- **FR-012**: System MUST NOT persist candidate identity fields (`name`, `designation`, `organization`,
  `years_experience`) extracted per FR-005 in this phase — they are accepted and schema-validated (since
  Mistral's response must satisfy the full §27.2 schema) but not written to the database, since the
  current `candidates` table (Task 2's schema) has no columns for them and adding those columns is not
  required by this feature's own acceptance criteria; this is an explicit, scoped deferral (see
  Assumptions), not an oversight.

### Key Entities

- **Resume Upload**: the uploaded file (type, size, filename) — transient, not persisted after text
  extraction; only the derived candidate profile is persisted.
- **Candidate** *(extends Task 2's `candidates` table)*: created here with `source = resume_upload`.
- **Candidate Skill / Initial Competency Profile** *(Task 2's `candidate_skills` table)*: one row per
  competency Mistral identified evidence for and the backend confirmed as a valid, backend-owned
  competency id, with `resume_estimated_level` (derived from the returned range) and `resume_confidence`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A well-formed PDF or DOCX resume produces a persisted candidate and initial competency
  profile in under 15 seconds end-to-end (including the Mistral call).
- **SC-002**: 100% of unsupported file types or oversized files are rejected before any extraction attempt,
  with zero exceptions reaching the client as a raw server error.
- **SC-003**: 100% of Mistral extraction failures (after one retry) result in a clear, useful error
  response and zero backend crashes.
- **SC-004**: Every persisted initial competency profile entry references a valid curated competency id —
  zero entries with unmapped, invented, or hallucinated competency identifiers (verified by cross-checking
  every persisted `competency_id` against the exact set of ids supplied to Mistral in that request).

## Assumptions

- No resume-deduplication or candidate-merge logic is in scope; each successful upload creates a new
  candidate record, matching the MVP's single-session, unauthenticated usage model.
- File size limit and exact accepted MIME types are an implementation detail set during planning (a
  reasonable resume-sized limit, e.g. a few MB); this spec does not fix an exact number as a scope
  blocker.
- Per `total_buildplan.md` §27.2, Mistral is now given the relevant competency framework and asked to
  select among backend-owned competency ids directly, rather than returning free-text skill names for the
  backend to map afterward (this feature's original draft assumed the latter and rejected the former as
  "wasteful" — §27.2 explicitly supersedes that decision, and Rule 13's prompt-size guidance is satisfied
  by sending only the competency framework, not the full product specification or database). The
  backend's own exact/alias/MiniLM matching (built during this feature's first implementation pass) is
  kept as an optional best-effort salvage step for terms Mistral itself left unmapped (FR-007), not
  removed — it is simply no longer the primary mapping mechanism.
- Candidate identity fields (name, designation, organization, years of experience) are extracted from the
  resume per the §27.2 schema but deliberately not persisted in this phase (FR-012) — this keeps the
  schema change scoped to what the golden path's acceptance criteria actually require (a competency
  profile), protecting the deadline (Rule 1) rather than expanding `candidates`' schema for a display
  enhancement no current spec's Success Criteria depends on. Revisit if a later phase (e.g. Task 12's
  Candidate summary screen) needs it populated from real data instead of the demo candidate's seed.
- `evidence_strength` (Mistral's `VERY_WEAK..VERY_STRONG` scale) is accepted as part of schema validation
  but not persisted in its own database column in this phase; it may be folded into the stored
  `evidence_snippet` text for transparency, or discarded after informing the `confidence`/level
  calculation, at implementation's discretion — no Success Criterion here depends on it being queryable
  later.
