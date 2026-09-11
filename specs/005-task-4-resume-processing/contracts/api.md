# API Contract: Task 4 — Resume Processing

**Updated 2026-09-11**: `resume_confidence` is now the categorical `LOW|MEDIUM|HIGH` value Mistral
returns (`total_buildplan.md` §27.2), matching the frontend's `ConfidenceLevel` type exactly — not the
0–1 float this contract originally showed. `resume_estimated_level` is the midpoint of Mistral's
`estimated_level_range`, still a single number (the frontend's `CompetencyLevelNumber` has no concept of
a range).

## `POST /candidates/resume`

**Request**: `multipart/form-data` with a single file field (`resume`), PDF or DOCX.

**Response 201**
```json
{
  "candidate_id": "b3f1...-uuid",
  "source": "resume_upload",
  "initial_profile": [
    {
      "competency_id": "sql",
      "competency_name": "SQL",
      "resume_estimated_level": 3,
      "resume_confidence": "MEDIUM",
      "evidence_snippet": "3 years writing SQL for reporting..."
    }
  ]
}
```

This is the internal Mistral request's rough shape (not returned to the client — see plan.md's
"Mistral request/response, internal only" note):
```json
// Request (excerpt)
{
  "resume_text": "...",
  "competency_framework": [
    {"id": "sql", "name": "SQL", "definition": "..."},
    {"id": "python", "name": "Python", "definition": "..."}
  ]
}
// Response (excerpt, per total_buildplan.md §27.2)
{
  "competency_evidence": [
    {
      "competency_id": "sql", "competency_name": "SQL",
      "evidence": "3 years writing SQL for reporting...",
      "source": "resume", "status": "initial_evidence",
      "evidence_strength": "MODERATE",
      "estimated_level_range": {"min": 2, "max": 3},
      "confidence": "MEDIUM", "reasoning": "..."
    }
  ],
  "unmapped_terms": ["underwater basket weaving"],
  "overall_confidence": "MEDIUM"
}
```

**Response 400** (unsupported file type or oversized file)
```json
{ "detail": "Unsupported file type 'image/png'. Upload a PDF or DOCX resume." }
```

**Response 422** (text extraction or Mistral extraction failed after retry)
```json
{ "detail": "Unable to parse resume. Try Demo Candidate instead.", "reason": "extraction_failed" }
```

## Conventions

- `candidate_id` returned here is the same id used by every later endpoint in Tasks 5–10
  (`target_role_id` attaches to this record, `assessment/start` references it, etc.).
- `initial_profile` may be an empty array if Mistral found no mappable competencies — this is a valid
  201 response, not an error (spec Edge Cases).
- Every `competency_id` in the response is a curated id from Task 1/2's `competencies` table — never a
  raw string extracted from the resume, and never trusted from Mistral's response without the backend
  confirming it was one of the ids it actually supplied in that request (spec Edge Cases/FR-007).
- `resume_confidence` is always one of the literal strings `"LOW"`, `"MEDIUM"`, `"HIGH"` — never a
  numeric value in the API response, even though the database may store a numeric equivalent internally
  for Task 7's scoring math.
