import React from 'react';
import { createPortal } from 'react-dom';
import { FiPlus, FiX, FiKey } from 'react-icons/fi';

const InsertRowModal = ({
  insertModal = { isOpen: false, data: {}, table: '' },
  setInsertModal,
  selectedTable = '',
  tableData = { columns: [] },
  handleInsertRow,
  submitting = false
}) => {
  if (!insertModal?.isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FiPlus className="text-blue-500" />
              <span>Insert Row into `{insertModal.table || selectedTable}`</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Fill in fields according to table schema
            </p>
          </div>
          <button
            type="button"
            onClick={() => setInsertModal && setInsertModal({ isOpen: false, data: {}, table: '' })}
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <FiX size={18} />
          </button>
        </div>

        <form onSubmit={handleInsertRow} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tableData.columns?.map((col) => {
              const isAutoInc = col.extra && col.extra.toLowerCase().includes('auto_increment');
              const isPK = col.column_key === 'PRI';
              return (
                <div key={col.name} className={col.data_type === 'text' || col.data_type === 'longtext' ? 'sm:col-span-2' : ''}>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      {isPK && <FiKey className="text-amber-500" size={11} />}
                      <span>{col.name}</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 font-normal">
                      {col.full_type} {col.is_nullable === 'YES' ? '(Nullable)' : '(Required)'}
                    </span>
                  </label>

                  {col.data_type === 'text' || col.data_type === 'longtext' ? (
                    <textarea
                      rows={3}
                      value={insertModal.data[col.name] ?? ''}
                      onChange={(e) =>
                        setInsertModal(prev => ({
                          ...prev,
                          data: { ...prev.data, [col.name]: e.target.value }
                        }))
                      }
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  ) : (
                    <input
                      type="text"
                      placeholder={isAutoInc ? 'Auto Increment (Leave empty)' : ''}
                      value={insertModal.data[col.name] ?? ''}
                      onChange={(e) =>
                        setInsertModal(prev => ({
                          ...prev,
                          data: { ...prev.data, [col.name]: e.target.value }
                        }))
                      }
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setInsertModal && setInsertModal({ isOpen: false, data: {}, table: '' })}
              className="px-5 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all flex items-center gap-1.5"
            >
              {submitting ? 'Inserting...' : 'Insert Record'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default InsertRowModal;
