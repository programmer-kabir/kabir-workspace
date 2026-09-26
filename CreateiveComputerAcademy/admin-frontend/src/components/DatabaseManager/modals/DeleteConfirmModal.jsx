import React from 'react';
import { createPortal } from 'react-dom';
import { FiTrash2 } from 'react-icons/fi';

const DeleteConfirmModal = ({
  deleteModal = { isOpen: false, row: null, table: '', fromSql: false },
  setDeleteModal,
  selectedTable = '',
  handleDeleteRow,
  submitting = false
}) => {
  if (!deleteModal?.isOpen || !deleteModal?.row) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-700 shadow-2xl p-6 space-y-4">
        <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
          <div className="p-3 bg-rose-100 dark:bg-rose-900/30 rounded-2xl">
            <FiTrash2 size={24} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Confirm Record Deletion</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Target Table: `{deleteModal.table || selectedTable}`</p>
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300">
          Are you sure you want to delete this record? This operation executes immediately on the live database and cannot be undone.
        </p>

        <div className="bg-slate-50 dark:bg-slate-900/80 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-mono space-y-1.5">
          {Object.keys(deleteModal.row).slice(0, 4).map(key => (
            <div key={key} className="flex justify-between">
              <span className="text-slate-400">{key}:</span>
              <span className="font-bold text-slate-900 dark:text-slate-100 truncate max-w-[200px]">
                {String(deleteModal.row[key])}
              </span>
            </div>
          ))}
        </div>

        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => setDeleteModal && setDeleteModal({ isOpen: false, row: null, table: '', fromSql: false })}
            className="px-5 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDeleteRow}
            disabled={submitting}
            className="px-6 py-2.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-2xl shadow-md shadow-rose-500/20 disabled:opacity-50 transition-all"
          >
            {submitting ? 'Deleting...' : 'Delete Now'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DeleteConfirmModal;
