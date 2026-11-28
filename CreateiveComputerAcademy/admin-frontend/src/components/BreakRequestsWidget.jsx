import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { FiCoffee, FiCheck, FiX, FiClock, FiUser, FiAlertCircle } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import Pusher from 'pusher-js';
import PrayerScheduleControl from './PrayerScheduleControl';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const formatTimer = (totalSeconds) => {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const BreakRequestsWidget = () => {
  const { currentUser } = useAuth();
  const [pendingRequests, setPendingRequests] = useState([]);
  const [activeBreaks, setActiveBreaks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const fetchBreaks = async () => {
    try {
      const res = await axios.get(`${API_BASE}api/breaks/get_live_breaks.php`);
      if (res.data.status === 'success') {
        setPendingRequests(res.data.data.pending_requests || []);
        setActiveBreaks(res.data.data.active_breaks || []);
      }
    } catch (err) {
      console.error('Error fetching live breaks in admin:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBreaks();

    let pusherInstance = null;
    try {
      pusherInstance = new Pusher('82a63711fed4b73bd74d', {
        cluster: 'ap2',
        forceTLS: true
      });

      const channel = pusherInstance.subscribe('staff-breaks');

      channel.bind('break-requested', (data) => {
        const isEmerg = Boolean(data.is_emergency || data.break_type === 'Emergency Break' || data.purpose === 'Emergency Gap');
        const purposeTag = data.purpose ? `[${data.purpose}] ` : '';
        const title = isEmerg ? `🚨 EMERGENCY BREAK: ${data.user_name}` : `☕ Break Request: ${data.user_name}`;
        toast.info(`${title} requested ${data.estimated_minutes}m ${purposeTag}${data.break_type} break!`, {
          duration: 9000
        });
        setPendingRequests((prev) => [data, ...prev.filter((p) => (p.id || p.break_id) !== (data.id || data.break_id))]);
      });

      channel.bind('break-approved', (data) => {
        setPendingRequests((prev) => prev.filter((p) => p.id !== data.break_id && p.id !== data.id));
        fetchBreaks();
      });

      channel.bind('break-rejected', (data) => {
        setPendingRequests((prev) => prev.filter((p) => p.id !== data.break_id && p.id !== data.id));
      });

      channel.bind('break-ended', (data) => {
        setActiveBreaks((prev) => prev.filter((b) => b.break_id !== data.break_id && b.id !== data.break_id));
      });

    } catch (e) {
      console.error('Pusher break listener error in admin:', e);
    }

    return () => {
      if (pusherInstance) {
        pusherInstance.unsubscribe('staff-breaks');
        pusherInstance.disconnect();
      }
    };
  }, []);

  const handleAction = async (breakId, action) => {
    setProcessingId(breakId);
    try {
      const res = await axios.post(`${API_BASE}api/breaks/manage_break_request.php`, {
        break_id: breakId,
        action: action,
        admin_id: currentUser?.id
      });

      if (res.data.status === 'success') {
        toast.success(res.data.message);
        setPendingRequests((prev) => prev.filter((p) => (p.id || p.break_id) !== breakId));
        fetchBreaks();
      } else {
        toast.error(res.data.message || 'Action failed');
      }
    } catch (err) {
      toast.error('Error processing break request');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return null;

  return (
    <div className="space-y-4 mb-6 animate-in fade-in slide-in-from-top-3 duration-300">
      
      {/* ── 0. Center Prayer Schedule & Master Control ── */}
      <PrayerScheduleControl />
      
      {/* ── 1. PENDING REQUESTS BANNER (HIGH PRIORITY) ── */}
      {pendingRequests.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-transparent border-2 border-amber-400/60 dark:border-amber-500/40 rounded-3xl p-5 shadow-lg shadow-amber-500/5">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-amber-500 animate-ping" />
              <h3 className="text-sm font-extrabold text-amber-900 dark:text-amber-200 uppercase tracking-wider flex items-center gap-2">
                <FiCoffee size={16} className="text-amber-600 dark:text-amber-400" />
                <span>Pending Staff Break Requests ({pendingRequests.length})</span>
              </h3>
            </div>
            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/20 px-3 py-0.5 rounded-full border border-amber-500/30">
              Needs Approval
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingRequests.map((req) => {
              const bId = req.id || req.break_id;
              const isProcessing = processingId === bId;
              const isEmergency = Boolean(req.is_emergency || req.break_type === 'Emergency Break' || req.purpose === 'Emergency Gap');

              return (
                <div
                  key={bId}
                  className={`border rounded-2xl p-4 shadow-sm flex flex-col justify-between gap-3 ${
                    isEmergency
                      ? 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700/80 ring-2 ring-rose-500/20'
                      : 'bg-white dark:bg-slate-900 border-amber-300/80 dark:border-amber-500/30'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-8 h-8 rounded-full font-black text-xs flex items-center justify-center shrink-0 ${
                          isEmergency ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300' : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                        }`}>
                          {req.name?.[0] || req.user_name?.[0] || 'S'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 dark:text-white truncate">
                            {req.name || req.user_name || `Staff #${req.user_id}`}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium truncate">
                            {req.employee_code || 'Staff'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {isEmergency && (
                          <span className="px-2 py-0.5 rounded-lg bg-rose-600 text-white text-[9px] font-black uppercase tracking-wider animate-pulse">
                            🚨 EMERGENCY GAP
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold ${
                          isEmergency
                            ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                            : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                        }`}>
                          {req.estimated_minutes || 30} mins
                        </span>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                      <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 flex-wrap">
                        <span>Type:</span>
                        <span className={isEmergency ? "text-rose-600 dark:text-rose-400 font-black" : "text-amber-600 dark:text-amber-400"}>
                          {req.break_type}
                        </span>
                        {req.purpose && (
                          <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black uppercase ${
                            isEmergency ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300' : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                          }`}>
                            {req.purpose}
                          </span>
                        )}
                      </p>
                      {req.reason && (
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium italic mt-1 line-clamp-2">
                          "{req.reason}"
                        </p>
                      )}
                      {isEmergency && (
                        <div className="mt-2 p-2 rounded-xl bg-rose-100/70 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-[10px] text-rose-800 dark:text-rose-200 leading-tight">
                          ⚠️ <strong>Work Shift Gap:</strong> Staff has 0 mangoes. If approved, this time will be recorded as an approved shift gap (deficit), NOT deducted from mango bank.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleAction(bId, 'reject')}
                      className="flex-1 py-2 px-3 rounded-xl border border-rose-200 dark:border-rose-800/60 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-400 text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <FiX size={14} />
                      <span>Reject</span>
                    </button>
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleAction(bId, 'approve')}
                      className={`flex-1 py-2 px-3 rounded-xl text-white text-xs font-extrabold shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50 ${
                        isEmergency
                          ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                          : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                      }`}
                    >
                      <FiCheck size={14} />
                      <span>{isEmergency ? 'Approve (Work Gap)' : 'Approve'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 2. ACTIVE BREAKS IN PROGRESS ── */}
      {activeBreaks.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h3 className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Currently on Break ({activeBreaks.length})</span>
            </h3>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {activeBreaks.map((b) => (
              <div
                key={b.break_id || b.id}
                className="inline-flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-xs shadow-2xs"
              >
                <div className="w-7 h-7 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 font-black text-xs flex items-center justify-center">
                  {b.name?.[0] || 'S'}
                </div>
                <div>
                  <p className="font-extrabold text-slate-800 dark:text-white leading-tight">
                    {b.name || `Staff #${b.user_id}`}
                  </p>
                  <p className={`text-[10px] font-bold mt-0.5 ${b.is_emergency || b.break_type === 'Emergency Break' ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    {b.is_emergency || b.break_type === 'Emergency Break' ? '🚨 EMERGENCY GAP • ' : ''}
                    {b.purpose ? `${b.purpose} • ` : ''}{b.break_type} Break {b.start_time ? `• Started ${b.start_time.split(' ')[1]?.slice(0, 5)}` : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default BreakRequestsWidget;
