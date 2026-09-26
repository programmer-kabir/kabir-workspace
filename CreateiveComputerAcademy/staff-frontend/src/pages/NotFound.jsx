import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  FiHome, 
  FiArrowLeft, 
  FiCompass, 
  FiSun, 
  FiMoon, 
  FiCheckSquare, 
  FiClock, 
  FiCalendar, 
  FiMessageSquare, 
  FiUser 
} from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';

const NotFound = () => {
  const navigate = useNavigate();
  const { toggleTheme } = useTheme();
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  const quickLinks = [
    { label: 'Dashboard', path: '/', icon: <FiHome className="w-4 h-4" /> },
    { label: 'My Tasks', path: '/tasks', icon: <FiCheckSquare className="w-4 h-4" /> },
    { label: 'Attendance', path: '/attendance', icon: <FiClock className="w-4 h-4" /> },
    { label: 'Leave Requests', path: '/leave', icon: <FiCalendar className="w-4 h-4" /> },
    { label: 'Messages', path: '/messages', icon: <FiMessageSquare className="w-4 h-4" /> },
    { label: 'My Profile', path: '/profile', icon: <FiUser className="w-4 h-4" /> },
  ];

  return (
    <div className="relative min-h-screen w-full bg-slate-50 dark:bg-[#0B1120] text-slate-800 dark:text-slate-100 flex flex-col justify-between overflow-hidden transition-colors duration-500 selection:bg-indigo-500 selection:text-white">
      
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-indigo-500/20 via-sky-500/20 to-teal-500/10 dark:from-indigo-600/20 dark:via-sky-600/20 dark:to-teal-600/15 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '6s' }} />
      <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-indigo-400/10 dark:bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-20 -right-20 w-96 h-96 bg-sky-400/10 dark:bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Decorative Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:28px_28px] pointer-events-none" />

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8 text-center max-w-3xl mx-auto">
        
        {/* Floating 404 Visual */}
        <div className="relative mb-6">
          <div className="text-[110px] sm:text-[160px] md:text-[180px] font-black leading-none tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-slate-900 via-slate-700 to-slate-400 dark:from-white dark:via-slate-200 dark:to-slate-600 drop-shadow-sm select-none">
            404
          </div>
          
          {/* Badge */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-700/80 px-4 py-2 rounded-2xl shadow-xl flex items-center gap-2.5 transform -rotate-6 hover:rotate-0 transition-transform duration-300">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-500 to-sky-500 text-white animate-spin" style={{ animationDuration: '10s' }}>
              <FiCompass className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-bold tracking-wider text-indigo-500 uppercase">Destination Missing</p>
              <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">PAGE NOT FOUND</p>
            </div>
          </div>
        </div>

        {/* Heading & Text */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-3">
          Looking for a missing page?
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-lg mb-8 leading-relaxed">
          The link you followed may be broken or the page may have been removed. Let's return you safely back to your workspace.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-10 w-full">
          <button
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-700/70 hover:border-slate-400 dark:hover:border-slate-600 shadow-sm transition-all duration-200 cursor-pointer"
          >
            <FiArrowLeft className="w-4 h-4" />
            Go Back
          </button>
          
          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-sky-600 to-indigo-700 hover:from-indigo-500 hover:to-sky-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer"
          >
            <FiHome className="w-4 h-4" />
            Return to Dashboard
          </Link>
        </div>

        {/* Quick Navigation Links */}
        <div className="w-full bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
            Quick Workspace Links
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {quickLinks.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200/60 dark:border-slate-700/60 transition-all"
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full py-4 text-center text-xs text-slate-400 dark:text-slate-600 border-t border-slate-200/60 dark:border-slate-800/60 bg-white/40 dark:bg-slate-950/40 backdrop-blur-sm">
        © {new Date().getFullYear()} Creative Computer Academy • All rights reserved.
      </footer>
    </div>
  );
};

export default NotFound;
