import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  FiAward, FiCheckCircle, FiXCircle, FiRefreshCw,
  FiCalendar, FiFilter, FiUser, FiClock, FiLayers,
  FiTrendingUp, FiArrowUpRight, FiStar
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

// Months reference
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Available years for selection
const AVAILABLE_YEARS = [2026, 2025, 2024, 2023];

// Score calculation formula: (Completion Rate × 50%) + (Quality Rating % × 50%) − Rejection Penalty (max 30)
const calcScore = (completed, total, rejected, avgRating = 5.0) => {
  if (total === 0) return 0;
  const rate = Math.round((completed / total) * 100);
  const qualityRate = Math.min(100, Math.round(((avgRating || 5.0) / 5.0) * 100));
  const penalty = Math.min(30, Math.round((rejected / total) * 30));
  return Math.max(0, Math.min(100, Math.round((rate * 0.50) + (qualityRate * 0.50) - penalty)));
};

const scoreColor = (s) =>
  s >= 80 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30 shadow-emerald-500/10'
  : s >= 60 ? 'text-amber-400 bg-amber-500/10 border-amber-500/30 shadow-amber-500/10'
  : s >= 40 ? 'text-orange-400 bg-orange-500/10 border-orange-500/30 shadow-orange-500/10'
  :           'text-rose-400 bg-rose-500/10 border-rose-500/30 shadow-rose-500/10';

const rankEmoji = (i) =>
  i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;

const Leaderboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [team, setTeam] = useState([]);
  const [scores, setScores] = useState({});
  const [loading, setLoading] = useState(true);

  // Filter States
  const now = new Date();
  const [filterType, setFilterType] = useState('this_month');
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  
  // Custom Date inputs
  const [customStart, setCustomStart] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [customEnd, setCustomEnd] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });

  // Calculate active date range
  const activeDateRange = useMemo(() => {
    const currentYear = now.getFullYear();
    const currentMonthIndex = now.getMonth();
    const todayStr = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    if (filterType === 'this_month') {
      const start = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}-01`;
      return {
        start,
        end: todayStr,
        label: `This Month (${MONTH_NAMES[currentMonthIndex]} ${currentYear})`
      };
    }

    if (filterType === 'last_month') {
      const lastMonthDate = new Date(currentYear, currentMonthIndex - 1, 1);
      const lastMonthYear = lastMonthDate.getFullYear();
      const lastMonthIndex = lastMonthDate.getMonth();
      const lastDayOfLastMonth = new Date(lastMonthYear, lastMonthIndex + 1, 0).getDate();
      const start = `${lastMonthYear}-${String(lastMonthIndex + 1).padStart(2, '0')}-01`;
      const end = `${lastMonthYear}-${String(lastMonthIndex + 1).padStart(2, '0')}-${String(lastDayOfLastMonth).padStart(2, '0')}`;
      return {
        start,
        end,
        label: `Last Month (${MONTH_NAMES[lastMonthIndex]} ${lastMonthYear})`
      };
    }

    if (filterType === 'specific_month') {
      const y = parseInt(selectedYear) || currentYear;
      const m = parseInt(selectedMonth);
      const lastDay = new Date(y, m + 1, 0).getDate();
      const start = `${y}-${String(m + 1).padStart(2, '0')}-01`;
      const end = `${y}-${String(m + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      return {
        start,
        end,
        label: `${MONTH_NAMES[m]} ${y}`
      };
    }

    if (filterType === 'all_time') {
      return {
        start: '2023-01-01',
        end: todayStr,
        label: 'All-Time Cumulative'
      };
    }

    return {
      start: customStart,
      end: customEnd,
      label: `Custom (${customStart} to ${customEnd})`
    };
  }, [filterType, selectedYear, selectedMonth, customStart, customEnd]);

  // Fetch Team and their Scores
  const fetchLeaderboardData = useCallback(async () => {
    if (!currentUser?.id) return;
    setLoading(true);
    try {
      const teamRes = await axios.get(
        `${API_BASE}api/reviewer/get_my_team.php?reviewer_user_id=${currentUser.id}`
      );
      const members = teamRes.data?.data || [];
      setTeam(members);

      // Fetch score for each member concurrently using get_task_report.php
      const scorePromises = members.map(async (m) => {
        try {
          const res = await axios.post(
            `${API_BASE}api/reports/get_task_report.php`,
            {
              user_id: parseInt(m.user_id),
              start_date: activeDateRange.start,
              end_date: activeDateRange.end
            }
          );
          if (res.data?.status === 'success') {
            const s = res.data.summary || {};
            const completed = parseInt(s.total_completed) || 0;
            const total = parseInt(s.total_assigned) || 0;
            const rejected = parseInt(s.total_rejected) || 0;
            const resubmitted = parseInt(s.total_resubmitted) || 0;
            const delayed = parseInt(s.delayed_completions) || 0;
            const avgRating = s.avg_rating !== undefined ? Number(s.avg_rating) : 5.0;
            const score = calcScore(completed, total, rejected, avgRating);
            const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
            return {
              userId: m.user_id,
              score,
              completed,
              total,
              rejected,
              resubmitted,
              delayed,
              avgRating,
              rate
            };
          }
        } catch {
          // ignore error for single user
        }
        return {
          userId: m.user_id,
          score: 0,
          completed: 0,
          total: 0,
          rejected: 0,
          resubmitted: 0,
          delayed: 0,
          avgRating: 5.0,
          rate: 0
        };
      });

      const scoreResults = await Promise.all(scorePromises);
      const scoreMap = {};
      scoreResults.forEach((sr) => {
        scoreMap[sr.userId] = sr;
      });
      setScores(scoreMap);
    } catch (err) {
      console.error('Failed to load leaderboard data', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser, activeDateRange]);

  useEffect(() => {
    fetchLeaderboardData();
  }, [fetchLeaderboardData]);

  // Sort team members by score desc, then by avgRating desc, then completed desc
  const ranked = useMemo(() => {
    return [...team].sort((a, b) => {
      const sa = scores[a.user_id]?.score ?? 0;
      const sb = scores[b.user_id]?.score ?? 0;
      if (sb !== sa) return sb - sa;

      const ra = scores[a.user_id]?.avgRating ?? 0;
      const rb = scores[b.user_id]?.avgRating ?? 0;
      if (rb !== ra) return rb - ra;

      const ca = scores[a.user_id]?.completed ?? 0;
      const cb = scores[b.user_id]?.completed ?? 0;
      return cb - ca;
    });
  }, [team, scores]);

  // Aggregated totals
  const totals = useMemo(() => {
    let totalAssigned = 0;
    let totalCompleted = 0;
    let totalRejected = 0;
    Object.values(scores).forEach((s) => {
      totalAssigned += s.total || 0;
      totalCompleted += s.completed || 0;
      totalRejected += s.rejected || 0;
    });
    return { totalAssigned, totalCompleted, totalRejected };
  }, [scores]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/10">
              <FiAward size={24} />
            </div>
            <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
              Performance Leaderboard
            </h1>
          </div>
          <p className="text-white/50 text-xs lg:text-sm font-medium mt-1.5 flex items-center gap-2 flex-wrap">
            <span>Ranking for:</span>
            <span className="text-amber-400 font-bold">{activeDateRange.label}</span>
            <span className="text-white/30 text-xs hidden sm:inline">
              • (50% Completion + 50% Quality Stars − Rejection Penalty)
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={fetchLeaderboardData}
          disabled={loading}
          className="self-start md:self-auto px-4 py-2.5 rounded-xl glass-card hover:bg-white/10 text-white font-bold text-xs border border-white/10 shadow-sm flex items-center gap-2 transition-all cursor-pointer active:scale-95"
        >
          <FiRefreshCw size={14} className={loading ? 'animate-spin text-brand-400' : ''} />
          <span>Refresh Rankings</span>
        </button>
      </div>

      {/* Filter Tabs & Period Selector */}
      <div className="glass-card p-5 border border-white/5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 lg:pb-0">
            {[
              { id: 'this_month', label: 'This Month', icon: FiCalendar },
              { id: 'last_month', label: 'Last Month', icon: FiClock },
              { id: 'specific_month', label: 'Select Month', icon: FiLayers },
              { id: 'all_time', label: 'All-Time', icon: FiTrendingUp },
              { id: 'custom', label: 'Custom Range', icon: FiFilter },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setFilterType(id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  filterType === id
                    ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/25 ring-2 ring-brand-500/30'
                    : 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/5'
                }`}
              >
                <Icon size={14} />
                <span>{label}</span>
              </button>
            ))}
          </div>

          <div className="px-3.5 py-1.5 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-bold flex items-center gap-2 self-start lg:self-auto">
            <FiCalendar size={14} />
            <span>{activeDateRange.start} → {activeDateRange.end}</span>
          </div>
        </div>

        {/* Dynamic Month Pickers */}
        {filterType === 'specific_month' && (
          <div className="pt-3 border-t border-white/5 flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-white/60">Select Month & Year:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs font-bold text-white outline-none cursor-pointer"
            >
              {MONTH_NAMES.map((mName, idx) => (
                <option key={idx} value={idx} className="bg-dark-900 text-white">{mName}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs font-bold text-white outline-none cursor-pointer"
            >
              {AVAILABLE_YEARS.map((y) => (
                <option key={y} value={y} className="bg-dark-900 text-white">{y}</option>
              ))}
            </select>
          </div>
        )}

        {filterType === 'custom' && (
          <div className="pt-3 border-t border-white/5 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white/60">From:</span>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-1 text-xs font-bold text-white outline-none cursor-pointer"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white/60">To:</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-1 text-xs font-bold text-white outline-none cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Aggregated Totals Pill Bar */}
        <div className="pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-white/60">Members: <strong className="text-white">{team.length}</strong></span>
            <span className="text-white/20">•</span>
            <span className="text-white/60">Total Assigned: <strong className="text-white">{totals.totalAssigned}</strong></span>
            <span className="text-white/20">•</span>
            <span className="text-white/60">Completed: <strong className="text-emerald-400">{totals.totalCompleted}</strong></span>
            <span className="text-white/20">•</span>
            <span className="text-white/60">Rejected: <strong className="text-rose-400">{totals.totalRejected}</strong></span>
          </div>
          <span className="text-[11px] text-white/40 italic">Click any staff row to view full score inspection</span>
        </div>
      </div>

      {/* Leaderboard Cards List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 space-y-3 glass-card border border-white/5">
          <div className="w-10 h-10 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-white/40 uppercase tracking-wider">
            Loading team ranking...
          </p>
        </div>
      ) : ranked.length === 0 ? (
        <div className="glass-card p-16 text-center border border-white/5 text-white/40 space-y-2">
          <FiUser size={36} className="mx-auto text-white/30" />
          <h3 className="text-base font-bold text-white">No team members found</h3>
          <p className="text-xs">No team members are currently assigned to your review desk.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {ranked.map((m, i) => {
            const s = scores[m.user_id];
            const sc = s ? scoreColor(s.score) : 'text-white/40 bg-white/5 border-white/5';
            const isTop3 = i < 3;

            return (
              <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.03 }}
                key={m.user_id}
                onClick={() => navigate(`/review/${m.user_id}`)}
                className={`w-full glass-card p-4 sm:p-5 border transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer group hover:scale-[1.01] ${
                  isTop3
                    ? 'border-amber-500/30 hover:border-amber-500/60 bg-gradient-to-r from-amber-500/[0.04] via-transparent to-transparent'
                    : 'border-white/5 hover:border-brand-500/40'
                }`}
              >
                {/* Left: Rank, Avatar & Info */}
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 text-center shrink-0">
                    {rankEmoji(i) ? (
                      <span className="text-3xl drop-shadow-md">{rankEmoji(i)}</span>
                    ) : (
                      <span className="text-white/40 font-black text-sm sm:text-base">
                        #{i + 1}
                      </span>
                    )}
                  </div>

                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center shadow-xs group-hover:ring-2 group-hover:ring-brand-500/40 transition-all">
                    {m.profile_picture ? (
                      <img
                        src={`${API_BASE}${m.profile_picture}`}
                        className="w-full h-full object-cover"
                        alt={m.name}
                      />
                    ) : (
                      <span className="font-black text-brand-400 text-lg">
                        {m.name?.[0] || 'U'}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <p className="text-white font-black text-sm sm:text-base group-hover:text-brand-400 transition-colors truncate">
                        {m.name}
                      </p>
                      {i === 0 && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 shrink-0">
                          MVP
                        </span>
                      )}
                    </div>

                    <p className="text-white/50 text-xs truncate mt-0.5 font-semibold">
                      {m.designation || m.department_name || 'Creative Staff'}
                    </p>

                    {s && (
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[11px] text-white/50 font-medium">
                        <span className="flex items-center gap-1 text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/25">
                          ⭐ {s.avgRating} / 5.0
                        </span>
                        <span className="flex items-center gap-1">
                          <FiCheckCircle size={12} className="text-emerald-400" />
                          <strong className="text-white">{s.completed}/{s.total}</strong> done
                        </span>
                        <span className="flex items-center gap-1">
                          <FiXCircle size={12} className="text-rose-400" />
                          <strong className="text-white">{s.rejected}</strong> rejected
                        </span>
                        {s.resubmitted > 0 && (
                          <span className="flex items-center gap-1">
                            <FiRefreshCw size={11} className="text-amber-400" />
                            <span>{s.resubmitted} resubmitted</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Rate, Score & Action */}
                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                  {s && (
                    <div className="w-28 hidden md:block text-right">
                      <div className="flex justify-between text-[11px] font-bold text-white/50 mb-1">
                        <span>Rate:</span>
                        <span className="text-white">{s.rate}%</span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                        <div
                          className="h-full bg-emerald-400 rounded-full transition-all duration-700 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                          style={{ width: `${s.rate}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className={`w-16 h-14 rounded-2xl border flex flex-col items-center justify-center shadow-md shrink-0 ${sc}`}>
                    <span className="text-xl font-black leading-none tracking-tight">
                      {s?.score ?? 0}
                    </span>
                    <span className="text-[10px] font-bold opacity-70 mt-0.5">
                      / 100
                    </span>
                  </div>

                  <div className="w-8 h-8 rounded-xl bg-white/5 group-hover:bg-brand-500 text-white/40 group-hover:text-white flex items-center justify-center transition-all shrink-0">
                    <FiArrowUpRight size={16} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
