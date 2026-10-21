import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useSearch } from '../context/SearchContext';
import { getApiBase } from '../utils/api';
import { soundFx } from '../utils/soundFx';
import { toast } from 'sonner';
import {
  FiCalendar,
  FiUserCheck,
  FiTrendingUp,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiXCircle,
  FiRefreshCw,
  FiFileText,
  FiDownload,
  FiSearch,
  FiFilter,
  FiChevronRight
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';

const ReportsView = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const { searchTerm, setSearchTerm } = useSearch();
  const API_BASE = (getApiBase() || '').replace(/\/+$/, '');
  const userId = currentUser?.id || currentUser?.user_id;

  const formatLocalDate = (date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Date filter state (Default: Current Month)
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return formatLocalDate(new Date(d.getFullYear(), d.getMonth(), 1));
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    return formatLocalDate(new Date(d.getFullYear(), d.getMonth() + 1, 0));
  });

  const [activeTab, setActiveTab] = useState('attendance'); // 'attendance' or 'tasks'
  const [loading, setLoading] = useState(false);
  const [attReport, setAttReport] = useState(null);
  const [taskReport, setTaskReport] = useState(null);
  const [attFilter, setAttFilter] = useState('all'); // 'all' | 'Present' | 'Late' | 'Absent' | 'Leave'
  const [taskFilter, setTaskFilter] = useState('all'); // 'all' | 'Completed' | 'Pending' | 'Rejected'

  // Presets
  const applyPreset = (preset) => {
    const now = new Date();
    let s, e;
    if (preset === 'this-month') {
      s = new Date(now.getFullYear(), now.getMonth(), 1);
      e = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (preset === 'last-month') {
      s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      e = new Date(now.getFullYear(), now.getMonth(), 0);
    } else if (preset === 'last-7-days') {
      s = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
      e = now;
    } else if (preset === 'today') {
      s = now;
      e = now;
    }
    if (s && e) {
      setStartDate(formatLocalDate(s));
      setEndDate(formatLocalDate(e));
    }
  };

  const fetchReports = async () => {
    if (!userId || !startDate || !endDate) return;
    setLoading(true);
    try {
      const [attRes, taskRes] = await Promise.all([
        axios.post(`${API_BASE}/api/reports/get_attendance_report.php`, {
          user_id: userId,
          start_date: startDate,
          end_date: endDate
        }),
        axios.post(`${API_BASE}/api/reports/get_task_report.php`, {
          user_id: userId,
          start_date: startDate,
          end_date: endDate
        })
      ]);

      if (attRes.data?.status === 'success') {
        const data = attRes.data;

        // Fallback calculations for accurate expected/worked/absent
        let totalExpectedSeconds = 0;
        let totalWorkedSeconds = 0;
        let absentDays = 0;

        if (data.history && Array.isArray(data.history)) {
          data.history.forEach((day) => {
            if (day.expected_hours) {
              const expMatch = day.expected_hours.match(/(\d+)h\s*(\d+)m/);
              if (expMatch) {
                totalExpectedSeconds += parseInt(expMatch[1], 10) * 3600 + parseInt(expMatch[2], 10) * 60;
              }
            }

            if (day.total_hours) {
              const wrkMatch = day.total_hours.match(/(\d+)h\s*(\d+)m/);
              if (wrkMatch) {
                totalWorkedSeconds += parseInt(wrkMatch[1], 10) * 3600 + parseInt(wrkMatch[2], 10) * 60;
              }
            }

            const isAbsentStatus = day.status && day.status.toLowerCase() === 'absent';
            if (isAbsentStatus && !day.is_weekend && !day.is_holiday) {
              absentDays++;
            }
          });
        }

        const formatSecs = (totalSecs) => {
          const h = Math.floor(totalSecs / 3600);
          const m = Math.floor((totalSecs % 3600) / 60);
          return `${h}h ${m}m`;
        };

        if (!data.summary.total_expected) {
          data.summary.total_expected = formatSecs(totalExpectedSeconds);
        }
        if (!data.summary.total_worked) {
          data.summary.total_worked = formatSecs(totalWorkedSeconds);
        }
        if (!data.summary.absent || data.summary.absent === 0) {
          data.summary.absent = absentDays;
        }

        setAttReport(data);
      }

      if (taskRes.data?.status === 'success') {
        setTaskReport(taskRes.data);
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
      toast.error('Failed to load performance report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [userId, startDate, endDate]);

  // Filtered Attendance History
  const filteredAttendance = useMemo(() => {
    if (!attReport?.history) return [];
    return attReport.history.filter((rec) => {
      // Status filter
      if (attFilter === 'Present' && rec.status !== 'Present') return false;
      if (attFilter === 'Late' && rec.status !== 'Late') return false;
      if (attFilter === 'Absent' && rec.status !== 'Absent') return false;
      if (attFilter === 'Leave' && rec.status !== 'Leave') return false;

      // Search term
      if (!searchTerm || !searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase().trim();
      return (
        (rec.date || '').toLowerCase().includes(term) ||
        (rec.status || '').toLowerCase().includes(term) ||
        (rec.leave_title || '').toLowerCase().includes(term) ||
        (rec.check_in || '').toLowerCase().includes(term) ||
        (rec.check_out || '').toLowerCase().includes(term) ||
        (rec.overtime || '').toLowerCase().includes(term)
      );
    });
  }, [attReport, attFilter, searchTerm]);

  // Filtered Task History
  const filteredTasks = useMemo(() => {
    if (!taskReport?.tasks) return [];
    return taskReport.tasks.filter((task) => {
      // Status filter
      if (taskFilter === 'Completed' && task.status !== 'Completed') return false;
      if (taskFilter === 'Rejected' && task.status !== 'Rejected') return false;
      if (taskFilter === 'Pending' && (task.status === 'Completed' || task.status === 'Rejected')) return false;

      // Search term
      if (!searchTerm || !searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase().trim();
      return (
        (task.title || '').toLowerCase().includes(term) ||
        (task.category || '').toLowerCase().includes(term) ||
        (task.status || '').toLowerCase().includes(term) ||
        (task.assign_date || '').toLowerCase().includes(term) ||
        (task.created_at || '').toLowerCase().includes(term)
      );
    });
  }, [taskReport, taskFilter, searchTerm]);

  // CSV Export for Attendance
  const exportAttendanceCSV = () => {
    if (!attReport?.history || attReport.history.length === 0) {
      toast.error('No attendance records to export.');
      return;
    }

    const headers = ['Date', 'Check In', 'Check Out', 'Status', 'Duty Hours', 'Work Hours', 'Break (Minutes)', 'Overtime / Short'];
    const rows = attReport.history.map((r) => [
      r.date || '',
      r.check_in || '-',
      r.check_out || '-',
      r.leave_title ? `Leave (${r.leave_title})` : r.status || '',
      r.expected_hours || '-',
      r.total_hours || '-',
      r.total_break_minutes || 0,
      r.overtime || '-'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `CCA_Attendance_Report_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    soundFx.playSuccess();
    toast.success('Attendance report exported as CSV!');
  };

  // CSV Export for Tasks
  const exportTasksCSV = () => {
    if (!taskReport?.tasks || taskReport.tasks.length === 0) {
      toast.error('No task records to export.');
      return;
    }

    const headers = ['Task Title', 'Category', 'Assigned Date', 'Status', 'Delayed', 'Resubmitted'];
    const rows = taskReport.tasks.map((t) => [
      t.title || '',
      t.category || '',
      t.assign_date || t.created_at || '',
      t.status || '',
      t.was_delayed ? 'Yes' : 'No',
      t.was_resubmitted ? `Yes (${t.resubmit_count || 1}x)` : 'No'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `CCA_Tasks_Report_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    soundFx.playSuccess();
    toast.success('Tasks report exported as CSV!');
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Top Banner & Date Picker Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            <FiFileText size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Staff Performance & Analytics
              </h1>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                Official Records
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Audit duty hours, presence logs, overtime, short times, and task deliverables in custom periods.
            </p>
          </div>
        </div>

        {/* Date Filter & Presets */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Quick Presets */}
          <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 overflow-x-auto">
            <button
              type="button"
              onClick={() => applyPreset('this-month')}
              className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors whitespace-nowrap cursor-pointer"
            >
              This Month
            </button>
            <button
              type="button"
              onClick={() => applyPreset('last-month')}
              className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors whitespace-nowrap cursor-pointer"
            >
              Last Month
            </button>
            <button
              type="button"
              onClick={() => applyPreset('last-7-days')}
              className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors whitespace-nowrap cursor-pointer"
            >
              Last 7 Days
            </button>
          </div>

          {/* Date Range Inputs */}
          <div className="bg-slate-50 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 shadow-2xs">
            <div className="flex items-center px-2 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80">
              <FiCalendar className="text-slate-400 mr-1.5 shrink-0" size={13} />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
              />
            </div>
            <span className="text-[11px] font-bold text-slate-400 px-1">to</span>
            <div className="flex items-center px-2 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80">
              <FiCalendar className="text-slate-400 mr-1.5 shrink-0" size={13} />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
              />
            </div>
            <button
              type="button"
              onClick={fetchReports}
              disabled={loading}
              className="p-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs disabled:opacity-50 cursor-pointer active:scale-95"
              title="Refresh Report Data"
            >
              <FiRefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Modern Tab Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="inline-flex p-1 rounded-2xl bg-slate-200/60 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 shadow-inner">
          <button
            type="button"
            onClick={() => setActiveTab('attendance')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'attendance'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-cyan-300 shadow-sm scale-102'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FiClock size={15} className={activeTab === 'attendance' ? 'text-blue-500 dark:text-cyan-400' : ''} />
            Attendance & Duty Hours
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tasks')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'tasks'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-cyan-300 shadow-sm scale-102'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FiFileText size={15} className={activeTab === 'tasks' ? 'text-blue-500 dark:text-cyan-400' : ''} />
            Work & Tasks Deliverables
          </button>
        </div>

        {/* Export Button */}
        <div>
          {activeTab === 'attendance' ? (
            <button
              type="button"
              onClick={exportAttendanceCSV}
              disabled={loading || !attReport?.history?.length}
              className="px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-extrabold transition-all flex items-center gap-2 shadow-xs hover:shadow-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FiDownload size={14} className="text-emerald-500" /> Export Attendance CSV
            </button>
          ) : (
            <button
              type="button"
              onClick={exportTasksCSV}
              disabled={loading || !taskReport?.tasks?.length}
              className="px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-extrabold transition-all flex items-center gap-2 shadow-xs hover:shadow-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FiDownload size={14} className="text-blue-500" /> Export Tasks CSV
            </button>
          )}
        </div>
      </div>

      {/* Loading Spinner */}
      {loading && !attReport && !taskReport ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-16 flex flex-col items-center justify-center gap-3">
          <div className="animate-spin h-8 w-8 border-3 border-blue-500 border-t-transparent rounded-full" />
          <p className="text-xs font-semibold text-slate-500">Generating report analytics...</p>
        </div>
      ) : (
        <>
          {/* ================================= ATTENDANCE TAB ================================= */}
          {activeTab === 'attendance' && attReport && (
            <div className="space-y-6">
              {/* 8 Stat Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {/* Working Days */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden group hover:shadow-md transition-all">
                  <div className="absolute top-0 left-0 w-full h-1 bg-blue-500" />
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total Days</span>
                    <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <FiCalendar size={15} />
                    </div>
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                    {attReport.summary?.total_days || 0}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">Calendar timeframe</p>
                </div>

                {/* Present */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-emerald-200/70 dark:border-emerald-900/50 shadow-xs relative overflow-hidden group hover:shadow-md transition-all">
                  <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Present</span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <FiCheckCircle size={15} />
                    </div>
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                    {attReport.summary?.present || 0}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">Attended duties</p>
                </div>

                {/* Absent */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-rose-200/70 dark:border-rose-900/50 shadow-xs relative overflow-hidden group hover:shadow-md transition-all">
                  <div className="absolute top-0 left-0 w-full h-1 bg-rose-500" />
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400">Absent</span>
                    <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                      <FiXCircle size={15} />
                    </div>
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400">
                    {attReport.summary?.absent || 0}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">Working days missed</p>
                </div>

                {/* Late */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-amber-200/70 dark:border-amber-900/50 shadow-xs relative overflow-hidden group hover:shadow-md transition-all">
                  <div className="absolute top-0 left-0 w-full h-1 bg-amber-500" />
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">Late Days</span>
                    <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                      <FiClock size={15} />
                    </div>
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
                    {attReport.summary?.late || 0}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">Arrival after grace</p>
                </div>

                {/* Expected Duty */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-violet-200/70 dark:border-violet-900/50 shadow-xs relative overflow-hidden group hover:shadow-md transition-all">
                  <div className="absolute top-0 left-0 w-full h-1 bg-violet-500" />
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-violet-600 dark:text-violet-400">Expected Duty</span>
                    <div className="w-8 h-8 rounded-xl bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                      <FiClock size={15} />
                    </div>
                  </div>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">
                    {attReport.summary?.total_expected || '0h 0m'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">Shift standard quota</p>
                </div>

                {/* Hours Worked */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-indigo-200/70 dark:border-indigo-900/50 shadow-xs relative overflow-hidden group hover:shadow-md transition-all">
                  <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500" />
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Hours Worked</span>
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                      <FiUserCheck size={15} />
                    </div>
                  </div>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">
                    {attReport.summary?.total_worked || '0h 0m'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">Actual logged duration</p>
                </div>

                {/* Overtime */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-teal-200/70 dark:border-teal-900/50 shadow-xs relative overflow-hidden group hover:shadow-md transition-all">
                  <div className="absolute top-0 left-0 w-full h-1 bg-teal-500" />
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-600 dark:text-teal-400">Total Overtime</span>
                    <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                      <FiTrendingUp size={15} />
                    </div>
                  </div>
                  <p className="text-2xl font-black text-teal-600 dark:text-teal-400">
                    {attReport.summary?.total_overtime || '0h 0m'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">Credited overtime</p>
                </div>

                {/* Short Time */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-rose-200/70 dark:border-rose-900/50 shadow-xs relative overflow-hidden group hover:shadow-md transition-all">
                  <div className="absolute top-0 left-0 w-full h-1 bg-rose-500" />
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400">Short Time</span>
                    <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                      <FiAlertCircle size={15} />
                    </div>
                  </div>
                  <p className="text-2xl font-black text-rose-600 dark:text-rose-400">
                    {attReport.summary?.total_short_time || '0h 0m'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">Deficit shift hours</p>
                </div>
              </div>

              {/* Attendance Records Table */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-slate-100">
                      Daily Attendance Ledger & Shift Details
                    </h3>
                    <p className="text-xs text-slate-400">
                      Showing {filteredAttendance.length} of {attReport.history?.length || 0} days
                    </p>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                      { id: 'all', label: 'All' },
                      { id: 'Present', label: 'Present' },
                      { id: 'Late', label: 'Late' },
                      { id: 'Absent', label: 'Absent' },
                      { id: 'Leave', label: 'Leave' }
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setAttFilter(f.id)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          attFilter === f.id
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700/60'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800">
                      <tr>
                        <th className="px-5 py-3.5">Date</th>
                        <th className="px-5 py-3.5">Check In</th>
                        <th className="px-5 py-3.5">Check Out</th>
                        <th className="px-5 py-3.5">Status</th>
                        <th className="px-5 py-3.5 text-center">Duty Hours</th>
                        <th className="px-5 py-3.5 text-center">Work Hours</th>
                        <th className="px-5 py-3.5 text-center">Break</th>
                        <th className="px-5 py-3.5 text-right">OT / Short</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                      {filteredAttendance.map((record, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="px-5 py-3.5 font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                            {record.date}
                          </td>
                          <td className="px-5 py-3.5 font-medium whitespace-nowrap">
                            {record.check_in || <span className="text-slate-400">-</span>}
                          </td>
                          <td className="px-5 py-3.5 font-medium whitespace-nowrap">
                            {record.check_out || <span className="text-slate-400">-</span>}
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {record.is_weekend && record.status !== 'Weekend' && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                  Weekend
                                </span>
                              )}
                              {record.is_holiday && record.status !== 'Holiday' && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300">
                                  Holiday
                                </span>
                              )}
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                                  record.status === 'Present'
                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900'
                                    : record.status === 'Late'
                                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-900'
                                    : record.status === 'Weekend'
                                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                                    : record.status === 'Holiday'
                                    ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-900'
                                    : record.status === 'Leave'
                                    ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200 dark:border-teal-900'
                                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-900'
                                }`}
                              >
                                {record.leave_title ? `Leave (${record.leave_title})` : record.status}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-center font-medium text-slate-400 whitespace-nowrap">
                            {record.expected_hours || '-'}
                          </td>
                          <td className="px-5 py-3.5 text-center font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                            {record.total_hours || '-'}
                          </td>
                          <td className="px-5 py-3.5 text-center font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            {record.total_break_minutes > 0 ? `${record.total_break_minutes}m` : '-'}
                          </td>
                          <td className="px-5 py-3.5 text-right whitespace-nowrap">
                            {record.overtime ? (
                              <span
                                className={`font-black px-2 py-0.5 rounded-md text-[11px] ${
                                  record.is_short
                                    ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                                    : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                                }`}
                              >
                                {record.overtime}
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {filteredAttendance.length === 0 && (
                        <tr>
                          <td colSpan="8" className="px-6 py-12 text-center text-slate-400">
                            No attendance records match your active criteria in this period.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================================= TASKS TAB ================================= */}
          {activeTab === 'tasks' && taskReport && (
            <div className="space-y-6">
              {/* 5 Stat Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs text-center relative overflow-hidden group hover:shadow-md transition-all">
                  <div className="absolute top-0 left-0 w-full h-1 bg-slate-400" />
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Total Assigned</p>
                  <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                    {taskReport.summary?.total_assigned || 0}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">In this timeframe</p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-emerald-200/70 dark:border-emerald-900/50 shadow-xs text-center relative overflow-hidden group hover:shadow-md transition-all">
                  <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />
                  <p className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Completed</p>
                  <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                    {taskReport.summary?.total_completed || 0}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">Approved deliverables</p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-amber-200/70 dark:border-amber-900/50 shadow-xs text-center relative overflow-hidden group hover:shadow-md transition-all">
                  <div className="absolute top-0 left-0 w-full h-1 bg-amber-500" />
                  <p className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">Delayed Completion</p>
                  <p className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
                    {taskReport.summary?.delayed_completions || 0}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">Completed past deadline</p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-rose-200/70 dark:border-rose-900/50 shadow-xs text-center relative overflow-hidden group hover:shadow-md transition-all">
                  <div className="absolute top-0 left-0 w-full h-1 bg-rose-500" />
                  <p className="text-[10px] font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-1">Total Rejected</p>
                  <p className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400">
                    {taskReport.summary?.total_rejected || 0}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">Returned for rework</p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-blue-200/70 dark:border-blue-900/50 shadow-xs text-center relative overflow-hidden group hover:shadow-md transition-all">
                  <div className="absolute top-0 left-0 w-full h-1 bg-blue-500" />
                  <p className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">Resubmitted</p>
                  <p className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">
                    {taskReport.summary?.total_resubmitted || 0}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">Revised submissions</p>
                </div>
              </div>

              {/* Tasks Records Table */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-slate-100">
                      Task History & Delivery Performance
                    </h3>
                    <p className="text-xs text-slate-400">
                      Showing {filteredTasks.length} of {taskReport.tasks?.length || 0} tasks
                    </p>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                      { id: 'all', label: 'All' },
                      { id: 'Completed', label: 'Completed' },
                      { id: 'Pending', label: 'In Progress / Pending' },
                      { id: 'Rejected', label: 'Revision / Rejected' }
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setTaskFilter(f.id)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          taskFilter === f.id
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700/60'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800">
                      <tr>
                        <th className="px-5 py-3.5">Task Title</th>
                        <th className="px-5 py-3.5">Category</th>
                        <th className="px-5 py-3.5">Assigned On</th>
                        <th className="px-5 py-3.5 text-right">Current Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                      {filteredTasks.map((task, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="font-bold text-slate-800 dark:text-slate-100 max-w-[320px] truncate">
                              {task.title}
                            </div>
                            {task.was_resubmitted && (
                              <div className="mt-1">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                                  <FiRefreshCw className="mr-1" size={10} /> Resubmitted {task.resubmit_count > 1 ? `x${task.resubmit_count}` : ''}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                              {task.category || 'General'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
                            {new Date(task.assign_date || task.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </td>
                          <td className="px-5 py-3.5 text-right whitespace-nowrap">
                            {task.status === 'Completed' ? (
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold ${
                                  task.was_delayed
                                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                                    : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                                }`}
                              >
                                <FiCheckCircle size={13} /> {task.was_delayed ? 'Completed (Delayed)' : 'Completed'}
                              </span>
                            ) : task.status === 'Rejected' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                                <FiXCircle size={13} /> Needs Revision
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                                <FiClock size={13} /> {task.status}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {filteredTasks.length === 0 && (
                        <tr>
                          <td colSpan="4" className="px-6 py-12 text-center text-slate-400">
                            No tasks found in this period matching your criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ReportsView;
