import React from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiClock, FiCalendar } from 'react-icons/fi';

export const TaskHistoryDrawer = ({
  isOpen,
  historyTask,
  onClose,
  loadingHistory,
  activeHistoryLogs = [],
  apiBase = import.meta.env.VITE_API_BASE_URL || '/'
}) => {
  if (!isOpen || !historyTask) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex justify-end bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="font-black text-lg text-slate-800">Task Activity Logs</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5 truncate max-w-[280px]">
              {historyTask.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Body Logs */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
          {loadingHistory ? (
            <div className="h-full flex flex-col items-center justify-center py-20">
              <div className="animate-spin h-8 w-8 border-3 border-blue-500 border-t-transparent rounded-full mb-3" />
              <p className="text-sm font-semibold text-slate-400">Loading logs...</p>
            </div>
          ) : activeHistoryLogs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-20 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                <FiClock size={20} />
              </div>
              <p className="text-sm font-semibold text-slate-400">No status logs recorded yet.</p>
            </div>
          ) : (
            <div className="relative border-l-2 border-slate-100 ml-3 pl-6 space-y-6">
              {activeHistoryLogs.map((log) => {
                const date = new Date(
                  log.created_at.includes('T') || log.created_at.includes('Z')
                    ? log.created_at
                    : log.created_at.replace(' ', 'T') + 'Z'
                );
                const formattedDate = date.toLocaleDateString('en-GB', {
                  timeZone: 'Asia/Dhaka',
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                });
                const formattedTime = date.toLocaleTimeString('en-US', {
                  timeZone: 'Asia/Dhaka',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: true
                });

                return (
                  <div key={log.id} className="relative">
                    <span className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white ring-4 ring-slate-100">
                      <span className="h-2 w-2 rounded-full bg-blue-500" />
                    </span>

                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-slate-800 leading-snug">
                        Moved to{' '}
                        <span
                          className={`px-2 py-0.5 rounded-lg text-xs font-bold inline-block ${
                            log.status_to === 'In Review'
                              ? 'bg-orange-100 text-orange-700'
                              : log.status_to === 'Completed'
                              ? 'bg-emerald-100 text-emerald-700'
                              : log.status_to === 'In Progress'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {log.status_to}
                        </span>
                        {log.status_from && (
                          <span className="text-slate-500 font-medium">
                            {' '}
                            from {log.status_from}
                          </span>
                        )}
                      </p>

                      <div className="flex items-center gap-1.5">
                        {log.changed_by_avatar ? (
                          <img
                            src={`${apiBase}${log.changed_by_avatar}`}
                            alt="Avatar"
                            className="w-5 h-5 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-700 font-bold text-[9px] uppercase">
                            {log.changed_by_name ? log.changed_by_name.charAt(0) : '?'}
                          </div>
                        )}
                        <span className="text-xs font-bold text-slate-600 truncate">
                          {log.changed_by_name || 'System'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-semibold pt-0.5">
                        <FiCalendar size={11} />
                        <span>{formattedDate}</span>
                        <span>•</span>
                        <FiClock size={11} />
                        <span>{formattedTime}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-colors text-center text-sm"
          >
            Close Logs
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default TaskHistoryDrawer;
