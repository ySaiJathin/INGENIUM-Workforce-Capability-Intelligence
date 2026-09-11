# demo_plan.md

## Competency Intelligence MVP — Judge-Facing Demo Plan

This document does not describe the development architecture (see `build_plan.md` for that). It describes how to turn the working application into a judge-facing demonstration, once the golden path works end-to-end (`build_plan.md` §23, Task 16).

---

## 1. Demo Objective

Make a judge understand, without reading any code, that this product turns an unverified claim ("I know SQL") into a verified, evidence-backed competency state, compares it to a real role's requirements, and produces a specific, explainable learning path — in under two minutes of screen time.

---

## 2. Judge Story

> "This candidate's resume tells us what they claim to know. We don't blindly trust that. We assess their actual competency. The assessment adapts to their answers. We then compare their verified competency state against the target role. Finally, we recommend learning resources that close the specific gaps."

The judge should understand this narrative from the screens alone, without narration of the source code.

---

## 3. Demo Candidate

One polished, realistic candidate profile, pre-seeded for "Try Demo Candidate":

```
Name:            Demo Officer
Current role:    Statistical Analyst
Experience:      3 years
Target role:     Senior Statistical Analyst
```

Initial (resume-derived) profile:
```
SQL          2.5 / 5
Python       3.2 / 5
Statistics   3.7 / 5
```

Verified (post-assessment) profile — illustrative, adjust to match whatever the deterministic scoring engine actually produces:
```
SQL          3.1 / 5    Required 4.0    Gap 0.9
Python       3.4 / 5    Required 4.0    Gap 0.6
Statistics   3.8 / 5    Required 4.0    Gap 0.2
```

Do not hand-fake these numbers in the UI — seed the demo candidate's resume text and assessment answers so the real deterministic engine produces numbers close to these, and let the engine compute them for real.

---

## 4. Resume Upload Flow

Show the real upload once (PDF or DOCX) to prove the pipeline is real, then use "Try Demo Candidate" for the rehearsed run. Upload → extract → Mistral structured extraction → initial profile, with a visible "Initial estimate" label the whole time.

---

## 5. Target Role

