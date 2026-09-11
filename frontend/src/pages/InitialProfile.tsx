import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/layout/PageHeader';
import { CompetencyLevelBadge } from '../components/ui/CompetencyLevelBadge';
import { ConfidenceBadge } from '../components/ui/ConfidenceBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { MetricCard } from '../components/ui/MetricCard';
import {
  FileText,
  AlertCircle,
  ArrowRight,
  ShieldAlert,
  Layers,
  HelpCircle,
  Award
} from 'lucide-react';

export const InitialProfile: React.FC = () => {
  const navigate = useNavigate();
  const { initialProfile, candidate } = useApp();

  const levelGuide = [
    { level: 1, name: 'Foundation', desc: 'Awareness & rudimentary syntax; guided execution' },
    { level: 2, name: 'Working', desc: 'Independent standard task execution & basic pipelines' },
    { level: 3, name: 'Advanced', desc: 'Complex problem-solving, architectural tuning, edge cases' },
    { level: 4, name: 'Expert', desc: 'Authoritative mastery, schema optimization, standard setting' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Initial Capability Profile"
        subtitle="Resume-derived capability estimates prior to adaptive testing"
        backPath="/candidate/resume"
        nextPath="/roles"
        nextLabel="Select Target Benchmark Role"
        breadcrumbs={[
          { label: 'Candidate', path: '/candidate' },
          { label: 'Resume Evidence', path: '/candidate/resume' },
          { label: 'Initial Profile' }
        ]}
      />

      {/* Baseline Metric Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label="Profiled Competencies"
          value={initialProfile.length}
          subtext="Extracted from civil service dossier"
          icon={<Layers className="w-5 h-5 text-blue-600" />}
        />
        <MetricCard
          label="Overall Baseline Confidence"
          value="Low / Unverified"
          subtext="Based on self-attestation only"
          icon={<ShieldAlert className="w-5 h-5 text-amber-600" />}
        />
        <MetricCard
          label="Next Required Action"
          value="Adaptive Assessment"
          subtext="Verify capability against role"
          icon={<Award className="w-5 h-5 text-indigo-600" />}
        />
      </div>

      {/* Competency Level Taxonomy Guide */}
      <div className="card-enterprise p-4 bg-slate-900 text-white">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block mb-2">
          Government Competency Hierarchy (4 Levels)
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {levelGuide.map((g) => (
            <div key={g.level} className="p-3 rounded-lg bg-slate-800/80 border border-slate-700/80">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-5 h-5 rounded bg-blue-600 text-white font-mono font-bold text-xs flex items-center justify-center">
                  {g.level}
                </span>
                <span className="text-xs font-bold text-white">{g.name}</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-snug">{g.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Initial Estimates Table */}
      <div className="card-enterprise overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Resume-Derived Competency Estimates</h3>
            <p className="text-xs text-slate-500">Subject to verification through adaptive psychometric assessment</p>
          </div>
          <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full font-semibold">
            All items require assessment
          </span>
        </div>

        {initialProfile.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs italic">
            No competencies were detected from your resume — you can still proceed to select a target
            role and verify your capabilities through the adaptive assessment.
          </div>
        ) : (
        <div className="divide-y divide-slate-200 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Competency</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Estimated Level</th>
                <th className="py-3 px-4">Evidence Basis</th>
                <th className="py-3 px-4">Confidence</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {initialProfile.map((item) => (
                <tr key={item.competencyId} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                    {item.competencyName}
                  </td>
                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px] uppercase">
                    {item.category}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <CompetencyLevelBadge level={item.estimatedLevel} />
                  </td>
                  <td className="py-3 px-4 text-slate-600 max-w-sm italic">
                    {item.evidence}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <ConfidenceBadge confidence={item.confidence} />
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <StatusBadge status={item.verificationStatus} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>
    </div>
  );
};
