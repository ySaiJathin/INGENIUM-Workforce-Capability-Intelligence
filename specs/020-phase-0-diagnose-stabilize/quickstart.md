# Quickstart: Validating Phase 0

```bash
docker ps --filter name=competency-postgres --format "{{.Names}}: {{.Status}}"
# expect: Up ... (healthy)

curl -s http://localhost:8000/health
# expect: {"status":"ok","database":"connected","detail":null}

curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:8000/candidates/resume \
  -F "resume=@<some .txt file>"
# expect: 400 (unsupported type) — confirms FR-002

curl -s -X POST http://localhost:8000/candidates/demo
# expect: 201 with a populated initial_profile — confirms the demo-candidate entry point works
# end to end (SC-001's "under 1 minute, no manual DB/terminal step" check)
```

Then confirm whichever deployment path was chosen in `plan.md`'s Research Decision returns the
same current-source behavior as a fresh `uvicorn` run (compare `candidates.py`'s actual behavior
via `docker exec <container> python -c "import inspect; from backend.src.api import candidates;
print(inspect.getsource(candidates.upload_resume))"` against the checked-in file, if a Docker path
is used going forward) — this is the specific check that catches the stale-container class of
defect this session already found once.
