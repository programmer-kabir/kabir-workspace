import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FiCoffee, FiPlay, FiSquare, FiAlertCircle, FiRefreshCw } from 'react-icons/fi';

const BreakWidget = () => {
  const { currentUser } = useAuth();
  const storageKey = currentUser?.id ? `cca_active_break_${currentUser.id}` : null;

  // Initialize from localStorage if present so timer does not disappear on reload
  const [activeBreak, setActiveBreak] = useState(() => {
    if (!storageKey) return null;
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [allocatedMinutes, setAllocatedMinutes] = useState(60);
  const [elapsedSeconds, setElapsedSeconds] = useState(() => {
    if (!storageKey) return 0;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.start_time) {
          const sTime = new Date(parsed.start_time.replace(' ', 'T')).getTime();
          return Math.max(0, Math.floor((Date.now() - sTime) / 1000));
        }
      }
    } catch {}
    return 0;
  });

  const [totalBreakMinutesToday, setTotalBreakMinutesToday] = useState(0);
  const [loading, setLoading] = useState(true);
  const [breakType, setBreakType] = useState('Tiffin');
  const [ending, setEnding] = useState(false);

  // Fetch active break from server on mount and keep in sync
  const fetchActiveBreak = useCallback(async () => {
    if (!currentUser?.id) return;
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
      // Support both GET with query param and POST for maximum compatibility
      const res = await axios.get(`${baseUrl}api/breaks/get_active_break.php?user_id=${currentUser.id}&t=${Date.now()}`);
      
      if (res.data.status === 'success' && res.data.data) {
        const d = res.data.data;
        if (d.allocated_break_minutes) {
          setAllocatedMinutes(d.allocated_break_minutes);
        }
        if (d.total_break_minutes_today !== undefined) {
          setTotalBreakMinutesToday(d.total_break_minutes_today);
        }

        if (d.active_break) {
          setActiveBreak(d.active_break);
          if (storageKey) {
            localStorage.setItem(storageKey, JSON.stringify(d.active_break));
          }
          const serverTime = d.server_time ? new Date(d.server_time.replace(' ', 'T')).getTime() : Date.now();
          const startTime = new Date(d.active_break.start_time.replace(' ', 'T')).getTime();
          const diff = Math.max(0, Math.floor((serverTime - startTime) / 1000));
          setElapsedSeconds(diff);
        } else {
          setActiveBreak(null);
          if (storageKey) {
            localStorage.removeItem(storageKey);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching break data:", error);
    } finally {
      setLoading(false);
    }
  }, [currentUser, storageKey]);

  useEffect(() => {
    fetchActiveBreak();
  }, [fetchActiveBreak]);

  // Timer tick effect
  useEffect(() => {
    let interval;
    if (activeBreak) {
      interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeBreak]);

  const handleStartBreak = async () => {
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const res = await axios.post(`${baseUrl}api/breaks/start_break.php`, {
        user_id: currentUser.id,
        break_type: breakType
      });

      if (res.data.status === 'success' && res.data.data) {
        const newBreak = res.data.data;
        setActiveBreak(newBreak);
        setElapsedSeconds(0);
        if (storageKey) {
          localStorage.setItem(storageKey, JSON.stringify(newBreak));
        }
      } else {
        // If an active break already exists on server, recover it into UI rather than getting stuck!
        const msg = res.data.message || '';
        if (msg.includes('already exists') || msg.includes('active break')) {
          await fetchActiveBreak();
        } else {
          alert(msg);
        }
      }
    } catch (error) {
      console.error("Failed to start break:", error);
      // Auto-check server status in case break was registered
      await fetchActiveBreak();
    }
  };

  const handleEndBreak = async () => {
    setEnding(true);
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const res = await axios.post(`${baseUrl}api/breaks/end_break.php`, {
        user_id: currentUser.id,
        break_id: activeBreak?.id
      });

      if (res.data.status === 'success') {
        setActiveBreak(null);
        setElapsedSeconds(0);
        if (storageKey) {
          localStorage.removeItem(storageKey);
        }
        // Refresh today's completed total
        await fetchActiveBreak();
      } else {
        alert(res.data.message || 'Failed to end break');
      }
    } catch (error) {
      console.error("Failed to end break:", error);
      // Fallback cleanup
      if (storageKey) localStorage.removeItem(storageKey);
      setActiveBreak(null);
      setElapsedSeconds(0);
      await fetchActiveBreak();
    } finally {
      setEnding(false);
    }
  };

  const handleForceReset = async () => {
    if (window.confirm("Are you sure you want to force reset and close any active break?")) {
      await handleEndBreak();
    }
  };

  if (loading && !activeBreak) return null;

  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  const remainingSeconds = elapsedSeconds % 60;
  const timeString = `${String(elapsedMinutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  
  // Determine states based on limit
  const isOvertime = elapsedMinutes >= allocatedMinutes;
  const isWarning = elapsedMinutes >= allocatedMinutes - 10 && !isOvertime;

  return (
    <div className={`group bg-white dark:bg-slate-800 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border ${isOvertime ? 'border-rose-500/50 dark:border-rose-500/50 shadow-rose-500/20' : isWarning ? 'border-amber-400/50 dark:border-amber-400/50' : 'border-slate-100 dark:border-slate-700'} p-8 flex flex-col items-center justify-center relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1`}>
      {/* Background Ambient Glow */}
      <div className={`absolute top-0 left-0 w-full h-full bg-gradient-to-br ${isOvertime ? 'from-rose-500/10 to-transparent animate-pulse' : 'from-indigo-500/5 to-transparent dark:from-indigo-500/10'} pointer-events-none opacity-50`}></div>
      
      <div className="relative z-10 w-full flex flex-col items-center text-center">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-inner ${isOvertime ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400' : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400'}`}>
          <FiCoffee size={32} />
        </div>
        
        <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight mb-1">Break Tracker</h3>
        <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-xs mb-6">
          Limit: {allocatedMinutes}m &bull; Taken Today: {totalBreakMinutesToday}m
        </p>

        {activeBreak ? (
          <div className="w-full max-w-sm flex flex-col items-center">
            {/* Break type indicator */}
            <span className="px-3 py-1 mb-3 rounded-full bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
              {activeBreak.break_type || 'Tiffin'} Break in progress
            </span>

            {/* Live Timer Display */}
            <div className="mb-6 relative">
              {isOvertime && (
                <div className="absolute -inset-4 bg-rose-500/20 rounded-full blur-xl animate-pulse"></div>
              )}
              <div className={`text-6xl font-black font-mono tracking-tighter ${isOvertime ? 'text-rose-600 dark:text-rose-400' : isWarning ? 'text-amber-500 dark:text-amber-400' : 'text-slate-800 dark:text-white'} relative z-10`}>
                {timeString}
              </div>
              {isOvertime && (
                <div className="absolute -top-2 -right-6 text-rose-500 animate-bounce">
                  <FiAlertCircle size={24} />
                </div>
              )}
            </div>

            <button 
              onClick={handleEndBreak}
              disabled={ending}
              className="relative overflow-hidden w-full py-4 bg-gradient-to-r from-rose-600 to-rose-500 text-white font-black rounded-2xl shadow-[0_4px_14px_0_rgba(225,29,72,0.39)] hover:shadow-[0_6px_20px_rgba(225,29,72,0.23)] hover:-translate-y-1 transition-all flex items-center justify-center gap-2 text-lg uppercase tracking-wider group/btn cursor-pointer disabled:opacity-75"
            >
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover/btn:animate-[shimmer_1.5s_infinite]"></div>
              <FiSquare size={20} className="relative z-10" /> <span className="relative z-10">{ending ? 'Ending Break...' : 'End Break'}</span>
            </button>

            <button
              onClick={handleForceReset}
              className="mt-3 text-[11px] text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 transition cursor-pointer underline flex items-center gap-1"
            >
              <FiRefreshCw size={11} /> Stuck or mismatch? Force Reset Break
            </button>
          </div>
        ) : (
          <div className="w-full max-w-sm flex flex-col gap-4">
            <div className="relative">
              <select 
                value={breakType} 
                onChange={e => setBreakType(e.target.value)}
                className="w-full appearance-none bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all cursor-pointer shadow-sm"
              >
                <option value="Tiffin">🥪 Tiffin Break (Standard Quota)</option>
                <option value="Mango Break">🥭 Mango Break (Deducts from Overtime Bank)</option>
                <option value="Prayer">🕌 Prayer Break</option>
                <option value="Personal">☕ Personal Break</option>
                <option value="Other">✨ Other</option>
              </select>
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                ▼
              </div>
            </div>
            
            <button 
              onClick={handleStartBreak}
              className="relative overflow-hidden w-full py-4 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-black rounded-2xl shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.23)] hover:-translate-y-1 transition-all flex items-center justify-center gap-2 text-lg uppercase tracking-wider group/btn cursor-pointer"
            >
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover/btn:animate-[shimmer_1.5s_infinite]"></div>
              <FiPlay size={20} className="relative z-10" /> <span className="relative z-10">Start Break</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BreakWidget;
