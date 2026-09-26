import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import {
  FiVolume2, FiVolumeX, FiRefreshCw, FiArrowLeft, FiAward,
  FiPlay, FiPause, FiMaximize2, FiMinimize2
} from 'react-icons/fi';
import {
  playCloudZap,
  playMissSound,
  playLevelUpFanfare,
  playGameOverSound
} from './gameAudioSynthesizer';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const CLOUD_WORDS = [
  'sun', 'sky', 'rain', 'wind', 'blue', 'dawn', 'moon', 'star', 'warm', 'glow',
  'breeze', 'flight', 'silver', 'shadow', 'aurora', 'planet', 'cosmic', 'flight',
  'thunder', 'rainbow', 'horizon', 'freedom', 'whisper', 'crystal', 'starlight'
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

const CloudsGame = ({
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
  const [cloudsCleared, setCloudsCleared] = useState(0);

  // Active typed word buffer
  const [typedBuffer, setTypedBuffer] = useState('');

  const [highScore, setHighScore] = useState(() => {
    try {
      return parseInt(localStorage.getItem('cca_game_clouds_highscore') || '0', 10);
    } catch {
      return 0;
    }
  });

  const cloudsRef = useRef([]);
  const particlesRef = useRef([]);
  const lastSpawnTimeRef = useRef(0);
  const isSlowMotionRef = useRef(false);
  const slowMotionTimerRef = useRef(null);
  const animationFrameRef = useRef(null);

  const speedMultiplier = difficulty === 'casual' ? 0.75 : difficulty === 'pro' ? 1.35 : 1.0;

  // ── SPAWN A DRIFTING CLOUD ──────────────────────────────────────────
  const spawnCloud = useCallback((width, height) => {
    const word = CLOUD_WORDS[Math.floor(Math.random() * CLOUD_WORDS.length)];

    // 10% chance of a power-up cloud
    const rand = Math.random();
    let powerup = null;
    if (rand < 0.04) powerup = 'freeze';
    else if (rand < 0.08) powerup = 'bomb';
    else if (rand < 0.11) powerup = 'heart';

    const cloudWidth = Math.max(110, word.length * 15 + 40);
    const cloudHeight = 52;
    const y = 80 + Math.random() * (height - 180);

    const baseVx = (0.7 + level * 0.18) * speedMultiplier;

    cloudsRef.current.push({
      id: Date.now() + Math.random(),
      word,
      powerup,
      x: width + 20,
      y,
      width: cloudWidth,
      height: cloudHeight,
      vx: baseVx
    });
  }, [level, speedMultiplier]);

  // ── CREATE CLOUD ZAP MIST PARTICLES ─────────────────────────────────
  const createZapParticles = (x, y, w, h, isPowerup) => {
    for (let i = 0; i < 18; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 4;
      particlesRef.current.push({
        x: x + w / 2,
        y: y + h / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 3 + Math.random() * 5,
        color: isPowerup ? '#f59e0b' : '#38bdf8',
        alpha: 1
      });
    }
  };

  // ── START GAME ──────────────────────────────────────────────────────
  const startGame = () => {
    cloudsRef.current = [];
    particlesRef.current = [];
    setTypedBuffer('');
    setScore(0);
    setLevel(1);
    setHearts(5);
    setCombo(0);
    setMaxCombo(0);
    setCloudsCleared(0);
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
        localStorage.setItem('cca_game_clouds_highscore', finalScore.toString());
      } catch {}
    }

    const userId = user?.id || 0;
    if (userId > 0) {
      try {
        const estimatedWpm = Math.max(12, Math.round(finalCleared * 2));
        await axios.post(`${API_BASE}api/student/foundations/save_typing_session.php`, {
          user_id: userId,
          language: 'en',
          difficulty_level: 'game_clouds',
          lesson_title: `Clouds Arcade (Score: ${finalScore})`,
          wpm: estimatedWpm,
          cpm: estimatedWpm * 5,
          accuracy_percent: 94,
          raw_wpm: estimatedWpm,
          mistakes_count: 4,
          duration_seconds: 60
        });
      } catch (e) {
        console.error('Failed to save Clouds session', e);
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

      if (e.key === 'Backspace') {
        e.preventDefault();
        setTypedBuffer(prev => prev.slice(0, -1));
        return;
      }

      // Spacebar or Enter submits the word!
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        const currentInput = typedBuffer.trim().toLowerCase();
        if (!currentInput) return;

        const clouds = cloudsRef.current;
        const matchedIdx = clouds.findIndex(c => c.word.toLowerCase() === currentInput);

        if (matchedIdx !== -1) {
          const target = clouds[matchedIdx];
          createZapParticles(target.x, target.y, target.width, target.height, Boolean(target.powerup));
          playCloudZap(Boolean(target.powerup), soundEnabled);

          // Handle powerup
          if (target.powerup === 'freeze') {
            isSlowMotionRef.current = true;
            clearTimeout(slowMotionTimerRef.current);
            slowMotionTimerRef.current = setTimeout(() => {
              isSlowMotionRef.current = false;
            }, 7000);
          } else if (target.powerup === 'bomb') {
            // Dissolve all visible clouds
            clouds.forEach(c => createZapParticles(c.x, c.y, c.width, c.height, false));
            cloudsRef.current = [];
          } else if (target.powerup === 'heart') {
            setHearts(h => Math.min(5, h + 1));
          }

          if (target.powerup !== 'bomb') {
            clouds.splice(matchedIdx, 1);
          }

          const points = target.word.length * 45 * (combo + 1);
          setScore(prev => {
            const nextScore = prev + points;
            const nextLevel = Math.min(5, Math.floor(nextScore / 700) + 1);
            if (nextLevel > level) {
              setLevel(nextLevel);
              playLevelUpFanfare(soundEnabled);
            }
            return nextScore;
          });

          setCloudsCleared(prev => prev + 1);
          setCombo(prev => {
            const next = prev + 1;
            setMaxCombo(m => Math.max(m, next));
            return next;
          });
          setTypedBuffer('');
        } else {
          // Missed word
          setCombo(0);
          setTypedBuffer('');
        }
        return;
      }

      // Append alphanumeric char to buffer
      if (e.key.length === 1) {
        setTypedBuffer(prev => prev + e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isPaused, isGameOver, typedBuffer, combo, level, soundEnabled]);

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

      // Draw Sky Gradient (Day Sky for Light Mode / Twilight Starry Sky for Dark Mode)
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      if (currentIsDark) {
        skyGrad.addColorStop(0, '#0f172a');
        skyGrad.addColorStop(0.6, '#1e1b4b');
        skyGrad.addColorStop(1, '#312e81');
      } else {
        skyGrad.addColorStop(0, '#0284c7');
        skyGrad.addColorStop(0.6, '#38bdf8');
        skyGrad.addColorStop(1, '#bae6fd');
      }
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Distant Parallax Mountains
      ctx.fillStyle = currentIsDark ? 'rgba(15, 23, 42, 0.45)' : 'rgba(12, 74, 110, 0.25)';
      ctx.beginPath();
      ctx.moveTo(0, height);
      ctx.lineTo(0, height - 90);
      ctx.lineTo(width * 0.3, height - 150);
      ctx.lineTo(width * 0.6, height - 100);
      ctx.lineTo(width * 0.85, height - 170);
      ctx.lineTo(width, height - 80);
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fill();

      if (isPlaying && !isPaused && !isGameOver) {
        // Spawn Cloud
        const spawnInterval = Math.max(1400, 3000 - level * 350) / speedMultiplier;
        if (time - lastSpawnTimeRef.current > spawnInterval) {
          spawnCloud(width, height);
          lastSpawnTimeRef.current = time;
        }

        // Update & Render Drifting Clouds
        const clouds = cloudsRef.current;
        for (let i = clouds.length - 1; i >= 0; i--) {
          const c = clouds[i];
          const currentVx = isSlowMotionRef.current ? c.vx * 0.4 : c.vx;
          c.x -= currentVx;

          // Check if cloud drifted off left screen
          if (c.x + c.width <= 0) {
            playMissSound(soundEnabled);
            clouds.splice(i, 1);
            setCombo(0);
            setHearts(prev => {
              const next = prev - 1;
              if (next <= 0) {
                handleGameOver(score, cloudsCleared, maxCombo);
              }
              return Math.max(0, next);
            });
            continue;
          }

          // Draw Fluffy Cloud Shape
          ctx.save();
          const cx = c.x + c.width / 2;
          const cy = c.y + c.height / 2;

          ctx.fillStyle = c.powerup === 'freeze' ? 'rgba(224, 242, 254, 0.95)' :
                          c.powerup === 'bomb' ? 'rgba(254, 240, 138, 0.95)' :
                          c.powerup === 'heart' ? 'rgba(255, 228, 230, 0.95)' :
                          currentIsDark ? 'rgba(248, 250, 252, 0.92)' : 'rgba(255, 255, 255, 0.96)';
          ctx.shadowColor = currentIsDark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.1)';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.roundRect(c.x, c.y, c.width, c.height, 26);
          ctx.fill();

          // Cloud puffs
          ctx.beginPath();
          ctx.arc(cx - c.width * 0.25, c.y + 4, 18, 0, Math.PI * 2);
          ctx.arc(cx + c.width * 0.2, c.y + 2, 16, 0, Math.PI * 2);
          ctx.arc(cx, c.y - 2, 20, 0, Math.PI * 2);
          ctx.fill();

          // Render Word Text
          ctx.font = 'bold 16px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          // Match letters with typedBuffer
          const word = c.word;
          const isMatchingPrefix = typedBuffer && word.toLowerCase().startsWith(typedBuffer.toLowerCase());

          ctx.fillStyle = isMatchingPrefix ? '#0284c7' : '#0f172a';
          ctx.shadowBlur = 0;

          let badge = '';
          if (c.powerup === 'freeze') badge = ' ❄️';
          if (c.powerup === 'bomb') badge = ' ⚡';
          if (c.powerup === 'heart') badge = ' ❤️';

          ctx.fillText(word + badge, cx, cy);
          ctx.restore();
        }

        // Render Particles
        const particles = particlesRef.current;
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.alpha -= 0.035;

          if (p.alpha <= 0) {
            particles.splice(i, 1);
            continue;
          }

          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [isPlaying, isPaused, isGameOver, level, speedMultiplier, soundEnabled, score, cloudsCleared, maxCombo, handleGameOver, spawnCloud, typedBuffer]);

  return (
    <div className={`relative flex flex-col justify-between bg-sky-50 dark:bg-sky-950 rounded-3xl overflow-hidden shadow-2xl border border-sky-200 dark:border-sky-800 select-none ${
      isFullscreen ? 'h-full flex-1 w-full' : 'h-[620px] w-full'
    }`}>
      
      {/* ── TOP HUD ─────────────────────────────────────────────────── */}
      <div className="absolute top-0 inset-x-0 z-20 p-3 sm:p-4 flex items-center justify-between gap-3 bg-gradient-to-b from-white/90 via-white/60 to-transparent dark:from-sky-950/80 dark:via-sky-950/50 text-slate-800 dark:text-white">
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
              <span className="text-xl">☁️</span>
              <h2 className="text-sm sm:text-base font-black tracking-tight text-slate-900 dark:text-white">
                Clouds Arcade
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-500/30 border border-cyan-200 dark:border-cyan-400/40 text-cyan-800 dark:text-cyan-200 text-[10px] font-black uppercase">
                Level {level}
              </span>
            </div>
            <p className="text-[10px] text-slate-600 dark:text-cyan-200 font-medium">
              Type the word and press Spacebar to vaporize the cloud!
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
            <div className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-black animate-pulse shadow-md">
              <span>⚡</span>
              <span>{combo}x STREAK</span>
            </div>
          )}

          <div className="px-3.5 py-1.5 rounded-xl bg-white/80 dark:bg-white/10 border border-slate-200/80 dark:border-white/10 text-right shadow-xs">
            <p className="text-[8px] uppercase tracking-wider text-slate-500 dark:text-cyan-200 font-bold">Score</p>
            <p className="text-sm sm:text-base font-black font-mono text-indigo-700 dark:text-amber-300">{score}</p>
          </div>

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

      {/* ── BOTTOM TYPING BAR DOCK ──────────────────────────────────── */}
      {isPlaying && !isGameOver && (
        <div className="absolute bottom-4 inset-x-0 z-20 flex items-center justify-center p-2">
          <div className="px-5 py-2.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-2xl border border-slate-200 dark:border-white/20 flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500">Typing:</span>
            <div className="font-mono text-base font-black tracking-wider text-indigo-600 dark:text-indigo-400 min-w-[120px] text-left">
              {typedBuffer || <span className="text-slate-400 font-normal italic">type + Spacebar</span>}
              <span className="inline-block w-1.5 h-4 bg-indigo-600 dark:bg-indigo-400 ml-1 animate-pulse" />
            </div>
            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-500 dark:text-slate-400 font-bold uppercase">
              Hit Space
            </span>
          </div>
        </div>
      )}

      {/* ── START SCREEN OVERLAY ────────────────────────────────────── */}
      {!isPlaying && !isGameOver && (
        <div className="absolute inset-0 z-30 bg-sky-950/15 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700 shadow-2xl text-center space-y-6 text-slate-900 dark:text-white">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-sky-400 via-blue-500 to-indigo-600 text-white flex items-center justify-center text-3xl mx-auto shadow-lg shadow-sky-500/25">
              ☁️
            </div>

            <div className="space-y-1.5">
              <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Clouds Arcade</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Type the word inside each drifting cloud and hit <strong>Spacebar</strong> to vaporize it before it drifts past the screen!
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
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-600 hover:opacity-95 text-white font-black text-sm shadow-xl shadow-blue-500/25 cursor-pointer transition-all flex items-center justify-center gap-2 active:scale-95"
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
              <span className="text-4xl">⚡</span>
              <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white pt-2">
                Game Over!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                You dissolved {cloudsCleared} clouds and reached Level {level}!
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Final Score</p>
                <p className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">{score}</p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Max Combo</p>
                <p className="text-2xl font-black text-sky-600 dark:text-sky-400 font-mono">⚡ {maxCombo}x</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={startGame}
                className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-600 hover:opacity-90 text-white font-black text-xs shadow-lg cursor-pointer transition-all flex items-center justify-center gap-1.5"
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

export default CloudsGame;
