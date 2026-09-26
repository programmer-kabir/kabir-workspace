import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext';
import {
  FiUsers, FiCheckCircle, FiClock, FiAlertCircle,
  FiRefreshCw, FiStar, FiChevronRight, FiList, FiEye, FiActivity,
  FiTrendingUp, FiArrowUpRight, FiZap
} from 'react-icons/fi';
import { motion } from 'framer-motion';
import ActivityHeatmap from '../components/ActivityHeatmap';
import AnimatedCounter from '../components/AnimatedCounter';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const StatCard = ({ icon: Icon, label, value, sub, color = 'brand', onClick }) => {
  const colorSchemes = {
    brand: {
      border: 'border-brand-500/25 hover:border-brand-500/50',
      bg: 'bg-brand-500/10',
      iconBg: 'bg-brand-500/20 text-brand-400',
      glow: 'hover:shadow-[0_0_25px_rgba(99,102,241,0.18)]'
    },
    green: {
      border: 'border-emerald-500/25 hover:border-emerald-500/50',
      bg: 'bg-emerald-500/10',
      iconBg: 'bg-emerald-500/20 text-emerald-400',
      glow: 'hover:shadow-[0_0_25px_rgba(16,185,129,0.18)]'
    },
    purple: {
      border: 'border-purple-500/25 hover:border-purple-500/50',
      bg: 'bg-purple-500/10',
      iconBg: 'bg-purple-500/20 text-purple-400',
      glow: 'hover:shadow-[0_0_25px_rgba(168,85,247,0.18)]'
    },
    yellow: {
      border: 'border-amber-500/25 hover:border-amber-500/50',
      bg: 'bg-amber-500/10',
      iconBg: 'bg-amber-500/20 text-amber-400',
      glow: 'hover:shadow-[0_0_25px_rgba(245,158,11,0.18)]'
    },
  };

  const scheme = colorSchemes[color] || colorSchemes.brand;

  return (
    <motion.div
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`glass-card p-5 border ${scheme.border} ${scheme.glow} transition-all duration-300 relative overflow-hidden group cursor-pointer`}
    >
      <div className="flex items-start justify-between">
        <div className={`p-3 rounded-xl ${scheme.iconBg} transition-transform duration-300 group-hover:scale-110 shadow-sm`}>
          <Icon size={20} />
        </div>
        {sub && (
          <span className="flex items-center gap-0.5 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
            {sub}
          </span>
        )}
      </div>

      <div className="mt-4">
        <p className="text-white/50 text-xs font-semibold uppercase tracking-wider">{label}</p>
        <div className="flex items-baseline justify-between mt-1">
          <p className="text-white text-3xl font-black tracking-tight">
            <AnimatedCounter value={value} />
          </p>
          <FiArrowUpRight className="text-white/20 group-hover:text-brand-400 transition-colors" size={16} />
        </div>
      </div>
    </motion.div>
  );
};

const Dashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('all_time');

  useEffect(() => {
    const uid = currentUser?.id;
    if (!uid) return;
    setLoading(true);
    Promise.all([
      axios.get(`${API_BASE}api/reviewer/get_team_stats.php?reviewer_user_id=${uid}&time_filter=${timeFilter}`),
      axios.get(`${API_BASE}api/reviewer/get_my_team.php?reviewer_user_id=${uid}`),
    ]).then(([sRes, tRes]) => {
      if (sRes.data.status === 'success') setStats(sRes.data);
      if (tRes.data.status === 'success') setTeam(tRes.data.data || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, [currentUser, timeFilter]);

  if (loading) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-12 bg-white/5 rounded-2xl w-1/4 mb-4"></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-32 bg-white/5 rounded-2xl border border-white/5"></div>
        ))}
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-72 bg-white/5 rounded-2xl border border-white/5"></div>
        <div className="h-72 bg-white/5 rounded-2xl border border-white/5"></div>
      </div>
    </div>
  );

  const tp = stats?.top_performer;

  const chartData = [
    { name: 'Completed', value: parseInt(stats?.completed) || 0, color: '#10b981' },
    { name: 'In Review', value: parseInt(stats?.in_review) || 0, color: '#8b5cf6' },
    { name: 'In Progress', value: parseInt(stats?.in_progress) || 0, color: '#3b82f6' },
    { name: 'To-Do', value: parseInt(stats?.todo) || 0, color: '#64748b' }
  ];
  const totalChartTasks = chartData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
              Welcome back, <span className="bg-gradient-to-r from-brand-400 to-indigo-400 bg-clip-text text-transparent">{currentUser?.name?.split(' ')[0]}</span>
            </h1>
            <span className="text-xl animate-bounce">👋</span>
          </div>
          <p className="text-white/50 text-xs lg:text-sm mt-1 font-medium">
            Monitor submissions, manage team performance, and expedite quality reviews.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/pending')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 via-brand-500 to-indigo-600 !text-white font-bold text-xs shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
          >
            <FiEye size={15} className="text-white shrink-0" />
            <span className="text-white font-bold">Open Review Queue</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={FiUsers}
          label="Assigned Team"
          value={stats?.team_count ?? 0}
          color="brand"
          onClick={() => navigate('/team')}
        />
        <StatCard
          icon={FiCheckCircle}
          label="Completed Tasks"
          value={stats?.completed ?? 0}
          sub={`${stats?.completion_rate ?? 0}% rate`}
          color="green"
          onClick={() => navigate('/completed')}
        />
        <StatCard
          icon={FiEye}
          label="Pending In Review"
          value={stats?.in_review ?? 0}
          sub="Action needed"
          color="purple"
          onClick={() => navigate('/pending')}
        />
        <StatCard
          icon={FiClock}
          label="Tasks In Progress"
          value={stats?.in_progress ?? 0}
          color="yellow"
          onClick={() => navigate('/pending')}
        />
      </div>

      {/* Middle Section: Task Breakdown + Top Performer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Breakdown Chart */}
        <div className="lg:col-span-2 glass-card p-6 border border-white/5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-brand-500/10 text-brand-400">
                <FiList size={16} />
              </div>
              <h2 className="text-white font-bold text-sm tracking-tight">Team Task Distribution</h2>
            </div>
            
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="bg-white/5 border border-white/10 text-white/80 rounded-xl px-3 py-1.5 text-xs font-semibold outline-none focus:border-brand-500/50 cursor-pointer transition-colors"
            >
              <option value="all_time" className="bg-dark-900 text-white">All-Time</option>
              <option value="monthly" className="bg-dark-900 text-white">This Month</option>
              <option value="weekly" className="bg-dark-900 text-white">This Week</option>
              <option value="daily" className="bg-dark-900 text-white">Today</option>
            </select>
          </div>

          {totalChartTasks > 0 ? (
            <div className="flex-1 flex flex-col md:flex-row items-center justify-around gap-6 my-4">
              {/* Donut Chart */}
              <div className="w-48 h-48 relative shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData.filter(d => d.value > 0)}
                      innerRadius={62}
                      outerRadius={84}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {chartData.filter(d => d.value > 0).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                      }}
                      itemStyle={{ color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Counter */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-black text-white">{totalChartTasks}</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-white/40">Total Tasks</span>
                </div>
              </div>

              {/* Legend Badges */}
              <div className="grid grid-cols-2 gap-3 w-full md:w-auto">
                {chartData.map((entry) => {
                  const pct = totalChartTasks > 0 ? Math.round((entry.value / totalChartTasks) * 100) : 0;
                  return (
                    <div key={entry.name} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5">
                      <div className="w-3.5 h-3.5 rounded-md shrink-0 shadow-xs" style={{ backgroundColor: entry.color }} />
                      <div>
                        <p className="text-white/60 text-[11px] font-semibold">{entry.name}</p>
                        <p className="text-white font-black text-sm">
                          {entry.value} <span className="text-white/30 text-xs font-normal">({pct}%)</span>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-12 text-white/30">
              <FiList size={32} className="mb-2 opacity-40" />
              <p className="text-xs">No task distribution data for this period.</p>
            </div>
          )}
        </div>

        {/* Top Performer Card */}
        <div className="glass-card p-6 border border-amber-500/25 bg-gradient-to-br from-amber-500/10 via-transparent to-transparent flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                <FiStar size={16} />
              </div>
              <h2 className="text-white font-bold text-sm tracking-tight">Top Performer</h2>
            </div>
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
              Monthly MVP
            </span>
          </div>

          {tp ? (
            <div
              className="flex flex-col items-center text-center cursor-pointer group py-2"
              onClick={() => navigate(`/review/${tp.user_id}`)}
            >
              <div className="relative mb-3 flex items-center justify-center">
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-2xl drop-shadow-md z-10">👑</span>
                <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 ring-4 ring-amber-400/20 shadow-xl group-hover:scale-105 transition-transform duration-300">
                  <div className="w-full h-full rounded-full overflow-hidden bg-white dark:bg-dark-800 flex items-center justify-center">
                    {tp.profile_picture ? (
                      <img
                        src={`${API_BASE}${tp.profile_picture}`}
                        className="w-full h-full object-cover"
                        alt={tp.name}
                      />
                    ) : (
                      <span className="text-2xl font-black text-amber-500 dark:text-amber-400">
                        {tp.name?.[0]}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <p className="text-white font-black text-base group-hover:text-amber-400 transition-colors">{tp.name}</p>
              <div className="mt-2 flex items-center gap-1.5 justify-center">
                <span className="text-amber-400 text-3xl font-black">{tp.score}</span>
                <span className="text-amber-400/50 text-sm font-semibold">/100</span>
              </div>
              <div className="flex items-center gap-2 justify-center mt-1">
                <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  ⭐ {tp.avg_rating || 5.0} / 5.0
                </span>
                <span className="text-white/40 text-xs font-semibold">{tp.completed}/{tp.total} tasks</span>
              </div>

              <div className="mt-4 flex items-center gap-1 text-xs font-bold text-brand-400 group-hover:underline">
                <span>Inspect Performance</span>
                <FiChevronRight size={14} />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-10 text-white/30">
              <FiStar size={32} className="mb-2 opacity-40" />
              <p className="text-xs">No task score data this month yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Row 3: Insights Trackers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6 border border-brand-500/20 bg-gradient-to-br from-brand-500/10 via-transparent to-transparent relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-brand-500/20 text-brand-400">
                <FiActivity size={16} />
              </div>
              <div>
                <h2 className="text-white font-bold text-sm tracking-tight">Review Speed Tracker</h2>
                <p className="text-white/40 text-[11px] font-medium">Average turnaround time per submission</p>
              </div>
            </div>
            <span className="text-emerald-400 text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full flex items-center gap-1">
              <FiTrendingUp size={12} /> 2.5m faster
            </span>
          </div>

          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-white tracking-tight">14</span>
              <span className="text-white/40 font-bold text-sm">min</span>
              <span className="text-4xl font-black text-white tracking-tight ml-2">30</span>
              <span className="text-white/40 font-bold text-sm">sec</span>
            </div>
            
            <div className="mt-4">
              <div className="flex justify-between text-[11px] text-white/60 mb-1.5 font-bold">
                <span>Pacing Index</span>
                <span className="text-brand-400 font-mono">Target: 10m</span>
              </div>
              <div className="h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                <div className="h-full bg-gradient-to-r from-brand-500 to-indigo-400 rounded-full shadow-[0_0_12px_rgba(99,102,241,0.5)]" style={{ width: '68%' }} />
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card p-6 border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                <FiCheckCircle size={16} />
              </div>
              <div>
                <h2 className="text-white font-bold text-sm tracking-tight">First-Pass Approval Rate</h2>
                <p className="text-white/40 text-[11px] font-medium">Submissions approved without revision cycles</p>
              </div>
            </div>
            <span className="text-emerald-400 text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full flex items-center gap-1">
              <FiTrendingUp size={12} /> +5.2%
            </span>
          </div>

          <div className="mt-4">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-white tracking-tight">78.4</span>
              <span className="text-white/40 font-bold text-sm">%</span>
            </div>

            <div className="mt-4">
              <div className="flex justify-between text-[11px] text-white/60 mb-1.5 font-bold">
                <span>Quality Benchmark</span>
                <span className="text-emerald-400 font-mono">Target: 85%</span>
              </div>
              <div className="h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.5)]" style={{ width: '78.4%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Heatmap */}
      <div className="glass-card p-6 border border-white/5">
        <ActivityHeatmap />
      </div>

      {/* Team Roster Section */}
      <div className="glass-card p-6 border border-white/5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-brand-500/10 text-brand-400">
              <FiUsers size={16} />
            </div>
            <div>
              <h2 className="text-white font-bold text-sm tracking-tight">Supervised Team Roster</h2>
              <p className="text-white/40 text-[11px] font-medium">Quick access to individual team profiles and scores</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/team')}
            className="text-brand-400 text-xs font-bold hover:text-brand-300 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>View All Members</span>
            <FiChevronRight size={14} />
          </button>
        </div>

        {team.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-white/30">
            <FiAlertCircle size={32} className="mb-2 opacity-50" />
            <p className="text-xs font-semibold">No team members assigned to your review queue.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {team.slice(0, 8).map(m => (
              <motion.button
                key={m.user_id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`/review/${m.user_id}`)}
                className="flex items-center gap-3 p-3.5 rounded-xl bg-white/5 border border-white/5 hover:border-brand-500/30 hover:bg-white/[0.08] transition-all text-left group cursor-pointer"
              >
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-xl bg-brand-500/20 border border-brand-500/30 overflow-hidden flex items-center justify-center">
                    {m.profile_picture ? (
                      <img src={`${API_BASE}${m.profile_picture}`} className="w-full h-full object-cover" alt={m.name} />
                    ) : (
                      <span className="text-brand-300 font-bold text-sm">{m.name?.[0]}</span>
                    )}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-white text-xs font-bold truncate group-hover:text-brand-400 transition-colors">
                    {m.name}
                  </p>
                  <p className="text-white/40 text-[11px] truncate mt-0.5">
                    {m.designation || m.department_name || 'Staff Member'}
                  </p>
                </div>
                <FiChevronRight size={14} className="text-white/20 group-hover:text-brand-400 transition-colors shrink-0" />
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
