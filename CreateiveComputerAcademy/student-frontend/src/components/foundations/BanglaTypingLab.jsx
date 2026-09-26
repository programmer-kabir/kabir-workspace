import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import {
  FiZap, FiClock, FiActivity, FiVolume2, FiVolumeX,
  FiRefreshCw, FiBookOpen, FiCheck, FiLayers,
  FiMaximize2, FiMinimize2
} from 'react-icons/fi';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const BANGLA_LESSONS = [
  {
    level: 'বেসিক শব্দ (Basic Words)',
    text: 'মা বাবা ভাই বোন দেশ নদী ফুল পাখি আকাশ মাটি নদী পানি আকাশ বাতাস'
  },
  {
    level: 'সহজ বাক্য (Simple Sentences)',
    text: 'আমার সোনার বাংলা আমি তোমায় ভালোবাসি। কম্পিউটার শিক্ষা আমাদের জীবনে অত্যন্ত জরুরি।'
  },
  {
    level: 'প্র্যাকটিস প্যারাগ্রাফ (Practice Paragraph)',
    text: 'ক্রিয়েটিভ কম্পিউটার একাডেমিতে আমরা আধুনিক তথ্যপ্রযুক্তি ও কম্পিউটার প্রশিক্ষণ গ্রহণ করছি। নিয়মিত টাইপিং প্র্যাকটিস করলে কাজের গতি বহুগুণ বৃদ্ধি পায় এবং ক্যারিয়ারে সাফল্য আসে।'
  },
  {
    level: 'অফিস ও অফিশিয়াল টাইপিং (Office Work)',
    text: 'গণপ্রজাতন্ত্রী বাংলাদেশ সরকার অনুমোদিত কম্পিউটার ট্রেনিং ইনস্টিটিউট। মাইক্রোসফট ওয়ার্ড, এক্সেল, পাওয়ারপয়েন্ট এবং গ্রাফিক্স ডিজাইন কোর্সে স্বাগতম।'
  }
];

const AVRO_HINTS = [
  { bn: 'ক', en: 'k' }, { bn: 'খ', en: 'kh' }, { bn: 'গ', en: 'g' }, { bn: 'ঘ', en: 'gh' },
  { bn: 'চ', en: 'c' }, { bn: 'ছ', en: 'ch' }, { bn: 'জ', en: 'j' }, { bn: 'ঝ', en: 'jh' },
  { bn: 'ট', en: 'T' }, { bn: 'ঠ', en: 'Th' }, { bn: 'ড', en: 'D' }, { bn: 'ঢ', en: 'Dh' },
  { bn: 'ত', en: 't' }, { bn: 'থ', en: 'th' }, { bn: 'দ', en: 'd' }, { bn: 'ধ', en: 'dh' },
  { bn: 'ন', en: 'n' }, { bn: 'প', en: 'p' }, { bn: 'ফ', en: 'f / ph' }, { bn: 'ব', en: 'b' },
  { bn: 'ভ', en: 'v / bh' }, { bn: 'ম', en: 'm' }, { bn: 'য', en: 'z' }, { bn: 'র', en: 'r' },
  { bn: 'ল', en: 'l' }, { bn: 'শ', en: 'S / sh' }, { bn: 'ষ', en: 'Sh' }, { bn: 'স', en: 's' },
  { bn: 'হ', en: 'h' }, { bn: 'ড়', en: 'R' }, { bn: 'ঢ়', en: 'Rh' }, { bn: 'য়', en: 'y' }
];

