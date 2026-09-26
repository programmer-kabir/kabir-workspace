import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import {
  FiCommand, FiCopy, FiCheck, FiRefreshCw, FiZap, FiAward,
  FiMaximize2, FiMinimize2
} from 'react-icons/fi';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const SHORTCUT_MISSIONS = [
  {
    id: 'copy',
    title: 'Copy Selected Text',
    keys: ['Control', 'c'],
    displayKeys: ['Ctrl', 'C'],
    desc: 'Copies highlighted text or files to your clipboard buffer.',
    tip: 'Hold [Ctrl] with your left pinky and press [C] with your left index finger.'
  },
  {
    id: 'paste',
    title: 'Paste From Clipboard',
    keys: ['Control', 'v'],
    displayKeys: ['Ctrl', 'V'],
    desc: 'Pastes previously copied text or files at the cursor location.',
    tip: 'Hold [Ctrl] and tap [V].'
  },
  {
    id: 'undo',
    title: 'Undo Last Mistake',
    keys: ['Control', 'z'],
    displayKeys: ['Ctrl', 'Z'],
    desc: 'Instantly reverses your last edit, typing error, or deleted file.',
    tip: 'Hold [Ctrl] and tap [Z]. Life-saving shortcut!'
  },
  {
    id: 'select_all',
    title: 'Select Everything (All)',
    keys: ['Control', 'a'],
    displayKeys: ['Ctrl', 'A'],
    desc: 'Selects all text on a page or all files inside a folder at once.',
    tip: 'Hold [Ctrl] and tap [A].'
  },
  {
    id: 'cut',
    title: 'Cut Selected Text',
    keys: ['Control', 'x'],
    displayKeys: ['Ctrl', 'X'],
    desc: 'Removes the selected item and places it into the clipboard.',
    tip: 'Hold [Ctrl] and tap [X].'
  },
  {
    id: 'save',
    title: 'Quick Save Document',
    keys: ['Control', 's'],
    displayKeys: ['Ctrl', 'S'],
    desc: 'Saves your current file in Word, Excel, Photoshop, or VS Code.',
    tip: 'Hold [Ctrl] and tap [S].'
  },
  {
    id: 'find',
    title: 'Search & Find',
    keys: ['Control', 'f'],
    displayKeys: ['Ctrl', 'F'],
    desc: 'Opens the search bar to find words in any browser page or document.',
    tip: 'Hold [Ctrl] and tap [F].'
  }
];

