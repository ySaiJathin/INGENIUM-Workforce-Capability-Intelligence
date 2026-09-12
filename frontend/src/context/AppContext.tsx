import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  Candidate,
  TargetRole,
  ExtractedEvidence,
  InitialCapabilityItem,
  AssessmentQuestion,
  AssessmentResultSummary,
  VerifiedCapabilityItem,
  SkillGap,
  Course,
  LearningPath,
  LearningPathStep,
  ApiNextQuestionResponse,
  VerificationLedgerEntry
} from '../types';
// Task 16: "Try Demo Candidate" now seeds a real backend candidate (POST /candidates/demo) and
// flows through the identical pipeline as a real upload — DEMO_CANDIDATE supplies only the
// presentational identity fields (name/department/cadre) that no /candidates/* response carries
// for either entry point (Task 4: "validated but intentionally not persisted").
import { DEMO_CANDIDATE } from '../mock/demoData';
import { WorkforceIntelligenceAPI } from '../services/api';
import { ApiError } from '../services/httpClient';
import {
  toLevelNumber,
  emptyTargetRole,
  mapRoleSummaryToTargetRole,
  mapRoleDetailToTargetRole,
  mapCourseSummary,
  applyCourseRecommendation,
  mapInitialProfileItem,
  mapVerifiedProfileItem,
  mapSkillGapItem,
  mapLearningPathStep
} from '../services/mappers';

const EMPTY_CANDIDATE: Candidate = {
  id: '',
  name: '',
  designation: '',
  department: '',
  cadre: '',
  yearsOfExperience: 0,
  location: '',
  email: '',
  employeeCode: '',
  assessmentStatus: 'Not Started',
  evidenceSource: 'No Evidence',
  overallConfidence: 'LOW',
  initialProfileGenerated: false,
  selectedRoleId: undefined,
  assessmentCompleted: false
};

const EMPTY_ASSESSMENT_RESULTS: AssessmentResultSummary = {
  candidateId: '',
  targetRoleId: '',
  roleReadinessScore: 0,
  competenciesAssessedCount: 0,
  strongCount: 0,
  developingCount: 0,
  priorityGapsCount: 0,
  competencyEvaluations: []
};

const EMPTY_LEARNING_PATH: LearningPath = {
  candidateId: '',
  targetRoleId: '',
  currentReadiness: 0,
  projectedReadiness: 0,
  gapCountTotal: 0,
  projectedGapsClosed: 0,
  totalEstimatedHours: 0,
  steps: []
};

interface AnswerResult {
  isCorrect: boolean;
  updatedConfidence: number;
  updatedDifficulty: number;
}

// FR-010/SC-004: session-defining state persisted across a browser refresh. Deliberately excludes
// `allRoles`/`allCourses` (re-fetched from their own catalog-load effects on mount) and `loading`/
// `errors` (transient, not meaningful to resume).
const PERSIST_KEY = 'ingenium.session.v1';

interface PersistedSession {
  isDemoMode: boolean;
  candidate: Candidate;
  candidateId: string | null;
  targetRole: TargetRole;
  extractedEvidence: ExtractedEvidence[];
  initialProfile: InitialCapabilityItem[];
  resumeFileName: string | null;
  assessmentQuestions: AssessmentQuestion[];
  currentQuestionIndex: number;
  assessmentAnswers: Record<string, string>;
  assessmentAnswerResults: Record<string, AnswerResult>;
  isAssessmentCompleted: boolean;
  assessmentResults: AssessmentResultSummary;
  verifiedProfile: VerifiedCapabilityItem[];
  verificationLedger: Record<string, VerificationLedgerEntry>;
  skillGaps: SkillGap[];
  recommendedCourseIds: string[];
  unmatchedGapCompetencyIds: string[];
  gapsWithoutCoursesCompetencyIds: string[];
  learningPath: LearningPath;
  sessionId: string | null;
  questionBudget: number;
  analysisId: string | null;
  learningPathId: string | null;
  competencyNameById: Record<string, string>;
}

