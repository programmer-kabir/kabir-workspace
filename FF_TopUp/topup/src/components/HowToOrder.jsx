import React from 'react';
import { Gamepad2, Smartphone, Zap, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { sounds } from '../services/soundEffects';

export const HowToOrder = () => {
  const scrollToCatalog = () => {
    sounds.playClick();
    const el = document.getElementById('product-catalog-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const steps = [
    {
      step: '০১',
      title: 'প্যাকেজ ও UID দিন',
      subtitle: 'আইডি ভেরিফিকেশন',
      desc: 'আপনার পছন্দের ডায়মন্ড বা পাস সিলেক্ট করুন। প্লেয়ার UID দিয়ে "নাম চেক" করে নিশ্চিত হন যেন ভুল আইডিতে ডায়মন্ড না যায়।',
      icon: Gamepad2,
      color: 'text-sky-600 bg-sky-100 border-sky-200',
      badgeColor: 'text-sky-700 bg-sky-50 border-sky-200'
    },
    {
      step: '০২',
      title: 'বিকাশ / নগদে Send Money',
      subtitle: '১-ট্যাপে অ্যাপ ওপেন',
      desc: 'স্ক্রিনে প্রদর্শিত নম্বরে Send Money করুন। মোবাইলে থাকলে ১-ট্যাপে সরাসরি বিকাশ বা নগদ অ্যাপ ওপেন করতে পারবেন।',
      icon: Smartphone,
      color: 'text-[#e2136e] bg-pink-100 border-pink-200',
      badgeColor: 'text-[#e2136e] bg-pink-50 border-pink-200'
    },
    {
      step: '০৩',
      title: 'TrxID দিন ও ডায়মন্ড বুঝে নিন',
      subtitle: '১ মিনিটে অটো ডেলিভারি',
      desc: 'এসএমএস থেকে TrxID কপি করে দিন এবং কনফার্ম করুন। ০-২ মিনিটে আপনার ফ্রি ফায়ার আইডিতে ডায়মন্ড পৌঁছে যাবে!',
      icon: Zap,
      color: 'text-amber-600 bg-amber-100 border-amber-200',
      badgeColor: 'text-amber-700 bg-amber-50 border-amber-200'
    }
  ];

  return (
    <section className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-10 my-8 sm:my-12 shadow-sm relative overflow-hidden">
      
      {/* Section Header */}
      <div className="text-center mb-8 sm:mb-10">
        <div className="inline-flex items-center gap-2 bg-sky-50 border border-sky-200 px-3.5 py-1.5 rounded-full text-xs text-sky-700 font-bold mb-3 shadow-xs">
          <ShieldCheck size={15} /> 
          <span>সহজ ও ১০০% নিরাপদ গাইডলাইন</span>
        </div>
        <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight mb-2">
          ⚡ কীভাবে অর্ডার করবেন? (মাত্র ৩টি সহজ ধাপে)
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto font-medium">
          কোনো পাসওয়ার্ড ছাড়া নিজের মোবাইল থেকে সহজে ডায়মন্ড কিনুন। নিচের ধাপগুলো অনুসরণ করুন:
        </p>
      </div>

      {/* Steps Cards Grid with Generous Spacing */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 mb-7">
        {steps.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div 
              key={idx} 
              className="bg-slate-50/70 border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-xs hover:shadow-md hover:border-sky-300 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col justify-between group"
            >
              {/* Background Step Watermark */}
              <div className="absolute -top-3 right-3 text-6xl font-black text-slate-200/70 select-none pointer-events-none group-hover:text-sky-200/60 transition-colors">
                {s.step}
              </div>

              <div>
                {/* Header Row */}
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 ${s.color}`}>
                    <Icon size={24} />
                  </div>

                  <span className={`text-xs font-bold px-3 py-1 rounded-full border ${s.badgeColor}`}>
                    ধাপ {idx + 1}
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2">
                  {s.title}
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                  {s.desc}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200 flex items-center gap-2 text-xs font-bold text-slate-700">
                <CheckCircle2 size={15} className="text-emerald-600" />
                <span>{s.subtitle}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Action Button */}
      <div className="text-center pt-2">
        <button 
          onClick={scrollToCatalog}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-sky-600 hover:text-sky-700 hover:underline cursor-pointer transition-colors"
        >
          <span>প্যাকেজ দেখুন ও এখনই টপ-আপ করুন</span>
          <ArrowRight size={15} />
        </button>
      </div>

    </section>
  );
};
