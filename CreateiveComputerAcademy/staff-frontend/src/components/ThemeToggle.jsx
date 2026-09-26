import React, { useEffect, useState } from 'react';

const ThemeToggle = () => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('cca_theme') || localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return document.documentElement.classList.contains('dark') || window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('cca_theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('cca_theme', 'light');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  return (
    <button
      type="button"
      onClick={() => setIsDark(prev => !prev)}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label="Toggle Theme"
      className={`
        relative flex items-center w-14 h-7 rounded-full p-1 cursor-pointer
        transition-all duration-500 ease-in-out
        shadow-inner border
        focus:outline-none active:scale-95
        ${isDark
          ? 'bg-slate-800 border-slate-600 shadow-slate-900/60'
          : 'bg-amber-50 border-amber-200 shadow-amber-100/60'
        }
      `}
    >
      {/* Sun icon — left */}
      <span className={`absolute left-1.5 text-[13px] transition-all duration-300 ${isDark ? 'opacity-30 scale-75' : 'opacity-100 scale-100'}`}>
        ☀️
      </span>

      {/* Moon icon — right */}
      <span className={`absolute right-1.5 text-[13px] transition-all duration-300 ${isDark ? 'opacity-100 scale-100' : 'opacity-30 scale-75'}`}>
        🌙
      </span>

      {/* Sliding pill indicator */}
      <span
        className={`
          relative z-10 w-5 h-5 rounded-full shadow-md
          transition-all duration-500 ease-in-out
          flex items-center justify-center
          ${isDark
            ? 'translate-x-7 bg-slate-600 shadow-slate-900/80 ring-1 ring-slate-500'
            : 'translate-x-0 bg-white shadow-amber-200/80 ring-1 ring-amber-200'
          }
        `}
      />
    </button>
  );
};

export default ThemeToggle;
