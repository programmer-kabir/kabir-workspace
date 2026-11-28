import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import useServerTime from '../hooks/useServerTime';
import Pusher from 'pusher-js';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const fmt = (sec) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const formatTimeStr = (timeStr) => {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const date = new Date();
  date.setHours(parseInt(h), parseInt(m));
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

const TiffinTimer = () => {
  const { currentUser } = useAuth();
  const now = useServerTime();
  
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await axios.get(`${API_BASE}api/breaks/get_my_tiffin_config.php?user_id=${currentUser.id}`);
        if (res.data.status === 'success') {
          setConfig(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch tiffin config', err);
      } finally {
        setLoading(false);
      }
    };
    if (currentUser?.id) fetchConfig();

    let pusherInstance = null;
    try {
      pusherInstance = new Pusher('82a63711fed4b73bd74d', {
        cluster: 'ap2',
        forceTLS: true
      });
      const channel = pusherInstance.subscribe('staff-breaks');
      channel.bind('prayer-schedule-updated', (data) => {
        setConfig((prev) => prev ? { ...prev, prayer_schedule: data } : prev);
      });
    } catch (e) {
      console.error('Pusher prayer error in TiffinTimer:', e);
    }

    return () => {
      if (pusherInstance) {
        pusherInstance.unsubscribe('staff-breaks');
        pusherInstance.disconnect();
      }
    };
  }, [currentUser]);

  if (loading) return null;
  if (!config || !config.has_tiffin) return null;
  if (!now) return null; // wait for server time to load

  const getStatus = () => {
    const totalSeconds = (h, m) => h * 3600 + m * 60;
    const nowSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    
    // Check Namaz Prayer Schedule first if available
    if (config.prayer_schedule && config.prayer_schedule.start_time && config.prayer_schedule.end_time) {
      const [psh, psm] = config.prayer_schedule.start_time.split(':').map(Number);
      const [peh, pem] = config.prayer_schedule.end_time.split(':').map(Number);
      const pStartSec = totalSeconds(psh, psm);
      const pEndSec = totalSeconds(peh, pem);

      if (nowSec >= pStartSec && nowSec < pEndSec) {
        return {
          type: 'namaz',
          phase: 'ongoing',
          remaining: pEndSec - nowSec,
          startTime: config.prayer_schedule.start_time,
          endTime: config.prayer_schedule.end_time,
          title: config.prayer_schedule.title || 'আসরের নামাজ ও বিকাল বিরতি'
        };
      }
      if (nowSec >= pStartSec - 30 * 60 && nowSec < pStartSec) {
        return {
          type: 'namaz',
          phase: 'upcoming',
          remaining: pStartSec - nowSec,
          startTime: config.prayer_schedule.start_time,
          endTime: config.prayer_schedule.end_time,
          title: config.prayer_schedule.title || 'আসরের নামাজ ও বিকাল বিরতি'
        };
      }
    }

    // Check Tiffin window
    if (config.tiffin_start_time && config.tiffin_end_time) {
      const [sh, sm] = config.tiffin_start_time.split(':').map(Number);
      const [eh, em] = config.tiffin_end_time.split(':').map(Number);
      
      const startSec = totalSeconds(sh, sm);
      const endSec = totalSeconds(eh, em);

      if (nowSec >= startSec && nowSec < endSec) {
        return {
          type: 'tiffin',
          phase: 'ongoing',
          remaining: endSec - nowSec,
          startTime: config.tiffin_start_time,
          endTime: config.tiffin_end_time,
          title: 'Tiffin Break'
        };
      }
      if (nowSec >= startSec - 30 * 60 && nowSec < startSec) {
        return {
          type: 'tiffin',
          phase: 'upcoming',
          remaining: startSec - nowSec,
          startTime: config.tiffin_start_time,
          endTime: config.tiffin_end_time,
          title: 'Tiffin Break'
        };
      }
    }

    return { phase: 'hidden', remaining: 0 };
  };

  const status = getStatus();
  if (status.phase === 'hidden' || status.phase === 'done') return null;

  const isOngoing = status.phase === 'ongoing';
  const isNamaz = status.type === 'namaz';
  const displayStart = formatTimeStr(status.startTime);
  const displayEnd = formatTimeStr(status.endTime);
  const remaining = status.remaining;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border px-6 py-4 flex items-center gap-4 mb-6 transition-all duration-500 ${
        isNamaz
          ? isOngoing
            ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/40 shadow-emerald-200/60 dark:shadow-emerald-500/10 shadow-lg'
            : 'bg-teal-50 dark:bg-teal-500/10 border-teal-200 dark:border-teal-500/30 shadow-teal-100/60 dark:shadow-teal-500/10 shadow-md'
          : isOngoing
          ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/40 shadow-amber-200/60 dark:shadow-amber-500/10 shadow-lg'
          : 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30 shadow-indigo-100/60 dark:shadow-indigo-500/10 shadow-md'
      }`}
    >
      {/* Animated background glow */}
      {isOngoing && (
        <div className={`absolute inset-0 bg-gradient-to-r pointer-events-none animate-pulse ${
          isNamaz ? 'from-emerald-400/10 via-teal-300/10 to-emerald-400/10' : 'from-amber-400/10 via-orange-300/10 to-amber-400/10'
        }`} />
      )}

      {/* Icon */}
      <div
        className={`text-3xl flex-shrink-0 ${isOngoing ? 'animate-bounce' : ''}`}
        role="img"
        aria-label={isNamaz ? 'prayer' : 'tiffin'}
      >
        {isNamaz ? '🕌' : '🥪'}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-xs font-black uppercase tracking-widest mb-0.5 ${
            isNamaz
              ? isOngoing ? 'text-emerald-600 dark:text-emerald-400' : 'text-teal-600 dark:text-teal-400'
              : isOngoing ? 'text-amber-600 dark:text-amber-400' : 'text-indigo-600 dark:text-indigo-400'
          }`}
        >
          {isNamaz
            ? isOngoing ? '🕌 আসরের নামাজ ও বিকাল বিরতি চলছে' : '⏳ আসরের নামাজ ও বিকাল বিরতি শুরু হবে'
            : isOngoing ? '🍽️ Tiffin Break চলছে' : '⏳ Tiffin Break শুরু হবে'}
        </p>
        <p
          className={`text-sm font-bold ${
            isNamaz
              ? isOngoing ? 'text-emerald-700 dark:text-emerald-300' : 'text-teal-700 dark:text-teal-300'
              : isOngoing ? 'text-amber-700 dark:text-amber-300' : 'text-indigo-700 dark:text-indigo-300'
          }`}
        >
          {isOngoing
            ? `${displayStart} – ${displayEnd} · ${fmt(remaining)} বাকি`
            : `${fmt(remaining)} পরে শুরু হবে · ${displayStart} থেকে ${displayEnd}`}
        </p>
        {isOngoing && (
          <p className={`text-[11px] font-medium mt-0.5 ${
            isNamaz ? 'text-emerald-600/90 dark:text-emerald-400/90' : 'text-amber-600/90 dark:text-amber-400/90'
          }`}>
            {isNamaz
              ? '💡 ২০ মিনিটের মধ্যে নামাজ ও বিরতি শেষ করে কাজে ফিরলে বেঁচে যাওয়া সময় সরাসরি Mango Bank (ওভারটাইম)-এ জমা হবে!'
              : '💡 ৪০ মিনিটের মধ্যে দ্রুত টিফিন শেষ করে কাজে ফিরলে বেঁচে যাওয়া সময় সরাসরি Mango Bank (ওভারটাইম)-এ জমা হবে!'}
          </p>
        )}
      </div>

      {/* Big countdown */}
      <div
        className={`flex-shrink-0 text-3xl font-black font-mono tabular-nums ${
          isNamaz
            ? isOngoing ? 'text-emerald-600 dark:text-emerald-300' : 'text-teal-500 dark:text-teal-400'
            : isOngoing ? 'text-amber-600 dark:text-amber-300' : 'text-indigo-500 dark:text-indigo-400'
        }`}
      >
        {fmt(remaining)}
      </div>
    </div>
  );
};

export default TiffinTimer;
