import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiX, FiAward, FiUsers, FiCalendar, FiClock, FiCheckCircle, FiRefreshCw } from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const SalahLeaderboardModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('team'); // 'team' | 'weekly' | 'monthly'
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}api/breaks/salah/get_salah_leaderboard.php?t=${Date.now()}`);
      if (res.data?.status === 'success') {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch salah leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLeaderboard();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const teamGoal = data?.today_team_goal;
  const starClub = data?.star_club_today || [];
  const weeklyLeaders = data?.weekly_leaders || [];
  const monthlyLeaders = data?.monthly_leaders || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-transparent border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-xl shadow-xs border border-emerald-500/30">
              🕌
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                <span>সলাত লিডারবোর্ড ও টিম গোল</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-black border border-emerald-300 dark:border-emerald-700/60">
                  সৎকাজে প্রতিযোগিতা
                </span>
              </h3>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                সেন্টারের সম্মিলিত স্কোর ও পুণ্যময় ধারাবাহিকতা
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-3 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('team')}
            className={`pb-2.5 px-3 text-xs font-extrabold border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'team'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <span>🕌</span>
            <span>আজকের টিম স্কোর</span>
            {starClub.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-black">
                ★ {starClub.length} স্টার
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('weekly')}
            className={`pb-2.5 px-3 text-xs font-extrabold border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'weekly'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <span>🏆</span>
            <span>সাপ্তাহিক সেরা</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('monthly')}
            className={`pb-2.5 px-3 text-xs font-extrabold border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'monthly'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <span>👑</span>
            <span>মাসিক ধারাবাহিকতা</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar flex-1">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2 text-xs">
              <FiRefreshCw className="animate-spin w-5 h-5 text-emerald-500" />
              <span>লিডারবোর্ড তথ্য লোড হচ্ছে...</span>
            </div>
          ) : activeTab === 'team' ? (
            <>
              {/* ── 1. Team Goal Card ── */}
              <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-emerald-500/5 border-2 border-emerald-400/60 dark:border-emerald-500/40 shadow-sm text-center relative overflow-hidden">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 text-xs font-black uppercase tracking-wider mb-2">
                  <FiUsers size={13} />
                  <span>সেন্টারের সম্মিলিত টিম স্কোর (আজকের দিন)</span>
                </div>

                <div className="my-2">
                  <div className="text-4xl sm:text-5xl font-black font-mono text-emerald-600 dark:text-emerald-400 tracking-tight">
                    {teamGoal?.percentage || 0}%
                  </div>
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-1">
                    আজ উপস্থিত স্টাফদের মোট লক্ষ্যমাত্রার মধ্যে <strong>{teamGoal?.prayed_waqts || 0} / {teamGoal?.target_waqts || 0}</strong> ওয়াক্ত আদায় সম্পন্ন হয়েছে।
                  </p>
                </div>

                {/* Progress bar */}
                <div className="w-full max-w-md mx-auto h-3 rounded-full bg-slate-200 dark:bg-slate-700/80 overflow-hidden shadow-inner my-3">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-700"
                    style={{ width: `${teamGoal?.percentage || 0}%` }}
                  />
                </div>

                <p className="text-[11px] text-emerald-700 dark:text-emerald-300/90 italic">
                  💡 আসুন আমরা একে অপরকে জামাতের জন্য আহ্বান করি এবং সেন্টারের সম্মিলিত স্কোর শতভাগে নিয়ে যাই!
                </p>
              </div>

              {/* ── 2. Today's Star Club ── */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <span className="text-base">🌟</span>
                    <span>আজকের ৫-ওয়াক্ত স্টার ক্লাব ({starClub.length})</span>
                  </h4>
                  <span className="text-[10px] text-slate-400">যারা আজকে ৫ ওয়াক্তই পূর্ণ করেছেন</span>
                </div>

                {starClub.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-center">
                    <span className="text-3xl block mb-1">⏳</span>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      আজকে এখনো কেউ ৫ ওয়াক্ত পূর্ণ করেনি।
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      সব ওয়াক্ত নামাজ আদায় করে আজকের প্রথম স্টার হয়ে উঠুন!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {starClub.map((member) => (
                      <div
                        key={member.user_id}
                        className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-400/60 dark:border-amber-500/40 flex items-center gap-3 shadow-2xs"
                      >
                        <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-black text-sm flex items-center justify-center shrink-0 border border-amber-400/50">
                          {member.profile_picture ? (
                            <img src={member.profile_picture} alt="" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            member.name?.[0] || 'S'
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-black text-slate-800 dark:text-white truncate">
                            {member.name}
                          </p>
                          <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/70 px-2 py-0.2 rounded-full border border-amber-300 dark:border-amber-700/60 mt-0.5">
                            ★ ৫/৫ সম্পন্ন মুমিন
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : activeTab === 'weekly' ? (
            /* ── Weekly Consistency Leaderboard ── */
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                <span>চলতি সপ্তাহের নামাজের ধারাবাহিকতা তালিকা ({data?.week_range?.start} – {data?.week_range?.end})</span>
                <span className="font-bold">সর্বোচ্চ ৩৫ ওয়াক্ত</span>
              </div>

              {weeklyLeaders.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  চলতি সপ্তাহে এখনো পর্যাপ্ত সলাত রেকর্ড নেই।
                </div>
              ) : (
                <div className="space-y-2">
                  {weeklyLeaders.map((leader, idx) => (
                    <div
                      key={leader.user_id}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                        idx === 0
                          ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700/60 shadow-xs ring-1 ring-amber-400/30'
                          : idx === 1
                          ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-300 dark:border-slate-700'
                          : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`w-6 h-6 rounded-full text-xs font-black flex items-center justify-center shrink-0 ${
                          idx === 0
                            ? 'bg-amber-500 text-white shadow-xs'
                            : idx === 1
                            ? 'bg-slate-400 text-white'
                            : idx === 2
                            ? 'bg-amber-700 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold'
                        }`}>
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                        </span>

                        <div className="min-w-0">
                          <p className="text-xs font-black text-slate-800 dark:text-white truncate">
                            {leader.name}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium">
                            {leader.active_days} দিন নিয়মিত উপস্থিত
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-black font-mono text-emerald-600 dark:text-emerald-400">
                          {leader.total_prayed} ওয়াক্ত
                        </span>
                        {leader.total_earned_mins > 0 && (
                          <span className="block text-[10px] font-black text-amber-600 dark:text-amber-400">
                            +{leader.total_earned_mins}মি. ম্যাঙ্গো
                          </span>
                        )}
                        <span className="block text-[9px] text-slate-400 font-bold">
                          {Math.round((leader.total_prayed / 35) * 100)}% কমপ্লিট
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* ── Monthly Consistency Leaderboard ── */
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/50 text-xs text-teal-800 dark:text-teal-300 flex items-center justify-between">
                <span>{data?.month_name} মাসের সলাত ধারাবাহিকতা চ্যাম্পিয়ন বোর্ড</span>
                <span className="font-bold">মাসিক সামগ্রিক</span>
              </div>

              {monthlyLeaders.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  চলতি মাসের সলাত রেকর্ড প্রস্তুত হচ্ছে...
                </div>
              ) : (
                <div className="space-y-2">
                  {monthlyLeaders.map((leader, idx) => (
                    <div
                      key={leader.user_id}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                        idx === 0
                          ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-700/60 shadow-xs ring-1 ring-emerald-400/30'
                          : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-6 h-6 rounded-full text-xs font-black flex items-center justify-center shrink-0 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {idx === 0 ? '👑' : `#${idx + 1}`}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-black text-slate-800 dark:text-white truncate">
                            {leader.name}
                          </p>
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                            {leader.active_days} দিন নিয়মিত নামাজ আদায়
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-black font-mono text-emerald-600 dark:text-emerald-400">
                          {leader.total_prayed} ওয়াক্ত
                        </span>
                        {leader.total_earned_mins > 0 && (
                          <span className="block text-[10px] font-black text-amber-600 dark:text-amber-400">
                            +{leader.total_earned_mins}মি. ম্যাঙ্গো
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
          <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
            <HiSparkles size={14} className="text-amber-500" />
            <span>ইবাদতে প্রতিযোগিতা বৃদ্ধি করুক আমাদের পারস্পরিক আন্তরিকতা</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

export default SalahLeaderboardModal;
