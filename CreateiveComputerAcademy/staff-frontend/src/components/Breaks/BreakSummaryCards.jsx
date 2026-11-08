import React from 'react';
import { FiClock, FiCheckCircle, FiCoffee } from 'react-icons/fi';
import { fmtMins } from './BreakHistoryTable';

const BreakSummaryCards = ({ summary }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Today's Total Break */}
      <div className="relative overflow-hidden rounded-xl bg-white/95 dark:bg-slate-900/95 p-5 border border-slate-200/90 dark:border-slate-800/90 shadow-2xs hover:shadow-md hover:border-amber-400/40 dark:hover:border-amber-500/40 transition-all duration-300 group">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-orange-500 opacity-90" />
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Today's Total Break
            </p>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight tabular-nums">
              {fmtMins(summary.today_minutes)}
            </h3>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-bold inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span>Across all breaks today</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/15 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
            <FiClock size={22} />
          </div>
        </div>
      </div>

      {/* Total Logged Breaks */}
      <div className="relative overflow-hidden rounded-xl bg-white/95 dark:bg-slate-900/95 p-5 border border-slate-200/90 dark:border-slate-800/90 shadow-2xs hover:shadow-md hover:border-emerald-400/40 dark:hover:border-emerald-500/40 transition-all duration-300 group">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-500 opacity-90" />
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Total Logged Breaks
            </p>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight tabular-nums">
              {summary.total_breaks}
            </h3>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>All time history records</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/15 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
            <FiCheckCircle size={22} />
          </div>
        </div>
      </div>

      {/* Cumulative Break Time */}
      <div className="relative overflow-hidden rounded-xl bg-white/95 dark:bg-slate-900/95 p-5 border border-slate-200/90 dark:border-slate-800/90 shadow-2xs hover:shadow-md hover:border-blue-400/40 dark:hover:border-blue-500/40 transition-all duration-300 group">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-90" />
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Cumulative Break Time
            </p>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight tabular-nums">
              {fmtMins(summary.total_minutes)}
            </h3>
            <p className="text-[11px] text-blue-600 dark:text-blue-400 font-bold inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span>Filtered time sum</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/15 to-indigo-500/10 dark:from-blue-500/20 dark:to-indigo-500/15 border border-blue-500/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
            <FiCoffee size={22} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BreakSummaryCards;

