import React, { useState, useEffect, useMemo } from 'react';
import {
  FiClock, FiCheckCircle, FiLogOut, FiCalendar, FiShield,
  FiAlertCircle, FiRefreshCw, FiUser, FiActivity, FiLayers
} from 'react-icons/fi';
import { soundFx } from '../utils/soundFx';
import { parseDesktopDeviceInfo, getDesktopLocation } from '../utils/deviceFingerprint';
import { getAttendanceApi, checkInApi, checkOutApi } from '../utils/api';
import screenStreamService from '../services/ScreenStreamService';

const AttendanceCard = ({ user, onOpenHistory }) => {
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [punching, setPunching] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Real-time live seconds clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Attendance data
  const fetchAttendance = async () => {
    if (!user?.id) return;
    setErrorMsg('');
    try {
      const res = await getAttendanceApi(user.id);
      if (res.status === 'success') {
        setAttendance(res);
      }
    } catch (err) {
      console.error('Failed to fetch attendance', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchAttendance, 60000);
    return () => clearInterval(interval);
  }, [user]);

  // Listen for Tray quick-punch action
  useEffect(() => {
    if (window.electronAPI?.onTrayAction) {
      const unsubscribe = window.electronAPI.onTrayAction((action) => {
        if (action === 'trigger-punch') {
          handlePunchAction();
        }
      });
      return unsubscribe;
    }
  }, [attendance, punching]);

  const today = attendance?.today;
  const isCheckedIn = Boolean(today && today.check_in);
  const isCheckedOut = Boolean(today && today.check_out);

  // Calculate live elapsed shift duration
  const elapsedShift = useMemo(() => {
    if (!isCheckedIn || isCheckedOut) return null;
    try {
      const parts = today.check_in.split(':');
      const inDate = new Date();
      inDate.setHours(parseInt(parts[0], 10), parseInt(parts[1], 10), parseInt(parts[2] || 0, 10));

      const diffSec = Math.max(0, Math.floor((currentTime - inDate) / 1000));
      const hours = Math.floor(diffSec / 3600);
      const mins = Math.floor((diffSec % 3600) / 60);
      const secs = diffSec % 60;

      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } catch (e) {
      return null;
    }
  }, [isCheckedIn, isCheckedOut, today?.check_in, currentTime]);

  const format12H = (timeStr) => {
    if (!timeStr) return '--:--';
    try {
      const [h, m] = timeStr.split(':');
      const hour = parseInt(h, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const formattedH = hour % 12 || 12;
      return `${formattedH}:${m} ${ampm}`;
    } catch {
      return timeStr;
    }
  };

  const handlePunchAction = async () => {
    if (punching) return;
    setErrorMsg('');
    setPunching(true);

    try {
      const [deviceInfo, location] = await Promise.all([
        parseDesktopDeviceInfo(),
        getDesktopLocation()
      ]);

      if (!isCheckedIn) {
        // PUNCH IN - Warm stream immediately on user gesture
        if (user?.id) {
          screenStreamService.init(user);
          screenStreamService.prewarmStream().catch(() => {});
        }
        const res = await checkInApi(user.id, deviceInfo, location);
        if (res.status === 'success') {
          soundFx.playPunchIn();
          if (window.electronAPI?.showNotification) {
            window.electronAPI.showNotification('Checked In Successfully', `Recorded at ${currentTime.toLocaleTimeString()}`);
          }
          await fetchAttendance();
          if (user?.id) {
            screenStreamService.init(user);
            screenStreamService.prewarmStream().catch(() => {});
          }
        } else {
          soundFx.playError();
          setErrorMsg(res.message || 'Check-in failed. Please verify office network.');
        }
      } else if (!isCheckedOut) {
        // PUNCH OUT
        const res = await checkOutApi(user.id, deviceInfo, location);
        if (res.status === 'success') {
          soundFx.playPunchOut();
          screenStreamService.destroy();
          if (window.electronAPI?.showNotification) {
            window.electronAPI.showNotification('Checked Out Successfully', `Recorded at ${currentTime.toLocaleTimeString()}`);
          }
          await fetchAttendance();
        } else {
          soundFx.playError();
          setErrorMsg(res.message || 'Check-out failed.');
        }
      }
    } catch (err) {
      soundFx.playError();
      setErrorMsg(err.response?.data?.message || err.message || 'Error executing punch action.');
    } finally {
      setPunching(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-4 overflow-y-auto">
      {/* User Header Profile */}
      <div className="glass-panel p-3.5 rounded-2xl flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0 overflow-hidden">
            {user?.profile_picture ? (
              <img src={user.profile_picture} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <span>{user?.name ? user.name.charAt(0).toUpperCase() : 'U'}</span>
            )}
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-white truncate leading-tight">
              {user?.name || 'Staff User'}
            </h2>
            <p className="text-[11px] text-slate-400 truncate">
              {user?.employee_code || user?.designation || 'CCA Staff'} &bull; {user?.department_name || 'Creative'}
            </p>
          </div>
        </div>

        <button
          onClick={fetchAttendance}
          disabled={loading}
          title="Refresh attendance"
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition shrink-0"
        >
          <FiRefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Real-time Clock Banner */}
      <div className="my-3 text-center">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
          {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
        <div className="text-3xl font-black text-white tracking-tight font-mono mt-0.5">
          {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
      </div>

      {/* Shift State & Live Stopwatch Card */}
      <div className="glass-panel p-4 rounded-2xl relative overflow-hidden border border-slate-800/80">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <FiActivity className="text-sky-400" />
            Shift Status
          </span>

          {/* Dynamic Status Pill */}
          {!isCheckedIn ? (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/15 text-amber-300 border border-amber-500/30">
              Not Checked In
            </span>
          ) : !isCheckedOut ? (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              On Duty
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
              Completed
            </span>
          )}
        </div>

        {/* Stopwatch when active */}
        {isCheckedIn && !isCheckedOut && elapsedShift && (
          <div className="my-2 py-3 bg-slate-900/80 rounded-xl text-center border border-emerald-500/20">
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
              Active Shift Elapsed
            </div>
            <div className="text-2xl font-black text-emerald-400 font-mono tracking-wider mt-0.5">
              {elapsedShift}
            </div>
          </div>
        )}

        {/* 2-Column Info Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs mt-2">
          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-medium">Punch In Time</span>
            <span className="text-sm font-bold text-slate-100 font-mono">
              {format12H(today?.check_in)}
            </span>
          </div>
          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-medium">Punch Out Time</span>
            <span className="text-sm font-bold text-slate-100 font-mono">
              {format12H(today?.check_out)}
            </span>
          </div>
        </div>
      </div>

      {/* Error / Alert banner */}
      {errorMsg && (
        <div className="my-2 p-2.5 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
          <FiAlertCircle className="shrink-0 text-rose-400" size={15} />
          <span className="leading-tight">{errorMsg}</span>
        </div>
      )}

      {/* Main Big Punch Button */}
      <div className="my-2">
        {!isCheckedIn ? (
          <button
            onClick={handlePunchAction}
            disabled={punching}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-base shadow-xl shadow-emerald-500/25 active:scale-[0.98] transition flex items-center justify-center gap-2.5 disabled:opacity-50 cursor-pointer"
          >
            <FiCheckCircle size={20} />
            <span>{punching ? 'Recording Punch In...' : 'PUNCH IN (CHECK IN)'}</span>
          </button>
        ) : !isCheckedOut ? (
          <button
            onClick={handlePunchAction}
            disabled={punching}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-rose-500 via-red-500 to-rose-600 hover:from-rose-400 hover:to-red-500 text-white font-extrabold text-base shadow-xl shadow-rose-500/25 active:scale-[0.98] transition flex items-center justify-center gap-2.5 disabled:opacity-50 cursor-pointer"
          >
            <FiLogOut size={20} />
            <span>{punching ? 'Recording Punch Out...' : 'PUNCH OUT (CHECK OUT)'}</span>
          </button>
        ) : (
          <div className="py-3 px-4 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-400 text-xs font-semibold flex items-center justify-center gap-2">
            <FiCheckCircle className="text-emerald-400" />
            <span>Attendance completed for today. Good job!</span>
          </div>
        )}
      </div>

      {/* Bottom Bar: History & Tray Hint */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[11px] text-slate-400">
        <button
          onClick={onOpenHistory}
          className="flex items-center gap-1.5 hover:text-sky-400 transition font-semibold"
        >
          <FiCalendar size={13} />
          <span>Recent History</span>
        </button>

        <span className="text-[10px] text-slate-500">
          Running in System Tray
        </span>
      </div>
    </div>
  );
};

export default AttendanceCard;
