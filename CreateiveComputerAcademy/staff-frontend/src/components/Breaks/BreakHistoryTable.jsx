import React from 'react';
import { FiCoffee, FiClock, FiRotateCcw } from 'react-icons/fi';

export const fmtMins = (mins) => {
  if (!mins && mins !== 0) return '—';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m} mins`;
  return m === 0 ? `${h} hrs` : `${h}h ${m}m`;
};

const formatTime12 = (datetimeStr) => {
  if (!datetimeStr) return '—';
  try {
    const timePart = datetimeStr.includes(' ') ? datetimeStr.split(' ')[1] : datetimeStr;
    const [h, m] = timePart.split(':');
    const d = new Date();
    d.setHours(parseInt(h, 10), parseInt(m, 10));
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  } catch (e) {
    return datetimeStr;
  }
};

const parseDateDisplay = (dateStr) => {
  if (!dateStr) return { dayOfWeek: '', dayNumber: '', monthStr: '', formatted: dateStr || '', raw: dateStr || '' };
  try {
    const clean = dateStr.includes(' ') ? dateStr.split(' ')[0] : dateStr;
    const d = new Date(clean + 'T00:00:00');
    if (isNaN(d.getTime())) return { dayOfWeek: '', dayNumber: '', monthStr: '', formatted: clean, raw: dateStr };
    const dayOfWeek = d.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNumber = d.getDate();
    const monthStr = d.toLocaleDateString('en-US', { month: 'short' });
    const formatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return { dayOfWeek, dayNumber, monthStr, formatted, raw: clean };
  } catch {
    return { dayOfWeek: '', dayNumber: '', monthStr: '', formatted: dateStr, raw: dateStr };
  }
};

const BREAK_BADGES = {
  'mango break': { label: 'Mango OT Break', icon: '🥭', color: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60' },
  'mango overtime': { label: 'Mango OT Break', icon: '🥭', color: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60' },
  'mango full day': { label: 'Mango Full Day', icon: '🥭', color: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60' },
  'tiffin': { label: 'Tiffin Break', icon: '🥪', color: 'bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800/60' },
  'emergency': { label: 'Emergency', icon: '🚨', color: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60' },
  'prayer': { label: 'Prayer', icon: '🕌', color: 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800/60' },
  'medical': { label: 'Medical', icon: '🏥', color: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60' },
  'tea/snack': { label: 'Tea / Snack', icon: '☕', color: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60' },
};

const getBreakBadge = (type) =>
  BREAK_BADGES[type?.toLowerCase()] || {
    label: type || 'Personal',
    icon: '🚶',
    color: 'bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800/60',
  };

const STATUS_CONFIG = {
  active: { cls: 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60 font-black', dot: 'w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse', text: 'Active Now' },
  pending: { cls: 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700/60 font-bold', dot: 'w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse', text: 'Pending Approval' },
  rejected: { cls: 'bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700/60 font-bold', symbol: '✕', text: 'Rejected' },
  approved: { cls: 'bg-teal-50 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300 border-teal-300 dark:border-teal-700/60 font-bold', symbol: '✓', text: 'Approved / Leave' },
};

const getStatusBadge = (status) => {
  const cfg = STATUS_CONFIG[status?.toLowerCase()];
  if (!cfg) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200/90 dark:border-slate-700/80 shadow-2xs">
        <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">✓</span>
        <span>Completed</span>
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border shadow-2xs ${cfg.cls}`}>
      {cfg.dot ? <span className={cfg.dot} /> : <span>{cfg.symbol}</span>}
      <span>{cfg.text}</span>
    </span>
  );
};

