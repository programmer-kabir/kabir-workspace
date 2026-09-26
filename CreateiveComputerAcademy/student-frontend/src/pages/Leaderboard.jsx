import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import {
  FiAward, FiZap, FiTarget, FiTrendingUp, FiArrowRight,
  FiRefreshCw, FiUser, FiCheckCircle, FiShield, FiStar
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const Leaderboard = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('english'); // 'english' | 'bangla' | 'achievers'
  const [leaderboardData, setLeaderboardData] = useState({
    top_english_typists: [],
    top_bangla_typists: [],
    top_achievers: [],
    my_stats: null
  });
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const userParam = currentUser?.id ? `?user_id=${currentUser.id}` : '';
      const res = await axios.get(`${API_BASE}api/student/foundations/leaderboard.php${userParam}`);
      if (res.data?.status === 'success') {
        setLeaderboardData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [currentUser?.id]);

  // Current list based on active tab
  const currentList =
    activeTab === 'english'
      ? leaderboardData.top_english_typists || []
      : activeTab === 'bangla'
      ? leaderboardData.top_bangla_typists || []
      : leaderboardData.top_achievers || [];

  // Top 3 Podium
  const top1 = currentList[0];
  const top2 = currentList[1];
  const top3 = currentList[2];
  const restList = currentList.slice(3);

  // My stats for the active tab
  const myStat =
    activeTab === 'english'
      ? leaderboardData.my_stats?.english
      : activeTab === 'bangla'
      ? leaderboardData.my_stats?.bangla
      : leaderboardData.my_stats?.badges;

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 mx-auto animate-in fade-in duration-200">
      
      {/* ── TOP HERO BANNER: HALL OF FAME ──────────────────────────── */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-amber-950 via-purple-950 to-indigo-950 text-white shadow-xl relative overflow-hidden border border-amber-500/20">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 -mb-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-amber-200 text-xs font-black border border-white/10 shadow-xs">
              <span>🏆 CREATIVE COMPUTER ACADEMY</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black tracking-wider">
                HALL OF FAME
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white">
              Academy Leaderboard & Speed Champions
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
              Celebrate the fastest touch typists, highest accuracy scores, and top badge achievers. Practice daily to climb into the top ranks!
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <button
              onClick={fetchLeaderboard}
              className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md transition-all cursor-pointer shadow-xs"
              title="Refresh Leaderboard"
            >
              <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <Link
              to="/typing"
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:opacity-95 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/25 cursor-pointer transition-all flex items-center gap-2 active:scale-95"
            >
              <FiZap size={15} />
              <span>Practice & Climb Ranks</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── TAB SELECTOR ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-1.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <button
          onClick={() => setActiveTab('english')}
          className={`py-3 px-4 rounded-xl text-center sm:text-left transition-all cursor-pointer ${
            activeTab === 'english'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md font-black'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold'
          }`}
        >
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="text-base">⚡</span>
            <span className="text-xs sm:text-sm font-bold">English Speed Masters</span>
          </div>
          <p className={`text-[10px] mt-0.5 hidden sm:block ${activeTab === 'english' ? 'text-indigo-100' : 'text-slate-400'}`}>
            Top 10 Touch Typists by WPM
          </p>
        </button>

        <button
          onClick={() => setActiveTab('bangla')}
          className={`py-3 px-4 rounded-xl text-center sm:text-left transition-all cursor-pointer ${
            activeTab === 'bangla'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md font-black'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold'
          }`}
        >
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="text-base">🇧🇩</span>
            <span className="text-xs sm:text-sm font-bold">Bangla Speed Masters</span>
          </div>
          <p className={`text-[10px] mt-0.5 hidden sm:block ${activeTab === 'bangla' ? 'text-emerald-100' : 'text-slate-400'}`}>
            Avro & Bijoy Top Typists
          </p>
        </button>

        <button
          onClick={() => setActiveTab('achievers')}
          className={`py-3 px-4 rounded-xl text-center sm:text-left transition-all cursor-pointer ${
            activeTab === 'achievers'
              ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md font-black'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold'
          }`}
        >
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="text-base">🎖️</span>
            <span className="text-xs sm:text-sm font-bold">Academy Achievers</span>
          </div>
          <p className={`text-[10px] mt-0.5 hidden sm:block ${activeTab === 'achievers' ? 'text-slate-800 font-medium' : 'text-slate-400'}`}>
            Most Badges & Drills Unlocked
          </p>
        </button>
      </div>

      {/* ── PERSONAL STANDING BAR ───────────────────────────────────── */}
      {myStat && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-pink-950/20 border border-indigo-200 dark:border-indigo-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-lg font-black shadow-xs shrink-0">
              #{myStat.rank}
            </div>
            <div>
              <p className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Your Current Academy Standing:</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">
                  Rank #{myStat.rank}
                </span>
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {activeTab === 'achievers'
                  ? `You have unlocked ${myStat.badge_count} skill badges so far!`
                  : `Your Personal Best: ${myStat.best_wpm} WPM with ${myStat.avg_accuracy}% average accuracy.`}
              </p>
            </div>
          </div>

          <Link
            to="/typing"
            className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 self-start sm:self-auto shadow-2xs cursor-pointer"
          >
            <span>Take Speed Test</span>
            <FiArrowRight size={13} />
          </Link>
        </div>
      )}

      {/* ── THE PODIUM: TOP 3 CHAMPIONS ─────────────────────────────── */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 font-bold flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs">Loading Hall of Fame rankings...</p>
        </div>
      ) : currentList.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <span className="text-4xl">🏆</span>
          <h3 className="text-lg font-black text-slate-900 dark:text-white mt-2">No Records Yet</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Be the very first student to take a typing speed test and claim the #1 Champion spot on the leaderboard!
          </p>
          <Link
            to="/typing"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs"
          >
            <span>Start Practice Now</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Top 3 Visual Podium */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="text-center mb-6">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-400">
                Top 3 Podium Champions
              </h3>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-6 items-end max-w-2xl mx-auto pt-8">
              
              {/* 🥈 2nd Place: Silver */}
              <div className="flex flex-col items-center text-center">
                {top2 ? (
                  <>
                    <div className="relative mb-2">
                      <div className="w-14 sm:w-16 h-14 sm:h-16 rounded-2xl overflow-hidden border-2 border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 shadow-md flex items-center justify-center">
                        {top2.avatar ? (
                          <img src={`${API_BASE}${top2.avatar}`} alt={top2.student_name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xl font-black text-slate-500">{top2.student_name?.[0] || '2'}</span>
                        )}
                      </div>
                      <span className="absolute -top-3 -right-2 text-xl" title="2nd Place Silver">🥈</span>
                    </div>

                    <p className="font-black text-xs sm:text-sm text-slate-900 dark:text-white truncate max-w-[90px] sm:max-w-[130px]">
                      {top2.student_name}
                    </p>
                    <span className="text-[10px] font-mono text-slate-400">{top2.student_code}</span>

                    <div className="mt-1 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-black text-slate-700 dark:text-slate-300">
                      {activeTab === 'achievers' ? `${top2.badge_count} 🎖️` : `${top2.best_wpm} WPM`}
                    </div>

                    {/* Pedestal */}
                    <div className="w-full h-24 sm:h-28 mt-3 rounded-t-2xl bg-gradient-to-t from-slate-200 via-slate-100 to-slate-200 dark:from-slate-800 dark:via-slate-800/80 dark:to-slate-700/80 border-t-4 border-slate-300 dark:border-slate-600 flex items-center justify-center shadow-inner">
                      <span className="text-2xl sm:text-3xl font-black text-slate-400 dark:text-slate-500">2</span>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-24 rounded-t-2xl bg-slate-100 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-xs text-slate-400">
                    Empty
                  </div>
                )}
              </div>

              {/* 🥇 1st Place: Gold (Elevated Center) */}
              <div className="flex flex-col items-center text-center">
                {top1 ? (
                  <>
                    <div className="relative mb-2">
                      <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-3xl overflow-hidden border-4 border-amber-400 bg-amber-50 dark:bg-slate-800 shadow-xl shadow-amber-500/20 flex items-center justify-center">
                        {top1.avatar ? (
                          <img src={`${API_BASE}${top1.avatar}`} alt={top1.student_name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-2xl font-black text-amber-600">{top1.student_name?.[0] || '1'}</span>
                        )}
                      </div>
                      <span className="absolute -top-4 inset-x-0 mx-auto text-2xl animate-bounce" title="1st Place Champion">👑</span>
                    </div>

                    <p className="font-black text-xs sm:text-base text-slate-900 dark:text-white truncate max-w-[100px] sm:max-w-[150px]">
                      {top1.student_name}
                    </p>
                    <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-bold">{top1.student_code}</span>

                    <div className="mt-1 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 text-xs sm:text-sm font-black shadow-md shadow-amber-500/30">
                      {activeTab === 'achievers' ? `${top1.badge_count} Badges 🎖️` : `${top1.best_wpm} WPM ⚡`}
                    </div>

                    {/* Pedestal */}
                    <div className="w-full h-32 sm:h-36 mt-3 rounded-t-2xl bg-gradient-to-t from-amber-500/20 via-amber-400/20 to-amber-300/30 dark:from-amber-950/60 dark:via-amber-900/40 dark:to-amber-800/40 border-t-4 border-amber-400 flex items-center justify-center shadow-lg">
                      <span className="text-3xl sm:text-4xl font-black text-amber-500">1</span>
                    </div>
                  </>
                ) : null}
              </div>

              {/* 🥉 3rd Place: Bronze */}
              <div className="flex flex-col items-center text-center">
                {top3 ? (
                  <>
                    <div className="relative mb-2">
                      <div className="w-14 sm:w-16 h-14 sm:h-16 rounded-2xl overflow-hidden border-2 border-amber-700/60 bg-slate-100 dark:bg-slate-800 shadow-md flex items-center justify-center">
                        {top3.avatar ? (
                          <img src={`${API_BASE}${top3.avatar}`} alt={top3.student_name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xl font-black text-amber-700">{top3.student_name?.[0] || '3'}</span>
                        )}
                      </div>
                      <span className="absolute -top-3 -right-2 text-xl" title="3rd Place Bronze">🥉</span>
                    </div>

                    <p className="font-black text-xs sm:text-sm text-slate-900 dark:text-white truncate max-w-[90px] sm:max-w-[130px]">
                      {top3.student_name}
                    </p>
                    <span className="text-[10px] font-mono text-slate-400">{top3.student_code}</span>

                    <div className="mt-1 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-black text-amber-800 dark:text-amber-300">
                      {activeTab === 'achievers' ? `${top3.badge_count} 🎖️` : `${top3.best_wpm} WPM`}
                    </div>

                    {/* Pedestal */}
                    <div className="w-full h-20 sm:h-22 mt-3 rounded-t-2xl bg-gradient-to-t from-amber-900/20 via-amber-800/10 to-amber-700/20 dark:from-amber-950/40 dark:via-amber-900/20 dark:to-amber-800/20 border-t-4 border-amber-700/80 flex items-center justify-center shadow-inner">
                      <span className="text-2xl sm:text-3xl font-black text-amber-700 dark:text-amber-600">3</span>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-20 rounded-t-2xl bg-slate-100 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-xs text-slate-400">
                    Empty
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Full Top 10 Table */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4">
              Top 10 Rankings Overview
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-black uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-3">Rank</th>
                    <th className="py-3 px-4">Student</th>
                    {activeTab !== 'achievers' && (
                      <>
                        <th className="py-3 px-4 text-center">Best Speed</th>
                        <th className="py-3 px-4 text-center">Avg. Accuracy</th>
                        <th className="py-3 px-4 text-center">Tests Taken</th>
                      </>
                    )}
                    {activeTab === 'achievers' && (
                      <th className="py-3 px-4 text-center">Badges Earned</th>
                    )}
                    <th className="py-3 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs sm:text-sm">
                  {currentList.map((item, index) => {
                    const rank = index + 1;
                    const isMe = currentUser?.id === parseInt(item.user_id, 10);

                    return (
                      <tr
                        key={item.user_id}
                        className={`transition-colors ${
                          isMe
                            ? 'bg-indigo-50/60 dark:bg-indigo-950/30 font-semibold'
                            : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        {/* Rank Icon */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          {rank === 1 ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-amber-100 text-amber-700 text-xs font-black shadow-xs">
                              🥇 1
                            </span>
                          ) : rank === 2 ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-slate-100 text-slate-700 text-xs font-black shadow-xs">
                              🥈 2
                            </span>
                          ) : rank === 3 ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-amber-50 text-amber-800 text-xs font-black shadow-xs">
                              🥉 3
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 font-mono font-bold text-xs">
                              #{rank}
                            </span>
                          )}
                        </td>

                        {/* Student Name & Code */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center">
                              {item.avatar ? (
                                <img src={`${API_BASE}${item.avatar}`} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span className="font-bold text-xs text-slate-500">{item.student_name?.[0]}</span>
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900 dark:text-white">
                                  {item.student_name}
                                </span>
                                {isMe && (
                                  <span className="px-1.5 py-0.2 rounded bg-indigo-600 text-white text-[9px] font-black uppercase">
                                    YOU
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] font-mono text-slate-400">{item.student_code}</span>
                            </div>
                          </div>
                        </td>

                        {/* Metrics */}
                        {activeTab !== 'achievers' && (
                          <>
                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                              <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-sm">
                                {item.best_wpm} WPM
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                                {item.avg_accuracy}%
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center whitespace-nowrap text-slate-400 font-mono text-xs">
                              {item.test_count}
                            </td>
                          </>
                        )}

                        {activeTab === 'achievers' && (
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <span className="font-mono font-black text-amber-600 dark:text-amber-400 text-sm">
                              🏆 {item.badge_count} Badges
                            </span>
                          </td>
                        )}

                        {/* Status */}
                        <td className="py-3.5 px-3 text-right whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                            VERIFIED
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

export default Leaderboard;
