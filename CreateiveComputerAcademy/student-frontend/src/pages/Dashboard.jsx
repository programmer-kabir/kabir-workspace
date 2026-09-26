import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import {
  FiClock, FiCheckCircle, FiCalendar, FiBookOpen,
  FiAward, FiArrowRight, FiCheckSquare, FiUserCheck,
  FiLayers, FiChevronRight, FiPlayCircle, FiVideo, FiFolder, FiStar
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useCourse } from '../context/CourseContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const Dashboard = () => {
  const { currentUser } = useAuth();
  const { activeCourse, courses } = useCourse();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [checkingIn, setCheckingIn] = useState(false);

  const [todayAttendance, setTodayAttendance] = useState(null);

  // Office / Attendance Leaderboard state (Top 5 worked)
  const [timeFilter, setTimeFilter] = useState('daily');
  const [leaderboardTab, setLeaderboardTab] = useState('attendance');
  const [leaderboard, setLeaderboard] = useState({ attendance: [], completed: [], in_review: [] });
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  // Fetch Attendance Leaderboard (Top 5 worked)
  useEffect(() => {
    const fetchAttendanceLeaderboard = async () => {
      setLeaderboardLoading(true);
      try {
        const res = await axios.get(`${API_BASE}api/student/get_leader.php?time_filter=${timeFilter}`);
        if (res.data?.status === 'success') {
          setLeaderboard({
            attendance: res.data.attendance || [],
            completed: res.data.completed || [],
            in_review: res.data.in_review || []
          });
        }
      } catch (err) {
        console.error("Failed to fetch leaderboard", err);
      } finally {
        setLeaderboardLoading(false);
      }
    };
    fetchAttendanceLeaderboard();
  }, [timeFilter]);

  // Clock timer
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchDashboardData = async () => {
    if (!currentUser?.id) return;
    try {
      setLoading(true);
      const courseParam = activeCourse?.course_id ? `&course_id=${activeCourse.course_id}` : '';
      const enrParam = activeCourse?.enrollment_id ? `&enrollment_id=${activeCourse.enrollment_id}` : '';

      const [dashRes, attRes] = await Promise.allSettled([
        axios.get(`${API_BASE}api/student/dashboard.php?user_id=${currentUser.id}${courseParam}${enrParam}`),
        axios.post(`${API_BASE}api/attendance/get_attendance.php`, { user_id: currentUser.id })
      ]);

      if (dashRes.status === 'fulfilled' && dashRes.value?.data?.status === 'success') {
        const data = dashRes.value.data.data;
        setDashboardData(data);
        if (data.today_attendance && data.today_attendance.check_in) {
          setTodayAttendance(data.today_attendance);
        }
      }

      if (attRes.status === 'fulfilled' && attRes.value?.data?.status === 'success') {
        const attData = attRes.value.data;
        const todayStr = new Date().toISOString().split('T')[0];
        if (attData.today && attData.today.check_in) {
          setTodayAttendance(attData.today);
        } else if (Array.isArray(attData.history)) {
          const tLog = attData.history.find(l => l.date === todayStr);
          if (tLog && tLog.check_in) {
            setTodayAttendance(tLog);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [currentUser?.id, activeCourse?.course_id]);

  // Handle Quick Check-In
  const handleCheckIn = async () => {
    try {
      setCheckingIn(true);
      const res = await axios.post(`${API_BASE}api/attendance/check_in.php`, {
        user_id: currentUser.id
      });

      if (res.data.status === 'success') {
        toast.success(res.data.message || 'Attendance recorded successfully!');
        fetchDashboardData();
      } else {
        toast.error(res.data.message || 'Check-in failed.');
      }
    } catch (err) {
      toast.error('Check-in error.');
    } finally {
      setCheckingIn(false);
    }
  };

  // Handle Check-Out
  const handleCheckOut = async () => {
    try {
      setCheckingIn(true);
      const res = await axios.post(`${API_BASE}api/attendance/check_out.php`, {
        user_id: currentUser.id
      });

      if (res.data.status === 'success') {
        toast.success(res.data.message || 'Checked out successfully!');
        fetchDashboardData();
      } else {
        toast.error(res.data.message || 'Check-out failed.');
      }
    } catch (err) {
      toast.error('Check-out error.');
    } finally {
      setCheckingIn(false);
    }
  };

  const student = dashboardData?.student || currentUser;
  const stats = dashboardData?.stats || { attendance_rate: 100, present_days: 0, late_days: 0, total_days: 0 };
  const todayAtt = todayAttendance || dashboardData?.today_attendance;
  const modules = dashboardData?.modules || [];
  const assignmentSummary = dashboardData?.assignment_summary || { total: 0, submitted: 0, pending: 0 };

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 mx-auto">
      {/* Multi-Course Alert Bar if enrolled in > 1 courses */}
      {courses && courses.length > 1 && (
        <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 dark:from-indigo-950/40 dark:via-purple-950/40 dark:to-pink-950/40 border border-indigo-200/80 dark:border-indigo-800/80 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-indigo-600 text-white font-black">
              <FiLayers size={14} />
            </span>
            <span className="text-slate-700 dark:text-slate-200 font-medium">
              You have access to <b className="text-indigo-600 dark:text-indigo-400">{courses.length} Courses</b>. Currently viewing: <b className="text-slate-900 dark:text-white">{activeCourse?.course_title}</b>.
            </span>
          </div>
          <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
            <span>Switch course from header anytime</span>
            <FiChevronRight size={12} />
          </span>
        </div>
      )}

      {/* Hero Banner with Course & Today's Attendance Check-in */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Welcome Card with Course Banner & Thumbnail Pic */}
        <div className="lg:col-span-2 bg-gradient-to-tr from-indigo-950 via-slate-900 to-indigo-900 text-white p-6 md:p-8 rounded-3xl shadow-xl relative overflow-hidden flex flex-col justify-between border border-slate-700/40 min-h-[220px]">
          {/* Background Course Banner if available */}
          {(activeCourse?.banner_url || student?.banner_url) && (
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-25 mix-blend-luminosity scale-105 transition-transform duration-700 pointer-events-none"
              style={{ backgroundImage: `url(${activeCourse?.banner_url || student?.banner_url})` }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-indigo-950/80 to-transparent pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              {/* Course Picture / Thumbnail Avatar */}
              {(activeCourse?.thumbnail_url || student?.thumbnail_url) ? (
                <img 
                  src={activeCourse?.thumbnail_url || student?.thumbnail_url} 
                  alt="Course Pic" 
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-indigo-400/40 shadow-lg bg-indigo-950 shrink-0"
                />
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center shrink-0 text-indigo-300">
                  <FiBookOpen size={28} />
                </div>
              )}

              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold text-indigo-200 mb-2 border border-white/10">
                  <FiAward size={13} className="text-amber-400" />
                  <span>{activeCourse?.course_category || student?.course_category || 'Self-Paced Course'}</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white drop-shadow-sm">
                  Hello, {student?.name || 'Student'}! 👋
                </h1>
                <p className="text-indigo-200 text-sm mt-1 max-w-xl">
                  Active Course: <span className="text-white font-bold">{activeCourse?.course_title || student?.course_name || 'Professional Course'}</span> (<span className="text-amber-300 font-bold">{activeCourse?.course_code || 'CCA'}</span>)
                </p>
              </div>
            </div>

            <Link
              to={`/learn${activeCourse?.course_id ? `/${activeCourse.course_id}` : ''}`}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-xs sm:text-sm shadow-lg shadow-emerald-950/40 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shrink-0 border border-emerald-300/30"
            >
              <FiPlayCircle size={18} />
              <span>Continue Learning 🎬</span>
            </Link>
          </div>

          <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10">
            <div>
              <p className="text-xs text-indigo-300 font-semibold">Student ID</p>
              <p className="text-lg font-black font-mono mt-0.5">{student?.student_code || activeCourse?.student_code || 'CCA-STU'}</p>
            </div>
            <div>
              <p className="text-xs text-indigo-300 font-semibold">Course Modules</p>
              <p className="text-lg font-black text-amber-300 mt-0.5">{modules.length} Modules</p>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className="text-xs text-indigo-300 font-semibold">Overall Attendance</p>
              <p className="text-lg font-black text-emerald-400 mt-0.5">{stats.attendance_rate}%</p>
            </div>
          </div>
        </div>

        {/* Daily Clock-in / Check-out Widget */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Daily Attendance</span>
              <span className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                Live
              </span>
            </div>

            <div className="mt-4 text-center">
              <p className="text-3xl font-black font-mono text-slate-900 dark:text-white">
                {currentTime.toLocaleTimeString('en-US', { timeZone: 'Asia/Dhaka', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
              </p>
              <p className="text-xs font-semibold text-slate-400 mt-1">
                {currentTime.toLocaleDateString('en-US', { timeZone: 'Asia/Dhaka', weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="mt-6">
            {todayAtt?.check_in ? (
              <div className="space-y-3">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold">
                    <FiCheckCircle size={16} />
                    <span>Checked In: {todayAtt.check_in.slice(0, 5)}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200">
                    {todayAtt.status || 'Present'}
                  </span>
                </div>

                {!todayAtt.check_out ? (
                  <button
                    onClick={handleCheckOut}
                    disabled={checkingIn}
                    className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer text-xs"
                  >
                    {checkingIn ? 'Processing...' : 'Clock Out for Today'}
                  </button>
                ) : (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Checked out at {todayAtt.check_out.slice(0, 5)}
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={handleCheckIn}
                disabled={checkingIn}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer text-sm flex items-center justify-center gap-2"
              >
                <FiClock size={16} />
                <span>{checkingIn ? 'Recording...' : 'Check In Attendance'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Video Modules</span>
            <FiPlayCircle size={20} />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{modules.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Structured lessons & syllabus</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Attendance</span>
            <FiCheckCircle size={20} />
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.attendance_rate}%</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{stats.present_days} Days Attended</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Late Days</span>
            <FiClock size={20} />
          </div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{stats.late_days || 0} Days</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Recorded late check-ins</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-purple-600 dark:text-purple-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Assignments</span>
            <FiCheckSquare size={20} />
          </div>
          <div className="flex items-baseline gap-1.5">
            <p className="text-2xl font-black text-purple-600 dark:text-purple-400">{assignmentSummary.submitted}</p>
            <p className="text-xs font-bold text-slate-400">/ {assignmentSummary.total} Total</p>
          </div>
          <Link to="/assignments" className="text-[11px] text-purple-600 dark:text-purple-400 font-bold hover:underline flex items-center gap-1 mt-0.5">
            <span>{assignmentSummary.pending > 0 ? `${assignmentSummary.pending} Pending` : 'All Completed'}</span>
            <FiArrowRight size={10} />
          </Link>
        </div>
      </div>

      {/* Course Curriculum & Recorded Modules Row */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 rounded-2xl">
              <FiBookOpen size={22} />
            </div>
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-base">
                {activeCourse?.course_title || 'Course Curriculum'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Complete syllabus & recorded video lectures ({modules.length} Modules)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <span className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              ⚡ Self-Paced 24/7 Access
            </span>
            <Link
              to="/courses"
              className="px-3.5 py-1 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/70 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Explore All Courses</span>
              <FiArrowRight size={12} />
            </Link>
          </div>
        </div>

        {modules.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            <FiFolder size={32} className="mx-auto mb-2 opacity-40" />
            Modules are being uploaded for this course.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {modules.map((mod) => (
              <div
                key={mod.id}
                className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-black text-[10px] uppercase">
                      Module {mod.module_no}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                      <FiVideo size={12} /> {mod.duration_classes || 6} Classes
                    </span>
                  </div>

                  <h5 className="font-bold text-slate-900 dark:text-white text-xs leading-snug">
                    {mod.title}
                  </h5>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {mod.description || 'Core theory, practical demonstrations & video tutorials.'}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <FiCheckCircle size={11} /> Unlocked
                  </span>
                  <button
                    onClick={() => toast.info(`Starting Module ${mod.module_no}: ${mod.title}`)}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Watch Lessons</span>
                    <FiPlayCircle size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Leaderboard & Recent Attendance Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Top 5 Office / Attendance Leaderboard Widget */}
        <div className="xl:col-span-1 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-b from-slate-50/80 to-white dark:from-slate-800/50 dark:to-slate-900">
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
              <span className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-500/20 text-amber-500 flex items-center justify-center shadow-xs">
                <FiAward size={18} />
              </span>
              Leaderboard
            </h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
              Top 5 Rank
            </span>
          </div>

          {/* Time Filter Pills */}
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="flex bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-2xl shadow-inner">
              {['daily', 'weekly', 'monthly', 'yearly', 'overall'].map((f) => (
                <button
                  key={f}
                  onClick={() => setTimeFilter(f)}
                  className={`flex-1 py-1.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${
                    timeFilter === f
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs ring-1 ring-slate-200/60 dark:ring-slate-600'
                      : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex px-3 pt-3 border-b border-slate-100 dark:border-slate-800 gap-1 bg-slate-50/50 dark:bg-slate-900/50">
            <button
              onClick={() => setLeaderboardTab('completed')}
              className={`flex-1 pb-2.5 text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all border-b-2 flex items-center justify-center gap-1 ${
                leaderboardTab === 'completed'
                  ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-900/20 rounded-t-xl'
                  : 'text-slate-400 border-transparent hover:text-slate-600 dark:hover:text-slate-300 rounded-t-xl'
              }`}
            >
              🚀 Completed
            </button>
            <button
              onClick={() => setLeaderboardTab('in_review')}
              className={`flex-1 pb-2.5 text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all border-b-2 flex items-center justify-center gap-1 ${
                leaderboardTab === 'in_review'
                  ? 'text-amber-600 dark:text-amber-400 border-amber-600 dark:border-amber-400 bg-amber-50/50 dark:bg-amber-900/20 rounded-t-xl'
                  : 'text-slate-400 border-transparent hover:text-slate-600 dark:hover:text-slate-300 rounded-t-xl'
              }`}
            >
              👀 In Review
            </button>
            <button
              onClick={() => setLeaderboardTab('attendance')}
              className={`flex-1 pb-2.5 text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all border-b-2 flex items-center justify-center gap-1 ${
                leaderboardTab === 'attendance'
                  ? 'text-emerald-600 dark:text-emerald-400 border-emerald-600 dark:border-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/20 rounded-t-xl'
                  : 'text-slate-400 border-transparent hover:text-slate-600 dark:hover:text-slate-300 rounded-t-xl'
              }`}
            >
              ⏱️ Attend
            </button>
          </div>

          {/* List items */}
          <div className="flex-1 overflow-y-auto p-3 relative bg-slate-50/40 dark:bg-slate-900/40 min-h-[350px]">
            {leaderboardLoading && (
              <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-10">
                <div className="w-8 h-8 border-3 border-slate-200 dark:border-slate-700 border-t-indigo-600 rounded-full animate-spin"></div>
              </div>
            )}
            {leaderboard[leaderboardTab]?.length > 0 ? (
              <div className="space-y-2.5">
                {leaderboard[leaderboardTab].slice(0, 5).map((user, idx) => (
                  <div
                    key={user.id || idx}
                    className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs hover:shadow-md transition-all hover:-translate-y-0.5 relative overflow-hidden group"
                  >
                    {/* Rank Badge */}
                    <div
                      className={`relative z-10 w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-xs ${
                        idx === 0
                          ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-amber-500/20 ring-2 ring-amber-200/50 dark:ring-amber-500/30'
                          : idx === 1
                          ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-white shadow-slate-500/20 ring-2 ring-slate-200/50 dark:ring-slate-600/30'
                          : idx === 2
                          ? 'bg-gradient-to-br from-orange-400 to-orange-500 text-white shadow-orange-500/20 ring-2 ring-orange-200/50 dark:ring-orange-500/30'
                          : 'bg-slate-100 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700'
                      }`}
                    >
                      {idx === 0 || idx === 1 || idx === 2 ? (
                        <FiAward size={20} />
                      ) : (
                        <span>#{idx + 1}</span>
                      )}
                    </div>

                    {/* Avatar */}
                    <div className="relative z-10 w-11 h-11 rounded-full overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-700 border-2 border-white dark:border-slate-800 shadow-xs">
                      {user.profile_picture ? (
                        <img
                          src={`${API_BASE}${user.profile_picture}`}
                          alt={user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black text-sm uppercase">
                          {user.name ? user.name.charAt(0) : 'U'}
                        </div>
                      )}
                    </div>

                    {/* User Info */}
                    <div className="relative z-10 flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                          {user.name}
                        </p>
                        {user.id === currentUser?.id && (
                          <span className="text-[9px] font-black uppercase tracking-wider text-white bg-indigo-600 px-1.5 py-0.5 rounded-full shrink-0 shadow-xs">
                            YOU
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                        {user.role || 'Student'}
                      </p>
                    </div>

                    {/* Score / Hours Worked */}
                    <div className="relative z-10 shrink-0 text-right bg-slate-50 dark:bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      <p
                        className={`text-xs sm:text-sm font-black font-mono leading-none ${
                          leaderboardTab === 'attendance'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : leaderboardTab === 'in_review'
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-blue-600 dark:text-blue-400'
                        }`}
                      >
                        {user.score}
                      </p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                        {leaderboardTab === 'attendance' ? 'WORKED' : 'TASKS'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3 text-slate-300 dark:text-slate-600">
                  <FiStar size={28} />
                </div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No records yet</p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">Data will update automatically as attendance is logged.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right 2 columns: Attendance Logs & Quick Navigation */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          {/* Recent Attendance Logs */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 flex-1">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 rounded-xl">
                  <FiCalendar size={18} />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white">Recent Attendance Logs</h3>
              </div>
              <Link to="/attendance" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                Full History →
              </Link>
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-400 text-sm">Loading attendance logs...</div>
            ) : !dashboardData?.recent_logs || dashboardData.recent_logs.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                <FiClock size={32} className="mx-auto mb-2 opacity-40" />
                No attendance logs recorded yet. Check in to get started!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Check-In</th>
                      <th className="py-3 px-4">Check-Out</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {dashboardData.recent_logs.slice(0, 6).map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{log.date}</td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-mono">{log.check_in || '—'}</td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-mono">{log.check_out || '—'}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            log.status === 'Present'
                              ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                              : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Quick Links & Resources (Horizontal Row of 3 Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              to="/assignments"
              className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-indigo-400 dark:hover:border-indigo-600 transition-all group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <div className="p-2.5 bg-purple-50 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-xl group-hover:scale-110 transition-transform">
                  <FiCheckSquare size={18} />
                </div>
                <FiArrowRight size={16} className="text-slate-400 group-hover:text-purple-600 transition-colors" />
              </div>
              <div className="mt-3">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs">Assignments</h4>
                <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">Submit practicals & view reviews</p>
              </div>
            </Link>

            <Link
              to="/resources"
              className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-indigo-400 dark:hover:border-indigo-600 transition-all group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <div className="p-2.5 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl group-hover:scale-110 transition-transform">
                  <FiBookOpen size={18} />
                </div>
                <FiArrowRight size={16} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
              </div>
              <div className="mt-3">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs">Resources</h4>
                <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">Download class materials & files</p>
              </div>
            </Link>

            <Link
              to="/profile"
              className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-indigo-400 dark:hover:border-indigo-600 transition-all group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl group-hover:scale-110 transition-transform">
                  <FiAward size={18} />
                </div>
                <FiArrowRight size={16} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
              </div>
              <div className="mt-3">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs">Student ID Card</h4>
                <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">Digital academy card & details</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
