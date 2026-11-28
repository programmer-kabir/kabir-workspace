import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { FiClock, FiPlay, FiSquare, FiCheck, FiX, FiEdit2, FiRefreshCw } from 'react-icons/fi';
import Pusher from 'pusher-js';
import SalahLeaderboardModal from './SalahLeaderboardModal';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const formatTime12h = (timeStr) => {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
};

const PrayerScheduleControl = () => {
  const [schedule, setSchedule] = useState(null);
  const [activeNamazCount, setActiveNamazCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);

  // Form states
  const [startTimeInput, setStartTimeInput] = useState('16:15');
  const [durationInput, setDurationInput] = useState(20);
  const [rewardPerWaqtInput, setRewardPerWaqtInput] = useState(3);
  const [fullDayBonusInput, setFullDayBonusInput] = useState(5);
  const [isRewardEnabledInput, setIsRewardEnabledInput] = useState(true);

  const fetchStatus = async () => {
    try {
      const res = await axios.get(`${API_BASE}api/breaks/trigger_prayer_break.php?t=${Date.now()}`);
      if (res.data.status === 'success') {
        const sched = res.data.data.schedule;
        setSchedule(sched);
        setActiveNamazCount(res.data.data.active_namaz_count || 0);

        if (sched && sched.start_time) {
          const hm = sched.start_time.slice(0, 5);
          setStartTimeInput(hm);
          setDurationInput(sched.allocated_minutes || 20);
          setRewardPerWaqtInput(sched.salah_reward_mins ?? 3);
          setFullDayBonusInput(sched.salah_full_day_bonus ?? 5);
          setIsRewardEnabledInput(sched.is_reward_enabled !== undefined ? !!sched.is_reward_enabled : true);
        }
      }
    } catch (err) {
      console.error('Failed to fetch prayer schedule:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();

    let pusherInstance = null;
    try {
      pusherInstance = new Pusher('82a63711fed4b73bd74d', {
        cluster: 'ap2',
        forceTLS: true
      });

      const channel = pusherInstance.subscribe('staff-breaks');

      channel.bind('prayer-schedule-updated', (data) => {
        setSchedule(data);
        if (data.start_time) {
          setStartTimeInput(data.start_time.slice(0, 5));
          setDurationInput(data.allocated_minutes || 20);
          setRewardPerWaqtInput(data.salah_reward_mins ?? 3);
          setFullDayBonusInput(data.salah_full_day_bonus ?? 5);
          setIsRewardEnabledInput(data.is_reward_enabled !== undefined ? !!data.is_reward_enabled : true);
        }
        toast.info('🕌 Prayer schedule updated across center!');
      });

      channel.bind('break-approved', () => fetchStatus());
      channel.bind('break-ended', () => fetchStatus());

    } catch (e) {
      console.error('Pusher prayer error:', e);
    }

    return () => {
      if (pusherInstance) {
        pusherInstance.unsubscribe('staff-breaks');
        pusherInstance.disconnect();
      }
    };
  }, []);

  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    if (!startTimeInput) {
      toast.error('Please enter a valid start time.');
      return;
    }

    setSaving(true);
    try {
      const res = await axios.post(`${API_BASE}api/breaks/manage_prayer_schedule.php`, {
        start_time: startTimeInput,
        allocated_minutes: parseInt(durationInput, 10) || 20,
        salah_reward_mins: parseInt(rewardPerWaqtInput, 10) || 0,
        salah_full_day_bonus: parseInt(fullDayBonusInput, 10) || 0,
        is_reward_enabled: isRewardEnabledInput ? 1 : 0
      });

      if (res.data.status === 'success') {
        toast.success('🕌 Prayer schedule & rewards updated successfully!');
        setSchedule(res.data.data);
        setIsEditing(false);
      } else {
        toast.error(res.data.message || 'Failed to update schedule.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating prayer schedule.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleMasterBreak = async (action) => {
    const isStart = action === 'start_all';
    const confirmMsg = isStart
      ? 'Are you sure you want to trigger Namaz Break for ALL checked-in staff right now?'
      : 'Are you sure you want to END Namaz Break for all currently active staff?';

    if (!window.confirm(confirmMsg)) return;

    setTriggering(true);
    try {
      const res = await axios.post(`${API_BASE}api/breaks/trigger_prayer_break.php`, {
        action: action
      });

      if (res.data.status === 'success') {
        toast.success(res.data.message);
        fetchStatus();
      } else {
        toast.error(res.data.message || 'Action failed.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error triggering prayer break.');
    } finally {
      setTriggering(false);
    }
  };

  if (loading && !schedule) return null;

  return (
    <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/5 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-transparent border-2 border-emerald-400/70 dark:border-emerald-500/40 rounded-3xl p-4 sm:p-5 shadow-md shadow-emerald-500/5 mb-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        
        {/* Left: Schedule Information */}
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-xl shrink-0 shadow-xs border border-emerald-500/30">
            🕌
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-black text-slate-800 dark:text-white leading-tight">
                {schedule?.title || 'আসরের নামাজ ও বিকাল বিরতি'}
              </h4>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-black border border-emerald-300 dark:border-emerald-700/60">
                Daily {schedule?.allocated_minutes || 20}m Free Pool
              </span>
              {schedule?.is_reward_enabled ? (
                <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] font-black border border-amber-300 dark:border-amber-700/60 flex items-center gap-1">
                  <span>🥭</span>
                  <span>+{schedule?.salah_reward_mins ?? 3}মি./ওয়াক্ত | +{schedule?.salah_full_day_bonus ?? 5}মি. ৫/৫ বোনাস</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-bold">
                  রিওয়ার্ড নিষ্ক্রিয়
                </span>
              )}
              {activeNamazCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black animate-pulse flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  <span>{activeNamazCount} Staff on Break</span>
                </span>
              )}
            </div>

            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 mt-1 flex items-center gap-1.5 flex-wrap">
              <FiClock size={13} className="text-emerald-600 dark:text-emerald-400" />
              <span>Current Schedule:</span>
              <strong className="underline underline-offset-2">
                {formatTime12h(schedule?.start_time)} – {formatTime12h(schedule?.end_time)}
              </strong>
              <span className="text-[11px] text-slate-400 font-medium">
                (Auto-cron executes automatically on schedule)
              </span>
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <button
            type="button"
            onClick={() => setIsLeaderboardOpen(true)}
            className="px-3 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <span>🏆</span>
            <span>সলাত স্কোর ও লিডারবোর্ড</span>
          </button>

          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <FiEdit2 size={13} className="text-emerald-600 dark:text-emerald-400" />
            <span>{isEditing ? 'Close' : 'Set Time & Rewards'}</span>
          </button>

          {activeNamazCount > 0 ? (
            <button
              type="button"
              disabled={triggering}
              onClick={() => handleToggleMasterBreak('end_all')}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white text-xs font-black shadow-xs shadow-rose-600/30 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <FiSquare size={13} />
              <span>{triggering ? 'Ending...' : 'End Namaz for All'}</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={triggering}
              onClick={() => handleToggleMasterBreak('start_all')}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black shadow-xs shadow-emerald-600/30 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <FiPlay size={13} />
              <span>{triggering ? 'Starting...' : 'Start Namaz for All'}</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Inline Time & Reward Editor Drawer ── */}
      {isEditing && (
        <form onSubmit={handleSaveSchedule} className="mt-4 pt-3.5 border-t border-emerald-300/60 dark:border-emerald-700/50 flex flex-wrap items-center gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <label className="text-xs font-black text-slate-700 dark:text-slate-200">
              Start Time:
            </label>
            <input
              type="time"
              required
              value={startTimeInput}
              onChange={(e) => setStartTimeInput(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 text-xs font-black text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-black text-slate-700 dark:text-slate-200">
              Duration:
            </label>
            <select
              value={durationInput}
              onChange={(e) => setDurationInput(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 text-xs font-black text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value={15}>15 Mins</option>
              <option value={20}>20 Mins (Standard)</option>
              <option value={25}>25 Mins</option>
              <option value={30}>30 Mins</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <label className="text-xs font-black text-slate-700 dark:text-slate-200">
              ওয়াক্ত রিওয়ার্ড:
            </label>
            <input
              type="number"
              min="0"
              max="30"
              value={rewardPerWaqtInput}
              onChange={(e) => setRewardPerWaqtInput(e.target.value)}
              className="w-14 px-2 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 text-xs font-black text-center text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
            <span className="text-[11px] text-slate-500 font-bold">মি.</span>
          </div>

          <div className="flex items-center gap-1.5">
            <label className="text-xs font-black text-slate-700 dark:text-slate-200">
              ৫/৫ বোনাস:
            </label>
            <input
              type="number"
              min="0"
              max="60"
              value={fullDayBonusInput}
              onChange={(e) => setFullDayBonusInput(e.target.value)}
              className="w-14 px-2 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 text-xs font-black text-center text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
            <span className="text-[11px] text-slate-500 font-bold">মি.</span>
          </div>

          <label className="flex items-center gap-1.5 cursor-pointer text-xs font-black text-slate-700 dark:text-slate-200 select-none">
            <input
              type="checkbox"
              checked={isRewardEnabledInput}
              onChange={(e) => setIsRewardEnabledInput(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span>ম্যাঙ্গো রিওয়ার্ড অন</span>
          </label>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <FiCheck size={13} />
              <span>{saving ? 'Saving...' : 'Update Schedule'}</span>
            </button>
          </div>
        </form>
      )}
      {/* ── Salah Leaderboard Modal ── */}
      <SalahLeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
      />
    </div>
  );
};

export default PrayerScheduleControl;
