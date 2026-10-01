import { useState, useEffect } from "react";
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
import useAuth from "../utils/Hooks/useAuth";
import { toast } from "react-toastify";
import { AdminNavMenu } from "../config/SideMenu";
import AdminNotifications from "../components/AdminNotifications";
import axios from "axios";
import PikSeaLogo from "../components/Common/PikSeaLogo";

const DashboardLayout = () => {
  const { user, logOut } = useAuth();

  // Ping the server to update last active status
  useEffect(() => {
    if (!user?.email) return;

    let intervalId = null;
    let cancelled = false;

    const pingServer = async () => {
      if (cancelled) return;
      try {
        let token = "";
        if (typeof user.getIdToken === "function") {
          token = await user.getIdToken(true);
        }
        if (cancelled) return;

        await axios.post(
          `${import.meta.env.VITE_LOCALHOST_KEY}/ping.php`,
          { email: user.email },
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            timeout: 10000,
          }
        );
      } catch (error) {
        console.error("Failed to ping server:", error);
      }
    };

    pingServer();
    intervalId = setInterval(pingServer, 3 * 60 * 1000); // every 3 minutes

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [user?.email]);

  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState({ Users: true, Files: true });

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
    <div className="relative flex h-screen w-full overflow-hidden bg-[#0A0A12] text-gray-100">      {" "}
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
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-72 shrink-0 flex-col border-r border-white/10 bg-[#0F0F1A] overflow-y-auto custom-scrollbar transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        {/* LOGO */}
        <div className="flex h-20 shrink-0 items-center justify-between border-b border-white/10 px-6">
          <PikSeaLogo size="sm" subtitle="Admin Console" />
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1.5 hover:bg-white/5 lg:hidden"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* SIDEBAR NAVIGATION ITEMS */}
        <nav className="flex-1 space-y-1.5 px-4 py-6">
          {AdminNavMenu.map((item) => {
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
                    <div className="pl-3 space-y-1.5 border-l border-white/5 ml-6">
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        return (
                          <NavLink
                            key={child.name}
                            to={child.path}
                            onClick={() => setSidebarOpen(false)}
                            className={({ isActive }) =>
                              `flex items-center gap-3 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all duration-200 ${isActive
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
                  `flex items-center gap-3.5 rounded-xl px-4 py-3.5 text-sm font-medium transition-all duration-200 ${isActive
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
        <div className="border-t border-white/10 p-4 space-y-3 bg-black/20 shrink-0">
          {/* User profile info card */}

          <div className="space-y-1">
            <NavLink
              to="/dashboard/account"
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${isActive
                  ? "bg-gradient-to-r from-[#6C4FE0] to-[#FF6B6B] text-white shadow-lg shadow-[#6C4FE0]/25"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              <CircleUserRound size={19} />
              <span>Account</span>
            </NavLink>

            <NavLink
              to="/dashboard/billing-invoices"
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${isActive
                  ? "bg-gradient-to-r from-[#6C4FE0] to-[#FF6B6B] text-white shadow-lg shadow-[#6C4FE0]/25"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              <CreditCard size={19} />
              <span>Billing & Invoices</span>
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
        <header className="relative z-50 flex h-20 shrink-0 items-center justify-between border-b border-white/10 bg-[#0F0F1A]/80 px-6 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 hover:bg-white/5 lg:hidden"
            >
              <Menu size={24} className="text-gray-300" />
            </button>
            <h1 className="text-lg font-bold text-white tracking-wide lg:text-xl">
              Admin Panel
            </h1>
          </div>

          {/* RIGHT ACTIONS */}
          <div className="flex items-center gap-4">
            <AdminNotifications />

            <div className="h-8 w-px bg-white/10" />

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs text-[#00D4FF] font-bold font-outfit uppercase tracking-wider">
                  SUPER ADMIN
                </p>
                <p className="text-xs text-gray-400 font-medium">Platform Governance</p>
              </div>
            </div>
          </div>
        </header>
        {/* PAGE CONTENT CONTAINER */}
       <main className="relative min-w-0 flex-1 flex flex-col overflow-y-auto overflow-x-hidden p-6 md:p-8 custom-scrollbar">      
             <div className="mx-auto w-full flex-1 min-h-0 flex flex-col">

          <Outlet />
        </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

