export type CompetencyLevelNumber = 1 | 2 | 3 | 4;

export type CompetencyLevelName = 'Foundation' | 'Working' | 'Advanced' | 'Expert';

export interface CompetencyLevelInfo {
  level: CompetencyLevelNumber;
  name: CompetencyLevelName;
  description: string;
}

export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export type EvidenceSource = 'RESUME' | 'ASSESSMENT' | 'BOTH' | 'NONE';

export type VerificationStatus = 'UNVERIFIED' | 'NEEDS_ASSESSMENT' | 'VERIFIED';

export type CapabilityStatus = 'READY' | 'DEVELOPING' | 'GAP' | 'CRITICAL_GAP';

export interface Competency {
  id: string;
  name: string;
  category: 'Technical' | 'Statistical' | 'Domain' | 'Analytical' | 'Methodological';
  description: string;
}

export interface ExtractedEvidence {
  id: string;
  competencyId: string;
  competencyName: string;
  snippet: string;
  estimatedLevel: CompetencyLevelNumber;
  confidence: ConfidenceLevel;
  sourceContext: string;
}

export interface InitialCapabilityItem {
  competencyId: string;
  competencyName: string;
  category: string;
  estimatedLevel: CompetencyLevelNumber;
  evidence: string;
  confidence: ConfidenceLevel;
  verificationStatus: VerificationStatus;
}

export interface TargetRole {
  id: string;
  title: string;
  department: string;
  band: string;
  summary: string;
  description: string;
  competencyCount: number;
  criticalFocus: string[];
  requiredCompetencies: {
    competencyId: string;
    competencyName: string;
    category: string;
    requiredLevel: CompetencyLevelNumber;
    isCore: boolean;
    importance: 'CRITICAL' | 'HIGH' | 'MEDIUM';
    rationale: string;
  }[];
}

export interface Candidate {
  id: string;
  name: string;
  designation: string;
  department: string;
  cadre: string;
  yearsOfExperience: number;
  location: string;
  avatarUrl?: string;
  email: string;
  employeeCode: string;
  assessmentStatus: 'Not Started' | 'Resume Uploaded' | 'Assessment In Progress' | 'Verified';
  evidenceSource: 'No Evidence' | 'Resume Uploaded' | 'Assessment Completed' | 'Multi-source Verified';
  overallConfidence: ConfidenceLevel;
  initialProfileGenerated: boolean;
  selectedRoleId?: string;
  assessmentCompleted: boolean;
}

export interface AssessmentQuestion {
  id: string;
  competencyId: string;
  competencyName: string;
  difficulty: 'Foundation' | 'Intermediate' | 'Advanced' | 'Expert';
  questionNumber: number;
  totalQuestions: number;
  scenario: string;
  questionText: string;
  codeSnippet?: string;
  options: {
    id: string;
    text: string;
  }[];
  correctOptionId?: string;
  probingReason: string;
  explanation: string;
  adaptiveBranchNote: string;
}

export interface AssessmentSubmission {
  questionId: string;
  selectedOptionId: string;
}

export interface AssessmentResultSummary {
  candidateId: string;
  targetRoleId: string;
  roleReadinessScore: number; // e.g. 72%
  competenciesAssessedCount: number;
  strongCount: number;
  developingCount: number;
  priorityGapsCount: number;
  competencyEvaluations: {
    competencyId: string;
    competencyName: string;
    initialLevel: CompetencyLevelNumber;
    verifiedLevel: CompetencyLevelNumber;
    requiredLevel: CompetencyLevelNumber;
    confidence: ConfidenceLevel;
    evidence: EvidenceSource;
    status: CapabilityStatus;
    scorePercent: number;
    feedback: string;
  }[];
}

export interface VerifiedCapabilityItem {
  competencyId: string;
  competencyName: string;
  category: string;
  verifiedLevel: CompetencyLevelNumber;
  targetLevel: CompetencyLevelNumber;
  confidence: ConfidenceLevel;
  evidence: EvidenceSource;
  status: CapabilityStatus;
  notes: string;
}

export interface VerificationLedgerEntry {
  competencyId: string;
  competencyName: string;
  verifiedLevel: number;
  confidence: number; // 0-1
  isGap: boolean;
}

export interface SkillGap {
  id: string;
  competencyId: string;
  competencyName: string;
  category: string;
  currentLevel: CompetencyLevelNumber;
  requiredLevel: CompetencyLevelNumber;
  gapMagnitude: number; // e.g. 2 levels
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  whyItMatters: string;
  recommendedAction: string;
  expectedTimelineWeeks: number;
  impactArea: string;
}

export interface Course {
  id: string;
  title: string;
  provider: 'iGOT Karmayogi' | 'National Statistical Academy' | 'Ministry of Statistics (MoSPI)' | 'UN Statistics Division' | 'GovTech Institute';
  providerBadge: string;
  durationHours: number;
  difficulty: 'Foundation' | 'Intermediate' | 'Advanced';
  rating: number;
  reviewsCount: number;
  format: 'Self-Paced Interactive' | 'Cohort-Based Workshop' | 'Micro-Learning Modules';
  overview: string;
  targetGapCompetencies: string[];
  closesGapDescription: string;
  expectedPathway: {
    fromLevel: CompetencyLevelNumber;
    toLevel: CompetencyLevelNumber;
  };
  // Bug fix (found while live-testing the golden path): null means the backend's deterministic
  // (exact competency-overlap) matcher found this course — course_recommendation_engine.py
  // deliberately leaves match_score unset for those, since an exact match is a *stronger* signal
  // than any numeric similarity score, never a weaker one. A number means the semantic-similarity
  // fallback matched it instead. Previously this defaulted to 0 and rendered as a misleading
  // "0% Match" badge on every exact-matched course — the majority of real recommendations.
  matchScore: number | null; // e.g. 94, or null for an exact/deterministic match
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  modules: {
    title: string;
    duration: string;
    topics: string[];
  }[];
  prerequisites: string[];
  learningOutcomes: string[];
  certificationOffered: boolean;
}

