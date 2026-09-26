import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { FiCoffee, FiSquare, FiAlertCircle, FiLock } from 'react-icons/fi';
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

const BreakLockOverlay = () => {
  const { currentUser } = useAuth();
  const [activeBreak, setActiveBreak] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [ending, setEnding] = useState(false);

  const fetchStatus = async () => {
    if (!currentUser?.id || currentUser.id === 2) return;
    try {
      const res = await axios.get(`${API_BASE}api/breaks/get_active_break.php?user_id=${currentUser.id}`);
      if (res.data.status === 'success') {
        const { active_break, server_time } = res.data.data;
        setActiveBreak(active_break);
        if (active_break && active_break.start_time) {
          const sTime = new Date(active_break.start_time.replace(' ', 'T')).getTime();
          const srvTime = server_time ? new Date(server_time.replace(' ', 'T')).getTime() : Date.now();
          setElapsedSeconds(Math.max(0, Math.floor((srvTime - sTime) / 1000)));
        }
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchStatus();

    let pusherInstance = null;
    try {
      pusherInstance = new Pusher('82a63711fed4b73bd74d', {
        cluster: 'ap2',
        forceTLS: true
      });

      const userChannel = pusherInstance.subscribe(`user-channel-${currentUser?.id}`);
      const genChannel = pusherInstance.subscribe('staff-breaks');

      const handleApproved = (data) => {
        if (data.user_id === currentUser?.id) {
          setActiveBreak({
            id: data.break_id,
            break_type: data.break_type,
            start_time: data.start_time,
            reason: data.reason
          });
          setElapsedSeconds(0);
        }
      };

      const handleEnded = (data) => {
        if (data.user_id === currentUser?.id) {
          setActiveBreak(null);
        }
      };

      userChannel.bind('break-approved', handleApproved);
      userChannel.bind('break-ended', handleEnded);
      genChannel.bind('break-approved', handleApproved);
      genChannel.bind('break-ended', handleEnded);

    } catch (err) {}

    return () => {
      if (pusherInstance) pusherInstance.disconnect();
    };
  }, [currentUser]);

  useEffect(() => {
    let interval;
    if (activeBreak) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeBreak]);

  const handleEndBreak = async () => {
    if (!activeBreak) return;
    setEnding(true);
    try {
      const res = await axios.post(`${API_BASE}api/breaks/end_break.php`, {
        user_id: currentUser.id,
        break_id: activeBreak.id
      });
      if (res.data.status === 'success') {
        toast.success(`✅ Break ended! Total away time: ${res.data.duration || 0} mins.`);
        setActiveBreak(null);
      } else {
        toast.error(res.data.message || 'Failed to end break');
      }
    } catch (e) {
      toast.error('Error ending break');
    } finally {
      setEnding(false);
    }
  };

  // Rule 1: User ID 2 is completely excluded
  if (currentUser?.id === 2) return null;

  // Rule 2: No active break -> no lock
  if (!activeBreak) return null;

  // Rule 3: Tiffin break is specifically exempted from lock!
  if (activeBreak.break_type?.toLowerCase() === 'tiffin') return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 border-2 border-orange-500/40 dark:border-orange-500/30 rounded-[2.5rem] p-6 sm:p-8 max-w-lg w-full text-center shadow-2xl shadow-orange-500/10 animate-in zoom-in-95 duration-200 relative overflow-hidden">
        
        {/* Glow ambient */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Lock / Coffee Icon */}
        <div className="mx-auto w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/30 mb-4 animate-bounce">
          <FiCoffee size={32} />
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30 mb-2">
          <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
          <span>{activeBreak.break_type} Break Active</span>
        </div>

        {/* Title & Reason */}
        <h3 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white tracking-tight">
          You Are Currently On Break
        </h3>
        
        {activeBreak.reason && (
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 italic mt-1 bg-slate-100 dark:bg-slate-800/80 px-4 py-1.5 rounded-xl inline-block max-w-sm truncate">
            "{activeBreak.reason}"
          </p>
        )}

        {/* Live Timer Clock */}
        <div className="my-5 p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-0.5">
            Elapsed Break Time
          </p>
          <p className="text-3xl sm:text-4xl font-black font-mono text-orange-600 dark:text-orange-400 drop-shadow-sm">
            {formatTimer(elapsedSeconds)}
          </p>
        </div>

        {/* Notice */}
        <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 text-left text-xs text-amber-800 dark:text-amber-300 mb-6">
          <FiAlertCircle size={18} className="shrink-0 text-amber-600 dark:text-amber-400" />
          <p>
            Please end your break to unlock the workspace and resume working.
          </p>
        </div>

        {/* End Break Action Button */}
        <button
          type="button"
          onClick={handleEndBreak}
          disabled={ending}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-600 hover:to-rose-700 text-white font-black text-sm sm:text-base shadow-xl shadow-orange-500/25 active:scale-95 transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60"
        >
          {ending ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Ending Break...</span>
            </>
          ) : (
            <>
              <FiSquare size={18} className="fill-white" />
              <span>End Break & Resume Work</span>
            </>
          )}
        </button>

      </div>
    </div>
  );
};

export default BreakLockOverlay;
