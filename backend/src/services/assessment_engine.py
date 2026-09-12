"""
Task 6 — Adaptive Assessment Engine core logic.

Pure functions over a SQLAlchemy Session and plain ids/values — no FastAPI dependency, so this stays
independently testable (Rule 9), per this feature's plan.md Structure Decision.

Routing/scoring constants and the difficulty/confidence-adjustment rule are research.md §1-§3's
decisions, implemented here verbatim.
"""

from __future__ import annotations

import logging
import uuid
from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from backend.src.models import (
    Answer,
    AssessmentSession,
    Competency,
    Question,
    RoleCompetency,
    SkillEvidence,
)
from backend.src.mcp import tools as mcp_tools
from backend.src.mcp.tools import MCPToolError
from backend.src.schemas.mcp import AssessmentContextRequest
from backend.src.services import seed_questions
from backend.src.services.mistral_client import MistralQuestionGenerationError, generate_question

logger = logging.getLogger(__name__)

# research.md §3
QUESTION_BUDGET = 10
CONFIDENCE_THRESHOLD = 0.75
MAX_QUESTIONS_PER_COMPETENCY = 3
# research.md §2
START_DIFFICULTY = 2
MIN_DIFFICULTY = 1
MAX_DIFFICULTY = 5
CONFIDENCE_INCREMENT_CORRECT = 0.35
CONFIDENCE_INCREMENT_INCORRECT = 0.15


class DuplicateAnswerError(ValueError):
    """FR-009: the question already has an answer recorded for this session."""


class QuestionNotInSessionError(ValueError):
    """FR-009: the question id doesn't belong to the given session."""


def _role_competencies(db: Session, target_role_id: str) -> list[RoleCompetency]:
    return list(db.execute(select(RoleCompetency).where(RoleCompetency.role_id == target_role_id)).scalars().all())


def start_session(db: Session, candidate_id: uuid.UUID, target_role_id: str) -> AssessmentSession:
    """FR-001, data-model.md's `start` transition."""
    session = AssessmentSession(
        id=uuid.uuid4(),
        candidate_id=candidate_id,
        target_role_id=target_role_id,
        status="in_progress",
        started_at=datetime.now(UTC),
        completed_at=None,
        question_budget=QUESTION_BUDGET,
    )
    db.add(session)

    for rc in _role_competencies(db, target_role_id):
        db.add(
            SkillEvidence(
                session_id=session.id,
                competency_id=rc.competency_id,
                questions_answered=0,
                correct_count=0,
                avg_difficulty=START_DIFFICULTY,
                confidence_state=0.0,
            )
        )
    db.commit()
    return session


def _is_resolved(evidence: SkillEvidence) -> bool:
    return evidence.confidence_state >= CONFIDENCE_THRESHOLD or evidence.questions_answered >= MAX_QUESTIONS_PER_COMPETENCY


def _questions_used(db: Session, session_id: uuid.UUID) -> int:
    return db.execute(select(func.count()).select_from(Question).where(Question.session_id == session_id)).scalar_one()


def select_next_competency(db: Session, session: AssessmentSession) -> str | None:
    """research.md §1: uncertainty score (1 - confidence_state) * priority_weight, highest wins;
    ties broken by lowest questions_answered. Returns None once every required competency is
    resolved (caller then completes the session)."""
    role_competencies = {rc.competency_id: rc for rc in _role_competencies(db, session.target_role_id)}
    evidence_rows = db.execute(select(SkillEvidence).where(SkillEvidence.session_id == session.id)).scalars().all()

    best_id: str | None = None
    best_score = -1.0
    best_questions_answered = float("inf")
    for evidence in evidence_rows:
        if _is_resolved(evidence):
            continue
        rc = role_competencies.get(evidence.competency_id)
        if rc is None:
            continue
        priority_weight = 1.0 / rc.priority
        score = (1.0 - evidence.confidence_state) * priority_weight
        if score > best_score or (score == best_score and evidence.questions_answered < best_questions_answered):
            best_id = evidence.competency_id
            best_score = score
            best_questions_answered = evidence.questions_answered

    return best_id


def _complete_session(db: Session, session: AssessmentSession) -> None:
    session.status = "completed"
    session.completed_at = datetime.now(UTC)
    db.commit()


