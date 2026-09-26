import React, { useEffect, useRef } from 'react';
import { FiCheckCircle, FiTarget, FiZap, FiAward } from 'react-icons/fi';
import { triggerConfetti } from '../utils/confetti';
import { soundFx } from '../utils/soundFx';

const DailyProgressBar = ({ tasks = [] }) => {
  const hasTriggeredRef = useRef(false);

  // Filter staff's assigned tasks (exclude unassigned)
  const myTasks = tasks.filter(t => t.status !== 'Unassigned');
  const total = myTasks.length;
  const completed = myTasks.filter(t => t.status === 'Completed').length;
  const inReview = myTasks.filter(t => t.status === 'In Review').length;
  const inProgress = myTasks.filter(t => t.status === 'In Progress').length;

  const percent = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;

  useEffect(() => {
    if (total > 0 && percent === 100 && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true;
      triggerConfetti(0.5, 0.4);
      soundFx.playSuccess();
    } else if (percent < 100) {
      hasTriggeredRef.current = false;
    }
  }, [percent, total]);

  if (total === 0) return null;

  return (
    <div className="mb-6 bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-purple-600/10 dark:from-blue-500/10 dark:via-indigo-500/10 dark:to-purple-500/10 border border-blue-200/80 dark:border-blue-900/50 rounded-2xl p-4 sm:p-5 shadow-xs relative overflow-hidden backdrop-blur-md">
      {/* Subtle background glow */}
      <div className="absolute top-0 right-0 w-64 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-xs shrink-0 ${
            percent === 100 
              ? 'bg-emerald-500 text-white animate-bounce' 
              : 'bg-blue-600 text-white'
          }`}>
            {percent === 100 ? <FiAward size={20} /> : <FiTarget size={20} />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-white">
                Daily Focus & Goal
              </h3>
              {percent === 100 ? (
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                  🎉 100% Crushed!
                </span>
              ) : percent >= 50 ? (
                <span className="text-[10px] font-black uppercase tracking-wider bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full border border-blue-300 dark:border-blue-800">
                  ⚡ On Fire!
                </span>
              ) : null}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {completed} of {total} tasks completed
              {inProgress > 0 && ` • ${inProgress} in progress`}
              {inReview > 0 && ` • ${inReview} in review`}
            </p>
          </div>
        </div>

        <div className="flex items-baseline gap-1 self-end sm:self-center">
          <span className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400 font-mono">
            {percent}%
          </span>
          <span className="text-xs font-semibold text-slate-400 uppercase">done</span>
        </div>
      </div>

      {/* Progress Track */}
      <div className="relative w-full h-3 bg-slate-200/80 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 relative"
          style={{ width: `${percent}%` }}
        >
          {/* Shimmer animation */}
          <div className="absolute inset-0 bg-white/25 animate-pulse" />
        </div>
      </div>
    </div>
  );
};

export default DailyProgressBar;
