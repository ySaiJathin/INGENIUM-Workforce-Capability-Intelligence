import React from 'react';
import { CompetencyLevelNumber } from '../../types';

interface CompetencyLevelBadgeProps {
  level: CompetencyLevelNumber;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const CompetencyLevelBadge: React.FC<CompetencyLevelBadgeProps> = ({
  level,
  showText = true,
  size = 'md'
}) => {
  const levelNames: Record<CompetencyLevelNumber, string> = {
    1: 'Foundation',
    2: 'Working',
    3: 'Advanced',
    4: 'Expert'
  };

  const colors: Record<CompetencyLevelNumber, { pill: string; bars: string }> = {
    1: { pill: 'bg-slate-100 text-slate-700 border-slate-300', bars: 'bg-slate-500' },
    2: { pill: 'bg-blue-50 text-blue-800 border-blue-200', bars: 'bg-blue-600' },
    3: { pill: 'bg-indigo-50 text-indigo-800 border-indigo-200', bars: 'bg-indigo-600' },
    4: { pill: 'bg-emerald-50 text-emerald-900 border-emerald-300', bars: 'bg-emerald-600' }
  };

  const cfg = colors[level] || colors[1];

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border font-medium ${cfg.pill} text-xs`}>
      {/* 4-level discrete visual indicator */}
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={`w-1.5 rounded-sm transition-all ${
              step <= level ? `h-3 ${cfg.bars}` : 'h-2 bg-slate-200'
            }`}
          />
        ))}
      </div>
      <span>
        Level {level} {showText && `— ${levelNames[level]}`}
      </span>
    </div>
  );
};