Candidate selects a target role from the curated `roles.json` list (5–8 roles). For the rehearsed demo, pick "Senior Statistical Analyst" (or whichever curated role best matches the demo candidate's strengths and gaps) so the requirements screen reads naturally against the candidate's profile.

---

## 6. Initial Profile

Screen shows the resume-derived estimate with an explicit confidence value and an "Initial estimate — not yet verified" label. This is the "before" half of the before/after story (`MVP_CONTEXT.md` §6).

---

## 7. Adaptive Assessment

The assessment UI must make adaptivity visible, not just claim it. Example flow to script for the demo candidate:

```
Question 1  SQL basics                → Correct
Question 2  JOINs                     → Correct
Question 3  Advanced aggregation      → Incorrect
Question 4  JOIN reasoning            → Correct
Question 5  Window Functions          → probing based on prior answers
```

Show on-screen messaging such as: *"Probing Window Functions based on your previous responses."* This single moment — the assessment visibly reacting to an answer — is an important judging moment; do not let it pass silently.

Use 8–12 questions total for the scripted run so the assessment doesn't overstay its welcome on stage.

---

## 8. Verified Skill Profile

Show the "after" half of the transformation immediately after the assessment:
```
Verified Competency Profile
SQL          3.1 / 5      Python   3.4 / 5      Statistics   3.8 / 5
Confidence   89%

Strong        ✓ SELECT  ✓ Aggregation
Needs work    ⚠ CTEs  ⚠ Window Functions  ⚠ Query Optimization
```
Put the initial estimate and the verified profile close enough on screen (or in sequence) that the before/after is unmistakable — this transformation is the heart of the demo (§9 below, `MVP_CONTEXT.md` §6).

---

## 9. Gap Analysis

```
Target Role: Senior Statistical Analyst

Competency     Current   Required   Gap
SQL              3.1       4.0      0.9
Python            3.4       4.0      0.6
Statistics        3.8       4.0      0.2
```
Every number carries context — never a bare percentage. Rank gaps by magnitude so SQL leads.

---

## 10. Course Recommendations

For the leading gap, show the explanation, not just the match:
```
Gap: Window Functions
Recommended: Advanced SQL Analytics
Because it covers: ✓ Window Functions  ✓ CTEs
```
This is the second most important judging moment after adaptivity — the recommendation must visibly trace back to a specific gap, not appear as a generic suggestion.

---

## 11. Personalized Learning Path

```
01  Advanced SQL Analytics
    Closes: ✓ CTEs  ✓ Window Functions
    Priority: HIGH
    Estimated effort: 6 hours

02  SQL Performance Optimization
    Closes: ✓ Query Optimization
    Priority: MEDIUM
    Estimated effort: 4 hours
```
Ordering is deterministic (gap severity, role priority, prerequisites, duration) — see `build_plan.md` §12.

---

## 12. "Try Demo Candidate" Fallback

Must exist as a single, prominent action on the landing screen and must enter the exact same downstream pipeline as a real resume upload (target role → assessment → verified profile → gaps → courses → learning path). This is required, not optional — see `build_plan.md` §13 and `CLAUDE.md` Rule 12.

---

## 13. Failure Recovery

Rehearse what happens, and what you say, if each of these occurs mid-demo:

```
Mistral is slow/unavailable   → assessment falls back to assessment_seed.json questions;
                                 say "the assessment always has a question bank ready" and continue
Resume parsing fails          → show the friendly error, click "Try Demo Candidate", continue
Wi-Fi/network drops           → switch immediately to "Try Demo Candidate" path, which should
                                 need the least network dependency
Database hiccup               → reload once; if it recurs, narrate the architecture from the
                                 gap/course screens already captured in a screenshot as backup
```
Keep one static screenshot set (initial profile, verified profile, gap analysis, learning path) as an absolute last-resort fallback if live software fails entirely.

---

## 14. Demo Script

1. Open landing screen — 10s: state the one-sentence product definition (`MVP_CONTEXT.md` §1).
2. Click "Try Demo Candidate" (or do one live resume upload if confident) — 10s.
3. Show initial profile, call out "Initial estimate" label — 15s.
4. Select target role — 10s.
5. Start assessment, answer 3–4 questions live, narrate one adaptive moment — 40s.
6. Jump to verified profile, put it next to the initial estimate — 20s.
7. Show gap analysis, point at the top gap — 15s.
8. Show course recommendation for that gap, read the "because it covers" line — 15s.
9. Show the learning path — 10s.
10. Close with the judge story (§2) restated in one sentence — 5s.

Target total: ~2:30, trimmable to 2:00 by cutting steps 3 and 9 if needed.

---

## 15. 2-Minute Judge Walkthrough (trimmed version)

```
0:00–0:15   Landing + one-line product pitch
0:15–0:25   Try Demo Candidate → initial profile (flash "initial estimate")
0:25–1:05   Assessment — 3 questions, one adaptive callout
1:05–1:25   Verified profile next to initial estimate (the "wow" beat)
1:25–1:45   Gap analysis → top gap
1:45–2:00   Course recommendation with "because it covers" + close on the judge story
```

---

## 16. Demo Rehearsal Checklist

```
[ ] Full run completed at least twice back-to-back without a crash
[ ] "Try Demo Candidate" tested on a cold reload (no cached state)
[ ] Real resume upload tested once with an actual PDF/DOCX
[ ] Mistral-unavailable fallback tested (kill network or invalid API key, confirm seed
    questions still work and nothing crashes)
[ ] Screenshot fallback set captured and accessible offline
[ ] Every screen checked for loading/empty/error states — nothing renders blank
[ ] Numbers on gap/profile screens double-checked against the deterministic engine's
    actual output (no hand-typed fake numbers left in the UI)
[ ] Script timed at least once at full talking speed, under 2:30
[ ] Backup device/browser tab pre-loaded in case of a projector/Wi-Fi issue
```
