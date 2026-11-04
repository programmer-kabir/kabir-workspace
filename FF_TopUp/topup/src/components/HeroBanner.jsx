import React from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, ArrowRight, Zap } from 'lucide-react';
import { sounds } from '../services/soundEffects';

export const HeroBanner = () => {
  const { products, startTopup } = useApp();

  const handleQuickTopup = () => {
    sounds.playClick();
    if (products.length > 0) {
      startTopup(products[0]);
    }
  };

  return (
    <section className="py-3 sm:py-5">
      <div className="relative rounded-2xl md:rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg aspect-[16/10] sm:aspect-[16/7] max-h-[460px] group">
        <img 
          src="/images/banner1.jpg" 
          alt="Free Fire Diamond Top-Up BD" 
          className="w-full h-full object-cover block group-hover:scale-105 transition-transform duration-700"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-transparent flex flex-col justify-end p-4 sm:p-6 md:p-8">
          <div className="self-start bg-sky-500/20 border border-sky-400/50 text-sky-200 text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-2 flex items-center gap-1.5 backdrop-blur-md shadow-xs">
            <Zap size={13} fill="currentColor" />
            <span>২৪ ঘন্টা সুপারফাস্ট অটোমেটিক ডেলিভারি</span>
          </div>

          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-white leading-tight drop-shadow-md">
            সবচেয়ে কম রেটে ডায়মন্ড ও মেম্বারশিপ টপ-আপ
          </h1>

          <p className="text-xs sm:text-sm text-slate-200 max-w-xl my-2 sm:my-3 leading-relaxed drop-shadow-xs line-clamp-2 sm:line-clamp-none">
            বিকাশ, নগদ, রকেট ও ইনস্ট্যান্ট ওয়ালেট পেমেন্টে ১-৩ মিনিটে ইন-গেম ডায়মন্ড ডেলিভারি। কোনো পাসওয়ার্ড ছাড়াই শুধুমাত্র UID দিয়ে রিচার্জ করুন।
          </p>

          <button 
            className="self-start inline-flex items-center gap-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl shadow-lg shadow-sky-500/30 hover:shadow-sky-500/50 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer text-xs sm:text-sm"
            id="hero-topup-cta-btn"
            onClick={handleQuickTopup}
          >
            <Sparkles size={16} />
            <span>এখনই টপ-আপ করুন</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
};
