import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiMaximize2, FiMinimize2, FiRotateCcw,
  FiZap, FiArrowLeft, FiPenTool, FiLayers, FiAward,
  FiCheckCircle, FiSun, FiMoon, FiCheck
} from 'react-icons/fi';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const STAGES = [
  { id: 0, name: 'Stage 1: Line' },
  { id: 1, name: 'Stage 2: Home' },
  { id: 2, name: 'Stage 3: Circle' },
  { id: 3, name: 'Stage 4: Heart' },
  { id: 4, name: 'Stage 5: Apple with Leaf' },
  { id: 5, name: 'Stage 6: Fish' },
  { id: 6, name: 'Stage 7: Butterfly' },
  { id: 7, name: 'Stage 8: Royal Crown' },
  { id: 8, name: 'Stage 9: Coffee Cup' },
  { id: 9, name: 'Stage 10: Nautical Anchor' },
  { id: 10, name: 'Stage 11: VW Beetle' },
  { id: 11, name: 'Stage 12: Plane' },
  { id: 12, name: 'Stage 13: Clip' },
  { id: 13, name: 'Stage 14: Wrench' },
  { id: 14, name: 'Stage 15: Cloud' },
  { id: 15, name: 'Stage 16: Profile' },
  { id: 16, name: 'Stage 17: Duck' },
  { id: 17, name: 'Stage 18: Cap' },
  { id: 18, name: 'Stage 19: Letter' },
  { id: 19, name: 'Stage 20: Guitar' },
  { id: 20, name: 'Stage 21: Flag (Last Stage)' },
];

