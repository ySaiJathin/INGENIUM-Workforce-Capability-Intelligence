---

description: "Task list for Task 11 — Frontend Foundation"
---

# Tasks: Task 11 — Frontend Foundation

**Input**: Design documents from `/specs/012-task-11-frontend-foundation/` (spec.md, plan.md, research.md)

**Tests**: Not requested — no dedicated frontend test framework in scope (plan.md Testing section).

**Organization**: Single user story (US1 — P1, the only story in spec.md). Tasks are grouped Setup →
Foundational → US1 → Polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[US1]**: Belongs to the sole user story, "Have a Working App Shell to Build Every Screen Into"
- File paths are exact and relative to the repository root.

## Real backend contract reference (verified against `backend/src/api/*.py` + `backend/src/schemas/*.py`)

These are the actual, already-implemented endpoints this phase's API client wires to — they differ in
several places from the prototype's originally *assumed* method signatures (spec.md Assumptions notes this
reconciliation happens "during Task 15" for the *scale*, but the *endpoint shapes* below are needed now to
make the client compile and work, since the backend has no `GET /candidates/{id}`, no standalone
`getExtractedEvidence`, and gaps/courses/learning-path all key off an `analysis_id`, not raw
`candidateId + roleId`):

| Method purpose | Verb + Path | Request | Response schema |
|---|---|---|---|
| List roles | `GET /roles` | — | `RoleSummary[]` (`id,name,description`) |
| Role detail | `GET /roles/{role_id}` | — | `RoleDetail` (`RoleSummary` + `required_competencies[]`) |
| List competencies | `GET /competencies` | — | `CompetencySummary[]` |
| List courses | `GET /courses` | — | `CourseSummary[]` |
| Upload resume | `POST /candidates/resume` | multipart field `resume` (PDF/DOCX) | `ResumeUploadResponse` (`candidate_id,source,initial_profile[]`) |
| Select target role | `POST /candidates/{candidate_id}/target-role` | `{role_id}` | `TargetRoleSelectionResponse` (`candidate_id,role: RoleDetail`) |
| Start assessment | `POST /assessment/start` | `{candidate_id, target_role_id}` | `StartAssessmentResponse` (`session_id,status,question_budget`) |
| Next question | `GET /assessment/{session_id}/next-question` | — | `NextQuestionResponse` (`question_id,competency_id,difficulty,sequence_number,prompt,options[],source`) **or** `SessionCompletedResponse` (`status:"completed"`) when the session is done |
| Submit answer | `POST /assessment/{session_id}/answer` | `{question_id, selected_index}` | `AnswerResponse` (`is_correct,competency_id,updated_confidence,updated_difficulty,session_status`) |
| Assessment profile | `GET /assessment/{session_id}/profile` | — | `ProfileResponse` (`session_id,status,competencies[],verified_profile[]`) |
| Create analysis | `POST /analysis` | `{candidate_id, target_role_id}` | `AnalysisResponse` (`analysis_id,candidate_id,target_role_id`) |
| Get gaps | `GET /analysis/{analysis_id}/gaps` | — | `GapsResponse` (`analysis_id,gaps[]` — `SkillGapItem: competency_id,competency_name,required_level,verified_level,gap,rank`) |
| Get course recommendations | `GET /analysis/{analysis_id}/courses` | — | `CoursesResponse` (`analysis_id,recommendations[],unmatched_gaps[]` — `CourseRecommendationItem: course_id,title,matched_gaps[],match_reason,match_score`) |
| Create learning path | `POST /learning-path` | `{analysis_id}` | `LearningPathResponse` (`learning_path_id,analysis_id,steps[],gaps_without_courses[],message`) |
| Get learning path | `GET /learning-path/{learning_path_id}` | — | `LearningPathResponse` (same shape) |
| Health check | `GET /health` | — | `HealthStatus` (`status,database,detail`) |

Backend mounts every router at root (no `/api` prefix) — see `backend/src/main.py`. CORS is already
open (`allow_origins=["*"]`), so no proxy config is required.

---

## Phase 1: Setup

