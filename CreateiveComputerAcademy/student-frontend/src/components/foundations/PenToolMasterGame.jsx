import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import {
  FiEdit3, FiRefreshCw, FiRotateCcw, FiCheck, FiZap,
  FiAward, FiSliders, FiHelpCircle, FiChevronRight,
  FiLayers, FiEye, FiVolume2, FiVolumeX, FiTarget,
  FiMaximize2, FiMinimize2, FiPenTool
} from 'react-icons/fi';
import { HiSparkles, HiOutlineCursorArrowRays } from 'react-icons/hi2';

// Web Audio Synthesizer for Pen Tool
const createPenAudio = () => {
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
    playDropPoint: (soundOn = true) => {
      if (!soundOn) return;
      try {
        const audioCtx = getContext();
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
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
        const freq = Math.min(880, Math.max(300, 350 + dist * 3));
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.03, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.05);
      } catch (e) {}
    },
    playCompleteSegment: (soundOn = true) => {
      if (!soundOn) return;
      try {
        const audioCtx = getContext();
        if (!audioCtx) return;
        const now = audioCtx.currentTime;
        [523.25, 659.25, 783.99].forEach((freq, idx) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);
          gain.gain.setValueAtTime(0.1, now + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.15);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.15);
        });
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
          osc.frequency.setValueAtTime(freq, now + idx * 0.1);
          gain.gain.setValueAtTime(0.15, now + idx * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.3);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(now + idx * 0.1);
          osc.stop(now + idx * 0.1 + 0.3);
        });
      } catch (e) {}
    },
    playWireBuzz: (soundOn = true) => {
      if (!soundOn) return;
      try {
        const audioCtx = getContext();
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
      } catch (e) {}
    }
  };
};

const audio = createPenAudio();

