import React from 'react';
import { FiShoppingCart, FiExternalLink, FiFileText, FiEye } from 'react-icons/fi';

export const MarketplaceCardsView = ({
  filteredMarketplaces = [],
  setSelectedMarketModal
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {filteredMarketplaces && filteredMarketplaces.length > 0 ? (
        filteredMarketplaces.map((m, idx) => {
          const marketName = m.marketplace === 'Custom' ? (m.custom_market || 'Custom Market') : m.marketplace;
          const isLive = ['live', 'approved'].includes((m.status || '').toLowerCase());
          const isRejected = (m.status || '').toLowerCase() === 'rejected';

          return (
            <div
              key={m.id || idx}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-xs hover:shadow-md hover:border-indigo-400/80 transition-all flex flex-col justify-between group space-y-3"
            >
              <div className="space-y-2.5">
                {/* Card Header: Marketplace Name + Status */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-xs border border-indigo-100 dark:border-indigo-900/50">
                      <FiShoppingCart size={13} />
                    </div>
                    <span className="font-black text-sm text-slate-800 dark:text-slate-100 truncate">
                      {marketName}
                    </span>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${
                    isLive ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400' :
                    isRejected ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400' :
                    'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
                  }`}>
                    {m.status || 'Pending'}
                  </span>
                </div>

                {/* Task Title & Category */}
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                    {m.task_category || 'General Graphic'} • Task #{m.task_id}
                  </p>
                  <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1 mt-0.5">
                    {m.task_title}
                  </h4>
                </div>

                {/* Designer Info */}
                <div className="flex items-center gap-2.5 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-black uppercase text-slate-600 dark:text-slate-300 flex-shrink-0">
                    {m.staff_name ? m.staff_name.charAt(0) : 'S'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                      {m.staff_name || 'Staff Member'}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {m.staff_designation || 'Designer'}
                    </p>
                  </div>
                </div>

                {/* Upload Date & Reviewer Info */}
                <div className="text-[11px] text-slate-400 space-y-0.5">
                  <div className="flex justify-between">
                    <span>Uploaded Date:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">
                      {m.submitted_date ? new Date(m.submitted_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date(m.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  {m.added_by_name && (
                    <div className="flex justify-between">
                      <span>Pushed By:</span>
                      <span className="font-semibold text-slate-600 dark:text-slate-300">{m.added_by_name} ({m.added_by_role || 'Reviewer'})</span>
                    </div>
                  )}
                </div>

                {/* Live Approved URL Snippet Card */}
                {m.approval_url && (
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                        Live Approved Link:
                      </span>
                      <a
                        href={m.approval_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-emerald-800 dark:text-emerald-300 hover:underline truncate block"
                      >
                        {m.approval_url}
                      </a>
                    </div>
                    <a
                      href={m.approval_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shrink-0 shadow-xs"
                      title="Open Live Marketplace URL"
                    >
                      <FiExternalLink size={13} />
                    </a>
                  </div>
                )}

                {/* Rejection Reason Notice */}
                {m.reject_reason && isRejected && (
                  <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900/50 text-[11px] text-rose-700 dark:text-rose-300">
                    <span className="font-black uppercase tracking-wider text-[10px] block text-rose-800 dark:text-rose-400">Rejection Reason:</span>
                    <p className="mt-0.5 line-clamp-2">{m.reject_reason}</p>
                  </div>
                )}

                {/* Audit History Snapshot */}
                {m.logs && m.logs.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] space-y-1">
                    <span className="font-bold text-slate-400">Status History ({m.logs.length} transitions):</span>
                    <div className="flex items-center gap-1 flex-wrap">
                      {m.logs.slice(-3).map((l, lIdx) => (
                        <span key={lIdx} className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded text-[10px] font-bold">
                          {l.status_to}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {m.approval_url ? (
                    <a
                      href={m.approval_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl transition-all shadow-xs"
                      title="Open Live Approved Marketplace Link"
                    >
                      <FiExternalLink size={12} />
                      <span>Live Link</span>
                    </a>
                  ) : null}

                  {m.submission_link ? (
                    <a
                      href={m.submission_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors"
                      title="Open Original Deliverable File"
                    >
                      <FiFileText size={12} />
                      <span>Deliverable</span>
                    </a>
                  ) : null}

                  {!m.approval_url && !m.submission_link && (
                    <span className="text-xs text-slate-400 italic">No link available</span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedMarketModal(m)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-700 dark:text-slate-300 hover:text-indigo-600 font-bold text-xs rounded-xl transition-colors ml-auto"
                >
                  <FiEye size={12} />
                  <span>Details & History</span>
                </button>
              </div>
            </div>
          );
        })
      ) : (
        <div className="col-span-full bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800 text-slate-400 font-bold text-xs italic">
          No marketplace uploads found matching your filter criteria.
        </div>
      )}
    </div>
  );
};

export default MarketplaceCardsView;
