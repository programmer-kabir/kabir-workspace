import React from 'react';
import {
  FiFilter,
  FiSearch,
  FiX,
  FiCalendar,
  FiCoffee,
  FiChevronDown,
  FiCheckCircle,
  FiSliders,
} from 'react-icons/fi';

const PRESET_TABS = [
  { id: 'all', label: 'All Breaks', icon: '📋' },
  { id: 'Tiffin', label: 'Tiffin', icon: '🥪' },
  { id: 'Mango Break', label: 'Mango OT', icon: '🥭' },
  { id: 'Mango Full Day', label: 'Full Day', icon: '🥭' },
  { id: 'Emergency', label: 'Emergency', icon: '🚨' },
  { id: 'Prayer', label: 'Prayer', icon: '🕌' },
];

const BreakFilterBar = ({
  searchQuery,
  setSearchQuery,
  dateFilter,
  setDateFilter,
  typeFilter,
  setTypeFilter,
  statusFilter,
  setStatusFilter,
}) => {
  const hasActiveFilters = Boolean(
    searchQuery || dateFilter || typeFilter !== 'all' || statusFilter !== 'all'
  );

  return (
    <div className="relative overflow-hidden rounded-3xl bg-white/95 dark:bg-slate-900/95 p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800/90 shadow-sm shadow-slate-100/40 dark:shadow-none space-y-3.5 backdrop-blur-md">
      {/* Header / Identity Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <FiFilter size={15} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white">
                Filter & Search Records
              </span>
              {hasActiveFilters && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-black border border-amber-500/30">
                  Active Filters
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
              Find breaks by keyword, date, category or status
            </p>
          </div>
        </div>
      </div>

      {/* Controls Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-2.5">
        {/* Search Input */}
        <div className="xl:col-span-5 relative flex items-center">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none">
            <FiSearch size={16} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by break type, reason, date..."
            className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-slate-50/90 dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/90 text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/25 focus:border-amber-500 dark:focus:border-amber-400 transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              title="Clear search"
            >
              <FiX size={12} />
            </button>
          )}
        </div>

        {/* Date filter */}
        <div className="xl:col-span-2 relative flex items-center rounded-2xl bg-slate-50/90 dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/90 px-3 py-2 focus-within:ring-2 focus-within:ring-amber-500/25 focus-within:border-amber-500 dark:focus-within:border-amber-400 transition-all shadow-2xs">
          <FiCalendar className="text-amber-500 dark:text-amber-400 shrink-0 mr-2" size={15} />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer dark:[color-scheme:dark] dark:[&::-webkit-calendar-picker-indicator]:filter dark:[&::-webkit-calendar-picker-indicator]:brightness-0 dark:[&::-webkit-calendar-picker-indicator]:invert"
          />
          {dateFilter && (
            <button
              type="button"
              onClick={() => setDateFilter('')}
              className="ml-1 w-4 h-4 rounded-full bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-300 hover:bg-rose-200 flex items-center justify-center cursor-pointer transition-colors"
              title="Clear date"
            >
              <FiX size={10} />
            </button>
          )}
        </div>

        {/* Break Type selector */}
        <div className="xl:col-span-3 relative flex items-center rounded-2xl bg-slate-50/90 dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/90 pl-3 pr-2.5 py-2 focus-within:ring-2 focus-within:ring-amber-500/25 focus-within:border-amber-500 dark:focus-within:border-amber-400 transition-all shadow-2xs">
          <FiCoffee className="text-orange-500 dark:text-orange-400 shrink-0 mr-2" size={15} />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer pr-5 appearance-none"
          >
            <option value="all" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">All Break Types</option>
            <option value="Mango Break" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">🥭 Mango OT Break</option>
            <option value="Mango Full Day" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">🥭 Mango Full Day</option>
            <option value="Tiffin" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">🥪 Tiffin Break</option>
            <option value="Personal" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">🚶 Personal Break</option>
            <option value="Emergency" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">🚨 Emergency</option>
            <option value="Prayer" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">🕌 Prayer</option>
            <option value="Medical" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">🏥 Medical</option>
            <option value="Tea/Snack" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">☕ Tea / Snack</option>
          </select>
          <FiChevronDown className="text-slate-400 pointer-events-none absolute right-3" size={13} />
        </div>

        {/* Status selector */}
        <div className="xl:col-span-2 relative flex items-center rounded-2xl bg-slate-50/90 dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/90 pl-3 pr-2.5 py-2 focus-within:ring-2 focus-within:ring-amber-500/25 focus-within:border-amber-500 dark:focus-within:border-amber-400 transition-all shadow-2xs">
          <FiCheckCircle className="text-emerald-500 dark:text-emerald-400 shrink-0 mr-2" size={15} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer pr-5 appearance-none"
          >
            <option value="all" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">All Statuses</option>
            <option value="Completed" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">✓ Completed</option>
            <option value="Approved" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">✓ Approved / Leave</option>
            <option value="Active" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">⚡ Active Now</option>
            <option value="Pending" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">⏳ Pending</option>
            <option value="Rejected" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">✕ Rejected</option>
          </select>
          <FiChevronDown className="text-slate-400 pointer-events-none absolute right-3" size={13} />
        </div>
      </div>

      {/* Quick Preset Filter Chips */}
      <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mr-1 flex items-center gap-1">
            <FiSliders size={11} className="text-amber-500" />
            <span>Presets:</span>
          </span>

          {PRESET_TABS.map((tab) => {
            const isSelected = typeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTypeFilter(tab.id)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all duration-150 inline-flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500 text-white shadow-xs shadow-amber-500/30 font-black scale-[1.02]'
                    : 'bg-slate-100/90 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200/90 dark:hover:bg-slate-700/80 border border-slate-200/70 dark:border-slate-700/60'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BreakFilterBar;

