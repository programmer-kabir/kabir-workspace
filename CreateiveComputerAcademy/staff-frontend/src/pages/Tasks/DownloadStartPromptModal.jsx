import React from 'react';
import { createPortal } from 'react-dom';
import { FiDownload, FiPlayCircle, FiX, FiClock, FiAlertCircle } from 'react-icons/fi';

const DownloadStartPromptModal = ({ isOpen, onClose, onConfirm, pendingDownload }) => {
  if (!isOpen || !pendingDownload) return null;

  return createPortal(
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 border-2 border-emerald-500/30 dark:border-emerald-500/30 rounded-[2.5rem] p-6 sm:p-8 max-w-md w-full shadow-2xl shadow-emerald-500/10 animate-in zoom-in-95 duration-200 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Glows */}
        <div className="absolute -top-20 -right-20 w-44 h-44 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-44 h-44 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Close"
        >
          <FiX size={20} />
        </button>

        {/* Header Icon */}
        <div className="mx-auto w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-4 animate-bounce">
          <FiDownload size={32} />
        </div>

        {/* Title */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 mb-2">
            <span>Ready to Work</span>
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
            Start Task to Download File?
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1.5 leading-relaxed">
            To begin working with this asset, this task will be moved to <strong>In Progress</strong> and your session timer will start.
          </p>
        </div>

        {/* Informative Notice */}
        <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300 space-y-1 mb-6 text-left">
          <div className="flex items-center gap-2 font-bold">
            <FiClock size={14} className="text-amber-600 dark:text-amber-400" />
            <span>Automatic Session Tracking</span>
          </div>
          <p className="text-[11px] text-amber-700 dark:text-amber-400/90 leading-relaxed">
            Clicking below will automatically start the task timer and immediately trigger your high-resolution file download.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onConfirm}
            className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-sm shadow-xl shadow-emerald-500/25 active:scale-98 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <FiPlayCircle size={18} />
            <span>Start Task & Download File</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 px-5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <FiX size={15} />
            <span>Cancel</span>
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};

export default DownloadStartPromptModal;
