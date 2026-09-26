import { useState, useEffect, useRef } from "react";
import { Bell, X, CheckCheck, ShieldAlert, MessageSquare, Bell as BellIcon, Info } from "lucide-react";
import useAuth from "../utlis/Hooks/useAuth";
import { getNotifications, markNotificationAsRead } from "../api/api";

// Notification type → icon & color
const typeConfig = {
  reply:        { icon: MessageSquare, color: "text-blue-500",   bg: "bg-blue-50"   },
  general:      { icon: BellIcon,      color: "text-orange-500", bg: "bg-orange-50" },
  alert:        { icon: ShieldAlert,   color: "text-red-500",    bg: "bg-red-50"    },
  system:       { icon: Info,          color: "text-gray-500",   bg: "bg-gray-50"   },
  purchase:     { icon: CheckCheck,    color: "text-green-500",  bg: "bg-green-50"  },
  subscription: { icon: CheckCheck,   color: "text-purple-500", bg: "bg-purple-50" },
};

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60)   return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} mins ago`;
  if (diff < 86400)return `${Math.floor(diff / 3600)} hours ago`;
  return `${Math.floor(diff / 86400)} days ago`;
}

const NotificationBell = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);

  // DB user_id — fetching uid from Firebase and assuming users table has uid
  // Using user.uid here, need to map uid -> id in backend
  // Or user.db_id if present in AuthProvider
  const userId = user?.db_id || user?.uid;

  const fetchNotifications = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await getNotifications(); // fetches for current user from JWT
      if (res) {
        setNotifications(res.notifications || []);
        setUnreadCount(res.unread_count || 0);
      }
    } catch (err) {
      console.error("Notifications fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch every 30 seconds
  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleOpen = () => {
    setOpen((v) => !v);
  };

  const handleMarkAllRead = async () => {
    try {
      await markNotificationAsRead(null); // null = mark all
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkOne = async (notifId) => {
    try {
      await markNotificationAsRead(notifId);
      setNotifications((prev) =>
        prev.map((n) => n.id === notifId ? { ...n, is_read: true } : n)
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) return null; // Not logged in → no bell

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={handleOpen}
        id="notification-bell-btn"
        className="relative flex items-center justify-center w-9 h-9 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={22} className="text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div
          id="notification-panel"
          className="absolute right-0 top-full mt-3 w-96 max-h-[500px] flex flex-col rounded-2xl bg-white shadow-2xl ring-1 ring-black ring-opacity-5 z-[100] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-800 text-base">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1 text-xs font-medium text-orange-500 hover:text-orange-600 transition-colors"
                >
                  <CheckCheck size={14} />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="overflow-y-auto flex-1">
            {loading && notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <div className="w-6 h-6 border-2 border-orange-400 border-t-transparent rounded-full animate-spin mb-3" />
                <span className="text-sm">Loading...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Bell size={40} className="mb-3 text-gray-200" />
                <p className="text-sm font-medium">No notifications yet</p>
                <p className="text-xs mt-1 text-gray-300">We'll notify you when something arrives</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {notifications.map((notif) => {
                  const cfg = typeConfig[notif.type] || typeConfig.general;
                  const Icon = cfg.icon;
                  const isUnread = !notif.is_read || notif.is_read === "0" || notif.is_read === 0;
                  return (
                    <li
                      key={notif.id}
                      onClick={() => isUnread && handleMarkOne(notif.id)}
                      className={`flex gap-3 px-4 py-3.5 cursor-pointer transition-colors ${
                        isUnread ? "bg-orange-50/40 hover:bg-orange-50/70" : "hover:bg-gray-50"
                      }`}
                    >
                      {/* Icon */}
                      <div className={`mt-0.5 flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${cfg.bg}`}>
                        <Icon size={18} className={cfg.color} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-semibold leading-tight ${isUnread ? "text-gray-900" : "text-gray-600"}`}>
                            {notif.title}
                          </p>
                          {isUnread && (
                            <span className="flex-shrink-0 w-2 h-2 rounded-full bg-orange-500 mt-1" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
                          {notif.message}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          {notif.sender_type === "admin" && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-600">
                              Admin
                            </span>
                          )}
                          <span className="text-[11px] text-gray-400">
                            {timeAgo(notif.created_at)}
                          </span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
