import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FiCoffee, FiPlay, FiSquare, FiAlertCircle } from 'react-icons/fi';

const BreakWidget = () => {
  const { currentUser } = useAuth();
  const [activeBreak, setActiveBreak] = useState(null);
  const [allocatedMinutes, setAllocatedMinutes] = useState(60);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [totalBreakMinutesToday, setTotalBreakMinutesToday] = useState(0);
  const [loading, setLoading] = useState(true);
  const [breakType, setBreakType] = useState('Tiffin');

  // Fetch active break on mount
  useEffect(() => {
    if (!currentUser?.id) return;
    const fetchActiveBreak = async () => {
      try {
        const res = await axios.post((import.meta.env.VITE_API_BASE_URL) + 'api/breaks/get_active_break.php', { user_id: currentUser.id });
        if (res.data.status === 'success') {
          setAllocatedMinutes(res.data.data.allocated_break_minutes);
          if (res.data.data.total_break_minutes_today !== undefined) {
            setTotalBreakMinutesToday(res.data.data.total_break_minutes_today);
          }
          if (res.data.data.active_break) {
            setActiveBreak(res.data.data.active_break);
            const serverTime = new Date(res.data.data.server_time).getTime();
            const startTime = new Date(res.data.data.active_break.start_time).getTime();
            const diff = Math.max(0, Math.floor((serverTime - startTime) / 1000));
            setElapsedSeconds(diff);
          }
        }
      } catch (error) {
        console.error("Error fetching break data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchActiveBreak();
  }, [currentUser]);

  // Timer effect
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
      const res = await axios.post((import.meta.env.VITE_API_BASE_URL) + 'api/breaks/start_break.php', {
        user_id: currentUser.id,
        break_type: breakType
      });
      if (res.data.status === 'success') {
        setActiveBreak(res.data.data);
        setElapsedSeconds(0);
      } else {
        alert(res.data.message);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleEndBreak = async () => {
    try {
      const res = await axios.post((import.meta.env.VITE_API_BASE_URL) + 'api/breaks/end_break.php', {
        user_id: currentUser.id
      });
      if (res.data.status === 'success') {
        setActiveBreak(null);
        setElapsedSeconds(0);
        // Refresh the total today
        const refreshRes = await axios.post((import.meta.env.VITE_API_BASE_URL) + 'api/breaks/get_active_break.php', { user_id: currentUser.id });
        if (refreshRes.data.status === 'success' && refreshRes.data.data.total_break_minutes_today !== undefined) {
            setTotalBreakMinutesToday(refreshRes.data.data.total_break_minutes_today);
        }
      } else {
        alert(res.data.message);
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return null;

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
            {/* Live Timer Display */}
            <div className="mb-8 relative">
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
              className="relative overflow-hidden w-full py-4 bg-gradient-to-r from-rose-600 to-rose-500 text-white font-black rounded-2xl shadow-[0_4px_14px_0_rgba(225,29,72,0.39)] hover:shadow-[0_6px_20px_rgba(225,29,72,0.23)] hover:-translate-y-1 transition-all flex items-center justify-center gap-2 text-lg uppercase tracking-wider group/btn"
            >
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover/btn:animate-[shimmer_1.5s_infinite]"></div>
              <FiSquare size={20} className="relative z-10" /> <span className="relative z-10">End Break</span>
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
                <option value="Tiffin">🥪 Tiffin Break</option>
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
              className="relative overflow-hidden w-full py-4 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-black rounded-2xl shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.23)] hover:-translate-y-1 transition-all flex items-center justify-center gap-2 text-lg uppercase tracking-wider group/btn"
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
