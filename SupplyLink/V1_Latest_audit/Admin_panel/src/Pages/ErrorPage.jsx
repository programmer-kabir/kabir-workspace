import React, { useState } from "react";
import { Link, useLocation, useRouteError, useNavigate } from "react-router-dom";
import {
  FiHome,
  FiArrowLeft,
  FiRefreshCw,
  FiAlertTriangle,
  FiCompass,
  FiChevronDown,
  FiChevronUp,
  FiUsers,
  FiTrendingUp,
  FiShield,
} from "react-icons/fi";

export default function ErrorPage({
  title = "পৃষ্ঠাটি খুঁজে পাওয়া যায়নি",
  subtitle = "Page Not Found • 404",
  message = "আপনি যে লিঙ্ক বা ড্যাশবোর্ড সেকশনে প্রবেশের চেষ্টা করছেন তা বিদ্যমান নেই, সরিয়ে ফেলা হয়েছে অথবা লিংকটি ভুল।",
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const error = useRouteError();
  const [showDetails, setShowDetails] = useState(false);

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
    <div className="relative min-h-screen w-full bg-[#060a14] text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden font-sans select-none">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/15 to-sky-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -top-20 -right-20 w-80 h-80 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Decorative Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.8) 1px, transparent 0)`,
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative z-10 w-full max-w-2xl mx-auto text-center">
        {/* Portal Tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.05] border border-white/10 backdrop-blur-md text-xs font-medium text-indigo-300 shadow-sm mb-6">
          <FiShield className="text-indigo-400" />
          <span>SupplyLink Management Portal</span>
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
        </div>

        {/* Big 404 Hero Visual */}
        <div className="relative my-2 flex items-center justify-center">
          <span className="text-[100px] sm:text-[140px] md:text-[160px] font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white/90 via-slate-200/40 to-white/5 drop-shadow-2xl select-none leading-none">
            404
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-indigo-600/20 border border-indigo-400/30 backdrop-blur-xl shadow-2xl shadow-indigo-500/20 text-indigo-300 transform -rotate-6 hover:rotate-0 transition duration-300">
              <FiCompass className="text-4xl sm:text-5xl text-indigo-400 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Headings */}
        <div className="mt-4 space-y-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            {title}
          </h1>
          <p className="text-xs sm:text-sm uppercase tracking-widest font-semibold text-indigo-400">
            {subtitle}
          </p>
        </div>

        {/* Message */}
        <p className="mt-4 text-sm sm:text-base text-slate-300/80 max-w-lg mx-auto leading-relaxed">
          {message}
        </p>

        {/* Current Path Badge */}
        <div className="mt-5 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900/80 border border-white/[0.08] text-xs font-mono text-slate-400 max-w-full overflow-hidden text-ellipsis">
          <span className="text-slate-500">অনুরোধকৃত পথ:</span>
          <span className="text-indigo-300 font-semibold">{location?.pathname || "/unknown"}</span>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-medium text-sm sm:text-base shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 transition duration-200 cursor-pointer"
          >
            <FiHome className="text-lg" />
            ড্যাশবোর্ডে ফিরে যান
          </Link>

          <button
            type="button"
            onClick={handleGoBack}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 hover:border-white/20 text-slate-200 font-medium text-sm sm:text-base backdrop-blur-sm transition duration-200 cursor-pointer"
          >
            <FiArrowLeft className="text-lg" />
            পেছনে যান
          </button>

          <button
            type="button"
            onClick={handleReload}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 hover:text-white text-sm transition duration-200 cursor-pointer"
            title="পৃষ্ঠা রিফ্রেশ করুন"
          >
            <FiRefreshCw className="text-base" />
            রিলোড
          </button>
        </div>

        {/* Quick Portal Shortcuts */}
        <div className="mt-10 pt-6 border-t border-white/[0.06]">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-3">
            দ্রুত নেভিগেশন লিংক
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Link
              to="/customers/all_customer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-xs text-slate-300 hover:text-indigo-300 transition"
            >
              <FiUsers className="text-xs" />
              গ্রাহক তালিকা
            </Link>
            <Link
              to="/all_users"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-xs text-slate-300 hover:text-indigo-300 transition"
            >
              <FiShield className="text-xs" />
              ইউজার কন্ট্রোল
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-xs text-slate-300 hover:text-indigo-300 transition"
            >
              <FiTrendingUp className="text-xs" />
              ক্যাশ ও রিপোর্ট
            </Link>
          </div>
        </div>

        {/* Technical Error Accordion (Shown if React Router caught an unhandled runtime error) */}
        {error && (
          <div className="mt-8 text-left max-w-xl mx-auto">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-rose-950/40 border border-rose-500/20 text-rose-300 text-xs font-mono transition hover:bg-rose-950/60"
            >
              <span className="flex items-center gap-2">
                <FiAlertTriangle className="text-rose-400" />
                কারিগরি বিবরণ (Technical Details)
              </span>
              {showDetails ? <FiChevronUp /> : <FiChevronDown />}
            </button>

            {showDetails && (
              <div className="mt-2 p-3.5 rounded-xl bg-black/70 border border-rose-500/30 text-xs font-mono text-rose-300/90 max-h-48 overflow-y-auto space-y-1">
                <p className="font-semibold text-rose-200">
                  {error?.statusText || error?.message || String(error)}
                </p>
                {error?.stack && (
                  <pre className="text-[11px] text-rose-400/70 whitespace-pre-wrap font-mono mt-2">
                    {error.stack}
                  </pre>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
