import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FiHome,
  FiArrowLeft,
  FiRefreshCw,
  FiCompass,
  FiBookOpen,
  FiDollarSign,
  FiShield,
  FiHelpCircle,
} from "react-icons/fi";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleReload = () => {
    window.location.reload();
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-800 flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden font-sans select-none">
      {/* Background Soft Glows (White / Light Mode) */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-indigo-200/40 via-purple-100/30 to-sky-200/30 rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-100/40 rounded-full blur-[90px] pointer-events-none" />
      <div className="absolute -top-20 -right-20 w-80 h-80 bg-purple-100/40 rounded-full blur-[90px] pointer-events-none" />

      {/* Decorative Micro Dot Grid */}
      <div
        className="absolute inset-0 opacity-[0.4] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(148, 163, 184, 0.3) 1px, transparent 0)`,
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative z-10 w-full max-w-2xl mx-auto text-center">
        {/* Brand Chip */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 border border-slate-200/80 shadow-sm text-xs font-semibold text-indigo-700 mb-6 backdrop-blur-md">
          <FiShield className="text-indigo-600" />
          <span>SupplyLink • Official Platform</span>
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
        </div>

        {/* Big 404 Hero Visual in White Mode */}
        <div className="relative my-2 flex items-center justify-center">
          <span className="text-[100px] sm:text-[140px] md:text-[160px] font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-slate-900 via-slate-700/80 to-slate-300 drop-shadow-sm select-none leading-none">
            404
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white border border-indigo-100 shadow-xl shadow-indigo-200/50 text-indigo-600 transform -rotate-6 hover:rotate-0 transition duration-300">
              <FiCompass className="text-4xl sm:text-5xl text-indigo-600 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Headings */}
        <div className="mt-4 space-y-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            পৃষ্ঠাটি খুঁজে পাওয়া যায়নি
          </h1>
          <p className="text-xs sm:text-sm uppercase tracking-widest font-semibold text-indigo-600">
            Page Not Found • 404
          </p>
        </div>

        {/* Message */}
        <p className="mt-4 text-sm sm:text-base text-slate-600 max-w-lg mx-auto leading-relaxed">
          আপনি যে লিঙ্কটিতে প্রবেশের চেষ্টা করছেন তা বর্তমানে বিদ্যমান নেই, সরিয়ে ফেলা হয়েছে অথবা লিঙ্কটি ভুল।
        </p>

        {/* Current Path Badge */}
        <div className="mt-5 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200/90 shadow-sm text-xs font-mono text-slate-500 max-w-full overflow-hidden text-ellipsis">
          <span className="text-slate-400">অনুরোধকৃত পথ:</span>
          <span className="text-indigo-600 font-semibold">{location?.pathname || "/404"}</span>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm sm:text-base shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition duration-200 cursor-pointer"
          >
            <FiHome className="text-lg" />
            হোম পেজে ফিরে যান
          </Link>

          <button
            type="button"
            onClick={handleGoBack}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium text-sm sm:text-base shadow-sm transition duration-200 cursor-pointer"
          >
            <FiArrowLeft className="text-lg" />
            পেছনে যান
          </button>

          <button
            type="button"
            onClick={handleReload}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-800 text-sm shadow-sm transition duration-200 cursor-pointer"
            title="পৃষ্ঠা রিফ্রেশ করুন"
          >
            <FiRefreshCw className="text-base" />
            রিলোড
          </button>
        </div>

        {/* Helpful Public Section Shortcuts */}
        <div className="mt-10 pt-6 border-t border-slate-200/70">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-3">
            প্রয়োজনীয় লিংকসমূহ
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Link
              to="/installment-rules"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200/80 text-xs text-slate-600 hover:text-indigo-600 shadow-sm transition"
            >
              <FiBookOpen className="text-xs text-indigo-500" />
              কিস্তির নিয়মাবলী
            </Link>
            <Link
              to="/investors"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200/80 text-xs text-slate-600 hover:text-indigo-600 shadow-sm transition"
            >
              <FiDollarSign className="text-xs text-emerald-500" />
              বিনিয়োগ নির্দেশিকা
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200/80 text-xs text-slate-600 hover:text-indigo-600 shadow-sm transition"
            >
              <FiHelpCircle className="text-xs text-sky-500" />
              হোম ও সাপোর্ট
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
