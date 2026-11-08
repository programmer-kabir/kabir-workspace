import React from 'react';
import { FiTrash2, FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';

export default function ClearServerErrorLogModal({
  isOpen,
  onClose,
  onConfirm,
  serverErrorLog,
  loading
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-5 animate-scaleUp">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30 shadow-inner">
            <FiTrash2 className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Clear Server Error Log?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Are you sure you want to clear <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-rose-500 font-mono text-[11px]">{serverErrorLog?.log_file || 'error_log'}</code>?
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/40 text-xs space-y-1.5 text-rose-800 dark:text-rose-300">
          <div className="font-bold flex items-center gap-1.5">
            <FiAlertTriangle className="w-4 h-4 text-rose-500" />
            <span>Permanent Truncation</span>
          </div>
          <p className="text-[11px] text-rose-700/80 dark:text-rose-300/80 leading-relaxed">
            This will wipe all <strong>{serverErrorLog?.line_count || 0} historical error lines</strong> ({serverErrorLog?.file_size_formatted || '0 KB'}) on the Hostinger server. Future PHP errors will continue to be logged automatically.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black text-white bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-lg shadow-rose-600/30 transition cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <FiRefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FiTrash2 className="w-3.5 h-3.5" />
            )}
            <span>Yes, Clear Server Log</span>
          </button>
        </div>
      </div>
    </div>
  );
}

