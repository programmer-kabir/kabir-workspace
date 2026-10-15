import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FiAlertOctagon, FiRefreshCw, FiShield, FiClock } from 'react-icons/fi';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

const ProtectedRoute = ({ children }) => {
  const { currentUser, logout } = useAuth();
  const [maintenance, setMaintenance] = useState({ active: false, message: '' });
  const [checking, setChecking] = useState(true);

  const isPrivileged = currentUser?.roles &&
    currentUser.roles.some(r => ['developer', 'admin'].includes(r));

  useEffect(() => {
    // Developers & Admins completely bypass maintenance checks
    if (isPrivileged) {
      setChecking(false);
      return;
    }

    const checkMaintenance = async () => {
      try {
        const res = await axios.get(`${API_BASE}api/developer/get_public_maintenance.php`);
        if (res.data?.status === 'success' && res.data.maintenance_enabled) {
          setMaintenance({
            active: true,
            message: res.data.maintenance_message || 'সিস্টেম মেইনটেন্যান্স চলছে।'
          });
        }
      } catch (err) {
        // Ignore network errors in public maintenance check
      } finally {
        setChecking(false);
      }
    };

    checkMaintenance();
  }, [isPrivileged]);

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

  // Active Maintenance Mode Screen (Non-privileged staff)
  if (!isPrivileged && maintenance.active) {
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
              <span>System Downtime Active</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Maintenance Underway
            </h1>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-slate-300 text-xs leading-relaxed text-left space-y-2">
            <div className="font-bold text-rose-400 text-[11px] uppercase tracking-wider">
              Announcement from Engineering Team:
            </div>
            <p className="whitespace-pre-line text-xs font-sans text-slate-200">
              {maintenance.message}
            </p>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed">
            All portal actions and automated cron workflows are safely paused. We will automatically restore public access once the maintenance window is concluded.
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

  return children;
};

export default ProtectedRoute;
