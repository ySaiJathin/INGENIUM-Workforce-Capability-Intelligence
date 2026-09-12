# Quickstart: Validating Phase 7

## Clean-start, both entry points (FR-001/FR-002/SC-001)

```bash
# restart backend + confirm DB reachable, then:
curl -s -X POST http://localhost:8000/candidates/demo            # entry point 1
curl -s -X POST http://localhost:8000/candidates/resume -F "resume=@real.pdf"   # entry point 2
# both should reach: target-role -> assessment -> profile -> analysis -> gaps -> courses ->
# learning-path, per this session's already-verified curl sequence
```

## Failure-condition matrix (FR-003/SC-002) — run each independently, confirm a clear error and no crash

| # | Condition | How to trigger | Expected |
|---|---|---|---|
| 1 | Invalid resume type | `curl -F "resume=@x.txt"` | 400, clear message |
| 2 | Empty resume | upload a 0-byte PDF | 422, "Try Demo Candidate" |
| 3 | Corrupt resume | upload a renamed non-PDF as `.pdf` | 422, "Try Demo Candidate" |
| 4 | LLM unavailable | invalid `MISTRAL_API_KEY` or blocked network | assessment/resume paths fall back to seed/deterministic, no crash |
| 5 | Malformed LLM output | (already observed via rate-limit path this session) | retry then fallback, no crash |
| 6 | Unknown role id | `POST /candidates/{id}/target-role {"role_id":"nope"}` | 404 |
| 7 | Unknown candidate id | `POST /candidates/{bad-uuid}/target-role` | 404 |
| 8 | Unknown/expired session | `GET /assessment/{bad-uuid}/next-question` | 404 |
| 9 | Unavailable course data | temporarily point course query at empty table (test env only) | `unmatched_gaps` populated, not an error |
| 10 | Unavailable evidence retrieval | rename `data/index/evidence.faiss` temporarily | learning-path falls back, `grounding: null` |
| 11 | DB temporarily unreachable | stop the Postgres container briefly, retry a request | clear 5xx-with-message or bounded-timeout error, not a hang |

## Repeatability (FR-004/SC-003)

Run both entry points twice each, back-to-back, from fresh sessions (new candidate each time) —
confirm no state conflict (each demo-candidate call already creates a fresh row per
`candidates.py`'s design, confirmed this session).
