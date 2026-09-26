import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FiUsers, FiClock, FiCheckCircle, FiAlertCircle, FiArrowUpRight, FiPlusCircle, FiFileText, FiUserCheck, FiCalendar, FiSun, FiActivity, FiUserPlus, FiLayers, FiShield } from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import { Link } from 'react-router-dom';
import BreakMonitor from '../components/BreakMonitor';
import AttendanceListWidget from '../components/AttendanceListWidget';
import ReviewerSummaryWidget from '../components/ReviewerSummaryWidget';
import AnimatedCounter from '../components/AnimatedCounter';

const StatCard = ({ title, value, subtitle, icon: Icon, gradient, cubeBg, cubeShadow, glowShadow, linkTo, badgeText, badgeStyle }) => (
  <motion.div 
    whileHover={{ y: -6, transition: { duration: 0.25, ease: 'easeOut' } }}
    className="relative group flex flex-col justify-between h-full"
  >
    <div className={`relative bg-white dark:bg-slate-800 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-2xl ${glowShadow} flex flex-col justify-between h-full transition-all duration-300 overflow-hidden`}>
      {/* Top Subtle Metallic Light Line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-current to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none text-blue-500" />

      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <span className="text-[11px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-wider block mb-1">
            {title}
          </span>
          <h3 className="text-3xl sm:text-4xl font-black text-slate-800 dark:text-white tracking-tight">
            <AnimatedCounter value={value} />
          </h3>
        </div>

        {/* 3D Glass Metatile Icon Cube */}
        <div 
          className={`w-12 h-12 rounded-2xl ${cubeBg} ${cubeShadow} flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform duration-300 relative overflow-hidden`}
          style={{
            boxShadow: 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.4), 0 8px 16px -4px rgba(0, 0, 0, 0.15)'
          }}
        >
          <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/20 rounded-t-2xl pointer-events-none" />
          <Icon size={22} className="relative z-10 drop-shadow-sm" />
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 mt-auto">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 min-w-0">
          {badgeText && (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold border shrink-0 ${badgeStyle || 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}>
              {badgeText}
            </span>
          )}
          <span className="truncate">{subtitle}</span>
        </span>
        {linkTo && (
          <Link to={linkTo} className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-800 transition-all shrink-0 active:scale-90" title="View details">
            <FiArrowUpRight size={16} />
          </Link>
        )}
      </div>
    </div>
  </motion.div>
);

