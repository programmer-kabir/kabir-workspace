import React from 'react';
import { FiShield, FiX, FiCheckCircle, FiCpu } from 'react-icons/fi';

export default function WatchdogAuditModal({
  showIdleModal,
  setShowIdleModal,
  todayIdleSummary
}) {
  if (!showIdleModal) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-scale-up max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center font-bold text-xl shadow-xs">
              <FiShield />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Workstation Inactivity Audit Log
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Detailed record of your workstation idle sessions today (5+ minutes threshold).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowIdleModal(false)}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
          >
            <FiX size={16} />
          </button>
        </div>

        {/* Quick KPI Row */}
        <div className="grid grid-cols-3 gap-3 shrink-0">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Incidents Today</span>
            <span className="text-xl font-black text-slate-800 dark:text-white mt-0.5 block">
              {todayIdleSummary?.incidents || 0} <span className="text-xs text-slate-400 font-medium">times</span>
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Idle Time</span>
            <span className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5 block">
              {todayIdleSummary?.totalMinutes || 0} <span className="text-xs text-slate-400 font-medium">minutes</span>
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">System Status</span>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Watchdog Active
            </span>
          </div>
        </div>

        {/* Inactivity Policy Reminder */}
        <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200/60 dark:border-blue-500/20 text-xs text-blue-700 dark:text-blue-300 leading-relaxed shrink-0">
          💡 <strong>Compliance Note:</strong> The desktop app logs an incident whenever mouse or keyboard movement stops for 5+ minutes. If you are taking lunch or leaving your desk, click <strong>"Break"</strong> so your attendance remains fully compliant.
        </div>

        {/* Scrollable Incident Log List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
          <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Today's Recorded Sessions
          </h4>

          {(!todayIdleSummary?.alerts || todayIdleSummary.alerts.length === 0) ? (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
              <FiCheckCircle size={32} className="text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No Inactivity Recorded Today</p>
              <p className="text-xs text-slate-400 mt-0.5">Your workstation has been active with no 5+ minute idle gaps!</p>
            </div>
          ) : (
            todayIdleSummary.alerts.map((item, idx) => {
              const formatClock = (str) => {
                if (!str) return '--:--';
                return new Date(str).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              };

              const mins = Math.floor((item.idle_seconds || 300) / 60);
              const secs = (item.idle_seconds || 300) % 60;
              const durationFormatted = `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;

              return (
                <div
                  key={item.id || idx}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5 transition-all hover:border-slate-300 dark:hover:border-slate-600"
                >
                  {/* Top Row: Incident Number & Status */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px] font-black flex items-center justify-center">
                        #{todayIdleSummary.alerts.length - idx}
                      </span>
                      Session {todayIdleSummary.alerts.length - idx}
                    </span>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      item.status === 'resumed'
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : item.status === 'acknowledged'
                        ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 animate-pulse'
                    }`}>
                      {item.status === 'resumed' ? '🟢 Resumed' : item.status === 'acknowledged' ? '⚪ Acknowledged' : '🔴 Idle Now'}
                    </span>
                  </div>

                  {/* Timeline: Start Time -> End Time -> Duration */}
                  <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">Start Time:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-100">
                        {formatClock(item.started_at)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">Resumed At:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {item.resumed_at ? formatClock(item.resumed_at) : 'Still Away'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">Idle Duration:</span>
                      <span className="font-black text-amber-600 dark:text-amber-400">
                        {durationFormatted}
                      </span>
                    </div>
                  </div>

                  {/* Active App when idle */}
                  {(item.active_process || item.active_window_title) && (
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                      <FiCpu className="text-blue-500 shrink-0" size={13} />
                      <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                        {item.active_process || 'Desktop Window'}
                      </span>
                      {item.active_window_title && (
                        <span className="truncate opacity-75">
                          — {item.active_window_title}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-400 font-medium">
            Records are synchronized in real-time with management oversight.
          </span>
          <button
            type="button"
            onClick={() => setShowIdleModal(false)}
            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

