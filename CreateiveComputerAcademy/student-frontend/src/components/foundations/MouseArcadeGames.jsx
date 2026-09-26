import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import {
  FiPlay, FiRefreshCw, FiZap, FiAward, FiActivity,
  FiTarget, FiGrid, FiCompass, FiShield, FiEdit3,
  FiMaximize2, FiMinimize2
} from 'react-icons/fi';
import SpaceWavesGame from './SpaceWavesGame';
import PenToolMasterGame from './PenToolMasterGame';
import CanyonGliderGame from './CanyonGliderGame';
import MagicPathBuilderGame from './MagicPathBuilderGame';

// Audio Synthesizer
const playSound = (freq = 440, type = 'sine', duration = 0.1) => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {}
};

const MouseArcadeGames = ({ user, onProgressUpdate, isMasterFullscreen, toggleMasterFullscreen }) => {
  const [activeGame, setActiveGame] = useState('spacewaves'); // 'spacewaves' | 'archery' | 'combat' | 'balloon' | 'maze' | 'whack' | 'shapes'
  const [gameState, setGameState] = useState('idle'); // 'idle' | 'playing' | 'gameover'
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [combo, setCombo] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef(null);

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

  // ── GAME 1: ARCHERY BOW & ARROW STATE ────────────────────────────────────
  const [bowPos, setBowPos] = useState({ x: 80, y: 220 });
  const [isPullingBow, setIsPullingBow] = useState(false);
  const [pullStart, setPullStart] = useState({ x: 0, y: 0 });
  const [pullEnd, setPullEnd] = useState({ x: 0, y: 0 });
  const [arrows, setArrows] = useState([]);
  const [archeryTargets, setArcheryTargets] = useState([]);
  const archeryAnimRef = useRef(null);
  const archeryTimerRef = useRef(null);


  // ── GAME 3: BALLOON POP FRENZY STATE ─────────────────────────────────────
  const [balloons, setBalloons] = useState([]);
  const balloonAnimRef = useRef(null);
  const balloonSpawnTimerRef = useRef(null);

  // ── GAME 4: LASER MAZE RUNNER STATE ──────────────────────────────────────
  const [mazeLevel, setMazeLevel] = useState(1);
  const [mazeLives, setMazeLives] = useState(3);
  const canvasRef = useRef(null);
  const mazeStateRef = useRef({ inProgress: false, hasStarted: false });

  // ── GAME 5: WHACK-A-BUG STATE ─────────────────────────────────────────────
  const [moles, setMoles] = useState(Array(9).fill(null));
  const moleTimerRef = useRef(null);

  // ── GAME 6: SHAPE SNAP PUZZLE STATE ──────────────────────────────────────
  const initialShapes = [
    { id: 's1', type: 'circle', icon: '🔴', label: 'Circle' },
    { id: 's2', type: 'star', icon: '⭐', label: 'Star' },
    { id: 's3', type: 'diamond', icon: '💎', label: 'Diamond' },
    { id: 's4', type: 'heart', icon: '💖', label: 'Heart' },
    { id: 's5', type: 'square', icon: '🟩', label: 'Square' },
    { id: 's6', type: 'hexagon', icon: '🔷', label: 'Hexagon' },
  ];
  const [draggableShapes, setDraggableShapes] = useState(initialShapes);
  const [snappedShapes, setSnappedShapes] = useState({});
  const [draggedShape, setDraggedShape] = useState(null);

  // Clean all timers
  const clearAllTimers = () => {
    if (archeryAnimRef.current) cancelAnimationFrame(archeryAnimRef.current);
    if (archeryTimerRef.current) clearInterval(archeryTimerRef.current);
    if (balloonSpawnTimerRef.current) clearInterval(balloonSpawnTimerRef.current);
    if (balloonAnimRef.current) cancelAnimationFrame(balloonAnimRef.current);
    if (moleTimerRef.current) clearInterval(moleTimerRef.current);
  };

  useEffect(() => {
    return clearAllTimers;
  }, []);

  // ── GAME 1: ARCHERY MASTER ADVANCED CANVAS PHYSICS ──────────────────────
  const archeryCanvasRef = useRef(null);
  const archeryStateRef = useRef({
    bow: { x: 70, y: 220, angle: 0 },
    isPulling: false,
    pullOrigin: { x: 70, y: 220 },
    pullCurrent: { x: 70, y: 220 },
    power: 0,
    arrows: [],
    targets: [],
    fruits: [],
    particles: [],
    floatingTexts: [],
    lastFruitSpawn: 0,
    running: false
  });

  const startArcheryGame = () => {
    setGameState('playing');
    setScore(0);
    setTimeLeft(45);
    setCombo(1);

    const st = archeryStateRef.current;
    st.running = true;
    st.arrows = [];
    st.particles = [];
    st.floatingTexts = [];
    st.targets = [
      { x: 580, y: 120, speed: 2, radius: 36, dir: 1, type: 'board' },
      { x: 500, y: 240, speed: 2.8, radius: 28, dir: -1, type: 'board' },
      { x: 620, y: 320, speed: 1.8, radius: 32, dir: 1, type: 'board' }
    ];
    st.fruits = [];
    st.lastFruitSpawn = Date.now();

    if (archeryTimerRef.current) clearInterval(archeryTimerRef.current);
    archeryTimerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(archeryTimerRef.current);
          st.running = false;
          finishGame('archery');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Canvas Lifecycle Effect for Archery and Maze
  useEffect(() => {
    if (gameState === 'playing' && activeGame === 'archery') {
      const canvas = archeryCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const st = archeryStateRef.current;
      st.running = true;

      const renderArchery = () => {
        if (!st.running) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 1. Sky & Forest Dojo Background Gradient
        const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        grad.addColorStop(0, '#0f172a');
        grad.addColorStop(1, '#1e1b4b');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Floor & Grass
      ctx.fillStyle = '#064e3b';
      ctx.fillRect(0, canvas.height - 30, canvas.width, 30);
      ctx.fillStyle = '#047857';
      ctx.fillRect(0, canvas.height - 35, canvas.width, 5);

      // 2. Spawn Flying Fruits periodically
      if (Date.now() - st.lastFruitSpawn > 2500) {
        st.lastFruitSpawn = Date.now();
        const fruitTypes = ['🍎', '🍉', '🍊', '⭐'];
        const icon = fruitTypes[Math.floor(Math.random() * fruitTypes.length)];
        st.fruits.push({
          x: Math.floor(Math.random() * 200) + 360,
          y: canvas.height - 40,
          vx: -(Math.random() * 1.5 + 0.5),
          vy: -(Math.random() * 4 + 7.5),
          icon,
          radius: 18,
          active: true,
          rot: 0
        });
      }

      // 3. Update & Draw Moving Targets
      st.targets.forEach(t => {
        t.y += t.speed * t.dir;
        if (t.y < 50 || t.y > canvas.height - 80) t.dir *= -1;

        // Draw Wooden Backing
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.radius + 4, 0, Math.PI * 2);
        ctx.fill();

        // White Outer Ring
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
        ctx.fill();

        // Blue Middle Ring
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.radius * 0.7, 0, Math.PI * 2);
        ctx.fill();

        // Red Inner Ring
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.radius * 0.45, 0, Math.PI * 2);
        ctx.fill();

        // Gold Bullseye
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.radius * 0.22, 0, Math.PI * 2);
        ctx.fill();
      });

      // 4. Update & Draw Flying Fruits
      st.fruits = st.fruits.filter(f => {
        if (!f.active) return false;
        f.x += f.vx;
        f.y += f.vy;
        f.vy += 0.18; // gravity
        f.rot += 0.05;

        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.rotate(f.rot);
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(f.icon, 0, 0);
        ctx.restore();

        return f.y < canvas.height - 20;
      });

      // 5. Update & Draw Arrows with Gravity Physics & Collision
      st.arrows = st.arrows.filter(arr => {
        if (!arr.stuck) {
          arr.x += arr.vx;
          arr.y += arr.vy;
          arr.vy += 0.15; // Realistic Arrow Drop Gravity
          arr.angle = Math.atan2(arr.vy, arr.vx);

          // Check Hit on Targets
          for (const t of st.targets) {
            const dist = Math.hypot(arr.x - t.x, arr.y - t.y);
            if (dist <= t.radius) {
              arr.stuck = true;
              arr.stuckTarget = t;
              arr.offsetY = arr.y - t.y;

              // Calculate Score based on precision ring
              let pts = 20;
              let ringLabel = 'Target Hit! +20';
              if (dist <= t.radius * 0.25) {
                pts = 100;
                ringLabel = '🎯 BULLSEYE! +100';
                playSound(1046, 'triangle', 0.25);
                confetti({ particleCount: 35, spread: 50, origin: { x: arr.x / canvas.width, y: arr.y / canvas.height } });
              } else if (dist <= t.radius * 0.5) {
                pts = 50;
                ringLabel = '🔴 Inner Ring! +50';
                playSound(784, 'sine', 0.15);
              } else {
                playSound(523, 'sine', 0.12);
              }

              setScore(s => s + pts);
              setCombo(c => Math.min(5, c + 1));

              // Floating Text
              st.floatingTexts.push({
                x: arr.x,
                y: arr.y,
                text: ringLabel,
                color: pts === 100 ? '#fbbf24' : '#38bdf8',
                alpha: 1
              });

              // Wood Splinter Particles
              for (let i = 0; i < 8; i++) {
                st.particles.push({
                  x: arr.x,
                  y: arr.y,
                  vx: (Math.random() - 0.5) * 4,
                  vy: (Math.random() - 0.5) * 4,
                  color: '#fbbf24',
                  alpha: 1
                });
              }
              break;
            }
          }

          // Check Hit on Fruits
          for (const f of st.fruits) {
            if (!f.active) continue;
            const dist = Math.hypot(arr.x - f.x, arr.y - f.y);
            if (dist <= f.radius + 10) {
              f.active = false;
              playSound(880, 'triangle', 0.2);
              setScore(s => s + 40);

              st.floatingTexts.push({
                x: f.x,
                y: f.y,
                text: `🍉 SLICE! +40`,
                color: '#ec4899',
                alpha: 1
              });

              // Fruit Juice Splash Particles
              for (let i = 0; i < 14; i++) {
                st.particles.push({
                  x: f.x,
                  y: f.y,
                  vx: (Math.random() - 0.5) * 6,
                  vy: (Math.random() - 0.5) * 6,
                  color: '#f43f5e',
                  alpha: 1
                });
              }
              break;
            }
          }
        } else if (arr.stuckTarget) {
          // If stuck, follow target movement
          arr.y = arr.stuckTarget.y + arr.offsetY;
        }

        // Draw Arrow
        ctx.save();
        ctx.translate(arr.x, arr.y);
        ctx.rotate(arr.angle);

        // Arrow Shaft
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-24, 0);
        ctx.lineTo(12, 0);
        ctx.stroke();

        // Arrow Head
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.moveTo(12, 0);
        ctx.lineTo(4, -4);
        ctx.lineTo(4, 4);
        ctx.closePath();
        ctx.fill();

        // Feathers
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.moveTo(-24, 0);
        ctx.lineTo(-18, -4);
        ctx.lineTo(-12, 0);
        ctx.lineTo(-18, 4);
        ctx.closePath();
        ctx.fill();

        ctx.restore();

        return arr.x < canvas.width + 50 && arr.y < canvas.height;
      });

      // 6. Draw Particles
      st.particles = st.particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.03;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        return p.alpha > 0;
      });

      // 7. Draw Floating Texts
      st.floatingTexts = st.floatingTexts.filter(ft => {
        ft.y -= 1;
        ft.alpha -= 0.02;
        ctx.font = 'bold 14px sans-serif';
        ctx.fillStyle = ft.color;
        ctx.globalAlpha = Math.max(0, ft.alpha);
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.globalAlpha = 1;
        return ft.alpha > 0;
      });

      // 8. Draw Archer Bow & Pulling Mechanics
      const bow = st.bow;
      ctx.save();
      ctx.translate(bow.x, bow.y);
      ctx.rotate(bow.angle);

      // Bow Limb Curve
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(0, 0, 32, -Math.PI / 2.2, Math.PI / 2.2);
      ctx.stroke();

      // Bowstring
      const pullX = st.isPulling ? -Math.min(25, st.power * 0.3) : 0;
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(12, -30);
      ctx.lineTo(pullX, 0);
      ctx.lineTo(12, 30);
      ctx.stroke();

      // Nocked Arrow on String while pulling
      if (st.isPulling) {
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(pullX - 10, 0);
        ctx.lineTo(pullX + 26, 0);
        ctx.stroke();

        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.moveTo(pullX + 26, 0);
        ctx.lineTo(pullX + 18, -4);
        ctx.lineTo(pullX + 18, 4);
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();

      // 9. Projected Trajectory Dotted Guide while aiming
      if (st.isPulling && st.power > 5) {
        ctx.save();
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();

        let trajX = bow.x + Math.cos(bow.angle) * 30;
        let trajY = bow.y + Math.sin(bow.angle) * 30;
        let trajVx = Math.cos(bow.angle) * (st.power * 0.45);
        let trajVy = Math.sin(bow.angle) * (st.power * 0.45);

        ctx.moveTo(trajX, trajY);
        for (let step = 0; step < 22; step++) {
          trajX += trajVx;
          trajY += trajVy;
          trajVy += 0.15; // gravity prediction
          ctx.lineTo(trajX, trajY);
        }
        ctx.stroke();
        ctx.restore();
      }

      // 10. Power Bar Meter at Bottom Left
      if (st.isPulling) {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(30, canvas.height - 20, 100, 10);
        const powerGrad = ctx.createLinearGradient(30, 0, 130, 0);
        powerGrad.addColorStop(0, '#10b981');
        powerGrad.addColorStop(1, '#ef4444');
        ctx.fillStyle = powerGrad;
        ctx.fillRect(30, canvas.height - 20, Math.min(100, st.power), 10);
      }

      archeryAnimRef.current = requestAnimationFrame(renderArchery);
    };

    archeryAnimRef.current = requestAnimationFrame(renderArchery);

    return () => {
      st.running = false;
      if (archeryAnimRef.current) cancelAnimationFrame(archeryAnimRef.current);
    };
  }
}, [gameState, activeGame]);

  const handleArcheryMouseDown = (e) => {
    if (gameState !== 'playing' || activeGame !== 'archery') return;
    const canvas = archeryCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const st = archeryStateRef.current;
    st.isPulling = true;
    st.pullOrigin = { x, y };
    st.pullCurrent = { x, y };
  };

  const handleArcheryMouseMove = (e) => {
    const canvas = archeryCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const st = archeryStateRef.current;
    // Always aim bow towards mouse position
    st.bow.angle = Math.atan2(y - st.bow.y, x - st.bow.x);

    if (st.isPulling) {
      st.pullCurrent = { x, y };
      const dist = Math.hypot(x - st.pullOrigin.x, y - st.pullOrigin.y);
      st.power = Math.min(100, dist * 0.85);
    }
  };

  const handleArcheryMouseUp = () => {
    const st = archeryStateRef.current;
    if (!st.isPulling || gameState !== 'playing') return;
    st.isPulling = false;

    if (st.power > 8) {
      const launchSpeed = Math.max(8, st.power * 0.28);
      const angle = st.bow.angle;
      const vx = Math.cos(angle) * launchSpeed;
      const vy = Math.sin(angle) * launchSpeed;

      playSound(420, 'triangle', 0.08); // Whoosh arrow release
      st.arrows.push({
        x: st.bow.x + Math.cos(angle) * 30,
        y: st.bow.y + Math.sin(angle) * 30,
        vx,
        vy,
        angle,
        stuck: false
      });
    }
    st.power = 0;
  };


  // ─────────────────────────────────────────────────────────────────────────
  // 3. BALLOON POP LOGIC
  // ─────────────────────────────────────────────────────────────────────────
  const startBalloonGame = () => {
    setGameState('playing');
    setScore(0);
    setTimeLeft(30);
    setCombo(1);
    setBalloons([]);

    let bId = 0;
    balloonSpawnTimerRef.current = setInterval(() => {
      const types = ['normal', 'normal', 'gold', 'bomb'];
      const chosenType = types[Math.floor(Math.random() * types.length)];
      const randX = Math.floor(Math.random() * 80) + 10;
      const speed = 1.5 + Math.random() * 2;

      setBalloons(prev => [
        ...prev.slice(-15),
        {
          id: bId++,
          type: chosenType,
          x: randX,
          y: 420,
          speed,
          popped: false,
          color: chosenType === 'gold' ? 'bg-amber-400' : chosenType === 'bomb' ? 'bg-slate-950' : 'bg-indigo-500'
        }
      ]);
    }, 600);

    const animate = () => {
      setBalloons(prev =>
        prev
          .map(b => ({ ...b, y: b.y - b.speed }))
          .filter(b => b.y > -50 && !b.popped)
      );
      balloonAnimRef.current = requestAnimationFrame(animate);
    };
    balloonAnimRef.current = requestAnimationFrame(animate);
  };

  const handlePopBalloon = (e, balloon) => {
    e.stopPropagation();
    if (balloon.popped || gameState !== 'playing') return;

    if (balloon.type === 'bomb') {
      playSound(150, 'sawtooth', 0.2);
      setScore(prev => Math.max(0, prev - 25));
      setCombo(1);
    } else if (balloon.type === 'gold') {
      playSound(784, 'triangle', 0.15);
      setScore(prev => prev + 50 * combo);
      setCombo(prev => Math.min(5, prev + 1));
    } else {
      playSound(523.25 + combo * 40, 'sine', 0.1);
      setScore(prev => prev + 10 * combo);
      setCombo(prev => Math.min(5, prev + 1));
    }

    setBalloons(prev => prev.map(b => b.id === balloon.id ? { ...b, popped: true } : b));
  };

  // ─────────────────────────────────────────────────────────────────────────
  // 4. LASER MAZE LOGIC
  // ─────────────────────────────────────────────────────────────────────────
  const startMazeGame = () => {
    setGameState('playing');
    setScore(0);
    setMazeLives(3);
    setMazeLevel(1);
    drawMaze(1);
  };

  const drawMaze = (lvl) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.lineWidth = lvl === 1 ? 55 : lvl === 2 ? 42 : 32;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#38bdf8';

    ctx.beginPath();
    ctx.moveTo(60, 200);
    if (lvl === 1) ctx.bezierCurveTo(200, 50, 400, 350, 580, 200);
    else if (lvl === 2) {
      ctx.lineTo(160, 80); ctx.lineTo(260, 320); ctx.lineTo(380, 80); ctx.lineTo(480, 320); ctx.lineTo(580, 200);
    } else {
      ctx.lineTo(120, 330); ctx.lineTo(300, 330); ctx.lineTo(300, 80); ctx.lineTo(450, 80); ctx.lineTo(450, 300); ctx.lineTo(580, 200);
    }
    ctx.stroke();

    // Portals
    ctx.fillStyle = '#10b981';
    ctx.beginPath(); ctx.arc(60, 200, 24, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath(); ctx.arc(580, 200, 24, 0, Math.PI * 2); ctx.fill();
  };

  useEffect(() => {
    if (gameState === 'playing' && activeGame === 'maze') {
      drawMaze(mazeLevel);
    }
  }, [gameState, activeGame, mazeLevel]);

  const handleMazeMouseMove = (e) => {
    if (gameState !== 'playing' || activeGame !== 'maze') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ctx = canvas.getContext('2d');

    const distToStart = Math.hypot(x - 60, y - 200);
    if (distToStart < 24) mazeStateRef.current.hasStarted = true;

    if (!mazeStateRef.current.hasStarted) return;

    const distToGoal = Math.hypot(x - 580, y - 200);
    if (distToGoal < 24) {
      playSound(784, 'triangle', 0.2);
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      setScore(prev => prev + 100 * mazeLevel);
      mazeStateRef.current.hasStarted = false;

      if (mazeLevel < 3) {
        const nextLvl = mazeLevel + 1;
        setMazeLevel(nextLvl);
        drawMaze(nextLvl);
      } else {
        finishGame('maze');
      }
      return;
    }

    const pixel = ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data;
    const isPath = (pixel[0] === 56 && pixel[1] === 189 && pixel[2] === 248) ||
                   (pixel[0] === 16 && pixel[1] === 185 && pixel[2] === 129) ||
                   (pixel[0] === 245 && pixel[1] === 158 && pixel[2] === 11);

    if (!isPath && (pixel[0] === 15 && pixel[1] === 23 && pixel[2] === 42)) {
      playSound(120, 'sawtooth', 0.2);
      mazeStateRef.current.hasStarted = false;
      const remLives = mazeLives - 1;
      setMazeLives(remLives);
      if (remLives <= 0) finishGame('maze');
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // 5. WHACK-A-BUG LOGIC
  // ─────────────────────────────────────────────────────────────────────────
  const startWhackGame = () => {
    setGameState('playing');
    setScore(0);
    setTimeLeft(30);
    setCombo(1);
    setMoles(Array(9).fill(null));

    moleTimerRef.current = setInterval(() => {
      const randIdx = Math.floor(Math.random() * 9);
      const bugTypes = ['👾', '🪲', '🤖', '⭐', '🐞'];
      const chosenBug = bugTypes[Math.floor(Math.random() * bugTypes.length)];

      setMoles(prev => {
        const copy = [...prev];
        copy[randIdx] = chosenBug;
        return copy;
      });

      setTimeout(() => {
        setMoles(prev => {
          const copy = [...prev];
          if (copy[randIdx] === chosenBug) copy[randIdx] = null;
          return copy;
        });
      }, 850);
    }, 700);
  };

  const handleWhackMole = (idx) => {
    if (!moles[idx] || gameState !== 'playing') return;
    playSound(600 + combo * 50, 'sine', 0.1);
    setScore(prev => prev + 15 * combo);
    setCombo(prev => Math.min(5, prev + 1));
    setMoles(prev => {
      const copy = [...prev];
      copy[idx] = null;
      return copy;
    });
  };

  // ─────────────────────────────────────────────────────────────────────────
  // 6. SHAPE SNAP PUZZLE LOGIC
  // ─────────────────────────────────────────────────────────────────────────
  const startShapesGame = () => {
    setGameState('playing');
    setScore(0);
    setDraggableShapes(initialShapes);
    setSnappedShapes({});
  };

  const handleShapeDragStart = (e, shape) => {
    setDraggedShape(shape);
    e.dataTransfer.setData('text/plain', shape.id);
  };

  const handleShapeDrop = (e, targetType) => {
    e.preventDefault();
    if (!draggedShape) return;

    if (draggedShape.type === targetType) {
      playSound(659.25, 'sine', 0.15);
      const newSnapped = { ...snappedShapes, [targetType]: draggedShape };
      setSnappedShapes(newSnapped);
      const remaining = draggableShapes.filter(s => s.id !== draggedShape.id);
      setDraggableShapes(remaining);
      setScore(prev => prev + 50);
      setDraggedShape(null);

      if (remaining.length === 0) {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        finishGame('shapes');
      }
    } else {
      playSound(200, 'sawtooth', 0.15);
      setDraggedShape(null);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // FINISH GAME
  // ─────────────────────────────────────────────────────────────────────────
  const finishGame = (gameKey) => {
    setGameState('gameover');
    clearAllTimers();
    confetti({ particleCount: 60, spread: 50, origin: { y: 0.6 } });
  };

  return (
    <div className="space-y-6">
      {/* 9 Action-Packed Game Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-2 p-2 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        {[
          { id: 'pathbuilder', title: '✎ Path Builder', desc: 'Draw Ramps & Bridges' },
          { id: 'canyon', title: '🚀 Flight Architect', desc: 'Bézier Draw & Fly' },
          { id: 'pentool', title: '🖋️ Pen Tool Master', desc: 'Bézier Curves & Tracer' },
          { id: 'spacewaves', title: '🚀 Space Waves', desc: 'Hold/Release Wave 45°' },
          { id: 'archery', title: '🏹 Archery Master', desc: 'Pull & Release Bow' },
          { id: 'balloon', title: '🎈 Balloon Pop', desc: 'Reflex Speed Aim' },
          { id: 'maze', title: '🧀 Laser Maze', desc: 'Steady Hand Run' },
          { id: 'whack', title: '🔨 Whack-A-Bug', desc: 'Quick Grid Tapper' },
          { id: 'shapes', title: '🧩 Shape Snap', desc: 'Drag & Drop Match' },
        ].map((g) => (
          <button
            key={g.id}
            onClick={() => {
              clearAllTimers();
              setActiveGame(g.id);
              setGameState('idle');
            }}
            className={`p-2 rounded-xl text-left transition-all cursor-pointer ${
              activeGame === g.id
                ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-md font-black border border-rose-200 dark:border-rose-800 scale-102'
                : 'text-slate-600 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-800/60 font-semibold'
            }`}
          >
            <p className="text-xs font-bold truncate">{g.title}</p>
            <p className="text-[10px] text-slate-400 truncate mt-0.5">{g.desc}</p>
          </button>
        ))}
      </div>

      {/* SPECIALIZED ADVANCED ARENAS */}
      {activeGame === 'pathbuilder' ? (
        <MagicPathBuilderGame
          user={user}
          onProgressUpdate={onProgressUpdate}
          isMasterFullscreen={isCurrentlyFullscreen}
          toggleMasterFullscreen={handleToggleFullscreen}
        />
      ) : activeGame === 'canyon' ? (
        <CanyonGliderGame
          user={user}
          onProgressUpdate={onProgressUpdate}
          isMasterFullscreen={isCurrentlyFullscreen}
          toggleMasterFullscreen={handleToggleFullscreen}
        />
      ) : activeGame === 'pentool' ? (
        <PenToolMasterGame
          user={user}
          onProgressUpdate={onProgressUpdate}
          isMasterFullscreen={isCurrentlyFullscreen}
          toggleMasterFullscreen={handleToggleFullscreen}
        />
      ) : activeGame === 'spacewaves' ? (
        <SpaceWavesGame
          user={user}
          onProgressUpdate={onProgressUpdate}
          isMasterFullscreen={isCurrentlyFullscreen}
          toggleMasterFullscreen={handleToggleFullscreen}
        />
      ) : (
      <div
        ref={containerRef}
        className={`rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden transition-all duration-200 ${
          isFullscreen ? 'fixed inset-0 z-50 rounded-none border-none p-4 bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 flex flex-col justify-center' : ''
        }`}
      >
        {/* Game HUD Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>
                {activeGame === 'archery' && '🏹 Archery Master: Pull Bow & Shoot Moving Targets'}
                {activeGame === 'balloon' && '🎈 Balloon Pop Frenzy (Speed Reflex)'}
                {activeGame === 'maze' && '🧀 Laser Maze Runner (Steady Hand)'}
                {activeGame === 'whack' && '🔨 Whack-A-Bug Reflex (Grid Tapper)'}
                {activeGame === 'shapes' && '🧩 Shape Snap Geometric Puzzle'}
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {activeGame === 'archery' && 'Hold left-click on the bow, drag back to aim and set power, then release to shoot!'}
              {activeGame === 'balloon' && 'Click moving balloons quickly. Catch gold stars, avoid bombs!'}
              {activeGame === 'maze' && 'Move from Green START to Gold GOAL without hitting laser walls.'}
              {activeGame === 'whack' && 'Tap bugs before they retreat into their burrows.'}
              {activeGame === 'shapes' && 'Drag geometric shapes into their matching silhouette sockets.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {gameState === 'playing' && (
              <>
                {activeGame === 'maze' && (
                  <span className="px-3 py-1 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 text-xs font-black">
                    ❤️ Lives: {mazeLives}
                  </span>
                )}
                {(activeGame === 'archery' || activeGame === 'balloon' || activeGame === 'whack') && (
                  <span className="px-3 py-1 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 text-xs font-black">
                    ⏱️ {timeLeft}s
                  </span>
                )}
                <span className="px-3 py-1 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 text-xs font-black">
                  Score: {score}
                </span>
                {combo > 1 && (
                  <span className="px-2 py-0.5 rounded-lg bg-emerald-500 text-white text-[10px] font-black animate-bounce">
                    {combo}x Combo!
                  </span>
                )}
              </>
            )}

            {/* Corner Full Page Button */}
            <button
              onClick={handleToggleFullscreen}
              title={isCurrentlyFullscreen ? "Exit Fullscreen (Esc)" : "Full Page / Fullscreen"}
              className="p-2 rounded-xl bg-slate-100 hover:bg-purple-600 text-slate-600 hover:text-white dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-purple-600 dark:hover:text-white cursor-pointer transition-all flex items-center gap-1.5"
            >
              {isCurrentlyFullscreen ? <FiMinimize2 size={16} /> : <FiMaximize2 size={16} />}
              <span className="text-xs font-bold hidden sm:inline">{isCurrentlyFullscreen ? 'Exit Full' : 'Full Page'}</span>
            </button>
          </div>
        </div>

        {/* Dynamic Game Arena */}
        <div className={`relative bg-slate-950 overflow-hidden select-none flex flex-col justify-center items-center ${isFullscreen ? 'min-h-[70vh] flex-1' : 'min-h-[440px] max-h-[480px]'}`}>
          {/* IDLE SCREEN */}
          {gameState === 'idle' && (
            <div className="text-center p-8 space-y-4 max-w-sm">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-purple-600 text-white flex items-center justify-center text-3xl shadow-xl shadow-purple-500/30 animate-pulse">
                {activeGame === 'archery' && '🏹'}
                {activeGame === 'balloon' && '🎈'}
                {activeGame === 'maze' && '🧀'}
                {activeGame === 'whack' && '🔨'}
                {activeGame === 'shapes' && '🧩'}
              </div>
              <div>
                <h4 className="text-xl font-black text-white">
                  {activeGame === 'archery' && 'Archery Bow & Arrow Shooter'}
                  {activeGame === 'balloon' && 'Balloon Pop Mania'}
                  {activeGame === 'maze' && 'Laser Maze Runner'}
                  {activeGame === 'whack' && 'Whack-A-Bug Reflex'}
                  {activeGame === 'shapes' && 'Shape Snap Geometric Puzzle'}
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Master your mouse precision and reflex through thrilling action gameplay.
                </p>
              </div>

              <button
                onClick={() => {
                  if (activeGame === 'archery') startArcheryGame();
                  if (activeGame === 'balloon') startBalloonGame();
                  if (activeGame === 'maze') startMazeGame();
                  if (activeGame === 'whack') startWhackGame();
                  if (activeGame === 'shapes') startShapesGame();
                }}
                className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-purple-600/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                Play Game
              </button>
            </div>
          )}

          {/* 1. 🏹 ARCHERY MASTER CANVAS PHYSICS ARENA */}
          {gameState === 'playing' && activeGame === 'archery' && (
            <div className="w-full h-full flex flex-col items-center justify-center relative select-none">
              <canvas
                ref={archeryCanvasRef}
                width={680}
                height={430}
                onMouseDown={handleArcheryMouseDown}
                onMouseMove={handleArcheryMouseMove}
                onMouseUp={handleArcheryMouseUp}
                className="rounded-2xl cursor-crosshair border border-slate-800 shadow-2xl"
              />
              <div className="absolute bottom-2 left-6 pointer-events-none flex items-center gap-2 text-[11px] font-mono text-slate-300 bg-slate-900/80 px-3 py-1 rounded-xl border border-slate-700 backdrop-blur-xs">
                <span>🏹 Click & Drag left-mouse to pull the bowstring • Release to shoot target boards & flying fruits!</span>
              </div>
            </div>
          )}

          {/* 2. BALLOON POP ARENA */}
          {gameState === 'playing' && activeGame === 'balloon' && (
            <div className="absolute inset-0">
              {balloons.map((b) => (
                <div
                  key={b.id}
                  onClick={(e) => handlePopBalloon(e, b)}
                  style={{ left: `${b.x}%`, top: `${b.y}px` }}
                  className={`absolute w-12 h-16 rounded-full ${b.color} text-white font-bold flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 active:scale-90 transition-transform`}
                >
                  {b.type === 'bomb' ? '💣' : b.type === 'gold' ? '⭐' : '🎈'}
                </div>
              ))}
            </div>
          )}

          {/* 4. LASER MAZE ARENA */}
          {gameState === 'playing' && activeGame === 'maze' && (
            <div className="p-4 w-full h-full flex flex-col items-center justify-center">
              <canvas
                ref={canvasRef}
                width={640}
                height={400}
                onMouseMove={handleMazeMouseMove}
                className="rounded-2xl cursor-crosshair border border-slate-800 shadow-2xl"
              />
            </div>
          )}

          {/* 5. WHACK-A-BUG ARENA */}
          {gameState === 'playing' && activeGame === 'whack' && (
            <div className="grid grid-cols-3 gap-6 p-6 max-w-md mx-auto my-auto">
              {moles.map((mole, idx) => (
                <div
                  key={idx}
                  onClick={() => handleWhackMole(idx)}
                  className="w-24 h-24 rounded-3xl bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-4xl cursor-pointer hover:border-purple-500 shadow-lg active:scale-90 transition-all select-none"
                >
                  {mole && <span className="animate-in zoom-in-75 duration-100">{mole}</span>}
                </div>
              ))}
            </div>
          )}

          {/* 6. SHAPE SNAP ARENA */}
          {gameState === 'playing' && activeGame === 'shapes' && (
            <div className="w-full h-full p-6 flex flex-col justify-between">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex justify-center gap-4">
                {draggableShapes.map((shape) => (
                  <div
                    key={shape.id}
                    draggable
                    onDragStart={(e) => handleShapeDragStart(e, shape)}
                    className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex flex-col items-center justify-center text-2xl cursor-grab active:cursor-grabbing hover:scale-110 transition-transform shadow-md"
                  >
                    <span>{shape.icon}</span>
                  </div>
                ))}
                {draggableShapes.length === 0 && (
                  <p className="text-xs text-emerald-400 font-bold self-center">
                    All shapes snapped perfectly! 🎉
                  </p>
                )}
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 my-auto">
                {initialShapes.map((shape) => {
                  const isSnapped = !!snappedShapes[shape.type];
                  return (
                    <div
                      key={shape.type}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleShapeDrop(e, shape.type)}
                      className={`h-24 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-all ${
                        isSnapped
                          ? 'bg-emerald-950/40 border-emerald-500 text-white'
                          : 'bg-slate-900/60 border-slate-700 text-slate-500'
                      }`}
                    >
                      <span className="text-2xl">{isSnapped ? shape.icon : '❔'}</span>
                      <span className="text-[10px] font-bold uppercase">{shape.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* GAME OVER SCREEN */}
          {gameState === 'gameover' && (
            <div className="text-center p-8 space-y-4 max-w-sm animate-in zoom-in-95">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-500 text-white flex items-center justify-center text-3xl shadow-xl shadow-emerald-500/20">
                🏆
              </div>

              <div>
                <h4 className="text-2xl font-black text-white">
                  Game Over!
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  You scored <strong className="text-emerald-400 text-base">{score} points</strong>!
                </p>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  onClick={() => {
                    if (activeGame === 'archery') startArcheryGame();
                    if (activeGame === 'balloon') startBalloonGame();
                    if (activeGame === 'maze') startMazeGame();
                    if (activeGame === 'whack') startWhackGame();
                    if (activeGame === 'shapes') startShapesGame();
                  }}
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-xl shadow-md cursor-pointer transition-all"
                >
                  Play Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
};

export default MouseArcadeGames;
