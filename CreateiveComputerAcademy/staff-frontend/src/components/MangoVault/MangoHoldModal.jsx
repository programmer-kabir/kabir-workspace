import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiLock, FiX, FiInfo } from 'react-icons/fi';

export default function MangoHoldModal({
  isOpen,
  selectedStaff,
  modalCount,
  setModalCount,
  modalNote,
  setModalNote,
  submitting,
  handleHoldSubmit,
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
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-base">
                <FiLock />
                <span>Reserve Mangoes in Vault</span>
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
                {selectedStaff.name} ({selectedStaff.shift_hours}h Shift)
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Visible on Tree: <span className="font-bold text-emerald-600 dark:text-emerald-400">{selectedStaff.visible_mangoes} Mangoes</span>
                {' • '}
                Already in Vault: <span className="font-bold text-indigo-600 dark:text-indigo-400">{selectedStaff.vault_held_mangoes} Mangoes</span>
              </div>
            </div>

            <form onSubmit={handleHoldSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Number of Mangoes to Hold:
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedStaff.visible_mangoes}
                  value={modalCount}
                  onChange={(e) => setModalCount(Math.max(1, Math.min(selectedStaff.visible_mangoes, parseInt(e.target.value) || 1)))}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Equates to {modalCount * selectedStaff.shift_hours} hours ({modalCount * selectedStaff.shift_hours * 60} mins) overtime.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Reason / Administrative Note:
                </label>
                <textarea
                  rows="3"
                  value={modalNote}
                  onChange={(e) => setModalNote(e.target.value)}
                  placeholder="Enter reason for reserve..."
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                ></textarea>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-2.5">
                <FiInfo className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                  <strong>Stealth Mode:</strong> This staff member will NOT see these reserved mangoes in their portal. Their tree will only display their remaining mangoes.
                </p>
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
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <FiLock size={13} />
                  <span>{submitting ? 'Reserving...' : 'Confirm Reserve'}</span>
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

