import React from 'react';
import {
  FiCalendar,
  FiClock,
  FiTrendingUp,
  FiPrinter,
  FiFilter,
  FiLayers,
  FiDownload,
  FiRefreshCw
} from 'react-icons/fi';
import { handleExportCSV, handleExportExcel, handleExportPDF } from '../../utils/exportReportToExcel';
import StaffSearchSelect from './StaffSearchSelect';

const ReportHeader = ({
  selectedStaffInfo,
  startDate,
  endDate,
  attReport,
  taskReport,
  loading,
  filterType,
  setFilterType,
  selectedStaffId,
  setSelectedStaffId,
  employeeOptions,
  API_BASE,
  fetchReports,
  activeTab,
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
  customStart,
  setCustomStart,
  customEnd,
  setCustomEnd,
  activeDateRange,
  MONTH_NAMES,
  YEARS
}) => {
  return (
    <>
      {/* ──────── Header Title & Global Export Actions ──────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Staff Performance Analytics
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium text-sm">
            Analyze individual employee attendance logs, task deliverables, and work duration.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => handleExportExcel({ selectedStaffInfo, startDate, endDate, attReport, taskReport })}
            disabled={loading || !selectedStaffInfo}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all disabled:opacity-50"
            title="Download formatted Excel Spreadsheet"
          >
            <FiDownload size={15} />
            <span>Excel (.xls)</span>
          </button>
          <button
            onClick={() => handleExportPDF({ selectedStaffInfo, startDate, endDate, attReport, taskReport })}
            disabled={loading || !selectedStaffInfo}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all disabled:opacity-50"
            title="Export as PDF Document"
          >
            <FiPrinter size={15} />
            <span>PDF Export</span>
          </button>
        </div>
      </div>

      {/* ──────── Control Panel: Modern Filter Bar ──────── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm mb-8 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl flex-wrap">
            <button
              type="button"
              onClick={() => setFilterType('this_month')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${filterType === 'this_month'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              <FiCalendar size={13} />
              <span>This Month</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterType('last_month')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${filterType === 'last_month'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              <FiClock size={13} />
              <span>Last Month</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterType('specific_month')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${filterType === 'specific_month'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              <FiLayers size={13} />
              <span>Select Month</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterType('all_time')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${filterType === 'all_time'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              <FiTrendingUp size={13} />
              <span>All-Time</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterType('custom')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${filterType === 'custom'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              <FiFilter size={13} />
              <span>Custom Range</span>
            </button>
          </div>

          {/* Center/Right: Employee Selector, Date Badge & Actions */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-64 sm:w-72">
              <StaffSearchSelect
                value={selectedStaffId}
                onChange={setSelectedStaffId}
                options={employeeOptions}
                apiBase={API_BASE}
              />
            </div>

            <div className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold text-xs rounded-xl border border-blue-200 dark:border-blue-900/50 shrink-0">
              <FiCalendar size={13} />
              <span>{startDate} → {endDate}</span>
            </div>

            <button
              type="button"
              onClick={fetchReports}
              disabled={loading}
              className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-all border border-slate-200 dark:border-slate-700 shrink-0"
              title="Refresh Data"
            >
              <FiRefreshCw className={loading ? "animate-spin" : ""} size={15} />
            </button>

            <button
              type="button"
              onClick={() => handleExportCSV({ selectedStaffInfo, activeTab, attReport, taskReport })}
              disabled={loading || !selectedStaffInfo}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-all border border-slate-200 dark:border-slate-700 shrink-0"
              title="Export CSV"
            >
              <FiDownload size={13} />
              <span>CSV</span>
            </button>
          </div>
        </div>

        {/* Dynamic Month/Year Dropdown Sub-Bar */}
        {filterType === 'specific_month' && (
          <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex-wrap animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Month:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-white outline-none cursor-pointer"
              >
                {MONTH_NAMES.map((name, i) => (
                  <option key={i} value={i.toString()}>{name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Year:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-white outline-none cursor-pointer"
              >
                {YEARS.map((y) => (
                  <option key={y} value={y.toString()}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Dynamic Custom Date Picker Sub-Bar */}
        {filterType === 'custom' && (
          <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex-wrap animate-in fade-in slide-in-from-top-1 duration-200">
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

        {/* Aggregated Totals Summary Bar */}
        {selectedStaffInfo && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-slate-500 dark:text-slate-400">
                Staff: <strong className="text-slate-900 dark:text-white font-black">{selectedStaffInfo.name}</strong> ({selectedStaffInfo.designation})
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-slate-500 dark:text-slate-400">
                Department: <strong className="text-blue-600 dark:text-blue-400 font-bold">{selectedStaffInfo.department_name || 'General'}</strong>
              </span>
              {attReport && attReport.summary && (
                <>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className="text-slate-500 dark:text-slate-400">
                    Working Days: <strong className="text-slate-900 dark:text-white font-black">{attReport.summary.total_days || 0}</strong>
                  </span>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className="text-slate-500 dark:text-slate-400">
                    Present: <strong className="text-emerald-600 dark:text-emerald-400 font-black">{attReport.summary.present || 0}</strong>
                  </span>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className="text-slate-500 dark:text-slate-400">
                    Absent: <strong className="text-rose-600 dark:text-rose-400 font-black">{attReport.summary.absent || 0}</strong>
                  </span>
                </>
              )}
              {taskReport && taskReport.summary && (
                <>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className="text-slate-500 dark:text-slate-400">
                    Tasks: <strong className="text-purple-600 dark:text-purple-400 font-black">{taskReport.summary.completed || 0} / {taskReport.summary.total_tasks || 0}</strong>
                  </span>
                </>
              )}
            </div>
            <span className="text-[11px] text-slate-400 italic font-medium hidden sm:inline">
              Period: {activeDateRange?.label}
            </span>
          </div>
        )}
      </div>
    </>
  );
};

export default ReportHeader;
