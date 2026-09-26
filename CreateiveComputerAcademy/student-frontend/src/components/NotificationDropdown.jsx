import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Pusher from 'pusher-js';
import { toast } from 'sonner';
import {
  FiBell, FiCheck, FiCheckSquare, FiMessageSquare,
  FiClock, FiInfo, FiExternalLink, FiAward, FiAlertCircle
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

// Helper: Format relative timestamp
const formatRelativeTime = (dateStr) => {
  if (!dateStr) return '';
  const now = new Date();
  const past = new Date(dateStr);
  const diffSec = Math.floor((now - past) / 1000);

  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return past.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

// Helper: Select icon based on notification type
const getNotificationIcon = (type) => {
  switch (type) {
    case 'assignment':
    case 'assignment_graded':
      return <FiCheckSquare className="text-purple-500" size={16} />;
    case 'discussion':
    case 'comment':
    case 'qa_reply':
      return <FiMessageSquare className="text-indigo-500" size={16} />;
    case 'attendance':
      return <FiClock className="text-amber-500" size={16} />;
    case 'achievement':
    case 'badge':
      return <FiAward className="text-amber-500" size={16} />;
    case 'alert':
    case 'warning':
      return <FiAlertCircle className="text-rose-500" size={16} />;
    default:
      return <FiBell className="text-blue-500" size={16} />;
  }
};

const NotificationDropdown = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // ── Fetch Notifications ─────────────────────────────────────────────
  const fetchNotifications = async () => {
    if (!currentUser?.id) return;
    try {
      setLoading(true);
      const res = await axios.get(
        `${API_BASE}api/notifications/get_notifications.php?user_id=${currentUser.id}&portal=student`
      );
      if (res.data?.status === 'success') {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unread_count || 0);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [currentUser?.id]);

  // ── Real-Time Pusher Listener ───────────────────────────────────────
  useEffect(() => {
    if (!currentUser?.id) return;

    const pusher = new Pusher('82a63711fed4b73bd74d', {
      cluster: 'ap2'
    });

    const channel = pusher.subscribe(`user-${currentUser.id}`);

    channel.bind('new-notification', (data) => {
      // Audio chime
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.25);
      } catch {}

      toast.info(data.title || 'New Notification', {
        description: data.message || ''
      });

      setUnreadCount((prev) => prev + 1);
      setNotifications((prev) => [data, ...prev]);
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, [currentUser?.id]);

  // ── Close on Click Outside ──────────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Mark Single as Read ─────────────────────────────────────────────
  const handleMarkAsRead = async (notification) => {
    if (notification.is_read) {
      if (notification.action_url) {
        setIsOpen(false);
        navigate(notification.action_url);
      }
      return;
    }

    try {
      await axios.post(`${API_BASE}api/notifications/mark_as_read.php`, {
        user_id: currentUser.id,
        notification_id: notification.id
      });

      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, is_read: 1 } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      if (notification.action_url) {
        setIsOpen(false);
        navigate(notification.action_url);
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  // ── Mark All as Read ────────────────────────────────────────────────
  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;
    try {
      await axios.post(`${API_BASE}api/notifications/mark_as_read.php`, {
        user_id: currentUser.id,
        mark_all: true,
        portal: 'student'
      });

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
      toast.success('All notifications marked as read!');
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* ── BELL TRIGGER BUTTON ─────────────────────────────────────── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-slate-600 dark:text-slate-300 transition-all cursor-pointer shadow-2xs"
        title="Notifications"
        aria-label="Open Notifications"
      >
        <FiBell size={17} />

        {unreadCount > 0 && (
          <>
            <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white shadow-xs">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
            <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] rounded-full bg-rose-400 animate-ping opacity-75 pointer-events-none" />
          </>
        )}
      </button>

      {/* ── DROPDOWN PANEL ──────────────────────────────────────────── */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          
          {/* Header */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-black text-sm text-slate-900 dark:text-white">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.2 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 text-[10px] font-black">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-1"
              >
                <FiCheck size={12} />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 custom-scrollbar">
            {loading && notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <span className="text-3xl">✨</span>
                <p className="text-xs font-black text-slate-700 dark:text-slate-300">You're all caught up!</p>
                <p className="text-[11px] text-slate-400">No new notifications at this time.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleMarkAsRead(n)}
                  className={`p-3.5 transition-colors cursor-pointer flex items-start gap-3 ${
                    n.is_read
                      ? 'hover:bg-slate-50 dark:hover:bg-slate-800/40 opacity-75'
                      : 'bg-indigo-50/40 dark:bg-indigo-950/20 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/40'
                  }`}
                >
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shrink-0 mt-0.5 shadow-2xs">
                    {getNotificationIcon(n.type)}
                  </div>

                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {n.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                        {formatRelativeTime(n.created_at)}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>

                    {n.action_url && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 pt-0.5">
                        <span>View details</span>
                        <FiExternalLink size={9} />
                      </span>
                    )}
                  </div>

                  {!n.is_read && (
                    <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0 mt-1.5" />
                  )}
                </div>
              ))
            )}
          </div>

        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
