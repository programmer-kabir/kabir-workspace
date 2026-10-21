import React from 'react';
import {
  FiDroplet,
  FiGrid,
  FiLayers,
  FiType,
  FiFolder,
  FiShield,
  FiSearch,
  FiX,
  FiCheck,
  FiClock,
  FiXCircle
} from 'react-icons/fi';

/**
 * BrandFilterBar Component
 * Category tabs with live item counters, search input, and approval review status filters.
 */
const BrandFilterBar = ({
  activeTab = 'all',
  setActiveTab,
  resources = [],
  searchQuery = '',
  setSearchQuery,
  approvalFilter = 'all',
  setApprovalFilter,
  pendingCount = 0,
  approvedCount = 0,
  rejectedCount = 0
}) => {
  const tabDefs = [
    { key: 'all', label: 'All Resources', count: resources.length },
    { key: 'color', label: 'Single Colors', icon: <FiDroplet size={14} />, count: resources.filter(r => r.category === 'color').length },
    { key: 'palette', label: 'Color Palettes', icon: <FiGrid size={14} />, count: resources.filter(r => r.category === 'palette').length },
    { key: 'logo', label: 'Logos & Stamps', icon: <FiLayers size={14} />, count: resources.filter(r => r.category === 'logo').length },
    { key: 'font', label: 'Typography & Fonts', icon: <FiType size={14} />, count: resources.filter(r => r.category === 'font').length },
    { key: 'template', label: 'Master Templates', icon: <FiFolder size={14} />, count: resources.filter(r => r.category === 'template').length },
    { key: 'guideline', label: 'Design Guidelines', icon: <FiShield size={14} />, count: resources.filter(r => r.category === 'guideline').length },
  ];

  return (
    <div className="space-y-3">
      {/* Category Tabs & Search Row */}
      <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 no-scrollbar">
          {tabDefs.map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab && setActiveTab(tab.key)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === tab.key
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-900/60 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72 shrink-0">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input
            type="text"
            placeholder="Search resources or authors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery && setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <FiX size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Approval Workflow Sub-filter Pills */}
      <div className="flex items-center gap-2 px-1">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Review Status:
        </span>
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setApprovalFilter && setApprovalFilter('all')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              approvalFilter === 'all'
                ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 shadow-2xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
            }`}
          >
            All Status ({resources.length})
          </button>
          <button
            type="button"
            onClick={() => setApprovalFilter && setApprovalFilter('approved')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              approvalFilter === 'approved'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
            }`}
          >
            <FiCheck size={12} />
            <span>Approved ({approvedCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setApprovalFilter && setApprovalFilter('pending')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              approvalFilter === 'pending'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 border border-slate-200 dark:border-slate-700 hover:bg-amber-50 dark:hover:bg-amber-950/30'
            } ${pendingCount > 0 ? 'ring-2 ring-amber-400/40' : ''}`}
          >
            <FiClock size={12} className={pendingCount > 0 ? 'animate-spin-slow' : ''} />
            <span>Pending Review ({pendingCount})</span>
            {pendingCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setApprovalFilter && setApprovalFilter('rejected')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              approvalFilter === 'rejected'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 border border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/30'
            }`}
          >
            <FiXCircle size={12} />
            <span>Rejected ({rejectedCount})</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BrandFilterBar;
