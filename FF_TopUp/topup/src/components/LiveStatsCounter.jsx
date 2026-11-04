import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Zap, ShieldCheck, Flame, Users, CheckCircle2 } from 'lucide-react';

export const LiveStatsCounter = () => {
  const { orders } = useApp();

  // Dynamic active online gamers with subtle fluctuation (e.g. 18 - 32)
  const [onlineCount, setOnlineCount] = useState(24);

  useEffect(() => {
    const interval = setInterval(() => {
      setOnlineCount(prev => {
        const delta = Math.floor(Math.random() * 3) - 1; // -1, 0, or +1
        const next = prev + delta;
        return next < 16 ? 18 : next > 38 ? 32 : next;
      });
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const completedCount = orders.filter(o => o.status === 'Completed').length;
  // Baseline + real orders for credible social proof
  const totalTodayOrders = 128 + completedCount;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl md:rounded-3xl p-4 sm:p-5 my-5 sm:my-6 shadow-xs">
      {/* Top Banner Tag */}
      <div className="flex items-center justify-between flex-wrap gap-2.5 pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-6.5 h-6.5 rounded-lg bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center shadow-xs">
            <Flame size={15} className="text-white" />
          </div>
          <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
            রিয়েল-টাইম প্ল্যাটফর্ম স্ট্যাটাস ও সোশ্যাল প্রুফ
          </span>
        </div>

        {/* Live Pulse Dot */}
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>সার্ভার সম্পূর্ণ সক্রিয় ও লাইভ</span>
        </div>
      </div>

      {/* 4 Trust Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1: Today Delivered Orders */}
        <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl flex items-center gap-3 shadow-xs hover:border-sky-500/30 transition-all">
          <div className="p-2.5 rounded-xl bg-sky-500/12 text-sky-500 flex items-center justify-center shrink-0">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">আজকের সফল ডেলিভারি</div>
            <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              {totalTodayOrders}+ <span className="text-xs text-sky-500 font-bold">অর্ডার</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Average Delivery Time */}
        <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl flex items-center gap-3 shadow-xs hover:border-rose-500/30 transition-all">
          <div className="p-2.5 rounded-xl bg-rose-500/12 text-rose-500 flex items-center justify-center shrink-0">
            <Zap size={22} />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">গড় ডেলিভারি স্পিড</div>
            <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              ১ মি. ৪২ সে. <span className="text-[11px] text-emerald-500 font-bold">⚡ সুপারফাস্ট</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Safe Topup Guarantee */}
        <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl flex items-center gap-3 shadow-xs hover:border-emerald-500/30 transition-all">
          <div className="p-2.5 rounded-xl bg-emerald-500/12 text-emerald-500 flex items-center justify-center shrink-0">
            <ShieldCheck size={22} />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">আইডি ব্যান ঝুঁকি</div>
            <div className="text-lg sm:text-xl font-black text-emerald-500">
              ০.০০% <span className="text-[11px] text-slate-500 font-bold">(১০০% সেফ)</span>
            </div>
          </div>
        </div>

        {/* Metric 4: Live Online Gamers */}
        <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl flex items-center gap-3 shadow-xs hover:border-amber-500/30 transition-all">
          <div className="p-2.5 rounded-xl bg-amber-500/12 text-amber-500 flex items-center justify-center shrink-0">
            <Users size={22} />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">বর্তমানে অ্যাক্টিভ গেমার</div>
            <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              {onlineCount} জন <span className="text-[11px] text-emerald-500 font-bold">🟢 অনলাইনে</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
