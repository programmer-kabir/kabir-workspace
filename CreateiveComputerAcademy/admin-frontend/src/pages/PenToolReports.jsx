import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
  FiPenTool, FiAward, FiTarget, FiClock, FiCheckCircle, FiSearch,
  FiFilter, FiRefreshCw, FiBookOpen, FiUser, FiActivity,
  FiChevronRight, FiX, FiTrendingUp, FiEye, FiLock,
  FiStar, FiBarChart2, FiGrid, FiList, FiRotateCcw, FiArrowUpRight,
  FiCheck, FiAlertCircle, FiPrinter
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import ConfirmModal from '../components/ConfirmModal';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const STAGE_NAMES = {
  0: 'Line',
  1: 'Home',
  2: 'Circle',
  3: 'Heart',
  4: 'Apple with Leaf',
  5: 'Fish',
  6: 'Butterfly',
  7: 'Royal Crown',
  8: 'Coffee Cup',
  9: 'Nautical Anchor',
  10: 'VW Beetle',
  11: 'Plane',
  12: 'Clip',
  13: 'Wrench',
  14: 'Cloud',
  15: 'Profile',
  16: 'Duck',
  17: 'Cap',
  18: 'Letter',
  19: 'Guitar',
  20: 'Flag (Final Stage)'
};

const ACTIVITY_FILTER_OPTIONS = [
  { value: 'all', label: 'All Students' },
  { value: 'active', label: '🔥 Active (Practicing)' },
  { value: 'graduates', label: '🏆 Graduates (All 21 Stages)' },
  { value: 'in_progress', label: '⏳ In Progress (1–20 Stages)' },
  { value: 'not_started', label: '💤 Not Started Yet' }
];

const SORT_OPTIONS = [
  { value: 'progress_desc', label: 'Most Stages Completed' },
  { value: 'efficiency_desc', label: 'Highest Node Precision' },
  { value: 'stars_desc', label: 'Most Stars Earned' },
  { value: 'attempts_desc', label: 'Most Attempts / Practice' },
  { value: 'recent', label: 'Recently Practiced' },
  { value: 'name_asc', label: 'Student Name (A-Z)' }
];

