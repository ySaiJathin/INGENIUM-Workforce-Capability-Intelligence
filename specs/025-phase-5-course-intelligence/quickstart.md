# Quickstart: Validating Phase 5

```bash
.venv/Scripts/python.exe -m pytest backend/tests/test_course_recommendation_engine.py -v
# expect: all pass, including the exact-beats-semantic scenario (FR-004/SC-003)

curl -s http://localhost:8000/analysis/<analysis_id>/courses
# expect: every recommendation's matched_gaps + match_reason populated (SC-001); zero duplicate
# course_id entries in the recommendations list (SC-004)
```
