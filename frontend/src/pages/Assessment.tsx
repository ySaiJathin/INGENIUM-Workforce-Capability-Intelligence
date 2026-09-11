import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/layout/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { LoadingState } from '../components/ui/LoadingState';
import { ErrorState } from '../components/ui/ErrorState';
import {
  BrainCircuit,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Code2,
  Lightbulb,
  Cpu
} from 'lucide-react';

export const Assessment: React.FC = () => {
  const navigate = useNavigate();
  const {
    candidate,
    targetRole,
    assessmentQuestions,
    currentQuestionIndex,
    assessmentAnswers,
    assessmentAnswerResults,
    answerAssessmentQuestion,
    nextQuestion,
    previousQuestion,
    completeAssessment,
    startAssessmentSession,
    isAssessmentCompleted,
    verificationLedger,
    loading,
    errors
  } = useApp();

  const [showExplanation, setShowExplanation] = useState(false);
  // Guards completeAssessment()+navigate from firing twice: once from a natural completion (the
  // effect below reacting to isAssessmentCompleted flipping true) and once from the user manually
  // clicking "Complete & View Verified Results" (handleFinish) — whichever happens first wins.
  const hasTriggeredCompletionRef = useRef(false);

  useEffect(() => {
    // Task 16: a demo candidate now runs the identical real-backend assessment as a real
    // candidate (no more pre-populated mock questions), so this must fire for both entry points —
    // found live via a real Chrome run: the leftover `!isDemoMode &&` here left the demo path
    // stuck on "No assessment question is loaded yet." since startAssessmentSession() never ran.
    if (assessmentQuestions.length === 0 && !loading.assessment && !isAssessmentCompleted) {
      startAssessmentSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // FR-007: detect natural completion (question budget exhausted, confidence threshold met, or —
  // found live via a real Chrome run — the seed bank exhausted while Mistral is down) and
  // transition to Assessment Results automatically. Without this, `nextQuestion` sets
  // `isAssessmentCompleted` but the screen just keeps re-showing the last (already-answered)
  // question forever, since `currentQ` never becomes undefined through the normal answer flow —
  // the candidate would be stuck clicking "Next Question" with nothing visibly happening.
  useEffect(() => {
    if (isAssessmentCompleted && !hasTriggeredCompletionRef.current) {
      hasTriggeredCompletionRef.current = true;
      completeAssessment().then(() => navigate('/assessment/results'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAssessmentCompleted]);

  if (errors.assessment && assessmentQuestions.length === 0) {
    return <ErrorState error={errors.assessment} onRetry={startAssessmentSession} />;
  }

  if (loading.assessment && assessmentQuestions.length === 0) {
    return <LoadingState label="Starting your adaptive assessment…" />;
  }

  const currentQ = assessmentQuestions[currentQuestionIndex];

  if (!currentQ) {
    return isAssessmentCompleted ? (
      <LoadingState label="Finalizing your verified results…" />
    ) : (
      <ErrorState error={new Error('No assessment question is loaded yet.')} onRetry={startAssessmentSession} />
    );
  }

  const selectedOption = assessmentAnswers[currentQ.id];
  const answerResult = assessmentAnswerResults[currentQ.id];

  const totalQuestions = currentQ.totalQuestions || assessmentQuestions.length;
  const isLastQuestion = currentQuestionIndex + 1 >= totalQuestions;
  const progressPercent = Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100);

  const handleSelectOption = (optId: string) => {
    // FR-006: an already-answered question (reviewed via Previous) is read-only — the backend has
    // already scored it, so changing the local selection here would desync the displayed option
    // from `answerResult`'s recorded correctness without actually resubmitting anything.
    if (assessmentAnswerResults[currentQ.id]) return;
    answerAssessmentQuestion(currentQ.id, optId);
    setShowExplanation(true);
  };

  const handleFinish = () => {
    if (hasTriggeredCompletionRef.current) return;
    hasTriggeredCompletionRef.current = true;
    completeAssessment().then(() => navigate('/assessment/results'));
  };

  const handleNext = () => {
    setShowExplanation(false);
    nextQuestion();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Adaptive Capability Assessment"
        subtitle={`Probing technical competencies against ${targetRole.title} benchmarks`}
        breadcrumbs={[
          { label: 'Target Roles', path: '/roles' },
          { label: 'Adaptive Assessment' }
        ]}
        actions={
          <button
            onClick={handleFinish}
            className="btn-primary text-xs flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Complete & View Verified Results</span>
          </button>
        }
      />

      {/* Progress & Context Header Bar */}
      <div className="card-enterprise p-4 bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm border border-blue-200 shrink-0">
            {currentQuestionIndex + 1}/{totalQuestions}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">{currentQ.competencyName}</span>
              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono text-[10px] font-bold uppercase border border-blue-200">
                {currentQ.difficulty}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Adaptive Psychometric Probe Item</p>
          </div>
        </div>

        <div className="w-full sm:w-64">
          <ProgressBar
            value={progressPercent}
            label={`Question ${currentQuestionIndex + 1} of ~${totalQuestions}`}
            color="blue"
            size="sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Question Area (2 Cols) */}
        <div className="lg:col-span-2 space-y-5">
          <div className="card-enterprise p-6 bg-white space-y-5">
            {/* Scenario Description */}
            {currentQ.scenario && (
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1">
                  Practical Execution Scenario
                </span>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {currentQ.scenario}
                </p>
              </div>
            )}

            {/* Question Text */}
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-snug">
                {currentQ.questionText}
              </h2>
            </div>

            {/* Code Snippet if applicable */}
            {currentQ.codeSnippet && (
              <div className="rounded-lg bg-slate-900 text-slate-100 p-3.5 font-mono text-xs overflow-x-auto border border-slate-800">
                <div className="flex items-center gap-2 pb-2 mb-2 border-b border-slate-800 text-[10px] text-slate-400 font-bold uppercase">
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Technical Reference</span>
                </div>
                <pre>{currentQ.codeSnippet}</pre>
              </div>
            )}

            {/* Options */}
            <div className="space-y-3 pt-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Select Methodologically Sound Action
              </span>

              {currentQ.options.map((option) => {
                const isSelected = selectedOption === option.id;
                // Task 16: correctness is only ever known once the backend has verified the answer
                // (assessmentAnswerResults, populated on Next/Complete) — both entry points now run
                // the identical real assessment, so there is no longer a mock-data path where the
                // correct answer is known upfront.
                const isCorrect = answerResult ? answerResult.isCorrect : null;
                const isKnown = answerResult != null;

                return (
                  <button
                    key={option.id}
                    onClick={() => handleSelectOption(option.id)}
                    disabled={!!answerResult}
                    className={`w-full text-left p-4 rounded-xl border transition-all text-xs flex items-start gap-3 ${
                      answerResult ? 'cursor-default' : ''
                    } ${
                      isSelected
                        ? isKnown
                          ? isCorrect
                            ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950 ring-1 ring-emerald-400'
                            : 'border-rose-500 bg-rose-50/50 text-rose-950 ring-1 ring-rose-400'
                          : 'border-blue-500 bg-blue-50/50 text-blue-950 ring-1 ring-blue-400'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 border font-mono font-bold text-[11px] ${
                        isSelected
                          ? isKnown
                            ? isCorrect
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-rose-600 text-white border-rose-600'
                            : 'bg-blue-600 text-white border-blue-600'
                          : 'border-slate-300 text-slate-500'
                      }`}
                    >
                      {option.id.split('-')[1]?.toUpperCase()}
                    </div>
                    <span className="leading-relaxed font-medium flex-1">{option.text}</span>
                  </button>
                );
              })}
            </div>

            {/* Explanation Drawer */}
            {(showExplanation || selectedOption) && (
              <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2 border border-slate-800 animate-fadeIn">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-blue-300 uppercase tracking-wider text-[10px]">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                    <span>Verification Status</span>
                  </div>
                  {answerResult == null ? (
                    <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono text-[10px] font-bold border border-blue-500/30">
                      RECORDED • VERIFYING
                    </span>
                  ) : answerResult.isCorrect ? (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/30">
                      CORRECT • LEVEL VERIFIED
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono text-[10px] font-bold border border-rose-500/30">
                      INCORRECT • GAP FLAGGED
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {answerResult
                    ? `Your response updated the confidence estimate for ${currentQ.competencyName} to ${Math.round(
                        answerResult.updatedConfidence * 100
                      )}% (next probe difficulty: Level ${answerResult.updatedDifficulty}).`
                    : currentQ.explanation ||
                      'This response has been recorded and will be verified when you move to the next question.'}
                </p>
              </div>
            )}

            {/* Navigation Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                onClick={previousQuestion}
                disabled={currentQuestionIndex === 0}
                className="btn-secondary text-xs flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              {isLastQuestion ? (
                <button
                  onClick={handleFinish}
                  disabled={!!loading.assessment || !selectedOption}
                  className="btn-primary text-xs flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800"
                >
                  <span>Complete Assessment</span>
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  disabled={!!loading.assessment || !selectedOption}
                  className="btn-primary text-xs flex items-center gap-2"
                >
                  <span>{loading.assessment ? 'Loading…' : 'Next Question'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
            {errors.assessment && <ErrorState error={errors.assessment} onRetry={nextQuestion} />}
          </div>
        </div>

        {/* Sidebar: Adaptive Assessment Intelligence Feed */}
        <div className="space-y-4">
          <div className="card-enterprise p-5 bg-slate-900 text-white space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <Cpu className="w-4 h-4 text-blue-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Assessment Intelligence Feed
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700 space-y-1">
                <span className="text-[10px] font-mono uppercase font-bold text-blue-400">
                  Current Probe Hypothesis
                </span>
                <p className="text-slate-300 text-[11px] leading-snug">
                  {currentQ.probingReason}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700 space-y-1">
                <span className="text-[10px] font-mono uppercase font-bold text-emerald-400">
                  Adaptive Progression Note
                </span>
                <p className="text-slate-300 text-[11px] leading-snug">
                  {currentQ.adaptiveBranchNote}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 space-y-2">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block">
                Verification Ledger
              </span>
              <div className="space-y-1.5 text-[11px]">
                {verificationLedger.length === 0 ? (
                  <p className="text-slate-500 italic">
                    No competencies verified yet — answer a question to begin.
                  </p>
                ) : (
                  verificationLedger.map(entry => (
                    <div key={entry.competencyId} className="flex items-center justify-between text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${entry.isGap ? 'bg-rose-400' : 'bg-emerald-400'}`}
                        />
                        {entry.competencyName}
                      </span>
                      <span
                        className={`font-mono font-bold ${entry.isGap ? 'text-rose-400' : 'text-emerald-400'}`}
                      >
                        {entry.isGap ? 'Gap' : 'Verified'} L{entry.verifiedLevel} ({Math.round(entry.confidence * 100)}%)
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
