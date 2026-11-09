import React from 'react';
import { 
  FiClock, FiCheckCircle, FiAlertCircle, FiRefreshCw, FiInfo 
} from 'react-icons/fi';
import { formatHoursToHuman } from './treeUtils';

/**
 * MangoTreeStatsBanner
 * Top header banner, month selector, 4 core metric cards,
 * overtime debt alert banner, and calculation workflow ribbon.
 */
export default function MangoTreeStatsBanner({
  summary,
  shiftHours,
  selectedMonth,
  availableMonths = [],
  handleMonthChange,
  fetchTreeData,
  loading,
  setIsMarketOpen,
  setActiveLedgerTab,
  ripeCount = 0,
  availableBreakHours = 0,
  availableBreakDays = 0,
  allRipeMangoes = [],
  setSelectedMango,
  setIsClaimModalOpen,
}) {
  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-teal-500/10 dark:from-emerald-950/40 dark:via-slate-900 dark:to-amber-950/30 p-6 md:p-8 rounded-3xl border border-amber-500/20 dark:border-emerald-500/20 shadow-xs relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700/60 text-amber-800 dark:text-amber-300 text-xs font-black uppercase tracking-wider">
            <span>🌳</span> Overtime-to-Break Orchard
          </div>
          <h1 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <span>The Mango Break Tree</span>
            <span className="text-3xl animate-bounce">🥭</span>
          </h1>
          <p className="text-slate-600 dark:text-slate-300 text-xs md:text-sm max-w-2xl leading-relaxed">
            Your extra work hours naturally bloom into sweet break rewards! Every{' '}
            <strong>{shiftHours} hours of accumulated overtime</strong> grows{' '}
            <strong>1 ripe Mango</strong> (equal to 1 full paid day of break).
          </p>
        </div>

        <div className="flex items-center gap-2.5 z-10 shrink-0 flex-wrap">
          {/* Month Selector Dropdown */}
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={(e) => handleMonthChange(e.target.value)}
              className="appearance-none flex items-center gap-2 pl-9 pr-8 py-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 border-2 border-indigo-500/40 dark:border-indigo-500/50 focus:border-indigo-500 rounded-2xl text-xs font-black text-slate-800 dark:text-slate-100 transition shadow-xs cursor-pointer outline-none"
            >
              {(availableMonths.length > 0
                ? availableMonths
                : [
                    { month_key: 'current', label: '📅 Current Month' },
                    { month_key: 'all', label: '🌐 All Time (সব সময়)' },
                  ]
              ).map((m) => (
                <option key={m.month_key} value={m.month_key}>
                  {m.label}
                </option>
              ))}
            </select>
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-500 text-sm">
              📅
            </div>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">
              ▼
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsMarketOpen(true)}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-2xl text-xs font-black transition shadow-lg shadow-amber-500/25 active:scale-95 cursor-pointer"
          >
            <span>🛒</span>
            <span>P2P Overtime Market</span>
          </button>

          <button
            type="button"
            onClick={() => fetchTreeData(selectedMonth)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 transition shadow-xs cursor-pointer disabled:opacity-50"
          >
            <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Expected Target */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-indigo-400/60 transition duration-300 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-wider border border-indigo-200 dark:border-indigo-800/60">
                1. Target &bull; {summary?.selected_month_label || 'Month'}
              </span>
              <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl text-indigo-600 dark:text-indigo-400">
                <FiClock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-baseline gap-2 flex-wrap">
              <span>{formatHoursToHuman(summary?.total_expected_hours)}</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Scheduled duty requirement based on roster
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
              <span>Standard Shift:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{shiftHours} hrs / day</span>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
              <span>Duty Sessions:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {summary?.total_sessions_counted || 0} days
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Actual Worked */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-blue-400/60 transition duration-300 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-wider border border-blue-200 dark:border-blue-800/60">
                2. Worked &bull; {summary?.selected_month_label || 'Month'}
              </span>
              <div className="p-2 bg-blue-50 dark:bg-blue-950/60 rounded-xl text-blue-600 dark:text-blue-400">
                <FiCheckCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-blue-600 dark:text-blue-400 tracking-tight flex items-baseline gap-2 flex-wrap">
              <span>{formatHoursToHuman(summary?.total_worked_hours)}</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Total clocked-in work time verified
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5 text-xs">
            <button
              type="button"
              onClick={() => setActiveLedgerTab('overtime')}
              className="w-full flex items-center justify-between text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition cursor-pointer text-left"
            >
              <span className="underline decoration-dotted">Gross Overtime:</span>
              <span className="font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                +{formatHoursToHuman(summary?.total_overtime_hours)}
                <span className="text-[10px]">➔</span>
              </span>
            </button>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
              <span>Verified Sessions:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {summary?.total_sessions_counted || 0} logged
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Total Gap (Shortfall + Leaves) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-rose-400/60 transition duration-300 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-wider border border-rose-200 dark:border-rose-800/60">
                3. Gap &bull; {summary?.selected_month_label || 'Month'}
              </span>
              <div className="p-2 bg-rose-50 dark:bg-rose-950/60 rounded-xl text-rose-600 dark:text-rose-400">
                <FiAlertCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-rose-600 dark:text-rose-400 tracking-tight flex items-baseline gap-2 flex-wrap">
              <span>-{formatHoursToHuman(summary?.total_gap_hours)}</span>
            </div>
            <p className="text-xs text-rose-600/90 dark:text-rose-400/90 mt-1 font-semibold flex items-center gap-1">
              <span>ℹ️</span> Shift shortfalls are handled in Monthly Payroll
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5 text-xs">
            <button
              type="button"
              onClick={() => setActiveLedgerTab('short_time')}
              className="w-full flex items-center justify-between text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer text-left"
            >
              <span className="underline decoration-dotted">Shift Shortfalls:</span>
              <span className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                -{formatHoursToHuman(summary?.total_short_hours)}
                <span className="text-[10px]">➔</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveLedgerTab('leaves')}
              className="w-full flex items-center justify-between text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer text-left"
            >
              <span className="underline decoration-dotted">Leaves & Absent:</span>
              <span className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1 flex-wrap justify-end">
                -{formatHoursToHuman(summary?.total_leave_deducted_hours)} ({summary?.total_leave_days || 0}{' '}
                {summary?.total_leave_days === 1 ? 'day' : 'days'})
                {Number(summary?.total_absent_days || 0) > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-black">
                    {summary.total_absent_days} absent
                  </span>
                )}
                <span className="text-[10px]">➔</span>
              </span>
            </button>
          </div>
        </div>

        {/* Card 4: Net Overtime Balance vs Debt */}
        <div
          className={`text-white p-6 rounded-3xl shadow-md relative overflow-hidden flex flex-col justify-between group hover:shadow-lg transition duration-300 ${
            summary?.has_overtime_debt
              ? 'bg-gradient-to-br from-rose-600 via-rose-700 to-red-800 hover:shadow-rose-600/30'
              : 'bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 hover:shadow-amber-500/20'
          }`}
        >
          <div>
            <div className="flex items-center justify-between text-white/90 mb-3">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-xs border ${
                  summary?.has_overtime_debt
                    ? 'bg-black/25 text-rose-100 border-rose-300/40'
                    : 'bg-white/20 text-white border-white/20'
                }`}
              >
                {summary?.has_overtime_debt ? '4. Debt' : '4. Overtime Balance'} &bull;{' '}
                {summary?.selected_month_label || 'Month'}
              </span>
              <span className="text-2xl group-hover:scale-125 transition-transform duration-300">
                {summary?.has_overtime_debt ? '⚠️' : '🥭'}
              </span>
            </div>

            {summary?.has_overtime_debt ? (
              <>
                <div className="text-3xl font-black text-white tracking-tight flex items-baseline gap-2 flex-wrap">
                  <span>-{formatHoursToHuman(summary?.overtime_debt_hours)}</span>
                </div>
                <div className="mt-1 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/30 text-rose-100 font-bold text-xs border border-rose-400/30">
                  <span>⚠️</span>
                  <span>0 Ripe Mangoes (Debt active &bull; Unexcused absence)</span>
                </div>
              </>
            ) : (
              <>
                <div className="text-3xl font-black text-white tracking-tight flex items-baseline gap-2 flex-wrap">
                  <span>+{formatHoursToHuman(availableBreakHours)}</span>
                </div>
                <div className="mt-1 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/20 text-white font-black text-xs">
                  <span>🥭</span>
                  <span>
                    {ripeCount} Ripe {ripeCount === 1 ? 'Mango' : 'Mangoes'} ({availableBreakDays} Full Days Break)
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-white/20 space-y-1.5 text-xs text-white/90">
            <div className="flex items-center justify-between text-[11px]">
              <span>Overtime Reward Bank:</span>
              <span className="font-semibold">
                {summary?.has_overtime_debt
                  ? `Gross +${formatHoursToHuman(summary?.total_gross_overtime_hours)} - Debt ${formatHoursToHuman(
                      summary?.total_deducted_hours
                    )}`
                  : `+${formatHoursToHuman(
                      summary?.total_gross_overtime_hours || summary?.total_overtime_hours
                    )} (টাকা ৳ বা ছুটি 🌴)`}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] pt-0.5">
              <span>Tiffin Impact:</span>
              <span className="font-bold">
                {(summary?.tiffin_summary?.net_tiffin_delta || 0) >= 0
                  ? `+${summary?.tiffin_summary?.net_tiffin_delta || 0}m bonus`
                  : `${summary?.tiffin_summary?.net_tiffin_delta}m penalty`}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] pt-1">
              {summary?.has_overtime_debt ? (
                <span className="text-rose-200 font-semibold">
                  Clear {formatHoursToHuman(summary?.overtime_debt_hours)} debt to start ripening mangoes
                </span>
              ) : (
                <>
                  <span>Next Mango: {summary?.progress_to_next_mango || 0}%</span>
                  {ripeCount > 0 ? (
                    <button
                      type="button"
                      onClick={() => {
                        const firstRipe =
                          allRipeMangoes.find((m) => m.type === 'ripe') || allRipeMangoes[0];
                        if (firstRipe) {
                          setSelectedMango(firstRipe);
                          setIsClaimModalOpen(true);
                        }
                      }}
                      className="font-black text-white underline hover:text-amber-200 cursor-pointer"
                    >
                      Redeem (টাকা বা ছুটি) ➔
                    </button>
                  ) : (
                    <span className="text-amber-200 font-bold">
                      ({formatHoursToHuman(summary?.remaining_hours_for_next || shiftHours)} বাকি)
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

