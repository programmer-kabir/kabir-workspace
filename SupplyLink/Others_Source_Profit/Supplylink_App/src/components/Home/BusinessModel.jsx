import React from "react";
import { FiFileText, FiShoppingBag, FiDollarSign, FiCheckCircle } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { getWhatsAppUrl } from "../../constants/links";

const STEPS = [
  {
    step: "০১",
    title: "বিনিয়োগ ও আইনি চুক্তি সম্পাদন",
    subtitle: "মূলধনের ১০০% নিরাপত্তা",
    desc: "বিনিয়োগকারীর সাথে ৩০০ টাকার সরকারি নন-জুডিশিয়াল স্ট্যাম্পে দ্বিপাক্ষিক আইনি চুক্তি, সিকিউরিটি চেক ও অফিসিয়াল মানি রিসিপ্ট প্রদান করা হয়।",
    icon: FiFileText,
    color: "from-blue-600 to-indigo-600",
  },
  {
    step: "০২",
    title: "বাস্তব পণ্য ক্রয় ও কিস্তিতে বিক্রয়",
    subtitle: "স্বচ্ছ বাণিজ্যিক অপারেশন",
    desc: "বিনিয়োগের মূলধনে অফিসিয়াল স্মার্টফোন, মোটরসাইকেল ও ইলেকট্রনিক্স পণ্য কিনে স্থানীয় যাচাইকৃত গ্রাহকদের ৩০% ডাউনপেমেন্টে ৬ ও ১২ মাসের কিস্তিতে সরবরাহ করা হয়।",
    icon: FiShoppingBag,
    color: "from-purple-600 to-indigo-600",
  },
  {
    step: "০৩",
    title: "কিস্তি আদায় ও মাসিক মুনাফা বণ্টন",
    subtitle: "মাসিক ৮%–১২% পেআউট",
    desc: "গ্রাহকদের থেকে প্রতি মাসে আদায়কৃত কিস্তির অতিরিক্ত বাণিজ্যিক লাভ থেকে বিনিয়োগকারীদের নিয়মিত মাসিক মুনাফা তাদের ব্যাংক বা বিকাশ/নগদ অ্যাকাউন্টে পাঠিয়ে দেওয়া হয়।",
    icon: FiDollarSign,
    color: "from-emerald-600 to-teal-600",
  },
];

export default function BusinessModel() {
  return (
    <section className="py-14 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-slate-50/70 border-t border-slate-200/60 relative overflow-hidden">
      {/* Background Soft Glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-[140px] pointer-events-none" />

      <div className=" mx-auto relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-emerald-700 bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-full mb-3">
            স্বচ্ছ বিজনেস মডেল
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900">
            বিনিয়োগকারীদের লাভ কীভাবে আসে?
          </h2>
          <p className="mt-3 text-slate-600 text-sm sm:text-base">
            SupplyLink কোনো কাল্পনিক বা উচ্চ ঝুঁকিপূর্ণ ব্যবসা নয়। এটি বাস্তব পণ্যের দৃশ্যমান কিস্তি বাণিজ্যের ওপর প্রতিষ্ঠিত অংশীদারিত্ব।
          </p>
        </div>

        {/* 3 Step Interactive Workflow */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {STEPS.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="relative rounded-3xl border border-slate-200/90 bg-white p-7 shadow-sm flex flex-col justify-between hover:border-indigo-400 hover:shadow-xl transition-all duration-300 group"
              >
                <div>
                  {/* Top Step Badge */}
                  <div className="flex items-center justify-between mb-6">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr ${item.color} text-white shadow-md`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="font-mono text-3xl font-black text-slate-200 group-hover:text-indigo-200 transition-colors">
                      {item.step}
                    </span>
                  </div>

                  <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block mb-1">
                    {item.subtitle}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mb-3">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-indigo-700 font-semibold">
                  <FiCheckCircle className="text-emerald-600" />
                  <span>সম্পূর্ণ স্বচ্ছ প্রক্রিয়া</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legal Security & Stamp Trust Box */}
        <div className="mt-14 max-w-4xl mx-auto rounded-3xl border border-indigo-200 bg-gradient-to-r from-indigo-50/80 via-white to-purple-50/80 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="flex items-center gap-4 text-left">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700 border border-indigo-200 text-2xl">
              📜
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 text-base sm:text-lg">
                ৩০০ টাকার সরকারি স্ট্যাম্পে দ্বিপাক্ষিক চুক্তিপত্র
              </h4>
              <p className="text-slate-600 text-xs sm:text-sm mt-0.5">
                সুনামগঞ্জ সদর অফিসে এসে সরাসরি চুক্তিপত্র পর্যালোচনা করুন ও নিরাপদ অংশীদার হোন।
              </p>
            </div>
          </div>

          <a
            href={getWhatsAppUrl("হ্যালো SupplyLink, আমি আপনাদের বিজনেস মডেলটি দেখেছি। একজন বিনিয়োগকারী হিসেবে ৩০০ টাকার স্ট্যাম্প চুক্তির নমুনা দেখতে ও কথা বলতে চাই।")}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-bold text-xs sm:text-sm shadow-md shadow-green-500/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <FaWhatsapp className="h-4 w-4" />
            <span>চুক্তিপত্র দেখতে WhatsApp করুন</span>
          </a>
        </div>
      </div>
    </section>
  );
}