export interface LearningPathStep {
  stepNumber: number;
  courseId: string;
  courseTitle: string;
  provider: string;
  competenciesAddressed: string[];
  durationText: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  status: 'COMPLETED' | 'IN_PROGRESS' | 'UPCOMING';
  targetGapSummary: string;
  projectedReadinessContribution: number; // +8%
  keyMilestones: string[];
}

export interface LearningPath {
  candidateId: string;
  targetRoleId: string;
  currentReadiness: number; // 72%
  projectedReadiness: number; // 89%
  gapCountTotal: number;
  projectedGapsClosed: number; // 5
  totalEstimatedHours: number;
  steps: LearningPathStep[];
}

// ---------------------------------------------------------------------------
// Real backend contract types (Task 11 — Frontend Foundation)
//
// These mirror backend/src/schemas/*.py field-for-field (snake_case, as the API actually returns
// them). Mapping into the camelCase UI types above happens in services/api.ts / AppContext.tsx —
// these are not renamed to match the UI shapes so the API client stays a faithful, checkable
// reflection of the real contracts in specs/004-011's contracts/api.md.
// ---------------------------------------------------------------------------

export interface ApiRoleSummary {
  id: string;
  name: string;
  description: string;
}

export interface ApiRequiredCompetency {
  competency_id: string;
  name: string;
  required_level: number;
  priority: number;
}

export interface ApiRoleDetail extends ApiRoleSummary {
  required_competencies: ApiRequiredCompetency[];
}

export interface ApiCompetencySummary {
  id: string;
  name: string;
  description: string;
  parent_competency_id: string | null;
}

export interface ApiCourseSummary {
  id: string;
  title: string;
  description: string;
  provider: string;
  level: string;
  duration_hours: number;
  competencies_covered: string[];
}

export interface ApiInitialProfileItem {
  competency_id: string;
  competency_name: string;
  resume_estimated_level: number;
  resume_confidence: ConfidenceLevel;
  evidence_snippet: string | null;
}

export interface ApiResumeUploadResponse {
  candidate_id: string;
  source: string;
  initial_profile: ApiInitialProfileItem[];
}

export interface ApiTargetRoleSelectionResponse {
  candidate_id: string;
  role: ApiRoleDetail;
}

export interface ApiStartAssessmentResponse {
  session_id: string;
  status: string;
  question_budget: number;
}

export interface ApiNextQuestionResponse {
  question_id: string;
  competency_id: string;
  difficulty: number;
  sequence_number: number;
  prompt: string;
  options: string[];
  source: 'mistral' | 'seed';
}

export interface ApiSessionCompletedResponse {
  status: 'completed';
  message: string;
}

export interface ApiAnswerResponse {
  is_correct: boolean;
  competency_id: string;
  updated_confidence: number;
  updated_difficulty: number;
  session_status: string;
}

export interface ApiProfileCompetencyItem {
  competency_id: string;
  questions_answered: number;
  correct_count: number;
  confidence_state: number;
}

export interface ApiVerifiedProfileItem {
  competency_id: string;
  competency_name: string;
  resume_estimated_level: number | null;
  resume_confidence: number | null;
  verified_level: number;
  verified_confidence: number;
}

export interface ApiProfileResponse {
  session_id: string;
  status: string;
  competencies: ApiProfileCompetencyItem[];
  verified_profile: ApiVerifiedProfileItem[];
}

export interface ApiAnalysisResponse {
  analysis_id: string;
  candidate_id: string;
  target_role_id: string;
}

export interface ApiSkillGapItem {
  competency_id: string;
  competency_name: string;
  required_level: number;
  verified_level: number;
  gap: number;
  rank: number;
}

export interface ApiGapsResponse {
  analysis_id: string;
  gaps: ApiSkillGapItem[];
}

export interface ApiCourseRecommendationItem {
  course_id: string;
  title: string;
  matched_gaps: string[];
  match_reason: string;
  match_score: number | null;
}

export interface ApiCoursesResponse {
  analysis_id: string;
  recommendations: ApiCourseRecommendationItem[];
  unmatched_gaps: string[];
}

export interface ApiLearningPathStepItem {
  step_number: number;
  course_id: string;
  title: string;
  addresses_gaps: string[];
  rationale: string | null;
}

export interface ApiGroundingReport {
  supported_claims: string[];
  removed_claims: string[];
  grounded: boolean;
}

export interface ApiLearningPathResponse {
  learning_path_id: string;
  analysis_id: string;
  steps: ApiLearningPathStepItem[];
  gaps_without_courses: string[];
  message: string | null;
  // Phase 6 (specs/026-phase-6-evidence-rag-mcp): additive field. Non-null when the RAG-grounded
  // planner succeeded, null when the deterministic fallback was used. Optional too, so an older
  // cached response missing the field entirely still type-checks and renders unchanged.
  grounding?: ApiGroundingReport | null;
}