def get_next_question(db: Session, session: AssessmentSession) -> Question | None:
    """FR-002..FR-005. Returns None when the session is (or just became) completed — caller returns
    the contract's `{"status": "completed", ...}` shape in that case."""
    if session.status == "completed":
        return None

    if _questions_used(db, session.id) >= session.question_budget:
        _complete_session(db, session)
        return None

    competency_id = select_next_competency(db, session)
    if competency_id is None:
        _complete_session(db, session)
        return None

    # Phase 3 (specs/023-phase-3-adaptive-assessment-mcp): context assembly now goes through the
    # MCP tool layer (Phase 2) instead of being built inline here — this is the actual "MCP-wired"
    # change this phase makes. On any MCPToolError, fall back to the exact inline assembly this
    # function used before (Rule 10: MCP must never be a single point of failure). The routing
    # decision above (select_next_competency) is unchanged either way.
    try:
        context = mcp_tools.get_assessment_context(db, AssessmentContextRequest(session_id=session.id))
        # Trust MCP's own competency selection (it re-derives the same routing logic — see
        # backend/src/mcp/tools.py's module docstring on why it doesn't import this module) over
        # the locally-computed one, so the two paths can never disagree about what's being asked.
        competency_id = context.target_competency_id
        competency = db.get(Competency, competency_id)
        evidence = db.get(SkillEvidence, {"session_id": session.id, "competency_id": competency_id})
        previous_questions = context.previous_questions
        required_level = context.required_level
    except MCPToolError as exc:
        logger.warning("MCP context assembly failed for session %s, falling back to inline assembly: %s", session.id, exc)
        competency = db.get(Competency, competency_id)
        evidence = db.get(SkillEvidence, {"session_id": session.id, "competency_id": competency_id})
        previous_questions = [
            q.prompt for q in db.execute(select(Question).where(Question.session_id == session.id)).scalars().all()
        ]
        required_level = next(
            (rc.required_level for rc in _role_competencies(db, session.target_role_id) if rc.competency_id == competency_id),
            None,
        )

    already_asked = set(previous_questions)

    prompt = None
    options: list[str] = []
    correct_answer_index = 0
    difficulty = int(evidence.avg_difficulty)
    explanation = ""
    source = "mistral"

    try:
        mistral_question = generate_question(
            target_competency=competency,
            difficulty_level=difficulty,
            current_estimated_level=evidence.avg_difficulty,
            required_level=required_level or 0,
            previous_questions=previous_questions,
        )
        # Domain validation beyond generic schema validation (research.md §4/spec FR-003): the
        # returned competency_id must match what we asked for, correct_answer must be one of the
        # options, and the question text must not repeat this session's history.
        if mistral_question.competency_id != competency_id:
            raise ValueError(f"Mistral returned competency_id {mistral_question.competency_id!r}, expected {competency_id!r}")
        if mistral_question.correct_answer not in mistral_question.options:
            raise ValueError("Mistral's correct_answer does not match any returned option")
        if mistral_question.question in already_asked:
            raise ValueError("Mistral repeated an already-asked question")

        prompt = mistral_question.question
        options = mistral_question.options
        correct_answer_index = options.index(mistral_question.correct_answer)
        difficulty = mistral_question.difficulty_level
        explanation = mistral_question.explanation
        source = "mistral"
    except (MistralQuestionGenerationError, ValueError) as exc:
        logger.warning("Falling back to seed question for competency %s: %s", competency_id, exc)
        seed = seed_questions.get_seed_question(competency_id, difficulty, already_asked)
        if seed is None:
            role_competency_ids = [rc.competency_id for rc in _role_competencies(db, session.target_role_id)]
            seed = seed_questions.get_any_unused_seed_for_role(role_competency_ids, already_asked)
        if seed is None:
            # Every available seed (for this competency and the whole role) is exhausted — a
            # graceful stop, not a crash (Rule 5's spirit extended to total content exhaustion).
            logger.warning("No seed questions left for session %s — completing early", session.id)
            _complete_session(db, session)
            return None

        prompt = seed["question"]
        options = seed["options"]
        correct_answer_index = seed["correct_answer_index"]
        difficulty = seed["difficulty"]
        explanation = seed["explanation"]
        source = "seed"
        # get_any_unused_seed_for_role() may return a seed for a *different* role competency than
        # the one routing selected (when this competency's own seed is already used) — the Question
        # (and thus which SkillEvidence gets updated in submit_answer) must reflect what the
        # question actually tests, never the originally-routed competency it didn't end up asking.
        competency_id = seed["competency_id"]

    question = Question(
        id=uuid.uuid4(),
        session_id=session.id,
        competency_id=competency_id,
        type="mcq",
        prompt=prompt,
        options=options,
        correct_answer_index=correct_answer_index,
        difficulty=difficulty,
        explanation=explanation,
        source=source,
        sequence_number=len(previous_questions) + 1,
    )
    db.add(question)
    db.commit()
    return question


def submit_answer(db: Session, session: AssessmentSession, question_id: uuid.UUID, selected_index: int):
    """FR-006..FR-009. Returns (is_correct, competency_id, updated_confidence, updated_difficulty,
    session_status)."""
    question = db.get(Question, question_id)
    if question is None or question.session_id != session.id:
        raise QuestionNotInSessionError(f"Question {question_id} does not belong to session {session.id}")

    existing = db.execute(
        select(Answer).where(Answer.question_id == question_id, Answer.session_id == session.id)
    ).scalar_one_or_none()
    if existing is not None:
        raise DuplicateAnswerError(f"Question {question_id} already answered for session {session.id}")

    is_correct = selected_index == question.correct_answer_index

    db.add(
        Answer(
            id=uuid.uuid4(),
            question_id=question_id,
            session_id=session.id,
            selected_index=selected_index,
            is_correct=is_correct,
            answered_at=datetime.now(UTC),
        )
    )

    evidence = db.get(SkillEvidence, {"session_id": session.id, "competency_id": question.competency_id})
    evidence.questions_answered += 1
    if is_correct:
        evidence.correct_count += 1
        evidence.avg_difficulty = min(MAX_DIFFICULTY, evidence.avg_difficulty + 1)
        evidence.confidence_state = min(1.0, evidence.confidence_state + CONFIDENCE_INCREMENT_CORRECT)
    else:
        evidence.confidence_state = min(1.0, evidence.confidence_state + CONFIDENCE_INCREMENT_INCORRECT)

    all_evidence = db.execute(select(SkillEvidence).where(SkillEvidence.session_id == session.id)).scalars().all()
    if all(_is_resolved(e) for e in all_evidence) or _questions_used(db, session.id) >= session.question_budget:
        session.status = "completed"
        session.completed_at = datetime.now(UTC)

    db.commit()

    return is_correct, question.competency_id, evidence.confidence_state, evidence.avg_difficulty, session.status


def get_profile(db: Session, session: AssessmentSession) -> list[SkillEvidence]:
    """FR-010, data-model.md's `profile` transition."""
    return list(db.execute(select(SkillEvidence).where(SkillEvidence.session_id == session.id)).scalars().all())
