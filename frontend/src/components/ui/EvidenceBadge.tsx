import React from 'react';
import { EvidenceSource } from '../../types';
import { FileText, CheckCircle2, Layers } from 'lucide-react';

interface EvidenceBadgeProps {
  source: EvidenceSource | 'No Evidence' | 'Resume Uploaded' | 'Assessment Completed' | 'Multi-source Verified';
}

export const EvidenceBadge: React.FC<EvidenceBadgeProps> = ({ source }) => {
  if (source === 'BOTH' || source === 'Multi-source Verified') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-800 border border-purple-200">
        <Layers className="w-3.5 h-3.5 text-purple-600" />
        Assessment + Resume
      </span>
    );
  }

  if (source === 'ASSESSMENT' || source === 'Assessment Completed') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        Verified Assessment
      </span>
    );
  }

  if (source === 'RESUME' || source === 'Resume Uploaded') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
        <FileText className="w-3.5 h-3.5 text-amber-600" />
        Resume Extraction (Unverified)
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
      No Evidence
    </span>
  );
};
