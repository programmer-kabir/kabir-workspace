import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FiClock, FiCheckCircle, FiLogOut, FiCalendar, FiAlertTriangle, FiPieChart, FiTrendingDown, FiAward, FiCoffee, FiAlertCircle, FiArrowRight } from 'react-icons/fi';
import { soundFx } from '../utils/soundFx';
import BreakWidget from '../components/BreakWidget';
import AttendanceDisputeModal from '../components/AttendanceDisputeModal';
import TiffinTimer from '../components/TiffinTimer';
import useServerTime from '../hooks/useServerTime';
import { useSearch } from '../context/SearchContext';
import { parseDeviceInfo, getUserLocation } from '../utils/deviceFingerprint';
import { FiShield, FiLoader, FiX, FiCpu, FiDownload } from 'react-icons/fi';
import { FaWindows } from 'react-icons/fa6';

const Attendance = () => {
  const { currentUser } = useAuth();
  const { searchTerm } = useSearch();
  const [loading, setLoading] = useState(true);
  const time = useServerTime() || new Date(); // fallback to local if not loaded yet

  const [todayStatus, setTodayStatus] = useState(null); // null if not checked in, object if checked in
  const [history, setHistory] = useState([]);
  const [shiftHours, setShiftHours] = useState(8);
  const [totalBreakMinutes, setTotalBreakMinutes] = useState(0);
  const [actionError, setActionError] = useState('');

  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [selectedDisputeDate, setSelectedDisputeDate] = useState(null);
  const [disputeSuccessMsg, setDisputeSuccessMsg] = useState('');
  const [isManualBreak, setIsManualBreak] = useState(false);
  const [todayIdleSummary, setTodayIdleSummary] = useState({ incidents: 0, totalMinutes: 0, alerts: [] });
  const [showIdleModal, setShowIdleModal] = useState(false);

  const fetchIdleStatus = async () => {
    if (!currentUser?.id) return;
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}api/attendance/get_my_idle_status.php?user_id=${currentUser.id}`);
      if (res.data?.status === 'success' && res.data?.data) {
        setTodayIdleSummary({
          incidents: res.data.data.today_incidents_count || 0,
          totalMinutes: res.data.data.today_total_minutes || 0,
          alerts: res.data.data.today_alerts || []
        });
      }
    } catch {
      // non-blocking
    }
  };

  const fetchAttendance = async () => {
    try {
      const response = await axios.post((import.meta.env.VITE_API_BASE_URL) + 'api/attendance/get_attendance.php', {
        user_id: currentUser.id
      });
      if (response.data.status === 'success') {
        setTodayStatus(response.data.today);
        setHistory(response.data.history || []);
        if (response.data.shift_hours) setShiftHours(response.data.shift_hours);
        if (response.data.total_break_minutes !== undefined) setTotalBreakMinutes(response.data.total_break_minutes);
        if (response.data.is_manual_break !== undefined) {
          setIsManualBreak(Boolean(response.data.is_manual_break));
        }
      }
    } catch (err) {
      console.error('Failed to fetch attendance', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.id) {
      fetchAttendance();
      fetchIdleStatus();
    }
  }, [currentUser]);

  const [isPunching, setIsPunching] = useState(false);

  const handleCheckIn = async () => {
    if (Number(currentUser?.id) !== 2) return;

    setActionError('');
    setIsPunching(true);
    try {
      const deviceInfo = await parseDeviceInfo();
      const location = await getUserLocation();

      const response = await axios.post((import.meta.env.VITE_API_BASE_URL) + 'api/attendance/check_in.php', {
        user_id: currentUser.id,
        device_info: deviceInfo,
        location: location
      });
      if (response.data.status === 'success') {
        soundFx.playPunchIn();
        fetchAttendance(); // Refresh data
      } else {
        setActionError(response.data.message || 'Failed to check in.');
      }
    } catch (err) {
      setActionError(err.response?.data?.message || 'An error occurred during check-in. Make sure you are within office premises.');
    } finally {
      setIsPunching(false);
    }
  };

  const handleCheckOut = async () => {
    if (Number(currentUser?.id) !== 2) return;

    setActionError('');
    setIsPunching(true);
    try {
      const deviceInfo = await parseDeviceInfo();
      const location = await getUserLocation();

      const response = await axios.post((import.meta.env.VITE_API_BASE_URL) + 'api/attendance/check_out.php', {
        user_id: currentUser.id,
        device_info: deviceInfo,
        location: location
      });
      if (response.data.status === 'success') {
        soundFx.playPunchOut();
        fetchAttendance(); // Refresh data
      } else {
        setActionError(response.data.message || 'Failed to check out.');
      }
    } catch (err) {
      setActionError(err.response?.data?.message || 'An error occurred during check-out.');
    } finally {
      setIsPunching(false);
    }
  };


  const calculateWorkTime = (checkInTimeStr) => {
    if (!checkInTimeStr) return null;

    // Parse checkInTimeStr "HH:MM:SS"
    const parts = checkInTimeStr.split(':').map(Number);
    if (parts.length < 3) return null;
    const [hours, minutes, seconds] = parts;
    const checkInDate = new Date(time); // Use current time date for today
    checkInDate.setHours(hours, minutes, seconds, 0);

    const now = time;

    // Total elapsed seconds
    let elapsedSeconds = Math.floor((now - checkInDate) / 1000);
    if (elapsedSeconds < 0) elapsedSeconds = 0; // Prevent negative if clocks mismatch

    const TARGET_HOURS = shiftHours || 8;
    const TARGET_SECONDS = TARGET_HOURS * 3600;

    const formatTime = (totalSec) => {
      const h = Math.floor(totalSec / 3600);
      const m = Math.floor((totalSec % 3600) / 60);
      const s = totalSec % 60;
      return `${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
    };

    const formatElapsed = formatTime(elapsedSeconds);

    if (elapsedSeconds >= TARGET_SECONDS) {
      const overtimeSec = elapsedSeconds - TARGET_SECONDS;
      return {
        type: 'overtime',
        label: 'Overtime (+)',
        color: 'text-emerald-600 dark:text-emerald-400',
        bg: 'bg-emerald-50 dark:bg-emerald-500/10',
        borderColor: 'border-emerald-200 dark:border-emerald-800/50',
        barColor: 'bg-emerald-500 dark:bg-emerald-400',
        value: formatTime(overtimeSec),
        elapsed: formatElapsed,
        progress: 100
      };
    } else {
      const remainingSec = TARGET_SECONDS - elapsedSeconds;
      const progress = (elapsedSeconds / TARGET_SECONDS) * 100;
      return {
        type: 'remaining',
        label: 'Time Remaining',
        color: 'text-amber-600 dark:text-amber-400',
        bg: 'bg-amber-50 dark:bg-amber-500/10',
        borderColor: 'border-amber-200 dark:border-amber-800/50',
        barColor: 'bg-amber-500 dark:bg-amber-400',
        value: formatTime(remainingSec),
        elapsed: formatElapsed,
        progress: progress
      };
    }
  };

  const workTimeData = todayStatus && !todayStatus.check_out ? calculateWorkTime(todayStatus.check_in) : null;

  const totalDays = history.length;
  const presentDays = history.filter(r => r.status === 'Present' || r.status === 'Late').length;
  const leaveDays = history.filter(r => r.status === 'Leave').length;
  const absentDays = history.filter(r => r.status === 'Absent').length;
  const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  const processedHistory = history.map(record => {
    if (!record.check_in || !record.check_out || record.check_out === '-') return record;

    let total_hours = record.total_hours;
    let overtime = null;
    let is_short = false;
    let rawOverSec = 0;
    let rawShortSec = 0;

    // Force recalculate overtime/gap to ensure it always shows
    const parseTime = (timeStr) => {
      const parts = timeStr.match(/(\d+):(\d+)(?::(\d+))?\s*(AM|PM)?/i);
      if (!parts) return null;
      let h = parseInt(parts[1], 10);
      let m = parseInt(parts[2], 10);
      let s = parts[3] ? parseInt(parts[3], 10) : 0;
      let ampm = parts[4] ? parts[4].toUpperCase() : null;
      if (ampm === 'PM' && h < 12) h += 12;
      if (ampm === 'AM' && h === 12) h = 0;
      return { h, m, s };
    };

    const inTime = parseTime(record.check_in);
    const outTime = parseTime(record.check_out);

    if (inTime && outTime) {
      const inDate = new Date();
      inDate.setHours(inTime.h, inTime.m, inTime.s, 0);

      const outDate = new Date();
      outDate.setHours(outTime.h, outTime.m, outTime.s, 0);

      let elapsedSeconds = Math.floor((outDate - inDate) / 1000);
      if (elapsedSeconds < 0) elapsedSeconds += 24 * 3600;

      const TARGET_SECONDS = (shiftHours || 8) * 3600;

      if (!total_hours) {
        const h = Math.floor(elapsedSeconds / 3600);
        const m = Math.floor((elapsedSeconds % 3600) / 60);
        total_hours = `${h}h ${m}m`;
      }

      if (!overtime) {
        if (elapsedSeconds > TARGET_SECONDS) {
          const overSec = elapsedSeconds - TARGET_SECONDS;
          rawOverSec = overSec;
          const oh = Math.floor(overSec / 3600);
          const om = Math.floor((overSec % 3600) / 60);
          if (overSec >= 60) {
            overtime = `+${oh}h ${om}m`;
            is_short = false;
          } else {
            overtime = `PERFECT`;
            is_short = null;
          }
        } else if (elapsedSeconds < TARGET_SECONDS) {
          const shortSec = TARGET_SECONDS - elapsedSeconds;
          rawShortSec = shortSec;
          const sh = Math.floor(shortSec / 3600);
          const sm = Math.floor((shortSec % 3600) / 60);
          if (shortSec >= 60) {
            overtime = `-${sh}h ${sm}m GAP`;
            is_short = true;
          } else {
            overtime = `PERFECT`;
            is_short = null;
          }
        } else {
          overtime = `PERFECT`;
          is_short = null;
        }
      }
    }
    return { ...record, total_hours, overtime, is_short, rawOverSec, rawShortSec };
  });

  const displayHistory = processedHistory.filter(record => {
    if (!searchTerm || !searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    return (
      (record.date || '').toLowerCase().includes(term) ||
      (record.status || '').toLowerCase().includes(term) ||
      (record.check_in || '').toLowerCase().includes(term) ||
      (record.check_out || '').toLowerCase().includes(term) ||
      (record.total_hours || '').toLowerCase().includes(term)
    );
  });

  const totalOvertimeSec = processedHistory.reduce((acc, curr) => acc + (curr.rawOverSec || 0), 0);
  const totalGapSec = processedHistory.reduce((acc, curr) => acc + (curr.rawShortSec || 0), 0);

  const formatTotalSec = (sec) => {
    if (sec === 0) return '0h 0m';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return `${h}h ${m}m`;
  };

  if (loading) return <div className="p-8 text-center text-slate-500 dark:text-slate-400 flex items-center justify-center min-h-[50vh]">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
  </div>;

  return (
    <div className="pb-10 animate-in fade-in zoom-in-95 duration-300">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Attendance</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your daily check-ins and view attendance history.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/desktop-app"
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-gradient-to-r from-cyan-500/10 via-sky-500/10 to-blue-500/15 hover:from-cyan-500/20 hover:to-blue-500/25 text-cyan-700 dark:text-cyan-300 rounded-2xl border border-cyan-300 dark:border-cyan-700 font-bold text-xs transition duration-200 shadow-xs cursor-pointer group"
          >
            <FaWindows className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 group-hover:scale-110 transition-transform" />
            <span>Desktop App</span>
            <FiDownload className="w-3.5 h-3.5 text-cyan-500" />
          </Link>
          <Link
            to="/mango-tree"
            className="inline-flex items-center gap-2.5 px-4 py-2.5 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/20 hover:from-amber-500/20 hover:to-orange-500/30 text-amber-700 dark:text-amber-300 rounded-2xl border border-amber-300 dark:border-amber-700 font-bold text-xs transition duration-200 shadow-xs cursor-pointer group"
          >
            <span className="text-lg group-hover:scale-125 transition-transform">🥭</span>
            <span>View Mango Break Tree</span>
            <FiArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Official Desktop Attendance App Announcement Banner */}
      <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-cyan-500/30 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0">
            <FaWindows size={22} />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-black text-white text-sm sm:text-base tracking-tight">
                CCA Attendance Desktop App (Windows) Available
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 uppercase tracking-wider">
                v1.0.0
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium leading-relaxed">
              চেক-ইন বাটনে ক্লিক করার সাথে সাথে ব্যাকগ্রাউন্ডে ফুল সাইলেন্ট পারমিশন, ২৪ FPS লাইভ স্ক্রিন সিঙ্ক ও সার্বক্ষণিক প্রেজেন্সের জন্য অফিসিয়াল উইন্ডোজ অ্যাপ ব্যবহার করুন।
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            to="/desktop-app"
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs rounded-xl shadow-md shadow-cyan-500/20 transition-all duration-200 cursor-pointer"
          >
            <FiDownload size={14} />
            <span>ডাউনলোড ও আপডেট সেন্টার</span>
          </Link>
        </div>
      </div>

      {/* Tiffin Timer - visible to all staff */}
      <TiffinTimer />

      {/* Metrics Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-7 gap-4 mb-8">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 group">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
            <FiAward />
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">Total Present</p>
            <p className="text-2xl font-black text-slate-800 dark:text-white leading-none">{presentDays}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 group">
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
            <FiTrendingDown />
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">Total Leave</p>
            <p className="text-2xl font-black text-slate-800 dark:text-white leading-none">{leaveDays}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 group">
          <div className="w-12 h-12 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
            <FiAlertTriangle />
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">Total Absent</p>
            <p className="text-2xl font-black text-slate-800 dark:text-white leading-none">{absentDays}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 group">
          <div className="w-12 h-12 bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
            <FiPieChart />
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">Attendance Rate</p>
            <p className="text-2xl font-black text-slate-800 dark:text-white leading-none">{attendanceRate}%</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 group">
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
            <FiClock />
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">Total Gap</p>
            <p className="text-xl font-black text-slate-800 dark:text-white leading-none">{formatTotalSec(totalGapSec)}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 group">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
            <FiCheckCircle />
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">Total Overtime</p>
            <p className="text-xl font-black text-slate-800 dark:text-white leading-none">{formatTotalSec(totalOvertimeSec)}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 group">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
            <FiCoffee />
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">Total Break</p>
            <p className="text-xl font-black text-slate-800 dark:text-white leading-none">{formatTotalSec(totalBreakMinutes * 60)}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowIdleModal(true)}
          className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4 hover:-translate-y-1 hover:shadow-lg hover:border-amber-400/50 dark:hover:border-amber-500/50 transition-all duration-300 group cursor-pointer text-left"
          title="Click to view detailed workstation inactivity logs"
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform ${todayIdleSummary.incidents > 0 ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
            }`}>
            <FiShield />
          </div>
          <div className="min-w-0">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-0.5 flex items-center gap-1.5">
              Watchdog Status
              {todayIdleSummary.incidents > 0 && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />}
            </p>
            <p className={`text-xl font-black leading-none truncate ${todayIdleSummary.incidents > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}>
              {todayIdleSummary.incidents > 0 ? `${todayIdleSummary.incidents} Alert (${todayIdleSummary.totalMinutes}m)` : 'Active (100%)'}
            </p>
            <span className="text-[10px] text-amber-500 font-bold group-hover:underline mt-1 block">View details &rarr;</span>
          </div>
        </button>
      </div>

      {/* Activity Watchdog Notice Banner */}
      {todayIdleSummary.incidents > 0 && (
        <div
          onClick={() => setShowIdleModal(true)}
          className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300 dark:border-amber-800 hover:border-amber-500 dark:hover:border-amber-600 p-4 rounded-2xl mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs cursor-pointer transition-all group"
          title="Click to inspect all inactivity logs"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 font-bold group-hover:scale-110 transition-transform">
              <FiClock size={16} />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                Workstation Activity Watchdog: {todayIdleSummary.incidents} Inactivity Alert(s) Today ({todayIdleSummary.totalMinutes}m total)
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold">Details Available</span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                The academy automatically tracks 5+ minute mouse/keyboard inactivity on desktop workstations. Click to inspect start times, end times & app activity.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setShowIdleModal(true); }}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shrink-0 cursor-pointer transition-all shadow-xs"
          >
            Inspect Logs &rarr;
          </button>
        </div>
      )}

      {actionError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-start gap-3">
          <FiAlertTriangle className="mt-0.5 shrink-0" />
          <p className="text-sm font-medium">{actionError}</p>
        </div>
      )}


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Live Clock & Action Box */}
        <div className="group bg-white dark:bg-slate-800 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 dark:border-slate-700 p-8 flex flex-col items-center justify-center text-center relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-primary-500/10 hover:-translate-y-1">
          {/* Animated Background Glow */}
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary-500/5 to-transparent dark:from-primary-500/10 pointer-events-none opacity-50"></div>

          <div className="relative mb-6 mt-2">
            <div className="absolute inset-0 bg-cyan-500/20 dark:bg-cyan-500/30 rounded-full animate-ping opacity-75"></div>

            {/* Outer Bezel (3D Cyan Gradient) */}
            <div className="w-40 h-40 rounded-full bg-gradient-to-br from-cyan-300 via-cyan-500 to-cyan-700 shadow-[0_0_20px_rgba(6,182,212,0.6)] p-[8px] relative z-10 group-hover:scale-105 transition-transform duration-500">

              {/* Inner White Face */}
              <div className="w-full h-full bg-white rounded-full shadow-[inset_0_2px_15px_rgba(0,0,0,0.15)] relative flex items-center justify-center">

                {/* 60 Minute Ticks */}
                {[...Array(60)].map((_, i) => (
                  <div key={`tick-${i}`} className="absolute inset-[3px] pointer-events-none" style={{ transform: `rotate(${i * 6}deg)` }}>
                    <div className={`mx-auto rounded-none ${i % 5 === 0 ? 'w-[2.5px] h-2.5 bg-slate-800' : 'w-[1.5px] h-1.5 bg-slate-400'}`}></div>
                  </div>
                ))}

                {/* 12 Numbers */}
                {[...Array(12)].map((_, i) => {
                  const num = i === 0 ? 12 : i;
                  const angle = i * 30;
                  const radius = 50;
                  const x = Math.sin((angle * Math.PI) / 180) * radius;
                  const y = -Math.cos((angle * Math.PI) / 180) * radius;
                  return (
                    <div key={`num-${num}`} className="absolute top-1/2 left-1/2 text-[14px] font-bold text-slate-800 pointer-events-none flex items-center justify-center leading-none"
                      style={{ transform: `translate(-50%, -50%) translate(${x}px, ${y}px)` }}>
                      {num}
                    </div>
                  );
                })}

                {/* Logo / Brand */}
                <div className="absolute top-[28%] text-[9px] font-black text-cyan-700 tracking-widest uppercase pointer-events-none">
                  CREATIVE
                </div>

                {/* Hour Hand (Dark Cyan) */}
                <div className="absolute top-1/2 left-1/2 w-[5px] h-[26%] bg-cyan-950 rounded-full origin-bottom z-10 shadow-sm transition-transform duration-200"
                  style={{ transform: `translate(-50%, -100%) rotate(${(time.getHours() / 12) * 360 + (time.getMinutes() / 60) * 30}deg)` }}></div>

                {/* Minute Hand (Dark Cyan) */}
                <div className="absolute top-1/2 left-1/2 w-[3.5px] h-[37%] bg-cyan-900 rounded-full origin-bottom z-20 shadow-sm transition-transform duration-200"
                  style={{ transform: `translate(-50%, -100%) rotate(${(time.getMinutes() / 60) * 360 + (time.getSeconds() / 60) * 6}deg)` }}></div>

                {/* Second Hand (Orange with tail) */}
                <div className="absolute top-1/2 left-1/2 w-[2px] h-[46%] bg-orange-500 rounded-full origin-[50%_80%] z-30 shadow-md transition-transform duration-200 ease-linear"
                  style={{ transform: `translate(-50%, -80%) rotate(${(time.getSeconds() / 60) * 360}deg)` }}></div>

                {/* Center Pin (Black with silver dot) */}
                <div className="absolute top-1/2 left-1/2 w-3.5 h-3.5 bg-slate-900 rounded-full -translate-x-1/2 -translate-y-1/2 z-40 shadow-md flex items-center justify-center">
                  <div className="w-[3px] h-[3px] bg-slate-300 rounded-full"></div>
                </div>

              </div>
            </div>
          </div>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-1 tracking-tight font-mono relative z-10">
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-bold mb-8 uppercase tracking-widest text-xs">
            {time.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <div className="w-full max-w-sm">
            {!todayStatus ? (
              <button
                onClick={handleCheckIn}
                disabled={isPunching || Number(currentUser?.id) !== 2}
                className={`relative overflow-hidden w-full py-4 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-black rounded-2xl shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.23)] hover:-translate-y-1 transition-all flex items-center justify-center gap-2 text-lg uppercase tracking-wider group/btn ${isPunching ? 'opacity-80 cursor-not-allowed' : ''}`}
              >
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover/btn:animate-[shimmer_1.5s_infinite]"></div>
                {isPunching ? (
                  <>
                    <FiLoader size={20} className="animate-spin relative z-10" />
                    <span className="relative z-10 text-sm">Verifying & Punching...</span>
                  </>
                ) : (
                  <>
                    <FiCheckCircle size={20} className="relative z-10" /> <span className="relative z-10">Check In Now</span>
                  </>
                )}
              </button>
            ) : !todayStatus.check_out ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-800/50 rounded-2xl relative overflow-hidden shadow-sm hover:scale-105 transition-transform duration-300">
                  <div className="absolute top-0 right-0 p-2 opacity-10 text-emerald-600 dark:text-emerald-400">
                    <FiCheckCircle size={64} />
                  </div>
                  <p className="text-emerald-800 dark:text-emerald-300 font-black uppercase tracking-wider text-sm mb-0.5">{[4, 5].includes(currentUser?.id) ? "Cash In" : "Check In"}</p>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">at {todayStatus.check_in}</p>
                </div>
                <button
                  onClick={handleCheckOut}
                  disabled={isPunching || Number(currentUser?.id) !== 2}

                  className={`w-full py-4 bg-rose-600 text-white font-black rounded-2xl shadow-[0_4px_14px_0_rgba(225,29,72,0.39)] hover:bg-rose-700 hover:shadow-[0_6px_20px_rgba(225,29,72,0.23)] hover:-translate-y-1 transition-all flex items-center justify-center gap-2 text-lg uppercase tracking-wider ${isPunching ? 'opacity-80 cursor-not-allowed' : ''}`}
                >
                  {isPunching ? (
                    <>
                      <FiLoader size={20} className="animate-spin" />
                      <span className="text-sm">Processing...</span>
                    </>
                  ) : (
                    <>
                      <FiLogOut size={20} /> {[4, 5].includes(currentUser?.id) ? "Cash Out" : "Check Out"}
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm">
                <div className="flex justify-center text-emerald-500 mb-3">
                  <FiCheckCircle size={32} />
                </div>
                <p className="text-slate-800 dark:text-slate-100 font-black uppercase tracking-wider text-sm mb-1">Workday Completed</p>
                <p className="font-bold text-slate-500 dark:text-slate-400 font-mono">
                  In: {todayStatus.check_in} | Out: {todayStatus.check_out}
                </p>
                {Number(todayStatus.is_forgotten_checkout) === 1 && (
                  <div className="mt-3 text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-800/40 rounded-xl p-2.5 flex items-center justify-center gap-1.5">
                    <FiAlertTriangle size={14} className="shrink-0 text-amber-500" />
                    <span>Auto checked out by system at shift end</span>
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
              <FiShield size={13} className="text-emerald-500" />
              <span>Office Geofence & Device Protected</span>
            </div>
          </div>
        </div>

        {/* Live Tracker Box */}
        {workTimeData ? (
          <div className="group bg-white dark:bg-slate-800 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 dark:border-slate-700 p-8 flex flex-col justify-center relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-primary-500/10 hover:-translate-y-1">
            <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2 transition-transform duration-300 group-hover:translate-x-1">
              Shift Progress ({shiftHours} Hours)
            </h3>

            {/* Circular/Linear Progress Display */}
            <div className="flex flex-col items-center justify-center mb-8">
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-4 rounded-full overflow-hidden shadow-inner mb-4">
                <div
                  className={`h-full transition-all duration-1000 ${workTimeData.barColor}`}
                  style={{ width: `${Math.min(workTimeData.progress, 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between w-full text-xs font-bold text-slate-400 uppercase tracking-wider">
                <span>0h</span>
                <span>{Math.floor(shiftHours / 2)}h</span>
                <span>{shiftHours}h</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 text-center">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Total Worked</p>
                <p className="text-2xl font-black text-slate-800 dark:text-slate-100 font-mono">{workTimeData.elapsed}</p>
              </div>
              <div className={`p-5 rounded-2xl border text-center transition-transform hover:scale-105 duration-300 ${workTimeData.bg} ${workTimeData.borderColor}`}>
                <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${workTimeData.color}`}>{workTimeData.label}</p>
                <p className={`text-2xl font-black font-mono ${workTimeData.color}`}>{workTimeData.value}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 dark:bg-slate-900/50/50 rounded-3xl border border-slate-200 dark:border-slate-700 border-dashed p-8 flex flex-col items-center justify-center relative text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 mb-4">
              <FiClock size={24} />
            </div>
            <h3 className="text-lg font-black text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Shift Tracker Offline</h3>
            <p className="text-slate-400 font-medium text-sm">Check in to start your {shiftHours}-hour live countdown.</p>
          </div>
        )}
      </div>

      {/* Break Widget Section - Visible to staff with manual break (has_tiffin_break = 0 or allocated_break_minutes > 0) */}
      {(isManualBreak || currentUser?.is_manual_break || currentUser?.has_tiffin_break === 0 || (Number(currentUser?.allocated_break_minutes) > 0 && currentUser?.has_tiffin_break === 0)) && (
        <div className="mb-8">
          <BreakWidget />
        </div>
      )}

      {/* History Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg flex items-center gap-2">
            <FiCalendar className="text-primary-500" /> This Month's History
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <th className="p-4 font-bold">Date</th>
                <th className="p-4 font-bold">Check In</th>
                <th className="p-4 font-bold">Check Out</th>
                <th className="p-4 font-bold">Work Hours</th>
                <th className="p-4 font-bold">Break Time</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayHistory.length > 0 ? displayHistory.map((record, index) => (
                <tr
                  key={index}
                  className="group hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all duration-300 cursor-default animate-fade-in"
                  style={{ animationFillMode: 'both', animationDelay: `${index * 50}ms` }}
                >
                  <td className="p-4 text-sm font-bold text-slate-700 dark:text-slate-300">{new Date(record.date).toLocaleDateString()}</td>
                  <td className="p-4 text-sm font-medium text-slate-600 dark:text-slate-400">{record.check_in || '-'}</td>
                  <td className="p-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                    <div className="flex flex-col gap-1 items-start">
                      <span>{record.check_out || '-'}</span>
                      {Number(record.is_forgotten_checkout) === 1 && (
                        <span
                          className="inline-flex items-center gap-1 text-[10px] font-black text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-800/40 px-1.5 py-0.5 rounded-md cursor-help"
                          title="Auto checked out by system at shift end. Click report issue if you worked overtime."
                        >
                          <FiAlertTriangle size={10} className="shrink-0 text-amber-500" />
                          Auto Check-Out
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-sm">
                    {record.total_hours ? (
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-700 dark:text-slate-300">{record.total_hours}</span>
                        {record.overtime && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md transition-transform duration-300 group-hover:scale-110 ${record.is_short === true ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400' :
                            record.is_short === false ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' :
                              'bg-slate-100 dark:bg-slate-500/20 text-slate-700 dark:text-slate-400'
                            }`}>
                            {record.overtime}
                          </span>
                        )}
                      </div>
                    ) : '-'}
                  </td>
                  <td className="p-4 text-sm font-bold text-slate-600 dark:text-slate-400">
                    {record.total_break_minutes > 0 ? `${record.total_break_minutes}m` : '-'}
                  </td>
                  <td className="p-4">
                    <span className={`inline-block transition-transform duration-300 group-hover:translate-x-1 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-md border ${record.status === 'Present' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/50' :
                      record.status === 'Late' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-800/50' :
                        record.status === 'Absent' ? 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-100 dark:border-red-800/50' :
                          'bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => {
                        setSelectedDisputeDate(record.date);
                        setIsDisputeModalOpen(true);
                        setDisputeSuccessMsg('');
                      }}
                      className="text-slate-400 hover:text-amber-500 transition-colors p-2 rounded-full hover:bg-amber-50 dark:hover:bg-amber-500/10"
                      title="Report an issue"
                    >
                      <FiAlertCircle size={16} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-slate-500 dark:text-slate-400 font-medium">No attendance records found for this month.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {disputeSuccessMsg && (
        <div className="fixed bottom-6 right-6 bg-emerald-500 text-white px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 animate-fade-in z-50">
          <FiCheckCircle size={24} />
          <p className="font-bold">{disputeSuccessMsg}</p>
        </div>
      )}

      {/* Workstation Inactivity Audit Modal */}
      {showIdleModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-scale-up max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center font-bold text-xl shadow-xs">
                  <FiShield />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                    Workstation Inactivity Audit Log
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Detailed record of your workstation idle sessions today (5+ minutes threshold).
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIdleModal(false)}
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
              >
                <FiX size={16} />
              </button>
            </div>

            {/* Quick KPI Row */}
            <div className="grid grid-cols-3 gap-3 shrink-0">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Incidents Today</span>
                <span className="text-xl font-black text-slate-800 dark:text-white mt-0.5 block">
                  {todayIdleSummary.incidents} <span className="text-xs text-slate-400 font-medium">times</span>
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Idle Time</span>
                <span className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5 block">
                  {todayIdleSummary.totalMinutes} <span className="text-xs text-slate-400 font-medium">minutes</span>
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">System Status</span>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Watchdog Active
                </span>
              </div>
            </div>

            {/* Inactivity Policy Reminder */}
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200/60 dark:border-blue-500/20 text-xs text-blue-700 dark:text-blue-300 leading-relaxed shrink-0">
              💡 <strong>Compliance Note:</strong> The desktop app logs an incident whenever mouse or keyboard movement stops for 5+ minutes. If you are taking lunch or leaving your desk, click <strong>"Break"</strong> so your attendance remains fully compliant.
            </div>

            {/* Scrollable Incident Log List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
              <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Today's Recorded Sessions
              </h4>

              {todayIdleSummary.alerts.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <FiCheckCircle size={32} className="text-emerald-500 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No Inactivity Recorded Today</p>
                  <p className="text-xs text-slate-400 mt-0.5">Your workstation has been active with no 5+ minute idle gaps!</p>
                </div>
              ) : (
                todayIdleSummary.alerts.map((item, idx) => {
                  const formatClock = (str) => {
                    if (!str) return '--:--';
                    return new Date(str).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  };

                  const mins = Math.floor((item.idle_seconds || 300) / 60);
                  const secs = (item.idle_seconds || 300) % 60;
                  const durationFormatted = `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;

                  return (
                    <div
                      key={item.id || idx}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5 transition-all hover:border-slate-300 dark:hover:border-slate-600"
                    >
                      {/* Top Row: Incident Number & Status */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px] font-black flex items-center justify-center">
                            #{todayIdleSummary.alerts.length - idx}
                          </span>
                          Session {todayIdleSummary.alerts.length - idx}
                        </span>

                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${item.status === 'resumed'
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : item.status === 'acknowledged'
                            ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                            : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 animate-pulse'
                          }`}>
                          {item.status === 'resumed' ? '🟢 Resumed' : item.status === 'acknowledged' ? '⚪ Acknowledged' : '🔴 Idle Now'}
                        </span>
                      </div>

                      {/* Timeline: Start Time -> End Time -> Duration */}
                      <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold">Start Time:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-100">
                            {formatClock(item.started_at)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold">Resumed At:</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {item.resumed_at ? formatClock(item.resumed_at) : 'Still Away'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-semibold">Idle Duration:</span>
                          <span className="font-black text-amber-600 dark:text-amber-400">
                            {durationFormatted}
                          </span>
                        </div>
                      </div>

                      {/* Active App when idle */}
                      {(item.active_process || item.active_window_title) && (
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                          <FiCpu className="text-blue-500 shrink-0" size={13} />
                          <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                            {item.active_process || 'Desktop Window'}
                          </span>
                          {item.active_window_title && (
                            <span className="truncate opacity-75">
                              — {item.active_window_title}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-400 font-medium">
                Records are synchronized in real-time with management oversight.
              </span>
              <button
                type="button"
                onClick={() => setShowIdleModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <AttendanceDisputeModal
        isOpen={isDisputeModalOpen}
        onClose={() => setIsDisputeModalOpen(false)}
        selectedDate={selectedDisputeDate}
        onSuccess={(msg) => {
          setDisputeSuccessMsg(msg);
          setTimeout(() => setDisputeSuccessMsg(''), 5000);
        }}
      />
    </div>
  );
};

export default Attendance;

