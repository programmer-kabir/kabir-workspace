import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FiCoffee, FiPlay, FiSquare, FiAlertCircle, FiRefreshCw } from 'react-icons/fi';
import { API_BASE } from '../utils/api';

const BreakWidget = () => {
  const { currentUser } = useAuth();
  const storageKey = currentUser?.id ? `cca_desktop_break_${currentUser.id}` : null;

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

  const fetchActiveBreak = useCallback(async () => {
    if (!currentUser?.id) return;
    try {
      const res = await axios.get(`${API_BASE}api/breaks/get_active_break.php?user_id=${currentUser.id}&t=${Date.now()}`);
      
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
      const res = await axios.post(`${API_BASE}api/breaks/start_break.php`, {
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
        const msg = res.data.message || '';
        if (msg.includes('already exists') || msg.includes('active break')) {
          await fetchActiveBreak();
        } else {
          alert(msg);
        }
      }
    } catch (error) {
      console.error("Failed to start break:", error);
      await fetchActiveBreak();
    }
  };

  const handleEndBreak = async () => {
    setEnding(true);
    try {
      const res = await axios.post(`${API_BASE}api/breaks/end_break.php`, {
        user_id: currentUser.id,
        break_id: activeBreak?.id
      });

      if (res.data.status === 'success') {
        setActiveBreak(null);
        setElapsedSeconds(0);
        if (storageKey) {
          localStorage.removeItem(storageKey);
        }
        await fetchActiveBreak();
      } else {
        alert(res.data.message || 'Failed to end break');
      }
    } catch (error) {
      console.error("Failed to end break:", error);
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
  
  const isOvertime = elapsedMinutes >= allocatedMinutes;
  const isWarning = elapsedMinutes >= allocatedMinutes - 10 && !isOvertime;

  return (
    <div className={`group bg-slate-900 rounded-3xl shadow-lg border ${isOvertime ? 'border-rose-500/50' : isWarning ? 'border-amber-400/50' : 'border-slate-800'} p-6 flex flex-col items-center justify-center relative overflow-hidden transition-all duration-300`}>
      <div className="relative z-10 w-full flex flex-col items-center text-center">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 shadow-inner ${isOvertime ? 'bg-rose-500/20 text-rose-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
          <FiCoffee size={28} />
        </div>
        
        <h3 className="text-xl font-black text-white tracking-tight mb-0.5">Break Tracker</h3>
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[11px] mb-4">
          Limit: {allocatedMinutes}m &bull; Taken Today: {totalBreakMinutesToday}m
        </p>

        {activeBreak ? (
          <div className="w-full max-w-sm flex flex-col items-center">
            <span className="px-3 py-1 mb-2 rounded-full bg-indigo-950/60 text-indigo-400 text-xs font-bold uppercase tracking-wider border border-indigo-800/40">
              {activeBreak.break_type || 'Tiffin'} Break in progress
            </span>

            <div className="mb-4 relative">
              <div className={`text-5xl font-black font-mono tracking-tighter ${isOvertime ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-white'} relative z-10`}>
                {timeString}
              </div>
            </div>

            <button 
              onClick={handleEndBreak}
              disabled={ending}
              className="w-full py-3 bg-gradient-to-r from-rose-600 to-rose-500 text-white font-black rounded-xl hover:from-rose-500 hover:to-rose-400 transition flex items-center justify-center gap-2 text-sm uppercase tracking-wider cursor-pointer disabled:opacity-75"
            >
              <FiSquare size={16} /> <span>{ending ? 'Ending Break...' : 'End Break'}</span>
            </button>

            <button
              onClick={handleForceReset}
              className="mt-2 text-[10px] text-slate-500 hover:text-rose-400 transition cursor-pointer underline flex items-center gap-1"
            >
              <FiRefreshCw size={10} /> Force Reset Break
            </button>
          </div>
        ) : (
          <div className="w-full max-w-sm flex flex-col gap-3">
            <div className="relative">
              <select 
                value={breakType} 
                onChange={e => setBreakType(e.target.value)}
                className="w-full appearance-none bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-xs font-bold text-slate-200 outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="Tiffin">🥪 Tiffin Break (Standard Quota)</option>
                <option value="Mango Break">🥭 Mango Break (Overtime Bank)</option>
                <option value="Prayer">🕌 Prayer Break</option>
                <option value="Personal">☕ Personal Break</option>
                <option value="Other">✨ Other</option>
              </select>
            </div>
            
            <button 
              onClick={handleStartBreak}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-black rounded-xl hover:from-indigo-500 hover:to-indigo-400 transition flex items-center justify-center gap-2 text-sm uppercase tracking-wider cursor-pointer"
            >
              <FiPlay size={16} /> <span>Start Break</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BreakWidget;
