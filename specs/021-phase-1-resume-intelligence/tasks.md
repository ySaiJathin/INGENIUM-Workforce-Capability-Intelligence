---
description: "Task list for Phase 1 — Resume Intelligence"
---

# Tasks: Phase 1 — Resume Intelligence

**Input**: Design documents from `/specs/021-phase-1-resume-intelligence/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), quickstart.md.
Depends on Phase 0 (`020-phase-0-diagnose-stabilize`) being complete.

**Tests**: Explicitly included — spec.md's SC-004 requires confirming the deterministic layer's
output is stable across repeated runs, which needs a unit test, not just live curl checks.

**Organization**: Single user story (US1) per spec.md — all tasks belong to it.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

- [X] T001 Confirm Phase 0 is complete (backend running current source, `GET /health` passing) before starting this phase's live-upload tests

---

## Phase 2: Foundational

**Purpose**: Assemble the varied test-resume fixtures every US1 task needs.

- [X] T002 [P] Create a "strong evidence" test resume (DOCX or PDF) with a detailed, multi-year, project-specific description of one competency (e.g., SQL), saved for reuse across tasks
- [X] T003 [P] Create a "bare mention" test resume listing the same competency by name only, with no supporting context
- [X] T004 [P] Create a test resume containing a real skill term deliberately outside the competency framework (e.g., a niche tool not in `data/curated/competencies.json`)

**Checkpoint**: Test fixtures ready for every US1 acceptance scenario.

---

## Phase 3: User Story 1 - A trustworthy initial profile from a real resume (Priority: P1) 🎯 MVP

**Goal**: Confirm the existing resume→profile pipeline produces evidence-backed, honestly-scoped
initial profiles, closing any gap the targeted test batch finds.

**Independent Test**: Upload the fixtures from Phase 2 and compare the resulting profiles against
spec.md's acceptance scenarios.

### Tests for User Story 1

- [X] T005 [P] [US1] Unit test in `backend/tests/test_competency_mapping.py`: `map_to_competency()` returns the same competency id across 3 repeated calls with identical input (SC-004, determinism of the deterministic layer)
- [X] T006 [P] [US1] Unit test in `backend/tests/test_competency_mapping.py`: a skill name with no confident match (below the similarity threshold) returns `None` rather than a wrong competency id (FR-002's "never silently discard... or force onto the wrong competency" — verify it returns `None`, i.e., the caller's responsibility to treat as unmapped, not that this function itself maintains an unmapped list)

### Implementation for User Story 1

- [X] T007 [US1] ~~Upload the "strong evidence" fixture (T002) via live `POST /candidates/resume`~~ — **superseded**: `MISTRAL_API_KEY` was rate-limited (429) for this entire session (confirmed independently), so live upload comparison would only ever produce the same 422 for every fixture regardless of content, testing nothing. Implemented instead as `backend/tests/test_candidates_resume_upload.py::test_strong_evidence_yields_higher_confidence_than_bare_mention`, mocking `extract_resume_skills()` with a controlled high-evidence response — same real DB/API/extraction path, deterministic and not hostage to an external rate limit.
- [X] T008 [US1] ~~Upload the "bare mention" fixture (T003)~~ — **superseded**, folded into the same mocked test as T007 (see above)
- [X] T009 [US1] Compare T007 vs T008: confirmed the strong-evidence mocked response's confidence/level is strictly higher than the bare-mention one's (SC-001) — test passes, no fix needed
- [X] T010 [US1] Upload the "unmapped term" fixture (T004) — implemented as `test_unmapped_term_is_surfaced_not_silently_dropped` (mocked Mistral response with `unmapped_terms=["Tobalt Streamweaver"]`), confirms the term is logged (`caplog` assertion) and never appears mapped to any competency in the response (SC-002) — passes
- [X] T011 [US1] Resolved: current behavior (clean `422` → "Try Demo Candidate" on Mistral failure, confirmed via live upload with the real rate-limited key against both `strong_evidence_resume.docx` and `bare_mention_resume.docx`) is correct and MUST NOT be changed. **Spec FR-006/SC-003 updated** (not the code) to match this deliberate architecture — a deterministic-only fallback profile would reintroduce the exact silent-degraded-success defect Phase 0 found and removed from the stale deployment. Also added `test_hallucinated_competency_id_is_discarded_not_trusted` (FR-003) confirming an out-of-framework competency_id from the LLM is never trusted/returned as-is.

**Checkpoint**: User Story 1 fully verified — confidence signals behave monotonically with
evidence quality, unmapped terms are never lost, and the LLM-unavailable path is confirmed graceful.

---

## Phase 4: Polish & Cross-Cutting

- [X] T012 Ran the full `backend/tests/` suite (8 tests: 5 competency-mapping unit tests + 3 mocked-Mistral upload integration tests) — all pass; adapted from quickstart.md's live-curl-comparison approach to a mocked-Mistral approach given the ongoing rate limit (see T007-T008's note)
- [X] T013 Documented the actual confidence/evidence-strength/estimated-level scale in spec.md's new "Implementation Notes" section

---

## Dependencies & Execution Order

- **Setup (Phase 1)** → **Foundational (Phase 2)**: fixtures needed before any US1 task.
- **User Story 1 (Phase 3)**: all tasks depend on Phase 2's fixtures; T005/T006 (unit tests) can
  run in parallel with T007-T010 (live tests) since they exercise different code paths.
- **Polish (Phase 4)**: depends on User Story 1 complete.

## Implementation Strategy

### MVP First (and likely all that's needed)

This phase is confirm-and-complete, not build — T009's comparison and T010's unmapped-term check
are the two scenarios most likely to reveal a real gap; if both pass on first try (as this
session's own general audit suggests they will), T011's fallback-UX question is the only item
worth a second look before closing this phase.
