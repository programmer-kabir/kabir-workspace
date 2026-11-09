import React from 'react';
import { FiSun, FiClock, FiTrendingUp, FiTrendingDown, FiInfo } from 'react-icons/fi';
import { formatHoursToHuman, formatTime12, parseLedgerDate } from './treeUtils';

/**
 * MangoLedgerTabs
 * Comprehensive 5-tab Ledger and History for the Break Bank:
 * 1. Overtime (+)
 * 2. Short Time (-)
 * 3. Leaves Deducted (-)
 * 4. Claimed Breaks
 * 5. Tiffin Breaks (Detailed 5-card metric bar & time log)
 */
export default function MangoLedgerTabs({
  data,
  summary,
  shiftHours = 8,
  activeLedgerTab,
  setActiveLedgerTab,
}) {
  return (
    <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl p-5 sm:p-7 md:p-8 rounded-[28px] border border-slate-200/90 dark:border-slate-800/90 shadow-[0_4px_25px_-4px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] space-y-6 transition-all duration-300">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5 pb-5 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400/20 via-orange-400/15 to-amber-500/10 dark:from-amber-500/20 dark:via-orange-500/15 dark:to-transparent border border-amber-200/80 dark:border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-xs shrink-0">
            <FiSun className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg tracking-tight">
                Break Bank Ledger & History
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-700/60 inline-flex items-center gap-1.5 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Verified Ledger</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
              Track your extra work hours, leaves deducted in between, and redeemed break days.
            </p>
          </div>
        </div>

        {/* Modern Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-100/90 dark:bg-slate-950/80 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800/90 overflow-x-auto max-w-full custom-scrollbar self-start xl:self-auto shrink-0 shadow-inner">
          {/* Tab 1: Overtime */}
          <button
            type="button"
            onClick={() => setActiveLedgerTab('overtime')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-2 shrink-0 ${
              activeLedgerTab === 'overtime'
                ? 'bg-white dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 shadow-sm border border-emerald-200/90 dark:border-emerald-500/40 ring-2 ring-emerald-500/10 dark:ring-0 font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60'
            }`}
          >
            <span className="text-sm">🌿</span>
            <span>Overtime</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black transition-colors ${
                activeLedgerTab === 'overtime'
                  ? 'bg-emerald-100 dark:bg-emerald-500/30 text-emerald-800 dark:text-emerald-200'
                  : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {data?.contributions?.length || 0}
            </span>
          </button>

          {/* Tab 2: Short Time */}
          <button
            type="button"
            onClick={() => setActiveLedgerTab('short_time')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-2 shrink-0 ${
              activeLedgerTab === 'short_time'
                ? 'bg-white dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 shadow-sm border border-rose-200/90 dark:border-rose-500/40 ring-2 ring-rose-500/10 dark:ring-0 font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60'
            }`}
          >
            <span className="text-sm">⏱️</span>
            <span>Short Time</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black transition-colors ${
                activeLedgerTab === 'short_time'
                  ? 'bg-rose-100 dark:bg-rose-500/30 text-rose-800 dark:text-rose-200'
                  : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {data?.gaps?.length || 0}
            </span>
          </button>

          {/* Tab 3: Leaves */}
          <button
            type="button"
            onClick={() => setActiveLedgerTab('leaves')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-2 shrink-0 ${
              activeLedgerTab === 'leaves'
                ? 'bg-white dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 shadow-sm border border-amber-200/90 dark:border-amber-500/40 ring-2 ring-amber-500/10 dark:ring-0 font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60'
            }`}
          >
            <span className="text-sm">🏖️</span>
            <span>Leaves Deducted</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black transition-colors ${
                activeLedgerTab === 'leaves'
                  ? 'bg-amber-100 dark:bg-amber-500/30 text-amber-800 dark:text-amber-200'
                  : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {data?.leaves_taken?.length || 0}
            </span>
          </button>

          {/* Tab 4: Tiffin */}
          <button
            type="button"
            onClick={() => setActiveLedgerTab('tiffin')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-2 shrink-0 ${
              activeLedgerTab === 'tiffin'
                ? 'bg-white dark:bg-orange-500/15 text-orange-700 dark:text-orange-300 shadow-sm border border-orange-200/90 dark:border-orange-500/40 ring-2 ring-orange-500/10 dark:ring-0 font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60'
            }`}
          >
            <span className="text-sm">🥪</span>
            <span>Tiffin Breaks</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black transition-colors ${
                activeLedgerTab === 'tiffin'
                  ? 'bg-orange-100 dark:bg-orange-500/30 text-orange-800 dark:text-orange-200'
                  : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {data?.tiffin_history?.length || summary?.tiffin_summary?.total_tiffin_count || 0}
            </span>
          </button>

          {/* Tab 5: Claims */}
          <button
            type="button"
            onClick={() => setActiveLedgerTab('claims')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-2 shrink-0 ${
              activeLedgerTab === 'claims'
                ? 'bg-white dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 shadow-sm border border-indigo-200/90 dark:border-indigo-500/40 ring-2 ring-indigo-500/10 dark:ring-0 font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60'
            }`}
          >
            <span className="text-sm">🥭</span>
            <span>Claimed Breaks</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black transition-colors ${
                activeLedgerTab === 'claims'
                  ? 'bg-indigo-100 dark:bg-indigo-500/30 text-indigo-800 dark:text-indigo-200'
                  : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {data?.recent_claims?.length || 0}
            </span>
          </button>
        </div>
      </div>

      {/* Tab 1: Overtime Contributions */}
      {activeLedgerTab === 'overtime' && (
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white/60 dark:bg-slate-950/40 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto max-h-[420px] custom-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-md text-slate-500 dark:text-slate-400 border-b border-slate-200/90 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Date & Day</th>
                  <th className="py-3.5 px-4 font-bold">Worked Duration</th>
                  <th className="py-3.5 px-4 font-bold">Shift Target</th>
                  <th className="py-3.5 px-4 font-bold">Overtime Earned</th>
                  <th className="py-3.5 px-4 font-bold text-right">Bank Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-600 dark:text-slate-300 font-medium">
                {data?.contributions && data.contributions.length > 0 ? (
                  data.contributions.map((item, idx) => {
                    const dateObj = parseLedgerDate(item.date);
                    return (
                      <tr
                        key={idx}
                        className="hover:bg-slate-50/90 dark:hover:bg-slate-800/40 transition-colors duration-150 group"
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 flex flex-col items-center justify-center text-center shrink-0 group-hover:border-emerald-300/60 dark:group-hover:border-emerald-700/50 transition-colors">
                              <span className="text-[9px] font-extrabold uppercase text-slate-500 dark:text-slate-400 leading-none">
                                {dateObj.dayOfWeek}
                              </span>
                              <span className="text-xs font-black text-slate-800 dark:text-slate-100 leading-none mt-0.5">
                                {dateObj.dayNumber}
                              </span>
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white text-xs">
                                {dateObj.formatted}
                              </div>
                              <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                                {item.date}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400">
                              <FiClock className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <span className="font-bold text-slate-800 dark:text-slate-100 text-xs">
                                {formatHoursToHuman(item.worked_hours)}
                              </span>
                              <span className="block text-[10px] text-slate-400 dark:text-slate-500">
                                Logged shift
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 text-xs font-semibold">
                            <span className="text-[11px]">🎯</span>
                            <span>{formatHoursToHuman(item.expected_hours)}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/90 dark:border-emerald-700/60 text-emerald-700 dark:text-emerald-300 text-xs font-black shadow-2xs">
                            <FiTrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>+{formatHoursToHuman(item.overtime_hours)}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {item.is_tiffin_bonus ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[11px] font-black border border-amber-300 dark:border-amber-700/60 shadow-2xs">
                              <span>🥪</span>
                              <span>Tiffin Savings</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/70 dark:to-teal-950/70 text-emerald-700 dark:text-emerald-300 text-[11px] font-extrabold border border-emerald-200/90 dark:border-emerald-700/70 shadow-2xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span>+ Added to Tree</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="py-12 px-4 text-center">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-slate-400 flex items-center justify-center text-2xl shadow-inner">
                          🌿
                        </div>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                          No Overtime Hours Logged
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                          Work past your {shiftHours}h shift target to accumulate overtime and earn ripe mangoes!
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Short Time / Shift Shortfalls */}
      {activeLedgerTab === 'short_time' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/50 text-xs text-rose-900 dark:text-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-start sm:items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 shrink-0">
                <FiInfo className="w-4 h-4" />
              </div>
              <span>
                <strong>Short Time (Gap):</strong> Shifts where work ended earlier than the standard {shiftHours}h shift target. These shortfalls are deducted from your gross overtime.
              </span>
            </div>
            <div className="shrink-0 px-3 py-1 rounded-xl bg-white dark:bg-rose-900/60 border border-rose-200 dark:border-rose-700/60 text-rose-700 dark:text-rose-200 font-black text-xs self-start sm:self-auto shadow-2xs">
              Total Short Time: -{formatHoursToHuman(summary?.total_short_hours)}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white/60 dark:bg-slate-950/40 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto max-h-[420px] custom-scrollbar">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-md text-slate-500 dark:text-slate-400 border-b border-slate-200/90 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4 font-bold">Date & Day</th>
                    <th className="py-3.5 px-4 font-bold">Worked Duration</th>
                    <th className="py-3.5 px-4 font-bold">Shift Target</th>
                    <th className="py-3.5 px-4 font-bold">Short Time (Gap)</th>
                    <th className="py-3.5 px-4 font-bold text-right">Bank Impact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-600 dark:text-slate-300 font-medium">
                  {data?.gaps && data.gaps.length > 0 ? (
                    data.gaps.map((item, idx) => {
                      const dateObj = parseLedgerDate(item.date);
                      return (
                        <tr key={idx} className="hover:bg-slate-50/90 dark:hover:bg-slate-800/40 transition-colors duration-150">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 flex flex-col items-center justify-center text-center shrink-0">
                                <span className="text-[9px] font-extrabold uppercase text-slate-500 dark:text-slate-400 leading-none">
                                  {dateObj.dayOfWeek}
                                </span>
                                <span className="text-xs font-black text-slate-800 dark:text-slate-100 leading-none mt-0.5">
                                  {dateObj.dayNumber}
                                </span>
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 dark:text-white text-xs">{dateObj.formatted}</div>
                                <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500">{item.date}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-800 dark:text-slate-100 text-xs">
                              {formatHoursToHuman(item.worked_hours)}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="text-slate-500 dark:text-slate-400 font-medium">
                              {formatHoursToHuman(item.expected_hours)}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200/90 dark:border-rose-700/60 text-rose-700 dark:text-rose-300 text-xs font-black shadow-2xs">
                              <FiTrendingDown className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                              <span>-{formatHoursToHuman(item.short_hours)}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-[11px] font-bold border border-rose-200 dark:border-rose-700/60 shadow-2xs">
                              <span>- Deducted from OT</span>
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="5" className="py-12 px-4 text-center">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-2xl shadow-inner">
                            🎉
                          </div>
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                            No Short Shifts Recorded!
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                            You've met or exceeded the {shiftHours}h target every working day.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Leaves & Absences Deducted */}
      {activeLedgerTab === 'leaves' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 text-xs text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-start sm:items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 shrink-0">
                <FiInfo className="w-4 h-4" />
              </div>
              <span>
                <strong>Note:</strong> Approved leaves or absent days taken in between are automatically deducted from your overtime break bank (at {shiftHours}h per day).
              </span>
            </div>
            <div className="shrink-0 px-3 py-1 rounded-xl bg-white dark:bg-amber-900/60 border border-amber-200 dark:border-amber-700/60 text-amber-700 dark:text-amber-200 font-black text-xs self-start sm:self-auto shadow-2xs">
              Total: -{formatHoursToHuman(summary?.total_leave_deducted_hours)}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white/60 dark:bg-slate-950/40 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto max-h-[420px] custom-scrollbar">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-md text-slate-500 dark:text-slate-400 border-b border-slate-200/90 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4 font-bold">Leave Date</th>
                    <th className="py-3.5 px-4 font-bold">Type</th>
                    <th className="py-3.5 px-4 font-bold">Reason / Source</th>
                    <th className="py-3.5 px-4 font-bold">Hours Deducted</th>
                    <th className="py-3.5 px-4 font-bold text-right">Bank Impact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-600 dark:text-slate-300 font-medium">
                  {data?.leaves_taken && data.leaves_taken.length > 0 ? (
                    data.leaves_taken.map((leave, idx) => {
                      const dateObj = parseLedgerDate(leave.date);
                      return (
                        <tr
                          key={idx}
                          className={`transition-colors duration-150 ${
                            leave.type === 'Absent'
                              ? 'bg-rose-50/40 dark:bg-rose-950/20 hover:bg-rose-50/70'
                              : 'hover:bg-slate-50/90 dark:hover:bg-slate-800/40'
                          }`}
                        >
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 flex flex-col items-center justify-center text-center shrink-0">
                                <span className="text-[9px] font-extrabold uppercase text-slate-500 dark:text-slate-400 leading-none">
                                  {dateObj.dayOfWeek}
                                </span>
                                <span className="text-xs font-black text-slate-800 dark:text-slate-100 leading-none mt-0.5">
                                  {dateObj.dayNumber}
                                </span>
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 dark:text-white text-xs">{dateObj.formatted}</div>
                                <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500">{leave.date}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-1 rounded-xl text-[10px] font-black border ${
                                leave.type === 'Absent'
                                  ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              {leave.type === 'Absent' ? 'Absent ⚠️' : leave.type}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                            {leave.type === 'Absent' ? (
                              <span className="font-bold text-rose-700 dark:text-rose-300">
                                Unexcused Absence (Overtime Debt Penalty)
                              </span>
                            ) : (
                              leave.reason || 'Approved Leave'
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-black text-xs">
                            {leave.is_student_exempt || leave.type === 'Student Academic Leave' ? (
                              <span className="text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1">
                                <span>0h</span>
                                <span className="text-[10px] font-normal text-indigo-500">(Student Quota 🎓)</span>
                              </span>
                            ) : (
                              <span className="text-rose-600 dark:text-rose-400">
                                -{formatHoursToHuman(leave.hours_deducted || shiftHours)}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <span
                              className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border shadow-2xs ${
                                leave.is_student_exempt || leave.type === 'Student Academic Leave'
                                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                                  : leave.type === 'Absent'
                                  ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-700/80 font-black'
                                  : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-700/60'
                              }`}
                            >
                              {leave.is_student_exempt || leave.type === 'Student Academic Leave'
                                ? 'No Mango Cut 🛡️'
                                : leave.type === 'Absent'
                                ? '-8h Debt Impact'
                                : '- Deducted'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="5" className="py-12 px-4 text-center">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-2xl shadow-inner">
                            🏖️
                          </div>
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                            No Leaves or Absences Taken!
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                            Your overtime break bank is 100% intact.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Claimed Mango Breaks (Full Day + In-Shift) */}
      {activeLedgerTab === 'claims' && (
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white/60 dark:bg-slate-950/40 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto max-h-[420px] custom-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-md text-slate-500 dark:text-slate-400 border-b border-slate-200/90 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Date & Day</th>
                  <th className="py-3.5 px-4 font-bold">Break / Claim Type</th>
                  <th className="py-3.5 px-4 font-bold">Time / Hours Deducted</th>
                  <th className="py-3.5 px-4 font-bold">Reason & Context</th>
                  <th className="py-3.5 px-4 font-bold text-right">Ledger Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-600 dark:text-slate-300 font-medium">
                {data?.recent_claims && data.recent_claims.length > 0 ? (
                  data.recent_claims.map((claim, idx) => {
                    const dateObj = parseLedgerDate(claim.leave_date || claim.claim_date);
                    const isOverBreak = claim.type?.includes('Over-Break') || claim.purpose === 'Over-Break Penalty';
                    const isSold = claim.type?.includes('Sold');
                    const isFullDay = claim.type?.includes('Full Day');
                    return (
                      <tr
                        key={idx}
                        className={`transition-colors duration-150 ${
                          isOverBreak
                            ? 'bg-rose-50/20 dark:bg-rose-950/10 hover:bg-rose-50/50 dark:hover:bg-rose-950/20'
                            : 'hover:bg-slate-50/90 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 flex flex-col items-center justify-center text-center shrink-0">
                              <span className="text-[9px] font-extrabold uppercase text-slate-500 dark:text-slate-400 leading-none">
                                {dateObj.dayOfWeek}
                              </span>
                              <span className="text-xs font-black text-slate-800 dark:text-slate-100 leading-none mt-0.5">
                                {dateObj.dayNumber}
                              </span>
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white text-xs">{dateObj.formatted}</div>
                              <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500">{claim.leave_date || claim.claim_date}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`px-2.5 py-1 rounded-xl text-[10px] font-black border shadow-2xs ${
                                isOverBreak
                                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700/60'
                                  : isSold
                                  ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/60'
                                  : isFullDay
                                  ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
                                  : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                              }`}
                            >
                              {claim.type || 'Mango Break'}
                            </span>
                            {claim.purpose && (
                              <span
                                className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase border ${
                                  isOverBreak
                                    ? 'bg-rose-100/70 dark:bg-rose-900/40 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800/50'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                }`}
                              >
                                {isOverBreak ? '⚠️ ' : '🎯 '}
                                {claim.purpose}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-black text-xs">
                          {isOverBreak ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/50 shadow-2xs">
                              <span>-</span>
                              <span>{claim.duration_minutes ? `${claim.duration_minutes} mins` : formatHoursToHuman(claim.hours_claimed)}</span>
                            </span>
                          ) : (
                            <span className="text-slate-900 dark:text-white">
                              {claim.duration_minutes
                                ? `${claim.duration_minutes} mins (${formatHoursToHuman(claim.hours_claimed)})`
                                : formatHoursToHuman(claim.hours_claimed)}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                          {claim.reason || 'Overtime Break'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold border shadow-2xs ${
                              isOverBreak
                                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-700/60'
                                : claim.status === 'Pending'
                                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700/60'
                                : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/60'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isOverBreak
                                  ? 'bg-rose-500'
                                  : claim.status === 'Pending'
                                  ? 'bg-amber-500 animate-pulse'
                                  : 'bg-emerald-500'
                              }`}
                            />
                            <span>{claim.status}</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="py-12 px-4 text-center">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center text-2xl shadow-inner">
                          🥭
                        </div>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                          No Mango Break Tokens Claimed Yet
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                          Click a ripe mango on the tree or request an in-shift Mango Break to redeem your earned break days!
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Tiffin Break Efficiency & Tree Impact */}
      {activeLedgerTab === 'tiffin' && (
        <div className="space-y-5">
          {/* Quick Metrics Bar - 5 Columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-50 via-amber-50/20 to-emerald-50/20 dark:from-slate-950/80 dark:via-amber-950/20 dark:to-emerald-950/20 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs">
            <div className="p-3.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800 shadow-2xs space-y-1">
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Tiffins Completed</div>
              <div className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-baseline gap-1.5">
                <span>{summary?.tiffin_summary?.total_tiffin_count || 0}</span>
                <span className="text-xs font-semibold text-slate-400">
                  / {summary?.total_sessions_counted || 34} sessions
                </span>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                {summary?.total_sessions_counted
                  ? `${(summary?.total_sessions_counted || 34) - (summary?.tiffin_summary?.total_tiffin_count || 0)} left before 1:20 PM`
                  : 'Standard 40m / day'}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800 shadow-2xs space-y-1">
              <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                <span>🎯</span> Target Allowed
              </div>
              <div className="text-xl font-black text-indigo-700 dark:text-indigo-300">
                {formatHoursToHuman(
                  summary?.tiffin_summary?.total_target_hours ||
                    ((summary?.tiffin_summary?.total_tiffin_count || 0) * 40) / 60
                )}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                {summary?.tiffin_summary?.total_tiffin_count || 0} দিন &times; ৪০ মিনিট ={' '}
                {(summary?.tiffin_summary?.total_tiffin_count || 0) * 40} মি.
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800 shadow-2xs space-y-1">
              <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                <span>⏱️</span> Actual Taken
              </div>
              <div className="text-xl font-black text-blue-700 dark:text-blue-300">
                {summary?.tiffin_summary?.total_taken_hours
                  ? formatHoursToHuman(summary?.tiffin_summary?.total_taken_hours)
                  : `${(data?.tiffin_history || []).reduce((acc, t) => acc + Number(t.duration_minutes || 0), 0)} mins`}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                বাস্তব ব্রেক টাইম লগ
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800 shadow-2xs space-y-1">
              <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <span>🥭</span> Efficiency Bonus
              </div>
              <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                +{summary?.tiffin_summary?.bonus_minutes || 0}m
              </div>
              <div className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80">
                {summary?.tiffin_summary?.penalty_minutes > 0
                  ? `Penalty: -${summary?.tiffin_summary?.penalty_minutes}m`
                  : 'বাস্তব সাশ্রয়ী সময়'}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800 shadow-2xs space-y-1">
              <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <span>🌳</span> Net Bank Impact
              </div>
              <div
                className={`text-xl font-black ${
                  (summary?.tiffin_summary?.net_tiffin_delta || 0) >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {(summary?.tiffin_summary?.net_tiffin_delta || 0) >= 0
                  ? `+${summary?.tiffin_summary?.net_tiffin_delta || 0}m`
                  : `${summary?.tiffin_summary?.net_tiffin_delta}m`}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                সরাসরি ওভারটাইম ব্যাংকে যোগ
              </div>
            </div>
          </div>

          {/* Table of Tiffins */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white/60 dark:bg-slate-950/40 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto max-h-[420px] custom-scrollbar">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-md text-slate-500 dark:text-slate-400 border-b border-slate-200/90 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4 font-bold">Date & Day</th>
                    <th className="py-3.5 px-4 font-bold">Time Window</th>
                    <th className="py-3.5 px-4 font-bold">Duration Taken</th>
                    <th className="py-3.5 px-4 font-bold">Target Limit</th>
                    <th className="py-3.5 px-4 font-bold text-right">Mango Tree Impact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-600 dark:text-slate-300 font-medium">
                  {data?.tiffin_history && data.tiffin_history.length > 0 ? (
                    data.tiffin_history.map((tf, idx) => {
                      const delta = Number(tf.tiffin_delta_minutes || 0);
                      const dateObj = parseLedgerDate(tf.date);
                      return (
                        <tr key={idx} className="hover:bg-slate-50/90 dark:hover:bg-slate-800/40 transition-colors duration-150">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 flex flex-col items-center justify-center text-center shrink-0">
                                <span className="text-[9px] font-extrabold uppercase text-slate-500 dark:text-slate-400 leading-none">
                                  {dateObj.dayOfWeek}
                                </span>
                                <span className="text-xs font-black text-slate-800 dark:text-slate-100 leading-none mt-0.5">
                                  {dateObj.dayNumber}
                                </span>
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 dark:text-white text-xs">{dateObj.formatted}</div>
                                <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500">{tf.date}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                            {tf.start_time ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/50">
                                <span>{formatTime12(tf.start_time)}</span>
                                <span className="text-slate-400">→</span>
                                <span>{tf.end_time ? formatTime12(tf.end_time) : 'Ongoing'}</span>
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">Scheduled 1:20 PM</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                              {tf.duration_minutes ? `${tf.duration_minutes} mins` : '40 mins'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-medium">
                            40 mins
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {delta > 0 ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 text-[10px] font-black border border-emerald-300 dark:border-emerald-700/60 shadow-2xs">
                                <span>🥭</span>
                                <span>+{delta}m Bonus (Added to Tree)</span>
                              </span>
                            ) : delta < 0 ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 text-[10px] font-black border border-rose-300 dark:border-rose-700/60 shadow-2xs">
                                <span>⚡</span>
                                <span>{delta}m Penalty (Deducted)</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold border border-slate-200 dark:border-slate-700">
                                <span>0m (Standard 40m)</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="5" className="py-12 px-4 text-center">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center text-2xl shadow-inner">
                            🥪
                          </div>
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                            No Completed Tiffin Breaks Logged Yet
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                            Tiffin records will appear here after your daily lunch break is completed.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

