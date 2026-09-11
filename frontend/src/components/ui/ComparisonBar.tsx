import React from 'react';
import { CompetencyLevelNumber } from '../../types';

interface ComparisonBarProps {
  name: string;
  category?: string;
  candidateLevel: CompetencyLevelNumber;
  requiredLevel: CompetencyLevelNumber;
  initialLevel?: CompetencyLevelNumber;
  showGapTag?: boolean;
}

export const ComparisonBar: React.FC<ComparisonBarProps> = ({
  name,
  category,
  candidateLevel,
  requiredLevel,
  showGapTag = true
}) => {
  const gap = requiredLevel - candidateLevel;
  const isMet = candidateLevel >= requiredLevel;

  return (
    <div className="py-3 px-4 rounded-lg bg-white border border-slate-200/80 hover:border-slate-300 transition-colors">
      <div className="flex items-center justify-between gap-4 mb-2">
        <div>
          <span className="text-sm font-bold text-slate-900">{name}</span>
          {category && <span className="ml-2 text-[11px] font-mono uppercase text-slate-400">({category})</span>}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Candidate: <strong className="text-slate-800 font-mono">L{candidateLevel}</strong></span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-500 font-medium">Target: <strong className="text-slate-800 font-mono">L{requiredLevel}</strong></span>
          </div>

          {showGapTag && (
            <div>
              {isMet ? (
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  MET
                </span>
              ) : (
                <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                  gap >= 2 ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  -{gap} LEVEL{gap > 1 ? 'S' : ''} GAP
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Discrete 4-Tier Comparison Visualizer */}
      <div className="space-y-1.5 pt-1">
        {/* Candidate Verified Bar */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-slate-400 w-16 text-right">Verified:</span>
          <div className="flex-1 grid grid-cols-4 gap-1.5 h-3 bg-slate-100 p-0.5 rounded border border-slate-200/60">
            {[1, 2, 3, 4].map((lvl) => (
              <div
                key={`cand-${lvl}`}
                className={`rounded-sm transition-all ${
                  lvl <= candidateLevel
                    ? isMet
                      ? 'bg-emerald-600'
                      : 'bg-blue-600'
                    : 'bg-slate-200/60'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Role Target Requirement Bar */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-slate-400 w-16 text-right">Required:</span>
          <div className="flex-1 grid grid-cols-4 gap-1.5 h-3 bg-slate-100 p-0.5 rounded border border-slate-200/60">
            {[1, 2, 3, 4].map((lvl) => (
              <div
                key={`req-${lvl}`}
                className={`rounded-sm transition-all ${
                  lvl <= requiredLevel
                    ? 'bg-slate-800'
                    : 'bg-slate-200/60'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