const BanglaTypingLab = ({ user, onProgressUpdate, isMasterFullscreen, toggleMasterFullscreen }) => {
  const [activeLessonIdx, setActiveLessonIdx] = useState(0);
  const [targetText, setTargetText] = useState(BANGLA_LESSONS[0].text);
  const [userInput, setUserInput] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [isTestComplete, setIsTestComplete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPhoneticChart, setShowPhoneticChart] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const timerRef = useRef(null);

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

  const loadLesson = (idx) => {
    setActiveLessonIdx(idx);
    setTargetText(BANGLA_LESSONS[idx].text);
    setUserInput('');
    setStartTime(null);
    setElapsedSeconds(0);
    setWpm(0);
    setAccuracy(100);
    setIsTestComplete(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  useEffect(() => {
    loadLesson(0);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Timer
  useEffect(() => {
    if (startTime && !isTestComplete) {
      timerRef.current = setInterval(() => {
        const secs = Math.max(1, Math.floor((Date.now() - startTime) / 1000));
        setElapsedSeconds(secs);
        const words = userInput.trim().split(/\s+/).filter(Boolean).length;
        const currentWpm = Math.round((words / (secs / 60)));
        setWpm(currentWpm);
      }, 500);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startTime, isTestComplete, userInput]);

  const handleInputChange = (e) => {
    if (isTestComplete) return;
    const val = e.target.value;

    if (!startTime) {
      setStartTime(Date.now());
    }

    setUserInput(val);

    // Accuracy
    const totalTyped = val.length;
    let correct = 0;
    for (let i = 0; i < totalTyped; i++) {
      if (val[i] === targetText[i]) correct++;
    }
    const acc = totalTyped > 0 ? Math.round((correct / totalTyped) * 100) : 100;
    setAccuracy(acc);

    // Completion
    if (val.length >= targetText.length) {
      finishBanglaTest(val, acc);
    }
  };

  const finishBanglaTest = async (finalInput, finalAcc) => {
    setIsTestComplete(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const totalSecs = Math.max(1, Math.floor((Date.now() - (startTime || Date.now())) / 1000));
    const words = finalInput.trim().split(/\s+/).filter(Boolean).length;
    const finalWpm = Math.round(words / (totalSecs / 60)) || Math.round((finalInput.length / 5) / (totalSecs / 60));

    confetti({
      particleCount: 75,
      spread: 60,
      origin: { y: 0.6 }
    });

    if (user?.id) {
      try {
        setIsSaving(true);
        const res = await axios.post(`${API_BASE}api/student/foundations/save_typing_session.php`, {
          user_id: user.id,
          language: 'bn_avro',
          difficulty_level: 'words',
          wpm: finalWpm,
          cpm: Math.round((finalInput.length / totalSecs) * 60),
          accuracy_percent: finalAcc,
          raw_wpm: finalWpm,
          mistakes_count: Math.max(0, finalInput.length - Math.round(finalInput.length * (finalAcc / 100))),
          duration_seconds: totalSecs
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
  };

  const progressPercent = Math.min(100, Math.round((userInput.length / targetText.length) * 100)) || 0;
  const nextBanglaChar = targetText[userInput.length] || '';
  const avroKeyHint = AVRO_HINTS.find(h => h.bn === nextBanglaChar)?.en || (nextBanglaChar === ' ' ? 'SPACE' : '');

  return (
    <div
      ref={containerRef}
      className={`transition-all duration-300 ${
        isFullscreen
          ? 'fixed inset-0 z-50 bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 p-4 sm:p-8 overflow-y-auto w-screen h-screen space-y-6 flex flex-col justify-start'
          : 'space-y-6'
      }`}
    >
      {/* Header with Avro Toggle and Fullscreen */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-emerald-50/90 dark:bg-emerald-950/40 backdrop-blur-md rounded-2xl border border-emerald-200 dark:border-emerald-800 shadow-sm ${isCurrentlyFullscreen ? 'w-full mx-auto' : ''}`}>
        <div>
          <h3 className="text-base sm:text-lg font-black text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
            <span>🇧🇩 বাংলা টাইপিং স্পিড ল্যাব (Bangla Typing Master)</span>
          </h3>
          <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5 font-medium">
            অভ্র (Avro Phonetic) অথবা বিজয় কিবোর্ড দিয়ে দ্রুত বাংলা টাইপ করা শিখুন।
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowPhoneticChart(!showPhoneticChart)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <FiBookOpen size={14} />
            <span>{showPhoneticChart ? 'Hide Chart' : 'Avro Chart'}</span>
          </button>

          <button
            onClick={handleToggleFullscreen}
            title={isCurrentlyFullscreen ? "Exit Fullscreen (Esc)" : "Full Page / Fullscreen"}
            className="p-2 bg-emerald-100 hover:bg-emerald-600 text-emerald-800 hover:text-white dark:bg-emerald-950 dark:text-emerald-300 dark:hover:bg-emerald-600 dark:hover:text-white rounded-xl text-xs font-bold border border-emerald-300 dark:border-emerald-800 transition-all cursor-pointer flex items-center gap-1.5"
          >
            {isCurrentlyFullscreen ? <FiMinimize2 size={15} /> : <FiMaximize2 size={15} />}
            <span>{isCurrentlyFullscreen ? 'Exit Full' : 'Full Page'}</span>
          </button>
        </div>
      </div>

      {/* Phonetic Cheat Sheet Accordion */}
      {showPhoneticChart && (
        <div className={`p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg space-y-3 animate-in fade-in ${isCurrentlyFullscreen ? 'w-full mx-auto' : ''}`}>
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              💡 Avro Phonetic Quick Reference Chart (অভ্র কিবোর্ড রেফারেন্স)
            </p>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">Bangla Phonetic Layout</span>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 text-center text-xs">
            {AVRO_HINTS.map((item, idx) => (
              <div key={idx} className="p-2 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 hover:border-emerald-400 transition-all">
                <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">{item.bn}</p>
                <p className="text-[10px] font-mono text-slate-400 mt-0.5">{item.en}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lesson Selector Pills */}
      <div className={`flex flex-wrap gap-2 ${isCurrentlyFullscreen ? ' w-full mx-auto' : ''}`}>
        {BANGLA_LESSONS.map((les, idx) => (
          <button
            key={idx}
            onClick={() => loadLesson(idx)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeLessonIdx === idx
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/25 scale-102 font-black'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
          >
            {les.level}
          </button>
        ))}
      </div>

      {/* Live Stats HUD */}
      <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 ${isCurrentlyFullscreen ? ' w-full mx-auto' : ''}`}>
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5 transition-all hover:border-emerald-400">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 rounded-2xl">
            <FiZap size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Typing Speed</p>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {wpm} <span className="text-xs font-bold text-slate-400">WPM</span>
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5 transition-all hover:border-indigo-400">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 rounded-2xl">
            <FiActivity size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Accuracy</p>
            <p className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400">
              {accuracy}<span className="text-xs font-bold text-slate-400">%</span>
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5 transition-all hover:border-amber-400">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 rounded-2xl">
            <FiClock size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Elapsed Time</p>
            <p className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
              {elapsedSeconds}<span className="text-xs font-bold text-slate-400">s</span>
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5 transition-all hover:border-cyan-400">
          <div className="p-3 bg-cyan-50 dark:bg-cyan-950/70 text-cyan-600 dark:text-cyan-400 rounded-2xl">
            <span className="text-xl">📊</span>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Progress</p>
            <p className="text-2xl sm:text-3xl font-black text-cyan-600 dark:text-cyan-400">
              {progressPercent}<span className="text-xs font-bold text-slate-400">%</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Bangla Typing Arena */}
      <div
        onClick={() => inputRef.current?.focus()}
        className={`rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl relative cursor-text transition-all overflow-hidden flex flex-col justify-between ${
          isCurrentlyFullscreen ? ' w-full mx-auto p-6 sm:p-10 min-h-[300px]' : 'p-6 sm:p-8 space-y-4'
        }`}
      >
        {/* Top Progress Bar */}
        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mb-4 overflow-hidden">
          <div
            style={{ width: `${progressPercent}%` }}
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 transition-all duration-100 shadow-[0_0_8px_rgba(16,185,129,0.6)]"
          ></div>
        </div>

        {/* Text Display with Dynamic Bangla Cursor */}
        <p className={`font-semibold leading-loose select-none text-slate-400 dark:text-slate-500 break-words ${
          isCurrentlyFullscreen ? 'text-2xl sm:text-3xl lg:text-4xl' : 'text-lg sm:text-2xl'
        }`}>
          {targetText.split('').map((char, index) => {
            const isTyped = index < userInput.length;
            const isCorrect = isTyped && userInput[index] === char;
            const isCurrent = index === userInput.length;

            return (
              <span
                key={index}
                className={`transition-all duration-75 relative ${
                  isCurrent
                    ? 'bg-emerald-600 text-white px-1 py-0.5 rounded-md shadow-md shadow-emerald-500/40 ring-2 ring-emerald-400 font-bold animate-pulse'
                    : isTyped
                    ? isCorrect
                      ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                      : 'text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/70 rounded-xs'
                    : ''
                }`}
              >
                {char}
              </span>
            );
          })}
        </p>

        {/* Avro Live Next Character Hint Bubble */}
        {!isTestComplete && nextBanglaChar && (
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 font-black flex items-center justify-center">
                👉
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                পরের অক্ষর: <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-black border border-emerald-200 dark:border-emerald-800">[{nextBanglaChar}]</span>
              </span>
              {avroKeyHint && (
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  → অভ্র কিবোর্ডে চাপুন: <strong className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">[{avroKeyHint}]</strong>
                </span>
              )}
            </div>

            <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-xs font-bold">
              {userInput.length} / {targetText.length} অক্ষর
            </span>
          </div>
        )}

        {/* Live Textarea Input */}
        <textarea
          ref={inputRef}
          rows="2"
          placeholder="এখানে বাংলা টাইপ শুরু করুন..."
          value={userInput}
          onChange={handleInputChange}
          className="w-full mt-4 p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-base sm:text-lg font-medium dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all shadow-inner"
          disabled={isTestComplete}
        ></textarea>

        {isTestComplete && (
          <div className="mt-6 p-6 sm:p-8 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-4 animate-in zoom-in-95">
            <h4 className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
              🎉 দারুণ! {wpm} WPM গতিতে বাংলা টাইপিং সম্পন্ন হয়েছে!
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto font-medium">
              আপনার বাংলা টাইপিং স্পিড ক্রমশ বৃদ্ধি পাচ্ছে। নিয়মিত প্র্যাকটিস অব্যাহত রাখুন।
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => loadLesson(activeLessonIdx)}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg transition-all cursor-pointer hover:scale-105 active:scale-95"
              >
                আবার প্র্যাকটিস করুন
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BanglaTypingLab;
