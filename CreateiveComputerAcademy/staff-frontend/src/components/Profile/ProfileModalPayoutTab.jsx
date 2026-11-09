import React from 'react';
import { FiCheckCircle, FiXCircle } from 'react-icons/fi';

/**
 * ProfileModalPayoutTab
 * Tab for setting up payout preferences (bKash, Nagad, Rocket, Bank).
 */
export default function ProfileModalPayoutTab({
  payoutMessage,
  payoutForm,
  setPayoutForm,
  onSavePayoutSettings,
  payoutLoading,
}) {
  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-5">
      {payoutMessage && (
        <div
          className={`p-4 rounded-xl text-sm font-bold flex items-start gap-3 ${
            payoutMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-800'
          }`}
        >
          {payoutMessage.type === 'success' ? (
            <FiCheckCircle className="mt-0.5 text-lg shrink-0" />
          ) : (
            <FiXCircle className="mt-0.5 text-lg shrink-0" />
          )}
          {payoutMessage.text}
        </div>
      )}

      <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-800/40 text-xs text-indigo-800 dark:text-indigo-300">
        💡 Configure your primary withdrawal account. When you request a payout from your wallet, these details will automatically be selected.
      </div>

      <form onSubmit={onSavePayoutSettings} className="space-y-4">
        <div>
          <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
            Preferred Payment Method
          </label>
          <select
            value={payoutForm.payment_method}
            onChange={(e) => setPayoutForm({ ...payoutForm, payment_method: e.target.value })}
            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-semibold text-sm rounded-xl p-3.5 outline-none"
          >
            <option value="bkash">bKash Personal</option>
            <option value="nagad">Nagad Personal</option>
            <option value="rocket">Rocket</option>
            <option value="bank">Bank Transfer</option>
            <option value="cash">Office Cash</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
            {payoutForm.payment_method === 'bank'
              ? 'Bank Account Number'
              : 'Mobile Banking Number / Wallet No.'}
          </label>
          <input
            type="text"
            value={payoutForm.account_number}
            onChange={(e) => setPayoutForm({ ...payoutForm, account_number: e.target.value })}
            placeholder={
              payoutForm.payment_method === 'bank' ? 'e.g. 2050XXXXXXXX' : 'e.g. 017XXXXXXXX'
            }
            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-semibold text-sm rounded-xl p-3.5 outline-none font-mono"
            required
          />
        </div>

        {payoutForm.payment_method === 'bank' && (
          <>
            <div>
              <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                Account Holder Name
              </label>
              <input
                type="text"
                value={payoutForm.account_holder_name || ''}
                onChange={(e) =>
                  setPayoutForm({ ...payoutForm, account_holder_name: e.target.value })
                }
                placeholder="e.g. Kabir Hossen"
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-semibold text-sm rounded-xl p-3.5 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={payoutForm.bank_name || ''}
                  onChange={(e) => setPayoutForm({ ...payoutForm, bank_name: e.target.value })}
                  placeholder="e.g. Islami Bank"
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-semibold text-sm rounded-xl p-3.5 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                  Branch Name
                </label>
                <input
                  type="text"
                  value={payoutForm.branch_name || ''}
                  onChange={(e) => setPayoutForm({ ...payoutForm, branch_name: e.target.value })}
                  placeholder="e.g. Sylhet Branch"
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-semibold text-sm rounded-xl p-3.5 outline-none"
                />
              </div>
            </div>
          </>
        )}

        <div className="pt-4 border-t border-slate-100 dark:border-slate-700 mt-6">
          <button
            type="submit"
            disabled={payoutLoading || !payoutForm.account_number}
            className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {payoutLoading ? (
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              'Save Payout Settings'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

