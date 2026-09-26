import { authFetch } from "./authFetch";

export const getAdminNotifications = async () => {
  const url = `${import.meta.env.VITE_LOCALHOST_KEY}/notifications/get_admin_notifications.php`;
  const res = await authFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ limit: 50, offset: 0 }),
  });
  const data = await res.json();
  
  if (!data.success) {
    throw new Error(data.message);
  }
  return data; // returns { notifications: [], total: x }
};

export const markNotificationAsRead = async (notificationId = null) => {
  const url = `${import.meta.env.VITE_LOCALHOST_KEY}/notifications/mark_as_read.php`;
  const body = notificationId ? { notification_id: notificationId } : {};
  
  const res = await authFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  
  if (!data.success) {
    throw new Error(data.message);
  }
  return data;
};

export const sendNotification = async (notifData) => {
  const url = `${import.meta.env.VITE_LOCALHOST_KEY}/notifications/send_notification.php`;
  const res = await authFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(notifData),
  });
  const data = await res.json();
  
  if (!data.success) {
    throw new Error(data.message);
  }
  return data;
};
