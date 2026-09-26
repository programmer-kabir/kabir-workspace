import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import {
  FiTarget, FiFolder, FiTrash2, FiMousePointer, FiArrowDown,
  FiCheckCircle, FiRefreshCw, FiAward, FiClock, FiZap,
  FiMaximize2, FiMinimize2, FiImage, FiFileText, FiMusic
} from 'react-icons/fi';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

// Synthesize pleasant sound effects without external audio files
const playTone = (freq = 440, type = 'sine', duration = 0.15) => {
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
  } catch (e) {
    // Silent fail if audio disabled
  }
};

const RIGHT_CLICK_PROMPTS = [
  { text: 'Right-click on the folder icon below and select "Open Folder".', targetAction: 'open', targetType: 'folder' },
  { text: 'Right-click anywhere on the blank desk and select "Create New File".', targetAction: 'new_file', targetType: 'blank' },
  { text: 'Right-click on the photo item and select "Rename File".', targetAction: 'rename', targetType: 'photo' },
  { text: 'Right-click on the document and select "Properties & Details".', targetAction: 'properties', targetType: 'doc' },
];

const MouseTrainer = ({ user, onProgressUpdate, isMasterFullscreen, toggleMasterFullscreen }) => {
  const [activeLevel, setActiveLevel] = useState(1); // 1 to 5
  const [gameState, setGameState] = useState('idle'); // 'idle' | 'playing' | 'completed'
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
  
  // Level 1 (Single Click Aim) State
  const [targets, setTargets] = useState([]);
  const [currentTargetIdx, setCurrentTargetIdx] = useState(0);
  const [targetSpawnTime, setTargetSpawnTime] = useState(0);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [reactionTimes, setReactionTimes] = useState([]);
  const arenaRef = useRef(null);

  // Level 2 (Double Click) State
  const [chestStage, setChestStage] = useState(0); // 0 to 5 chests opened
  const [chestSpawnTime, setChestSpawnTime] = useState(0);
  const lastClickTimeRef = useRef(0);

  // Level 3 (Drag & Drop) State
  const initialFiles = [
    { id: 'f1', name: 'Resume_Kabir.pdf', type: 'doc', icon: 'FiFileText', target: 'docs' },
    { id: 'f2', name: 'Photo_Vacation.jpg', type: 'image', icon: 'FiImage', target: 'photos' },
    { id: 'f3', name: 'Old_Cache.tmp', type: 'trash', icon: 'FiTrash2', target: 'trash' },
    { id: 'f4', name: 'Audio_Song.mp3', type: 'doc', icon: 'FiMusic', target: 'docs' },
    { id: 'f5', name: 'Certificate.png', type: 'image', icon: 'FiImage', target: 'photos' },
    { id: 'f6', name: 'Spam_Draft.log', type: 'trash', icon: 'FiTrash2', target: 'trash' },
  ];
  const [filesToDrag, setFilesToDrag] = useState(initialFiles);
  const [draggedItem, setDraggedItem] = useState(null);
  const [droppedCounts, setDroppedCounts] = useState({ docs: 0, photos: 0, trash: 0 });

  // Level 4 (Right Click) State
  const [rightClickPrompt, setRightClickPrompt] = useState(0); // 0 to 4 prompts
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });

  // Level 5 (Scroll & Wheel) State
  const [scrollScore, setScrollScore] = useState(0);
  const [scrollCheckpoints, setScrollCheckpoints] = useState([
    { id: 1, label: 'Section 1: Desktop Basics', collected: false },
    { id: 2, label: 'Section 2: Mouse Grip & Posture', collected: false },
    { id: 3, label: 'Section 3: Browser Navigation', collected: false },
    { id: 4, label: 'Section 4: Touchpad Gestures', collected: false },
    { id: 5, label: 'Section 5: Final Checkpoint', collected: false },
  ]);

  // Overall Score Metrics
  const [finalMetrics, setFinalMetrics] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // ── LEVEL 1: AIM & SINGLE CLICK LOGIC ──────────────────────────────────────
  const startLevel1 = () => {
    setGameState('playing');
    setHits(0);
    setMisses(0);
    setReactionTimes([]);
    setCurrentTargetIdx(0);
    spawnNewTarget(0);
  };

  const spawnNewTarget = (idx) => {
    if (idx >= 10) {
      finishLevel(1);
      return;
    }
    const arena = arenaRef.current;
    const maxX = arena ? arena.clientWidth - 80 : 400;
    const maxY = arena ? arena.clientHeight - 80 : 300;
    const randX = Math.max(20, Math.floor(Math.random() * (maxX - 40)));
    const randY = Math.max(20, Math.floor(Math.random() * (maxY - 40)));
    const colors = ['bg-rose-500', 'bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-cyan-500'];
    const randColor = colors[Math.floor(Math.random() * colors.length)];

    setTargets([{ id: idx, x: randX, y: randY, color: randColor, size: Math.max(48, 64 - idx * 2) }]);
    setCurrentTargetIdx(idx);
    setTargetSpawnTime(Date.now());
  };

  const handleTargetClick = (e, tId) => {
    e.stopPropagation();
    const rt = Date.now() - targetSpawnTime;
    setReactionTimes(prev => [...prev, rt]);
    setHits(prev => prev + 1);
    playTone(523.25 + hits * 30, 'triangle', 0.1); // C5 upwards
    spawnNewTarget(currentTargetIdx + 1);
  };

  const handleArenaMissClick = () => {
    if (gameState !== 'playing' || activeLevel !== 1) return;
    setMisses(prev => prev + 1);
    playTone(200, 'sawtooth', 0.15); // Buzz
  };

  // ── LEVEL 2: DOUBLE CLICK LOGIC ───────────────────────────────────────────
  const startLevel2 = () => {
    setGameState('playing');
    setChestStage(0);
    setReactionTimes([]);
    setChestSpawnTime(Date.now());
  };

  const handleChestDoubleClick = () => {
    if (gameState !== 'playing' || activeLevel !== 2) return;
    const now = Date.now();
    const diff = now - lastClickTimeRef.current;
    
    // Valid double click within 450ms
    if (diff < 450) {
      playTone(659.25, 'sine', 0.2); // E5
      playTone(783.99, 'sine', 0.25); // G5
      const newStage = chestStage + 1;
      setChestStage(newStage);
      setReactionTimes(prev => [...prev, diff]);

      if (newStage >= 5) {
        finishLevel(2);
      } else {
        toast.success(`Chest #${newStage} Unlocked! Keep double clicking!`, { duration: 1000 });
        setChestSpawnTime(Date.now());
      }
    }
  };

  const handleChestSingleClick = () => {
    lastClickTimeRef.current = Date.now();
  };

  // ── LEVEL 3: DRAG AND DROP LOGIC ──────────────────────────────────────────
  const startLevel3 = () => {
    setGameState('playing');
    setFilesToDrag(initialFiles);
    setDroppedCounts({ docs: 0, photos: 0, trash: 0 });
  };

  const handleDragStart = (e, file) => {
    setDraggedItem(file);
    e.dataTransfer.setData('text/plain', file.id);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetFolder) => {
    e.preventDefault();
    if (!draggedItem) return;

    if (draggedItem.target === targetFolder) {
      playTone(587.33, 'sine', 0.15); // D5 success
      setDroppedCounts(prev => ({ ...prev, [targetFolder]: prev[targetFolder] + 1 }));
      const remaining = filesToDrag.filter(f => f.id !== draggedItem.id);
      setFilesToDrag(remaining);
      setDraggedItem(null);

      if (remaining.length === 0) {
        finishLevel(3);
      }
    } else {
      playTone(220, 'square', 0.2); // Error tone
      toast.error(`Wrong folder! ${draggedItem.name} does not belong here.`, { duration: 1500 });
      setDraggedItem(null);
    }
  };

  // ── LEVEL 4: RIGHT CLICK CONTEXT MENU ─────────────────────────────────────
  const startLevel4 = () => {
    setGameState('playing');
    setRightClickPrompt(0);
    setShowContextMenu(false);
  };

  const handleContextMenuTrigger = (e, type) => {
    e.preventDefault();
    if (gameState !== 'playing' || activeLevel !== 4) return;
    const rect = arenaRef.current?.getBoundingClientRect();
    if (rect) {
      setContextMenuPos({ x: e.clientX - rect.left, y: e.clientY - rect.top, targetType: type });
      setShowContextMenu(true);
      playTone(400, 'sine', 0.08);
    }
  };

  const handleContextMenuAction = (action) => {
    setShowContextMenu(false);
    const currPrompt = RIGHT_CLICK_PROMPTS[rightClickPrompt];
    if (currPrompt && currPrompt.targetAction === action) {
      playTone(659.25, 'triangle', 0.2);
      const nextPrompt = rightClickPrompt + 1;
      setRightClickPrompt(nextPrompt);

      if (nextPrompt >= RIGHT_CLICK_PROMPTS.length) {
        finishLevel(4);
      } else {
        toast.success('Correct action selected! Moving to next challenge...', { duration: 1200 });
      }
    } else {
      playTone(200, 'sawtooth', 0.15);
      toast.error('Incorrect option! Read the instructions carefully.', { duration: 1500 });
    }
  };

  // ── LEVEL 5: SCROLL WHEEL NAVIGATOR ───────────────────────────────────────
  const startLevel5 = () => {
    setGameState('playing');
    setScrollScore(0);
    setScrollCheckpoints([
      { id: 1, label: 'Section 1: Desktop Basics', collected: false },
      { id: 2, label: 'Section 2: Mouse Grip & Posture', collected: false },
      { id: 3, label: 'Section 3: Browser Navigation', collected: false },
      { id: 4, label: 'Section 4: Touchpad Gestures', collected: false },
      { id: 5, label: 'Section 5: Final Checkpoint', collected: false },
    ]);
  };

  const handleCollectCheckpoint = (cpId) => {
    playTone(600 + cpId * 80, 'sine', 0.15);
    setScrollCheckpoints(prev => {
      const updated = prev.map(cp => cp.id === cpId ? { ...cp, collected: true } : cp);
      const totalCollected = updated.filter(c => c.collected).length;
      setScrollScore(totalCollected);
      if (totalCollected >= updated.length) {
        finishLevel(5);
      }
      return updated;
    });
  };

  // ── FINISH LEVEL & SAVE METRICS ───────────────────────────────────────────
  const finishLevel = async (lvl) => {
    setGameState('completed');
    playTone(523.25, 'sine', 0.2);
    setTimeout(() => playTone(659.25, 'sine', 0.2), 100);
    setTimeout(() => playTone(783.99, 'sine', 0.3), 200);
    setTimeout(() => playTone(1046.50, 'sine', 0.4), 300);

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });

    let score = 100;
    let accuracy = 100;
    let avgReaction = 0;
    let drillType = 'mouse_click';

    if (lvl === 1) {
      drillType = 'mouse_click';
      const totalClicks = hits + misses;
      accuracy = totalClicks > 0 ? Math.round((hits / totalClicks) * 100) : 100;
      avgReaction = reactionTimes.length > 0 ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length) : 500;
      score = Math.max(0, Math.round(accuracy * 0.8 + (1000 - Math.min(1000, avgReaction)) * 0.02));
    } else if (lvl === 2) {
      drillType = 'mouse_double_click';
      accuracy = 100;
      avgReaction = reactionTimes.length > 0 ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length) : 300;
      score = 95;
    } else if (lvl === 3) {
      drillType = 'mouse_drag_drop';
      accuracy = 100;
      score = 90;
    } else if (lvl === 4) {
      drillType = 'mouse_right_click';
      accuracy = 100;
      score = 95;
    } else if (lvl === 5) {
      drillType = 'mouse_scroll';
      accuracy = 100;
      score = 100;
    }

    const metrics = {
      level: lvl,
      score,
      accuracy,
      reaction_time_ms: avgReaction,
      drill_type: drillType
    };
    setFinalMetrics(metrics);

    // Save to backend
    if (user?.id) {
      try {
        setIsSaving(true);
        const res = await axios.post(`${API_BASE}api/student/foundations/save_mouse_drill.php`, {
          user_id: user.id,
          drill_type: drillType,
          level_no: lvl,
          score: score,
          accuracy_percent: accuracy,
          reaction_time_ms: avgReaction,
          mistakes_count: lvl === 1 ? misses : 0,
          duration_seconds: 30
        });
        if (res.data?.data?.new_badges?.length > 0) {
          res.data.data.new_badges.forEach(b => {
            toast.success(`🎉 New Badge Unlocked: ${b.icon} ${b.title}!`, { duration: 3000 });
          });
        }
        if (onProgressUpdate) onProgressUpdate();
      } catch (err) {
        console.error(err);
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className={`transition-all duration-200 ${
        isFullscreen
          ? 'fixed inset-0 z-50 bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 p-4 sm:p-8 overflow-y-auto w-screen h-screen space-y-6 flex flex-col justify-center max-w-none'
          : 'space-y-6'
      }`}
    >
      {/* Level Navigation Bar */}
      <div className={`grid grid-cols-2 sm:grid-cols-5 gap-2.5 p-2 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 ${isCurrentlyFullscreen ? 'max-w-6xl w-full mx-auto' : ''}`}>
        {[
          { num: 1, title: 'Left Click Aim', icon: '🎯', desc: 'Precision & Reflex' },
          { num: 2, title: 'Double Click', icon: '⚡', desc: 'Chests & Vaults' },
          { num: 3, title: 'Drag & Drop', icon: '📂', desc: 'File Organizer' },
          { num: 4, title: 'Right Click', icon: '🖱️', desc: 'Context Menu' },
          { num: 5, title: 'Scroll Wheel', icon: '📜', desc: 'Page Navigator' },
        ].map((lvl) => (
          <button
            key={lvl.num}
            onClick={() => {
              setActiveLevel(lvl.num);
              setGameState('idle');
              setShowContextMenu(false);
            }}
            className={`p-3 rounded-xl text-left transition-all cursor-pointer ${
              activeLevel === lvl.num
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-md border border-indigo-200 dark:border-indigo-800 font-black'
                : 'hover:bg-white/60 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-base">{lvl.icon}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold">
                Lvl {lvl.num}
              </span>
            </div>
            <p className="text-xs font-bold truncate">{lvl.title}</p>
            <p className="text-[10px] text-slate-400 truncate">{lvl.desc}</p>
          </button>
        ))}
      </div>

      {/* Main Interactive Arena */}
      <div className={`rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden ${isCurrentlyFullscreen ? 'max-w-6xl w-full mx-auto flex-1 flex flex-col justify-between' : ''}`}>
        {/* Arena Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>
                {activeLevel === 1 && '🎯 Level 1: Target Aim & Left-Click Speed Drill'}
                {activeLevel === 2 && '⚡ Level 2: Double-Click Speed Trigger'}
                {activeLevel === 3 && '📂 Level 3: Drag & Drop Desktop Organizer'}
                {activeLevel === 4 && '🖱️ Level 4: Right-Click Context Menu Challenge'}
                {activeLevel === 5 && '📜 Level 5: Smooth Scroll Wheel Navigation'}
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {activeLevel === 1 && 'Click on the moving colorful balloons quickly. Avoid clicking empty space!'}
              {activeLevel === 2 && 'Quickly double-click each chest to unlock the gems inside.'}
              {activeLevel === 3 && 'Hold left-click on files and drag them into their matching folders.'}
              {activeLevel === 4 && 'Right-click the target items and select the exact requested action.'}
              {activeLevel === 5 && 'Use your mouse scroll wheel to roll down and collect all section badges.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {gameState === 'playing' && (
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                {activeLevel === 1 && (
                  <>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                      Hits: {hits}/10
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
                      Misses: {misses}
                    </span>
                  </>
                )}
                {activeLevel === 2 && (
                  <span className="px-3 py-1 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                    Chests Opened: {chestStage}/5
                  </span>
                )}
                {activeLevel === 3 && (
                  <span className="px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                    Remaining: {filesToDrag.length} files
                  </span>
                )}
                {activeLevel === 4 && (
                  <span className="px-3 py-1 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                    Step {rightClickPrompt + 1} of {RIGHT_CLICK_PROMPTS.length}
                  </span>
                )}
                {activeLevel === 5 && (
                  <span className="px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                    Checkpoints: {scrollScore}/5
                  </span>
                )}
              </div>
            )}

            {/* Corner Full Page Button */}
            <button
              onClick={handleToggleFullscreen}
              title={isCurrentlyFullscreen ? "Exit Fullscreen (Esc)" : "Full Page / Fullscreen"}
              className="p-2 rounded-xl bg-slate-100 hover:bg-indigo-600 text-slate-600 hover:text-white dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-indigo-600 dark:hover:text-white cursor-pointer transition-all flex items-center gap-1.5"
            >
              {isCurrentlyFullscreen ? <FiMinimize2 size={16} /> : <FiMaximize2 size={16} />}
              <span className="text-xs font-bold hidden sm:inline">{isCurrentlyFullscreen ? 'Exit Full' : 'Full Page'}</span>
            </button>
          </div>
        </div>

        {/* Dynamic Game Arena Stage */}
        <div
          ref={arenaRef}
          onClick={handleArenaMissClick}
          className="relative min-h-[420px] max-h-[500px] overflow-hidden bg-slate-100/50 dark:bg-slate-950/40 select-none flex flex-col justify-center"
        >
          {/* IDLE SCREEN (Ready to start) */}
          {gameState === 'idle' && (
            <div className="text-center p-8 space-y-4 max-w-md mx-auto my-auto">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-indigo-600 text-white flex items-center justify-center text-3xl shadow-xl shadow-indigo-500/20 animate-bounce">
                {activeLevel === 1 && '🎯'}
                {activeLevel === 2 && '⚡'}
                {activeLevel === 3 && '📂'}
                {activeLevel === 4 && '🖱️'}
                {activeLevel === 5 && '📜'}
              </div>
              <div>
                <h4 className="text-xl font-black text-slate-900 dark:text-white">
                  {activeLevel === 1 && 'Single Click Aim Trainer'}
                  {activeLevel === 2 && 'Double Click Reflex Drill'}
                  {activeLevel === 3 && 'Drag & Drop File Management'}
                  {activeLevel === 4 && 'Right Click Context Actions'}
                  {activeLevel === 5 && 'Scroll Wheel Precision Test'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                  Practice mouse movement muscle memory to boost your PC confidence.
                </p>
              </div>

              <button
                onClick={() => {
                  if (activeLevel === 1) startLevel1();
                  if (activeLevel === 2) startLevel2();
                  if (activeLevel === 3) startLevel3();
                  if (activeLevel === 4) startLevel4();
                  if (activeLevel === 5) startLevel5();
                }}
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                Start Level {activeLevel} Training
              </button>
            </div>
          )}

          {/* PLAYING: LEVEL 1 (TARGET AIM) */}
          {gameState === 'playing' && activeLevel === 1 && (
            <div className="absolute inset-0">
              {targets.map((t) => (
                <div
                  key={t.id}
                  onClick={(e) => handleTargetClick(e, t.id)}
                  style={{
                    left: `${t.x}px`,
                    top: `${t.y}px`,
                    width: `${t.size}px`,
                    height: `${t.size}px`,
                  }}
                  className={`absolute rounded-full ${t.color} text-white font-black flex items-center justify-center cursor-crosshair shadow-lg shadow-black/20 animate-ping-once transition-transform hover:scale-110 active:scale-90`}
                >
                  <span className="text-sm">{t.id + 1}</span>
                </div>
              ))}
            </div>
          )}

          {/* PLAYING: LEVEL 2 (DOUBLE CLICK) */}
          {gameState === 'playing' && activeLevel === 2 && (
            <div className="text-center p-8 space-y-6 my-auto">
              <div
                onClick={handleChestSingleClick}
                onDoubleClick={handleChestDoubleClick}
                className="w-32 h-32 mx-auto rounded-3xl bg-amber-500 hover:bg-amber-600 text-white flex flex-col items-center justify-center cursor-pointer shadow-2xl shadow-amber-500/30 hover:scale-105 active:scale-95 transition-all border-4 border-amber-300 dark:border-amber-600"
              >
                <span className="text-5xl animate-pulse">📦</span>
                <span className="text-[11px] font-black uppercase mt-1 tracking-wider">Double Click!</span>
              </div>
              <div>
                <p className="text-sm font-black text-slate-800 dark:text-slate-200">
                  Chest #{chestStage + 1} of 5
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Click two times quickly in less than half a second.
                </p>
              </div>
            </div>
          )}

          {/* PLAYING: LEVEL 3 (DRAG AND DROP) */}
          {gameState === 'playing' && activeLevel === 3 && (
            <div className="p-6 space-y-6 h-full flex flex-col justify-between">
              {/* Draggable Files Shelf */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Unsorted Desktop Files (Drag these down)
                </p>
                <div className="flex flex-wrap gap-3">
                  {filesToDrag.map((file) => (
                    <div
                      key={file.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, file)}
                      className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-2 cursor-grab active:cursor-grabbing hover:border-indigo-500 shadow-xs hover:scale-105 transition-all"
                    >
                      <span className="text-indigo-600 dark:text-indigo-400">
                        {file.type === 'doc' && <FiFileText size={16} />}
                        {file.type === 'image' && <FiImage size={16} />}
                        {file.type === 'trash' && <FiTrash2 size={16} />}
                      </span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{file.name}</span>
                    </div>
                  ))}
                  {filesToDrag.length === 0 && (
                    <p className="text-xs text-emerald-500 font-bold">All files organized cleanly! 🎉</p>
                  )}
                </div>
              </div>

              {/* Target Drop Folders */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Documents Folder */}
                <div
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, 'docs')}
                  className="p-4 rounded-2xl border-2 border-dashed border-blue-300 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 text-center space-y-1 hover:border-blue-500 transition-colors"
                >
                  <FiFolder size={28} className="mx-auto text-blue-500" />
                  <p className="text-xs font-black text-slate-900 dark:text-white">📁 Documents Folder</p>
                  <p className="text-[10px] text-slate-400">Drop .pdf, .docx, .mp3 here ({droppedCounts.docs})</p>
                </div>

                {/* Photos Folder */}
                <div
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, 'photos')}
                  className="p-4 rounded-2xl border-2 border-dashed border-emerald-300 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 text-center space-y-1 hover:border-emerald-500 transition-colors"
                >
                  <FiImage size={28} className="mx-auto text-emerald-500" />
                  <p className="text-xs font-black text-slate-900 dark:text-white">🖼️ Photos Folder</p>
                  <p className="text-[10px] text-slate-400">Drop .jpg, .png here ({droppedCounts.photos})</p>
                </div>

                {/* Recycle Bin */}
                <div
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, 'trash')}
                  className="p-4 rounded-2xl border-2 border-dashed border-rose-300 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 text-center space-y-1 hover:border-rose-500 transition-colors"
                >
                  <FiTrash2 size={28} className="mx-auto text-rose-500" />
                  <p className="text-xs font-black text-slate-900 dark:text-white">🗑️ Recycle Bin</p>
                  <p className="text-[10px] text-slate-400">Drop .tmp, .log here ({droppedCounts.trash})</p>
                </div>
              </div>
            </div>
          )}

          {/* PLAYING: LEVEL 4 (RIGHT CLICK CONTEXT MENU) */}
          {gameState === 'playing' && activeLevel === 4 && (
            <div
              onContextMenu={(e) => handleContextMenuTrigger(e, 'blank')}
              className="p-8 h-full flex flex-col justify-between relative"
            >
              {/* Mission Instruction Card */}
              <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-center space-y-1">
                <span className="text-[10px] font-black uppercase text-purple-600 dark:text-purple-400 tracking-wider">
                  Instruction #{rightClickPrompt + 1}
                </span>
                <p className="text-sm font-black text-slate-900 dark:text-white">
                  {RIGHT_CLICK_PROMPTS[rightClickPrompt]?.text}
                </p>
              </div>

              {/* Interactive Desktop Elements */}
              <div className="grid grid-cols-3 gap-6 my-auto text-center">
                <div
                  onContextMenu={(e) => {
                    e.stopPropagation();
                    handleContextMenuTrigger(e, 'folder');
                  }}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-500 cursor-context-menu shadow-sm space-y-1"
                >
                  <FiFolder size={32} className="mx-auto text-amber-500" />
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Project Files</p>
                  <p className="text-[9px] text-slate-400">Right click here</p>
                </div>

                <div
                  onContextMenu={(e) => {
                    e.stopPropagation();
                    handleContextMenuTrigger(e, 'photo');
                  }}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-500 cursor-context-menu shadow-sm space-y-1"
                >
                  <FiImage size={32} className="mx-auto text-emerald-500" />
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Banner.png</p>
                  <p className="text-[9px] text-slate-400">Right click here</p>
                </div>

                <div
                  onContextMenu={(e) => {
                    e.stopPropagation();
                    handleContextMenuTrigger(e, 'doc');
                  }}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-500 cursor-context-menu shadow-sm space-y-1"
                >
                  <FiFileText size={32} className="mx-auto text-blue-500" />
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Report.docx</p>
                  <p className="text-[9px] text-slate-400">Right click here</p>
                </div>
              </div>

              {/* Custom Simulated Context Menu */}
              {showContextMenu && (
                <div
                  style={{ left: `${contextMenuPos.x}px`, top: `${contextMenuPos.y}px` }}
                  className="absolute z-50 w-48 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 animate-in fade-in"
                >
                  {contextMenuPos.targetType === 'folder' && (
                    <>
                      <button onClick={() => handleContextMenuAction('open')} className="w-full px-3.5 py-2 text-left hover:bg-purple-50 dark:hover:bg-purple-900/40 hover:text-purple-600 flex items-center gap-2 cursor-pointer">
                        <span>📂 Open Folder</span>
                      </button>
                      <button onClick={() => handleContextMenuAction('share')} className="w-full px-3.5 py-2 text-left hover:bg-purple-50 dark:hover:bg-purple-900/40 hover:text-purple-600 flex items-center gap-2 cursor-pointer">
                        <span>🔗 Share Link</span>
                      </button>
                    </>
                  )}
                  {contextMenuPos.targetType === 'blank' && (
                    <>
                      <button onClick={() => handleContextMenuAction('new_file')} className="w-full px-3.5 py-2 text-left hover:bg-purple-50 dark:hover:bg-purple-900/40 hover:text-purple-600 flex items-center gap-2 cursor-pointer">
                        <span>➕ Create New File</span>
                      </button>
                      <button onClick={() => handleContextMenuAction('refresh')} className="w-full px-3.5 py-2 text-left hover:bg-purple-50 dark:hover:bg-purple-900/40 hover:text-purple-600 flex items-center gap-2 cursor-pointer">
                        <span>🔄 Refresh Desktop</span>
                      </button>
                    </>
                  )}
                  {contextMenuPos.targetType === 'photo' && (
                    <>
                      <button onClick={() => handleContextMenuAction('rename')} className="w-full px-3.5 py-2 text-left hover:bg-purple-50 dark:hover:bg-purple-900/40 hover:text-purple-600 flex items-center gap-2 cursor-pointer">
                        <span>✏️ Rename File</span>
                      </button>
                      <button onClick={() => handleContextMenuAction('delete')} className="w-full px-3.5 py-2 text-left hover:bg-purple-50 dark:hover:bg-purple-900/40 hover:text-purple-600 flex items-center gap-2 cursor-pointer">
                        <span>🗑️ Delete File</span>
                      </button>
                    </>
                  )}
                  {contextMenuPos.targetType === 'doc' && (
                    <>
                      <button onClick={() => handleContextMenuAction('properties')} className="w-full px-3.5 py-2 text-left hover:bg-purple-50 dark:hover:bg-purple-900/40 hover:text-purple-600 flex items-center gap-2 cursor-pointer">
                        <span>ℹ️ Properties & Details</span>
                      </button>
                      <button onClick={() => handleContextMenuAction('copy')} className="w-full px-3.5 py-2 text-left hover:bg-purple-50 dark:hover:bg-purple-900/40 hover:text-purple-600 flex items-center gap-2 cursor-pointer">
                        <span>📋 Copy File</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* PLAYING: LEVEL 5 (SCROLL WHEEL & ZOOM) */}
          {gameState === 'playing' && activeLevel === 5 && (
            <div className="p-6 h-[420px] overflow-y-auto space-y-6">
              <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-center sticky top-0 z-10 backdrop-blur-xs">
                <p className="text-xs font-black text-indigo-600 dark:text-indigo-400 flex items-center justify-center gap-1.5">
                  <FiArrowDown size={14} className="animate-bounce" />
                  <span>Scroll down with mouse wheel and click each section checkpoint ({scrollScore}/5)</span>
                </p>
              </div>

              {scrollCheckpoints.map((cp) => (
                <div
                  key={cp.id}
                  className={`p-6 rounded-3xl border transition-all ${
                    cp.collected
                      ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">{cp.label}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {cp.collected ? '✅ Checkpoint verified by scrolling!' : 'Click to register this scroll checkpoint'}
                      </p>
                    </div>
                    <button
                      disabled={cp.collected}
                      onClick={() => handleCollectCheckpoint(cp.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        cp.collected
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md'
                      }`}
                    >
                      {cp.collected ? '✓ Verified' : 'Catch Badge'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* COMPLETED RESULTS SCREEN */}
          {gameState === 'completed' && finalMetrics && (
            <div className="text-center p-8 space-y-5 max-w-md mx-auto my-auto animate-in zoom-in-95">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-500 text-white flex items-center justify-center text-3xl shadow-xl shadow-emerald-500/20">
                🏆
              </div>

              <div>
                <h4 className="text-2xl font-black text-slate-900 dark:text-white">
                  Level {finalMetrics.level} Completed!
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Outstanding mouse coordination! Your metrics have been saved.
                </p>
              </div>

              {/* Score Badges */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Accuracy</p>
                  <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                    {finalMetrics.accuracy}%
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">
                    {finalMetrics.reaction_time_ms > 0 ? 'Reaction Time' : 'Drill Score'}
                  </p>
                  <p className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                    {finalMetrics.reaction_time_ms > 0 ? `${finalMetrics.reaction_time_ms}ms` : `${finalMetrics.score} pts`}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setGameState('idle');
                  }}
                  className="flex-1 py-3 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-200 font-bold rounded-2xl text-xs transition-colors cursor-pointer"
                >
                  Retry Level {activeLevel}
                </button>
                {activeLevel < 5 && (
                  <button
                    onClick={() => {
                      setActiveLevel(activeLevel + 1);
                      setGameState('idle');
                    }}
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl text-xs shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                  >
                    Next Level {activeLevel + 1} →
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MouseTrainer;
