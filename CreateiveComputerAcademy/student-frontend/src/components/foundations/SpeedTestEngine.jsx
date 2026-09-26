import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
  FiClock, FiZap, FiActivity, FiVolume2, FiVolumeX,
  FiRefreshCw, FiArrowLeft, FiAward, FiSettings, FiSliders,
  FiPrinter, FiCheckCircle
} from 'react-icons/fi';
import VirtualMechanicalKeyboard from './VirtualMechanicalKeyboard';
import VisualHandGuide from './VisualHandGuide';
import TypingCertificateModal from './TypingCertificateModal';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

// ── Web Audio Synthesizer (Singleton Pattern) ─────────────────────────
let sharedAudioCtx = null;

const getAudioContext = () => {
  if (!sharedAudioCtx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) sharedAudioCtx = new AudioCtx();
  }
  if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume();
  }
  return sharedAudioCtx;
};

const playSwitchSound = (soundProfile = 'mechanical', enabled = true, isError = false, isSpace = false) => {
  if (!enabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (isError) {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, ctx.currentTime);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } else if (soundProfile === 'typewriter') {
      // Vintage Typewriter Clack
      osc.type = 'square';
      osc.frequency.setValueAtTime(isSpace ? 280 : 750 + Math.random() * 120, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } else if (soundProfile === 'soft') {
      // Quiet Laptop Key
      osc.type = 'sine';
      osc.frequency.setValueAtTime(isSpace ? 220 : 440 + Math.random() * 40, ctx.currentTime);
      gain.gain.setValueAtTime(0.09, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.03);
      osc.start();
      osc.stop(ctx.currentTime + 0.03);
    } else {
      // Classic Mechanical Blue Switch Click
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(isSpace ? 320 : 680 + Math.random() * 80, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.04);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    }

    osc.connect(gain);
    gain.connect(ctx.destination);
  } catch (e) {
    // Ignore audio autoplay restrictions
  }
};

