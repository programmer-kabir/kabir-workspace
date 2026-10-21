import React from 'react';
import { createPortal } from 'react-dom';
import { FiTrash2, FiAlertTriangle, FiX } from 'react-icons/fi';

const ConfirmModal = ({
  isOpen,
  title = 'Are you sure?',
  message = 'This action cannot be undone. Are you sure you want to proceed?',
  confirmText = 'Delete',
  cancelText = 'Cancel',
  confirmVariant = 'danger', // 'danger' | 'warning' | 'primary'
  loading = false,
  onConfirm,
  onCancel,
  icon: CustomIcon
}) => {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (confirmVariant) {
      case 'warning':
        return {
          iconBg: 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/60',
          btnBg: 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-lg shadow-amber-600/25',
          defaultIcon: <FiAlertTriangle size={24} />
        };
      case 'primary':
        return {
          iconBg: 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/60',
          btnBg: 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/25',
          defaultIcon: <FiAlertTriangle size={24} />
        };
      case 'danger':
      default:
        return {
          iconBg: 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/60',
          btnBg: 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-lg shadow-rose-600/25',
          defaultIcon: <FiTrash2 size={24} />
        };
    }
  };

  const variant = getVariantStyles();

  return createPortal(
    <div className="fixed inset-0 z-[99999] w-screen h-screen flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      {/* Click outside to cancel */}
      <div className="absolute inset-0" onClick={loading ? undefined : onCancel} />

      {/* Modal Dialog Card */}
      <div className="bg-white dark:bg-[#0d1322] rounded-3xl p-6 sm:p-7 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl relative z-10 overflow-hidden flex flex-col space-y-5 animate-in zoom-in-95 duration-200">
        
        {/* Close Top Corner Button */}
        <button
          type="button"
          onClick={loading ? undefined : onCancel}
          disabled={loading}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <FiX size={18} />
        </button>

        {/* Header Icon + Title */}
        <div className="flex items-start gap-4">
          <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center shrink-0 shadow-sm ${variant.iconBg}`}>
            {CustomIcon ? <CustomIcon size={24} /> : variant.defaultIcon}
          </div>
          <div className="space-y-1 pr-4">
            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
              {title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
          >
            {cancelText}
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 cursor-pointer ${variant.btnBg} ${
              loading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {loading && (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            )}
            <span>{loading ? 'Processing...' : confirmText}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmModal;
