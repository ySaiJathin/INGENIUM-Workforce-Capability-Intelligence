import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/layout/PageHeader';
import { MetricCard } from '../components/ui/MetricCard';
import { ComparisonBar } from '../components/ui/ComparisonBar';
import { StatusBadge } from '../components/ui/StatusBadge';
import { CompetencyLevelBadge } from '../components/ui/CompetencyLevelBadge';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import {
  ShieldCheck,
  Award,
  Target,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Layers,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

export const AssessmentResults: React.FC = () => {
  const navigate = useNavigate();
  const { assessmentResults, targetRole, candidate, loading, errors } = useApp();

  if (loading.assessmentProfile) {
    return <LoadingState label="Verifying your assessment results…" />;
  }
  if (errors.assessmentProfile) {
    return <ErrorState error={errors.assessmentProfile} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assessment Complete — Verified Profile"
        subtitle={`Capability evaluation verified against ${targetRole.title} (${targetRole.department})`}
        backPath="/assessment"
        nextPath="/gaps"
        nextLabel="View Skill Gap Analysis"
        breadcrumbs={[
          { label: 'Assessment', path: '/assessment' },
          { label: 'Verified Results' }
        ]}
        actions={
          <button
            onClick={() => navigate('/gaps')}
            className="btn-primary text-xs flex items-center gap-2"
          >
            <Target className="w-4 h-4 text-blue-300" />
            <span>Diagnose Skill Gaps</span>
          </button>
        }
      />

      {/* Hero Readiness Card */}
      <div className="card-enterprise p-6 lg:p-8 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 text-white">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Psychometric Verification Finalized</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold">Overall Role Readiness</h2>
            <p className="text-xs text-slate-300 max-w-lg">
              Calculated by benchmarking verified competency proficiencies against mandatory {targetRole.title} cadre requirements.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm p-5 rounded-2xl border border-white/15">
            <div className="text-center">
              <span className="text-4xl sm:text-5xl font-black tracking-tight text-white font-mono">
                {assessmentResults.roleReadinessScore}%
              </span>
              <span className="block text-[11px] font-mono uppercase tracking-wider text-slate-300 font-semibold mt-1">
                Readiness Score
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Key Summary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Competencies Assessed"
          value={assessmentResults.competenciesAssessedCount}
          subtext="Covering core role areas"
          icon={<Layers className="w-5 h-5 text-blue-600" />}
        />
        <MetricCard
          label="Role Ready Competencies"
          value={assessmentResults.strongCount}
          subtext="Meeting or exceeding target"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
        />
        <MetricCard
          label="Developing Areas"
          value={assessmentResults.developingCount}
          subtext="Minor level enhancement needed"
          icon={<TrendingUp className="w-5 h-5 text-amber-600" />}
        />
        <MetricCard
          label="Priority Skill Gaps"
          value={assessmentResults.priorityGapsCount}
          subtext="Critical roadblocks for role"
          icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
          highlight={true}
        />
      </div>

      {/* Verified vs Target Comparison Chart */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Verified Capability vs Required Role Standard
            </h3>
            <p className="text-xs text-slate-500">
              Direct comparison between candidate verified score and official job cadre expectation
            </p>
          </div>
          <span className="text-xs text-slate-500 font-medium hidden sm:inline">
            Verified via adaptive probing
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {assessmentResults.competencyEvaluations.map((evalItem) => (
            <ComparisonBar
              key={evalItem.competencyId}
              name={evalItem.competencyName}
              candidateLevel={evalItem.verifiedLevel}
              requiredLevel={evalItem.requiredLevel}
              initialLevel={evalItem.initialLevel}
            />
          ))}
        </div>
      </div>

      {/* Evaluation Breakdown Table */}
      <div className="card-enterprise overflow-hidden">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold">Comprehensive Evaluation Feedback</h3>
            <p className="text-[11px] text-slate-300">Detailed psychometric breakdown and verified level shifts</p>
          </div>
        </div>

        <div className="divide-y divide-slate-200 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Competency</th>
                <th className="py-3 px-4">Initial Resume Level</th>
                <th className="py-3 px-4">Verified Level</th>
                <th className="py-3 px-4">Required Level</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Psychometric Observation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assessmentResults.competencyEvaluations.map((item) => (
                <tr key={item.competencyId} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                    {item.competencyName}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="font-mono text-slate-500">Level {item.initialLevel} (Unverified)</span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <CompetencyLevelBadge level={item.verifiedLevel} />
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <CompetencyLevelBadge level={item.requiredLevel} />
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <StatusBadge status={item.status} size="sm" />
                  </td>
                  <td className="py-3 px-4 text-slate-600 max-w-sm">
                    {item.feedback}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
