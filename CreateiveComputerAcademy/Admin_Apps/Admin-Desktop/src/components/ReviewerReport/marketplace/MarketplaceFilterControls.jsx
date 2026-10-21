import React from 'react';
import { FiSearch, FiX, FiGrid, FiList } from 'react-icons/fi';

export const MarketplaceFilterControls = ({
  filteredMarketplaces = [],
  marketStatusFilter,
  setMarketStatusFilter,
  marketSearchQuery,
  setMarketSearchQuery,
  marketViewMode,
  setMarketViewMode
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
      <div className="flex items-center gap-2 flex-wrap">
        <h3 className="text-base font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <span>Uploaded Files & Distribution Track</span>
          <span className="text-xs bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-bold px-2 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-900/50">
            {filteredMarketplaces.length} items
          </span>
        </h3>

        {/* Status Pills */}
        <div className="flex items-center gap-1 overflow-x-auto py-0.5">
          {[
            { id: 'all', label: 'All' },
            { id: 'live', label: 'Live / Approved' },
            { id: 'review', label: 'Under Review' },
            { id: 'rejected', label: 'Rejected' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMarketStatusFilter(tab.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors shrink-0 ${
                marketStatusFilter === tab.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Right Controls: Search & Switcher */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 md:w-56">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
          <input
            type="text"
            value={marketSearchQuery}
            onChange={(e) => setMarketSearchQuery(e.target.value)}
            placeholder="Search task or designer..."
            className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
          {marketSearchQuery && (
            <button
              type="button"
              onClick={() => setMarketSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
            >
              <FiX size={13} />
            </button>
          )}
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
          <button
            type="button"
            onClick={() => setMarketViewMode('cards')}
            title="Cards View"
            className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              marketViewMode === 'cards'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FiGrid size={14} />
            <span className="hidden sm:inline text-[11px]">Cards</span>
          </button>
          <button
            type="button"
            onClick={() => setMarketViewMode('table')}
            title="Table View"
            className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              marketViewMode === 'table'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FiList size={14} />
            <span className="hidden sm:inline text-[11px]">Table</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceFilterControls;
