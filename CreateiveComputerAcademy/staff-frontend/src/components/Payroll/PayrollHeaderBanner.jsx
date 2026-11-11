import React from 'react';
import { FiShield, FiRefreshCw, FiArrowUpRight, FiAlertCircle } from 'react-icons/fi';
import { StaffAvatar } from './payrollUtils.jsx';

export const PayrollHeaderBanner = ({
  currentUser,
  summary = {},
  isStaggeredContract = false,
  isYearlyContract = false,
  syncing = false,
  hasScheme = false,
  fetchPayroll,
  openWithdrawModal,
  liveHumanTime = '0m',
  liveTotalMinutes = 0,
  liveSecsRemainder = 0,
  liveEarned = 0,
  activeHourlyRate = 0,
  isOnBreak = false,
  activeBreakType = null,
}) => {
  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-4 z-10">
          <StaffAvatar
            name={currentUser?.name}
            picture={currentUser?.profile_picture}
            size="xl"
            className="border-2 border-indigo-400/40 shadow-sm shrink-0"
          />
          <div className="space-y-1">
            <div
              className={`inline-flex items-center gap-2 px-3 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${
                isStaggeredContract
                  ? 'bg-purple-50 dark:bg-purple-500/20 border-purple-200 dark:border-purple-400/30 text-purple-700 dark:text-purple-300'
                  : isYearlyContract
                    ? 'bg-amber-50 dark:bg-amber-500/20 border-amber-200 dark:border-amber-400/30 text-amber-700 dark:text-amber-300'
                    : 'bg-indigo-50 dark:bg-indigo-500/20 border-indigo-200 dark:border-indigo-400/30 text-indigo-700 dark:text-indigo-300'
              }`}
            >
              <FiShield className="w-3.5 h-3.5" />
              {isStaggeredContract
                ? '1-Year Staggered Contract'
                : isYearlyContract
                  ? 'Yearly Company Contract'
                  : 'Monthly Salary Scheme'}
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {currentUser?.name}'s Work Wallet
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-xs md:text-sm max-w-xl">
              {isStaggeredContract
                ? 'Your salary progresses across 4 quarterly milestone tiers (৳3.5k ➔ ৳4.5k ➔ ৳5.5k ➔ ৳6.5k). Past months stay permanently locked at their exact rate!'
                : isYearlyContract
                  ? 'Your approved work time contributes to your agreed contract target. Once complete, 100% of all additional earnings are yours to withdraw!'
                  : 'Your salary is computed dynamically from your approved work time (8 standard hours base divisor + overtime).'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 z-10">
          <button
            onClick={fetchPayroll}
            className="p-3 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-white rounded-2xl transition border border-slate-200 dark:border-white/10 cursor-pointer"
            title="Refresh"
          >
            <FiRefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
          </button>
          {hasScheme && (
            <div className="flex flex-col items-end gap-1">
              <button
                onClick={openWithdrawModal}
                disabled={
                  Number(summary.available_withdrawable || 0) <= 0 &&
                  Number(summary.overtime_bank?.available_hours || 0) <= 0
                }
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm shadow-md transition duration-200 ${
                  Number(summary.available_withdrawable || 0) > 0 ||
                  Number(summary.overtime_bank?.available_hours || 0) > 0
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-emerald-500/20 cursor-pointer'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-slate-700'
                }`}
              >
                <FiArrowUpRight className="w-5 h-5" />
                Request Withdrawal
              </button>
              {Number(summary.min_withdrawal_limit || 0) > 0 && (
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  Min. ৳{Number(summary.min_withdrawal_limit).toLocaleString()} required
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* No Scheme Alert */}
      {!hasScheme && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 p-6 rounded-3xl text-center space-y-3">
          <FiAlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
            No Active Pay Scheme Configured
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            Your payroll scheme is currently pending assignment by the administrator. Please reach out to management.
          </p>
        </div>
      )}

      {/* When Scheme is active: Ongoing shift banner & 15th Unlock banner */}
      {hasScheme && (
        <>
          {/* Active Ongoing Shift Live Earning Banner */}
          {summary.active_session && (
            <div className={`p-5 rounded-3xl shadow-xs flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden transition-all ${
              isOnBreak
                ? 'bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-600/40'
                : 'bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/40 animate-pulse-subtle'
            }`}>
              <div className="flex items-center gap-4">
                <div className="relative flex items-center justify-center">
                  <div className={`w-4 h-4 rounded-full ${isOnBreak ? 'bg-amber-400' : 'bg-emerald-400 animate-ping'} absolute`} />
                  <div className={`w-3.5 h-3.5 rounded-full z-10 ${isOnBreak ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                      isOnBreak
                        ? 'text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-500/20 border-amber-300 dark:border-amber-500/40'
                        : 'text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30'
                    }`}>
                      {isOnBreak ? `☕ বিরতি চলছে (${activeBreakType || 'Break'} — আয় স্থগিত)` : 'Live Shift In Progress'}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Checked in at {summary.active_session.check_in_time}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                    {isOnBreak ? 'কার্যকর কাজের সময় (স্থগিত): ' : 'Currently Working: '}
                    <span className={`font-extrabold ${isOnBreak ? 'text-amber-700 dark:text-amber-300' : 'text-emerald-600 dark:text-emerald-300'}`}>
                      {liveHumanTime}
                    </span>{' '}
                    ({liveTotalMinutes} mins {liveSecsRemainder} secs)
                  </h4>
                </div>
              </div>

              <div className={`flex items-center gap-6 bg-white dark:bg-slate-900/80 px-5 py-3 rounded-2xl border shadow-xs ${
                isOnBreak ? 'border-amber-200 dark:border-amber-500/30' : 'border-emerald-200 dark:border-emerald-500/20'
              }`}>
                <div>
                  <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                    {isOnBreak ? 'Session Earnings (Paused)' : 'Live Session Earnings'}
                  </div>
                  <div className={`text-xl font-black ${isOnBreak ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    + ৳ {liveEarned.toFixed(2)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                    Hourly Rate (Net)
                  </div>
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    ৳ {activeHourlyRate.toFixed(2)}/h
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Monthly Cycle & 15th Unlock Countdown Banner */}
          <div className="bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-500/30 p-5 md:p-6 rounded-3xl shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden">
            <div className="space-y-1 z-10">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-[10px] font-black uppercase tracking-wider border border-indigo-200 dark:border-indigo-500/30">
                  🗓️ Monthly 15th Payout Cycle
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Next Unlock:{' '}
                  <strong className="text-slate-900 dark:text-white">
                    {summary.next_payout_date || '15th'}
                  </strong>
                </span>
              </div>
              <h4 className="text-base md:text-lg font-bold text-slate-900 dark:text-white">
                Monthly Earnings mature on the{' '}
                <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">
                  15th of the following month
                </span>
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-2xl">
                Earnings unlock on the 15th as integer cashouts. Fractional balance (+৳
                {Number(summary.fractional_rollover || 0).toFixed(2)}) rolls over seamlessly into next cycle!
              </p>
            </div>

            <div className="flex items-center gap-4 shrink-0 bg-white dark:bg-slate-900/90 p-3.5 rounded-2xl border border-indigo-200 dark:border-indigo-500/20 shadow-xs z-10">
              <div className="text-center">
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                  Days Until Unlock
                </span>
                <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                  {summary.days_until_next_payout ?? 0}{' '}
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">days</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PayrollHeaderBanner;

