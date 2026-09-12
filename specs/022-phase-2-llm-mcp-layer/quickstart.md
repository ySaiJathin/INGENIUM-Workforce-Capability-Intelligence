# Quickstart: Validating Phase 2

```bash
.venv/Scripts/python.exe -m pytest backend/tests/test_mcp_tools.py -v
# expect: all pass — every tool's success case and not-found case covered

.venv/Scripts/python.exe -c "
from backend.src.mcp import tools
try:
    tools.get_candidate_profile(candidate_id='00000000-0000-0000-0000-000000000000')
except Exception as e:
    print(type(e).__name__, e)
"
# expect: a typed MCPToolError (reason='not_found'), not a raw SQLAlchemy/KeyError exception

grep -rn "execute(" backend/src/mcp/tools.py
# expect: zero raw SQL string execution — every call goes through SQLAlchemy's ORM/select(),
# confirming FR-003's "no arbitrary SQL" by inspection
```
