import React, { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, ExternalLink, Inbox, X } from "lucide-react";
import { getAdminNotifications, markNotificationAsRead } from "../api/notificationApi";;
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import DayalLoader from "./Common/DayalLoader";

const AdminNotifications = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [visibleCount, setVisibleCount] = useState(4);
  const dropdownRef = useRef(null);
  const queryClient = useQueryClient();

  // Fetch Notifications
  const { data, isLoading } = useQuery({
    queryKey: ["admin_notifications"],
    queryFn: getAdminNotifications,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const notifications = data?.notifications || [];
  const unreadCount = data?.unread_count || 0;

  // Mark as read mutation
  const markReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries(["admin_notifications"]);
    },
    onError: () => {
      toast.error("Failed to mark notification as read");
    }
  });

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = (notif) => {
    if (!notif.is_read) {
      markReadMutation.mutate(notif.id);
    }
    setIsOpen(false);
    setSelectedNotification(notif);
  };

  const handleMarkAllRead = () => {
    markReadMutation.mutate(null);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative rounded-lg p-2 transition-colors ${
          isOpen ? "bg-white/10 text-white" : "text-gray-400 hover:bg-white/5 hover:text-white"
        }`}
      >
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#FF6B6B] text-[9px] font-bold text-white ring-2 ring-[#0F0F1A]">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
        <Bell size={20} />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-72 sm:w-80 origin-top-right rounded-2xl border border-white/10 bg-[#12121E] shadow-2xl shadow-black/50 z-[9999] flex flex-col max-h-[50vh] sm:max-h-[380px]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 bg-white/5 rounded-t-2xl">
            <h3 className="text-sm font-semibold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={markReadMutation.isLoading}
                className="flex items-center gap-1 text-[11px] font-medium text-[#6C4FE0] hover:text-white transition-colors"
              >
                <Check size={12} />
                Mark all as read
              </button>
            )}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {isLoading ? (
              <div className="py-4">
                <DayalLoader size="sm" text="Checking notifications..." />
              </div>
            ) : notifications.length > 0 ? (
              <>
                {notifications.slice(0, visibleCount).map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`group block w-full rounded-xl p-3 text-left transition-colors cursor-pointer ${
                      notif.is_read
                        ? "hover:bg-white/5"
                        : "bg-[#6C4FE0]/10 border border-[#6C4FE0]/20 hover:bg-[#6C4FE0]/20"
                    }`}
                  >
                    <div className="flex gap-3 items-start">
                      {/* Icon indicator based on is_read */}
                      <div className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${notif.is_read ? "bg-gray-600" : "bg-[#FF6B6B]"}`} />
                      
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${notif.is_read ? "text-gray-300 font-medium" : "text-white font-semibold"} truncate`}>
                          {notif.title}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-400 truncate">
                          {notif.message}
                        </p>
                        <p className="mt-1.5 text-[10px] text-gray-500 font-medium">
                          {new Date(notif.created_at).toLocaleString('en-US', {
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </div>

                      {notif.link && (
                        <Link to={notif.link} className="flex-shrink-0 p-1.5 rounded-lg bg-white/5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10 hover:text-white" onClick={(e) => { e.stopPropagation(); handleNotificationClick(notif); }}>
                          <ExternalLink size={14} />
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
                
                {visibleCount < notifications.length && (
                  <div className="pt-2 pb-1 flex justify-center">
                    <button
                      onClick={() => setVisibleCount((prev) => prev + 4)}
                      className="text-xs font-semibold text-[#6C4FE0] hover:text-white transition-colors bg-white/5 hover:bg-[#6C4FE0]/80 rounded-xl px-4 py-2"
                    >
                      View More
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                  <Inbox size={20} className="text-gray-500" />
                </div>
                <p className="text-sm font-semibold text-gray-300">No notifications yet</p>
                <p className="text-xs text-gray-500 mt-1">When you get notifications, they'll show up here.</p>
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="border-t border-white/10 p-2 bg-white/5 rounded-b-2xl">
            <div className="w-full text-center rounded-xl py-1.5 text-xs font-medium text-gray-400">
              Admin Notification Center
            </div>
          </div>
        </div>
      )}

      {/* Modal for full notification details */}
      {selectedNotification && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-[#0F0F1A]/80 backdrop-blur-md p-4 transition-all duration-300">
          <div className="w-full max-w-md rounded-2xl border border-[#6C4FE0]/30 bg-[#12121E] p-6 shadow-[0_0_40px_rgba(108,79,224,0.15)] relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Top decorative glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-2 bg-gradient-to-r from-transparent via-[#6C4FE0] to-transparent opacity-50 blur-sm"></div>
            
            <button
              onClick={() => setSelectedNotification(null)}
              className="absolute top-4 right-4 rounded-full p-2 text-gray-400 hover:bg-[#FF6B6B]/10 hover:text-[#FF6B6B] transition-all duration-300"
            >
              <X size={18} />
            </button>
            
            {/* Icon & Title area */}
            <div className="flex items-start gap-4 mb-6 mt-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#6C4FE0]/20 to-[#6C4FE0]/5 border border-[#6C4FE0]/20 shadow-inner flex-shrink-0">
                <Bell size={24} className="text-[#6C4FE0]" />
              </div>
              <div className="flex-1 pr-6">
                <h2 className="text-xl font-bold text-white tracking-wide leading-tight">{selectedNotification.title}</h2>
                <p className="text-[11px] font-semibold text-gray-400 mt-2 uppercase tracking-wider">
                  {new Date(selectedNotification.created_at).toLocaleString('en-US', {
                    month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
            
            {/* Message Area */}
            <div className="rounded-xl bg-[#0F0F1A]/50 p-5 mb-6 border border-white/5 shadow-inner">
              <p className="text-gray-300 text-[15px] whitespace-pre-wrap leading-relaxed">
                {selectedNotification.message}
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setSelectedNotification(null)}
                className="rounded-xl bg-white/5 px-6 py-2.5 text-sm font-semibold text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-300"
              >
                Dismiss
              </button>
              {selectedNotification.link && (
                <Link
                  to={selectedNotification.link}
                  onClick={() => setSelectedNotification(null)}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6C4FE0] to-[#8B73FF] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#6C4FE0]/25 hover:shadow-[#6C4FE0]/40 hover:-translate-y-0.5 transition-all duration-300"
                >
                  View Details
                  <ExternalLink size={16} className="ml-0.5" />
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNotifications;
