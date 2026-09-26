import React, { useState } from 'react';
import { FiPlay, FiAward, FiZap, FiSliders, FiShield, FiTrendingUp } from 'react-icons/fi';
import BubblesGame from './BubblesGame';
import WordTrisGame from './WordTrisGame';
import CloudsGame from './CloudsGame';

const TypingGamesHub = ({
  user,
  isMasterFullscreen = false,
  toggleMasterFullscreen
}) => {
  const [activeGame, setActiveGame] = useState(null); // 'bubbles' | 'wordtris' | 'clouds'
  const [difficulty, setDifficulty] = useState('standard'); // 'casual' | 'standard' | 'pro'

  // Load high scores from localStorage
  const getHighScore = (key) => {
    try {
      return parseInt(localStorage.getItem(key) || '0', 10);
    } catch {
      return 0;
    }
  };

  const bubblesBest = getHighScore('cca_game_bubbles_highscore');
  const wordtrisBest = getHighScore('cca_game_wordtris_highscore');
  const cloudsBest = getHighScore('cca_game_clouds_highscore');

  // If a game is active, render it directly
  if (activeGame === 'bubbles') {
    return (
      <BubblesGame
        user={user}
        difficulty={difficulty}
        isFullscreen={isMasterFullscreen}
        onExit={() => setActiveGame(null)}
      />
    );
  }

  if (activeGame === 'wordtris') {
    return (
      <WordTrisGame
        user={user}
        difficulty={difficulty}
        isFullscreen={isMasterFullscreen}
        onExit={() => setActiveGame(null)}
      />
    );
  }

  if (activeGame === 'clouds') {
    return (
      <CloudsGame
        user={user}
        difficulty={difficulty}
        isFullscreen={isMasterFullscreen}
        onExit={() => setActiveGame(null)}
      />
    );
  }

  return (
    <div className={`space-y-5 ${isMasterFullscreen ? 'overflow-y-auto flex-1 max-h-full custom-scrollbar pr-1' : ''}`}>
      
      {/* ── TOP BANNER: ARCADE HUB ──────────────────────────────────── */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1 max-w-xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-lg bg-pink-100 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 text-[11px] font-black">
            <span>🎮 Classic Typing Master Arcade</span>
            <span className="px-1.5 py-0.2 rounded bg-pink-600 text-white text-[9px] font-black">
              RETRO GAMES
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Arcade Typing Games Arena
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Train your keyboard dexterity, fast reflexes, and muscle memory through legendary Typing Master arcade games.
          </p>
        </div>

        {/* Global Trophy HUD */}
        <div className="p-3 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center gap-4 min-w-[240px]">
          <div className="space-y-1 flex-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">Total Arcade Points</span>
              <span className="font-black font-mono text-amber-500 text-xs">
                ⭐ {bubblesBest + wordtrisBest + cloudsBest} pts
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
              <span>Bubbles: <strong className="text-slate-700 dark:text-slate-200 font-mono">{bubblesBest}</strong></span>
              <span>WordTris: <strong className="text-slate-700 dark:text-slate-200 font-mono">{wordtrisBest}</strong></span>
              <span>Clouds: <strong className="text-slate-700 dark:text-slate-200 font-mono">{cloudsBest}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* ── DIFFICULTY SELECTOR BAR ─────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <FiSliders className="text-purple-600" size={15} />
          <span className="text-xs font-black text-slate-800 dark:text-slate-200">
            Select Game Speed & Difficulty:
          </span>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
          {[
            { id: 'casual', label: '🌱 Casual', desc: 'Slower spawn, beginner friendly' },
            { id: 'standard', label: '⚡ Standard', desc: 'Classic arcade speed' },
            { id: 'pro', label: '🔥 Pro', desc: 'Fast reaction, high score rush' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setDifficulty(item.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                difficulty === item.id
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title={item.desc}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── 3 ARCADE GAME CARDS ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* 1. Bubbles Game Card */}
        <div className="p-6 rounded-3xl bg-gradient-to-b from-cyan-50 via-white to-white dark:from-cyan-950/40 dark:via-slate-900 dark:to-slate-900 border border-cyan-200 dark:border-cyan-900/60 shadow-xs hover:shadow-lg hover:border-cyan-400 transition-all flex flex-col justify-between gap-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white flex items-center justify-center text-3xl shadow-md shadow-cyan-500/20">
                🫧
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-300 text-[10px] font-black uppercase">
                SIGNATURE GAME
              </span>
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Bubbles Arcade
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Floating letter bubbles rise from the ocean floor. Pop them before they reach the surface! Build huge combos and unlock multi-character words.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-bold">Personal Record:</span>
              <span className="font-mono font-black text-amber-500">🏆 {bubblesBest} pts</span>
            </div>
          </div>

          <button
            onClick={() => setActiveGame('bubbles')}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:opacity-95 text-white font-black text-xs shadow-md shadow-blue-500/20 cursor-pointer transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <FiPlay size={14} />
            <span>Play Bubbles</span>
          </button>
        </div>

        {/* 2. WordTris Game Card */}
        <div className="p-6 rounded-3xl bg-gradient-to-b from-purple-50 via-white to-white dark:from-purple-950/40 dark:via-slate-900 dark:to-slate-900 border border-purple-200 dark:border-purple-900/60 shadow-xs hover:shadow-lg hover:border-purple-400 transition-all flex flex-col justify-between gap-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-600 text-white flex items-center justify-center text-3xl shadow-md shadow-purple-500/20">
                🧱
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 text-[10px] font-black uppercase">
                TETRIS STYLE
              </span>
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                WordTris Arcade
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Word blocks descend from the top of the tube. Type the words to shatter the blocks in particle explosions before they stack to the danger ceiling!
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-bold">Personal Record:</span>
              <span className="font-mono font-black text-amber-500">🏆 {wordtrisBest} pts</span>
            </div>
          </div>

          <button
            onClick={() => setActiveGame('wordtris')}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:opacity-95 text-white font-black text-xs shadow-md shadow-purple-500/20 cursor-pointer transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <FiPlay size={14} />
            <span>Play WordTris</span>
          </button>
        </div>

        {/* 3. Clouds Game Card */}
        <div className="p-6 rounded-3xl bg-gradient-to-b from-sky-50 via-white to-white dark:from-sky-950/40 dark:via-slate-900 dark:to-slate-900 border border-sky-200 dark:border-sky-900/60 shadow-xs hover:shadow-lg hover:border-sky-400 transition-all flex flex-col justify-between gap-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-400 to-blue-500 text-white flex items-center justify-center text-3xl shadow-md shadow-sky-500/20">
                ☁️
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 text-[10px] font-black uppercase">
                SPACEBAR ACTION
              </span>
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Clouds Arcade
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Fluffy word clouds drift across a panoramic sky. Type the word and hit Spacebar to vaporize them! Catch Freeze and Bomb power-up clouds.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-bold">Personal Record:</span>
              <span className="font-mono font-black text-amber-500">🏆 {cloudsBest} pts</span>
            </div>
          </div>

          <button
            onClick={() => setActiveGame('clouds')}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-600 hover:opacity-95 text-white font-black text-xs shadow-md shadow-blue-500/20 cursor-pointer transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <FiPlay size={14} />
            <span>Play Clouds</span>
          </button>
        </div>

      </div>

    </div>
  );
};

export default TypingGamesHub;
