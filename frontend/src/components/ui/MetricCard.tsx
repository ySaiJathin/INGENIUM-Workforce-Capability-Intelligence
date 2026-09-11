import React from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  highlight?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subtext,
  icon,
  trend,
  highlight = false
}) => {
  return (
    <div
      className={`card-enterprise p-5 relative overflow-hidden ${
        highlight ? 'ring-1 ring-blue-500/50 bg-gradient-to-br from-white to-blue-50/30' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900">{value}</span>
            {trend && (
              <span
                className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                  trend.isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                }`}
              >
                {trend.value}
              </span>
            )}
          </div>
          {subtext && <p className="mt-1 text-xs text-slate-500">{subtext}</p>}
        </div>
        {icon && (
          <div className="p-2.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200/80">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};
