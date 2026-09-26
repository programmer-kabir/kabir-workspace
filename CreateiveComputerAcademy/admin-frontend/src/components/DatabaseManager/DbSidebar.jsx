import React from 'react';
import {
  FiTable,
  FiRefreshCw,
  FiSearch,
  FiX,
  FiAlertTriangle
} from 'react-icons/fi';

/**
 * DbSidebar Component
 * Left sidebar listing database schema tables, search filter, and row count badges.
 */
const DbSidebar = ({
  filteredTables = [],
  selectedTable = '',
  setSelectedTable,
  tableSearch = '',
  setTableSearch,
  loadingTables = false,
  fetchTables
}) => {
  return (
    <div className="lg:col-span-3 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-sm overflow-hidden flex flex-col h-[820px] transition-all">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-700/80 space-y-3 bg-slate-50/50 dark:bg-slate-800/50">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <FiTable size={14} className="text-blue-500" />
            <span>Schema Tables ({filteredTables.length})</span>
          </span>
          <button
            type="button"
            onClick={() => fetchTables && fetchTables(false)}
            title="Refresh tables"
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <FiRefreshCw size={14} className={loadingTables ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Table Search Input */}
        <div className="relative">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            type="text"
            placeholder="Search tables..."
            value={tableSearch}
            onChange={(e) => setTableSearch && setTableSearch(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          />
          {tableSearch && (
            <button
              type="button"
              onClick={() => setTableSearch && setTableSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <FiX size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Tables List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
        {loadingTables ? (
          <div className="p-8 text-center text-xs text-slate-400 space-y-2">
            <FiRefreshCw className="animate-spin text-blue-500 mx-auto" size={20} />
            <p>Loading schema...</p>
          </div>
        ) : filteredTables.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            <FiAlertTriangle className="mx-auto text-amber-500 mb-1" size={20} />
            No matching tables
          </div>
        ) : (
          filteredTables.map((tbl) => {
            const isSelected = selectedTable === tbl.name;
            return (
              <button
                key={tbl.name}
                type="button"
                onClick={() => setSelectedTable && setSelectedTable(tbl.name)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-left transition-all group ${
                  isSelected
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-md shadow-blue-500/20'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                    }`}
                  >
                    <FiTable size={13} />
                  </div>
                  <span className="text-xs font-mono truncate">{tbl.name}</span>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-mono shrink-0 font-semibold ${
                    isSelected
                      ? 'bg-white/25 text-white'
                      : 'bg-slate-100 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {(tbl.rows || 0).toLocaleString()}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default DbSidebar;
