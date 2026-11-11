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
  FiShield,
  FiLoader
} from "react-icons/fi";

/**
 * LuxuryActionModal
 * Ultra-premium dark glassmorphism confirmation & action modal
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
 * - onConfirm: (inputValue?: string) => Promise<any> | void
 * - onClose: () => void
 * - isSubmitting: boolean
 */
const LuxuryActionModal = ({
  isOpen,
  type = "confirm",
  title,
  description,
  variant = "cyan",
  confirmText = "হ্যাঁ, নিশ্চিত করুন",
  cancelText = "ফিরে যান",
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
  const [internalSubmitting, setInternalSubmitting] = useState(false);

  if (!isOpen) return null;

  const submitting = isSubmitting || internalSubmitting;

  const handleConfirm = async () => {
    if (requiresInput && !inputValue.trim()) {
      setInputError("এই ফিল্ডটি পূরণ করা আবশ্যক!");
      return;
    }
    setInputError("");
    if (onConfirm) {
      try {
        setInternalSubmitting(true);
        await onConfirm(inputValue);
      } catch (e) {
        // Handled by parent
      } finally {
        setInternalSubmitting(false);
      }
    }
  };

  // Variant Visual Configurations
  const config = {
    danger: {
      accentBorder: "border-rose-500/40",
      accentGlow: "from-rose-500/25 via-transparent to-amber-500/20",
      halo: "bg-rose-500/25",
      iconBg: "bg-gradient-to-br from-rose-500/20 to-red-500/10 border-rose-500/40 text-rose-400 shadow-rose-950/50",
      pulseColor: "bg-rose-500/30",
      badgeColor: "bg-rose-500/15 text-rose-300 border-rose-500/30",
      leftBar: "border-l-rose-500",
      confirmBtn: "bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 hover:from-rose-500 hover:to-amber-500 shadow-lg shadow-rose-950/70 hover:shadow-rose-600/30",
      Icon: FiTrash2,
    },
    warning: {
      accentBorder: "border-amber-500/40",
      accentGlow: "from-amber-500/25 via-transparent to-rose-500/20",
      halo: "bg-amber-500/25",
      iconBg: "bg-gradient-to-br from-amber-500/20 to-yellow-500/10 border-amber-500/40 text-amber-400 shadow-amber-950/50",
      pulseColor: "bg-amber-500/30",
      badgeColor: "bg-amber-500/15 text-amber-300 border-amber-500/30",
      leftBar: "border-l-amber-500",
      confirmBtn: "bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 hover:from-amber-500 hover:to-yellow-400 shadow-lg shadow-amber-950/70 hover:shadow-amber-600/30",
      Icon: FiAlertTriangle,
    },
    success: {
      accentBorder: "border-emerald-500/40",
      accentGlow: "from-emerald-500/25 via-transparent to-teal-500/20",
      halo: "bg-emerald-500/25",
      iconBg: "bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border-emerald-500/40 text-emerald-400 shadow-emerald-950/50",
      pulseColor: "bg-emerald-500/30",
      badgeColor: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
      leftBar: "border-l-emerald-500",
      confirmBtn: "bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 shadow-lg shadow-emerald-950/70 hover:shadow-emerald-500/40",
      Icon: FiCheckCircle,
    },
    cyan: {
      accentBorder: "border-cyan-500/40",
      accentGlow: "from-cyan-500/25 via-transparent to-emerald-500/20",
      halo: "bg-cyan-500/25",
      iconBg: "bg-gradient-to-br from-cyan-500/20 to-teal-500/10 border-cyan-500/40 text-cyan-400 shadow-cyan-950/50",
      pulseColor: "bg-cyan-500/30",
      badgeColor: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
      leftBar: "border-l-cyan-500",
      confirmBtn: "bg-gradient-to-r from-cyan-600 via-teal-500 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 shadow-lg shadow-cyan-950/70 hover:shadow-cyan-500/40",
      Icon: FiShield,
    },
    info: {
      accentBorder: "border-indigo-500/40",
      accentGlow: "from-indigo-500/25 via-transparent to-cyan-500/20",
      halo: "bg-indigo-500/25",
      iconBg: "bg-gradient-to-br from-indigo-500/20 to-purple-500/10 border-indigo-500/40 text-indigo-400 shadow-indigo-950/50",
      pulseColor: "bg-indigo-500/30",
      badgeColor: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
      leftBar: "border-l-indigo-500",
      confirmBtn: "bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 shadow-lg shadow-indigo-950/70 hover:shadow-indigo-500/40",
      Icon: FiInfo,
    },
  }[variant] || {
    accentBorder: "border-cyan-500/40",
    accentGlow: "from-cyan-500/25 via-transparent to-emerald-500/20",
    halo: "bg-cyan-500/25",
    iconBg: "bg-cyan-500/15 border-cyan-500/40 text-cyan-400",
    pulseColor: "bg-cyan-500/30",
    badgeColor: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
    leftBar: "border-l-cyan-500",
    confirmBtn: "bg-gradient-to-r from-cyan-600 to-emerald-600 shadow-cyan-950/60",
    Icon: FiCheckCircle,
  };

  const IconComponent = config.Icon;
  const isFeedback = type === "success" || type === "error";

  // Dynamic Loading Label
  const getLoadingText = () => {
    if (confirmText.includes("অনুমোদন")) return "অনুমোদন করা হচ্ছে...";
    if (confirmText.includes("বাতিল")) return "বাতিল করা হচ্ছে...";
    if (confirmText.includes("সেভ") || confirmText.includes("সংরক্ষণ")) return "সংরক্ষণ করা হচ্ছে...";
    return "প্রসেসিং হচ্ছে...";
  };

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
        {/* Backdrop with High-End Blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-[#02050f]/85 backdrop-blur-xl"
          onClick={submitting ? undefined : onClose}
        />

        {/* Modal Dialog Card */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 24 }}
          animate={{
            scale: 1,
            opacity: 1,
            y: 0,
            transition: { type: "spring", stiffness: 360, damping: 26 },
          }}
          exit={{ scale: 0.94, opacity: 0, y: 16, transition: { duration: 0.16 } }}
          className={`relative w-full max-w-lg rounded-3xl bg-gradient-to-b from-[#0c1527] via-[#080e1d] to-[#040813] border ${config.accentBorder} p-6 sm:p-7 shadow-[0_30px_90px_rgba(0,0,0,0.95)] text-white space-y-6 overflow-hidden before:absolute before:-inset-px before:rounded-3xl before:bg-gradient-to-b ${config.accentGlow} before:pointer-events-none`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Ambient Glow Orbs */}
          <div className={`absolute -top-24 -right-24 w-52 h-52 ${config.halo} rounded-full blur-3xl pointer-events-none`} />
          <div className={`absolute -bottom-24 -left-24 w-52 h-52 ${config.halo} rounded-full blur-3xl pointer-events-none`} />

          {/* Header with Icon Badge */}
          <div className="flex items-start justify-between gap-3 relative">
            <div className="flex items-center gap-3.5">
              <div className="relative shrink-0">
                <span className={`absolute -inset-1 rounded-2xl ${config.pulseColor} blur-md animate-pulse`} />
                <div className={`relative w-12 h-12 rounded-2xl ${config.iconBg} border flex items-center justify-center text-2xl shadow-xl`}>
                  <IconComponent />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-wide leading-tight">
                  {title}
                </h3>
                {type === "confirm" && (
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider ${config.badgeColor} border`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />
                    <span>অনুমোদন প্রয়োজন (Confirmation Required)</span>
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={onClose}
              disabled={submitting}
              className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 flex items-center justify-center transition-all hover:rotate-90 shrink-0 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <FiX className="text-sm" />
            </button>
          </div>

          {/* Description Card */}
          <div className={`relative text-xs sm:text-sm text-slate-200 leading-relaxed bg-[#0a1222]/80 border border-slate-700/60 border-l-4 ${config.leftBar} rounded-2xl p-4 shadow-inner space-y-2`}>
            <div>{description}</div>
          </div>

          {/* Optional Input / Reason Box */}
          {requiresInput && (
            <div className="space-y-2 relative">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <FiCornerDownRight className="text-cyan-400 text-xs" />
                <span>{inputLabel}</span>
              </label>
              <textarea
                rows={3}
                disabled={submitting}
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  if (inputError) setInputError("");
                }}
                placeholder={inputPlaceholder}
                className={`w-full px-4 py-3 rounded-xl bg-black/60 border ${
                  inputError ? "border-rose-500 ring-2 ring-rose-500/20" : "border-slate-700/80 focus:border-cyan-400"
                } text-white text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all placeholder:text-slate-500 disabled:opacity-50`}
                autoFocus
              />
              {inputError && (
                <p className="text-rose-400 text-[11px] font-medium flex items-center gap-1">
                  <FiAlertTriangle className="text-xs" />
                  <span>{inputError}</span>
                </p>
              )}
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08] relative">
            {!isFeedback && showCancel && (
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 text-xs font-semibold border border-slate-700/60 transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {cancelText}
              </button>
            )}

            <button
              type="button"
              onClick={isFeedback ? onClose : handleConfirm}
              disabled={submitting}
              className={`min-w-[130px] px-6 py-2.5 rounded-xl ${config.confirmBtn} text-white text-xs font-bold transition active:scale-95 flex items-center justify-center gap-2 disabled:opacity-80 disabled:cursor-wait cursor-pointer`}
            >
              {submitting ? (
                <>
                  <FiLoader className="text-sm animate-spin" />
                  <span className="tracking-wide">{getLoadingText()}</span>
                </>
              ) : (
                <>
                  <FiCheck className="text-sm stroke-[3]" />
                  <span>{confirmText}</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};

export default LuxuryActionModal;