- [X] T001 Relocate the existing prototype from `sk/sk/` to `frontend/` at the repository root (move
  `index.html`, `package.json`, `package-lock.json`, `postcss.config.js`, `tailwind.config.js`,
  `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `src/`; do not touch `node_modules/` or `dist/`
  — reinstall instead). Update any reference to `sk/sk` in root-level docs/scripts that point at it
  (check `docker-compose.yml`, `total_buildplan.md`, `total_mvp_context.md` for path mentions and note
  them, but only edit `docker-compose.yml` if it actually references the old path).
- [X] T002 Run `npm install` inside `frontend/` and confirm `npm run dev` starts the Vite dev server
  cleanly with zero console errors (mock-data screens still render at this point — no behavior change
  yet).
- [X] T003 [P] Create `frontend/.env.example` with `VITE_API_BASE_URL=http://localhost:8000` (placeholder,
  matches `backend/src/main.py`'s unprefixed root-mounted routers) and create a local-only
  `frontend/.env` with the same value for dev; confirm `frontend/.gitignore` (create if missing) excludes
  `.env` but not `.env.example`.

**Checkpoint**: `frontend/` is the working prototype, unchanged in behavior, running against mock data
from its new location.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared plumbing every screen's data-fetching will depend on. No user-story work should start
until this phase is done.

- [X] T004 Create `frontend/src/services/httpClient.ts`: a small typed `apiFetch<T>(path, options)` wrapper
  around native `fetch` that (a) prefixes `path` with `import.meta.env.VITE_API_BASE_URL`, (b) sets
  `Content-Type: application/json` for JSON bodies and omits it for `FormData` bodies (multipart resume
  upload), (c) throws a typed `ApiError` (new class, fields: `kind: 'network' | 'server' | 'client'`,
  `status?: number`, `message: string`) — `kind: 'network'` when `fetch` itself rejects (server
  unreachable), `kind: 'client'` for 4xx, `kind: 'server'` for 5xx, parsing the FastAPI error body's
  `detail` field into `message` when present, (d) returns the parsed JSON body typed as `T` on 2xx.
- [X] T005 [P] Create `frontend/src/components/ui/LoadingState.tsx`: a small reusable spinner/skeleton
  component (using the existing `card-enterprise` utility class and Tailwind tokens already in
  `frontend/tailwind.config.js`, consistent with the other `components/ui/*` primitives) accepting an
  optional `label` prop, for use wherever a screen's fetch is in flight (FR-004).
- [X] T006 [P] Create `frontend/src/components/ui/ErrorState.tsx`: a reusable error panel accepting an
  `error: ApiError` (or `Error`) and an optional `onRetry?: () => void`, rendering distinct copy for
  `kind: 'network'` ("Couldn't reach the server — check the backend is running.") vs `kind: 'server'`
  ("Server error — try again.") vs `kind: 'client'` (the parsed `message`) per FR-005.
- [X] T007 [P] Create `frontend/src/components/layout/RequireCandidate.tsx`: a route-guard wrapper
  component that reads `candidate` (or the new `candidateId`, see T009) from `AppContext` and, if absent,
  redirects (`<Navigate>`) to `/candidate/resume` instead of rendering `children` — implements FR-006 /
  the spec's mid-flow-navigation edge case without changing any page component itself.
- [X] T008 Extend `frontend/src/types/index.ts` with the real backend response/request types needed by the
  API client (do not delete or rename any existing UI-facing type still used by page components): add
  `ApiRoleSummary`, `ApiRoleDetail`, `ApiCompetencySummary`, `ApiCourseSummary`, `ApiInitialProfileItem`,
  `ApiResumeUploadResponse`, `ApiTargetRoleSelectionResponse`, `ApiStartAssessmentResponse`,
  `ApiNextQuestionResponse`, `ApiSessionCompletedResponse`, `ApiAnswerResponse`, `ApiProfileResponse`,
  `ApiVerifiedProfileItem`, `ApiAnalysisResponse`, `ApiSkillGapItem`, `ApiGapsResponse`,
  `ApiCourseRecommendationItem`, `ApiCoursesResponse`, `ApiLearningPathStepItem`,
  `ApiLearningPathResponse` — one interface per row of the contract table above, field names in
  `snake_case` exactly matching the backend schema (mapping to the existing camelCase UI types happens in
  the API client / `AppContext`, not by renaming these).

**Checkpoint**: HTTP wrapper, loading/error UI, route guard, and real backend types all exist and compile;
no screen has been touched yet.

---

## Phase 3: User Story 1 - Have a Working App Shell to Build Every Screen Into (Priority: P1) 🎯 MVP

**Goal**: Replace every mock-data call in `services/api.ts` and `context/AppContext.tsx` with real backend
calls through the shared HTTP client, while preserving every route, component, and `AppContext` action
name/shape (FR-001/FR-002/FR-003/FR-008), and showing loading/error states consistently (FR-004/FR-005).

**Independent Test**: With the backend running (`uvicorn backend.src.main:app --reload`) and
`frontend/` dev server up, load `/`, walk Home → Resume Upload (or a "Try Demo Candidate" action) → Role
Selection → Role Requirements → Assessment → Assessment Results → Capability Profile → Skill Gaps →
Courses → Course Detail → Learning Path → Dashboard with no unhandled crash; confirm `GET /roles` data
renders on the Role Selection screen in place of `TARGET_ROLES`; confirm stopping the backend produces a
visible error state instead of a blank/frozen screen.

### Implementation for User Story 1

- [X] T009 [US1] In `frontend/src/context/AppContext.tsx`, add new internal (non-mock) state needed to
  thread real backend ids through the existing action set without changing any exposed action's name or
  signature: `candidateId: string | null`, `sessionId: string | null`, `analysisId: string | null`,
  `learningPathId: string | null`, plus a generic `loading: Record<string, boolean>` and
  `errors: Record<string, ApiError | null>` map keyed by resource name (e.g. `'roles'`, `'initialProfile'`,
  `'assessment'`, `'gaps'`, `'courses'`, `'learningPath'`) for screens to read via the context.
- [X] T010 [P] [US1] Rewrite `frontend/src/services/api.ts`'s `WorkforceIntelligenceAPI` class in place: keep
  the class name and every existing public method name, but replace each mock body with a real
  `apiFetch` call per the contract table above. Concretely: `getTargetRoles()` → `GET /roles`;
  `getRoleRequirements(roleId)` → `GET /roles/{roleId}`; `uploadResume(file)` → `POST /candidates/resume`
  (build `FormData` with field name `resume`); `getInitialProfile` is retired as a separate call (the
  upload response already returns `initial_profile` — keep the method as a thin pass-through over the
  last upload response stored in `AppContext` rather than a second network call, so no page component
  needs to change); drop `getCandidate`/`getExtractedEvidence` as separate network calls (no such backend
  endpoint exists) and instead derive their return values from state already held after
  `uploadResume`/`selectTargetRole` inside `AppContext` (page components keep reading them from
  `useApp()`, unaffected). Add new methods for the endpoints the prototype never anticipated:
  `selectTargetRole(candidateId, roleId)` → `POST /candidates/{candidateId}/target-role`;
  `startAssessment(candidateId, targetRoleId)` → `POST /assessment/start`;
  `getNextQuestion(sessionId)` → `GET /assessment/{sessionId}/next-question`;
  `submitAnswer(sessionId, questionId, selectedIndex)` → `POST /assessment/{sessionId}/answer`;
  `getAssessmentProfile(sessionId)` → `GET /assessment/{sessionId}/profile`;
  `createAnalysis(candidateId, targetRoleId)` → `POST /analysis`;
  `getSkillGaps(analysisId)` → `GET /analysis/{analysisId}/gaps` (replaces the old
  `(candidateId, roleId)` signature — analysis id is now the key);
  `getCourseRecommendations(analysisId)` → `GET /analysis/{analysisId}/courses` (same signature change);
  `getCourseDetails(courseId)` stays client-side (filters the already-fetched `GET /courses` list — no
  single-course backend endpoint exists); `createLearningPath(analysisId)` → `POST /learning-path`;
  `getLearningPath(learningPathId)` → `GET /learning-path/{learningPathId}` (replaces the old
  `(candidateId, roleId)` signature). Every method must let a thrown `ApiError` propagate to its caller
  (no silent catch) so `AppContext` and screens can render `ErrorState`.
- [X] T011 [US1] In `frontend/src/context/AppContext.tsx`, rewire `setResumeUploaded` to actually call
  `WorkforceIntelligenceAPI.uploadResume(file)`, set `loading.initialProfile`/`errors.initialProfile`
  around the call, store the returned `candidate_id` into the new `candidateId` state, map
  `initial_profile[]` (`ApiInitialProfileItem`, snake_case) into the existing `InitialCapabilityItem[]`
  shape (camelCase) the prototype's screens already render, and update `candidate.assessmentStatus`/
  `evidenceSource`/`overallConfidence`/`initialProfileGenerated` exactly as the current mock
  implementation does today — keep the function's exported signature
  `(fileName: string, customEvidence?: ExtractedEvidence[]) => void` unchanged for now, but have it
  actually accept the `File` object needed for the real upload (adjust the call sites in
  `ResumeUpload.tsx` in this same task, since that's the only consumer, to pass the `File`).
- [X] T012 [US1] In `frontend/src/context/AppContext.tsx`, rewire `selectTargetRole(roleId)` to call
  `WorkforceIntelligenceAPI.selectTargetRole(candidateId, roleId)` (guarding: no-op with a console warning
  if `candidateId` is null, i.e. no resume uploaded yet — do not crash), map the returned `RoleDetail`
  into the existing `TargetRole` shape, and set `loading.targetRole`/`errors.targetRole` around the call.
  Also rewire the initial `allRoles` load: replace the `useState<TargetRole[]>(TARGET_ROLES)` initializer
  with an empty array plus a `useEffect` on mount that calls `WorkforceIntelligenceAPI.getTargetRoles()`,
  maps `RoleSummary[]` to `TargetRole[]` (fields not present in `RoleSummary`, like `band`/
  `criticalFocus`/`requiredCompetencies`, are filled in only once `getRoleRequirements` is separately
  fetched for the selected role — leave them empty/defaulted on the list view), and sets
  `loading.roles`/`errors.roles`.
- [X] T013 [US1] In `frontend/src/context/AppContext.tsx`, add a new `startAssessmentSession: () => Promise<void>`
  action (new — not in FR-008's preserved list, but required to obtain a real `sessionId` before
  `answerAssessmentQuestion`/`nextQuestion` can call real endpoints) that calls
  `WorkforceIntelligenceAPI.startAssessment(candidateId, targetRole.id)`, stores `session_id` into
  `sessionId`, then calls `getNextQuestion(sessionId)` and stores the first question. Rewire
  `nextQuestion()` to call `submitAnswer` for the just-answered question (if not already submitted) then
  `getNextQuestion(sessionId)` for the next one, storing it as the "current" question the `Assessment.tsx`
  page renders (add a `currentAssessmentQuestion: ApiNextQuestionResponse | null` field to context state
  for this); when `getNextQuestion` returns `SessionCompletedResponse`, set `isAssessmentCompleted = true`
  and call `completeAssessment()` (T014). Keep `answerAssessmentQuestion(questionId, optionId)`'s existing
  signature as the local "record this answer" action; `nextQuestion` is what actually submits it via
  `submitAnswer`.
- [X] T014 [US1] In `frontend/src/context/AppContext.tsx`, rewire `completeAssessment()` to call
  `WorkforceIntelligenceAPI.getAssessmentProfile(sessionId)`, map `ProfileResponse.verified_profile[]`
  (`ApiVerifiedProfileItem`) into the existing `VerifiedCapabilityItem[]`/`AssessmentResultSummary` shapes
  the prototype's `AssessmentResults.tsx`/`CapabilityProfile.tsx` already render, then call
  `WorkforceIntelligenceAPI.createAnalysis(candidateId, targetRole.id)`, store the returned `analysis_id`
  into `analysisId`, then call `getSkillGaps(analysisId)` and `getCourseRecommendations(analysisId)` and
  map both into the existing `SkillGap[]`/`Course[]` shapes, setting `loading`/`errors` keys
  (`'assessmentProfile'`, `'analysis'`, `'gaps'`, `'courses'`) around each step; if any step fails, still
  leave whatever succeeded before it in state and surface that step's specific error via `errors[...]`
  rather than aborting the whole chain silently.
- [X] T015 [US1] In `frontend/src/context/AppContext.tsx`, rewire the `learningPath` load: replace the
  `useState<LearningPath>(INITIAL_LEARNING_PATH)` initializer with an empty/placeholder shape plus a new
  effect (or an explicit action called from `LearningPath.tsx`'s mount) that calls
  `WorkforceIntelligenceAPI.createLearningPath(analysisId)` (guarded: no-op if `analysisId` is null),
  stores `learning_path_id`, maps `LearningPathResponse.steps[]` (`ApiLearningPathStepItem`) into the
  existing `LearningPathStep[]` shape (fields the backend doesn't provide, like `durationText`/`status`/
  `projectedReadinessContribution`/`keyMilestones`, are defaulted client-side exactly as
  `addCourseToLearningPath` already does for locally-added steps), and sets
  `loading.learningPath`/`errors.learningPath`. Keep `addCourseToLearningPath`/
  `removeCourseFromLearningPath`/`toggleStepStatus` as pure client-side state updates, per spec.md's
  Assumptions (no backend mutation endpoint for these).
- [X] T016 [US1] In `frontend/src/context/AppContext.tsx`, replace `allCourses`'s
  `useState<Course[]>(RECOMMENDED_COURSES)` initializer with an empty array plus a mount `useEffect`
  calling `WorkforceIntelligenceAPI.getCourses()` (via a thin wrapper method added in T010 if not already
  present, e.g. `getAllCourses()` → `GET /courses`), mapping `CourseSummary[]` into the existing `Course[]`
  shape (fields absent from `CourseSummary` — `rating`, `reviewsCount`, `format`, `modules`,
  `prerequisites`, `learningOutcomes`, `matchScore`, `priority`, `expectedPathway`,
  `closesGapDescription`, `certificationOffered` — are defaulted to sensible empty/placeholder values
  here, not left `undefined`, so `Courses.tsx`/`CourseDetail.tsx` don't crash on missing fields), and
  sets `loading.courses`/`errors.courses`. `getCourseDetails(courseId)` (T010) filters this same fetched
  list client-side.
- [X] T017 [US1] Update `frontend/src/context/AppContext.tsx`'s `resetToBlankState()` to also clear
  `candidateId`, `sessionId`, `analysisId`, `learningPathId`, `currentAssessmentQuestion`, and all
  `loading`/`errors` map entries, so a reset genuinely returns to a "no real data yet" state rather than
  leaving stale ids from a previous session (this is the concrete implementation of the spec's "no real
  data yet" edge case, replacing the old comment-level mock defaults).
- [X] T018 [US1] Update `frontend/src/pages/ResumeUpload.tsx` to pass the actual uploaded `File` object into
  `setResumeUploaded` (per T011's signature change), render `<LoadingState label="Extracting skills from
  your resume…" />` while `loading.initialProfile` is true, and render `<ErrorState>` with a retry button
  when `errors.initialProfile` is set, instead of the prototype's fixed `delay()`-based fake progress bar.
- [X] T019 [P] [US1] Update `frontend/src/pages/RoleSelection.tsx` and `frontend/src/pages/RoleRequirements.tsx`
  to render `<LoadingState>`/`<ErrorState>` from `loading.roles`/`errors.roles` (and
  `loading.targetRole`/`errors.targetRole` on the requirements screen) instead of assuming `allRoles`/
  `targetRole` are always already populated.
- [X] T020 [P] [US1] Update `frontend/src/pages/Assessment.tsx` to call the new `startAssessmentSession()`
  action (T013) on mount if no `sessionId` exists yet, render the real `currentAssessmentQuestion` from
  context (falling back to a clear "no question loaded" state, never a blank screen, if it's null while
  not loading), and render `<LoadingState>`/`<ErrorState>` around question fetch/answer submission.
- [X] T021 [P] [US1] Update `frontend/src/pages/AssessmentResults.tsx`, `frontend/src/pages/CapabilityProfile.tsx`,
  `frontend/src/pages/SkillGaps.tsx` to render `<LoadingState>`/`<ErrorState>` from the relevant
  `loading`/`errors` keys set in T014, instead of assuming `assessmentResults`/`verifiedProfile`/
  `skillGaps` are always already populated.
- [X] T022 [P] [US1] Update `frontend/src/pages/Courses.tsx`, `frontend/src/pages/CourseDetail.tsx`,
  `frontend/src/pages/LearningPath.tsx` to render `<LoadingState>`/`<ErrorState>` from
  `loading.courses`/`errors.courses` and `loading.learningPath`/`errors.learningPath` respectively.
- [X] T023 [US1] Wrap the route elements in `frontend/src/App.tsx` that require a candidate to already
  exist (`candidate/profile`, `roles`, `roles/:roleId`, `assessment`, `assessment/results`, `capability`,
  `gaps`, `courses`, `courses/:courseId`, `learning-path`, `dashboard`) with the `RequireCandidate` guard
  from T007, leaving `/`, `/candidate`, and `/candidate/resume` unguarded — implements FR-006 without
  changing any page component's internals.
- [X] T024 [US1] Manually verify the full golden path against the running backend
  (`uvicorn backend.src.main:app --reload` from repo root, `npm run dev` in `frontend/`): upload a real
  resume through `/candidate/resume`, select a role, complete the assessment, confirm
  `AssessmentResults`/`CapabilityProfile`/`SkillGaps`/`Courses`/`LearningPath`/`Dashboard` all render real
  (non-mock) data end to end with no unhandled crash (SC-001); then stop the backend process and confirm
  each data-fetching screen shows a visible `ErrorState` rather than a blank/frozen screen (SC-003).

**Checkpoint**: Every route in the prototype is wired to the real backend through the shared API client;
loading/error states are consistent everywhere; no page imports from `mock/demoData.ts` for its primary
data source (Tasks 12–14 build directly on top of this).

---

## Phase 4: Polish & Cross-Cutting Concerns

- [X] T025 [P] Remove now-dead imports of `mock/demoData.ts` from `frontend/src/services/api.ts` and
  `frontend/src/context/AppContext.tsx` (keep the `mock/demoData.ts` file itself, per plan.md's Structure
  Decision — it remains the reference for Tasks 1/16's seed data authoring).
  Run `npx tsc --noEmit` inside `frontend/` and fix any resulting type errors from the T008/T010 type
  changes.
- [X] T026 Update `frontend/src/context/AppContext.tsx`'s `loadDemoCandidate()` to either (a) drive the same
  real-API sequence as the manual golden path (upload the bundled demo resume file, select the default
  demo role, etc.) or (b) explicitly stay mock-backed as an offline fallback per CLAUDE.md Rule 12/14 —
  pick (b) for this phase (Task 16 "Demo Implementation" owns wiring the demo path to real seeded data;
  this task only needs to confirm `loadDemoCandidate()` still works standalone today, without crashing,
  as a Rule 12 safety net) and add a one-line comment in the code noting Task 16 will revisit it.
- [X] T027 [P] Add a short "Frontend" section to the repo root `README.md` (create one if it does not
  exist) documenting: `cd frontend && npm install && npm run dev`, the `VITE_API_BASE_URL` env var, and
  that the backend must be running separately (`uvicorn backend.src.main:app --reload` from repo root) for
  real data to load.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately.
- **Foundational (Phase 2)**: Depends on Setup (needs `frontend/` to exist at its new path). Blocks all of
  Phase 3.
- **User Story 1 (Phase 3)**: Depends on Foundational completion. This is the only user story — no
  parallel-story concerns.
- **Polish (Phase 4)**: Depends on Phase 3 completion.

### Within Phase 3

- T009 (context state) blocks T011–T017 (all rewire logic that reads/writes the new state fields).
- T010 (API client rewrite) blocks T011–T016 (all context rewiring calls into
  `WorkforceIntelligenceAPI`).
- T011–T017 (context rewiring) block T018–T022 (page updates that consume the new loading/error state).
- T007 (RequireCandidate, Phase 2) blocks T023.
- T024 (manual verification) comes last — depends on everything above.

### Parallel Opportunities

- T003 can run alongside T001/T002 finishing (independent file).
- T005, T006, T007 (Phase 2) can all run in parallel — independent new files.
- T019, T020, T021, T022 (Phase 3 page updates) can run in parallel once T011–T017 are done — each touches
  a disjoint set of page files.
- T025, T027 (Phase 4) can run in parallel.

---

## Parallel Example: Phase 2 Foundational

```bash
Task: "Create frontend/src/components/ui/LoadingState.tsx"
Task: "Create frontend/src/components/ui/ErrorState.tsx"
Task: "Create frontend/src/components/layout/RequireCandidate.tsx"
```

---

## Implementation Strategy

### MVP Scope

This entire feature *is* the MVP scope for Task 11 — there is only one user story (P1). Complete Phases
1–3 in order; Phase 4 is cleanup that can be deferred if the deadline (CLAUDE.md Rule 1/11) forces a cut,
since it does not block Tasks 12–14 starting on top of Phase 3's checkpoint.

### Suggested order

1. Phase 1 (Setup) — relocate and confirm the prototype still runs unchanged.
2. Phase 2 (Foundational) — HTTP client, loading/error UI, route guard, real types.
3. Phase 3 (US1) — rewire `api.ts` and `AppContext.tsx` endpoint-by-endpoint (T010 first, since every
   context task depends on it), then wire each page's loading/error UI, then the route guard, then
   verify the full path manually (T024).
4. Phase 4 (Polish) — dead-import cleanup, demo-candidate safety-net check, README.
