import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import {
  FiPlay, FiRefreshCw, FiZap, FiAward, FiVolume2,
  FiVolumeX, FiChevronRight, FiEdit2, FiTrash2,
  FiTrendingUp, FiCircle, FiMinus, FiActivity,
  FiMaximize2, FiMinimize2
} from 'react-icons/fi';
import { HiSparkles, HiBolt } from 'react-icons/hi2';

// Web Audio Synthesizer for Magic Path Builder
const createPathAudio = () => {
  let ctx = null;
  const getContext = () => {
    if (!ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) ctx = new AudioCtx();
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  };

  return {
    playDrawStroke: (soundOn = true) => {
      if (!soundOn) return;
      try {
        const audioCtx = getContext();
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440 + Math.random() * 80, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.04);
      } catch (e) {}
    },
    playStarCollect: (soundOn = true) => {
      if (!soundOn) return;
      try {
        const audioCtx = getContext();
        if (!audioCtx) return;
        const now = audioCtx.currentTime;
        [659.25, 880, 1318.5].forEach((freq, idx) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.06);
          gain.gain.setValueAtTime(0.09, now + idx * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.14);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(now + idx * 0.06);
          osc.stop(now + idx * 0.06 + 0.14);
        });
      } catch (e) {}
    },
    playSpringBounce: (soundOn = true) => {
      if (!soundOn) return;
      try {
        const audioCtx = getContext();
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(260, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(740, audioCtx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
      } catch (e) {}
    },
    playCrash: (soundOn = true) => {
      if (!soundOn) return;
      try {
        const audioCtx = getContext();
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(35, audioCtx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.25);
      } catch (e) {}
    },
    playVictory: (soundOn = true) => {
      if (!soundOn) return;
      try {
        const audioCtx = getContext();
        if (!audioCtx) return;
        const now = audioCtx.currentTime;
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.09);
          gain.gain.setValueAtTime(0.12, now + idx * 0.09);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.25);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(now + idx * 0.09);
          osc.stop(now + idx * 0.09 + 0.25);
        });
      } catch (e) {}
    }
  };
};

const audio = createPathAudio();

