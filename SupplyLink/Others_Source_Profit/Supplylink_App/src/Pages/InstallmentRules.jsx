import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FiCheckCircle,
  FiArrowLeft,
  FiPercent,
  FiFileText,
  FiShield,
  FiClock,
  FiTruck,
  FiCreditCard,
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { CONTACT_INFO, getWhatsAppUrl } from "../constants/links";

export default function InstallmentRules() {
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
          <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 bg-indigo-50 border border-indigo-100 px-3.5 py-1.5 rounded-full mb-3">
            গ্রাহক নির্দেশিকা
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
            SupplyLink কিস্তির সম্পূর্ণ নিয়ম ও শর্তাবলী
          </h1>
          <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
            কোনো গোপন চার্জ বা জটিল শর্ত ছাড়া স্বচ্ছ ও সহজ কিস্তিতে পণ্য ক্রয়ের পূর্ণ বিবরণ।
          </p>
        </div>

        {/* Core Rules Grid: 6 Months (10%) & 12 Months (15%) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {/* Card 1: 6 Months */}
          <div className="rounded-3xl border-2 border-indigo-500/80 bg-white p-7 shadow-lg">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                স্বল্পমেয়াদী কিস্তি
              </span>
              <span className="rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-0.5 text-xs font-bold">
                ১০% অতিরিক্ত ফি
              </span>
            </div>

            <h3 className="text-2xl font-black text-slate-900 mb-2">
              ৬ মাসের কিস্তি প্ল্যান
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              পণ্য ক্রয়ের পর মোট অবশিষ্ট টাকার ওপর মাত্র ১০% অতিরিক্ত চার্জ প্রযোজ্য। স্বল্প সময়ে সম্পূর্ণ দায়মুক্ত হতে চান এমন গ্রাহকদের জন্য আদর্শ।
            </p>

            <div className="space-y-2.5 text-xs text-slate-700">
              <div className="flex items-center gap-2">
                <FiCheckCircle className="text-emerald-500" />
                <span>ন্যূনতম ৩০% ডাউনপেমেন্ট</span>
              </div>
              <div className="flex items-center gap-2">
                <FiCheckCircle className="text-emerald-500" />
                <span>কোনো লুকানো ফাইল চার্জ বা প্রসেসিং ফি নেই</span>
              </div>
              <div className="flex items-center gap-2">
                <FiCheckCircle className="text-emerald-500" />
                <span>আগে পরিশোধ করলে ফির ওপর বিশেষ ছাড়</span>
              </div>
            </div>
          </div>

          {/* Card 2: 12 Months */}
          <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-lg">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                এক বছর মেয়াদী কিস্তি
              </span>
              <span className="rounded-full bg-slate-100 text-slate-700 border border-slate-200 px-3 py-0.5 text-xs font-bold">
                ১৫% অতিরিক্ত ফি
              </span>
            </div>

            <h3 className="text-2xl font-black text-slate-900 mb-2">
              ১২ মাসের কিস্তি প্ল্যান
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              পণ্য ক্রয়ের পর মোট অবশিষ্ট টাকার ওপর মাত্র ১৫% অতিরিক্ত ফি প্রযোজ্য। প্রতি মাসে ছোট কিস্তিতে নিশ্চিন্তে ১ বছরে পরিশোধের সুবিধা।
            </p>

            <div className="space-y-2.5 text-xs text-slate-700">
              <div className="flex items-center gap-2">
                <FiCheckCircle className="text-emerald-500" />
                <span>ন্যূনতম ৩০% ডাউনপেমেন্ট</span>
              </div>
              <div className="flex items-center gap-2">
                <FiCheckCircle className="text-emerald-500" />
                <span>মাসিক কিস্তি অত্যন্ত সহনশীল ও কম</span>
              </div>
              <div className="flex items-center gap-2">
                <FiCheckCircle className="text-emerald-500" />
                <span>বিকাশ/নগদ/ব্যাংকের মাধ্যমে ঘরে বসে পরিশোধ</span>
              </div>
            </div>
          </div>
        </div>

        {/* Early Payoff Rebate Feature Banner */}
        <div className="rounded-3xl bg-amber-50 border border-amber-200 p-6 sm:p-8 mb-10 flex items-start gap-4 shadow-xs">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-800 text-2xl">
            <FiPercent />
          </div>
          <div>
            <h4 className="font-extrabold text-amber-950 text-base sm:text-lg">
              আগাম বা সময়ের পূর্বে পরিশোধে বিশেষ ছাড় (Early Payoff Rebate)
            </h4>
            <p className="text-xs sm:text-sm text-amber-900 mt-1 leading-relaxed">
              যদি কোনো গ্রাহক তার নির্বাচিত ৬ মাস বা ১২ মাসের মেয়াদ শেষ হওয়ার আগেই এককালীন সমস্ত কিস্তি পরিশোধ করে দেন, তবে অবশিষ্ট মাসের অতিরিক্ত চার্জ/ফির ওপর বিশেষ ছাড় বা রিবেট সুবিধা পাবেন। এতে গ্রাহকের অনেক টাকা সাশ্রয় হয়।
            </p>
          </div>
        </div>

        {/* Required Documents Checklist */}
        <div className="rounded-3xl border border-slate-200 bg-white p-7 sm:p-10 mb-10 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <FiFileText className="text-indigo-600" />
            <span>আবেদনের প্রয়োজনীয় কাগজপত্র (চেকলিস্ট)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs">
                ১
              </span>
              <div className="text-xs">
                <span className="font-bold text-slate-900 block">গ্রাহকের জাতীয় পরিচয়পত্র (NID)</span>
                <span className="text-slate-500">মূল কার্ডের উভয় পাশের স্পষ্ট ছবি বা ফটোকপি।</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs">
                ২
              </span>
              <div className="text-xs">
                <span className="font-bold text-slate-900 block">১ কপি পাসপোর্ট সাইজ ছবি</span>
                <span className="text-slate-500">গ্রাহকের সাম্প্রতিক তোলা স্পষ্ট রঙিন ছবি।</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs">
                ৩
              </span>
              <div className="text-xs">
                <span className="font-bold text-slate-900 block">১ জন পরিচিত গ্যারান্টরের NID</span>
                <span className="text-slate-500">পরিবারের সদস্য বা বিশ্বস্ত স্থানীয় ব্যক্তির NID।</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs">
                ৪
              </span>
              <div className="text-xs">
                <span className="font-bold text-slate-900 block">সক্রিয় মোবাইল নম্বর ও বর্তমান ঠিকানা</span>
                <span className="text-slate-500">ডেলিভারি ও কিস্তি নোটিফিকেশনের জন্য সচল নম্বর।</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
            <FiShield className="text-emerald-500 h-4 w-4 shrink-0" />
            <span>কোনো প্রকার ব্যাংক স্টেটমেন্ট, স্যালারি সার্টিফিকেট বা ক্রেডিট কার্ডের প্রয়োজন নেই।</span>
          </div>
        </div>

        {/* Contact WhatsApp Action */}
        <div className="text-center bg-gradient-to-br from-indigo-50/90 via-white to-purple-50/70 border-2 border-indigo-200 text-slate-900 rounded-3xl p-8 sm:p-10 shadow-lg">
          <h3 className="text-2xl font-black mb-2 text-slate-900">আজই কিস্তিতে আপনার পণ্য নিশ্চিত করুন</h3>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto mb-6">
            কাগজপত্রের ছবি তুলে সরাসরি আমাদের WhatsApp-এ পাঠান। মাত্র ৩ মিনিটে প্রাথমিক ভেরিফিকেশন সম্পন্ন হবে।
          </p>
          <a
            href={getWhatsAppUrl("হ্যালো SupplyLink, আমি কিস্তির নিয়মাবলী পড়েছি এবং প্রয়োজনীয় তথ্য পাঠিয়ে আবেদন করতে চাই।")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-bold text-sm shadow-md shadow-green-500/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <FaWhatsapp className="h-5 w-5" />
            <span>WhatsApp-এ আবেদন করুন</span>
          </a>
        </div>
      </div>
    </div>
  );
}

