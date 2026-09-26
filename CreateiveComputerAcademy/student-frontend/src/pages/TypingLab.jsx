import React, { useState } from 'react';
import { FiBookOpen, FiMaximize2, FiMinimize2, FiZap, FiAward, FiLayers, FiCpu, FiClock } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import TouchTypingMaster from '../components/foundations/TouchTypingMaster';
import SpeedTestHub from '../components/foundations/SpeedTestHub';
import TypingGamesHub from '../components/foundations/games/TypingGamesHub';
import BanglaTypingLab from '../components/foundations/BanglaTypingLab';

const TypingLab = () => {
  const { user } = useAuth();
  // 'curriculum' | 'speed_test' | 'games' | 'bangla'
  const [activeTab, setActiveTab] = useState('curriculum');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={`transition-all duration-300 ${
      isFullscreen
        ? 'fixed inset-0 z-50 bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 overflow-hidden w-screen h-screen flex flex-col'
        : 'p-4 sm:p-6 md:p-8 space-y-6 mx-auto'
    }`}>
      {/* ── FULLSCREEN TOP NAV BAR (When in Fullscreen Mode) ───────── */}
      {isFullscreen ? (
        <div className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4 shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 text-xs font-black">
              <span>⌨️ Typing Lab Fullscreen</span>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
              <button
                onClick={() => setActiveTab('curriculum')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'curriculum'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                14-Lesson Curriculum
              </button>

              <button
                onClick={() => setActiveTab('speed_test')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'speed_test'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                ⚡ Speed Test
              </button>

              <button
                onClick={() => setActiveTab('games')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'games'
                    ? 'bg-pink-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                🎮 Arcade Games
              </button>

              <button
                onClick={() => setActiveTab('bangla')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'bangla'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Bangla Lab
              </button>
            </div>
          </div>

          <button
            onClick={toggleFullscreen}
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-slate-200 dark:border-slate-700 shadow-2xs"
          >
            <FiMinimize2 size={14} />
            <span>Exit Fullscreen</span>
          </button>
        </div>
      ) : (
        /* ── STANDARD MODE TOP HERO BANNER ──────────────────────── */
        <>
          <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-slate-900 via-purple-950 to-indigo-950 text-white shadow-xl relative overflow-hidden border border-purple-500/20">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-white/10 backdrop-blur-md text-pink-200 text-xs font-bold border border-white/10">
                  <span>⌨️ Touch Typing Academy</span>
                  <span className="px-2 py-0.5 rounded-full bg-pink-500 text-white text-[10px] font-black tracking-wider">
                    TYPING MASTER PRO
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  Typing Speed & Accuracy Academy
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-2xl">
                  Master 10-finger touch typing speed, take timed international exams, play classic arcade games, and earn official Creative Computer Academy diplomas.
                </p>
              </div>

              <button
                onClick={toggleFullscreen}
                className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md font-bold text-xs shadow-lg cursor-pointer transition-all flex items-center gap-2 self-start md:self-auto active:scale-95"
              >
                <FiMaximize2 size={15} />
                <span>Fullscreen Academy</span>
              </button>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 p-1.5 bg-white/85 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <button
              onClick={() => setActiveTab('curriculum')}
              className={`py-3 px-4 rounded-xl text-left transition-all cursor-pointer ${
                activeTab === 'curriculum'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold'
              }`}
            >
              <p className="text-xs sm:text-sm font-bold flex items-center gap-1.5">
                <FiBookOpen size={14} />
                <span>14-Lesson Curriculum</span>
              </p>
              <p className={`text-[10px] sm:text-xs mt-0.5 ${activeTab === 'curriculum' ? 'text-purple-100' : 'text-slate-400'}`}>
                10-Finger Drills • 3D Keyboard
              </p>
            </button>

            <button
              onClick={() => setActiveTab('speed_test')}
              className={`py-3 px-4 rounded-xl text-left transition-all cursor-pointer ${
                activeTab === 'speed_test'
                  ? 'bg-gradient-to-r from-indigo-600 to-pink-600 text-white shadow-md font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold'
              }`}
            >
              <p className="text-xs sm:text-sm font-bold flex items-center gap-1.5">
                <FiZap size={14} />
                <span>Speed Test & Certification</span>
              </p>
              <p className={`text-[10px] sm:text-xs mt-0.5 ${activeTab === 'speed_test' ? 'text-indigo-100' : 'text-slate-400'}`}>
                1 to 10m Exams • Verified Diplomas
              </p>
            </button>

            <button
              onClick={() => setActiveTab('games')}
              className={`py-3 px-4 rounded-xl text-left transition-all cursor-pointer ${
                activeTab === 'games'
                  ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-md font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold'
              }`}
            >
              <p className="text-xs sm:text-sm font-bold flex items-center gap-1.5">
                <span>🎮</span>
                <span>Arcade Typing Games</span>
              </p>
              <p className={`text-[10px] sm:text-xs mt-0.5 ${activeTab === 'games' ? 'text-pink-100' : 'text-slate-400'}`}>
                Bubbles • WordTris • Clouds
              </p>
            </button>

            <button
              onClick={() => setActiveTab('bangla')}
              className={`py-3 px-4 rounded-xl text-left transition-all cursor-pointer ${
                activeTab === 'bangla'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold'
              }`}
            >
              <p className="text-xs sm:text-sm font-bold flex items-center gap-1.5">
                <span>🇧🇩</span>
                <span>Bangla Typing Lab</span>
              </p>
              <p className={`text-[10px] sm:text-xs mt-0.5 ${activeTab === 'bangla' ? 'text-emerald-100' : 'text-slate-400'}`}>
                অভ্র ফোনেটিক ও বিজয় প্র্যাকটিস
              </p>
            </button>
          </div>
        </>
      )}

      {/* Content Stage */}
      <div className={`animate-in fade-in duration-200 ${isFullscreen ? 'px-3 sm:px-6 py-2 mx-auto w-full flex-1 min-h-0 flex flex-col overflow-hidden' : ''}`}>
        {activeTab === 'curriculum' && (
          <TouchTypingMaster
            user={user}
            isMasterFullscreen={isFullscreen}
            toggleMasterFullscreen={toggleFullscreen}
          />
        )}

        {activeTab === 'speed_test' && (
          <SpeedTestHub
            user={user}
            isMasterFullscreen={isFullscreen}
            toggleMasterFullscreen={toggleFullscreen}
          />
        )}

        {activeTab === 'games' && (
          <TypingGamesHub
            user={user}
            isMasterFullscreen={isFullscreen}
            toggleMasterFullscreen={toggleFullscreen}
          />
        )}

        {activeTab === 'bangla' && (
          <BanglaTypingLab
            user={user}
            isMasterFullscreen={isFullscreen}
            toggleMasterFullscreen={toggleFullscreen}
          />
        )}
      </div>
    </div>
  );
};

export default TypingLab;


