import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  FiAward, FiRefreshCw, FiArrowRight, FiCheckCircle,
  FiXCircle, FiActivity, FiZap, FiTarget, FiClock
} from 'react-icons/fi';

const TypingResultModal = ({
  isOpen,
  stats,
  exercise,
  lesson,
  onNext,
  onRetry,
  onReturnToMenu
}) => {
  if (!isOpen || !stats) return null;

  const {
    grossWpm = 0,
    netWpm = 0,
    accuracy = 0,
    errors = 0,
    timeSpentSec = 0,
    weakKeys = []
  } = stats;

  const minAccuracy = lesson?.passingCriteria?.minAccuracy || 92;
  const minWpm = lesson?.passingCriteria?.minWpm || 12;
  const isPassed = accuracy >= minAccuracy && netWpm >= minWpm;

  // Star Rating Calculation
  let stars = 0;
  if (isPassed) {
    if (accuracy >= 98 && netWpm >= (lesson?.passingCriteria?.targetWpm || 20)) {
      stars = 3;
    } else if (accuracy >= 95) {
      stars = 2;
    } else {
      stars = 1;
    }
  }

  useEffect(() => {
    if (isPassed) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {}
    }
  }, [isPassed]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 text-slate-800 dark:text-slate-100">
        
        {/* Status Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 text-white text-3xl shadow-xl shadow-purple-500/25 mx-auto">
            {isPassed ? '🏆' : '🎯'}
          </div>

          <h2 className="text-2xl font-black">
            {isPassed ? 'Great Job! Exercise Completed!' : 'Keep Practicing! Needs Improvement'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {lesson?.title} — {exercise?.title}
          </p>

          {/* Star Rating Display */}
          {isPassed && (
            <div className="flex justify-center gap-1 text-2xl pt-1">
              <span className={stars >= 1 ? 'text-amber-400 scale-110' : 'text-slate-300 dark:text-slate-700'}>★</span>
              <span className={stars >= 2 ? 'text-amber-400 scale-110' : 'text-slate-300 dark:text-slate-700'}>★</span>
              <span className={stars >= 3 ? 'text-amber-400 scale-110' : 'text-slate-300 dark:text-slate-700'}>★</span>
            </div>
          )}
        </div>

        {/* Core Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50">
            <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">Net Speed</div>
            <div className="text-xl font-black text-indigo-700 dark:text-indigo-300 mt-0.5">{netWpm}</div>
            <div className="text-[9px] text-slate-400 font-mono">WPM</div>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50">
            <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Accuracy</div>
            <div className="text-xl font-black text-emerald-700 dark:text-emerald-300 mt-0.5">{accuracy}%</div>
            <div className="text-[9px] text-slate-400 font-mono">Target: {minAccuracy}%</div>
          </div>

          <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/50">
            <div className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase">Errors</div>
            <div className="text-xl font-black text-rose-700 dark:text-rose-300 mt-0.5">{errors}</div>
            <div className="text-[9px] text-slate-400 font-mono">Total Misses</div>
          </div>

          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/50">
            <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase">Time</div>
            <div className="text-xl font-black text-amber-700 dark:text-amber-300 mt-0.5">{timeSpentSec}s</div>
            <div className="text-[9px] text-slate-400 font-mono">Duration</div>
          </div>
        </div>

        {/* Weak Keys Mistake Analyzer */}
        {weakKeys && weakKeys.length > 0 && (
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-black text-amber-600 dark:text-amber-400">
              <span>⚠️ Weak Keys Detected:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {weakKeys.map((k, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-600 dark:text-rose-400 font-mono font-bold text-xs border border-rose-500/30"
                >
                  Key '{k.key?.toUpperCase()}' ({k.errors} errors)
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <button
            onClick={onRetry}
            className="flex-1 py-3 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 font-black text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <FiRefreshCw size={14} />
            <span>Try Again</span>
          </button>

          {isPassed ? (
            <button
              onClick={onNext}
              className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-500 hover:opacity-90 text-white font-black text-xs shadow-lg shadow-purple-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Next Step</span>
              <FiArrowRight size={14} />
            </button>
          ) : (
            <button
              onClick={onReturnToMenu}
              className="flex-1 py-3 px-4 rounded-2xl bg-slate-800 text-white font-black text-xs hover:bg-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Back to Lessons</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TypingResultModal;
