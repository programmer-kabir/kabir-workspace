import React from 'react';
import { FiCalendar, FiX } from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import CascadingCategoryFilter from '../../components/CascadingCategoryFilter';

export default function TaskFilterHeader({
  error,
  setIsCreateSelfModalOpen,
  selectedCategoryFilter,
  selectedSubcategoryFilter,
  selectedChildCategoryFilter,
  handleCategoryFilterChange,
  handleSubcategoryFilterChange,
  handleChildCategoryFilterChange,
  dateFilter,
  setDateFilter,
  searchTerm,
  setSearchTerm,
  setSelectedCategoryFilter,
  setSelectedSubcategoryFilter,
  setSelectedChildCategoryFilter,
  apiBase
}) {
  const hasActiveFilters = Boolean(
    (searchTerm && searchTerm.trim()) ||
    selectedCategoryFilter !== 'all' ||
    selectedSubcategoryFilter !== 'all' ||
    selectedChildCategoryFilter !== 'all' ||
    dateFilter
  );

  const handleClearFilters = () => {
    if (setSearchTerm) setSearchTerm('');
    if (setSelectedCategoryFilter) setSelectedCategoryFilter('all');
    if (setSelectedSubcategoryFilter) setSelectedSubcategoryFilter('all');
    if (setSelectedChildCategoryFilter) setSelectedChildCategoryFilter('all');
    if (setDateFilter) setDateFilter('');
  };

  return (
    <div className="mb-8 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
          Task Board
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Manage and track your daily assignments.</p>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl shadow-sm border border-red-100 w-full xl:w-auto">{error}</div>}

      {/* ULTRA PREMIUM FILTERS & ACTIONS */}
      <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 w-full xl:w-auto">
        {/* + New Creative Task Button */}
        <button
          onClick={() => setIsCreateSelfModalOpen && setIsCreateSelfModalOpen(true)}
          className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 hover:from-amber-600 hover:via-rose-600 hover:to-indigo-700 text-white rounded-full shadow-md hover:shadow-lg hover:shadow-rose-500/20 active:scale-95 transition-all text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shrink-0 cursor-pointer"
        >
          <HiSparkles size={16} />
          <span>+ New Creative Task</span>
        </button>

        {/* Cascading Category Filters (3-tier) */}
        <CascadingCategoryFilter
          category={selectedCategoryFilter}
          subcategory={selectedSubcategoryFilter}
          childCategory={selectedChildCategoryFilter}
          onCategoryChange={handleCategoryFilterChange}
          onSubcategoryChange={handleSubcategoryFilterChange}
          onChildCategoryChange={handleChildCategoryFilterChange}
          apiBase={apiBase}
        />

        {/* Date Pill */}
        <div className="relative group w-full sm:w-auto">
          <FiCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-600 transition-colors z-10" size={14} />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter && setDateFilter(e.target.value)}
            className="w-full sm:w-[160px] pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-full shadow-sm hover:shadow-md focus:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500/50 text-sm font-medium text-slate-700 dark:text-slate-200 cursor-pointer transition-all [color-scheme:light] dark:[color-scheme:dark]"
          />
        </div>

        {/* Clear Action */}
        <div className={`overflow-hidden transition-all duration-300 origin-left ${hasActiveFilters ? 'w-full sm:w-auto opacity-100 scale-100' : 'w-0 opacity-0 scale-50'}`}>
          <button
            onClick={handleClearFilters}
            className="w-full px-5 py-2.5 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-100/50 dark:border-red-500/20 rounded-full transition-all font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
          >
            <FiX size={14} /> Clear
          </button>
        </div>
      </div>
    </div>
  );
}

