import React from 'react';
import { LearningPathStep } from '../../types';
import { StatusBadge } from '../ui/StatusBadge';
import { CheckCircle2, Clock, Sparkles, ArrowDown, PlayCircle, Circle, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface LearningPathTimelineProps {
  steps: LearningPathStep[];
}

export const LearningPathTimeline: React.FC<LearningPathTimelineProps> = ({ steps }) => {
  const { toggleStepStatus, removeCourseFromLearningPath } = useApp();

  return (
    <div className="space-y-6 relative before:absolute before:inset-0 before:left-7 before:w-0.5 before:bg-slate-200 before:hidden sm:before:block">
      {steps.map((step, idx) => {
        const isCompleted = step.status === 'COMPLETED';
        const isInProgress = step.status === 'IN_PROGRESS';
        const isUpcoming = step.status === 'UPCOMING';

        return (
          <div key={step.stepNumber} className="relative flex flex-col sm:flex-row gap-5 items-start">
            {/* Timeline Node Indicator */}
            <div className="shrink-0 z-10 flex items-center gap-3">
              <button
                onClick={() => toggleStepStatus(step.stepNumber)}
                title="Click to toggle completion status"
                className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-bold text-xs shadow-sm border transition-all hover:scale-105 ${
                  isCompleted
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-500/20'
                    : isInProgress
                    ? 'bg-blue-600 text-white border-blue-500 shadow-blue-500/20 animate-pulse'
                    : 'bg-white text-slate-700 border-slate-300'
                }`}
              >
                {isCompleted ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 mb-0.5" />
                    <span className="text-[9px] uppercase font-mono">DONE</span>
                  </>
                ) : isInProgress ? (
                  <>
                    <PlayCircle className="w-5 h-5 mb-0.5" />
                    <span className="text-[9px] uppercase font-mono">ACTIVE</span>
                  </>
                ) : (
                  <>
                    <Circle className="w-4 h-4 mb-0.5 text-slate-400" />
                    <span className="text-[10px] font-mono">STEP {step.stepNumber}</span>
                  </>
                )}
              </button>
            </div>

            {/* Step Card Content */}
            <div
              className={`flex-1 w-full card-enterprise p-6 transition-all ${
                isInProgress
                  ? 'border-blue-400 ring-1 ring-blue-200 bg-gradient-to-br from-white to-blue-50/20 shadow-md'
                  : isCompleted
                  ? 'bg-slate-50/50 border-slate-200'
                  : 'hover:border-slate-300'
              }`}
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-mono text-[10px] font-bold uppercase">
                      {step.provider}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {step.durationText}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    {step.courseTitle}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <StatusBadge status={step.status} size="sm" />
                  <StatusBadge status={step.priority} size="sm" />
                </div>
              </div>

              {/* Target Gap Summary */}
              <div className="p-3 rounded-lg bg-slate-100/70 border border-slate-200/80 mb-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Targeted Competency Impact
                </span>
                <p className="text-xs text-slate-800 font-medium">{step.targetGapSummary}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {step.competenciesAddressed.map((comp, cIdx) => (
                    <span
                      key={cIdx}
                      className="px-2 py-0.5 rounded bg-white text-slate-700 text-xs font-semibold border border-slate-200"
                    >
                      {comp}
                    </span>
                  ))}
                </div>
              </div>

              {/* Milestones */}
              {step.keyMilestones && step.keyMilestones.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Syllabus Milestones
                  </span>
                  <ul className="space-y-1 text-xs text-slate-600">
                    {step.keyMilestones.map((m, mIdx) => (
                      <li key={mIdx} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        <span>{m}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Card Footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-blue-700 font-semibold font-mono">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>+{step.projectedReadinessContribution}% Projected Readiness Gain</span>
                </div>

                <button
                  onClick={() => removeCourseFromLearningPath(step.courseId)}
                  className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                  title="Remove from custom path"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
