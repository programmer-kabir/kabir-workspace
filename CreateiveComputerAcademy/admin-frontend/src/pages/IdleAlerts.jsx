// admin-frontend/src/pages/IdleAlerts.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Pusher from 'pusher-js';
import {
  FiClock, FiAlertTriangle, FiCheckCircle, FiSearch, FiRefreshCw,
  FiMonitor, FiMessageSquare, FiUser, FiCalendar, FiCpu, FiAlertOctagon
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/';

const formatSeconds = (totalSeconds) => {
  if (!totalSeconds || isNaN(totalSeconds)) return '5m 00s';
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hrs}h ${remMins}m`;
  }
  return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
};

const formatTimeAgo = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSecs = Math.floor((now - date) / 1000);
  if (diffInSecs < 60) return 'Just now';
  if (diffInSecs < 3600) return `${Math.floor(diffInSecs / 60)}m ago`;
  if (diffInSecs < 86400) return `${Math.floor(diffInSecs / 3600)}h ago`;
  return `${Math.floor(diffInSecs / 86400)}d ago`;
};

const formatClockTime = (dateString) => {
  if (!dateString) return '--:--';
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const IdleAlerts = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState({
    currently_idle_count: 0,
    today_alerts_count: 0,
    today_idle_minutes: 0,
    affected_staff_today: 0
  });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'idle', 'resumed', 'acknowledged'
  const [dateFilter, setDateFilter] = useState('today'); // 'today', 'yesterday', 'week', 'all'
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState(Date.now());

  const pusherRef = useRef(null);

  // Live seconds ticker for currently idle items
  useEffect(() => {
    const ticker = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(ticker);
  }, []);

  const fetchAlerts = async (silent = false) => {
    if (!silent) setLoading(true);
    setIsRefreshing(true);
    try {
      const url = `${API_BASE}api/admin/screen_monitor/get_idle_alerts.php?status=${statusFilter}&date=${dateFilter}&search=${encodeURIComponent(searchQuery)}`;
      const res = await axios.get(url);
      if (res.data.status === 'success') {
        setAlerts(res.data.data.alerts || []);
        if (res.data.data.stats) {
          setStats(res.data.data.stats);
        }
      }
    } catch (err) {
      console.error('Failed to fetch idle alerts:', err);
      if (!silent) toast.error('Failed to load inactivity alerts');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [statusFilter, dateFilter]);

  // Real-time Pusher listener for instant alert arrival
  useEffect(() => {
    const pusher = new Pusher('82a63711fed4b73bd74d', {
      cluster: 'ap2',
      forceTLS: true
    });
    pusherRef.current = pusher;

    const channel = pusher.subscribe('screen-admin-channel');

    channel.bind('screen-signal', (data) => {
      if (!data) return;
      const { signal_type, payload } = data;

      if (signal_type === 'staff-idle') {
        const staffName = payload?.name || 'Staff member';
        toast.warning(`⚠️ Inactivity Alert: ${staffName} has been idle for 5+ minutes!`, {
          duration: 6000
        });
        fetchAlerts(true);
      } else if (signal_type === 'staff-active') {
        fetchAlerts(true);
      } else if (signal_type === 'idle-alert-acknowledged') {
        const ackId = payload?.alert_id;
        if (ackId) {
          setAlerts(prev => prev.map(a => a.id === ackId ? {
            ...a,
            status: 'acknowledged',
            idle_seconds: payload?.idle_seconds || a.idle_seconds,
            resumed_at: payload?.resumed_at || a.resumed_at || new Date().toISOString()
          } : a));
        }
      } else if (signal_type === 'idle-alerts-all-acknowledged') {
        fetchAlerts(true);
      }
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
      pusher.disconnect();
    };
  }, []);

  const [isSubmittingAckAll, setIsSubmittingAckAll] = useState(false);

  const unacknowledgedCount = useMemo(() => {
    return alerts.filter(a => a.status !== 'acknowledged').length;
  }, [alerts]);

  // Handle bulk acknowledge all
  const handleAcknowledgeAll = async () => {
    if (unacknowledgedCount === 0) return;
    setIsSubmittingAckAll(true);
    try {
      // Optimistically freeze all unacknowledged alerts
      setAlerts(prev => prev.map(a => {
        if (a.status === 'acknowledged') return a;
        let frozenSeconds = a.idle_seconds || 300;
        if (a.status === 'idle' && a.started_at) {
          const dateStr = typeof a.started_at === 'string' ? a.started_at.replace(' ', 'T') : a.started_at;
          const startMs = new Date(dateStr).getTime();
          if (!isNaN(startMs) && startMs > 0) {
            const elapsed = Math.max(0, Math.floor((currentTime - startMs) / 1000));
            frozenSeconds = (Number(a.idle_seconds) || 300) + elapsed;
          }
        }
        return {
          ...a,
          status: 'acknowledged',
          idle_seconds: frozenSeconds,
          resumed_at: a.resumed_at || new Date().toISOString()
        };
      }));

      const res = await axios.post(`${API_BASE}api/admin/screen_monitor/acknowledge_idle_alert.php`, {
        mark_all: true,
        admin_id: currentUser?.id
      });

      if (res.data.status === 'success') {
        toast.success(res.data.message || 'All alerts marked as acknowledged');
      }
    } catch (err) {
      console.error('Failed to acknowledge all alerts:', err);
      toast.error('Failed to acknowledge alerts');
      fetchAlerts(true);
    } finally {
      setIsSubmittingAckAll(false);
    }
  };

  // Handle acknowledge
  const handleAcknowledge = async (alertId) => {
    try {
      // Find current live display seconds for this alert before acknowledging
      const target = alerts.find(a => a.id === alertId);
      let frozenSeconds = target?.idle_seconds || 300;
      if (target?.status === 'idle' && target?.started_at) {
        const dateStr = typeof target.started_at === 'string' ? target.started_at.replace(' ', 'T') : target.started_at;
        const startMs = new Date(dateStr).getTime();
        if (!isNaN(startMs) && startMs > 0) {
          const elapsed = Math.max(0, Math.floor((currentTime - startMs) / 1000));
          frozenSeconds = (Number(target.idle_seconds) || 300) + elapsed;
        }
      }

      // Optimistic update
      setAlerts(prev => prev.map(a => a.id === alertId ? {
        ...a,
        status: 'acknowledged',
        idle_seconds: frozenSeconds,
        resumed_at: a.resumed_at || new Date().toISOString()
      } : a));

      const res = await axios.post(`${API_BASE}api/admin/screen_monitor/acknowledge_idle_alert.php`, {
        alert_id: alertId,
        admin_id: currentUser?.id
      });

      if (res.data.status === 'success') {
        toast.success('Alert marked as acknowledged');
      }
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
      toast.error('Failed to acknowledge alert');
      fetchAlerts(true);
    }
  };

  // Filtered alerts
  const filteredAlerts = useMemo(() => {
    return alerts.filter(a => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        a.staff_name?.toLowerCase().includes(q) ||
        a.staff_email?.toLowerCase().includes(q) ||
        a.department_name?.toLowerCase().includes(q) ||
        a.active_process?.toLowerCase().includes(q) ||
        a.active_window_title?.toLowerCase().includes(q)
      );
    });
  }, [alerts, searchQuery]);

  return (
    <div className="p-6 m mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold shadow-xs">
              <FiClock size={22} className="animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Staff Inactivity & Idle Alerts
              </h1>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium">
                Live monitoring & persistent audit log of staff workstations idle for 5+ minutes.
              </p>
            </div>
          </div>
        </div>

        {/* Top Controls */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            Live WebSocket Connected
          </div>

          <button
            onClick={() => fetchAlerts()}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <FiRefreshCw className={isRefreshing ? 'animate-spin text-blue-500' : ''} size={14} />
            Refresh
          </button>

          {unacknowledgedCount > 0 && (
            <button
              onClick={handleAcknowledgeAll}
              disabled={isSubmittingAckAll}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              title="Acknowledge all pending alerts at once"
            >
              <FiCheckCircle size={15} />
              Mark All Acknowledged ({unacknowledgedCount})
            </button>
          )}

          <button
            onClick={() => navigate('/screen-monitor')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all active:scale-95 cursor-pointer"
          >
            <FiMonitor size={15} />
            Live Screen Grid
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Currently Idle */}
        <div className={`p-5 rounded-2xl border transition-all ${stats.currently_idle_count > 0
            ? 'bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent border-rose-300 dark:border-rose-900/60 shadow-sm'
            : 'bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/80 shadow-xs'
          }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Currently Idle
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${stats.currently_idle_count > 0 ? 'bg-rose-500 text-white animate-bounce' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
              }`}>
              <FiAlertOctagon size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-3xl font-black ${stats.currently_idle_count > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-100'
              }`}>
              {stats.currently_idle_count}
            </span>
            <span className="text-xs font-medium text-slate-400">staff right now</span>
          </div>
        </div>

        {/* Card 2: Today's Incidents */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Incidents Today
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
              <FiAlertTriangle size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-800 dark:text-slate-100">
              {stats.today_alerts_count}
            </span>
            <span className="text-xs font-medium text-slate-400">times (5m+)</span>
          </div>
        </div>

        {/* Card 3: Total Idle Time Today */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Lost Time
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
              <FiClock size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-800 dark:text-slate-100">
              {stats.today_idle_minutes}
            </span>
            <span className="text-xs font-medium text-slate-400">minutes today</span>
          </div>
        </div>

        {/* Card 4: Affected Staff */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Affected Staff
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold">
              <FiUser size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-800 dark:text-slate-100">
              {stats.affected_staff_today}
            </span>
            <span className="text-xs font-medium text-slate-400">unique staff</span>
          </div>
        </div>
      </div>

      {/* Urgent Alert Banner (if currently idle staff exist) */}
      {stats.currently_idle_count > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-gradient-to-r from-rose-500/15 via-amber-500/15 to-transparent border border-rose-300 dark:border-rose-800 flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping shrink-0" />
            <div>
              <h4 className="text-sm font-black text-rose-700 dark:text-rose-400">
                Action Required: {stats.currently_idle_count} staff member(s) currently idle for over 5 minutes
              </h4>
              <p className="text-xs text-rose-600/80 dark:text-rose-400/80 mt-0.5">
                Inspect their live screen feed or send a quick check-in message to ensure they are on schedule.
              </p>
            </div>
          </div>
          <button
            onClick={() => { setStatusFilter('idle'); }}
            className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shrink-0 shadow-xs transition-all cursor-pointer"
          >
            View Idle Staff &rarr;
          </button>
        </motion.div>
      )}

      {/* Search and Filter Bar */}
      <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl overflow-x-auto">
          {[
            { id: 'all', label: 'All Alerts' },
            { id: 'idle', label: '🔴 Currently Idle' },
            { id: 'resumed', label: '🟢 Resumed' },
            { id: 'acknowledged', label: '⚪ Acknowledged' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${statusFilter === tab.id
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Date Filter & Search */}
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="pl-8 pr-8 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="all">All Time</option>
            </select>
            <FiCalendar className="absolute left-2.5 top-2.5 text-slate-400" size={13} />
          </div>

          <div className="relative flex-1 sm:w-64">
            <FiSearch className="absolute left-3 top-3 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Search staff, app, title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Alerts Grid / Table */}
      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center">
          <FiRefreshCw className="animate-spin text-blue-500 mb-3" size={32} />
          <p className="text-sm font-bold text-slate-500">Loading inactivity alerts...</p>
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="py-20 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-center p-8">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center mx-auto mb-4 text-slate-400">
            <FiCheckCircle size={32} className="text-emerald-500" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No Inactivity Alerts Found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
            {searchQuery
              ? 'No idle alerts match your current search criteria.'
              : 'All staff members are actively working or no 5+ minute inactivity events occurred in this period.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredAlerts.map(alert => {
              const isIdle = alert.status === 'idle';
              const isResumed = alert.status === 'resumed';
              const isAck = alert.status === 'acknowledged';

              // Live elapsed duration for currently idle records
              const baseIdleSeconds = Math.min(43200, Math.max(0, Number(alert.idle_seconds) || 300));
              let displaySeconds = baseIdleSeconds;

              if (isIdle && alert.started_at) {
                const dateStr = typeof alert.started_at === 'string' ? alert.started_at.replace(' ', 'T') : alert.started_at;
                const startMs = new Date(dateStr).getTime();
                if (!isNaN(startMs) && startMs > 0) {
                  const elapsedSinceTrigger = Math.max(0, Math.floor((currentTime - startMs) / 1000));
                  displaySeconds = Math.min(43200, baseIdleSeconds + elapsedSinceTrigger);
                }
              }

              return (
                <motion.div
                  key={alert.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`rounded-2xl p-5 border transition-all shadow-xs flex flex-col justify-between ${isIdle
                      ? 'bg-white dark:bg-slate-800 border-rose-300 dark:border-rose-800/80 ring-2 ring-rose-500/15'
                      : isResumed
                        ? 'bg-white dark:bg-slate-800/90 border-slate-200/90 dark:border-slate-700/90'
                        : 'bg-slate-50/80 dark:bg-slate-800/50 border-slate-200/60 dark:border-slate-700/60 opacity-85'
                    }`}
                >
                  {/* Top: Staff Info & Status Badge */}
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {alert.staff_avatar ? (
                          <img
                            src={`${API_BASE}${alert.staff_avatar}`}
                            alt={alert.staff_name}
                            className="w-11 h-11 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                            {alert.staff_name?.charAt(0)?.toUpperCase() || 'S'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 truncate">
                            {alert.staff_name}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {alert.staff_email || 'Staff Workstation'}
                          </p>
                          {alert.department_name && (
                            <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                              {alert.department_name}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="shrink-0">
                        {isIdle ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                            Idle Now
                          </span>
                        ) : isResumed ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <FiCheckCircle size={12} />
                            Resumed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            Acknowledged
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Duration & Inactivity Metrics */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 mb-3 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <FiClock size={13} className="text-amber-500" />
                          Idle Duration:
                        </span>
                        <span className={`font-black ${isIdle ? 'text-rose-600 dark:text-rose-400 font-mono text-sm' : 'text-slate-800 dark:text-slate-200'}`}>
                          {formatSeconds(displaySeconds)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-500 dark:text-slate-400">
                          Trigger Time:
                        </span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {formatClockTime(alert.started_at)} ({formatTimeAgo(alert.started_at)})
                        </span>
                      </div>

                      {alert.resumed_at && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-500 dark:text-slate-400">
                            Resumed At:
                          </span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {formatClockTime(alert.resumed_at)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Active Application / Window at time of idle */}
                    {(alert.active_process || alert.active_window_title) && (
                      <div className="mb-4">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Active Window When Idle:
                        </span>
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-100/70 dark:bg-slate-900/40 text-xs">
                          <FiCpu className="text-blue-500 shrink-0" size={14} />
                          <div className="min-w-0">
                            <span className="font-bold text-slate-700 dark:text-slate-200 block truncate">
                              {alert.active_process || 'Unknown application'}
                            </span>
                            {alert.active_window_title && (
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                                {alert.active_window_title}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bottom Actions */}
                  <div className="pt-3 border-t border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-2">
                    <button
                      onClick={() => navigate('/screen-monitor')}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-bold text-xs transition-colors cursor-pointer"
                      title="Inspect live screen stream"
                    >
                      <FiMonitor size={14} />
                      Inspect Screen
                    </button>

                    <button
                      onClick={() => navigate('/messages')}
                      className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/60 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
                      title="Send message to staff"
                    >
                      <FiMessageSquare size={14} />
                    </button>

                    {!isAck && (
                      <button
                        onClick={() => handleAcknowledge(alert.id)}
                        className="py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 font-bold text-xs transition-colors cursor-pointer"
                        title="Mark alert as acknowledged"
                      >
                        <FiCheckCircle size={14} />
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default IdleAlerts;
