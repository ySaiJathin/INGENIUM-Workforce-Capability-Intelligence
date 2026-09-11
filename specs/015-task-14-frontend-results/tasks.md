---

description: "Task list for Task 14 — Frontend Results"
---

# Tasks: Task 14 — Frontend Results

**Input**: Design documents from `/specs/015-task-14-frontend-results/`

**Prerequisites**: plan.md, spec.md, quickstart.md

**Tests**: Not requested — manual verification via quickstart.md only (per plan.md's Testing section).

**Organization**: Single user story (US1, P1) per spec.md.

## Pre-Generation Codebase Audit (read before executing any task below)

All seven screens (`AssessmentResults.tsx`, `CapabilityProfile.tsx`, `SkillGaps.tsx`, `Courses.tsx`,
`CourseDetail.tsx`, `LearningPath.tsx`, `Dashboard.tsx`), `AppContext.tsx`, `mappers.ts`, and the
backend's course/learning-path response schemas were read against every FR/Edge-Case/SC in spec.md.
Finding: **Assessment Results, Capability Profile, and the Skill-Gaps ranked-list rendering are
already correctly wired to real backend data** (FR-001/002/003 already satisfied). Six concrete,
verified gaps remain — two of them silent data loss against an explicit, numbered Success Criterion
(SC-002), not cosmetic issues. Per Rule 10, this tasks.md only touches what's actually broken.

**One gap is explicitly out of this phase's scope, not silently worked around**: `CourseDetail.tsx`'s
modules/prerequisites/learning-outcomes sections are always empty because neither the backend's
`CourseSummary` schema (`backend/src/schemas/reference.py`) nor the curated source data
(`data/curated/courses.json`) contain that content at all — this is a Task 1 (data foundation) /
Task 3 (backend API) gap, not something fixable by rewiring a frontend screen, and CLAUDE.md
explicitly forbids fabricating data to paper over it. T007 below adds an honest empty-state instead.

## Phase 1: Setup

- [x] T001 Confirm the backend is reachable and a candidate can complete an assessment and reach Assessment Results (reuse the Task 12/13 flow) — no code change, verification only.

---

## Phase 2: Foundational

**Not applicable.** All data these screens need already flows through `AppContext.tsx` from Tasks
7-10's endpoints (Task 13's work); this phase only corrects how a few screens consume it.

---

## Phase 3: User Story 1 - See My Verified Profile, Gaps, Courses, and Learning Path (Priority: P1) 🎯 MVP

**Goal**: Close the six verified gaps so every gap from Task 8 is represented somewhere in the flow
(SC-002), zero-gap/zero-step states are explicit rather than blank (SC-004), and a course-recommendation
failure doesn't silently render an unfiltered, unlabeled catalog (SC-003).

**Independent Test**: Run quickstart.md's 9 steps end-to-end, including a zero-gap candidate and a
simulated course-recommendation failure.

### Implementation for User Story 1

