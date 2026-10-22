import React, { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiCheckCircle,
  FiAlertTriangle,
  FiTrash2,
  FiXCircle,
  FiInfo,
  FiX,
  FiCheck,
  FiClock,
  FiCornerDownRight,
  FiShield
} from "react-icons/fi";

/**
 * LuxuryActionModal
 * Replaces SweetAlert2 with ultra-premium dark glassmorphism dialogs
 * 
 * Props:
 * - isOpen: boolean
 * - type: "confirm" | "success" | "error" | "warning" | "prompt"
 * - title: string
 * - description: string | ReactNode
 * - variant: "success" | "danger" | "warning" | "info" | "cyan"
 * - confirmText: string
 * - cancelText: string
 * - showCancel: boolean
 * - requiresInput: boolean (e.g. for reject reason)
 * - inputPlaceholder: string
 * - inputLabel: string
 * - onConfirm: (inputValue?: string) => void
 * - onClose: () => void
 * - isSubmitting: boolean
 */
const LuxuryActionModal = ({
  isOpen,
  type = "confirm",
  title,
  description,
  variant = "cyan",
  confirmText = "ঠিক আছে",
  cancelText = "বাতিল",
  showCancel = true,
  requiresInput = false,
  inputPlaceholder = "কারণ লিখুন...",
  inputLabel = "মন্তব্য / কারণ *",
  onConfirm,
  onClose,
  isSubmitting = false,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [inputError, setInputError] = useState("");

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (requiresInput && !inputValue.trim()) {
      setInputError("এই ফিল্ডটি পূরণ করা আবশ্যক!");
      return;
    }
    setInputError("");
    if (onConfirm) onConfirm(inputValue);
  };

  // Variant Visual Configurations
  const config = {
    danger: {
      accentBorder: "border-rose-500/30",
      accentGlow: "from-rose-500/20 via-transparent to-amber-500/20",
      halo: "bg-rose-500/20",
      iconBg: "bg-rose-500/15 border-rose-500/30 text-rose-400",
      confirmBtn: "bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 hover:from-rose-500 hover:to-amber-500 shadow-rose-950/60",
      Icon: FiTrash2,
    },
    warning: {
      accentBorder: "border-amber-500/30",
      accentGlow: "from-amber-500/20 via-transparent to-rose-500/20",
      halo: "bg-amber-500/20",
      iconBg: "bg-amber-500/15 border-amber-500/30 text-amber-400",
      confirmBtn: "bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 shadow-amber-950/60",
      Icon: FiAlertTriangle,
    },
    success: {
      accentBorder: "border-emerald-500/30",
      accentGlow: "from-emerald-500/20 via-transparent to-teal-500/20",
      halo: "bg-emerald-500/20",
      iconBg: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
      confirmBtn: "bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 shadow-emerald-950/60",
      Icon: FiCheckCircle,
    },
    cyan: {
      accentBorder: "border-cyan-500/30",
      accentGlow: "from-cyan-500/20 via-transparent to-emerald-500/20",
      halo: "bg-cyan-500/20",
      iconBg: "bg-cyan-500/15 border-cyan-500/30 text-cyan-400",
      confirmBtn: "bg-gradient-to-r from-cyan-600 via-teal-500 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 shadow-cyan-950/60",
      Icon: FiShield,
    },
    info: {
      accentBorder: "border-indigo-500/30",
      accentGlow: "from-indigo-500/20 via-transparent to-cyan-500/20",
      halo: "bg-indigo-500/20",
      iconBg: "bg-indigo-500/15 border-indigo-500/30 text-indigo-400",
      confirmBtn: "bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 shadow-indigo-950/60",
      Icon: FiInfo,
    },
  }[variant] || {
    accentBorder: "border-cyan-500/30",
    accentGlow: "from-cyan-500/20 via-transparent to-emerald-500/20",
    halo: "bg-cyan-500/20",
    iconBg: "bg-cyan-500/15 border-cyan-500/30 text-cyan-400",
    confirmBtn: "bg-gradient-to-r from-cyan-600 to-emerald-600 shadow-cyan-950/60",
    Icon: FiCheckCircle,
  };

  const IconComponent = config.Icon;
  const isFeedback = type === "success" || type === "error";

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-[#020617]/85 backdrop-blur-xl"
          onClick={onClose}
        />

        {/* Modal Dialog Card */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{
            scale: 1,
            opacity: 1,
            y: 0,
            transition: { type: "spring", stiffness: 380, damping: 28 },
          }}
          exit={{ scale: 0.92, opacity: 0, y: 15, transition: { duration: 0.18 } }}
          className={`relative w-full max-w-md rounded-3xl bg-gradient-to-b from-[#0c1427] via-[#090f1f] to-[#060a16] border ${config.accentBorder} p-6 sm:p-7 shadow-[0_25px_80px_rgba(0,0,0,0.95)] text-white space-y-5 overflow-hidden before:absolute before:-inset-px before:rounded-3xl before:bg-gradient-to-b ${config.accentGlow} before:pointer-events-none`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Ambient Glow */}
          <div className={`absolute -top-20 -right-20 w-44 h-44 ${config.halo} rounded-full blur-3xl pointer-events-none`} />
          <div className={`absolute -bottom-20 -left-20 w-44 h-44 ${config.halo} rounded-full blur-3xl pointer-events-none`} />

          {/* Header with Icon Badge */}
          <div className="flex items-start justify-between gap-3 relative">
            <div className="flex items-center gap-3.5">
              <div className={`w-12 h-12 rounded-2xl ${config.iconBg} border flex items-center justify-center text-xl shadow-lg shrink-0`}>
                <IconComponent />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  {title}
                </h3>
                {type === "confirm" && (
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    Confirmation Required
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 flex items-center justify-center transition-all hover:rotate-90 shrink-0"
            >
              <FiX className="text-sm" />
            </button>
          </div>

          {/* Description */}
          <div className="relative text-xs sm:text-sm text-slate-300 leading-relaxed bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
            {description}
          </div>

          {/* Optional Input / Reason Box */}
          {requiresInput && (
            <div className="space-y-1.5 relative">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <FiCornerDownRight className="text-cyan-400 text-xs" />
                {inputLabel}
              </label>
              <textarea
                rows={3}
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  if (inputError) setInputError("");
                }}
                placeholder={inputPlaceholder}
                className={`w-full px-4 py-2.5 rounded-xl bg-black/60 border ${
                  inputError ? "border-rose-500" : "border-white/15"
                } text-white text-xs focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all placeholder:text-slate-600`}
                autoFocus
              />
              {inputError && (
                <p className="text-rose-400 text-[11px] font-medium">{inputError}</p>
              )}
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08] relative">
            {!isFeedback && showCancel && (
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold border border-white/10 transition active:scale-95 disabled:opacity-50"
              >
                {cancelText}
              </button>
            )}

            <button
              type="button"
              onClick={isFeedback ? onClose : handleConfirm}
              disabled={isSubmitting}
              className={`px-6 py-2.5 rounded-xl ${config.confirmBtn} text-white text-xs font-bold shadow-lg transition active:scale-95 flex items-center gap-2 disabled:opacity-50`}
            >
              <FiCheck className="text-xs" />
              <span>{confirmText}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};

export default LuxuryActionModal;