const PenToolLab = () => {
  const { currentUser } = useAuth();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedStage, setSelectedStage] = useState(0);
  const [syncNotice, setSyncNotice] = useState(null);
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem('cca_theme') === 'dark' ||
      (!localStorage.getItem('cca_theme') && document.documentElement.classList.contains('dark'))
      ? 'dark' : 'light';
  });
  const iframeRef = useRef(null);

  // Microscopic Telemetry Listener: Sync stage completion to server
  useEffect(() => {
    const handleMessage = async (event) => {
      if (!event.data || event.data.type !== 'PENTOOL_STAGE_COMPLETE') return;
      const data = event.data;
      if (!currentUser?.id) return;

      try {
        const payload = {
          user_id: currentUser.id,
          stage_id: data.stageId,
          stage_name: data.stageName,
          nodes_used: data.nodesUsed,
          min_nodes: data.minNodes,
          nodes_available: data.nodesAvailable,
          duration_seconds: data.durationSeconds,
          attempts: data.attempts,
          undo_count: data.undoCount,
          is_completed: 1
        };

        const res = await axios.post(`${API_BASE}api/student/foundations/save_pentool_progress.php`, payload);
        if (res.data?.status === 'success') {
          setSyncNotice(`Stage ${data.stageId + 1} (${data.stageName}) saved to profile ✓`);
          setTimeout(() => setSyncNotice(null), 4500);
        }
      } catch (err) {
        console.error('Failed to sync Pen Tool progress:', err);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [currentUser]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleReset = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  const notifyIframeTheme = (theme) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage({ type: 'THEME_CHANGE', theme }, '*');
        if (typeof iframeRef.current.contentWindow.setTheme === 'function') {
          iframeRef.current.contentWindow.setTheme(theme);
        }
      } catch (e) {
        // cross-origin guard
      }
    }
  };

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
    notifyIframeTheme(nextTheme);
  };

  // Sync with global theme toggles elsewhere in the app
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains('dark');
      const detected = isDark ? 'dark' : 'light';
      if (detected !== currentTheme) {
        setCurrentTheme(detected);
        notifyIframeTheme(detected);
      }
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [currentTheme]);

  const handleJumpToStage = (stageId) => {
    setSelectedStage(stageId);
    if (!iframeRef.current || !iframeRef.current.contentWindow) return;
    try {
      const win = iframeRef.current.contentWindow;
      if (typeof win.jumpToStage === 'function') {
        win.jumpToStage(stageId);
      } else if (win.game) {
        win.game.play(Number(stageId));
      }
    } catch (e) {
      console.error('Failed to jump stage:', e);
    }
  };

  // Focus iframe on load and sync theme
  const handleIframeLoad = () => {
    notifyIframeTheme(currentTheme);
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        iframeRef.current.contentWindow.focus();
      } catch (e) {
        // cross-origin guard
      }
    }
  };

  return (
    <div className={`transition-all duration-300 ${isFullscreen
      ? 'fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden w-screen h-screen flex flex-col'
      : 'p-4 sm:p-6 md:p-8 space-y-6 mx-auto '
      }`}>
      {/* ── FULLSCREEN TOP NAV BAR (When in Fullscreen Mode) ───────── */}
      {isFullscreen ? (
        <div className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-cyan-100 dark:bg-cyan-950/80 border border-cyan-300 dark:border-cyan-500/30 text-cyan-800 dark:text-cyan-300 text-xs font-black">
              <span>✒️ Pen Tool Master Lab Fullscreen</span>
            </div>

            {/* Quick Shortcuts Pill */}
            <div className="hidden lg:flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300 font-medium px-3 py-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/60">
              <span><kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-900 rounded text-cyan-600 dark:text-cyan-400 font-mono font-bold shadow-xs">Click</kbd> Corner</span>
              <span>•</span>
              <span><kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-900 rounded text-cyan-600 dark:text-cyan-400 font-mono font-bold shadow-xs">Drag</kbd> Curve</span>
              <span>•</span>
              <span><kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-900 rounded text-amber-600 dark:text-amber-400 font-mono font-bold shadow-xs">Alt</kbd> Unlink Handle</span>
              <span>•</span>
              <span><kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-900 rounded text-indigo-600 dark:text-indigo-400 font-mono font-bold shadow-xs">Shift</kbd> 45° Snap</span>
            </div>
          </div>

          {/* Test & Mode Controls in Fullscreen */}
          <div className="flex items-center gap-2">
            {/* Stage Selector Dropdown (Commented out) */}
            {/* <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">Stage:</span>
              <select
                value={selectedStage}
                onChange={(e) => handleJumpToStage(e.target.value)}
                className="bg-transparent text-cyan-700 dark:text-cyan-300 text-xs font-bold outline-none cursor-pointer"
              >
                {STAGES.map((s) => (
                  <option key={s.id} value={s.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    {s.name}
                  </option>
                ))}
              </select>
            </div> */}

            {/* Mode / Theme Toggle Button (Commented out) */}
            {/* <button
              onClick={toggleTheme}
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
              title={currentTheme === 'dark' ? "Switch to White/Light Mode" : "Switch to Dark Mode"}
            >
              {currentTheme === 'dark' ? <FiSun size={15} className="text-amber-400" /> : <FiMoon size={15} />}
            </button> */}

            <button
              onClick={handleReset}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
              title="Reset current stage"
            >
              <FiRotateCcw size={14} />
              <span>Reset</span>
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
        /* ── STANDARD MODE TOP HERO BANNER (MATCHING TYPING ACADEMY) ─────── */
        <>
          <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-cyan-950 text-white shadow-xl relative overflow-hidden border border-cyan-500/20">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-white/10 backdrop-blur-md text-cyan-200 text-xs font-bold border border-white/10">
                  <span>✒️ Pen Tool Vector Academy</span>
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500 text-slate-950 text-[10px] font-black tracking-wider">
                    VECTOR MASTER PRO
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                  <span>Pen Tool Speed & Accuracy Academy</span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-2xl">
                  Master 21 vector stages, precision curved handles, Alt-key angle unlinking, and anchor point dynamics for Adobe Illustrator, Photoshop, and Figma.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
                {/* Stage Jump Selector (Commented out) */}
                <div className="flex items-center gap-1.5 bg-slate-800/90 px-3 py-2 rounded-2xl border border-slate-700/80 shadow-md">
                  <span className="text-[11px] font-bold uppercase text-slate-400">Stage:</span>
                  <select
                    value={selectedStage}
                    onChange={(e) => handleJumpToStage(e.target.value)}
                    className="bg-transparent text-cyan-300 text-xs font-bold outline-none cursor-pointer"
                  >
                    {STAGES.map((s) => (
                      <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleReset}
                  className="px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md font-bold text-xs shadow-lg cursor-pointer transition-all flex items-center gap-1.5 active:scale-95"
                  title="Reload current game"
                >
                  <FiRotateCcw size={14} />
                  <span>Reload</span>
                </button>

                <button
                  onClick={toggleFullscreen}
                  className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/25 cursor-pointer transition-all flex items-center gap-2 active:scale-95"
                >
                  <FiMaximize2 size={15} />
                  <span>Fullscreen Academy</span>
                </button>
              </div>
            </div>

            {/* Feature Pills */}
            <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center gap-3 text-xs text-slate-300">
              <div className="flex items-center gap-1.5 bg-slate-900/60 px-3 py-1 rounded-xl border border-white/5">
                <FiLayers className="text-cyan-400" size={14} />
                <span><strong>21 Vector Stages:</strong> Line, Circle, Heart, Crown, Anchor, Guitar, Coffee Cup & more</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-900/60 px-3 py-1 rounded-xl border border-white/5">
                <FiZap className="text-amber-400" size={14} />
                <span><strong>Precision Physics:</strong> Ultra-Smooth Control Dynamics</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-900/60 px-3 py-1 rounded-xl border border-white/5">
                <FiAward className="text-emerald-400" size={14} />
                <span><strong>Pro Vector Skills:</strong> Handle Breaking, 45° Snap & Node Budgeting</span>
              </div>
            </div>
          </div>

          {/* ── KEYBOARD SHORTCUTS & PRO-TIPS BAR ─────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 p-1.5 bg-white/85 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60">
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-0.5 bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 rounded border border-cyan-500/30 font-mono text-[11px] font-black">
                  Click
                </kbd>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Single Click</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Creates sharp corner points
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60">
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-0.5 bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 rounded border border-cyan-500/30 font-mono text-[11px] font-black">
                  Drag
                </kbd>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Click & Drag</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Creates smooth curved handles
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60">
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-0.5 bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded border border-amber-500/30 font-mono text-[11px] font-black">
                  Alt / Option
                </kbd>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Alt Key</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Breaks & unlinks handles
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60">
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-0.5 bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded border border-indigo-500/30 font-mono text-[11px] font-black">
                  Shift
                </kbd>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Shift Key</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Snaps angles to 45°
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-0.5 bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded border border-rose-500/30 font-mono text-[11px] font-black">
                  Ctrl+Z
                </kbd>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Undo</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Reverts to previous node
              </p>
            </div>
          </div>
        </>
      )}

      {/* ── PEN TOOL GAME CANVAS / IFRAME CONTAINER ─────────────────────── */}
      <div className={`relative w-full overflow-hidden shadow-2xl transition-colors duration-300 ${isFullscreen
        ? 'flex-1 h-full'
        : 'h-[680px] lg:h-[720px] rounded-3xl border border-slate-200 dark:border-slate-800'
        } ${currentTheme === 'dark' ? 'bg-[#1a202c]' : 'bg-[#f8fafc]'}`}>
        {syncNotice && (
          <div className="absolute top-4 right-4 z-30 bg-emerald-600/90 text-white text-xs font-bold px-3 py-1.5 rounded-xl backdrop-blur-md shadow-lg flex items-center gap-1.5 transition-all">
            <FiCheck size={14} />
            <span>{syncNotice}</span>
          </div>
        )}
        <iframe
          ref={iframeRef}
          src={`/bezier/index.html?theme=${currentTheme}`}
          title="Pen Tool Master Lab"
          className="w-full h-full border-none outline-none block"
          onLoad={handleIframeLoad}
          allow="autoplay"
        />
      </div>

      {/* ── BOTTOM FOOTER NOTE (In Standard Mode) ─────────────────────── */}
      {!isFullscreen && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 px-2">
          <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400">
            <FiCheckCircle size={14} className="shrink-0 text-emerald-500 dark:text-emerald-400" />
            <span>
              <strong>Pro-Tip:</strong> Practice precision vector curves just like Adobe Illustrator, Photoshop, and Figma.
            </span>
          </div>
          <div className="text-slate-400 dark:text-slate-500 text-[11px]">
            Creative Computer Academy • Pen Tool Master Lab
          </div>
        </div>
      )}
    </div>
  );
};

export default PenToolLab;
