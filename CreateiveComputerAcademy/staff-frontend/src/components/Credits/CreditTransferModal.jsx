import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiLock } from 'react-icons/fi';
import { toast } from 'sonner';

export default function CreditTransferModal({
  isSendOpen,
  setIsSendOpen,
  balance
}) {
  return (
    <AnimatePresence>
      {isSendOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSendOpen(false)}
            className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 z-10 space-y-4"
          >
            <div className="text-center space-y-4 py-3">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center text-3xl shadow-inner border border-amber-200 dark:border-amber-800 animate-bounce">
                😂
              </div>

              <div className="space-y-2 max-w-sm mx-auto">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                  <FiLock size={12} /> Transfer Disabled
                </span>
                
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  Hold on, Generous Soul! 😂
                </h3>

                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 leading-snug">
                  "You barely earn enough credits yourself, and you want to give them to someone else?" 💸
                </p>

                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Work hard, complete your tasks, and build your own balance first before playing philanthropist! P2P transfers are currently disabled.
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 flex items-center justify-center gap-3">
                <span>Available Balance: <strong className="text-slate-900 dark:text-white">{balance} Credits</strong></span>
                <span>•</span>
                <span>Status: <strong className="text-rose-500">Locked 🔒</strong></span>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    toast.error("Nice try! 😂 You barely earn enough credits yourself. Go finish some tasks first!", {
                      icon: '💸',
                      duration: 4000
                    });
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
                >
                  Try Sending Anyway 🥺
                </button>

                <button
                  type="button"
                  onClick={() => setIsSendOpen(false)}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  Got it, Back to Work! 🚀
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

