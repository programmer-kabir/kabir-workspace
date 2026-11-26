// frontend/src/components/header/NotificationDropdown.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  X, 
  Users, 
  CreditCard, 
  Shield, 
  Sparkles, 
  AlertCircle,
  RefreshCw,
  BellOff
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AppNotification } from '@/types/icon';
import { 
  getNotifications, 
  markNotificationRead, 
  deleteNotification, 
  clearAllReadNotifications
} from '@/lib/api';

export default function NotificationDropdown() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'admin'>('all');


  const dropdownRef = useRef<HTMLDivElement>(null);
  const lastFetchRef = useRef<number>(0);

  const isAdmin = Boolean(user && (user.roles?.includes('admin') || user.role === 'admin'));

  // Fetch notifications
  const fetchNotifications = useCallback(async (showLoading = false) => {
    if (!user) return;
    if (showLoading) setLoading(true);
    try {
      const res = await getNotifications();
      if (res.success && res.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unread_count || 0);
        lastFetchRef.current = Date.now();
      }
    } catch {
      // Silently ignore if offline
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [user]);

  // Initial fetch and smart polling
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    fetchNotifications(true);

    // Smart polling: poll every 60s only when tab is visible
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchNotifications(false);
      }
    }, 20000);

    // Re-fetch on tab focus if > 30s since last fetch
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastFetchRef.current > 10000) {
        fetchNotifications(false);
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [user, fetchNotifications]);

  // Click outside to close
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

  // Mark all as read
  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    try {
      await markNotificationRead('all');
    } catch {
      fetchNotifications();
    }
  };

  // Mark single as read
  const handleItemClick = async (notif: AppNotification) => {
    if (!notif.is_read) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      markNotificationRead(notif.id).catch(() => {});
    }

    if (notif.link) {
      setIsOpen(false);
      if (notif.link.startsWith('http')) {
        window.open(notif.link, '_blank');
      } else {
        navigate(notif.link);
      }
    }
  };

  // Delete notification
  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    const target = notifications.find((n) => n.id === id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (target && !target.is_read) {
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    try {
      await deleteNotification(id);
    } catch {
      fetchNotifications();
    }
  };

  // Clear all read
  const handleClearRead = async () => {
    setNotifications((prev) => prev.filter((n) => !n.is_read));
    try {
      await clearAllReadNotifications();
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

  const getNotificationIcon = (type: string, icon: string) => {
    if (type === 'team_approved') {
      return (
        <div className="size-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300 shrink-0">
          <Users className="size-4" />
        </div>
      );
    }
    if (type === 'team_declined') {
      return (
        <div className="size-8 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-300 shrink-0">
          <Users className="size-4" />
        </div>
      );
    }
    if (type.startsWith('team')) {
      return (
        <div className="size-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0">
          <Users className="size-4" />
        </div>
      );
    }
    if (type.startsWith('payment') || type === 'subscription') {
      return (
        <div className="size-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300 shrink-0">
          <CreditCard className="size-4" />
        </div>
      );
    }
    if (type.startsWith('admin_')) {
      return (
        <div className="size-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300 shrink-0">
          <Shield className="size-4" />
        </div>
      );
    }
    if (icon === 'sparkles' || type === 'system') {
      return (
        <div className="size-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 shrink-0">
          <Sparkles className="size-4" />
        </div>
      );
    }
    return (
      <div className="size-8 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-slate-300 shrink-0">
        <Bell className="size-4" />
      </div>
    );
  };

  // Filter notifications by tab
  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'unread') return !n.is_read;
    if (activeTab === 'admin') return n.target_role === 'admin' || n.type.startsWith('admin_');
    return true;
  });

  const hasReadNotifications = notifications.some((n) => n.is_read);

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            fetchNotifications(false);
          }
        }}
        className="relative size-9 sm:size-10 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100/90 hover:bg-slate-200/90 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200/80 hover:border-slate-300 dark:border-white/10 dark:hover:border-white/20 shadow-sm hover:shadow transition-all duration-200 cursor-pointer"
        aria-label="Notifications"
        title="Notifications"
      >
        <Bell className="size-4 sm:size-4.5" />
        
        {/* Unread indicator */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-[10px] font-extrabold text-white shadow-lg shadow-purple-950 ring-2 ring-white dark:ring-[#0d0e15] animate-in zoom-in-50 duration-200">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Drawer Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-[340px] sm:w-[390px] rounded-2xl bg-white dark:bg-[#141522] border border-slate-200 dark:border-white/10 shadow-2xl shadow-slate-900/10 dark:shadow-black/80 z-50 overflow-hidden text-slate-800 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Notifications</h3>
              {unreadCount > 0 ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/20 dark:border-purple-500/30">
                  {unreadCount} new
                </span>
              ) : (
                <span className="text-[11px] text-slate-500 dark:text-slate-400">All caught up</span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100/80 dark:bg-white/5 dark:hover:bg-white/10 text-[11px] font-semibold text-purple-700 dark:text-purple-300 transition-colors cursor-pointer"
                  title="Mark all notifications as read"
                >
                  <CheckCheck className="size-3" />
                  <span>Mark all read</span>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 p-2 border-b border-slate-100 dark:border-white/5 bg-slate-50/30 dark:bg-white/[0.01] text-xs">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-purple-100 dark:bg-purple-600/30 text-purple-800 dark:text-purple-200 border border-purple-200 dark:border-purple-500/30 font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setActiveTab('unread')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                activeTab === 'unread'
                  ? 'bg-purple-100 dark:bg-purple-600/30 text-purple-800 dark:text-purple-200 border border-purple-200 dark:border-purple-500/30 font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              Unread ({unreadCount})
            </button>
            {isAdmin && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-500/30 font-semibold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                <Shield className="size-3" />
                <span>Admin</span>
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 dark:divide-white/5">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                <RefreshCw className="size-5 animate-spin text-purple-400" />
                <span>Loading notifications...</span>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                <div className="size-10 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-1">
                  <BellOff className="size-5" />
                </div>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {activeTab === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                </span>
                <span className="text-[11px] text-slate-500 max-w-[220px]">
                  When you receive team invitations, receipts, or updates, they will appear here.
                </span>
              </div>
            ) : (
              filteredNotifications.map((notif) => {
                const isTeamInvite = notif.type === 'team_invite' && notif.action_data?.invite_id;
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleItemClick(notif)}
                    className={`group relative p-3.5 flex items-start gap-3 transition-colors cursor-pointer ${
                      notif.is_read
                        ? 'bg-transparent hover:bg-slate-50 dark:hover:bg-white/[0.02]'
                        : 'bg-purple-50/70 hover:bg-purple-50 dark:bg-purple-950/20 dark:hover:bg-purple-950/30'
                    }`}
                  >
                    {/* Category Icon */}
                    {getNotificationIcon(notif.type, notif.icon)}

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {notif.title}
                        </h4>
                        {!notif.is_read && (
                          <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
                        )}
                      </div>

                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed break-words">
                        {notif.message}
                      </p>

                      {/* Team invite: show a "View Billing" link instead of buttons */}
                      {isTeamInvite && (
                        <div className="mt-2 text-[11px] text-purple-600 dark:text-purple-400 font-medium">
                          → Go to <span className="underline underline-offset-2 cursor-pointer" onClick={() => { setIsOpen(false); navigate('/billing'); }}>Billing &amp; Invoices</span> to accept or decline.
                        </div>
                      )}

                      <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500">
                        <span>{formatRelativeTime(notif.created_at)}</span>
                        {notif.target_role && notif.target_role !== 'all' && (
                          <span className="capitalize px-1.5 py-0.2 rounded bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/5">
                            {notif.target_role}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Delete button (on hover) */}
                    <button
                      onClick={(e) => handleDelete(e, notif.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all cursor-pointer absolute top-3 right-3"
                      title="Dismiss notification"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {hasReadNotifications && (
            <div className="p-2.5 border-t border-slate-100 dark:border-white/10 bg-slate-50/30 dark:bg-white/[0.01] flex items-center justify-between text-[11px]">
              <button
                onClick={handleClearRead}
                className="text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-300 inline-flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                <Trash2 className="size-3" />
                <span>Clear read notifications</span>
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/billing');
                }}
                className="text-purple-600 dark:text-purple-300 hover:text-purple-800 dark:hover:text-white font-semibold px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                View Billing →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
