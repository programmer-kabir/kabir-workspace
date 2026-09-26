import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
  FiCoffee, FiClock, FiCalendar, FiCheckCircle, FiXCircle,
  FiAlertCircle, FiFilter, FiSearch, FiChevronRight, FiPlus, FiArrowDownRight
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import ActiveBreakWidget from '../components/ActiveBreakWidget';
import BreakRequestModal from '../components/BreakRequestModal';
import TiffinTimer from '../components/TiffinTimer';
import Pusher from 'pusher-js';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const fmtMins = (mins) => {
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
    d.setHours(parseInt(h), parseInt(m));
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  } catch (e) {
    return datetimeStr;
  }
};

const getBreakBadge = (type) => {
  switch (type?.toLowerCase()) {
    case 'tiffin':
      return { label: 'Tiffin Break', icon: '🥪', color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30' };
    case 'emergency':
      return { label: 'Emergency', icon: '🚨', color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30' };
    case 'prayer':
      return { label: 'Prayer', icon: '🕌', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' };
    case 'medical':
      return { label: 'Medical', icon: '🏥', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30' };
    case 'tea/snack':
      return { label: 'Tea / Snack', icon: '☕', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30' };
    default:
      return { label: type || 'Personal', icon: '🚶', color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/30' };
  }
};

const getStatusBadge = (status) => {
  switch (status?.toLowerCase()) {
    case 'active':
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 animate-pulse"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active Now</span>;
    case 'pending':
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">⏳ Pending Approval</span>;
    case 'rejected':
      return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">❌ Rejected</span>;
    default:
      return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">✓ Completed</span>;
  }
};

const Breaks = () => {
  const { currentUser } = useAuth();
  const [breaks, setBreaks] = useState([]);
  const [summary, setSummary] = useState({ total_breaks: 0, total_minutes: 0, today_minutes: 0 });
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filters
  const [dateFilter, setDateFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchHistory = useCallback(async () => {
    if (!currentUser?.id) return;
    try {
      setLoading(true);
      const params = { user_id: currentUser.id };
      if (dateFilter) params.date = dateFilter;
      if (typeFilter !== 'all') params.break_type = typeFilter;
      if (statusFilter !== 'all') params.status = statusFilter;

      const res = await axios.post(`${API_BASE}api/breaks/get_break_history.php`, params);
      if (res.data.status === 'success') {
        setBreaks(res.data.data.breaks || []);
        setSummary(res.data.data.summary || { total_breaks: 0, total_minutes: 0, today_minutes: 0 });
      }
    } catch (err) {
      console.error('Failed to fetch break history:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser, dateFilter, typeFilter, statusFilter]);

  useEffect(() => {
    fetchHistory();

    let pusherInstance = null;
    try {
      pusherInstance = new Pusher('82a63711fed4b73bd74d', {
        cluster: 'ap2',
        forceTLS: true
      });
      const channel = pusherInstance.subscribe(`user-channel-${currentUser?.id}`);
      channel.bind('break-approved', () => fetchHistory());
      channel.bind('break-rejected', () => fetchHistory());
      channel.bind('break-ended', () => fetchHistory());
    } catch (e) {}

    return () => {
      if (pusherInstance) pusherInstance.disconnect();
    };
  }, [fetchHistory, currentUser]);

  const filteredBreaks = breaks.filter((b) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.break_type?.toLowerCase().includes(q) ||
      b.reason?.toLowerCase().includes(q) ||
      b.date?.includes(q) ||
      b.approved_by_name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 pb-12">
      
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <FiCoffee size={20} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Breaks & Time-Off Log
              </h1>
              <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
                Track daily tiffin, personal breaks, and emergency time-off history.
              </p>
            </div>
          </div>
        </div>

        {currentUser?.id !== 2 && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer shrink-0"
          >
            <FiPlus size={16} />
            <span>Request New Break</span>
          </button>
        )}
      </div>

      {/* ── Active Break Live Widget ── */}
      <ActiveBreakWidget onBreakChange={() => fetchHistory()} />

      {/* ── Tiffin Timer ── */}
      <TiffinTimer />

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Today's Total Break */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Today's Total Break
            </p>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white mt-1">
              {fmtMins(summary.today_minutes)}
            </h3>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
              Across all breaks today
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <FiClock size={24} />
          </div>
        </div>

        {/* Total Break Logs Recorded */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Total Logged Breaks
            </p>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white mt-1">
              {summary.total_breaks}
            </h3>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
              All time history records
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <FiCheckCircle size={24} />
          </div>
        </div>

        {/* Cumulative Break Minutes */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Cumulative Break Time
            </p>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white mt-1">
              {fmtMins(summary.total_minutes)}
            </h3>
            <p className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold mt-0.5">
              Filtered time sum
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <FiCoffee size={24} />
          </div>
        </div>

      </div>

      {/* ── Filters & Search Bar ── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by break type, reason, or date..."
              className="w-full pl-10 pr-4 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
            />
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Date filter */}
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
            />
            {dateFilter && (
              <button
                type="button"
                onClick={() => setDateFilter('')}
                className="px-2.5 py-2 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
              >
                Clear Date
              </button>
            )}

            {/* Type selector */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
            >
              <option value="all">All Break Types</option>
              <option value="Tiffin">🥪 Tiffin</option>
              <option value="Personal">🚶 Personal</option>
              <option value="Emergency">🚨 Emergency</option>
              <option value="Prayer">🕌 Prayer</option>
              <option value="Medical">🏥 Medical</option>
              <option value="Tea/Snack">☕ Tea/Snack</option>
            </select>

            {/* Status selector */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="Completed">✓ Completed</option>
              <option value="Active">Active Now</option>
              <option value="Pending">Pending</option>
              <option value="Rejected">Rejected</option>
            </select>

          </div>
        </div>
      </div>

      {/* ── Break History Log Table ── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-4 border-slate-200 dark:border-slate-800 border-t-amber-500 rounded-full animate-spin" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Break Records...</p>
          </div>
        ) : filteredBreaks.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center text-slate-400">
            <div className="w-16 h-16 rounded-3xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-600 mb-3">
              <FiCoffee size={32} />
            </div>
            <h4 className="text-base font-bold text-slate-700 dark:text-slate-300">No Break Records Found</h4>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              There are no logged breaks matching your selected filters or search terms.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6">Break Type</th>
                  <th className="py-4 px-6">Time Window</th>
                  <th className="py-4 px-6">Duration</th>
                  <th className="py-4 px-6">Reason / Details</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Approved By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {filteredBreaks.map((item) => {
                  const badge = getBreakBadge(item.break_type);
                  const isToday = item.date === new Date().toISOString().split('T')[0];

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      
                      {/* Date */}
                      <td className="py-4 px-6 font-bold text-slate-800 dark:text-slate-200">
                        <div className="flex items-center gap-2">
                          <span>{item.date}</span>
                          {isToday && (
                            <span className="px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-[10px] font-black border border-blue-200 dark:border-blue-900">
                              Today
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Break Type Badge */}
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-extrabold border ${badge.color}`}>
                          <span>{badge.icon}</span>
                          <span>{badge.label}</span>
                        </span>
                      </td>

                      {/* Time Window */}
                      <td className="py-4 px-6 font-mono text-slate-600 dark:text-slate-300">
                        {item.start_time ? (
                          <span>
                            {formatTime12(item.start_time)}
                            {item.end_time ? ` → ${formatTime12(item.end_time)}` : ' (Ongoing)'}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Not started yet</span>
                        )}
                      </td>

                      {/* Duration */}
                      <td className="py-4 px-6">
                        <span className="font-extrabold text-slate-800 dark:text-slate-100">
                          {fmtMins(item.duration_minutes)}
                        </span>
                      </td>

                      {/* Reason / Details */}
                      <td className="py-4 px-6 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                        {item.reason ? (
                          <span title={item.reason} className="italic">"{item.reason}"</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6">
                        {getStatusBadge(item.status)}
                      </td>

                      {/* Approved By */}
                      <td className="py-4 px-6 text-slate-500 dark:text-slate-400">
                        {item.approved_by_name ? (
                          <span className="font-bold text-slate-700 dark:text-slate-200">
                            {item.approved_by_name}
                          </span>
                        ) : item.break_type === 'Tiffin' ? (
                          <span className="text-[11px] text-slate-400">System Auto</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* ── Request Modal ── */}
      <BreakRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchHistory()}
      />

    </div>
  );
};

export default Breaks;
