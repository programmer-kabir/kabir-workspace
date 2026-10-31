import React from "react";
import {
  FiCheckCircle,
  FiShield,
  FiTrendingUp,
  FiArrowRight,
  FiZap,
  FiClock,
  FiShoppingBag,
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { getWhatsAppUrl } from "../../constants/links";

export default function HeroSection() {
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      id="hero"
      className="relative overflow-hidden pt-8 pb-14 sm:pt-12 sm:pb-20 lg:pt-16 lg:pb-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-indigo-50/50 via-white to-slate-50"
    >
      {/* Background Soft Glow Orbs */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-indigo-400/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute top-40 right-10 w-[300px] h-[300px] bg-purple-400/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Core Value Proposition */}
          <div className="lg:col-span-7 text-center lg:text-left">
            {/* Top Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-indigo-200 bg-indigo-50/80 text-indigo-700 text-xs font-bold mb-6 shadow-sm">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>বিশ্বস্ত ও আধুনিক ফিনটেক ও কিস্তি প্ল্যাটফর্ম</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.2] sm:leading-[1.18]">
              আপনার পছন্দের পণ্য হোক{" "}
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 bg-clip-text text-transparent">
                সহজ কিস্তিতে
              </span>
              , আর অলস টাকায় পান{" "}
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                নিশ্চিত লাভ
              </span>
            </h1>

            {/* Subheading */}
            <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
              SupplyLink-এর মাধ্যমে কোনো জটিলতা ছাড়া স্মার্টফোন, বাইক, ল্যাপটপ বা হোম অ্যাপ্লায়েন্স কিনুন আকর্ষণীয় কিস্তিতে অথবা যাচাইকৃত ব্যবসায়িক অংশীদারিত্বে নিয়মিত হালাল লাভ অর্জন করুন।
            </p>

            {/* Dual Identity Selector: Customer vs Investor */}
            <div className="mt-7 flex flex-wrap items-center justify-center lg:justify-start gap-2.5">
              <button
                onClick={() => scrollTo("products")}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition cursor-pointer"
              >
                <span>🛍️ আমি কিস্তিতে পণ্য নিতে চাই</span>
                <span className="text-[10px] text-emerald-200 font-mono font-bold">
                  (৬ মাস ১০% • ১২ মাস ১৫%)
                </span>
              </button>
              <button
                onClick={() => scrollTo("invest")}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition cursor-pointer"
              >
                <span>💼 আমি বিনিয়োগ করতে চাই</span>
                <span className="text-[10px] text-emerald-700 font-mono font-bold">
                  (৮%–১২% মাসিক আয়)
                </span>
              </button>
            </div>

            {/* Main Call To Actions */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5">
              <a
                href={getWhatsAppUrl("হ্যালো SupplyLink, আমি কিস্তিতে পণ্য কেনাকাটা করতে চাই। কীভাবে শুরু করব?")}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-bold text-sm sm:text-base shadow-xl shadow-green-500/25 transition-all hover:scale-[1.02] active:scale-95"
              >
                <FaWhatsapp className="h-5 w-5" />
                <span>WhatsApp-এ আবেদন করুন</span>
              </a>

              <button
                onClick={() => scrollTo("calculator")}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl border-2 border-indigo-200 bg-white hover:bg-indigo-50/60 hover:border-indigo-300 text-indigo-700 font-bold text-sm sm:text-base transition-all shadow-sm cursor-pointer"
              >
                <FiZap className="h-4 w-4 text-indigo-600" />
                <span>কিস্তি হিসাব করুন</span>
              </button>
            </div>

            {/* Key Trust Signals */}
            <div className="mt-10 pt-8 border-t border-slate-200/80 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs font-semibold text-slate-600">
              <div className="flex items-center gap-2">
                <FiCheckCircle className="text-emerald-500 h-4 w-4 shrink-0" />
                <span>কোনো লুকানো ফি নেই</span>
              </div>
              <div className="flex items-center gap-2">
                <FiShield className="text-indigo-500 h-4 w-4 shrink-0" />
                <span>১০০% নিরাপদ ডকুমেন্টেশন</span>
              </div>
              <div className="flex items-center gap-2">
                <FiClock className="text-purple-500 h-4 w-4 shrink-0" />
                <span>৩ মিনিটে তাৎক্ষণিক যাচাই</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Visual Showcase Card */}
          <div className="lg:col-span-5 relative">
            {/* Ambient Background Box Glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 rounded-3xl blur-2xl transform rotate-1 scale-95" />

            {/* Main Showcase Glass Card */}
            <div className="relative rounded-3xl border border-white/80 bg-white/90 p-6 sm:p-7 shadow-2xl backdrop-blur-xl">
              {/* Card Header */}
              <div className="flex items-center justify-between pb-5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shadow-inner">
                    <FiShoppingBag className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">
                      সহজ কিস্তি প্ল্যান
                    </h3>
                    <p className="text-xs text-slate-500">
                      ন্যূনতম ডাউনপেমেন্ট ও নমনীয় মেয়াদ
                    </p>
                  </div>
                </div>

                <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-[11px] font-bold text-emerald-700">
                  সক্রিয় অফার
                </span>
              </div>

              {/* Sample Product Showcase */}
              <div className="mt-5 rounded-2xl bg-slate-50 p-4 border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                    উদাহরণ প্রোডাক্ট
                  </span>
                  <h4 className="font-extrabold text-slate-900 text-sm sm:text-base mt-0.5">
                    অফিসিয়াল স্মার্টফোন ও গ্যাজেট
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    মার্কেট প্রাইস: ৳ ৩৫,০০০
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-medium">
                    মাসিক কিস্তি (১২ মাস)
                  </span>
                  <div className="text-lg sm:text-xl font-extrabold font-mono text-emerald-600">
                    ৳ ২,৩৪৮
                  </div>
                </div>
              </div>

              {/* Progress Feature Highlights */}
              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">ডাউনপেমেন্ট</span>
                  <span className="font-bold text-slate-900 font-mono">৩০% (৳১০,৫০০)</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full w-[70%]" />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>মেয়াদ: ৬ মাস (১০%) বা ১২ মাস (১৫%)</span>
                  <span className="text-emerald-600 font-semibold">আগে দিলে ছাড়</span>
                </div>
              </div>

              {/* Floating Trust Pills Inside Card */}
              <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-2 gap-2.5">
                <div className="rounded-xl bg-indigo-50/60 p-2.5 text-center border border-indigo-100/50">
                  <span className="block text-indigo-600 font-bold text-sm font-mono">১০০%</span>
                  <span className="text-[10px] text-slate-600 font-medium">অরিজিনাল পণ্য</span>
                </div>
                <div className="rounded-xl bg-emerald-50/60 p-2.5 text-center border border-emerald-100/50">
                  <span className="block text-emerald-600 font-bold text-sm font-mono">২৪ ঘণ্টার মধ্যে</span>
                  <span className="text-[10px] text-slate-600 font-medium">ডেলিভারি সুবিধা</span>
                </div>
              </div>

              {/* Direct Booking Link on Card */}
              <a
                href={getWhatsAppUrl("হ্যালো SupplyLink, আমি কিস্তির অফার সম্পর্কে আরও বিস্তারিত জানতে আগ্রহী।")}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-500/25 group"
              >
                <span>WhatsApp-এ বিস্তারিত জানুন</span>
                <FiArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
