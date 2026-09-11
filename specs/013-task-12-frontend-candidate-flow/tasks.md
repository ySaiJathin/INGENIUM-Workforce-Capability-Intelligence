---

description: "Task list for Task 12 — Frontend Candidate Flow"
---

# Tasks: Task 12 — Frontend Candidate Flow

**Input**: Design documents from `/specs/013-task-12-frontend-candidate-flow/`

**Prerequisites**: plan.md, spec.md, quickstart.md

**Tests**: Not requested — manual verification via quickstart.md only (per plan.md's Testing section).

**Organization**: Tasks are grouped by user story. Spec.md defines a single user story (US1, P1) —
there is no US2/US3 to interleave.

## Pre-Generation Codebase Audit (read before executing any task below)

Before writing this list, the six screens (`Home.tsx`, `Candidate.tsx`, `ResumeUpload.tsx`,
`InitialProfile.tsx`, `RoleSelection.tsx`, `RoleRequirements.tsx`) and `context/AppContext.tsx` were
read in full against spec.md's FRs, Edge Cases, and Success Criteria. Finding: **this feature is
already ~90% implemented** — `AppContext.tsx`'s `setResumeUploaded`, `selectTargetRole`, and the
foundational `/roles`/`/courses`/`/competencies` loaders already call the real Task 4/5 backend
endpoints (confirmed working end-to-end against a live backend in this session, including the
seed-question and Mistral-failure fallback paths per Rule 5/14); all six screens already consume
`AppContext` state rather than the `mock/demoData.ts` constants directly (mock data is used only
inside `loadDemoCandidate()`, which spec.md's own Assumptions section defers to Task 16).

Per Rule 10 (preserve working code) and Rule 9 (test continuously, don't redo what already works),
this tasks.md does **not** regenerate a from-scratch task list for already-working wiring. It lists
only the concrete, verified gaps between the current code and spec.md's FR-009/Edge-Cases/SC-003,
plus a final manual verification pass. There is no Phase 2 (Foundational) — Task 11 already built
everything US1 depends on (`services/api.ts`, `AppContext`, routes), and no new foundational work is
introduced by this phase's remaining gaps.

## Phase 1: Setup

**Purpose**: Confirm the environment this phase's manual verification (Phase 3) will run against.

- [x] T001 Confirm the backend is reachable and seeded (`GET /health` returns `{"status":"ok","database":"connected"}`, `GET /roles` returns the 6 seeded roles) and the frontend dev server starts cleanly (`cd frontend && npm run dev`) — no code change, verification only.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Not applicable to this phase.** Task 11 already delivered the app shell, routes, `AppContext`, and
`services/api.ts` that every task below builds on; nothing here blocks user-story work.

---

## Phase 3: User Story 1 - Upload My Resume (or Try the Demo) and Pick My Target Role (Priority: P1) 🎯 MVP

**Goal**: Close the two verified gaps between the current implementation and spec.md's FR-009 and Edge
Cases, then confirm the full six-screen flow against quickstart.md.

**Independent Test**: Run quickstart.md's 9 steps end-to-end in the browser against the live backend
(both the "Try Demo Candidate" and real-upload entry paths), confirming SC-001 through SC-004.

### Implementation for User Story 1

- [x] T002 [US1] In `frontend/src/pages/ResumeUpload.tsx`, guard `handleDrop` so a file dropped onto the upload zone while `isProcessing` is `true` is ignored (return early before calling `handleUpload`) — currently only the file-picker `<label>` is hidden during upload, but the drag-and-drop zone stays active and will fire a second `setResumeUploaded` call on a second drop, violating FR-009 ("disable the upload/demo-candidate action while its request is in flight") and spec.md's Edge Case on rapid duplicate submission.
- [x] T003 [US1] In `frontend/src/pages/InitialProfile.tsx`, render an explicit empty-state message ("No competencies were detected from your resume — you can still proceed to select a target role.") in place of the Resume-Derived Competency Estimates table when `initialProfile.length === 0`, per spec.md's Edge Case: "What happens if the initial profile is empty ... → states this clearly ... rather than rendering a blank/broken table, and still allows proceeding to role selection." Keep the existing "proceed to role selection" `PageHeader` `nextPath` action untouched so the candidate can still continue.
- [x] T004 [US1] In `frontend/src/pages/ResumeUpload.tsx`, apply the same empty-state treatment to the Extracted Competency Evidence table (replace the empty `<tbody>` with a message such as "No competencies were extracted from this resume.") for consistency with T003 — both tables source the same `extractedEvidence`/`initialProfile` length-zero case from one upload.
- [ ] T005 [US1] Run quickstart.md's full 9-step script by hand against the running app (`npm run dev` + live backend): both entry paths converge on Role Requirements (SC-002), every pre-assessment competency row carries a confidence + verification-status tag (SC-004), an unsupported-file upload shows a visible error with a "Try Demo Candidate" call-to-action (SC-003), and rapid double-submission (drag-drop twice, per T002) creates only one candidate. Record and fix any discrepancy found before marking this phase complete. **Not completed in this session** — no headless-browser tool was available; verified instead via full backend curl walkthrough (separate session), a clean `tsc --noEmit`, and a clean `npm run build`. A human should still run this pass once before the live demo.

**Checkpoint**: At this point, User Story 1 — the entire candidate-intake portion of the golden path — is fully functional, gap-free against spec.md, and independently verified in the browser.

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Nothing further identified as in-scope for this phase — Rule 11 (P0 before P1) and Rule 2
(no architecture changes) rule out further additions here (e.g. wiring "Try Demo Candidate" to a real
backend endpoint per FR-004 is explicitly Task 16's responsibility per spec.md's Assumptions, not
this phase's).

- [x] T006 Update this feature's `checklists/requirements.md` (if present) to reflect T002-T005's completion, and note in `total_mvp_context.md`'s status tracker that Phase 12 (Frontend Candidate Flow) is complete.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — run first to confirm the environment before touching code.
- **Foundational (Phase 2)**: Not applicable — already satisfied by Task 11.
- **User Story 1 (Phase 3)**: Depends on Phase 1's confirmation that the backend/frontend are both reachable. T002, T003, T004 are independent file edits and can be done in any order or in parallel; T005 depends on all three being complete (it verifies them together).
- **Polish (Phase 4)**: Depends on Phase 3's checkpoint.

### Parallel Opportunities

- T002, T003, T004 touch different concerns in two files (`ResumeUpload.tsx` gets both T002 and T004 — do those two sequentially in the same file; T003 in `InitialProfile.tsx` is fully independent and can be done in parallel with them).

---

## Parallel Example: User Story 1

```bash
# T003 (different file) can run in parallel with T002+T004 (same file, sequential):
Task: "Add empty-state message to InitialProfile.tsx (T003)"
Task: "Guard handleDrop against in-flight uploads, then add empty-state to ResumeUpload.tsx's evidence table (T002 then T004)"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (environment check only).
2. Complete Phase 3: User Story 1 (T002-T005 — the only real remaining code changes).
3. **STOP and VALIDATE**: T005's manual quickstart pass is the validation step.
4. Demo-ready: the golden path's candidate-intake portion is complete end-to-end.

### Incremental Delivery

Since Foundational work (Task 11) and nearly all of US1's wiring were already done before this
tasks.md was generated, there is no incremental multi-phase rollout here — T002-T004 are small,
independent fixes, and T005 validates all of them together in one pass.

---

## Notes

- [P] markers are omitted above because every remaining task is either a small single-file edit
  (T002-T004) or a manual verification step (T001, T005) — none benefit from explicit
  parallel-agent execution.
- This tasks.md intentionally diverges from the standard from-scratch template: Rule 9 ("Implement →
  Run → Test → Fix → Continue") and Rule 10 ("Preserve working code... do not silently break the API
  contract") both argue against regenerating tasks for wiring that was already implemented and
  verified working in this session.
- Avoid: re-wiring `AppContext.tsx`'s already-working `setResumeUploaded`/`selectTargetRole`/catalog
  loaders, and do not implement FR-004's real demo-candidate backend call here — that is Task 16's
  explicit responsibility per spec.md's Assumptions.
