"""Generates additional selectable "Try Demo Candidate" profiles from real resume files under
data/resumes/, for use when Mistral is unavailable (rate-limited/quota-exhausted/no key).

This is a DETERMINISTIC, keyword-based fallback extractor — not a substitute for the real
Mistral-driven /candidates/resume pipeline (Rule 6: Mistral, not this script, owns skill
extraction in production). It exists only to populate demo/dummy data for local development and
presentation when the LLM layer is down, exactly the kind of controlled, explainable fallback
Rule 10 calls for. Every profile it writes is clearly demo data (CLAUDE.md's "must be clearly
identifiable as demo data" rule): candidates are labeled generically in the UI, never under the
real resume owners' names, and each entry records its source filename for traceability.

Matching approach (intentionally simple — Hackathon Principle):
  - For each competency, look for a short list of hand-picked keyword aliases (exact competency
    name plus a few common synonyms/tools) as case-insensitive substrings.
  - A line mentioning an alias inside a flat "Skills:"/"Languages:"/"Technologies:" list, with no
    narrative verb, counts as weak (LOW-confidence) evidence.
  - A line mentioning an alias alongside a narrative verb ("developed", "built", "used", etc.) —
    i.e., inside a project/experience description — counts as stronger evidence; two or more such
    lines for the same competency count as HIGH confidence.
  - A competency with zero matches is left out of the profile entirely (Rule 4: discard rather
    than guess wrong) — this script never invents evidence for a skill the resume doesn't mention.

Usage: .venv/Scripts/python.exe backend/src/scripts/build_demo_candidates_from_resumes.py
Writes: data/curated/demo_candidates.json (the original single demo_candidate.json's content is
preserved as this list's first, unchanged entry, so the existing rehearsed "Try Demo Candidate
(Ananya Sharma)" flow is untouched).
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent.parent
sys.path.insert(0, str(ROOT))

from backend.src.services.resume_extraction import PDF_MIME_TYPE, extract_text  # noqa: E402

RESUMES_DIR = ROOT / "data" / "resumes"
CURATED_DIR = ROOT / "data" / "curated"
COMPETENCIES_PATH = CURATED_DIR / "competencies.json"
ORIGINAL_DEMO_PATH = CURATED_DIR / "demo_candidate.json"
OUTPUT_PATH = CURATED_DIR / "demo_candidates.json"

NARRATIVE_VERBS = re.compile(
    r"\b(developed|built|design(?:ed)?|implement(?:ed)?|us(?:ed|ing)|appli(?:ed|es)|worked|"
    r"creat(?:ed|ing)|integrat(?:ed|ing)|convert(?:ed|ing)|produc(?:ed|ing)|wrote|manag(?:ed|ing)|"
    r"visuali[sz](?:ed|e|ing)|evaluat(?:ed|ing)|analy[sz](?:ed|ing)|preprocess(?:ing)?|"
    r"clean(?:ed|ing)?|generat(?:ed|ing)|recommend(?:ed|ing))\b",
    re.IGNORECASE,
)
LIST_LABEL = re.compile(
    r"^(languages?|frameworks?|databases?|dev tools?|technical skills|tools?|skills?|technologies|"
    r"ai\s*/\s*ml|cloud)\s*:", re.IGNORECASE,
)

# Hand-picked aliases per competency id (word/substring matches, case-insensitive). Competencies
# not listed here are simply never matched by this script — intentional (Rule 4).
COMPETENCY_ALIASES: dict[str, list[str]] = {
    "sql": ["sql"],
    "python": ["python"],
    "python_data_manipulation": ["pandas", "numpy"],
    "machine_learning": ["machine learning", "scikit-learn", "scikit learn"],
    "supervised_learning": ["classification", "customer segmentation"],
    "data_visualization": [
        "matplotlib", "seaborn", "plotly", "power bi", "tableau",
        "visualize", "visualization", "visualisation", "visualizing", "visualising",
    ],
    "dashboard_design": ["dashboard"],
    "database_management": ["mysql", "mongodb", "postgresql", "oracle sql", "snowflake"],
    "data_quality_cleaning": ["preprocessing", "data cleaning", "clean and merge", "data quality"],
    "regression_analysis": ["regression"],
    "data_governance_ethics": ["data governance", "data ethics"],
    "stakeholder_communication": ["stakeholder"],
    "statistical_report_writing": ["report writing"],
}


def _clean_snippet(text: str) -> str:
    """Cosmetic cleanup only — never changes which lines match, only how a matched line reads
    once it's shown as an "evidence snippet" in the UI. PDF text extraction often carries decorative
    bullet glyphs (U+2022) and non-breaking spaces (U+00A0) verbatim; a raw skills line like
    "Java\\xa0•\\xa0Python\\xa0•\\xa0SQL" reads as noise rather than a sentence, so bullets become a
    plain comma separator and non-breaking spaces become ordinary ones."""
    cleaned = text.replace(" ", " ").replace("•", ",")
    cleaned = re.sub(r"\s*,\s*", ", ", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned).strip(" ,")
    return cleaned


def _alias_hits(line: str, aliases: list[str]) -> bool:
    """Word-boundary match, not plain substring — otherwise a bare "sql" alias would falsely
    fire on "MySQL"/"PostgreSQL"/"NoSQL" (each already has its own distinct alias entry)."""
    lowered = line.lower()
    return any(re.search(r"\b" + re.escape(alias) + r"\b", lowered) for alias in aliases)


def _is_list_line(line: str) -> bool:
    stripped = line.strip()
    if LIST_LABEL.match(stripped):
        return True
    # A short, comma/pipe-delimited line with no narrative verb reads as a flat skills list.
    return bool(
        len(stripped.split()) <= 12
        and ("," in stripped or "|" in stripped or ":" in stripped)
        and not NARRATIVE_VERBS.search(stripped)
    )


def extract_profile(text: str, competencies_by_id: dict[str, str]) -> list[dict]:
    lines = [ln for ln in text.splitlines() if ln.strip()]
    profile: list[dict] = []

    for competency_id, aliases in COMPETENCY_ALIASES.items():
        if competency_id not in competencies_by_id:
            continue  # curated competency list changed since this script was written

        narrative_hits: list[str] = []
        list_hits: list[str] = []
        for line in lines:
            if not _alias_hits(line, aliases):
                continue
            if _is_list_line(line) and not NARRATIVE_VERBS.search(line):
                list_hits.append(line.strip())
            else:
                narrative_hits.append(line.strip())

        if len(narrative_hits) >= 2:
            level, confidence = 3.4, "HIGH"
            snippet = narrative_hits[0]
        elif len(narrative_hits) == 1:
            level, confidence = 2.6, "MEDIUM"
            snippet = narrative_hits[0]
        elif list_hits:
            level, confidence = 1.8, "LOW"
            snippet = list_hits[0]
        else:
            continue  # no evidence at all — correctly omitted, not guessed

        profile.append(
            {
                "competency_id": competency_id,
                "competency_name": competencies_by_id[competency_id],
                "resume_estimated_level": level,
                "resume_confidence": confidence,
                "evidence_snippet": _clean_snippet(snippet)[:200],
            }
        )

    return profile


def main() -> None:
    competencies = json.loads(COMPETENCIES_PATH.read_text(encoding="utf-8"))
    competencies_by_id = {c["id"]: c["name"] for c in competencies}

    # Preserve the existing, already-rehearsed single demo candidate as entry 0, unchanged shape,
    # just wrapped with an id/label/source so the list format is uniform.
    original = json.loads(ORIGINAL_DEMO_PATH.read_text(encoding="utf-8"))
    entries: list[dict] = [
        {
            "id": "ananya-sharma",
            "label": "Try Demo Candidate (Ananya Sharma)",
            "source": "curated (original Task 16 rehearsed demo — see demo_plan.md)",
            "target_role_id": original["target_role_id"],
            "initial_profile": original["initial_profile"],
        }
    ]

    # Target-role guesses below are a reasonable default per resume's dominant skill area, not a
    # claim about the real resume owner's career goals — the candidate can pick any role in the
    # app regardless of this default (this field only pre-selects nothing; the frontend still asks).
    resume_configs = [
        ("KAMALESH_RESUME_Aug.pdf", "demo-candidate-b", "Try Demo Candidate (Full-Stack Profile)", "role-sp-04"),
        ("Resume-KETHARNATH-RAMU-Sony-Research-India.pdf", "demo-candidate-c",
         "Try Demo Candidate (Data Analyst Profile)", "role-da-02"),
        ("Resume_V2.3.pdf", "demo-candidate-d", "Try Demo Candidate (Data Scientist Profile)", "role-ds-03"),
    ]

    for filename, cand_id, label, target_role_id in resume_configs:
        path = RESUMES_DIR / filename
        if not path.exists():
            print(f"WARNING: {path} not found, skipping")
            continue
        file_bytes = path.read_bytes()
        text = extract_text(file_bytes, PDF_MIME_TYPE)
        profile = extract_profile(text, competencies_by_id)
        entries.append(
            {
                "id": cand_id,
                "label": label,
                "source": f"deterministic keyword extraction from data/resumes/{filename} "
                          f"(Mistral unavailable at generation time — see this script's docstring)",
                "target_role_id": target_role_id,
                "initial_profile": profile,
            }
        )
        print(f"{filename}: {len(profile)} competencies matched -> {[p['competency_id'] for p in profile]}")

    OUTPUT_PATH.write_text(json.dumps(entries, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\nWrote {len(entries)} demo candidate profiles to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
