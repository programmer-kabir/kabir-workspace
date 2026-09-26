import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiMail, FiLock, FiEye, FiEyeOff, FiAlertCircle,
  FiBookOpen, FiClock, FiCheckSquare, FiAward,
  FiArrowRight, FiX, FiShield, FiStar, FiUsers, FiCompass
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi2';
import ThemeToggle from '../components/ThemeToggle';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Failed to sign in. Please verify your student email & password.');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: <FiClock size={18} />,
      title: 'Smart Attendance',
      desc: 'Real-time punch & class log',
      color: 'from-blue-500/20 to-indigo-500/20',
      textColor: 'text-blue-500 dark:text-blue-400',
      border: 'border-blue-500/30'
    },
    {
      icon: <FiCheckSquare size={18} />,
      title: 'Live Assignments',
      desc: 'Submit & get reviewed',
      color: 'from-purple-500/20 to-pink-500/20',
      textColor: 'text-purple-500 dark:text-purple-400',
      border: 'border-purple-500/30'
    },
    {
      icon: <FiBookOpen size={18} />,
      title: 'Course Resources',
      desc: 'Lecture files & assets',
      color: 'from-emerald-500/20 to-teal-500/20',
      textColor: 'text-emerald-500 dark:text-emerald-400',
      border: 'border-emerald-500/30'
    },
    {
      icon: <FiAward size={18} />,
      title: 'Verified ID & Badges',
      desc: 'Academic recognition',
      color: 'from-amber-500/20 to-orange-500/20',
      textColor: 'text-amber-500 dark:text-amber-400',
      border: 'border-amber-500/30'
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#070b16] text-slate-900 dark:text-slate-100 transition-colors duration-500 overflow-x-hidden relative select-none">
      
      {/* ── Background Cyber-Grid Matrix ── */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
          backgroundSize: '32px 32px'
        }}
      />

      {/* ── Top Floating Navigation Deck ── */}
      <div className="absolute top-5 right-5 sm:top-6 sm:right-8 z-50 flex items-center gap-3">
        <ThemeToggle />
      </div>

      {/* ── Main Split Canvas ── */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-screen">

        {/* ── Left Hero Panel (Visual Showcase) ── */}
        <div className="hidden lg:flex lg:w-1/2 xl:w-[52%] relative flex-col justify-between p-12 xl:p-16 overflow-hidden bg-gradient-to-br from-indigo-50/80 via-purple-50/40 to-slate-100/90 dark:from-[#090e21] dark:via-[#0b0c1e] dark:to-[#050811] border-r border-slate-200/80 dark:border-slate-800/60">
          
          {/* Ambient Glowing Blobs */}
          <div className="absolute -top-28 -left-28 w-[450px] h-[450px] bg-gradient-to-br from-indigo-500/25 to-purple-500/20 dark:from-indigo-600/20 dark:to-purple-600/15 rounded-full blur-[100px] pointer-events-none animate-pulse" />
          <div className="absolute -bottom-28 -right-28 w-[450px] h-[450px] bg-gradient-to-tl from-purple-500/25 to-pink-500/20 dark:from-purple-600/20 dark:to-pink-600/15 rounded-full blur-[100px] pointer-events-none animate-pulse" />

          {/* Top Brand Pill */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3 relative z-10"
          >
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping inline-block" />
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                CCA Academic Year 2026
              </span>
            </div>
            <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-600 dark:text-indigo-400 text-xs font-bold">
              Official Portal
            </span>
          </motion.div>

          {/* Center Main Hero Showcase */}
          <div className="relative z-10 my-auto py-8 max-w-xl">
            
            {/* 3D Floating Glassmorphic Logo Card */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="w-24 h-24 rounded-3xl bg-white/95 dark:bg-slate-800/90 border border-white/80 dark:border-slate-700/80 shadow-2xl shadow-indigo-500/20 p-4 mb-6 flex items-center justify-center backdrop-blur-2xl group cursor-pointer"
            >
              <img
                src="/favicons.png"
                alt="Creative Computer Academy Logo"
                className="w-full h-full object-contain drop-shadow-md group-hover:scale-110 transition-transform duration-300"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/cca_logo.png';
                }}
              />
            </motion.div>

            {/* Hero Headlines */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <h1 className="text-3xl xl:text-[42px] font-black tracking-tight leading-[1.15] mb-4 text-slate-900 dark:text-white">
                Learn, Build & Master <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400">
                  Practical Tech Skills
                </span>
              </h1>

              <p className="text-slate-600 dark:text-slate-400 text-sm xl:text-[15px] font-medium leading-relaxed max-w-lg mb-8">
                Welcome to your centralized student workspace. Track daily class attendance, submit real-world project tasks, and elevate your professional career with expert instructors.
              </p>
            </motion.div>

            {/* Feature Matrix Cards */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="grid grid-cols-2 gap-3.5"
            >
              {features.map((f, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-2xl bg-white/85 dark:bg-slate-800/60 border ${f.border} shadow-xs backdrop-blur-md flex items-center gap-3 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 group cursor-default`}
                >
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${f.color} ${f.textColor} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-200`}>
                    {f.icon}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200 truncate">{f.title}</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">{f.desc}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Bottom Social Proof & Trust Strip */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="flex items-center justify-between border-t border-slate-200/80 dark:border-slate-800/60 pt-5 relative z-10 text-xs"
          >
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-semibold">
              <FiUsers className="text-indigo-500" size={15} />
              <span>Trusted by <strong>1,500+ Active Students</strong></span>
            </div>

            <div className="flex items-center gap-1.5 text-amber-500 font-black">
              <FiStar className="fill-amber-400 text-amber-400" size={14} />
              <span>4.9 / 5.0 Rating</span>
            </div>
          </motion.div>
        </div>

        {/* ── Right Form Panel (Interactive Login Deck) ── */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-10 xl:p-12 relative z-10">
          
          <motion.div 
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-lg my-auto pt-6 lg:pt-0"
          >
            
            {/* ── Ultra-Glassmorphic Form Container ── */}
            <div className="bg-white/95 dark:bg-[#0c1224]/90 backdrop-blur-3xl border border-slate-200/90 dark:border-slate-800/90 rounded-[32px] p-7 sm:p-10 shadow-2xl shadow-indigo-500/10 dark:shadow-black/80 relative overflow-hidden transition-all duration-300">
              
              {/* Subtle Top 3D Accent Line */}
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

              {/* Mobile Header Brand (Only on Mobile) */}
              <div className="flex items-center gap-3.5 mb-6 lg:hidden">
                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 shadow-md shrink-0">
                  <img src="/favicons.png" alt="CCA" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-base leading-tight">Creative Computer Academy</h3>
                  <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Student Portal</p>
                </div>
              </div>

              {/* Workspace Badge & Welcome Text */}
              <div className="mb-8">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 border border-indigo-500/25 text-indigo-700 dark:text-indigo-300 text-[11px] font-black uppercase tracking-wider mb-2.5">
                  <HiSparkles size={13} className="text-amber-500 animate-spin" style={{ animationDuration: '6s' }} />
                  <span>Student Workspace</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Welcome to Student Login
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium mt-1">
                  Enter your registered credentials to access your courses & dashboard.
                </p>
              </div>

              {/* High-Impact Animated Error Banner */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -10 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                    className="relative overflow-hidden flex items-start gap-3 p-4 rounded-2xl bg-rose-50/95 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-500/40 text-rose-800 dark:text-rose-200 shadow-xl shadow-rose-500/10 mb-6"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-rose-500 to-red-600" />
                    
                    <div className="w-8 h-8 rounded-xl bg-rose-500/15 dark:bg-rose-500/25 border border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0 shadow-xs">
                      <FiAlertCircle size={18} className="animate-pulse" />
                    </div>

                    <div className="flex-1 min-w-0 pr-1">
                      <h4 className="text-xs font-black text-rose-700 dark:text-rose-300 uppercase tracking-wider mb-0.5">
                        Authentication Failed
                      </h4>
                      <p className="text-xs font-semibold text-rose-600 dark:text-rose-300/90 leading-relaxed">
                        {error}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setError('')}
                      className="text-rose-400 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-200 transition-colors p-1 rounded-lg hover:bg-rose-500/10 shrink-0 cursor-pointer"
                      title="Dismiss alert"
                    >
                      <FiX size={15} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Form Inputs ── */}
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                
                {/* Email Field */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Student Email Address
                  </label>
                  <div className="relative group/input">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within/input:text-indigo-600 dark:group-focus-within/input:text-indigo-400 transition-colors">
                      <FiMail size={17} />
                    </div>
                    <input
                      id="student-email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={e => {
                        setEmail(e.target.value);
                        if (error) setError('');
                      }}
                      placeholder="student@creativeacademy.com"
                      className="w-full bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-medium outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 dark:focus:border-indigo-500 transition-all duration-200 shadow-xs"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Password
                    </label>
                    <a
                      href="#help"
                      onClick={(e) => { e.preventDefault(); alert("Please contact the CCA Academy Administration office to reset your student password."); }}
                      className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                    >
                      Forgot password?
                    </a>
                  </div>
                  <div className="relative group/input">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within/input:text-indigo-600 dark:group-focus-within/input:text-indigo-400 transition-colors">
                      <FiLock size={17} />
                    </div>
                    <input
                      id="student-password"
                      type={showPass ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={e => {
                        setPassword(e.target.value);
                        if (error) setError('');
                      }}
                      placeholder="••••••••••••"
                      className="w-full bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-2xl pl-12 pr-12 py-3.5 text-sm font-medium outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 dark:focus:border-indigo-500 transition-all duration-200 shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(p => !p)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer p-1"
                      title={showPass ? "Hide password" : "Show password"}
                    >
                      {showPass ? <FiEyeOff size={17} /> : <FiEye size={17} />}
                    </button>
                  </div>
                </div>

                {/* Remember Me Checkbox */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-600 dark:text-slate-400">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded-md border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-indigo-600 focus:ring-indigo-500/20 cursor-pointer"
                    />
                    <span>Remember my session</span>
                  </label>
                </div>

                {/* CTA Submit Button with Gradient Shimmer */}
                <button
                  type="submit"
                  id="student-login-btn"
                  disabled={loading || !email || !password}
                  className="w-full mt-3 relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:via-purple-500 hover:to-indigo-600 text-white font-extrabold py-3.5 px-6 rounded-2xl shadow-lg shadow-indigo-500/25 dark:shadow-indigo-900/40 hover:shadow-xl hover:shadow-indigo-500/35 transition-all duration-300 flex items-center justify-center gap-2 text-sm tracking-wide active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none cursor-pointer"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Authenticating Credentials...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign in to Student Dashboard</span>
                      <FiArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </form>

              {/* Secure Footer Notice */}
              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-center gap-2 text-slate-400 dark:text-slate-500 text-xs">
                <FiShield size={14} className="text-emerald-500 shrink-0" />
                <span className="font-medium">SSL 256-Bit Encrypted Academic Portal</span>
              </div>
            </div>

            {/* Bottom Academy Credits */}
            <p className="text-center text-xs font-semibold text-slate-400 dark:text-slate-600 mt-6">
              Creative Computer Academy &copy; {new Date().getFullYear()} — Excellence in Tech Education
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Login;
