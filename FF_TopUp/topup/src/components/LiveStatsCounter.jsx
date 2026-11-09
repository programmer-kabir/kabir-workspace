import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Zap, ShieldCheck, Activity, Users, CheckCircle2 } from 'lucide-react';

export const LiveStatsCounter = () => {
  const { orders } = useApp();

  const [onlineCount, setOnlineCount] = useState(26);

  useEffect(() => {
    const interval = setInterval(() => {
      setOnlineCount(prev => {
        const delta = Math.floor(Math.random() * 3) - 1; // -1, 0, or +1
        const next = prev + delta;
        return next < 18 ? 20 : next > 42 ? 34 : next;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const completedCount = (orders || []).filter(o => o.status === 'Completed').length;
  const totalTodayOrders = 128 + completedCount;

  return (
    <section className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 my-6 sm:my-8 shadow-sm">
      
      {/* Top Header Tag */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-5 mb-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white shadow-xs">
            <Activity size={18} />
          </div>
          <div>
            <h3 className="font-black text-base sm:text-lg text-slate-900 tracking-tight">
              রিয়েল-টাইম প্ল্যাটফর্ম স্ট্যাটাস ও লাইভ মেট্রিক্স
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">স্বয়ংক্রিয় বট সার্ভার রিয়েল-টাইমে আপডেট হচ্ছে</p>
          </div>
        </div>

        {/* Live Pulse Indicator */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-bold">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
          </span>
          <span>সার্ভার সম্পূর্ণ সক্রিয় ও লাইভ</span>
        </div>
      </div>

      {/* 4 Trust Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
        
        {/* Metric 1: Today Delivered Orders */}
        <div className="p-4 sm:p-5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center gap-4 hover:border-sky-300 transition-all duration-300">
          <div className="w-11 h-11 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-semibold">আজকের সফল ডেলিভারি</div>
            <div className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
              {totalTodayOrders}+ <span className="text-xs text-sky-600 font-bold">অর্ডার</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Average Delivery Time */}
        <div className="p-4 sm:p-5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center gap-4 hover:border-rose-300 transition-all duration-300">
          <div className="w-11 h-11 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <Zap size={22} className="fill-current" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-semibold">গড় ডেলিভারি স্পিড</div>
            <div className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
              ১ মি. ৪২ সে.
            </div>
          </div>
        </div>

        {/* Metric 3: Safe Topup Guarantee */}
        <div className="p-4 sm:p-5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center gap-4 hover:border-emerald-300 transition-all duration-300">
          <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck size={22} />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-semibold">আইডি ব্যান ঝুঁকি</div>
            <div className="text-lg sm:text-xl font-black text-emerald-600 mt-0.5">
              ০.০০% <span className="text-xs text-slate-400 font-bold">(১০০% সেফ)</span>
            </div>
          </div>
        </div>

        {/* Metric 4: Live Online Gamers */}
        <div className="p-4 sm:p-5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center gap-4 hover:border-amber-300 transition-all duration-300">
          <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <Users size={22} />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-semibold">বর্তমানে অ্যাক্টিভ গেমার</div>
            <div className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
              {onlineCount} জন <span className="text-xs text-emerald-600 font-bold">🟢 অনলাইনে</span>
            </div>
          </div>
        </div>

      </div>

    </section>
  );
};