const Dashboard = () => {
  const [stats, setStats] = useState({
    total_staff: 0,
    present_today: 0,
    leave_today: 0,
    absent_today: 0,
    tasks_completed: 0,
    pending_approvals: { total: 0, leaves: 0, tasks: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}api/admin/dashboard/get_stats.php`);
        if (res.data.status === 'success') {
          setStats(res.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full shadow-lg" />
        <p className="text-slate-400 dark:text-slate-500 font-bold text-xs uppercase tracking-widest animate-pulse">Loading Executive Dashboard</p>
      </div>
    );
  }

  const attendanceTotal = stats.total_staff || 1;
  const presentPct = Math.round((stats.present_today / attendanceTotal) * 100);
  const leavePct = Math.round((stats.leave_today / attendanceTotal) * 100);
  const absentPct = Math.max(0, 100 - presentPct - leavePct);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-8">
      
      {/* ── Executive Hero Greeting Banner ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 p-7 sm:p-9 text-white shadow-2xl shadow-blue-950/25 border border-white/10">
        
        {/* Ambient Glows inside banner */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-cyan-400/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 left-1/3 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-blue-200 text-xs font-extrabold tracking-wide shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Academy Live Command Center</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
              {getGreeting()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-cyan-200 to-white">Admin</span>
            </h1>
            <p className="text-blue-100/80 text-sm sm:text-base font-medium max-w-xl leading-relaxed">
              Real-time administrative oversight across staff members, daily attendance, quality reviews, and academy tasks.
            </p>
          </div>

          {/* Quick Date & Time Widget */}
          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 sm:p-5 shadow-2xl shrink-0">
            <div className="text-right">
              <p className="text-2xl sm:text-3xl font-black font-mono tracking-wider">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
              <p className="text-xs text-blue-200 font-bold uppercase tracking-wider mt-0.5">
                {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center text-cyan-300 shrink-0">
              <FiSun size={24} className="animate-spin-slow" />
            </div>
          </div>
        </div>
      </div>

      {/* ── 3D Quick Action Bar ── */}
      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1">
        <Link
          to="/tasks"
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-lg shadow-blue-500/25 transition-all shrink-0 active:scale-95"
        >
          <FiPlusCircle size={15} /> Assign New Task
        </Link>
        <Link
          to="/staff"
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 font-bold text-xs shadow-xs transition-all shrink-0 active:scale-95"
        >
          <FiUserPlus size={15} className="text-blue-500" /> Manage Staff
        </Link>
        <Link
          to="/attendance"
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 font-bold text-xs shadow-xs transition-all shrink-0 active:scale-95"
        >
          <FiCalendar size={15} className="text-emerald-500" /> Daily Attendance
        </Link>
        <Link
          to="/reports"
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 font-bold text-xs shadow-xs transition-all shrink-0 active:scale-95"
        >
          <FiFileText size={15} className="text-purple-500" /> Master Reports
        </Link>
      </div>

      {/* ── 4 Main KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
        <StatCard 
          title="Total Staff" 
          value={stats.total_staff}
          subtitle="Registered Academy Team"
          badgeText="Active"
          badgeStyle="bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border-blue-200/60 dark:border-blue-800/40"
          icon={FiUsers}
          gradient="from-blue-600 to-indigo-600"
          cubeBg="bg-gradient-to-br from-blue-600 to-indigo-600"
          cubeShadow="shadow-md shadow-blue-500/30"
          glowShadow="group-hover:shadow-blue-500/20 group-hover:border-blue-500/40"
          linkTo="/staff"
        />
        
        <StatCard 
          title="Present Today" 
          value={stats.present_today}
          subtitle={`${stats.leave_today} on leave, ${stats.absent_today} absent`}
          badgeText={`${presentPct}% Present`}
          badgeStyle="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/40"
          icon={FiUserCheck}
          gradient="from-emerald-600 to-teal-600"
          cubeBg="bg-gradient-to-br from-emerald-600 to-teal-600"
          cubeShadow="shadow-md shadow-emerald-500/30"
          glowShadow="group-hover:shadow-emerald-500/20 group-hover:border-emerald-500/40"
          linkTo="/attendance"
        />

        <StatCard 
          title="Tasks Completed" 
          value={stats.tasks_completed}
          subtitle="Quality Verified Tasks"
          badgeText="All Time"
          badgeStyle="bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border-purple-200/60 dark:border-purple-800/40"
          icon={FiCheckCircle}
          gradient="from-purple-600 to-indigo-600"
          cubeBg="bg-gradient-to-br from-purple-600 to-indigo-600"
          cubeShadow="shadow-md shadow-purple-500/30"
          glowShadow="group-hover:shadow-purple-500/20 group-hover:border-purple-500/40"
          linkTo="/tasks"
        />

        <StatCard 
          title="Pending Approvals" 
          value={stats.pending_approvals.total}
          subtitle={`${stats.pending_approvals.leaves} Leaves • ${stats.pending_approvals.tasks} Tasks`}
          badgeText={stats.pending_approvals.total > 0 ? "Action Needed" : "All Clear"}
          badgeStyle={stats.pending_approvals.total > 0 ? "bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border-rose-200/60 dark:border-rose-900/40" : "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/40"}
          icon={FiAlertCircle}
          gradient="from-amber-500 to-rose-600"
          cubeBg="bg-gradient-to-br from-amber-500 to-rose-600"
          cubeShadow="shadow-md shadow-rose-500/30"
          glowShadow="group-hover:shadow-rose-500/20 group-hover:border-rose-500/40"
          linkTo="/tasks"
        />
      </div>

      {/* ── Live Attendance Breakdown Bar ── */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-7 border border-slate-200/80 dark:border-slate-700 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shadow-xs">
              <FiActivity size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-800 dark:text-white">Today's Attendance Overview</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Real-time breakdown across Present, Leave, and Absent staff</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold">
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Present: {stats.present_today}
            </span>
            <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              Leave: {stats.leave_today}
            </span>
            <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              Absent: {stats.absent_today}
            </span>
          </div>
        </div>

        {/* Multi-segment Progress Bar */}
        <div className="w-full h-3.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
          <div 
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-1000" 
            style={{ width: `${presentPct}%` }}
            title={`Present: ${stats.present_today} (${presentPct}%)`}
          />
          <div 
            className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-1000" 
            style={{ width: `${leavePct}%` }}
            title={`Leave: ${stats.leave_today} (${leavePct}%)`}
          />
          <div 
            className="h-full bg-gradient-to-r from-rose-500 to-red-500 transition-all duration-1000" 
            style={{ width: `${absentPct}%` }}
            title={`Absent: ${stats.absent_today} (${absentPct}%)`}
          />
        </div>
      </div>

      {/* ── Reviewer & QA Oversight Widget ── */}
      <ReviewerSummaryWidget />

      {/* ── Attendance List Widget & Break Monitor ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 min-h-[400px]">
          <AttendanceListWidget />
        </div>
        <div className="min-h-[400px]">
          <BreakMonitor />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
