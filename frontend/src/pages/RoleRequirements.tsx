import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/layout/PageHeader';
import { CompetencyLevelBadge } from '../components/ui/CompetencyLevelBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ComparisonBar } from '../components/ui/ComparisonBar';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import {
  Briefcase,
  Award,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
  Building2,
  FileCheck2,
  BrainCircuit
} from 'lucide-react';

export const RoleRequirements: React.FC = () => {
  const { roleId } = useParams<{ roleId: string }>();
  const navigate = useNavigate();
  const { allRoles, targetRole, selectTargetRole, initialProfile, candidate, loading, errors } = useApp();

  useEffect(() => {
    // Fetching role detail (required_competencies) is what selectTargetRole already does —
    // trigger it if the user navigated straight here without picking the role from the grid.
    if (roleId && roleId !== targetRole.id) {
      selectTargetRole(roleId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleId]);

  const activeRole = allRoles.find((r) => r.id === roleId) || targetRole;

  if (loading.targetRole) {
    return <LoadingState label="Loading role requirements…" />;
  }
  if (errors.targetRole) {
    return <ErrorState error={errors.targetRole} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={activeRole.title}
        subtitle={`${activeRole.department} • Official Benchmark Standard (${activeRole.band})`}
        backPath="/roles"
        nextPath="/assessment"
        nextLabel="Start Adaptive Assessment"
        breadcrumbs={[
          { label: 'Target Roles', path: '/roles' },
          { label: activeRole.title }
        ]}
        actions={
          <button
            onClick={() => {
              selectTargetRole(activeRole.id);
              navigate('/assessment');
            }}
            className="btn-primary text-xs flex items-center gap-2"
          >
            <BrainCircuit className="w-4 h-4 text-blue-300" />
            <span>Start Adaptive Assessment for Role</span>
          </button>
        }
      />

      {/* Role Overview Box */}
      <div className="card-enterprise p-6 bg-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              Role Specification Dossier
            </span>
            <h2 className="text-xl font-bold text-slate-900">{activeRole.title}</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold">
              {activeRole.competencyCount} Competencies Mandated
            </span>
          </div>
        </div>

        <p className="mt-4 text-xs text-slate-600 leading-relaxed max-w-4xl">
          {activeRole.description}
        </p>
      </div>

      {/* Early Preview: Candidate Initial Estimate vs Role Requirement */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Candidate Resume Baseline vs Role Requirement Preview
            </h3>
            <p className="text-xs text-slate-500">
              Initial estimates indicate potential gaps that the adaptive assessment will rigorously test.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {activeRole.requiredCompetencies.map((req) => {
            const initialMatch = initialProfile.find((ip) => ip.competencyId === req.competencyId);
            const candidateEst = initialMatch ? initialMatch.estimatedLevel : 1;

            return (
              <ComparisonBar
                key={req.competencyId}
                name={req.competencyName}
                category={req.category}
                candidateLevel={candidateEst}
                requiredLevel={req.requiredLevel}
              />
            );
          })}
        </div>
      </div>

      {/* Required Competencies Deep Dive Table */}
      <div className="card-enterprise overflow-hidden">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold">Required Competency Proficiency Matrix</h3>
            <p className="text-[11px] text-slate-300">Mandated competency levels and institutional importance</p>
          </div>
        </div>

        <div className="divide-y divide-slate-200 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Required Competency</th>
                <th className="py-3 px-4">Mandated Level</th>
                <th className="py-3 px-4">Priority Importance</th>
                <th className="py-3 px-4">Institutional Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeRole.requiredCompetencies.map((comp) => (
                <tr key={comp.competencyId} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                    {comp.competencyName}
                    {comp.isCore && (
                      <span className="ml-2 px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-semibold border border-blue-200">
                        CORE
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <CompetencyLevelBadge level={comp.requiredLevel} />
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <StatusBadge status={comp.importance} size="sm" />
                  </td>
                  <td className="py-3 px-4 text-slate-600 max-w-md">
                    {comp.rationale}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
