import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ArrowRight } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  backPath?: string;
  nextPath?: string;
  nextLabel?: string;
  actions?: React.ReactNode;
  breadcrumbs?: { label: string; path?: string }[];
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  badge,
  backPath,
  nextPath,
  nextLabel = 'Continue',
  actions,
  breadcrumbs
}) => {
  const navigate = useNavigate();

  return (
    <div className="mb-6 pb-5 border-b border-slate-200/80">
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
          {breadcrumbs.map((bc, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <span>/</span>}
              {bc.path ? (
                <button
                  onClick={() => navigate(bc.path!)}
                  className="hover:text-slate-700 font-medium"
                >
                  {bc.label}
                </button>
              ) : (
                <span className="text-slate-600 font-semibold">{bc.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            {backPath && (
              <button
                onClick={() => navigate(backPath)}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                title="Go back"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
            {badge && <div>{badge}</div>}
          </div>
          {subtitle && <p className="mt-1 text-sm text-slate-500 font-normal">{subtitle}</p>}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          {actions}
          {nextPath && (
            <button
              onClick={() => navigate(nextPath)}
              className="btn-primary flex items-center gap-2"
            >
              <span>{nextLabel}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
