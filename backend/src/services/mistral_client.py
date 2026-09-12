"""
Thin Mistral API wrapper (Task 4 — Resume Processing, reused by Task 6 — Adaptive Assessment).

Implements Rule 5: every response is schema-validated before use; on validation/timeout failure,
retry once; if the retry also fails, raise (never fall back to hand-fabricated data, never swallow
the error) — the caller decides what "graceful failure" looks like for its own endpoint (Task 4:
422 pointing to "Try Demo Candidate"; Task 6: seed-question fallback).

Follows total_buildplan.md §7.3/§7.4's "one service owns every Mistral call" rule and §27.1's
BASE_RULES + operation-specific prompt pattern.

Phase 2 (specs/022-phase-2-llm-mcp-layer) note: retry ownership lives exactly here, in this
module's own attempt loops, and nowhere else — the MCP tool layer (backend/src/mcp/) never adds a
second retry around a call into this module, which would silently double the number of attempts
(and worst-case latency) on a slow-but-eventually-successful call.

SDK note: the installed `mistralai` 2.x package's client lives at `mistralai.client.Mistral`, not
`mistralai.Mistral` as some older docs suggest — confirmed against the installed package directly.
"""

from __future__ import annotations

import json
import logging
import os

from mistralai.client import Mistral
from mistralai.client.models.responseformat import ResponseFormat
from pydantic import ValidationError

from backend.src.models import Competency
from backend.src.schemas.assessment import AdaptiveQuestionResponse
from backend.src.schemas.candidates import ResumeExtractionResponse

logger = logging.getLogger(__name__)

_MODEL = "mistral-small-latest"

# total_buildplan.md §27.1 — prepended to every operation-specific prompt, never a substitute for one.
BASE_RULES = (
    "You are the AI intelligence layer of Ingenium — Workforce Capability Intelligence. "
    "Provide structured, evidence-based intelligence. Return valid JSON only. Never fabricate "
    "information. Use supplied competency IDs and names. Treat resume information as initial "
    "evidence, not verified capability. Do not make final competency scores. Do not make final "
    "role-readiness decisions. Do not calculate final skill gaps. Do not independently determine "
    "final course rankings. The deterministic backend owns final business logic. Follow the "
    "operation-specific schema exactly."
)

# total_buildplan.md §27.2 — Operation A system prompt.
_RESUME_EXTRACTION_PROMPT = (
    "You are currently performing: RESUME_EXTRACTION. Extract professional experience and "
    "competency evidence from the supplied resume. Return JSON only. Never fabricate information. "
    "Use only supplied competency IDs/names. Resume evidence is INITIAL EVIDENCE, not verified "
    "capability. Be conservative when estimating proficiency. Do not calculate final competency "
    "scores, role readiness, or skill gaps. Return exactly this schema: "
    '{"candidate": {"name": null, "designation": null, "organization": null, '
    '"years_experience": null}, "education": [], "certifications": [], "experience": [], '
    '"competency_evidence": [{"competency_id": null, "competency_name": "", "evidence": "", '
    '"source": "resume", "status": "initial_evidence", '
    '"evidence_strength": "VERY_WEAK|WEAK|MODERATE|STRONG|VERY_STRONG", '
    '"estimated_level_range": {"min": 1, "max": 4}, "confidence": "LOW|MEDIUM|HIGH", '
    '"reasoning": ""}], "unmapped_terms": [], "overall_confidence": "LOW|MEDIUM|HIGH"}. '
    "A resume term that can't be confidently mapped to a supplied competency ID goes into "
    "unmapped_terms with a null competency_id on its evidence entry — never invent an ID."
)


class MistralExtractionError(RuntimeError):
    """Raised when Mistral extraction fails validation/timeout even after one retry."""


class MistralQuestionGenerationError(RuntimeError):
    """Raised when Mistral question generation fails validation/timeout even after one retry."""


