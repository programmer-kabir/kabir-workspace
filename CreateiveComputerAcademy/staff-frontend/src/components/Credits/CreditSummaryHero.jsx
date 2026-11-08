import React from 'react';
import { FiRefreshCw, FiSend, FiAward, FiTrendingDown } from 'react-icons/fi';
import { FaCoins } from 'react-icons/fa6';

export default function CreditSummaryHero({
  wallet,
  loading,
  balance,
  isNegative,
  fetchWallet,
  setIsSendOpen
}) {
  return (
    <>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
            <FaCoins size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Staff Credit Wallet & Ledger
              </h1>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                Rank #{wallet?.rank || 1}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              View detailed task approval rewards, rejection penalties, and credit transaction ledger.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchWallet}
            disabled={loading}
            className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <FiRefreshCw size={14} className={loading ? 'animate-spin text-blue-600' : ''} />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => setIsSendOpen(true)}
            disabled={balance <= 0}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md hover:shadow-lg active:scale-95"
          >
            <FiSend size={14} />
            Send to Teammate
          </button>
        </div>
      </div>

      {/* Hero Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Balance */}
        <div className={`p-6 rounded-3xl text-white relative overflow-hidden shadow-lg ${
          isNegative
            ? 'bg-gradient-to-br from-rose-600 via-rose-700 to-amber-900'
            : 'bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700'
        }`}>
          <div className="relative z-10">
            <span className="text-xs font-semibold text-white/80 uppercase tracking-wider block mb-1">
              Available Balance
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-white">{loading ? '...' : balance}</span>
              <span className="text-base font-medium text-white/90">Credits</span>
            </div>
            <p className="text-[11px] text-white/75 mt-2">
              {isNegative ? '⚠️ Negative balance due to penalties' : '✅ Active credit balance'}
            </p>
          </div>
          <div className="absolute -right-2 -bottom-4 opacity-15 text-white pointer-events-none select-none">
            <FaCoins size={96} />
          </div>
        </div>

        {/* Card 2: Total Earned */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Total Task Earned
            </span>
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
              +{wallet?.total_earned || 0}
            </span>
            <p className="text-[11px] text-slate-500 mt-1">Approved task rewards</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200/60 dark:border-emerald-800/60">
            <FiAward size={22} />
          </div>
        </div>

        {/* Card 3: Total Penalties */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Rejection Penalties
            </span>
            <span className="text-3xl font-black text-rose-600 dark:text-rose-400">
              -{wallet?.total_penalties || 0}
            </span>
            <p className="text-[11px] text-slate-500 mt-1">Revision & rejection cuts</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200/60 dark:border-rose-800/60">
            <FiTrendingDown size={22} />
          </div>
        </div>

        {/* Card 4: Transferred */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              P2P Transferred
            </span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
                {wallet?.total_sent || 0}
              </span>
              <span className="text-xs text-slate-400">Sent /</span>
              <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
                {wallet?.total_received || 0}
              </span>
              <span className="text-xs text-slate-400">Recv</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Teammate transfers</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200/60 dark:border-blue-800/60">
            <FiSend size={22} />
          </div>
        </div>
      </div>
    </>
  );
}

