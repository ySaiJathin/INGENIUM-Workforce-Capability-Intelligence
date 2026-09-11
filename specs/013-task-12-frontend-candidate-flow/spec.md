# Feature Specification: Task 12 — Frontend Candidate Flow

**Feature Branch**: `013-task-12-frontend-candidate-flow`

**Created**: 2026-09-11
**Updated**: 2026-09-11 — revised against the existing `sk/sk` frontend prototype's six candidate-intake
screens (Home, Candidate, Resume Upload, Initial Profile, Role Selection, Role Requirements).

**Status**: Draft

**Input**: Task 12 from `total_buildplan.md` §24: "Resume upload, initial profile, role selection."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Upload My Resume (or Try the Demo) and Pick My Target Role (Priority: P1)

A candidate lands on the Home screen, either starts a real assessment or clicks "Try Demo Candidate,"
lands on their Candidate profile summary, uploads a resume (or uses the pre-loaded demo resume), sees the
extracted evidence and the resulting Initial Capability Profile clearly marked as unverified/low
confidence, picks a target role from the catalog, inspects that role's required competencies (with an
early resume-vs-requirement preview), and proceeds to the assessment.

**Why this priority**: This is the first user-facing slice of the golden path — without it, a judge
cannot start the demo at all.

**Independent Test**: Can be fully tested in the running app by starting from Home, using either entry
path, uploading a sample resume (or the demo resume), observing extracted evidence and the Initial
Profile screen, selecting a role, inspecting its requirements, and confirming the app is ready to enter
the assessment — using the Task 4/5/16 backend endpoints already verified via `curl`.

**Acceptance Scenarios**:

1. **Given** the Home screen, **When** the candidate clicks "Start Capability Assessment," **Then** the
   app navigates to the Candidate screen with a blank (not-yet-evaluated) profile ready for resume upload.
