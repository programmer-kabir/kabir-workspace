import React from 'react';
import { FiPrinter } from 'react-icons/fi';
import { StaffAvatar, formatMinutesToClock, formatHoursToClock } from './payrollUtils.jsx';

export const PayrollInvoiceModal = ({
  selectedInvoice = null,
  onClose,
  currentUser = {},
  scheme = {},
}) => {
  if (!selectedInvoice) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-600 text-white font-black text-xl shadow-lg shadow-indigo-600/30">
              CCA
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Creative Computer Academy</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Official Monthly Payroll Payslip & Statement</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Payslip Details Card */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs">
          <div>
            <span className="text-slate-400 uppercase font-bold text-[10px] block">Payslip No.</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">
              {selectedInvoice.invoice_id || 'CCA-PAY-SLIP'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 uppercase font-bold text-[10px] block">Billing Cycle</span>
            <span className="font-bold text-slate-900 dark:text-white">{selectedInvoice.month_label}</span>
          </div>
          <div>
            <span className="text-slate-400 uppercase font-bold text-[10px] block">Maturity Date</span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">{selectedInvoice.payout_unlock_date}</span>
          </div>
          <div>
            <span className="text-slate-400 uppercase font-bold text-[10px] block">Status</span>
            <span
              className={`font-bold ${
                selectedInvoice.status === 'paid'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : selectedInvoice.status === 'partially_paid'
                    ? 'text-blue-600 dark:text-blue-400'
                    : selectedInvoice.is_unlocked
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-purple-600 dark:text-purple-400'
              }`}
            >
              {selectedInvoice.status_label || (selectedInvoice.is_unlocked ? '✅ Matured & Rolled' : '⏳ Accruing')}
            </span>
          </div>
        </div>

        {selectedInvoice.transaction_reference && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex flex-wrap items-center justify-between gap-2 shadow-xs">
            <span>
              Payment Reference: <strong className="font-mono">{selectedInvoice.transaction_reference}</strong> (
              {selectedInvoice.payment_method?.toUpperCase()})
            </span>
            {selectedInvoice.paid_at && (
              <span>
                Paid Date:{' '}
                {new Date(selectedInvoice.paid_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            )}
          </div>
        )}

        {/* Staff Info */}
        <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <StaffAvatar name={currentUser?.name} picture={currentUser?.profile_picture} size="md" />
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">{currentUser?.name}</h4>
              <p className="text-xs text-slate-400">
                {currentUser?.email} • {scheme.scheme_name || 'Staff Scheme'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              {selectedInvoice.tier_name ? selectedInvoice.tier_name : 'Rate Applied'}
            </span>
            <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
              ৳{Number(selectedInvoice.tier_hourly_rate || scheme.hourly_rate || 0).toFixed(2)} / hr
            </span>
            {selectedInvoice.tier_salary && (
              <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold block">
                Base: ৳{Number(selectedInvoice.tier_salary).toLocaleString()}/mo
              </span>
            )}
          </div>
        </div>

        {/* Financial Breakdown Table */}
        <div className="border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200/60 dark:border-slate-800">
              <tr>
                <th className="p-3">Description</th>
                <th className="p-3 text-center">Approved Time</th>
                <th className="p-3 text-right">Amount (৳)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              <tr>
                <td className="p-3 font-medium">
                  Gross Accrued Work Earnings ({selectedInvoice.month_label})
                  <div className="text-[11px] text-slate-400">
                    {selectedInvoice.sessions_count || 0} approved work sessions ({selectedInvoice.days_count || 0} active days)
                  </div>
                </td>
                <td className="p-3 text-center font-bold">
                  {formatMinutesToClock(selectedInvoice.approved_minutes)} ({selectedInvoice.approved_minutes}m)
                </td>
                <td className="p-3 text-right font-black text-slate-900 dark:text-white">
                  ৳ {Number(selectedInvoice.total_earned || 0).toFixed(2)}
                </td>
              </tr>
              {Number(selectedInvoice.overtime_hours || 0) > 0 && (
                <tr className="bg-amber-50/50 dark:bg-amber-950/20">
                  <td className="p-3 font-medium">
                    <div className="font-bold text-amber-800 dark:text-amber-300">
                      🥭 Mango Overtime Bank ({selectedInvoice.month_label})
                    </div>
                    <div className="text-[11px] text-amber-600 dark:text-amber-400">
                      Approved accumulated overtime hours
                    </div>
                  </td>
                  <td className="p-3 text-center font-bold text-amber-700 dark:text-amber-300">
                    {formatHoursToClock(selectedInvoice.overtime_hours)}
                  </td>
                  <td className="p-3 text-right font-black text-amber-700 dark:text-amber-300">
                    ৳ {Number(selectedInvoice.overtime_cash || 0).toFixed(2)}
                  </td>
                </tr>
              )}
              <tr className="bg-emerald-50/40 dark:bg-emerald-950/20">
                <td className="p-3 font-bold text-emerald-700 dark:text-emerald-300" colSpan={2}>
                  1. Whole Integer Payable (Cashout Limit)
                </td>
                <td className="p-3 text-right font-black text-emerald-600 dark:text-emerald-400 text-sm">
                  ৳{' '}
                  {Number(
                    selectedInvoice.invoice_integer_amount || Math.floor(selectedInvoice.total_earned || 0)
                  ).toLocaleString()}
                </td>
              </tr>
              <tr className="bg-slate-50 dark:bg-slate-800/40">
                <td className="p-3 text-slate-500 dark:text-slate-400" colSpan={2}>
                  2. Fractional Paisa Rollover (Automatically Carried Forward to Next Cycle)
                </td>
                <td className="p-3 text-right font-bold text-slate-600 dark:text-slate-300">
                  + ৳{' '}
                  {Number(
                    selectedInvoice.fractional_rollover ||
                      selectedInvoice.total_earned - Math.floor(selectedInvoice.total_earned)
                  ).toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Notice */}
        <p className="text-[11px] text-slate-400 leading-relaxed text-center">
          This is an official system-generated computerized payslip. Under Creative Computer Academy payroll regulations,
          payouts mature on the 15th of the following month and roll over seamlessly into subsequent months without expiration.
        </p>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-indigo-600/20 transition cursor-pointer"
          >
            <FiPrinter className="w-4 h-4" /> Print / Save PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default PayrollInvoiceModal;

