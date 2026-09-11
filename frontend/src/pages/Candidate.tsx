import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/layout/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ConfidenceBadge } from '../components/ui/ConfidenceBadge';
import { EvidenceBadge } from '../components/ui/EvidenceBadge';
import { MetricCard } from '../components/ui/MetricCard';
import {
  User,
  Building2,
  Calendar,
  MapPin,
  Mail,
  FileUp,
  ArrowRight,
  Sparkles,
  Award,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export const Candidate: React.FC = () => {
  const navigate = useNavigate();
  const { candidate, targetRole, loadDemoCandidate, isAssessmentCompleted } = useApp();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Candidate Profile"
        subtitle="Individual civil servant workforce intelligence and capability tracking record"
        nextPath="/candidate/resume"
        nextLabel="Proceed to Resume Evidence"
        breadcrumbs={[{ label: 'Ingenium', path: '/' }, { label: 'Candidate' }]}
        actions={
          <button
            onClick={() => {
              loadDemoCandidate().catch(() => {
                // Error is surfaced via errors.initialProfile on screens that render it.
              });
            }}
            className="btn-secondary text-xs flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Load Demo Candidate</span>
          </button>
        }
      />

      {/* Candidate Profile Hero Card */}
      <div className="card-enterprise p-6 lg:p-8 bg-white border-slate-200">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-slate-900 to-blue-900 text-white font-bold text-xl flex items-center justify-center shadow-md ring-4 ring-slate-100">
              {candidate.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-slate-900">{candidate.name}</h2>
                <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-xs font-semibold text-slate-600 border border-slate-200">
                  {candidate.employeeCode}
                </span>
              </div>
              <p className="text-sm font-semibold text-blue-700 mt-0.5">{candidate.designation}</p>
              <p className="text-xs text-slate-500">{candidate.cadre}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate('/candidate/resume')}
              className="btn-secondary text-xs flex items-center gap-1.5"
            >
              <FileUp className="w-4 h-4 text-slate-600" />
              <span>Upload / Re-evaluate Resume</span>
            </button>
            <button
              onClick={() => navigate('/candidate/profile')}
              className="btn-primary text-xs flex items-center gap-1.5"
            >
              <span>View Initial Profile</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Detailed Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
            <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
            <div className="text-xs">
              <span className="text-slate-400 block font-semibold text-[10px] uppercase">Department</span>
              <span className="font-bold text-slate-800">{candidate.department}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
            <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
            <div className="text-xs">
              <span className="text-slate-400 block font-semibold text-[10px] uppercase">Tenure in Cadre</span>
              <span className="font-bold text-slate-800">{candidate.yearsOfExperience} Years</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
            <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
            <div className="text-xs">
              <span className="text-slate-400 block font-semibold text-[10px] uppercase">Current Posting</span>
              <span className="font-bold text-slate-800">{candidate.location}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
            <Mail className="w-4 h-4 text-slate-500 shrink-0" />
            <div className="text-xs">
              <span className="text-slate-400 block font-semibold text-[10px] uppercase">Official Email</span>
              <span className="font-mono text-slate-800 font-medium">{candidate.email}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Intelligence Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-enterprise p-5">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block mb-2">
            Assessment Status
          </span>
          <div className="flex items-center justify-between mb-2">
            <span className="text-base font-bold text-slate-900">{candidate.assessmentStatus}</span>
            <StatusBadge status={isAssessmentCompleted ? 'VERIFIED' : 'NEEDS_ASSESSMENT'} size="sm" />
          </div>
          <p className="text-xs text-slate-500">
            {isAssessmentCompleted
              ? 'Candidate has completed the adaptive psychometric assessment.'
              : 'Initial capability profile built from resume; requires adaptive verification.'}
          </p>
        </div>

        <div className="card-enterprise p-5">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block mb-2">
            Current Evidence Basis
          </span>
          <div className="mb-2">
            <EvidenceBadge source={candidate.evidenceSource} />
          </div>
          <p className="text-xs text-slate-500">
            {candidate.evidenceSource === 'Resume Uploaded'
              ? 'Estimates are self-reported and tagged low confidence until tested.'
              : 'Multi-source verification combines documentation with interactive test responses.'}
          </p>
        </div>

        <div className="card-enterprise p-5">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block mb-2">
            Target Benchmark Role
          </span>
          <div className="flex items-center justify-between mb-2">
            <span className="text-base font-bold text-blue-700">{targetRole.title}</span>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
              {targetRole.band}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Candidate capability is evaluated against {targetRole.competencyCount} core role competencies.
          </p>
        </div>
      </div>

      {/* Important Principle Alert Banner */}
      <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed">
          <strong className="font-bold">Core Principle:</strong> Resume extraction provides an <em>initial capability baseline</em>, but does NOT constitute proven competency. All extracted items are labeled "Initial Evidence / Low Confidence" until verified through the adaptive assessment.
        </div>
      </div>
    </div>
  );
};
