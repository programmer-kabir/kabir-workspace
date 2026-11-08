import React from 'react';
import { FiCalendar, FiCheckCircle, FiClock, FiFileText } from 'react-icons/fi';
import { formatMinutesToClock } from './payrollUtils.jsx';

export const PayrollMonthlyLedger = ({
  summary = {},
  setSelectedInvoice,
}) => {
  const ledger = summary.monthly_cycle_ledger || [];

  if (ledger.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/50 rounded-2xl text-indigo-600 dark:text-indigo-400">
            <FiCalendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Monthly Earnings & 15th Maturity Rollover
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Earnings mature on the 15th of the following month and automatically roll over until withdrawn.
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 self-start sm:self-auto">
          {ledger.length} Billing {ledger.length === 1 ? 'Month' : 'Months'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ledger.map((cycle, idx) => (
          <div
            key={cycle.month_key || idx}
            className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
              cycle.is_unlocked
                ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40'
                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200/70 dark:border-slate-700/60'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    {cycle.month_label || cycle.month_key}
                  </span>
                  {cycle.tier_number && (
                    <span className="px-1.5 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[10px] font-bold border border-purple-200 dark:border-purple-800">
                      Tier {cycle.tier_number}
                    </span>
                  )}
                </div>
                {cycle.status === 'paid' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800">
                    <FiCheckCircle className="w-3 h-3" /> Paid & Settled
                  </span>
                ) : cycle.status === 'partially_paid' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-[10px] font-bold border border-blue-200 dark:border-blue-800">
                    <FiCheckCircle className="w-3 h-3" /> Partially Paid
                  </span>
                ) : cycle.is_unlocked ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold border border-indigo-200 dark:border-indigo-800">
                    <FiCheckCircle className="w-3 h-3" /> Ready for Payout
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 text-[10px] font-bold">
                    <FiClock className="w-3 h-3" />{' '}
                    {cycle.payout_unlock_date?.includes('Admin')
                      ? cycle.payout_unlock_date
                      : `Unlocks ${cycle.payout_unlock_date?.split(' ')[0] || '15th'}`}
                  </span>
                )}
              </div>

              <div className="text-2xl font-black text-slate-900 dark:text-white my-1">
                ৳ {Number(cycle.total_earned || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-slate-200/50 dark:border-slate-700/40">
                <span>
                  {formatMinutesToClock(cycle.approved_minutes)} ({cycle.approved_minutes || 0}m)
                </span>
                <span>{cycle.sessions_count || 0} sessions</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedInvoice && setSelectedInvoice(cycle)}
              className="w-full mt-4 py-2 px-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <FiFileText className="w-3.5 h-3.5" /> View Payslip / Invoice
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PayrollMonthlyLedger;

