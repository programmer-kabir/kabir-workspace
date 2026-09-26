import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FiCheckCircle, FiClock, FiCoffee, FiAlertCircle } from 'react-icons/fi';

const HeaderShiftStatus = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [todayData, setTodayData] = useState(null);
  const [elapsed, setElapsed] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    if (!currentUser?.id) return;
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}api/attendance/get_attendance.php`, {
        user_id: currentUser.id
      });
      if (res.data?.status === 'success') {
        setTodayData(res.data.today || null);
      }
    } catch {
      // silent fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, [currentUser]);

  // Live timer tick
  useEffect(() => {
    if (!todayData?.check_in || todayData?.check_out) return;

    const parseTime = (str) => {
      if (!str) return null;
      const parts = str.match(/(\d+):(\d+)(?::(\d+))?\s*(AM|PM)?/i);
      if (!parts) return null;
      let h = parseInt(parts[1], 10);
      let m = parseInt(parts[2], 10);
      let s = parts[3] ? parseInt(parts[3], 10) : 0;
      const ampm = parts[4] ? parts[4].toUpperCase() : null;
      if (ampm === 'PM' && h < 12) h += 12;
      if (ampm === 'AM' && h === 12) h = 0;
      return { h, m, s };
    };

    const updateTimer = () => {
      const inTime = parseTime(todayData.check_in);
      if (!inTime) return;

      const now = new Date();
      const inDate = new Date();
      inDate.setHours(inTime.h, inTime.m, inTime.s, 0);

      let diffSec = Math.floor((now - inDate) / 1000);
      if (diffSec < 0) diffSec = 0;

      const hrs = Math.floor(diffSec / 3600);
      const mins = Math.floor((diffSec % 3600) / 60);
      const secs = diffSec % 60;
      setElapsed(`${hrs}h ${mins < 10 ? '0' : ''}${mins}m ${secs < 10 ? '0' : ''}${secs}s`);
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [todayData]);

  if (loading || !currentUser) return null;

  // Case 1: Active Shift in Progress
  if (todayData?.check_in && !todayData?.check_out) {
    return (
      <button
        type="button"
        onClick={() => navigate('/attendance')}
        className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold shadow-xs hover:bg-emerald-100/80 dark:hover:bg-emerald-900/40 transition-all cursor-pointer group shrink-0"
        title="Active Shift — Click to view Attendance"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="font-bold">Shift:</span>
        <span className="font-mono font-bold text-[11px]">{elapsed || '00h 00m'}</span>
      </button>
    );
  }

  // Case 2: Shift Completed (Checked out)
  if (todayData?.check_out) {
    return (
      <button
        type="button"
        onClick={() => navigate('/attendance')}
        className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 text-blue-700 dark:text-blue-300 text-xs font-semibold shadow-xs hover:bg-blue-100/80 dark:hover:bg-blue-900/40 transition-all cursor-pointer shrink-0"
        title="Shift Completed — Click to view Attendance"
      >
        <FiCheckCircle size={13} className="text-blue-500" />
        <span className="font-bold">Shift Done</span>
      </button>
    );
  }

  // Case 3: Not Checked In Today
  return (
    <button
      type="button"
      onClick={() => navigate('/attendance')}
      className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-slate-500 dark:text-slate-400 text-xs font-semibold hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer shadow-xs shrink-0"
      title="Not Checked In — Click to Check In"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
      <span className="font-bold">Punch In</span>
    </button>
  );
};

export default HeaderShiftStatus;
