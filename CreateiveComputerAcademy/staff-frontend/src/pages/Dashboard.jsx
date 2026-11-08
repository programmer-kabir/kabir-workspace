import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import TiffinTimer from '../components/TiffinTimer';
import ActiveBreakWidget from '../components/ActiveBreakWidget';

import DashboardHeroBanner from '../components/Dashboard/DashboardHeroBanner';
import DashboardMotivationTicker from '../components/Dashboard/DashboardMotivationTicker';
import DashboardMetricGrid from '../components/Dashboard/DashboardMetricGrid';
import DashboardLeaderboardSection from '../components/Dashboard/DashboardLeaderboardSection';
import DashboardActiveTasks from '../components/Dashboard/DashboardActiveTasks';
import { calculateDateRange, sortStaffList } from '../components/Dashboard/dashboardUtils.jsx';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

const Dashboard = () => {
  const { currentUser } = useAuth();

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

  // Master Performance Report Data
  const [reportLoading, setReportLoading] = useState(false);
  const [staffData, setStaffData] = useState(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem('cca_dashboard_report_cache') || '{}');
      return saved.staffData || [];
    } catch { return []; }
  });
  const [, setCompanySummary] = useState(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem('cca_dashboard_report_cache') || '{}');
      return saved.companySummary || null;
    } catch { return null; }
  });
  const [timeFilter, setTimeFilter] = useState('today');
  const [sortBy, setSortBy] = useState('attendance');
  const [selectedDept] = useState('all');

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
        } catch { }
      } catch (err) {
        console.error('Personal dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPersonalData();
  }, [currentUser]);

  // 2. Fetch Exact Company Master Report
  useEffect(() => {
    const fetchMasterReport = async () => {
      setReportLoading(true);
      try {
        const { startDate, endDate } = calculateDateRange(timeFilter);
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
          } catch { }
        }
      } catch (err) {
        console.error('Master report fetch error:', err);
      } finally {
        setReportLoading(false);
      }
    };

    fetchMasterReport();
  }, [timeFilter, selectedDept]);

  // Live ticking timer for actively working staff
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

  // Sorted staff list by active view tab
  const sortedStaffList = useMemo(() => {
    return sortStaffList(staffData, sortBy, timeFilter);
  }, [staffData, sortBy, timeFilter]);

  // Top 5 Spotlight Performers & Current user standing
  const top1 = sortedStaffList[0] || null;
  const top2 = sortedStaffList[1] || null;
  const top3 = sortedStaffList[2] || null;
  const top5StaffList = sortedStaffList.slice(0, 5);

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

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[70vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-100 dark:border-slate-700 border-b-indigo-600 shadow-xl" />
          <p className="text-slate-400 font-bold tracking-widest uppercase text-xs animate-pulse">Loading Workspace</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 pb-16">
      {/* Executive Hero Greeting Banner */}
      <DashboardHeroBanner
        currentUser={currentUser}
        completedTasks={completedTasks}
        reviewTasks={reviewTasks}
        rejectedTasks={rejectedTasks}
      />

      {/* Daily Motivation Scrolling Ticker */}
      <DashboardMotivationTicker />

      {/* Active Break Live Banner (Conditional) */}
      <ActiveBreakWidget />

      {/* Tiffin Quota Widget */}
      <TiffinTimer />

      {/* Top 5 Metric Cards Grid */}
      <DashboardMetricGrid
        attendance={attendance}
        mangoSummary={mangoSummary}
        todoTasks={todoTasks}
        inProgressTasks={inProgressTasks}
        rejectedTasks={rejectedTasks}
        reviewTasks={reviewTasks}
      />

      {/* Company Master Performance & Top Contributors */}
      <DashboardLeaderboardSection
        timeFilter={timeFilter}
        setTimeFilter={setTimeFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortedStaffList={sortedStaffList}
        reportLoading={reportLoading}
        top1={top1}
        top2={top2}
        top3={top3}
        top5StaffList={top5StaffList}
        myStanding={myStanding}
        aheadPerson={aheadPerson}
        currentUser={currentUser}
        apiBase={API_BASE}
      />

      {/* My Active Tasks & Work Pipeline */}
      <DashboardActiveTasks activeTasks={activeTasks} />
    </div>
  );
};

export default Dashboard;
