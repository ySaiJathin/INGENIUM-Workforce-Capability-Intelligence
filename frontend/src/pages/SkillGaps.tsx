import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/layout/PageHeader';
import { GapCard } from '../components/competency/GapCard';
import { ComparisonBar } from '../components/ui/ComparisonBar';
import { MetricCard } from '../components/ui/MetricCard';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import {
  Target,
  AlertTriangle,
  GraduationCap,
  ArrowRight,
  TrendingDown,
  Sparkles,
  Flame,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';

export const SkillGaps: React.FC = () => {
  const navigate = useNavigate();
  const { skillGaps, targetRole, assessmentResults, verifiedProfile, loading, errors } = useApp();

  if (loading.gaps) {
    return <LoadingState label="Diagnosing capability gaps…" />;
  }
  // A failed analysis (POST /analysis) means gaps were never fetched at all — distinct from a
  // genuinely gap-free candidate, so it takes priority over the "no gaps" empty state below.
  if (errors.analysis) {
    return <ErrorState error={errors.analysis} />;
  }
  if (errors.gaps) {
    return <ErrorState error={errors.gaps} />;
  }

  const criticalGapsCount = skillGaps.filter((g) => g.priority === 'CRITICAL').length;
  const highGapsCount = skillGaps.filter((g) => g.priority === 'HIGH').length;
  const mediumGapsCount = skillGaps.filter((g) => g.priority === 'MEDIUM').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Capability Gap Analysis"
        subtitle={`Precision diagnosis of skill deficits measured against ${targetRole.title} benchmark standards`}
        backPath="/capability"
        nextPath="/courses"
        nextLabel="View Recommended Courses"
        breadcrumbs={[
          { label: 'Verified Profile', path: '/capability' },
          { label: 'Skill Gap Diagnosis' }
        ]}
        actions={
          <button
            onClick={() => navigate('/courses')}
            className="btn-primary text-xs flex items-center gap-2"
          >
            <GraduationCap className="w-4 h-4 text-blue-300" />
            <span>Map Gaps to Learning Catalog</span>
          </button>
        }
      />

      {/* Summary Scorecard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Role Readiness Index"
          value={`${assessmentResults.roleReadinessScore}%`}
          subtext="Target role alignment"
          icon={<Target className="w-5 h-5 text-blue-600" />}
        />
        <MetricCard
          label="Total Identified Gaps"
          value={skillGaps.length}
          subtext="Requiring targeted upskilling"
          icon={<TrendingDown className="w-5 h-5 text-amber-600" />}
        />
        <MetricCard
          label="Critical Priority Gaps"
          value={criticalGapsCount}
          subtext="Immediate performance barrier"
          icon={<Flame className="w-5 h-5 text-rose-600" />}
          highlight={true}
        />
        <MetricCard
          label="Moderate / High Gaps"
          value={highGapsCount + mediumGapsCount}
          subtext="Secondary enhancement areas"
          icon={<AlertTriangle className="w-5 h-5 text-amber-600" />}
        />
      </div>

      {/* Fast 5-Second Visual Gap Comparison Chart */}
      <div className="card-enterprise p-6 bg-white space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Visual Capability Gap Matrix (5-Second Executive Overview)
            </h3>
            <p className="text-xs text-slate-500">
              Clear visual juxtaposition of officer's verified proficiency vs mandatory cadre requirements
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-600" /> Verified Level
            </span>
            <span className="flex items-center gap-1 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-sm bg-slate-800" /> Role Target
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {verifiedProfile.map((item) => (
            <ComparisonBar
              key={item.competencyId}
              name={item.competencyName}
              category={item.category}
              candidateLevel={item.verifiedLevel}
              requiredLevel={item.targetLevel}
            />
          ))}
        </div>
      </div>

      {/* Detailed Gap Diagnosis Cards */}
      {skillGaps.length === 0 ? (
        <div className="card-enterprise p-8 flex flex-col items-center text-center gap-2 bg-emerald-50/60 border-emerald-200">
          <ShieldCheck className="w-8 h-8 text-emerald-600" />
          <h3 className="text-base font-bold text-slate-900">You meet all requirements for this role</h3>
          <p className="text-xs text-slate-600 max-w-md">
            No significant skill gaps were identified against {targetRole.title}'s required competencies.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Diagnosed Capability Gaps & Remediation Pathways ({skillGaps.length})
            </h3>
            <p className="text-xs text-slate-500">
              Each gap explains the operational impact on the organization and links to targeted training
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {skillGaps.map((gap) => (
              <GapCard key={gap.id} gap={gap} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
