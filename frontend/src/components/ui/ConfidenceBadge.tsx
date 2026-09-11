import React from 'react';
import { ConfidenceLevel } from '../../types';
import { ShieldCheck, ShieldAlert, Shield } from 'lucide-react';

interface ConfidenceBadgeProps {
  confidence: ConfidenceLevel;
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({ confidence }) => {
  if (confidence === 'HIGH') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        High Confidence
      </span>
    );
  }

  if (confidence === 'MEDIUM') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-300">
        <Shield className="w-3.5 h-3.5 text-blue-600" />
        Medium Confidence
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300">
      <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
      Low Confidence (Unverified)
    </span>
  );
};
