import React from 'react';
import { createPortal } from 'react-dom';
import { FiXCircle } from 'react-icons/fi';

export const TaskRejectModal = ({
  rejectTask,
  onClose,
  rejectReason,
  setRejectReason,
  submitReject,
  actionLoading
}) => {
  if (!rejectTask) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
            <FiXCircle size={20} />
          </div>
          <div>
            <h3 className="font-black text-lg text-slate-900">Reject Task</h3>
            <p className="text-xs text-slate-500 font-semibold">Provide feedback to the assignee.</p>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Rejection Reason / Feedback *
            </label>
            <textarea
              autoFocus
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Explain what needs to be fixed..."
              className="w-full h-32 bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
            />
          </div>
        </div>
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submitReject}
            disabled={actionLoading || !rejectReason.trim()}
            className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md transition-colors text-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {actionLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Confirm Reject'
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default TaskRejectModal;
