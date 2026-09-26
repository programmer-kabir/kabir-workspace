import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiMail, FiLock, FiEye, FiEyeOff, FiShield, FiAlertCircle,
  FiSun, FiMoon, FiCheckCircle, FiX, FiArrowRight, FiActivity,
  FiAward, FiClock, FiCheck, FiLayers
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Theme state for Light / Dark mode
  const [theme, setTheme] = useState(() => localStorage.getItem('cca_reviewer_theme') || 'light');

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
    }
    localStorage.setItem('cca_reviewer_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed. Please verify your reviewer credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-500 overflow-x-hidden">
      
      {/* ── Main Full-Page Split Container ── */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-screen">

        {/* ════════════════════════════════════════════════════════════════════
            LEFT COLUMN: Rich Evaluation Showcase & Interactive Dashboard Hero
           ════════════════════════════════════════════════════════════════════ */}
        <div className="hidden lg:flex lg:w-7/12 xl:w-3/5 relative flex-col justify-between p-10 xl:p-14 overflow-hidden bg-gradient-to-br from-slate-100 via-indigo-50/70 to-blue-100/50 dark:from-[#090e1d] dark:via-[#070b17] dark:to-[#050711] border-r border-slate-200/80 dark:border-slate-800/80">
          
          {/* Subtle Ambient Background Grids and Orbs */}
          <div className="absolute inset-0 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.07] dark:opacity-[0.14] pointer-events-none" />
          <div className="absolute -top-24 -left-24 w-[500px] h-[500px] bg-blue-500/15 dark:bg-blue-600/15 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-[500px] h-[500px] bg-purple-500/15 dark:bg-purple-600/15 rounded-full blur-[100px] pointer-events-none" />

          {/* Top Brand Header */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#ffffff] dark:bg-slate-800 shadow-md border border-slate-200/80 dark:border-slate-700 flex items-center justify-center p-2">
              <img src="/logo.png" alt="CCA Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight text-slate-900 dark:text-[#ffffff] leading-tight">
                Creative Computer Academy
              </h2>
              <p className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1">
                <span>Task Quality Evaluation Console</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
              </p>
            </div>
          </div>

          {/* Central Showcase Content */}
          <div className="relative z-10 my-auto py-8 space-y-7 max-w-xl">
            
            {/* Mission Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#ffffff] dark:bg-slate-800/90 shadow-sm border border-slate-200/80 dark:border-slate-700 text-xs font-black text-indigo-700 dark:text-indigo-300">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
              <HiSparkles className="text-amber-500" />
              <span>CCA Evaluation Architecture 3.0</span>
            </div>

            {/* Impact Headline */}
            <div className="space-y-3">
              <h1 className="text-3xl xl:text-4xl 2xl:text-5xl font-black text-slate-900 dark:text-[#ffffff] tracking-tight leading-[1.18]">
                Precision Grading & Feedback for Future Tech Leaders.
              </h1>
              <p className="text-sm xl:text-base text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                Empowering instructors, senior evaluators, and staff to critique deliverables, score design rubrics, verify brand guidelines, and ensure zero-compromise academy quality.
              </p>
            </div>

            {/* Live Metrics Row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-[#ffffff]/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 shadow-sm backdrop-blur-md">
                <p className="text-xl xl:text-2xl font-black text-indigo-600 dark:text-indigo-400">99.6%</p>
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">Evaluation Quality</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#ffffff]/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 shadow-sm backdrop-blur-md">
                <p className="text-xl xl:text-2xl font-black text-purple-600 dark:text-purple-400">14,800+</p>
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">Tasks Reviewed</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#ffffff]/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 shadow-sm backdrop-blur-md">
                <p className="text-xl xl:text-2xl font-black text-emerald-600 dark:text-emerald-400">&lt; 3.5h</p>
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">Turnaround Time</p>
              </div>
            </div>

            {/* Simulated Live Review Cards (Visual WOW Factor) */}
            <div className="space-y-3 pt-2">
              
              {/* Card 1: Completed Review */}
              <div className="p-4 rounded-2xl bg-[#ffffff] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md flex items-center justify-between gap-4 transition-transform hover:translate-x-1">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center shrink-0">
                    <FiCheck size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-slate-900 dark:text-[#ffffff] truncate">
                      Student Milestone: Creative Banner Set
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 flex items-center gap-1.5">
                      <span>Sumon Ahmed (Batch 42)</span>
                      <span>•</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">Grade: 98/100 (A+)</span>
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                  Approved
                </span>
              </div>

              {/* Card 2: In-Review Milestone */}
              <div className="p-4 rounded-2xl bg-[#ffffff] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md flex items-center justify-between gap-4 transition-transform hover:translate-x-1">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800 flex items-center justify-center shrink-0">
                    <FiLayers size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-slate-900 dark:text-[#ffffff] truncate">
                      Brand Resource Verification: Sunset Glow Palette
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 flex items-center gap-1.5">
                      <span>Submitted by Reviewer</span>
                      <span>•</span>
                      <span className="text-purple-600 dark:text-purple-400 font-bold">4 Color Harmony</span>
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shrink-0 flex items-center gap-1">
                  <FiClock size={11} /> Pending Admin
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Trust Pillars */}
          <div className="relative z-10 pt-4 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <FiShield className="text-indigo-600 dark:text-indigo-400" />
                <span>256-Bit SSL Secured</span>
              </span>
              <span className="flex items-center gap-1.5">
                <FiActivity className="text-emerald-600 dark:text-emerald-400" />
                <span>Live Socket Sync</span>
              </span>
              <span className="flex items-center gap-1.5">
                <FiAward className="text-purple-600 dark:text-purple-400" />
                <span>CCA Certified QA</span>
              </span>
            </div>
            <span className="font-mono text-[11px]">v3.5 Production</span>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            RIGHT COLUMN: Clean, High-Contrast Authentication Panel
           ════════════════════════════════════════════════════════════════════ */}
        <div className="flex-1 flex flex-col justify-between p-6 sm:p-10 xl:p-14 bg-[#ffffff] dark:bg-[#070b14] relative z-20">
          
          {/* Top Bar with Mobile Brand and Theme Toggle */}
          <div className="flex items-center justify-between pb-6 sm:pb-8">
            <div className="flex lg:hidden items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 p-1.5 border border-slate-200 dark:border-slate-700">
                <img src="/logo.png" alt="CCA" className="w-full h-full object-contain" />
              </div>
              <span className="text-xs font-black text-slate-800 dark:text-[#ffffff]">Reviewer Portal</span>
            </div>

            <span className="hidden lg:inline-block text-xs font-bold text-slate-400 uppercase tracking-wider">
              Evaluator Authentication
            </span>

            {/* Smooth Theme Switcher */}
            <button
              type="button"
              onClick={toggleTheme}
              className="px-3.5 py-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? (
                <>
                  <FiSun className="w-4 h-4 text-amber-400" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <FiMoon className="w-4 h-4 text-indigo-600" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>
          </div>

          {/* Form Container (Centered vertically) */}
          <div className="w-full max-w-md mx-auto my-auto space-y-6">
            
            {/* Header */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                <HiSparkles size={13} />
                <span>Authorized Reviewers Only</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-[#ffffff] tracking-tight">
                Sign In to Review Desk
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                Enter your reviewer email and security credentials to evaluate deliverables.
              </p>
            </div>

            {/* High-Impact Error Alert */}
            {error && (
              <div className="relative overflow-hidden flex items-start gap-3 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 shadow-sm animate-in slide-in-from-top-2 duration-300">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500" />
                <div className="w-7 h-7 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <FiAlertCircle size={16} />
                </div>
                <div className="flex-1 min-w-0 pr-1 text-xs">
                  <h4 className="font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider text-[10px]">
                    Authentication Failed
                  </h4>
                  <p className="text-slate-600 dark:text-rose-200/90 font-medium mt-0.5 leading-relaxed">
                    {error}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setError('')}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <FiX size={14} />
                </button>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Reviewer Email */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Reviewer Email Address
                </label>
                <div className="relative group/input">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within/input:text-indigo-600 dark:group-focus-within/input:text-indigo-400 transition-colors">
                    <FiMail size={17} />
                  </div>
                  <input
                    id="reviewer-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={e => {
                      setEmail(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="reviewer@creativeacademy.com"
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-[#ffffff] placeholder-slate-400 dark:placeholder-slate-500 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-medium outline-none focus:bg-[#ffffff] dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 dark:focus:border-indigo-500 transition-all shadow-2xs"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Security Password
                  </label>
                  <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold cursor-pointer hover:underline">
                    Forgot Key?
                  </span>
                </div>
                <div className="relative group/input">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within/input:text-indigo-600 dark:group-focus-within/input:text-indigo-400 transition-colors">
                    <FiLock size={17} />
                  </div>
                  <input
                    id="reviewer-password"
                    type={showPwd ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={e => {
                      setPassword(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-[#ffffff] placeholder-slate-400 dark:placeholder-slate-500 rounded-2xl pl-11 pr-11 py-3.5 text-sm font-medium outline-none focus:bg-[#ffffff] dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 dark:focus:border-indigo-500 transition-all shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 cursor-pointer"
                  >
                    {showPwd ? <FiEyeOff size={17} /> : <FiEye size={17} />}
                  </button>
                </div>
              </div>

              {/* Submit Button (Vibrant & Always White Text) */}
              <button
                type="submit"
                id="reviewer-login-btn"
                disabled={loading || !email || !password}
                className="w-full mt-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-[#ffffff] font-black py-4 px-6 rounded-2xl shadow-xl shadow-indigo-600/25 hover:shadow-indigo-600/35 transition-all duration-300 flex items-center justify-center gap-2 text-sm tracking-wide active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none cursor-pointer border border-[#ffffff]/20"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#ffffff]/30 border-t-[#ffffff] rounded-full animate-spin" />
                    <span>Signing in to Review Desk...</span>
                  </>
                ) : (
                  <>
                    <FiShield size={17} />
                    <span>Access Review Dashboard</span>
                    <FiArrowRight size={17} className="ml-1" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Helper Pill */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-center space-y-1.5">
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                CCA Senior Reviewer Desk Security
              </p>
              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                <FiCheckCircle size={13} className="text-emerald-500" />
                <span>Encrypted Role-Based Review Access</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-slate-400 text-xs font-medium text-center sm:text-left">
            <p>Creative Computer Academy © {new Date().getFullYear()}</p>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="hover:underline cursor-pointer">Privacy Protocol</span>
              <span>•</span>
              <span className="hover:underline cursor-pointer">Security Compliance</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
