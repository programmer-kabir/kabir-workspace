import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ArrowLeft,
  ShieldAlert,
  Clock,
  HelpCircle,
  Sparkles,
  Compass,
  Layers,
  Search
} from "lucide-react";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen bg-[#0A0A14] text-white flex items-center justify-center p-6 overflow-hidden select-none font-sans">
      
      {/* AMBIENT BACKGROUND GLOWS & GRID */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-[#6C4FE0]/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-[#00D4FF]/10 blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* MAIN 404 CARD CONTAINER */}
      <div className="relative z-10 w-full max-w-2xl rounded-3xl border border-white/10 bg-gradient-to-b from-[#141424]/90 via-[#0F0F1D]/90 to-[#0A0A14]/95 p-8 sm:p-12 shadow-[0_0_80px_rgba(0,0,0,0.8)] backdrop-blur-2xl text-center space-y-8 animate-in fade-in zoom-in-95 duration-300">
        
        {/* TOP STATUS BADGE */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs font-bold tracking-wider uppercase shadow-inner">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
          </span>
          <span>HTTP 404 • Resource Not Found</span>
        </div>

        {/* 404 HERO NUMBER */}
        <div className="relative py-2">
          <h1 className="text-8xl sm:text-9xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-500 drop-shadow-[0_10px_30px_rgba(108,79,224,0.3)] font-mono">
            404
          </h1>
          <p className="text-xl sm:text-2xl font-extrabold text-white mt-2">
            Lost in Administrative Space
          </p>
          <p className="text-sm text-gray-400 max-w-md mx-auto mt-2 leading-relaxed">
            The administrative route, resource endpoint, or control page you requested does not exist or has been relocated.
          </p>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white font-bold text-xs transition-all cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Go Back Previous</span>
          </button>

          <Link
            to="/dashboard"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-xl shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <LayoutDashboard size={16} />
            <span>Return to Dashboard</span>
          </Link>
        </div>

        {/* QUICK JUMP SHORTCUTS */}
        <div className="pt-6 border-t border-white/10 space-y-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">
            Direct Administrative Jump:
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <Link
              to="/dashboard/content/pending"
              className="flex items-center justify-center gap-2 p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-amber-500/30 text-gray-300 hover:text-amber-300 transition group"
            >
              <Clock size={14} className="text-amber-400 group-hover:scale-110 transition-transform" />
              <span>Pending Review</span>
            </Link>

            <Link
              to="/dashboard/allcontent"
              className="flex items-center justify-center gap-2 p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-indigo-500/30 text-gray-300 hover:text-indigo-300 transition group"
            >
              <Layers size={14} className="text-indigo-400 group-hover:scale-110 transition-transform" />
              <span>All Contents</span>
            </Link>

            <Link
              to="/dashboard/users/author-level-rules"
              className="flex items-center justify-center gap-2 p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-purple-500/30 text-gray-300 hover:text-purple-300 transition group"
            >
              <Sparkles size={14} className="text-purple-400 group-hover:scale-110 transition-transform" />
              <span>Level Rules</span>
            </Link>
          </div>
        </div>

        {/* FOOTER NOTICE */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-gray-500">
          <ShieldAlert size={13} className="text-gray-400" />
          <span>DayalStock Admin Control • Restricted & Encrypted Gateway</span>
        </div>

      </div>

    </div>
  );
};

export default NotFound;