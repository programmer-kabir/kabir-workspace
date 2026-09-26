import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff, FiAlertCircle, FiSun, FiMoon, FiCheckSquare, FiClock, FiCalendar, FiArrowRight, FiX } from 'react-icons/fi';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Theme state for Light / Dark mode
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Failed to sign in. Please verify your staff credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#080d1a] text-slate-900 dark:text-slate-100 transition-colors duration-500 overflow-x-hidden relative">

      {/* ── Split Layout ── */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-screen">

        {/* ── Left Hero Panel (Hidden on Mobile) ── */}
        <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-center items-center p-12 xl:p-16 overflow-hidden bg-gradient-to-br from-indigo-50/80 via-blue-50/50 to-slate-100 dark:from-[#0b1124] dark:via-[#090d1c] dark:to-[#060913] border-r border-slate-200/80 dark:border-slate-800/60">
          
          {/* Ambient Glows */}
          <div className="absolute -top-20 -left-20 w-96 h-96 bg-indigo-400/20 dark:bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-violet-400/20 dark:bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-lg text-center flex flex-col items-center">
            {/* Logo Avatar */}
            <div className="w-24 h-24 rounded-3xl bg-white dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/80 shadow-2xl p-4 mb-6 flex items-center justify-center backdrop-blur-xl">
              <img src="/logo.png" alt="CCA Logo" className="w-full h-full object-contain drop-shadow-md" />
            </div>

            <h1 className="text-3xl xl:text-4xl font-black tracking-tight leading-tight mb-4 text-slate-900 dark:text-white">
              Empowering Staff <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-blue-600 to-violet-600 dark:from-indigo-400 dark:via-blue-400 dark:to-violet-400">
                Productivity & Excellence
              </span>
            </h1>

            <p className="text-slate-600 dark:text-slate-400 text-sm xl:text-base font-medium leading-relaxed max-w-md mb-8">
              Access your daily task queue, track attendance, manage leaves, and collaborate with academy reviewers seamlessly.
            </p>

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-2 gap-3 w-full max-w-md">
              <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 shadow-sm backdrop-blur-md flex items-center gap-3 text-left">
                <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <FiCheckSquare size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Tasks Hub</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Live assignments</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 shadow-sm backdrop-blur-md flex items-center gap-3 text-left">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <FiClock size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Attendance</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Punch in / out</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 shadow-sm backdrop-blur-md flex items-center gap-3 text-left">
                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <FiCalendar size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Leave Portal</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Requests & balance</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 shadow-sm backdrop-blur-md flex items-center gap-3 text-left">
                <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <FiArrowRight size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Feedback</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Reviews & scores</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Form Panel ── */}
        <div className="flex-1 flex items-center justify-center p-6  relative z-10">
          
          <div className="w-full max-w-xl my-auto pt-16 lg:pt-0">
            
            {/* Form Card */}
            <div className="bg-white/95 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800/90 rounded-[28px] p-8 sm:p-10 shadow-2xl shadow-slate-300/50 dark:shadow-black/70 transition-all duration-300">
              
              {/* Header */}
              <div className="mb-8">
                <span className="inline-block px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-800/40 text-indigo-700 dark:text-indigo-300 text-[11px] font-extrabold uppercase tracking-wider mb-3">
                  Staff Workspace
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Welcome Back!
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">
                  Sign in to access your personal staff dashboard
                </p>
              </div>

              {/* High-Impact Error Alert */}
              {error && (
                <div className="relative overflow-hidden flex items-start gap-3 p-4 rounded-2xl bg-rose-50/95 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-500/40 text-rose-800 dark:text-rose-200 shadow-xl shadow-rose-500/10 dark:shadow-rose-950/40 backdrop-blur-md mb-6 animate-in slide-in-from-top-2 duration-300">
                  {/* Left accent bar */}
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-rose-500 to-red-600" />
                  
                  {/* Pulsing Icon Bubble */}
                  <div className="w-8 h-8 rounded-xl bg-rose-500/15 dark:bg-rose-500/25 border border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0 shadow-sm">
                    <FiAlertCircle size={18} className="animate-pulse" />
                  </div>

                  {/* Text content */}
                  <div className="flex-1 min-w-0 pr-1">
                    <h4 className="text-xs font-black text-rose-700 dark:text-rose-300 uppercase tracking-wider mb-0.5">
                      Authentication Failed
                    </h4>
                    <p className="text-xs font-semibold text-rose-600 dark:text-rose-300/90 leading-relaxed">
                      {error}
                    </p>
                  </div>

                  {/* Dismiss button */}
                  <button
                    type="button"
                    onClick={() => setError('')}
                    className="text-rose-400 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-200 transition-colors p-1 rounded-lg hover:bg-rose-500/10 shrink-0"
                    title="Dismiss alert"
                  >
                    <FiX size={15} />
                  </button>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                
                {/* Email Field */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Email Address
                  </label>
                  <div className="relative group/input">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within/input:text-indigo-600 dark:group-focus-within/input:text-indigo-400 transition-colors">
                      <FiMail size={17} />
                    </div>
                    <input
                      id="staff-email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={e => {
                        setEmail(e.target.value);
                        if (error) setError('');
                      }}
                      placeholder="staff@creativeacademy.com"
                      className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-medium outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 dark:focus:border-indigo-500 transition-all duration-200 shadow-sm"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Password
                    </label>
                    <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold cursor-pointer hover:underline">
                      Need help?
                    </span>
                  </div>
                  <div className="relative group/input">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within/input:text-indigo-600 dark:group-focus-within/input:text-indigo-400 transition-colors">
                      <FiLock size={17} />
                    </div>
                    <input
                      id="staff-password"
                      type={showPass ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={e => {
                        setPassword(e.target.value);
                        if (error) setError('');
                      }}
                      placeholder="••••••••••••"
                      className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-2xl pl-12 pr-12 py-3.5 text-sm font-medium outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 dark:focus:border-indigo-500 transition-all duration-200 shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(p => !p)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                    >
                      {showPass ? <FiEyeOff size={17} /> : <FiEye size={17} />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  id="staff-login-btn"
                  disabled={loading || !email || !password}
                  className="w-full mt-3 bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-500 hover:via-blue-500 hover:to-indigo-600 text-white font-extrabold py-3.5 px-6 rounded-2xl shadow-lg shadow-indigo-500/25 dark:shadow-indigo-900/30 hover:shadow-xl hover:shadow-indigo-500/35 transition-all duration-300 flex items-center justify-center gap-2 text-sm tracking-wide active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none cursor-pointer"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <span>Sign In to Staff Portal</span>
                  )}
                </button>
              </form>

              {/* Bottom Support & Theme Toggle */}
              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
                <span>Forgot password? Contact admin</span>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
                >
                  {theme === 'dark' ? <FiSun className="w-4 h-4 text-amber-400" /> : <FiMoon className="w-4 h-4 text-indigo-600" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
