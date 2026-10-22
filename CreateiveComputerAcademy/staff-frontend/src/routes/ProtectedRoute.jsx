import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Pusher from 'pusher-js';
import { useAuth } from '../context/AuthContext';
import AuthenticatedLayout from '../layouts/AuthenticatedLayout';
import {
  FiAlertOctagon, FiRefreshCw, FiShield, FiClock, FiAlertTriangle,
  FiArrowLeft, FiCheckCircle, FiHome, FiList, FiMessageSquare, FiUser, FiLock
} from 'react-icons/fi';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

const MODULE_NAMES = {
  '/payroll': { name: 'Work Wallet & Payroll', bn: 'পেরোল ও স্যালারি ওয়ালেট', icon: '💼' },
  '/tasks': { name: 'Task Management', bn: 'টাস্ক ম্যানেজমেন্ট', icon: '📋' },
  '/mango-tree': { name: 'Mango Break Tree', bn: 'ম্যাংগো ব্রেক ট্রি', icon: '🥭' },
  '/break-tree': { name: 'Mango Break Tree', bn: 'ম্যাংগো ব্রেক ট্রি', icon: '🥭' },
  '/breaks': { name: 'Breaks Log', bn: 'ব্রেকস লগ ও হিস্টোরি', icon: '☕' },
  '/attendance': { name: 'Attendance System', bn: 'হাজিরা ও শিফট সিস্টেম', icon: '⏰' },
  '/leave': { name: 'Leave Applications', bn: 'ছুটির আবেদন', icon: '📅' },
  '/community': { name: 'Community Wall', bn: 'কমিউনিটি ওয়াল', icon: '👥' },
  '/messages': { name: 'Messages & Chat', bn: 'মেসেজ ও চ্যাট সিস্টেম', icon: '💬' },
  '/credits': { name: 'Credit Wallet', bn: 'ক্রেডিট ওয়ালেট', icon: '🪙' },
  '/reports': { name: 'Performance Reports', bn: 'রিপোর্টস ও অ্যানালিটিক্স', icon: '📊' },
  '/content-studio': { name: 'Content Studio', bn: 'কনটেন্ট স্টুডিও', icon: '🎬' },
  '/feed': { name: 'Academy Feed', bn: 'একাডেমি ফিড', icon: '📖' },
  '/desktop-app': { name: 'Desktop App & Updates', bn: 'ডেস্কটপ অ্যাপ ডাউনলোড', icon: '💻' },
  '/brand-kit': { name: 'Brand Kit', bn: 'ব্র্যান্ড কিট', icon: '✨' },
  '/profile': { name: 'Staff Profile', bn: 'প্রোফাইল', icon: '👤' },
  '/settings': { name: 'Settings', bn: 'সেটিংস', icon: '⚙️' }
};

