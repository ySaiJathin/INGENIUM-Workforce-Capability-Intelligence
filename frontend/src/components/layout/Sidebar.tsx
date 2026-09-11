import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Compass,
  User,
  FileUp,
  FileCheck2,
  Briefcase,
  Layers,
  GraduationCap,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  Target,
  LayoutDashboard
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { candidate, targetRole, loadDemoCandidate, resetToBlankState, isDemoMode } = useApp();

  const navigationStages = [
    {
      group: 'FOUNDATION',
      items: [
        { path: '/', label: 'Overview', icon: Compass, badge: null },
        { path: '/candidate', label: 'Candidate', icon: User, badge: null },
        { path: '/candidate/resume', label: 'Resume Evidence', icon: FileUp, badge: 'Stage 1' },
        { path: '/candidate/profile', label: 'Initial Profile', icon: FileCheck2, badge: 'Stage 2' },
      ]
    },
    {
      group: 'BENCHMARK & EVALUATION',
      items: [
        { path: '/roles', label: 'Target Role', icon: Briefcase, badge: 'Stage 3' },
        { path: '/assessment', label: 'Adaptive Assessment', icon: Target, badge: 'Stage 4' },
        { path: '/assessment/results', label: 'Assessment Results', icon: CheckCircle2, badge: 'Stage 5' },
        { path: '/capability', label: 'Verified Capability', icon: Layers, badge: 'Stage 6' },
      ]
    },
    {
      group: 'DIAGNOSIS & ROADMAP',
      items: [
        { path: '/gaps', label: 'Skill Gap Analysis', icon: Target, badge: 'P0 Insight' },
        { path: '/courses', label: 'Course Recommendations', icon: GraduationCap, badge: 'Matched' },
        { path: '/learning-path', label: 'Personalized Learning Path', icon: Sparkles, badge: 'Outcome' },
        { path: '/dashboard', label: 'Executive Summary', icon: LayoutDashboard, badge: null },
      ]
    }
  ];

  return (
    <aside className="w-72 bg-slate-950 border-r border-slate-800/80 flex flex-col justify-between shrink-0 select-none text-slate-300">
      {/* Brand Header */}
      <div>
        <div className="p-5 border-b border-slate-800/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-500/20 ring-1 ring-white/20">
              I
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white tracking-tight text-base">INGENIUM</span>
                <span className="px-1.5 py-0.2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded text-[10px] font-mono font-semibold uppercase">MVP</span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Workforce Capability Intelligence</p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3.5 space-y-6 overflow-y-auto max-h-[calc(100vh-220px)]">
          {navigationStages.map((section, idx) => (
            <div key={idx} className="space-y-1.5">
              <h3 className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                {section.group}
              </h3>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path) && location.pathname === item.path);

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive: linkActive }) =>
                        `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          linkActive || isActive
                            ? 'bg-blue-600/15 text-blue-400 font-semibold border border-blue-500/30 shadow-sm'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                        }`
                      }
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                          isActive
                            ? 'bg-blue-500/30 text-blue-300'
                            : 'bg-slate-800/80 text-slate-500'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Candidate Status Footer & Demo Controls */}
      <div className="p-3.5 border-t border-slate-800/80 bg-slate-900/40 space-y-3">
        {/* Active Candidate Widget */}
        <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase font-mono text-slate-500 font-bold">ACTIVE EMPLOYEE</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <p className="font-semibold text-white truncate">{candidate.name}</p>
          <p className="text-[11px] text-slate-400 truncate">{candidate.designation}</p>
          <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Target:</span>
            <span className="text-slate-200 font-medium truncate max-w-[120px]">{targetRole.title}</span>
          </div>
        </div>

        {/* Demo Fast-Load Button */}
        <div className="flex gap-1.5">
          <button
            onClick={() => {
              loadDemoCandidate().catch(() => {
                // Error is surfaced via errors.initialProfile on screens that render it.
              });
            }}
            type="button"
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/40 text-xs font-semibold transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Try Demo Candidate</span>
          </button>
          <button
            onClick={resetToBlankState}
            type="button"
            title="Reset to blank workflow"
            className="p-2 rounded-md bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700 text-xs transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
