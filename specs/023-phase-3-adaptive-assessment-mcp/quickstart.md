# Quickstart: Validating Phase 3

Re-run this session's already-verified assessment loop end to end and confirm identical behavior
to the pre-MCP baseline:

```bash
BASE=http://localhost:8000
DEMO=$(curl -s -X POST $BASE/candidates/demo)
CID=$(echo "$DEMO" | .venv/Scripts/python.exe -c "import json,sys; print(json.load(sys.stdin)['candidate_id'])")
curl -s -X POST $BASE/candidates/$CID/target-role -H "Content-Type: application/json" -d '{"role_id":"role-sso-01"}'
SID=$(curl -s -X POST $BASE/assessment/start -H "Content-Type: application/json" -d "{\"candidate_id\":\"$CID\",\"target_role_id\":\"role-sso-01\"}" | .venv/Scripts/python.exe -c "import json,sys; print(json.load(sys.stdin)['session_id'])")
curl -s $BASE/assessment/$SID/next-question
# expect: a question targeting one of role-sso-01's required competencies, "source" either
# "mistral" or "seed" — same shape as before this phase's change

.venv/Scripts/python.exe -m pytest backend/tests/test_assessment_engine.py -v
# expect: all pass, including the new MCP-failure-falls-back test
```
