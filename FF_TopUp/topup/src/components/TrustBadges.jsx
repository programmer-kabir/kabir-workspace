import React from 'react';
import { ShieldCheck, Zap, Smartphone, Users, Lock, Award, HeartHandshake, RefreshCw } from 'lucide-react';

export const TrustBadges = () => {
  return (
    <div className="my-3 sm:my-4">
      {/* 4 Feature Highlights Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl p-3 sm:p-3.5 flex items-center gap-2.5 sm:gap-3 shadow-xs hover:shadow-md hover:border-sky-500/40 hover:-translate-y-0.5 transition-all">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-sky-500/15 text-sky-500 flex items-center justify-center shrink-0">
            <Zap size={20} />
          </div>
          <div>
            <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight">১ মিনিটে ডেলিভারি</div>
            <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">২৪ ঘন্টা অটোমেটেড সিস্টেম</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl p-3 sm:p-3.5 flex items-center gap-2.5 sm:gap-3 shadow-xs hover:shadow-md hover:border-emerald-500/40 hover:-translate-y-0.5 transition-all">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
            <ShieldCheck size={20} />
          </div>
          <div>
            <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight">১০০% আইডি নিরাপদ</div>
            <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">পাসওয়ার্ড ছাড়াই শুধু UID দিয়ে</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl p-3 sm:p-3.5 flex items-center gap-2.5 sm:gap-3 shadow-xs hover:shadow-md hover:border-pink-500/40 hover:-translate-y-0.5 transition-all">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-pink-500/15 text-[#e2136e] flex items-center justify-center shrink-0">
            <Smartphone size={20} />
          </div>
          <div>
            <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight">বিকাশ ও নগদ পেমেন্ট</div>
            <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">সহজ ও বিশ্বস্ত MFS গেটওয়ে</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl p-3 sm:p-3.5 flex items-center gap-2.5 sm:gap-3 shadow-xs hover:shadow-md hover:border-amber-500/40 hover:-translate-y-0.5 transition-all">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
            <Users size={20} />
          </div>
          <div>
            <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight">৫০,০০০+ নিয়মিত গেমার</div>
            <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">বাংলাদেশ জুড়ে আস্থা ও ভরসা</div>
          </div>
        </div>
      </div>

      {/* Security & Money Back Guarantee Seal Banner */}
      <div className="mt-3.5 py-3 px-4 bg-gradient-to-r from-emerald-500/10 via-sky-500/10 to-teal-500/10 border border-emerald-500/25 rounded-xl sm:rounded-2xl flex items-center justify-around flex-wrap gap-2 sm:gap-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
          <Lock size={14} />
          <span>২৫৬-বিট SSL এনক্রিপ্টেড পেমেন্ট</span>
        </div>
        <div className="hidden sm:block text-slate-300 dark:text-slate-700">|</div>
        <div className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400">
          <Award size={14} />
          <span>অফিশিয়াল গ্যারেনা টপ-আপ পার্টনার</span>
        </div>
        <div className="hidden sm:block text-slate-300 dark:text-slate-700">|</div>
        <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
          <RefreshCw size={14} />
          <span>১০০% মানি-ব্যাক গ্যারান্টি পলিসি</span>
        </div>
        <div className="hidden sm:block text-slate-300 dark:text-slate-700">|</div>
        <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
          <HeartHandshake size={14} />
          <span>লাইভ কাস্টমার সাপোর্ট কেয়ার</span>
        </div>
      </div>
    </div>
  );
};
