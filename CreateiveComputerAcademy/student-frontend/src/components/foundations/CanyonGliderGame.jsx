import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import {
  FiPlay, FiRefreshCw, FiZap, FiAward, FiShield,
  FiVolume2, FiVolumeX, FiChevronRight, FiSliders,
  FiCompass, FiTrendingUp, FiEdit3, FiRotateCcw, FiEye,
  FiCheckCircle, FiArrowRight, FiMaximize2, FiMinimize2
} from 'react-icons/fi';
import { HiSparkles, HiBolt, HiOutlineCursorArrowRays } from 'react-icons/hi2';

// Web Audio Synthesizer for Canyon Glider & Path Architect
const createGliderAudio = () => {
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
    playDropNode: (soundOn = true) => {
      if (!soundOn) return;
      try {
        const audioCtx = getContext();
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
      } catch (e) {}
    },
    playHandlePull: (dist, soundOn = true) => {
      if (!soundOn) return;
      try {
        const audioCtx = getContext();
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        const freq = Math.min(800, Math.max(300, 320 + dist * 2.5));
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.04);
      } catch (e) {}
    },
    playRingCollect: (soundOn = true) => {
      if (!soundOn) return;
      try {
        const audioCtx = getContext();
        if (!audioCtx) return;
        const now = audioCtx.currentTime;
        [587.33, 880, 1174.66].forEach((freq, idx) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.05);
          gain.gain.setValueAtTime(0.08, now + idx * 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.12);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(now + idx * 0.05);
          osc.stop(now + idx * 0.05 + 0.12);
        });
      } catch (e) {}
    },
    playJetThrust: (soundOn = true) => {
      if (!soundOn) return;
      try {
        const audioCtx = getContext();
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(320, audioCtx.currentTime + 0.6);
        gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.6);
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
        osc.frequency.setValueAtTime(160, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      } catch (e) {}
    },
    playVictory: (soundOn = true) => {
      if (!soundOn) return;
      try {
        const audioCtx = getContext();
        if (!audioCtx) return;
        const now = audioCtx.currentTime;
        [440, 554.37, 659.25, 880, 1108.7].forEach((freq, idx) => {
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

const audio = createGliderAudio();

// ── BÉZIER CANYON ARCHITECT STAGES (DRAW & FLY) ───────────────────────────────
const ARCHITECT_STAGES = [
  {
    id: 1,
    name: 'Stage 1: Emerald S-Curve Valley',
    subTitle: 'Place 3-4 points & drag handles to curve smoothly through rings',
    instruction: 'Click & Drag from START (1) through the valley gap to GOAL (Finish).',
    tip: 'Click and drag mouse to pull Bézier handles that curve the jet flight path.',
    start: { x: 70, y: 140 },
    end: { x: 650, y: 280 },
    skyColors: ['#042f2e', '#0f766e', '#134e4a'],
    rockColor: '#064e3b',
    rockBorder: '#10b981',
    rocks: [
      // Top Mountain Cliffs
      { type: 'poly', pts: [[0, 0], [240, 0], [240, 80], [140, 100], [0, 60]] },
      { type: 'poly', pts: [[320, 0], [540, 0], [480, 150], [380, 160], [320, 90]] },
      { type: 'poly', pts: [[540, 0], [720, 0], [720, 180], [600, 120]] },
      // Bottom Mountain Ridges
      { type: 'poly', pts: [[0, 400], [280, 400], [220, 260], [100, 240], [0, 320]] },
      { type: 'poly', pts: [[360, 400], [620, 400], [520, 320], [420, 340]] }
    ],
    rings: [
      { id: 'r1', x: 200, y: 170, size: 18, collected: false },
      { id: 'r2', x: 380, y: 260, size: 18, collected: false },
      { id: 'r3', x: 540, y: 200, size: 18, collected: false }
    ],
    defaultNodes: [
      { x: 70, y: 140, handleOut: { x: 130, y: 140 } },
      { x: 650, y: 280, handleIn: { x: 580, y: 280 } }
    ]
  },
  {
    id: 2,
    name: 'Stage 2: Crystal Loop-de-Loop Cavern',
    subTitle: 'Curve in a round circular 360° arc around the glowing crystal pillar',
    instruction: 'Create a smooth circular loop curve around the center crystal pillar.',
    tip: 'Dragging handles far out allows creating full 360° loop-de-loop arcs.',
    start: { x: 70, y: 220 },
    end: { x: 650, y: 220 },
    skyColors: ['#1e1035', '#4c1d95', '#2e1065'],
    rockColor: '#2e1065',
    rockBorder: '#c084fc',
    rocks: [
      // Top Ceiling
      { type: 'poly', pts: [[0, 0], [720, 0], [720, 70], [500, 90], [220, 70], [0, 80]] },
      // Bottom Cavern Floor
      { type: 'poly', pts: [[0, 400], [720, 400], [720, 330], [480, 340], [240, 330], [0, 340]] },
      // Center Floating Crystal Pillar (To loop around)
      { type: 'poly', pts: [[330, 160], [390, 160], [410, 250], [350, 280], [310, 230]] }
    ],
    rings: [
      { id: 'r1', x: 230, y: 220, size: 18, collected: false },
      { id: 'r2', x: 360, y: 110, size: 18, collected: false },
      { id: 'r3', x: 490, y: 220, size: 18, collected: false },
      { id: 'r4', x: 360, y: 320, size: 18, collected: false }
    ],
    defaultNodes: [
      { x: 70, y: 220, handleOut: { x: 150, y: 220 } },
      { x: 650, y: 220, handleIn: { x: 570, y: 220 } }
    ]
  },
  {
    id: 3,
    name: 'Stage 3: Volcanic Zig-Zag Gorge',
    subTitle: 'Navigate steep mountain drops, sharp rises, and tight lava channels',
    instruction: 'Create high-altitude dives and rapid climbs through the fiery canyon.',
    tip: 'Multiple anchor points allow you to bend curves around tight mountain corners.',
    start: { x: 70, y: 80 },
    end: { x: 650, y: 120 },
    skyColors: ['#2a0a05', '#7c2d12', '#451a03'],
    rockColor: '#451a03',
    rockBorder: '#f97316',
    rocks: [
      // Top jagged rocks
      { type: 'poly', pts: [[0, 0], [720, 0], [720, 50], [520, 180], [420, 50], [280, 160], [160, 40], [0, 50]] },
      // Bottom lava teeth
      { type: 'poly', pts: [[0, 400], [720, 400], [720, 280], [580, 360], [460, 220], [340, 370], [200, 230], [0, 350]] }
    ],
    rings: [
      { id: 'r1', x: 180, y: 150, size: 18, collected: false },
      { id: 'r2', x: 320, y: 290, size: 18, collected: false },
      { id: 'r3', x: 440, y: 130, size: 18, collected: false },
      { id: 'r4', x: 560, y: 280, size: 18, collected: false }
    ],
    defaultNodes: [
      { x: 70, y: 80, handleOut: { x: 130, y: 80 } },
      { x: 650, y: 120, handleIn: { x: 590, y: 120 } }
    ]
  }
];

const CanyonGliderGame = ({ user, onProgressUpdate, isMasterFullscreen, toggleMasterFullscreen }) => {
  const [activeStageIdx, setActiveStageIdx] = useState(0);
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

  // Pen Tool Flight Builder State
  const [nodes, setNodes] = useState([]);
  const [selectedNodeIdx, setSelectedNodeIdx] = useState(null);
  const [isDraggingNode, setIsDraggingNode] = useState(false);
  const [isDraggingHandleOut, setIsDraggingHandleOut] = useState(false);
  const [isDraggingHandleIn, setIsDraggingHandleIn] = useState(false);

  // Flight Simulation State
  const [isFlying, setIsFlying] = useState(false);
  const [flightT, setFlightT] = useState(0); // 0 to 1 along curve
  const [flightScore, setFlightScore] = useState(0);
  const [collectedRingsMap, setCollectedRingsMap] = useState({});
  const [flightStatus, setFlightStatus] = useState('idle'); // 'idle' | 'flying' | 'crashed' | 'completed'
  const [crashPos, setCrashPos] = useState(null);

  const currStage = ARCHITECT_STAGES[activeStageIdx];

  // Initialize Stage
  useEffect(() => {
    setNodes(JSON.parse(JSON.stringify(currStage.defaultNodes)));
    setFlightStatus('idle');
    setFlightT(0);
    setFlightScore(0);
    setCollectedRingsMap({});
    setSelectedNodeIdx(null);
  }, [activeStageIdx, currStage]);

  // Point in Polygon collision tester
  const isPointInPoly = (pt, polyPts) => {
    let inside = false;
    for (let i = 0, j = polyPts.length - 1; i < polyPts.length; j = i++) {
      const xi = polyPts[i][0], yi = polyPts[i][1];
      const xj = polyPts[j][0], yj = polyPts[j][1];
      const intersect = ((yi > pt.y) !== (yj > pt.y)) &&
        (pt.x < (xj - xi) * (pt.y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  };

  // Evaluate Cubic Bézier Spline at global t (0 to 1)
  const getSplinePoint = useCallback((tVal, nodeList) => {
    if (!nodeList || nodeList.length < 2) return { x: 0, y: 0, angle: 0 };
    const numSegments = nodeList.length - 1;
    const clampedT = Math.max(0, Math.min(0.9999, tVal));
    const segmentIdx = Math.floor(clampedT * numSegments);
    const localT = (clampedT * numSegments) - segmentIdx;

    const p0 = nodeList[segmentIdx];
    const p3 = nodeList[segmentIdx + 1];
    const p1 = p0.handleOut || p0;
    const p2 = p3.handleIn || p3;

    // Cubic Bézier formula
    const mt = 1 - localT;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;
    const t2 = localT * localT;
    const t3 = t2 * localT;

    const x = mt3 * p0.x + 3 * mt2 * localT * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x;
    const y = mt3 * p0.y + 3 * mt2 * localT * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y;

    // Derivative for tangent / banking angle
    const dx = 3 * mt2 * (p1.x - p0.x) + 6 * mt * localT * (p2.x - p1.x) + 3 * t2 * (p3.x - p2.x);
    const dy = 3 * mt2 * (p1.y - p0.y) + 6 * mt * localT * (p2.y - p1.y) + 3 * t2 * (p3.y - p2.y);
    const angle = Math.atan2(dy, dx);

    return { x, y, angle };
  }, []);

  // ── RENDER CANVAS ─────────────────────────────────────────────────────────
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const stage = ARCHITECT_STAGES[activeStageIdx];

    // Sky Backdrop
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, stage.skyColors[0]);
    grad.addColorStop(0.5, stage.skyColors[1]);
    grad.addColorStop(1, stage.skyColors[2]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Subtle Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 1. Draw Mountain Rocks & Cliffs
    stage.rocks.forEach(rock => {
      ctx.fillStyle = stage.rockColor;
      ctx.strokeStyle = stage.rockBorder;
      ctx.lineWidth = 3;
      ctx.shadowColor = stage.rockBorder;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      rock.pts.forEach((p, idx) => {
        if (idx === 0) ctx.moveTo(p[0], p[1]);
        else ctx.lineTo(p[0], p[1]);
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
    });

    // 2. Draw Golden Energy Rings
    stage.rings.forEach(ring => {
      const isCollected = !!collectedRingsMap[ring.id];
      ctx.strokeStyle = isCollected ? '#10b981' : '#fde047';
      ctx.lineWidth = 3.5;
      ctx.shadowColor = isCollected ? '#10b981' : '#eab308';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, ring.size, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = isCollected ? 'rgba(16, 185, 129, 0.25)' : 'rgba(253, 224, 71, 0.25)';
      ctx.fill();
      ctx.shadowBlur = 0;

      if (isCollected) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('✓', ring.x, ring.y + 4);
      }
    });

    // 3. Draw Start & Goal Markers
    // Start (Green)
    ctx.fillStyle = '#10b981';
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(stage.start.x, stage.start.y, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'black 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('START', stage.start.x, stage.start.y + 3);
    ctx.shadowBlur = 0;

    // Finish (Gold)
    ctx.fillStyle = '#f59e0b';
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(stage.end.x, stage.end.y, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText('GOAL', stage.end.x, stage.end.y + 3);
    ctx.shadowBlur = 0;

    // 4. Draw Bézier Flight Path (User Plotted Spline)
    if (nodes.length > 1) {
      // Glow background path
      ctx.strokeStyle = '#06b6d4'; // Bright Cyan
      ctx.lineWidth = 4;
      ctx.shadowColor = '#0891b2';
      ctx.shadowBlur = 12;
      ctx.beginPath();

      const samples = 120;
      for (let i = 0; i <= samples; i++) {
        const pt = getSplinePoint(i / samples, nodes);
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();

      // White laser core line
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // 5. Draw Bézier Control Handles & Nodes (When in Builder mode)
    if (flightStatus !== 'flying') {
      nodes.forEach((node, idx) => {
        const isSelected = selectedNodeIdx === idx;

        // Draw Handle Out (Red)
        if (node.handleOut) {
          ctx.strokeStyle = '#f43f5e';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(node.handleOut.x, node.handleOut.y);
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = '#f43f5e';
          ctx.beginPath();
          ctx.arc(node.handleOut.x, node.handleOut.y, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }

        // Draw Handle In (Green)
        if (node.handleIn) {
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(node.handleIn.x, node.handleIn.y);
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = '#10b981';
          ctx.beginPath();
          ctx.arc(node.handleIn.x, node.handleIn.y, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }

        // Draw Anchor Point
        ctx.fillStyle = isSelected ? '#a855f7' : '#38bdf8';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = isSelected ? '#a855f7' : '#0284c7';
        ctx.shadowBlur = isSelected ? 12 : 6;
        ctx.fillRect(node.x - 7, node.y - 7, 14, 14);
        ctx.strokeRect(node.x - 7, node.y - 7, 14, 14);
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText(`${idx + 1}`, node.x, node.y - 12);
      });
    }

    // 6. Draw Jet Flying Along Path
    if (flightStatus === 'flying') {
      const jetPos = getSplinePoint(flightT, nodes);

      ctx.save();
      ctx.translate(jetPos.x, jetPos.y);
      ctx.rotate(jetPos.angle);

      // Jet Shape
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 14;

      ctx.beginPath();
      ctx.moveTo(20, 0); // Tip
      ctx.lineTo(-14, -10);
      ctx.lineTo(-6, 0);
      ctx.lineTo(-14, 10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Thruster Flame
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(-6, -4);
      ctx.lineTo(-26 - Math.random() * 8, 0);
      ctx.lineTo(-6, 4);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }

    // Draw Crash Explosion marker
    if (flightStatus === 'crashed' && crashPos) {
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(crashPos.x, crashPos.y, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'black 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('💥', crashPos.x, crashPos.y + 6);
      ctx.shadowBlur = 0;
    }
  }, [activeStageIdx, nodes, selectedNodeIdx, flightStatus, flightT, collectedRingsMap, crashPos, getSplinePoint]);

  // ── FLIGHT SIMULATION LOOP ────────────────────────────────────────────────
  useEffect(() => {
    if (flightStatus !== 'flying') return;

    const interval = setInterval(() => {
      setFlightT(prev => {
        const next = prev + 0.007; // Smooth flight speed
        const jetPt = getSplinePoint(next, nodes);
        const stage = ARCHITECT_STAGES[activeStageIdx];

        // 1. Check Ring Collection
        stage.rings.forEach(ring => {
          if (!collectedRingsMap[ring.id] && Math.hypot(jetPt.x - ring.x, jetPt.y - ring.y) < ring.size + 14) {
            setCollectedRingsMap(old => ({ ...old, [ring.id]: true }));
            setFlightScore(s => s + 100);
            audio.playRingCollect(soundEnabled);
          }
        });

        // 2. Check Collision with Mountain Rocks
        for (const rock of stage.rocks) {
          if (isPointInPoly(jetPt, rock.pts)) {
            // CRASH!
            setFlightStatus('crashed');
            setCrashPos(jetPt);
            audio.playCrash(soundEnabled);
            toast.error('💥 Mountain Collision! Adjust your Bézier handles to fly around the rocks.');
            clearInterval(interval);
            return next;
          }
        }

        // 3. Check Finish Line Victory
        if (next >= 1.0) {
          setFlightStatus('completed');
          audio.playVictory(soundEnabled);
          confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
          toast.success(`🎉 Flawless Mountain Vector Flight! Completed ${stage.name}!`);
          clearInterval(interval);
          return 1.0;
        }

        return next;
      });
    }, 16);

    return () => clearInterval(interval);
  }, [flightStatus, nodes, activeStageIdx, collectedRingsMap, getSplinePoint, soundEnabled]);

  // Redraw Canvas on any state update
  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // ── MOUSE INTERACTION (ADDING & BENDING BÉZIER CURVES) ─────────────────────
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
    if (flightStatus === 'flying') return;
    const { x, y } = getCanvasCoords(e);

    // 1. Check if clicking an existing handle tip
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (node.handleOut && Math.hypot(x - node.handleOut.x, y - node.handleOut.y) < 14) {
        setSelectedNodeIdx(i);
        setIsDraggingHandleOut(true);
        return;
      }
      if (node.handleIn && Math.hypot(x - node.handleIn.x, y - node.handleIn.y) < 14) {
        setSelectedNodeIdx(i);
        setIsDraggingHandleIn(true);
        return;
      }
    }

    // 2. Check if clicking an existing anchor point
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (Math.hypot(x - node.x, y - node.y) < 16) {
        setSelectedNodeIdx(i);
        setIsDraggingNode(true);
        return;
      }
    }

    // 3. Insert a new anchor point along the path
    audio.playDropNode(soundEnabled);
    const newNode = {
      x,
      y,
      handleOut: { x: x + 40, y },
      handleIn: { x: x - 40, y }
    };

    // Insert before the last node (Goal)
    const nextNodes = [...nodes];
    nextNodes.splice(nodes.length - 1, 0, newNode);
    setNodes(nextNodes);
    setSelectedNodeIdx(nextNodes.length - 2);
    setIsDraggingHandleOut(true);
  };

  const handleMouseMove = (e) => {
    if (flightStatus === 'flying') return;
    const { x, y } = getCanvasCoords(e);

    if (isDraggingNode && selectedNodeIdx !== null) {
      const nextNodes = [...nodes];
      const node = nextNodes[selectedNodeIdx];
      const dx = x - node.x;
      const dy = y - node.y;

      node.x = x;
      node.y = y;
      if (node.handleOut) {
        node.handleOut.x += dx;
        node.handleOut.y += dy;
      }
      if (node.handleIn) {
        node.handleIn.x += dx;
        node.handleIn.y += dy;
      }
      setNodes(nextNodes);
    } else if (isDraggingHandleOut && selectedNodeIdx !== null) {
      const nextNodes = [...nodes];
      const node = nextNodes[selectedNodeIdx];
      node.handleOut = { x, y };
      // Symmetrical opposing Handle In
      node.handleIn = {
        x: node.x - (x - node.x),
        y: node.y - (y - node.y)
      };
      setNodes(nextNodes);
      const dist = Math.hypot(x - node.x, y - node.y);
      audio.playHandlePull(dist, soundEnabled);
    } else if (isDraggingHandleIn && selectedNodeIdx !== null) {
      const nextNodes = [...nodes];
      const node = nextNodes[selectedNodeIdx];
      node.handleIn = { x, y };
      node.handleOut = {
        x: node.x - (x - node.x),
        y: node.y - (y - node.y)
      };
      setNodes(nextNodes);
      const dist = Math.hypot(x - node.x, y - node.y);
      audio.playHandlePull(dist, soundEnabled);
    }
  };

  const handleMouseUp = () => {
    setIsDraggingNode(false);
    setIsDraggingHandleOut(false);
    setIsDraggingHandleIn(false);
  };

  // Launch Jet Flight
  const launchFlight = () => {
    setFlightStatus('flying');
    setFlightT(0);
    setFlightScore(0);
    setCollectedRingsMap({});
    setCrashPos(null);
    audio.playJetThrust(soundEnabled);
    toast.info('🚀 Launching Jet along your Bézier flight curve!');
  };

  // Reset Curve
  const resetCurve = () => {
    setNodes(JSON.parse(JSON.stringify(currStage.defaultNodes)));
    setFlightStatus('idle');
    setFlightT(0);
    setFlightScore(0);
    setCollectedRingsMap({});
    setCrashPos(null);
  };

  // Delete Selected Node
  const deleteSelectedNode = () => {
    if (selectedNodeIdx === null || nodes.length <= 2) return;
    if (selectedNodeIdx === 0 || selectedNodeIdx === nodes.length - 1) {
      toast.error('Cannot remove START or GOAL points.');
      return;
    }
    const next = nodes.filter((_, idx) => idx !== selectedNodeIdx);
    setNodes(next);
    setSelectedNodeIdx(null);
    toast.info('Point deleted');
  };

  return (
    <div
      ref={containerRef}
      className={`select-none transition-all duration-200 ${
        isFullscreen
          ? 'fixed inset-0 z-50 bg-[#06120e] p-3 sm:p-6 flex flex-col justify-center items-center overflow-y-auto w-screen h-screen'
          : 'space-y-4'
      }`}
    >
      {/* Top Header & Stage Selector */}
      <div className={`flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800 backdrop-blur-md ${isFullscreen ? 'w-full max-w-6xl' : ''}`}>
        {/* Stage Selector */}
        <div className="flex flex-wrap items-center gap-2">
          {ARCHITECT_STAGES.map((stg, idx) => {
            const isSel = activeStageIdx === idx;
            return (
              <button
                key={stg.id}
                onClick={() => setActiveStageIdx(idx)}
                className={`px-3.5 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSel
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-600/30 scale-102'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                <span>🏔️ {stg.name.split(':')[0]}</span>
              </button>
            );
          })}
        </div>

        {/* Live Flight Stats & Controls */}
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-black">
            ⭐ {flightScore} Pts ({Object.keys(collectedRingsMap).length}/{currStage.rings.length} ⭕)
          </span>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
          >
            {soundEnabled ? <FiVolume2 size={16} /> : <FiVolumeX size={16} />}
          </button>

          <button
            onClick={handleToggleFullscreen}
            title={isCurrentlyFullscreen ? "Exit Fullscreen (Esc)" : "Full Page / Fullscreen"}
            className="p-2 rounded-xl bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white cursor-pointer transition-all flex items-center gap-1.5"
          >
            {isCurrentlyFullscreen ? <FiMinimize2 size={16} /> : <FiMaximize2 size={16} />}
          </button>
        </div>
      </div>

      {/* Main Interactive Stage Canvas Container */}
      <div className={`relative rounded-3xl overflow-hidden border border-emerald-900/40 shadow-2xl bg-slate-950 ${isCurrentlyFullscreen ? 'w-full max-w-6xl my-auto' : ''}`}>
        {/* Action Header Strip */}
        <div className="p-3 bg-slate-900/80 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 px-5">
          <div>
            <h4 className="text-sm font-black text-white flex items-center gap-2">
              <span>🖋️ {currStage.name}</span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              {currStage.subTitle}
            </p>
          </div>

          {/* Controls: Launch / Add Point / Reset */}
          <div className="flex items-center gap-2">
            {selectedNodeIdx !== null && selectedNodeIdx > 0 && selectedNodeIdx < nodes.length - 1 && (
              <button
                onClick={deleteSelectedNode}
                className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60 rounded-xl text-xs font-bold cursor-pointer transition-all"
              >
                Delete Point
              </button>
            )}

            <button
              onClick={resetCurve}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <FiRefreshCw size={13} />
              <span>Reset Path</span>
            </button>

            {/* Corner Full Page Button */}
            <button
              onClick={handleToggleFullscreen}
              title={isCurrentlyFullscreen ? "Exit Fullscreen (Esc)" : "Full Page / Fullscreen"}
              className="px-3 py-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600 text-emerald-200 hover:text-white border border-emerald-500/30 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
            >
              {isCurrentlyFullscreen ? <FiMinimize2 size={13} /> : <FiMaximize2 size={13} />}
              <span>{isCurrentlyFullscreen ? 'Exit Full' : 'Full Page'}</span>
            </button>

            <button
              onClick={launchFlight}
              disabled={flightStatus === 'flying'}
              className="px-5 py-1.5 bg-gradient-to-r from-emerald-600 to-cyan-500 hover:from-emerald-500 hover:to-cyan-400 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/30 flex items-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95 uppercase tracking-wide disabled:opacity-50"
            >
              <FiPlay size={14} className="fill-current" />
              <span>Launch Jet 🚀</span>
            </button>
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
          className={`w-full block ${isFullscreen ? 'h-[520px]' : 'h-[400px]'} ${flightStatus === 'flying' ? 'cursor-default' : 'cursor-crosshair'}`}
        />

        {/* CRASHED MODAL OVERLAY */}
        {flightStatus === 'crashed' && (
          <div className="absolute bottom-16 inset-x-0 flex justify-center pointer-events-none animate-in zoom-in-95">
            <div className="px-6 py-3.5 rounded-2xl bg-slate-900/95 border border-rose-500/50 shadow-2xl backdrop-blur-md flex items-center gap-4 pointer-events-auto">
              <div className="text-left">
                <p className="text-xs font-bold text-rose-400">Mountain Collision!</p>
                <p className="text-sm font-black text-white">Drag handles to curve away from rocks</p>
              </div>

              <button
                onClick={launchFlight}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow-lg cursor-pointer uppercase flex items-center gap-1.5"
              >
                <FiRefreshCw size={13} />
                <span>Retry Flight</span>
              </button>
            </div>
          </div>
        )}

        {/* VICTORY 100% MODAL OVERLAY */}
        {flightStatus === 'completed' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center z-30 p-6 text-center space-y-4 animate-in zoom-in-95">
            <div className="w-20 h-20 rounded-3xl bg-amber-400 text-slate-950 flex items-center justify-center text-4xl shadow-2xl shadow-amber-400/40 animate-bounce">
              🏆
            </div>

            <div className="space-y-1">
              <h3 className="text-3xl font-black text-emerald-400 tracking-wider uppercase">
                FLAWLESS VECTOR FLIGHT!
              </h3>
              <p className="text-sm font-bold text-slate-300">
                You designed the perfect Bézier flight path through <span className="text-emerald-400 font-black">{currStage.name}</span>!
              </p>
              <p className="text-xs text-amber-300 font-bold mt-1">
                Score: {flightScore} Pts • All Rings Cleared!
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={launchFlight}
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-black text-xs rounded-xl cursor-pointer"
              >
                Replay Flight
              </button>
              {activeStageIdx < ARCHITECT_STAGES.length - 1 && (
                <button
                  onClick={() => setActiveStageIdx(prev => prev + 1)}
                  className="px-8 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-black text-xs rounded-xl shadow-lg cursor-pointer uppercase flex items-center gap-1.5"
                >
                  <span>Next Stage {activeStageIdx + 2}</span>
                  <FiChevronRight size={16} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Footer Guidance */}
        <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 px-5">
          <span>
            💡 Click anywhere to drop a new Point • Drag point/handle to curve, round & loop • Then click Launch Jet 🚀
          </span>
          <span className="text-emerald-400 font-bold">
            Bézier Vector Flight Simulator
          </span>
        </div>
      </div>
    </div>
  );
};

export default CanyonGliderGame;
