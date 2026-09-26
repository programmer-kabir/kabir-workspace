import React from 'react';
import { FiExternalLink, FiFileText } from 'react-icons/fi';

export const MarketplaceTableView = ({
  filteredMarketplaces = [],
  setSelectedMarketModal
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 font-black uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <th className="py-3 px-4 w-12 text-center">#</th>
              <th className="py-3 px-4">Task / File Title</th>
              <th className="py-3 px-4">Designer</th>
              <th className="py-3 px-4">Marketplace</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Submitted Date</th>
              <th className="py-3 px-4">Pushed By</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-slate-700 dark:text-slate-300">
            {filteredMarketplaces && filteredMarketplaces.length > 0 ? (
              filteredMarketplaces.map((m, idx) => {
                const marketName = m.marketplace === 'Custom' ? (m.custom_market || 'Custom') : m.marketplace;
                const isLive = ['live', 'approved'].includes((m.status || '').toLowerCase());
                const isRejected = (m.status || '').toLowerCase() === 'rejected';

                return (
                  <tr key={m.id || idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 text-center font-bold text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <p className="font-bold text-slate-800 dark:text-slate-100 truncate">
                        {m.task_title}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {m.task_category || 'General'} • Task #{m.task_id}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[9px] font-black uppercase text-slate-600 dark:text-slate-300 flex-shrink-0">
                          {m.staff_name ? m.staff_name.charAt(0) : 'S'}
                        </div>
                        <span className="font-bold text-slate-700 dark:text-slate-200 truncate">{m.staff_name || 'Staff'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-black text-indigo-600 dark:text-indigo-400">
                      {marketName}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${
                        isLive ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400' :
                        isRejected ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400' :
                        'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
                      }`}>
                        {m.status || 'Pending'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-500 dark:text-slate-400">
                      {m.submitted_date ? new Date(m.submitted_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date(m.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {m.added_by_name || 'Reviewer'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {m.approval_url && (
                          <a
                            href={m.approval_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs"
                            title="Open Live Approved Marketplace Link"
                          >
                            <FiExternalLink size={13} />
                          </a>
                        )}
                        {m.submission_link && (
                          <a
                            href={m.submission_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg"
                            title="Open Deliverable Link"
                          >
                            <FiFileText size={13} />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => setSelectedMarketModal(m)}
                          className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 text-slate-700 dark:text-slate-200 hover:text-indigo-600 font-bold rounded-lg transition-colors"
                        >
                          Details
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="8" className="py-10 text-center text-slate-400 font-bold italic">
                  No marketplace submissions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MarketplaceTableView;
