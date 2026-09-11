# Feature Specification: Task 6 — Adaptive Assessment Engine

**Feature Branch**: `007-task-6-adaptive-assessment-engine`

**Created**: 2026-09-11
**Updated**: 2026-09-11 — field names in FR-003/research.md aligned to `total_buildplan.md` §27.4
(Operation C — Adaptive Question Generation), added after this spec's first draft. Not yet implemented,
so this is a documentation fix, not a rebuild — see `research.md` §4 for the resolved field-name mapping.

**Status**: Draft

**Input**: Task 6 from `total_buildplan.md` §24: "Assessment creation, question selection, Mistral
generation, answer submission, adaptive routing, progress tracking. Maintain current competency estimate,
confidence, difficulty, questions asked, answers." Detailed in §8 and §27.4.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Take an Adaptive Assessment That Verifies My Competencies (Priority: P1)

Having selected a target role, the candidate starts an assessment session. The system selects the
competency it is least confident about, generates (or falls back to a seed) a question, presents it, and
adjusts difficulty/confidence based on the candidate's answer — repeating until a confidence threshold is
reached or the question budget is exhausted — while tracking progress throughout.

**Why this priority**: This is the mechanism that produces verified evidence for Task 7's scoring; without
it there is no "after" half of the resume-estimate-vs.-verified demo moment.

**Independent Test**: Can be fully tested by starting a session for a candidate + role, repeatedly calling
next-question and answer endpoints, and confirming the session progresses through distinct, non-repeating
questions, updates competency state after each answer, and reaches a `completed` status within the
question budget.

**Acceptance Scenarios**:

1. **Given** a candidate with a selected target role, **When** they call `POST /assessment/start`,
   **Then** the system creates a new assessment session tied to that candidate and role, with a defined
   question budget (~8–12).
2. **Given** an active session, **When** the candidate requests the next question, **Then** the system
   selects the competency it is currently least confident about (weighted toward the role's required
   competencies), generates a question via Mistral for that competency/difficulty, validates it against a
   schema, and returns it without ever repeating an identical question already asked in this session.
3. **Given** a generated question, **When** Mistral's response fails schema validation, **Then** the
   system retries once; if it still fails, the system serves a seed question from
   `assessment_seed.json` for that competency instead of failing the request.
4. **Given** a presented question, **When** the candidate submits an answer, **Then** the system records
   whether it was correct, updates that competency's confidence/difficulty state (correct → increase
   confidence/difficulty; incorrect → probe the same competency again), and updates progress tracking.
5. **Given** an in-progress session, **When** every relevant competency has reached the confidence
   threshold, or the question budget is exhausted, **Then** the system marks the session `completed` and
   makes the accumulated evidence available to Task 7's scoring engine.
6. **Given** a session's progress is queried mid-assessment, **When** the candidate or frontend checks
   status, **Then** the system returns questions asked so far, questions remaining, and per-competency
   confidence state.

### Edge Cases

- What happens when a candidate abandons the session (stops answering) partway through? → The session
  remains `in_progress` (or is marked `abandoned` after some inactivity handling left to implementation);
  whatever evidence was collected remains available for a partial/early scoring request rather than being
  discarded.
- What happens when Mistral generation *and* the seed bank both lack a question for the exact competency/
  difficulty combination needed? → The system selects the closest available seed question for that
  competency (any difficulty) rather than failing the assessment outright.
- What happens when the candidate submits an answer to a question that was already answered (duplicate
  submission)? → The system rejects the duplicate with a clear error rather than double-counting evidence.
- What happens when an answer is submitted for a question id that doesn't belong to the given session?
  → The system rejects it with a clear error.
- What happens when the role has more required competencies than the question budget can reasonably
  cover? → The system prioritizes competencies by role priority/uncertainty so the most important
  competencies are assessed first within the budget.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST expose `POST /assessment/start` accepting a candidate id and target role id,
  creating a new assessment session with a defined question budget (~8–12 questions).
- **FR-002**: System MUST expose `GET /assessment/{session_id}/next-question`, deterministically selecting
  which competency to probe next based on current confidence/uncertainty state and the target role's
  required competencies and priorities — this routing decision is never made by Mistral.
- **FR-003**: System MUST generate each question via Mistral, given the candidate's current competency
  state, the target competency, a difficulty level, and the list of previously-asked questions in this
  session (to avoid repeats), and MUST validate the response against the exact schema in
  `total_buildplan.md` §27.4 before use — MUST also confirm the returned `competency_id` is one of the
  backend's own ids (never trusted blindly, same discipline as Task 4's resume extraction) and that
  `correct_answer` matches one of the returned `options` before persisting.
- **FR-004**: System MUST retry a failed Mistral question-generation call once; on a second failure, MUST
  serve a seed question from `assessment_seed.json` for that competency instead — the assessment MUST
  NEVER fail to produce a question because of an LLM formatting problem (Rule 5).
- **FR-005**: System MUST NEVER present an identical question twice within the same session.
- **FR-006**: System MUST expose `POST /assessment/{session_id}/answer`, recording the candidate's
  selected answer, computing correctness server-side, and updating that competency's confidence and
  difficulty state accordingly (correct → increase confidence/difficulty; incorrect → probe the same
  competency again).
- **FR-007**: System MUST track, per session, the questions asked, answers given, and per-competency
  confidence/difficulty state throughout the session's lifetime.
- **FR-008**: System MUST stop the session — marking it `completed` — when either a confidence threshold
  is reached across the relevant competencies or the question budget is exhausted, whichever comes first.
- **FR-009**: System MUST reject a duplicate answer submission for an already-answered question, and MUST
  reject an answer submission referencing a question id that does not belong to the given session.
- **FR-010**: System MUST make the accumulated per-competency evidence available for Task 7's scoring
  engine once a session is `completed` (or, for a partial/abandoned session, on demand).

### Key Entities

- **Assessment Session** *(Task 2's `assessments` table)*: status, question budget, started/completed
  timestamps.
- **Question** *(Task 2's `questions` table)*: competency, difficulty, prompt, options, correct answer,
  source (`mistral` or `seed`), sequence number.
- **Answer** *(Task 2's `answers` table)*: selected option, correctness, timestamp.
- **Skill Evidence** *(Task 2's `skill_evidence` table)*: per-competency running state — questions
  answered, correct count, average difficulty, confidence.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of assessment sessions produce a next question on every request — zero requests ever
  fail outright due to a Mistral formatting or availability problem.
- **SC-002**: Zero identical questions are ever presented twice within the same session, across any number
  of sessions tested.
- **SC-003**: A session reaches `completed` status within its question budget (~8–12 questions) in the
  overwhelming majority of cases, and never exceeds the budget.
- **SC-004**: Per-competency confidence/difficulty state visibly changes after each answer in a way a
  developer or judge can trace (harder questions after correct answers, repeated probing after incorrect
  ones) — the "adaptive" behavior is observable, not just internally computed.

## Assumptions

- The confidence threshold and question budget are simple, transparent constants/formulas set during
  planning (not exposed to the candidate), matching the "no IRT, no Bayesian psychometrics" constraint
  (`total_buildplan.md` §8).
- MCQ is the only question type in this phase's scope; open-ended answer evaluation is explicitly P1
  (`total_buildplan.md` §21) and out of scope here.
- "Abandoned" session handling (exact inactivity timeout, if any) is an implementation detail; the
  functional requirement is only that partial evidence is never discarded.
