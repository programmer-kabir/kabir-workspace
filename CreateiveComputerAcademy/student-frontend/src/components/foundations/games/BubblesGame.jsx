import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import {
  FiVolume2, FiVolumeX, FiRefreshCw, FiArrowLeft, FiAward,
  FiPlay, FiPause, FiMaximize2, FiMinimize2, FiHeart
} from 'react-icons/fi';
import {
  playBubblePop,
  playMissSound,
  playLevelUpFanfare,
  playGameOverSound
} from './gameAudioSynthesizer';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

// Character pools per level
const LEVEL_POOLS = {
  1: 'asdfjkl;'.split(''),
  2: 'qweruiopzxcvnm'.split(''),
  3: 'abcdefghijklmnopqrstuvwxyz'.split(''),
  4: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split(''),
  5: ['cat', 'dog', 'run', 'key', 'type', 'code', 'fast', 'star', 'blue', 'play', 'hero', 'java', 'react']
};

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

const BubblesGame = ({
  user,
  difficulty = 'standard', // 'casual' | 'standard' | 'pro'
  isFullscreen = false,
  onExit
}) => {
  const canvasRef = useRef(null);
  const isDark = useIsDarkMode();
  const isDarkRef = useRef(isDark);

  useEffect(() => {
    isDarkRef.current = isDark;
  }, [isDark]);

  // Game state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Gameplay stats
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [hearts, setHearts] = useState(5);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [poppedCount, setPoppedCount] = useState(0);
  const [missedCount, setMissedCount] = useState(0);
  const [totalKeystrokes, setTotalKeystrokes] = useState(0);

  // High score in local state
  const [highScore, setHighScore] = useState(() => {
    try {
      return parseInt(localStorage.getItem('cca_game_bubbles_highscore') || '0', 10);
    } catch {
      return 0;
    }
  });

  // Game physics refs
  const bubblesRef = useRef([]);
  const particlesRef = useRef([]);
  const animationFrameRef = useRef(null);
  const lastSpawnTimeRef = useRef(0);
  const activeWordTargetRef = useRef(null); // for level 5 word bubbles

  // Difficulty speed modifier
  const speedMultiplier = difficulty === 'casual' ? 0.75 : difficulty === 'pro' ? 1.4 : 1.0;

  // ── SPAWN A NEW BUBBLE ──────────────────────────────────────────────
  const spawnBubble = useCallback((width, height) => {
    const currentPool = LEVEL_POOLS[Math.min(level, 5)];
    const item = currentPool[Math.floor(Math.random() * currentPool.length)];

    const radius = item.length > 1 ? 38 : 28;
    const padding = radius + 15;
    const x = padding + Math.random() * (width - padding * 2);
    const y = height + radius + 10;

    const baseVy = (0.9 + level * 0.22) * speedMultiplier;
    const vy = -(baseVy + Math.random() * 0.4);
    const vx = (Math.random() - 0.5) * 0.8;

    // Vibrant pastel bubble color
    const hues = [190, 210, 250, 280, 320, 160];
    const hue = hues[Math.floor(Math.random() * hues.length)];

    bubblesRef.current.push({
      id: Date.now() + Math.random(),
      text: item,
      typedIndex: 0,
      x,
      y,
      vx,
      vy,
      radius,
      hue,
      wobbleOffset: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.03 + Math.random() * 0.02
    });
  }, [level, speedMultiplier]);

  // ── CREATE POP BURST PARTICLES ──────────────────────────────────────
  const createBurstParticles = (x, y, hue) => {
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 / 12) * i + Math.random() * 0.2;
      const speed = 2 + Math.random() * 4;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 2 + Math.random() * 3,
        hue,
        alpha: 1,
        life: 1
      });
    }
  };

  // ── START GAME ──────────────────────────────────────────────────────
  const startGame = () => {
    bubblesRef.current = [];
    particlesRef.current = [];
    setScore(0);
    setLevel(1);
    setHearts(5);
    setCombo(0);
    setMaxCombo(0);
    setPoppedCount(0);
    setMissedCount(0);
    setTotalKeystrokes(0);
    setIsGameOver(false);
    setIsPaused(false);
    setIsPlaying(true);
    lastSpawnTimeRef.current = performance.now();
  };

  // ── GAME OVER & SAVE TO BACKEND ────────────────────────────────────
  const handleGameOver = useCallback(async (finalScore, finalPopped, finalMissed, finalMaxCombo) => {
    setIsGameOver(true);
    setIsPlaying(false);
    playGameOverSound(soundEnabled);

    if (finalScore > highScore) {
      setHighScore(finalScore);
      try {
        localStorage.setItem('cca_game_bubbles_highscore', finalScore.toString());
      } catch {}
    }

    // Save to Database
    const userId = user?.id || 0;
    if (userId > 0) {
      try {
        const total = finalPopped + finalMissed;
        const accuracy = total > 0 ? Math.round((finalPopped / total) * 100) : 100;
        const estimatedWpm = Math.max(10, Math.round(finalPopped * 1.5));

        await axios.post(`${API_BASE}api/student/foundations/save_typing_session.php`, {
          user_id: userId,
          language: 'en',
          difficulty_level: 'game_bubbles',
          lesson_title: `Bubbles Arcade (Score: ${finalScore})`,
          wpm: estimatedWpm,
          cpm: estimatedWpm * 5,
          accuracy_percent: accuracy,
          raw_wpm: estimatedWpm,
          mistakes_count: finalMissed,
          duration_seconds: 60
        });
      } catch (err) {
        console.error('Failed to save game session', err);
      }
    }
  }, [highScore, soundEnabled, user?.id]);

  // ── KEYBOARD HANDLER ────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isPlaying || isPaused || isGameOver) return;

      // Ignore modifier standalone keys
      if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab'].includes(e.key)) {
        return;
      }

      setTotalKeystrokes(prev => prev + 1);
      const pressedKey = e.key;

      const bubbles = bubblesRef.current;
      let matchedIdx = -1;

      // Sort bubbles by y ascending (closest to top has highest priority)
      const sortedIndices = bubbles
        .map((b, idx) => ({ idx, y: b.y, text: b.text, typedIndex: b.typedIndex }))
        .sort((a, b) => a.y - b.y);

      // Check if we are typing a multi-char word already locked on
      if (activeWordTargetRef.current) {
        const target = bubbles.find(b => b.id === activeWordTargetRef.current);
        if (target) {
          const expectedChar = target.text[target.typedIndex];
          if (pressedKey.toLowerCase() === expectedChar.toLowerCase()) {
            target.typedIndex += 1;
            playBubblePop(combo + 1, soundEnabled);

            if (target.typedIndex >= target.text.length) {
              // Word completed!
              createBurstParticles(target.x, target.y, target.hue);
              bubblesRef.current = bubbles.filter(b => b.id !== target.id);
              activeWordTargetRef.current = null;

              const points = target.text.length * 50 * (combo + 1);
              setScore(prev => prev + points);
              setPoppedCount(prev => prev + 1);
              setCombo(prev => {
                const next = prev + 1;
                setMaxCombo(m => Math.max(m, next));
                return next;
              });
            }
            return;
          }
        } else {
          activeWordTargetRef.current = null;
        }
      }

      // Check single character or start of word
      for (const item of sortedIndices) {
        const bubble = bubbles[item.idx];
        const targetChar = bubble.text[bubble.typedIndex];

        if (pressedKey.toLowerCase() === targetChar.toLowerCase()) {
          matchedIdx = item.idx;
          break;
        }
      }

      if (matchedIdx !== -1) {
        const targetBubble = bubbles[matchedIdx];

        if (targetBubble.text.length > 1) {
          // Multi-char word: advance index
          targetBubble.typedIndex += 1;
          activeWordTargetRef.current = targetBubble.id;
          playBubblePop(combo + 1, soundEnabled);
        } else {
          // Single char: POP!
          createBurstParticles(targetBubble.x, targetBubble.y, targetBubble.hue);
          playBubblePop(combo + 1, soundEnabled);

          bubblesRef.current.splice(matchedIdx, 1);

          const basePoints = 25;
          const points = basePoints * (combo + 1);
          setScore(prev => {
            const nextScore = prev + points;
            // Level up every 600 points
            const nextLevel = Math.min(5, Math.floor(nextScore / 600) + 1);
            if (nextLevel > level) {
              setLevel(nextLevel);
              playLevelUpFanfare(soundEnabled);
            }
            return nextScore;
          });

          setPoppedCount(prev => prev + 1);
          setCombo(prev => {
            const next = prev + 1;
            setMaxCombo(m => Math.max(m, next));
            return next;
          });
        }
      } else {
        // Missed key press: reset combo
        setCombo(0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isPaused, isGameOver, level, combo, soundEnabled]);

  // ── 60 FPS ANIMATION LOOP ──────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const render = (time) => {
      // Resize canvas to match display client size
      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
      }

      const { width, height } = canvas;
      const currentIsDark = isDarkRef.current;

      // Draw Underwater gradient (Light Mode: Tropical Turquoise / Dark Mode: Deep Midnight Ocean)
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      if (currentIsDark) {
        bgGrad.addColorStop(0, '#0c1a30');
        bgGrad.addColorStop(0.5, '#0b2545');
        bgGrad.addColorStop(1, '#134074');
      } else {
        bgGrad.addColorStop(0, '#e0f2fe');
        bgGrad.addColorStop(0.5, '#bae6fd');
        bgGrad.addColorStop(1, '#7dd3fc');
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Draw subtle background water caustics / bubbles
      ctx.fillStyle = currentIsDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.45)';
      for (let i = 0; i < 8; i++) {
        const cx = (time * 0.02 + i * 140) % width;
        const cy = (height - ((time * 0.04 + i * 90) % height));
        ctx.beginPath();
        ctx.arc(cx, cy, 14 + (i % 4) * 6, 0, Math.PI * 2);
        ctx.fill();
      }

      if (isPlaying && !isPaused && !isGameOver) {
        // Spawn bubbles
        const spawnInterval = Math.max(700, 1800 - level * 200) / speedMultiplier;
        if (time - lastSpawnTimeRef.current > spawnInterval) {
          spawnBubble(width, height);
          lastSpawnTimeRef.current = time;
        }

        // Update & Render Bubbles
        const currentBubbles = bubblesRef.current;
        for (let i = currentBubbles.length - 1; i >= 0; i--) {
          const b = currentBubbles[i];

          b.y += b.vy;
          b.wobbleOffset += b.wobbleSpeed;
          b.x += Math.sin(b.wobbleOffset) * 0.8;

          // Check if bubble reached top (escaped)
          if (b.y - b.radius <= 0) {
            playMissSound(soundEnabled);
            createBurstParticles(b.x, b.radius + 5, 0);
            currentBubbles.splice(i, 1);
            setMissedCount(prev => prev + 1);
            setCombo(0);

            setHearts(prev => {
              const nextHearts = prev - 1;
              if (nextHearts <= 0) {
                handleGameOver(score, poppedCount, missedCount + 1, maxCombo);
              }
              return Math.max(0, nextHearts);
            });
            continue;
          }

          // Draw Bubble Body with Glossy Highlights
          ctx.save();
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);

          // Iridescent gradient
          const bubbleGrad = ctx.createRadialGradient(
            b.x - b.radius * 0.3,
            b.y - b.radius * 0.3,
            b.radius * 0.1,
            b.x,
            b.y,
            b.radius
          );
          if (currentIsDark) {
            bubbleGrad.addColorStop(0, `hsla(${b.hue}, 90%, 85%, 0.85)`);
            bubbleGrad.addColorStop(0.6, `hsla(${b.hue}, 80%, 55%, 0.45)`);
            bubbleGrad.addColorStop(1, `hsla(${b.hue}, 95%, 45%, 0.75)`);
          } else {
            bubbleGrad.addColorStop(0, `hsla(${b.hue}, 100%, 95%, 0.95)`);
            bubbleGrad.addColorStop(0.6, `hsla(${b.hue}, 85%, 70%, 0.55)`);
            bubbleGrad.addColorStop(1, `hsla(${b.hue}, 90%, 55%, 0.85)`);
          }

          ctx.fillStyle = bubbleGrad;
          ctx.fill();
          ctx.lineWidth = 2.5;
          ctx.strokeStyle = currentIsDark ? `hsla(${b.hue}, 90%, 75%, 0.9)` : `hsla(${b.hue}, 80%, 45%, 0.8)`;
          ctx.stroke();

          // Top-left glossy highlight reflection
          ctx.beginPath();
          ctx.ellipse(
            b.x - b.radius * 0.35,
            b.y - b.radius * 0.35,
            b.radius * 0.28,
            b.radius * 0.16,
            -Math.PI / 4,
            0,
            Math.PI * 2
          );
          ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
          ctx.fill();

          // Draw Inner Character or Word
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          if (b.text.length > 1) {
            // Word: show typed characters in emerald green, remaining in dark/light contrasting color
            ctx.font = 'bold 15px monospace';
            const charWidth = 10;
            const startX = b.x - (b.text.length * charWidth) / 2 + charWidth / 2;

            for (let c = 0; c < b.text.length; c++) {
              ctx.fillStyle = c < b.typedIndex ? '#059669' : (currentIsDark ? '#ffffff' : '#0f172a');
              ctx.fillText(b.text[c], startX + c * charWidth, b.y + 1);
            }
          } else {
            ctx.font = 'bold 22px monospace';
            ctx.fillStyle = currentIsDark ? '#ffffff' : '#0f172a';
            ctx.shadowColor = currentIsDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.7)';
            ctx.shadowBlur = 4;
            ctx.fillText(b.text, b.x, b.y + 1);
          }

          ctx.restore();
        }

        // Update & Render Burst Particles
        const currentParticles = particlesRef.current;
        for (let i = currentParticles.length - 1; i >= 0; i--) {
          const p = currentParticles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.08; // gravity
          p.alpha -= 0.035;

          if (p.alpha <= 0) {
            currentParticles.splice(i, 1);
            continue;
          }

          ctx.save();
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${p.hue}, 90%, ${currentIsDark ? '65%' : '50%'}, ${p.alpha})`;
          ctx.fill();
          ctx.restore();
        }
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [isPlaying, isPaused, isGameOver, level, speedMultiplier, soundEnabled, score, poppedCount, missedCount, maxCombo, handleGameOver, spawnBubble]);

  return (
    <div className={`relative flex flex-col justify-between bg-sky-50 dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-sky-200 dark:border-slate-800 select-none ${
      isFullscreen ? 'h-full flex-1 w-full' : 'h-[620px] w-full'
    }`}>
      
      {/* ── TOP HUD BAR ────────────────────────────────────────────── */}
      <div className="absolute top-0 inset-x-0 z-20 p-3 sm:p-4 flex items-center justify-between gap-3 bg-gradient-to-b from-white/90 via-white/60 to-transparent dark:from-slate-950/90 dark:via-slate-950/60 text-slate-800 dark:text-white backdrop-blur-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onExit}
            className="p-2 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-white transition-colors cursor-pointer"
            title="Return to Arcade Hub"
          >
            <FiArrowLeft size={16} />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🫧</span>
              <h2 className="text-sm sm:text-base font-black tracking-tight text-slate-900 dark:text-white">
                Bubbles Arcade
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-500/30 border border-indigo-200 dark:border-indigo-400/40 text-indigo-700 dark:text-indigo-300 text-[10px] font-black uppercase">
                Level {level}
              </span>
            </div>
            <p className="text-[10px] text-slate-600 dark:text-slate-300 font-medium">
              Type the letters before the bubbles reach the surface!
            </p>
          </div>
        </div>

        {/* Live Gauges: Score, Hearts, Combo */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Hearts / Lives */}
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

          {/* Combo Badge */}
          {combo >= 3 && (
            <div className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 text-xs font-black animate-bounce shadow-md">
              <span>⚡</span>
              <span>{combo}x STREAK</span>
            </div>
          )}

          {/* Score Counter */}
          <div className="px-3.5 py-1.5 rounded-xl bg-white/80 dark:bg-white/10 border border-slate-200/80 dark:border-white/10 text-right shadow-xs">
            <p className="text-[8px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">Score</p>
            <p className="text-sm sm:text-base font-black font-mono text-indigo-700 dark:text-amber-400">{score}</p>
          </div>

          {/* Controls: Sound & Pause */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-white transition-colors cursor-pointer"
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
        <div className="absolute inset-0 z-30 bg-sky-950/20 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700 shadow-2xl text-center space-y-6 text-slate-900 dark:text-white">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 text-white flex items-center justify-center text-3xl mx-auto shadow-lg shadow-cyan-500/25">
              🫧
            </div>

            <div className="space-y-1.5">
              <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Bubbles Arcade</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Classic Typing Master game! Pop the floating letter bubbles before they hit the surface. Keep your eyes on the screen!
              </p>
            </div>

            {highScore > 0 && (
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400 font-bold">Personal High Score:</span>
                <span className="font-mono font-black text-amber-600 dark:text-amber-400 text-sm">🏆 {highScore} pts</span>
              </div>
            )}

            <button
              onClick={startGame}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:opacity-95 text-white font-black text-sm shadow-xl shadow-blue-500/25 cursor-pointer transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <FiPlay size={16} />
              <span>Start Game</span>
            </button>
          </div>
        </div>
      )}

      {/* ── GAME OVER OVERLAY ───────────────────────────────────────── */}
      {isGameOver && (
        <div className="absolute inset-0 z-30 bg-sky-950/25 dark:bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl text-center space-y-6 text-slate-900 dark:text-white">
            <div className="space-y-1">
              <span className="text-4xl">💥</span>
              <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white pt-2">
                Game Over!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                You popped {poppedCount} bubbles and reached Level {level}!
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Final Score</p>
                <p className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">{score}</p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Max Combo</p>
                <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">⚡ {maxCombo}x</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={startGame}
                className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:opacity-90 text-white font-black text-xs shadow-lg cursor-pointer transition-all flex items-center justify-center gap-1.5"
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

export default BubblesGame;
