import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import useServerTime from '../hooks/useServerTime';

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
  }, [currentUser]);

  if (loading) return null;
  if (!config || !config.has_tiffin) return null;
  if (!now) return null; // wait for server time to load

  const getStatus = () => {
    const totalSeconds = (h, m) => h * 3600 + m * 60;
    const nowSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    
    const [sh, sm] = config.tiffin_start_time.split(':').map(Number);
    const [eh, em] = config.tiffin_end_time.split(':').map(Number);
    
    const startSec = totalSeconds(sh, sm);
    const endSec = totalSeconds(eh, em);

    if (nowSec >= endSec) return { phase: 'done', remaining: 0 };
    if (nowSec >= startSec) return { phase: 'ongoing', remaining: endSec - nowSec };
    if (nowSec >= startSec - 30 * 60) return { phase: 'upcoming', remaining: startSec - nowSec }; // show 30 min before
    return { phase: 'hidden', remaining: 0 };
  };

  const { phase, remaining } = getStatus();
  if (phase === 'hidden' || phase === 'done') return null;

  const isOngoing = phase === 'ongoing';
  const displayStart = formatTimeStr(config.tiffin_start_time);
  const displayEnd = formatTimeStr(config.tiffin_end_time);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border px-6 py-4 flex items-center gap-4 mb-6 transition-all duration-500 ${isOngoing
        ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/40 shadow-amber-200/60 dark:shadow-amber-500/10 shadow-lg'
        : 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30 shadow-indigo-100/60 dark:shadow-indigo-500/10 shadow-md'
        }`}
    >
      {/* Animated background glow */}
      {isOngoing && (
        <div className="absolute inset-0 bg-gradient-to-r from-amber-400/10 via-orange-300/10 to-amber-400/10 animate-pulse pointer-events-none" />
      )}

      {/* Icon */}
      <div
        className={`text-3xl flex-shrink-0 ${isOngoing ? 'animate-bounce' : ''}`}
        role="img"
        aria-label="tiffin"
      >
        🥪
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-xs font-black uppercase tracking-widest mb-0.5 ${isOngoing ? 'text-amber-600 dark:text-amber-400' : 'text-indigo-600 dark:text-indigo-400'
            }`}
        >
          {isOngoing ? '🍽️ Tiffin Break চলছে' : '⏳ Tiffin Break শুরু হবে'}
        </p>
        <p
          className={`text-sm font-bold ${isOngoing ? 'text-amber-700 dark:text-amber-300' : 'text-indigo-700 dark:text-indigo-300'
            }`}
        >
          {isOngoing
            ? `${displayStart} – ${displayEnd} · ${fmt(remaining)} বাকি`
            : `${fmt(remaining)} পরে শুরু হবে · ${displayStart} থেকে ${displayEnd}`}
        </p>
      </div>

      {/* Big countdown */}
      <div
        className={`flex-shrink-0 text-3xl font-black font-mono tabular-nums ${isOngoing ? 'text-amber-600 dark:text-amber-300' : 'text-indigo-500 dark:text-indigo-400'
          }`}
      >
        {fmt(remaining)}
      </div>
    </div>
  );
};

export default TiffinTimer;