const PenToolReports = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'
  const [activeTab, setActiveTab] = useState('directory'); // 'directory' | 'funnel'

  const [kpi, setKpi] = useState({
    total_enrolled: 0,
    total_practicing: 0,
    total_graduates: 0,
    graduation_rate_percent: 0,
    academy_avg_efficiency: 0,
    total_practice_hours: 0,
    toughest_stage: 'None'
  });

  const [students, setStudents] = useState([]);
  const [stageFunnel, setStageFunnel] = useState([]);

  // Filter States
  const [search, setSearch] = useState('');
  const [selectedActivity, setSelectedActivity] = useState('all');
  const [selectedStageFilter, setSelectedStageFilter] = useState('all');
  const [sortBy, setSortBy] = useState('progress_desc');

  // Single Student Deep Dive Modal
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [studentDetail, setStudentDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [modalTab, setModalTab] = useState('matrix'); // 'matrix' | 'sessions'
  const [actionLoading, setActionLoading] = useState(false);

  // Confirm Modal State
  const [confirmModalState, setConfirmModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    confirmVariant: 'danger',
    loading: false,
    action: null,
    stageId: null
  });

  // Fetch Reports from API
  const fetchReports = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await axios.get(`${API_BASE}api/admin/students/get_pentool_reports.php`);
      if (res.data?.status === 'success') {
        const data = res.data.data;
        setKpi(data.kpi || {});
        setStudents(data.students || []);
        setStageFunnel(data.stage_funnel || []);
      } else {
        toast.error(res.data?.message || 'Failed to load Pen Tool reports');
      }
    } catch (err) {
      console.error('Error fetching Pen Tool reports', err);
      toast.error('Network error loading Pen Tool reports');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Open Deep Dive Modal for single student
  const openStudentModal = async (userId) => {
    setSelectedStudentId(userId);
    setLoadingDetail(true);
    setModalTab('matrix');
    try {
      const res = await axios.get(`${API_BASE}api/admin/students/get_pentool_reports.php?user_id=${userId}`);
      if (res.data?.status === 'success') {
        setStudentDetail(res.data.data);
      } else {
        toast.error('Could not load student vector details');
      }
    } catch (err) {
      console.error('Failed to load student detail', err);
      toast.error('Network error fetching student data');
    } finally {
      setLoadingDetail(false);
    }
  };

  const closeStudentModal = () => {
    setSelectedStudentId(null);
    setStudentDetail(null);
  };

  // Execute Admin Action
  const executeAdminAction = async (action, stageId = null) => {
    if (!selectedStudentId) return;
    setActionLoading(true);
    setConfirmModalState(prev => ({ ...prev, loading: true }));
    try {
      const res = await axios.post(`${API_BASE}api/admin/students/manage_pentool_progress.php`, {
        student_id: selectedStudentId,
        action,
        stage_id: stageId
      });

      if (res.data?.status === 'success') {
        toast.success(res.data.message);
        await openStudentModal(selectedStudentId);
        fetchReports(true);
      } else {
        toast.error(res.data?.message || 'Action failed');
      }
    } catch (err) {
      console.error('Error executing admin action', err);
      toast.error('Network error executing admin action');
    } finally {
      setActionLoading(false);
      setConfirmModalState(prev => ({ ...prev, isOpen: false, loading: false }));
    }
  };

  const handleAdminAction = (action, stageId = null) => {
    if (!selectedStudentId) return;

    if (action === 'reset_progress') {
      setConfirmModalState({
        isOpen: true,
        title: 'Reset Vector Progress?',
        message: `Are you sure you want to reset ${studentDetail?.student?.name || 'this student'}'s Pen Tool progress back to Stage 1? All passed stage records will be cleared.`,
        confirmText: 'Reset to Stage 1',
        cancelText: 'Cancel',
        confirmVariant: 'danger',
        loading: false,
        action: 'reset_progress',
        stageId: null
      });
      return;
    }

    if (action === 'complete_all') {
      setConfirmModalState({
        isOpen: true,
        title: 'Graduate Student (Pass All 21 Stages)?',
        message: `Are you sure you want to mark all 21 vector stages as 100% Completed with 3 Stars for ${studentDetail?.student?.name || 'this student'}? This will grant full Vector Master graduation.`,
        confirmText: 'Yes, Graduate Student',
        cancelText: 'Cancel',
        confirmVariant: 'warning',
        loading: false,
        action: 'complete_all',
        stageId: null
      });
      return;
    }

    executeAdminAction(action, stageId);
  };

  // Filter & Sort Students
  const filteredStudents = useMemo(() => {
    return students.filter(stu => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = stu.name?.toLowerCase().includes(q);
        const matchesCode = stu.student_code?.toLowerCase().includes(q);
        const matchesPhone = stu.phone?.includes(q);
        const matchesCourse = stu.course_name?.toLowerCase().includes(q);
        if (!matchesName && !matchesCode && !matchesPhone && !matchesCourse) return false;
      }

      if (selectedActivity !== 'all') {
        if (selectedActivity === 'active' && !stu.is_practicing) return false;
        if (selectedActivity === 'graduates' && stu.completed_stages < 21) return false;
        if (selectedActivity === 'in_progress' && (stu.completed_stages >= 21 || stu.completed_stages === 0)) return false;
        if (selectedActivity === 'not_started' && stu.is_practicing) return false;
      }

      if (selectedStageFilter !== 'all') {
        const sId = parseInt(selectedStageFilter, 10);
        if (stu.current_stage_id !== sId) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'progress_desc') return (b.completed_stages || 0) - (a.completed_stages || 0);
      if (sortBy === 'efficiency_desc') return (b.avg_efficiency || 0) - (a.avg_efficiency || 0);
      if (sortBy === 'stars_desc') return (b.total_stars || 0) - (a.total_stars || 0);
      if (sortBy === 'attempts_desc') return (b.total_attempts || 0) - (a.total_attempts || 0);
      if (sortBy === 'recent') {
        const timeA = a.last_practiced_at ? new Date(a.last_practiced_at).getTime() : 0;
        const timeB = b.last_practiced_at ? new Date(b.last_practiced_at).getTime() : 0;
        return timeB - timeA;
      }
      if (sortBy === 'name_asc') return (a.name || '').localeCompare(b.name || '');
      return 0;
    });
  }, [students, search, selectedActivity, selectedStageFilter, sortBy]);

  // Format Bangladesh Time
  const formatBdTime = (dateStr) => {
    if (!dateStr) return 'Not Practiced Yet';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }) + ' BST';
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* ── HEADER BANNER ───────────────────────────────────────────── */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-cyan-950 text-white p-6 sm:p-8 shadow-xl border border-cyan-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-cyan-300 text-xs font-bold border border-white/10">
              <FiPenTool className="text-cyan-400" />
              <span>Vector Pen Tool Master Lab</span>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500 text-slate-950 text-[10px] font-black">
                21 STAGES TELEMETRY
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>Pen Tool Telemetry & Master Reports</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-2xl">
              Microscopic tracking of student vector curves, ideal nodes vs. actual nodes used, attempts, duration, and completion timestamps in Bangladesh Time (BST).
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <button
              onClick={() => fetchReports(true)}
              disabled={refreshing}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md font-bold text-xs shadow-lg cursor-pointer transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
            >
              <FiRefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh Data'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── MACRO KPI STATS ROW ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider">Enrolled</span>
            <FiUser size={16} className="text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {kpi.total_enrolled}
          </div>
          <span className="text-[11px] text-slate-500 font-medium">Total registered</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider">Practicing</span>
            <FiActivity size={16} className="text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {kpi.total_practicing}
          </div>
          <span className="text-[11px] text-slate-500 font-medium">Active in lab</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider">Graduates</span>
            <FiAward size={16} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {kpi.total_graduates}
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
            {kpi.graduation_rate_percent}% full cleared
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider">Avg Precision</span>
            <FiTarget size={16} className="text-cyan-500" />
          </div>
          <div className="text-2xl font-black text-cyan-600 dark:text-cyan-400">
            {kpi.academy_avg_efficiency}%
          </div>
          <span className="text-[11px] text-slate-500 font-medium">Node efficiency</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider">Practice Time</span>
            <FiClock size={16} className="text-purple-500" />
          </div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
            {kpi.total_practice_hours}h
          </div>
          <span className="text-[11px] text-slate-500 font-medium">Total student hours</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider">Toughest Stage</span>
            <FiTrendingUp size={16} className="text-rose-500" />
          </div>
          <div className="text-sm font-black text-rose-600 dark:text-rose-400 truncate" title={kpi.toughest_stage}>
            {kpi.toughest_stage}
          </div>
          <span className="text-[11px] text-slate-500 font-medium">Most retries required</span>
        </div>
      </div>

      {/* ── TABS NAVIGATION ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('directory')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'directory'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FiUser size={14} />
            <span>Student Roster & Dossiers ({filteredStudents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('funnel')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'funnel'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FiBarChart2 size={14} />
            <span>21-Stage Funnel & Bottlenecks</span>
          </button>
        </div>

        {activeTab === 'directory' && (
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-400'}`}
              title="Table View"
            >
              <FiList size={14} />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'cards' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-400'}`}
              title="Cards Grid"
            >
              <FiGrid size={14} />
            </button>
          </div>
        )}
      </div>

      {/* ── TAB 1: STUDENT DIRECTORY ─────────────────────────────────── */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
              {/* Live Search */}
              <div className="relative flex-1 min-w-[200px]">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                <input
                  type="text"
                  placeholder="Search student by name, code, phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Activity Filter */}
              <select
                value={selectedActivity}
                onChange={(e) => setSelectedActivity(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
              >
                {ACTIVITY_FILTER_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>

              {/* Stage Filter */}
              <select
                value={selectedStageFilter}
                onChange={(e) => setSelectedStageFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
              >
                <option value="all">All Stages (0–20)</option>
                {Object.entries(STAGE_NAMES).map(([id, name]) => (
                  <option key={id} value={id}>Stage {parseInt(id, 10) + 1}: {name}</option>
                ))}
              </select>

              {/* Sorting */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="text-xs text-slate-500 font-semibold">
              Showing <strong>{filteredStudents.length}</strong> students
            </div>
          </div>

          {/* Directory Table View */}
          {viewMode === 'table' ? (
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Student</th>
                      <th className="py-3.5 px-4">Stages Cleared</th>
                      <th className="py-3.5 px-4">Current Stage</th>
                      <th className="py-3.5 px-4">Precision (Efficiency)</th>
                      <th className="py-3.5 px-4">Attempts / Time</th>
                      <th className="py-3.5 px-4">Last Practiced (BD Time)</th>
                      <th className="py-3.5 px-4 text-right">Dossier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                          Loading Pen Tool telemetry reports...
                        </td>
                      </tr>
                    ) : filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                          No students match the current filters.
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((stu) => {
                        const isGrad = stu.completed_stages >= 21;
                        return (
                          <tr key={stu.user_id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                            {/* Student Info */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300">
                                  {stu.profile_picture ? (
                                    <img src={stu.profile_picture} alt={stu.name} className="w-full h-full object-cover" />
                                  ) : (
                                    stu.name?.charAt(0) || 'S'
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                                    <span>{stu.name}</span>
                                    {isGrad && <span title="Full Vector Graduate">🏆</span>}
                                  </div>
                                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                                    {stu.student_code || 'ID: ' + stu.user_id} • {stu.course_name}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Stages Cleared Progress */}
                            <td className="py-3 px-4">
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-[11px] font-bold">
                                  <span className={isGrad ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}>
                                    {stu.completed_stages} / 21 Stages
                                  </span>
                                  <span className="text-slate-400">{stu.completion_percent}%</span>
                                </div>
                                <div className="w-28 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      isGrad
                                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                                        : 'bg-gradient-to-r from-indigo-500 to-cyan-500'
                                    }`}
                                    style={{ width: `${Math.min(100, stu.completion_percent)}%` }}
                                  />
                                </div>
                              </div>
                            </td>

                            {/* Current Stage */}
                            <td className="py-3 px-4">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs">
                                <span>{stu.current_stage_name}</span>
                              </span>
                            </td>

                            {/* Precision */}
                            <td className="py-3 px-4">
                              <div className="font-bold text-xs flex items-center gap-1.5">
                                <span className={
                                  stu.avg_efficiency >= 95 ? 'text-emerald-600 dark:text-emerald-400' :
                                  stu.avg_efficiency >= 80 ? 'text-cyan-600 dark:text-cyan-400' :
                                  stu.avg_efficiency > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'
                                }>
                                  {stu.avg_efficiency > 0 ? `${stu.avg_efficiency}% Optimal` : 'No Data'}
                                </span>
                                {stu.total_stars > 0 && (
                                  <span className="text-amber-400 text-[11px] flex items-center">
                                    ★ {stu.total_stars}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Attempts / Time */}
                            <td className="py-3 px-4">
                              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                {stu.total_attempts} tries
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {Math.round(stu.total_time_seconds / 60)} mins total
                              </div>
                            </td>

                            {/* Last Practiced BD Time */}
                            <td className="py-3 px-4 text-slate-600 dark:text-slate-400 text-[11px] font-medium">
                              {formatBdTime(stu.last_practiced_at)}
                            </td>

                            {/* Action Button */}
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => openStudentModal(stu.user_id)}
                                className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 text-indigo-600 dark:text-indigo-400 font-bold text-xs border border-indigo-200/80 dark:border-indigo-800/60 transition-all cursor-pointer inline-flex items-center gap-1.5 active:scale-95 shadow-xs"
                              >
                                <FiEye size={13} />
                                <span>Inspect Dossier</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Cards Grid View */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStudents.map((stu) => {
                const isGrad = stu.completed_stages >= 21;
                return (
                  <div
                    key={stu.user_id}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 flex items-center justify-center font-bold text-base text-slate-600 dark:text-slate-300">
                          {stu.profile_picture ? (
                            <img src={stu.profile_picture} alt={stu.name} className="w-full h-full object-cover" />
                          ) : (
                            stu.name?.charAt(0) || 'S'
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                            <span>{stu.name}</span>
                            {isGrad && <span>🏆</span>}
                          </h4>
                          <span className="text-xs text-slate-400 font-mono">
                            {stu.student_code || 'ID: ' + stu.user_id}
                          </span>
                        </div>
                      </div>

                      <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                        isGrad
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400'
                          : stu.is_practicing
                          ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/80 dark:text-cyan-400'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {isGrad ? 'Graduate' : stu.is_practicing ? 'Practicing' : 'Not Started'}
                      </span>
                    </div>

                    {/* Progress */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-700 dark:text-slate-300">Stages Cleared</span>
                        <span className="text-indigo-600 dark:text-indigo-400">{stu.completed_stages} / 21 ({stu.completion_percent}%)</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full"
                          style={{ width: `${Math.min(100, stu.completion_percent)}%` }}
                        />
                      </div>
                    </div>

                    {/* Stats Pill Row */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Precision</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {stu.avg_efficiency > 0 ? `${stu.avg_efficiency}%` : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Attempts</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {stu.total_attempts} tries
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => openStudentModal(stu.user_id)}
                      className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <FiEye size={13} />
                      <span>Inspect 21 Stages Dossier</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: 21-STAGE FUNNEL ANALYSIS ──────────────────────────── */}
      {activeTab === 'funnel' && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
          <div className="space-y-1">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>21-Stage Completion Funnel & Bottleneck Analytics</span>
            </h3>
            <p className="text-xs text-slate-500">
              Identifies which vector stages students master quickly and where they encounter difficulties (high retries or node over-budget).
            </p>
          </div>

          <div className="space-y-3">
            {stageFunnel.map((stage) => {
              const maxCompletions = Math.max(1, ...stageFunnel.map(s => s.completed_students));
              const pct = Math.round((stage.completed_students / maxCompletions) * 100);

              return (
                <div key={stage.stage_id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-[11px] font-black">
                        {stage.stage_id + 1}
                      </span>
                      <span className="text-slate-900 dark:text-white font-bold">{stage.stage_name}</span>
                      <span className="text-slate-400 font-mono text-[11px]">(Ideal: {stage.min_nodes} nodes)</span>
                    </div>

                    <div className="flex items-center gap-4 text-slate-600 dark:text-slate-300 text-[11px]">
                      <span><strong>{stage.completed_students}</strong> completed</span>
                      <span>Avg <strong>{stage.avg_attempts}</strong> tries</span>
                      <span>Avg <strong>{stage.avg_efficiency}%</strong> precision</span>
                    </div>
                  </div>

                  <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-indigo-600 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── SINGLE STUDENT DEEP-DIVE MODAL (MICROSCOPIC DOSSIER) ─────── */}
      {selectedStudentId && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-5xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
            {/* Modal Top Header */}
            <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-xl font-bold text-indigo-300">
                  {studentDetail?.student?.profile_picture ? (
                    <img src={studentDetail.student.profile_picture} alt="Profile" className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    studentDetail?.student?.name?.charAt(0) || 'S'
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <span>{studentDetail?.student?.name || 'Student Dossier'}</span>
                    {studentDetail?.summary?.is_graduated && (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-xs border border-emerald-500/30">
                        🏆 Full Vector Graduate
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-300 font-mono">
                    Code: {studentDetail?.student?.student_code || 'N/A'} • Course: {studentDetail?.student?.course_name || 'General'} • Phone: {studentDetail?.student?.phone || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Print Report"
                >
                  <FiPrinter size={16} />
                </button>
                <button
                  onClick={closeStudentModal}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Close Modal"
                >
                  <FiX size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
              {loadingDetail ? (
                <div className="py-16 text-center text-slate-400 font-medium">
                  Loading microscopic stage breakdown...
                </div>
              ) : studentDetail ? (
                <>
                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Cleared Stages</span>
                      <div className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                        {studentDetail.summary.total_completed} / 21
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {studentDetail.summary.completion_percent}% complete
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Average Precision</span>
                      <div className="text-xl font-black text-cyan-600 dark:text-cyan-400">
                        {studentDetail.summary.avg_efficiency_percent}%
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium">Optimal node ratio</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Attempts</span>
                      <div className="text-xl font-black text-amber-600 dark:text-amber-400">
                        {studentDetail.summary.total_attempts}
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium">Tries across all stages</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Practice Time</span>
                      <div className="text-xl font-black text-purple-600 dark:text-purple-400">
                        {Math.round(studentDetail.summary.total_practice_seconds / 60)}m {studentDetail.summary.total_practice_seconds % 60}s
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium">Time on vector canvas</span>
                    </div>
                  </div>

                  {/* Modal Header Bar */}
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                        All 21 Vector Stages Performance Matrix
                      </span>
                    </div>

                    {/* Admin Override Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAdminAction('complete_all')}
                        disabled={actionLoading}
                        className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold hover:bg-emerald-100 cursor-pointer"
                      >
                        Graduate Student (Pass All)
                      </button>
                      <button
                        onClick={() => handleAdminAction('reset_progress')}
                        disabled={actionLoading}
                        className="px-2.5 py-1 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800 text-[11px] font-bold hover:bg-rose-100 cursor-pointer"
                      >
                        Reset to Stage 1
                      </button>
                    </div>
                  </div>

                  {/* 21 STAGES MATRIX TABLE */}
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                        <tr>
                          <th className="py-2.5 px-3">#</th>
                          <th className="py-2.5 px-3">Stage Name</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3">Ideal Nodes</th>
                          <th className="py-2.5 px-3">Best Used</th>
                          <th className="py-2.5 px-3">Variance</th>
                          <th className="py-2.5 px-3">Precision %</th>
                          <th className="py-2.5 px-3">Stars</th>
                          <th className="py-2.5 px-3">Attempts</th>
                          <th className="py-2.5 px-3">Time</th>
                          <th className="py-2.5 px-3">Last Practiced (BD Time)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                        {studentDetail.stages.map((st) => {
                          const isDone = st.is_completed === 1;
                          const isUnlocked = st.is_unlocked === 1;

                          return (
                            <tr
                              key={st.stage_id}
                              className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                                isDone ? 'bg-emerald-50/20 dark:bg-emerald-950/10' : ''
                              }`}
                            >
                              <td className="py-2 px-3 font-mono text-slate-400">{st.stage_number}</td>
                              <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">
                                {st.stage_name}
                              </td>
                              <td className="py-2 px-3">
                                {isDone ? (
                                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                                    <FiCheckCircle size={12} /> Completed
                                  </span>
                                ) : isUnlocked ? (
                                  <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold text-[11px]">
                                    <FiClock size={12} /> In Progress
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-slate-400 font-medium text-[11px]">
                                    <FiLock size={12} /> Locked
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-3 font-mono font-bold text-slate-600 dark:text-slate-300">
                                {st.min_nodes}
                              </td>
                              <td className="py-2 px-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                {isDone ? st.best_nodes_used : '-'}
                              </td>
                              <td className="py-2 px-3">
                                {isDone ? (
                                  st.node_variance === 0 ? (
                                    <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                                      0 (Optimal)
                                    </span>
                                  ) : (
                                    <span className="text-rose-500 font-bold text-[11px]">
                                      +{st.node_variance} extra
                                    </span>
                                  )
                                ) : '-'}
                              </td>
                              <td className="py-2 px-3 font-bold">
                                {isDone ? (
                                  <span className={
                                    st.efficiency_percent >= 95 ? 'text-emerald-600 dark:text-emerald-400' :
                                    st.efficiency_percent >= 80 ? 'text-cyan-600 dark:text-cyan-400' : 'text-amber-500'
                                  }>
                                    {st.efficiency_percent}%
                                  </span>
                                ) : '-'}
                              </td>
                              <td className="py-2 px-3 text-amber-400">
                                {isDone && st.stars > 0 ? '★'.repeat(st.stars) : '-'}
                              </td>
                              <td className="py-2 px-3 font-mono text-slate-600 dark:text-slate-300">
                                {st.total_attempts > 0 ? `${st.total_attempts} tries` : '-'}
                              </td>
                              <td className="py-2 px-3 font-mono text-slate-500">
                                {st.best_time_seconds > 0 ? `${st.best_time_seconds}s` : '-'}
                              </td>
                              <td className="py-2 px-3 text-[11px] text-slate-500">
                                {formatBdTime(st.last_practiced_at)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModalState.isOpen && (
        <ConfirmModal
          isOpen={confirmModalState.isOpen}
          title={confirmModalState.title}
          message={confirmModalState.message}
          confirmText={confirmModalState.confirmText}
          cancelText={confirmModalState.cancelText}
          confirmVariant={confirmModalState.confirmVariant}
          loading={confirmModalState.loading}
          onConfirm={() => executeAdminAction(confirmModalState.action, confirmModalState.stageId)}
          onCancel={() => setConfirmModalState(prev => ({ ...prev, isOpen: false }))}
        />
      )}
    </div>
  );
};

export default PenToolReports;
