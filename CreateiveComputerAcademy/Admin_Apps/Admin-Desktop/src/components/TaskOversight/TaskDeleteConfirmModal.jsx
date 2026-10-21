import React from 'react';
import { createPortal } from 'react-dom';
import { FiAlertCircle } from 'react-icons/fi';

export const TaskDeleteConfirmModal = ({
  taskToDelete,
  onClose,
  onConfirm,
  actionLoading
}) => {
  if (!taskToDelete) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm p-6 text-center animate-in zoom-in-95 duration-200 border border-transparent dark:border-slate-800">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-950/50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <FiAlertCircle size={32} />
        </div>
        <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-2">Delete Task?</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Are you sure you want to delete this task? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={actionLoading}
            className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={actionLoading}
            className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md transition-colors flex items-center justify-center disabled:opacity-70"
          >
            {actionLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Yes, Delete'
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default TaskDeleteConfirmModal;
