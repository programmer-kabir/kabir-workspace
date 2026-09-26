import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff, FiAlertCircle, FiShield, FiSun, FiMoon, FiCheckCircle, FiX } from 'react-icons/fi';

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
      setError(err.message || 'Authentication failed. Please verify your admin credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-slate-100 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden transition-colors duration-500">
      
      {/* ── Ambient Background Glows ── */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-500/20 dark:bg-blue-600/15 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-500/20 dark:bg-indigo-600/15 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '10s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-400/10 dark:bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* ── Main Login Card Center ── */}
      <main className="w-full max-w-md mx-auto z-20">
        <div className="relative group">
          
          {/* Subtle Outer Neon Halo */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 rounded-[28px] blur-sm opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200" />

          {/* Card Container */}
          <div className="relative bg-white/90 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800/90 rounded-[26px] p-8 sm:p-10 shadow-2xl shadow-slate-300/40 dark:shadow-black/60 transition-colors duration-500">
            
            {/* Top Accent Line */}
            <div className="absolute top-0 left-8 right-8 h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-500 rounded-full" />

            {/* Header Content */}
            <div className="text-center mb-8 pt-2">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-b from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800/50 border border-blue-100 dark:border-slate-700/80 shadow-inner p-3 mb-4 transition-transform duration-300 hover:scale-105">
                <img src="/logo.png" alt="CCA Logo" className="w-full h-full object-contain drop-shadow-sm" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Admin Console</h1>
              <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium mt-1.5">
                Secure management hub for Creative Computer Academy
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
                  Admin Email
                </label>
                <div className="relative group/input">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within/input:text-blue-600 dark:group-focus-within/input:text-blue-400 transition-colors">
                    <FiMail size={17} />
                  </div>
                  <input
                    id="admin-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={e => {
                      setEmail(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="admin@cca.com"
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-medium outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 dark:focus:border-blue-500 transition-all duration-200 shadow-sm"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Password
                  </label>
                  <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold cursor-pointer hover:underline">
                    Restricted Area
                  </span>
                </div>
                <div className="relative group/input">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within/input:text-blue-600 dark:group-focus-within/input:text-blue-400 transition-colors">
                    <FiLock size={17} />
                  </div>
                  <input
                    id="admin-password"
                    type={showPass ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={e => {
                      setPassword(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-2xl pl-12 pr-12 py-3.5 text-sm font-medium outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 dark:focus:border-blue-500 transition-all duration-200 shadow-sm"
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
                id="admin-login-btn"
                disabled={loading || !email || !password}
                className="w-full mt-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:via-indigo-500 hover:to-blue-600 text-white font-extrabold py-3.5 px-6 rounded-2xl shadow-lg shadow-blue-500/25 dark:shadow-blue-900/30 hover:shadow-xl hover:shadow-blue-500/35 transition-all duration-300 flex items-center justify-center gap-2 text-sm tracking-wide active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Verifying Access...</span>
                  </>
                ) : (
                  <>
                    <FiShield size={16} />
                    <span>Access Admin Portal</span>
                  </>
                )}
              </button>
            </form>

            {/* Bottom Security Guarantee & Theme Switcher */}
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
              <div className="flex items-center gap-2">
                <FiCheckCircle className="text-emerald-500 dark:text-emerald-400" size={14} />
                <span>256-Bit SSL Encrypted</span>
              </div>
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
      </main>
    </div>
  );
};

export default Login;
