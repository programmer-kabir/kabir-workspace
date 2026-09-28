import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAdminNotifications, sendNotification, markNotificationAsRead } from "../../api/notificationApi";
import { getAllUsers } from "../../api/userApi";
import { Bell, Send, CheckCircle2 } from "lucide-react";
import Swal from 'sweetalert2';
import DayalLoader from "../../components/Common/DayalLoader";

const Notifications = () => {
  const queryClient = useQueryClient();
  const [isSending, setIsSending] = useState(false);
  const [formData, setFormData] = useState({
    user_id: '',
    title: '',
    message: '',
    type: 'general',
    priority: 'normal'
  });

  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ["admin_notifications"],
    queryFn: getAdminNotifications,
  });

  const { data: usersData } = useQuery({
    queryKey: ["users_for_notification"],
    queryFn: () => getAllUsers(),
  });

  const sendMutation = useMutation({
    mutationFn: (data) => sendNotification(data),
    onSuccess: () => {
      Swal.fire({ title: "Sent!", text: "Notification sent successfully.", icon: "success", background: '#12121E', color: '#fff' });
      setFormData({ user_id: '', title: '', message: '', type: 'general', priority: 'normal' });
      setIsSending(false);
      queryClient.invalidateQueries(["admin_notifications"]);
    }
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => markNotificationAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["admin_notifications"]);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMutation.mutate(formData);
  };

  return (
    <div className="p-6 mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            <Bell className="text-[#6C4FE0]" />
            Notifications
          </h1>
          <p className="text-sm text-gray-400">Send alerts to users and view system notifications.</p>
        </div>
        <button
          onClick={() => setIsSending(!isSending)}
          className="flex items-center gap-2 bg-[#6C4FE0] hover:bg-[#5b3fd4] text-white px-4 py-2 rounded-xl transition-colors"
        >
          <Send size={18} />
          {isSending ? "View History" : "Send New"}
        </button>
      </div>

      {isSending ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 max-w-2xl">
          <h2 className="text-xl font-bold text-white mb-6">Send Notification</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Recipient</label>
              <select required value={formData.user_id} onChange={e => setFormData({...formData, user_id: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#6C4FE0]">
                <option value="" className="bg-[#12121E]">Select User</option>
                {usersData?.map(u => (
                  <option key={u.id} value={u.id} className="bg-[#12121E]">{u.full_name} (@{u.username})</option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Type</label>
                <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#6C4FE0]">
                  <option value="general" className="bg-[#12121E]">General</option>
                  <option value="alert" className="bg-[#12121E]">Alert</option>
                  <option value="success" className="bg-[#12121E]">Success</option>
                  <option value="warning" className="bg-[#12121E]">Warning</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Priority</label>
                <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#6C4FE0]">
                  <option value="normal" className="bg-[#12121E]">Normal</option>
                  <option value="high" className="bg-[#12121E]">High</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Title</label>
              <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#6C4FE0]" />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Message</label>
              <textarea required rows="4" value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#6C4FE0] resize-none"></textarea>
            </div>

            <button type="submit" disabled={sendMutation.isPending} className="w-full bg-[#6C4FE0] hover:bg-[#5b3fd4] disabled:opacity-50 text-white px-4 py-3 rounded-xl transition-colors font-medium">
              {sendMutation.isPending ? "Sending..." : "Send Notification"}
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          {isLoading ? (
            <DayalLoader text="Loading notifications..." />
          ) : (
            <div className="divide-y divide-white/5">
              {notificationsData?.notifications?.map((notif) => (
                <div key={notif.id} className={`p-4 flex items-start gap-4 hover:bg-white/5 transition-colors ${!notif.is_read ? 'bg-[#6C4FE0]/5' : ''}`}>
                  <div className={`p-3 rounded-xl ${!notif.is_read ? 'bg-[#6C4FE0]/20 text-[#6C4FE0]' : 'bg-white/5 text-gray-400'}`}>
                    <Bell size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-sm font-medium ${!notif.is_read ? 'text-white' : 'text-gray-300'}`}>{notif.title}</h3>
                    <p className="text-sm text-gray-400 mt-1">{notif.message}</p>
                    <span className="text-xs text-gray-500 mt-2 block">{new Date(notif.created_at).toLocaleString()}</span>
                  </div>
                  {!notif.is_read && (
                    <button onClick={() => markReadMutation.mutate(notif.id)} className="p-2 text-[#6C4FE0] hover:bg-[#6C4FE0]/10 rounded-lg transition-colors" title="Mark as read">
                      <CheckCircle2 size={18} />
                    </button>
                  )}
                </div>
              ))}
              {(!notificationsData?.notifications || notificationsData.notifications.length === 0) && (
                <div className="text-center py-10 text-gray-400">
                  No notifications history found.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Notifications;
