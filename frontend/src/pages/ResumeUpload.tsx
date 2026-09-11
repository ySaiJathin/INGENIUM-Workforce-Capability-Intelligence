import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/layout/PageHeader';
import { ConfidenceBadge } from '../components/ui/ConfidenceBadge';
import { CompetencyLevelBadge } from '../components/ui/CompetencyLevelBadge';
import { ErrorState } from '../components/ui/ErrorState';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  Sparkles,
  ShieldAlert,
  Info
} from 'lucide-react';

export const ResumeUpload: React.FC = () => {
  const navigate = useNavigate();
  const { extractedEvidence, resumeFileName, setResumeUploaded, loadDemoCandidate, loading, errors } = useApp();
  const [isDragging, setIsDragging] = useState(false);
  const isProcessing = !!loading.initialProfile;

  const handleUpload = (file: File) => {
    setResumeUploaded(file).catch(() => {
      // Error is surfaced via errors.initialProfile below; nothing further to do here.
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (isProcessing) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Resume Upload & Evidence Extraction"
        subtitle="Extract self-reported competencies to formulate an initial unverified baseline"
        backPath="/candidate"
        nextPath="/candidate/profile"
        nextLabel="View Initial Profile"
        breadcrumbs={[
          { label: 'Candidate', path: '/candidate' },
          { label: 'Resume Evidence' }
        ]}
      />

      {/* Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`card-enterprise p-8 text-center border-2 border-dashed transition-all ${
          isDragging
            ? 'border-blue-500 bg-blue-50/50'
            : 'border-slate-300 bg-white hover:border-slate-400'
        }`}
      >
        <div className="max-w-md mx-auto">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 border border-blue-200">
            {isProcessing ? (
              <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
            ) : (
              <UploadCloud className="w-7 h-7 text-blue-600" />
            )}
          </div>

          <h3 className="text-base font-bold text-slate-900 mb-1">
            {isProcessing ? 'Analyzing Document Evidence...' : 'Upload Officer Resume or Dossier'}
          </h3>

          <p className="text-xs text-slate-500 mb-4">
            Supports PDF, DOCX formats. Unstructured text is parsed against government statistical competency frameworks.
          </p>

          {isProcessing ? (
            <div className="py-2 space-y-2">
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                <div className="bg-blue-600 h-2 rounded-full animate-pulse w-3/4" />
              </div>
              <p className="text-xs font-mono font-medium text-blue-700">
                Uploading and extracting competency evidence…
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-center gap-3">
              <label className="btn-primary text-xs cursor-pointer">
                <span>Select File from Computer</span>
                <input
                  type="file"
                  accept=".pdf,.docx,.doc"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleUpload(e.target.files[0]);
                    }
                  }}
                />
              </label>

              <button
                type="button"
                onClick={() => {
                  loadDemoCandidate().catch(() => {
                    // Error is surfaced via errors.initialProfile below; nothing further to do here.
                  });
                  navigate('/candidate/profile');
                }}
                className="btn-secondary text-xs flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Try Demo Candidate (Ananya Sharma)</span>
              </button>
            </div>
          )}

          {resumeFileName && !isProcessing && (
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Loaded: <strong>{resumeFileName}</strong></span>
            </div>
          )}
        </div>
      </div>

      {errors.initialProfile && !isProcessing && <ErrorState error={errors.initialProfile} />}

      {/* Critical Disclaimer Alert */}
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed">
          <strong className="font-bold">Initial Evidence Disclaimer:</strong> The competencies below are self-reported claims extracted directly from the candidate's resume. Because self-attestations are unverified, all items are tagged <strong>Low Confidence</strong> and MUST be evaluated through the adaptive competency assessment.
        </div>
      </div>

      {/* Extracted Evidence Table */}
      <div className="card-enterprise overflow-hidden">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold">Extracted Competency Evidence ({extractedEvidence.length} Found)</h3>
            <p className="text-[11px] text-slate-300">Raw excerpts extracted with source section context</p>
          </div>
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
            Unverified
          </span>
        </div>

        <div className="divide-y divide-slate-200 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Competency</th>
                <th className="py-3 px-4">Extracted Evidence Snippet</th>
                <th className="py-3 px-4">Initial Level</th>
                <th className="py-3 px-4">Confidence</th>
                <th className="py-3 px-4 text-right">Verification Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {extractedEvidence.length === 0 && !isProcessing && resumeFileName && (
                <tr>
                  <td colSpan={5} className="py-6 px-4 text-center text-slate-500 italic">
                    No competencies were extracted from this resume.
                  </td>
                </tr>
              )}
              {extractedEvidence.map((ev) => (
                <tr key={ev.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                    {ev.competencyName}
                    <span className="block text-[10px] font-normal text-slate-400 font-mono mt-0.5">
                      {ev.sourceContext}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 max-w-md italic">
                    "{ev.snippet}"
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <CompetencyLevelBadge level={ev.estimatedLevel} showText={false} />
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <ConfidenceBadge confidence={ev.confidence} />
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-50 text-amber-800 border border-amber-300">
                      Needs Assessment
                    </span>
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
