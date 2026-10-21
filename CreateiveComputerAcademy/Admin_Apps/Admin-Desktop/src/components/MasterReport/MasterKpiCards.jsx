import React from 'react';
import {
  FiUsers,
  FiCheckCircle,
  FiAward,
  FiStar
} from 'react-icons/fi';

const MasterKpiCards = ({ summary, period }) => {
  if (!summary) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* 1. Total Workforce */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Active Workforce</p>
            <h3 className="text-3xl font-black text-slate-800 dark:text-white">
              {summary.total_employees} <span className="text-xs font-bold text-slate-400 font-normal">Employees</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-2 font-medium">
              Calendar Range: {period?.days_count || 0} Days
            </p>
          </div>
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center">
            <FiUsers size={22} />
          </div>
        </div>
      </div>

      {/* 2. Overall Attendance Rate */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Company Attendance</p>
            <h3 className="text-3xl font-black text-emerald-700 dark:text-emerald-400">
              {summary.overall_attendance_rate}%
            </h3>
            <p className="text-[11px] text-slate-400 mt-2 font-medium flex items-center gap-2">
              <span>P: <strong className="text-emerald-600">{summary.total_present_count}</strong></span>
              <span>L: <strong className="text-amber-500">{summary.total_late_count}</strong></span>
              <span>A: <strong className="text-rose-500">{summary.total_absent_count}</strong></span>
            </p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center">
            <FiCheckCircle size={22} />
          </div>
        </div>
      </div>

      {/* 3. Tasks Completed & Pipeline */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500"></div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">Tasks Output</p>
            <h3 className="text-3xl font-black text-indigo-700 dark:text-indigo-400">
              {summary.total_tasks_completed} <span className="text-xs text-slate-400 font-normal">/ {summary.total_tasks_assigned}</span>
            </h3>
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800/40">
                {summary.total_tasks_in_review || 0} Review
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40">
                {summary.total_tasks_in_progress || 0} Progress
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40">
                {summary.total_tasks_rejected || 0} Rej
              </span>
            </div>
          </div>
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center shrink-0">
            <FiAward size={22} />
          </div>
        </div>
      </div>

      {/* 4. Quality Stars & Office Duty Duration */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-amber-500"></div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">Company Quality & Duty</p>
            <div className="flex items-center gap-2">
              <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400">
                ⭐ {summary.avg_company_rating || 5.0}
              </h3>
              <span className="text-xs font-bold text-slate-400">/ 5.0 Rating</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 font-medium">
              Office Duty: <strong className="text-slate-700 dark:text-slate-300">{summary.total_worked_formatted}</strong> • Task Time: <strong className="text-purple-600 dark:text-purple-400">{summary.total_task_worked_formatted}</strong>
            </p>
          </div>
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center shrink-0">
            <FiStar size={22} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MasterKpiCards;
