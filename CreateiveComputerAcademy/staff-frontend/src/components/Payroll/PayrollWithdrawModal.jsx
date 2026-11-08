import React from 'react';
import { FiAlertCircle, FiRefreshCw, FiSend } from 'react-icons/fi';
import { formatMinutesToClock, formatHoursToBengali, formatHoursToClock } from './payrollUtils.jsx';

export const PayrollWithdrawModal = ({
  isOpen = false,
  onClose,
  summary = {},
  includeOvertimeCashout = false,
  setIncludeOvertimeCashout,
  withdrawAmount = '',
  setWithdrawAmount,
  paymentMethod = 'cash',
  setPaymentMethod,
  savedPayoutSettings = {},
  handleWithdrawSubmit,
  submitting = false,
}) => {
  if (!isOpen) return null;

  const baseTotal = Number(summary.available_withdrawable_total ?? summary.available_withdrawable ?? 0);
  const otVal = includeOvertimeCashout ? Number(summary.overtime_bank?.cash_value || 0) : 0;
  const currentTotal = baseTotal + otVal;
  const integerLimit = Math.floor(currentTotal);
  const fractionRemainder = (currentTotal - integerLimit).toFixed(2);
  const coveredCycles = (summary.monthly_cycle_ledger || []).filter((c) => c.is_unlocked && c.status !== 'paid');
  const minLimit = Number(summary.min_withdrawal_limit || 0);
  const numAmount = Number(withdrawAmount) || 0;
  const isUnderMinSalary = minLimit > 0 && numAmount < minLimit;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl relative space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Request Payout</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Whole integer amount only</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleWithdrawSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Available for Cashout
            </label>
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-emerald-800 dark:text-emerald-300 block">
                  Integer Cashout Limit {includeOvertimeCashout && <span className="text-amber-600 dark:text-amber-400 font-bold">(+🥭 Overtime)</span>}
                </span>
                {Number(fractionRemainder) > 0 && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    (+৳{fractionRemainder} fraction stays in wallet)
                  </span>
                )}
              </div>
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                ৳ {integerLimit.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Covered Billing Cycles Detailed Breakdown Box */}
          {coveredCycles.length > 0 && (
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span>📋</span>
                  <span>উত্তোলনযোগ্য মাসসমূহের বিস্তারিত ({coveredCycles.length > 1 ? `${coveredCycles.length} মাস সমন্বিত` : '১টি মাস'})</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  Covered Billing Cycles
                </span>
              </div>

              <div className="space-y-2 divide-y divide-slate-100 dark:divide-slate-700/50">
                {coveredCycles.map((c) => (
                  <div key={c.month_key} className="pt-2 first:pt-0 flex items-start justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <span>🗓️ {c.month_label}</span>
                        <span className="text-[10px] font-medium text-slate-400">({c.sessions_count || 0} সেশন • {formatMinutesToClock(c.approved_minutes)})</span>
                      </div>
                      {Number(c.overtime_hours || 0) > 0 && (
                        <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold pl-4 mt-0.5">
                          🥭 ওভারটাইম: {formatHoursToBengali(c.overtime_hours)} (মূল্য: ৳{Number(c.overtime_cash || 0).toFixed(2)})
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="font-black text-slate-900 dark:text-white">৳ {Number(c.total_earned || 0).toLocaleString()}</span>
                      {Number(c.overtime_hours || 0) > 0 && (
                        <div className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">+৳{Number(c.overtime_cash || 0).toFixed(2)}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs font-bold">
                <span className="text-slate-600 dark:text-slate-300">মূল কাজের সমন্বিত ব্যালেন্স:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-black">
                  ৳ {Number(summary.available_withdrawable || 0).toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {/* Mango Overtime Bank Conversion Box */}
          {summary.overtime_bank && Number(summary.overtime_bank.available_hours || 0) > 0 && (
            <div className={`p-4 rounded-2xl border transition duration-200 ${includeOvertimeCashout ? 'bg-amber-500/10 border-amber-500/40 text-amber-900 dark:text-amber-200 shadow-sm' : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'}`}>
              <label htmlFor="otCashoutToggle" className="flex items-start justify-between gap-3 cursor-pointer select-none">
                <div className="flex items-start gap-3">
                  <span className="text-2xl mt-0.5">🥭</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        ম্যাঙ্গো ওভারটাইম ব্যাংক {summary.overtime_bank.cycle_label ? `(${summary.overtime_bank.cycle_label})` : ''} ({formatHoursToClock(summary.overtime_bank.available_hours)} / {summary.overtime_bank.ripe_mangoes}টি আম)
                      </h4>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-bold">Money vs Mango</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {summary.overtime_bank.cycle_label ? `${summary.overtime_bank.cycle_label} মাসের ` : ''}আপনার কাছে <strong>{formatHoursToBengali(summary.overtime_bank.available_hours)} ({formatHoursToClock(summary.overtime_bank.available_hours)})</strong> ওভারটাইম জমা আছে (মূল্য: <strong>৳{Number(summary.overtime_bank.cash_value).toLocaleString()}</strong>)। আপনি কি এই ওভারটাইম টাকায় ক্যাশ আউট করতে চান?
                    </p>
                    {summary.overtime_bank.monthly_breakdown && summary.overtime_bank.monthly_breakdown.length > 1 && (
                      <div className="mt-2.5 pl-3 py-1 border-l-2 border-amber-400/60 space-y-1 text-[11px] text-amber-800 dark:text-amber-300 font-medium">
                        {summary.overtime_bank.monthly_breakdown.map((mb) => (
                          <div key={mb.month_key} className="flex items-center justify-between">
                            <span>• 🗓️ {mb.month_label}: <strong>{formatHoursToBengali(mb.ot_hours)} ({formatHoursToClock(mb.ot_hours)})</strong></span>
                            <span>(মূল্য: ৳{Number(mb.cash_value).toFixed(2)})</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <input
                  type="checkbox"
                  id="otCashoutToggle"
                  checked={includeOvertimeCashout}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setIncludeOvertimeCashout(checked);
                    const bTotal = Number(summary.available_withdrawable_total ?? summary.available_withdrawable ?? 0);
                    const otV = Number(summary.overtime_bank?.cash_value || 0);
                    setWithdrawAmount(Math.floor(checked ? bTotal + otV : bTotal));
                  }}
                  className="w-5 h-5 accent-amber-500 rounded cursor-pointer shrink-0 mt-1"
                />
              </label>
              {includeOvertimeCashout && (
                <div className="mt-3 pt-3 border-t border-amber-500/20 flex items-center justify-between text-xs font-bold text-amber-700 dark:text-amber-300">
                  <span>✓ গাছ থেকে {formatHoursToBengali(summary.overtime_bank.available_hours)} ({formatHoursToClock(summary.overtime_bank.available_hours)}) ওভারটাইম ক্যাশে রূপান্তর হবে</span>
                  <span className="text-sm font-black">+ ৳{Number(summary.overtime_bank.cash_value).toLocaleString()}</span>
                </div>
              )}
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Amount to Withdraw (৳)</label>
              <span className="text-[10px] font-bold text-indigo-500">Min: ৳{Number(summary.min_withdrawal_limit || 5000).toLocaleString()}</span>
            </div>
            <div className="relative">
              <input
                type="number"
                step="1"
                min={summary?.min_withdrawal_limit || 5000}
                max={Math.floor(Number(summary.available_withdrawable_total ?? summary.available_withdrawable ?? 0) + (includeOvertimeCashout ? Number(summary.overtime_bank?.cash_value || 0) : 0))}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder={`e.g. ${summary.min_withdrawal_limit || 5000}`}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white font-bold text-base focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                required
              />
              <button
                type="button"
                onClick={() => {
                  const maxVal = Number(summary.available_withdrawable_total ?? summary.available_withdrawable ?? 0) + (includeOvertimeCashout ? Number(summary.overtime_bank?.cash_value || 0) : 0);
                  setWithdrawAmount(Math.floor(maxVal));
                }}
                className="absolute right-2 top-2 px-3 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-xl hover:bg-indigo-200 transition cursor-pointer"
              >
                MAX
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Payout Method / গ্রহণের মাধ্যম</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white font-bold text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="cash">💵 Office Cash (হাতে হাতে নগদ গ্রহণ)</option>
              <option value="bkash">📱 bKash Personal</option>
              <option value="nagad">📱 Nagad Personal</option>
              <option value="rocket">📱 Rocket</option>
              <option value="bank">🏦 Bank Transfer</option>
            </select>
          </div>

          {/* Dynamic details preview based on selected method */}
          {paymentMethod === 'cash' ? (
            <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/40 rounded-2xl flex items-center gap-3">
              <span className="text-2xl">💵</span>
              <div>
                <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Office Cash (হাতে হাতে নগদ)</p>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400">CCA Accounts Desk থেকে সরাসরি নগদ টাকা গ্রহণ করবেন। কোনো একাউন্ট নম্বর লাগবে না।</p>
              </div>
            </div>
          ) : savedPayoutSettings?.account_number ? (
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Profile Saved Account:</span>
                <a href="/profile" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline text-[11px]">Edit in Profile →</a>
              </div>
              <div className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                {paymentMethod === 'bank' || savedPayoutSettings.payment_method === 'bank'
                  ? `${savedPayoutSettings.bank_name || 'Bank'} A/C: ${savedPayoutSettings.account_number} (${savedPayoutSettings.branch_name || ''})`
                  : `${savedPayoutSettings.account_number} (${paymentMethod.toUpperCase()})`}
              </div>
              {savedPayoutSettings.account_holder_name && (
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Holder: {savedPayoutSettings.account_holder_name}</div>
              )}
            </div>
          ) : (
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 rounded-2xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
              <FiAlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">প্রোফাইলে পেমেন্ট তথ্য সেট করা নেই!</p>
                <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                  অনলাইনে টাকা পেতে আগে <a href="/profile" className="font-bold underline text-indigo-600 dark:text-indigo-400">প্রোফাইলে গিয়ে সেটআপ করুন</a> অথবা উপরে "Office Cash" নির্বাচন করুন।
                </p>
              </div>
            </div>
          )}

          {/* Minimum salary threshold alert inside modal */}
          {isUnderMinSalary && (
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 rounded-2xl text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2.5">
              <FiAlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">উত্তোলন সীমা অপূর্ণ (ক্যাশ আউট লক)</p>
                <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5 leading-relaxed">
                  আপনার নির্ধারিত মাসিক স্যালারি <strong>৳ {minLimit.toLocaleString()}</strong>। বর্তমান নির্বাচিত ব্যালেন্স <strong>৳ {numAmount.toLocaleString()}</strong> হওয়ায় উত্তোলন সাময়িকভাবে লক রয়েছে। উত্তোলন আনলক করতে দয়া করে উপরের <strong>"ম্যাঙ্গো ওভারটাইম ক্যাশ আউট"</strong> বক্সে টিক দিন।
                </p>
              </div>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || isUnderMinSalary}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg transition ${
                isUnderMinSalary
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700 shadow-none'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-emerald-500/20 cursor-pointer disabled:opacity-50'
              }`}
            >
              {submitting ? <FiRefreshCw className="w-4 h-4 animate-spin" /> : <FiSend className="w-4 h-4" />}
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PayrollWithdrawModal;
