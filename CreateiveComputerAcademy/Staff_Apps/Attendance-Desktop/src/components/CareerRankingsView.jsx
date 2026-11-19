import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FiAward, FiZap, FiShield, FiClock, FiStar, FiCheckCircle,
  FiLock, FiTrendingUp, FiRefreshCw, FiChevronRight,
  FiCalendar, FiSun, FiHeart, FiUsers
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { getApiBase } from '../utils/api';
import { toast } from 'sonner';

const TIER_COLORS = {
  bronze: {
    bg: 'from-amber-600/10 to-amber-800/20 dark:from-amber-700/20 dark:to-amber-900/40',
    border: 'border-amber-500/30 dark:border-amber-700/50',
    text: 'text-amber-700 dark:text-amber-400',
    badge: 'bg-amber-50 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-300 dark:border-amber-700'
  },
  silver: {
    bg: 'from-slate-400/10 to-slate-600/20 dark:from-slate-400/20 dark:to-slate-600/40',
    border: 'border-slate-400/40 dark:border-slate-400/50',
    text: 'text-slate-700 dark:text-slate-300',
    badge: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-600'
  },
  gold: {
    bg: 'from-amber-400/10 to-yellow-600/20 dark:from-amber-400/20 dark:to-yellow-600/40',
    border: 'border-amber-400/40 dark:border-amber-400/50',
    text: 'text-amber-600 dark:text-amber-400',
    badge: 'bg-yellow-50 text-amber-900 dark:bg-yellow-950/40 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700'
  },
  legend: {
    bg: 'from-purple-500/10 via-indigo-500/20 to-pink-500/20 dark:from-purple-500/20 dark:via-indigo-500/30 dark:to-pink-500/30',
    border: 'border-purple-400/40 dark:border-purple-500/50',
    text: 'text-purple-600 dark:text-purple-400',
    badge: 'bg-purple-50 text-purple-900 dark:bg-purple-950/40 dark:text-purple-300 border-purple-300 dark:border-purple-700'
  }
};

const getBadgeIcon = (iconName) => {
  switch (iconName) {
    case 'zap': return <FiZap size={22} />;
    case 'shield': return <FiShield size={22} />;
    case 'clock': return <FiClock size={22} />;
    case 'sun': return <FiSun size={22} />;
    case 'heart': return <FiHeart size={22} />;
    case 'star': return <FiStar size={22} />;
    case 'award': return <FiAward size={22} />;
    case 'check-circle': return <FiCheckCircle size={22} />;
    default: return <FiStar size={22} />;
  }
};

