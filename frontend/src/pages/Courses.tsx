import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/layout/PageHeader';
import { CourseCard } from '../components/courses/CourseCard';
import { MetricCard } from '../components/ui/MetricCard';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Building2,
  AlertTriangle
} from 'lucide-react';

export const Courses: React.FC = () => {
  const navigate = useNavigate();
  const {
    recommendedCourses,
    unmatchedGapCompetencyIds,
    learningPath,
    skillGaps,
    targetRole,
    loading,
    errors
  } = useApp();

  if (loading.courses || loading.courseRecommendations) {
    return <LoadingState label="Loading recommended courses…" />;
  }
  if (errors.courses) {
    return <ErrorState error={errors.courses} />;
  }
  // Independent of the catalog-load error above (FR-009/SC-003): the recommendation call itself can
  // fail without the catalog fetch having failed — previously this was tracked in context but never
  // read anywhere, so this failure mode was completely invisible.
  if (errors.courseRecommendations) {
    return <ErrorState error={errors.courseRecommendations} />;
  }

  const unmatchedGapNames = unmatchedGapCompetencyIds.map(
    id => skillGaps.find(g => g.competencyId === id)?.competencyName || id
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recommended Learning Catalog"
        subtitle={`Targeted courses matched directly against ${skillGaps.length} identified capability gaps`}
        backPath="/gaps"
        nextPath="/learning-path"
        nextLabel="View Personalized Learning Path"
        breadcrumbs={[
          { label: 'Skill Gaps', path: '/gaps' },
          { label: 'Course Recommendations' }
        ]}
        actions={
          <button
            onClick={() => navigate('/learning-path')}
            className="btn-primary text-xs flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-blue-300" />
            <span>View Ordered Learning Sequence</span>
          </button>
        }
      />

      {/* Rationale Banner */}
      <div className="card-enterprise p-5 bg-gradient-to-r from-blue-900 to-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-blue-300" />
          </div>
          <div>
            <h3 className="text-sm font-bold">Government & Civil Service Vetted Catalog</h3>
            <p className="text-xs text-slate-300">
              Curated from iGOT Karmayogi, National Statistical Academy, and Ministry of Statistics training repositories.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono bg-black/20 px-3 py-1.5 rounded-lg border border-white/10">
          <span className="text-blue-300 font-bold">{learningPath.steps.length}</span>
          <span className="text-slate-300">Courses Added to Path</span>
        </div>
      </div>

      {/* Unmatched Gaps Banner (FR-008/SC-002 — never silently omit a gap with no course) */}
      {unmatchedGapNames.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <strong className="font-bold">No course currently available for:</strong>{' '}
            {unmatchedGapNames.join(', ')} — flagged for curriculum review rather than silently
            omitted from this recommendation list.
          </div>
        </div>
      )}

      {/* Course Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">
            Gap-Matched Course Recommendations ({recommendedCourses.length})
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            Ranked by capability gap severity & match precision
          </span>
        </div>

        {recommendedCourses.length === 0 ? (
          <div className="card-enterprise p-8 flex flex-col items-center text-center gap-2 bg-emerald-50/60 border-emerald-200">
            <ShieldCheck className="w-8 h-8 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900">No courses currently recommended</h3>
            <p className="text-xs text-slate-600 max-w-md">
              {skillGaps.length === 0
                ? 'You meet all requirements for this role, so no remedial courses were matched.'
                : 'No courses in the catalog matched your identified gaps.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {recommendedCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
