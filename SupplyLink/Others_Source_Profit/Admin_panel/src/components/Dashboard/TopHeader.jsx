import React from "react";
import { FiMenu, FiBell } from "react-icons/fi";
import { useAuth } from "../../Provider/AuthProvider";
import useUsers from "../../utils/Hooks/useUsers";

const TopHeader = ({ onMenuClick }) => {
  const { user } = useAuth() || {};
  const { users = [] } = useUsers();
  const currentUser = users.find((u) => u?.id === user?.id);
  const targetRoles = ["developer", "staff", "manager", "admin"];
  const userRole =
    targetRoles?.find((role) => user?.role?.includes(role)) || "Staff";


  return (
    <header className="sticky top-0 z-20 border-b border-white/[0.08] bg-[#060a14]/80 backdrop-blur-xl print:hidden transition-all duration-200">
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
          <button
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-slate-300 transition hover:bg-white/10 hover:text-white"
            aria-label="Notifications"
          >
            <FiBell className="h-4 w-4" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-[#060a14]" />
          </button>

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
