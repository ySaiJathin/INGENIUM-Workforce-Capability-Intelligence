# Quickstart: Validating Phase 1

```bash
# Detailed-evidence resume vs. bare-mention resume, same competency (SQL)
curl -s -X POST http://localhost:8000/candidates/resume -F "resume=@strong_sql_resume.docx"
curl -s -X POST http://localhost:8000/candidates/resume -F "resume=@bare_mention_resume.docx"
# expect: the strong-evidence resume's SQL confidence/evidence-strength >= the bare-mention one's
# (SC-001) — compare the two responses' initial_profile entries for competency_id "sql"

# Unmapped-term resume (mentions a real skill not in the competency framework)
curl -s -X POST http://localhost:8000/candidates/resume -F "resume=@resume_with_niche_tool.docx"
# expect: 201, and the niche tool does not silently vanish nor get mapped to an unrelated
# competency (SC-002) — inspect via backend logs (unmapped_terms is logged, not returned in the
# API response per candidates.py's current design; confirm the log line appears)

.venv/Scripts/python.exe -m pytest backend/tests/test_competency_mapping.py -v
# expect: all pass, confirming deterministic-layer output is stable across repeated runs (SC-004)
```
