import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FiCheckCircle, FiClock, FiList, FiAlertCircle, FiXCircle, FiPlayCircle, FiPauseCircle, FiEye, FiAward, FiStar, FiTarget, FiArrowRight, FiCoffee } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import TiffinTimer from '../components/TiffinTimer';
import ActiveBreakWidget from '../components/ActiveBreakWidget';
import AnimatedCounter from '../components/AnimatedCounter';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [leaderboard, setLeaderboard] = useState({ attendance: [], completed: [], in_review: [] });
  const [leaderboardTab, setLeaderboardTab] = useState('attendance');
  const [timeFilter, setTimeFilter] = useState('daily');
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [hasActiveBreak, setHasActiveBreak] = useState(false);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!currentUser?.id) return;
      
      try {
        const [attendanceRes, tasksRes] = await Promise.all([
          axios.post((import.meta.env.VITE_API_BASE_URL) + 'api/attendance/get_attendance.php', { user_id: currentUser.id }),
          axios.post((import.meta.env.VITE_API_BASE_URL) + 'api/tasks/get_my_tasks.php', { user_id: currentUser.id })
        ]);
        
        if (attendanceRes.data.status === 'success') {
          setAttendance(attendanceRes.data.today);
        }
        
        if (tasksRes.data.status === 'success') {
          setTasks(tasksRes.data.tasks);
        }
        
        
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [currentUser]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      if (!currentUser?.id) return;
      setLeaderboardLoading(true);
      try {
        const res = await axios.get((import.meta.env.VITE_API_BASE_URL) + 'api/dashboard/get_leaderboard.php?time_filter=' + timeFilter);
        if (res.data.status === 'success') {
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
    fetchLeaderboard();
  }, [currentUser, timeFilter]);

  if (loading) return (
    <div className="p-8 flex items-center justify-center min-h-[70vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-100 dark:border-slate-700 border-b-primary-600 shadow-xl"></div>
        <p className="text-slate-400 font-bold tracking-widest uppercase text-xs animate-pulse">Loading Workspace</p>
      </div>
    </div>
  );

  // Dynamic time-based greeting helper
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return { text: 'Good morning', emoji: '🌅' };
    }
    if (hour >= 12 && hour < 17) {
      return { text: 'Good afternoon', emoji: '☀️' };
    }
    if (hour >= 17 && hour < 22) {
      return { text: 'Good evening', emoji: '🌆' };
    }
    return { text: 'Good night', emoji: '🌙' };
  };

  const { text: greetingText, emoji: greetingEmoji } = getGreeting();

  // Calculate task stats
  const todoTasks = tasks.filter(t => t.status === 'To-Do');
  const inProgressTasks = tasks.filter(t => t.status === 'In Progress');
  const reviewTasks = tasks.filter(t => t.status === 'In Review');
  const rejectedTasks = tasks.filter(t => t.status === 'Rejected');
  const completedTasks = tasks.filter(t => t.status === 'Completed');
  
  const activeTasks = [...inProgressTasks, ...rejectedTasks, ...todoTasks].slice(0, 5); // Show up to 5 active tasks

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 pb-10">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary-900 via-indigo-900 to-indigo-800 rounded-[2rem] p-8 md:p-10 text-white shadow-xl shadow-primary-900/20 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white dark:bg-slate-800/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 left-1/4 w-48 h-48 bg-primary-500/20 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black mb-2 flex items-center gap-3">
              {greetingText}, {currentUser?.name?.split(' ')[0]}! <span className="origin-bottom-right animate-wave inline-block">{greetingEmoji}</span>
            </h1>
            <p className="text-primary-200/80 font-medium text-sm sm:text-base max-w-lg leading-relaxed">
              Here is your workspace overview for today. You currently have <strong className="text-white bg-white/10 dark:bg-slate-800/10 px-2 py-0.5 rounded-md">{todoTasks.length + inProgressTasks.length}</strong> active tasks requiring your attention.
            </p>
          </div>
          <div className="bg-white/10 dark:bg-slate-800/10 backdrop-blur-md border border-white/10 rounded-3xl p-4 sm:p-5 flex items-center gap-3 sm:gap-6 shadow-2xl">
            <div className="text-center px-2 sm:px-4 border-r border-white/10">
              <p className="text-3xl sm:text-4xl font-black tracking-tight drop-shadow-sm">
                <AnimatedCounter value={completedTasks.length} />
              </p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary-200 mt-1">Completed</p>
            </div>
            <div className="text-center px-2 sm:px-4 border-r border-white/10">
              <p className="text-3xl sm:text-4xl font-black tracking-tight drop-shadow-sm">
                <AnimatedCounter value={reviewTasks.length} />
              </p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary-200 mt-1">In Review</p>
            </div>
            <div className="text-center px-2 sm:px-4">
              <p className={`text-3xl sm:text-4xl font-black tracking-tight drop-shadow-sm ${rejectedTasks.length > 0 ? 'text-rose-400' : ''}`}>
                <AnimatedCounter value={rejectedTasks.length} />
              </p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary-200 mt-1">Rejected</p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Break Live Timer / Pending Banner (Only visible during break, hidden for user 2) */}
      <ActiveBreakWidget onBreakChange={({ activeBreak }) => setHasActiveBreak(!!activeBreak)} />

      {/* Tiffin Timer - visible to all staff except user 2 */}
      <TiffinTimer />

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        
        {/* Attendance Card */}
        <div 
          onClick={() => navigate('/attendance')}
          className="glass-card glass-card-hover p-6 rounded-3xl flex items-center justify-between cursor-pointer group relative overflow-hidden"
        >
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-emerald-50 dark:bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-100 dark:group-hover:bg-emerald-500/20 transition-colors pointer-events-none"></div>
          <div className="relative z-10">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5">Today's Status</p>
            {attendance ? (
              <>
                <p className="text-2xl font-black mt-1 tracking-tight text-emerald-600 dark:text-emerald-400">
                  {attendance.status}
                </p>
                <p className="text-xs text-slate-400 font-medium mt-1">In: <span className="text-slate-700 dark:text-slate-300 font-bold">{attendance.check_in || '-'}</span></p>
              </>
            ) : (
              <>
                <p className="text-xl font-black text-slate-400 dark:text-slate-500 mt-1 tracking-tight">Not Checked In</p>
                <p className="text-[10px] text-rose-500 dark:text-rose-400 font-bold uppercase tracking-widest mt-1.5 bg-rose-50 dark:bg-rose-500/10 inline-block px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800/30">Action Required</p>
              </>
            )}
          </div>
          <div className={`relative z-10 p-4 rounded-2xl ${attendance ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-500 shadow-inner shadow-emerald-500/10 dark:shadow-none' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'} group-hover:scale-110 transition-transform duration-300`}>
            {attendance ? <FiCheckCircle size={28} strokeWidth={2.5} /> : <FiAlertCircle size={28} strokeWidth={2.5} />}
          </div>
        </div>

        {/* Active Tasks Card */}
        <div 
          onClick={() => navigate('/tasks', { state: { activeTab: 'In Progress' } })}
          className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-between hover:shadow-xl hover:shadow-primary-500/5 hover:-translate-y-1 transition-all duration-300 cursor-pointer group relative overflow-hidden"
        >
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-primary-50 dark:bg-primary-500/10 rounded-full blur-2xl group-hover:bg-primary-100 dark:group-hover:bg-primary-500/20 transition-colors pointer-events-none"></div>
          <div className="relative z-10">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5">To-Do / Progress</p>
            <p className="text-4xl font-black text-slate-800 dark:text-slate-100 mt-1 tracking-tight">{todoTasks.length + inProgressTasks.length}</p>
          </div>
          <div className="relative z-10 bg-primary-50 dark:bg-primary-500/20 p-4 rounded-2xl text-primary-500 shadow-inner shadow-primary-500/10 dark:shadow-none group-hover:scale-110 transition-transform duration-300">
            <FiPlayCircle size={28} strokeWidth={2.5} />
          </div>
        </div>

        {/* Action Required Tasks */}
        <div 
          onClick={() => navigate('/tasks', { state: { activeTab: 'Rejected' } })}
          className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-between hover:shadow-xl hover:shadow-rose-500/5 hover:-translate-y-1 transition-all duration-300 cursor-pointer group relative overflow-hidden"
        >
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-rose-50 dark:bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-100 dark:group-hover:bg-rose-500/20 transition-colors pointer-events-none"></div>
          <div className="relative z-10">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5">Rejected</p>
            <p className={`text-4xl font-black mt-1 tracking-tight ${rejectedTasks.length > 0 ? 'text-rose-500' : 'text-slate-800 dark:text-slate-100'}`}>{rejectedTasks.length}</p>
          </div>
          <div className={`relative z-10 ${rejectedTasks.length > 0 ? 'bg-rose-50 dark:bg-rose-500/20 text-rose-500 shadow-inner shadow-rose-500/10 dark:shadow-none' : 'bg-slate-50 dark:bg-slate-900/50 text-slate-300 dark:text-slate-500'} p-4 rounded-2xl group-hover:scale-110 transition-transform duration-300`}>
            <FiXCircle size={28} strokeWidth={2.5} />
          </div>
        </div>

        {/* In Review Tasks Card */}
        <div 
          onClick={() => navigate('/tasks', { state: { activeTab: 'In Review' } })}
          className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-between hover:shadow-xl hover:shadow-amber-500/5 hover:-translate-y-1 transition-all duration-300 cursor-pointer group relative overflow-hidden"
        >
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-amber-50 dark:bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-100 dark:group-hover:bg-amber-500/20 transition-colors pointer-events-none"></div>
          <div className="relative z-10">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5">In Review</p>
            <p className="text-4xl font-black text-slate-800 dark:text-slate-100 mt-1 tracking-tight">{reviewTasks.length}</p>
          </div>
          <div className="relative z-10 bg-amber-50 dark:bg-amber-500/20 p-4 rounded-2xl text-amber-500 shadow-inner shadow-amber-500/10 dark:shadow-none group-hover:scale-110 transition-transform duration-300">
            <FiEye size={28} strokeWidth={2.5} />
          </div>
        </div>

        {/* Completed Tasks Card */}
        <div 
          onClick={() => navigate('/tasks', { state: { activeTab: 'Completed' } })}
          className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-between hover:shadow-xl hover:shadow-emerald-500/5 hover:-translate-y-1 transition-all duration-300 cursor-pointer group relative overflow-hidden"
        >
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-emerald-50 dark:bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-100 dark:group-hover:bg-emerald-500/20 transition-colors pointer-events-none"></div>
          <div className="relative z-10">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5">Completed</p>
            <p className="text-4xl font-black text-slate-800 dark:text-slate-100 mt-1 tracking-tight">{completedTasks.length}</p>
          </div>
          <div className="relative z-10 bg-emerald-50 dark:bg-emerald-500/20 p-4 rounded-2xl text-emerald-500 shadow-inner shadow-emerald-500/10 dark:shadow-none group-hover:scale-110 transition-transform duration-300">
            <FiCheckCircle size={28} strokeWidth={2.5} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Leaderboard (Moved to the left/first) */}
        <div className="xl:col-span-1 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between bg-gradient-to-b from-slate-50/80 to-white dark:from-slate-800 dark:to-slate-900">
            <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 tracking-tight">
              <span className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-500/20 text-amber-500 flex items-center justify-center">
                <FiAward size={16} />
              </span>
              Leaderboard
            </h3>
          </div>
          
          {/* Main Time Filter */}
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
            <div className="flex bg-slate-100/80 dark:bg-slate-900/80 p-1.5 rounded-2xl shadow-inner shadow-slate-200/50 dark:shadow-none">
              {['daily', 'weekly', 'monthly', 'yearly', 'overall'].map(f => (
                <button 
                  key={f}
                  onClick={() => setTimeFilter(f)}
                  className={`flex-1 py-2 text-[9px] sm:text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${timeFilter === f ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-md shadow-slate-200/50 dark:shadow-none ring-1 ring-slate-200/50 dark:ring-slate-600' : 'text-slate-400 hover:text-slate-700 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800'}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          
          {/* Category Tabs */}
          <div className="flex px-4 pt-4 border-b border-slate-100 dark:border-slate-700 gap-2 bg-slate-50 dark:bg-slate-900/50">
            <button 
              onClick={() => setLeaderboardTab('completed')}
              className={`flex-1 pb-3 text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all border-b-2 flex items-center justify-center gap-1.5 ${leaderboardTab === 'completed' ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-900/30 rounded-t-xl' : 'text-slate-400 border-transparent hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 rounded-t-xl'}`}
            >
              🚀 Completed
            </button>
            <button 
              onClick={() => setLeaderboardTab('in_review')}
              className={`flex-1 pb-3 text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all border-b-2 flex items-center justify-center gap-1.5 ${leaderboardTab === 'in_review' ? 'text-amber-600 dark:text-amber-400 border-amber-600 dark:border-amber-400 bg-amber-50/50 dark:bg-amber-900/30 rounded-t-xl' : 'text-slate-400 border-transparent hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 rounded-t-xl'}`}
            >
              👀 In Review
            </button>
            <button 
              onClick={() => setLeaderboardTab('attendance')}
              className={`flex-1 pb-3 text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all border-b-2 flex items-center justify-center gap-1.5 ${leaderboardTab === 'attendance' ? 'text-emerald-600 dark:text-emerald-400 border-emerald-600 dark:border-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/30 rounded-t-xl' : 'text-slate-400 border-transparent hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 rounded-t-xl'}`}
            >
              ⏱️ Attend
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 relative bg-slate-50 dark:bg-slate-900/50 min-h-[350px]">
            {leaderboardLoading && (
              <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-10">
                <div className="w-8 h-8 border-4 border-slate-200 dark:border-slate-700 border-t-primary-600 rounded-full animate-spin"></div>
              </div>
            )}
            {leaderboard[leaderboardTab]?.length > 0 ? (
              <div className="space-y-3 p-1">
                {leaderboard[leaderboardTab].map((user, idx) => (
                  <div key={user.id} className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-lg hover:shadow-slate-200/50 transition-all hover:-translate-y-1 group cursor-pointer relative overflow-hidden">
                    {/* Subtle background glow for top 3 */}
                    {idx === 0 && <div className="absolute -right-10 -top-10 w-32 h-32 bg-amber-100 rounded-full blur-3xl pointer-events-none opacity-50"></div>}
                    {idx === 1 && <div className="absolute -right-10 -top-10 w-32 h-32 bg-slate-100 rounded-full blur-3xl pointer-events-none opacity-50"></div>}
                    {idx === 2 && <div className="absolute -right-10 -top-10 w-32 h-32 bg-orange-100 rounded-full blur-3xl pointer-events-none opacity-50"></div>}

                    <div className={`relative z-10 w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl shrink-0 shadow-sm ${
                      idx === 0 ? 'bg-gradient-to-br from-amber-300 to-amber-500 text-white shadow-amber-500/30 ring-2 ring-amber-200/50' :
                      idx === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-white shadow-slate-500/30 ring-2 ring-slate-200/50' :
                      idx === 2 ? 'bg-gradient-to-br from-orange-300 to-orange-500 text-white shadow-orange-500/30 ring-2 ring-orange-200/50' :
                      'bg-slate-50 dark:bg-slate-900/50 text-slate-400 border border-slate-200 dark:border-slate-700'
                    }`}>
                      {idx === 0 ? <FiAward size={26} /> :
                       idx === 1 ? <FiAward size={26} /> :
                       idx === 2 ? <FiAward size={26} /> :
                       <span className="text-xl">#{idx + 1}</span>}
                    </div>
                    
                    <div className="relative z-10 w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden shrink-0 bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-slate-800 shadow-md ring-2 ring-slate-100 dark:ring-slate-700">
                      {user.profile_picture ? (
                        <img src={`${import.meta.env.VITE_API_BASE_URL}${user.profile_picture}`} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-indigo-50 flex items-center justify-center text-indigo-500 font-black text-lg uppercase">
                          {user.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    
                    <div className="relative z-10 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-base font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-primary-600 transition-colors">{user.name}</p>
                        {user.id === currentUser?.id && <span className="text-[9px] font-black uppercase tracking-widest text-white bg-primary-500 shadow-sm shadow-primary-500/30 px-2 py-0.5 rounded-full shrink-0">You</span>}
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 truncate mt-0.5 uppercase tracking-wider">Staff Member</p>
                    </div>
                    
                    <div className="relative z-10 shrink-0 text-right bg-slate-50 dark:bg-slate-900/50 px-4 py-2 rounded-2xl border border-slate-100 dark:border-slate-700 group-hover:bg-white dark:group-hover:bg-slate-700 group-hover:border-slate-200 dark:group-hover:border-slate-600 transition-colors">
                      <p className={`text-xl font-black font-mono leading-none tracking-tight ${leaderboardTab === 'attendance' ? 'text-emerald-500' : leaderboardTab === 'in_review' ? 'text-amber-500' : 'text-blue-500'}`}>{user.score}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">{leaderboardTab === 'attendance' ? 'Worked' : 'Tasks'}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <FiStar size={36} className="text-slate-300" strokeWidth={2} />
                </div>
                <p className="text-base font-black text-slate-600 dark:text-slate-400">No records yet</p>
                <p className="text-xs font-medium text-slate-400 mt-1 max-w-[200px]">Data will appear here once tasks are completed.</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity/Tasks List (Moved to the right/second) */}
        <div className="xl:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-primary-50 dark:bg-primary-500/20 text-primary-600 flex items-center justify-center">
                <FiList size={16} />
              </span>
              My Active Tasks
            </h3>
            <button 
              onClick={() => navigate('/tasks')}
              className="text-xs font-bold uppercase tracking-widest text-primary-600 hover:text-primary-700 hover:bg-primary-50 px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5"
            >
              View Board <FiArrowRight />
            </button>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden flex-1 flex flex-col">
            {activeTasks.length > 0 ? (
              <div className="p-4 grid grid-cols-1 gap-3">
                {activeTasks.map(task => (
                  <div key={task.id} className="p-5 bg-slate-50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-700 rounded-2xl border border-transparent hover:border-slate-200 dark:hover:border-slate-600 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer group shadow-sm hover:shadow-md" onClick={() => navigate('/tasks', { state: { activeTab: task.status } })}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-primary-600 dark:text-primary-400 bg-primary-100/50 dark:bg-primary-900/30 px-2.5 py-1 rounded-md border border-primary-200/50 dark:border-primary-800/50">{task.category}</span>
                      </div>
                      <p className="font-bold text-slate-800 dark:text-slate-100 text-lg group-hover:text-primary-600 transition-colors truncate">{task.title}</p>
                    </div>
                    <div className="shrink-0 flex items-center">
                      <span className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl border flex items-center justify-center min-w-[120px] shadow-sm ${
                        task.status === 'In Progress' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200/50 dark:border-blue-800/50' :
                        task.status === 'Rejected' ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border-rose-200/50 dark:border-rose-800/50' :
                        'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700/50'
                      }`}>
                        {task.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-500">
                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900/50 rounded-3xl flex items-center justify-center mx-auto mb-5 text-slate-300 shadow-inner">
                  <FiCheckCircle size={36} strokeWidth={2} />
                </div>
                <p className="text-lg font-black text-slate-700 dark:text-slate-300 mb-1">No active tasks!</p>
                <p className="text-sm font-medium text-slate-400 max-w-xs">You're all caught up for now. Enjoy your free time or check the board for new assignments.</p>
              </div>
            )}
          </div>
        </div>

      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes wave {
          0% { transform: rotate(0.0deg) }
          10% { transform: rotate(14.0deg) }
          20% { transform: rotate(-8.0deg) }
          30% { transform: rotate(14.0deg) }
          40% { transform: rotate(-4.0deg) }
          50% { transform: rotate(10.0deg) }
          60% { transform: rotate(0.0deg) }
          100% { transform: rotate(0.0deg) }
        }
        .animate-wave {
          animation: wave 2.5s infinite;
        }
      `}} />
    </div>
  );
}

export default Dashboard;

