import React from 'react';
import { FiX, FiAward, FiCheck, FiLock } from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';

const SalahBadgesModal = ({ isOpen, onClose, trackerData }) => {
  if (!isOpen || !trackerData) return null;

  const badges = trackerData.badges || [];
  const streakDays = trackerData.streak_days || 0;
  const fajrStreak = trackerData.fajr_streak || 0;
  const lifetimeEarnedMins = trackerData.lifetime_earned_minutes || 0;
  const todayEarnedMins = trackerData.today_earned_minutes || 0;
  const unlockedCount = trackerData.unlocked_badges_count || 0;
  const totalBadges = trackerData.total_badges_count || badges.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-500/10 via-amber-500/10 to-teal-500/10 dark:from-emerald-950/40 dark:via-amber-950/30 dark:to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-2xl shrink-0 shadow-inner border border-amber-500/30">
              🎖️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-800 dark:text-white">
                  সলাত স্ট্রাইক ও স্পেশাল ব্যাজ
                </h3>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-black border border-amber-300 dark:border-amber-700">
                  {unlockedCount}/{totalBadges} আনলক
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                নিয়মিত নামাজের ধারাবাহিকতায় অর্জিত মাইলফলক ও সম্মাননা
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Highlight Stats Banner */}
        <div className="grid grid-cols-3 gap-2.5 p-4 sm:p-5 bg-slate-50 dark:bg-slate-850 border-b border-slate-100 dark:border-slate-800 text-center">
          <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <span className="text-lg">🔥</span>
            <p className="text-xs text-slate-400 font-bold mt-1">কারেন্ট স্ট্রাইক</p>
            <p className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400">
              {streakDays} দিন
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <span className="text-lg">🌅</span>
            <p className="text-xs text-slate-400 font-bold mt-1">ফজর স্ট্রাইক</p>
            <p className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400">
              {fajrStreak} দিন
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <span className="text-lg">🥭</span>
            <p className="text-xs text-slate-400 font-bold mt-1">ম্যাঙ্গো অর্জিত</p>
            <p className="text-base sm:text-lg font-black text-teal-600 dark:text-teal-400">
              +{lifetimeEarnedMins} মি.
            </p>
          </div>
        </div>

        {/* Badges List */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3.5 flex-1">
          {badges.map((badge) => {
            const isUnlocked = !!badge.unlocked;

            return (
              <div
                key={badge.id}
                className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                  isUnlocked
                    ? 'bg-gradient-to-r from-amber-500/10 via-emerald-500/5 to-transparent border-amber-300 dark:border-amber-600/60 shadow-xs'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-70 hover:opacity-100'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-inner border ${
                      isUnlocked
                        ? 'bg-amber-500/20 text-amber-600 border-amber-400/50 dark:border-amber-500/40 ring-2 ring-amber-400/20'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    {badge.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-black text-slate-800 dark:text-white">
                        {badge.title_bn}
                      </h4>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">
                        ({badge.title_en})
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {badge.desc_bn}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  {isUnlocked ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-black border border-emerald-300 dark:border-emerald-700">
                      <FiCheck size={14} className="stroke-[3]" />
                      <span>অর্জিত</span>
                    </span>
                  ) : (
                    <div className="flex flex-col items-end gap-1">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 dark:text-slate-500">
                        <FiLock size={12} />
                        <span>লক করা</span>
                      </span>
                      {badge.progress && (
                        <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                          {badge.progress}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
            <HiSparkles size={14} className="text-amber-500" />
            <span>আজকের নামাজে অর্জিত ম্যাঙ্গো: +{todayEarnedMins} মিনিট</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold transition-colors cursor-pointer"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};

export default SalahBadgesModal;