- [x] T002 [US1] **(FR-004/SC-004, Edge Case #4)** In `frontend/src/pages/SkillGaps.tsx`, add an explicit "You meet all requirements for this role — no significant skill gaps were identified." empty state when `skillGaps.length === 0`, replacing the currently-blank gap-cards grid and comparison chart in that case. Distinguish this from a failed analysis: if `errors.analysis` is set (meaning `POST /analysis` itself failed, so gaps/courses were never even fetched — see `completeAssessment` in `AppContext.tsx`), show that error instead of the "no gaps" message, since an empty list caused by a failed upstream call is not the same as a genuinely gap-free candidate.
- [x] T003 [US1] **(FR-006/SC-004, Edge Case #7)** In `frontend/src/pages/LearningPath.tsx` and `frontend/src/components/learning/LearningPathTimeline.tsx`, add an explicit "No further learning is required — you meet all target competency requirements." empty state when `learningPath.steps.length === 0` (currently the timeline silently renders nothing). Also fix `progressPercentage`'s `Math.round((completedStepsCount / learningPath.steps.length) * 100) || 25` — with zero steps this divides by zero and the `|| 25` fallback shows a misleading "25% progress" on a path that doesn't exist; guard for the zero-steps case explicitly (e.g. skip rendering the progress bar entirely alongside the empty state).
- [x] T004 [US1] **(FR-005, real correctness bug — not cosmetic)** `Courses.tsx` currently renders `allCourses` — the *entire* ~30-course catalog from the app-wide `GET /courses` catalog load — sorted by `matchScore` but with every non-recommended course still displayed at its default `matchScore: 0` / generic `closesGapDescription: course.description` (see `mapCourseSummary` in `mappers.ts`), not filtered to Task 9's actual recommendations. Fix: in `AppContext.tsx`, capture the ordered list of `course_id`s from `getCourseRecommendations`'s `recommendations` array into a new state `recommendedCourseIds: string[]` (set inside `completeAssessment`'s course-recommendations branch, reset to `[]` in `resetToBlankState`); derive and expose `recommendedCourses: Course[]` (map `recommendedCourseIds` through `allCourses`, filtering out any not found) through the context. Update `Courses.tsx` to render `recommendedCourses` instead of `allCourses`. In demo mode, since there's no separate recommendation call, set `recommendedCourseIds` to `RECOMMENDED_COURSES`'s ids (already imported in `AppContext.tsx`) inside `loadDemoCandidate`/`completeAssessment`'s demo branch.
- [x] T005 [US1] **(FR-008/SC-002, silent data loss — direct violation of a numbered Success Criterion)** Neither `unmatched_gaps` (from `GET /analysis/{id}/courses`'s response, `ApiCoursesResponse`) nor `gaps_without_courses` (from `POST /learning-path`'s response, `ApiLearningPathResponse`) are currently captured anywhere — `completeAssessment` and `generateLearningPath` in `AppContext.tsx` both read only `.recommendations`/`.steps` and drop the rest of the response. Fix:
  - Add `unmatchedGapCompetencyIds: string[]` state, set from `coursesResponse.unmatched_gaps` in `completeAssessment`, reset in `resetToBlankState`.
  - Add `gapsWithoutCoursesCompetencyIds: string[]` state, set from `response.gaps_without_courses` in `generateLearningPath`, reset in `resetToBlankState`.
  - In `Courses.tsx`, render a visible banner/section (when either list is non-empty) listing the affected competency names (map ids through `skillGaps`/`competencyNameById`) with copy like "No course is currently available for: {names} — flagged for curriculum review." — this is exactly the Edge Case's required behavior ("surfaces it clearly... rather than silently omitting it").
  - In `LearningPath.tsx`, render the equivalent for `gapsWithoutCoursesCompetencyIds`.
- [x] T006 [US1] **(FR-009/SC-003, real gap — a whole failure mode is currently invisible)** `Courses.tsx` checks only `loading.courses`/`errors.courses` (the app-wide catalog-load keys, set once on mount) — it never reads `loading.courseRecommendations`/`errors.courseRecommendations` (set in `AppContext.tsx`'s `completeAssessment`, already tracked but read nowhere in any component). This means a failure in the course-*recommendation* call (distinct from the initial catalog fetch) currently renders with **no error shown at all** — after T004's fix it would just look like an empty recommended-courses list, indistinguishable from "you have no gaps." Add an `errors.courseRecommendations` check (rendering `<ErrorState error={errors.courseRecommendations} />`, no retry needed — FR-009 here only requires independent rendering, not retry) above the course grid, and a `loading.courseRecommendations` check for a loading state, so this failure mode is visible and doesn't block the rest of the page.
- [x] T007 [US1] **(FR-005, honest empty-state for an out-of-phase-scope data gap)** In `frontend/src/pages/CourseDetail.tsx`, add a plain fallback message in place of each of the three sections that render from data the backend/curated dataset does not currently supply (`course.modules`, `course.prerequisites`, `course.learningOutcomes` are always `[]` per `mapCourseSummary` in `mappers.ts` — confirmed neither `backend/src/schemas/reference.py`'s `CourseSummary` nor `data/curated/courses.json` contain this content): e.g. "Detailed module breakdown is not yet available for this course." Do not fabricate placeholder module/prerequisite/outcome content — CLAUDE.md's standing rule against silently fabricating curated data applies here.
- [x] T008 [US1] Update `Dashboard.tsx`'s "Top Matched Learning Pathways" section to read from `recommendedCourses` (from T004) instead of `allCourses.slice(0, 3)` — for the same reason as T004, `allCourses` includes irrelevant, unmatched catalog entries that shouldn't appear in an executive summary of *matched* pathways.

**Checkpoint**: Every gap from Task 8 is now represented somewhere (a recommendation or an explicit "no course" flag), zero-gap and zero-step candidates see explicit messaging instead of blank UI, a course-recommendation failure is visible and non-blocking, and Course Detail is honest about what data it doesn't have — independently verifiable via quickstart.md.

---

## Phase 4: Polish & Cross-Cutting Concerns

- [ ] T009 Run quickstart.md's 9-step script by hand (or via whatever browser-driving tool is available) against a live backend, including a zero-gap candidate (step 7) and a simulated course-recommendations failure (step 9, e.g. temporarily point `VITE_API_BASE_URL` at a dead port only for that one call, or stop the backend between the assessment-completion and course-recommendation steps). Record any discrepancy and fix before considering this phase done.
- [x] T010 Update `specs/015-task-14-frontend-results/checklists/requirements.md` with an Implementation Status note (pattern established in specs 013/014), and mark Phase 14 complete in `total_mvp_context.md`'s status tracker.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Not applicable.
- **User Story 1 (Phase 3)**: T002, T003, T007 are independent, single-file edits. T004 must land before T005 (Courses' banner) and T008 (Dashboard) since both build on `recommendedCourses`/`recommendedCourseIds`. T006 is independent of T004/T005 but touches the same file (`Courses.tsx`) — do it in the same pass as T004/T005 to avoid re-editing.
- **Polish (Phase 4)**: Depends on Phase 3's checkpoint.

### Parallel Opportunities

- T002 (`SkillGaps.tsx`), T003 (`LearningPath.tsx`/`LearningPathTimeline.tsx`), and T007 (`CourseDetail.tsx`) touch entirely separate files from the T004→T005→T006→T008 chain (`AppContext.tsx` + `Courses.tsx` + `Dashboard.tsx`) and could be done in parallel; given the small size of each, sequential execution in one pass is simpler and avoids any risk of two edits touching `AppContext.tsx` at once.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (environment check).
2. Complete Phase 3 in this order: T002, T003, T007 (independent, quick) → T004 (foundation for the next two) → T005, T006, T008 (build on T004).
3. **STOP and VALIDATE**: T009's manual quickstart pass.
4. Demo-ready: the full results flow is spec-compliant end-to-end.

---

## Notes

- [P] markers omitted — the real dependency (T004 before T005/T006/T008) and small file count make
  sequential execution simpler than coordinating parallel edits to shared files.
- Avoid: inventing course module/prerequisite/outcome content to fill T007's empty state (that is
  exactly the "fabricate data silently" pattern CLAUDE.md forbids) — a real fix belongs in Task 1's
  data curation, out of this phase's scope.
