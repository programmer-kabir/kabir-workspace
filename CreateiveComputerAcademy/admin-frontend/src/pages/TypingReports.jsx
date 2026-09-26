import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { toast } from 'sonner';
import {
  FiZap, FiAward, FiTarget, FiClock, FiCheckCircle, FiSearch,
  FiFilter, FiRefreshCw, FiBookOpen, FiUser, FiActivity,
  FiChevronRight, FiX, FiTrendingUp, FiEye, FiLock,
  FiStar, FiBarChart2, FiGrid, FiList, FiRotateCcw, FiArrowUpRight
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import CustomSelect from '../components/CustomSelect';
import ConfirmModal from '../components/ConfirmModal';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const LESSON_NAMES = {
  1: 'Home Row (ASDF JKL;)',
  2: 'Top Row: Keys E & I',
  3: 'Top Row: Keys R & U',
  4: 'Top Row: Keys T & Y',
  5: 'Home Row: Keys G & H',
  6: 'Bottom Row: C & Comma',
  7: 'Bottom Row: V & M',
  8: 'Bottom Row: B & N',
  9: 'Top Row: Keys W & O',
  10: 'Top Row: Keys Q & P',
  11: 'Bottom Row: Z, X, . & /',
  12: 'Shift & Capital Letters',
  13: 'Numbers 1 to 0',
  14: 'Symbols & Punctuation'
};

const ACTIVITY_FILTER_OPTIONS = [
  { value: 'all', label: 'All Typists' },
  { value: 'active', label: '🔥 Active (Practicing)' },
  { value: 'graduates', label: '🏆 Completed All 14' },
  { value: 'in_progress', label: '⏳ In Progress (1–13)' },
  { value: 'not_started', label: '💤 Not Started Yet' }
];

const SPEED_TIER_OPTIONS = [
  { value: 'all', label: 'All Speed Tiers' },
  { value: 'master', label: '⚡ Master (60+ WPM)' },
  { value: 'advanced', label: '🚀 Advanced (40-59 WPM)' },
  { value: 'intermediate', label: '🎯 Intermediate (20-39 WPM)' },
  { value: 'beginner', label: '🌱 Beginner (<20 WPM)' },
  { value: 'not_started', label: '⏳ Not Started' }
];

const LESSON_FILTER_OPTIONS = [
  { value: 'all', label: 'All 14 Lessons' },
  ...Array.from({ length: 14 }, (_, i) => ({
    value: String(i + 1),
    label: `Lesson ${i + 1}: ${LESSON_NAMES[i + 1]}`
  }))
];

const SORT_OPTIONS = [
  { value: 'wpm_desc', label: 'Highest Speed (WPM)' },
  { value: 'progress_desc', label: 'Most Lessons Passed' },
  { value: 'stars_desc', label: 'Most Stars Earned' },
  { value: 'recent', label: 'Recently Practiced' },
  { value: 'name_asc', label: 'Student Name (A-Z)' }
];

const TypingReports = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'
  const [kpi, setKpi] = useState({
    total_enrolled: 0,
    total_practicing: 0,
    total_graduates: 0,
    graduation_rate_percent: 0,
    academy_avg_wpm: 0,
    academy_peak_wpm: 0,
    peak_wpm_holder: 'None',
    academy_avg_accuracy: 0,
    total_practice_hours: 0
  });

  const [students, setStudents] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [lessonFunnel, setLessonFunnel] = useState([]);

  // Active Tab
  const [activeTab, setActiveTab] = useState('directory'); // 'directory' | 'leaderboard' | 'funnel'

  // Filter States
  const [search, setSearch] = useState('');
  const [selectedActivity, setSelectedActivity] = useState('all');
  const [selectedSpeedTier, setSelectedSpeedTier] = useState('all');
  const [selectedLessonFilter, setSelectedLessonFilter] = useState('all');
  const [sortBy, setSortBy] = useState('wpm_desc');

  // Single Student Deep Dive Modal
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [studentDetail, setStudentDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Custom Confirm Dialog State
  const [confirmModalState, setConfirmModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    confirmVariant: 'danger',
    loading: false,
    action: null,
    lessonId: null
  });

  // Execute Admin Action after confirmation
  const executeAdminProgressAction = async (action, lessonId = null) => {
    if (!selectedStudentId) return;
    setActionLoading(true);
    setConfirmModalState(prev => ({ ...prev, loading: true }));
    try {
      const res = await axios.post(`${API_BASE}api/admin/students/manage_typing_progress.php`, {
        student_id: selectedStudentId,
        action,
        lesson_id: lessonId,
        wpm: 55,
        accuracy: 99,
        stars: 3
      });

      if (res.data?.status === 'success') {
        toast.success(res.data.message);
        // Refresh details & list immediately
        await openStudentModal(selectedStudentId);
        fetchReports(true);
      } else {
        toast.error(res.data?.message || 'Action failed');
      }
    } catch (err) {
      console.error('Error executing admin typing action', err);
      toast.error('Network error executing admin action');
    } finally {
      setActionLoading(false);
      setConfirmModalState(prev => ({ ...prev, isOpen: false, loading: false }));
    }
  };

  // Trigger Admin Action (Open modal if destructive or high impact)
  const handleAdminProgressAction = (action, lessonId = null) => {
    if (!selectedStudentId) return;

    if (action === 'reset_progress') {
      setConfirmModalState({
        isOpen: true,
        title: 'Reset Typing Progress?',
        message: `Are you sure you want to reset ${studentDetail?.student?.name || 'this student'}'s typing curriculum progress back to Lesson 1? All passed lesson records will be cleared.`,
        confirmText: 'Reset to Lesson 1',
        cancelText: 'Keep Current Progress',
        confirmVariant: 'danger',
        loading: false,
        action: 'reset_progress',
        lessonId: null
      });
      return;
    }

    if (action === 'complete_all') {
      setConfirmModalState({
        isOpen: true,
        title: 'Graduate Student (Pass All 14)?',
        message: `Are you sure you want to mark all 14 curriculum lessons as 100% Completed with 3 Stars for ${studentDetail?.student?.name || 'this student'}? This will grant full Touch Typing Master graduation.`,
        confirmText: 'Yes, Graduate Student',
        cancelText: 'Cancel',
        confirmVariant: 'warning',
        loading: false,
        action: 'complete_all',
        lessonId: null
      });
      return;
    }

    // Direct actions (unlock single lesson, pass single lesson, unlock all)
    executeAdminProgressAction(action, lessonId);
  };

  // Fetch Report Data from Server
  const fetchReports = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await axios.get(`${API_BASE}api/admin/students/get_typing_reports.php`);
      if (res.data?.status === 'success') {
        const data = res.data.data;
        setKpi(data.kpi || {});
        setStudents(data.students || []);
        setLeaderboard(data.leaderboard || []);
        setLessonFunnel(data.lesson_funnel || []);
      } else {
        toast.error(res.data?.message || 'Failed to load typing reports');
      }
    } catch (err) {
      console.error('Error fetching typing reports', err);
      toast.error('Network error loading typing reports');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Check URL query param for ?user_id=X on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const uId = urlParams.get('user_id');
    if (uId) {
      openStudentModal(parseInt(uId, 10));
    }
  }, []);

  // Fetch Deep-Dive Data for a single student
  const openStudentModal = async (userId) => {
    setSelectedStudentId(userId);
    setLoadingDetail(true);
    try {
      const res = await axios.get(`${API_BASE}api/admin/students/get_typing_reports.php?user_id=${userId}`);
      if (res.data?.status === 'success') {
        setStudentDetail(res.data.data);
      } else {
        toast.error('Could not load student typing details');
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

  const handleResetFilters = () => {
    setSearch('');
    setSelectedActivity('all');
    setSelectedSpeedTier('all');
    setSelectedLessonFilter('all');
    setSortBy('wpm_desc');
  };

  // Filtered & Sorted Student List
  const filteredStudents = useMemo(() => {
    return students.filter(stu => {
      // 1. Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = stu.name?.toLowerCase().includes(q);
        const matchesCode = stu.student_code?.toLowerCase().includes(q);
        const matchesEmail = stu.email?.toLowerCase().includes(q);
        const matchesPhone = stu.phone?.includes(q);
        if (!matchesName && !matchesCode && !matchesEmail && !matchesPhone) return false;
      }

      // 2. Activity status filter
      if (selectedActivity !== 'all') {
        if (selectedActivity === 'active' && !stu.is_practicing) return false;
        if (selectedActivity === 'graduates' && stu.completed_lessons < 14) return false;
        if (selectedActivity === 'in_progress' && (stu.completed_lessons >= 14 || stu.completed_lessons === 0)) return false;
        if (selectedActivity === 'not_started' && stu.is_practicing) return false;
      }

      // 3. Speed tier filter
      if (selectedSpeedTier !== 'all') {
        if (selectedSpeedTier === 'master' && stu.best_wpm < 60) return false;
        if (selectedSpeedTier === 'advanced' && (stu.best_wpm < 40 || stu.best_wpm >= 60)) return false;
        if (selectedSpeedTier === 'intermediate' && (stu.best_wpm < 20 || stu.best_wpm >= 40)) return false;
        if (selectedSpeedTier === 'beginner' && (stu.best_wpm >= 20 || !stu.is_practicing)) return false;
        if (selectedSpeedTier === 'not_started' && stu.is_practicing) return false;
      }

      // 4. Lesson Progress filter
      if (selectedLessonFilter !== 'all') {
        const lNum = parseInt(selectedLessonFilter, 10);
        if (stu.current_lesson !== lNum) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'wpm_desc') return (b.best_wpm || 0) - (a.best_wpm || 0);
      if (sortBy === 'progress_desc') return (b.completed_lessons || 0) - (a.completed_lessons || 0);
      if (sortBy === 'stars_desc') return (b.total_stars || 0) - (a.total_stars || 0);
      if (sortBy === 'recent') {
        const timeA = a.last_practiced_at ? new Date(a.last_practiced_at).getTime() : 0;
        const timeB = b.last_practiced_at ? new Date(b.last_practiced_at).getTime() : 0;
        return timeB - timeA;
      }
      if (sortBy === 'name_asc') return (a.name || '').localeCompare(b.name || '');
      return 0;
    });
  }, [students, search, selectedActivity, selectedSpeedTier, selectedLessonFilter, sortBy]);

  // Helper for Speed Tier Badge Styling
  const getSpeedTierBadge = (tier, wpm) => {
    if (wpm >= 60) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-black text-[11px] border border-amber-500/30">
          ⚡ Master ({wpm} WPM)
        </span>
      );
    }
    if (wpm >= 40) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] border border-emerald-500/30">
          🚀 Advanced ({wpm} WPM)
        </span>
      );
    }
    if (wpm >= 20) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold text-[11px] border border-indigo-500/30">
          🎯 Intermediate ({wpm} WPM)
        </span>
      );
    }
    if (wpm > 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-500/10 text-slate-600 dark:text-slate-400 font-semibold text-[11px] border border-slate-500/20">
          🌱 Beginner ({wpm} WPM)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 font-medium text-[11px]">
        ⏳ Not Started
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300  mx-auto px-2 sm:px-4">
      {/* ── LUXURY HEADER BANNER ───────────────────────────────────── */}
      <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-slate-900 via-purple-950 to-indigo-950 text-white shadow-xl relative overflow-hidden border border-purple-500/20">
        {/* Subtle Decorative Glows */}
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-pink-200 text-xs font-bold border border-white/10 shadow-xs">
              <HiSparkles className="text-amber-300" size={14} />
              <span>Touch Typing Master Analytics</span>
              <span className="px-2 py-0.5 rounded-full bg-pink-500 text-white text-[10px] font-black tracking-wider">
                14 LESSONS
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>Touch Typing Master Reports</span>
              <span className="text-xs px-2.5 py-1 rounded-xl bg-purple-500/30 text-purple-200 font-bold border border-purple-400/30">
                Live Database
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
              Real-time monitoring of students' 10-finger touch typing speed (WPM), accuracy, star ratings, problem keys, and 14-lesson curriculum progression.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => fetchReports(true)}
              disabled={refreshing}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <FiRefreshCw size={14} className={refreshing ? 'animate-spin text-purple-300' : 'text-purple-300'} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh Logs'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI ANALYTICS ROW ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Card 1: Active Typists */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Typists</span>
            <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <FiUser size={15} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {kpi.total_practicing} <span className="text-xs font-bold text-slate-400">/ {kpi.total_enrolled}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-purple-600 rounded-full transition-all duration-500"
                  style={{ width: `${kpi.total_enrolled > 0 ? (kpi.total_practicing / kpi.total_enrolled) * 100 : 0}%` }}
                />
              </div>
              <span className="text-[10px] text-purple-600 dark:text-purple-400 font-black shrink-0">
                {kpi.total_enrolled > 0 ? Math.round((kpi.total_practicing / kpi.total_enrolled) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Academy Peak Record Speed */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider">Peak Record</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <FiZap size={15} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono flex items-center gap-1">
              <span>⚡ {kpi.academy_peak_wpm}</span>
              <span className="text-xs font-normal text-slate-400">WPM</span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate mt-1" title={kpi.peak_wpm_holder}>
              by <span className="font-bold text-slate-700 dark:text-slate-300">{kpi.peak_wpm_holder}</span>
            </p>
          </div>
        </div>

        {/* Card 3: Average Speed & Accuracy */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-wider">Avg Speed</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <FiActivity size={15} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {kpi.academy_avg_wpm} <span className="text-xs font-normal text-slate-400">WPM</span>
            </div>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">
              🎯 {kpi.academy_avg_accuracy}% Accuracy
            </p>
          </div>
        </div>

        {/* Card 4: Curriculum Graduates */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-500 dark:text-amber-400 uppercase tracking-wider">Graduates</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <FiAward size={15} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
              {kpi.total_graduates} <span className="text-xs font-bold text-slate-400">Passed</span>
            </div>
            <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold mt-1">
              🏆 {kpi.graduation_rate_percent}% Completed L14
            </p>
          </div>
        </div>

        {/* Card 5: Total Practice Hours */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-pink-500 dark:text-pink-400 uppercase tracking-wider">Practice Time</span>
            <div className="w-8 h-8 rounded-xl bg-pink-100 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400 flex items-center justify-center">
              <FiClock size={15} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-pink-600 dark:text-pink-400 font-mono">
              {kpi.total_practice_hours} <span className="text-xs font-normal text-slate-400">Hours</span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-1">
              Total Student Drills
            </p>
          </div>
        </div>
      </div>

      {/* ── NAVIGATION PILL TABS ──────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
          <button
            onClick={() => setActiveTab('directory')}
            className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'directory'
                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FiBookOpen size={14} />
            <span>Student Directory & Progress ({filteredStudents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'leaderboard'
                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FiAward size={14} />
            <span>Hall of Fame & Leaderboard ({leaderboard.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('funnel')}
            className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'funnel'
                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FiBarChart2 size={14} />
            <span>14-Lesson Funnel Flow</span>
          </button>
        </div>

        {/* Table vs Card View Switcher (Only on Directory tab) */}
        {activeTab === 'directory' && (
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
            <button
              onClick={() => setViewMode('table')}
              title="Table View (Compact & Executive)"
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FiList size={16} />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              title="Card Grid View"
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FiGrid size={16} />
            </button>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* TAB 1: ALL STUDENTS DIRECTORY & PROGRESS                      */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          {/* Controls & Filter Bar */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Search Bar */}
              <div className="relative">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Search by student name, code, phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                />
              </div>

              {/* Activity Status Filter */}
              <div>
                <CustomSelect
                  options={ACTIVITY_FILTER_OPTIONS}
                  value={selectedActivity}
                  onChange={setSelectedActivity}
                  placeholder="Activity Status"
                />
              </div>

              {/* Speed Tier Filter */}
              <div>
                <CustomSelect
                  options={SPEED_TIER_OPTIONS}
                  value={selectedSpeedTier}
                  onChange={setSelectedSpeedTier}
                  placeholder="Speed Tier"
                />
              </div>

              {/* Lesson Progress Filter */}
              <div>
                <CustomSelect
                  options={LESSON_FILTER_OPTIONS}
                  value={selectedLessonFilter}
                  onChange={setSelectedLessonFilter}
                  placeholder="Filter by Lesson"
                />
              </div>
            </div>

            {/* Sort & Quick Results Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-3">
                <div className="text-slate-500 dark:text-slate-400 font-medium">
                  Showing <span className="font-bold text-slate-900 dark:text-slate-100">{filteredStudents.length}</span> student typists
                </div>
                {(search || selectedActivity !== 'all' || selectedSpeedTier !== 'all' || selectedLessonFilter !== 'all') && (
                  <button
                    onClick={handleResetFilters}
                    className="text-xs text-purple-600 dark:text-purple-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <FiRotateCcw size={11} />
                    <span>Reset Filters</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-bold text-[11px]">Sort By:</span>
                <div className="w-52">
                  <CustomSelect
                    options={SORT_OPTIONS}
                    value={sortBy}
                    onChange={setSortBy}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Students List Display (Table or Cards) */}
          {loading ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
              <div className="animate-spin w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full mx-auto" />
              <p className="text-xs font-bold text-slate-400">Loading student typing analytics...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
              <span className="text-4xl">🔍</span>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No student typists found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No student matched your search and filter criteria. Try resetting the filters.
              </p>
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 font-bold text-xs hover:bg-purple-100 cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : viewMode === 'table' ? (
            /* ────────────────────────────────────────────────────────── */
            /* EXECUTIVE MODERN DATA TABLE                                */
            /* ────────────────────────────────────────────────────────── */
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200/80 dark:border-slate-700/60">
                    <tr>
                      <th className="py-3.5 px-5">Student Typist</th>
                      <th className="py-3.5 px-4">Proficiency Tier</th>
                      <th className="py-3.5 px-4 min-w-[220px]">14-Lesson Progress</th>
                      <th className="py-3.5 px-4 text-center">Peak Speed</th>
                      <th className="py-3.5 px-4 text-center">Accuracy</th>
                      <th className="py-3.5 px-4 text-center">Last Active</th>
                      <th className="py-3.5 px-5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {filteredStudents.map((stu) => {
                      const isGraduate = stu.completed_lessons >= 14;

                      return (
                        <tr
                          key={stu.user_id}
                          className="hover:bg-purple-50/30 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          {/* Student Info */}
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-3">
                              <div className="relative shrink-0">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-xs overflow-hidden">
                                  {stu.profile_picture ? (
                                    <img
                                      src={`${API_BASE}${stu.profile_picture}`}
                                      alt={stu.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <span>{stu.name?.charAt(0)?.toUpperCase()}</span>
                                  )}
                                </div>
                                {isGraduate && (
                                  <span className="absolute -top-1 -right-1 text-xs" title="Curriculum Graduate">
                                    🏆
                                  </span>
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="font-black text-slate-900 dark:text-white text-xs truncate">
                                  {stu.name}
                                </div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono font-bold text-[10px] border border-slate-200/60 dark:border-slate-700/60">
                                    {stu.student_code}
                                  </span>
                                  {stu.phone && (
                                    <span className="text-[10px] text-slate-400 truncate max-w-[100px]">
                                      {stu.phone}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Proficiency Tier */}
                          <td className="py-3.5 px-4">
                            {getSpeedTierBadge(stu.proficiency_tier, stu.best_wpm)}
                          </td>

                          {/* 14-Lesson Progress (Single Row Indicator + Segmented dots) */}
                          <td className="py-3.5 px-4">
                            <div className="space-y-1.5 max-w-[240px]">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-bold text-slate-800 dark:text-slate-200">
                                  {stu.completed_lessons} / 14 Passed
                                </span>
                                <span className="font-mono font-black text-purple-600 dark:text-purple-400 text-[10px]">
                                  {stu.completion_percent}%
                                </span>
                              </div>

                              {/* 14 Segmented Step Dots on a guaranteed single flex row */}
                              <div className="flex items-center gap-1 w-full">
                                {stu.lesson_grid?.map((l) => (
                                  <div
                                    key={l.lesson_id}
                                    title={`Lesson ${l.lesson_id}: ${l.completed ? 'Passed' : l.unlocked ? 'Active' : 'Locked'}`}
                                    className={`flex-1 h-1.5 rounded-full transition-all ${
                                      l.completed
                                        ? 'bg-emerald-500'
                                        : l.unlocked
                                        ? 'bg-purple-500 animate-pulse'
                                        : 'bg-slate-200 dark:bg-slate-700 opacity-40'
                                    }`}
                                  />
                                ))}
                              </div>

                              <div className="flex items-center justify-between text-[10px] text-slate-400">
                                <span className="truncate max-w-[140px]">
                                  L{stu.current_lesson}: {LESSON_NAMES[stu.current_lesson]?.split(':')[0] || 'Home Row'}
                                </span>
                                <span className="font-mono text-amber-500 font-bold shrink-0">
                                  ⭐ {stu.total_stars}/42
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Peak Speed */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="inline-block font-mono font-black text-indigo-600 dark:text-indigo-400 text-sm">
                              {stu.best_wpm > 0 ? `⚡ ${stu.best_wpm}` : '—'}
                              {stu.best_wpm > 0 && <span className="text-[10px] font-normal text-slate-400 ml-0.5">WPM</span>}
                            </div>
                          </td>

                          {/* Accuracy */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="inline-block font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                              {stu.best_accuracy > 0 ? `🎯 ${stu.best_accuracy}%` : '—'}
                            </div>
                          </td>

                          {/* Last Active */}
                          <td className="py-3.5 px-4 text-center text-[10px] text-slate-400">
                            {stu.last_practiced_at ? (
                              <span title={stu.last_practiced_at}>
                                {new Date(stu.last_practiced_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </span>
                            ) : (
                              <span className="text-slate-300 dark:text-slate-600">Never</span>
                            )}
                          </td>

                          {/* Action Button */}
                          <td className="py-3.5 px-5 text-right">
                            <button
                              onClick={() => openStudentModal(stu.user_id)}
                              className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-600 hover:text-white text-purple-600 dark:text-purple-300 font-bold text-[11px] transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                            >
                              <FiEye size={12} />
                              <span>Report</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* ────────────────────────────────────────────────────────── */
            /* MODERN SLEEK CARDS VIEW                                    */
            /* ────────────────────────────────────────────────────────── */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredStudents.map((stu) => {
                const isGraduate = stu.completed_lessons >= 14;

                return (
                  <div
                    key={stu.user_id}
                    className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-purple-500/40 hover:shadow-md transition-all flex flex-col justify-between gap-4"
                  >
                    {/* Top Row: Avatar, Name, Code & Action */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative shrink-0">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-black text-base shadow-xs overflow-hidden">
                            {stu.profile_picture ? (
                              <img
                                src={`${API_BASE}${stu.profile_picture}`}
                                alt={stu.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span>{stu.name?.charAt(0)?.toUpperCase()}</span>
                            )}
                          </div>
                          {isGraduate && (
                            <span className="absolute -top-1.5 -right-1.5 text-sm" title="Curriculum Graduate">
                              🏆
                            </span>
                          )}
                        </div>

                        <div className="min-w-0 space-y-0.5">
                          <h4 className="text-sm font-black text-slate-900 dark:text-white truncate">
                            {stu.name}
                          </h4>
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono font-bold text-[10px] border border-slate-200/60 dark:border-slate-700/60">
                              {stu.student_code}
                            </span>
                            {getSpeedTierBadge(stu.proficiency_tier, stu.best_wpm)}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => openStudentModal(stu.user_id)}
                        className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-600 hover:text-white text-purple-600 dark:text-purple-300 font-bold transition-all cursor-pointer shrink-0"
                        title="View Detailed Student Report"
                      >
                        <FiEye size={15} />
                      </button>
                    </div>

                    {/* Middle: 14-Lesson Single Row Step Dots */}
                    <div className="space-y-1.5 bg-slate-50/80 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {stu.completed_lessons} / 14 Lessons Passed
                        </span>
                        <span className="font-black font-mono text-purple-600 dark:text-purple-400">
                          {stu.completion_percent}%
                        </span>
                      </div>

                      {/* 14 Step Dots (guaranteed 1-row flex) */}
                      <div className="flex items-center gap-1 w-full">
                        {stu.lesson_grid?.map((l) => (
                          <div
                            key={l.lesson_id}
                            title={`Lesson ${l.lesson_id}: ${l.completed ? 'Passed' : l.unlocked ? 'Active' : 'Locked'}`}
                            className={`flex-1 h-2 rounded-full transition-all ${
                              l.completed
                                ? 'bg-emerald-500'
                                : l.unlocked
                                ? 'bg-purple-500 animate-pulse'
                                : 'bg-slate-200 dark:bg-slate-700 opacity-40'
                            }`}
                          />
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                        <span className="truncate max-w-[200px]">
                          Current: Lesson {stu.current_lesson} ({LESSON_NAMES[stu.current_lesson] || 'Home Row'})
                        </span>
                        <span className="font-mono text-amber-500 font-bold">⭐ {stu.total_stars}/42 Stars</span>
                      </div>
                    </div>

                    {/* Bottom Row: KPI Badges */}
                    <div className="grid grid-cols-3 gap-2 text-center pt-1">
                      <div className="p-2 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50">
                        <div className="text-[9px] font-bold text-indigo-500 uppercase">Top Speed</div>
                        <div className="text-xs font-black font-mono text-indigo-700 dark:text-indigo-300">
                          ⚡ {stu.best_wpm} <span className="text-[9px] font-normal">WPM</span>
                        </div>
                      </div>

                      <div className="p-2 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50">
                        <div className="text-[9px] font-bold text-emerald-500 uppercase">Accuracy</div>
                        <div className="text-xs font-black font-mono text-emerald-700 dark:text-emerald-300">
                          🎯 {stu.best_accuracy}%
                        </div>
                      </div>

                      <div className="p-2 rounded-xl bg-purple-50/80 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/50">
                        <div className="text-[9px] font-bold text-purple-500 uppercase">Practice</div>
                        <div className="text-xs font-black font-mono text-purple-700 dark:text-purple-300">
                          {stu.total_sessions || 0} <span className="text-[9px] font-normal">Drills</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* TAB 2: HALL OF FAME & LEADERBOARD                             */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-6">
          {/* Top 3 Podium Display */}
          {leaderboard.length >= 3 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              {/* Silver 2nd Place */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center relative order-2 md:order-1 shadow-sm flex flex-col justify-between">
                <div className="space-y-2">
                  <span className="text-3xl">🥈</span>
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-black uppercase">
                    2nd Place
                  </span>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white truncate">
                    {leaderboard[1]?.name}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono font-bold">
                    {leaderboard[1]?.student_code}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1">
                  <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                    ⚡ {leaderboard[1]?.best_wpm} WPM
                  </div>
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                    🎯 {leaderboard[1]?.best_accuracy}% Accuracy • ⭐ {leaderboard[1]?.total_stars} Stars
                  </div>
                </div>
              </div>

              {/* Gold 1st Place */}
              <div className="p-6 rounded-3xl bg-gradient-to-b from-amber-500/10 via-white to-white dark:from-amber-500/15 dark:via-slate-900 dark:to-slate-900 border-2 border-amber-500/50 text-center relative order-1 md:order-2 shadow-lg -translate-y-2 flex flex-col justify-between">
                <div className="space-y-2">
                  <span className="text-4xl animate-bounce inline-block">👑</span>
                  <span className="inline-block px-3 py-1 rounded-full bg-amber-500 text-white text-xs font-black uppercase shadow-xs">
                    🥇 Academy Champion
                  </span>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white truncate">
                    {leaderboard[0]?.name}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono font-bold">
                    {leaderboard[0]?.student_code}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-amber-500/20 space-y-1">
                  <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
                    ⚡ {leaderboard[0]?.best_wpm} WPM
                  </div>
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                    🎯 {leaderboard[0]?.best_accuracy}% Accuracy • ⭐ {leaderboard[0]?.total_stars} Stars
                  </div>
                </div>
              </div>

              {/* Bronze 3rd Place */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center relative order-3 md:order-3 shadow-sm flex flex-col justify-between">
                <div className="space-y-2">
                  <span className="text-3xl">🥉</span>
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-black uppercase">
                    3rd Place
                  </span>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white truncate">
                    {leaderboard[2]?.name}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono font-bold">
                    {leaderboard[2]?.student_code}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1">
                  <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                    ⚡ {leaderboard[2]?.best_wpm} WPM
                  </div>
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                    🎯 {leaderboard[2]?.best_accuracy}% Accuracy • ⭐ {leaderboard[2]?.total_stars} Stars
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Top 10 Ranked Table */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <FiTrendingUp className="text-indigo-500" />
              <span>Top 10 Fastest Typists (Speed & Accuracy Ranking)</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-3 px-3">Rank</th>
                    <th className="py-3 px-3">Student</th>
                    <th className="py-3 px-3">Proficiency Tier</th>
                    <th className="py-3 px-3">Curriculum Progress</th>
                    <th className="py-3 px-3">Peak Speed</th>
                    <th className="py-3 px-3">Accuracy</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {leaderboard.map((stu, idx) => (
                    <tr key={stu.user_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-3 font-mono font-black text-sm">
                        {idx === 0 ? '🥇 1' : idx === 1 ? '🥈 2' : idx === 2 ? '🥉 3' : `#${idx + 1}`}
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-slate-900 dark:text-white">{stu.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{stu.student_code}</div>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold text-[10px] border border-purple-200/60 dark:border-purple-800/40">
                          {stu.proficiency_tier}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{stu.completed_lessons} / 14 Lessons</span>
                        <span className="text-slate-400 text-[10px] ml-1.5 font-mono">({stu.total_stars} ★)</span>
                      </td>
                      <td className="py-3.5 px-3 font-mono font-black text-indigo-600 dark:text-indigo-400 text-sm">
                        ⚡ {stu.best_wpm} WPM
                      </td>
                      <td className="py-3.5 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {stu.best_accuracy}%
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <button
                          onClick={() => openStudentModal(stu.user_id)}
                          className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 font-bold text-[11px] hover:bg-purple-100 cursor-pointer transition-colors"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* TAB 3: 14-LESSON FUNNEL & RETENTION ANALYTICS                 */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'funnel' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                14-Lesson Curriculum Funnel & Progression Flow
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Visual progression analysis across all 14 curriculum levels. Identify modules where students achieve high speeds vs where they need instructional support.
              </p>
            </div>

            <div className="space-y-3.5">
              {lessonFunnel.map((l) => {
                const totalStudents = kpi.total_enrolled || 1;
                const completedPct = Math.round((l.completed_count / totalStudents) * 100);
                const unlockedPct = Math.round((l.unlocked_count / totalStudents) * 100);

                return (
                  <div
                    key={l.lesson_id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-purple-600 text-white flex items-center justify-center font-black text-xs shrink-0">
                          {l.lesson_id}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          Lesson {l.lesson_id}: {LESSON_NAMES[l.lesson_id] || `Module ${l.lesson_id}`}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 font-mono text-[11px]">
                        <span className="text-purple-600 dark:text-purple-400 font-bold">
                          🔓 {l.unlocked_count} Unlocked
                        </span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                          ✅ {l.completed_count} Passed ({completedPct}%)
                        </span>
                        {l.avg_wpm > 0 && (
                          <span className="text-indigo-600 dark:text-indigo-400 font-black">
                            ⚡ Avg: {l.avg_wpm} WPM
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress Trackers */}
                    <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden relative">
                      <div
                        className="h-full bg-purple-300 dark:bg-purple-900/60 absolute left-0 top-0 transition-all duration-300"
                        style={{ width: `${unlockedPct}%` }}
                      />
                      <div
                        className="h-full bg-emerald-500 absolute left-0 top-0 transition-all duration-300"
                        style={{ width: `${completedPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* INDIVIDUAL STUDENT DEEP-DIVE MODAL                            */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {selectedStudentId && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-3xl max-h-[90vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-800 dark:text-slate-100">
            {/* Modal Header */}
            <div className="p-6 bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 flex items-start justify-between gap-4 shrink-0">
              {loadingDetail || !studentDetail ? (
                <div className="flex items-center gap-3">
                  <div className="animate-spin w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full" />
                  <span className="text-xs font-bold text-slate-500">Loading student details...</span>
                </div>
              ) : (
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-md overflow-hidden shrink-0">
                    {studentDetail.student?.profile_picture ? (
                      <img
                        src={`${API_BASE}${studentDetail.student.profile_picture}`}
                        alt={studentDetail.student.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{studentDetail.student?.name?.charAt(0)?.toUpperCase()}</span>
                    )}
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-black text-slate-900 dark:text-white truncate">
                        {studentDetail.student?.name}
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-mono font-bold text-xs shrink-0 border border-purple-200 dark:border-purple-800/60">
                        {studentDetail.student?.student_code}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                      Touch Typing Master Curriculum • Email: {studentDetail.student?.email || 'N/A'}
                    </p>
                  </div>
                </div>
              )}

              <button
                onClick={closeStudentModal}
                className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shrink-0 shadow-2xs"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Modal Body Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
              {studentDetail && (
                <>
                  {/* Summary Metric Ribbon */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-3.5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-900/50 shadow-2xs">
                      <div className="text-[10px] font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider">Progress</div>
                      <div className="text-lg font-black text-purple-900 dark:text-purple-200 mt-0.5">
                        {studentDetail.summary?.completed_lessons} / 14 Passed
                      </div>
                      <div className="text-[10px] text-purple-600 dark:text-purple-400 font-mono font-bold mt-0.5">⭐ {studentDetail.summary?.total_stars} / 42 Stars</div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900/50 shadow-2xs">
                      <div className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">Peak Speed</div>
                      <div className="text-lg font-black text-indigo-900 dark:text-indigo-200 mt-0.5 font-mono">
                        ⚡ {studentDetail.summary?.best_wpm} <span className="text-xs font-normal">WPM</span>
                      </div>
                      <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono font-bold mt-0.5">Top Net Speed</div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/50 shadow-2xs">
                      <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Best Accuracy</div>
                      <div className="text-lg font-black text-emerald-900 dark:text-emerald-200 mt-0.5 font-mono">
                        🎯 {studentDetail.summary?.best_accuracy}%
                      </div>
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold mt-0.5">Overall Accuracy</div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/50 shadow-2xs">
                      <div className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Practice Drills</div>
                      <div className="text-lg font-black text-amber-900 dark:text-amber-200 mt-0.5 font-mono">
                        {studentDetail.summary?.total_sessions} <span className="text-xs font-normal">Tests</span>
                      </div>
                      <div className="text-[10px] text-amber-600 dark:text-amber-400 font-mono font-bold mt-0.5">Logged Sessions</div>
                    </div>
                  </div>

                  {/* Weak Keys Mistake Analyzer */}
                  {studentDetail.weak_keys && studentDetail.weak_keys.length > 0 && (
                    <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/25 border border-amber-200/70 dark:border-amber-900/50 space-y-2">
                      <div className="text-xs font-black text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                        <span>⚠️ Weak Keys Mistake Heatmap (Problem Keys):</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {studentDetail.weak_keys.map((k, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 font-mono font-bold text-xs border border-rose-200 dark:border-rose-900/60 shadow-2xs"
                          >
                            Key '{k.key}' ({k.errors} errors)
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── ADMIN FORCE CONTROL BAR (CRISP LIGHT/DARK THEME) ─── */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping shrink-0" />
                        <span className="text-slate-900 dark:text-white font-black text-xs uppercase tracking-wider">
                          ⚡ Admin Curriculum Force Controls
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        Instant override for student access & completion
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                      {/* Pass All 14 Button */}
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => handleAdminProgressAction('complete_all')}
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
                      >
                        <span>👑 Pass All 14 (Graduate)</span>
                      </button>

                      {/* Unlock All 14 Button */}
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => handleAdminProgressAction('unlock_all')}
                        className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
                      >
                        <FiLock size={12} />
                        <span>🔓 Unlock All 14 Lessons</span>
                      </button>

                      {/* Reset Progress Button */}
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => handleAdminProgressAction('reset_progress')}
                        className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-rose-200 dark:border-rose-900/50 shadow-2xs active:scale-95 disabled:opacity-50 ml-auto"
                      >
                        <FiRotateCcw size={12} />
                        <span>Reset to Lesson 1</span>
                      </button>
                    </div>
                  </div>

                  {/* 14-Lesson Status Grid */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        14-Lesson Curriculum Breakdown:
                      </h4>
                      <span className="text-[10px] text-slate-400 font-medium">Click buttons to unlock or pass specific lessons</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {Array.from({ length: 14 }, (_, i) => {
                        const lId = i + 1;
                        const cRow = studentDetail.curriculum_progress?.find(c => parseInt(c.lesson_id, 10) === lId);
                        const isUnlocked = lId === 1 || (cRow && parseInt(cRow.is_unlocked, 10) === 1);
                        const isCompleted = cRow && parseInt(cRow.is_completed, 10) === 1;
                        const stars = cRow ? parseInt(cRow.stars, 10) : 0;
                        const bestWpm = cRow ? parseInt(cRow.best_wpm, 10) : 0;
                        const bestAcc = cRow ? parseInt(cRow.best_accuracy, 10) : 0;

                        return (
                          <div
                            key={lId}
                            className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-2.5 ${
                              isCompleted
                                ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 shadow-2xs'
                                : isUnlocked
                                ? 'bg-purple-50/40 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800/40 shadow-2xs'
                                : 'bg-slate-50/60 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 opacity-70'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                                isCompleted
                                  ? 'bg-emerald-500 text-white shadow-xs'
                                  : isUnlocked
                                  ? 'bg-purple-600 text-white shadow-xs'
                                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                              }`}>
                                {lId}
                              </span>
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                                  {LESSON_NAMES[lId]}
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] mt-0.5">
                                  <span className={isCompleted ? 'text-emerald-700 dark:text-emerald-300 font-bold' : isUnlocked ? 'text-purple-700 dark:text-purple-300 font-bold' : 'text-slate-400'}>
                                    {isCompleted ? '✅ Passed' : isUnlocked ? '🔓 Active Drill' : '🔒 Locked'}
                                  </span>
                                  {bestWpm > 0 && (
                                    <span className="text-indigo-600 dark:text-indigo-400 font-mono font-bold">
                                      • {bestWpm} WPM
                                    </span>
                                  )}
                                  {stars > 0 && (
                                    <span className="text-amber-500 font-mono font-bold">
                                      • {'★'.repeat(stars)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Admin Quick Action Button for this Lesson */}
                            <div className="shrink-0">
                              {!isUnlocked ? (
                                <button
                                  type="button"
                                  disabled={actionLoading}
                                  onClick={() => handleAdminProgressAction('unlock_lesson', lId)}
                                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-purple-600 hover:text-white dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 font-bold text-[11px] transition-all cursor-pointer border border-purple-200 dark:border-purple-800 shadow-2xs active:scale-95 disabled:opacity-50"
                                >
                                  🔓 Unlock
                                </button>
                              ) : !isCompleted ? (
                                <button
                                  type="button"
                                  disabled={actionLoading}
                                  onClick={() => handleAdminProgressAction('complete_lesson', lId)}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
                                >
                                  ✅ Pass
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled={actionLoading}
                                  onClick={() => handleAdminProgressAction('complete_lesson', lId)}
                                  title="Force Re-Pass with 3 Stars"
                                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-50 dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 font-mono font-bold text-[10px] transition-all cursor-pointer shadow-2xs"
                                >
                                  ⭐ Passed
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Recent Practice Sessions Log Table */}
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Recent Practice Sessions (Last 50 Logs):
                    </h4>

                    {studentDetail.recent_sessions?.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No practice logs recorded yet.</p>
                    ) : (
                      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-bold uppercase text-[9px] border-b border-slate-200 dark:border-slate-700">
                            <tr>
                              <th className="py-2.5 px-3">Date & Time</th>
                              <th className="py-2.5 px-3">Lesson / Drill</th>
                              <th className="py-2.5 px-3">Speed (WPM)</th>
                              <th className="py-2.5 px-3">Accuracy</th>
                              <th className="py-2.5 px-3">Errors</th>
                              <th className="py-2.5 px-3">Duration</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-[11px]">
                            {studentDetail.recent_sessions?.map((sess) => (
                              <tr key={sess.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                                <td className="py-2 px-3 text-slate-500 dark:text-slate-400">
                                  {sess.created_at ? new Date(sess.created_at).toLocaleString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  }) : 'N/A'}
                                </td>
                                <td className="py-2 px-3 font-sans font-bold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                                  {(() => {
                                    const diff = sess.difficulty_level || '';
                                    if (diff.startsWith('lesson_')) {
                                      const parts = diff.replace('lesson_', '').split('_ex_');
                                      const lNum = parts[0];
                                      const exId = parts[1] || '';
                                      return `Lesson ${lNum}${exId ? ` (Ex ${exId})` : ''}`;
                                    }
                                    if (diff === 'home_row') return 'Lesson 1 (Home Row)';
                                    return diff || 'Practice Drill';
                                  })()}
                                </td>
                                <td className="py-2 px-3 font-black text-indigo-600 dark:text-indigo-400">
                                  ⚡ {sess.wpm} WPM
                                </td>
                                <td className="py-2 px-3 font-bold text-emerald-600 dark:text-emerald-400">
                                  {sess.accuracy_percent}%
                                </td>
                                <td className="py-2 px-3 text-rose-500 font-bold">
                                  {sess.mistakes_count}
                                </td>
                                <td className="py-2 px-3 text-slate-400">
                                  {sess.duration_seconds}s
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50/80 dark:bg-slate-800/60 border-t border-slate-200/80 dark:border-slate-800 flex justify-end shrink-0">
              <button
                onClick={closeStudentModal}
                className="px-6 py-2.5 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold text-xs cursor-pointer hover:opacity-90 transition-opacity shadow-sm"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── CUSTOM CONFIRMATION MODAL ──────────────────────────────── */}
      <ConfirmModal
        isOpen={confirmModalState.isOpen}
        title={confirmModalState.title}
        message={confirmModalState.message}
        confirmText={confirmModalState.confirmText}
        cancelText={confirmModalState.cancelText}
        confirmVariant={confirmModalState.confirmVariant}
        loading={confirmModalState.loading}
        onConfirm={() => executeAdminProgressAction(confirmModalState.action, confirmModalState.lessonId)}
        onCancel={() => setConfirmModalState(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default TypingReports;
