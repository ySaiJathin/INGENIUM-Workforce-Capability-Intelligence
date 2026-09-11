import React from 'react';
import { CapabilityStatus, VerificationStatus } from '../../types';

interface StatusBadgeProps {
  status: CapabilityStatus | VerificationStatus | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'COMPLETED' | 'IN_PROGRESS' | 'UPCOMING';
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

  let config = {
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
    label: status.toString()
  };

  switch (status) {
    case 'READY':
      config = {
        bg: 'bg-emerald-50 text-emerald-800 border-emerald-300/80',
        label: 'READY'
      };
      break;
    case 'DEVELOPING':
      config = {
        bg: 'bg-blue-50 text-blue-800 border-blue-300/80',
        label: 'DEVELOPING'
      };
      break;
    case 'GAP':
      config = {
        bg: 'bg-amber-50 text-amber-800 border-amber-300/80',
        label: 'GAP IDENTIFIED'
      };
      break;
    case 'CRITICAL_GAP':
    case 'CRITICAL':
      config = {
        bg: 'bg-rose-50 text-rose-800 border-rose-300/80',
        label: 'CRITICAL GAP'
      };
      break;
    case 'HIGH':
      config = {
        bg: 'bg-amber-50 text-amber-800 border-amber-300/80',
        label: 'HIGH PRIORITY'
      };
      break;
    case 'MEDIUM':
      config = {
        bg: 'bg-blue-50 text-blue-800 border-blue-300/80',
        label: 'MODERATE'
      };
      break;
    case 'NEEDS_ASSESSMENT':
      config = {
        bg: 'bg-amber-50 text-amber-900 border-amber-300',
        label: 'NEEDS ASSESSMENT'
      };
      break;
    case 'UNVERIFIED':
      config = {
        bg: 'bg-slate-100 text-slate-700 border-slate-300',
        label: 'UNVERIFIED'
      };
      break;
    case 'VERIFIED':
      config = {
        bg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
        label: 'VERIFIED'
      };
      break;
    case 'COMPLETED':
      config = {
        bg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
        label: 'COMPLETED'
      };
      break;
    case 'IN_PROGRESS':
      config = {
        bg: 'bg-blue-50 text-blue-800 border-blue-300',
        label: 'IN PROGRESS'
      };
      break;
    case 'UPCOMING':
      config = {
        bg: 'bg-slate-100 text-slate-600 border-slate-200',
        label: 'UPCOMING'
      };
      break;
  }

  return (
    <span className={`inline-flex items-center rounded-md border tracking-wide uppercase ${sizeClasses} ${config.bg}`}>
      {config.label}
    </span>
  );
};
