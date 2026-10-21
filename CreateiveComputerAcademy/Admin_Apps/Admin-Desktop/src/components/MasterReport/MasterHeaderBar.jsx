import React from 'react';
import {
  FiDownload,
  FiPrinter,
  FiCalendar,
  FiClock,
  FiLayers,
  FiTrendingUp,
  FiFilter,
  FiRefreshCw
} from 'react-icons/fi';

const MasterHeaderBar = ({
  loading,
  reportData,
  filterType,
  setFilterType,
  selectedYear,
  setSelectedYear,
  selectedMonth,
  setSelectedMonth,
  customStart,
  setCustomStart,
  customEnd,
  setCustomEnd,
  activeDateRange,
  fetchReport,
  handleExportExcel,
  handleExportPDF,
  handleExportCSV,
  MONTH_NAMES = [],
  AVAILABLE_YEARS = []
}) => {
  return (
    <>
      {/* ──────── Header Title & Global Actions ──────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <span>Company Master Analytics & Performance</span>
            <span className="text-xs px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-full uppercase tracking-wider shadow-sm">
              Workforce Intelligence
            </span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium text-sm">
            Comprehensive multi-dimensional analysis of employee output, attendance fidelity, and task durations.
          </p>
        </div>

        {/* Global Export Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportExcel}
            disabled={loading || !reportData}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
            title="Download formatted Excel Spreadsheet"
          >
            <FiDownload size={15} />
            <span>Excel (.xls)</span>
          </button>
          <button
            onClick={handleExportPDF}
            disabled={loading || !reportData}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
            title="Export as Landscape PDF Document"
          >
            <FiPrinter size={15} />
            <span>PDF Export</span>
          </button>
        </div>
      </div>

      {/* ──────── Control Panel: Modern Pill Filter Bar & Aggregated Summary ──────── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm mb-8 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 lg:pb-0">
            {[
              { id: 'this_month', label: 'This Month', icon: FiCalendar },
              { id: 'last_month', label: 'Last Month', icon: FiClock },
              { id: 'specific_month', label: 'Select Month', icon: FiLayers },
              { id: 'all_time', label: 'All-Time', icon: FiTrendingUp },
              { id: 'custom', label: 'Custom Range', icon: FiFilter },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setFilterType(id)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  filterType === id
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-500/30'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200/60 dark:border-slate-700/60'
                }`}
              >
                <Icon size={14} />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* Right Side: Active Date Range Pill Badge, Refresh & CSV */}
          <div className="flex items-center gap-2.5 self-start lg:self-auto">
            <div className="px-3.5 py-2 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center gap-2 shadow-xs">
              <FiCalendar size={14} />
              <span>{activeDateRange?.start} → {activeDateRange?.end}</span>
            </div>

            <button
              onClick={fetchReport}
              disabled={loading}
              className="p-2.5 bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl transition-colors border border-slate-200 dark:border-slate-700/60 cursor-pointer disabled:opacity-50"
              title="Refresh Report Data"
            >
              <FiRefreshCw className={loading ? "animate-spin text-blue-600" : ""} size={16} />
            </button>

            <button
              onClick={handleExportCSV}
              disabled={loading || !reportData}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-2xl transition-colors border border-slate-200 dark:border-slate-700/60 cursor-pointer disabled:opacity-50"
              title="Export CSV"
            >
              <FiDownload size={14} />
              <span>CSV</span>
            </button>
          </div>
        </div>

        {/* Dynamic Month / Year Selectors */}
        {filterType === 'specific_month' && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Select Month & Year:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-white outline-none cursor-pointer"
            >
              {MONTH_NAMES.map((mName, idx) => (
                <option key={idx} value={idx}>{mName}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-white outline-none cursor-pointer"
            >
              {AVAILABLE_YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        )}

        {/* Dynamic Custom Date Inputs */}
        {filterType === 'custom' && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">From:</span>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-white outline-none cursor-pointer"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">To:</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-white outline-none cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Aggregated Totals Summary Bar (Like Leaderboard) */}
        {reportData && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-slate-500 dark:text-slate-400">Members: <strong className="text-slate-900 dark:text-white font-black">{reportData.company_summary?.total_employees}</strong></span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-slate-500 dark:text-slate-400">Total Assigned: <strong className="text-slate-900 dark:text-white font-black">{reportData.company_summary?.total_tasks_assigned}</strong></span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-slate-500 dark:text-slate-400">Completed: <strong className="text-emerald-600 dark:text-emerald-400 font-black">{reportData.company_summary?.total_tasks_completed}</strong></span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-slate-500 dark:text-slate-400">In Review: <strong className="text-purple-600 dark:text-purple-400 font-black">{reportData.company_summary?.total_tasks_in_review || 0}</strong></span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-slate-500 dark:text-slate-400">In Progress: <strong className="text-blue-600 dark:text-blue-400 font-black">{reportData.company_summary?.total_tasks_in_progress || 0}</strong></span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-slate-500 dark:text-slate-400">Rejected: <strong className="text-rose-600 dark:text-rose-400 font-black">{reportData.company_summary?.total_tasks_rejected || 0}</strong></span>
            </div>
            <span className="text-[11px] text-slate-400 italic font-medium hidden sm:inline">
              Click any staff row to view full score inspection
            </span>
          </div>
        )}
      </div>
    </>
  );
};

export default MasterHeaderBar;
