import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiBell, FiCheckCircle, FiAlertTriangle, FiInfo, FiTrash2,
  FiCheck, FiVolume2, FiVolumeX, FiX, FiCalendar, FiMessageSquare, FiClipboard
} from 'react-icons/fi';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

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
    console.error('Audio play error:', e);
  }
};

const getApiUrl = (endpoint) => {
  const base = import.meta.env.VITE_API_BASE_URL || '';
  const cleanBase = base.endsWith('/') ? base : base + '/';
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${cleanBase}${cleanEndpoint}`;
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

const NotificationBell = ({ portal = 'staff' }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [toastNotification, setToastNotification] = useState(null);

  const dropdownRef = useRef(null);
  const prevUnreadCountRef = useRef(0);

  // useEffect(() => {
  //   const handleClickOutside = (e) => {
  //     if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
  //       setIsOpen(false);
  //     }
  //   };
  //   document.addEventListener('mousedown', handleClickOutside);
  //   return () => document.removeEventListener('mousedown', handleClickOutside);
  // }, []);


  useEffect(() => {
  const handleClickOutside = (e) => {
    // Only handle left clicks to prevent clearing selection on right clicks
    if (e.button !== 0) return;
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
      const res = await axios.post(getApiUrl('api/notifications/get_notifications.php'), {
        user_id: currentUser.id,
        portal: portal
      });

      if (res.data.status === 'success') {
        const newUnreadCount = res.data.unread_count || 0;
        const newNotifications = res.data.notifications || [];

        // Check if new unread notification arrived
        if (newUnreadCount > prevUnreadCountRef.current && prevUnreadCountRef.current !== 0) {
          if (soundEnabled) {
            playNotificationSound();
          }
          if (newNotifications.length > 0) {
            const latest = newNotifications[0];
            setToastNotification(latest);
            setTimeout(() => setToastNotification(null), 5000);
          }
        }

        prevUnreadCountRef.current = newUnreadCount;
        setUnreadCount(newUnreadCount);
        setNotifications(newNotifications);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(() => {
      if (!document.hidden) {
        fetchNotifications();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [currentUser, portal, soundEnabled]);

  const handleMarkAsRead = async (notificationId = null, markAll = false) => {
    if (!currentUser?.id) return;
    try {
      await axios.post(getApiUrl('api/notifications/mark_as_read.php'), {
        user_id: currentUser.id,
        notification_id: notificationId,
        mark_all: markAll,
        portal: portal
      });
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleClearRead = async () => {
    if (!currentUser?.id) return;
    try {
      await axios.post(getApiUrl('api/notifications/delete_notification.php'), {
        user_id: currentUser.id,
        clear_read: true
      });
      fetchNotifications();
    } catch (err) {
      console.error('Failed to clear read notifications:', err);
    }
  };

  const handleCardClick = (notification) => {
    if (!notification.is_read) {
      handleMarkAsRead(notification.id);
    }
    setIsOpen(false);
    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'unread') return !n.is_read;
    return true;
  });

  const isDark = portal === 'reviewer';

  return (
    <div className="relative z-50" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2.5 rounded-full transition-all duration-200 focus:outline-none ${isDark
          ? 'text-white/70 hover:text-white hover:bg-white/10'
          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        title="Notifications"
      >
        <FiBell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-600 text-white text-[10px] font-black items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      {toastNotification && (
        <div
          onClick={() => handleCardClick(toastNotification)}
          className={`fixed top-5 right-5 z-[99999] max-w-sm w-full p-4 rounded-2xl shadow-2xl border flex items-start gap-3 cursor-pointer animate-in fade-in slide-in-from-top-4 duration-300 ${isDark
            ? 'bg-dark-900 border-white/10 text-white shadow-brand-500/10'
            : 'bg-white border-slate-200 text-slate-900 shadow-slate-300/50'
            }`}
        >
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 shrink-0">
            <FiBell size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold truncate">{(toastNotification.title || '').replace(/^[\?\s]+/, '')}</p>
            <p className="text-xs text-slate-500 dark:text-white/60 line-clamp-2 mt-0.5">{toastNotification.message}</p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setToastNotification(null); }}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
          >
            <FiX size={16} />
          </button>
        </div>
      )}

      {isOpen && (
        <>
          {/* Mobile backdrop */}
          <div
            className="fixed inset-0 bg-black/40 z-[99998] sm:hidden"
            onClick={() => setIsOpen(false)}
          />
        <div
          className={`
            fixed bottom-0 left-0 right-0 rounded-t-3xl z-[99999] animate-in slide-in-from-bottom-4 duration-300
            sm:absolute sm:bottom-auto sm:left-auto sm:right-0 sm:top-full sm:mt-3 sm:w-96 sm:rounded-3xl sm:animate-in sm:fade-in sm:zoom-in-95 sm:duration-200
            shadow-2xl border overflow-hidden
            ${isDark
            ? 'bg-slate-900 border-white/10 text-white shadow-black/80'
            : 'bg-white border-slate-200 text-slate-900 shadow-slate-300/50'
            }`}
        >
          <div className={`p-4 border-b flex items-center justify-between ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-100 bg-slate-50/60'}`}>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-white/60' : 'hover:bg-slate-200 text-slate-500'}`}
                title={soundEnabled ? 'Mute sound' : 'Unmute sound'}
              >
                {soundEnabled ? <FiVolume2 size={16} /> : <FiVolumeX size={16} />}
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={() => handleMarkAsRead(null, true)}
                  className="text-xs font-semibold text-blue-500 hover:underline flex items-center gap-1"
                >
                  <FiCheck size={14} /> Mark all read
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className={`flex border-b text-xs font-semibold px-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-100 bg-slate-50/50'}`}>
            <button
              onClick={() => setActiveTab('all')}
              className={`py-2.5 px-3 border-b-2 font-bold transition-colors ${activeTab === 'all'
                ? 'border-blue-600 text-blue-600'
                : isDark
                  ? 'border-transparent text-white/50 hover:text-white'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setActiveTab('unread')}
              className={`py-2.5 px-3 border-b-2 font-bold transition-colors ${activeTab === 'unread'
                ? 'border-blue-600 text-blue-600'
                : isDark
                  ? 'border-transparent text-white/50 hover:text-white'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Notifications List */}
          <div className={`max-h-[60vh] sm:max-h-80 overflow-y-auto divide-y ${isDark ? 'divide-white/5' : 'divide-slate-100'}`}>
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleCardClick(n)}
                  className={`p-4 transition-colors flex items-start gap-3 cursor-pointer relative group ${!n.is_read
                    ? isDark ? 'bg-blue-500/10 hover:bg-blue-500/20' : 'bg-blue-50/70 hover:bg-blue-100/60'
                    : isDark ? 'hover:bg-white/5' : 'hover:bg-slate-100/70'
                    }`}
                >
                  {/* Unread Indicator Bar */}
                  {!n.is_read && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-r"></div>
                  )}

                  {/* Avatar or Type Icon */}
                  <div className="shrink-0 mt-0.5">
                    {n.sender_avatar ? (
                      <img
                        src={`${API_BASE}${n.sender_avatar}`}
                        alt={n.sender_name || ''}
                        className={`w-8 h-8 rounded-full object-cover border ${isDark ? 'border-white/10' : 'border-slate-200'}`}
                      />
                    ) : (
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${n.type === 'task_assigned' ? 'bg-blue-100 text-blue-600' :
                        n.type === 'task_approved' ? 'bg-emerald-100 text-emerald-600' :
                          n.type === 'task_rejected' ? 'bg-rose-100 text-rose-600' :
                            n.type === 'comment_added' ? 'bg-purple-100 text-purple-600' :
                              isDark ? 'bg-white/10 text-white/70' : 'bg-slate-100 text-slate-600'
                        }`}>
                        {n.type === 'task_assigned' ? <FiClipboard size={16} /> :
                          n.type === 'task_approved' ? <FiCheckCircle size={16} /> :
                            n.type === 'task_rejected' ? <FiAlertTriangle size={16} /> :
                              n.type === 'comment_added' ? <FiMessageSquare size={16} /> :
                                <FiInfo size={16} />}
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {n.sender_name && (
                          <span className={`text-[11px] font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                            {n.sender_name}
                          </span>
                        )}
                        {n.priority === 'urgent' && (
                          <span className="px-1.5 py-0.2 text-[9px] font-black uppercase rounded bg-rose-100 text-rose-600">Urgent</span>
                        )}
                        {n.priority === 'high' && (
                          <span className="px-1.5 py-0.2 text-[9px] font-black uppercase rounded bg-amber-100 text-amber-600">High</span>
                        )}
                      </div>
                      <span className={`text-[10px] shrink-0 font-medium ${isDark ? 'text-white/40' : 'text-slate-500'}`}>
                        {formatTimeAgo(n.created_at)}
                      </span>
                    </div>

                    <p className={`text-xs font-bold leading-snug mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {(n.title || '').replace(/^[\?\s]+/, '')}
                    </p>

                    <p className={`text-xs leading-relaxed whitespace-pre-line ${isDark ? 'text-white/70 font-normal' : 'text-slate-600 font-medium'}`}>
                      {n.message}
                    </p>

                    {n.action_url && (
                      <div className="mt-2 flex items-center justify-end">
                        <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                          View details &rarr;
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className={`p-8 text-center ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
                <FiBell className="mx-auto mb-2 opacity-50" size={28} />
                <p className="text-xs font-medium">No notifications found</p>
              </div>
            )}
          </div>

          {notifications.some(n => n.is_read) && (
            <div className={`p-3 border-t text-center ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-100 bg-slate-50/50'}`}>
              <button
                onClick={handleClearRead}
                className="text-xs font-semibold text-slate-400 hover:text-rose-500 transition-colors flex items-center justify-center gap-1.5 mx-auto"
              >
                <FiTrash2 size={13} /> Clear read notifications
              </button>
            </div>
          )}
        </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
