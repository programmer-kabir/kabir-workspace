import React from 'react';
import { FiCheck, FiXCircle, FiSend } from 'react-icons/fi';

const EventLedgerSection = ({
  rsvpState,
  setRsvpState,
  handleRsvp,
  submittingRsvp,
  currentEvent,
  paymentForm,
  setPaymentForm,
  handlePaymentSubmit,
  submittingPayment,
  myHeads,
  myTotalPaid,
  myCalculatedShare,
  myBalance,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* 1. RSVP Box */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">Your Attendance</h3>
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
              rsvpState.rsvp_status === 'going'
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                : rsvpState.rsvp_status === 'not_going'
                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
            }`}
          >
            {rsvpState.rsvp_status === 'going'
              ? 'Going 😋'
              : rsvpState.rsvp_status === 'not_going'
              ? 'Not Going'
              : 'Invited ⏳'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleRsvp('going')}
            disabled={submittingRsvp}
            className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              rsvpState.rsvp_status === 'going'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            <FiCheck size={14} />
            <span>I am Going!</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (window.confirm("Are you sure you can't make it? This event will be removed from your dashboard.")) {
                handleRsvp('not_going');
              }
            }}
            disabled={submittingRsvp}
            className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              rsvpState.rsvp_status === 'not_going'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            <FiXCircle size={14} />
            <span>Can't Make It</span>
          </button>
        </div>

        {currentEvent.allow_guest ? (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Bringing Guests?</label>
              <select
                value={rsvpState.guest_count}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10) || 0;
                  setRsvpState((prev) => ({ ...prev, guest_count: val }));
                }}
                className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
              >
                <option value="0">None (Just Me)</option>
                <option value="1">+1 Guest</option>
                <option value="2">+2 Guests</option>
                <option value="3">+3 Guests</option>
              </select>
            </div>
            {rsvpState.guest_count > 0 && (
              <input
                type="text"
                placeholder="Guest names (e.g. Brother, Friend)"
                value={rsvpState.guest_names}
                onChange={(e) => setRsvpState((prev) => ({ ...prev, guest_names: e.target.value }))}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
              />
            )}
            {rsvpState.guest_count > 0 && (
              <button
                type="button"
                onClick={() => handleRsvp('going')}
                className="w-full py-1 text-xs font-semibold text-blue-600 hover:underline text-right cursor-pointer"
              >
                Update Guest List →
              </button>
            )}
          </div>
        ) : null}
      </div>

      {/* 2. Personal Contribution Box */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">Send Contribution</h3>
          <span className="text-xs text-slate-400 font-medium">bKash / Nagad</span>
        </div>

        <form onSubmit={handlePaymentSubmit} className="space-y-2.5 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">Method</label>
              <select
                value={paymentForm.payment_method}
                onChange={(e) => setPaymentForm((prev) => ({ ...prev, payment_method: e.target.value }))}
                className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
              >
                <option value="bkash">bKash</option>
                <option value="nagad">Nagad</option>
                <option value="rocket">Rocket</option>
                <option value="cash">Cash (Give to Organizer)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">Amount (৳)</label>
              <input
                type="number"
                placeholder="e.g. 800"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm((prev) => ({ ...prev, amount: e.target.value }))}
                className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                required
              />
            </div>
          </div>

          {paymentForm.payment_method !== 'cash' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">Your Number</label>
                <input
                  type="text"
                  placeholder="017xxxxxxxx"
                  value={paymentForm.sender_number}
                  onChange={(e) => setPaymentForm((prev) => ({ ...prev, sender_number: e.target.value }))}
                  className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">TrxID</label>
                <input
                  type="text"
                  placeholder="BL98XXXXXX"
                  value={paymentForm.transaction_id}
                  onChange={(e) => setPaymentForm((prev) => ({ ...prev, transaction_id: e.target.value }))}
                  className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submittingPayment}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <FiSend size={13} />
            <span>Submit Payment Details</span>
          </button>
        </form>
      </div>

      {/* 3. Personal Settlement Status Box */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Your Ledger Balance</h3>
            <span className="text-xs text-slate-400">Heads: {myHeads}</span>
          </div>

          <div className="mt-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex justify-between">
              <span>You Paid (Confirmed):</span>
              <strong className="text-emerald-600 dark:text-emerald-400">৳{myTotalPaid}</strong>
            </div>
            <div className="flex justify-between">
              <span>Calculated Share:</span>
              <strong>৳{myCalculatedShare}</strong>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
          {myBalance > 0 ? (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-center">
              <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase">
                Refund Due to You
              </div>
              <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                +৳{myBalance}
              </div>
              <p className="text-[10px] text-emerald-700/80 mt-0.5">Collect via Cash or bKash from Organizer</p>
            </div>
          ) : myBalance < 0 ? (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-center">
              <div className="text-[11px] font-bold text-rose-800 dark:text-rose-300 uppercase">
                Shortage / Due from You
              </div>
              <div className="text-xl font-black text-rose-600 dark:text-rose-400">
                -৳{Math.abs(myBalance)}
              </div>
              <p className="text-[10px] text-rose-700/80 mt-0.5">Please send remaining amount</p>
            </div>
          ) : (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-center text-xs font-semibold text-slate-500">
              Accounts Settled (৳0) ✓
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventLedgerSection;

