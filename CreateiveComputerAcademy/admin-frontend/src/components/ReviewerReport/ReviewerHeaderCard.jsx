import React from 'react';
import {
  FiCalendar,
  FiClock,
  FiLayers,
  FiTrendingUp,
  FiFilter,
  FiRefreshCw,
  FiDownload,
  FiAlertCircle
} from 'react-icons/fi';
import { ReviewerSearchSelect } from './ReviewerSearchSelect';

export const ReviewerHeaderCard = ({
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
  selectedStaffId,
  setSelectedStaffId,
  reviewerOptions,
  API_BASE,
  startDate,
  endDate,
  fetchReport,
  loading,
  handleExport,
  reviewerReport,
  MONTH_NAMES,
  YEARS,
  selectedStaffInfo,
  mSummary,
  slaRate,
  activeDateRange,
  error
}) => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            Reviewer Performance Analytics
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium text-xs sm:text-sm">
            Analyze reviewer SLAs, turnaround times, bounce rates, and stock marketplace uploads.
          </p>
        </div>
      </div>

      {/* Modern Filter Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        {/* Top Controls Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Pill Date Presets */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl flex-wrap">
            <button
              type="button"
              onClick={() => setFilterType('this_month')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                filterType === 'this_month'
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
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                filterType === 'last_month'
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
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                filterType === 'specific_month'
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
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                filterType === 'all_time'
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
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                filterType === 'custom'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FiFilter size={13} />
              <span>Custom Range</span>
            </button>
          </div>

          {/* Right: Reviewer Selector, Date Pill & Actions */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Reviewer Selector */}
            <div className="w-64 sm:w-72">
              <ReviewerSearchSelect
                value={selectedStaffId}
                onChange={setSelectedStaffId}
                options={reviewerOptions}
                apiBase={API_BASE}
              />
            </div>

            {/* Active Date Range Pill */}
            <div className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold text-xs rounded-xl border border-blue-200 dark:border-blue-900/50 shrink-0">
              <FiCalendar size={13} />
              <span>{startDate} → {endDate}</span>
            </div>

            {/* Refresh */}
            <button
              type="button"
              onClick={fetchReport}
              disabled={loading}
              className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-all border border-slate-200 dark:border-slate-700 shrink-0"
              title="Refresh Analytics"
            >
              <FiRefreshCw className={loading ? "animate-spin" : ""} size={15} />
            </button>

            {/* CSV Export */}
            <button
              type="button"
              onClick={handleExport}
              disabled={loading || !reviewerReport}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-all border border-slate-200 dark:border-slate-700 shrink-0"
              title="Export CSV"
            >
              <FiDownload size={13} />
              <span>CSV</span>
            </button>
          </div>
        </div>

        {/* Dynamic Month/Year Sub-Bar */}
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

        {/* Aggregated Totals Summary Info Bar */}
        {selectedStaffInfo && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-slate-500 dark:text-slate-400">
                Reviewer: <strong className="text-slate-900 dark:text-white font-black">{selectedStaffInfo.name}</strong> ({selectedStaffInfo.designation || 'Reviewer'})
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-slate-500 dark:text-slate-400">
                Department: <strong className="text-blue-600 dark:text-blue-400 font-bold">{selectedStaffInfo.department_name || 'QA / Review'}</strong>
              </span>
              {reviewerReport?.summary && (
                <>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className="text-slate-500 dark:text-slate-400">
                    Received: <strong className="text-slate-900 dark:text-white font-black">{reviewerReport.summary.total_received || 0}</strong>
                  </span>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className="text-slate-500 dark:text-slate-400">
                    Reviewed: <strong className="text-blue-600 dark:text-blue-400 font-black">{reviewerReport.summary.total_reviewed || 0}</strong>
                  </span>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className="text-slate-500 dark:text-slate-400">
                    Market Uploads: <strong className="text-indigo-600 dark:text-indigo-400 font-black">{mSummary.total_uploads || 0}</strong>
                  </span>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className="text-slate-500 dark:text-slate-400">
                    SLA Met: <strong className="text-emerald-600 dark:text-emerald-400 font-black">{slaRate}%</strong>
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

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-2xl flex items-center gap-3 text-rose-700 dark:text-rose-400 font-bold animate-in fade-in">
          <FiAlertCircle size={20} className="shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Selected Reviewer Avatar Header Card */}
      {selectedStaffInfo && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-md overflow-hidden flex-shrink-0">
              {selectedStaffInfo.profile_picture ? (
                <img
                  src={`${API_BASE}${selectedStaffInfo.profile_picture}`}
                  alt={selectedStaffInfo.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{selectedStaffInfo.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div>
              <h3 className="font-black text-slate-800 dark:text-slate-100 text-lg leading-none">{selectedStaffInfo.name}</h3>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-2.5">
                {selectedStaffInfo.designation || 'Reviewer'} • <span className="text-blue-600 dark:text-blue-400">{selectedStaffInfo.department_name || 'QA Team'}</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 self-start sm:self-auto mt-2 sm:mt-0">
            <span className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-500">
              Reviewer ID: #{selectedStaffInfo.id}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewerHeaderCard;
