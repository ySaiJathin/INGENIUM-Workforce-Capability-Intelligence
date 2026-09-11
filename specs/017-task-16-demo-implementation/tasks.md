---

description: "Task list for Task 16 — Demo Implementation"
---

# Tasks: Task 16 — Demo Implementation

**Input**: Design documents from `/specs/017-task-16-demo-implementation/`

**Prerequisites**: plan.md, spec.md, contracts/api.md, quickstart.md

**Tests**: Not requested — manual rehearsal via quickstart.md/`demo_plan.md` §16 is the test.

**Organization**: Single user story (US1, P1) per spec.md.

## Pre-Generation Notes — What's Actually Broken, and the Real Data Chosen

Read `demo_plan.md` in full, `contracts/api.md`, both prior audits of `AppContext.tsx` (specs 013-016),
and cross-checked candidate curated data (`data/curated/roles.json`/`competencies.json`/`courses.json`)
against `demo_plan.md` §3/§7/§10's illustrative story before writing this list.

**The core finding, confirmed across three prior specs' audits and now acted on**: `AppContext.tsx`'s
`loadDemoCandidate()` is 100% client-side mock data — it short-circuits every downstream action
(`selectTargetRole`, `startAssessmentSession`, `nextQuestion`, `completeAssessment`,
`generateLearningPath`) with an `if (isDemoMode) {...}` branch that never touches the backend, and
pre-marks the assessment as already completed. This directly violates this phase's own FR-001 ("enters
the exact same downstream pipeline as a real resume upload") and SC-005 (zero hand-typed numbers). Specs
013 and 016 both deferred fixing this to Task 16 by name — this is that fix.

