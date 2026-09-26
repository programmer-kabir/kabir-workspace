import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import {
  FiVolume2, FiVolumeX, FiRefreshCw, FiArrowLeft, FiAward,
  FiPlay, FiPause, FiMaximize2, FiMinimize2
} from 'react-icons/fi';
import {
  playBlockSmash,
  playMissSound,
  playLevelUpFanfare,
  playGameOverSound
} from './gameAudioSynthesizer';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const WORD_DICTIONARY = [
  'code', 'type', 'keys', 'fast', 'play', 'hero', 'star', 'blue', 'wind', 'fire',
  'react', 'logic', 'smart', 'cloud', 'mouse', 'speed', 'laser', 'pixel', 'drive',
  'python', 'crypto', 'engine', 'system', 'matrix', 'stream', 'rocket', 'vector',
  'algorithm', 'javascript', 'framework', 'database', 'cyberpunk', 'synthesizer'
];

// Helper hook to detect dark mode in real-time
const useIsDarkMode = () => {
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  return isDark;
};

const WordTrisGame = ({
  user,
  difficulty = 'standard',
  isFullscreen = false,
  onExit
}) => {
  const canvasRef = useRef(null);
  const isDark = useIsDarkMode();
  const isDarkRef = useRef(isDark);

  useEffect(() => {
    isDarkRef.current = isDark;
  }, [isDark]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Stats
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [hearts, setHearts] = useState(5);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [blocksCleared, setBlocksCleared] = useState(0);

  const [highScore, setHighScore] = useState(() => {
    try {
      return parseInt(localStorage.getItem('cca_game_wordtris_highscore') || '0', 10);
    } catch {
      return 0;
    }
  });

  // Game state refs
  const fallingBlocksRef = useRef([]);
  const stackedBlocksRef = useRef([]); // blocks settled at the bottom
  const particlesRef = useRef([]);
  const activeWordRef = useRef(null); // the block currently being typed
  const lastSpawnTimeRef = useRef(0);
  const animationFrameRef = useRef(null);

  const speedMultiplier = difficulty === 'casual' ? 0.75 : difficulty === 'pro' ? 1.4 : 1.0;

  // ── SPAWN A FALLING WORD BLOCK ──────────────────────────────────────
  const spawnBlock = useCallback((width) => {
    // Select word based on level length
    const maxLen = Math.min(12, 4 + level * 2);
    const eligibleWords = WORD_DICTIONARY.filter(w => w.length <= maxLen);
    const word = eligibleWords[Math.floor(Math.random() * eligibleWords.length)];

    const laneCount = 4;
    const laneWidth = width / laneCount;
    const lane = Math.floor(Math.random() * laneCount);
    const x = lane * laneWidth + 10;
    const blockWidth = laneWidth - 20;
    const blockHeight = 36;

    const baseVy = (0.7 + level * 0.18) * speedMultiplier;

    // Distinct neon theme colors
    const colors = ['#38bdf8', '#a855f7', '#ec4899', '#10b981', '#f59e0b'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    fallingBlocksRef.current.push({
      id: Date.now() + Math.random(),
      word,
      typedIndex: 0,
      lane,
      x,
      y: -blockHeight,
      width: blockWidth,
      height: blockHeight,
      vy: baseVy,
      color
    });
  }, [level, speedMultiplier]);

  // ── CREATE PARTICLE EXPLOSION ───────────────────────────────────────
  const createSmashParticles = (x, y, w, h, color) => {
    for (let i = 0; i < 16; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      particlesRef.current.push({
        x: x + w / 2,
        y: y + h / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 3,
        color,
        alpha: 1
      });
    }
  };

  // ── START GAME ──────────────────────────────────────────────────────
  const startGame = () => {
    fallingBlocksRef.current = [];
    stackedBlocksRef.current = [];
    particlesRef.current = [];
    activeWordRef.current = null;
    setScore(0);
    setLevel(1);
    setHearts(5);
    setCombo(0);
    setMaxCombo(0);
    setBlocksCleared(0);
    setIsGameOver(false);
    setIsPaused(false);
    setIsPlaying(true);
    lastSpawnTimeRef.current = performance.now();
  };

  // ── GAME OVER & BACKEND SAVE ────────────────────────────────────────
  const handleGameOver = useCallback(async (finalScore, finalCleared, finalMaxCombo) => {
    setIsGameOver(true);
    setIsPlaying(false);
    playGameOverSound(soundEnabled);

    if (finalScore > highScore) {
      setHighScore(finalScore);
      try {
        localStorage.setItem('cca_game_wordtris_highscore', finalScore.toString());
      } catch {}
    }

    const userId = user?.id || 0;
    if (userId > 0) {
      try {
        const estimatedWpm = Math.max(12, Math.round(finalCleared * 2.2));
        await axios.post(`${API_BASE}api/student/foundations/save_typing_session.php`, {
          user_id: userId,
          language: 'en',
          difficulty_level: 'game_wordtris',
          lesson_title: `WordTris Arcade (Score: ${finalScore})`,
          wpm: estimatedWpm,
          cpm: estimatedWpm * 5,
          accuracy_percent: 95,
          raw_wpm: estimatedWpm,
          mistakes_count: 5,
          duration_seconds: 60
        });
      } catch (e) {
        console.error('Failed to save WordTris session', e);
      }
    }
  }, [highScore, soundEnabled, user?.id]);

  // ── KEYBOARD HANDLER ────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isPlaying || isPaused || isGameOver) return;

      if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab'].includes(e.key)) {
        return;
      }

      const key = e.key.toLowerCase();
      const falling = fallingBlocksRef.current;

      // 1. If an active block is already locked on
      if (activeWordRef.current) {
        const target = falling.find(b => b.id === activeWordRef.current);
        if (target) {
          const expectedChar = target.word[target.typedIndex]?.toLowerCase();
          if (key === expectedChar) {
            target.typedIndex += 1;

            if (target.typedIndex >= target.word.length) {
              // Word completed!
              createSmashParticles(target.x, target.y, target.width, target.height, target.color);
              playBlockSmash(soundEnabled);
              fallingBlocksRef.current = falling.filter(b => b.id !== target.id);
              activeWordRef.current = null;

              const points = target.word.length * 40 * (combo + 1);
              setScore(prev => {
                const nextScore = prev + points;
                const nextLevel = Math.min(5, Math.floor(nextScore / 800) + 1);
                if (nextLevel > level) {
                  setLevel(nextLevel);
                  playLevelUpFanfare(soundEnabled);
                }
                return nextScore;
              });

              setBlocksCleared(prev => prev + 1);
              setCombo(prev => {
                const next = prev + 1;
                setMaxCombo(m => Math.max(m, next));
                return next;
              });
            }
            return;
          } else {
            // Wrong key for current active word
            setCombo(0);
            return;
          }
        } else {
          activeWordRef.current = null;
        }
      }

      // 2. Look for an eligible falling block starting with pressed key
      // Prioritize blocks closest to the bottom
      const candidates = falling
        .filter(b => b.word[0].toLowerCase() === key)
        .sort((a, b) => b.y - a.y);

      if (candidates.length > 0) {
        const matched = candidates[0];
        matched.typedIndex = 1;

        if (matched.word.length === 1) {
          createSmashParticles(matched.x, matched.y, matched.width, matched.height, matched.color);
          playBlockSmash(soundEnabled);
          fallingBlocksRef.current = falling.filter(b => b.id !== matched.id);
          setScore(prev => prev + 40 * (combo + 1));
          setBlocksCleared(prev => prev + 1);
          setCombo(prev => prev + 1);
        } else {
          activeWordRef.current = matched.id;
        }
      } else {
        setCombo(0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isPaused, isGameOver, combo, level, soundEnabled]);

  // ── 60 FPS RENDER LOOP ──────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const render = (time) => {
      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
      }

      const { width, height } = canvas;
      const currentIsDark = isDarkRef.current;
      const dangerY = height * 0.22; // Danger ceiling line

      // Retro Arcade Grid (Light: Slate-50 / Dark: Deep Void)
      ctx.fillStyle = currentIsDark ? '#0a0d14' : '#f8fafc';
      ctx.fillRect(0, 0, width, height);

      // Grid lines
      ctx.strokeStyle = currentIsDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.05)';
      ctx.lineWidth = 1;
      const laneWidth = width / 4;
      for (let i = 1; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(i * laneWidth, 0);
        ctx.lineTo(i * laneWidth, height);
        ctx.stroke();
      }

      // Danger line at top
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(0, dangerY);
      ctx.lineTo(width, dangerY);
      ctx.stroke();
      ctx.setLineDash([]);

      if (isPlaying && !isPaused && !isGameOver) {
        // Spawn block
        const spawnInterval = Math.max(1200, 2600 - level * 300) / speedMultiplier;
        if (time - lastSpawnTimeRef.current > spawnInterval) {
          spawnBlock(width);
          lastSpawnTimeRef.current = time;
        }

        // Update & Render Falling Blocks
        const falling = fallingBlocksRef.current;
        const stacked = stackedBlocksRef.current;

        for (let i = falling.length - 1; i >= 0; i--) {
          const b = falling[i];
          b.y += b.vy;

          // Check collision with floor or stacked blocks in the same lane
          const laneBlocks = stacked.filter(s => s.lane === b.lane);
          const topStackedY = laneBlocks.length > 0 ? Math.min(...laneBlocks.map(s => s.y)) : height;

          if (b.y + b.height >= topStackedY) {
            // Block lands and settles
            b.y = topStackedY - b.height;
            stacked.push({ ...b });
            falling.splice(i, 1);
            if (activeWordRef.current === b.id) activeWordRef.current = null;

            playMissSound(soundEnabled);
            setCombo(0);

            // Check if stack reached danger line
            if (b.y <= dangerY) {
              // Danger line breach: clear lane and deduct life
              stackedBlocksRef.current = stacked.filter(s => s.lane !== b.lane);
              setHearts(prev => {
                const next = prev - 1;
                if (next <= 0) {
                  handleGameOver(score, blocksCleared, maxCombo);
                }
                return Math.max(0, next);
              });
            }
            continue;
          }

          // Draw Falling Block with Neon Glow
          const isActive = activeWordRef.current === b.id;
          ctx.save();
          if (currentIsDark) {
            ctx.fillStyle = isActive ? '#1e1b4b' : '#111827';
          } else {
            ctx.fillStyle = isActive ? '#ede9fe' : '#ffffff';
          }
          ctx.strokeStyle = isActive ? '#818cf8' : b.color;
          ctx.lineWidth = isActive ? 3 : 2;
          ctx.beginPath();
          ctx.roundRect(b.x, b.y, b.width, b.height, 8);
          ctx.fill();
          ctx.stroke();

          // Render Word Text
          ctx.font = 'bold 15px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const charW = 10;
          const startX = b.x + b.width / 2 - (b.word.length * charW) / 2 + charW / 2;

          for (let c = 0; c < b.word.length; c++) {
            ctx.fillStyle = c < b.typedIndex ? '#10b981' : (currentIsDark ? '#f8fafc' : '#0f172a');
            ctx.fillText(b.word[c], startX + c * charW, b.y + b.height / 2);
          }
          ctx.restore();
        }

        // Render Settled Stacked Blocks
        for (const s of stacked) {
          ctx.save();
          ctx.fillStyle = currentIsDark ? '#1f2937' : '#e2e8f0';
          ctx.strokeStyle = currentIsDark ? '#4b5563' : '#cbd5e1';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.roundRect(s.x, s.y, s.width, s.height, 8);
          ctx.fill();
          ctx.stroke();

          ctx.font = '12px monospace';
          ctx.fillStyle = currentIsDark ? '#9ca3af' : '#475569';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(s.word, s.x + s.width / 2, s.y + s.height / 2);
          ctx.restore();
        }

        // Update Particles
        const particles = particlesRef.current;
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.12;
          p.alpha -= 0.04;

          if (p.alpha <= 0) {
            particles.splice(i, 1);
            continue;
          }

          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.fillRect(p.x, p.y, p.size, p.size);
          ctx.restore();
        }
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [isPlaying, isPaused, isGameOver, level, speedMultiplier, soundEnabled, score, blocksCleared, maxCombo, handleGameOver, spawnBlock]);

  return (
    <div className={`relative flex flex-col justify-between bg-slate-100 dark:bg-slate-950 rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 select-none ${
      isFullscreen ? 'h-full flex-1 w-full' : 'h-[620px] w-full'
    }`}>
      
      {/* ── TOP HUD ─────────────────────────────────────────────────── */}
      <div className="absolute top-0 inset-x-0 z-20 p-3 sm:p-4 flex items-center justify-between gap-3 bg-gradient-to-b from-white/90 via-white/60 to-transparent dark:from-slate-950 dark:via-slate-950/70 text-slate-800 dark:text-white">
        <div className="flex items-center gap-3">
          <button
            onClick={onExit}
            className="p-2 rounded-xl bg-slate-200/80 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-700 dark:text-white transition-colors cursor-pointer"
            title="Return to Arcade Hub"
          >
            <FiArrowLeft size={16} />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🧱</span>
              <h2 className="text-sm sm:text-base font-black tracking-tight text-slate-900 dark:text-white">
                WordTris Arcade
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-500/30 border border-purple-200 dark:border-purple-400/40 text-purple-700 dark:text-purple-300 text-[10px] font-black uppercase">
                Level {level}
              </span>
            </div>
            <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">
              Type the falling word blocks before they reach the bottom!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/80 dark:bg-white/10 border border-slate-200/80 dark:border-white/10 shadow-xs">
            {Array.from({ length: 5 }).map((_, i) => (
              <span
                key={i}
                className={`text-sm transition-transform ${i < hearts ? 'text-rose-500 scale-100' : 'text-slate-300 dark:text-slate-600 scale-75'}`}
              >
                ❤️
              </span>
            ))}
          </div>

          {combo >= 3 && (
            <div className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-black animate-pulse shadow-md">
              <span>⚡</span>
              <span>{combo}x COMBO</span>
            </div>
          )}

          <div className="px-3.5 py-1.5 rounded-xl bg-white/80 dark:bg-white/10 border border-slate-200/80 dark:border-white/10 text-right shadow-xs">
            <p className="text-[8px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">Score</p>
            <p className="text-sm sm:text-base font-black font-mono text-purple-700 dark:text-purple-400">{score}</p>
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl bg-slate-200/80 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-700 dark:text-white transition-colors cursor-pointer"
            title={soundEnabled ? 'Mute Sound' : 'Enable Sound'}
          >
            {soundEnabled ? <FiVolume2 size={16} /> : <FiVolumeX size={16} />}
          </button>
        </div>
      </div>

      {/* ── CANVAS VIEWPORT ─────────────────────────────────────────── */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-default"
      />

      {/* ── START SCREEN OVERLAY ────────────────────────────────────── */}
      {!isPlaying && !isGameOver && (
        <div className="absolute inset-0 z-30 bg-slate-900/15 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700 shadow-2xl text-center space-y-6 text-slate-900 dark:text-white">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 text-white flex items-center justify-center text-3xl mx-auto shadow-lg shadow-purple-500/25">
              🧱
            </div>

            <div className="space-y-1.5">
              <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">WordTris Arcade</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Tetris meets touch typing! Type the falling word bricks to shatter them before they stack up to the red ceiling line.
              </p>
            </div>

            {highScore > 0 && (
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400 font-bold">Personal Record:</span>
                <span className="font-mono font-black text-amber-600 dark:text-amber-400 text-sm">🏆 {highScore} pts</span>
              </div>
            )}

            <button
              onClick={startGame}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-500 hover:opacity-95 text-white font-black text-sm shadow-xl shadow-purple-500/25 cursor-pointer transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <FiPlay size={16} />
              <span>Start Game</span>
            </button>
          </div>
        </div>
      )}

      {/* ── GAME OVER OVERLAY ───────────────────────────────────────── */}
      {isGameOver && (
        <div className="absolute inset-0 z-30 bg-slate-900/25 dark:bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl text-center space-y-6 text-slate-900 dark:text-white">
            <div className="space-y-1">
              <span className="text-4xl">🚨</span>
              <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white pt-2">
                Stack Overflow! Game Over!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                You shattered {blocksCleared} word blocks and reached Level {level}!
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Final Score</p>
                <p className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">{score}</p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Max Combo</p>
                <p className="text-2xl font-black text-purple-600 dark:text-purple-400 font-mono">⚡ {maxCombo}x</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={startGame}
                className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-500 hover:opacity-90 text-white font-black text-xs shadow-lg cursor-pointer transition-all flex items-center justify-center gap-1.5"
              >
                <FiRefreshCw size={13} />
                <span>Play Again</span>
              </button>
              <button
                onClick={onExit}
                className="flex-1 py-3 px-4 rounded-2xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-white font-bold text-xs cursor-pointer transition-colors"
              >
                Back to Hub
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default WordTrisGame;
