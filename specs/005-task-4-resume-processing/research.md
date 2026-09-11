# Phase 0 Research: Task 4 — Resume Processing

**Updated 2026-09-11**: §2 and §4 below are superseded by `total_buildplan.md` §27.2, which arrived
after this document's first draft and this feature's first implementation pass. The original decisions
are struck through and kept for record; the superseding decision follows each.

## 1. Text extraction libraries

- **Decision**: `pypdf` (or `pdfplumber` if `pypdf` proves insufficient for a given layout) for PDF;
  `python-docx` for DOCX.
- **Rationale**: Pure-Python, no external binary dependency, lightweight to add within the time budget.
- **Alternatives considered**: OCR-based extraction (e.g. for scanned/image PDFs) — rejected as
  unnecessary complexity for the MVP; a resume that is purely a scanned image is treated as a corrupted/
  unreadable file (spec Edge Cases) and directed to "Try Demo Candidate."

## 2. Mistral structured-extraction schema

- **Superseded decision (2026-09-11, per `total_buildplan.md` §27.2)**: Request the full
  `ResumeExtractionResponse` shape:
  ```json
  {
    "candidate": {"name": null, "designation": null, "organization": null, "years_experience": null},
    "education": [], "certifications": [], "experience": [],
    "competency_evidence": [
      {
        "competency_id": null, "competency_name": "", "evidence": "", "source": "resume",
        "status": "initial_evidence", "evidence_strength": "WEAK",
        "estimated_level_range": {"min": 1, "max": 2}, "confidence": "LOW", "reasoning": ""
      }
    ],
    "unmapped_terms": [], "overall_confidence": "LOW"
  }
  ```
  validated with a Pydantic model matching this exactly, before any further processing.
- **Rationale**: This is the frozen, canonical schema for Operation A — matches Rule 5's schema-
  constrained generation requirement and is now specified field-by-field in the build plan, not an open
  design choice.
- ~~**Original decision (superseded)**: A minimal `list[{"skill_name","evidence","estimated_level"}]`
  array.~~ Rejected once §27.2 was published — too thin to satisfy the canonical schema, and discarded the
  `evidence_strength`/`confidence`/candidate-identity fields §27.2 requires Mistral to attempt.
- **Alternatives considered**: Free-text extraction parsed with regex — rejected, far less reliable and
  harder to validate/retry against a schema.

## 3. Retry & fallback strategy

- **Decision**: One retry on schema-validation failure or timeout; on second failure, return HTTP 422/502
  with a message pointing to "Try Demo Candidate," and log what failed (which field, or timeout) without
  ever swallowing the exception silently (`CLAUDE.md` standing rule against `except Exception: pass`).
- **Rationale**: Directly implements Rule 5 and Rule 14. Unlike Task 6 (which has a seed-question
  fallback), resume extraction has no equivalent structured fallback — the fallback here is the *product's*
  "Try Demo Candidate" path, not a substitute extraction.
- **Alternatives considered**: Silent partial success (persist whatever Mistral did return even if
  malformed) — rejected, violates Rule 5's "never trust unvalidated Mistral JSON."

## 4. Skill-name → curated competency id mapping

- **Superseded decision (2026-09-11, per `total_buildplan.md` §27.2)**: The competency framework (id,
  name, definition for every curated competency) is included in the extraction request, and Mistral is
  instructed to return a `competency_id` directly per evidence item, using only ids from that supplied
  list — never inventing one. The backend still does not trust this blindly: every returned
  `competency_id` is checked against the exact set of ids sent in that request (Edge Cases/FR-007); a
  hallucinated or null id is dropped. Terms Mistral leaves in `unmapped_terms` (or with a null
  `competency_id`) may optionally be run through the backend's own exact/alias + MiniLM matching (kept
  from the original decision below) as a best-effort salvage pass — not required, but not wasted.
- **Rationale**: §27.2 explicitly requires this ("only use competency IDs supplied by the backend");
  Rule 13's "keep prompts small" guidance is about not sending the *whole product spec or database*, not
  about withholding the competency framework itself — 34 competency names/ids/definitions is a small,
  bounded payload, not the violation the original decision assumed it would be.
- ~~**Original decision (superseded)**: Deterministic-first mapping — exact/alias string match against
  `competencies.json` names first; MiniLM cosine-similarity fallback above a threshold; discard below
  threshold.~~ This logic is preserved in `competency_mapping.py`, just demoted from primary mechanism to
  optional salvage pass for `unmapped_terms`, per the decision above.
- **Alternatives considered**: Asking Mistral to output the curated competency id directly — this was
  the original decision's rejected alternative; §27.2 has since made it the required approach, so it is
  no longer "considered and rejected," it is the current decision.

## 5. Upload validation limits

- **Decision**: Accept `application/pdf` and
  `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (DOCX) MIME types only; cap
  file size at a few MB (exact figure set in implementation, e.g. 5MB) — generous enough for any real
  resume, small enough to bound extraction/Mistral prompt size.
- **Rationale**: `total_buildplan.md` §18 security minimum: "validate uploaded file type, limit upload
  size." An exact byte figure is an implementation detail, not a spec-level scope decision.
- **Alternatives considered**: Accepting arbitrary file types and relying on extraction to fail
  gracefully — rejected, validating early avoids wasted extraction/Mistral-call work.

## Outcome

All Technical Context fields in `plan.md` are resolved with no remaining `NEEDS CLARIFICATION` markers.
Proceeding to Phase 1 (contracts/, quickstart.md — `data-model.md` intentionally omitted, see plan.md).
