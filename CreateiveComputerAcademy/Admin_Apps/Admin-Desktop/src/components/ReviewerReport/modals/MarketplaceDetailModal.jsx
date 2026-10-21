import React from 'react';
import { createPortal } from 'react-dom';
import { FiShoppingCart, FiX, FiExternalLink, FiActivity } from 'react-icons/fi';

export const MarketplaceDetailModal = ({
  selectedMarketModal,
  setSelectedMarketModal
}) => {
  if (!selectedMarketModal) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/80 dark:bg-slate-900/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <FiShoppingCart size={18} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">
                {selectedMarketModal.marketplace === 'Custom' ? (selectedMarketModal.custom_market || 'Custom Market') : selectedMarketModal.marketplace} Submission
              </h3>
              <p className="text-xs text-slate-400 font-bold">
                Task #{selectedMarketModal.task_id} • {selectedMarketModal.task_title}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSelectedMarketModal(null)}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <FiX size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1 min-h-0">
          {/* Status & Basic Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Current Status</p>
              <p className="text-xs font-black text-indigo-600 mt-1 uppercase">{selectedMarketModal.status || 'Pending'}</p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Designer / Staff</p>
              <p className="text-xs font-black text-slate-800 dark:text-slate-100 mt-1 truncate">{selectedMarketModal.staff_name || 'Staff'}</p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Submitted Date</p>
              <p className="text-xs font-black text-slate-800 dark:text-slate-100 mt-1">
                {selectedMarketModal.submitted_date ? new Date(selectedMarketModal.submitted_date).toLocaleDateString('en-GB') : '-'}
              </p>
            </div>
          </div>

          {/* Approved Live Link */}
          {selectedMarketModal.approval_url && (
            <div className="p-4 bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <p className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Live Approved Marketplace URL</p>
                </div>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate mt-1 select-all">{selectedMarketModal.approval_url}</p>
              </div>
              <a
                href={selectedMarketModal.approval_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors flex items-center gap-1.5 shrink-0 shadow-sm"
              >
                <FiExternalLink size={13} />
                <span>Open Live</span>
              </a>
            </div>
          )}

          {/* File Link */}
          {selectedMarketModal.submission_link && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Deliverable Asset / Drive Link</p>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate mt-0.5 select-all">{selectedMarketModal.submission_link}</p>
              </div>
              <a
                href={selectedMarketModal.submission_link}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-bold rounded-xl transition-colors flex items-center gap-1.5 shrink-0"
              >
                <FiExternalLink size={13} />
                <span>Open Asset</span>
              </a>
            </div>
          )}

          {/* Rejection Reason */}
          {selectedMarketModal.reject_reason && (
            <div className="p-4 bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-2xl space-y-1">
              <p className="text-[10px] font-black text-rose-700 dark:text-rose-400 uppercase">Rejection / Revision Reason</p>
              <p className="text-xs text-rose-800 dark:text-rose-300 font-medium">{selectedMarketModal.reject_reason}</p>
            </div>
          )}

          {/* Full Status Transition History Log */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <FiActivity size={13} className="text-indigo-500" />
              <span>Status Lifecycle Audit History</span>
            </h4>

            {selectedMarketModal.logs && selectedMarketModal.logs.length > 0 ? (
              <div className="space-y-2 relative before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800 pl-6">
                {selectedMarketModal.logs.map((log, lIdx) => (
                  <div key={lIdx} className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl relative">
                    <span className="absolute -left-6 top-4 w-2 h-2 rounded-full bg-indigo-500 ring-4 ring-white dark:ring-slate-900"></span>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-800 dark:text-slate-100">
                        {log.status_from ? `${log.status_from} → ` : ''} <span className="text-indigo-600">{log.status_to}</span>
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(log.created_at).toLocaleString('en-GB')}
                      </span>
                    </div>
                    {log.changed_by_name && (
                      <p className="text-[10px] text-slate-400 mt-1">
                        Updated by <strong>{log.changed_by_name}</strong> ({log.changed_by_role || 'Reviewer'})
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-center text-slate-400 italic">
                Initial submission created on {new Date(selectedMarketModal.created_at).toLocaleDateString('en-GB')}. No subsequent revisions recorded.
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end shrink-0">
          <button
            type="button"
            onClick={() => setSelectedMarketModal(null)}
            className="px-5 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl hover:bg-slate-300 transition-colors text-xs cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default MarketplaceDetailModal;
