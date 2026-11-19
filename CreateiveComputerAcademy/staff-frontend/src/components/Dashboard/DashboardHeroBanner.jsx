import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { HiSparkles } from 'react-icons/hi';
import { FiChevronRight, FiAward } from 'react-icons/fi';
import AnimatedCounter from '../AnimatedCounter';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export default function DashboardHeroBanner({
  currentUser,
  completedTasks = [],
  reviewTasks = [],
  rejectedTasks = []
}) {
  const firstName = currentUser?.name?.split(' ')[0] || 'Member';
  const [career, setCareer] = useState(null);

  useEffect(() => {
    if (!currentUser?.id) return;
    axios.get(`${API_BASE}api/gamification/get_my_career.php?user_id=${currentUser.id}`)
      .then(res => {
        if (res.data?.status === 'success') {
          setCareer(res.data.data);
        }
      })
      .catch(() => {});
  }, [currentUser]);

  const levelInfo = career?.level_info || { level: 1, title: 'Bronze Associate 🥉' };

  return (
    <div className="bg-gradient-to-r from-white via-indigo-50/30 to-slate-50 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-[2.5rem] p-8 md:p-10 text-slate-900 dark:text-white shadow-xl dark:shadow-2xl relative overflow-hidden transition-colors duration-300">
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-white/10 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider backdrop-blur-sm border border-indigo-200/80 dark:border-white/10">
              <HiSparkles className="text-amber-500" />
              <span>Workspace Command Center</span>
            </div>

            <Link
              to="/career"
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50/80 hover:bg-amber-100/90 dark:bg-gradient-to-r dark:from-amber-500/20 dark:via-yellow-500/20 dark:to-indigo-500/20 border border-amber-300/80 dark:border-amber-400/40 text-amber-900 dark:text-amber-300 text-xs font-bold hover:scale-105 transition-all shadow-sm dark:shadow-md group"
              title="View Career & Leaderboard"
            >
              <FiAward className="text-amber-600 dark:text-amber-400" />
              <span>Lv.{levelInfo.level} {levelInfo.title}</span>
              <span className="text-slate-300 dark:text-white/40">•</span>
              <span className="text-rose-600 dark:text-rose-400 font-extrabold flex items-center gap-0.5">🔥 {career?.current_streak || 0}d</span>
              <FiChevronRight size={13} className="text-amber-600 dark:text-amber-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black mb-2 flex items-center gap-3 tracking-tight text-slate-900 dark:text-white">
            Good day, {firstName}! <span className="inline-block">👋</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm sm:text-base max-w-lg leading-relaxed">
            Track your company master performance, quality ratings, and workforce standings in real-time.
          </p>
        </div>

        {/* Quick Metrics Capsule */}
        <div className="bg-white/90 dark:bg-white/5 backdrop-blur-md border border-slate-200/90 dark:border-white/10 rounded-3xl p-4 sm:p-5 flex items-center gap-3 sm:gap-6 shadow-lg dark:shadow-2xl">
          <div className="text-center px-3 sm:px-4 border-r border-slate-200/80 dark:border-white/10">
            <p className="text-3xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
              <AnimatedCounter value={completedTasks.length} />
            </p>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-1">Done</p>
          </div>
          <div className="text-center px-3 sm:px-4 border-r border-slate-200/80 dark:border-white/10">
            <p className="text-3xl font-black tracking-tight text-amber-600 dark:text-amber-400">
              <AnimatedCounter value={reviewTasks.length} />
            </p>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-1">Review</p>
          </div>
          <div className="text-center px-3 sm:px-4">
            <p className={`text-3xl font-black tracking-tight ${rejectedTasks.length > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-200'}`}>
              <AnimatedCounter value={rejectedTasks.length} />
            </p>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-1">Fix Need</p>
          </div>
        </div>
      </div>
    </div>
  );
}

