import React from 'react';
import { FiShoppingCart, FiCheckCircle, FiClock, FiXCircle, FiGlobe } from 'react-icons/fi';

export const MarketplaceStatsBar = ({
  mSummary = { total_uploads: 0, live: 0, under_review: 0, rejected: 0, platforms: {} },
  marketPlatformFilter,
  setMarketPlatformFilter
}) => {
  return (
    <div className="space-y-4">
      {/* Marketplace Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500"></div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">Total Market Uploads</p>
            <h3 className="text-3xl font-black text-slate-800 dark:text-white">{mSummary.total_uploads}</h3>
          </div>
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <FiShoppingCart size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
          <div>
            <p className="text-xs font-black text-emerald-600 uppercase tracking-wider mb-1">Live / Approved</p>
            <h3 className="text-3xl font-black text-emerald-700 dark:text-emerald-400">{mSummary.live}</h3>
          </div>
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <FiCheckCircle size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-amber-500"></div>
          <div>
            <p className="text-xs font-black text-amber-600 uppercase tracking-wider mb-1">Under Review / Queue</p>
            <h3 className="text-3xl font-black text-amber-700 dark:text-amber-400">{mSummary.under_review}</h3>
          </div>
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/40 text-amber-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <FiClock size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-rose-500"></div>
          <div>
            <p className="text-xs font-black text-rose-600 uppercase tracking-wider mb-1">Rejected / Fix Needed</p>
            <h3 className="text-3xl font-black text-rose-700 dark:text-rose-400">{mSummary.rejected}</h3>
          </div>
          <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/40 text-rose-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <FiXCircle size={20} />
          </div>
        </div>
      </div>

      {/* Platform Distribution Chips */}
      {Object.keys(mSummary.platforms || {}).length > 0 && (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-2 flex-wrap">
          <span className="text-xs font-black text-slate-400 uppercase tracking-wider mr-2 flex items-center gap-1.5">
            <FiGlobe size={13} className="text-blue-500" /> Platform Split:
          </span>
          {Object.entries(mSummary.platforms).map(([platform, count]) => (
            <button
              key={platform}
              type="button"
              onClick={() => setMarketPlatformFilter(marketPlatformFilter === platform ? 'all' : platform)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 border ${
                marketPlatformFilter === platform
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800/70 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-blue-300'
              }`}
            >
              <span>{platform}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                marketPlatformFilter === platform ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}>
                {count}
              </span>
            </button>
          ))}
          {marketPlatformFilter !== 'all' && (
            <button
              type="button"
              onClick={() => setMarketPlatformFilter('all')}
              className="text-xs font-bold text-rose-500 hover:underline ml-2"
            >
              Clear Platform Filter
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default MarketplaceStatsBar;
