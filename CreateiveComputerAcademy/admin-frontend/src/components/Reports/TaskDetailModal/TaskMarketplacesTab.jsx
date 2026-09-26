import React from 'react';
import {
  FiGlobe,
  FiShoppingCart
} from 'react-icons/fi';

/**
 * TaskMarketplacesTab
 * Renders Stock Marketplace Submissions and Status Transition History.
 */
const TaskMarketplacesTab = ({
  selectedTaskModal,
  formatDateTime
}) => {
  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
          <FiGlobe className="text-blue-600" />
          <span>Stock Marketplace Submissions ({selectedTaskModal.marketplaces?.length || 0})</span>
        </h4>
      </div>

      {selectedTaskModal.marketplaces && selectedTaskModal.marketplaces.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {selectedTaskModal.marketplaces.map((m, idx) => {
            const marketName = m.marketplace === 'Custom' ? (m.custom_market || 'Custom Market') : m.marketplace;
            return (
              <div
                key={m.id || idx}
                className="p-4 bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-black text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      <FiShoppingCart className="text-blue-500" size={14} />
                      <span>{marketName}</span>
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${m.status === 'Live' || m.status === 'Approved' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400' :
                      m.status === 'Submitted' || m.status === 'Under Review' ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400' :
                        m.status === 'Rejected' ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400' :
                          'bg-slate-100 border-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                      {m.status || 'Pending'}
                    </span>
                  </div>

                  <div className="space-y-1 text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-700/60">
                    <div className="flex justify-between">
                      <span>Submitted Date:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">
                        {m.submitted_date ? (formatDateTime ? formatDateTime(m.submitted_date) : m.submitted_date) : (formatDateTime ? formatDateTime(m.created_at) : m.created_at)}
                      </span>
                    </div>
                    {m.added_by_name && (
                      <div className="flex justify-between">
                        <span>Uploaded By:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-200">{m.added_by_name} ({m.added_by_role || 'Reviewer'})</span>
                      </div>
                    )}
                  </div>

                  {m.logs && m.logs.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 space-y-1.5">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Status History</p>
                      <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                        {m.logs.map((l, lIdx) => (
                          <div key={lIdx} className="text-[10px] bg-slate-50 dark:bg-slate-900/60 p-1.5 rounded-lg flex justify-between items-center">
                            <span>
                              <span className="text-slate-400">{l.status_from || 'Initial'}</span> → <span className="font-bold text-slate-700 dark:text-slate-200">{l.status_to}</span>
                            </span>
                            <span className="text-slate-400">{formatDateTime ? formatDateTime(l.created_at) : l.created_at}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs italic">
          No marketplace submission records found for this task yet. Marketplace distribution is managed by Reviewers/Admins after quality approval.
        </div>
      )}
    </div>
  );
};

export default TaskMarketplacesTab;
