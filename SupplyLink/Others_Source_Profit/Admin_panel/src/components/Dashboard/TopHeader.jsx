import React, { useState } from "react";
import { FiMenu, FiBell } from "react-icons/fi";
import { useAuth } from "../../Provider/AuthProvider";
import useUsers from "../../utils/Hooks/useUsers";
import useInstallmentNotifications from "../../utils/Hooks/Customers/useInstallmentNotifications";
import NotificationDropdown from "./NotificationDropdown";

const TopHeader = ({ onMenuClick }) => {
  const { user } = useAuth() || {};
  const { users = [] } = useUsers();
  const currentUser = users.find((u) => u?.id === user?.id);
  const targetRoles = ["developer", "staff", "manager", "admin"];
  const userRole =
    targetRoles?.find((role) => user?.role?.includes(role)) || "Staff";

  // Check if current user is Admin or Developer
  const isAdminOrDev = ["admin", "developer"].some((r) =>
    user?.role?.includes(r)
  );

  const {
    notifications,
    unreadCount,
    pendingRequests,
    pendingCount,
    refetch,
    markAsRead,
    markAllAsRead,
  } = useInstallmentNotifications(currentUser || user, userRole);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Badge count: pendingCount for admin/dev, unreadCount for staff/manager
  const badgeCount = isAdminOrDev ? pendingCount : unreadCount;

  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.08] bg-[#060a14]/80 backdrop-blur-xl print:hidden transition-all duration-200">
      <div className="flex items-center justify-between px-4 py-3 md:px-6">
        {/* Left side: Mobile hamburger & desktop system status */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-slate-300 transition hover:bg-white/10 hover:text-white md:hidden"
            aria-label="Open menu"
          >
            <FiMenu className="h-5 w-5" />
          </button>

          <div className="hidden sm:flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            <span>SupplyLink Operational</span>
          </div>
        </div>

        {/* Right side: Notifications & User profile pill */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Bell Icon & Notification Dropdown Container */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-slate-300 transition hover:bg-white/10 hover:text-white focus:outline-none cursor-pointer"
              aria-label="Notifications"
            >
              <FiBell className="h-4 w-4" />
              {badgeCount > 0 ? (
                <span className="absolute -top-1 -right-1 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-lg ring-2 ring-[#060a14] animate-pulse">
                  {badgeCount}
                </span>
              ) : unreadCount > 0 ? (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-cyan-400 ring-2 ring-[#060a14]" />
              ) : (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-slate-600 ring-2 ring-[#060a14]" />
              )}
            </button>

            {/* Real Header Notification Dropdown directly below Bell Icon */}
            <NotificationDropdown
              isOpen={isDropdownOpen}
              onClose={() => setIsDropdownOpen(false)}
              notifications={notifications}
              unreadCount={unreadCount}
              pendingCount={pendingCount}
              onRefresh={refetch}
              markAsRead={markAsRead}
              markAllAsRead={markAllAsRead}
              isAdminOrDev={isAdminOrDev}
              userRole={userRole}
            />
          </div>

          {/* User Profile Pill */}
          <div className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] py-1.5 pl-3 pr-2 transition hover:border-white/15">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-white tracking-tight">
                {currentUser?.name || user?.name || "Staff Member"}
              </div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-indigo-400">
                {userRole}
              </div>
            </div>

            <div className="relative">
              {currentUser?.photo ? (
                <img
                  className="h-8 w-8 rounded-xl object-cover ring-2 ring-indigo-500/30"
                  src={`https://api.supplylinkbd.com/${currentUser.photo}`}
                  alt={currentUser.name || "User"}
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-xs font-bold text-white shadow-inner">
                  {(currentUser?.name || "U")[0]?.toUpperCase()}
                </div>
              )}
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-[#060a14]" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopHeader;
