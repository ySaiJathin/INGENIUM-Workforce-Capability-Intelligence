import React from 'react';
import { SkillGap } from '../../types';
import { StatusBadge } from '../ui/StatusBadge';
import { AlertCircle, ArrowRight, Lightbulb, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

interface GapCardProps {
  gap: SkillGap;
  onSelectAction?: () => void;
}

export const GapCard: React.FC<GapCardProps> = ({ gap }) => {
  const isCritical = gap.priority === 'CRITICAL';

  return (
    <div
      className={`card-enterprise p-6 transition-all ${
        isCritical
          ? 'border-rose-300 ring-1 ring-rose-200 bg-gradient-to-br from-white to-rose-50/20'
          : 'hover:border-slate-300'
      }`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              {gap.category}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-medium">Impact: {gap.impactArea}</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            {gap.competencyName}
            {isCritical && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
          </h3>
        </div>
        <StatusBadge status={gap.priority} />
      </div>

      {/* Level Delta Visualizer */}
      <div className="grid grid-cols-3 gap-3 p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 mb-4 text-center">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Current Level</span>
          <span className="text-base font-bold text-slate-800 font-mono">Level {gap.currentLevel}</span>
        </div>

        <div className="flex flex-col items-center justify-center border-x border-slate-200">
          <span className="text-[10px] uppercase font-bold text-rose-600 block mb-1">Gap Delta</span>
          <span className="text-base font-black text-rose-600 font-mono">-{gap.gapMagnitude} {gap.gapMagnitude > 1 ? 'Levels' : 'Level'}</span>
        </div>

        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Role Requirement</span>
          <span className="text-base font-bold text-slate-900 font-mono">Level {gap.requiredLevel}</span>
        </div>
      </div>

      {/* Why It Matters */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
          <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
          <span>Why This Matters for Role</span>
        </div>
        <p className="text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-200/70 leading-relaxed">
          {gap.whyItMatters}
        </p>
      </div>

      {/* Recommended Action & CTA */}
      <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-700">
          <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="font-medium text-slate-800 line-clamp-1">{gap.recommendedAction}</span>
        </div>

        <Link
          to="/courses"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-800 hover:underline shrink-0"
        >
          <span>View Matched Courses</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