2. **Given** the Home screen, **When** the candidate clicks "Try Demo Candidate" instead, **Then** the
   app loads the full pre-seeded demo candidate (profile, resume evidence, target role, and — per the
   prototype's current one-click demo behavior — a completed assessment and results) and navigates to the
   Candidate screen, with every field clearly labeled as demo data.
3. **Given** the Candidate screen, **When** the candidate proceeds to Resume Upload, **Then** they can
   drag-and-drop or select a PDF/DOCX file, or use the "Use Demo Resume" shortcut, and see a multi-stage
   processing indicator (uploading → parsing → extracting competencies → building baseline) while the
   real extraction runs.
4. **Given** a completed resume upload, **When** the candidate views the Resume Upload screen's evidence
   table, **Then** every extracted competency shows its source snippet, initial level, confidence, and a
   "Needs Assessment" verification-status tag — never presented as a final/trusted score.
5. **Given** an upload that fails (unsupported type, oversized, or extraction failure), **When** it
   occurs, **Then** the app shows a clear error message and prominently offers "Try Demo Candidate" as
   the next step, per Rule 12.
6. **Given** the Initial Profile screen, **When** the candidate views it, **Then** every competency entry
   is visibly tagged with its verification status (`UNVERIFIED`/`NEEDS_ASSESSMENT`) and a confidence
   badge (`LOW`/`MEDIUM`/`HIGH`), alongside a visible level-taxonomy guide (Foundation/Working/Advanced/
   Expert).
7. **Given** the Initial Profile screen, **When** the candidate proceeds, **Then** they reach Role
   Selection, see the curated role catalog (each with department, band, summary, and core competency
   focus tags), and can select a role.
8. **Given** a selected role, **When** the candidate inspects its Role Requirements screen, **Then** they
   see the full required-competency matrix (mandated level, priority importance, institutional rationale)
   plus an early comparison of their own initial estimate against each requirement, before starting the
   assessment.

### Edge Cases

- What happens if the candidate navigates back to re-upload a different resume after already picking a
  role? → A new upload replaces the extracted evidence and initial profile for the same candidate record;
  the previously selected role selection is not required to change, but the candidate can re-select if
  the new profile suggests a different target.
- What happens if the initial profile is empty (Mistral found no mappable competencies)? → The Initial
  Profile screen states this clearly ("no competencies detected from your resume") rather than rendering
  a blank/broken table, and still allows proceeding to role selection.
- What happens if the candidate double-clicks "Try Demo Candidate" or submits the resume form twice
  rapidly? → The app disables the action while a request is in flight to avoid duplicate candidate
  creation.
- What happens when the candidate revisits the Candidate screen after already completing the assessment
  (per the prototype's status tracking)? → The screen reflects the current `assessmentStatus`/
  `evidenceSource`/`overallConfidence` accurately rather than always showing a blank/initial state.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a Home screen offering both "Start Capability Assessment" (real flow)
  and "Try Demo Candidate" as clearly visible, equally accessible entry points.
- **FR-002**: System MUST provide a Candidate screen summarizing the candidate's identity (name,
  designation, department, cadre, tenure, location, employee code) and current status (assessment status,
  evidence basis, target role), with actions to upload/re-upload a resume or proceed to the Initial
  Profile.
- **FR-003**: System MUST call the Task 4 resume-upload endpoint on file submission (or the demo-resume
  shortcut) and handle its loading, success, and error responses per the app shell's shared states
  (Task 11), replacing the prototype's simulated multi-stage `delay()` sequence with real upload/
  extraction progress where the backend can report it, and a reasonable staged loading indicator
  otherwise.
- **FR-004**: System MUST call the Task 4/16 demo-candidate endpoint when "Try Demo Candidate" is chosen,
  entering the identical downstream screens as a real upload, all clearly labeled as demo data.
- **FR-005**: System MUST display extracted resume evidence (competency, source snippet, initial level,
  confidence, verification status) on the Resume Upload screen before the candidate proceeds, never
  presenting it as a verified/final result.
- **FR-006**: System MUST display the Initial Capability Profile with, per competency, its category,
  estimated level (on the 4-level Foundation/Working/Advanced/Expert scale), evidence basis, confidence
  (`LOW`/`MEDIUM`/`HIGH`), and verification status — visually distinct from how the verified profile is
  later presented (Task 14).
- **FR-007**: System MUST display the curated list of target roles (from Task 3's `/roles`, adapted to
  the prototype's `TargetRole` shape — department, band, summary, critical-focus tags, required-competency
  count) and let the candidate select one.
- **FR-008**: System MUST call the Task 5 role-selection endpoint on selection, and display the Role
  Requirements screen (mandated competency levels, core/priority flags, institutional rationale, and an
  early candidate-estimate-vs-requirement comparison) before allowing the candidate to proceed to the
  assessment.
- **FR-009**: System MUST disable the upload/demo-candidate action while its request is in flight, to
  prevent duplicate submissions.
- **FR-010**: System MUST show a clear, actionable error state (pointing to "Try Demo Candidate") on any
  resume-upload failure, per Rule 12's demo-reliability requirement.

### Key Entities

- **Home Screen**: entry point, two actions.
- **Candidate Screen**: candidate identity/status summary + entry to resume upload.
- **Resume Upload Screen**: upload form, processing states, extracted-evidence table.
- **Initial Profile Screen**: initial competency profile table + level-taxonomy guide.
- **Role Selection Screen**: role catalog cards.
- **Role Requirements Screen**: required-competency matrix + early gap preview.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A judge can go from Home to a selected target role's requirements, using only "Try Demo
  Candidate," in under 30 seconds, with zero crashes.
- **SC-002**: A real resume upload that succeeds reaches the same Role Requirements screen as the demo
  path, with no separate/divergent UI.
- **SC-003**: 100% of resume-upload failures result in a visible error message and a visible "Try Demo
  Candidate" call-to-action, never a blank or frozen screen.
- **SC-004**: 100% of competency entries shown before the assessment (extracted evidence, initial
  profile) are tagged with a confidence and verification-status indicator — none presented as if already
  verified.

## Assumptions

- This phase builds directly on Task 11's adopted `sk/sk` app shell, routes, `AppContext`, and shared API
  client — it does not introduce new routing or API-client patterns of its own; it wires the six existing
  screens (Home → Candidate → Resume Upload → Initial Profile → Role Selection → Role Requirements) to
  real backend data in place of the prototype's mock constants.
- The prototype's one-click `loadDemoCandidate()` currently also marks the demo candidate's assessment as
  already completed (for fast demo-mode exploration of every downstream screen). For this phase's
  golden-path purposes, "Try Demo Candidate" from the Home screen is treated as entering the same
  step-by-step flow as a real candidate (profile → role → assessment) — Task 16 (Demo Implementation)
  is where the exact judge-facing shortcut behavior (whether the assessment is pre-completed or run live)
  is finalized per `demo_plan.md`.
