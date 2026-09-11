import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/layout/PageHeader';
import { LearningPathTimeline } from '../components/learning/LearningPathTimeline';
import { MetricCard } from '../components/ui/MetricCard';
import { ProgressBar } from '../components/ui/ProgressBar';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import {
  Sparkles,
  Award,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  BookOpen,
  Layers,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export const LearningPath: React.FC = () => {
  const navigate = useNavigate();
  const {
    learningPath,
    targetRole,
    candidate,
    generateLearningPath,
    skillGaps,
    gapsWithoutCoursesCompetencyIds,
    loading,
    errors
  } = useApp();

  useEffect(() => {
    // Task 16: a demo candidate now runs the identical real-backend flow (found and fixed live via
    // Chrome, alongside the same bug in Assessment.tsx) — this must fire for both entry points.
    if (learningPath.steps.length === 0 && !loading.learningPath) {
      generateLearningPath();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading.learningPath) {
    return <LoadingState label="Sequencing your personalized learning path…" />;
  }
  if (errors.learningPath) {
    return <ErrorState error={errors.learningPath} onRetry={generateLearningPath} />;
  }

  const hasSteps = learningPath.steps.length > 0;
  const gapsWithoutCoursesNames = gapsWithoutCoursesCompetencyIds.map(
    id => skillGaps.find(g => g.competencyId === id)?.competencyName || id
  );
  const completedStepsCount = learningPath.steps.filter((s) => s.status === 'COMPLETED').length;
  const inProgressStepsCount = learningPath.steps.filter((s) => s.status === 'IN_PROGRESS').length;
  const progressPercentage = hasSteps ? Math.round((completedStepsCount / learningPath.steps.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Personalized Learning Path"
        subtitle={`Targeted curriculum sequence engineered to close critical competency gaps for ${targetRole.title}`}
        backPath="/courses"
        nextPath="/dashboard"
        nextLabel="View Executive Summary Dashboard"
        breadcrumbs={[
          { label: 'Courses', path: '/courses' },
          { label: 'Personalized Learning Path' }
        ]}
        actions={
          <button
            onClick={() => navigate('/courses')}
            className="btn-secondary text-xs flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5 text-slate-600" />
            <span>Explore More Courses</span>
          </button>
        }
      />

      {/* Hero Projected Readiness Impact Banner */}
      <div className="card-enterprise p-6 lg:p-8 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-blue-300" />
              <span>Targeted Upskilling Trajectory</span>
            </div>
            <h2 className="text-2xl font-bold">Projected Role Alignment</h2>
            <p className="text-xs text-slate-300 max-w-lg">
              Upon successful completion of the sequenced curriculum below, candidate capability is projected to advance across all {learningPath.projectedGapsClosed} target gap areas.
            </p>
          </div>

          <div className="flex items-center gap-6 bg-white/10 backdrop-blur-md p-4 px-6 rounded-2xl border border-white/15">
            <div className="text-center">
              <span className="text-xs font-mono uppercase text-slate-300 block font-semibold">Current</span>
              <span className="text-3xl font-black text-slate-200 font-mono">{learningPath.currentReadiness}%</span>
            </div>
            <ArrowRight className="w-5 h-5 text-blue-400" />
            <div className="text-center">
              <span className="text-xs font-mono uppercase text-emerald-300 block font-semibold">Projected</span>
              <span className="text-3xl font-black text-emerald-400 font-mono">{learningPath.projectedReadiness}%</span>
            </div>
          </div>
        </div>

        {/* Path Progress Metric */}
        {hasSteps && (
          <div className="pt-5 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>Curriculum Progression</span>
              <span className="font-mono">{completedStepsCount} of {learningPath.steps.length} Steps Completed</span>
            </div>
            <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden border border-white/10">
              <div
                className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Sequenced Modules"
          value={learningPath.steps.length}
          subtext="Ordered by gap priority"
          icon={<Layers className="w-5 h-5 text-blue-600" />}
        />
        <MetricCard
          label="Total Learning Hours"
          value={`${learningPath.totalEstimatedHours}h`}
          subtext="Self-paced & cohort labs"
          icon={<Clock className="w-5 h-5 text-indigo-600" />}
        />
        <MetricCard
          label="Gaps Projected Closed"
          value={`${learningPath.projectedGapsClosed} / ${learningPath.gapCountTotal}`}
          subtext="Covering critical deficiencies"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
        />
        <MetricCard
          label="Projected Readiness Lift"
          value={`+${learningPath.projectedReadiness - learningPath.currentReadiness}%`}
          subtext="Expected competency bump"
          icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
          highlight={true}
        />
      </div>

      {/* Critical Projected Improvement Disclaimer */}
      <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed">
          <strong className="font-bold">Institutional Note:</strong> Projected readiness improvements represent estimated gains contingent upon passing course practical labs and post-training adaptive re-evaluations. They are not represented as actual measured improvements until verified.
        </div>
      </div>

      {/* Unmatched Gaps Banner (FR-008/SC-002 — never silently omit a gap with no course) */}
      {gapsWithoutCoursesNames.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <strong className="font-bold">No course currently available for:</strong>{' '}
            {gapsWithoutCoursesNames.join(', ')} — these gaps could not be sequenced into this
            learning path and are flagged for curriculum review.
          </div>
        </div>
      )}

      {/* Timeline Progression */}
      {hasSteps ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Ordered Learning Sequence (High-Impact Gaps First)
              </h3>
              <p className="text-xs text-slate-500">
                Click any step circle to simulate milestone progression
              </p>
            </div>
          </div>

          <LearningPathTimeline steps={learningPath.steps} />
        </div>
      ) : (
        <div className="card-enterprise p-8 flex flex-col items-center text-center gap-2 bg-emerald-50/60 border-emerald-200">
          <ShieldCheck className="w-8 h-8 text-emerald-600" />
          <h3 className="text-base font-bold text-slate-900">No further learning is required</h3>
          <p className="text-xs text-slate-600 max-w-md">
            You already meet all target competency requirements for {targetRole.title} — there are no
            remaining gaps to sequence a curriculum against.
          </p>
        </div>
      )}
    </div>
  );
};
