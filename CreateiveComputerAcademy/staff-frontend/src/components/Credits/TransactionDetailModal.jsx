import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiMessageSquare, FiExternalLink } from 'react-icons/fi';
import { getTransactionInfo } from './creditUtils';

export default function TransactionDetailModal({
  selectedTx,
  setSelectedTx
}) {
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {selectedTx && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedTx(null)}
            className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 z-10 space-y-4"
          >
            {(() => {
              const info = getTransactionInfo(selectedTx);
              return (
                <>
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black uppercase tracking-wider border ${info.badgeClass}`}>
                        {info.badgeText}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedTx(null)}
                      className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    >
                      <FiX size={18} />
                    </button>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Task / Description</span>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                      {info.mainTitle}
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs">
                    <div>
                      <span className="text-slate-400 block mb-0.5">Credit Impact:</span>
                      <span className={`font-black text-sm ${info.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {info.isPositive ? `+${selectedTx.amount}` : selectedTx.amount} Credits
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block mb-0.5">Category:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {info.categoryName || 'General'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block mb-0.5">Date & Time:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {new Date(selectedTx.created_at).toLocaleString('en-US')}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block mb-0.5">Task Reference:</span>
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                        {selectedTx.reference_id ? `#TASK-${selectedTx.reference_id}` : 'N/A'}
                      </span>
                    </div>
                  </div>

                  {info.reasonText && (
                    <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40 text-xs space-y-1">
                      <span className="font-bold text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                        <FiMessageSquare size={13} /> Reviewer Feedback / Reason:
                      </span>
                      <p className="text-slate-700 dark:text-slate-200 italic leading-relaxed">
                        "{info.reasonText}"
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2">
                    {selectedTx.reference_id && (
                      <button
                        type="button"
                        onClick={() => {
                          const targetId = selectedTx.reference_id;
                          const statusTab = selectedTx.task_status || (info.isPenalty ? 'Rejected' : 'Completed');
                          setSelectedTx(null);
                          navigate(`/tasks?taskId=${targetId}`, {
                            state: {
                              taskId: targetId,
                              activeTab: statusTab
                            }
                          });
                        }}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        View Task <FiExternalLink size={13} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectedTx(null)}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </>
              );
            })()}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

