import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LogOut,
  Menu,
  X,
  Bell,
  ChevronDown,
  CreditCard,
  CircleUserRound,
} from "lucide-react";
import useAuth from "../utlis/Hooks/useAuth";
import { toast } from "react-toastify";
import { NavMenu } from "../config/SideMenu";
import useAuthorByEmail from "../utlis/Hooks/useAuthorByEmail";
import useNotifications from "../utlis/Hooks/useNotifications";

const timeAgo = (dateStr) => {
  const date = new Date(dateStr);
  const seconds = Math.floor((new Date() - date) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return "Just now";
};

const DashboardLayout = () => {
  const { user, logOut } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState({ Files: true });
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);

  const { data: author } = useAuthorByEmail(user?.email);
  const { data: notifData, markAsRead } = useNotifications();
  const notifications = notifData?.notifications || [];
  const unreadCount = notifData?.unread_count || 0;
  const handleLogout = async () => {
    try {
      await logOut();
      toast.success("Successfully logged out.");
      navigate("/login");
    } catch (error) {
      toast.error("Logout failed: " + error.message);
    }
  };

  const toggleMenu = (menuName) => {
    setOpenMenus((prev) => ({
      ...prev,
      [menuName]: !prev[menuName],
    }));
  };

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-[#0A0A12] text-gray-100">
      {" "}
      {/* BACKGROUND DECORATIONS */}
      <div className="absolute top-[-20%] left-[-10%] h-[600px] w-[600px] rounded-full bg-[#6C4FE0]/5 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] h-[600px] w-[600px] rounded-full bg-[#FF6B6B]/5 blur-[150px] pointer-events-none" />
      {/* OVERLAY FOR MOBILE SIDEBAR */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}
      {/* SIDEBAR CONTAINER */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-72 shrink-0 flex-col border-r border-white/10 bg-[#0F0F1A] transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* LOGO */}
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">
          <span className="bg-gradient-to-r from-[#6C4FE0] via-[#FF6B6B] to-[#ff7900] bg-clip-text text-2xl font-extrabold tracking-tight text-transparent">
            Dayal Stock
          </span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1.5 hover:bg-white/5 lg:hidden"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* SIDEBAR NAVIGATION ITEMS */}
        <nav className="flex-1 space-y-1.5 px-4 py-6 overflow-y-auto">
          {NavMenu.map((item) => {
            const Icon = item.icon;

            if (item.children) {
              const isExpanded = openMenus[item.name];
              return (
                <div key={item.name} className="space-y-1">
                  <button
                    onClick={() => toggleMenu(item.name)}
                    className="flex w-full items-center justify-between rounded-xl px-4 py-3.5 text-sm font-medium text-gray-400 transition-all duration-200 hover:bg-white/5 hover:text-white"
                  >
                    <div className="flex items-center gap-3.5">
                      <Icon size={20} />
                      <span>{item.name}</span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronDown size={16} className="-rotate-90" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="pl-6 space-y-1.5 border-l border-white/5 ml-6">
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        return (
                          <NavLink
                            key={child.name}
                            to={child.path}
                            onClick={() => setSidebarOpen(false)}
                            className={({ isActive }) =>
                              `flex items-center gap-3.5 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all duration-200 ${
                                isActive
                                  ? "bg-gradient-to-r from-[#6C4FE0] to-[#FF6B6B] text-white shadow-lg shadow-[#6C4FE0]/25"
                                  : "text-gray-400 hover:bg-white/5 hover:text-white"
                              }`
                            }
                          >
                            <ChildIcon size={16} />
                            <span>{child.name}</span>
                          </NavLink>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.end}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 rounded-xl px-4 py-3.5 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-[#6C4FE0] to-[#FF6B6B] text-white shadow-lg shadow-[#6C4FE0]/25"
                      : "text-gray-400 hover:bg-white/5 hover:text-white"
                  }`
                }
              >
                <Icon size={20} />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* LOGOUT BUTTON AND USER CARD */}
        <div className="border-t border-white/10 p-4 space-y-3 bg-black/20">
          {/* User profile info card */}

          <div className="space-y-1">
            <NavLink
              to="/dashboard/account"
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-[#6C4FE0] to-[#FF6B6B] text-white shadow-lg shadow-[#6C4FE0]/25"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              <CircleUserRound size={19} />
              <span>Account</span>
            </NavLink>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-400 transition-colors duration-200 hover:bg-red-500/10 hover:text-red-300"
          >
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
      {/* RIGHT SIDE MAIN WRAPPER */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {" "}
        {/* HEADER BAR */}
        <header className="relative z-[1000] flex h-20 items-center justify-between border-b border-white/10 bg-[#0F0F1A]/80 px-6 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 hover:bg-white/5 lg:hidden"
            >
              <Menu size={24} className="text-gray-300" />
            </button>
            <h1 className="text-lg font-bold text-white tracking-wide lg:text-xl">
              Contributor Panel
            </h1>
          </div>

          {/* RIGHT ACTIONS */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white"
              >
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#FF6B6B] text-[10px] font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
                <Bell size={20} />
              </button>

              {/* NOTIFICATION DROPDOWN */}
              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-[998]" onClick={() => setShowNotifications(false)} />
                  <div className="absolute right-0 top-full mt-4 w-80 sm:w-96 rounded-2xl border border-white/20 bg-[#161625] p-5 shadow-[0_10px_40px_rgba(0,0,0,0.8)] backdrop-blur-2xl z-[999]">
                    <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                      <h3 className="text-base font-extrabold text-white tracking-wide">Notifications</h3>
                      {unreadCount > 0 && (
                        <button 
                          onClick={() => { markAsRead(); setShowNotifications(false); }}
                          className="text-xs text-[#6C4FE0] hover:text-[#FF6B6B] transition-colors"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="flex max-h-80 flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar">
                      {notifications.length > 0 ? (
                        notifications.map((notif) => (
                          <div 
                            key={notif.id} 
                            onClick={() => { 
                              if (!notif.is_read) markAsRead(notif.id); 
                              setSelectedNotification(notif);
                              setShowNotifications(false);
                            }}
                            className={`flex cursor-pointer items-start gap-4 rounded-xl p-3.5 transition-all duration-200 ${
                              notif.is_read ? 'hover:bg-white/5 opacity-60' : 'bg-[#6C4FE0]/10 border border-[#6C4FE0]/20 hover:bg-[#6C4FE0]/20'
                            }`}
                          >
                            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full shadow-inner ${notif.is_read ? 'bg-white/5 text-gray-500' : 'bg-gradient-to-br from-[#6C4FE0] to-[#FF6B6B] text-white'}`}>
                              {notif.icon ? <img src={notif.icon} alt="icon" className="h-full w-full rounded-full object-cover" /> : <Bell size={18} />}
                            </div>
                            <div className="flex-1 mt-0.5">
                              <h4 className={`text-sm font-bold ${notif.is_read ? 'text-gray-400' : 'text-white'}`}>
                                {notif.title}
                              </h4>
                              <p className="mt-0.5 text-xs text-gray-400 line-clamp-2">{notif.message}</p>
                              <div className="mt-1.5 flex items-center justify-between">
                                <span className="block text-[10px] text-gray-500">
                                  {timeAgo(notif.created_at)}
                                </span>
                                {notif.sender_name && (
                                  <span className="text-[10px] font-medium text-gray-400 bg-white/5 px-2 py-0.5 rounded-full">
                                    By {notif.sender_name}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-6 text-center text-sm text-gray-500">No new notifications</div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="h-8 w-px bg-white/10" />

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                {author ? (
                  <p 
                    className="text-xs font-bold uppercase tracking-wider" 
                    style={{ color: author.level?.badge_color || "#6B7280" }}
                  >
                    {author.level?.name || "New Contributor"}
                  </p>
                ) : (
                  <div className="h-4 w-24 bg-white/10 rounded animate-pulse mb-1"></div>
                )}
                <p className="text-xs text-gray-400 font-medium">ID: DS-{author?.id || "---"}</p>
              </div>
            </div>
          </div>
        </header>
        {/* PAGE CONTENT CONTAINER */}
        <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-6">
          <div className="mx-auto w-full ">
            <Outlet />
          </div>
        </main>
      </div>

      {/* FULL NOTIFICATION MODAL */}
      {selectedNotification && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg rounded-2xl border border-white/20 bg-[#161625] p-6 shadow-2xl">
            <button 
              onClick={() => setSelectedNotification(null)}
              className="absolute top-4 right-4 rounded-full p-1.5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
            
            <div className="flex items-start gap-4 mb-4">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full shadow-inner bg-gradient-to-br from-[#6C4FE0] to-[#FF6B6B] text-white`}>
                {selectedNotification.icon ? <img src={selectedNotification.icon} alt="icon" className="h-full w-full rounded-full object-cover" /> : <Bell size={24} />}
              </div>
              <div className="flex-1 mt-1">
                <h3 className="text-lg font-bold text-white">{selectedNotification.title}</h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className="block text-xs text-gray-500">
                    {timeAgo(selectedNotification.created_at)}
                  </span>
                  {selectedNotification.sender_name && (
                    <span className="text-xs font-medium text-gray-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                      Sent by {selectedNotification.sender_name}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/5">
              <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                {selectedNotification.message}
              </p>
            </div>

            {selectedNotification.link && (
              <div className="mt-6 flex justify-end">
                <a 
                  href={selectedNotification.link}
                  className="rounded-lg bg-[#6C4FE0] px-5 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-[#5a40c2] transition-colors"
                >
                  View Details
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;
