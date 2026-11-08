import React from 'react';
import { FiClock, FiDollarSign } from 'react-icons/fi';
import { formatMinutesToClock, formatHoursToClock } from './payrollUtils.jsx';

export const PayrollTables = ({
  timeFilter = 'today',
  filteredEarnings = [],
  hasActiveShift = false,
  todayStr = '',
  liveClockHours = 0,
  liveClockMinutes = 0,
  liveSecsRemainder = 0,
  activeHourlyRate = 0,
  liveEarned = 0,
  withdrawals = [],
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Work Sessions Table */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FiClock className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-slate-900 dark:text-white">
              Work Sessions (
              {timeFilter === 'today'
                ? 'Today'
                : timeFilter === 'this_week'
                  ? 'This Week'
                  : timeFilter === 'this_month'
                    ? 'This Month'
                    : 'All Time'}
              )
            </h3>
          </div>
          <span className="text-xs font-medium text-slate-400">
            {filteredEarnings.length + (hasActiveShift ? 1 : 0)} সেশন প্রদর্শিত
          </span>
        </div>

        <div className="overflow-x-auto max-h-[420px] custom-scrollbar">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
              <tr>
                <th className="pb-3 font-semibold">Date</th>
                <th className="pb-3 font-semibold">Duration</th>
                <th className="pb-3 font-semibold">Rate Snapshot</th>
                <th className="pb-3 font-semibold">Earned</th>
                <th className="pb-3 font-semibold text-right">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-600 dark:text-slate-300 font-medium">
              {/* Live Ongoing Shift Row (if currently on shift) */}
              {hasActiveShift && (
                <tr className="bg-emerald-50/70 dark:bg-emerald-950/40 border-b-2 border-emerald-200 dark:border-emerald-800/60 font-medium">
                  <td className="py-3 font-bold text-emerald-800 dark:text-emerald-200 flex items-center gap-1.5">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    {todayStr} (Live)
                  </td>
                  <td className="py-3 font-mono font-bold text-emerald-700 dark:text-emerald-300">
                    {liveClockHours > 0
                      ? `${liveClockHours}h ${liveClockMinutes}m ${liveSecsRemainder}s`
                      : `${liveClockMinutes}m ${liveSecsRemainder}s`}
                  </td>
                  <td className="py-3">৳ {activeHourlyRate.toFixed(2)}/h</td>
                  <td className="py-3 font-black text-emerald-600 dark:text-emerald-400">
                    + ৳ {liveEarned.toFixed(2)}
                  </td>
                  <td className="py-3 text-right">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 text-[10px] font-black uppercase tracking-wider animate-pulse">
                      Active Shift
                    </span>
                  </td>
                </tr>
              )}

              {filteredEarnings.length > 0 ? (
                filteredEarnings.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">{item.work_date}</td>
                    <td className="py-3">
                      {formatMinutesToClock(item.approved_minutes)} ({item.approved_minutes}m)
                    </td>
                    <td className="py-3">৳ {Number(item.applied_rate).toFixed(2)}/h</td>
                    <td className="py-3 font-bold text-emerald-600 dark:text-emerald-400">
                      ৳ {Number(item.earned_amount).toFixed(2)}
                    </td>
                    <td className="py-3 text-right">
                      {item.source_type === 'mango_leave' ? (
                        <span
                          className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[10px] font-bold"
                          title="Paid Mango Break Day"
                        >
                          🥭 Mango Leave
                        </span>
                      ) : item.is_surplus == 1 ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                          Surplus
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-bold">
                          Contract
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : !hasActiveShift ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-400 font-normal">
                    নির্বাচিত সময়সীমার মধ্যে কোনো কাজের সেশন পাওয়া যায়নি।
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {/* Withdrawals Table */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FiDollarSign className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-slate-900 dark:text-white">Withdrawal History</h3>
          </div>
          <span className="text-xs font-medium text-slate-400">All Payout Requests</span>
        </div>

        <div className="overflow-x-auto max-h-[420px] custom-scrollbar">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900">
              <tr>
                <th className="pb-3 font-semibold">Date</th>
                <th className="pb-3 font-semibold">Amount</th>
                <th className="pb-3 font-semibold">Method</th>
                <th className="pb-3 font-semibold">Trx / Ref</th>
                <th className="pb-3 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-600 dark:text-slate-300 font-medium">
              {withdrawals && withdrawals.length > 0 ? (
                withdrawals.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">
                      <div>{w.requested_at?.split(' ')[0]}</div>
                      {w.covered_months && (
                        <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold mt-0.5">
                          🗓️ {w.covered_months}
                        </div>
                      )}
                    </td>
                    <td className="py-3 font-bold text-slate-900 dark:text-white">
                      ৳ {Number(w.amount).toFixed(2)}
                      {Number(w.overtime_hours_cashed || 0) > 0 && (
                        <span
                          className="ml-1.5 px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold"
                          title={`${formatHoursToClock(w.overtime_hours_cashed)} Overtime cashed out`}
                        >
                          🥭 +{formatHoursToClock(w.overtime_hours_cashed)} OT
                        </span>
                      )}
                    </td>
                    <td className="py-3 capitalize">{w.payment_method}</td>
                    <td className="py-3 text-slate-400 font-mono text-[11px]">
                      {w.transaction_reference || '—'}
                    </td>
                    <td className="py-3 text-right">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          w.status === 'paid' || w.status === 'approved'
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                            : w.status === 'rejected'
                              ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                              : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                        }`}
                      >
                        {w.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-400 font-normal">
                    No withdrawal requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PayrollTables;

