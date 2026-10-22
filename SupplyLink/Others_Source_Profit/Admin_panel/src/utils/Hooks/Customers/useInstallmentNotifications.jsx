import { useState, useEffect, useCallback } from "react";
import axios from "axios";

export default function useInstallmentNotifications(user, role = "staff") {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await axios.get(
        `${import.meta.env.VITE_LOCALHOST_KEY}/customers/get_notifications.php`,
        {
          params: {
            user_id: user?.id || 0,
            role: role || "staff",
          },
        }
      );
      if (res.data?.success && Array.isArray(res.data?.data)) {
        setNotifications(res.data.data);
        setUnreadCount(Number(res.data.unread_count || 0));
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, role]);

  const markAsRead = async (notificationId) => {
    try {
      await axios.get(
        `${import.meta.env.VITE_LOCALHOST_KEY}/customers/get_notifications.php?action=mark_read&notification_id=${notificationId}`
      );
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: 1 } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (e) {
      console.error("Failed to mark notification read", e);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.get(
        `${import.meta.env.VITE_LOCALHOST_KEY}/customers/get_notifications.php?action=mark_all_read&user_id=${user?.id || 0}`
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch (e) {
      console.error("Failed to mark all read", e);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(() => {
      fetchNotifications();
    }, 15000);

    const handleUpdate = () => {
      fetchNotifications();
    };
    window.addEventListener("installment_updated", handleUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener("installment_updated", handleUpdate);
    };
  }, [fetchNotifications]);

  const pendingRequests = notifications.filter(
    (n) => n.type === "installment_unpaid_request" && n.edit_status === "pending"
  );

  return {
    notifications,
    unreadCount,
    pendingRequests,
    pendingCount: pendingRequests.length,
    isLoading,
    refetch: fetchNotifications,
    markAsRead,
    markAllAsRead,
  };
}
