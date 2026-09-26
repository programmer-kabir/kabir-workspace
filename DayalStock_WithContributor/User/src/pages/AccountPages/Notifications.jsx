import React, { useEffect, useState } from 'react';
import useAuth from '../../utlis/Hooks/useAuth';
import { getNotifications, markNotificationAsRead } from '../../api/api';
import { Bell, Check, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-toastify';

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      setLoading(true);
      // Ensure we have a valid database user ID. (Assuming Firebase UID mapped to your SQL user ID in user context).
      // Since your schema uses INT UNSIGNED for user_id, we need the numerical ID. 
      // If user.id is not available, we assume the backend handles lookup by email if needed, 
      // but for now let's pass user.id or a fallback.
      const userId = user?.id || 1; // Fallback or mapping required if user object doesn't have sql id.
      
      const data = await getNotifications(userId);
      if (data) {
        setNotifications(data);
      }
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const handleMarkAsRead = async (notificationId = null) => {
    try {
      const userId = user?.id || 1;
      await markNotificationAsRead(userId, notificationId);
      
      // Update local state to reflect UI change instantly
      if (notificationId) {
        setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, is_read: 1 } : n));
      } else {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
        toast.success("All notifications marked as read.");
      }
    } catch (error) {
      console.error("Failed to mark as read", error);
      toast.error("Failed to update notification status.");
    }
  };

  const unreadCount = notifications.filter(n => parseInt(n.is_read) === 0).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          Notifications 
          {unreadCount > 0 && (
            <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
              {unreadCount} New
            </span>
          )}
        </h1>
        {unreadCount > 0 && (
          <button 
            onClick={() => handleMarkAsRead()}
            className="text-sm font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1"
          >
            <Check size={16} /> Mark all as read
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-[#111] rounded-3xl shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden divide-y divide-gray-100 dark:divide-white/5 min-h-[300px] transition-colors">
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-48 text-gray-500 dark:text-gray-400">
            <Bell size={48} className="mb-4 text-gray-300 dark:text-gray-600" />
            <p>You have no notifications right now.</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div 
              key={notif.id} 
              className={`p-6 flex items-start gap-4 transition-colors ${parseInt(notif.is_read) === 0 ? 'bg-orange-50 dark:bg-orange-900/10' : 'bg-white dark:bg-transparent'}`}
            >
              <div className="shrink-0 mt-1">
                {notif.icon ? (
                  <img src={notif.icon} alt="" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${parseInt(notif.is_read) === 0 ? 'bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400' : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400'}`}>
                    <Bell size={20} />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className={`font-bold ${parseInt(notif.is_read) === 0 ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                    {notif.title}
                  </h4>
                  <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {new Date(notif.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className={`text-sm mt-1 leading-relaxed ${parseInt(notif.is_read) === 0 ? 'text-gray-800 dark:text-gray-200 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
                  {notif.message}
                </p>
                {notif.link && (
                  <a href={notif.link} className="inline-block mt-3 text-sm font-semibold text-orange-500 hover:text-orange-600">
                    View Details →
                  </a>
                )}
              </div>
              {parseInt(notif.is_read) === 0 && (
                <button 
                  onClick={() => handleMarkAsRead(notif.id)}
                  title="Mark as read"
                  className="shrink-0 p-2 text-gray-400 dark:text-gray-500 hover:text-green-500 transition-colors"
                >
                  <CheckCircle2 size={20} />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;