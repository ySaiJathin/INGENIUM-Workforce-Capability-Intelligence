# Quickstart: Validating Phase 4

```bash
grep -rn "kaggle\|job_posting\|job_demand" backend/src/services/gap_engine.py backend/src/models/
# expect: zero matches — confirms SC-003 (no retired-dataset reference)

.venv/Scripts/python.exe -m pytest backend/tests/test_gap_engine.py -v
# expect: all pass, including a determinism test that calls rank_gaps() twice on identical input
# and asserts byte-identical output (SC-002)

# Live re-check (reuses this session's already-completed analysis):
curl -s http://localhost:8000/analysis/<analysis_id>/gaps
curl -s http://localhost:8000/analysis/<analysis_id>/gaps
# expect: byte-identical responses
```
