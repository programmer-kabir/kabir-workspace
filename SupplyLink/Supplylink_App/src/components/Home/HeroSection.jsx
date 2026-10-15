"use client"
import { useState } from "react";
import {
  FiCheckCircle,
  FiHeadphones,
  FiShield,
  FiShoppingCart,
  FiTrendingUp,
} from "react-icons/fi";
export default function Hero() {
    const [open, setOpen] = useState(false);
  return (
    <header id="hero" className="relative hero-grid overflow-hidden scroll-pt-32 pb-20 pt-10 md:pt-40 md:pb-28 px-6">
      {/* Orbs remain the same, CSS handles their opacity on light bg */}
      <div
        className="orb w-96 h-96 bg-accent-600/20 absolute"
        style={{ top: "-100px", right: "-50px" }}
      ></div>
      <div
        className="orb w-72 h-72 bg-purple-600/15 absolute"
        style={{ bottom: "-50px", left: "-50px" }}
      ></div>
      <div className="max-width mx-auto relative">
        <div className="max-w-4xl">
          <div className="anim-fade-up delay-100 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent-500/30 bg-accent-500/10 text-accent-600 text-xs font-medium mb-8">
            <span className="w-2 h-2 rounded-full bg-accent-500 animate-pulse"></span>{" "}
            Fintech × E-Commerce Platform
          </div>
<h1 className="anim-fade-up delay-200 text-3xl md:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight text-gray-900">
  আপনার কেনাকাটা হোক <span className="gradient-text">সহজ কিস্তিতে</span>,
  আর বিনিয়োগে পান <span className="gradient-text">নিশ্চিত লাভ</span>
</h1>
          {/* UPDATED: Subtext color */}
          <p className="anim-fade-up delay-300 mt-6 text-lg md:text-xl text-gray-600 max-w-2xl leading-relaxed">
           SupplyLink বাণিজ্য এবং বিনিয়োগকে একসাথে যুক্ত করে। আপনি সহজ কিস্তিতে
            মানসম্মত পণ্য কিনতে পারেন অথবা একজন যাচাইকৃত বিনিয়োগকারী হিসেবে
            নিয়মিত লাভ অর্জন করতে পারেন।.
          </p>
      <div className="anim-fade-up delay-400 mt-10 flex flex-col sm:flex-row gap-4">

  <button className="btn-primary w-full sm:w-auto px-8 py-3.5 rounded-xl text-base font-semibold flex items-center justify-center gap-2">
    <FiShoppingCart size={20} /> এখনই কিনুন
  </button>

  <button
    onClick={() => setOpen(true)}
    className="btn-outline w-full sm:w-auto px-8 py-3.5 rounded-xl text-base font-medium flex items-center justify-center gap-2"
  >
    <FiTrendingUp size={20} /> বিনিয়োগ শুরু করার আগে জানুন
  </button>

</div>
          {/* UPDATED: Icon and text colors */}
          <div className="anim-fade-up delay-500 mt-12 flex items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <FiCheckCircle size={16} className="text-accent-500" /> কোনো লুকানো ফি নেই
            </div>
            <div className="flex items-center gap-2">
              <FiShield size={16} className="text-accent-500" /> নিরাপদ পেমেন্ট
            </div>
            <div className="flex items-center gap-2">
              <FiHeadphones size={16} className="text-accent-500" />               ২৪/৭ সাপোর্ট
            </div>
          </div>
        </div>
      </div>
      {open && (
  <div className="fixed inset-0  flex items-center justify-center bg-black/50 px-4">
    <div className="bg-white max-w-2xl w-full rounded-2xl p-6 md:p-8 relative shadow-xl">

      {/* Close */}
      <button
        onClick={() => setOpen(false)}
        className="absolute top-3 right-3 text-gray-500 text-xl"
      >
        ✕
      </button>

      <h3 className="text-2xl font-bold text-gray-900 mb-4">
        বিনিয়োগ সংক্রান্ত তথ্য
      </h3>

      <p className="text-gray-600 mb-4">
        SupplyLink-এ বিনিয়োগ করলে আপনি আমাদের সাথে অংশীদার হিসেবে যুক্ত হবেন।
        কোম্পানি ও বিনিয়োগকারীরা সম্মিলিতভাবে ব্যবসায় লাভ ভাগ করে নেবে।
      </p>

      {/* Highlight Box */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-4">
        <p className="text-sm text-gray-700">
          🔹 মোট লাভের <b>৫০%</b> কোম্পানির জন্য এবং বাকি <b>৫০%</b> সকল বিনিয়োগকারীদের মধ্যে
          তাদের বিনিয়োগের পরিমাণ অনুযায়ী বণ্টন করা হবে।
        </p>
      </div>

      <ul className="space-y-3 text-sm text-gray-600">
        <li>✔ আপনার বিনিয়োগ অনুযায়ী প্রতি মাসে সম্ভাব্য লাভ হিসাব দেখতে পারবেন</li>
        <li>✔ আপনার জন্য একটি ব্যক্তিগত একাউন্ট থাকবে যেখানে সব তথ্য দেখা যাবে</li>
      </ul>

      {/* Warning */}
      <div className="mt-5 bg-red-50 border border-red-200 rounded-xl p-4">
        <p className="text-sm text-red-600 font-medium">
          ⚠ গুরুত্বপূর্ণ শর্তাবলী:
        </p>

        <ul className="mt-2 text-sm text-red-600 space-y-2">
          <li>• ১ বছরের আগে কোনো লাভ উত্তোলন করা যাবে না</li>
          <li>• মূল টাকা উত্তোলনের জন্য কমপক্ষে ১ মাস আগে আবেদন করতে হবে</li>
          <li>• ১ বছরের আগে মূল টাকা তুললে কোনো লাভ প্রদান করা হবে না</li>
          <li>• ১ বছর পর মূল টাকা সহ সম্পূর্ণ লাভ উত্তোলন করা যাবে</li>
        </ul>
      </div>

      <div className="mt-6 text-center">
        <a
          href="https://wa.me/8801339631586"
          target="_blank"
          className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700"
        >
          এখনই শুরু করুন
        </a>
      </div>
    </div>
  </div>
)}
    </header>
  );
}
