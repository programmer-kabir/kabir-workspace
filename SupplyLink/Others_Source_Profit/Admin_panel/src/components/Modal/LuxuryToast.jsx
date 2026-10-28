import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiCheck, FiClock, FiAlertTriangle, FiInfo, FiX } from "react-icons/fi";

export default function LuxuryToast({ toast, onClose, duration = 3800 }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [toast, onClose, duration]);

  if (typeof document === "undefined") return null;

  const type = toast?.type || "success";

  return createPortal(
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 450, damping: 30 }}
          className={`fixed top-4 left-3 right-3 sm:left-auto sm:right-6 sm:top-6 sm:w-full sm:max-w-sm z-[999999] pointer-events-auto rounded-2xl bg-[#080e1e]/95 p-3.5 sm:p-4 backdrop-blur-2xl text-white overflow-hidden border shadow-[0_20px_50px_rgba(0,0,0,0.85)] ${
            type === "success"
              ? "border-emerald-500/40 shadow-[0_0_25px_rgba(16,185,129,0.25)]"
              : type === "warning"
              ? "border-amber-500/40 shadow-[0_0_25px_rgba(245,158,11,0.25)]"
              : type === "info"
              ? "border-cyan-500/40 shadow-[0_0_25px_rgba(6,182,212,0.25)]"
              : "border-rose-500/40 shadow-[0_0_25px_rgba(244,63,94,0.25)]"
          }`}
        >
          {/* Top row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                  type === "success"
                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                    : type === "warning"
                    ? "bg-amber-500/15 border-amber-500/30 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                    : type === "info"
                    ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                    : "bg-rose-500/15 border-rose-500/30 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                }`}
              >
                {type === "success" ? (
                  <FiCheck className="text-xl stroke-[3]" />
                ) : type === "warning" ? (
                  <FiClock className="text-xl stroke-[2]" />
                ) : type === "info" ? (
                  <FiInfo className="text-xl stroke-[2]" />
                ) : (
                  <FiAlertTriangle className="text-xl stroke-[2]" />
                )}
              </div>
              <div className="min-w-0 pr-1">
                <h4 className="text-sm font-bold text-white tracking-wide">
                  {toast.title}
                </h4>
                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed break-words">
                  {toast.message}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onClose?.()}
              className="w-7 h-7 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
            >
              <FiX className="text-sm" />
            </button>
          </div>

          {/* Badges details (Optional) */}
          {(toast.tag || toast.amount) && (
            <div className="mt-3 pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs">
              {toast.tag ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-semibold font-mono">
                  {toast.tag}
                </span>
              ) : (
                <span />
              )}
              {toast.amount && (
                <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                  ৳ {Number(toast.amount).toLocaleString()}
                </span>
              )}
            </div>
          )}

          {/* Glowing animated progress countdown line */}
          <motion.div
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{ duration: duration / 1000, ease: "linear" }}
            className={`absolute bottom-0 left-0 h-1 ${
              type === "success"
                ? "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_8px_#10b981]"
                : type === "warning"
                ? "bg-gradient-to-r from-amber-500 to-yellow-400 shadow-[0_0_8px_#f59e0b]"
                : type === "info"
                ? "bg-gradient-to-r from-cyan-500 to-blue-400 shadow-[0_0_8px_#06b6d4]"
                : "bg-gradient-to-r from-rose-500 to-red-400 shadow-[0_0_8px_#f43f5e]"
            }`}
          />
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