export default function CareerRankingsView() {
  const { currentUser } = useAuth();
  const [careerData, setCareerData] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('badges'); // 'badges', 'leaderboard', 'history'

  const apiBase = (getApiBase() || '').replace(/\/+$/, '') + '/';

  const fetchData = async () => {
    if (!currentUser?.id) return;
    setLoading(true);
    try {
      const [careerRes, leaderRes] = await Promise.all([
        axios.get(`${apiBase}api/gamification/get_my_career.php?user_id=${currentUser.id}`),
        axios.get(`${apiBase}api/gamification/get_leaderboard.php?limit=15`)
      ]);

      if (careerRes.data?.status === 'success') {
        setCareerData(careerRes.data.data);
      }
      if (leaderRes.data?.status === 'success') {
        setLeaderboard(leaderRes.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load career data', err);
      toast.error('Network error loading career data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser?.id]);

  const levelInfo = careerData?.level_info || {
    level: 1,
    title: 'Bronze Associate 🥉',
    tier: 'bronze',
    perk: 'Starter Badge',
    current_xp: 0,
    level_next_xp: 100,
    xp_needed: 100,
    progress_pct: 0
  };

  const tierStyle = TIER_COLORS[levelInfo.tier] || TIER_COLORS.bronze;

  const getFullImg = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${apiBase}${path.replace(/^\/+/, '')}`;
  };

  return (
    <div className="mx-auto space-y-8 animate-in fade-in duration-300">
      {/* ── Top Hero: Level & Rank HUD (White & Dark Mode adaptive) ── */}
      <div className={`relative overflow-hidden rounded-3xl p-6 sm:p-10 text-slate-900 dark:text-white shadow-xl dark:shadow-2xl bg-gradient-to-br from-white via-indigo-50/40 to-slate-50 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900 border border-slate-200/90 dark:border-slate-800 transition-colors duration-300`}>
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          {/* Left: User Identity & Level Title */}
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-white/10 text-indigo-700 dark:text-indigo-200 text-xs font-bold uppercase tracking-wider backdrop-blur-md border border-indigo-200/80 dark:border-white/10">
              <span className="text-amber-500">👑</span>
              <span>CCA Staff Career System</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                <div className={`w-20 h-20 rounded-2xl p-1 bg-gradient-to-tr ${tierStyle.bg} border-2 ${tierStyle.border} shadow-lg flex items-center justify-center text-3xl font-black`}>
                  {careerData?.profile_picture ? (
                    <img
                      src={getFullImg(careerData.profile_picture)}
                      alt="Avatar"
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <span>⭐</span>
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[11px] font-black uppercase shadow-md">
                  Lv.{levelInfo.level}
                </div>
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                  {careerData?.name || currentUser?.name || 'Staff Member'}
                </h1>
                <p className={`text-base sm:text-lg font-bold ${tierStyle.text} flex items-center gap-2`}>
                  {levelInfo.title}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Unlocked Perk: <span className="text-slate-800 dark:text-slate-200 font-semibold">{levelInfo.perk}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Right: Quick Stats Capsule */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-4 bg-white/90 dark:bg-white/5 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-slate-200/90 dark:border-white/10 shadow-lg dark:shadow-xl">
            {/* Total XP */}
            <div className="text-center px-4 py-2 border-r border-slate-200/80 dark:border-white/10">
              <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
                {careerData?.total_xp || 0}
              </div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-0.5">Total XP</div>
            </div>

            {/* Streak */}
            <div className="text-center px-4 py-2 border-r border-slate-200/80 dark:border-white/10">
              <div className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 flex items-center justify-center gap-1">
                <span>🔥</span>
                <span>{careerData?.current_streak || 0}</span>
              </div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-0.5">Days Streak</div>
            </div>

            {/* Badges */}
            <div className="text-center px-4 py-2">
              <div className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400 flex items-center justify-center gap-1">
                <FiAward size={24} />
                <span>{careerData?.badges_unlocked_count || 0}/{careerData?.badges_total_count || 8}</span>
              </div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-0.5">Medals</div>
            </div>

            <button
              onClick={fetchData}
              disabled={loading}
              className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-white transition backdrop-blur-md ml-auto border border-slate-200 dark:border-white/10"
              title="Refresh Career Profile"
            >
              <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* ── Level Progress Bar ── */}
        <div className="mt-8 pt-6 border-t border-slate-200/80 dark:border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-600 dark:text-slate-300">
              Level {levelInfo.level} Progress: <span className="text-slate-900 dark:text-white">{levelInfo.progress_pct}%</span>
            </span>
            <span className="text-slate-500 dark:text-slate-400">
              {levelInfo.xp_needed > 0
                ? `${levelInfo.xp_needed} XP needed to reach Level ${levelInfo.level + 1}`
                : 'Max Level Reached 👑'}
            </span>
          </div>

          <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800/80 p-0.5 border border-slate-200 dark:border-white/10 overflow-hidden relative shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-amber-400 to-emerald-400 transition-all duration-700 shadow-md shadow-indigo-500/30"
              style={{ width: `${Math.max(5, levelInfo.progress_pct)}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('badges')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all ${
            activeTab === 'badges'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FiAward size={16} />
          My Badges & Medals ({careerData?.badges_unlocked_count || 0})
        </button>

        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all ${
            activeTab === 'leaderboard'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FiUsers size={16} />
          Academy Hall of Fame 🏆
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all ${
            activeTab === 'history'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FiTrendingUp size={16} />
          XP Activity Ledger ⚡
        </button>
      </div>

      {/* ── TAB 1: Badges & Medals Grid ── */}
      {activeTab === 'badges' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {careerData?.badges?.map((badge) => {
            const isUnlocked = badge.is_unlocked;
            const bTier = TIER_COLORS[badge.tier] || TIER_COLORS.bronze;

            return (
              <div
                key={badge.key}
                className={`relative rounded-3xl p-5 border transition-all duration-300 flex flex-col justify-between ${
                  isUnlocked
                    ? `bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-md hover:-translate-y-1 hover:shadow-xl`
                    : 'bg-slate-50/70 dark:bg-slate-900/40 border-dashed border-slate-300 dark:border-slate-800 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                      isUnlocked
                        ? `bg-gradient-to-tr ${bTier.bg} ${bTier.text} border ${bTier.border} shadow-md`
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                    }`}>
                      {isUnlocked ? getBadgeIcon(badge.icon) : <FiLock size={20} />}
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${bTier.badge}`}>
                      {badge.tier}
                    </span>
                  </div>

                  <h3 className={`text-base font-bold ${isUnlocked ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                    {badge.title}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {badge.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] font-semibold flex items-center justify-between">
                  {isUnlocked ? (
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-bold">
                      <FiCheckCircle size={13} /> Unlocked
                    </span>
                  ) : (
                    <span className="text-slate-400 flex items-center gap-1">
                      <FiLock size={12} /> {badge.criteria}
                    </span>
                  )}
                  {badge.unlocked_at && (
                    <span className="text-slate-400 text-[10px]">
                      {new Date(badge.unlocked_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── TAB 2: Leaderboard & Hall of Fame ── */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-6">
          {/* Podium for Top 3 */}
          {leaderboard.length >= 3 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              {/* 2nd Place */}
              <div className="order-2 md:order-1 bg-gradient-to-b from-slate-100 to-white dark:from-slate-800/80 dark:to-slate-900 p-6 rounded-3xl border border-slate-300 dark:border-slate-700 shadow-md text-center flex flex-col items-center justify-center space-y-2 relative">
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-black text-sm flex items-center justify-center shadow">
                  #2
                </div>
                <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-slate-400 shadow-lg">
                  {leaderboard[1]?.profile_picture ? (
                    <img src={getFullImg(leaderboard[1].profile_picture)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-xl">🥈</div>
                  )}
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white truncate max-w-[180px]">{leaderboard[1]?.name}</h4>
                <span className="text-xs font-semibold text-slate-500">{leaderboard[1]?.rank_title}</span>
                <span className="text-lg font-black text-slate-700 dark:text-slate-300">{leaderboard[1]?.xp} XP</span>
              </div>

              {/* 1st Place (Champion) */}
              <div className="order-1 md:order-2 bg-gradient-to-b from-amber-100 via-amber-50 to-white dark:from-amber-950/40 dark:via-slate-900 dark:to-slate-900 p-8 rounded-3xl border-2 border-amber-400 shadow-xl text-center flex flex-col items-center justify-center space-y-2 relative -translate-y-2">
                <div className="w-12 h-12 rounded-full bg-amber-400 text-amber-950 font-black text-base flex items-center justify-center shadow-lg">
                  👑 #1
                </div>
                <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-amber-400 shadow-xl">
                  {leaderboard[0]?.profile_picture ? (
                    <img src={getFullImg(leaderboard[0].profile_picture)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center text-2xl">🥇</div>
                  )}
                </div>
                <h4 className="text-lg font-black text-slate-900 dark:text-white truncate max-w-[200px]">{leaderboard[0]?.name}</h4>
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400">{leaderboard[0]?.rank_title}</span>
                <span className="text-2xl font-black text-amber-500">{leaderboard[0]?.xp} XP</span>
              </div>

              {/* 3rd Place */}
              <div className="order-3 bg-gradient-to-b from-amber-900/10 to-white dark:from-amber-950/20 dark:to-slate-900 p-6 rounded-3xl border border-amber-800/30 shadow-md text-center flex flex-col items-center justify-center space-y-2 relative">
                <div className="w-10 h-10 rounded-full bg-amber-800/20 text-amber-800 dark:text-amber-400 font-black text-sm flex items-center justify-center shadow">
                  #3
                </div>
                <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-amber-700 shadow-lg">
                  {leaderboard[2]?.profile_picture ? (
                    <img src={getFullImg(leaderboard[2].profile_picture)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center text-xl">🥉</div>
                  )}
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white truncate max-w-[180px]">{leaderboard[2]?.name}</h4>
                <span className="text-xs font-semibold text-slate-500">{leaderboard[2]?.rank_title}</span>
                <span className="text-lg font-black text-amber-700 dark:text-amber-400">{leaderboard[2]?.xp} XP</span>
              </div>
            </div>
          )}

          {/* Leaderboard Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <th className="p-4 pl-6">Rank</th>
                  <th className="p-4">Colleague</th>
                  <th className="p-4">Career Title</th>
                  <th className="p-4">Attendance Streak</th>
                  <th className="p-4">Medals</th>
                  <th className="p-4 pr-6 text-right">Total XP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {leaderboard.map((item) => (
                  <tr
                    key={item.user_id}
                    className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors ${
                      Number(item.user_id) === Number(currentUser?.id) ? 'bg-indigo-50/30 dark:bg-indigo-900/10 font-bold' : ''
                    }`}
                  >
                    <td className="p-4 pl-6 font-black text-slate-700 dark:text-slate-300">
                      #{item.rank}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-slate-500">
                          {item.profile_picture ? (
                            <img src={getFullImg(item.profile_picture)} alt="" className="w-full h-full object-cover" />
                          ) : (
                            item.name.charAt(0)
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            {item.name}
                            {Number(item.user_id) === Number(currentUser?.id) && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-600 text-white font-black uppercase">
                                You
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
                      {item.rank_title}
                    </td>
                    <td className="p-4 text-xs font-bold text-rose-500">
                      🔥 {item.current_streak} days
                    </td>
                    <td className="p-4 text-xs text-indigo-500 font-bold">
                      🏆 {item.badge_count}
                    </td>
                    <td className="p-4 pr-6 text-right font-black text-amber-500 text-base">
                      {item.xp} XP
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 3: XP Activity History ── */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FiTrendingUp className="text-indigo-500" />
            Recent XP Gains & Milestones
          </h3>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {careerData?.recent_xp?.length ? (
              careerData.recent_xp.map((log) => (
                <div key={log.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-black text-xs flex items-center justify-center">
                      +{log.amount}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {log.notes || log.action}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(log.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full">
                    +{log.amount} XP
                  </span>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                No recent activity recorded yet.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
