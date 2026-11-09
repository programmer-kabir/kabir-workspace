import React from 'react';
import { FiX } from 'react-icons/fi';
import { formatHoursToHuman } from './treeUtils';

/**
 * MangoClaimModal
 * Modal for redeeming an earned ripe mango as a 100% paid break day off.
 */
export default function MangoClaimModal({
  isOpen,
  onClose,
  selectedMango,
  claimDate,
  setClaimDate,
  claimReason,
  setClaimReason,
  claiming,
  onSubmit,
}) {
  if (!isOpen || !selectedMango) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl relative space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-4xl">
              {selectedMango.type === 'ripe' ? '🥭' : '🍏'}
            </span>
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                {selectedMango.title}
              </h3>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                {selectedMango.type === 'ripe'
                  ? '100% Ripe & Sweet • Ready to Redeem'
                  : 'Ripening in progress'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Mango Details Summary */}
        <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-400 font-semibold">Break Value:</span>
            <strong className="text-slate-900 dark:text-white font-black text-sm">
              {selectedMango.type === 'ripe'
                ? `${formatHoursToHuman(selectedMango.hours)} (1 Full Day Off)`
                : `${formatHoursToHuman(selectedMango.current_hours)} / ${formatHoursToHuman(selectedMango.target_hours)}`}
            </strong>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-400 font-semibold">Orchard Equivalent:</span>
            <span className="text-emerald-700 dark:text-emerald-300 font-bold">100% Paid Compensatory Leave</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-amber-200/60 dark:border-amber-800/40 font-medium">
            {selectedMango.type === 'ripe'
              ? selectedMango.description
              : `Ripening: ${formatHoursToHuman(selectedMango.current_hours)} / ${formatHoursToHuman(selectedMango.target_hours)} earned. Need ${formatHoursToHuman(selectedMango.remaining_hours)} more overtime to mature!`}
          </p>
        </div>

        {/* Redemption Form (Only for Ripe Mangoes) */}
        {selectedMango.type === 'ripe' ? (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Select Date for this Break Day
              </label>
              <input
                type="date"
                required
                value={claimDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setClaimDate(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white font-semibold text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Note / Purpose (Optional)
              </label>
              <input
                type="text"
                value={claimReason}
                onChange={(e) => setClaimReason(e.target.value)}
                placeholder="e.g. Taking personal day earned from overtime"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-3 rounded-2xl font-bold text-xs text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={claiming}
                className="px-6 py-3 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-white font-black rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-amber-500/25 transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                <span>🥭</span>
                <span>{claiming ? 'Redeeming...' : 'Redeem 1 Day Break'}</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-2xl text-xs transition cursor-pointer"
            >
              Got It
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

