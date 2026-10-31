import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FiCheckCircle,
  FiArrowLeft,
  FiShield,
  FiFileText,
  FiTrendingUp,
  FiDollarSign,
  FiLock,
  FiUserCheck,
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { CONTACT_INFO, getWhatsAppUrl } from "../constants/links";

export default function InvestorsGuide() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="pt-8 pb-16 sm:pt-12 sm:pb-24 px-4 sm:px-6 lg:px-8 bg-slate-50 min-h-screen">
      <div className=" mx-auto">
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition mb-6"
        >
          <FiArrowLeft className="h-4 w-4" />
          <span>মূল পেজে ফিরে যান</span>
        </Link>

        {/* Page Title */}
        <div className="mb-10 text-center sm:text-left">
          <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-emerald-700 bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-full mb-3">
            বিনিয়োগকারী নির্দেশিকা
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
            SupplyLink বিনিয়োগ মডেল ও মূলধন সুরক্ষার পূর্ণাঙ্গ বিবরণ
          </h1>
          <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
            সরকারি স্ট্যাম্পে লিখিত চুক্তি, বাস্তব দৃশ্যমান বাণিজ্য এবং হালাল অংশীদারিত্বের মাধ্যমে মাসিক লাভ অর্জনের গাইড।
          </p>
        </div>

        {/* 4 Pillars of Investor Security */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-2xl mb-3 block">📜</span>
              <h3 className="font-extrabold text-base text-slate-900 mb-2">
                ৩০০ টাকার সরকারি নন-জুডিশিয়াল স্ট্যাম্প চুক্তি
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                প্রতিটি বিনিয়োগের বিপরীতে বাংলাদেশ সরকার অনুমোদিত ৩০০ টাকার স্ট্যাম্পে আইনি চুক্তি সম্পাদন করা হয়, যা উভয় পক্ষের জন্য বাধ্যতামূলক ও আদালতে আইনত কার্যকর।
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-bold text-emerald-600 flex items-center gap-1.5">
              <FiCheckCircle />
              <span>আইনসম্মত সুরক্ষা</span>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-2xl mb-3 block">📑</span>
              <h3 className="font-extrabold text-base text-slate-900 mb-2">
                সিকিউরিটি চেক ও অফিসিয়াল মানি রসিদ
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                বিনিয়োগকারীর মূলধনের পূর্ণ গ্যারান্টি স্বরূপ প্রতিষ্ঠানের ব্যাংক সিকিউরিটি চেক এবং স্বাক্ষরিত অফিসিয়াল মানি রসিদ হস্তান্তর করা হয়।
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-bold text-emerald-600 flex items-center gap-1.5">
              <FiCheckCircle />
              <span>মূলধনের শতভাগ নিশ্চয়তা</span>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-2xl mb-3 block">📈</span>
              <h3 className="font-extrabold text-base text-slate-900 mb-2">
                মাসিক ৮%–১২% হারে মুনাফা বণ্টন
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                স্থানীয় বাজারে যাচাইকৃত গ্রাহকদের স্মার্টফোন ও বাইক বিক্রির লাভ থেকে প্রতি মাসের নির্ধারিত তারিখে বিনিয়োগকারীদের অ্যাকাউন্টে লভ্যাংশ পাঠিয়ে দেওয়া হয়।
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-bold text-emerald-600 flex items-center gap-1.5">
              <FiCheckCircle />
              <span>ব্যাংক / বিকাশ / নগদ পেআউট</span>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-2xl mb-3 block">🏢</span>
              <h3 className="font-extrabold text-base text-slate-900 mb-2">
                সুনামগঞ্জে স্থায়ী হেড অফিস ও পরিদর্শন
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                রফিক মঞ্জিল, মঙ্গলকাটা বাজারে আমাদের স্থায়ী অফিস ও গ্রাহক শোরুম। বিনিয়োগকারী যেকোনো সময় সশরীরে এসে সমস্ত হিসাব ও বাণিজ্য পরিদর্শন করতে পারেন।
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-bold text-emerald-600 flex items-center gap-1.5">
              <FiCheckCircle />
              <span>শারীরিক অবকাঠামো</span>
            </div>
          </div>
        </div>

        {/* Investment Slab Example Table */}
        <div className="rounded-3xl border border-slate-200 bg-white p-7 sm:p-10 mb-10 shadow-sm overflow-hidden">
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            বিনিয়োগের স্ল্যাব ও সম্ভাব্য মাসিক মুনাফার হিসাব
          </h3>
          <p className="text-xs text-slate-500 mb-6">
            নিচে বিভিন্ন অংকের মূলধনে সম্ভাব্য মাসিক আয়ের একটি উদাহরণ দেওয়া হলো:
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">বিনিয়োগকৃত মূলধন</th>
                  <th className="py-3 px-4">সম্ভাব্য মাসিক আয় (৮%–১২%)</th>
                  <th className="py-3 px-4">সম্ভাব্য বাৎসরিক মোট লাভ</th>
                  <th className="py-3 px-4">আইনি ডকুমেন্টস</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600 font-mono">
                <tr>
                  <td className="py-3.5 px-4 font-bold text-slate-900">৳ ৫০,০০০</td>
                  <td className="py-3.5 px-4 text-emerald-600 font-bold">৳ ৪,০০০ – ৳ ৬,০০০</td>
                  <td className="py-3.5 px-4">৳ ৪৮,০০০ – ৳ ৭২,০০০</td>
                  <td className="py-3.5 px-4 font-sans text-xs">স্ট্যাম্প চুক্তি + রসিদ</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-bold text-slate-900">৳ ১,০০,০০০</td>
                  <td className="py-3.5 px-4 text-emerald-600 font-bold">৳ ৮,০০০ – ৳ ১২,০০০</td>
                  <td className="py-3.5 px-4">৳ ৯৬,০০০ – ৳ ১,৪৪,০০০</td>
                  <td className="py-3.5 px-4 font-sans text-xs">স্ট্যাম্প চুক্তি + সিকিউরিটি চেক</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-bold text-slate-900">৳ ২,০০,০০০</td>
                  <td className="py-3.5 px-4 text-emerald-600 font-bold">৳ ১৬,০০০ – ৳ ২৪,০০০</td>
                  <td className="py-3.5 px-4">৳ ১,৯২,০০০ – ৳ ২,৮৮,০০০</td>
                  <td className="py-3.5 px-4 font-sans text-xs">স্ট্যাম্প চুক্তি + সিকিউরিটি চেক</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-bold text-slate-900">৳ ৫,০০,০০০</td>
                  <td className="py-3.5 px-4 text-emerald-600 font-bold">৳ ৪০,০০০ – ৳ ৬০,০০০</td>
                  <td className="py-3.5 px-4">৳ ৪,৮০,০০০ – ৳ ৭,২০,০০০</td>
                  <td className="py-3.5 px-4 font-sans text-xs">ভিআইপি চুক্তি + সিকিউরিটি চেক</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Executive Direct Meeting CTA */}
        <div className="bg-gradient-to-br from-indigo-50/90 via-white to-purple-50/70 border-2 border-indigo-200 text-slate-900 rounded-3xl p-8 sm:p-10 shadow-lg text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200 px-3.5 py-1 text-xs font-bold mb-4">
            <FiUserCheck className="h-4 w-4 text-indigo-600" />
            <span>পরিচালকের সাথে সরাসরি আলোচনা</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black mb-3 text-slate-900">
            বিনিয়োগের চুক্তিপত্র দেখতে চান?
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto mb-6 leading-relaxed">
            সরাসরি আমাদের WhatsApp-এ কথা বলে ৩০০ টাকার স্ট্যাম্প চুক্তির খসড়া দেখুন অথবা সুনামগঞ্জ অফিসে পরিচালকের সাথে মিটিংয়ের শিডিউল নির্ধারণ করুন।
          </p>
          <a
            href={getWhatsAppUrl("হ্যালো SupplyLink, আমি একজন বিনিয়োগকারী হিসেবে ৩০০ টাকার স্ট্যাম্প চুক্তির নিয়মাবলী ও মুনাফা নিয়ে পরিচালকের সাথে সরাসরি আলোচনা করতে চাই।")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-bold text-sm shadow-md shadow-green-500/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <FaWhatsapp className="h-5 w-5" />
            <span>পরিচালকের সাথে WhatsApp-এ মিটিং শিডিউল করুন</span>
          </a>
        </div>
      </div>
    </div>
  );
}

