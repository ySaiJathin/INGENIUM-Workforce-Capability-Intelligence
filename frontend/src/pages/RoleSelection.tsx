import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/layout/PageHeader';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import { TargetRole } from '../types';
import {
  Briefcase,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Building2,
  Layers,
  ChevronRight
} from 'lucide-react';

export const RoleSelection: React.FC = () => {
  const navigate = useNavigate();
  const { allRoles, targetRole, selectTargetRole, loading, errors } = useApp();

  const handleSelectAndInspect = (roleId: string) => {
    selectTargetRole(roleId);
    navigate(`/roles/${roleId}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Select Target Benchmark Role"
        subtitle="Capability gaps and adaptive assessment questions are evaluated against the target role requirements"
        backPath="/candidate/profile"
        nextPath={targetRole.id ? `/roles/${targetRole.id}` : '/roles'}
        nextLabel="View Role Requirements"
        breadcrumbs={[
          { label: 'Candidate', path: '/candidate' },
          { label: 'Initial Profile', path: '/candidate/profile' },
          { label: 'Target Role Selection' }
        ]}
      />

      {loading.roles && <LoadingState label="Loading target roles…" />}
      {errors.roles && !loading.roles && <ErrorState error={errors.roles} />}

      {/* Roles Grid */}
      {!loading.roles && !errors.roles && (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {allRoles.map((role) => {
          const isSelected = role.id === targetRole.id;

          return (
            <div
              key={role.id}
              className={`card-enterprise p-6 transition-all flex flex-col justify-between cursor-pointer ${
                isSelected
                  ? 'border-blue-500 ring-2 ring-blue-500/20 bg-gradient-to-br from-white to-blue-50/20 shadow-md'
                  : 'hover:border-slate-300'
              }`}
              onClick={() => selectTargetRole(role.id)}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px] font-bold uppercase">
                        {role.band}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs text-slate-500 font-medium">{role.department}</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      {role.title}
                      {role.id === 'role-sso-01' && (
                        <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">
                          DEMO TARGET
                        </span>
                      )}
                    </h3>
                  </div>

                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-600 mb-4 leading-relaxed">{role.summary}</p>

                {/* Critical Focus Areas */}
                <div className="mb-4 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Core Competency Focus
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {role.criticalFocus.map((focus, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-xs font-medium border border-slate-200"
                      >
                        {focus}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <span className="text-xs font-mono text-slate-500 font-semibold">
                  {role.competencyCount} Required Competencies
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectAndInspect(role.id);
                    }}
                    className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5"
                  >
                    <span>Inspect Requirements</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      selectTargetRole(role.id);
                    }}
                    className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                  >
                    {isSelected ? 'Selected' : 'Select Role'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
};