def _client() -> Mistral:
    api_key = os.environ.get("MISTRAL_API_KEY")
    if not api_key or api_key == "your_mistral_api_key_here":
        raise MistralExtractionError("MISTRAL_API_KEY is not configured")
    return Mistral(api_key=api_key)


def _call_once(resume_text: str, competencies: list[Competency]) -> ResumeExtractionResponse:
    client = _client()

    # §27.2's "Input" list: candidate_id/resume text/relevant competency framework slice — never
    # the whole product spec or database (§7.2). 34 competencies is a small, bounded payload.
    competency_framework = [
        {"id": c.id, "name": c.name, "definition": c.description} for c in competencies
    ]
    user_payload = {
        "operation": "RESUME_EXTRACTION",
        "resume_text": resume_text[:8000],
        "competency_framework": competency_framework,
    }

    response = client.chat.complete(
        model=_MODEL,
        messages=[
            {"role": "system", "content": f"{BASE_RULES}\n\n{_RESUME_EXTRACTION_PROMPT}"},
            {"role": "user", "content": json.dumps(user_payload)},
        ],
        response_format=ResponseFormat(type="json_object"),
        max_tokens=3000,
        timeout_ms=15000,
    )
    raw = response.choices[0].message.content
    parsed = json.loads(raw)
    return ResumeExtractionResponse.model_validate(parsed)


def extract_resume_skills(
    resume_text: str, competencies: list[Competency]
) -> ResumeExtractionResponse:
    """FR-005/FR-006: schema-validate, retry once on any failure, then raise for the caller to
    turn into a graceful HTTP error (never crash the process, never fabricate a fallback here)."""
    last_error: Exception | None = None
    for attempt in (1, 2):
        try:
            return _call_once(resume_text, competencies)
        except (json.JSONDecodeError, ValidationError, TypeError, KeyError) as exc:
            last_error = exc
            logger.warning("Mistral extraction attempt %d failed schema validation: %s", attempt, exc)
        except Exception as exc:  # network/timeout/API errors — logged, not swallowed
            last_error = exc
            logger.warning("Mistral extraction attempt %d failed: %s", attempt, exc)

    raise MistralExtractionError(
        f"Mistral resume extraction failed after 2 attempts: {last_error}"
    ) from last_error


# total_buildplan.md §27.4 — Operation C system prompt.
_QUESTION_GENERATION_PROMPT = (
    "You are currently performing: ADAPTIVE_QUESTION_GENERATION. Generate one professional "
    "assessment question based on the supplied competency, target role, estimated level, and "
    "assessment history. Return JSON only. Test the specified competency. Do not repeat previous "
    "questions. Increase difficulty when appropriate. Probe fundamentals when the candidate "
    "struggles. Prefer realistic professional/statistical scenarios (administrative datasets, "
    "survey data, official statistics, data quality, SQL, Python, statistical methods, data "
    "visualization, GIS, data validation, reporting). Make MCQs objectively scorable with exactly "
    "one correct answer. Do not determine the final competency score. Return exactly this schema: "
    '{"question_id": "", "competency_id": "", "competency_name": "", "difficulty_level": 1, '
    '"question_type": "MCQ", "question": "", "options": ["", "", "", ""], "correct_answer": "", '
    '"explanation": "", "assessment_signal": ""}. correct_answer must be the exact text of one of '
    "the options. competency_id must be exactly one of the supplied competency framework ids."
)


