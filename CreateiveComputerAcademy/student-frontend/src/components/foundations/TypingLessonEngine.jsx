import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FiClock, FiZap, FiActivity, FiVolume2, FiVolumeX,
  FiRefreshCw, FiArrowLeft, FiAward, FiAlertCircle
} from 'react-icons/fi';
import VirtualMechanicalKeyboard from './VirtualMechanicalKeyboard';
import VisualHandGuide from './VisualHandGuide';
import TypingResultModal from './TypingResultModal';

// Web Audio Mechanical Switch Synthesizer
const playKeySound = (enabled = true, isError = false, isSpace = false) => {
  if (!enabled) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (isError) {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, ctx.currentTime);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } else if (isSpace) {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.06);
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(680 + Math.random() * 80, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.04);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    }

    osc.connect(gain);
    gain.connect(ctx.destination);
  } catch (e) { }
};

const TypingLessonEngine = ({
  lesson,
  exercise,
  isFullscreen = false,
  onFinishExercise,
  onBackToMenu
}) => {
  const targetText = exercise?.text || '';
  const isTimedExam = exercise?.type === 'exam';
  const durationLimitSec = exercise?.durationSec || 60;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [typedChars, setTypedChars] = useState([]); // Array of { char, correct, entered }
  const [isError, setIsError] = useState(false);
  const [lastPressedKey, setLastPressedKey] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Time & Tracking
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [totalErrors, setTotalErrors] = useState(0);
  const [keyErrorMap, setKeyErrorMap] = useState({}); // { 'e': 3, 'r': 1 }
  const [isCompleted, setIsCompleted] = useState(false);
  const [resultStats, setResultStats] = useState(null);

  const containerRef = useRef(null);
  const timerRef = useRef(null);
  const textContainerRef = useRef(null);
  const activeCharRef = useRef(null);

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

  // Reset exercise state when exercise changes
  useEffect(() => {
    setCurrentIndex(0);
    setTypedChars([]);
    setIsError(false);
    setLastPressedKey('');
    setStartTime(null);
    setElapsedTime(0);
    setTotalErrors(0);
    setKeyErrorMap({});
    setIsCompleted(false);
    setResultStats(null);

    if (textContainerRef.current) {
      textContainerRef.current.scrollTop = 0;
    }

    if (containerRef.current) {
      containerRef.current.focus();
    }
  }, [exercise?.id, targetText]);

  // Timer Tick
  useEffect(() => {
    if (startTime && !isCompleted) {
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const seconds = Math.floor((now - startTime) / 1000);
        setElapsedTime(seconds);

        if (isTimedExam && seconds >= durationLimitSec) {
          finishDrill(currentIndex, totalErrors, keyErrorMap, seconds);
        }
      }, 500);
    }
    return () => clearInterval(timerRef.current);
  }, [startTime, isCompleted, isTimedExam, durationLimitSec, currentIndex, totalErrors, keyErrorMap]);

  // Finish Exercise & Compute Metrics
  const finishDrill = useCallback((finalIndex, finalErrors, errMap, finalTimeSec) => {
    clearInterval(timerRef.current);
    setIsCompleted(true);

    const validTimeSec = Math.max(1, finalTimeSec);
    const minutes = validTimeSec / 60;
    const totalTyped = finalIndex + finalErrors;

    const grossWpm = Math.round((totalTyped / 5) / minutes) || 0;
    const netWpm = Math.max(0, Math.round(((totalTyped - finalErrors) / 5) / minutes)) || 0;
    const accuracy = totalTyped > 0 ? Math.max(0, Math.round(((totalTyped - finalErrors) / totalTyped) * 100)) : 100;

    // Extract Top 3 Problem Keys
    const weakKeys = Object.entries(errMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([k, errs]) => ({ key: k, errors: errs }));

    const stats = {
      grossWpm,
      netWpm,
      accuracy,
      errors: finalErrors,
      timeSpentSec: validTimeSec,
      weakKeys
    };

    setResultStats(stats);
  }, []);

  // Keyboard Event Handler
  const handleKeyDown = (e) => {
    if (isCompleted) return;

    // Ignore modifier standalone keys
    if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab'].includes(e.key)) {
      return;
    }

    // Start timer on first keystroke
    if (!startTime) {
      setStartTime(Date.now());
    }

    const expectedChar = targetText[currentIndex];
    const enteredKey = e.key;
    setLastPressedKey(enteredKey);

    // Prevent default scroll on space
    if (e.key === ' ') {
      e.preventDefault();
    }

    if (enteredKey === expectedChar) {
      // Correct Key
      playKeySound(soundEnabled, false, enteredKey === ' ');
      setIsError(false);

      setTypedChars(prev => [...prev, { char: expectedChar, correct: true, entered: enteredKey }]);
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);

      // Check if finished full text
      if (nextIdx >= targetText.length) {
        const finalTime = startTime ? Math.floor((Date.now() - startTime) / 1000) : 1;
        finishDrill(nextIdx, totalErrors, keyErrorMap, finalTime);
      }
    } else {
      // Wrong Key
      playKeySound(soundEnabled, true, false);
      setIsError(true);
      setTotalErrors(prev => prev + 1);

      setKeyErrorMap(prev => ({
        ...prev,
        [expectedChar]: (prev[expectedChar] || 0) + 1
      }));

      // Vibrate / Wobble feedback
      setTimeout(() => setIsError(false), 300);
    }
  };

  // Live Stats
  const liveTimeSec = elapsedTime || 1;
  const liveTotalTyped = currentIndex + totalErrors;
  const liveGrossWpm = liveTotalTyped > 0 ? Math.round((liveTotalTyped / 5) / (liveTimeSec / 60)) : 0;
  const liveAccuracy = liveTotalTyped > 0 ? Math.max(0, Math.round(((liveTotalTyped - totalErrors) / liveTotalTyped) * 100)) : 100;
  const progressPercent = Math.min(100, Math.round((currentIndex / (targetText.length || 1)) * 100));

  const activeChar = targetText[currentIndex] || '';

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
      {/* ── TOP SECTION: HUD NAVIGATION & LIVE METRICS ─────────────── */}
      <div className="space-y-2 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 sm:p-3.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 shadow-xs backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToMenu}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              title="Return to Curriculum Menu"
            >
              <FiArrowLeft size={16} />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-[10px] font-black uppercase">
                  {exercise?.id} • {exercise?.type?.toUpperCase()}
                </span>
                <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                  {exercise?.title}
                </h2>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                Lesson {lesson?.lessonNumber}: {lesson?.title}
              </p>
            </div>
          </div>

          {/* Live Gauges */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40">
              <FiZap className="text-indigo-500" size={13} />
              <div className="text-left">
                <p className="text-[8px] font-bold text-indigo-500 uppercase">Speed</p>
                <p className="text-xs font-black text-indigo-700 dark:text-indigo-300">{liveGrossWpm} WPM</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40">
              <FiActivity className="text-emerald-500" size={13} />
              <div className="text-left">
                <p className="text-[8px] font-bold text-emerald-500 uppercase">Accuracy</p>
                <p className="text-xs font-black text-emerald-700 dark:text-emerald-300">{liveAccuracy}%</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/40">
              <FiClock className="text-amber-500" size={13} />
              <div className="text-left">
                <p className="text-[8px] font-bold text-amber-500 uppercase">
                  {isTimedExam ? 'Remaining' : 'Time'}
                </p>
                <p className="text-xs font-black text-amber-700 dark:text-amber-300">
                  {isTimedExam ? `${Math.max(0, durationLimitSec - elapsedTime)}s` : `${elapsedTime}s`}
                </p>
              </div>
            </div>

            {/* Sound Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              title={soundEnabled ? 'Mute Sound' : 'Enable Mechanical Sound'}
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

      {/* ── MIDDLE SECTION: FULL-HEIGHT JITTER-FREE TYPING DISPLAY ─ */}
      <div className="flex-1 min-h-0 flex flex-col my-1 relative">
        <div
          className={`p-5 sm:p-6 md:p-7 rounded-3xl bg-white dark:bg-slate-900 border transition-all duration-200 shadow-md relative flex flex-col justify-between flex-1 min-h-0 overflow-hidden ${
            isError
              ? 'border-rose-500 ring-4 ring-rose-500/20'
              : 'border-slate-200 dark:border-slate-800'
          }`}
        >
          {/* Top Live Progress Info inside the card */}
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 dark:text-slate-500 shrink-0 mb-2">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Practice Stream
            </span>
            <span>Progress: {currentIndex} / {targetText.length} chars ({progressPercent}%)</span>
          </div>

          {/* Scrollable, Monospace Text Stream with Fixed-Width Active Caret */}
          <div
            ref={textContainerRef}
            className="flex-1 min-h-0 overflow-y-auto scrollbar-none select-none py-2 px-1"
          >
            <div className="font-mono text-xl sm:text-2xl md:text-3xl leading-relaxed sm:leading-loose tracking-wider text-left break-words w-full mx-auto px-2 sm:px-4">
              {targetText.split('').map((char, idx) => {
                const isTyped = idx < currentIndex;
                const isCurrent = idx === currentIndex;

                if (isTyped) {
                  return (
                    <span
                      key={idx}
                      className="text-emerald-500 dark:text-emerald-400 font-bold transition-colors"
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
                          ? 'bg-rose-500 text-white ring-2 ring-rose-300'
                          : 'bg-indigo-600 text-white ring-2 ring-indigo-400 animate-pulse'
                      }`}
                      style={{ minWidth: '1.2ch' }}
                    >
                      {char === ' ' ? '␣' : char}
                    </span>
                  );
                }

                // Upcoming un-typed text
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

          {/* Bottom Footer inside the card */}
          <div className="pt-2.5 flex items-center justify-between text-[11px] font-bold text-slate-400 border-t border-slate-100 dark:border-slate-800/80 mt-auto shrink-0">
            <span>⚡ Keep your eyes on the screen, not the physical keyboard</span>
            <span>💡 Press keys on your keyboard to type</span>
          </div>
        </div>
      </div>

      {/* ── BOTTOM SECTION: 3D KEYBOARD & 10-FINGER HAND GUIDE ─────── */}
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

      {/* ── RESULT MODAL ─────────────────────────────────────────── */}
      <TypingResultModal
        isOpen={isCompleted}
        stats={resultStats}
        exercise={exercise}
        lesson={lesson}
        onNext={() => onFinishExercise(exercise, resultStats, true)}
        onRetry={() => {
          setCurrentIndex(0);
          setTypedChars([]);
          setIsError(false);
          setStartTime(null);
          setElapsedTime(0);
          setTotalErrors(0);
          setKeyErrorMap({});
          setIsCompleted(false);
          setResultStats(null);
        }}
        onReturnToMenu={onBackToMenu}
      />
    </div>
  );
};

export default TypingLessonEngine;
