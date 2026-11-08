import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiClock, FiPlayCircle, FiXCircle, FiEye } from 'react-icons/fi';

export default function DashboardMetricGrid({
  attendance,
  mangoSummary,
  todoTasks = [],
  inProgressTasks = [],
  rejectedTasks = [],
  reviewTasks = []
}) {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-5">
      {/* 1. Today's Attendance Status */}
      <div
        onClick={() => navigate('/attendance')}
        className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Today's Duty</p>
          <span className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
            <FiClock size={16} />
          </span>
        </div>
        {attendance ? (
          <div>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
              {attendance.status}
            </p>
            <p className="text-xs font-semibold text-slate-500 mt-1">
              In: <span className="text-slate-900 dark:text-white font-bold">{attendance.check_in || '—'}</span>
            </p>
          </div>
        ) : (
          <div>
            <p className="text-lg font-black text-slate-400 tracking-tight">Not Checked In</p>
            <span className="inline-block px-2 py-0.5 mt-1 rounded-md text-[10px] font-extrabold bg-rose-50 dark:bg-rose-950/50 text-rose-600 border border-rose-200 dark:border-rose-900">
              Action Required
            </span>
          </div>
        )}
      </div>

      {/* 2. Mango Break Bank Balance */}
      <div
        onClick={() => navigate('/mango-tree')}
        className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Mango Bank</p>
          <span className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center text-sm">
            🥭
          </span>
        </div>
        <div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
            {mangoSummary?.ripe_mangoes_count || 0} <span className="text-sm font-bold text-slate-400">Ripe</span>
          </p>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            OT: <span className="text-slate-900 dark:text-white font-bold">+{mangoSummary?.available_break_hours || 0}h</span>
          </p>
        </div>
      </div>

      {/* 3. In Progress / To-Do Pipeline */}
      <div
        onClick={() => navigate('/tasks', { state: { activeTab: 'In Progress' } })}
        className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">In Pipeline</p>
          <span className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center">
            <FiPlayCircle size={16} />
          </span>
        </div>
        <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          {todoTasks.length + inProgressTasks.length} <span className="text-xs font-medium text-slate-400">Tasks</span>
        </p>
        <p className="text-[11px] text-blue-600 dark:text-blue-400 font-bold mt-1">Active Pipeline</p>
      </div>

      {/* 4. Action Required (Rejected Tasks) */}
      <div
        onClick={() => navigate('/tasks', { state: { activeTab: 'Rejected' } })}
        className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Rejections</p>
          <span className={`w-8 h-8 rounded-xl flex items-center justify-center ${rejectedTasks.length > 0 ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/50' : 'bg-slate-100 text-slate-400'}`}>
            <FiXCircle size={16} />
          </span>
        </div>
        <p className={`text-2xl font-black tracking-tight ${rejectedTasks.length > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
          {rejectedTasks.length}
        </p>
        <p className="text-[11px] text-rose-600 dark:text-rose-400 font-bold mt-1">Needs Correction</p>
      </div>

      {/* 5. In Review Tasks */}
      <div
        onClick={() => navigate('/tasks', { state: { activeTab: 'In Review' } })}
        className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Under Review</p>
          <span className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center">
            <FiEye size={16} />
          </span>
        </div>
        <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          {reviewTasks.length}
        </p>
        <p className="text-[11px] text-purple-600 dark:text-purple-400 font-bold mt-1">Awaiting Review</p>
      </div>
    </div>
  );
}

