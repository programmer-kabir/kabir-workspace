import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { FiCheck, FiRefreshCw, FiClock, FiAward } from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import SalahLeaderboardModal from './SalahLeaderboardModal';
import SalahBadgesModal from './SalahBadgesModal';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const QUOTES = [
  'নিশ্চয়ই নামাজ মুমিনদের ওপর নির্দিষ্ট সময়ে ফরজ করা হয়েছে। (সূরা আন-নিসা: ১০৩)',
  'নামাজ হলো মুমিনের মিরাজ ও নয়নের শীতলতা। (আল-হাদিস)',
  'যে ব্যক্তি সময়মতো পাঁচ ওয়াক্ত নামাজ আদায় করে, কিয়ামতের দিন তা তার জন্য নূর ও প্রমাণ হবে। (মুসনাদে আহমাদ)',
  'নিশ্চয়ই নামাজ অন্যায় ও অশ্লীল কাজ থেকে বিরত রাখে। (সূরা আল-আনকাবুত: ৪৫)',
  'বান্দা যখন সেজদায় অবনত হয়, তখন সে আল্লাহর সবচেয়ে নিকটবর্তী হয়। (সহিহ মুসলিম)'
];

const formatLogTime = (timeStr) => {
  if (!timeStr) return '';
  try {
    const d = new Date(timeStr.replace(' ', 'T'));
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('bn-BD', { hour: 'numeric', minute: '2-digit' });
  } catch {
    return '';
  }
};

