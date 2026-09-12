// Translation layer between the real backend's snake_case/float contracts (types/index.ts's
// `Api*` interfaces) and the prototype's already-styled camelCase UI types. Isolating the mapping
// here means every already-built screen keeps reading the same UI shapes it always has (Rule 10),
// while this is the one place a scale/shape mismatch gets reconciled (research.md §5).

import {
  ApiInitialProfileItem,
  ApiRoleSummary,
  ApiRoleDetail,
  ApiCourseSummary,
  ApiVerifiedProfileItem,
  ApiSkillGapItem,
  ApiCourseRecommendationItem,
  ApiLearningPathStepItem,
  CompetencyLevelNumber,
  ConfidenceLevel,
  InitialCapabilityItem,
  TargetRole,
  Course,
  VerifiedCapabilityItem,
  SkillGap,
  LearningPathStep,
  CapabilityStatus
} from '../types';

/** Clamp/round a backend float level onto the UI's 1-4 integer scale. */
export function toLevelNumber(level: number | null | undefined): CompetencyLevelNumber {
  if (level == null || Number.isNaN(level)) return 1;
  const rounded = Math.round(level);
  return Math.min(4, Math.max(1, rounded)) as CompetencyLevelNumber;
}

/** Bucket a backend confidence float (0-1) into the UI's categorical HIGH/MEDIUM/LOW. */
export function toConfidenceLevel(confidence: number | null | undefined): ConfidenceLevel {
  if (confidence == null || Number.isNaN(confidence)) return 'LOW';
  if (confidence >= 0.75) return 'HIGH';
  if (confidence >= 0.45) return 'MEDIUM';
  return 'LOW';
}

function statusFor(verified: CompetencyLevelNumber, required: CompetencyLevelNumber): CapabilityStatus {
  const gap = required - verified;
  if (gap <= 0) return 'READY';
  if (gap === 1) return 'DEVELOPING';
  if (gap === 2) return 'GAP';
  return 'CRITICAL_GAP';
}

export function mapInitialProfileItem(item: ApiInitialProfileItem): InitialCapabilityItem {
  return {
    competencyId: item.competency_id,
    competencyName: item.competency_name,
    category: 'Technical',
    estimatedLevel: toLevelNumber(item.resume_estimated_level),
    evidence: item.evidence_snippet || 'No evidence snippet extracted.',
    confidence: item.resume_confidence,
    verificationStatus: 'NEEDS_ASSESSMENT'
  };
}

const EMPTY_TARGET_ROLE: TargetRole = {
  id: '',
  title: '',
  department: '',
  band: '',
  summary: '',
  description: '',
  competencyCount: 0,
  criticalFocus: [],
  requiredCompetencies: []
};

export function emptyTargetRole(): TargetRole {
  return { ...EMPTY_TARGET_ROLE };
}

export function mapRoleSummaryToTargetRole(role: ApiRoleSummary): TargetRole {
  return {
    id: role.id,
    title: role.name,
    department: '',
    band: '',
    summary: role.description,
    description: role.description,
    competencyCount: 0,
    criticalFocus: [],
    requiredCompetencies: []
  };
}

export function mapRoleDetailToTargetRole(role: ApiRoleDetail): TargetRole {
  return {
    id: role.id,
    title: role.name,
    department: '',
    band: '',
    summary: role.description,
    description: role.description,
    competencyCount: role.required_competencies.length,
    criticalFocus: role.required_competencies
      .slice()
      .sort((a, b) => a.priority - b.priority)
      .slice(0, 3)
      .map(c => c.name),
    requiredCompetencies: role.required_competencies.map(c => ({
      competencyId: c.competency_id,
      competencyName: c.name,
      category: 'Technical',
      requiredLevel: toLevelNumber(c.required_level),
      isCore: c.priority === 1,
      importance: c.priority === 1 ? 'CRITICAL' : c.priority === 2 ? 'HIGH' : 'MEDIUM',
      rationale: `Mandated at priority ${c.priority} for this role's official competency standard.`
    }))
  };
}

