import { NavLink } from "react-router-dom";
import CollapsibleMenu from "../CollapsibleMenu ";
import { sidebarMenu } from "../../../public/sidebarMenu";
import { useAuth } from "../../Provider/AuthProvider";
import useUsers from "../../utils/Hooks/useUsers";
import useCashReports from "../../utils/Hooks/cash/useCashReports";
import { FiLogOut, FiX } from "react-icons/fi";

const linkClass = ({ isActive }) =>
  `px-3.5 py-2.5 rounded-xl flex items-center gap-3 text-sm font-medium transition-all duration-200 ${
    isActive
      ? "bg-gradient-to-r from-indigo-600/30 via-indigo-600/15 to-transparent text-white font-semibold border-l-2 border-indigo-500 shadow-sm"
      : "text-slate-400 hover:text-white hover:bg-white/[0.05]"
  }`;

const Sidebar = ({ onLinkClick, closeDrawer }) => {
  const { user, logout } = useAuth();
  const { users } = useUsers();
  const { CashReports } = useCashReports();

  const pendingCashApproval = Array.isArray(CashReports)
    ? CashReports.filter(
        (cash) => cash.approval_status?.toLowerCase() === "pending"
      ).length
    : 0;

  if (!user) return null;

  const targetRoles = ["developer", "admin", "audit", "manager", "staff"];
  const userRole =
    targetRoles?.find((role) => user?.role?.includes(role)) || "Staff";

  const runningUser = users?.find((u) => u?.id === user?.id);
  const hasAccess = (item) => {
    if (!item.roles) return true;
    if (!Array.isArray(user?.role)) return false;

    if (user.role.some((role) => item.roles.includes(role))) {
      return true;
    }

    // Audit role: Has full read-only visibility for any menu item available to admin, developer, manager, or staff
    if (user.role.includes("audit")) {
      return (
        item.roles.includes("admin") ||
        item.roles.includes("developer") ||
        item.roles.includes("manager") ||
        item.roles.includes("staff")
      );
    }

    return false;
  };

  const handleLoutOut = async () => {
    try {
      await logout();
    } finally {
      window.location.href = "/sign_in";
    }
  };

  const handleLinkClick = () => {
    onLinkClick?.();
    closeDrawer?.();
  };

  return (
    <div className="flex flex-col h-full select-none">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-3 py-4 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/25 ring-1 ring-white/20">
            <span className="font-mono text-base font-extrabold text-white">SL</span>
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">
              SupplyLink
            </h1>
            <span className="inline-block rounded-md bg-indigo-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-300 border border-indigo-500/25">
              {userRole} Panel
            </span>
          </div>
        </div>

        {closeDrawer && (
          <button
            onClick={closeDrawer}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white md:hidden"
            aria-label="Close Drawer"
          >
            <FiX className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* User Card */}
      <div className="p-3 my-3">
        <div className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3 backdrop-blur-sm">
          <div className="relative shrink-0">
            {runningUser?.photo ? (
              <img
                className="h-10 w-10 rounded-xl object-cover ring-2 ring-indigo-500/30"
                src={`https://api.supplylinkbd.com/${runningUser.photo}`}
                alt={runningUser.name || "User"}
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-sm font-bold text-indigo-400">
                {(runningUser?.name || "U")[0]?.toUpperCase()}
              </div>
            )}
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-[#090f1d]" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              {runningUser?.name || "Staff Member"}
            </p>
            <p className="text-[11px] text-slate-400 font-mono">
              ID: {runningUser?.id || user?.id}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 px-3 py-1 flex-1 overflow-y-auto custom-scrollbar">
        {sidebarMenu.filter(hasAccess).map((item, index) =>
          item.type === "collapse" ? (
            <CollapsibleMenu
              key={index}
              {...item}
              children={item.children?.filter(hasAccess)}
              onLinkClick={handleLinkClick}
              pendingCashApproval={pendingCashApproval}
            />
          ) : (
            <NavLink
              key={index}
              to={item.path}
              end
              className={linkClass}
              onClick={handleLinkClick}
            >
              <div className="flex items-center gap-3 w-full">
                <item.icon className="w-5 h-5 shrink-0 opacity-80" />
                <span className="truncate">{item.label}</span>
              </div>
            </NavLink>
          )
        )}
      </nav>

      {/* Logout Footer */}
      <div className="mt-auto p-3 border-t border-white/[0.08]">
        <button
          type="button"
          data-logout="true"
          onClick={handleLoutOut}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] py-2.5 text-xs font-semibold text-slate-400 transition-all duration-200 hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-400 cursor-pointer"
        >
          <FiLogOut className="h-4 w-4" />
          <span>লগআউট (Logout)</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