// Mountain Terrain Levels with Chasms & Peaks
const PATH_LEVELS = {
  1: {
    id: 1,
    name: 'Level 1: Valley of Chasms',
    subTitle: 'Draw bridges & ramps over deep mountain chasms',
    instruction: 'Draw smooth bridges over pits and curved ramps over mountain peaks.',
    skyColors: ['#0f172a', '#1e293b', '#0f172a'],
    mountainColor: '#1e293b',
    mountainBorder: '#38bdf8',
    themeGlow: '#0284c7',
    length: 3200,
    spawn: { x: 80, y: 220 },
    terrain: [
      // Platform 1 (Start)
      { x1: 0, y1: 260, x2: 300, y2: 260 },
      // Chasm 1 (Gap 300 -> 550)
      // Platform 2 (Middle Island)
      { x1: 550, y1: 290, x2: 850, y2: 290 },
      // Mountain Peak 1 (850 -> 1100 -> 1250)
      { x1: 850, y1: 290, x2: 1100, y2: 160 },
      { x1: 1100, y1: 160, x2: 1350, y2: 300 },
      // Chasm 2 (1350 -> 1650)
      // Platform 3
      { x1: 1650, y1: 280, x2: 2100, y2: 280 },
      // Chasm 3 & Final Stretch (2100 -> 2400)
      { x1: 2400, y1: 260, x2: 3200, y2: 260 }
    ],
    stars: [
      { id: 's1', x: 425, y: 200, collected: false },
      { id: 's2', x: 1100, y: 110, collected: false },
      { id: 's3', x: 1500, y: 210, collected: false },
      { id: 's4', x: 2250, y: 190, collected: false }
    ],
    spikes: [
      { x: 380, y: 380, w: 90, h: 25 },
      { x: 1450, y: 380, w: 120, h: 25 },
      { x: 2200, y: 380, w: 110, h: 25 }
    ]
  },
  2: {
    id: 2,
    name: 'Level 2: The Loop-de-Loop Peak',
    subTitle: 'Draw 360° round loops & steep launch ramps',
    instruction: 'Draw circular loops to build momentum and vault over massive mountain needles.',
    skyColors: ['#1e1035', '#3b0764', '#1e1035'],
    mountainColor: '#3b0764',
    mountainBorder: '#c084fc',
    themeGlow: '#9333ea',
    length: 4200,
    spawn: { x: 80, y: 200 },
    terrain: [
      { x1: 0, y1: 250, x2: 350, y2: 250 },
      // Massive Chasm requiring high jump (350 -> 800)
      { x1: 800, y1: 280, x2: 1300, y2: 280 },
      // Needle Peak (1300 -> 1550 -> 1800)
      { x1: 1300, y1: 280, x2: 1550, y2: 110 },
      { x1: 1550, y1: 110, x2: 1800, y2: 300 },
      // High Aerial Island
      { x1: 2100, y1: 190, x2: 2600, y2: 190 },
      // Final Chasm & Descent
      { x1: 2900, y1: 300, x2: 4200, y2: 300 }
    ],
    stars: [
      { id: 's1', x: 575, y: 150, collected: false },
      { id: 's2', x: 1550, y: 60, collected: false },
      { id: 's3', x: 1950, y: 210, collected: false },
      { id: 's4', x: 2750, y: 190, collected: false },
      { id: 's5', x: 3400, y: 230, collected: false }
    ],
    spikes: [
      { x: 450, y: 380, w: 200, h: 30 },
      { x: 1850, y: 380, w: 180, h: 30 },
      { x: 2650, y: 380, w: 180, h: 30 }
    ]
  },
  3: {
    id: 3,
    name: 'Level 3: Crystal Abyss Overdrive',
    subTitle: 'Fast slopes, floating spikes & multi-tier aerial bridges',
    instruction: 'Continuously sketch ramps and bridges in real-time as the rover gains high speed.',
    skyColors: ['#042f2e', '#134e4a', '#042f2e'],
    mountainColor: '#134e4a',
    mountainBorder: '#34d399',
    themeGlow: '#059669',
    length: 5200,
    spawn: { x: 80, y: 180 },
    terrain: [
      { x1: 0, y1: 240, x2: 400, y2: 240 },
      { x1: 650, y1: 290, x2: 1100, y2: 290 },
      // Downward Slalom
      { x1: 1350, y1: 180, x2: 1850, y2: 320 },
      // Upper Ridge
      { x1: 2100, y1: 160, x2: 2700, y2: 160 },
      { x1: 2950, y1: 280, x2: 3600, y2: 280 },
      { x1: 3900, y1: 250, x2: 5200, y2: 250 }
    ],
    stars: [
      { id: 's1', x: 525, y: 180, collected: false },
      { id: 's2', x: 1225, y: 210, collected: false },
      { id: 's3', x: 1975, y: 220, collected: false },
      { id: 's4', x: 2825, y: 190, collected: false },
      { id: 's5', x: 3750, y: 190, collected: false },
      { id: 's6', x: 4400, y: 190, collected: false }
    ],
    spikes: [
      { x: 450, y: 380, w: 150, h: 30 },
      { x: 1150, y: 380, w: 150, h: 30 },
      { x: 1900, y: 380, w: 150, h: 30 },
      { x: 2750, y: 380, w: 150, h: 30 },
      { x: 3650, y: 380, w: 180, h: 30 }
    ]
  }
};

