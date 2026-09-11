import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/layout/PageHeader';
import { MetricCard } from '../components/ui/MetricCard';
import { ComparisonBar } from '../components/ui/ComparisonBar';
import { StatusBadge } from '../components/ui/StatusBadge';
import {
  Building2,
  Award,
  Target,
  GraduationCap,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Clock,
  CheckCircle2,
  FileText
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const {
    candidate,
    targetRole,
    assessmentResults,
    skillGaps,
    learningPath,
    recommendedCourses,
    verifiedProfile
  } = useApp();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Executive Summary & Capability Intelligence Dossier"
        subtitle="Consolidated workforce intelligence summary for ministry planning and cadre advancement"
        breadcrumbs={[
          { label: 'Ingenium', path: '/' },
          { label: 'Executive Dossier' }
        ]}
        actions={
          <button
            onClick={() => navigate('/gaps')}
            className="btn-primary text-xs flex items-center gap-1.5"
          >
            <span>View Full Gap Analysis</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        }
      />

      {/* Top Officer Snapshot Card */}
      <div className="card-enterprise p-6 bg-white flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white font-bold text-lg flex items-center justify-center border border-slate-700">
            {candidate.name.split(' ').map((n) => n[0]).join('')}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">{candidate.name}</h2>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold border border-slate-200">
                {candidate.employeeCode}
              </span>
            </div>
            <p className="text-xs font-semibold text-blue-700 mt-0.5">
              {candidate.designation} • {candidate.department}
            </p>
            <p className="text-[11px] text-slate-400">
              Cadre: {candidate.cadre} ({candidate.yearsOfExperience} Years Experience)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
          <div>
            <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block">
              Target Benchmark Role
            </span>
            <span className="text-sm font-bold text-slate-900">{targetRole.title}</span>
            <span className="block text-[11px] text-slate-500 font-mono">{targetRole.band}</span>
          </div>
        </div>
      </div>

      {/* 4 High-Density Key Indicator Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Verified Readiness"
          value={`${assessmentResults.roleReadinessScore}%`}
          subtext="Based on adaptive test"
          icon={<ShieldCheck className="w-5 h-5 text-emerald-600" />}
          highlight={true}
        />
        <MetricCard
          label="Projected Alignment"
          value={`${learningPath.projectedReadiness}%`}
          subtext={`+${learningPath.projectedReadiness - assessmentResults.roleReadinessScore}% upon path completion`}
          icon={<TrendingUp className="w-5 h-5 text-blue-600" />}
        />
        <MetricCard
          label="Priority Skill Gaps"
          value={skillGaps.length}
          subtext="Critical roadblocks identified"
          icon={<Target className="w-5 h-5 text-amber-600" />}
        />
        <MetricCard
          label="Active Learning Hours"
          value={`${learningPath.totalEstimatedHours}h`}
          subtext={`${learningPath.steps.length} sequenced courses`}
          icon={<GraduationCap className="w-5 h-5 text-indigo-600" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 3 Gaps Summary */}
        <div className="card-enterprise p-6 bg-white space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Priority Identified Gaps</h3>
              <p className="text-[11px] text-slate-500">Highest-impact bottlenecks for {targetRole.title}</p>
            </div>
            <Link to="/gaps" className="text-xs font-bold text-blue-700 hover:underline">
              View All Gaps →
            </Link>
          </div>

          <div className="space-y-3">
            {skillGaps.slice(0, 3).map((gap) => (
              <div key={gap.id} className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{gap.competencyName}</span>
                  <StatusBadge status={gap.priority} size="sm" />
                </div>
                <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                  {gap.whyItMatters}
                </p>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 font-mono">
                  <span>Current: L{gap.currentLevel} → Required: L{gap.requiredLevel}</span>
                  <span className="font-bold text-rose-600">-{gap.gapMagnitude} Level Gap</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Recommended Courses Summary */}
        <div className="card-enterprise p-6 bg-white space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Top Matched Learning Pathways</h3>
              <p className="text-[11px] text-slate-500">Curated from government training repositories</p>
            </div>
            <Link to="/courses" className="text-xs font-bold text-blue-700 hover:underline">
              View All Courses →
            </Link>
          </div>

          <div className="space-y-3">
            {recommendedCourses.slice(0, 3).map((course) => (
              <div key={course.id} className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-mono text-[9px] font-bold uppercase">
                    {course.provider}
                  </span>
                  <span className="text-xs font-bold text-emerald-700 font-mono">
                    {course.matchScore}% Match
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900">{course.title}</h4>
                <p className="text-[11px] text-blue-900 bg-blue-50/80 p-2 rounded border border-blue-100">
                  {course.closesGapDescription}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Visual Comparison Preview */}
      <div className="card-enterprise p-6 bg-white space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Cadre Competency Balance Overview</h3>
            <p className="text-[11px] text-slate-500">Verified scores mapped against target standard</p>
          </div>
          <Link to="/capability" className="text-xs font-bold text-blue-700 hover:underline">
            View Full Matrix →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {verifiedProfile.slice(0, 4).map((p) => (
            <ComparisonBar
              key={p.competencyId}
              name={p.competencyName}
              candidateLevel={p.verifiedLevel}
              requiredLevel={p.targetLevel}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