def _call_generate_question_once(
    target_competency: Competency,
    difficulty_level: int,
    current_estimated_level: float,
    required_level: float,
    previous_questions: list[str],
) -> AdaptiveQuestionResponse:
    client = _client()

    # §27.4's Input list: candidate_id, target role, target competency, current estimated level,
    # required role level, previous questions/answers, assessment progress — never the whole
    # candidate profile or database (§7.2).
    user_payload = {
        "operation": "ADAPTIVE_QUESTION_GENERATION",
        "competency_framework": [
            {"id": target_competency.id, "name": target_competency.name, "definition": target_competency.description}
        ],
        "target_competency_id": target_competency.id,
        "difficulty_level": difficulty_level,
        "current_estimated_level": current_estimated_level,
        "required_level": required_level,
        "previous_questions_in_session": previous_questions,
    }

    response = client.chat.complete(
        model=_MODEL,
        messages=[
            {"role": "system", "content": f"{BASE_RULES}\n\n{_QUESTION_GENERATION_PROMPT}"},
            {"role": "user", "content": json.dumps(user_payload)},
        ],
        response_format=ResponseFormat(type="json_object"),
        max_tokens=1500,
        timeout_ms=15000,
    )
    raw = response.choices[0].message.content
    parsed = json.loads(raw)
    return AdaptiveQuestionResponse.model_validate(parsed)


def generate_question(
    target_competency: Competency,
    difficulty_level: int,
    current_estimated_level: float,
    required_level: float,
    previous_questions: list[str],
) -> AdaptiveQuestionResponse:
    """FR-003/FR-004: schema-validate, retry once on any failure, then raise for the caller (Task 6's
    assessment_engine) to fall back to a seed question — never crash the process."""
    last_error: Exception | None = None
    for attempt in (1, 2):
        try:
            return _call_generate_question_once(
                target_competency, difficulty_level, current_estimated_level, required_level, previous_questions
            )
        except (json.JSONDecodeError, ValidationError, TypeError, KeyError) as exc:
            last_error = exc
            logger.warning("Mistral question generation attempt %d failed schema validation: %s", attempt, exc)
        except Exception as exc:  # network/timeout/API errors — logged, not swallowed
            last_error = exc
            logger.warning("Mistral question generation attempt %d failed: %s", attempt, exc)

    raise MistralQuestionGenerationError(
        f"Mistral question generation failed after 2 attempts: {last_error}"
    ) from last_error


# total_buildplan.md §12 — "Mistral may supply the natural-language explanation; ordering stays
# deterministic." Optional/best-effort: no retry (research.md §3 of Task 10), one batched call for
# the whole path rather than one per step (Rule 13).
_LEARNING_PATH_RATIONALE_PROMPT = (
    "You are currently performing: LEARNING_PATH_RATIONALE. For each learning path step supplied "
    "(already in its final, backend-decided order — do not reorder them), write one short sentence "
    "explaining why that step comes at that point in the sequence. Return JSON only, in the form "
    '{"rationales": {"<step_number>": "..."}}. Do not include a step_number you were not given. '
    "Keep each sentence concise and specific to the step's course and the competencies it addresses."
)


def generate_rationale(steps: list[dict]) -> dict[int, str]:
    """FR-006: optional/best-effort. Returns {} on any failure — the caller leaves `rationale: null`
    for every step in that case; ordering is never affected either way."""
    try:
        client = _client()
        user_payload = {
            "operation": "LEARNING_PATH_RATIONALE",
            "steps": [
                {"step_number": s["step_number"], "course_title": s["title"], "addresses_gaps": s["addresses_gaps"]}
                for s in steps
            ],
        }
        response = client.chat.complete(
            model=_MODEL,
            messages=[
                {"role": "system", "content": f"{BASE_RULES}\n\n{_LEARNING_PATH_RATIONALE_PROMPT}"},
                {"role": "user", "content": json.dumps(user_payload)},
            ],
            response_format=ResponseFormat(type="json_object"),
            max_tokens=1000,
            timeout_ms=15000,
        )
        parsed = json.loads(response.choices[0].message.content)
        return {int(k): v for k, v in parsed.get("rationales", {}).items()}
    except Exception as exc:  # optional/best-effort — logged, never raised (research.md §3)
        logger.warning("Learning path rationale generation failed (non-fatal): %s", exc)
        return {}
