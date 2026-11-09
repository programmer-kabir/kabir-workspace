import React from 'react';
import { ShieldCheck, Zap, Smartphone, Users, Lock, Award, HeartHandshake, RefreshCw } from 'lucide-react';

export const TrustBadges = () => {
  return (
    <section className="my-6 sm:my-8">
      
      {/* 4 Feature Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* Card 1: Fast Delivery */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 flex items-center gap-4 shadow-sm hover:shadow-md hover:border-sky-300 hover:-translate-y-0.5 transition-all duration-300 group">
          <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Zap size={24} className="fill-current text-sky-600" />
          </div>
          <div className="min-w-0">
            <div className="text-sm sm:text-base font-black text-slate-900 leading-tight">
              ১ মিনিটে ডেলিভারি
            </div>
            <div className="text-xs text-slate-500 font-medium mt-1 truncate">
              ২৪ ঘন্টা অটোমেটেড সিস্টেম
            </div>
          </div>
        </div>

        {/* Card 2: 100% ID Safe */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 flex items-center gap-4 shadow-sm hover:shadow-md hover:border-emerald-300 hover:-translate-y-0.5 transition-all duration-300 group">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <ShieldCheck size={24} />
          </div>
          <div className="min-w-0">
            <div className="text-sm sm:text-base font-black text-slate-900 leading-tight">
              ১০০% আইডি নিরাপদ
            </div>
            <div className="text-xs text-slate-500 font-medium mt-1 truncate">
              পাসওয়ার্ড ছাড়াই শুধু UID দিয়ে
            </div>
          </div>
        </div>

        {/* Card 3: Instant MFS Payment */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 flex items-center gap-4 shadow-sm hover:shadow-md hover:border-pink-300 hover:-translate-y-0.5 transition-all duration-300 group">
          <div className="w-12 h-12 rounded-xl bg-pink-50 border border-pink-100 text-[#e2136e] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Smartphone size={24} />
          </div>
          <div className="min-w-0">
            <div className="text-sm sm:text-base font-black text-slate-900 leading-tight">
              বিকাশ ও নগদ পেমেন্ট
            </div>
            <div className="text-xs text-slate-500 font-medium mt-1 truncate">
              সহজ ও বিশ্বস্ত MFS গেটওয়ে
            </div>
          </div>
        </div>

        {/* Card 4: 50,000+ Gamers Community */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 flex items-center gap-4 shadow-sm hover:shadow-md hover:border-amber-300 hover:-translate-y-0.5 transition-all duration-300 group">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Users size={24} />
          </div>
          <div className="min-w-0">
            <div className="text-sm sm:text-base font-black text-slate-900 leading-tight">
              ৫০,০০০+ নিয়মিত গেমার
            </div>
            <div className="text-xs text-slate-500 font-medium mt-1 truncate flex items-center gap-1">
              <span className="text-amber-500 font-bold">৪.৯★</span>
              <span>বাংলাদেশ জুড়ে আস্থা ও ভরসা</span>
            </div>
          </div>
        </div>

      </div>

      {/* Security & Money Back Guarantee Seal Banner */}
      <div className="mt-4 sm:mt-5 py-3 px-5 sm:px-6 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-around flex-wrap gap-3 sm:gap-6 text-xs font-bold text-slate-700 shadow-xs">
        <div className="flex items-center gap-2 text-emerald-700">
          <Lock size={15} />
          <span>২৫৬-বিট SSL সুরক্ষিত পেমেন্ট</span>
        </div>
        <div className="hidden sm:block text-slate-300">•</div>
        <div className="flex items-center gap-2 text-sky-700">
          <Award size={15} />
          <span>অফিশিয়াল গ্যারেনা টপ-আপ পার্টনার</span>
        </div>
        <div className="hidden sm:block text-slate-300">•</div>
        <div className="flex items-center gap-2 text-amber-700">
          <RefreshCw size={15} />
          <span>১০০% মানি-ব্যাক গ্যারান্টি পলিসি</span>
        </div>
        <div className="hidden sm:block text-slate-300">•</div>
        <div className="flex items-center gap-2 text-rose-700">
          <HeartHandshake size={15} />
          <span>লাইভ কাস্টমার সাপোর্ট কেয়ার</span>
        </div>
      </div>

    </section>
  );
};
