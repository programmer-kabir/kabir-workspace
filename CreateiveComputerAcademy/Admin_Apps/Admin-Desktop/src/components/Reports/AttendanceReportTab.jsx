import React, { useState } from 'react';
import {
  FiCheckCircle,
  FiAlertCircle,
  FiXCircle,
  FiGrid,
  FiList,
  FiCalendar
} from 'react-icons/fi';
import ReportStatsGrid from './ReportStatsGrid';
import MonthlyRosterView from './MonthlyRosterView';

/**
 * AttendanceReportTab Component
 * Coordinates the entire attendance section: Metric cards, View Switcher (Table vs Monthly Roster Grid),
 * and the detailed day-by-day attendance log.
 */
const AttendanceReportTab = (props) => {
  const { attReport } = props;
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'roster'

  if (!attReport) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 shadow-sm text-slate-400 font-bold italic">
        Select an employee and period to load attendance logs.
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* 1. Attendance Metrics Cards */}
      <ReportStatsGrid {...props} activeTab="attendance" />

      {/* 2. View Mode Toggle Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <h3 className="font-black text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
            {viewMode === 'table' ? <FiList className="text-blue-600" /> : <FiGrid className="text-blue-600" />}
            <span>{viewMode === 'table' ? 'Daily Attendance Log Table' : 'Monthly Roster & Shift Matrix'}</span>
          </h3>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
            {attReport.history?.length || 0} Days
          </span>
        </div>

        {/* View Switcher: Table vs Monthly Roster Grid */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/80 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'table'
              ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
          >
            <FiList size={13} />
            <span>Table View</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('roster')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'roster'
              ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
          >
            <FiGrid size={13} />
            <span>Monthly Roster Matrix</span>
          </button>
        </div>
      </div>

      {/* 3. Conditional View: Monthly Roster Grid vs Standard Table */}
      {viewMode === 'roster' ? (
        <MonthlyRosterView {...props} />
      ) : (
        /* Attendance Log Table */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 text-xs font-black uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Check In</th>
                  <th className="py-4 px-6">Check Out</th>
                  <th className="py-4 px-6">Working Hours</th>
                  <th className="py-4 px-6">Break Time</th>
                  <th className="py-4 px-6">Overtime/Short</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-slate-700 dark:text-slate-300">
                {attReport.history && attReport.history.length > 0 ? (
                  attReport.history.map((row, index) => (
                    <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-800 dark:text-slate-100">
                        {new Date(row.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${row.status === 'Present' ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400' :
                          row.status === 'Late' ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20 text-amber-700 dark:text-amber-400' :
                            row.status === 'Absent' ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20 text-rose-700 dark:text-rose-400' :
                              row.status === 'Weekend' ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-400' :
                                'bg-slate-50 dark:bg-slate-800/50 border-slate-150 text-slate-500'
                          }`}>
                          {row.status === 'Present' && <FiCheckCircle />}
                          {row.status === 'Late' && <FiAlertCircle />}
                          {row.status === 'Absent' && <FiXCircle />}
                          <span>{row.status}</span>
                        </span>
                      </td>
                      <td className="py-4 px-6 font-semibold text-slate-500 dark:text-slate-400">{row.check_in || '-'}</td>
                      <td className="py-4 px-6 font-semibold text-slate-500 dark:text-slate-400">{row.check_out || '-'}</td>
                      <td className="py-4 px-6 font-bold text-slate-700 dark:text-slate-200">{row.total_hours || '-'}</td>
                      <td className="py-4 px-6 font-bold text-slate-700 dark:text-slate-200">{row.total_break_minutes > 0 ? `${row.total_break_minutes}m` : '-'}</td>
                      <td className="py-4 px-6">
                        {row.overtime ? (
                          <span className={`font-black ${row.overtime.startsWith('+') ? 'text-blue-600 dark:text-blue-400' : 'text-rose-500'}`}>
                            {row.overtime}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-400 font-bold italic">
                      No attendance records found for this range.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceReportTab;
