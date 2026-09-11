# API Contract: Task 16 — Demo Implementation

## `POST /candidates/demo`

**Request**: none (no body required).

**Response 201**
```json
{
  "candidate_id": "demo-uuid",
  "source": "demo",
  "initial_profile": [
    { "competency_id": "sql", "competency_name": "SQL", "resume_estimated_level": 2.5, "resume_confidence": 0.62 },
    { "competency_id": "python", "competency_name": "Python", "resume_estimated_level": 3.2, "resume_confidence": 0.7 },
    { "competency_id": "statistics", "competency_name": "Statistics", "resume_estimated_level": 3.7, "resume_confidence": 0.75 }
  ]
}
```

Matches Task 4's `POST /candidates/resume` response shape exactly (`source: "demo"` in place of
`"resume_upload"`), so the frontend's downstream handling (Task 12+) needs no branching logic beyond the
entry screen — per spec FR-001/Rule 12.

## Quickstart

1. `curl -X POST http://localhost:8000/candidates/demo` on a cold backend (freshly restarted, no cached
   state) → expect HTTP 201 with the Demo Officer's initial profile.
2. Proceed through role selection → assessment (using the demo candidate's pre-scripted answer sequence)
   → verified profile, and confirm the verified SQL/Python/Statistics levels land close to
   `demo_plan.md` §3's illustrative gaps against a Senior Statistical Analyst target.
3. Confirm every number shown traces to this real run's engine output — none hand-typed into the UI.
