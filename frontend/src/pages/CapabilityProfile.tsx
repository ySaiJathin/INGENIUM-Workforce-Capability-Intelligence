import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/layout/PageHeader';
import { CompetencyCard } from '../components/competency/CompetencyCard';
import { MetricCard } from '../components/ui/MetricCard';
import { CompetencyLevelBadge } from '../components/ui/CompetencyLevelBadge';
import { ConfidenceBadge } from '../components/ui/ConfidenceBadge';
import { EvidenceBadge } from '../components/ui/EvidenceBadge';
import { StatusBadge } from '../components/ui/StatusBadge';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import {
  Layers,
  ShieldCheck,
  Target,
  ArrowRight,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

export const CapabilityProfile: React.FC = () => {
  const navigate = useNavigate();
  const { verifiedProfile, targetRole, assessmentResults, loading, errors } = useApp();

  if (loading.assessmentProfile) {
    return <LoadingState label="Loading verified capability profile…" />;
  }
  if (errors.assessmentProfile) {
    return <ErrorState error={errors.assessmentProfile} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Verified Capability Profile"
        subtitle={`High-confidence competency matrix verified for ${targetRole.title}`}
        backPath="/assessment/results"
        nextPath="/gaps"
        nextLabel="View Skill Gaps"
        breadcrumbs={[
          { label: 'Assessment', path: '/assessment' },
          { label: 'Verified Profile' }
        ]}
      />

      {/* Top Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label="Verified Profile Score"
          value={`${assessmentResults.roleReadinessScore}%`}
          subtext="Target role alignment index"
          icon={<ShieldCheck className="w-5 h-5 text-emerald-600" />}
          highlight={true}
        />
        <MetricCard
          label="High-Confidence Items"
          value={`${verifiedProfile.filter(p => p.confidence === 'HIGH').length} / ${verifiedProfile.length}`}
          subtext="Multi-source verified"
          icon={<CheckCircle2 className="w-5 h-5 text-blue-600" />}
        />
        <MetricCard
          label="Identified Role Gaps"
          value={verifiedProfile.filter(p => p.status === 'GAP' || p.status === 'CRITICAL_GAP').length}
          subtext="Targeted for learning roadmap"
          icon={<Target className="w-5 h-5 text-amber-600" />}
        />
      </div>

      {/* Grid of Verified Competency Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">
            Verified Competency Intelligence Cards ({verifiedProfile.length})
          </h3>
          <span className="text-xs text-slate-500">
            Click into Gap Analysis to review remediation
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {verifiedProfile.map((item) => (
            <CompetencyCard
              key={item.competencyId}
              name={item.competencyName}
              category={item.category}
              level={item.verifiedLevel}
              targetLevel={item.targetLevel}
              confidence={item.confidence}
              evidence={item.evidence}
              status={item.status}
              notes={item.notes}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