const ModuleMaintenanceView = ({ route, userMessage, updatedBy, onRecheck }) => {
  const navigate = useNavigate();
  const [rechecking, setRechecking] = useState(false);
  const info = MODULE_NAMES[route] || { name: 'Specific Module', bn: 'নির্দিষ্ট মডিউল', icon: '🔒' };
  const displayMsg = userMessage || 'আপনার অ্যাকাউন্টের জন্য এই মডিউলে সাময়িকভাবে ডাটা আপডেট বা অডিট চলছে। খুব শীঘ্রই এটি সচল করা হবে।';

  const handleRecheckClick = async () => {
    setRechecking(true);
    if (typeof onRecheck === 'function') {
      try {
        await onRecheck();
      } catch {
        // Suppress
      }
    }
    setTimeout(() => setRechecking(false), 600);
  };

  const quickNavLinks = [
    { label: 'Dashboard', icon: <FiHome className="w-3.5 h-3.5" />, path: '/' },
    { label: 'Tasks', icon: <FiList className="w-3.5 h-3.5" />, path: '/tasks' },
    { label: 'Messages', icon: <FiMessageSquare className="w-3.5 h-3.5" />, path: '/messages' },
    { label: 'Profile', icon: <FiUser className="w-3.5 h-3.5" />, path: '/profile' }
  ].filter(item => item.path !== route);

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-3 sm:p-6 font-sans">
      <div className="max-w-xl w-full bg-white/95 dark:bg-slate-900/90 backdrop-blur-2xl border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-6 text-center transition-all">
        {/* Ambient Top Glow Orbs */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-72 h-72 bg-gradient-to-b from-amber-500/20 via-orange-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 right-0 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* 1. Header Glowing Icon Badge */}
        <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-amber-500/20 via-orange-500/15 to-amber-500/5 animate-pulse blur-sm" />
          <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-b from-amber-50 to-amber-100/60 dark:from-amber-950/40 dark:to-slate-900 border border-amber-300/60 dark:border-amber-500/30 flex items-center justify-center text-4xl shadow-inner shadow-amber-500/10">
            <span className="transform transition-transform hover:scale-110 duration-200 select-none">
              {info.icon}
            </span>
          </div>
          {/* Pulsing Lock / Warning status dot */}
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-md ring-2 ring-white dark:ring-slate-900 text-[11px]">
            <FiLock className="w-3 h-3" />
          </div>
        </div>

        {/* 2. Status Badge & Headings */}
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-[11px] font-black uppercase tracking-wider shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <FiAlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>মডিউল সাময়িক স্থগিত • Module Restricted</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {info.bn}{' '}
            <span className="block sm:inline text-base sm:text-xl font-bold text-slate-500 dark:text-slate-400">
              ({info.name})
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            এই মডিউলটির অ্যাক্সেস আপনার অ্যাকাউন্টের জন্য সাময়িকভাবে স্থগিত রাখা হয়েছে।
          </p>
        </div>

        {/* 3. Official Developer / Admin Notice Card */}
        <div className="relative rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 text-left shadow-inner space-y-2.5 overflow-hidden">
          {/* Subtle Accent Stripe */}
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-amber-500 via-orange-500 to-amber-600 rounded-l" />

          {/* Header Row of Notice */}
          <div className="flex items-center justify-between gap-2 flex-wrap text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
              <FiMessageSquare className="w-3.5 h-3.5" />
              <span>কর্তৃপক্ষের নোটিশ • Notice</span>
            </div>
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/25 text-[10px] font-mono font-bold text-amber-700 dark:text-amber-300">
              <FiUser className="w-3 h-3" />
              <span>By {updatedBy || 'Developer'}</span>
            </div>
          </div>

          {/* Message Text with quotation decoration */}
          <div className="pl-1">
            <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-medium leading-relaxed whitespace-pre-line italic">
              "{displayMsg}"
            </p>
          </div>
        </div>

        {/* 4. Reassurance: All Other Features 100% Operational */}
        <div className="p-3 sm:p-3.5 rounded-2xl bg-emerald-500/10 dark:bg-emerald-950/25 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 flex items-center gap-3 text-left">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-600 dark:text-emerald-400">
            <FiCheckCircle className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-slate-900 dark:text-emerald-200">
              সাইটের অন্যান্য সকল ফিচার সম্পূর্ণ সচল রয়েছে
            </div>
            <div className="text-[11px] text-slate-500 dark:text-emerald-400/80 leading-tight">
              আপনার অ্যাকাউন্টে ড্যাশবোর্ড, টাস্ক, চ্যাট ও অন্যান্য মডিউল নিয়মিত কাজ করবে।
            </div>
          </div>
        </div>

        {/* 5. Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full sm:w-auto flex-1 px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-500 hover:to-blue-500 text-white text-xs sm:text-sm font-black transition-all shadow-lg shadow-indigo-600/25 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <FiArrowLeft className="w-4 h-4" />
            <span>ড্যাশবোর্ডে ফিরে যান (Dashboard)</span>
          </button>
          <button
            type="button"
            disabled={rechecking}
            onClick={handleRecheckClick}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300/80 dark:border-slate-700 text-xs sm:text-sm font-bold transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
          >
            <FiRefreshCw className={`w-4 h-4 ${rechecking ? 'animate-spin text-cyan-500' : ''}`} />
            <span>{rechecking ? 'চেকিং...' : 'পুনরায় চেক করুন'}</span>
          </button>
        </div>

        {/* 6. Quick Jump Links to Other Working Modules */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            অন্যান্য সক্রিয় মডিউলে দ্রুত যান (Quick Navigation):
          </div>
          <div className="flex items-center justify-center gap-1.5 flex-wrap">
            {quickNavLinks.map(link => (
              <button
                key={link.path}
                type="button"
                onClick={() => navigate(link.path)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 text-[11px] font-bold border border-slate-200/80 dark:border-slate-700 transition cursor-pointer"
              >
                {link.icon}
                <span>{link.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const ProtectedRoute = ({ children }) => {
  const { currentUser, logout, isImpersonating } = useAuth();
  const location = useLocation();
  const [maintenance, setMaintenance] = useState({
    active: false,
    message: '',
    updated_by: '',
    allowed_user_ids: [],
    blocked_user_ids: [],
    user_maintenance_message: '',
    user_restricted_routes: {},
    current_user_restricted_routes: [],
    current_user_route_message: '',
    is_allowed_user: false,
    is_blocked_user: false
  });
  const [checking, setChecking] = useState(true);

  // Privileged if role is developer/admin, OR if developer is impersonating another user
  const isDevOrAdmin = Boolean(
    (currentUser?.roles && currentUser.roles.some(r => ['developer', 'admin'].includes(r))) ||
    isImpersonating ||
    localStorage.getItem('cca_original_dev_session')
  );

  const userId = currentUser?.id ? Number(currentUser.id) : null;
  const isExplicitlyAllowed = Boolean(
    userId && (maintenance.is_allowed_user || maintenance.allowed_user_ids?.map(Number).includes(userId))
  );
  const isTargetBlocked = Boolean(
    !isDevOrAdmin &&
    userId &&
    (maintenance.is_blocked_user || maintenance.blocked_user_ids?.map(Number).includes(userId))
  );

  const shouldBlockAccess = isTargetBlocked || (!isDevOrAdmin && !isExplicitlyAllowed && maintenance.active);

  const fetchMaintenance = useCallback(async () => {
    try {
      const userIdParam = currentUser?.id ? `?user_id=${currentUser.id}` : '';
      const res = await axios.get(`${API_BASE}api/developer/get_public_maintenance.php${userIdParam}`);
      if (res.data?.status === 'success') {
        setMaintenance({
          active: Boolean(res.data.maintenance_enabled),
          message: res.data.maintenance_message || 'সিস্টেম মেইনটেন্যান্স চলছে।',
          user_maintenance_message: res.data.user_maintenance_message || '',
          allowed_user_ids: Array.isArray(res.data.allowed_user_ids) ? res.data.allowed_user_ids : [],
          blocked_user_ids: Array.isArray(res.data.blocked_user_ids) ? res.data.blocked_user_ids : [],
          user_restricted_routes: res.data.user_restricted_routes || {},
          current_user_restricted_routes: Array.isArray(res.data.current_user_restricted_routes) ? res.data.current_user_restricted_routes : [],
          current_user_route_message: res.data.current_user_route_message || '',
          is_allowed_user: Boolean(res.data.is_allowed_user),
          is_blocked_user: Boolean(res.data.is_blocked_user),
          updated_by: res.data.updated_by || 'Developer'
        });
      }
    } catch (err) {
      // Ignore network errors in public maintenance check
    } finally {
      setChecking(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    fetchMaintenance();

    // Realtime Pusher Listener for Instant Route Restriction Updates
    let pusher = null;
    try {
      const pusherKey = import.meta.env.VITE_PUSHER_APP_KEY || 'ab2bf16a69efaf44c4fa';
      const pusherCluster = import.meta.env.VITE_PUSHER_APP_CLUSTER || 'ap2';
      pusher = new Pusher(pusherKey, { cluster: pusherCluster });
      const channel = pusher.subscribe('community-channel');

      channel.bind('system-maintenance-update', (data) => {
        if (data) {
          fetchMaintenance();
        }
      });
    } catch {
      // Ignore socket errors
    }

    return () => {
      if (pusher) {
        pusher.unsubscribe('community-channel');
        pusher.disconnect();
      }
    };
  }, [fetchMaintenance]);

  // Compute active route restrictions for current user
  const userRestrictedRoutes = useMemo(() => {
    if (isDevOrAdmin) return [];
    if (maintenance.current_user_restricted_routes && maintenance.current_user_restricted_routes.length > 0) {
      return maintenance.current_user_restricted_routes;
    }
    if (userId && maintenance.user_restricted_routes) {
      const userRule = maintenance.user_restricted_routes[String(userId)] || maintenance.user_restricted_routes[userId];
      if (userRule && Array.isArray(userRule.routes)) {
        return userRule.routes;
      }
    }
    return [];
  }, [isDevOrAdmin, maintenance.current_user_restricted_routes, maintenance.user_restricted_routes, userId]);

  // Check if current route matches any restriction
  const currentPath = location.pathname.toLowerCase();
  const matchedRestrictedRoute = userRestrictedRoutes.find(r => {
    const cleanR = r.toLowerCase().trim();
    if (!cleanR) return false;
    if (cleanR === '/') return currentPath === '/';
    return currentPath === cleanR || currentPath.startsWith(cleanR + '/');
  });

  const isCurrentRouteRestricted = !isDevOrAdmin && Boolean(matchedRestrictedRoute);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Allow users with staff privileges
  const isStaff = currentUser.roles &&
    currentUser.roles.some(r => ['staff', 'manager', 'instructor', 'developer', 'reviewer', 'admin'].includes(r));

  if (!isStaff) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl text-center max-w-md border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto border border-rose-200 dark:border-rose-800">
            <FiShield className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Access Denied</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            This portal is for staff members only. Your account does not have staff privileges.
          </p>
        </div>
      </div>
    );
  }

  // Active Maintenance Mode Screen (Target blocked user OR non-privileged staff during global downtime)
  if (shouldBlockAccess) {
    const isSingleUserTargeted = isTargetBlocked && !maintenance.active;
    const displayMessage = isSingleUserTargeted
      ? (maintenance.user_maintenance_message || 'আপনার অ্যাকাউন্টে ডাটাবেজ অপটিমাইজেশন ও মেইনটেনেন্স চলছে। সাময়িক অসুবিধার জন্য আন্তরিকভাবে দুঃখিত।')
      : (maintenance.message || 'সিস্টেম আপগ্রেড ও অপটিমাইজেশন চলছে।');

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-4 font-sans relative overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-rose-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-lg w-full bg-slate-900/90 backdrop-blur-xl border border-rose-500/30 rounded-3xl p-8 sm:p-10 shadow-2xl relative z-10 space-y-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center mx-auto shadow-inner animate-pulse">
            <FiAlertOctagon className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px] font-black uppercase tracking-wider">
              <FiClock className="w-3.5 h-3.5" />
              <span>{isSingleUserTargeted ? 'User Account Maintenance' : 'System Downtime Active'}</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              {isSingleUserTargeted ? 'Account Under Maintenance' : 'Maintenance Underway'}
            </h1>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-slate-300 text-xs leading-relaxed text-left space-y-2">
            <div className="font-bold text-rose-400 text-[11px] uppercase tracking-wider flex items-center justify-between">
              <span>{isSingleUserTargeted ? 'Notice for Your Account:' : 'Announcement by Developer:'}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                {isSingleUserTargeted ? `User #${currentUser?.id || ''}` : `By ${maintenance.updated_by || 'Developer'}`}
              </span>
            </div>
            <p className="whitespace-pre-line text-xs font-sans text-slate-200">
              {displayMessage}
            </p>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed">
            {isSingleUserTargeted
              ? 'আপনার অ্যাকাউন্টের ডাটাবেজ ব্যাকআপ ও সিকিউরিটি সিঙ্ক চলছে। কিছুক্ষণের মধ্যে স্বয়ংক্রিয়ভাবে অ্যাক্সেস পুনরুদ্ধার হবে।'
              : 'All portal actions and automated cron workflows are safely paused. We will automatically restore public access once the maintenance window is concluded.'}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <FiRefreshCw className="w-3.5 h-3.5" />
              <span>Check Status Again</span>
            </button>
            <button
              type="button"
              onClick={logout}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 text-xs font-bold transition cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active Module-Level Restriction Screen (Only this specific module is locked, shell remains fully usable)
  if (isCurrentRouteRestricted) {
    const customRouteMsg = maintenance.current_user_route_message ||
      (userId && maintenance.user_restricted_routes?.[String(userId)]?.message) ||
      (userId && maintenance.user_restricted_routes?.[userId]?.message);

    return (
      <AuthenticatedLayout>
        <ModuleMaintenanceView
          route={matchedRestrictedRoute}
          userMessage={customRouteMsg}
          updatedBy={maintenance.updated_by}
          onRecheck={fetchMaintenance}
        />
      </AuthenticatedLayout>
    );
  }

  return children;
};

export default ProtectedRoute;
