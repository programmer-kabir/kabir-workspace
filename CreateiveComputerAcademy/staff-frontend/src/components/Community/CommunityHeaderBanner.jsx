import React from 'react';
import { HiSparkles } from 'react-icons/hi';
import { FiRefreshCw } from 'react-icons/fi';

export default function CommunityHeaderBanner({ onRefresh, loading = false }) {
  return (
    <div className="bg-gradient-to-r from-violet-600/10 via-indigo-600/10 to-teal-600/10 dark:from-violet-950/40 dark:via-slate-900 dark:to-indigo-950/30 p-6 md:p-8 rounded-3xl border border-indigo-500/20 dark:border-indigo-500/30 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-100 dark:bg-violet-950/60 border border-violet-300 dark:border-violet-700/60 text-violet-800 dark:text-violet-300 text-xs font-black uppercase tracking-wider mb-2">
          <HiSparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>CCA Community Wall</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <span>Staff Community Feed</span>
          <span className="text-2xl animate-pulse">📢</span>
        </h1>
        <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-xl">
          Share academy announcements, team achievements, discussions, questions, and moments with colleagues in real-time!
        </p>
      </div>

      <button
        type="button"
        onClick={onRefresh}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 transition shadow-xs cursor-pointer disabled:opacity-50"
      >
        <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        <span>Refresh Feed</span>
      </button>
    </div>
  );
}

