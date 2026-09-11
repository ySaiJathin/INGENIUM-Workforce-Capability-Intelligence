import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  label?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ label = 'Loading…' }) => {
  return (
    <div className="card-enterprise flex flex-col items-center justify-center gap-3 py-12 px-6 text-center">
      <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
      <p className="text-sm font-medium text-slate-500">{label}</p>
    </div>
  );
};
