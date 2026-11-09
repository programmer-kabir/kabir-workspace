import React from 'react';
import { FiInfo } from 'react-icons/fi';
import { formatHoursToHuman } from './treeUtils';

/**
 * MangoCalculationRibbon
 * Overtime debt alert notification banner and visual calculation sequence ribbon.
 */
export default function MangoCalculationRibbon({
  summary,
  setActiveLedgerTab,
  availableBreakHours = 0,
  ripeCount = 0,
}) {
  return (
    <div className="space-y-4">
      {/* Overtime Debt Alert Notification Banner */}
      {summary?.has_overtime_debt && (
        <div className="p-4 md:p-5 rounded-3xl bg-gradient-to-r from-rose-500/15 via-red-500/10 to-amber-500/10 border-2 border-rose-500/30 text-rose-900 dark:text-rose-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-600 text-white shadow-md text-lg shrink-0">
              ⚠️
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-sm md:text-base text-rose-800 dark:text-rose-100">
                  আম গাছে ঘাটতি ঋণ চালু রয়েছে (-{formatHoursToHuman(summary?.overtime_debt_hours)})
                </h3>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-600 text-white uppercase tracking-wider">
                  Overtime Debt Active
                </span>
              </div>
              <p className="text-xs text-rose-700/90 dark:text-rose-300 mt-1 leading-relaxed">
                অনুপস্থিতির কারণে আপনার আম গাছ থেকে ৮ ঘণ্টার ঘাটতি ঋণ প্রযোজ্য হয়েছে। ভবিষ্যৎ কর্মদিবসে
                অতিরিক্ত কাজ (Overtime) অথবা টিফিন বিরতি সাশ্রয় (+বোনাস মিনিট) থেকে প্রথমে এই{' '}
                <strong>-{formatHoursToHuman(summary?.overtime_debt_hours)}</strong> ঘাটতি স্বয়ংক্রিয়ভাবে
                পরিশোধ হবে, এরপরেই গাছে নতুন পাকা আম ধরবে!
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveLedgerTab('leaves')}
            className="shrink-0 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md transition cursor-pointer"
          >
            অনুপস্থিতির হিসাব দেখুন ➔
          </button>
        </div>
      )}

      {/* Visual Calculation Workflow Ribbon */}
      <div className="bg-white dark:bg-slate-900 p-4 md:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px]">
          <FiInfo className="w-4 h-4 text-amber-500 shrink-0" />
          <span>Calculation Sequence:</span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 text-xs font-semibold">
          <div className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50">
            1. Expected: <strong>{formatHoursToHuman(summary?.total_expected_hours)}</strong>
          </div>
          <span className="text-slate-400 font-black">➔</span>
          <div className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50">
            2. Worked: <strong>{formatHoursToHuman(summary?.total_worked_hours)}</strong>
          </div>
          <span className="text-slate-400 font-black">➔</span>
          <div className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50 flex items-center gap-1.5">
            <span>
              3. Shortfall: <strong>-{formatHoursToHuman(summary?.total_short_hours)}</strong>
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-rose-200/60 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 font-bold">
              Payroll Salary ৳
            </span>
          </div>
          {Number(summary?.total_cashed_out_overtime_hours || 0) > 0 && (
            <>
              <span className="text-slate-400 font-black">➔</span>
              <div className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50">
                4. Cashed Out ৳: <strong>-{formatHoursToHuman(summary?.total_cashed_out_overtime_hours)}</strong>
              </div>
            </>
          )}
          <span className="text-slate-400 font-black">➔</span>
          <button
            type="button"
            onClick={() => setActiveLedgerTab('tiffin')}
            title="Click to view Tiffin break efficiency details"
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 cursor-pointer transition hover:scale-105 ${
              Number(summary?.total_tiffin_bonus_hours || 0) > 0
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50'
                : Number(summary?.total_tiffin_penalty_hours || 0) > 0
                ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/50'
                : 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/50'
            }`}
          >
            <span>
              🥪 Tiffin Impact:{' '}
              <strong>
                {(summary?.tiffin_summary?.net_tiffin_delta || 0) >= 0
                  ? `+${summary?.tiffin_summary?.net_tiffin_delta || 0}m`
                  : `${summary?.tiffin_summary?.net_tiffin_delta}m`}
              </strong>
            </span>
          </button>
          <span className="text-slate-400 font-black">➔</span>
          {summary?.has_overtime_debt ? (
            <div className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 text-white font-black shadow-xs flex items-center gap-1.5 animate-pulse">
              <span>
                Overtime Debt: <strong>-{formatHoursToHuman(summary?.overtime_debt_hours)}</strong>
              </span>
              <span>(0 Mangoes ⚠️)</span>
            </div>
          ) : (
            <div className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black shadow-xs flex items-center gap-1.5">
              <span>
                Net Balance: <strong>+{formatHoursToHuman(availableBreakHours)}</strong>
              </span>
              <span>= {ripeCount} Mangoes 🥭</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

