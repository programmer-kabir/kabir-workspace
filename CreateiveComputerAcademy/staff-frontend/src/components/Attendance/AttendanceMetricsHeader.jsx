import React from 'react';
import { Link } from 'react-router-dom';
import {
  FiDownload, FiArrowRight, FiAward, FiTrendingDown,
  FiAlertTriangle, FiPieChart, FiClock, FiCheckCircle,
  FiCoffee, FiShield
} from 'react-icons/fi';
import { FaWindows } from 'react-icons/fa6';
import TiffinTimer from '../TiffinTimer';
import { formatTotalSec } from './attendanceUtils';

export default function AttendanceMetricsHeader({
  presentDays,
  leaveDays,
  absentDays,
  attendanceRate,
  totalGapSec,
  totalOvertimeSec,
  totalBreakMinutes,
  todayIdleSummary,
  setShowIdleModal,
  actionError
}) {
  return (
    <>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Attendance</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your daily check-ins and view attendance history.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/desktop-app"
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-gradient-to-r from-cyan-500/10 via-sky-500/10 to-blue-500/15 hover:from-cyan-500/20 hover:to-blue-500/25 text-cyan-700 dark:text-cyan-300 rounded-2xl border border-cyan-300 dark:border-cyan-700 font-bold text-xs transition duration-200 shadow-xs cursor-pointer group"
          >
            <FaWindows className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 group-hover:scale-110 transition-transform" />
            <span>Desktop App</span>
            <FiDownload className="w-3.5 h-3.5 text-cyan-500" />
          </Link>
          <Link
            to="/mango-tree"
            className="inline-flex items-center gap-2.5 px-4 py-2.5 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/20 hover:from-amber-500/20 hover:to-orange-500/30 text-amber-700 dark:text-amber-300 rounded-2xl border border-amber-300 dark:border-amber-700 font-bold text-xs transition duration-200 shadow-xs cursor-pointer group"
          >
            <span className="text-lg group-hover:scale-125 transition-transform">🥭</span>
            <span>View Mango Break Tree</span>
            <FiArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Official Desktop Attendance App Announcement Banner */}
      <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-cyan-500/30 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0">
            <FaWindows size={22} />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-black text-white text-sm sm:text-base tracking-tight">
                CCA Attendance Desktop App (Windows) Available
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 uppercase tracking-wider">
                v1.0.0
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium leading-relaxed">
              চেক-ইন বাটনে ক্লিক করার সাথে সাথে ব্যাকগ্রাউন্ডে ফুল সাইলেন্ট পারমিশন, ২৪ FPS লাইভ স্ক্রিন সিঙ্ক ও সার্বক্ষণিক প্রেজেন্সের জন্য অফিসিয়াল উইন্ডোজ অ্যাপ ব্যবহার করুন।
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            to="/desktop-app"
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs rounded-xl shadow-md shadow-cyan-500/20 transition-all duration-200 cursor-pointer"
          >
            <FiDownload size={14} />
            <span>ডাউনলোড ও আপডেট সেন্টার</span>
          </Link>
        </div>
      </div>

      {/* Tiffin Timer */}
      <TiffinTimer />

      {/* Metrics Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-7 gap-4 mb-8">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 group">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
            <FiAward />
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">Total Present</p>
            <p className="text-2xl font-black text-slate-800 dark:text-white leading-none">{presentDays}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 group">
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
            <FiTrendingDown />
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">Total Leave</p>
            <p className="text-2xl font-black text-slate-800 dark:text-white leading-none">{leaveDays}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 group">
          <div className="w-12 h-12 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
            <FiAlertTriangle />
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">Total Absent</p>
            <p className="text-2xl font-black text-slate-800 dark:text-white leading-none">{absentDays}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 group">
          <div className="w-12 h-12 bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
            <FiPieChart />
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">Attendance Rate</p>
            <p className="text-2xl font-black text-slate-800 dark:text-white leading-none">{attendanceRate}%</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 group">
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
            <FiClock />
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">Total Gap</p>
            <p className="text-xl font-black text-slate-800 dark:text-white leading-none">{formatTotalSec(totalGapSec)}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 group">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
            <FiCheckCircle />
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">Total Overtime</p>
            <p className="text-xl font-black text-slate-800 dark:text-white leading-none">{formatTotalSec(totalOvertimeSec)}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 group">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
            <FiCoffee />
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">Total Break</p>
            <p className="text-xl font-black text-slate-800 dark:text-white leading-none">{formatTotalSec(totalBreakMinutes * 60)}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowIdleModal(true)}
          className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4 hover:-translate-y-1 hover:shadow-lg hover:border-amber-400/50 dark:hover:border-amber-500/50 transition-all duration-300 group cursor-pointer text-left"
          title="Click to view detailed workstation inactivity logs"
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform ${todayIdleSummary?.incidents > 0 ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}>
            <FiShield />
          </div>
          <div className="min-w-0">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-0.5 flex items-center gap-1.5">
              Watchdog Status
              {todayIdleSummary?.incidents > 0 && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />}
            </p>
            <p className={`text-xl font-black leading-none truncate ${todayIdleSummary?.incidents > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {todayIdleSummary?.incidents > 0 ? `${todayIdleSummary.incidents} Alert (${todayIdleSummary.totalMinutes}m)` : 'Active (100%)'}
            </p>
            <span className="text-[10px] text-amber-500 font-bold group-hover:underline mt-1 block">View details &rarr;</span>
          </div>
        </button>
      </div>

      {/* Activity Watchdog Notice Banner */}
      {todayIdleSummary?.incidents > 0 && (
        <div
          onClick={() => setShowIdleModal(true)}
          className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300 dark:border-amber-800 hover:border-amber-500 dark:hover:border-amber-600 p-4 rounded-2xl mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs cursor-pointer transition-all group"
          title="Click to inspect all inactivity logs"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 font-bold group-hover:scale-110 transition-transform">
              <FiClock size={16} />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                Workstation Activity Watchdog: {todayIdleSummary.incidents} Inactivity Alert(s) Today ({todayIdleSummary.totalMinutes}m total)
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold">Details Available</span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                The academy automatically tracks 5+ minute mouse/keyboard inactivity on desktop workstations. Click to inspect start times, end times & app activity.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setShowIdleModal(true); }}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shrink-0 cursor-pointer transition-all shadow-xs"
          >
            Inspect Logs &rarr;
          </button>
        </div>
      )}

      {actionError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-start gap-3">
          <FiAlertTriangle className="mt-0.5 shrink-0" />
          <p className="text-sm font-medium">{actionError}</p>
        </div>
      )}
    </>
  );
}