const ShortcutsTrainer = ({ user, onProgressUpdate, isMasterFullscreen, toggleMasterFullscreen }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [pressedKeys, setPressedKeys] = useState({});
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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

  const currMission = SHORTCUT_MISSIONS[currentIdx];

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isCompleted) return;

      const keyName = e.key;
      setPressedKeys(prev => ({ ...prev, [keyName]: true }));

      // Check if current shortcut combination is satisfied
      if (currMission) {
        const isCtrlReq = currMission.keys.includes('Control');
        const reqKey = currMission.keys.find(k => k !== 'Control')?.toLowerCase();

        if (isCtrlReq && e.ctrlKey && e.key.toLowerCase() === reqKey) {
          e.preventDefault();
          handleMissionSuccess();
        }
      }
    };

    const handleKeyUp = (e) => {
      const keyName = e.key;
      setPressedKeys(prev => {
        const copy = { ...prev };
        delete copy[keyName];
        return copy;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [currentIdx, isCompleted, currMission]);

  const handleMissionSuccess = async () => {
    toast.success(`✓ Awesome! Shortcut [${currMission.displayKeys.join(' + ')}] Executed!`, { duration: 1500 });
    const nextIdx = currentIdx + 1;
    setScore(prev => prev + 1);

    if (nextIdx >= SHORTCUT_MISSIONS.length) {
      setIsCompleted(true);
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });

      if (user?.id) {
        try {
          setIsSaving(true);
          const res = await axios.post(`${API_BASE}api/student/foundations/save_mouse_drill.php`, {
            user_id: user.id,
            drill_type: 'shortcuts_trainer',
            level_no: 1,
            score: SHORTCUT_MISSIONS.length,
            accuracy_percent: 100,
            reaction_time_ms: 0,
            mistakes_count: 0,
            duration_seconds: 45
          });
          if (res.data?.data?.new_badges?.length > 0) {
            res.data.data.new_badges.forEach(b => {
              toast.success(`🎉 New Badge: ${b.icon} ${b.title}!`, { duration: 3000 });
            });
          }
          if (onProgressUpdate) onProgressUpdate();
        } catch (err) {
          console.error(err);
        } finally {
          setIsSaving(false);
        }
      }
    } else {
      setCurrentIdx(nextIdx);
    }
  };

  const restartTrainer = () => {
    setCurrentIdx(0);
    setScore(0);
    setIsCompleted(false);
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
      {/* Header */}
      <div className={`p-4 bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl border border-indigo-200 dark:border-indigo-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${isCurrentlyFullscreen ? 'max-w-6xl w-full mx-auto' : ''}`}>
        <div>
          <h3 className="text-base sm:text-lg font-black text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
            <span>⚡ Essential OS & Keyboard Shortcuts Trainer</span>
          </h3>
          <p className="text-xs text-indigo-700 dark:text-indigo-400 mt-0.5">
            Press the actual keys on your physical keyboard to practice essential computer shortcuts.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          <div className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-xs">
            Progress: {currentIdx + 1} / {SHORTCUT_MISSIONS.length}
          </div>

          <button
            onClick={handleToggleFullscreen}
            title={isCurrentlyFullscreen ? "Exit Fullscreen (Esc)" : "Full Page / Fullscreen"}
            className="p-2 bg-indigo-100 hover:bg-indigo-600 text-indigo-800 hover:text-white dark:bg-indigo-950 dark:text-indigo-300 dark:hover:bg-indigo-600 dark:hover:text-white rounded-xl text-xs font-bold border border-indigo-300 dark:border-indigo-800 transition-all cursor-pointer flex items-center gap-1.5"
          >
            {isCurrentlyFullscreen ? <FiMinimize2 size={15} /> : <FiMaximize2 size={15} />}
            <span>{isCurrentlyFullscreen ? 'Exit Full' : 'Full Page'}</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Stage */}
      {!isCompleted && currMission ? (
        <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-xl text-center space-y-6">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">
              Mission #{currentIdx + 1} of {SHORTCUT_MISSIONS.length}
            </span>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white">
              {currMission.title}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              {currMission.desc}
            </p>
          </div>

          {/* Glowing Target Shortcut Key Pills */}
          <div className="flex items-center justify-center gap-3 py-4">
            {currMission.displayKeys.map((key, kIdx) => (
              <React.Fragment key={kIdx}>
                <div className="px-6 py-4 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white font-mono font-black text-2xl shadow-xl border border-slate-700 ring-2 ring-indigo-500/50 animate-pulse">
                  {key}
                </div>
                {kIdx < currMission.displayKeys.length - 1 && (
                  <span className="text-2xl font-black text-slate-400">+</span>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Interactive Hint Banner */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            💡 <strong>Pro Tip:</strong> {currMission.tip}
          </div>

          <p className="text-xs text-slate-400 font-medium animate-bounce">
            ⌨️ Press these keys on your physical keyboard now!
          </p>
        </div>
      ) : (
        /* Completion Card */
        <div className="rounded-3xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/20 p-8 shadow-xl text-center space-y-4 animate-in zoom-in-95">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-600 text-white flex items-center justify-center text-3xl shadow-xl shadow-emerald-500/20">
            🪄
          </div>
          <h4 className="text-2xl font-black text-emerald-900 dark:text-emerald-100">
            Congratulations! You are a Shortcuts Wizard!
          </h4>
          <p className="text-xs text-emerald-700 dark:text-emerald-400 max-w-md mx-auto">
            You have successfully mastered the most productive keyboard shortcuts in computing.
          </p>
          <button
            onClick={restartTrainer}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
          >
            Practice Shortcuts Again
          </button>
        </div>
      )}
    </div>
  );
};

export default ShortcutsTrainer;
