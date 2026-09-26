import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { FiCoffee, FiSquare, FiClock, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import Pusher from 'pusher-js';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const formatTimer = (totalSeconds) => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const ActiveBreakWidget = ({ onBreakChange }) => {
  const { currentUser } = useAuth();
  const [activeBreak, setActiveBreak] = useState(null);
  const [pendingRequest, setPendingRequest] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [ending, setEnding] = useState(false);
  const [loading, setLoading] = useState(true);

  // 1. Fetch current status
  const fetchStatus = async () => {
    if (!currentUser?.id || currentUser.id === 2) {
      setLoading(false);
      return;
    }

    try {
      const res = await axios.get(`${API_BASE}api/breaks/get_active_break.php?user_id=${currentUser.id}`);
      if (res.data.status === 'success') {
        const { active_break, pending_request, server_time } = res.data.data;
        setActiveBreak(active_break);
        setPendingRequest(pending_request);

        if (active_break && active_break.start_time) {
          const sTime = new Date(active_break.start_time.replace(' ', 'T')).getTime();
          const srvTime = server_time ? new Date(server_time.replace(' ', 'T')).getTime() : Date.now();
          const diff = Math.max(0, Math.floor((srvTime - sTime) / 1000));
          setElapsedSeconds(diff);
        }

        if (onBreakChange) {
          onBreakChange({ activeBreak: active_break, pendingRequest: pending_request });
        }
      }
    } catch (err) {
      console.error('Error fetching active break status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [currentUser]);

  // 2. Pusher Real-time listener
  useEffect(() => {
    if (!currentUser?.id || currentUser.id === 2) return;

    let pusherInstance = null;
    try {
      pusherInstance = new Pusher('82a63711fed4b73bd74d', {
        cluster: 'ap2',
        forceTLS: true
      });

      const userChannel = pusherInstance.subscribe(`user-channel-${currentUser.id}`);
      const generalChannel = pusherInstance.subscribe('staff-breaks');

      const handleApproved = (data) => {
        if (data.user_id === currentUser.id) {
          toast.success('🎉 Your break request has been approved! Break timer started.');
          setActiveBreak({
            id: data.break_id,
            break_type: data.break_type,
            start_time: data.start_time,
            reason: data.reason
          });
          setPendingRequest(null);
          setElapsedSeconds(0);
          if (onBreakChange) onBreakChange({ activeBreak: data, pendingRequest: null });
        }
      };

      const handleRejected = (data) => {
        if (data.user_id === currentUser.id) {
          toast.error('❌ Your break request was declined by Admin.');
          setPendingRequest(null);
          if (onBreakChange) onBreakChange({ activeBreak: null, pendingRequest: null });
        }
      };

      const handleEnded = (data) => {
        if (data.user_id === currentUser.id) {
          setActiveBreak(null);
          setPendingRequest(null);
          if (onBreakChange) onBreakChange({ activeBreak: null, pendingRequest: null });
        }
      };

      userChannel.bind('break-approved', handleApproved);
      userChannel.bind('break-rejected', handleRejected);
      userChannel.bind('break-ended', handleEnded);

      generalChannel.bind('break-approved', handleApproved);
      generalChannel.bind('break-rejected', handleRejected);
      generalChannel.bind('break-ended', handleEnded);

    } catch (e) {
      console.error('Pusher break listener error:', e);
    }

    return () => {
      if (pusherInstance) {
        pusherInstance.unsubscribe(`user-channel-${currentUser.id}`);
        pusherInstance.unsubscribe('staff-breaks');
        pusherInstance.disconnect();
      }
    };
  }, [currentUser]);

  // 3. Second-by-second live timer
  useEffect(() => {
    let interval;
    if (activeBreak) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeBreak]);

  // 4. Handle End Break
  const handleEndBreak = async () => {
    if (!activeBreak) return;
    setEnding(true);

    try {
      const res = await axios.post(`${API_BASE}api/breaks/end_break.php`, {
        user_id: currentUser.id,
        break_id: activeBreak.id
      });

      if (res.data.status === 'success') {
        toast.success(`✅ Break ended! Total time away: ${res.data.duration || 0} minutes.`);
        setActiveBreak(null);
        setPendingRequest(null);
        if (onBreakChange) onBreakChange({ activeBreak: null, pendingRequest: null });
      } else {
        toast.error(res.data.message || 'Failed to end break.');
      }
    } catch (err) {
      toast.error('Error ending break.');
    } finally {
      setEnding(false);
    }
  };

  // Guard: User ID 2 excluded or no active/pending state
  if (currentUser?.id === 2) return null;
  if (loading) return null;
  if (!activeBreak && !pendingRequest) return null; // Clean hidden state!

  return (
    <div className="w-full animate-in fade-in slide-in-from-top-4 duration-300">
      
      {/* ── CASE 1: ACTIVE BREAK RUNNING ── */}
      {activeBreak && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 p-5 md:p-6 text-white shadow-xl shadow-orange-600/20 border border-white/20">
          
          {/* Animated pulsing background effect */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl animate-pulse pointer-events-none" />
          <div className="absolute -bottom-12 left-1/3 w-40 h-40 bg-black/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-5">
            
            {/* Left info */}
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shrink-0 shadow-lg">
                <FiCoffee size={28} className="animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-white border border-white/30 backdrop-blur-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    Break Active
                  </span>
                  <span className="text-xs font-bold text-white/80">
                    {activeBreak.break_type}
                  </span>
                </div>
                <h4 className="text-lg sm:text-xl font-black tracking-tight mt-0.5 text-white">
                  {activeBreak.break_type} Break In Progress
                </h4>
                {activeBreak.reason && (
                  <p className="text-xs text-white/80 font-medium italic truncate max-w-md mt-0.5">
                    "{activeBreak.reason}"
                  </p>
                )}
              </div>
            </div>

            {/* Right Timer & End Button */}
            <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto bg-black/15 backdrop-blur-md border border-white/10 p-2.5 sm:p-3 rounded-2xl">
              <div className="px-3 text-left sm:text-right">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-white/70">
                  Elapsed Time
                </p>
                <p className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white drop-shadow-sm">
                  {formatTimer(elapsedSeconds)}
                </p>
              </div>

              <button
                type="button"
                onClick={handleEndBreak}
                disabled={ending}
                className="px-5 py-3 rounded-xl bg-white hover:bg-slate-100 text-rose-600 font-extrabold text-xs sm:text-sm shadow-lg shadow-black/20 hover:shadow-xl active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60 shrink-0"
              >
                {ending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-rose-600/30 border-t-rose-600 rounded-full animate-spin" />
                    <span>Ending...</span>
                  </>
                ) : (
                  <>
                    <FiSquare size={16} className="fill-rose-600" />
                    <span>End Break & Resume</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── CASE 2: PENDING APPROVAL ── */}
      {!activeBreak && pendingRequest && (
        <div className="rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/30 p-4 flex items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <FiClock size={20} className="animate-spin" style={{ animationDuration: '4s' }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase text-amber-700 dark:text-amber-300">
                  ⏳ Break Request Pending
                </span>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  • {pendingRequest.break_type} ({pendingRequest.estimated_minutes || 30} mins)
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-0.5">
                Waiting for Admin approval. Your timer will begin once approved.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-500/20 px-3 py-1 rounded-full shrink-0">
            Pending...
          </span>
        </div>
      )}

    </div>
  );
};

export default ActiveBreakWidget;