// ── BÉZIER PEN TOOL MISSIONS (ILLUSTRATOR SIMULATOR) ──────────────────────────
const BEZIER_MISSIONS = [
  {
    id: 1,
    title: 'Straight Vector Segments',
    difficulty: 'Beginner',
    desc: 'Click on points in order to form clean straight polygon vectors.',
    instruction: 'Click on node (1), then click on (2), (3), and (4) to close the path.',
    tip: 'In Photoshop & Illustrator, a single click creates sharp corner nodes.',
    points: [
      { x: 140, y: 280, label: '1', handleIn: null, handleOut: null },
      { x: 280, y: 100, label: '2', handleIn: null, handleOut: null },
      { x: 440, y: 100, label: '3', handleIn: null, handleOut: null },
      { x: 580, y: 280, label: '4', handleIn: null, handleOut: null },
    ],
    closed: false
  },
  {
    id: 2,
    title: 'Smooth Sine Wave Curve',
    difficulty: 'Beginner',
    desc: 'Click and drag to pull tangent handles and shape smooth undulating curves.',
    instruction: 'Click & Drag (1) upwards, then Click & Drag (2) downwards, and finally (3).',
    tip: 'Dragging pulls Bézier handles that define curve smoothness and direction.',
    points: [
      { x: 120, y: 220, label: '1', handleOut: { x: 120, y: 130 } },
      { x: 360, y: 220, label: '2', handleIn: { x: 260, y: 310 }, handleOut: { x: 460, y: 130 } },
      { x: 600, y: 220, label: '3', handleIn: { x: 600, y: 310 } },
    ],
    closed: false
  },
  {
    id: 3,
    title: 'Water Droplet / Teardrop',
    difficulty: 'Intermediate',
    desc: 'Combine sharp corner anchor points with smooth bottom curves.',
    instruction: 'Start from top sharp node (1), curve through (2) & (3), and close back to (1).',
    tip: 'Corner points with handles allow creating teardrops and icon curves.',
    points: [
      { x: 360, y: 90, label: '1', handleOut: { x: 440, y: 170 } },
      { x: 460, y: 260, label: '2', handleIn: { x: 460, y: 210 }, handleOut: { x: 460, y: 330 } },
      { x: 360, y: 330, label: '3', handleIn: { x: 410, y: 330 }, handleOut: { x: 310, y: 330 } },
      { x: 260, y: 260, label: '4', handleIn: { x: 260, y: 330 }, handleOut: { x: 260, y: 210 } },
      { x: 360, y: 90, label: '1', handleIn: { x: 280, y: 170 } }
    ],
    closed: true
  },
  {
    id: 4,
    title: 'Vector Heart Shape',
    difficulty: 'Intermediate',
    desc: 'Master symmetric dual-lobe Bézier geometry.',
    instruction: 'Trace the heart lobes by dragging handles at 45-degree tangents.',
    tip: 'Hold Shift in Photoshop to lock Bézier handles to perfect 45° angles.',
    points: [
      { x: 360, y: 160, label: '1', handleOut: { x: 420, y: 90 } },
      { x: 480, y: 130, label: '2', handleIn: { x: 460, y: 80 }, handleOut: { x: 500, y: 190 } },
      { x: 360, y: 330, label: '3', handleIn: { x: 420, y: 270 }, handleOut: { x: 300, y: 270 } },
      { x: 240, y: 130, label: '4', handleIn: { x: 220, y: 190 }, handleOut: { x: 260, y: 80 } },
      { x: 360, y: 160, label: '1', handleIn: { x: 300, y: 90 } }
    ],
    closed: true
  },
  {
    id: 5,
    title: 'Apple Logo Silhouette',
    difficulty: 'Advanced',
    desc: 'Vectorize real brand curves and silhouettes with multiple anchor points.',
    instruction: 'Trace the iconic Apple logo shape with organic Bézier handles.',
    tip: 'Professional vector logos rely on minimal anchor points with precise handles.',
    points: [
      { x: 360, y: 130, label: '1', handleOut: { x: 400, y: 110 } },
      { x: 460, y: 150, label: '2', handleIn: { x: 430, y: 110 }, handleOut: { x: 490, y: 190 } },
      { x: 470, y: 240, label: '3', handleIn: { x: 490, y: 200 }, handleOut: { x: 450, y: 280 } },
      { x: 420, y: 330, label: '4', handleIn: { x: 450, y: 310 }, handleOut: { x: 390, y: 350 } },
      { x: 360, y: 330, label: '5', handleIn: { x: 380, y: 340 }, handleOut: { x: 340, y: 340 } },
      { x: 300, y: 330, label: '6', handleIn: { x: 330, y: 350 }, handleOut: { x: 270, y: 310 } },
      { x: 250, y: 240, label: '7', handleIn: { x: 270, y: 280 }, handleOut: { x: 230, y: 200 } },
      { x: 260, y: 150, label: '8', handleIn: { x: 230, y: 190 }, handleOut: { x: 290, y: 110 } },
      { x: 360, y: 130, label: '1', handleIn: { x: 320, y: 110 } }
    ],
    closed: true
  },
  {
    id: 6,
    title: '5-Point Star',
    difficulty: 'Advanced',
    desc: 'Ten sharp corner anchors with no handles — pure click precision under pressure.',
    instruction: 'Click each of the 10 star points in order, outer and inner tips alternating, and close back to (1).',
    tip: 'No handles here — accuracy comes entirely from exact anchor placement, not curve shaping.',
    points: [
      { x: 360, y: 60, label: '1' },
      { x: 395, y: 161, label: '2' },
      { x: 503, y: 164, label: '3' },
      { x: 417, y: 229, label: '4' },
      { x: 448, y: 331, label: '5' },
      { x: 360, y: 270, label: '6' },
      { x: 272, y: 331, label: '7' },
      { x: 303, y: 229, label: '8' },
      { x: 217, y: 164, label: '9' },
      { x: 325, y: 161, label: '10' },
      { x: 360, y: 60, label: '1' }
    ],
    closed: true
  },
  {
    id: 7,
    title: 'S-Curve Ribbon',
    difficulty: 'Expert',
    desc: 'A flowing ribbon with broken (non-mirrored) handles at every joint — real Alt-key cusp mastery.',
    instruction: 'Drag each node\'s handle in the opposite direction of the last — this path never uses smooth mirrored handles.',
    tip: 'In Illustrator, hold Alt/Option while dragging a handle to break it free from its mirror — required at every joint here.',
    points: [
      { x: 100, y: 220, label: '1', handleOut: { x: 100, y: 80 } },
      { x: 230, y: 220, label: '2', handleIn: { x: 230, y: 80 }, handleOut: { x: 230, y: 360 } },
      { x: 360, y: 220, label: '3', handleIn: { x: 360, y: 360 }, handleOut: { x: 360, y: 80 } },
      { x: 490, y: 220, label: '4', handleIn: { x: 490, y: 80 }, handleOut: { x: 490, y: 360 } },
      { x: 620, y: 220, label: '5', handleIn: { x: 620, y: 360 } }
    ],
    closed: false
  },
  {
    id: 8,
    title: 'Crescent Moon',
    difficulty: 'Advanced',
    desc: 'One fat outer arc and one thin inner arc — judging relative handle weight is the whole skill.',
    instruction: 'Drag a wide handle for the outer arc (1→2), then a much shorter handle for the inner arc back to (1).',
    tip: 'Curvature depth depends on handle length, not just direction — this is pure weight control.',
    points: [
      { x: 360, y: 70, label: '1', handleOut: { x: 190, y: 130 } },
      { x: 360, y: 350, label: '2', handleIn: { x: 190, y: 290 }, handleOut: { x: 300, y: 350 } },
      { x: 360, y: 70, label: '1', handleIn: { x: 300, y: 70 } }
    ],
    closed: true
  },
  {
    id: 9,
    title: 'Lightning Bolt',
    difficulty: 'Expert',
    desc: 'Seven acute-angle corner points, zero handles — the hardest zigzag in the academy.',
    instruction: 'Click all 7 points fast and exact — one overshoot on these sharp angles ruins the silhouette.',
    tip: 'Sharp zigzag icons demand exact anchor clicks; there is no curve to hide a miss.',
    points: [
      { x: 380, y: 60, label: '1' },
      { x: 280, y: 220, label: '2' },
      { x: 350, y: 220, label: '3' },
      { x: 300, y: 380, label: '4' },
      { x: 460, y: 200, label: '5' },
      { x: 390, y: 200, label: '6' },
      { x: 440, y: 60, label: '7' },
      { x: 380, y: 60, label: '1' }
    ],
    closed: true
  }
];

