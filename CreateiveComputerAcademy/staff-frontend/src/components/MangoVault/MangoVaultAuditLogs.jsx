import React from 'react';
import { FiLock, FiUnlock, FiArrowRight, FiCheckCircle } from 'react-icons/fi';

export default function MangoVaultAuditLogs({ auditLogs = [] }) {
  return (
    <div className="overflow-x-auto mt-4">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="bg-slate-50/80 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-700/80 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">
            <th className="py-3 px-4">Date & Time</th>
            <th className="py-3 px-4">Action</th>
            <th className="py-3 px-4">Staff Member</th>
            <th className="py-3 px-4 text-center">Mango Count</th>
            <th className="py-3 px-4">Notes / Reason</th>
            <th className="py-3 px-4 text-right">Performed By</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
          {auditLogs.length === 0 ? (
            <tr>
              <td colSpan="6" className="py-12 text-center text-slate-400">
                No vault transactions recorded yet.
              </td>
            </tr>
          ) : (
            auditLogs.map((log) => {
              let badge = (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {log.action_type}
                </span>
              );
              if (log.action_type === 'hold') {
                badge = (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 flex items-center gap-1 w-max">
                    <FiLock size={10} /> Held to Vault
                  </span>
                );
              } else if (log.action_type === 'release') {
                badge = (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 flex items-center gap-1 w-max">
                    <FiUnlock size={10} /> Released to Tree
                  </span>
                );
              } else if (log.action_type === 'transfer_out') {
                badge = (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 flex items-center gap-1 w-max">
                    <FiArrowRight size={10} /> Transferred Out
                  </span>
                );
              } else if (log.action_type === 'transfer_in') {
                badge = (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 dark:bg-cyan-950/70 text-cyan-800 dark:text-cyan-300 flex items-center gap-1 w-max">
                    <FiCheckCircle size={10} /> Transferred In
                  </span>
                );
              }

              return (
                <tr
                  key={log.id}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition-colors"
                >
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                    {log.created_at}
                  </td>
                  <td className="py-3 px-4">{badge}</td>
                  <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                    {log.staff_name || `User #${log.user_id}`}
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-slate-900 dark:text-white">
                    🥭 {log.mango_count} ({log.minutes_amount}m)
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-xs truncate" title={log.note}>
                    {log.note || '—'}
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-slate-500 dark:text-slate-400">
                    {log.performed_by_name || 'Admin'}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