const SpeedTestEngine = ({
  passage,
  durationSec = 120,
  user,
  isFullscreen = false,
  onExit,
  onSessionComplete
}) => {
  const targetText = passage?.text || '';
  const isTimed = durationSec > 0;

  // Typing Mode: 'strict_backspace' | 'instant_lock' | 'flow'
  const [engineMode, setEngineMode] = useState('strict_backspace');
  const [soundProfile, setSoundProfile] = useState('mechanical'); // 'mechanical' | 'typewriter' | 'soft'
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Engine state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [typedChars, setTypedChars] = useState([]); // Array of { char, correct, entered }
  const [isError, setIsError] = useState(false);
  const [lastPressedKey, setLastPressedKey] = useState('');

  // Time & Tracking
  const [startTime, setStartTime] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(durationSec);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [totalErrors, setTotalErrors] = useState(0);
  const [keyErrorMap, setKeyErrorMap] = useState({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [resultStats, setResultStats] = useState(null);
  const [showCertificate, setShowCertificate] = useState(false);

  const containerRef = useRef(null);
  const timerRef = useRef(null);
  const textContainerRef = useRef(null);
  const activeCharRef = useRef(null);

  // Focus container on mount
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.focus();
    }
  }, []);

  // Auto-scroll the text container so active character is always smoothly visible
  useEffect(() => {
    if (activeCharRef.current && textContainerRef.current) {
      activeCharRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest'
      });
    }
  }, [currentIndex]);

  // Timer Tick
  useEffect(() => {
    if (startTime && !isCompleted) {
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - startTime) / 1000);
        setElapsedSeconds(elapsed);

        if (isTimed) {
          const remaining = Math.max(0, durationSec - elapsed);
          setTimeRemaining(remaining);

          if (remaining <= 0) {
            clearInterval(timerRef.current);
            finishExam(currentIndex, totalErrors, keyErrorMap, elapsed);
          }
        }
      }, 500);
    }
    return () => clearInterval(timerRef.current);
  }, [startTime, isCompleted, isTimed, durationSec, currentIndex, totalErrors, keyErrorMap]);

  // Finish Exam & Compute Metrics
  const finishExam = useCallback((finalIndex, finalErrors, errMap, finalTimeSec) => {
    clearInterval(timerRef.current);
    setIsCompleted(true);

    const validTimeSec = Math.max(1, finalTimeSec);
    const minutes = validTimeSec / 60;
    const totalKeystrokes = finalIndex + finalErrors;

    const grossWpm = Math.round((totalKeystrokes / 5) / minutes) || 0;
    // Typing Master Net WPM formula: Gross WPM - (errors penalty)
    const netWpm = Math.max(0, Math.round(((totalKeystrokes - (finalErrors * 5)) / 5) / minutes)) || 0;
    const accuracy = totalKeystrokes > 0 ? Math.max(0, Math.round(((totalKeystrokes - finalErrors) / totalKeystrokes) * 100)) : 100;

    // Top Weak Keys
    const weakKeys = Object.entries(errMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([k, errs]) => ({ key: k, errors: errs }));

    const stats = {
      grossWpm,
      netWpm,
      accuracy,
      errors: finalErrors,
      totalKeystrokes,
      timeSpentSec: validTimeSec,
      weakKeys
    };

    setResultStats(stats);

    // Save to Database
    saveSpeedTestToBackend(stats);

    // Auto-open certificate if criteria met
    const isCertEligible = (durationSec >= 120 || !isTimed) && netWpm >= 20 && accuracy >= 90;
    if (isCertEligible) {
      setShowCertificate(true);
    }
  }, [durationSec, isTimed, passage]);

  // Save to Backend
  const saveSpeedTestToBackend = async (stats) => {
    const userId = user?.id || 0;
    if (!userId) return;

    try {
      const durationLabel = isTimed ? `${Math.round(durationSec / 60)}m` : 'full';
      const difficultyLevel = `speed_test_${durationLabel}_${passage?.category || 'general'}`;

      const payload = {
        user_id: userId,
        language: 'en',
        difficulty_level: difficultyLevel,
        lesson_title: `Speed Test: ${passage?.title || 'Passage'}`,
        wpm: stats.netWpm,
        cpm: stats.netWpm * 5,
        accuracy_percent: stats.accuracy,
        raw_wpm: stats.grossWpm,
        mistakes_count: stats.errors,
        error_keys: stats.weakKeys,
        duration_seconds: stats.timeSpentSec
      };

      await axios.post(`${API_BASE}api/student/foundations/save_typing_session.php`, payload);
      if (onSessionComplete) onSessionComplete(stats);
    } catch (err) {
      console.error('Failed to save speed test session', err);
    }
  };

  // Keyboard Event Handler
  const handleKeyDown = (e) => {
    if (isCompleted) return;

    // Start timer on first keystroke
    if (!startTime) {
      setStartTime(Date.now());
    }

    // Handle Backspace in strict_backspace mode
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (currentIndex > 0) {
        const prevIdx = currentIndex - 1;
        setCurrentIndex(prevIdx);
        setTypedChars(prev => prev.slice(0, -1));
        setIsError(false);
      }
      return;
    }

    // Ignore modifier standalone keys
    if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab'].includes(e.key)) {
      return;
    }

    // Prevent default scroll on space
    if (e.key === ' ') {
      e.preventDefault();
    }

    const expectedChar = targetText[currentIndex];
    const enteredKey = e.key;
    setLastPressedKey(enteredKey);

    if (enteredKey === expectedChar) {
      // ── CORRECT KEY ──────────────────────────────────────────────
      playSwitchSound(soundProfile, soundEnabled, false, enteredKey === ' ');
      setIsError(false);

      setTypedChars(prev => [...prev, { char: expectedChar, correct: true, entered: enteredKey }]);
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);

      // Check if finished entire passage
      if (nextIdx >= targetText.length) {
        const finalTime = startTime ? Math.floor((Date.now() - startTime) / 1000) : 1;
        finishExam(nextIdx, totalErrors, keyErrorMap, finalTime);
      }
    } else {
      // ── WRONG KEY ────────────────────────────────────────────────
      playSwitchSound(soundProfile, soundEnabled, true, false);
      setIsError(true);
      setTotalErrors(prev => prev + 1);

      setKeyErrorMap(prev => ({
        ...prev,
        [expectedChar]: (prev[expectedChar] || 0) + 1
      }));

      if (engineMode === 'instant_lock') {
        // Halt: do not advance until user types the correct key
        setTimeout(() => setIsError(false), 250);
      } else if (engineMode === 'strict_backspace') {
        // Record mistake, advance cursor, user can press Backspace to fix it
        setTypedChars(prev => [...prev, { char: expectedChar, correct: false, entered: enteredKey }]);
        const nextIdx = currentIndex + 1;
        setCurrentIndex(nextIdx);
        setTimeout(() => setIsError(false), 250);

        if (nextIdx >= targetText.length) {
          const finalTime = startTime ? Math.floor((Date.now() - startTime) / 1000) : 1;
          finishExam(nextIdx, totalErrors + 1, keyErrorMap, finalTime);
        }
      } else {
        // Flow Mode: record mistake, advance cursor
        setTypedChars(prev => [...prev, { char: expectedChar, correct: false, entered: enteredKey }]);
        const nextIdx = currentIndex + 1;
        setCurrentIndex(nextIdx);
        setTimeout(() => setIsError(false), 250);

        if (nextIdx >= targetText.length) {
          const finalTime = startTime ? Math.floor((Date.now() - startTime) / 1000) : 1;
          finishExam(nextIdx, totalErrors + 1, keyErrorMap, finalTime);
        }
      }
    }
  };

  // Live Stats calculations
  const liveMinutes = Math.max(1, elapsedSeconds) / 60;
  const liveTotalKeystrokes = currentIndex + totalErrors;
  const liveGrossWpm = liveTotalKeystrokes > 0 ? Math.round((liveTotalKeystrokes / 5) / liveMinutes) : 0;
  const liveNetWpm = liveTotalKeystrokes > 0 ? Math.max(0, Math.round(((liveTotalKeystrokes - (totalErrors * 5)) / 5) / liveMinutes)) : 0;
  const liveAccuracy = liveTotalKeystrokes > 0 ? Math.max(0, Math.round(((liveTotalKeystrokes - totalErrors) / liveTotalKeystrokes) * 100)) : 100;
  const progressPercent = Math.min(100, Math.round((currentIndex / (targetText.length || 1)) * 100));

  const activeChar = targetText[currentIndex] || '';

  // Reset drill
  const handleRetry = () => {
    setCurrentIndex(0);
    setTypedChars([]);
    setIsError(false);
    setLastPressedKey('');
    setStartTime(null);
    setTimeRemaining(durationSec);
    setElapsedSeconds(0);
    setTotalErrors(0);
    setKeyErrorMap({});
    setIsCompleted(false);
    setResultStats(null);
    setShowCertificate(false);
    if (containerRef.current) containerRef.current.focus();
  };

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className={`flex flex-col justify-between focus:outline-none outline-none select-none ${
        isFullscreen
          ? 'h-full flex-1 overflow-hidden gap-2 sm:gap-3 py-1'
          : 'min-h-[calc(100vh-140px)] gap-4 py-2'
      }`}
    >
      {/* ── TOP HUD: EXAM METRICS & SETTINGS ────────────────────────── */}
      <div className="space-y-2 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 sm:p-3.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 shadow-xs backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              onClick={onExit}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              title="Return to Speed Test Hub"
            >
              <FiArrowLeft size={16} />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-[10px] font-black uppercase">
                  {isTimed ? `${Math.round(durationSec / 60)}m Speed Exam` : 'Custom Text'}
                </span>
                <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                  {passage?.title || 'Speed Test'}
                </h2>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                {passage?.category?.toUpperCase()} • {passage?.difficulty?.toUpperCase()}
              </p>
            </div>
          </div>

          {/* Live Speedometer & Gauges */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Net WPM */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40">
              <FiZap className="text-indigo-500" size={13} />
              <div className="text-left">
                <p className="text-[8px] font-bold text-indigo-500 uppercase">Net Speed</p>
                <p className="text-xs font-black text-indigo-700 dark:text-indigo-300">{liveNetWpm} WPM</p>
              </div>
            </div>

            {/* Live Accuracy */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40">
              <FiActivity className="text-emerald-500" size={13} />
              <div className="text-left">
                <p className="text-[8px] font-bold text-emerald-500 uppercase">Accuracy</p>
                <p className="text-xs font-black text-emerald-700 dark:text-emerald-300">{liveAccuracy}%</p>
              </div>
            </div>

            {/* Live Timer */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border ${
              isTimed && timeRemaining <= 10
                ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800 animate-pulse text-rose-600'
                : 'bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900/40'
            }`}>
              <FiClock className={isTimed && timeRemaining <= 10 ? 'text-rose-500' : 'text-amber-500'} size={13} />
              <div className="text-left">
                <p className="text-[8px] font-bold uppercase">
                  {isTimed ? 'Time Left' : 'Elapsed'}
                </p>
                <p className="text-xs font-black font-mono">
                  {isTimed ? `${timeRemaining}s` : `${elapsedSeconds}s`}
                </p>
              </div>
            </div>

            {/* Engine Mode Toggle */}
            <div className="hidden sm:flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setEngineMode('strict_backspace')}
                title="Typing Master Classic: Must fix mistakes with Backspace"
                className={`px-2 py-0.5 rounded-lg cursor-pointer transition-colors ${
                  engineMode === 'strict_backspace'
                    ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-300 shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                Strict
              </button>
              <button
                type="button"
                onClick={() => setEngineMode('flow')}
                title="Flow Mode: Keep typing without stopping"
                className={`px-2 py-0.5 rounded-lg cursor-pointer transition-colors ${
                  engineMode === 'flow'
                    ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-300 shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                Flow
              </button>
            </div>

            {/* Sound Profile Select */}
            <select
              value={soundProfile}
              onChange={(e) => setSoundProfile(e.target.value)}
              className="hidden md:block px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="mechanical">⌨️ Blue Switch</option>
              <option value="typewriter">📜 Typewriter</option>
              <option value="soft">💻 Soft Key</option>
            </select>

            {/* Sound Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              title={soundEnabled ? 'Mute Sound' : 'Enable Switch Sound'}
            >
              {soundEnabled ? <FiVolume2 size={15} /> : <FiVolumeX size={15} />}
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-500 transition-all duration-200"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* ── MIDDLE SECTION: MONOSPACE TYPING STREAM ─────────────────── */}
      <div className="flex-1 min-h-0 flex flex-col my-1 relative">
        <div
          className={`p-5 sm:p-6 md:p-7 rounded-3xl bg-white dark:bg-slate-900 border transition-all duration-200 shadow-md relative flex flex-col justify-between flex-1 min-h-0 overflow-hidden ${
            isError
              ? 'border-rose-500 ring-4 ring-rose-500/20'
              : 'border-slate-200 dark:border-slate-800'
          }`}
        >
          {/* Stream Top Banner */}
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 dark:text-slate-500 shrink-0 mb-2">
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${startTime ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span>{startTime ? 'Exam in Progress' : 'Press any key to start exam'}</span>
            </span>
            <span>Progress: {currentIndex} / {targetText.length} chars ({progressPercent}%)</span>
          </div>

          {/* Scrollable Text Stream */}
          <div
            ref={textContainerRef}
            className="flex-1 min-h-0 overflow-y-auto scrollbar-none select-none py-2 px-1"
          >
            <div className="font-mono text-xl sm:text-2xl md:text-3xl leading-relaxed sm:leading-loose tracking-wider text-left break-words w-full mx-auto px-2 sm:px-4">
              {targetText.split('').map((char, idx) => {
                const typed = typedChars[idx];
                const isCurrent = idx === currentIndex;

                if (typed) {
                  return (
                    <span
                      key={idx}
                      className={`transition-colors font-bold ${
                        typed.correct
                          ? 'text-emerald-500 dark:text-emerald-400'
                          : 'text-rose-500 bg-rose-500/10 line-through'
                      }`}
                    >
                      {char}
                    </span>
                  );
                }

                if (isCurrent) {
                  return (
                    <span
                      key={idx}
                      ref={activeCharRef}
                      className={`inline-block text-center rounded-md font-black shadow-xs transition-colors ${
                        isError
                          ? 'bg-rose-500 text-white ring-2 ring-rose-300 animate-bounce'
                          : 'bg-indigo-600 text-white ring-2 ring-indigo-400 animate-pulse'
                      }`}
                      style={{ minWidth: '1.2ch' }}
                    >
                      {char === ' ' ? '␣' : char}
                    </span>
                  );
                }

                // Upcoming chars
                return (
                  <span
                    key={idx}
                    className="text-slate-400 dark:text-slate-500 opacity-60 font-medium"
                  >
                    {char}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Bottom Stream Status */}
          <div className="pt-2.5 flex items-center justify-between text-[11px] font-bold text-slate-400 border-t border-slate-100 dark:border-slate-800/80 mt-auto shrink-0">
            <span>⚡ Keep a uniform rhythm. Speed follows accuracy.</span>
            <span>💡 Mode: {engineMode === 'strict_backspace' ? 'Strict Backspace' : engineMode === 'instant_lock' ? 'Instant Lock' : 'Flow'}</span>
          </div>
        </div>
      </div>

      {/* ── BOTTOM SECTION: 3D MECHANICAL KEYBOARD & HAND GUIDE ─────── */}
      <div className="mt-auto shrink-0 pb-1 space-y-2">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4">
          <div className="md:col-span-7 xl:col-span-8">
            <VirtualMechanicalKeyboard
              activeChar={activeChar}
              pressedKey={lastPressedKey}
              isError={isError}
            />
          </div>
          <div className="md:col-span-5 xl:col-span-4">
            <VisualHandGuide
              activeChar={activeChar}
              isError={isError}
            />
          </div>
        </div>
      </div>

      {/* ── RESULT MODAL UPON EXAM COMPLETION ───────────────────────── */}
      {isCompleted && resultStats && !showCertificate && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 text-slate-800 dark:text-slate-100 text-center">
            
            <div className="space-y-1">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 text-white flex items-center justify-center text-3xl mx-auto shadow-lg shadow-purple-500/25">
                🏆
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white pt-2">
                Exam Completed!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                "{passage?.title}" • {Math.round(resultStats.timeSpentSec)}s
              </p>
            </div>

            {/* Metrics HUD */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40">
                <p className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400">Net Speed</p>
                <p className="text-2xl font-black text-indigo-700 dark:text-indigo-300 font-mono">⚡ {resultStats.netWpm}</p>
                <p className="text-[9px] text-slate-400">WPM</p>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40">
                <p className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400">Accuracy</p>
                <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 font-mono">🎯 {resultStats.accuracy}%</p>
                <p className="text-[9px] text-slate-400">{resultStats.errors} typos</p>
              </div>

              <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/40">
                <p className="text-[10px] font-black uppercase text-purple-600 dark:text-purple-400">Gross Speed</p>
                <p className="text-2xl font-black text-purple-700 dark:text-purple-300 font-mono">🚀 {resultStats.grossWpm}</p>
                <p className="text-[9px] text-slate-400">WPM</p>
              </div>
            </div>

            {/* Weak Keys */}
            {resultStats.weakKeys?.length > 0 && (
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">Problematic Keys: </span>
                <span className="text-rose-500 font-mono font-bold">
                  {resultStats.weakKeys.map(k => `"${k.key === ' ' ? 'SPC' : k.key}" (${k.errors})`).join(', ')}
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-2">
              {(durationSec >= 120 || !isTimed) && resultStats.netWpm >= 20 && resultStats.accuracy >= 90 ? (
                <button
                  onClick={() => setShowCertificate(true)}
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:opacity-90 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/25 cursor-pointer transition-all flex items-center justify-center gap-2"
                >
                  <FiAward size={16} />
                  <span>View Official Verified Diploma / Certificate</span>
                </button>
              ) : (
                <p className="text-[11px] text-slate-400">
                  Tip: Complete a 2+ minute test with 20+ WPM & 90%+ accuracy to unlock official certificate.
                </p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleRetry}
                  className="flex-1 py-3 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                >
                  <FiRefreshCw size={13} />
                  <span>Retry Exam</span>
                </button>
                <button
                  onClick={onExit}
                  className="flex-1 py-3 px-4 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs cursor-pointer transition-colors"
                >
                  Return to Hub
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── CERTIFICATE MODAL ───────────────────────────────────────── */}
      <TypingCertificateModal
        isOpen={showCertificate}
        onClose={() => setShowCertificate(false)}
        stats={resultStats}
        passageTitle={passage?.title}
        durationSec={durationSec}
        user={user}
      />
    </div>
  );
};

export default SpeedTestEngine;
