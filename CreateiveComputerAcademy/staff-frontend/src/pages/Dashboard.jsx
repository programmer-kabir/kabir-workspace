import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  FiCheckCircle, FiClock, FiList, FiAlertCircle, FiXCircle,
  FiPlayCircle, FiEye, FiAward, FiStar, FiTarget, FiArrowRight,
  FiActivity, FiLayers, FiTrendingUp, FiCheck
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import TiffinTimer from '../components/TiffinTimer';
import ActiveBreakWidget from '../components/ActiveBreakWidget';
import AnimatedCounter from '../components/AnimatedCounter';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(() => {
    try {
      return !sessionStorage.getItem('cca_dashboard_personal_cache');
    } catch {
      return false;
    }
  });
  const [attendance, setAttendance] = useState(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem('cca_dashboard_personal_cache') || '{}');
      return saved.attendance || null;
    } catch { return null; }
  });
  const [tasks, setTasks] = useState(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem('cca_dashboard_personal_cache') || '{}');
      return saved.tasks || [];
    } catch { return []; }
  });
  const [mangoSummary, setMangoSummary] = useState(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem('cca_dashboard_personal_cache') || '{}');
      return saved.mangoSummary || null;
    } catch { return null; }
  });

  // Master Performance Report Data (Directly unified with Admin Master Report)
  const [reportLoading, setReportLoading] = useState(false);
  const [staffData, setStaffData] = useState(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem('cca_dashboard_report_cache') || '{}');
      return saved.staffData || [];
    } catch { return []; }
  });
  const [companySummary, setCompanySummary] = useState(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem('cca_dashboard_report_cache') || '{}');
      return saved.companySummary || null;
    } catch { return null; }
  });
  const [timeFilter, setTimeFilter] = useState('this_month'); // Default to 'this_month' like Admin Master Report!
  const [sortBy, setSortBy] = useState('overall'); // 'overall', 'tasks', 'attendance', 'quality', 'credits'
  const [selectedDept, setSelectedDept] = useState('all');

  // 1. Fetch Today's Attendance, Assigned Tasks, and Mango Bank
  useEffect(() => {
    const fetchPersonalData = async () => {
      if (!currentUser?.id) return;
      try {
        const [attendanceRes, tasksRes, mangoRes] = await Promise.all([
          axios.post(`${API_BASE}api/attendance/get_attendance.php`, { user_id: currentUser.id }),
          axios.post(`${API_BASE}api/tasks/get_my_tasks.php`, { user_id: currentUser.id }),
          axios.get(`${API_BASE}api/breaks/get_mango_break_bank.php?user_id=${currentUser.id}`).catch(() => null)
        ]);

        if (attendanceRes.data?.status === 'success') {
          setAttendance(attendanceRes.data.today);
        }
        if (tasksRes.data?.status === 'success') {
          setTasks(tasksRes.data.tasks || []);
        }
        if (mangoRes?.data?.status === 'success') {
          setMangoSummary(mangoRes.data.data.summary);
        }
        try {
          sessionStorage.setItem('cca_dashboard_personal_cache', JSON.stringify({
            attendance: attendanceRes.data?.today || null,
            tasks: tasksRes.data?.tasks || [],
            mangoSummary: mangoRes?.data?.data?.summary || null
          }));
        } catch {}
      } catch (err) {
        console.error("Personal dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPersonalData();
  }, [currentUser]);

  // 2. Fetch Exact Company Master Report (identical to Admin Master Report)
  useEffect(() => {
    const fetchMasterReport = async () => {
      setReportLoading(true);
      try {
        const now = new Date();
        const y = now.getFullYear();
        const m = now.getMonth();
        const todayStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        let startDate = `${y}-${String(m + 1).padStart(2, '0')}-01`;
        let endDate = todayStr;

        if (timeFilter === 'today') {
          startDate = todayStr;
          endDate = todayStr;
        } else if (timeFilter === 'this_week') {
          const d = new Date();
          const day = d.getDay(); // 0 = Sun, 6 = Sat
          const diffToSat = (day + 1) % 7;
          d.setDate(d.getDate() - diffToSat);
          startDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          endDate = todayStr;
        } else if (timeFilter === 'all_time') {
          startDate = '2023-01-01';
          endDate = todayStr;
        }

        const res = await axios.post(`${API_BASE}api/reports/get_all_staff_report.php`, {
          start_date: startDate,
          end_date: endDate,
          department_id: selectedDept !== 'all' ? selectedDept : null
        });

        if (res.data?.status === 'success') {
          const list = res.data.staff_data || [];
          setStaffData(list);
          setCompanySummary(res.data.company_summary || null);
          try {
            sessionStorage.setItem('cca_dashboard_report_cache', JSON.stringify({
              staffData: list,
              companySummary: res.data.company_summary || null
            }));
          } catch {}
        }
      } catch (err) {
        console.error("Master report fetch error:", err);
      } finally {
        setReportLoading(false);
      }
    };

    fetchMasterReport();
  }, [timeFilter, selectedDept]);

  // Live ticking timer: Increment worked seconds second-by-second for actively working staff
  useEffect(() => {
    const timer = setInterval(() => {
      setStaffData(prevList => {
        if (!prevList || prevList.length === 0) return prevList;
        let hasActive = false;
        const updated = prevList.map(s => {
          if (s.is_currently_working) {
            hasActive = true;
            const newSecs = (s.total_worked_seconds || 0) + 1;
            const h = Math.floor(newSecs / 3600);
            const m = Math.floor((newSecs % 3600) / 60);
            const sec = newSecs % 60;
            return {
              ...s,
              total_worked_seconds: newSecs,
              total_worked_formatted: `${h}h ${m}m ${sec}s`
            };
          }
          return s;
        });
        return hasActive ? updated : prevList;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Get staff credit depending on active timeframe
  const getStaffCredit = (staff) => {
    if (!staff) return 0;
    if (timeFilter === 'all_time') {
      return Number(staff.credit_balance || 0);
    }
    // For today, this_week, this_month: use period_credits (net earned minus penalties)
    return Number(staff.period_credits !== undefined ? staff.period_credits : (staff.credit_balance || 0));
  };

  // Sort staff based on active view tab
  const sortedStaffList = useMemo(() => {
    const list = [...staffData];
    if (sortBy === 'tasks') {
      return list.sort((a, b) => b.tasks_completed - a.tasks_completed || b.efficiency_score - a.efficiency_score);
    }
    if (sortBy === 'attendance') {
      // Sort by logged duty hours so users immediately see who worked how many hours (Today, Week, Month, All-Time)
      return list.sort((a, b) => (b.total_worked_seconds - a.total_worked_seconds) || (b.present_days - a.present_days));
    }
    if (sortBy === 'quality') {
      return list.sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0) || b.tasks_completed - a.tasks_completed);
    }
    if (sortBy === 'credits') {
      // Sort by net credit in selected period (Today, This Week, This Month, All Time)
      return list.sort((a, b) => getStaffCredit(b) - getStaffCredit(a) || b.efficiency_score - a.efficiency_score);
    }
    // Default: Overall Performance / Efficiency Score
    return list.sort((a, b) => b.efficiency_score - a.efficiency_score || b.tasks_completed - a.tasks_completed);
  }, [staffData, sortBy, timeFilter]);

  // Top 5 Spotlight Performers
  const top1 = sortedStaffList[0] || null;
  const top2 = sortedStaffList[1] || null;
  const top3 = sortedStaffList[2] || null;
  const top4 = sortedStaffList[3] || null;
  const top5 = sortedStaffList[4] || null;
  const top5StaffList = sortedStaffList.slice(0, 5);

  // Find current user's standing in master report
  const myIndex = sortedStaffList.findIndex(s => s.user_id === currentUser?.id);
  const myStanding = myIndex >= 0 ? { ...sortedStaffList[myIndex], rank: myIndex + 1 } : null;
  const aheadPerson = myIndex > 0 ? sortedStaffList[myIndex - 1] : null;

  // Task breakdown counts
  const todoTasks = tasks.filter(t => t.status === 'To-Do');
  const inProgressTasks = tasks.filter(t => t.status === 'In Progress');
  const reviewTasks = tasks.filter(t => t.status === 'In Review');
  const rejectedTasks = tasks.filter(t => t.status === 'Rejected');
  const completedTasks = tasks.filter(t => t.status === 'Completed');
  const activeTasks = [...rejectedTasks, ...inProgressTasks, ...todoTasks];

  const getTierBadge = (tier) => {
    switch (tier) {
      case 'Top Performer':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">🏆 Top Performer</span>;
      case 'High Output':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30">🚀 High Output</span>;
      case 'Good Standing':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">✓ Good Standing</span>;
      case 'Attendance Only':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">⏱️ Attendance Only</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30">⚠️ Needs Attention</span>;
    }
  };

  const renderSpotlightCard = (staff, rank) => {
    if (!staff) return null;
    const isGold = rank === 1;
    const isSilver = rank === 2;
    const isBronze = rank === 3;

    return (
      <div
        key={staff.user_id}
        className={`${
          isGold
            ? 'order-first md:order-2 bg-gradient-to-b from-amber-50/60 via-white to-amber-50/30 dark:from-amber-950/20 dark:via-slate-800 dark:to-slate-800/80 rounded-3xl p-5 border-2 border-amber-400/80 dark:border-amber-500/60 shadow-lg shadow-amber-500/10 flex flex-col justify-between relative overflow-hidden'
            : isSilver
            ? 'order-2 md:order-1 bg-slate-50/80 dark:bg-slate-800/40 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between hover:shadow-md transition-all'
            : 'order-3 md:order-3 bg-slate-50/80 dark:bg-slate-800/40 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between hover:shadow-md transition-all'
        }`}
      >
        <div className="relative z-10">
          {/* Top Rank Badge */}
          <div className="flex items-center justify-between mb-3">
            <span
              className={`w-7 h-7 rounded-xl font-black text-xs flex items-center justify-center ${
                isGold
                  ? 'bg-amber-400 text-slate-950 shadow-xs'
                  : isSilver
                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                  : isBronze
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              #{rank}
            </span>
            {isGold ? (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 flex items-center gap-1">
                {sortBy === 'attendance' ? '⏱️ Top Duty' : sortBy === 'tasks' ? '🚀 Top Output' : sortBy === 'quality' ? '⭐ Quality Leader' : '👑 Top Contributor'}
              </span>
            ) : (
              getTierBadge(staff.performance_tier)
            )}
          </div>

          {/* Profile Header with Unique Bordered Rank Icon next to Name */}
          <div className="flex items-center gap-3 mb-4">
            <div
              className={`rounded-2xl overflow-hidden shrink-0 border shadow-sm relative ${
                isGold
                  ? 'w-14 h-14 border-2 border-amber-400 shadow-md ring-2 ring-amber-400/20'
                  : isSilver
                  ? 'w-12 h-12 border-2 border-slate-300 dark:border-slate-600'
                  : 'w-12 h-12 border-2 border-amber-300/60 dark:border-amber-800'
              }`}
            >
              {staff.profile_picture ? (
                <img src={`${API_BASE}${staff.profile_picture}`} alt={staff.name} className="w-full h-full object-cover" />
              ) : (
                <div className={`w-full h-full flex items-center justify-center font-black ${isGold ? 'bg-amber-100 text-amber-700 text-base' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 text-sm'}`}>
                  {staff.name?.charAt(0)}
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h4 className={`font-black text-slate-900 dark:text-white truncate ${isGold ? 'text-base' : 'text-sm'}`}>
                  {staff.name}
                </h4>

                {/* Unique Rank Icon with Border next to Name */}
                {rank === 1 && (
                  <span
                    className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-500 text-xs shadow-xs shrink-0"
                    title="Rank #1 Diamond Champion"
                  >
                    💎
                  </span>
                )}
                {rank === 2 && (
                  <span
                    className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-xs shadow-xs shrink-0"
                    title="Rank #2 Elite Performer"
                  >
                    🏆
                  </span>
                )}
                {rank === 3 && (
                  <span
                    className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-700 text-xs shadow-xs shrink-0"
                    title="Rank #3 Quality Star"
                  >
                    ⭐
                  </span>
                )}
              </div>

              <p className={`text-[11px] truncate ${isGold ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-slate-400 font-semibold'}`}>
                {staff.department_name}
              </p>
            </div>
          </div>

          {/* Dynamic Headline Metric Box based on Active Tab */}
          <div
            className={`p-3.5 rounded-2xl mb-3 flex items-center justify-between border ${
              isGold
                ? 'bg-white dark:bg-slate-800 border-amber-300/80 dark:border-amber-500/40 shadow-xs'
                : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'
            }`}
          >
            {sortBy === 'attendance' ? (
              <>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Logged Duty</span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {staff.is_currently_working ? (
                      <span className="inline-flex items-center gap-1.5 text-emerald-500 font-bold">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> On Duty Now
                      </span>
                    ) : (
                      `${staff.present_days} Days Present (${staff.attendance_rate}%)`
                    )}
                  </span>
                </div>
                <div className="text-right">
                  <span className={`text-2xl font-black tracking-tight font-mono ${isGold ? 'text-3xl text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
                    {staff.total_worked_formatted}
                  </span>
                  <span className="block text-[10px] font-black tracking-wider uppercase">
                    {staff.is_currently_working ? (
                      <span className="text-emerald-500 font-extrabold flex items-center justify-end gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span> LIVE
                      </span>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">WORKED</span>
                    )}
                  </span>
                </div>
              </>
            ) : sortBy === 'tasks' ? (
              <>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Tasks Output</span>
                  <span className="text-[10px] text-slate-400 font-medium">{staff.completion_rate}% Completion</span>
                </div>
                <span className={`text-2xl font-black tracking-tight ${isGold ? 'text-3xl text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
                  {staff.tasks_completed} Done
                </span>
              </>
            ) : sortBy === 'quality' ? (
              <>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Quality Rating</span>
                  <span className="text-[10px] text-slate-400 font-medium">{staff.rated_count || 0} Rated Tasks</span>
                </div>
                <span className={`text-2xl font-black tracking-tight ${isGold ? 'text-3xl text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
                  ⭐ {staff.avg_rating || '5.0'}
                </span>
              </>
            ) : sortBy === 'credits' ? (
              <>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    {timeFilter === 'today' ? "Today's Net Credits" :
                     timeFilter === 'this_week' ? "This Week's Credits" :
                     timeFilter === 'this_month' ? "This Month's Credits" :
                     "Net Credit Balance"}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {timeFilter === 'all_time'
                      ? 'Total Balance (Earned − Deductions)'
                      : `+${staff.period_earned || 0} earned / -${staff.period_penalties || 0} minus`}
                  </span>
                </div>
                <div className="text-right">
                  <span className={`text-2xl font-black tracking-tight font-mono ${
                    getStaffCredit(staff) < 0
                      ? 'text-rose-600 dark:text-rose-400'
                      : isGold
                      ? 'text-3xl text-amber-600 dark:text-amber-400'
                      : 'text-slate-900 dark:text-white'
                  }`}>
                    {getStaffCredit(staff) > 0 ? `+${getStaffCredit(staff)}` : getStaffCredit(staff)}
                  </span>
                  <span className="block text-[10px] font-black tracking-wider uppercase text-amber-500 font-extrabold">
                    CREDITS
                  </span>
                </div>
              </>
            ) : (
              <>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Master Score</span>
                  <span className="text-[10px] text-slate-400 font-medium">{staff.performance_tier}</span>
                </div>
                <span className={`text-2xl font-black tracking-tight ${isGold ? 'text-3xl text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
                  {staff.efficiency_score}%
                </span>
              </>
            )}
          </div>

          {/* Sub-Metric Matrix & Progress Bar */}
          {sortBy === 'attendance' ? (
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span className="text-slate-400 font-medium">Duty Hours Logged:</span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                  {staff.total_worked_formatted} ({staff.present_days}d Present)
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(100, Math.round((staff.total_worked_seconds / Math.max(1, (staff.present_days || 1) * 8 * 3600)) * 100))}%` }} />
              </div>
              <div className="flex items-center justify-between pt-1 text-slate-500 text-[11px]">
                <span>Avg: <strong className="text-slate-800 dark:text-slate-200 font-bold">{staff.avg_daily_hours}h/day</strong></span>
                <span>Late: <strong className="text-amber-500 font-bold">{staff.late_days || 0}d</strong></span>
                <span>Att: <strong className="text-slate-700 dark:text-slate-300 font-bold">{staff.attendance_rate}%</strong></span>
              </div>
            </div>
          ) : sortBy === 'tasks' ? (
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span className="text-slate-400 font-medium">Output Rate:</span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                  {staff.tasks_completed} / {staff.tasks_assigned} ({staff.completion_rate}%)
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${staff.completion_rate}%` }} />
              </div>
              <div className="flex items-center justify-between pt-1 text-slate-500 text-[11px]">
                <span>In Progress: <strong className="text-indigo-500 font-bold">{staff.tasks_in_progress || 0}</strong></span>
                <span>Review: <strong className="text-amber-500 font-bold">{staff.tasks_in_review || 0}</strong></span>
                <span>Rejections: <strong className="text-rose-500 font-bold">{staff.tasks_rejected || 0}x</strong></span>
              </div>
            </div>
          ) : sortBy === 'quality' ? (
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span className="text-slate-400 font-medium">Quality Star Level:</span>
                <span className="font-extrabold text-amber-500">
                  ⭐ {staff.avg_rating || '5.0'} / 5.0
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div className="bg-amber-400 h-full rounded-full" style={{ width: `${((staff.avg_rating || 5.0) / 5) * 100}%` }} />
              </div>
              <div className="flex items-center justify-between pt-1 text-slate-500 text-[11px]">
                <span>Rated Tasks: <strong className="text-slate-800 dark:text-slate-200 font-bold">{staff.rated_count || 0}</strong></span>
                <span>Completed: <strong className="text-emerald-500 font-bold">{staff.tasks_completed}</strong></span>
                <span>Rejections: <strong className="text-rose-500 font-bold">{staff.tasks_rejected || 0}x</strong></span>
              </div>
            </div>
          ) : sortBy === 'credits' ? (
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span className="text-slate-400 font-medium">
                  {timeFilter === 'all_time' ? 'Wallet Balance:' : `${timeFilter === 'today' ? 'Today' : timeFilter === 'this_week' ? 'This Week' : 'This Month'} Net:`}
                </span>
                <span className="font-extrabold text-amber-600 dark:text-amber-400 font-mono">
                  {getStaffCredit(staff) > 0 ? `+${getStaffCredit(staff)}` : getStaffCredit(staff)} Credits
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-400 to-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(5, Math.min(100, Math.round((Math.max(0, getStaffCredit(staff)) / Math.max(1, getStaffCredit(top1) || 50)) * 100)))}%` }}
                />
              </div>
              <div className="flex items-center justify-between pt-1 text-slate-500 text-[11px]">
                <span>Earned: <strong className="text-emerald-500 font-bold">+{timeFilter === 'all_time' ? (staff.credits_earned || staff.credit_balance || 0) : (staff.period_earned || 0)}</strong></span>
                <span>Minus: <strong className="text-rose-500 font-bold">-{timeFilter === 'all_time' ? (staff.credits_penalties || 0) : (staff.period_penalties || 0)}</strong></span>
                <span>Wallet Bal: <strong className="text-amber-500 font-bold font-mono">{staff.credit_balance || 0}</strong></span>
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span className="text-slate-400 font-medium">Tasks Output:</span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                  {staff.tasks_completed} / {staff.tasks_assigned} ({staff.completion_rate}%)
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${staff.completion_rate}%` }} />
              </div>
              <div className="flex items-center justify-between pt-1 text-slate-500 text-[11px]">
                <span>⭐ Rating: <strong className="text-amber-500 font-bold">{staff.avg_rating || '5.0'}</strong></span>
                <span>Att: <strong className="text-slate-800 dark:text-slate-200 font-bold">{staff.attendance_rate}%</strong> ({staff.present_days}P / {staff.late_days || 0}L)</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[70vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-100 dark:border-slate-700 border-b-indigo-600 shadow-xl"></div>
          <p className="text-slate-400 font-bold tracking-widest uppercase text-xs animate-pulse">Loading Workspace</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 pb-16">

      {/* ── Executive Hero Greeting Banner ── */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-[2.5rem] p-8 md:p-10 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2 backdrop-blur-sm border border-white/10">
              <HiSparkles className="text-amber-400" />
              <span>Workspace Command Center</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black mb-2 flex items-center gap-3 tracking-tight">
              Good day, {currentUser?.name?.split(' ')[0]}! <span className="inline-block">👋</span>
            </h1>
            <p className="text-slate-400 font-medium text-sm sm:text-base max-w-lg leading-relaxed">
              Track your company master performance, quality ratings, and workforce standings in real-time.
            </p>
          </div>

          {/* Quick Metrics Capsule */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-4 sm:p-5 flex items-center gap-3 sm:gap-6 shadow-2xl">
            <div className="text-center px-3 sm:px-4 border-r border-white/10">
              <p className="text-3xl font-black tracking-tight text-emerald-400">
                <AnimatedCounter value={completedTasks.length} />
              </p>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mt-1">Done</p>
            </div>
            <div className="text-center px-3 sm:px-4 border-r border-white/10">
              <p className="text-3xl font-black tracking-tight text-amber-400">
                <AnimatedCounter value={reviewTasks.length} />
              </p>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mt-1">Review</p>
            </div>
            <div className="text-center px-3 sm:px-4">
              <p className={`text-3xl font-black tracking-tight ${rejectedTasks.length > 0 ? 'text-rose-400' : 'text-slate-200'}`}>
                <AnimatedCounter value={rejectedTasks.length} />
              </p>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mt-1">Fix Need</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Active Break Live Banner (Conditional) ── */}
      <ActiveBreakWidget />

      {/* ── Tiffin Quota Widget ── */}
      <TiffinTimer />

      {/* ── Top Metric Cards Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-5">

        {/* 1. Today's Attendance Status */}
        <div
          onClick={() => navigate('/attendance')}
          className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Today's Duty</p>
            <span className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
              <FiClock size={16} />
            </span>
          </div>
          {attendance ? (
            <div>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                {attendance.status}
              </p>
              <p className="text-xs font-semibold text-slate-500 mt-1">
                In: <span className="text-slate-900 dark:text-white font-bold">{attendance.check_in || '—'}</span>
              </p>
            </div>
          ) : (
            <div>
              <p className="text-lg font-black text-slate-400 tracking-tight">Not Checked In</p>
              <span className="inline-block px-2 py-0.5 mt-1 rounded-md text-[10px] font-extrabold bg-rose-50 dark:bg-rose-950/50 text-rose-600 border border-rose-200 dark:border-rose-900">
                Action Required
              </span>
            </div>
          )}
        </div>

        {/* 2. Mango Break Bank Balance */}
        <div
          onClick={() => navigate('/mango-break-tree')}
          className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Mango Bank</p>
            <span className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center text-sm">
              🥭
            </span>
          </div>
          <div>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
              {mangoSummary?.ripe_mangoes_count || 0} <span className="text-sm font-bold text-slate-400">Ripe</span>
            </p>
            <p className="text-xs font-semibold text-slate-500 mt-1">
              OT: <span className="text-slate-900 dark:text-white font-bold">+{mangoSummary?.available_break_hours || 0}h</span>
            </p>
          </div>
        </div>

        {/* 3. In Progress / To-Do Pipeline */}
        <div
          onClick={() => navigate('/tasks', { state: { activeTab: 'In Progress' } })}
          className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">In Pipeline</p>
            <span className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center">
              <FiPlayCircle size={16} />
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {todoTasks.length + inProgressTasks.length} <span className="text-xs font-medium text-slate-400">Tasks</span>
          </p>
          <p className="text-[11px] text-blue-600 dark:text-blue-400 font-bold mt-1">Active Pipeline</p>
        </div>

        {/* 4. Action Required (Rejected Tasks) */}
        <div
          onClick={() => navigate('/tasks', { state: { activeTab: 'Rejected' } })}
          className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Rejections</p>
            <span className={`w-8 h-8 rounded-xl flex items-center justify-center ${rejectedTasks.length > 0 ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/50' : 'bg-slate-100 text-slate-400'}`}>
              <FiXCircle size={16} />
            </span>
          </div>
          <p className={`text-2xl font-black tracking-tight ${rejectedTasks.length > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
            {rejectedTasks.length}
          </p>
          <p className="text-[11px] text-rose-600 dark:text-rose-400 font-bold mt-1">Needs Correction</p>
        </div>

        {/* 5. In Review Tasks */}
        <div
          onClick={() => navigate('/tasks', { state: { activeTab: 'In Review' } })}
          className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Under Review</p>
            <span className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center">
              <FiEye size={16} />
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {reviewTasks.length}
          </p>
          <p className="text-[11px] text-purple-600 dark:text-purple-400 font-bold mt-1">Awaiting Review</p>
        </div>

      </div>

      {/* ── 🌟 COMPANY MASTER PERFORMANCE & TOP CONTRIBUTORS (100% UNIFIED WITH ADMIN) 🌟 ── */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200/80 dark:border-slate-800 shadow-xl overflow-hidden relative">

        {/* Top Control Bar: Heading + Time Filters */}
        <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800/80 flex flex-col lg:flex-row lg:items-center justify-between gap-5 bg-gradient-to-b from-slate-50/50 to-white dark:from-slate-900 dark:to-slate-900/50">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-3 py-1 rounded-full text-[11px] font-black tracking-wider uppercase bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60 flex items-center gap-1.5">
                <HiSparkles className="text-amber-500" /> Company Master Performance
              </span>
              <span className="text-xs text-slate-400 font-medium">• Official Evaluation</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Top Contributors & Workforce Standings
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
              Calculated using the official Master Report formula: <strong>35% Task Output + 35% Quality Star Rating + 30% Attendance</strong> minus Rejection Penalty.
            </p>
          </div>

          {/* Timeframe Filter Pills (Default: This Month) */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700/80 shrink-0 self-start lg:self-center">
            {[
              { id: 'today', label: 'Today' },
              { id: 'this_week', label: 'This Week' },
              { id: 'this_month', label: 'This Month' },
              { id: 'all_time', label: 'All Time' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setTimeFilter(f.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  timeFilter === f.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dimension Tabs */}
        <div className="px-6 md:px-8 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 flex items-center justify-between gap-4 overflow-x-auto custom-scrollbar">
          <div className="flex items-center gap-2">
            {[
              { id: 'overall', label: '🏆 Overall Performance', metric: 'Efficiency Score %' },
              { id: 'tasks', label: '🚀 Tasks Output', metric: 'Completed Deliveries' },
              { id: 'attendance', label: '⏱️ Duty Hours', metric: 'Worked Time' },
              { id: 'quality', label: '⭐ Quality & Stars', metric: 'Star Ratings' },
              { id: 'credits', label: '🪙 Credit Balance', metric: 'Net Balance' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSortBy(tab.id)}
                className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer border ${
                  sortBy === tab.id
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-400 font-semibold whitespace-nowrap hidden sm:inline-block">
            {sortedStaffList.length} Staff Ranked
          </span>
        </div>

        {/* Content Area */}
        <div className="p-6 md:p-8 space-y-8">
          {reportLoading ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <div className="w-10 h-10 border-4 border-slate-200 dark:border-slate-700 border-t-indigo-600 rounded-full animate-spin"></div>
              <p className="text-xs text-slate-400 font-bold mt-3 uppercase tracking-wider">Syncing Master Metrics...</p>
            </div>
          ) : sortedStaffList.length > 0 ? (
            <>
              {/* ── TOP 3 SPOTLIGHT PERFORMERS (HIGH-END EXECUTIVE CARDS) ── */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {renderSpotlightCard(top2, 2)}
                {renderSpotlightCard(top1, 1)}
                {renderSpotlightCard(top3, 3)}
              </div>

              {/* ── 📍 MY STANDING & BENCHMARK HUD CARD ── */}
              {myStanding && (
                <div className="rounded-3xl p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-xl shrink-0">
                      <FiActivity />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black uppercase tracking-wider text-indigo-300">
                          Your Performance Standing
                        </span>
                        <span className="px-2.5 py-0.5 rounded-md bg-amber-400 text-slate-950 text-xs font-black">
                          Rank #{myStanding.rank}
                        </span>
                        <span className="text-xs font-bold text-slate-300">
                          {sortBy === 'credits'
                            ? `(${getStaffCredit(myStanding)} Credits ${timeFilter === 'all_time' ? 'Wallet Balance' : 'in ' + (timeFilter === 'today' ? 'Today' : timeFilter === 'this_week' ? 'This Week' : 'This Month')})`
                            : sortBy === 'attendance'
                            ? `(${myStanding.total_worked_formatted} Worked • ${myStanding.present_days}d)`
                            : sortBy === 'tasks'
                            ? `(${myStanding.tasks_completed} Tasks Completed)`
                            : sortBy === 'quality'
                            ? `(⭐ ${myStanding.avg_rating || '5.0'} Rating)`
                            : `(${myStanding.efficiency_score}% Efficiency Score)`}
                        </span>
                        {getTierBadge(myStanding.performance_tier)}
                      </div>
                      <p className="text-xs sm:text-sm text-slate-300 font-medium mt-1">
                        {myStanding.rank === 1 ? (
                          <span>👑 You are currently Rank #1! Outstanding performance across workforce metrics.</span>
                        ) : aheadPerson ? (
                          <span>
                            {sortBy === 'credits' ? (
                              <>Need only <strong>+{Math.max(1, getStaffCredit(aheadPerson) - getStaffCredit(myStanding))} more credits</strong> to overtake <strong>{aheadPerson.name}</strong> for Rank #{myStanding.rank - 1}!</>
                            ) : sortBy === 'attendance' ? (
                              <>Need only <strong>+{Math.max(1, Math.ceil((aheadPerson.total_worked_seconds - myStanding.total_worked_seconds) / 3600))}h more duty</strong> to overtake <strong>{aheadPerson.name}</strong> for Rank #{myStanding.rank - 1}!</>
                            ) : sortBy === 'tasks' ? (
                              <>Need only <strong>+{Math.max(1, aheadPerson.tasks_completed - myStanding.tasks_completed + 1)} tasks</strong> to overtake <strong>{aheadPerson.name}</strong> for Rank #{myStanding.rank - 1}!</>
                            ) : (
                              <>Need only <strong>+{Math.max(1, aheadPerson.efficiency_score - myStanding.efficiency_score + 1)}% score</strong> to overtake <strong>{aheadPerson.name}</strong> for Rank #{myStanding.rank - 1}!</>
                            )}
                          </span>
                        ) : (
                          <span>Complete your assigned tasks with 5★ quality to climb higher in company rankings.</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(sortBy === 'credits' ? '/credits' : sortBy === 'attendance' ? '/attendance' : '/tasks')}
                    className="px-5 py-2.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-black text-xs uppercase tracking-wider shadow-md active:scale-95 transition-all shrink-0 cursor-pointer self-start md:self-auto"
                  >
                    {sortBy === 'credits' ? 'Credit Wallet \u2192' : sortBy === 'attendance' ? 'Duty & Shifts \u2192' : 'Boost Score \u2192'}
                  </button>
                </div>
              )}

              {/* ── 📊 MASTER PERFORMANCE DIRECTORY TABLE (TOP 5 CONTRIBUTORS) ── */}
              <div className="overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-2">
                    <FiLayers className="text-indigo-600" />
                    <span>Top 5 Staff Performance Directory</span>
                  </h4>
                  <span className="text-[11px] text-slate-400 font-medium">Sorted by: {sortBy.toUpperCase()}</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/50 dark:bg-slate-900/50 text-slate-400 dark:text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-3 px-4">#</th>
                        <th className="py-3 px-4">Employee</th>
                        <th className="py-3 px-4">Department</th>
                        <th className="py-3 px-4">Quality Stars</th>
                        <th className="py-3 px-4">Attendance</th>
                        <th className="py-3 px-4">Duty Hours</th>
                        <th className="py-3 px-4">Tasks Output</th>
                        <th className="py-3 px-4">Rejections</th>
                        <th className="py-3 px-4">Credit Balance</th>
                        <th className="py-3 px-4 text-right">Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                      {top5StaffList.map((staff, idx) => {
                        const rankNum = idx + 1;
                        const isMe = staff.user_id === currentUser?.id;

                        return (
                          <tr
                            key={staff.user_id}
                            className={`transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/40 ${
                              isMe ? 'bg-indigo-50/40 dark:bg-indigo-950/20 font-bold' : ''
                            }`}
                          >
                            {/* Rank */}
                            <td className="py-3.5 px-4 font-black text-slate-800 dark:text-slate-200">
                              <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs ${
                                rankNum === 1 ? 'bg-amber-400 text-slate-950 font-black' :
                                rankNum === 2 ? 'bg-slate-200 dark:bg-slate-700 text-slate-800' :
                                rankNum === 3 ? 'bg-amber-100 dark:bg-amber-950 text-amber-800' :
                                'text-slate-400'
                              }`}>
                                {rankNum}
                              </span>
                            </td>

                            {/* Employee */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                                  {staff.profile_picture ? (
                                    <img src={`${API_BASE}${staff.profile_picture}`} alt={staff.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-600 text-xs">
                                      {staff.name?.charAt(0)}
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-extrabold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                                    <span>{staff.name}</span>
                                    {isMe && <span className="px-1.5 py-0.2 rounded-full bg-indigo-600 text-white text-[9px] font-black uppercase">You</span>}
                                  </p>
                                  <p className="text-[10px] text-slate-400 truncate">{staff.designation}</p>
                                </div>
                              </div>
                            </td>

                            {/* Department */}
                            <td className="py-3.5 px-4">
                              <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                                {staff.department_name}
                              </span>
                            </td>

                            {/* Quality Stars */}
                            <td className="py-3.5 px-4">
                              {staff.rated_count > 0 ? (
                                <div>
                                  <span className="font-bold text-amber-500">⭐ {staff.avg_rating}</span>
                                  <span className="text-[10px] text-slate-400 ml-1">({staff.rated_count} rated)</span>
                                </div>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>

                            {/* Attendance */}
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-800 dark:text-slate-200">
                                {staff.attendance_rate}%
                              </div>
                              <span className="text-[10px] text-slate-400">{staff.present_days}P / {staff.late_days || 0}L</span>
                            </td>

                            {/* Duty Hours */}
                            <td className={`py-3.5 px-4 ${sortBy === 'attendance' ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : ''}`}>
                              <span className="font-black text-emerald-600 dark:text-emerald-400 font-mono text-xs">
                                {staff.total_worked_formatted}
                              </span>
                              <span className="block text-[9px] font-black uppercase tracking-wider">
                                {staff.is_currently_working ? (
                                  <span className="text-emerald-500 font-bold inline-flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span> LIVE
                                  </span>
                                ) : (
                                  <span className="text-slate-400">WORKED</span>
                                )}
                              </span>
                            </td>

                            {/* Tasks Output */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 dark:text-white">
                                  {staff.tasks_completed} / {staff.tasks_assigned}
                                </span>
                                <span className="text-[10px] text-slate-400">({staff.completion_rate}%)</span>
                              </div>
                              <div className="w-20 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-1">
                                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${staff.completion_rate}%` }} />
                              </div>
                            </td>

                            {/* Rejections */}
                            <td className="py-3.5 px-4">
                              {staff.tasks_rejected > 0 ? (
                                <span className="font-bold text-rose-500 text-[11px]">
                                  {staff.tasks_rejected}x ({staff.rejection_rate}%)
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[11px]">0</span>
                              )}
                            </td>

                            {/* Credit Balance */}
                            <td className={`py-3.5 px-4 ${sortBy === 'credits' ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''}`}>
                              <div className="flex items-center gap-1.5">
                                <span className="text-amber-500 text-xs">🪙</span>
                                <span className={`font-black font-mono text-xs ${
                                  getStaffCredit(staff) < 0
                                    ? 'text-rose-600 dark:text-rose-400'
                                    : 'text-amber-600 dark:text-amber-400'
                                }`}>
                                  {getStaffCredit(staff) > 0 ? `+${getStaffCredit(staff)}` : getStaffCredit(staff)}
                                </span>
                              </div>
                              <span className="block text-[9px] text-slate-400 font-medium">
                                {timeFilter === 'all_time' ? 'Wallet Balance' : 'Net Period'}
                              </span>
                            </td>

                            {/* Efficiency Score */}
                            <td className="py-3.5 px-4 text-right">
                              <span className="text-sm font-black text-slate-900 dark:text-white mr-1.5">
                                {staff.efficiency_score}%
                              </span>
                              {getTierBadge(staff.performance_tier)}
                            </td>

                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="py-16 text-center text-slate-400">
              No staff performance logs recorded for this timeframe.
            </div>
          )}
        </div>

      </div>

      {/* ── 📋 MY ACTIVE TASKS SECTION (PLACED DIRECTLY BELOW LEADERBOARD) ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
                <FiList size={18} />
              </span>
              <span>My Active Tasks & Work Pipeline</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Complete these tasks with 5★ quality to boost your Master Efficiency Score.
            </p>
          </div>

          <button
            onClick={() => navigate('/tasks')}
            className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 px-4 py-2.5 rounded-2xl transition-all flex items-center gap-1.5 cursor-pointer border border-indigo-200 dark:border-indigo-800/60"
          >
            <span>Open Tasks Board</span>
            <FiArrowRight size={14} />
          </button>
        </div>

        {activeTasks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeTasks.slice(0, 6).map(task => {
              const isRejected = task.status === 'Rejected';
              const isInProgress = task.status === 'In Progress';

              return (
                <div
                  key={task.id}
                  onClick={() => navigate('/tasks', { state: { activeTab: task.status } })}
                  className={`p-5 rounded-3xl border transition-all flex flex-col justify-between gap-4 cursor-pointer group shadow-sm hover:shadow-xl hover:-translate-y-1 ${
                    isRejected
                      ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-300/80 dark:border-rose-800/60 hover:border-rose-500'
                      : isInProgress
                      ? 'bg-blue-50/30 dark:bg-blue-950/20 border-blue-200/80 dark:border-blue-800/60 hover:border-blue-500'
                      : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                        {task.category_name || task.category || 'General Task'}
                      </span>

                      <span
                        className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border ${
                          isRejected
                            ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                            : isInProgress
                            ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {task.status}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-slate-900 dark:text-white text-base group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                      {task.title}
                    </h4>

                    {isRejected && task.fix_notes && (
                      <p className="text-xs text-rose-600 dark:text-rose-400 bg-rose-100/60 dark:bg-rose-900/30 p-2.5 rounded-xl font-medium mt-2 line-clamp-2 border border-rose-200 dark:border-rose-800/40">
                        <strong>Fix Required:</strong> {task.fix_notes}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400 font-medium">
                    <span>Due: {task.assign_date || 'Today'}</span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                      Action &rarr;
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mb-3">
              <FiCheckCircle size={32} />
            </div>
            <h4 className="text-lg font-black text-slate-800 dark:text-white">All caught up!</h4>
            <p className="text-xs text-slate-400 max-w-xs mt-1">No pending or rejected tasks requiring your attention. Check the board to grab new assignments!</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default Dashboard;