// ── FREEHAND WIRE TRACER TRACKS ──────────────────────────────────────────────
const WIRE_TRACKS = [
  {
    id: 1,
    name: 'Track 1: Neon Highway',
    difficulty: 'Beginner',
    desc: 'Trace smoothly from Green Start to Gold Finish without shaking or touching walls.',
    start: { x: 80, y: 220 },
    end: { x: 640, y: 220 },
    corridorWidth: 38,
    path: [
      { x: 80, y: 220 },
      { x: 180, y: 130 },
      { x: 320, y: 310 },
      { x: 460, y: 130 },
      { x: 560, y: 280 },
      { x: 640, y: 220 }
    ]
  },
  {
    id: 2,
    name: 'Track 2: Circuit Spiral',
    difficulty: 'Intermediate',
    desc: 'Navigate precision 90-degree vector corners without touching laser walls.',
    start: { x: 100, y: 320 },
    end: { x: 620, y: 100 },
    corridorWidth: 32,
    path: [
      { x: 100, y: 320 },
      { x: 100, y: 120 },
      { x: 260, y: 120 },
      { x: 260, y: 280 },
      { x: 420, y: 280 },
      { x: 420, y: 120 },
      { x: 620, y: 120 },
      { x: 620, y: 100 }
    ]
  },
  {
    id: 3,
    name: 'Track 3: Infinity Loop',
    difficulty: 'Intermediate',
    desc: 'Continuous micro-precision hand coordination across crossing curves.',
    start: { x: 360, y: 220 },
    end: { x: 360, y: 220 },
    corridorWidth: 28,
    path: [
      { x: 360, y: 220 },
      { x: 480, y: 110 },
      { x: 600, y: 220 },
      { x: 480, y: 330 },
      { x: 360, y: 220 },
      { x: 240, y: 110 },
      { x: 120, y: 220 },
      { x: 240, y: 330 },
      { x: 360, y: 220 }
    ]
  },
  {
    id: 4,
    name: 'Track 4: Micro Precision Maze',
    difficulty: 'Advanced',
    desc: 'A 20px-wide corridor with eight sharp 90° reversals — the tightest tolerance in the academy.',
    start: { x: 80, y: 360 },
    end: { x: 640, y: 60 },
    corridorWidth: 20,
    path: [
      { x: 80, y: 360 },
      { x: 80, y: 100 },
      { x: 220, y: 100 },
      { x: 220, y: 340 },
      { x: 360, y: 340 },
      { x: 360, y: 100 },
      { x: 500, y: 100 },
      { x: 500, y: 340 },
      { x: 640, y: 340 },
      { x: 640, y: 60 }
    ]
  },
  {
    id: 5,
    name: 'Track 5: Serpent\'s Coil',
    difficulty: 'Expert',
    desc: 'A winding high-speed S-curve against the clock — finish before the timer runs out.',
    start: { x: 60, y: 210 },
    end: { x: 660, y: 210 },
    corridorWidth: 24,
    timeLimitMs: 9000,
    path: [
      { x: 60, y: 210 },
      { x: 160, y: 80 },
      { x: 260, y: 210 },
      { x: 360, y: 340 },
      { x: 460, y: 80 },
      { x: 560, y: 210 },
      { x: 660, y: 210 }
    ]
  }
];

// ── REAL ACCURACY SCORING (replaces placeholder random score) ────────────────
// Anchor placement is always snapped exactly onto the target point (see
// handleBezierMouseDown), so the only thing the student actually controls is
// each handle's drag vector. Accuracy = how closely that drag matches the
// target handle's direction (angle) and weight (length).
const vectorSimilarity = (targetVec, userVec) => {
  const tLen = Math.hypot(targetVec.x, targetVec.y);
  const uLen = Math.hypot(userVec.x, userVec.y);
  if (tLen < 1) return 100; // target itself has no meaningful handle
  if (uLen < 1) return 15;  // student dropped a flat corner where a curve was expected
  const dot = (targetVec.x * userVec.x + targetVec.y * userVec.y) / (tLen * uLen);
  const angleScore = Math.max(0, dot); // 1 = perfect direction, 0/neg = wrong way
  const lenRatio = Math.min(tLen, uLen) / Math.max(tLen, uLen); // 1 = perfect weight
  return Math.round((angleScore * 0.7 + lenRatio * 0.3) * 100);
};

const computeBezierAccuracy = (targetPoints, placedNodes) => {
  let total = 0;
  let scored = 0;
  placedNodes.forEach((node, idx) => {
    const target = targetPoints[idx];
    if (!target) return;
    if (target.handleOut) {
      scored++;
      const tVec = { x: target.handleOut.x - target.x, y: target.handleOut.y - target.y };
      const uVec = node.handleOut ? { x: node.handleOut.x - node.x, y: node.handleOut.y - node.y } : { x: 0, y: 0 };
      total += vectorSimilarity(tVec, uVec);
    }
    if (target.handleIn) {
      scored++;
      const tVec = { x: target.handleIn.x - target.x, y: target.handleIn.y - target.y };
      const uVec = node.handleIn ? { x: node.handleIn.x - node.x, y: node.handleIn.y - node.y } : { x: 0, y: 0 };
      total += vectorSimilarity(tVec, uVec);
    }
  });
  if (scored === 0) return 100; // corner-only mission (e.g. Star, Lightning Bolt) — placement is exact by design
  return Math.max(0, Math.min(100, Math.round(total / scored)));
};

const DIFFICULTY_STYLES = {
  Beginner: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  Intermediate: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  Advanced: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  Expert: 'bg-rose-500/20 text-rose-300 border-rose-500/30'
};

