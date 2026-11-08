import React from 'react';
import { FiRefreshCw, FiLock, FiClock, FiAlertTriangle } from 'react-icons/fi';

export default function MangoVaultHeader({
  loading,
  stats,
  staffList = [],
  fetchVaultOverview
}) {
  const sixHourStaffCount = staffList.filter((s) => s.shift_hours === 6).length;

  return (
    <>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-3xl">🥭</span>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                Mango Central Vault & Treasury
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                  Admin & Dev Controlled
                </span>
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Regulate staff break consumption, hold excess overtime in secret reserve, and dispatch emergency relief leaves.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchVaultOverview()}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold transition-all cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50"
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
            <span>Sync Live Bank</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Academy Mangoes */}
        <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent bg-white dark:bg-slate-800 p-5 rounded-2xl border border-amber-200 dark:border-amber-900/50 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Total Overtime Mangoes
            </span>
            <span className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center text-lg">
              🥭
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {stats.total_academy_mangoes || 0}
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Ripe Mangoes Earned
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Across all {stats.total_staff_count || 0} registered staff members
          </p>
        </div>

        {/* Card 2: In Admin Vault (Secret Reserve) */}
        <div className="bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-transparent bg-white dark:bg-slate-800 p-5 rounded-2xl border border-indigo-200 dark:border-indigo-900/50 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
              Held in Vault (Secret)
            </span>
            <span className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-lg">
              <FiLock />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
              {stats.total_vault_held_mangoes || 0}
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Mangoes Locked
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Hidden from staff trees ({stats.staff_with_vault_holds_count || 0} staff held)
          </p>
        </div>

        {/* Card 3: Visible on Staff Trees */}
        <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent bg-white dark:bg-slate-800 p-5 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Visible & Claimable
            </span>
            <span className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-lg">
              🌳
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {stats.total_visible_mangoes || 0}
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Visible on Trees
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Active mangoes staff can currently redeem for breaks
          </p>
        </div>

        {/* Card 4: 6-Hour Shift Staff Focus */}
        <div className="bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent bg-white dark:bg-slate-800 p-5 rounded-2xl border border-rose-200 dark:border-rose-900/50 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
              6-Hour Shift Staff
            </span>
            <span className="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center text-lg">
              <FiClock />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-rose-600 dark:text-rose-400">
              {sixHourStaffCount}
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Special Shift Staff
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            6h = 1 Mango (High overtime accumulation rate)
          </p>
        </div>

        {/* Card 5: Overtime Debt / ঘাটতি ঋণ */}
        <div className="bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent bg-white dark:bg-slate-800 p-5 rounded-2xl border border-rose-200 dark:border-rose-900/50 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
              Overtime Debt / ঘাটতি
            </span>
            <span className="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center text-lg">
              <FiAlertTriangle />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-rose-600 dark:text-rose-400">
              {stats.staff_in_debt_count || 0}
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Staff in Debt
            </span>
          </div>
          <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold mt-1">
            -{stats.total_debt_hours || 0}h মোট ঘাটতি ঋণ (ওভারটাইম দিয়ে পূরণ করতে হবে)
          </p>
        </div>
      </div>
    </>
  );
}

