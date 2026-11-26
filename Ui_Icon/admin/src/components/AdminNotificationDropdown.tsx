// admin/src/components/AdminNotificationDropdown.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminNotification } from '@/types/admin';
import { 
  getAdminNotifications, 
  markAdminNotificationRead, 
  deleteAdminNotification, 
  clearAllReadAdminNotifications 
} from '@/lib/api';

export default function AdminNotificationDropdown() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'orders' | 'users' | 'inquiries'>('all');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const lastFetchRef = useRef<number>(0);

  const fetchNotifications = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const res = await getAdminNotifications();
      if (res.success && res.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unread_count || 0);
        lastFetchRef.current = Date.now();
      }
    } catch {
      // Ignore network errors
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications(true);

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchNotifications(false);
      }
    }, 45000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastFetchRef.current > 25000) {
        fetchNotifications(false);
      }
    };

    window.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);

    return () => {
      clearInterval(interval);
      window.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
    };
  }, [fetchNotifications]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    try {
      await markAdminNotificationRead('all');
    } catch {
      fetchNotifications();
    }
  };

  const handleItemClick = async (notif: AdminNotification) => {
    if (!notif.is_read) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      markAdminNotificationRead(notif.id).catch(() => {});
    }

    setIsOpen(false);

    // Map notification types to internal admin routes
    if (notif.type.includes('order') || notif.type.includes('payment') || notif.type.includes('subscription')) {
      navigate('/billing');
    } else if (notif.type.includes('user')) {
      navigate('/users');
    } else if (notif.type.includes('contact')) {
      navigate('/contact-messages');
    } else if (notif.link && !notif.link.startsWith('http')) {
      navigate(notif.link);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    const target = notifications.find((n) => n.id === id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (target && !target.is_read) {
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    try {
      await deleteAdminNotification(id);
    } catch {
      fetchNotifications();
    }
  };

  const handleClearRead = async () => {
    setNotifications((prev) => prev.filter((n) => !n.is_read));
    try {
      await clearAllReadAdminNotifications();
    } catch {
      fetchNotifications();
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    try {
      const now = new Date();
      const past = new Date(dateStr);
      const diffMs = now.getTime() - past.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHr = Math.floor(diffMin / 60);
      const diffDays = Math.floor(diffHr / 24);

      if (diffSec < 60) return 'Just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      if (diffHr < 24) return `${diffHr}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      return past.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    } catch {
      return dateStr;
    }
  };

  const getAlertIcon = (type: string) => {
    if (type.includes('order') || type.includes('payment')) {
      return (
        <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      );
    }
    if (type.includes('user')) {
      return (
        <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        </div>
      );
    }
    if (type.includes('contact')) {
      return (
        <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      </div>
    );
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'orders') return n.type.includes('order') || n.type.includes('payment') || n.type.includes('subscription');
    if (activeTab === 'users') return n.type.includes('user') || n.type.includes('team');
    if (activeTab === 'inquiries') return n.type.includes('contact');
    return true;
  });

  const hasReadNotifications = notifications.some((n) => n.is_read);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Admin Bell Icon */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications(false);
        }}
        className="relative p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
        aria-label="Admin Notifications"
        title="Admin Notifications & Alerts"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-[10px] font-extrabold text-white ring-2 ring-slate-900 shadow">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl z-50 overflow-hidden text-slate-200 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-950/40">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight">Admin Alerts</h3>
              {unreadCount > 0 ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {unreadCount} new
                </span>
              ) : (
                <span className="text-[11px] text-slate-400">All read</span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="px-2 py-1 text-[11px] font-semibold text-purple-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 p-2 border-b border-slate-800/80 bg-slate-950/20 text-xs overflow-x-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-purple-600/30 text-purple-200 border border-purple-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-emerald-600/30 text-emerald-200 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Orders
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-purple-600/30 text-purple-200 border border-purple-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab('inquiries')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'inquiries'
                  ? 'bg-amber-600/30 text-amber-200 border border-amber-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Inquiries
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-800/60">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading alerts...</div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                <div className="text-slate-300 font-semibold mb-1">No alerts found</div>
                <div className="text-slate-500 text-[11px]">New orders, user signups, and messages will show here.</div>
              </div>
            ) : (
              filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleItemClick(notif)}
                  className={`group relative p-3.5 flex items-start gap-3 transition-colors cursor-pointer ${
                    notif.is_read
                      ? 'bg-transparent hover:bg-slate-800/40'
                      : 'bg-purple-950/20 hover:bg-purple-950/30'
                  }`}
                >
                  {getAlertIcon(notif.type)}

                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <h4 className="text-xs font-bold text-white truncate">{notif.title}</h4>
                      {!notif.is_read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed break-words">
                      {notif.message}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-500">
                      <span>{formatRelativeTime(notif.created_at)}</span>
                      {notif.target_role && (
                        <span className="capitalize px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          {notif.target_role}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleDelete(e, notif.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 rounded transition-all cursor-pointer absolute top-3 right-3"
                    title="Dismiss"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {hasReadNotifications && (
            <div className="p-2.5 border-t border-slate-800 bg-slate-950/30 flex items-center justify-between text-[11px]">
              <button
                onClick={handleClearRead}
                className="text-slate-400 hover:text-red-400 px-2 py-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Clear read alerts
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/billing');
                }}
                className="text-purple-300 hover:text-white px-2 py-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
              >
                View Orders →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
