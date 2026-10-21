import React from 'react';
import { FiSearch, FiX, FiFilter, FiRotateCcw } from 'react-icons/fi';
import { DateFilterBar } from './DateFilterBar';
import { StaffFilterDropdown } from './StaffFilterDropdown';
import { CascadingCategoryFilter } from './CascadingCategoryFilter';

export const TaskOversightFilterBar = ({
  dateFilter,
  setDateFilter,
  customDateRange,
  setCustomDateRange,
  searchTerm,
  setSearchTerm,
  groupBy,
  setGroupBy,
  selectedCategoryFilter,
  selectedSubcategoryFilter,
  selectedChildCategoryFilter,
  handleCategoryFilterChange,
  handleSubcategoryFilterChange,
  handleChildCategoryFilterChange,
  selectedStaffFilter,
  setSelectedStaffFilter,
  staff,
  apiBase = import.meta.env.VITE_API_BASE_URL || '/'
}) => {
  const isAnyFilterActive =
    selectedCategoryFilter !== 'all' ||
    selectedStaffFilter !== 'all' ||
    searchTerm.trim() !== '';

  const handleResetFilters = () => {
    handleCategoryFilterChange('all');
    setSelectedStaffFilter('all');
    setSearchTerm('');
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs space-y-3">
      {/* Row 1: Date Filter + Search + Group By */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left: Date Filters */}
        <DateFilterBar
          filter={dateFilter}
          setFilter={setDateFilter}
          customRange={customDateRange}
          setCustomRange={setCustomDateRange}
        />

        {/* Right: Search & Group Switcher */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {/* Task Search Bar */}
          <div className="relative bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-xs px-3 h-10 flex items-center gap-2 w-full sm:w-64 flex-shrink-0">
            <FiSearch size={14} className="text-slate-400 flex-shrink-0" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search tasks, staff, niche..."
              className="bg-transparent text-xs font-semibold outline-none text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 w-full"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-400 hover:text-slate-600"
              >
                <FiX size={12} />
              </button>
            )}
          </div>

          {/* Grouping Controls */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl h-10 flex-shrink-0">
            <button
              type="button"
              onClick={() => setGroupBy('status')}
              className={`px-3 h-8 rounded-lg text-xs font-bold transition-all ${
                groupBy === 'status'
                  ? 'bg-white dark:bg-slate-800 shadow-xs text-blue-600 dark:text-blue-400'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              Status
            </button>
            <button
              type="button"
              onClick={() => setGroupBy('staff')}
              className={`px-3 h-8 rounded-lg text-xs font-bold transition-all ${
                groupBy === 'staff'
                  ? 'bg-white dark:bg-slate-800 shadow-xs text-blue-600 dark:text-blue-400'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              Staff
            </button>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-slate-100 dark:bg-slate-800" />

      {/* Row 2: Cascading Category & Staff Filter Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1 mr-1">
            <FiFilter size={11} /> Filters:
          </span>

          {/* 3-Level Cascading Category Filters */}
          <CascadingCategoryFilter
            category={selectedCategoryFilter}
            subcategory={selectedSubcategoryFilter}
            childCategory={selectedChildCategoryFilter}
            onCategoryChange={handleCategoryFilterChange}
            onSubcategoryChange={handleSubcategoryFilterChange}
            onChildCategoryChange={handleChildCategoryFilterChange}
            apiBase={apiBase}
          />

          {/* Staff Filter Dropdown */}
          <StaffFilterDropdown
            value={selectedStaffFilter}
            onChange={setSelectedStaffFilter}
            staff={staff}
            apiBase={apiBase}
          />
        </div>

        {/* Quick Clear All Filters */}
        {isAnyFilterActive && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200/60 dark:border-rose-900/40 transition-colors ml-auto"
          >
            <FiRotateCcw size={11} /> Reset Filters
          </button>
        )}
      </div>
    </div>
  );
};

export default TaskOversightFilterBar;
