import React from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, Sparkles, Building2, Award } from 'lucide-react';
import { ConfidenceBadge } from '../ui/ConfidenceBadge';

export const Header: React.FC = () => {
  const { candidate, targetRole, isAssessmentCompleted, assessmentResults } = useApp();

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.03)] z-10">
      {/* Candidate Context Pill */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center border border-slate-700 shadow-sm">
            {candidate.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900">{candidate.name}</span>
              <span className="text-xs text-slate-400">({candidate.employeeCode})</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Building2 className="w-3 h-3 text-slate-400" />
                {candidate.department}
              </span>
              <span>•</span>
              <span className="font-medium text-slate-700">{candidate.designation}</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-8 w-px bg-slate-200" />

        {/* Target Benchmark Pill */}
        <div className="hidden md:flex items-center gap-2.5">
          <Award className="w-4 h-4 text-blue-600" />
          <div className="text-xs">
            <span className="text-slate-400 block text-[10px] uppercase font-mono font-semibold">TARGET BENCHMARK ROLE</span>
            <span className="font-bold text-slate-800">{targetRole.title}</span>
          </div>
        </div>
      </div>

      {/* Right Intelligence Badges */}
      <div className="flex items-center gap-3">
        {isAssessmentCompleted ? (
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <div className="text-xs">
              <span className="text-emerald-900 font-bold">Verified Readiness: {assessmentResults.roleReadinessScore}%</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <ConfidenceBadge confidence={candidate.overallConfidence} />
          </div>
        )}
      </div>
    </header>
  );
};
