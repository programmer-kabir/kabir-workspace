import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
  FiCoffee, FiClock, FiCalendar, FiCheckCircle, FiXCircle,
  FiAlertCircle, FiFilter, FiSearch, FiChevronRight, FiChevronDown, FiPlus, FiArrowDownRight,
  FiX, FiRotateCcw, FiSliders
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import ActiveBreakWidget from '../components/ActiveBreakWidget';
import BreakWidget from '../components/BreakWidget';
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

const getBreakBadge = (type) => {
  switch (type?.toLowerCase()) {
    case 'mango break':
    case 'mango overtime':
      return { label: 'Mango OT Break', icon: '🥭', color: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60' };
    case 'mango full day':
      return { label: 'Mango Full Day', icon: '🥭', color: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60' };
    case 'tiffin':
      return { label: 'Tiffin Break', icon: '🥪', color: 'bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800/60' };
    case 'emergency':
      return { label: 'Emergency', icon: '🚨', color: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60' };
    case 'prayer':
      return { label: 'Prayer', icon: '🕌', color: 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800/60' };
    case 'medical':
      return { label: 'Medical', icon: '🏥', color: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60' };
    case 'tea/snack':
      return { label: 'Tea / Snack', icon: '☕', color: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60' };
    default:
      return { label: type || 'Personal', icon: '🚶', color: 'bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800/60' };
  }
};

const getStatusBadge = (status) => {
  switch (status?.toLowerCase()) {
    case 'active':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Active Now</span>
        </span>
      );
    case 'pending':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          <span>Pending Approval</span>
        </span>
      );
    case 'rejected':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-700/60 shadow-2xs">
          <span>✕</span>
          <span>Rejected</span>
        </span>
      );
    case 'approved':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300 border border-teal-300 dark:border-teal-700/60 shadow-2xs">
          <span>✓</span>
          <span>Approved / Leave</span>
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200/90 dark:border-slate-700/80 shadow-2xs">
          <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">✓</span>
          <span>Completed</span>
        </span>
      );
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
    } catch (e) { }

    return () => {
      if (pusherInstance) pusherInstance.disconnect();
    };
  }, [fetchHistory, currentUser]);

  const filteredBreaks = breaks.filter((b) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.break_type?.toLowerCase().includes(q) ||
      b.purpose?.toLowerCase().includes(q) ||
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

        {(!currentUser?.is_manual_break && currentUser?.has_tiffin_break !== 0 && currentUser?.has_tiffin_break !== false && !(Number(currentUser?.allocated_break_minutes) > 0 && currentUser?.has_tiffin_break === 0)) && (
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

      {/* ── Active Break Live Widget (For Scheduled Tiffin Staff) ── */}
      <ActiveBreakWidget onBreakChange={() => fetchHistory()} />

      {/* ── Manual Break Widget (For Manual Allocated Break Staff) ── */}
      {(currentUser?.is_manual_break || currentUser?.has_tiffin_break === 0 || currentUser?.has_tiffin_break === false || (Number(currentUser?.allocated_break_minutes) > 0 && currentUser?.has_tiffin_break === 0)) && (
        <div className="mb-6">
          <BreakWidget />
        </div>
      )}

      {/* ── Tiffin Timer ── */}
      <TiffinTimer />

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        {/* Today's Total Break */}
        <div className="relative overflow-hidden rounded-xl bg-white/95 dark:bg-slate-900/95 p-5 border border-slate-200/90 dark:border-slate-800/90 shadow-2xs hover:shadow-md hover:border-amber-400/40 dark:hover:border-amber-500/40 transition-all duration-300 group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-orange-500 opacity-90" />
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Today's Total Break
              </p>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight tabular-nums">
                {fmtMins(summary.today_minutes)}
              </h3>
              <p className="text-[11px] text-amber-600 dark:text-amber-400 font-bold inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span>Across all breaks today</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/15 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
              <FiClock size={22} />
            </div>
          </div>
        </div>

        {/* Total Logged Breaks */}
        <div className="relative overflow-hidden rounded-xl bg-white/95 dark:bg-slate-900/95 p-5 border border-slate-200/90 dark:border-slate-800/90 shadow-2xs hover:shadow-md hover:border-emerald-400/40 dark:hover:border-emerald-500/40 transition-all duration-300 group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-500 opacity-90" />
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Total Logged Breaks
              </p>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight tabular-nums">
                {summary.total_breaks}
              </h3>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>All time history records</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/15 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
              <FiCheckCircle size={22} />
            </div>
          </div>
        </div>

        {/* Cumulative Break Time */}
        <div className="relative overflow-hidden rounded-xl bg-white/95 dark:bg-slate-900/95 p-5 border border-slate-200/90 dark:border-slate-800/90 shadow-2xs hover:shadow-md hover:border-blue-400/40 dark:hover:border-blue-500/40 transition-all duration-300 group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-90" />
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Cumulative Break Time
              </p>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight tabular-nums">
                {fmtMins(summary.total_minutes)}
              </h3>
              <p className="text-[11px] text-blue-600 dark:text-blue-400 font-bold inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span>Filtered time sum</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/15 to-indigo-500/10 dark:from-blue-500/20 dark:to-indigo-500/15 border border-blue-500/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
              <FiCoffee size={22} />
            </div>
          </div>
        </div>

      </div>

      {/* ── Filters & Search Bar ── */}
      <div className="relative overflow-hidden rounded-3xl bg-white/95 dark:bg-slate-900/95 p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800/90 shadow-sm shadow-slate-100/40 dark:shadow-none space-y-3.5 backdrop-blur-md">

        {/* Header / Identity Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <FiFilter size={15} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white">
                  Filter & Search Records
                </span>
                {(Boolean(searchQuery || dateFilter || typeFilter !== 'all' || statusFilter !== 'all')) && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-black border border-amber-500/30">
                    Active Filters
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                Find breaks by keyword, date, category or status
              </p>
            </div>
          </div>


        </div>

        {/* Controls Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-2.5">

          {/* Search Input */}
          <div className="xl:col-span-5 relative flex items-center">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none">
              <FiSearch size={16} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by break type, reason, date..."
              className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-slate-50/90 dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/90 text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/25 focus:border-amber-500 dark:focus:border-amber-400 transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                title="Clear search"
              >
                <FiX size={12} />
              </button>
            )}
          </div>

          {/* Date filter */}
          <div className="xl:col-span-2 relative flex items-center rounded-2xl bg-slate-50/90 dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/90 px-3 py-2 focus-within:ring-2 focus-within:ring-amber-500/25 focus-within:border-amber-500 dark:focus-within:border-amber-400 transition-all shadow-2xs">
            <FiCalendar className="text-amber-500 dark:text-amber-400 shrink-0 mr-2" size={15} />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer dark:[color-scheme:dark] dark:[&::-webkit-calendar-picker-indicator]:filter dark:[&::-webkit-calendar-picker-indicator]:brightness-0 dark:[&::-webkit-calendar-picker-indicator]:invert"
            />
            {dateFilter && (
              <button
                type="button"
                onClick={() => setDateFilter('')}
                className="ml-1 w-4 h-4 rounded-full bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-300 hover:bg-rose-200 flex items-center justify-center cursor-pointer transition-colors"
                title="Clear date"
              >
                <FiX size={10} />
              </button>
            )}
          </div>

          {/* Break Type selector */}
          <div className="xl:col-span-3 relative flex items-center rounded-2xl bg-slate-50/90 dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/90 pl-3 pr-2.5 py-2 focus-within:ring-2 focus-within:ring-amber-500/25 focus-within:border-amber-500 dark:focus-within:border-amber-400 transition-all shadow-2xs">
            <FiCoffee className="text-orange-500 dark:text-orange-400 shrink-0 mr-2" size={15} />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer pr-5 appearance-none"
            >
              <option value="all" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">All Break Types</option>
              <option value="Mango Break" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">🥭 Mango OT Break</option>
              <option value="Mango Full Day" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">🥭 Mango Full Day</option>
              <option value="Tiffin" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">🥪 Tiffin Break</option>
              <option value="Personal" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">🚶 Personal Break</option>
              <option value="Emergency" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">🚨 Emergency</option>
              <option value="Prayer" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">🕌 Prayer</option>
              <option value="Medical" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">🏥 Medical</option>
              <option value="Tea/Snack" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">☕ Tea / Snack</option>
            </select>
            <FiChevronDown className="text-slate-400 pointer-events-none absolute right-3" size={13} />
          </div>

          {/* Status selector */}
          <div className="xl:col-span-2 relative flex items-center rounded-2xl bg-slate-50/90 dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/90 pl-3 pr-2.5 py-2 focus-within:ring-2 focus-within:ring-amber-500/25 focus-within:border-amber-500 dark:focus-within:border-amber-400 transition-all shadow-2xs">
            <FiCheckCircle className="text-emerald-500 dark:text-emerald-400 shrink-0 mr-2" size={15} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer pr-5 appearance-none"
            >
              <option value="all" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">All Statuses</option>
              <option value="Completed" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">✓ Completed</option>
              <option value="Approved" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">✓ Approved / Leave</option>
              <option value="Active" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">⚡ Active Now</option>
              <option value="Pending" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">⏳ Pending</option>
              <option value="Rejected" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">✕ Rejected</option>
            </select>
            <FiChevronDown className="text-slate-400 pointer-events-none absolute right-3" size={13} />
          </div>

        </div>

        {/* Quick Preset Filter Chips */}
        <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mr-1 flex items-center gap-1">
              <FiSliders size={11} className="text-amber-500" />
              <span>Presets:</span>
            </span>

            {[
              { id: 'all', label: 'All Breaks', icon: '📋' },
              { id: 'Tiffin', label: 'Tiffin', icon: '🥪' },
              { id: 'Mango Break', label: 'Mango OT', icon: '🥭' },
              { id: 'Mango Full Day', label: 'Full Day', icon: '🥭' },
              { id: 'Emergency', label: 'Emergency', icon: '🚨' },
              { id: 'Prayer', label: 'Prayer', icon: '🕌' },
            ].map((tab) => {
              const isSelected = typeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTypeFilter(tab.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all duration-150 inline-flex items-center gap-1.5 cursor-pointer ${isSelected
                    ? 'bg-amber-500 text-white shadow-xs shadow-amber-500/30 font-black scale-[1.02]'
                    : 'bg-slate-100/90 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200/90 dark:hover:bg-slate-700/80 border border-slate-200/70 dark:border-slate-700/60'
                    }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>


        </div>

      </div>

      {/* ── Break History Log Table ── */}
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
            {(Boolean(searchQuery || dateFilter || typeFilter !== 'all' || statusFilter !== 'all')) && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setDateFilter('');
                  setTypeFilter('all');
                  setStatusFilter('all');
                }}
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
                <span>Showing <strong className="text-slate-700 dark:text-slate-200 font-black">{filteredBreaks.length}</strong> of <strong className="text-slate-700 dark:text-slate-200 font-black">{breaks.length}</strong> logged breaks</span>
                {(Boolean(searchQuery || dateFilter || typeFilter !== 'all' || statusFilter !== 'all')) && (
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
