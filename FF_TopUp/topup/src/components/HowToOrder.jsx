import React from 'react';
import { Gamepad2, Smartphone, Zap, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { sounds } from '../services/soundEffects';

export const HowToOrder = () => {
  const scrollToCatalog = () => {
    sounds.playClick();
    const el = document.querySelector('.products-grid') || document.querySelector('section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const steps = [
    {
      step: '০১',
      title: 'প্যাকেজ ও UID দিন',
      subtitle: 'আইডি ভেরিফিকেশন',
      desc: 'আপনার পছন্দের ডায়মন্ড বা পাস সিলেক্ট করুন। প্লেয়ার UID দিয়ে "নাম চেক" করে নিশ্চিত হন ভুল আইডিতে ডায়মন্ড যাবে না।',
      icon: Gamepad2,
      color: 'text-sky-500 bg-sky-500/15 border-sky-500/30',
      badgeColor: 'text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/25'
    },
    {
      step: '০২',
      title: 'বিকাশ / নগদে Send Money',
      subtitle: '১-ট্যাপ অ্যাপ ওপেন',
      desc: 'স্ক্রিনে প্রদর্শিত নম্বরে Send Money করুন। মোবাইলে থাকলে ১-ট্যাপে সরাসরি বিকাশ বা নগদ অ্যাপ ওপেন করতে পারবেন।',
      icon: Smartphone,
      color: 'text-pink-500 bg-pink-500/15 border-pink-500/30',
      badgeColor: 'text-pink-600 dark:text-pink-400 bg-pink-500/10 border-pink-500/25'
    },
    {
      step: '০৩',
      title: 'TrxID দিন ও ডায়মন্ড বুঝে নিন',
      subtitle: '১ মিনিটে অটো ডেলিভারি',
      desc: 'এসএমএস থেকে TrxID কপি করে দিন এবং কনফার্ম করুন। ০-২ মিনিটে আপনার ফ্রি ফায়ার আইডিতে ডায়মন্ড পৌঁছে যাবে!',
      icon: Zap,
      color: 'text-amber-500 bg-amber-500/15 border-amber-500/30',
      badgeColor: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/25'
    }
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl md:rounded-3xl p-5 sm:p-7 my-6 sm:my-8 shadow-xs">
      {/* Section Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-1.5 bg-sky-500/10 border border-sky-500/25 px-3 py-1 rounded-full text-xs text-sky-600 dark:text-sky-400 font-bold mb-2">
          <ShieldCheck size={14} /> সহজ ও ১০০% নিরাপদ গাইডলাইন
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-1.5">
          ⚡ কীভাবে অর্ডার করবেন? (মাত্র ৩টি সহজ ধাপে)
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
          কোনো ঝামেলা ছাড়া নিজের মোবাইল থেকে সহজে ডায়মন্ড কিনুন। নিচে ধাপগুলো অনুসরণ করুন:
        </p>
      </div>

      {/* Steps Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        {steps.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div 
              key={idx} 
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:shadow-lg hover:border-sky-500/40 transition-all duration-300 relative overflow-hidden flex flex-col justify-between group"
            >
              {/* Background Step Watermark */}
              <div className="absolute -top-3 right-3 text-6xl font-black text-slate-900/5 dark:text-white/5 select-none pointer-events-none">
                {s.step}
              </div>

              <div>
                {/* Header row */}
                <div className="flex items-center justify-between mb-3.5">
                  <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${s.color}`}>
                    <Icon size={22} />
                  </div>

                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${s.badgeColor}`}>
                    ধাপ {idx + 1}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
                  {s.title}
                </h3>

                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {s.desc}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                <CheckCircle2 size={13} className="text-emerald-500" />
                <span>{s.subtitle}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick CTA to start top-up */}
      <div className="text-center mt-3">
        <button
          type="button"
          onClick={scrollToCatalog}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold px-6 py-2.5 rounded-xl shadow-md shadow-sky-500/25 active:scale-95 transition-all text-xs sm:text-sm cursor-pointer"
        >
          <span>প্যাকেজ দেখুন ও এখনই টপ-আপ করুন</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};
