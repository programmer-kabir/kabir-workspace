import React from 'react';
import { 
  FiActivity, FiInbox, FiClock, FiEye, FiCheckCircle, 
  FiXCircle, FiCalendar, FiUser 
} from 'react-icons/fi';

/**
 * ProfileStatsOverview
 * Displays performance metrics (task distribution) and attendance/hours overview.
 */
export default function ProfileStatsOverview({
  stats,
  attStats,
  loading,
}) {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin h-8 w-8 border-4 border-slate-200 dark:border-slate-700 border-t-blue-600 rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Performance Overview */}
      <div>
        <h3 className="text-sm font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          Performance Overview
        </h3>
        {stats ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-800 p-5 rounded-[1.5rem] border border-slate-100 dark:border-slate-700 shadow-[0_2px_15px_rgb(0,0,0,0.02)] relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-500 transition-colors">
              <div className="absolute top-0 right-0 p-4 opacity-5 dark:opacity-10 group-hover:opacity-10 transition-opacity text-slate-900 dark:text-white">
                <FiActivity size={64} />
              </div>
              <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Total Tasks</div>
              <div className="text-4xl font-black text-slate-800 dark:text-white">{stats.total}</div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 p-5 rounded-[1.5rem] border border-slate-200 dark:border-slate-700 shadow-[0_2px_15px_rgb(0,0,0,0.02)] relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-500 transition-colors">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-slate-500 dark:text-slate-400 group-hover:opacity-20 transition-opacity">
                <FiInbox size={64} />
              </div>
              <div className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1">To-Do</div>
              <div className="text-4xl font-black text-slate-700 dark:text-slate-200">{stats.to_do}</div>
            </div>

            <div className="bg-blue-50/50 dark:bg-blue-900/20 p-5 rounded-[1.5rem] border border-blue-100 dark:border-blue-800 shadow-[0_2px_15px_rgb(0,0,0,0.02)] relative overflow-hidden group hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-blue-600 dark:text-blue-400 group-hover:opacity-20 transition-opacity">
                <FiClock size={64} />
              </div>
              <div className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">In Progress</div>
              <div className="text-4xl font-black text-blue-700 dark:text-blue-300">{stats.in_progress}</div>
            </div>

            <div className="bg-amber-50/50 dark:bg-amber-900/20 p-5 rounded-[1.5rem] border border-amber-100 dark:border-amber-800 shadow-[0_2px_15px_rgb(0,0,0,0.02)] relative overflow-hidden group hover:border-amber-300 dark:hover:border-amber-600 transition-colors">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-amber-600 dark:text-amber-400 group-hover:opacity-20 transition-opacity">
                <FiEye size={64} />
              </div>
              <div className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1">In Review</div>
              <div className="text-4xl font-black text-amber-700 dark:text-amber-300">{stats.in_review}</div>
            </div>

            <div className="bg-emerald-50/50 dark:bg-emerald-900/20 p-5 rounded-[1.5rem] border border-emerald-100 dark:border-emerald-800 shadow-[0_2px_15px_rgb(0,0,0,0.02)] relative overflow-hidden group hover:border-emerald-300 dark:hover:border-emerald-600 transition-colors">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-emerald-600 dark:text-emerald-400 group-hover:opacity-20 transition-opacity">
                <FiCheckCircle size={64} />
              </div>
              <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Completed</div>
              <div className="text-4xl font-black text-emerald-700 dark:text-emerald-300">{stats.completed}</div>
            </div>

            <div className="bg-rose-50/50 dark:bg-rose-900/20 p-5 rounded-[1.5rem] border border-rose-100 dark:border-rose-800 shadow-[0_2px_15px_rgb(0,0,0,0.02)] relative overflow-hidden group hover:border-rose-300 dark:hover:border-rose-600 transition-colors">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-rose-600 dark:text-rose-400 group-hover:opacity-20 transition-opacity">
                <FiXCircle size={64} />
              </div>
              <div className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-1">Rejected</div>
              <div className="text-4xl font-black text-rose-700 dark:text-rose-300">{stats.rejected}</div>
            </div>
          </div>
        ) : (
          <div className="text-center text-sm text-slate-500 py-8 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 border-dashed">
            No performance data available.
          </div>
        )}
      </div>

      {/* Attendance Overview */}
      <div>
        <h3 className="text-sm font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          Attendance & Time Tracking
        </h3>
        {attStats ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-emerald-50/50 dark:bg-emerald-900/20 p-4 rounded-[1.5rem] border border-emerald-100 dark:border-emerald-800 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Present</div>
                <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300">{attStats.present}</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <FiCheckCircle />
              </div>
            </div>

            <div className="bg-rose-50/50 dark:bg-rose-900/20 p-4 rounded-[1.5rem] border border-rose-100 dark:border-rose-800 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest">Absent</div>
                <div className="text-2xl font-black text-rose-700 dark:text-rose-300">{attStats.absent}</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <FiXCircle />
              </div>
            </div>

            <div className="bg-amber-50/50 dark:bg-amber-900/20 p-4 rounded-[1.5rem] border border-amber-100 dark:border-amber-800 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">Leave</div>
                <div className="text-2xl font-black text-amber-700 dark:text-amber-300">{attStats.leave}</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <FiCalendar />
              </div>
            </div>

            <div className="bg-violet-50/50 dark:bg-violet-900/20 p-4 rounded-[1.5rem] border border-violet-100 dark:border-violet-800 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-widest">Expected Duty</div>
                <div className="text-xl font-black text-violet-700 dark:text-violet-300">{attStats.expected_duty || '0h 0m'}</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                <FiClock />
              </div>
            </div>

            <div className="bg-blue-50/50 dark:bg-blue-900/20 p-4 rounded-[1.5rem] border border-blue-100 dark:border-blue-800 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Hours Worked</div>
                <div className="text-xl font-black text-blue-700 dark:text-blue-300">{attStats.hours_worked || '0h 0m'}</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <FiUser />
              </div>
            </div>

            <div className="bg-teal-50/50 dark:bg-teal-900/20 p-4 rounded-[1.5rem] border border-teal-100 dark:border-teal-800 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest">Overtime</div>
                <div className="text-xl font-black text-teal-700 dark:text-teal-300">{attStats.overtime || '0h 0m'}</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <FiActivity />
              </div>
            </div>

            <div className="bg-rose-50/50 dark:bg-rose-900/20 p-4 rounded-[1.5rem] border border-rose-100 dark:border-rose-800 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest">Short Time</div>
                <div className="text-xl font-black text-rose-700 dark:text-rose-300">{attStats.short_time || '0h 0m'}</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <FiXCircle />
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-sm text-slate-500 py-8 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 border-dashed">
            No attendance data available.
          </div>
        )}
      </div>
    </div>
  );
}

