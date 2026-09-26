import React, { useState, useMemo, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import NotificationBell from '../components/NotificationBell';
import ThemeToggle from '../components/ThemeToggle';
import {
  FiHome, FiUsers, FiAward, FiLogOut, FiMenu, FiX, FiShield, FiClock,
  FiUser, FiSettings, FiCheckCircle, FiPieChart, FiAlertOctagon, FiSidebar,
  FiLayers, FiChevronRight, FiActivity
} from 'react-icons/fi';
import { Toaster, toast } from 'sonner';
import Pusher from 'pusher-js';
import { HiSparkles } from 'react-icons/hi';
import CreditWalletModal from '../components/CreditWalletModal';

const rawApiBase = import.meta.env.VITE_API_BASE_URL || '';
const API_BASE = rawApiBase.replace(/\/+$/, '');

const navItems = [
  { to: '/', icon: FiHome, label: 'Dashboard', badgeKey: null },
  { to: '/brand-resources', icon: FiLayers, label: 'Brand Resources', badgeKey: null },
  { to: '/pending', icon: FiClock, label: 'Pending Reviews', isPending: true },
  { to: '/completed', icon: FiCheckCircle, label: 'Completed Reviews', badgeKey: null },
  { to: '/rejected', icon: FiAlertOctagon, label: 'Rejected', isRejected: true },
  { to: '/reports', icon: FiPieChart, label: 'Reports', badgeKey: null },
  { to: '/team', icon: FiUsers, label: 'My Team', badgeKey: null },
  { to: '/leaderboard', icon: FiAward, label: 'Leaderboard', badgeKey: null },
  { to: '/credits', icon: HiSparkles, label: 'Credit Wallet', badgeKey: null },
  { to: '/profile', icon: FiUser, label: 'Profile', badgeKey: null },
  { to: '/settings', icon: FiSettings, label: 'Settings', badgeKey: null },
];

const ReviewerLayout = ({ children }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);

  // Sidebar toggle state (persisted in localStorage)
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    try {
      const saved = localStorage.getItem('cca_reviewer_sidebar_open');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('cca_reviewer_sidebar_open', JSON.stringify(isSidebarOpen));
    } catch { }
  }, [isSidebarOpen]);

  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);

  // Keyboard shortcut: Ctrl + B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Reviewer Credit Wallet state
  const [wallet, setWallet] = useState(null);

  const fetchWallet = async () => {
    if (!currentUser?.id) return;
    try {
      const res = await fetch(`${API_BASE}/api/credits/get_wallet.php?user_id=${currentUser.id}&portal=reviewer`);
      const data = await res.json();
      if (data?.status === 'success' && data.wallet) {
        setWallet(data.wallet);
      }
    } catch (e) {
      console.error('Failed to fetch reviewer wallet:', e);
    }
  };

  React.useEffect(() => {
    fetchWallet();
    const handleCreditUpdate = () => fetchWallet();
    window.addEventListener('new-notification-received', handleCreditUpdate);
    window.addEventListener('credit-updated', handleCreditUpdate);
    return () => {
      window.removeEventListener('new-notification-received', handleCreditUpdate);
      window.removeEventListener('credit-updated', handleCreditUpdate);
    };
  }, [currentUser]);

  React.useEffect(() => {
    if (!currentUser) return;

    const pusher = new Pusher('82a63711fed4b73bd74d', {
      cluster: 'ap2'
    });

    const channel = pusher.subscribe(`user-${currentUser.id}`);

    channel.bind('new-notification', function (data) {
      toast.info(data.title, {
        description: data.message,
      });
      window.dispatchEvent(new Event('new-notification-received'));
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, [currentUser]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const avatar = currentUser?.profile_picture
    ? `${API_BASE}/${currentUser.profile_picture}`
    : null;

  // Find current active page title for the header
  const currentNav = useMemo(() => {
    return navItems.find(item => item.to === location.pathname) || { label: 'Reviewer Portal' };
  }, [location.pathname]);

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-dark-900/80 backdrop-blur-2xl border-r border-white/5 shadow-2xl select-none">
      {/* Brand Header */}
      <div className="px-5 py-5 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img src="/logo.png" alt="CCA Logo" className="w-9 h-9 object-contain shrink-0 drop-shadow-md" />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-dark-900 shadow-sm" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-white font-black text-sm tracking-tight leading-tight">CCA Review</p>
              <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded-md bg-brand-500/15 text-brand-400 border border-brand-500/25">
                QA
              </span>
            </div>
            <p className="text-white/40 text-[11px] font-medium tracking-wide">Evaluation Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation list */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-black uppercase tracking-wider text-white/30">
          Navigation
        </div>
        {navItems.map(({ to, icon: Icon, label, isRejected, isPending }) => {
          const isActive = location.pathname === to;
          return (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `relative flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group ${isActive
                  ? isRejected
                    ? 'bg-rose-500/15 text-rose-500 font-bold border border-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.15)]'
                    : isPending
                      ? 'bg-amber-500/15 text-amber-500 font-bold border border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
                      : 'bg-brand-500/15 text-brand-400 font-bold border border-brand-500/30 shadow-[0_0_20px_rgba(99,102,241,0.15)]'
                  : isRejected
                    ? 'text-white/50 hover:text-rose-400 hover:bg-rose-500/10'
                    : isPending
                      ? 'text-white/50 hover:text-amber-400 hover:bg-amber-500/10'
                      : 'text-white/50 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <span className={`p-1.5 rounded-lg transition-transform duration-200 group-hover:scale-110 ${isActive
                  ? isRejected ? 'bg-rose-500/20 text-rose-500' : isPending ? 'bg-amber-500/20 text-amber-500' : 'bg-brand-500/20 text-brand-400'
                  : 'bg-white/5 text-white/60 group-hover:text-white'
                  }`}>
                  <Icon size={15} />
                </span>
                <span className="tracking-tight">{label}</span>
              </div>

              {isActive && (
                <motion.div
                  layoutId="activePill"
                  className={`w-1.5 h-4 rounded-full ${isRejected ? 'bg-rose-500' : isPending ? 'bg-amber-500' : 'bg-brand-500'
                    }`}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User profile & action footer */}
      <div className="px-3 py-3 border-t border-white/5 bg-white/[0.01]">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/5 mb-2 hover:border-brand-500/30 transition-colors">
          <div className="relative shrink-0">
            {avatar ? (
              <img src={avatar} className="w-9 h-9 rounded-xl object-cover ring-2 ring-brand-500/30" alt="" />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-700 flex items-center justify-center text-white font-bold text-sm shadow-md">
                {currentUser?.name?.[0]?.toUpperCase() || 'R'}
              </div>
            )}
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-dark-900 animate-pulse" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-white text-xs font-bold truncate leading-tight">{currentUser?.name}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-white/40 text-[10px] truncate">{currentUser?.designation || 'Lead Reviewer'}</span>
              {(currentUser?.employee_code || currentUser?.reviewer_code) && (
                <>
                  <span className="text-white/20 text-[10px]">•</span>
                  <span className="text-brand-400 text-[10px] font-mono font-semibold">
                    {currentUser.employee_code || currentUser.reviewer_code}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/15 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer"
        >
          <FiLogOut size={14} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="relative w-full min-h-screen bg-[rgb(var(--color-dark-950))] text-white/90 overflow-hidden font-sans transition-colors duration-300">
      <Toaster richColors position="top-right" />

      {/* Decorative ambient lighting glows */}
      <div className="fixed top-[-10%] left-[-5%] w-[450px] h-[450px] bg-brand-500/8 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-5%] w-[550px] h-[550px] bg-emerald-500/8 rounded-full blur-[160px] pointer-events-none z-0" />
      <div className="fixed top-[40%] right-[15%] w-[320px] h-[320px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:block fixed inset-y-0 left-0 z-40 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-64 opacity-100 translate-x-0' : 'w-0 opacity-0 -translate-x-full pointer-events-none'
          }`}
      >
        <div className="w-64 h-full">
          <SidebarContent />
        </div>
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative z-50 flex flex-col w-72 h-full"
            >
              <SidebarContent />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Main Wrapper */}
      <div
        className={`relative z-10 min-h-screen flex flex-col transition-all duration-300 ease-in-out ${isSidebarOpen ? 'lg:pl-64' : 'lg:pl-0'
          }`}
      >
        {/* Floating Glass Topbar */}
        <header className="sticky top-0 z-30 px-4 lg:px-8 py-3.5 bg-dark-900/70 backdrop-blur-2xl border-b border-white/5 shadow-xs transition-colors">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Sidebar toggle + Breadcrumbs */}
            <div className="flex items-center gap-3.5">
              <button
                type="button"
                onClick={() => {
                  if (window.innerWidth < 1024) {
                    setMobileOpen(prev => !prev);
                  } else {
                    toggleSidebar();
                  }
                }}
                className={`p-2 rounded-xl border transition-all duration-200 flex items-center justify-center shrink-0 cursor-pointer active:scale-95 ${isSidebarOpen
                  ? 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border-white/10'
                  : 'bg-brand-500/20 text-brand-400 border-brand-500/30 hover:bg-brand-500/30 ring-2 ring-brand-500/20'
                  }`}
                title={isSidebarOpen ? 'Collapse sidebar (Ctrl+B)' : 'Expand sidebar (Ctrl+B)'}
                aria-label="Toggle Sidebar"
              >
                <FiSidebar
                  size={17}
                  className={`transition-transform duration-300 ${!isSidebarOpen ? 'rotate-180 text-brand-400' : 'text-white/70'}`}
                />
              </button>

              <div className="flex items-center gap-2 text-xs font-semibold">
                <span className="text-white/40 hidden sm:inline">CCA Portal</span>
                <FiChevronRight size={13} className="text-white/20 hidden sm:inline" />
                <span className="text-white font-bold text-sm tracking-tight flex items-center gap-1.5">
                  {currentNav.label}
                </span>
              </div>
            </div>

            {/* Right: Quick Status + Credits + Theme Toggle + Notifications */}
            <div className="flex items-center gap-3">
              {/* Reviewer Credits Badge */}
              <button
                type="button"
                onClick={() => setIsWalletModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 hover:bg-amber-500/25 transition-all text-xs font-bold shadow-xs cursor-pointer active:scale-95"
                title="Your Reviewer Credit Wallet"
              >
                <HiSparkles size={14} className="text-amber-400 shrink-0" />
                <span>{wallet !== null ? `${wallet.balance} pts` : '0 pts'}</span>
              </button>

              {/* Online Reviewer Status Pill */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Active Shift</span>
              </div>

              <div className="h-5 w-px bg-white/10 hidden sm:block" />

              <ThemeToggle />
              <NotificationBell portal="reviewer" />
            </div>
          </div>
        </header>

        {/* Page Main Content with Framer Motion Page Transition */}
        <main className="flex-1 p-4 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Reviewer Credit Wallet Modal */}
      <CreditWalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        user={currentUser}
        onBalanceChange={() => fetchWallet()}
      />
    </div>
  );
};

export default ReviewerLayout;