export function mapCourseSummary(course: ApiCourseSummary): Course {
  const validProviders: Course['provider'][] = [
    'iGOT Karmayogi',
    'National Statistical Academy',
    'Ministry of Statistics (MoSPI)',
    'UN Statistics Division',
    'GovTech Institute'
  ];
  const provider = (validProviders.includes(course.provider as Course['provider'])
    ? course.provider
    : 'iGOT Karmayogi') as Course['provider'];

  return {
    id: course.id,
    title: course.title,
    provider,
    providerBadge: course.provider,
    durationHours: course.duration_hours,
    difficulty:
      course.level?.toLowerCase() === 'advanced'
        ? 'Advanced'
        : course.level?.toLowerCase() === 'intermediate'
        ? 'Intermediate'
        : 'Foundation',
    rating: 4.5,
    reviewsCount: 0,
    format: 'Self-Paced Interactive',
    overview: course.description,
    targetGapCompetencies: course.competencies_covered,
    closesGapDescription: course.description,
    expectedPathway: { fromLevel: 1, toLevel: 4 },
    matchScore: null,
    priority: 'MEDIUM',
    modules: [],
    prerequisites: [],
    learningOutcomes: [],
    certificationOffered: false
  };
}

export function applyCourseRecommendation(course: Course, rec: ApiCourseRecommendationItem): Course {
  return {
    ...course,
    matchScore: rec.match_score != null ? Math.round(rec.match_score * 100) : course.matchScore,
    closesGapDescription: rec.match_reason || course.closesGapDescription,
    targetGapCompetencies: rec.matched_gaps.length ? rec.matched_gaps : course.targetGapCompetencies
  };
}

export function mapVerifiedProfileItem(
  item: ApiVerifiedProfileItem,
  requiredLevelByCompetency: Record<string, number>
): VerifiedCapabilityItem {
  const verifiedLevel = toLevelNumber(item.verified_level);
  const targetLevel = toLevelNumber(requiredLevelByCompetency[item.competency_id] ?? item.verified_level);
  const hasResume = item.resume_estimated_level != null;

  return {
    competencyId: item.competency_id,
    competencyName: item.competency_name,
    category: 'Technical',
    verifiedLevel,
    targetLevel,
    confidence: toConfidenceLevel(item.verified_confidence),
    evidence: hasResume ? 'BOTH' : 'ASSESSMENT',
    status: statusFor(verifiedLevel, targetLevel),
    notes: hasResume
      ? `Resume estimated Level ${toLevelNumber(item.resume_estimated_level)}; adaptive assessment verified Level ${verifiedLevel}.`
      : `Verified via adaptive assessment at Level ${verifiedLevel}.`
  };
}

export function mapSkillGapItem(item: ApiSkillGapItem): SkillGap {
  const currentLevel = toLevelNumber(item.verified_level);
  const requiredLevel = toLevelNumber(item.required_level);
  const magnitude = Math.max(0, requiredLevel - currentLevel);

  return {
    id: `gap-${item.competency_id}`,
    competencyId: item.competency_id,
    competencyName: item.competency_name,
    category: 'Technical',
    currentLevel,
    requiredLevel,
    gapMagnitude: magnitude,
    priority: item.rank <= 1 ? 'CRITICAL' : item.rank <= 3 ? 'HIGH' : 'MEDIUM',
    whyItMatters: `A ${magnitude}-level gap against the role's required standard for ${item.competency_name}.`,
    recommendedAction: `Complete targeted training to raise ${item.competency_name} to Level ${requiredLevel}.`,
    expectedTimelineWeeks: magnitude * 4,
    impactArea: item.competency_name
  };
}

export function mapLearningPathStep(step: ApiLearningPathStepItem, matchedCourse?: Course): LearningPathStep {
  return {
    stepNumber: step.step_number,
    courseId: step.course_id,
    courseTitle: step.title,
    provider: matchedCourse?.provider || '',
    competenciesAddressed: step.addresses_gaps,
    durationText: matchedCourse ? `${matchedCourse.durationHours} Hours` : '',
    priority: matchedCourse?.priority || 'MEDIUM',
    status: 'UPCOMING',
    targetGapSummary: step.rationale || '',
    projectedReadinessContribution: 4,
    keyMilestones: ['Enrolled into curriculum', 'Practical assessment submission']
  };
}
