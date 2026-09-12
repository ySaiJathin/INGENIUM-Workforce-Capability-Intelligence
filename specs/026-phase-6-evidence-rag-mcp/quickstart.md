# Quickstart: Validating Phase 6

```bash
.venv/Scripts/python.exe backend/src/scripts/build_evidence_index.py
# expect: prints an indexed-item count matching competencies + roles + courses (+ any ESCO slice);
# creates data/index/evidence.faiss and data/index/evidence_meta.json

.venv/Scripts/python.exe -m pytest backend/tests/test_evidence_engine.py backend/tests/test_learning_plan_planner.py -v
# expect: all pass, including a test that a fabricated/unsupported claim is stripped by the
# grounding validator (SC-001)

curl -s -X POST http://localhost:8000/learning-path -H "Content-Type: application/json" \
  -d '{"analysis_id":"<analysis_id>"}'
# expect: response includes a new "grounding" field — non-null (grounded:true, removed_claims
# small/empty) when the RAG path succeeds, or null (deterministic fallback, FR-007) when Mistral
# or the evidence index is unavailable; step ordering must match the already-verified
# gap/course-ranking order from Phases 4-5 exactly (SC-004)
```
