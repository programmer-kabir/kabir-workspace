import React from 'react';
import {
  FiCalendar,
  FiLayers,
  FiCheckCircle,
  FiTrendingUp,
  FiClock,
  FiArrowUpRight,
  FiDollarSign,
} from 'react-icons/fi';

export const PayrollMetricsGrid = ({
  timeFilter = 'today',
  setTimeFilter,
  hasActiveShift = false,
  filterSubtitles = {},
  currentPeriodEarned = 0,
  currentPeriodHours = 0,
  currentPeriodMinutes = 0,
  currentPeriodSessions = 0,
  liveEarned = 0,
  activeHourlyRate = 0,
  summary = {},
}) => {
  return (
    <div className="space-y-6">
      {/* Timeframe Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 md:p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 pl-1">
            সময়কাল ফিল্টার:
          </span>
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
            <button
              type="button"
              onClick={() => setTimeFilter('today')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                timeFilter === 'today'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {hasActiveShift && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />}
              <span>🔴 Today (আজকে)</span>
            </button>

            <button
              type="button"
              onClick={() => setTimeFilter('this_week')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                timeFilter === 'this_week'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FiCalendar className="w-3.5 h-3.5" />
              <span>This Week (এই সপ্তাহ)</span>
            </button>

            <button
              type="button"
              onClick={() => setTimeFilter('this_month')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                timeFilter === 'this_month'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FiLayers className="w-3.5 h-3.5" />
              <span>This Month (চলতি মাস)</span>
            </button>

            <button
              type="button"
              onClick={() => setTimeFilter('all_time')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                timeFilter === 'all_time'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FiCheckCircle className="w-3.5 h-3.5" />
              <span>All Time (সবসময়)</span>
            </button>
          </div>
        </div>

        <div className="text-xs font-medium text-slate-500 dark:text-slate-400 pl-1 md:pl-0 md:pr-2 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block shrink-0" />
          <span>{filterSubtitles[timeFilter] || ''}</span>
        </div>
      </div>

      {/* Main 4 Status KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Selected Timeframe Earnings */}
        <div className="bg-gradient-to-br from-indigo-50/90 via-white to-purple-50/60 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/30 p-6 rounded-3xl border border-indigo-200/80 dark:border-indigo-500/30 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                  {timeFilter === 'today'
                    ? 'Today Income'
                    : timeFilter === 'this_week'
                      ? 'Weekly Income'
                      : timeFilter === 'this_month'
                        ? 'Monthly Income'
                        : 'All-Time Income'}
                </span>
                {hasActiveShift && timeFilter === 'today' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> Live
                  </span>
                )}
              </div>
              <div className="p-2.5 bg-indigo-100/70 dark:bg-indigo-950/70 rounded-2xl text-indigo-600 dark:text-indigo-400">
                <FiTrendingUp className="w-5 h-5" />
              </div>
            </div>

            <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              ৳ {currentPeriodEarned.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>

            <div className="mt-2 text-xs text-indigo-700 dark:text-indigo-300 font-semibold flex items-center gap-1.5">
              <FiClock className="w-3.5 h-3.5" />
              <span>
                {currentPeriodHours} hrs ({currentPeriodMinutes}m) • {currentPeriodSessions} সেশন
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-indigo-100 dark:border-indigo-900/40 text-[11px] text-slate-500 dark:text-slate-400">
            {timeFilter === 'today' && hasActiveShift ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                +৳{liveEarned.toFixed(2)} লাইভ ডিউটি থেকে যোগ হচ্ছে
              </span>
            ) : (
              <span>রেট: ৳{activeHourlyRate.toFixed(2)}/ঘণ্টা</span>
            )}
          </div>
        </div>

        {/* Card 2: Total Lifetime Earned (Gross, untouched by withdrawals) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider">সর্বমোট উপার্জিত টাকা</span>
              <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 rounded-2xl text-blue-600 dark:text-blue-400">
                <FiCheckCircle className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white">
              ৳{' '}
              {(
                Number(summary.total_earned || 0) + (hasActiveShift ? liveEarned : 0)
              ).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="mt-2 text-xs text-slate-600 dark:text-slate-400 font-medium">
              মোট {summary.total_approved_hours || 0} hrs ({summary.total_sessions || 0}টি সেশন)
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
            উত্তোলন করলেও এই মোট উপার্জনের রেকর্ড অপরিবর্তিত থাকে
          </div>
        </div>

        {/* Card 3: Total Withdrawn */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider">উত্তোলিত টাকা</span>
              <div className="p-2.5 bg-amber-50 dark:bg-amber-950/50 rounded-2xl text-amber-600 dark:text-amber-400">
                <FiArrowUpRight className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white">
              ৳ {Number(summary.total_withdrawn || 0).toLocaleString()}
            </div>
            {Number(summary.pending_withdrawn || 0) > 0 && (
              <div className="mt-2 text-xs font-bold text-amber-600 dark:text-amber-400">
                ⏳ +৳{Number(summary.pending_withdrawn).toLocaleString()} অনুমোদনের অপেক্ষায়
              </div>
            )}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
            বিকাশ, নগদ বা অফিসের মাধ্যমে উত্তোলিত
          </div>
        </div>

        {/* Card 4: Available for Immediate Withdrawal */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-700 text-white p-6 rounded-3xl shadow-lg shadow-emerald-500/10 relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-emerald-100 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">উত্তোলনযোগ্য ব্যালেন্স</span>
              <div className="p-2 bg-white/20 rounded-2xl text-white">
                <FiDollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-white">
              ৳ {Number(summary.available_withdrawable || 0).toLocaleString()}
            </div>
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              {Number(summary.fractional_rollover || 0) > 0 && (
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/15 text-[11px] font-semibold text-emerald-50">
                  + ৳{Number(summary.fractional_rollover).toFixed(2)} rolling forward
                </div>
              )}
              {(() => {
                const unlockedList = (summary.monthly_cycle_ledger || []).filter(
                  (c) => c.is_unlocked && c.status !== 'paid'
                );
                if (unlockedList.length > 1) {
                  const monthNames = unlockedList
                    .map((c) => (c.month_label ? c.month_label.split(' ')[0] : ''))
                    .join(' + ');
                  return (
                    <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-900/60 text-[10px] font-black text-emerald-100 border border-emerald-300/40 shadow-xs">
                      ✨ {unlockedList.length} মাস সমন্বিত ({monthNames})
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-emerald-100/90">
            <span>Min: ৳{Number(summary.min_withdrawal_limit || 500).toLocaleString()}</span>
            <span className="font-bold">
              {summary.can_withdraw ? '✅ Ready to Cashout' : '⏳ Building'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayrollMetricsGrid;