const DIFFICULTY_DOT = {
  Beginner: 'bg-emerald-400',
  Intermediate: 'bg-sky-400',
  Advanced: 'bg-amber-400',
  Expert: 'bg-rose-400'
};

const PenToolMasterGame = ({ user, onProgressUpdate, isMasterFullscreen, toggleMasterFullscreen, initialMode, initialMissionIdx, initialWireIdx }) => {
  const navigate = useNavigate();
  const [activeMode, setActiveMode] = useState(initialMode || 'bezier'); // 'bezier' | 'wire'
  const [selectedMissionIdx, setSelectedMissionIdx] = useState(initialMissionIdx ?? 0);
  const [selectedWireIdx, setSelectedWireIdx] = useState(initialWireIdx ?? 0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef(null);
  const canvasRef = useRef(null);

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

  // Guard against a dangling countdown interval if the component unmounts mid-track.
  useEffect(() => {
    return () => {
      if (wireTimerRef.current) clearInterval(wireTimerRef.current);
    };
  }, []);

  // Bézier Mode State
  const [userNodes, setUserNodes] = useState([]);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isDraggingHandle, setIsDraggingHandle] = useState(false);
  const [activeDragStart, setActiveDragStart] = useState(null);
  const [currentHandlePos, setCurrentHandlePos] = useState(null);
  const [hoveredTargetIdx, setHoveredTargetIdx] = useState(null);
  const [missionComplete, setMissionComplete] = useState(false);
  const [missionAccuracy, setMissionAccuracy] = useState(0);
  const [showGuideLines, setShowGuideLines] = useState(true);

  // Wire Mode State
  const [wireProgress, setWireProgress] = useState(0); // 0 to 100%
  const [isDrawingWire, setIsDrawingWire] = useState(false);
  const [wireUserPath, setWireUserPath] = useState([]);
  const [wireFailed, setWireFailed] = useState(false);
  const [wireWon, setWireWon] = useState(false);
  const [wireFailReason, setWireFailReason] = useState('boundary'); // 'boundary' | 'timeout' | 'release'
  const [wireTimeLeftMs, setWireTimeLeftMs] = useState(null);
  const wireStartTimeRef = useRef(null);
  const wireTimerRef = useRef(null);

  const currMission = BEZIER_MISSIONS[selectedMissionIdx];
  const currWire = WIRE_TRACKS[selectedWireIdx];

  // ── RESET BÉZIER MISSION ──────────────────────────────────────────────────
  const resetBezierMission = useCallback(() => {
    setUserNodes([]);
    setCurrentStepIdx(0);
    setIsDraggingHandle(false);
    setActiveDragStart(null);
    setCurrentHandlePos(null);
    setMissionComplete(false);
    setMissionAccuracy(0);
  }, []);

  useEffect(() => {
    resetBezierMission();
  }, [selectedMissionIdx, resetBezierMission]);

  // ── RESET WIRE MISSION ───────────────────────────────────────────────────
  const resetWireMission = useCallback(() => {
    setWireProgress(0);
    setIsDrawingWire(false);
    setWireUserPath([]);
    setWireFailed(false);
    setWireWon(false);
    setWireFailReason('boundary');
    setWireTimeLeftMs(WIRE_TRACKS[selectedWireIdx]?.timeLimitMs ?? null);
    wireStartTimeRef.current = null;
    if (wireTimerRef.current) {
      clearInterval(wireTimerRef.current);
      wireTimerRef.current = null;
    }
  }, [selectedWireIdx]);

  useEffect(() => {
    resetWireMission();
  }, [selectedWireIdx, resetWireMission]);

  // ── BÉZIER CANVAS RENDERING ───────────────────────────────────────────────
  const renderBezierCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Dark Grid Canvas
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    // Subtle Grid pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 25) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 25) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const mission = BEZIER_MISSIONS[selectedMissionIdx];

    // 1. Draw Target Template Guide (Dotted Blueprint)
    if (showGuideLines) {
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.35)';
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();

      mission.points.forEach((pt, idx) => {
        if (idx === 0) {
          ctx.moveTo(pt.x, pt.y);
        } else {
          const prev = mission.points[idx - 1];
          const cp1 = prev.handleOut || prev;
          const cp2 = pt.handleIn || pt;
          ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, pt.x, pt.y);
        }
      });
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Target Handle Direction Lines
      mission.points.forEach((pt) => {
        if (pt.handleOut) {
          ctx.strokeStyle = 'rgba(244, 63, 94, 0.4)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(pt.x, pt.y);
          ctx.lineTo(pt.handleOut.x, pt.handleOut.y);
          ctx.stroke();

          // Handle Tip circle
          ctx.fillStyle = 'rgba(244, 63, 94, 0.7)';
          ctx.beginPath();
          ctx.arc(pt.handleOut.x, pt.handleOut.y, 4, 0, Math.PI * 2);
          ctx.fill();
        }
        if (pt.handleIn) {
          ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(pt.x, pt.y);
          ctx.lineTo(pt.handleIn.x, pt.handleIn.y);
          ctx.stroke();

          ctx.fillStyle = 'rgba(16, 185, 129, 0.7)';
          ctx.beginPath();
          ctx.arc(pt.handleIn.x, pt.handleIn.y, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }

    // 2. Draw User Vector Path (Active Render)
    if (userNodes.length > 0) {
      // Completed Vector Stroke
      ctx.strokeStyle = '#38bdf8'; // Bright Cyan
      ctx.lineWidth = 3.5;
      ctx.shadowColor = '#0284c7';
      ctx.shadowBlur = 10;
      ctx.beginPath();

      userNodes.forEach((node, idx) => {
        if (idx === 0) {
          ctx.moveTo(node.x, node.y);
        } else {
          const prev = userNodes[idx - 1];
          const cp1 = prev.handleOut || { x: prev.x, y: prev.y };
          const cp2 = node.handleIn || { x: node.x, y: node.y };
          ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, node.x, node.y);
        }
      });
      ctx.stroke();

      // If closed and complete, fill with smooth glowing gradient
      if (missionComplete && mission.closed) {
        ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      // Draw User Bézier Handles
      userNodes.forEach((node) => {
        if (node.handleOut) {
          ctx.strokeStyle = '#f43f5e';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(node.handleOut.x, node.handleOut.y);
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(node.handleOut.x, node.handleOut.y, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
        if (node.handleIn) {
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(node.handleIn.x, node.handleIn.y);
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(node.handleIn.x, node.handleIn.y, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
      });
    }

    // 3. Draw Active Handle Being Dragged
    if (isDraggingHandle && activeDragStart && currentHandlePos) {
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(activeDragStart.x, activeDragStart.y);
      ctx.lineTo(currentHandlePos.x, currentHandlePos.y);
      ctx.stroke();

      // Opposing handle
      const oppX = activeDragStart.x - (currentHandlePos.x - activeDragStart.x);
      const oppY = activeDragStart.y - (currentHandlePos.y - activeDragStart.y);
      ctx.strokeStyle = '#10b981';
      ctx.beginPath();
      ctx.moveTo(activeDragStart.x, activeDragStart.y);
      ctx.lineTo(oppX, oppY);
      ctx.stroke();

      // Handle tips
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(currentHandlePos.x, currentHandlePos.y, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(oppX, oppY, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Draw Anchor Points on Canvas
    mission.points.forEach((pt, idx) => {
      const isCurrentTarget = idx === currentStepIdx && !missionComplete;
      const isPlaced = idx < userNodes.length;

      ctx.save();
      if (isCurrentTarget) {
        // Glowing Pulse for next target
        ctx.shadowColor = '#a855f7';
        ctx.shadowBlur = 14;
        ctx.fillStyle = '#ec4899';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (isPlaced) {
        // Solid Placed Node
        ctx.fillStyle = '#38bdf8';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.fillRect(pt.x - 6, pt.y - 6, 12, 12);
        ctx.strokeRect(pt.x - 6, pt.y - 6, 12, 12);
      } else {
        // Upcoming Node
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // Node Label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(pt.label || `${idx + 1}`, pt.x, pt.y - 14);
      ctx.restore();
    });
  }, [selectedMissionIdx, showGuideLines, userNodes, isDraggingHandle, activeDragStart, currentHandlePos, currentStepIdx, missionComplete]);

  // ── WIRE LASER CANVAS RENDERING ───────────────────────────────────────────
  const renderWireCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const track = WIRE_TRACKS[selectedWireIdx];

    ctx.fillStyle = '#090514';
    ctx.fillRect(0, 0, width, height);

    // Draw Wire Track Pipe / Boundaries
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // 1. Outer Pipe Boundary (The laser wall you must not touch)
    ctx.strokeStyle = wireFailed ? 'rgba(239, 68, 68, 0.4)' : 'rgba(168, 85, 247, 0.25)';
    ctx.lineWidth = track.corridorWidth * 2;
    ctx.beginPath();
    track.path.forEach((p, idx) => {
      if (idx === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();

    // 2. Safe Center Channel
    ctx.strokeStyle = '#120a28';
    ctx.lineWidth = track.corridorWidth * 2 - 8;
    ctx.stroke();

    // 3. Center Guide Line
    ctx.strokeStyle = 'rgba(217, 70, 239, 0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // 4. Start & End Portals
    // Start (Green)
    ctx.fillStyle = '#10b981';
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(track.start.x, track.start.y, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'black 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('START', track.start.x, track.start.y + 3);
    ctx.shadowBlur = 0;

    // End (Gold)
    ctx.fillStyle = '#f59e0b';
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(track.end.x, track.end.y, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText('GOAL', track.end.x, track.end.y + 3);
    ctx.shadowBlur = 0;

    // 5. Draw User's Drawn Path
    if (wireUserPath.length > 1) {
      ctx.strokeStyle = wireFailed ? '#ef4444' : '#06b6d4'; // Cyan Laser
      ctx.lineWidth = 4;
      ctx.shadowColor = wireFailed ? '#ef4444' : '#06b6d4';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      wireUserPath.forEach((p, idx) => {
        if (idx === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }, [selectedWireIdx, wireFailed, wireUserPath]);

  // Main Canvas Render Trigger
  useEffect(() => {
    if (activeMode === 'bezier') {
      renderBezierCanvas();
    } else {
      renderWireCanvas();
    }
  }, [activeMode, renderBezierCanvas, renderWireCanvas]);

  // ── BÉZIER MOUSE EVENTS ───────────────────────────────────────────────────
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

  const handleBezierMouseDown = (e) => {
    if (missionComplete) return;
    const { x, y } = getCanvasCoords(e);
    const targetPoint = currMission.points[currentStepIdx];
    if (!targetPoint) return;

    // Check click proximity to target anchor point
    const dist = Math.hypot(x - targetPoint.x, y - targetPoint.y);
    if (dist <= 26) {
      // Snapped to point!
      audio.playDropPoint(soundEnabled);
      setIsDraggingHandle(true);
      setActiveDragStart({ x: targetPoint.x, y: targetPoint.y });
      setCurrentHandlePos({ x, y });
    }
  };

  const handleBezierMouseMove = (e) => {
    const { x, y } = getCanvasCoords(e);

    if (isDraggingHandle && activeDragStart) {
      setCurrentHandlePos({ x, y });
      const handleDist = Math.hypot(x - activeDragStart.x, y - activeDragStart.y);
      audio.playHandlePull(handleDist, soundEnabled);
      renderBezierCanvas();
    } else if (!missionComplete) {
      // Check hover
      const targetPoint = currMission.points[currentStepIdx];
      if (targetPoint) {
        const dist = Math.hypot(x - targetPoint.x, y - targetPoint.y);
        setHoveredTargetIdx(dist <= 26 ? currentStepIdx : null);
      }
    }
  };

  const handleBezierMouseUp = (e) => {
    if (!isDraggingHandle || !activeDragStart) return;
    setIsDraggingHandle(false);

    const targetPoint = currMission.points[currentStepIdx];
    let handleOut = null;
    let handleIn = null;

    if (currentHandlePos) {
      const hDist = Math.hypot(currentHandlePos.x - activeDragStart.x, currentHandlePos.y - activeDragStart.y);
      if (hDist > 12) {
        handleOut = { x: currentHandlePos.x, y: currentHandlePos.y };
        handleIn = {
          x: activeDragStart.x - (currentHandlePos.x - activeDragStart.x),
          y: activeDragStart.y - (currentHandlePos.y - activeDragStart.y)
        };
      }
    }

    const newNode = {
      x: activeDragStart.x,
      y: activeDragStart.y,
      handleOut,
      handleIn
    };

    const nextNodes = [...userNodes, newNode];
    setUserNodes(nextNodes);
    setActiveDragStart(null);
    setCurrentHandlePos(null);

    const nextIdx = currentStepIdx + 1;
    if (nextIdx >= currMission.points.length) {
      // Mission Complete!
      setMissionComplete(true);
      const acc = computeBezierAccuracy(currMission.points, nextNodes);
      setMissionAccuracy(acc);
      audio.playVictory(soundEnabled);
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
      toast.success(`🎉 Path Vectorized Perfectly! Accuracy: ${acc}%`);
    } else {
      setCurrentStepIdx(nextIdx);
      audio.playCompleteSegment(soundEnabled);
    }
  };

  // ── WIRE TRACER MOUSE EVENTS ──────────────────────────────────────────────
  const clearWireTimer = () => {
    if (wireTimerRef.current) {
      clearInterval(wireTimerRef.current);
      wireTimerRef.current = null;
    }
  };

  const handleWireMouseDown = (e) => {
    const { x, y } = getCanvasCoords(e);
    const startDist = Math.hypot(x - currWire.start.x, y - currWire.start.y);

    if (startDist <= 24) {
      setIsDrawingWire(true);
      setWireFailed(false);
      setWireWon(false);
      setWireUserPath([{ x, y }]);
      setWireProgress(0);
      audio.playDropPoint(soundEnabled);

      // Expert tracks carry a hard time limit — start the countdown now.
      if (currWire.timeLimitMs) {
        wireStartTimeRef.current = Date.now();
        setWireTimeLeftMs(currWire.timeLimitMs);
        clearWireTimer();
        wireTimerRef.current = setInterval(() => {
          const elapsed = Date.now() - (wireStartTimeRef.current || Date.now());
          const remaining = currWire.timeLimitMs - elapsed;
          if (remaining <= 0) {
            clearWireTimer();
            setWireTimeLeftMs(0);
            setWireFailed(true);
            setWireFailReason('timeout');
            setIsDrawingWire(false);
            audio.playWireBuzz(soundEnabled);
            toast.error('⏱️ Time\'s up! Expert tracks demand speed and precision together.');
          } else {
            setWireTimeLeftMs(remaining);
          }
        }, 100);
      }
    }
  };

  const handleWireMouseMove = (e) => {
    if (!isDrawingWire || wireFailed || wireWon) return;
    const { x, y } = getCanvasCoords(e);

    // Check collision with track boundary
    let minDistanceToCenter = Infinity;
    const path = currWire.path;

    for (let i = 0; i < path.length - 1; i++) {
      const p1 = path[i];
      const p2 = path[i + 1];

      // Distance from point (x,y) to line segment p1-p2
      const l2 = (p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2;
      let t = ((x - p1.x) * (p2.x - p1.x) + (y - p1.y) * (p2.y - p1.y)) / l2;
      t = Math.max(0, Math.min(1, t));
      const projX = p1.x + t * (p2.x - p1.x);
      const projY = p1.y + t * (p2.y - p1.y);
      const dist = Math.hypot(x - projX, y - projY);

      if (dist < minDistanceToCenter) {
        minDistanceToCenter = dist;
      }
    }

    if (minDistanceToCenter > currWire.corridorWidth) {
      // Touched Laser Boundary! FAIL!
      clearWireTimer();
      setWireFailed(true);
      setWireFailReason('boundary');
      setIsDrawingWire(false);
      audio.playWireBuzz(soundEnabled);
      toast.error('💥 Laser Wall Hit! Keep your hand steady and retry.');
      return;
    }

    // Add path point
    const nextPath = [...wireUserPath, { x, y }];
    setWireUserPath(nextPath);

    // Calculate progress towards finish
    const goalDist = Math.hypot(x - currWire.end.x, y - currWire.end.y);
    if (goalDist <= 20) {
      clearWireTimer();
      setWireWon(true);
      setIsDrawingWire(false);
      setWireProgress(100);
      audio.playVictory(soundEnabled);
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
      toast.success('🏆 Steady Hand Master! Wire Track Completed 100%!');
    } else {
      const progress = Math.min(99, Math.floor((nextPath.length / 80) * 100));
      setWireProgress(progress);
    }
  };

  const handleWireMouseUp = () => {
    if (isDrawingWire && !wireWon) {
      clearWireTimer();
      setIsDrawingWire(false);
      setWireFailed(true);
      setWireFailReason('release');
      audio.playWireBuzz(soundEnabled);
      toast.info('Mouse released before reaching the goal. Try again!');
    }
  };

  return (
    <div
      ref={containerRef}
      className={`select-none transition-all duration-200 ${
        isFullscreen
          ? 'fixed inset-0 z-50 bg-[#070b14] p-3 sm:p-6 flex flex-col justify-center items-center overflow-y-auto w-screen h-screen'
          : 'space-y-4'
      }`}
    >
      {/* Top Header & Mode Switcher */}
      <div className={`flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800 backdrop-blur-md ${isFullscreen ? 'w-full max-w-6xl' : ''}`}>
        {/* Dual Mode Switch */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveMode('bezier')}
            className={`px-4 py-2 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center gap-2 ${
              activeMode === 'bezier'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-purple-600/30 scale-102'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <FiEdit3 size={15} />
            <span>🖋️ Vector Pen Tool Studio</span>
          </button>

          <button
            onClick={() => setActiveMode('wire')}
            className={`px-4 py-2 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center gap-2 ${
              activeMode === 'wire'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-600/30 scale-102'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <FiZap size={15} />
            <span>⚡ Steady-Hand Wire Tracer</span>
          </button>
        </div>

        {/* Level / Mission Selector Buttons */}
        <div className="flex items-center gap-2">
          {activeMode === 'bezier' ? (
            <div className="flex items-center gap-1.5 flex-wrap">
              {BEZIER_MISSIONS.map((m, idx) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMissionIdx(idx)}
                  title={`${m.difficulty}: ${m.title}`}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                    selectedMissionIdx === idx
                      ? 'bg-purple-600 text-white shadow-md border-purple-500'
                      : `bg-slate-800 text-slate-400 hover:text-white ${DIFFICULTY_STYLES[m.difficulty] || 'border-slate-700'}`
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${DIFFICULTY_DOT[m.difficulty] || 'bg-slate-500'}`} />
                  Shape {m.id}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 flex-wrap">
              {WIRE_TRACKS.map((t, idx) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedWireIdx(idx)}
                  title={`${t.difficulty}: ${t.name}`}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                    selectedWireIdx === idx
                      ? 'bg-cyan-600 text-white shadow-md border-cyan-500'
                      : `bg-slate-800 text-slate-400 hover:text-white ${DIFFICULTY_STYLES[t.difficulty] || 'border-slate-700'}`
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${DIFFICULTY_DOT[t.difficulty] || 'bg-slate-500'}`} />
                  Track {t.id}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white cursor-pointer ml-2"
          >
            {soundEnabled ? <FiVolume2 size={16} /> : <FiVolumeX size={16} />}
          </button>

          <button
            onClick={() => navigate('/pen-tool')}
            title="Open Full-Page Pen Tool Master Lab"
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-slate-950 font-black text-xs shadow-md hover:scale-105 transition-all flex items-center gap-1.5 cursor-pointer ml-1"
          >
            <FiPenTool size={13} />
            <span className="hidden sm:inline">Pen Tool Lab</span>
          </button>

          <button
            onClick={handleToggleFullscreen}
            title={isCurrentlyFullscreen ? "Exit Fullscreen (Esc)" : "Full Page / Fullscreen"}
            className="p-2 rounded-xl bg-slate-800 hover:bg-purple-600 text-slate-300 hover:text-white cursor-pointer transition-all flex items-center gap-1.5"
          >
            {isCurrentlyFullscreen ? <FiMinimize2 size={16} /> : <FiMaximize2 size={16} />}
          </button>
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div className={`relative rounded-3xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl ${isCurrentlyFullscreen ? 'w-full max-w-6xl my-auto' : ''}`}>
        {/* Info Instruction Strip */}
        <div className="p-3.5 bg-slate-900/70 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 px-5">
          <div>
            <h4 className="text-sm font-black text-white flex items-center gap-2 flex-wrap">
              <span>
                {activeMode === 'bezier'
                  ? `Shape ${currMission.id}: ${currMission.title}`
                  : currWire.name}
              </span>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${DIFFICULTY_STYLES[(activeMode === 'bezier' ? currMission : currWire).difficulty] || 'border-slate-700 text-slate-400'}`}>
                {(activeMode === 'bezier' ? currMission : currWire).difficulty}
              </span>
              {missionComplete && (
                <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-slate-950 text-[10px] font-black">
                  ⭐ {missionAccuracy}% Match!
                </span>
              )}
              {activeMode === 'wire' && isDrawingWire && wireTimeLeftMs !== null && (
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${wireTimeLeftMs < 2500 ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-800 text-amber-300 border border-amber-500/30'}`}>
                  ⏱️ {(wireTimeLeftMs / 1000).toFixed(1)}s
                </span>
              )}
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              {activeMode === 'bezier' ? currMission.instruction : currWire.desc}
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2">
            {activeMode === 'bezier' && (
              <button
                onClick={() => setShowGuideLines(!showGuideLines)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                  showGuideLines
                    ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/30'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                <FiEye size={13} />
                <span>Guide Lines</span>
              </button>
            )}

            <button
              onClick={() => {
                if (activeMode === 'bezier') resetBezierMission();
                else resetWireMission();
              }}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <FiRefreshCw size={13} />
              <span>Reset</span>
            </button>

            {/* Corner Full Page Button */}
            <button
              onClick={handleToggleFullscreen}
              title={isCurrentlyFullscreen ? "Exit Fullscreen (Esc)" : "Full Page / Fullscreen"}
              className="px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/30 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
            >
              {isCurrentlyFullscreen ? <FiMinimize2 size={13} /> : <FiMaximize2 size={13} />}
              <span>{isCurrentlyFullscreen ? 'Exit Full' : 'Full Page'}</span>
            </button>
          </div>
        </div>

        {/* Interactive Canvas */}
        <canvas
          ref={canvasRef}
          width={isFullscreen ? 1100 : 720}
          height={isFullscreen ? 540 : 420}
          onMouseDown={activeMode === 'bezier' ? handleBezierMouseDown : handleWireMouseDown}
          onMouseMove={activeMode === 'bezier' ? handleBezierMouseMove : handleWireMouseMove}
          onMouseUp={activeMode === 'bezier' ? handleBezierMouseUp : handleWireMouseUp}
          className="w-full h-[420px] cursor-crosshair block"
        />

        {/* Bézier Completed Banner */}
        {activeMode === 'bezier' && missionComplete && (
          <div className="absolute bottom-16 inset-x-0 flex justify-center pointer-events-none animate-in zoom-in-95">
            <div className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-900/90 to-indigo-900/90 border border-purple-500/50 shadow-2xl backdrop-blur-md flex items-center gap-4 pointer-events-auto">
              <div>
                <p className="text-xs font-bold text-purple-300">Vector Accuracy</p>
                <p className="text-xl font-black text-white">{missionAccuracy}% Match</p>
              </div>

              {selectedMissionIdx < BEZIER_MISSIONS.length - 1 && (
                <button
                  onClick={() => setSelectedMissionIdx(prev => prev + 1)}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-black text-xs rounded-xl shadow-lg cursor-pointer flex items-center gap-1.5"
                >
                  <span>Next Shape</span>
                  <FiChevronRight size={14} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Wire Failed Banner */}
        {activeMode === 'wire' && wireFailed && (
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center space-y-3 animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center text-2xl">
              {wireFailReason === 'timeout' ? '⏱️' : '💥'}
            </div>
            <h4 className="text-xl font-black text-white">
              {wireFailReason === 'timeout' ? "Time's Up!" : 'Wire Boundary Touched!'}
            </h4>
            <p className="text-xs text-slate-400 max-w-sm">
              {wireFailReason === 'timeout'
                ? 'Expert tracks demand speed and precision at once — build muscle memory and try again.'
                : 'Keep your hand steady, start from the Green circle and glide through the center pipe.'}
            </p>
            <button
              onClick={resetWireMission}
              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow-lg cursor-pointer"
            >
              Retry Track
            </button>
          </div>
        )}

        {/* Wire Victory Banner */}
        {activeMode === 'wire' && wireWon && (
          <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center space-y-3 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-3xl bg-amber-400 text-slate-950 flex items-center justify-center text-3xl shadow-xl shadow-amber-400/40">
              🏆
            </div>
            <h4 className="text-2xl font-black text-emerald-400">Steady Hand Master!</h4>
            <p className="text-xs text-slate-300">
              You navigated <strong className="text-white">{currWire.name}</strong> with 100% precision.
            </p>
            <div className="flex gap-2.5 pt-2">
              <button
                onClick={resetWireMission}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Replay
              </button>
              {selectedWireIdx < WIRE_TRACKS.length - 1 && (
                <button
                  onClick={() => setSelectedWireIdx(prev => prev + 1)}
                  className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs rounded-xl shadow-lg cursor-pointer flex items-center gap-1.5"
                >
                  <span>Next Track</span>
                  <FiChevronRight size={14} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Footer Pro Tip */}
        <div className="p-3 bg-slate-900/90 border-t border-slate-800 text-[11px] text-slate-400 flex flex-wrap items-center justify-between px-5 font-mono">
          <span>
            💡 Pro Tip: {activeMode === 'bezier' ? currMission.tip : 'Keep your wrist relaxed and glide the mouse smoothly across your mousepad.'}
          </span>
          <span className="text-indigo-400 font-bold">
            Photoshop & Illustrator Precision Mode
          </span>
        </div>
      </div>
    </div>
  );
};

export default PenToolMasterGame;