const BreakHistoryTable = ({
  loading,
  filteredBreaks,
  totalBreaksCount,
  hasActiveFilters,
  onClearFilters,
}) => {
  return (
    <div className="bg-white/95 dark:bg-slate-900/95 rounded-xl border border-slate-200/90 dark:border-slate-800/90 shadow-2xs overflow-hidden backdrop-blur-md">
      {loading ? (
        <div className="p-16 flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-4 border-slate-200 dark:border-slate-800 border-t-amber-500 rounded-full animate-spin" />
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading Break Records...</p>
        </div>
      ) : filteredBreaks.length === 0 ? (
        <div className="p-16 text-center flex flex-col items-center justify-center text-slate-400">
          <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-slate-300 dark:text-slate-600 mb-3 border border-slate-200/80 dark:border-slate-700/60 shadow-2xs">
            <FiCoffee size={32} />
          </div>
          <h4 className="text-base font-black text-slate-800 dark:text-slate-200">No Break Records Found</h4>
          <p className="text-xs text-slate-400 max-w-sm mt-1">
            There are no logged breaks matching your selected filters or search terms.
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="mt-4 px-4 py-2 rounded-2xl text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all inline-flex items-center gap-1.5 cursor-pointer"
            >
              <FiRotateCcw size={13} />
              <span>Clear All Filters</span>
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/95 dark:bg-slate-800/80 border-b border-slate-200/90 dark:border-slate-800 text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-400">
                <th className="py-4 px-5">Date</th>
                <th className="py-4 px-5">Break Type</th>
                <th className="py-4 px-5">Time Window</th>
                <th className="py-4 px-5">Duration</th>
                <th className="py-4 px-5">Reason / Details</th>
                <th className="py-4 px-5">Status</th>
                <th className="py-4 px-5">Approved By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 text-xs">
              {filteredBreaks.map((item) => {
                const badge = getBreakBadge(item.break_type);
                const dateObj = parseDateDisplay(item.date);
                const isToday = item.date === new Date().toISOString().split('T')[0];

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-amber-500/[0.03] dark:hover:bg-slate-800/40 transition-colors duration-150"
                  >
                    {/* Date */}
                    <td className="py-3.5 px-5 font-bold text-slate-800 dark:text-slate-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 flex flex-col items-center justify-center text-center shrink-0 shadow-2xs">
                          <span className="text-[9px] font-extrabold uppercase text-slate-500 dark:text-slate-400 leading-none">
                            {dateObj.dayOfWeek || 'DAY'}
                          </span>
                          <span className="text-xs font-black text-slate-800 dark:text-slate-100 leading-none mt-0.5">
                            {dateObj.dayNumber || '--'}
                          </span>
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                            <span>{dateObj.formatted || item.date}</span>
                            {isToday && (
                              <span className="px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-black border border-blue-500/20">
                                Today
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                            {item.date}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Break Type Badge */}
                    <td className="py-3.5 px-5">
                      <div className="flex flex-col gap-1 items-start">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black border shadow-2xs ${badge.color}`}>
                          <span>{badge.icon}</span>
                          <span>{badge.label}</span>
                        </span>
                        {item.purpose && item.purpose !== item.break_type && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            🎯 {item.purpose}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Time Window */}
                    <td className="py-3.5 px-5">
                      {item.start_time ? (
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 text-xs font-mono text-slate-700 dark:text-slate-200">
                          <FiClock className="text-slate-400 dark:text-slate-500 shrink-0" size={12} />
                          <span>{formatTime12(item.start_time)}</span>
                          <span className="text-slate-400 dark:text-slate-500 font-sans">→</span>
                          <span className={item.end_time ? 'font-semibold' : 'text-emerald-600 dark:text-emerald-400 font-black animate-pulse'}>
                            {item.end_time ? formatTime12(item.end_time) : 'Ongoing'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-xs">Not started yet</span>
                      )}
                    </td>

                    {/* Duration & Tiffin Impact */}
                    <td className="py-3.5 px-5">
                      <div className="flex flex-col gap-1 items-start">
                        <span className="font-black text-slate-900 dark:text-white text-xs sm:text-sm">
                          {fmtMins(item.duration_minutes)}
                        </span>
                        {item.break_type === 'Tiffin' && Number(item.tiffin_delta_minutes) > 0 && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-black border border-emerald-500/20 dark:border-emerald-800 inline-flex items-center gap-1 shadow-2xs">
                            <span>🥭</span>
                            <span>+{item.tiffin_delta_minutes}m Saved</span>
                          </span>
                        )}
                        {item.break_type === 'Tiffin' && Number(item.tiffin_delta_minutes) < 0 && (
                          <span className="px-2 py-0.5 rounded-md bg-rose-500/10 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-[10px] font-black border border-rose-500/20 dark:border-rose-800 inline-flex items-center gap-1 shadow-2xs">
                            <span>⚡</span>
                            <span>{item.tiffin_delta_minutes}m Over</span>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Reason / Details */}
                    <td className="py-3.5 px-5 text-slate-600 dark:text-slate-300 max-w-xs">
                      {item.reason ? (
                        <span title={item.reason} className="italic text-xs block truncate bg-slate-50 dark:bg-slate-800/50 px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-slate-700/50">
                          "{item.reason}"
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600 font-mono text-xs">—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-5">
                      {getStatusBadge(item.status)}
                    </td>

                    {/* Approved By */}
                    <td className="py-3.5 px-5 text-slate-500 dark:text-slate-400">
                      {item.approved_by_name ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200/80 dark:border-slate-700">
                          <span>👤</span>
                          <span>{item.approved_by_name}</span>
                        </span>
                      ) : item.break_type === 'Tiffin' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100/70 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-[11px] font-medium border border-slate-200/60 dark:border-slate-700/50">
                          <span>🤖</span>
                          <span>System Auto</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600 font-mono text-xs">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Table Footer Bar */}
          <div className="px-5 py-3.5 bg-slate-50/90 dark:bg-slate-800/60 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <span>Showing <strong className="text-slate-700 dark:text-slate-200 font-black">{filteredBreaks.length}</strong> of <strong className="text-slate-700 dark:text-slate-200 font-black">{totalBreaksCount}</strong> logged breaks</span>
              {hasActiveFilters && (
                <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-black">
                  Filtered
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Mango Saved (Green)</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Over-Break (Red)</span>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BreakHistoryTable;
