#!/usr/bin/env python3
"""
Task 0 — Environment & Repository Setup verification script.

Implements specs/001-task-0-environment-setup/spec.md FR-001..FR-008:
  - Verifies Python, Node, npm, PostgreSQL, Git are installed and reports each version.
  - Verifies .env exists with a non-empty MISTRAL_API_KEY, without ever printing the value.
  - Verifies models/all-MiniLM-L6-v2/ and the four active ESCO files exist on disk
    (never attempts to download anything — CLAUDE.md Rule 7).
  - Creates .env from .env.example if .env is missing; never overwrites an existing .env.
  - Reports one itemized pass/fail line per check (FR-007) instead of a single opaque result,
    so a failure points directly at what to fix.

Run with the project's own interpreter, e.g.:
    .venv/Scripts/python.exe scripts/verify_env.py   (Windows)
    .venv/bin/python scripts/verify_env.py            (POSIX)
"""

from __future__ import annotations

import shutil
import socket
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent.parent

# Windows consoles often default to a legacy codepage (e.g. cp1252) that can't encode the
# em dashes used in this script's messages; force UTF-8 output so nothing renders as mojibake.
if sys.platform == "win32":
    for _stream in (sys.stdout, sys.stderr):
        try:
            _stream.reconfigure(encoding="utf-8")
        except Exception:
            pass

REQUIRED_ESCO_FILES = [
    "occupations_en.csv",
    "skills_en.csv",
    "occupationSkillRelations_en.csv",
    "skillsHierarchy_en.csv",
]


@dataclass
class CheckResult:
    name: str
    passed: bool
    detail: str


results: list[CheckResult] = []


def record(name: str, passed: bool, detail: str) -> None:
    results.append(CheckResult(name, passed, detail))


def run_version_check(name: str, cmd: list[str], min_hint: str) -> None:
    exe = shutil.which(cmd[0])
    if exe is None:
        record(name, False, f"not found on PATH (need {min_hint})")
        return
    # On Windows, npm/node etc. often resolve to a .CMD/.BAT shim that subprocess can only
    # invoke through the shell — without this, a present-and-working tool reports a false FAIL.
    use_shell = sys.platform == "win32" and exe.lower().endswith((".cmd", ".bat"))
    try:
        out = subprocess.run(cmd, capture_output=True, text=True, timeout=10, shell=use_shell)
        version = (out.stdout or out.stderr).strip().splitlines()[0] if (out.stdout or out.stderr) else "unknown version"
        record(name, True, version)
    except Exception as exc:  # pragma: no cover - defensive, reported not swallowed
        record(name, False, f"found at {exe} but failed to run: {exc}")


def check_python() -> None:
    v = sys.version_info
    ok = (v.major, v.minor) >= (3, 11)
    record("Python", ok, f"{sys.version.split()[0]} (need 3.11+)")


def check_node() -> None:
    run_version_check("Node.js", ["node", "--version"], "a current LTS")


def check_npm() -> None:
    run_version_check("npm", ["npm", "--version"], "bundled with Node")


def check_git() -> None:
    run_version_check("Git", ["git", "--version"], "any recent version")


def check_postgres() -> None:
    """
    What actually matters for Task 1+ is a reachable PostgreSQL server — whether that comes from
    a native install or a Docker container (this project runs it via docker-compose.yml) makes no
    difference. So reachability (TCP connect to DATABASE_URL's host:port) is the authoritative
    check; the native psql CLI is reported separately as an optional convenience tool, never as a
    blocker (spec Edge Cases: distinguish "not installed" from "installed but not reachable").
    """
    db_url = _read_env_value("DATABASE_URL")
    if not db_url:
        record("PostgreSQL (reachability)", False, "DATABASE_URL not set in .env — cannot test connectivity")
    else:
        parsed = urlparse(db_url)
        host = parsed.hostname or "localhost"
        port = parsed.port or 5432
        try:
            with socket.create_connection((host, port), timeout=3):
                record("PostgreSQL (reachability)", True, f"reachable at {host}:{port}")
        except OSError as exc:
            record(
                "PostgreSQL (reachability)",
                False,
                f"not reachable at {host}:{port} ({exc}) — start it, e.g. `docker compose up -d`",
            )

    exe = shutil.which("psql")
    if exe is None:
        record("PostgreSQL client (psql, optional)", True, "not on PATH — fine, backend uses psycopg directly")
    else:
        run_version_check("PostgreSQL client (psql, optional)", ["psql", "--version"], "any recent version")


def _read_env_value(key: str) -> str | None:
    env_path = ROOT / ".env"
    if not env_path.exists():
        return None
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, _, v = line.partition("=")
        if k.strip() == key:
            return v.strip() or None
    return None


def check_env_file() -> None:
    env_path = ROOT / ".env"
    example_path = ROOT / ".env.example"

    if not env_path.exists():
        if not example_path.exists():
            record(".env", False, ".env missing and .env.example also missing — cannot bootstrap")
            return
        # FR-008: never overwrite an existing .env — this branch only runs when .env is absent.
        shutil.copyfile(example_path, env_path)
        record(".env", True, "did not exist — created from .env.example (fill in real values before Task 4)")
    else:
        record(".env", True, "already exists — left untouched (FR-008)")

    key = _read_env_value("MISTRAL_API_KEY")
    is_placeholder = key in (None, "", "your_mistral_api_key_here")
    # Never print the key's value (FR-002/SC-003) — only whether it's present/non-placeholder.
    record(
        "MISTRAL_API_KEY",
        not is_placeholder,
        "present (value not shown)" if not is_placeholder else "missing or still a placeholder — set a real key before Task 4",
    )


def check_minilm_model() -> None:
    model_dir = ROOT / "models" / "all-MiniLM-L6-v2"
    ok = model_dir.is_dir() and any(model_dir.iterdir())
    record(
        "MiniLM model (models/all-MiniLM-L6-v2/)",
        ok,
        "present" if ok else "missing — do not download; see CLAUDE.md Rule 7",
    )


def check_esco_files() -> None:
    esco_dir = ROOT / "data" / "raw" / "esco"
    missing = [f for f in REQUIRED_ESCO_FILES if not (esco_dir / f).is_file()]
    ok = esco_dir.is_dir() and not missing
    if not esco_dir.is_dir():
        record("ESCO files (data/raw/esco/)", False, "directory missing")
    elif missing:
        record("ESCO files (data/raw/esco/)", False, f"missing: {', '.join(missing)}")
    else:
        record("ESCO files (data/raw/esco/)", True, f"all {len(REQUIRED_ESCO_FILES)} active files present")


def main() -> int:
    check_python()
    check_node()
    check_npm()
    check_git()
    check_env_file()  # must run before check_postgres() so DATABASE_URL is available
    check_postgres()
    check_minilm_model()
    check_esco_files()

    print("\nTask 0 - Environment Verification\n" + "=" * 40)
    all_ok = True
    for r in results:
        status = "PASS" if r.passed else "FAIL"
        if not r.passed:
            all_ok = False
        print(f"[{status}] {r.name}: {r.detail}")

    print("=" * 40)
    if all_ok:
        print("All checks passed — ready for Task 1.")
    else:
        print("One or more checks failed — fix the items above before starting Task 1.")
    return 0 if all_ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