const MagicPathBuilderGame = ({ user, onProgressUpdate, isMasterFullscreen, toggleMasterFullscreen }) => {
  const [selectedLevelId, setSelectedLevelId] = useState(1);
  const [gameState, setGameState] = useState('idle'); // 'idle' | 'playing' | 'crashed' | 'completed'
  const [activeTool, setActiveTool] = useState('pen'); // 'pen' | 'trampoline'
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);

  const isCurrentlyFullscreen = isMasterFullscreen || isFullscreen;

  const handleToggleFullscreen = () => {
    if (toggleMasterFullscreen) {
      toggleMasterFullscreen();
    } else {
      if (!isFullscreen) {
        setIsFullscreen(true);
        if (containerRef.current?.requestFullscreen) {
          containerRef.current.requestFullscreen().catch(() => {});
        }
      } else {
        setIsFullscreen(false);
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      }
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Drawing State
  const [drawnLines, setDrawnLines] = useState([]); // [{ x1, y1, x2, y2 }]
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState([]);
  const [trampolines, setTrampolines] = useState([]); // [{ x, y, radius: 24 }]

  // Score & Progress
  const [starsCollectedMap, setStarsCollectedMap] = useState({});
  const [score, setScore] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);

  // Physics World Engine
  const worldRef = useRef({
    running: false,
    cameraX: 0,
    rover: {
      x: 80,
      y: 220,
      vx: 3.2,
      vy: 0,
      radius: 12,
      angle: 0,
      onGround: false,
      alive: true
    },
    particles: []
  });

  const activeLevel = PATH_LEVELS[selectedLevelId];

  // Reset & Start Level
  const startLevelRun = useCallback(() => {
    const lvl = PATH_LEVELS[selectedLevelId];
    const w = worldRef.current;

    w.cameraX = 0;
    w.rover = {
      x: lvl.spawn.x,
      y: lvl.spawn.y,
      vx: 3.4,
      vy: 0,
      radius: 12,
      angle: 0,
      onGround: false,
      alive: true
    };
    w.particles = [];
    w.running = true;

    setDrawnLines([]);
    setTrampolines([]);
    setStarsCollectedMap({});
    setScore(0);
    setProgressPercent(0);
    setGameState('playing');
  }, [selectedLevelId]);

  // Restart keeping drawn lines (Quick Retry)
  const quickRetry = useCallback(() => {
    const lvl = PATH_LEVELS[selectedLevelId];
    const w = worldRef.current;

    w.cameraX = 0;
    w.rover = {
      x: lvl.spawn.x,
      y: lvl.spawn.y,
      vx: 3.4,
      vy: 0,
      radius: 12,
      angle: 0,
      onGround: false,
      alive: true
    };
    w.particles = [];
    w.running = true;

    setStarsCollectedMap({});
    setScore(0);
    setProgressPercent(0);
    setGameState('playing');
  }, [selectedLevelId]);

  // Line segment distance & collision solver
  const checkLineCollision = (rover, p1, p2) => {
    const rx = rover.x;
    const ry = rover.y;
    const r = rover.radius;

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const l2 = dx * dx + dy * dy;
    if (l2 === 0) return null;

    let t = ((rx - p1.x) * dx + (ry - p1.y) * dy) / l2;
    t = Math.max(0, Math.min(1, t));

    const projX = p1.x + t * dx;
    const projY = p1.y + t * dy;
    const dist = Math.hypot(rx - projX, ry - projY);

    if (dist <= r) {
      // Normal vector
      const len = Math.hypot(dx, dy);
      const nx = -dy / len;
      const ny = dx / len;
      return { projX, projY, nx, ny, dist, t };
    }
    return null;
  };

  // ── MAIN PHYSICS & CANVAS LOOP ────────────────────────────────────────────
  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const w = worldRef.current;
    const lvl = PATH_LEVELS[selectedLevelId];

    if (!w.running) return;

    // ── 1. ROVER PHYSICS UPDATE ─────────────────────────────────────────────
    if (w.rover.alive) {
      const gravity = 0.28;
      w.rover.vy += gravity;

      // Move Rover
      w.rover.x += w.rover.vx;
      w.rover.y += w.rover.vy;
      w.rover.angle += w.rover.vx * 0.08;

      // Camera smoothly tracks rover horizontally
      w.cameraX = Math.max(0, w.rover.x - 180);

      // Progress Calculation
      const pct = Math.min(100, Math.floor((w.rover.x / lvl.length) * 100));
      setProgressPercent(pct);

      // Check Victory Condition
      if (w.rover.x >= lvl.length - 100) {
        w.rover.alive = false;
        w.running = false;
        setGameState('completed');
        audio.playVictory(soundEnabled);
        confetti({ particleCount: 110, spread: 80, origin: { y: 0.5 } });
        toast.success(`🎉 Level ${selectedLevelId} 100% Completed! Outstanding Path Building!`);
        return;
      }

      // Check Fall in Deep Chasm / Floor Abyss
      if (w.rover.y > height - 10) {
        w.rover.alive = false;
        w.running = false;
        audio.playCrash(soundEnabled);
        setGameState('crashed');
        return;
      }

      // ── Collision Resolution against Mountain Terrain ─────────────────────
      w.rover.onGround = false;

      // 1. Check Pre-built Mountain Platforms
      for (const t of lvl.terrain) {
        const col = checkLineCollision(w.rover, { x: t.x1, y: t.y1 }, { x: t.x2, y: t.y2 });
        if (col) {
          // Push rover out of surface
          w.rover.y = col.projY - w.rover.radius;
          if (w.rover.vy > 0) w.rover.vy = 0;
          // Slope acceleration
          const slope = (t.y2 - t.y1) / (t.x2 - t.x1);
          w.rover.vx = Math.max(3.0, Math.min(8.0, 3.4 + slope * 3.5));
          w.rover.onGround = true;
        }
      }

      // 2. Check User-Drawn Custom Lines & Curves
      for (const line of drawnLines) {
        const col = checkLineCollision(w.rover, { x: line.x1, y: line.y1 }, { x: line.x2, y: line.y2 });
        if (col) {
          // Calculate tangent glide
          const dx = line.x2 - line.x1;
          const dy = line.y2 - line.y1;
          const len = Math.hypot(dx, dy);
          const tx = dx / len;
          const ty = dy / len;

          // Push out
          w.rover.x = col.projX - (-ty) * (w.rover.radius + 1);
          w.rover.y = col.projY - (tx) * (w.rover.radius + 1);

          // Redirect velocity along user curve
          const dot = w.rover.vx * tx + w.rover.vy * ty;
          const speedMag = Math.max(3.5, Math.hypot(w.rover.vx, w.rover.vy));
          w.rover.vx = tx * (dot > 0 ? speedMag : -speedMag);
          w.rover.vy = ty * (dot > 0 ? speedMag : -speedMag) * 0.9;
          w.rover.onGround = true;
        }
      }

      // 3. Check Trampoline Bounce Pads
      for (const tramp of trampolines) {
        const dist = Math.hypot(w.rover.x - tramp.x, w.rover.y - tramp.y);
        if (dist < w.rover.radius + tramp.radius) {
          w.rover.vy = -10.5; // High Spring Launch!
          w.rover.vx = Math.max(w.rover.vx, 4.5);
          audio.playSpringBounce(soundEnabled);
          toast.success('🦘 High Spring Bounce!');

          for (let i = 0; i < 12; i++) {
            w.particles.push({
              x: tramp.x,
              y: tramp.y,
              vx: (Math.random() - 0.5) * 8,
              vy: (Math.random() - 0.5) * 8,
              color: '#38bdf8',
              life: 1.0
            });
          }
        }
      }

      // 4. Check Spikes Collision
      for (const spike of lvl.spikes) {
        if (
          w.rover.x + w.rover.radius >= spike.x &&
          w.rover.x - w.rover.radius <= spike.x + spike.w &&
          w.rover.y + w.rover.radius >= spike.y &&
          w.rover.y - w.rover.radius <= spike.y + spike.h
        ) {
          w.rover.alive = false;
          w.running = false;
          audio.playCrash(soundEnabled);
          setGameState('crashed');
          return;
        }
      }

      // 5. Check Golden Stars Collection
      lvl.stars.forEach(star => {
        if (!starsCollectedMap[star.id] && Math.hypot(w.rover.x - star.x, w.rover.y - star.y) < 26) {
          setStarsCollectedMap(prev => ({ ...prev, [star.id]: true }));
          setScore(prev => prev + 100);
          audio.playStarCollect(soundEnabled);

          for (let i = 0; i < 14; i++) {
            w.particles.push({
              x: star.x,
              y: star.y,
              vx: (Math.random() - 0.5) * 8,
              vy: (Math.random() - 0.5) * 8,
              color: '#fde047',
              life: 1.0
            });
          }
        }
      });
    }

    // ── 2. RENDER ATMOSPHERE & MOUNTAINS ─────────────────────────────────────
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, lvl.skyColors[0]);
    grad.addColorStop(0.5, lvl.skyColors[1]);
    grad.addColorStop(1, lvl.skyColors[2]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    const camX = w.cameraX;

    // Parallax Distant Mountains
    ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
    ctx.beginPath();
    ctx.moveTo(0, height);
    for (let x = 0; x <= width; x += 40) {
      const wx = (camX * 0.25) + x;
      const my = 170 + Math.sin(wx * 0.003) * 50 + Math.cos(wx * 0.007) * 30;
      ctx.lineTo(x, my);
    }
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fill();

    // ── 3. DRAW PRE-BUILT MOUNTAIN TERRAIN & CHASMS ─────────────────────────
    ctx.fillStyle = lvl.mountainColor;
    ctx.strokeStyle = lvl.mountainBorder;
    ctx.lineWidth = 4;
    ctx.shadowColor = lvl.themeGlow;
    ctx.shadowBlur = 10;

    lvl.terrain.forEach(t => {
      const sx1 = t.x1 - camX;
      const sx2 = t.x2 - camX;
      if (sx2 < -50 || sx1 > width + 50) return;

      // Platform Stroke & Solid Mountain Base
      ctx.beginPath();
      ctx.moveTo(sx1, t.y1);
      ctx.lineTo(sx2, t.y2);
      ctx.lineTo(sx2, height);
      ctx.lineTo(sx1, height);
      ctx.closePath();
      ctx.fill();

      // Glowing Top Edge
      ctx.beginPath();
      ctx.moveTo(sx1, t.y1);
      ctx.lineTo(sx2, t.y2);
      ctx.stroke();
    });
    ctx.shadowBlur = 0;

    // ── 4. DRAW DEADLY SPIKES IN CHASMS ─────────────────────────────────────
    lvl.spikes.forEach(sp => {
      const sx = sp.x - camX;
      if (sx < -100 || sx > width + 100) return;

      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 8;
      const spikeWidth = 14;
      const count = Math.floor(sp.w / spikeWidth);

      for (let i = 0; i < count; i++) {
        const tx = sx + i * spikeWidth;
        ctx.beginPath();
        ctx.moveTo(tx, sp.y + sp.h);
        ctx.lineTo(tx + spikeWidth / 2, sp.y);
        ctx.lineTo(tx + spikeWidth, sp.y + sp.h);
        ctx.closePath();
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    });

    // ── 5. DRAW USER-DRAWN RAMPS, CURVES & BRIDGES ──────────────────────────
    if (drawnLines.length > 0) {
      ctx.strokeStyle = '#f43f5e'; // Bright Hot Pink Magic Ink
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 14;

      ctx.beginPath();
      drawnLines.forEach(l => {
        const lx1 = l.x1 - camX;
        const lx2 = l.x2 - camX;
        ctx.moveTo(lx1, l.y1);
        ctx.lineTo(lx2, l.y2);
      });
      ctx.stroke();

      // White inner laser core
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Draw active stroke currently being drawn
    if (currentStroke.length > 1) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      currentStroke.forEach((pt, idx) => {
        if (idx === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();
    }

    // ── 6. DRAW TRAMPOLINE PADS ─────────────────────────────────────────────
    trampolines.forEach(tramp => {
      const tx = tramp.x - camX;
      if (tx >= -40 && tx <= width + 40) {
        ctx.fillStyle = '#38bdf8';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(tx, tramp.y, tramp.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⚡', tx, tramp.y + 4);
      }
    });

    // ── 7. DRAW STARS & FINISH GOAL ─────────────────────────────────────────
    lvl.stars.forEach(star => {
      const sx = star.x - camX;
      const isCollected = !!starsCollectedMap[star.id];

      if (sx >= -30 && sx <= width + 30 && !isCollected) {
        ctx.fillStyle = '#fde047';
        ctx.shadowColor = '#eab308';
        ctx.shadowBlur = 14;
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⭐', sx, star.y + 6);
        ctx.shadowBlur = 0;
      }
    });

    // Finish Goal Banner (Checkered Flag)
    const goalX = lvl.length - 100 - camX;
    if (goalX >= -50 && goalX <= width + 50) {
      ctx.fillStyle = '#10b981';
      ctx.fillRect(goalX, 160, 6, 100);
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(goalX + 6, 160);
      ctx.lineTo(goalX + 35, 175);
      ctx.lineTo(goalX + 6, 190);
      ctx.closePath();
      ctx.fill();
    }

    // ── 8. DRAW ROVER VEHICLE ───────────────────────────────────────────────
    if (w.rover.alive) {
      const rx = w.rover.x - camX;
      const ry = w.rover.y;

      ctx.save();
      ctx.translate(rx, ry);
      ctx.rotate(w.rover.angle);

      // Glowing Sphere Core / Rover Body
      ctx.fillStyle = '#38bdf8';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(0, 0, w.rover.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Wheel Spokes
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-w.rover.radius, 0);
      ctx.lineTo(w.rover.radius, 0);
      ctx.moveTo(0, -w.rover.radius);
      ctx.lineTo(0, w.rover.radius);
      ctx.stroke();

      ctx.restore();
    }

    // ── 9. DRAW PARTICLES ───────────────────────────────────────────────────
    if (w.particles.length > 0) {
      w.particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.03;
        if (p.life > 0) {
          ctx.fillStyle = p.color;
          ctx.fillRect(p.x - camX, p.y, 3.5, 3.5);
        }
      });
      w.particles = w.particles.filter(p => p.life > 0);
    }

    animFrameRef.current = requestAnimationFrame(gameLoop);
  }, [selectedLevelId, drawnLines, currentStroke, trampolines, starsCollectedMap, soundEnabled]);

  // ── MOUSE DRAWING & RAMP BUILDER EVENTS ────────────────────────────────────
  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const handleMouseDown = (e) => {
    const { x, y } = getCanvasCoords(e);
    const worldX = x + worldRef.current.cameraX;

    if (activeTool === 'pen') {
      setIsDrawing(true);
      setCurrentStroke([{ x, y, worldX }]);
      audio.playDrawStroke(soundEnabled);
    } else if (activeTool === 'trampoline') {
      // Place Trampoline Pad
      setTrampolines(prev => [...prev, { x: worldX, y, radius: 24 }]);
      audio.playSpringBounce(soundEnabled);
      toast.success('🦘 Trampoline Pad Dropped!');
    }
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || activeTool !== 'pen') return;
    const { x, y } = getCanvasCoords(e);
    const worldX = x + worldRef.current.cameraX;

    const lastPt = currentStroke[currentStroke.length - 1];
    if (lastPt && Math.hypot(x - lastPt.x, y - lastPt.y) > 8) {
      // Add continuous line segment into drawn lines
      setDrawnLines(prev => [
        ...prev,
        {
          x1: lastPt.worldX,
          y1: lastPt.y,
          x2: worldX,
          y2: y
        }
      ]);
      setCurrentStroke(prev => [...prev, { x, y, worldX }]);
      audio.playDrawStroke(soundEnabled);
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    setCurrentStroke([]);
  };

  // Main Loop Manager
  useEffect(() => {
    if (gameState === 'playing') {
      worldRef.current.running = true;
      animFrameRef.current = requestAnimationFrame(gameLoop);
    } else {
      worldRef.current.running = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [gameState, gameLoop]);

  return (
    <div
      ref={containerRef}
      className={`select-none transition-all duration-200 ${
        isFullscreen
          ? 'fixed inset-0 z-50 bg-[#0f0407] p-3 sm:p-6 flex flex-col justify-center items-center overflow-y-auto w-screen h-screen'
          : 'space-y-4'
      }`}
    >
      {/* Top Header & Level Select Bar */}
      <div className={`flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800 backdrop-blur-md ${isFullscreen ? 'w-full max-w-6xl' : ''}`}>
        {/* Level Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {Object.values(PATH_LEVELS).map(lvl => {
            const isSel = selectedLevelId === lvl.id;
            return (
              <button
                key={lvl.id}
                onClick={() => {
                  setSelectedLevelId(lvl.id);
                  setGameState('idle');
                }}
                className={`px-3.5 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSel
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 scale-102'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                <span>🏔️ Level {lvl.id}</span>
              </button>
            );
          })}
        </div>

        {/* Tools: Magic Pen vs Trampoline */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTool('pen')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all ${
              activeTool === 'pen'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <FiEdit2 size={13} />
            <span>✎ Magic Pen</span>
          </button>

          <button
            onClick={() => setActiveTool('trampoline')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all ${
              activeTool === 'trampoline'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <FiCircle size={13} />
            <span>⚡ Trampoline</span>
          </button>

          <button
            onClick={() => {
              setDrawnLines([]);
              setTrampolines([]);
              toast.info('All custom paths cleared.');
            }}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
          >
            <FiTrash2 size={13} />
            <span>Clear Ink</span>
          </button>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white cursor-pointer ml-1"
          >
            {soundEnabled ? <FiVolume2 size={16} /> : <FiVolumeX size={16} />}
          </button>

          <button
            onClick={handleToggleFullscreen}
            title={isCurrentlyFullscreen ? "Exit Fullscreen (Esc)" : "Full Page / Fullscreen"}
            className="p-2 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white cursor-pointer transition-all flex items-center gap-1.5"
          >
            {isCurrentlyFullscreen ? <FiMinimize2 size={16} /> : <FiMaximize2 size={16} />}
          </button>
        </div>
      </div>

      {/* Main Interactive Stage Canvas Container */}
      <div className={`relative rounded-3xl overflow-hidden border border-rose-900/40 shadow-2xl bg-slate-950 ${isCurrentlyFullscreen ? 'w-full max-w-6xl my-auto' : ''}`}>
        {/* Floating Corner Fullscreen Toggle Button */}
        <button
          onClick={handleToggleFullscreen}
          title={isCurrentlyFullscreen ? "Exit Fullscreen (Esc)" : "Full Screen / Full Page"}
          className="absolute top-4 right-4 z-30 p-2 sm:p-2.5 rounded-2xl bg-black/60 hover:bg-rose-600 text-white/80 hover:text-white border border-rose-500/30 hover:border-rose-400 backdrop-blur-md shadow-xl transition-all cursor-pointer hover:scale-110 active:scale-95 flex items-center gap-1.5 pointer-events-auto"
        >
          {isCurrentlyFullscreen ? <FiMinimize2 size={16} /> : <FiMaximize2 size={16} />}
          <span className="text-[10px] font-black uppercase hidden sm:inline">{isCurrentlyFullscreen ? 'Exit Full' : 'Full Page'}</span>
        </button>

        {/* Top Progress & Star HUD */}
        <div className="absolute top-4 inset-x-0 z-20 flex flex-col items-center pointer-events-none">
          <h3 className="text-sm sm:text-base font-black tracking-widest text-white drop-shadow uppercase flex items-center gap-2">
            <span>{activeLevel.name}</span>
            <span className="text-xs text-rose-400 font-bold">• {progressPercent}%</span>
            <span className="text-xs text-amber-300 font-bold ml-2">
              ⭐ {score} Pts ({Object.keys(starsCollectedMap).length}/{activeLevel.stars.length})
            </span>
          </h3>

          <div className="mt-1.5 w-64 sm:w-80 h-3 rounded-full bg-slate-950/80 border border-rose-500/40 p-0.5 overflow-hidden shadow-md">
            <div
              style={{ width: `${progressPercent}%` }}
              className="h-full rounded-full bg-gradient-to-r from-rose-500 to-pink-400 shadow-[0_0_10px_rgba(244,63,94,0.8)] transition-all duration-75"
            ></div>
          </div>
        </div>

        {/* Interactive Canvas */}
        <canvas
          ref={canvasRef}
          width={isFullscreen ? 1100 : 720}
          height={isFullscreen ? 520 : 400}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className={`w-full block ${isFullscreen ? 'h-[520px]' : 'h-[400px]'} cursor-crosshair`}
        />

        {/* IDLE SCREEN */}
        {gameState === 'idle' && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center z-30 p-6 text-center space-y-4 animate-in fade-in">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-rose-600 to-pink-500 text-white flex items-center justify-center text-4xl shadow-2xl shadow-rose-600/40 animate-pulse">
              ✎
            </div>

            <div>
              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-wide uppercase">
                {activeLevel.name}
              </h3>
              <p className="text-xs sm:text-sm text-rose-300/80 font-medium max-w-md mt-1">
                {activeLevel.subTitle} • Draw ramps and bridges live with your mouse to guide the rover over chasms!
              </p>
            </div>

            <button
              onClick={startLevelRun}
              className="px-10 py-3.5 bg-gradient-to-r from-rose-600 to-pink-500 hover:from-rose-500 hover:to-pink-400 text-white font-black text-sm rounded-2xl shadow-xl shadow-rose-600/40 hover:scale-105 active:scale-95 transition-all cursor-pointer uppercase tracking-wider"
            >
              Start Mountain Run 🚀
            </button>
          </div>
        )}

        {/* CRASHED MODAL OVERLAY */}
        {gameState === 'crashed' && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center z-30 p-6 text-center space-y-4 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-3xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center text-3xl">
              💥
            </div>
            <h3 className="text-2xl font-black text-white uppercase">Chasm Fall / Crash!</h3>
            <p className="text-xs text-slate-400">
              Traversed: <strong className="text-rose-400 font-black">{progressPercent}%</strong> • Score: <strong className="text-amber-300">{score} pts</strong>
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={quickRetry}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow-lg cursor-pointer uppercase"
              >
                Quick Retry (Keep Paths)
              </button>
              <button
                onClick={startLevelRun}
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl cursor-pointer uppercase"
              >
                Reset All Paths
              </button>
            </div>
          </div>
        )}

        {/* VICTORY 100% COMPLETE MODAL */}
        {gameState === 'completed' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center z-30 p-6 text-center space-y-4 animate-in zoom-in-95">
            <div className="w-20 h-20 rounded-3xl bg-amber-400 text-slate-950 flex items-center justify-center text-4xl shadow-2xl shadow-amber-400/40 animate-bounce">
              🏆
            </div>

            <div className="space-y-1">
              <h3 className="text-3xl font-black text-emerald-400 tracking-wider uppercase">
                100% MOUNTAIN PATH MASTER!
              </h3>
              <p className="text-sm font-bold text-slate-300">
                You successfully built all bridges & ramps across <span className="text-rose-400 font-black">{activeLevel.name}</span>!
              </p>
              <p className="text-xs text-amber-300 font-bold mt-1">
                Final Score: {score} Pts • Stars Collected!
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={startLevelRun}
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-black text-xs rounded-xl cursor-pointer"
              >
                Replay Level
              </button>
              {selectedLevelId < Object.keys(PATH_LEVELS).length && (
                <button
                  onClick={() => {
                    setSelectedLevelId(prev => prev + 1);
                    setGameState('idle');
                  }}
                  className="px-8 py-2.5 bg-gradient-to-r from-rose-600 to-pink-500 text-white font-black text-xs rounded-xl shadow-lg cursor-pointer uppercase flex items-center gap-1.5"
                >
                  <span>Next Level {selectedLevelId + 1}</span>
                  <FiChevronRight size={16} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Footer Guidance */}
        <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex flex-wrap items-center justify-between text-[11px] font-mono text-rose-300/80 px-4">
          <span>✎ Click & Drag anywhere on screen to draw bridges, ramps & 360° loop curves in real-time</span>
          <span>⚡ Select Trampoline tool to place high-bounce pads</span>
        </div>
      </div>
    </div>
  );
};

export default MagicPathBuilderGame;
