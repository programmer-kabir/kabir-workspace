import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUnlock, FiX } from 'react-icons/fi';

export default function MangoReleaseModal({
  isOpen,
  selectedStaff,
  modalCount,
  setModalCount,
  modalNote,
  setModalNote,
  submitting,
  handleReleaseSubmit,
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
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-base">
                <FiUnlock />
                <span>Release Mangoes to Tree</span>
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
                Currently in Vault: <span className="font-bold text-indigo-600 dark:text-indigo-400">{selectedStaff.vault_held_mangoes} Mangoes</span>
                {' • '}
                Visible on Tree: <span className="font-bold text-emerald-600 dark:text-emerald-400">{selectedStaff.visible_mangoes} Mangoes</span>
              </div>
            </div>

            <form onSubmit={handleReleaseSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Number of Mangoes to Release:
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedStaff.vault_held_mangoes}
                  value={modalCount}
                  onChange={(e) => setModalCount(Math.max(1, Math.min(selectedStaff.vault_held_mangoes, parseInt(e.target.value) || 1)))}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Will return {modalCount * selectedStaff.shift_hours} hours to staff's visible mango tree.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Reason / Note (Emergency / Approved Relief):
                </label>
                <textarea
                  rows="3"
                  value={modalNote}
                  onChange={(e) => setModalNote(e.target.value)}
                  placeholder="Enter reason for release..."
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
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
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <FiUnlock size={13} />
                  <span>{submitting ? 'Releasing...' : 'Release to Tree'}</span>
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

