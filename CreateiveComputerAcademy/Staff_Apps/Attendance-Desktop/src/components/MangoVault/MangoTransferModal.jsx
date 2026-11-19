import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowRight, FiX, FiLock } from 'react-icons/fi';

export default function MangoTransferModal({
  isOpen,
  selectedStaff,
  staffList = [],
  transferSource,
  setTransferSource,
  transferTargetId,
  setTransferTargetId,
  modalCount,
  setModalCount,
  modalNote,
  setModalNote,
  submitting,
  handleTransferSubmit,
  closeModal
}) {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && selectedStaff && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl max-w-md w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-base">
                <FiArrowRight />
                <span>Transfer Mango to Colleague</span>
              </div>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-1">
              <div className="font-bold text-slate-900 dark:text-white text-sm">
                Sender: {selectedStaff.name} ({selectedStaff.shift_hours}h Shift)
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                In Vault: <span className="font-bold text-indigo-600 dark:text-indigo-400">{selectedStaff.vault_held_mangoes}</span>
                {' • '}
                On Tree: <span className="font-bold text-emerald-600 dark:text-emerald-400">{selectedStaff.visible_mangoes}</span>
              </div>
            </div>

            <form onSubmit={handleTransferSubmit} className="space-y-4">
              {/* Source Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Deduct From:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTransferSource('vault')}
                    disabled={selectedStaff.vault_held_mangoes <= 0}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      transferSource === 'vault'
                        ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-500 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    <FiLock size={12} />
                    <span>Admin Vault ({selectedStaff.vault_held_mangoes})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTransferSource('tree')}
                    disabled={selectedStaff.visible_mangoes <= 0}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      transferSource === 'tree'
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    <span>🌳 Active Tree ({selectedStaff.visible_mangoes})</span>
                  </button>
                </div>
              </div>

              {/* Recipient Colleague Dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Recipient Colleague:
                </label>
                <select
                  value={transferTargetId}
                  onChange={(e) => setTransferTargetId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                >
                  <option value="">Select recipient colleague...</option>
                  {staffList
                    .filter((s) => s.user_id !== selectedStaff.user_id)
                    .map((s) => (
                      <option key={s.user_id} value={s.user_id}>
                        {s.name} ({s.shift_hours}h shift) — {s.has_debt ? `⚠️ Has -${s.debt_formatted || `${s.debt_hours}h`} Debt (Transfer will help clear deficit!)` : `Currently has ${s.visible_mangoes} mangoes`}
                      </option>
                    ))}
                </select>
              </div>

              {/* Mango Count */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Number of Mangoes to Transfer:
                </label>
                <input
                  type="number"
                  min="1"
                  max={
                    transferSource === 'vault'
                      ? selectedStaff.vault_held_mangoes
                      : selectedStaff.visible_mangoes
                  }
                  value={modalCount}
                  onChange={(e) => {
                    const maxVal =
                      transferSource === 'vault'
                        ? selectedStaff.vault_held_mangoes
                        : selectedStaff.visible_mangoes;
                    setModalCount(Math.max(1, Math.min(maxVal, parseInt(e.target.value) || 1)));
                  }}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Transfer Note / Reason:
                </label>
                <textarea
                  rows="2"
                  value={modalNote}
                  onChange={(e) => setModalNote(e.target.value)}
                  placeholder="Enter reason..."
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <FiArrowRight size={13} />
                  <span>{submitting ? 'Transferring...' : 'Confirm Transfer'}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

