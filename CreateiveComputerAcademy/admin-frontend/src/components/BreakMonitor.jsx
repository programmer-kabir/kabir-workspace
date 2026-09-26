import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { FiCoffee, FiSquare, FiAlertCircle, FiCheckCircle, FiCheck, FiX, FiClock } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import Pusher from 'pusher-js';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const BreakMonitor = () => {
  const { currentUser } = useAuth();
  const [breaks, setBreaks] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [serverTime, setServerTime] = useState(new Date().getTime());
  const [now, setNow] = useState(new Date().getTime());
  const [processingId, setProcessingId] = useState(null);

  const fetchLiveBreaks = async () => {
    try {
      const res = await axios.get(`${API_BASE}api/breaks/get_live_breaks.php`);
      if (res.data.status === 'success') {
        const activeList = res.data.data.active_breaks || (Array.isArray(res.data.data) ? res.data.data : []);
        const pendingList = res.data.data.pending_requests || [];
        setBreaks(activeList);
        setPendingRequests(pendingList);
        if (res.data.server_time || res.data.data.server_time) {
          const sTime = new Date(res.data.server_time || res.data.data.server_time).getTime();
          setServerTime(sTime);
          setNow(sTime);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveBreaks();
    const intervalId = setInterval(fetchLiveBreaks, 25000); // Poll every 25s as fallback

    let pusherInstance = null;
    try {
      pusherInstance = new Pusher('82a63711fed4b73bd74d', {
        cluster: 'ap2',
        forceTLS: true
      });

      const channel = pusherInstance.subscribe('staff-breaks');

      channel.bind('break-requested', (data) => {
        toast.info(`☕ Break Request: ${data.user_name} requested ${data.estimated_minutes}m ${data.break_type} break!`, {
          duration: 6000
        });
        fetchLiveBreaks();
      });

      channel.bind('break-approved', () => fetchLiveBreaks());
      channel.bind('break-rejected', () => fetchLiveBreaks());
      channel.bind('break-ended', () => fetchLiveBreaks());

    } catch (e) {
      console.error('Pusher break listener error in BreakMonitor:', e);
    }

    return () => {
      clearInterval(intervalId);
      if (pusherInstance) {
        pusherInstance.unsubscribe('staff-breaks');
        pusherInstance.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    const tickId = setInterval(() => {
      setNow((prev) => prev + 1000);
    }, 1000);
    return () => clearInterval(tickId);
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
        fetchLiveBreaks();
      } else {
        toast.error(res.data.message || 'Action failed');
      }
    } catch (err) {
      toast.error('Error processing break request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleForceEnd = async (breakId) => {
    if (!window.confirm("Are you sure you want to force end this break?")) return;
    try {
      const res = await axios.post(`${API_BASE}api/breaks/end_break.php`, {
        break_id: breakId
      });
      if (res.data.status === 'success') {
        toast.success('Break ended.');
        fetchLiveBreaks();
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      toast.error('Error ending break.');
    }
  };

  if (loading) return null;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex flex-col h-full overflow-hidden transition-colors">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center">
            <FiCoffee size={16} />
          </span>
          Live Break Monitor
        </h3>
        <div className="flex items-center gap-2">
          {pendingRequests.length > 0 && (
            <span className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 px-2.5 py-0.5 rounded-full text-xs font-black animate-pulse">
              {pendingRequests.length} Pending
            </span>
          )}
          <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase">
            {breaks.length} Active
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-3 min-h-[250px] custom-scrollbar">
        
        {/* ── 1. Pending Break Requests ── */}
        {pendingRequests.length > 0 && (
          <div className="space-y-2 pb-2 border-b border-slate-100 dark:border-slate-700/80">
            <p className="text-[11px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              <span>Pending Requests</span>
            </p>
            {pendingRequests.map((req) => {
              const bId = req.id || req.break_id;
              const isProcessing = processingId === bId;

              return (
                <div
                  key={bId}
                  className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-white truncate">
                        {req.name || req.user_name || `Staff #${req.user_id}`}
                      </span>
                      <span className="px-2 py-0.2 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                        {req.break_type} ({req.estimated_minutes || 30}m)
                      </span>
                    </div>
                    {req.reason && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 italic mt-0.5 truncate max-w-xs">
                        "{req.reason}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleAction(bId, 'reject')}
                      className="p-1.5 px-2.5 rounded-xl border border-rose-200 dark:border-rose-800 bg-white dark:bg-slate-800 hover:bg-rose-50 text-rose-600 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      title="Reject Request"
                    >
                      <FiX size={13} />
                      <span>Reject</span>
                    </button>
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleAction(bId, 'approve')}
                      className="p-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1 cursor-pointer active:scale-95 disabled:opacity-50"
                      title="Approve Request"
                    >
                      <FiCheck size={13} />
                      <span>Approve</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── 2. Active Breaks ── */}
        {breaks.length === 0 && pendingRequests.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 py-10">
            <FiCheckCircle size={40} className="mb-2 text-slate-300 dark:text-slate-600" />
            <p className="font-medium text-sm">No one is currently on break.</p>
          </div>
        ) : (
          breaks.map((b) => {
            const startTime = new Date(b.start_time).getTime();
            const diff = Math.max(0, Math.floor((now - startTime) / 1000));
            const elapsedMinutes = Math.floor(diff / 60);
            const limit = parseInt(b.allocated_break_minutes) || 60;
            const isOvertime = elapsedMinutes >= limit;
            
            const m = String(elapsedMinutes).padStart(2, '0');
            const s = String(diff % 60).padStart(2, '0');

            return (
              <div
                key={b.break_id || b.id}
                className={`p-4 rounded-2xl border transition-colors flex items-center justify-between gap-4 ${
                  isOvertime
                    ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800'
                    : 'bg-slate-50 dark:bg-slate-700/50 border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 shrink-0">
                    {b.profile_picture ? (
                      <img src={`${API_BASE}${b.profile_picture}`} alt={b.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 font-bold uppercase text-xs">
                        {b.name?.charAt(0) || 'S'}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{b.name}</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold tracking-wider truncate">
                      {b.break_type} {b.reason ? `• "${b.reason}"` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className={`font-mono text-base sm:text-lg font-black ${isOvertime ? 'text-rose-600 dark:text-rose-400 animate-pulse' : 'text-slate-700 dark:text-slate-300'}`}>
                    {m}:{s}
                    {isOvertime && <FiAlertCircle className="inline ml-1 mb-1" size={14} />}
                  </div>
                  <button 
                    onClick={() => handleForceEnd(b.break_id || b.id)}
                    title="Force End Break"
                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-rose-500 dark:hover:bg-rose-600 hover:text-white text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
                  >
                    <FiSquare size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default BreakMonitor;