**A real, un-invented match found in the curated data, not a coincidence**: `role-sso-01` ("Senior
Statistical Officer") requires `sql` (L4), `python` (L3), `statistics` (L4), plus `sql_window_functions`
(L3) and (via `sql_ctes` elsewhere in the competency graph) — and the curated course
`sql-window-analytics-03` ("Advanced SQL Analytics") covers exactly `sql_window_functions` +
`sql_ctes`. This reproduces `demo_plan.md` §7's "probing Window Functions" narration and §10's "Advanced
SQL Analytics ... covers Window Functions + CTEs" course-recommendation beat using data that already
exists — no new competency/course/role needs inventing.

**One deliberate deviation from plan.md, matching Rule 10's spirit**: plan.md's Project Structure lists
the new seed file at `backend/data/curated/demo_candidate.json`, but every other curated file
(`roles.json`, `competencies.json`, `courses.json`, `assessment_seed.json`) actually lives at the
repo-root `data/curated/`, loaded via `seed_reference_data.py`'s `CURATED_DIR = ROOT / "data" / "curated"`
constant. T002 places the new file at `data/curated/demo_candidate.json` to match the one real, existing
convention rather than introducing a second, inconsistent curated-data location.

**"Scripted assessment answers" are rehearsal guidance for a human presenter, not backend automation**:
`demo_plan.md` §14 step 5 says the presenter "answer[s] 3-4 questions live" — the real assessment
correctly never exposes the correct answer to the client before submission (spec 014's FR-004), so there
is no code-level way to "script" answers automatically without breaking that guarantee. T002's seed file
instead documents, per competency, which answer the presenter should aim for (matching `demo_plan.md`'s
SQL-leads-the-gap story) as data a human reads during rehearsal — never auto-executed.

## Phase 1: Setup

- [x] T001 Confirm the backend is reachable and seeded, and re-confirm (from spec 016's audit) that the real (non-demo) golden path still works end-to-end — this phase must not regress it.

---

## Phase 2: Foundational

**Not applicable.** This phase reuses every engine from Tasks 4-10 unchanged (plan.md: "adds no new
engine logic").

---

## Phase 3: User Story 1 - Give a Judge a Polished, Reliable, Two-Minute Demo (Priority: P1) 🎯 MVP

**Goal**: "Try Demo Candidate" seeds a real backend candidate and enters the identical step-by-step
pipeline as a real upload, producing real-engine-computed numbers for a coherent SQL/Window-Functions
gap story, with the named demo polish and rehearsed failure recovery in place.

**Independent Test**: `curl -X POST http://localhost:8000/candidates/demo` on a cold backend returns 201
with a real initial profile; the same candidate can be walked through role selection (`role-sso-01`),
assessment, verified profile, gaps, courses, and learning path via the browser exactly as a real upload
would, with every number traceable to that run's actual engine output.

### Implementation for User Story 1

- [x] T002 [US1] Author `data/curated/demo_candidate.json`: `name: "Demo Officer"`, `current_role: "Statistical Analyst"`, `years_experience: 3`, `target_role_id: "role-sso-01"`, `initial_profile` (matching `demo_plan.md` §3's SQL 2.5 / Python 3.2 / Statistics 3.7, using the real `ConfidenceLevel` enum `LOW`/`MEDIUM`/`HIGH` — not a raw float, despite `contracts/api.md`'s JSON example showing one — because the contract's own prose says this response "matches Task 4's `POST /candidates/resume` response shape exactly," and that shape's `resume_confidence` is categorical; the JSON example's raw-float illustration is treated the same way `demo_plan.md` itself treats its numbers — illustrative, not literal): `sql` L2.5/`MEDIUM`, `python` L3.2/`MEDIUM`, `statistics` L3.7/`HIGH`, each with a short, plausible resume evidence snippet. Add a `rehearsal_answer_guidance` array (one entry per `role-sso-01` required competency: `competency_id`, `aim_for: "correct"|"incorrect"`) scripting the SQL-leads-the-gap story — `sql`, `sql_window_functions` aim for `incorrect` (drives the "probing Window Functions" narration and the Advanced SQL Analytics recommendation), everything else (`python`, `statistics`, `inferential_statistics`, `survey_methodology`, `statistical_report_writing`, `data_governance_ethics`) aims for `correct` — consumed only by a human during rehearsal (see quickstart.md), never executed by code.
- [x] T003 [US1] Add `POST /candidates/demo` to `backend/src/api/candidates.py` per `contracts/api.md`: no request body; loads `data/curated/demo_candidate.json` (reuse `seed_reference_data.py`'s `CURATED_DIR` path-resolution pattern); creates a fresh `Candidate` row (`source="demo"`, new `uuid.uuid4()` id, `resume_filename=None`) and one `CandidateSkill` row per `initial_profile` entry (using `CONFIDENCE_TO_FLOAT` from `backend/src/schemas/candidates.py` to convert the categorical confidence to the float the column actually stores, exactly as the real upload path already does) on **every call** — not a single pre-seeded row reused across calls — so "Try Demo Candidate" produces a fresh, independent candidate on every cold reload (spec SC-002), never colliding with a prior run's state. Return a `ResumeUploadResponse` with `source="demo"` and the same `initial_profile` shape as a real upload (FR-001).
- [x] T004 [US1] Add `startDemoCandidate(): Promise<ApiResumeUploadResponse>` to `frontend/src/services/api.ts` (`POST /candidates/demo`, no body) — same return type as `uploadResume`, since T003 guarantees an identical response shape.
- [x] T005 [US1] **(The core structural fix, FR-001)** Rewrite `loadDemoCandidate` in `frontend/src/context/AppContext.tsx` to call `WorkforceIntelligenceAPI.startDemoCandidate()` and handle its response exactly like `setResumeUploaded`'s success branch (set `candidateId`, map `initial_profile` into `initialProfile`/`extractedEvidence`, update `candidate.assessmentStatus`/`evidenceSource`/`initialProfileGenerated`/`overallConfidence`) — then set `isDemoMode(true)` purely as a display flag (used only for "Demo Data" labeling) and the presentational identity fields `demo_plan.md` wants shown (`candidate.name = "Demo Officer"`, `designation = "Statistical Analyst"`, `yearsOfExperience = 3`, plus placeholder `department`/`cadre`/`location`/`email`/`employeeCode` values clearly in keeping with the demo persona) — since neither a real nor demo `POST /candidates/resume`-shaped response carries identity fields (Task 4's spec: "validated but intentionally not persisted"), these are legitimately UI-presentation content, not fabricated competency/score data, and spec's SC-005 only constrains *numbers on gap/profile screens*. Do **not** pre-populate `assessmentQuestions`, `assessmentAnswers`, `verifiedProfile`, `skillGaps`, `learningPath`, or set `isAssessmentCompleted`/`assessmentCompleted` — those must come from the same real calls a resume-upload candidate goes through.
- [x] T006 [US1] Remove every `if (isDemoMode) { ...; return; }` mock-data short-circuit from `selectTargetRole`, `startAssessmentSession`, `nextQuestion`, `completeAssessment`, and `generateLearningPath` in `AppContext.tsx` — after T005, `isDemoMode` is a pure display flag and every one of these functions must run its real-backend branch unconditionally for both entry points, per FR-001's "no branching logic beyond the entry screen."
- [x] T007 [US1] After T005/T006, `frontend/src/mock/demoData.ts`'s `EXTRACTED_RESUME_EVIDENCE`, `INITIAL_CAPABILITY_PROFILE`, `TARGET_ROLES`, `ASSESSMENT_QUESTIONS`, `VERIFIED_ASSESSMENT_RESULTS`, `VERIFIED_CAPABILITY_PROFILE`, `SKILL_GAPS`, `RECOMMENDED_COURSES`, and `INITIAL_LEARNING_PATH` become unused dead imports in `AppContext.tsx` (only `DEMO_CANDIDATE` may still be referenced, and only if T005 reuses any of its literal string values — check before keeping the import). Remove the now-unused imports; do not delete `mock/demoData.ts` itself without checking no other file still imports from it.
- [x] T008 [US1] **(FR-003 verification, not necessarily new work)** Check that `demo_plan.md`'s named UI beats already render correctly given T005-T007's real data: the "Initial estimate" / "Needs Assessment" labeling on `ResumeUpload.tsx`/`InitialProfile.tsx` (already present per spec 013), the verified-vs-initial comparison on `AssessmentResults.tsx` (already present per spec 015, `ComparisonBar` with `initialLevel`), and the adaptive-probe narration on `Assessment.tsx`'s sidebar (already present per spec 014's `probingReason`/`adaptiveBranchNote`, and now guaranteed not to leak the Mistral/seed distinction). Confirm these still make sense with a `role-sso-01` demo candidate's real gap shape (SQL/Window-Functions leading) — adjust copy only if something reads oddly for this specific role, not a redesign.
- [x] T009 [US1] **(FR-004/FR-005, already largely proven in spec 016, re-confirm for the demo path specifically)** With the current Mistral rate-limit (confirmed ongoing all session), run the demo candidate through the assessment and confirm it falls back to seed questions exactly as the real path does (T006 makes this automatic — same code path). Also confirm an unsupported/failing real resume upload still shows the "Try Demo Candidate" call-to-action (spec 013's T002/T004 fix), now leading into a real (not mock) demo pipeline.
- [ ] T010 [US1] **(FR-006, honestly scoped)** Capture the offline screenshot fallback set (initial profile, verified profile, gap analysis, learning path) — this requires a running frontend and a human (or a browser-automation tool this environment doesn't have) to actually view and screenshot the pages; document this as a manual step for the user to perform rather than claiming it was captured, per this session's established practice of not fabricating a "done" claim for a step that requires tooling not available here.

**Checkpoint**: "Try Demo Candidate" seeds a real, freshly-created backend candidate every time and
flows through the exact same code path as a real upload, with a coherent, real-engine-computed
SQL/Window-Functions gap story available for the demo script.

---

## Phase 4: Polish & Cross-Cutting Concerns

- [x] T011 Run `frontend`'s `tsc --noEmit`/`npm run build`, then replay this phase's version of the golden path via direct API calls (same technique as spec 016's T003) hitting `POST /candidates/demo` instead of `POST /candidates/resume`, through to a populated learning path — confirming T003's endpoint and T005/T006's frontend rewrite are consistent with each other end-to-end.
- [x] T012 Update `specs/017-task-16-demo-implementation/checklists/requirements.md` with an Implementation Status note, and update `total_mvp_context.md`'s status tracker for Phase 16, naming T010's manual-screenshot-capture and the actual timed-rehearsal (`demo_plan.md` §16's checklist, SC-001/SC-004) as still requiring a human pass with the real presentation device/browser.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Not applicable.
- **User Story 1 (Phase 3)**: T002 before T003 (endpoint needs the seed file); T003 before T004 (frontend client needs the endpoint to exist); T004 before T005; T005 before T006 (removing the short-circuits only makes sense once the entry point itself is real); T007 depends on T005/T006 being done first (need to see what's actually still referenced); T008/T009 are verification passes that depend on T005-T007 being complete; T010 is independent and can happen any time a live frontend is available.
- **Polish (Phase 4)**: Depends on Phase 3's checkpoint.

### Parallel Opportunities

- None meaningful — T002 through T007 form a single dependent chain in one backend file and one frontend context file; splitting them across parallel agents would risk conflicting edits for no time saved given their small individual size.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 3 in strict order: T002 → T003 → T004 → T005 → T006 → T007 → T008 → T009 → T010.
3. **STOP and VALIDATE**: T011's API-level regression pass.
4. Hand off to Task 17 (Final Testing) with T010 (screenshots) and the full timed, real-device rehearsal
   named as outstanding human steps.

---

## Notes

- This is the single largest structural change since Task 11 to `AppContext.tsx` — removing five
  `isDemoMode` short-circuits — because it is the change spec 013 and spec 016 both explicitly deferred
  here by name. Do it as one coherent pass (T005-T007) rather than piecemeal, so the file is never left
  in a half-migrated state between commits.
- Do not invent a new curated role/course/competency for the demo story — `role-sso-01` and
  `sql-window-analytics-03` already produce the intended narrative from real data (see Pre-Generation
  Notes). Inventing new curated content here would violate Rule 10 and CLAUDE.md's data-fabrication rule.