const DailySalahTracker = () => {
  const { currentUser } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [togglingKey, setTogglingKey] = useState(null);
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isBadgesOpen, setIsBadgesOpen] = useState(false);

  useEffect(() => {
    // Pick quote based on day of month
    const d = new Date().getDate();
    setQuoteIdx(d % QUOTES.length);
  }, []);

  const fetchTracker = async () => {
    if (!currentUser?.id) return;
    try {
      const res = await axios.get(`${API_BASE}api/breaks/salah/get_my_salah_tracker.php?user_id=${currentUser.id}&t=${Date.now()}`);
      if (res.data?.status === 'success') {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch salah tracker:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTracker();
  }, [currentUser]);

  const handleToggleWaqt = async (waqtKey) => {
    if (!currentUser?.id || !data?.waqts?.[waqtKey] || togglingKey) return;

    const currentWaqt = data.waqts[waqtKey];
    const willBePrayed = !currentWaqt.is_prayed;

    // 1. Optimistic UI update
    setData((prev) => {
      if (!prev) return prev;
      const updatedWaqts = {
        ...prev.waqts,
        [waqtKey]: {
          ...currentWaqt,
          is_prayed: willBePrayed,
          logged_at: willBePrayed ? new Date().toISOString() : null
        }
      };

      const newCompleted = Object.values(updatedWaqts).filter((w) => w.is_prayed).length;
      return {
        ...prev,
        waqts: updatedWaqts,
        completed_count: newCompleted,
        progress_percent: Math.round((newCompleted / 5) * 100)
      };
    });

    setTogglingKey(waqtKey);

    // 2. Call backend
    try {
      const res = await axios.post(`${API_BASE}api/breaks/salah/log_salah.php`, {
        user_id: currentUser.id,
        waqt: waqtKey,
        action: 'toggle'
      });

      if (res.data?.status === 'success') {
        if (res.data.is_prayed) {
          toast.success(res.data.message || `মাশাআল্লাহ! ${currentWaqt.name_bn} নামাজ সম্পন্ন হয়েছে।`, {
            icon: '🕌'
          });
        } else {
          toast.info(res.data.message || `${currentWaqt.name_bn} নামাজের রেকর্ড আনডু করা হয়েছে।`);
        }
      } else {
        toast.error(res.data?.message || 'Failed to update prayer log.');
        fetchTracker(); // Rollback
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving prayer log.');
      fetchTracker(); // Rollback
    } finally {
      setTogglingKey(null);
    }
  };

  if (loading && !data) return null;
  if (!data || !data.waqts) return null;

  const waqtList = Object.values(data.waqts).sort((a, b) => a.sort - b.sort);
  const completedCount = data.completed_count || 0;
  const progressPercent = data.progress_percent || 0;
  const streakDays = data.streak_days || 0;
  const rewardConfig = data.reward_config || {};
  const rewardPerWaqt = rewardConfig.reward_per_waqt ?? 3;
  const fullDayBonus = rewardConfig.full_day_bonus ?? 5;
  const isRewardEnabled = rewardConfig.is_reward_enabled ?? true;
  const unlockedBadgesCount = data.unlocked_badges_count || 0;
  const totalBadgesCount = data.total_badges_count || (data.badges?.length || 7);
  const todayEarnedMins = data.today_earned_minutes || 0;

  return (
    <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/5 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-transparent border-2 border-emerald-400/60 dark:border-emerald-500/40 rounded-3xl p-5 shadow-lg shadow-emerald-500/5 mb-6 transition-all duration-300">
      
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-xl shrink-0 shadow-xs border border-emerald-500/30">
            🕌
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-black text-slate-800 dark:text-white leading-tight flex items-center gap-2">
                <span>দৈনিক সলাত ট্র্যাকার</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-700/60 uppercase tracking-wider">
                  Daily 5 Waqt
                </span>
              </h3>
              {streakDays > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-black border border-amber-300 dark:border-amber-700/60 flex items-center gap-1 shadow-2xs">
                  <span>🔥</span>
                  <span>{streakDays} দিনের ধারাবাহিকতা</span>
                </span>
              )}
            </div>
            <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300/90 mt-0.5">
              আজকের ৫ ওয়াক্ত নামাজের আত্মশুদ্ধি ও আমল ট্র্যাকার
            </p>
          </div>
        </div>

        {/* Progress pill & bar + Action Buttons */}
        <div className="flex flex-col sm:items-end gap-2 self-start sm:self-auto min-w-[240px]">
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button
              type="button"
              onClick={() => setIsBadgesOpen(true)}
              className="px-2.5 py-1 rounded-xl bg-amber-500/15 dark:bg-amber-950/60 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 text-[11px] font-black border border-amber-300 dark:border-amber-700/60 flex items-center gap-1.5 transition-all cursor-pointer hover:scale-102 active:scale-95"
            >
              <span>🎖️</span>
              <span>ব্যাজ ({unlockedBadgesCount}/{totalBadgesCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setIsLeaderboardOpen(true)}
              className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black shadow-xs flex items-center gap-1.5 transition-all cursor-pointer hover:scale-102 active:scale-95"
            >
              <span>🏆</span>
              <span>টিম স্কোর</span>
            </button>
            <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-black">
              {progressPercent}%
            </span>
          </div>
          
          <div className="w-full sm:w-52 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── 5 Waqt Interactive Grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 sm:gap-3">
        {waqtList.map((w) => {
          const isDone = w.is_prayed;
          const isProcessing = togglingKey === w.key;

          return (
            <button
              key={w.key}
              type="button"
              disabled={isProcessing}
              onClick={() => handleToggleWaqt(w.key)}
              className={`p-3 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between gap-2.5 cursor-pointer select-none active:scale-97 relative overflow-hidden group ${
                isDone
                  ? 'bg-gradient-to-br from-emerald-600 to-teal-600 border-emerald-500 text-white shadow-md shadow-emerald-600/25 ring-2 ring-emerald-500/20'
                  : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 hover:bg-emerald-50/30 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-200 shadow-2xs'
              }`}
            >
              {/* Top: Icon & English Name */}
              <div className="flex items-center justify-between w-full">
                <span className="text-xl group-hover:scale-110 transition-transform">{w.icon}</span>
                <span className={`text-[10px] font-extrabold uppercase tracking-wider ${isDone ? 'text-emerald-100' : 'text-slate-400 dark:text-slate-500'}`}>
                  {w.name_en}
                </span>
              </div>

              {/* Middle: Bengali Waqt Name + Reward Badge */}
              <div className="space-y-1">
                <p className={`text-sm font-black tracking-tight ${isDone ? 'text-white' : 'text-slate-800 dark:text-white'}`}>
                  {w.name_bn}
                </p>
                {isRewardEnabled && rewardPerWaqt > 0 && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-black inline-flex items-center gap-1 ${
                    isDone 
                      ? 'bg-white/20 text-white' 
                      : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60'
                  }`}>
                    <span>🥭</span>
                    <span>{isDone ? `+${w.reward_minutes || rewardPerWaqt}মি.` : `+${rewardPerWaqt}মি.`}</span>
                  </span>
                )}
                {isDone && w.logged_at && (
                  <p className="text-[10px] text-emerald-100/90 font-medium mt-0.5 flex items-center gap-1">
                    <FiClock size={10} />
                    <span>{formatLogTime(w.logged_at)}</span>
                  </p>
                )}
              </div>

              {/* Bottom Action Pill */}
              <div className="pt-1 border-t border-white/20 dark:border-slate-800 w-full flex items-center justify-between">
                {isDone ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-black text-white">
                    <FiCheck size={13} className="stroke-[3]" />
                    <span>পড়েছি</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 group-hover:underline">
                    <span>+ ক্লিক করুন</span>
                  </span>
                )}

                {isDone ? (
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-white/20 text-white font-black">
                    ✓ সম্পন্ন
                  </span>
                ) : (
                  <span className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-600 group-hover:border-emerald-500 transition-colors" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* ── 5/5 Star Club Celebration Banner ── */}
      {completedCount === 5 && (
        <div className="mt-3.5 p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-teal-500/20 border border-amber-300 dark:border-amber-700/60 flex items-center justify-between gap-3 px-4 shadow-sm animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl animate-bounce">⭐</span>
            <div>
              <p className="text-xs font-black text-amber-900 dark:text-amber-300">
                আলহামদুলিল্লাহ! আজকের ৫ ওয়াক্ত নামাজ পূর্ণ হয়েছে!
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                আজকের সর্বমোট অর্জিত ম্যাঙ্গো ওভারটাইম: <strong className="text-emerald-700 dark:text-emerald-400 font-black">+{todayEarnedMins} মিনিট</strong> {fullDayBonus > 0 && `(যার মধ্যে +${fullDayBonus} মিনিট ৫-ওয়াক্ত মেগা বোনাস অন্তর্ভুক্ত)`}
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-xl bg-amber-500 text-slate-900 font-black text-xs shrink-0 shadow-xs flex items-center gap-1">
            <span>👑</span>
            <span>স্টার ক্লাব</span>
          </span>
        </div>
      )}

      {/* ── Footer Quote Banner ── */}
      <div className="mt-4 pt-3 border-t border-emerald-300/40 dark:border-emerald-800/40 flex items-center justify-between gap-2 flex-wrap text-[11px] text-emerald-800 dark:text-emerald-300">
        <div className="flex items-center gap-2 min-w-0">
          <HiSparkles size={14} className="text-amber-500 shrink-0 animate-pulse" />
          <span className="italic truncate font-medium">
            "{QUOTES[quoteIdx]}"
          </span>
        </div>
        <span className="text-[10px] text-slate-400 font-bold shrink-0 ml-auto">
          পড়ার পর ট্যাপ করে টিক দিন
        </span>
      </div>

      {/* ── Salah Leaderboard Modal ── */}
      <SalahLeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
      />

      {/* ── Salah Badges Modal ── */}
      <SalahBadgesModal
        isOpen={isBadgesOpen}
        onClose={() => setIsBadgesOpen(false)}
        trackerData={data}
      />

    </div>
  );
};

export default DailySalahTracker;