function readPersistedSession(): Partial<PersistedSession> | null {
  try {
    const raw = window.localStorage.getItem(PERSIST_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<PersistedSession>;
  } catch {
    // Corrupt blob, quota issue, or localStorage unavailable (private browsing) — degrade to a
    // fresh session rather than crashing startup.
    return null;
  }
}

function clearPersistedSession(): void {
  try {
    window.localStorage.removeItem(PERSIST_KEY);
  } catch {
    // Best-effort only.
  }
}

interface AppContextType {
  candidate: Candidate;
  candidateId: string | null;
  targetRole: TargetRole;
  allRoles: TargetRole[];
  extractedEvidence: ExtractedEvidence[];
  initialProfile: InitialCapabilityItem[];
  assessmentQuestions: AssessmentQuestion[];
  currentQuestionIndex: number;
  assessmentAnswers: Record<string, string>; // questionId -> optionId
  assessmentAnswerResults: Record<string, AnswerResult>;
  isAssessmentCompleted: boolean;
  assessmentResults: AssessmentResultSummary;
  verifiedProfile: VerifiedCapabilityItem[];
  verificationLedger: VerificationLedgerEntry[];
  skillGaps: SkillGap[];
  allCourses: Course[];
  recommendedCourses: Course[];
  unmatchedGapCompetencyIds: string[];
  gapsWithoutCoursesCompetencyIds: string[];
  learningPath: LearningPath;
  resumeFileName: string | null;
  isDemoMode: boolean;
  loading: Record<string, boolean>;
  errors: Record<string, ApiError | Error | null>;

  // Actions (names/shapes preserved per FR-008 wherever practical)
  loadDemoCandidate: () => Promise<void>;
  resetToBlankState: () => void;
  setResumeUploaded: (file: File) => Promise<void>;
  selectTargetRole: (roleId: string) => Promise<void>;
  answerAssessmentQuestion: (questionId: string, optionId: string) => void;
  nextQuestion: () => Promise<void>;
  previousQuestion: () => void;
  completeAssessment: () => Promise<void>;
  addCourseToLearningPath: (course: Course) => boolean;
  removeCourseFromLearningPath: (courseId: string) => void;
  toggleStepStatus: (stepNumber: number) => void;

  // New orchestration actions this phase adds (not in the original prototype's action set —
  // required because the real backend's assessment/learning-path flows are session/analysis
  // keyed rather than fetched-in-full-upfront).
  startAssessmentSession: () => Promise<void>;
  generateLearningPath: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // FR-010/SC-004: a browser refresh must resume the current session (identity + assessment
  // progress) rather than losing it — read once on mount, wrapped so a missing/corrupt/unavailable
  // localStorage never crashes startup (this project's general failure-handling posture).
  const persisted = useMemo(() => readPersistedSession(), []);

  const [isDemoMode, setIsDemoMode] = useState<boolean>(persisted?.isDemoMode ?? false);
  const [candidate, setCandidate] = useState<Candidate>(persisted?.candidate ?? EMPTY_CANDIDATE);
  const [candidateId, setCandidateId] = useState<string | null>(persisted?.candidateId ?? null);
  const [allRoles, setAllRoles] = useState<TargetRole[]>([]);
  const [targetRole, setTargetRole] = useState<TargetRole>(persisted?.targetRole ?? emptyTargetRole());
  const [extractedEvidence, setExtractedEvidence] = useState<ExtractedEvidence[]>(persisted?.extractedEvidence ?? []);
  const [initialProfile, setInitialProfile] = useState<InitialCapabilityItem[]>(persisted?.initialProfile ?? []);
  const [resumeFileName, setResumeFileName] = useState<string | null>(persisted?.resumeFileName ?? null);

  const [assessmentQuestions, setAssessmentQuestions] = useState<AssessmentQuestion[]>(
    persisted?.assessmentQuestions ?? []
  );
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(persisted?.currentQuestionIndex ?? 0);
  const [assessmentAnswers, setAssessmentAnswers] = useState<Record<string, string>>(
    persisted?.assessmentAnswers ?? {}
  );
  const [assessmentAnswerResults, setAssessmentAnswerResults] = useState<Record<string, AnswerResult>>(
    persisted?.assessmentAnswerResults ?? {}
  );
  const [isAssessmentCompleted, setIsAssessmentCompleted] = useState<boolean>(
    persisted?.isAssessmentCompleted ?? false
  );
  const [assessmentResults, setAssessmentResults] = useState<AssessmentResultSummary>(
    persisted?.assessmentResults ?? EMPTY_ASSESSMENT_RESULTS
  );
  const [verifiedProfile, setVerifiedProfile] = useState<VerifiedCapabilityItem[]>(persisted?.verifiedProfile ?? []);
  const [verificationLedger, setVerificationLedger] = useState<Record<string, VerificationLedgerEntry>>(
    persisted?.verificationLedger ?? {}
  );
  const [skillGaps, setSkillGaps] = useState<SkillGap[]>(persisted?.skillGaps ?? []);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  // FR-005/FR-008: which of the full catalog's courses are Task 9's actual recommendations for this
  // candidate (ordered), and which gaps have no matching course at all — both distinct from
  // `allCourses`/`skillGaps` themselves so screens can render only real recommendations plus an
  // explicit "no course available" flag instead of silently mixing in or dropping either.
  const [recommendedCourseIds, setRecommendedCourseIds] = useState<string[]>(
    persisted?.recommendedCourseIds ?? []
  );
  const [unmatchedGapCompetencyIds, setUnmatchedGapCompetencyIds] = useState<string[]>(
    persisted?.unmatchedGapCompetencyIds ?? []
  );
  const [gapsWithoutCoursesCompetencyIds, setGapsWithoutCoursesCompetencyIds] = useState<string[]>(
    persisted?.gapsWithoutCoursesCompetencyIds ?? []
  );
  const [learningPath, setLearningPath] = useState<LearningPath>(persisted?.learningPath ?? EMPTY_LEARNING_PATH);

  const [sessionId, setSessionId] = useState<string | null>(persisted?.sessionId ?? null);
  const [questionBudget, setQuestionBudget] = useState<number>(persisted?.questionBudget ?? 0);
  const [analysisId, setAnalysisId] = useState<string | null>(persisted?.analysisId ?? null);
  const [learningPathId, setLearningPathId] = useState<string | null>(persisted?.learningPathId ?? null);
  const [competencyNameById, setCompetencyNameById] = useState<Record<string, string>>(
    persisted?.competencyNameById ?? {}
  );

  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, ApiError | Error | null>>({});

  const setLoadingKey = (key: string, value: boolean) => setLoading(prev => ({ ...prev, [key]: value }));
  const setErrorKey = (key: string, value: ApiError | Error | null) => setErrors(prev => ({ ...prev, [key]: value }));

  // FR-010/SC-004: persist the session-defining slice on every change so a refresh can resume
  // synchronously (no network round-trip) instead of losing state. No-op (removes the key) once
  // there's no candidate to resume.
  useEffect(() => {
    if (!candidateId) {
      clearPersistedSession();
      return;
    }
    try {
      const payload: PersistedSession = {
        isDemoMode,
        candidate,
        candidateId,
        targetRole,
        extractedEvidence,
        initialProfile,
        resumeFileName,
        assessmentQuestions,
        currentQuestionIndex,
        assessmentAnswers,
        assessmentAnswerResults,
        isAssessmentCompleted,
        assessmentResults,
        verifiedProfile,
        verificationLedger,
        skillGaps,
        recommendedCourseIds,
        unmatchedGapCompetencyIds,
        gapsWithoutCoursesCompetencyIds,
        learningPath,
        sessionId,
        questionBudget,
        analysisId,
        learningPathId,
        competencyNameById
      };
      window.localStorage.setItem(PERSIST_KEY, JSON.stringify(payload));
    } catch {
      // Quota exceeded or localStorage unavailable — resume-after-refresh degrades gracefully;
      // the rest of the app is unaffected.
    }
  }, [
    isDemoMode,
    candidate,
    candidateId,
    targetRole,
    extractedEvidence,
    initialProfile,
    resumeFileName,
    assessmentQuestions,
    currentQuestionIndex,
    assessmentAnswers,
    assessmentAnswerResults,
    isAssessmentCompleted,
    assessmentResults,
    verifiedProfile,
    verificationLedger,
    skillGaps,
    recommendedCourseIds,
    unmatchedGapCompetencyIds,
    gapsWithoutCoursesCompetencyIds,
    learningPath,
    sessionId,
    questionBudget,
    analysisId,
    learningPathId,
    competencyNameById
  ]);

  // --- Foundational catalog loads (candidate-independent; FR-004/FR-005 loading/error handling) ---

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingKey('roles', true);
      setErrorKey('roles', null);
      try {
        const roles = await WorkforceIntelligenceAPI.getTargetRoles();
        if (!cancelled) setAllRoles(roles.map(mapRoleSummaryToTargetRole));
      } catch (err) {
        if (!cancelled) setErrorKey('roles', err as ApiError);
      } finally {
        if (!cancelled) setLoadingKey('roles', false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingKey('courses', true);
      setErrorKey('courses', null);
      try {
        const courses = await WorkforceIntelligenceAPI.getAllCourses();
        if (!cancelled) setAllCourses(courses.map(mapCourseSummary));
      } catch (err) {
        if (!cancelled) setErrorKey('courses', err as ApiError);
      } finally {
        if (!cancelled) setLoadingKey('courses', false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const competencies = await WorkforceIntelligenceAPI.getCompetencies();
        if (!cancelled) {
          const map: Record<string, string> = {};
          competencies.forEach(c => {
            map[c.id] = c.name;
          });
          setCompetencyNameById(map);
        }
      } catch {
        // Non-fatal: competency names fall back to their id elsewhere if this fails.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // --- "Try Demo Candidate" (Task 16, FR-001): seeds a real backend candidate via POST
  // /candidates/demo and enters the *identical* downstream pipeline as a real resume upload —
  // isDemoMode is now purely a display flag (e.g. "Demo Data" labeling), not a data source switch.
  // Every action after this (role selection, assessment, completion, learning path) runs the exact
  // same real-backend code as a real candidate; see selectTargetRole/nextQuestion/
  // completeAssessment/generateLearningPath below, none of which branch on isDemoMode anymore.
  const loadDemoCandidate = async () => {
    setLoadingKey('initialProfile', true);
    setErrorKey('initialProfile', null);
    try {
      const response = await WorkforceIntelligenceAPI.startDemoCandidate();
      setIsDemoMode(true);
      setCandidateId(response.candidate_id);
      setResumeFileName(null);
      const mappedProfile = response.initial_profile.map(mapInitialProfileItem);
      setInitialProfile(mappedProfile);
      setExtractedEvidence(
        response.initial_profile.map((item, idx) => ({
          id: `evidence-${idx}`,
          competencyId: item.competency_id,
          competencyName: item.competency_name,
          snippet: item.evidence_snippet || 'No evidence snippet extracted.',
          estimatedLevel: toLevelNumber(item.resume_estimated_level),
          confidence: item.resume_confidence,
          sourceContext: 'Demo candidate seed'
        }))
      );
      // Identity/presentation fields only (name, role title, tenure) — neither a real nor demo
      // /candidates/resume-shaped response carries these (Task 4: "validated but intentionally not
      // persisted"), so this is legitimate demo-specific UI content (demo_plan.md §3), not a
      // fabricated number on a gap/profile screen (spec SC-005 only constrains those).
      setCandidate(prev => ({
        ...prev,
        ...DEMO_CANDIDATE,
        id: response.candidate_id,
        assessmentStatus: 'Resume Uploaded',
        evidenceSource: 'Resume Uploaded',
        initialProfileGenerated: true,
        overallConfidence: 'LOW',
        assessmentCompleted: false,
        selectedRoleId: undefined
      }));
    } catch (err) {
      setErrorKey('initialProfile', err as ApiError);
      throw err;
    } finally {
      setLoadingKey('initialProfile', false);
    }
  };

  // --- Reset to Clean Blank State (FR-006's "no real data yet" state) ---
  const resetToBlankState = () => {
    setIsDemoMode(false);
    setCandidate({ ...EMPTY_CANDIDATE });
    setCandidateId(null);
    setTargetRole(emptyTargetRole());
    setResumeFileName(null);
    setExtractedEvidence([]);
    setInitialProfile([]);
    setSessionId(null);
    setQuestionBudget(0);
    setAssessmentQuestions([]);
    setCurrentQuestionIndex(0);
    setAssessmentAnswers({});
    setAssessmentAnswerResults({});
    setIsAssessmentCompleted(false);
    setAssessmentResults(EMPTY_ASSESSMENT_RESULTS);
    setVerifiedProfile([]);
    setVerificationLedger({});
    setAnalysisId(null);
    setSkillGaps([]);
    setRecommendedCourseIds([]);
    setUnmatchedGapCompetencyIds([]);
    setGapsWithoutCoursesCompetencyIds([]);
    setLearningPathId(null);
    setLearningPath(EMPTY_LEARNING_PATH);
    setLoading({});
    setErrors({});
    clearPersistedSession();
  };

  // --- Resume upload (FR-002/FR-004/FR-005) ---
  const setResumeUploaded = async (file: File) => {
    setLoadingKey('initialProfile', true);
    setErrorKey('initialProfile', null);
    try {
      const response = await WorkforceIntelligenceAPI.uploadResume(file);
      setCandidateId(response.candidate_id);
      setResumeFileName(file.name);
      const mappedProfile = response.initial_profile.map(mapInitialProfileItem);
      setInitialProfile(mappedProfile);
      setExtractedEvidence(
        response.initial_profile.map((item, idx) => ({
          id: `evidence-${idx}`,
          competencyId: item.competency_id,
          competencyName: item.competency_name,
          snippet: item.evidence_snippet || 'No evidence snippet extracted.',
          estimatedLevel: toLevelNumber(item.resume_estimated_level),
          confidence: item.resume_confidence,
          sourceContext: 'Resume upload'
        }))
      );
      setCandidate(prev => ({
        ...prev,
        id: response.candidate_id,
        assessmentStatus: 'Resume Uploaded',
        evidenceSource: 'Resume Uploaded',
        initialProfileGenerated: true,
        overallConfidence: 'LOW'
      }));
    } catch (err) {
      setErrorKey('initialProfile', err as ApiError);
      throw err;
    } finally {
      setLoadingKey('initialProfile', false);
    }
  };

  // --- Target role selection (FR-002/FR-004/FR-005) ---
  const selectTargetRole = async (roleId: string) => {
    if (!candidateId) {
      // No resume uploaded yet — nothing to attach a role to (FR-006). Do not crash.
      console.warn('selectTargetRole called with no candidateId; upload a resume first.');
      return;
    }
    setLoadingKey('targetRole', true);
    setErrorKey('targetRole', null);
    try {
      const response = await WorkforceIntelligenceAPI.selectTargetRole(candidateId, roleId);
      setTargetRole(mapRoleDetailToTargetRole(response.role));
      setCandidate(prev => ({ ...prev, selectedRoleId: roleId }));
    } catch (err) {
      setErrorKey('targetRole', err as ApiError);
    } finally {
      setLoadingKey('targetRole', false);
    }
  };

  // --- Assessment: start a session and fetch the first question ---
  const startAssessmentSession = async () => {
    if (sessionId) return;
    if (!candidateId || !targetRole.id) {
      console.warn('startAssessmentSession called with no candidateId/targetRole; select a role first.');
      return;
    }
    setLoadingKey('assessment', true);
    setErrorKey('assessment', null);
    try {
      const start = await WorkforceIntelligenceAPI.startAssessment(candidateId, targetRole.id);
      setSessionId(start.session_id);
      setQuestionBudget(start.question_budget);
      const next = await WorkforceIntelligenceAPI.getNextQuestion(start.session_id);
      if ('question_id' in next) {
        setAssessmentQuestions([mapApiQuestion(next, start.question_budget, competencyNameById)]);
        setCurrentQuestionIndex(0);
      } else {
        setIsAssessmentCompleted(true);
      }
    } catch (err) {
      setErrorKey('assessment', err as ApiError);
    } finally {
      setLoadingKey('assessment', false);
    }
  };

  const answerAssessmentQuestion = (questionId: string, optionId: string) => {
    setAssessmentAnswers(prev => ({ ...prev, [questionId]: optionId }));
  };

  const nextQuestion = async () => {
    if (!sessionId) return;

    // Already-fetched question further along (e.g. after going back then forward again).
    if (currentQuestionIndex < assessmentQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      return;
    }

    const currentQ = assessmentQuestions[currentQuestionIndex];
    if (!currentQ) return;

    setLoadingKey('assessment', true);
    setErrorKey('assessment', null);
    try {
      const selectedOptionId = assessmentAnswers[currentQ.id];
      if (selectedOptionId && !assessmentAnswerResults[currentQ.id]) {
        const selectedIndex = currentQ.options.findIndex(o => o.id === selectedOptionId);
        const answer = await WorkforceIntelligenceAPI.submitAnswer(sessionId, currentQ.id, selectedIndex);
        setAssessmentAnswerResults(prev => ({
          ...prev,
          [currentQ.id]: {
            isCorrect: answer.is_correct,
            updatedConfidence: answer.updated_confidence,
            updatedDifficulty: answer.updated_difficulty
          }
        }));
        // FR-005: live Verification Ledger — one entry per competency actually probed so far,
        // sourced only from this real answer response (never static/placeholder content).
        setVerificationLedger(prev => ({
          ...prev,
          [answer.competency_id]: {
            competencyId: answer.competency_id,
            competencyName: competencyNameById[answer.competency_id] || answer.competency_id,
            verifiedLevel: answer.updated_difficulty,
            confidence: answer.updated_confidence,
            isGap: answer.updated_confidence < 0.75
          }
        }));
        if (answer.session_status === 'completed') {
          setIsAssessmentCompleted(true);
          return;
        }
      }

      const next = await WorkforceIntelligenceAPI.getNextQuestion(sessionId);
      if ('question_id' in next) {
        setAssessmentQuestions(prev => [...prev, mapApiQuestion(next, questionBudget, competencyNameById)]);
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        setIsAssessmentCompleted(true);
      }
    } catch (err) {
      setErrorKey('assessment', err as ApiError);
    } finally {
      setLoadingKey('assessment', false);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  // --- Assessment completion: verified profile, analysis, gaps, course recommendations ---
  const completeAssessment = async () => {
    if (!sessionId || !candidateId || !targetRole.id) return;

    setIsAssessmentCompleted(true);
    setCandidate(prev => ({
      ...prev,
      assessmentStatus: 'Verified',
      evidenceSource: 'Multi-source Verified',
      overallConfidence: 'HIGH',
      assessmentCompleted: true
    }));

    const requiredLevelByCompetency: Record<string, number> = {};
    targetRole.requiredCompetencies.forEach(rc => {
      requiredLevelByCompetency[rc.competencyId] = rc.requiredLevel;
    });

    setLoadingKey('assessmentProfile', true);
    setErrorKey('assessmentProfile', null);
    let mappedVerifiedProfile: VerifiedCapabilityItem[] = [];
    try {
      const profile = await WorkforceIntelligenceAPI.getAssessmentProfile(sessionId);
      mappedVerifiedProfile = profile.verified_profile.map(item =>
        mapVerifiedProfileItem(item, requiredLevelByCompetency)
      );
      setVerifiedProfile(mappedVerifiedProfile);
      setAssessmentResults(buildAssessmentResults(candidateId, targetRole.id, mappedVerifiedProfile, initialProfile));
    } catch (err) {
      setErrorKey('assessmentProfile', err as ApiError);
    } finally {
      setLoadingKey('assessmentProfile', false);
    }

    setLoadingKey('analysis', true);
    setErrorKey('analysis', null);
    let newAnalysisId: string | null = null;
    try {
      const analysis = await WorkforceIntelligenceAPI.createAnalysis(candidateId, targetRole.id);
      newAnalysisId = analysis.analysis_id;
      setAnalysisId(newAnalysisId);
    } catch (err) {
      setErrorKey('analysis', err as ApiError);
    } finally {
      setLoadingKey('analysis', false);
    }

    if (!newAnalysisId) return;

    setLoadingKey('gaps', true);
    setErrorKey('gaps', null);
    try {
      const gapsResponse = await WorkforceIntelligenceAPI.getSkillGaps(newAnalysisId);
      setSkillGaps(gapsResponse.gaps.map(mapSkillGapItem));
    } catch (err) {
      setErrorKey('gaps', err as ApiError);
    } finally {
      setLoadingKey('gaps', false);
    }

    setLoadingKey('courseRecommendations', true);
    setErrorKey('courseRecommendations', null);
    try {
      const coursesResponse = await WorkforceIntelligenceAPI.getCourseRecommendations(newAnalysisId);
      setAllCourses(prev => {
        const byId = new Map(prev.map(c => [c.id, c]));
        coursesResponse.recommendations.forEach(rec => {
          const existing = byId.get(rec.course_id);
          if (existing) byId.set(rec.course_id, applyCourseRecommendation(existing, rec));
        });
        // Bug fix (found while live-testing the golden path): matchScore is null for an exact/
        // deterministic match (see types/index.ts) and must sort ABOVE every semantic-fallback
        // match, per course_recommendation_engine.py's own rule that a semantic score never
        // outranks an exact match — treat null as +Infinity here, not 0/NaN.
        const rank = (c: Course) => (c.matchScore == null ? Infinity : c.matchScore);
        return Array.from(byId.values()).sort((a, b) => rank(b) - rank(a));
      });
      // FR-005/FR-008: track which courses are actual recommendations (not the whole catalog) and
      // which gaps have no matching course at all — both previously dropped entirely.
      setRecommendedCourseIds(coursesResponse.recommendations.map(rec => rec.course_id));
      setUnmatchedGapCompetencyIds(coursesResponse.unmatched_gaps);
    } catch (err) {
      setErrorKey('courseRecommendations', err as ApiError);
    } finally {
      setLoadingKey('courseRecommendations', false);
    }
  };

  // --- Learning path generation (T015) ---
  const generateLearningPath = async () => {
    if (!analysisId || learningPathId) return;

    setLoadingKey('learningPath', true);
    setErrorKey('learningPath', null);
    try {
      const response = await WorkforceIntelligenceAPI.createLearningPath(analysisId);
      setLearningPathId(response.learning_path_id);
      const steps: LearningPathStep[] = response.steps.map(step =>
        mapLearningPathStep(step, allCourses.find(c => c.id === step.course_id))
      );
      const totalEstimatedHours = steps.reduce((sum, s) => {
        const course = allCourses.find(c => c.id === s.courseId);
        return sum + (course?.durationHours || 0);
      }, 0);
      const addressedGapIds = new Set(steps.flatMap(s => s.competenciesAddressed));
      const projectedGapsClosed = skillGaps.filter(g => addressedGapIds.has(g.competencyId)).length;

      setLearningPath({
        candidateId: candidateId || '',
        targetRoleId: targetRole.id,
        currentReadiness: assessmentResults.roleReadinessScore,
        projectedReadiness: Math.min(100, assessmentResults.roleReadinessScore + steps.length * 4),
        gapCountTotal: skillGaps.length,
        projectedGapsClosed,
        totalEstimatedHours,
        steps
      });
      setGapsWithoutCoursesCompetencyIds(response.gaps_without_courses);
    } catch (err) {
      setErrorKey('learningPath', err as ApiError);
    } finally {
      setLoadingKey('learningPath', false);
    }
  };

  const addCourseToLearningPath = (course: Course): boolean => {
    const exists = learningPath.steps.some(s => s.courseId === course.id);
    if (exists) return false;

    const newStep: LearningPathStep = {
      stepNumber: learningPath.steps.length + 1,
      courseId: course.id,
      courseTitle: course.title,
      provider: course.provider,
      competenciesAddressed: course.targetGapCompetencies,
      durationText: `${course.durationHours} Hours`,
      priority: course.priority,
      status: 'UPCOMING',
      targetGapSummary: course.closesGapDescription,
      projectedReadinessContribution: 4,
      keyMilestones: ['Enrolled into curriculum', 'Practical assessment submission']
    };

    setLearningPath(prev => ({
      ...prev,
      projectedReadiness: Math.min(100, prev.projectedReadiness + 3),
      totalEstimatedHours: prev.totalEstimatedHours + course.durationHours,
      steps: [...prev.steps, newStep]
    }));
    return true;
  };

  const removeCourseFromLearningPath = (courseId: string) => {
    setLearningPath(prev => {
      const filtered = prev.steps.filter(s => s.courseId !== courseId);
      const reindexed = filtered.map((s, idx) => ({ ...s, stepNumber: idx + 1 }));
      return { ...prev, steps: reindexed };
    });
  };

  const toggleStepStatus = (stepNumber: number) => {
    setLearningPath(prev => {
      const updatedSteps = prev.steps.map(step => {
        if (step.stepNumber === stepNumber) {
          const nextStatus =
            step.status === 'UPCOMING' ? 'IN_PROGRESS' : step.status === 'IN_PROGRESS' ? 'COMPLETED' : 'UPCOMING';
          return { ...step, status: nextStatus as any };
        }
        return step;
      });
      return { ...prev, steps: updatedSteps };
    });
  };

  return (
    <AppContext.Provider
      value={{
        candidate,
        candidateId,
        targetRole,
        allRoles,
        extractedEvidence,
        initialProfile,
        assessmentQuestions,
        currentQuestionIndex,
        assessmentAnswers,
        assessmentAnswerResults,
        isAssessmentCompleted,
        assessmentResults,
        verifiedProfile,
        verificationLedger: Object.values(verificationLedger),
        skillGaps,
        allCourses,
        recommendedCourses: recommendedCourseIds
          .map(id => allCourses.find(c => c.id === id))
          .filter((c): c is Course => c != null),
        unmatchedGapCompetencyIds,
        gapsWithoutCoursesCompetencyIds,
        learningPath,
        resumeFileName,
        isDemoMode,
        loading,
        errors,
        loadDemoCandidate,
        resetToBlankState,
        setResumeUploaded,
        selectTargetRole,
        answerAssessmentQuestion,
        nextQuestion,
        previousQuestion,
        completeAssessment,
        addCourseToLearningPath,
        removeCourseFromLearningPath,
        toggleStepStatus,
        startAssessmentSession,
        generateLearningPath
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

// --- Local helpers -----------------------------------------------------------------------------

const DIFFICULTY_LABELS: AssessmentQuestion['difficulty'][] = ['Foundation', 'Intermediate', 'Advanced', 'Expert'];

function mapApiQuestion(
  q: ApiNextQuestionResponse,
  budget: number,
  competencyNameById: Record<string, string>
): AssessmentQuestion {
  const difficultyIndex = Math.min(4, Math.max(1, Math.round(q.difficulty))) - 1;
  const competencyName = competencyNameById[q.competency_id] || q.competency_id;
  return {
    id: q.question_id,
    competencyId: q.competency_id,
    competencyName,
    difficulty: DIFFICULTY_LABELS[difficultyIndex] || 'Foundation',
    questionNumber: q.sequence_number,
    totalQuestions: budget || q.sequence_number,
    scenario: '',
    questionText: q.prompt,
    codeSnippet: undefined,
    options: q.options.map((text, idx) => ({ id: `opt-${idx}`, text })),
    // FR-004/SC-002: the correct answer is never known until the backend's `answer` response —
    // omitted entirely here (not even an empty string) so this can never leak pre-submission.
    correctOptionId: undefined,
    probingReason: `Adaptive probe targeting ${competencyName}.`,
    explanation: '',
    // FR-011: must never reveal whether a question came from Mistral or the seed fallback — this
    // copy is derived only from structured fields (competency, difficulty), identically for both.
    adaptiveBranchNote: `Continuing to probe ${competencyName} at difficulty level ${q.difficulty} based on your prior responses.`
  };
}

function buildAssessmentResults(
  candidateId: string,
  targetRoleId: string,
  verifiedProfile: VerifiedCapabilityItem[],
  initialProfile: InitialCapabilityItem[]
): AssessmentResultSummary {
  const initialByCompetency: Record<string, number> = {};
  initialProfile.forEach(ip => {
    initialByCompetency[ip.competencyId] = ip.estimatedLevel;
  });

  const strongCount = verifiedProfile.filter(p => p.status === 'READY').length;
  const developingCount = verifiedProfile.filter(p => p.status === 'DEVELOPING').length;
  const priorityGapsCount = verifiedProfile.filter(p => p.status === 'GAP' || p.status === 'CRITICAL_GAP').length;

  const scores = verifiedProfile.map(p => Math.min(100, Math.round((p.verifiedLevel / Math.max(1, p.targetLevel)) * 100)));
  const roleReadinessScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  return {
    candidateId,
    targetRoleId,
    roleReadinessScore,
    competenciesAssessedCount: verifiedProfile.length,
    strongCount,
    developingCount,
    priorityGapsCount,
    competencyEvaluations: verifiedProfile.map(p => ({
      competencyId: p.competencyId,
      competencyName: p.competencyName,
      initialLevel: toLevelNumber(initialByCompetency[p.competencyId] ?? 1),
      verifiedLevel: p.verifiedLevel,
      requiredLevel: p.targetLevel,
      confidence: p.confidence,
      evidence: p.evidence,
      status: p.status,
      scorePercent: Math.min(100, Math.round((p.verifiedLevel / Math.max(1, p.targetLevel)) * 100)),
      feedback:
        p.status === 'READY'
          ? `Verified at Level ${p.verifiedLevel}, meeting the required standard.`
          : `Verified at Level ${p.verifiedLevel} against a required Level ${p.targetLevel} — targeted upskilling recommended.`
    }))
  };
}

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
