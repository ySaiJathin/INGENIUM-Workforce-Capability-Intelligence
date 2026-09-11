import {
  ApiRoleSummary,
  ApiRoleDetail,
  ApiCompetencySummary,
  ApiCourseSummary,
  ApiResumeUploadResponse,
  ApiTargetRoleSelectionResponse,
  ApiStartAssessmentResponse,
  ApiNextQuestionResponse,
  ApiSessionCompletedResponse,
  ApiAnswerResponse,
  ApiProfileResponse,
  ApiAnalysisResponse,
  ApiGapsResponse,
  ApiCoursesResponse,
  ApiLearningPathResponse
} from '../types';
import { apiFetch } from './httpClient';

// Real backend client (Task 11 — Frontend Foundation). Every method here corresponds 1:1 to an
// endpoint already implemented in backend/src/api/*.py — see specs/012.../tasks.md's contract
// table for the full verb+path+schema mapping. Method names are kept where the prototype already
// had a matching one (FR-002/FR-008); new methods are added for endpoints the prototype's original
// mock design never anticipated (session-based assessment, analysis-keyed gaps/courses/learning
// path). No method here silently swallows a failure — every ApiError thrown by httpClient
// propagates to the caller so AppContext/screens can render ErrorState.
export class WorkforceIntelligenceAPI {
  /** GET /roles */
  static async getTargetRoles(): Promise<ApiRoleSummary[]> {
    return apiFetch<ApiRoleSummary[]>('/roles');
  }

  /** GET /roles/{roleId} */
  static async getRoleRequirements(roleId: string): Promise<ApiRoleDetail> {
    return apiFetch<ApiRoleDetail>(`/roles/${roleId}`);
  }

  /** GET /competencies */
  static async getCompetencies(): Promise<ApiCompetencySummary[]> {
    return apiFetch<ApiCompetencySummary[]>('/competencies');
  }

  /** GET /courses — backs both the course catalog list and (via client-side filter) course detail. */
  static async getAllCourses(): Promise<ApiCourseSummary[]> {
    return apiFetch<ApiCourseSummary[]>('/courses');
  }

  /**
   * Retrieve detailed information for a single course — no single-course backend endpoint exists,
   * so this filters the already-fetched course list rather than making a second network call.
   */
  static getCourseDetails(courseId: string, allCourses: ApiCourseSummary[]): ApiCourseSummary | null {
    return allCourses.find(c => c.id === courseId) || null;
  }

  /** POST /candidates/resume (multipart) */
  static async uploadResume(file: File): Promise<ApiResumeUploadResponse> {
    const formData = new FormData();
    formData.append('resume', file);
    return apiFetch<ApiResumeUploadResponse>('/candidates/resume', {
      method: 'POST',
      body: formData
    });
  }

  /** POST /candidates/demo — Task 16. Same response shape as uploadResume (source: "demo"), so
   * "Try Demo Candidate" needs no branching beyond this one call (FR-001). */
  static async startDemoCandidate(): Promise<ApiResumeUploadResponse> {
    return apiFetch<ApiResumeUploadResponse>('/candidates/demo', {
      method: 'POST'
    });
  }

  /** POST /candidates/{candidateId}/target-role */
  static async selectTargetRole(candidateId: string, roleId: string): Promise<ApiTargetRoleSelectionResponse> {
    return apiFetch<ApiTargetRoleSelectionResponse>(`/candidates/${candidateId}/target-role`, {
      method: 'POST',
      body: { role_id: roleId }
    });
  }

  /** POST /assessment/start */
  static async startAssessment(candidateId: string, targetRoleId: string): Promise<ApiStartAssessmentResponse> {
    return apiFetch<ApiStartAssessmentResponse>('/assessment/start', {
      method: 'POST',
      body: { candidate_id: candidateId, target_role_id: targetRoleId }
    });
  }

  /** GET /assessment/{sessionId}/next-question */
  static async getNextQuestion(sessionId: string): Promise<ApiNextQuestionResponse | ApiSessionCompletedResponse> {
    return apiFetch<ApiNextQuestionResponse | ApiSessionCompletedResponse>(
      `/assessment/${sessionId}/next-question`
    );
  }

  /** POST /assessment/{sessionId}/answer */
  static async submitAnswer(
    sessionId: string,
    questionId: string,
    selectedIndex: number
  ): Promise<ApiAnswerResponse> {
    return apiFetch<ApiAnswerResponse>(`/assessment/${sessionId}/answer`, {
      method: 'POST',
      body: { question_id: questionId, selected_index: selectedIndex }
    });
  }

  /** GET /assessment/{sessionId}/profile */
  static async getAssessmentProfile(sessionId: string): Promise<ApiProfileResponse> {
    return apiFetch<ApiProfileResponse>(`/assessment/${sessionId}/profile`);
  }

  /** POST /analysis */
  static async createAnalysis(candidateId: string, targetRoleId: string): Promise<ApiAnalysisResponse> {
    return apiFetch<ApiAnalysisResponse>('/analysis', {
      method: 'POST',
      body: { candidate_id: candidateId, target_role_id: targetRoleId }
    });
  }

  /** GET /analysis/{analysisId}/gaps */
  static async getSkillGaps(analysisId: string): Promise<ApiGapsResponse> {
    return apiFetch<ApiGapsResponse>(`/analysis/${analysisId}/gaps`);
  }

  /** GET /analysis/{analysisId}/courses */
  static async getCourseRecommendations(analysisId: string): Promise<ApiCoursesResponse> {
    return apiFetch<ApiCoursesResponse>(`/analysis/${analysisId}/courses`);
  }

  /** POST /learning-path */
  static async createLearningPath(analysisId: string): Promise<ApiLearningPathResponse> {
    return apiFetch<ApiLearningPathResponse>('/learning-path', {
      method: 'POST',
      body: { analysis_id: analysisId }
    });
  }

  /** GET /learning-path/{learningPathId} */
  static async getLearningPath(learningPathId: string): Promise<ApiLearningPathResponse> {
    return apiFetch<ApiLearningPathResponse>(`/learning-path/${learningPathId}`);
  }
}
