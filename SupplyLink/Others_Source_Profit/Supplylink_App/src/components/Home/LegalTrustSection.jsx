import React from "react";
import { FiShield, FiFileText, FiCheckCircle, FiCalendar, FiMapPin, FiUserCheck } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { getWhatsAppUrl } from "../../constants/links";

const LEGAL_POINTS = [
  {
    title: "৩০০ টাকার নন-জুডিশিয়াল স্ট্যাম্পে চুক্তি",
    desc: "প্রতিটি বিনিয়োগের জন্য ৩০০ টাকার সরকারি স্ট্যাম্পে দ্বিপাক্ষিক আইনি চুক্তি সম্পাদন করা হয়, যা আদালত ও আইন অনুযায়ী শতভাগ কার্যকর।",
    icon: "📜",
    badge: "আইনি সুরক্ষা",
  },
  {
    title: "সিকিউরিটি চেক ও অফিসিয়াল মানি রসিদ",
    desc: "বিনিয়োগকারীর মূলধনের পূর্ণ সুরক্ষায় ব্যাংকের অফিসিয়াল সিকিউরিটি চেক এবং স্বাক্ষরিত মানি রসিদ হস্তান্তর করা হয়।",
    icon: "📑",
    badge: "মূলধনের নিশ্চয়তা",
  },
  {
    title: "সরকার অনুমোদিত ট্রেড লাইসেন্স",
    desc: "সাপ্লাইলিংক সম্পূর্ণ স্থানীয় সরকার ও সংশ্লিষ্ট কতৃপক্ষ কর্তৃক নিবন্ধিত ও লাইসেন্সপ্রাপ্ত বাণিজ্যিক প্রতিষ্ঠান।",
    icon: "🏛️",
    badge: "বৈধ প্রতিষ্ঠান",
  },
  {
    title: "সুনামগঞ্জে স্থায়ী অফিস ও শোরুম",
    desc: "মঙ্গলকাটা বাজারে স্থায়ী হেড অফিস। যেকোনো সময় সশরীরে এসে প্রতিষ্ঠান পর্যবেক্ষণ ও সরাসরি লেনদেন করার শতভাগ নিশ্চয়তা।",
    icon: "📍",
    badge: "শারীরিক উপস্থিতি",
  },
];

export default function LegalTrustSection() {
  const vipWaMessage =
    "হ্যালো SupplyLink, আমি একজন বিনিয়োগকারী হিসেবে বড় অংকের মূলধন বিনিয়োগ করার বিষয়ে সরাসরি আপনাদের পরিচালক বা ম্যানেজমেন্টের সাথে ওয়ান-টু-ওয়ান মিটিংয়ের সময় নির্ধারণ করতে চাই।";

  return (
    <section className="py-14 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white border-t border-slate-200/60 relative overflow-hidden">
      {/* Background Soft Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-indigo-500/5 blur-[150px] rounded-full pointer-events-none" />

      <div className=" mx-auto relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-emerald-700 bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-full mb-3">
            আইনি নিশ্চয়তা ও নিরাপত্তা
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900">
            ১০০% স্বচ্ছতা ও আইনি সুরক্ষার নিশ্চয়তা
          </h2>
          <p className="mt-3 text-slate-600 text-sm sm:text-base">
            আপনার কষ্টার্জিত মূলধনের নিরাপত্তা নিশ্চিত করতে আমরা সম্পূর্ণ সরকারি আইন ও লিখিত প্রটোকল মেনে পরিচালনা করি।
          </p>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {LEGAL_POINTS.map((item, idx) => (
            <div
              key={idx}
              className="rounded-3xl border border-slate-200/90 bg-slate-50/60 p-6 flex flex-col justify-between hover:bg-white hover:border-indigo-400 hover:shadow-xl transition-all duration-300 group"
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-slate-200 text-2xl shadow-sm group-hover:scale-110 transition-transform">
                    {item.icon}
                  </div>
                  <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold">
                    {item.badge}
                  </span>
                </div>

                <h3 className="font-extrabold text-base text-slate-900 leading-snug">
                  {item.title}
                </h3>
                <p className="mt-2.5 text-xs text-slate-600 leading-relaxed">
                  {item.desc}
                </p>
              </div>

              <div className="mt-6 pt-3.5 border-t border-slate-200/70 flex items-center gap-1.5 text-xs text-emerald-700 font-bold">
                <FiCheckCircle className="h-4 w-4" />
                <span>সরকারি বিধিমালা অনুযায়ী</span>
              </div>
            </div>
          ))}
        </div>

        {/* ================= POINT 5: EXECUTIVE DIRECT MEETING ================= */}
        <div className="mt-16 rounded-3xl border border-indigo-200 bg-gradient-to-r from-indigo-50/90 via-white to-purple-50/90 p-7 sm:p-10 shadow-lg relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 text-left">
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-1 text-xs font-bold mb-3">
                <FiUserCheck className="h-3.5 w-3.5 text-indigo-600" />
                <span>ভিআইপি ও উচ্চ বিনিয়োগকারী ডেস্ক</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                সরাসরি কোম্পানির প্রতিষ্ঠাতা ও পরিচালকের সাথে মিটিং
              </h3>
              <p className="mt-2.5 text-slate-600 text-xs sm:text-sm leading-relaxed max-w-2xl">
                বড় অংকের মূলধন বিনিয়োগ (৳ ২,০০,০০০ থেকে ৳ ১০,০০,০০০+) অথবা করপোরেট কিস্তি সুবিধার জন্য আপনি সরাসরি আমাদের সুনামগঞ্জ অফিসে প্রতিষ্ঠানের পরিচালকের সাথে সামনাসামনি ওয়ান-টু-ওয়ান মিটিংয়ের শিডিউল বুক করতে পারেন।
              </p>

              <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <FiMapPin className="text-indigo-600" />
                  রফিক মঞ্জিল, মঙ্গলকাটা বাজার, সুনামগঞ্জ সদর
                </span>
                <span className="flex items-center gap-1.5">
                  <FiCalendar className="text-emerald-600" />
                  শনিবার - বৃহস্পতিবার
                </span>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col items-center lg:items-end justify-center">
              <a
                href={getWhatsAppUrl(vipWaMessage)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-bold text-xs sm:text-sm shadow-lg shadow-green-500/25 transition-all hover:scale-105 active:scale-95 cursor-pointer text-center"
              >
                <FaWhatsapp className="h-5 w-5" />
                <span>পরিচালকের সাথে মিটিং বুক করুন</span>
              </a>
              <span className="text-[11px] text-slate-500 mt-2 text-center lg:text-right">
                ✓ সম্পূর্ণ গোপনীয়তা ও সর্বোচ্চ গুরুত্ব নিশ্চিত
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
