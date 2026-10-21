import React from 'react';
import {
  FiCalendar,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiUserCheck,
  FiTrendingUp,
  FiAlertCircle,
  FiFileText
} from 'react-icons/fi';

/**
 * ReportStatsGrid Component
 * Displays tab-specific metric cards (Attendance metrics or Task Deliverable metrics)
 */
const ReportStatsGrid = ({
  activeTab,
  attReport,
  taskReport
}) => {
  // TAB 1: ATTENDANCE STATS CARDS (8 Cards)
  if (activeTab === 'attendance' && attReport?.summary) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Working Days */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Working Days</p>
            <h3 className="text-3xl font-black text-slate-800 dark:text-slate-100">{attReport.summary.total_days || 0}</h3>
          </div>
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <FiCalendar size={20} />
          </div>
        </div>

        {/* Present Days */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
          <div>
            <p className="text-xs font-black text-emerald-600 uppercase tracking-wider mb-1">Present Days</p>
            <h3 className="text-3xl font-black text-emerald-700 dark:text-emerald-400">{attReport.summary.present || 0}</h3>
          </div>
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <FiCheckCircle size={20} />
          </div>
        </div>

        {/* Absent Days */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-rose-500"></div>
          <div>
            <p className="text-xs font-black text-rose-600 uppercase tracking-wider mb-1">Absent Days</p>
            <h3 className="text-3xl font-black text-rose-700 dark:text-rose-400">{attReport.summary.absent || 0}</h3>
          </div>
          <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/40 text-rose-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <FiXCircle size={20} />
          </div>
        </div>

        {/* Late Entries */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-amber-500"></div>
          <div>
            <p className="text-xs font-black text-amber-600 uppercase tracking-wider mb-1">Late Entries</p>
            <h3 className="text-3xl font-black text-amber-700 dark:text-amber-400">{attReport.summary.late || 0}</h3>
          </div>
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/40 text-amber-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <FiClock size={20} />
          </div>
        </div>

        {/* Expected Duty */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-violet-500"></div>
          <div>
            <p className="text-xs font-black text-violet-600 uppercase tracking-wider mb-1">Expected Duty</p>
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 leading-tight mt-1">{attReport.summary.total_expected || '0h 0m'}</h3>
          </div>
          <div className="w-12 h-12 bg-violet-50 dark:bg-violet-950/40 text-violet-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <FiClock size={20} />
          </div>
        </div>

        {/* Hours Worked */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500"></div>
          <div>
            <p className="text-xs font-black text-indigo-600 uppercase tracking-wider mb-1">Hours Worked</p>
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 leading-tight mt-1">{attReport.summary.total_worked || '0h 0m'}</h3>
          </div>
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <FiUserCheck size={20} />
          </div>
        </div>

        {/* Overtime */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-teal-500"></div>
          <div>
            <p className="text-xs font-black text-teal-600 uppercase tracking-wider mb-1">Overtime</p>
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 leading-tight mt-1">{attReport.summary.total_overtime || '0h 0m'}</h3>
          </div>
          <div className="w-12 h-12 bg-teal-50 dark:bg-teal-950/40 text-teal-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <FiTrendingUp size={20} />
          </div>
        </div>

        {/* Short Time */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-rose-500"></div>
          <div>
            <p className="text-xs font-black text-rose-600 uppercase tracking-wider mb-1">Short Time</p>
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 leading-tight mt-1">{attReport.summary.total_short_time || '0h 0m'}</h3>
          </div>
          <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/40 text-rose-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <FiAlertCircle size={20} />
          </div>
        </div>
      </div>
    );
  }

  // TAB 2: TASK STATS CARDS (5 Cards)
  if (activeTab === 'tasks' && taskReport?.summary) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {/* Total Assigned */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Total Assigned</p>
            <h3 className="text-3xl font-black text-slate-800 dark:text-white">{taskReport.summary.total_assigned || 0}</h3>
          </div>
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <FiFileText size={20} />
          </div>
        </div>

        {/* Completed */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
          <div>
            <p className="text-xs font-black text-emerald-600 uppercase tracking-wider mb-1">Completed</p>
            <h3 className="text-3xl font-black text-emerald-700 dark:text-emerald-400">{taskReport.summary.total_completed || 0}</h3>
          </div>
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <FiCheckCircle size={20} />
          </div>
        </div>

        {/* Delayed */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-rose-500"></div>
          <div>
            <p className="text-xs font-black text-rose-600 uppercase tracking-wider mb-1">Delayed</p>
            <h3 className="text-3xl font-black text-rose-700 dark:text-rose-400">{taskReport.summary.delayed_completions || 0}</h3>
          </div>
          <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/40 text-rose-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <FiAlertCircle size={20} />
          </div>
        </div>

        {/* Rejected */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
          <div>
            <p className="text-xs font-black text-red-600 uppercase tracking-wider mb-1">Rejected</p>
            <h3 className="text-3xl font-black text-red-700 dark:text-red-400">{taskReport.summary.total_rejected || 0}</h3>
          </div>
          <div className="w-12 h-12 bg-red-50 dark:bg-red-950/40 text-red-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <FiXCircle size={20} />
          </div>
        </div>

        {/* Resubmitted */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500"></div>
          <div>
            <p className="text-xs font-black text-indigo-600 uppercase tracking-wider mb-1">Resubmitted</p>
            <h3 className="text-3xl font-black text-indigo-700 dark:text-indigo-400">{taskReport.summary.total_resubmitted || 0}</h3>
          </div>
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <FiTrendingUp size={20} />
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default ReportStatsGrid;
