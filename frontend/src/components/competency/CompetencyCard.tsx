import React from 'react';
import { CompetencyLevelNumber, ConfidenceLevel, EvidenceSource, CapabilityStatus } from '../../types';
import { CompetencyLevelBadge } from '../ui/CompetencyLevelBadge';
import { ConfidenceBadge } from '../ui/ConfidenceBadge';
import { EvidenceBadge } from '../ui/EvidenceBadge';
import { StatusBadge } from '../ui/StatusBadge';

interface CompetencyCardProps {
  name: string;
  category: string;
  level: CompetencyLevelNumber;
  targetLevel?: CompetencyLevelNumber;
  confidence: ConfidenceLevel;
  evidence: string | EvidenceSource;
  status?: CapabilityStatus;
  notes?: string;
  isInitialEstimate?: boolean;
}

export const CompetencyCard: React.FC<CompetencyCardProps> = ({
  name,
  category,
  level,
  targetLevel,
  confidence,
  evidence,
  status,
  notes,
  isInitialEstimate = false
}) => {
  return (
    <div className="card-enterprise p-5 hover:shadow-md transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-slate-400">
              {category}
            </span>
            <h3 className="text-base font-bold text-slate-900 leading-tight mt-0.5">{name}</h3>
          </div>
          {status && <StatusBadge status={status} size="sm" />}
        </div>

        {/* Level and Target Level */}
        <div className="flex flex-wrap items-center gap-3 mb-4 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
              {isInitialEstimate ? 'Estimated Level' : 'Verified Level'}
            </span>
            <CompetencyLevelBadge level={level} />
          </div>

          {targetLevel && (
            <>
              <div className="h-6 w-px bg-slate-200" />
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                  Role Target
                </span>
                <CompetencyLevelBadge level={targetLevel} />
              </div>
            </>
          )}
        </div>

        {/* Evidence Snippet */}
        <div className="space-y-2 mb-4">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Evidence Rationale
          </span>
          <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-200/60 leading-relaxed italic">
            "{typeof evidence === 'string' ? evidence : notes || 'Derived from assessment evaluation.'}"
          </p>
        </div>
      </div>

      {/* Footer Badges */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
        <ConfidenceBadge confidence={confidence} />
        {typeof evidence !== 'string' && <EvidenceBadge source={evidence} />}
      </div>
    </div>
  );
};
