import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  FileText,
  Target,
  BrainCircuit,
  GraduationCap,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Award,
  Layers,
  CheckCircle2,
  Building2
} from 'lucide-react';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { loadDemoCandidate } = useApp();

  const handleStartDemo = () => {
    loadDemoCandidate().catch(() => {
      // Error is surfaced via errors.initialProfile on the screens that render it; nothing further
      // to do here.
    });
    navigate('/candidate');
  };

  const workflowSteps = [
    { title: 'Resume Evidence', desc: 'Unverified self-reported claims', icon: FileText, stage: 'Stage 1' },
    { title: 'Initial Profile', desc: 'Baseline Level 1–4 estimates', icon: Layers, stage: 'Stage 2' },
    { title: 'Target Role', desc: 'Required competency standards', icon: Award, stage: 'Stage 3' },
    { title: 'Adaptive Assessment', desc: 'Probing verified proficiency', icon: BrainCircuit, stage: 'Stage 4' },
    { title: 'Skill Gap Analysis', desc: 'Role deficiency diagnosis', icon: Target, stage: 'Stage 5' },
    { title: 'Learning Path', desc: 'Sequenced curriculum outcome', icon: GraduationCap, stage: 'Stage 6' },
  ];

  const capabilityCards = [
    {
      title: 'Evidence-Based Capability Profiling',
      description: 'Extracts technical competencies from unstructured civil service CVs while explicitly maintaining confidence boundaries between unverified claims and proven capability.',
      icon: FileText,
      tag: 'Objective Baselines'
    },
    {
      title: 'Adaptive Competency Assessment',
      description: 'Dynamic question probing targets specific technical proficiencies (SQL, Survey Methodology, Python) to verify real practical execution instead of subjective test scores.',
      icon: BrainCircuit,
      tag: 'Dynamic Verification'
    },
    {
      title: 'Role-Specific Gap Analysis',
      description: 'Quantifies exact competency shortfalls against official government cadres and gazetted job bands, providing clear "Why This Matters" impact rationale for leadership.',
      icon: Target,
      tag: 'Precision Diagnosis'
    },
    {
      title: 'Personalized Learning Recommendations',
      description: 'Directly maps diagnosed capability gaps to vetted courses across iGOT Karmayogi, National Statistical Academy, and MoSPI platforms to build sequenced career pathways.',
      icon: GraduationCap,
      tag: 'Targeted Outcome'
    }
  ];

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="card-enterprise p-8 lg:p-12 bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 text-white relative overflow-hidden shadow-xl border-slate-800">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-semibold mb-6">
            <Building2 className="w-3.5 h-3.5" />
            <span>Enterprise Government Capability Platform</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            Workforce Capability Intelligence
          </h1>

          <p className="mt-4 text-base sm:text-lg text-slate-300 font-normal leading-relaxed">
            Understand workforce capability, verify competency boundaries through adaptive probing, identify role-specific skill gaps, and generate targeted learning paths.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              onClick={() => navigate('/candidate')}
              className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all shadow-lg shadow-blue-600/30 flex items-center gap-2"
            >
              <span>Start Capability Assessment</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleStartDemo}
              className="px-6 py-3 rounded-lg bg-slate-800/90 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-sm transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>Try Demo Candidate (Ananya Sharma)</span>
            </button>
          </div>
        </div>

        {/* Subtle background decoration */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-blue-600/10 to-transparent pointer-events-none hidden md:block" />
      </div>

      {/* Visual Workflow Journey */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">The Capability Intelligence Pipeline</h2>
            <p className="text-xs text-slate-500">How unverified claims transform into verified role readiness and targeted learning</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {workflowSteps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className="card-enterprise p-4 hover:border-blue-400/80 transition-all flex flex-col justify-between relative group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold uppercase text-slate-400">
                      {step.stage}
                    </span>
                    <Icon className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900">{step.title}</h3>
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug">{step.desc}</p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center gap-1 text-[10px] font-semibold text-blue-600 group-hover:text-blue-700">
                  <span>Step {idx + 1}</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4 Core Pillars */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Core System Capabilities</h2>
          <p className="text-xs text-slate-500">Designed around official civil service cadres, ESCO taxonomies, and adaptive assessment</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {capabilityCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div key={idx} className="card-enterprise p-6 hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase font-bold text-blue-700">{card.tag}</span>
                    <h3 className="text-base font-bold text-slate-900">{card.title}</h3>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{card.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Callout */}
      <div className="p-6 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
          <div>
            <h4 className="text-sm font-bold">Hackathon Demo Environment Ready</h4>
            <p className="text-xs text-slate-400">Pre-populated with National Statistical Office officer datasets and adaptive psychometric test items.</p>
          </div>
        </div>
        <button
          onClick={handleStartDemo}
          className="btn-brand text-xs py-2 px-4 shrink-0 font-bold"
        >
          Launch Demo Candidate Flow
        </button>
      </div>
    </div>
  );
};
