import React, { useState, useEffect, useRef } from 'react';
import { FiCheck, FiAlertTriangle, FiInfo, FiX, FiCheckCircle } from 'react-icons/fi';

/**
 * Event-based helper to trigger a Luxury Toast anywhere in Admin Portal.
 */
export const showLuxuryToast = ({
  title = 'সার্ভারে সংরক্ষিত! 📁',
  message = '',
  tag = 'Action Completed',
  type = 'success', // 'success' | 'error' | 'info' | 'warning'
  duration = 4500,
}) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('cca-admin-luxury-toast', {
        detail: {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title,
          message,
          tag,
          type,
          duration,
        },
      })
    );
  }
};

// Aliases for quick convenience
export const showToast = showLuxuryToast;
export const showSuccessToast = (title, message, tag = 'Approved') =>
  showLuxuryToast({ title, message, tag, type: 'success' });
export const showErrorToast = (title, message, tag = 'Failed') =>
  showLuxuryToast({ title, message, tag, type: 'error' });
export const showInfoToast = (title, message, tag = 'Notice') =>
  showLuxuryToast({ title, message, tag, type: 'info' });

/**
 * Individual Luxury Toast Item
 */
const LuxuryToastItem = ({ toast, onDismiss }) => {
  const { id, title, message, tag, type, duration = 4500 } = toast;
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const startTimeRef = useRef(Date.now());
  const remainingTimeRef = useRef(duration);
  const animFrameRef = useRef(null);

  useEffect(() => {
    startTimeRef.current = Date.now();

    const updateProgress = () => {
      if (!isPaused) {
        const elapsed = Date.now() - startTimeRef.current;
        const currentRemaining = Math.max(0, remainingTimeRef.current - elapsed);
        const percent = (currentRemaining / duration) * 100;
        setProgress(percent);

        if (currentRemaining <= 0) {
          onDismiss(id);
          return;
        }
      }
      animFrameRef.current = requestAnimationFrame(updateProgress);
    };

    animFrameRef.current = requestAnimationFrame(updateProgress);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [id, duration, isPaused, onDismiss]);

  const handleMouseEnter = () => {
    setIsPaused(true);
    const elapsed = Date.now() - startTimeRef.current;
    remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
  };

  const handleMouseLeave = () => {
    startTimeRef.current = Date.now();
    setIsPaused(false);
  };

  // Type-specific colors & styling
  const isSuccess = type === 'success';
  const isError = type === 'error';
  const isWarning = type === 'warning';

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative w-full max-w-sm sm:max-w-md rounded-3xl p-4 sm:p-5 shadow-2xl transition-all duration-300 overflow-hidden pointer-events-auto border animate-in fade-in slide-in-from-top-4 duration-250 ${
        isSuccess
          ? 'bg-white/95 dark:bg-[#07101e]/95 text-slate-800 dark:text-white border-emerald-300/80 dark:border-emerald-500/30 shadow-[0_20px_50px_rgba(16,185,129,0.15)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.7)] backdrop-blur-2xl'
          : isError
            ? 'bg-white/95 dark:bg-[#1a080d]/95 text-slate-800 dark:text-white border-rose-300/80 dark:border-rose-500/30 shadow-[0_20px_50px_rgba(244,63,94,0.15)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.7)] backdrop-blur-2xl'
            : isWarning
              ? 'bg-white/95 dark:bg-[#1c1205]/95 text-slate-800 dark:text-white border-amber-300/80 dark:border-amber-500/30 shadow-[0_20px_50px_rgba(245,158,11,0.15)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.7)] backdrop-blur-2xl'
              : 'bg-white/95 dark:bg-[#090d1f]/95 text-slate-800 dark:text-white border-indigo-300/80 dark:border-indigo-500/30 shadow-[0_20px_50px_rgba(99,102,241,0.15)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.7)] backdrop-blur-2xl'
      }`}
      style={{
        boxShadow:
          '0 20px 45px -10px rgba(0, 0, 0, 0.15), 0 0 25px -5px rgba(16, 185, 129, 0.12)',
      }}
    >
      <div className="flex items-start gap-3.5">
        
        {/* Glowing Icon Square (Matching Image) */}
        <div
          className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 text-xl transition-transform duration-300 ${
            isSuccess
              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-[0_0_18px_rgba(16,185,129,0.3)]'
              : isError
                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 shadow-[0_0_18px_rgba(244,63,94,0.3)]'
                : isWarning
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-[0_0_18px_rgba(245,158,11,0.3)]'
                  : 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 shadow-[0_0_18px_rgba(99,102,241,0.3)]'
          }`}
        >
          {isSuccess ? (
            <FiCheck className="stroke-[3]" size={20} />
          ) : isError ? (
            <FiAlertTriangle className="stroke-[2.5]" size={20} />
          ) : isWarning ? (
            <FiAlertTriangle className="stroke-[2.5]" size={20} />
          ) : (
            <FiInfo className="stroke-[2.5]" size={20} />
          )}
        </div>

        {/* Content Section */}
        <div className="flex-1 min-w-0 pr-1">
          {/* Header Title */}
          <h4 className="text-sm font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5 leading-snug">
            {title}
          </h4>

          {/* Description Text */}
          {message && (
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-1 leading-relaxed break-words">
              {message}
            </p>
          )}

          {/* Tag Pill Chip (Matching Image) */}
          {tag && (
            <div className="mt-3">
              <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700/80 shadow-2xs">
                {tag}
              </span>
            </div>
          )}
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={() => onDismiss(id)}
          className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors shrink-0 cursor-pointer"
          title="Dismiss"
        >
          <FiX size={16} />
        </button>
      </div>

      {/* Depleting Progress Bar along the bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100 dark:bg-slate-800/60 overflow-hidden">
        <div
          className={`h-full transition-all duration-75 ease-linear ${
            isSuccess
              ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 shadow-[0_0_12px_rgba(52,211,153,0.7)]'
              : isError
                ? 'bg-gradient-to-r from-rose-500 to-amber-500 shadow-[0_0_12px_rgba(244,63,94,0.7)]'
                : isWarning
                  ? 'bg-gradient-to-r from-amber-400 to-orange-500 shadow-[0_0_12px_rgba(245,158,11,0.7)]'
                  : 'bg-gradient-to-r from-indigo-500 to-cyan-400 shadow-[0_0_12px_rgba(99,102,241,0.7)]'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

/**
 * LuxuryToastContainer
 * Mount this once in AdminLayout or root App.jsx.
 */
export default function LuxuryToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleToastEvent = (e) => {
      if (e.detail) {
        setToasts((prev) => [e.detail, ...prev.slice(0, 3)]); // Keep max 4 concurrent toasts
      }
    };

    window.addEventListener('cca-admin-luxury-toast', handleToastEvent);
    return () => window.removeEventListener('cca-admin-luxury-toast', handleToastEvent);
  }, []);

  const handleDismiss = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-6 right-6 z-[999999] flex flex-col gap-3 pointer-events-none max-w-sm sm:max-w-md w-full px-4 sm:px-0">
      {toasts.map((toast) => (
        <LuxuryToastItem key={toast.id} toast={toast} onDismiss={handleDismiss} />
      ))}
    </div>
  );
}

