import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  FiCheckCircle,
  FiBarChart2,
  FiRefreshCw,
  FiLock,
  FiShield,
  FiTrendingUp,
  FiArrowRight,
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { getWhatsAppUrl } from "../../constants/links";

const investorCards = [
  {
    icon: <FiBarChart2 size={24} className="text-indigo-600" />,
    title: "মাসিক রিটার্ন",
    value: "সম্ভাব্য ৮–১২%",
    desc: "আপনার বিনিয়োগে স্থিতিশীল ও অংশীদারিত্বের ভিত্তিতে নিয়মিত আয়ের সুযোগ।",
  },
  {
    icon: <FiRefreshCw size={24} className="text-purple-600" />,
    title: "স্বয়ংক্রিয় পুনঃবিনিয়োগ",
    value: "কম্পাউন্ড গ্রোথ",
    desc: "চাইলে প্রতি মাসের লভ্যাংশ পুনরায় বিনিয়োগ করে মূলধন দ্রুত বৃদ্ধি করতে পারেন।",
  },
  {
    icon: <FiLock size={24} className="text-emerald-600" />,
    title: "লিখিত আইনি চুক্তি",
    value: "১০০% নিরাপদ",
    desc: "সরকারি স্ট্যাম্পে লিখিত চুক্তি ও সিকিউরিটি ডকুমেন্টেশন নিশ্চিত করা হয়।",
  },
  {
    icon: <FiShield size={24} className="text-blue-600" />,
    title: "যাচাইকৃত সম্পদ",
    value: "ঝুঁকি-নিয়ন্ত্রিত",
    desc: "চলমান ব্যবসা ও নিশ্চিত কিস্তি আয়ের মডেল—কোনো অনির্দিষ্ট বা ঝুঁকিপূর্ণ লেনদেন নেই।",
  },
];

export default function InvestorsHighLight() {
  const [investAmount, setInvestAmount] = useState(100000);

  // Return calculation (8% to 12%)
  const minMonthly = Math.round(investAmount * 0.08);
  const maxMonthly = Math.round(investAmount * 0.12);

  const waMessage = `হ্যালো SupplyLink, আমি একজন বিনিয়োগকারী হিসেবে ৳ ${investAmount.toLocaleString()} বিনিয়োগ করতে আগ্রহী। লিখিত চুক্তি ও লভ্যাংশের নিয়মাবলী জানতে চাই।`;

  return (
    <section
      id="invest"
      className="py-14 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-indigo-50/40 to-slate-50 border-t border-indigo-100/60 relative overflow-hidden"
    >
      <div className=" mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          {/* Left Text & Simulator */}
          <div className="lg:col-span-6">
            <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 bg-indigo-50 border border-indigo-100 px-3.5 py-1.5 rounded-full mb-3">
              স্বচ্ছ ও লাভজনক বিনিয়োগ
            </span>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              অলস মূলধনে অর্জন করুন{" "}
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                নিয়মিত মাসিক লাভ
              </span>
            </h2>

            <p className="mt-4 text-slate-600 text-sm sm:text-base leading-relaxed">
              SupplyLink বাস্তব ও নির্ভরযোগ্য পণ্যের কিস্তি বাণিজ্যে বিনিয়োগের সুযোগ দেয়। সুদের জটিলতামুক্ত, ব্যবসায়িক অংশীদারিত্বের ভিত্তিতে আপনার অর্থকে সক্রিয় ও লাভজনক রাখুন।
            </p>

            {/* Quick Live Profit Simulator */}
            <div className="mt-8 rounded-3xl border border-indigo-200/80 bg-white p-6 shadow-lg">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                লাইভ প্রফিট ক্যালকুলেটর (বিনিয়োগকারী)
              </span>

              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-700">বিনিয়োগের পরিমাণ:</span>
                <span className="font-mono text-base font-bold text-indigo-600">
                  ৳ {investAmount.toLocaleString()}
                </span>
              </div>

              <input
                type="range"
                min="50000"
                max="500000"
                step="10000"
                value={investAmount}
                onChange={(e) => setInvestAmount(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />

              <div className="mt-5 rounded-2xl bg-indigo-50/70 p-4 border border-indigo-100 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-500 block font-medium">
                    সম্ভাব্য মাসিক আয় (৮%–১২%)
                  </span>
                  <div className="text-lg sm:text-xl font-mono font-black text-emerald-600 mt-0.5">
                    ৳ {minMonthly.toLocaleString()} – ৳ {maxMonthly.toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-medium">মুনাফার প্রকৃতি</span>
                  <span className="text-xs font-bold text-indigo-700 bg-indigo-100/60 px-2.5 py-1 rounded-md">
                    অংশীদারিত্ব
                  </span>
                </div>
              </div>

              {/* Direct WhatsApp Call & Guide for Investors */}
              <div className="mt-5 space-y-2.5">
                <a
                  href={getWhatsAppUrl(waMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-bold text-xs sm:text-sm shadow-md shadow-green-500/20 transition-all hover:scale-[1.01] active:scale-95"
                >
                  <FaWhatsapp className="h-4 w-4" />
                  <span>বিনিয়োগ বিষয়ে WhatsApp-এ কথা বলুন</span>
                </a>

                <Link
                  to="/investors"
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-colors"
                >
                  <span>বিনিয়োগের আইনি নির্দেশিকা ও ৩০০ টাকার চুক্তিপত্র দেখুন</span>
                  <FiArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Right 4 Pillars Cards */}
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {investorCards.map((card, idx) => (
              <div
                key={idx}
                className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm hover:shadow-xl hover:border-indigo-400/40 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 border border-slate-100 shadow-inner mb-4">
                    {card.icon}
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {card.title}
                  </h3>
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                    {card.desc}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-600">
                  <span>{card.value}</span>
                  <FiCheckCircle className="h-4 w-4 text-emerald-500" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
