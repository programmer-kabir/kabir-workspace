import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiArrowLeft, FiMaximize2, FiMinimize2, FiRotateCcw,
  FiVolume2, FiPenTool, FiCompass, FiAward, FiInfo,
  FiSun, FiMoon
} from 'react-icons/fi';

const AdobePenToolGame = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem('cca_theme') === 'dark' ||
      (!localStorage.getItem('cca_theme') && document.documentElement.classList.contains('dark'))
      ? 'dark' : 'light';
  });
  const iframeRef = useRef(null);

  const toggleTheme = () => {
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setCurrentTheme(nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('cca_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('cca_theme', 'light');
    }
  };

  // Sync with global theme toggles elsewhere in the portal
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains('dark');
      const detected = isDark ? 'dark' : 'light';
      if (detected !== currentTheme) {
        setCurrentTheme(detected);
      }
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [currentTheme]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Forward keydown events (such as 'p', 'P', 'Escape') to the game iframe
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage({
          type: 'KEYDOWN',
          key: e.key,
          keyCode: e.keyCode
        }, '*');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleReset = () => {
    if (iframeRef.current) {
      iframeRef.current.src = `/adobe-pen-tool/index.html?theme=${currentTheme}`;
    }
  };

  return (
    <div className={`transition-all duration-300 ${
      isFullscreen
        ? 'fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden w-screen h-screen flex flex-col'
        : 'p-4 sm:p-6 md:p-8 space-y-6 mx-auto'
    }`}>
      {/* ── FULLSCREEN TOP NAV BAR (When in Fullscreen Mode) ───────── */}
      {isFullscreen ? (
        <div className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-orange-100 dark:bg-orange-950/80 border border-orange-300 dark:border-orange-500/30 text-orange-800 dark:text-orange-300 text-xs font-black">
              <span>🚀 Pen Tool Space Game Fullscreen</span>
            </div>

            {/* Quick Shortcuts Pill */}
            <div className="hidden lg:flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300 font-medium px-3 py-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/60">
              <span><kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-900 rounded text-orange-600 dark:text-orange-400 font-mono font-bold shadow-xs">P</kbd> Select Pen</span>
              <span>•</span>
              <span><kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-900 rounded text-cyan-600 dark:text-cyan-400 font-mono font-bold shadow-xs">Click</kbd> Corner Node</span>
              <span>•</span>
              <span><kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-900 rounded text-cyan-600 dark:text-cyan-400 font-mono font-bold shadow-xs">Drag</kbd> Curve Handle</span>
              <span>•</span>
              <span><kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-900 rounded text-amber-600 dark:text-amber-400 font-mono font-bold shadow-xs">ESC</kbd> End Path</span>
            </div>
          </div>

          {/* Controls in Fullscreen */}
          <div className="flex items-center gap-2">
            {/* Fullscreen Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-slate-200 dark:border-slate-700 shadow-2xs"
              title={currentTheme === 'dark' ? "Switch to White/Light Mode" : "Switch to Dark Mode"}
            >
              {currentTheme === 'dark' ? <FiSun size={14} className="text-amber-400" /> : <FiMoon size={14} className="text-indigo-600" />}
              <span>{currentTheme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>

            <button
              onClick={handleReset}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-slate-200 dark:border-slate-700 shadow-2xs"
              title="Restart Game"
            >
              <FiRotateCcw size={14} />
              <span>Restart</span>
            </button>

            <button
              onClick={toggleFullscreen}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-slate-900 dark:border-slate-700 shadow-sm"
            >
              <FiMinimize2 size={14} />
              <span>Exit Fullscreen</span>
            </button>
          </div>
        </div>
      ) : (
        /* ── STANDARD MODE TOP HERO BANNER (MATCHING PEN TOOL & TYPING LAB) ─────── */
        <div className={`p-6 sm:p-7 rounded-3xl relative overflow-hidden transition-all duration-300 ${
          currentTheme === 'dark'
            ? 'bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white shadow-xl border border-purple-500/20'
            : 'bg-gradient-to-r from-violet-100/80 via-indigo-50/90 to-purple-100/80 text-slate-900 shadow-lg border border-purple-200/90'
        }`}>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <Link
                to="/pen-tool"
                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors mb-1"
              >
                <FiArrowLeft size={12} />
                <span>Back to Pen Tool Lab</span>
              </Link>
              <div className="flex items-center gap-2 flex-wrap">
                <div className={`inline-flex items-center gap-2 px-3 py-0.5 rounded-full text-xs font-bold border ${
                  currentTheme === 'dark'
                    ? 'bg-white/10 backdrop-blur-md text-orange-300 border-white/10'
                    : 'bg-white/80 backdrop-blur-md text-orange-800 border-purple-200/80 shadow-2xs'
                }`}>
                  <span>🚀 Space Vector Odyssey</span>
                  <span className="px-2 py-0.5 rounded-full bg-orange-500 text-slate-950 text-[10px] font-black tracking-wider">
                    1:1 OFFICIAL CLONE
                  </span>
                </div>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                <span>Adobe Pen Tool Space Game</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium max-w-2xl">
                Master Bézier curves, straight paths, and space tunnel navigation with Penny the explorer. Guide the ship through asteroid fields and master vector anchor precision.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
              {/* Theme Toggle Button */}
              <button
                type="button"
                onClick={toggleTheme}
                className={`px-3.5 py-2.5 rounded-2xl font-bold text-xs backdrop-blur-md cursor-pointer transition-all flex items-center gap-1.5 active:scale-95 border ${
                  currentTheme === 'dark'
                    ? 'bg-white/10 hover:bg-white/20 text-white border-white/20 shadow-lg'
                    : 'bg-white/90 hover:bg-white text-slate-800 border-slate-200 shadow-sm'
                }`}
                title={currentTheme === 'dark' ? "Switch to White/Light Mode" : "Switch to Dark Mode"}
              >
                {currentTheme === 'dark' ? <FiSun size={15} className="text-amber-400" /> : <FiMoon size={15} className="text-indigo-600" />}
                <span>{currentTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className={`px-3.5 py-2.5 rounded-2xl font-bold text-xs backdrop-blur-md cursor-pointer transition-all flex items-center gap-1.5 active:scale-95 border ${
                  currentTheme === 'dark'
                    ? 'bg-white/10 hover:bg-white/20 text-white border-white/20 shadow-lg'
                    : 'bg-white/90 hover:bg-white text-slate-800 border-slate-200 shadow-sm'
                }`}
                title="Restart Game"
              >
                <FiRotateCcw size={14} />
                <span>Restart</span>
              </button>

              <button
                type="button"
                onClick={toggleFullscreen}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-orange-500/25 cursor-pointer transition-all flex items-center gap-2 active:scale-95"
                title="Fullscreen"
              >
                <FiMaximize2 size={15} />
                <span>Fullscreen Game</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Iframe Container */}
      <div
        onClick={() => {
          if (iframeRef.current) {
            iframeRef.current.focus();
            iframeRef.current.contentWindow?.focus();
          }
        }}
        className={`relative w-full rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center transition-all bg-[#080210] ${
          isFullscreen ? 'flex-1 h-full' : 'w-full max-w-5xl mx-auto aspect-[16/9]'
        } ${
          currentTheme === 'dark'
            ? 'border border-purple-500/20 shadow-purple-950/30'
            : 'border border-slate-300/80 shadow-xl ring-1 ring-slate-200'
        }`}
      >
        <iframe
          ref={iframeRef}
          src="/adobe-pen-tool/index.html"
          title="Adobe Illustrator Pen Tool Game"
          className="w-full h-full border-none"
          allow="autoplay"
        />
      </div>

      {/* Shortcuts & Guide */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-1">
            <FiPenTool size={14} className="text-orange-500" /> Straight Lines
          </span>
          <p className="text-slate-500 dark:text-slate-400">
            Click on nodes in order. Single clicks create sharp corner points.
          </p>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-1">
            <FiCompass size={14} className="text-sky-500" /> Bézier Curves
          </span>
          <p className="text-slate-500 dark:text-slate-400">
            Click and drag to pull tangent handles. Longer handles create deeper curves.
          </p>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-1">
            <FiInfo size={14} className="text-amber-500" /> Keyboard Shortcuts
          </span>
          <p className="text-slate-500 dark:text-slate-400">
            Press <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-[10px] font-mono">ESC</kbd> to end path, and <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-[10px] font-mono">Alt</kbd> to break handles.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdobePenToolGame;
