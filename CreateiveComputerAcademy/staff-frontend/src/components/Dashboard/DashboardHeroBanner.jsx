import React from 'react';
import { HiSparkles } from 'react-icons/hi';
import AnimatedCounter from '../AnimatedCounter';

export default function DashboardHeroBanner({
  currentUser,
  completedTasks = [],
  reviewTasks = [],
  rejectedTasks = []
}) {
  const firstName = currentUser?.name?.split(' ')[0] || 'Member';

  return (
    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-[2.5rem] p-8 md:p-10 text-white shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2 backdrop-blur-sm border border-white/10">
            <HiSparkles className="text-amber-400" />
            <span>Workspace Command Center</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black mb-2 flex items-center gap-3 tracking-tight">
            Good day, {firstName}! <span className="inline-block">👋</span>
          </h1>
          <p className="text-slate-400 font-medium text-sm sm:text-base max-w-lg leading-relaxed">
            Track your company master performance, quality ratings, and workforce standings in real-time.
          </p>
        </div>

        {/* Quick Metrics Capsule */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-4 sm:p-5 flex items-center gap-3 sm:gap-6 shadow-2xl">
          <div className="text-center px-3 sm:px-4 border-r border-white/10">
            <p className="text-3xl font-black tracking-tight text-emerald-400">
              <AnimatedCounter value={completedTasks.length} />
            </p>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mt-1">Done</p>
          </div>
          <div className="text-center px-3 sm:px-4 border-r border-white/10">
            <p className="text-3xl font-black tracking-tight text-amber-400">
              <AnimatedCounter value={reviewTasks.length} />
            </p>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mt-1">Review</p>
          </div>
          <div className="text-center px-3 sm:px-4">
            <p className={`text-3xl font-black tracking-tight ${rejectedTasks.length > 0 ? 'text-rose-400' : 'text-slate-200'}`}>
              <AnimatedCounter value={rejectedTasks.length} />
            </p>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mt-1">Fix Need</p>
          </div>
        </div>
      </div>
    </div>
  );
}

