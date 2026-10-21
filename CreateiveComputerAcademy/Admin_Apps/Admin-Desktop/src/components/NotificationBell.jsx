import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth, getApiBase } from '../context/AuthContext';
import {
  FiBell, FiCheckCircle, FiAlertTriangle, FiInfo, FiTrash2,
  FiCheck, FiVolume2, FiVolumeX, FiX, FiCalendar, FiMessageSquare, FiClipboard, FiClock
} from 'react-icons/fi';

const playNotificationSound = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (e) {
    // Non-blocking
  }
};

const formatTimeAgo = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSecs = Math.floor((now - date) / 1000);

  if (isNaN(diffInSecs) || diffInSecs < 60) return 'Just now';
  if (diffInSecs < 3600) return `${Math.floor(diffInSecs / 60)}m ago`;
  if (diffInSecs < 86400) return `${Math.floor(diffInSecs / 3600)}h ago`;
  return `${Math.floor(diffInSecs / 86400)}d ago`;
};

const NotificationBell = ({ portal = 'admin', setActiveTab }) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTabFilter, setActiveTabFilter] = useState('all');
  const [soundEnabled, setSoundEnabled] = useState(true);

  const dropdownRef = useRef(null);
  const prevUnreadCountRef = useRef(0);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    if (!currentUser?.id) return;
    try {
      const apiBase = getApiBase();
      const res = await axios.post(`${apiBase}api/notifications/get_notifications.php`, {
        user_id: currentUser.id,
        portal: portal
      });

      if (res.data?.status === 'success') {
        const newUnreadCount = res.data.unread_count || 0;
        const newNotifications = res.data.notifications || [];

        if (newUnreadCount > prevUnreadCountRef.current && prevUnreadCountRef.current !== 0) {
          if (soundEnabled) {
            playNotificationSound();
          }
        }

        prevUnreadCountRef.current = newUnreadCount;
        setUnreadCount(newUnreadCount);
        setNotifications(newNotifications);
      }
    } catch (err) {
      // Non-blocking
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(() => {
      if (!document.hidden) fetchNotifications();
    }, 12000);
    return () => clearInterval(interval);
  }, [currentUser, portal, soundEnabled]);

  const handleMarkAsRead = async (notificationId = null, markAll = false) => {
    if (!currentUser?.id) return;
    try {
      const apiBase = getApiBase();
      await axios.post(`${apiBase}api/notifications/mark_as_read.php`, {
        user_id: currentUser.id,
        notification_id: notificationId,
        mark_all: markAll,
        portal: portal
      });
      fetchNotifications();
    } catch (err) {
      // Non-blocking
    }
  };

  const handleCardClick = (notification) => {
    if (!notification.is_read) {
      handleMarkAsRead(notification.id);
    }
    setIsOpen(false);
    if (setActiveTab && notification.action_url) {
      const cleanPath = notification.action_url.replace(/^\/+/, '');
      setActiveTab(cleanPath);
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeTabFilter === 'unread') return !n.is_read;
    return true;
  });

  return (
    <div className="relative z-50" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 transition-colors cursor-pointer shadow-xs"
        title="Admin Notifications"
      >
        <FiBell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-600 text-white text-[10px] font-black items-center justify-center shadow-xs">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Notifications Dropdown Drawer */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-950/60">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-1 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                title={soundEnabled ? 'Mute Chime' : 'Enable Chime'}
              >
                {soundEnabled ? <FiVolume2 size={14} /> : <FiVolumeX size={14} />}
              </button>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => handleMarkAsRead(null, true)}
                  className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer"
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto custom-scrollbar divide-y divide-slate-100 dark:divide-slate-800/60">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-1">
                <FiBell className="mx-auto text-slate-400 dark:text-slate-600 mb-2" size={24} />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">All caught up!</p>
                <p className="text-[11px] text-slate-500">No new notifications right now.</p>
              </div>
            ) : (
              filteredNotifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleCardClick(n)}
                  className={`p-3 transition cursor-pointer flex gap-3 ${
                    n.is_read
                      ? 'hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-400'
                      : 'bg-blue-50/60 dark:bg-blue-950/20 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <FiInfo size={14} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{n.title}</p>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0">{formatTimeAgo(n.created_at)}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">{n.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
