"use client";
import { useState } from "react";
import {
  FiCheckCircle,
  FiBarChart2,
  FiRefreshCw,
  FiLock,
} from "react-icons/fi";

const investorCards = [
  {
    icon: <FiBarChart2 size={22} />,
    title: "মাসিক রিটার্ন",
    value: "সম্ভাব্য ৮–১২%",
    desc: "আপনার বিনিয়োগে স্থিতিশীল ও পূর্বানুমানযোগ্য আয়ের সুযোগ",
  },
  {
    icon: <FiRefreshCw size={22} />,
    title: "স্বয়ংক্রিয় পুনঃবিনিয়োগ",
    value: "স্বয়ংক্রিয়",
    desc: "লাভ পুনরায় বিনিয়োগ হয়ে কম্পাউন্ড গ্রোথে সহায়তা করে",
  },
  {
    icon: <FiLock size={22} />,
    title: "উচ্চ নিরাপত্তা",
    value: "২৫৬-বিট",
    desc: "ব্যাংক-মানের এনক্রিপশন আপনার প্রতিটি লেনদেন সুরক্ষিত রাখে",
  },
  {
    icon: <FiCheckCircle size={22} />,
    title: "যাচাইকৃত সম্পদ",
    value: "যাচাইকৃত",
    desc: "প্রতিটি পণ্য যাচাইকৃত ও ঝুঁকি-নিয়ন্ত্রিত বিনিয়োগের জন্য নির্বাচিত",
  },
];

const InvestorsHighLight = () => {
    const [open, setOpen] = useState(false);

  return (
    <section
      id="invest"
      className="relative py-24 px-6 overflow-hidden bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-100"
    >
      {/* Glow Background */}
      <div className="absolute -top-32 -right-32 w-[400px] h-[400px] bg-purple-400/20 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-0 left-0 w-[350px] h-[350px] bg-indigo-400/20 blur-[120px] rounded-full"></div>

      <div className="max-width mx-auto relative ">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">

          {/* LEFT CONTENT */}
          <div>
            <span className="text-indigo-600 text-xs font-semibold tracking-[0.25em] uppercase">
              বিনিয়োগকারীদের জন্য
            </span>

            <h2 className="mt-4 text-4xl md:text-5xl font-bold leading-tight text-slate-900">
              আপনার সম্পদ বৃদ্ধি করুন{" "}
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                স্মার্ট বিনিয়োগের মাধ্যমে
              </span>
            </h2>

            <p className="mt-6 text-slate-600 text-lg leading-relaxed max-w-xl">
              আমাদের যাচাইকৃত প্রোডাক্ট ফাইন্যান্সিং মডেলে বিনিয়োগ করে নিয়মিত মাসিক রিটার্নের সুযোগ পান।
              আপনার মূলধন বাস্তব ব্যবসায় ব্যবহৃত হয়, যা নিশ্চিত করে স্থিতিশীল ও টেকসই আয়।
            </p>

            {/* Trust badges */}
            <div className="mt-8 flex flex-wrap gap-4 text-sm text-slate-600">
              <span className="flex items-center gap-2">
                ✔ যাচাইকৃত বিনিয়োগ মডেল
              </span>
              <span className="flex items-center gap-2">
                ✔ স্বচ্ছ লাভ বণ্টন
              </span>
              <span className="flex items-center gap-2">
                ✔ নিরাপদ লেনদেন
              </span>
            </div>

            {/* CTA */}
            <div className="mt-10">
              <button               onClick={() => setOpen(true)}
 className="px-7 py-3 rounded-xl bg-indigo-600 text-white font-semibold shadow-lg hover:shadow-indigo-500/40 hover:scale-105 transition-all duration-300">
                বিনিয়োগ সম্পর্কে জানুন
              </button>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

            {/* Highlight Card */}
            <div className="sm:col-span-2 p-6 rounded-2xl bg-indigo-600 text-white shadow-lg">
              <h4 className="text-lg font-bold">লাভ বণ্টন মডেল</h4>
              <p className="text-sm mt-2 text-indigo-100 leading-relaxed">
                মোট লাভের ৫০% কোম্পানি এবং বাকি ৫০% বিনিয়োগকারীদের মধ্যে তাদের বিনিয়োগের পরিমাণ অনুযায়ী বণ্টন করা হয়।
              </p>
            </div>

            {/* Cards */}
            {investorCards.map((c, i) => (
              <div
                key={i}
                className="group rounded-2xl p-6 bg-white/60 backdrop-blur-xl border border-white/40 shadow hover:shadow-lg hover:-translate-y-2 transition-all duration-500"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition">
                    {c.icon}
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">{c.title}</p>
                    <p className="text-lg font-bold text-slate-900">
                      {c.value}
                    </p>
                  </div>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed">
                  {c.desc}
                </p>
              </div>
            ))}
          </div>

        </div>
      </div>
        {/* MODAL */}
      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center px-4">
          <div className="bg-white max-w-xl w-full rounded-2xl p-6 relative overflow-y-auto max-h-[90vh]">

            {/* CLOSE */}
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 text-xl"
            >
              ✕
            </button>

            <h3 className="text-xl font-bold mb-4">
              বিনিয়োগ সংক্রান্ত তথ্য
            </h3>

            {/* Profit */}
            <div className="bg-indigo-50 p-4 rounded-lg mb-4">
              <p>
                💰 মোট লাভের <b>৫০%</b> কোম্পানি এবং বাকি <b>৫০%</b> বিনিয়োগকারীদের মধ্যে বণ্টন করা হয়।
              </p>
            </div>

            {/* How */}
            <ul className="text-sm space-y-2 mb-4">
              <li>✔ প্রতি মাসে সম্ভাব্য লাভ দেখতে পারবেন</li>
              <li>✔ ব্যক্তিগত একাউন্ট থাকবে</li>
            </ul>

            {/* Rules */}
            <div className="bg-red-50 p-4 rounded-lg mb-4 text-sm text-red-600">
              <p className="font-semibold mb-2">⚠ গুরুত্বপূর্ণ শর্তাবলী:</p>
              <ul className="space-y-1">
                <li>• ১ বছরের আগে লাভ তোলা যাবে না</li>
                <li>• মূল টাকা তুলতে ১ মাস আগে আবেদন</li>
                <li>• ১ বছরের আগে তুললে লাভ পাবেন না</li>
                <li>• ১ বছর পর মূল টাকা + লাভ উত্তোলন</li>
              </ul>
            </div>

            {/* Requirements */}
            <div className="bg-slate-50 p-4 rounded-lg mb-4">
              <p className="font-semibold mb-2">
                প্রয়োজনীয় কাগজপত্র:
              </p>
              <ul className="text-sm space-y-1">
                <li>• NID / জন্ম নিবন্ধন</li>
                <li>• আপনার ছবি</li>
                <li>• নমিনির ছবি</li>
                <li>• নমিনির NID</li>
                <li>• মোবাইল নাম্বার</li>
              </ul>
            </div>

            {/* CTA */}
            <a
              href="https://wa.me/8801339631586"
              target="_blank"
              className="block text-center bg-indigo-600 text-white py-3 rounded-lg"
            >
              এখনই আবেদন করুন
            </a>
          </div>
        </div>
      )}
    </section>
  );
};

export default InvestorsHighLight;