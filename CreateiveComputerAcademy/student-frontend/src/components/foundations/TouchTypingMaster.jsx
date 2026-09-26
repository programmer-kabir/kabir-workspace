import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
  FiBookOpen, FiAward, FiLock, FiUnlock, FiPlay,
  FiZap, FiActivity, FiCheckCircle, FiChevronRight,
  FiRotateCcw, FiTarget, FiCompass, FiMaximize2, FiMinimize2
} from 'react-icons/fi';
import { TYPING_LESSONS } from '../../data/typingCurriculum';
import TypingLessonEngine from './TypingLessonEngine';
import { useAuth } from '../../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const TouchTypingMaster = ({
  user: propUser,
  onProgressUpdate,
  isMasterFullscreen,
  toggleMasterFullscreen
}) => {
  const { currentUser } = useAuth();
  // Guaranteed active user object with ID
  const activeUser = propUser || currentUser || (() => {
    try {
      return JSON.parse(localStorage.getItem('cca_student_user') || '{}');
    } catch {
      return {};
    }
  })();

  const userId = activeUser?.id || 0;

  // Dynamic Curriculum loaded from server (with localStorage cache & static fallback)
  const [curriculumLessons, setCurriculumLessons] = useState(() => {
    try {
      const cached = localStorage.getItem('cca_typing_curriculum_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return TYPING_LESSONS;
  });
  const [isCurriculumLoading, setIsCurriculumLoading] = useState(false);

  // Unlocked lessons state - strictly loaded from database
  const [lessonProgress, setLessonProgress] = useState({
    1: { unlocked: true, stars: 0, bestWpm: 0, completed: false }
  });

  // Active Running Drill State
  const [activeLesson, setActiveLesson] = useState(null);
  const [activeExercise, setActiveExercise] = useState(null);
  const [showKeyIntroModal, setShowKeyIntroModal] = useState(false);
  const [selectedLessonForIntro, setSelectedLessonForIntro] = useState(null);

  const [recentSessions, setRecentSessions] = useState([]);

  // Fetch existing progress directly from Database on Mount and after save
  const fetchDbProgress = async () => {
    if (!userId) return;
    try {
      const res = await axios.get(`${API_BASE}api/student/foundations/get_progress.php?user_id=${userId}`);
      if (res.data?.status === 'success') {
        const sessions = res.data?.data?.recent_typing || res.data?.data?.recent_typing_sessions || [];
        const curricList = res.data?.data?.curriculum_progress || [];
        setRecentSessions(sessions);

        const merged = {
          1: { unlocked: true, stars: 0, bestWpm: 0, completed: false }
        };

        // 1. Load from student_typing_curriculum_progress table
        if (Array.isArray(curricList)) {
          curricList.forEach(c => {
            const lId = parseInt(c.lesson_id, 10);
            if (lId) {
              merged[lId] = {
                unlocked: Boolean(parseInt(c.is_unlocked, 10) || lId === 1),
                completed: Boolean(parseInt(c.is_completed, 10)),
                stars: parseInt(c.stars, 10) || 0,
                bestWpm: parseInt(c.best_wpm, 10) || 0,
                bestAccuracy: parseInt(c.best_accuracy, 10) || 0
              };
            }
          });
        }

        // 2. Also incorporate recent typing sessions to ensure complete history & fallback
        sessions.forEach(s => {
          let lId = 1;
          if (s.difficulty_level && s.difficulty_level.startsWith('lesson_')) {
            const parts = s.difficulty_level.replace('lesson_', '').split('_');
            lId = parseInt(parts[0], 10) || 1;
          } else if (s.wpm >= 50) {
            lId = 1;
          }

          if (!isNaN(lId) && lId > 0) {
            const currentStar = s.accuracy_percent >= 98 ? 3 : s.accuracy_percent >= 95 ? 2 : 1;
            merged[lId] = {
              unlocked: true,
              stars: Math.max(merged[lId]?.stars || 0, currentStar),
              bestWpm: Math.max(merged[lId]?.bestWpm || 0, parseInt(s.wpm, 10) || 0),
              completed: true
            };
            // Ensure next lesson is marked unlocked
            if (!merged[lId + 1]) {
              merged[lId + 1] = {
                unlocked: true,
                stars: 0,
                bestWpm: 0,
                completed: false
              };
            } else {
              merged[lId + 1].unlocked = true;
            }
          }
        });

        setLessonProgress(merged);
      }
    } catch (err) {
      console.error('Failed to load typing progress from DB', err);
    }
  };

  // Fetch full curriculum dynamically from Server API
  const fetchCurriculum = async () => {
    setIsCurriculumLoading(true);
    try {
      const res = await axios.get(`${API_BASE}api/student/foundations/get_typing_curriculum.php`);
      if (res.data?.status === 'success' && Array.isArray(res.data?.data) && res.data.data.length > 0) {
        setCurriculumLessons(res.data.data);
        try {
          localStorage.setItem('cca_typing_curriculum_cache', JSON.stringify(res.data.data));
        } catch (e) {}
      }
    } catch (err) {
      console.warn('Could not fetch typing curriculum from server, using local cache/fallback:', err);
    } finally {
      setIsCurriculumLoading(false);
    }
  };

  useEffect(() => {
    fetchCurriculum();
  }, []);

  useEffect(() => {
    fetchDbProgress();
  }, [userId]);

  // Save Progress to Backend on EVERY exercise completion
  const saveExerciseProgressToBackend = async (lessonId, exercise, stats, isLessonComplete = false) => {
    try {
      const lessonTitle = curriculumLessons.find(l => l.id === lessonId)?.title || `Lesson ${lessonId}`;

      const updated = {
        ...lessonProgress,
        [lessonId]: {
          unlocked: true,
          stars: isLessonComplete
            ? Math.max(lessonProgress[lessonId]?.stars || 0, stats?.accuracy >= 98 ? 3 : stats?.accuracy >= 95 ? 2 : 1)
            : (lessonProgress[lessonId]?.stars || 0),
          bestWpm: Math.max(lessonProgress[lessonId]?.bestWpm || 0, stats?.netWpm || 0),
          completed: isLessonComplete ? true : (lessonProgress[lessonId]?.completed || false)
        }
      };

      if (isLessonComplete) {
        // Unlock next lesson
        updated[lessonId + 1] = {
          unlocked: true,
          stars: lessonProgress[lessonId + 1]?.stars || 0,
          bestWpm: lessonProgress[lessonId + 1]?.bestWpm || 0,
          completed: lessonProgress[lessonId + 1]?.completed || false
        };
      }

      setLessonProgress(updated);

      if (userId > 0) {
        // Save direct row into student_typing_sessions and student_typing_curriculum_progress tables in MySQL
        const payload = {
          user_id: userId,
          language: 'en',
          difficulty_level: `lesson_${lessonId}_ex_${exercise.id}`,
          lesson_title: lessonTitle,
          wpm: stats.netWpm || 0,
          cpm: (stats.netWpm || 0) * 5,
          accuracy_percent: stats.accuracy || 100,
          raw_wpm: stats.grossWpm || stats.netWpm || 0,
          mistakes_count: stats.errors || 0,
          error_keys: stats.weakKeys || [],
          duration_seconds: Math.max(5, stats.timeSpentSec || 10)
        };

        const res = await axios.post(`${API_BASE}api/student/foundations/save_typing_session.php`, payload);
        console.log('Typing session saved to DB:', res.data);

        // Refresh DB data so UI is 100% matched with MySQL
        fetchDbProgress();

        if (onProgressUpdate) onProgressUpdate();
      }
    } catch (e) {
      console.error('Failed to save typing progress to DB', e);
    }
  };

  // Handle Starting a Lesson
  const handleStartLesson = (lesson) => {
    setSelectedLessonForIntro(lesson);
    setShowKeyIntroModal(true);
  };

  const handleBeginDrillFromIntro = () => {
    setShowKeyIntroModal(false);
    setActiveLesson(selectedLessonForIntro);
    setActiveExercise(selectedLessonForIntro.exercises[0]);
  };

  // Handle Exercise Progression
  const handleFinishExercise = (exercise, stats, isPassed) => {
    if (!isPassed) return;

    // Check if there is next exercise in the same lesson
    const currentExIdx = activeLesson.exercises.findIndex(e => e.id === exercise.id);
    const isLastExercise = currentExIdx === activeLesson.exercises.length - 1;

    // Save immediately to DB
    saveExerciseProgressToBackend(activeLesson.id, exercise, stats, isLastExercise);

    if (!isLastExercise && currentExIdx >= 0) {
      setActiveExercise(activeLesson.exercises[currentExIdx + 1]);
      toast.success(`Great job! Next: ${activeLesson.exercises[currentExIdx + 1].title}`);
    } else {
      // Completed the full lesson
      toast.success(`🎉 Congratulations! Lesson ${activeLesson.lessonNumber} completed! Next lesson unlocked!`);
      setActiveExercise(null);
      setActiveLesson(null);
    }
  };

  // If inside an active exercise drill
  if (activeLesson && activeExercise) {
    return (
      <TypingLessonEngine
        lesson={activeLesson}
        exercise={activeExercise}
        isFullscreen={isMasterFullscreen}
        onFinishExercise={handleFinishExercise}
        onBackToMenu={() => {
          setActiveExercise(null);
          setActiveLesson(null);
        }}
      />
    );
  }

  const completedLessonsCount = Object.values(lessonProgress).filter(l => l.completed).length;
  const totalStarsCount = Object.values(lessonProgress).reduce((acc, l) => acc + (l.stars || 0), 0);
  const totalLessons = curriculumLessons.length || 14;
  const completionPercent = Math.round((completedLessonsCount / totalLessons) * 100);

  return (
    <div className={`space-y-5 ${isMasterFullscreen ? 'overflow-y-auto flex-1 max-h-full custom-scrollbar pr-1' : ''}`}>
      {/* ── SLEEK COURSE PROGRESS HEADER (Single Non-Duplicate Banner) ── */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1 max-w-xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-[11px] font-black">
            <span>⚡ {totalLessons}-Lesson Curriculum Roadmap</span>
            <span className="px-1.5 py-0.2 rounded bg-purple-600 text-white text-[9px] font-black">
              10-FINGER DRILLS
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Touch Typing Master Curriculum
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Step-by-step muscle memory builder from Home Row basics to symbols and numbers.
          </p>
        </div>

        {/* Live Progress Card */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center gap-4 min-w-[240px]">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {completedLessonsCount} / {totalLessons} Lessons Passed
              </span>
              <span className="font-black font-mono text-purple-600 dark:text-purple-400 text-xs">
                {completionPercent}%
              </span>
            </div>

            {/* Segmented Dots */}
            <div className="flex items-center gap-1 w-full">
              {curriculumLessons.map((l) => {
                const prog = lessonProgress[l.id];
                const isPassed = prog?.completed;
                const isCurUnlocked = prog?.unlocked || l.id === 1;

                return (
                  <div
                    key={l.id}
                    title={`Lesson ${l.id}: ${isPassed ? 'Passed' : isCurUnlocked ? 'Active' : 'Locked'}`}
                    className={`flex-1 h-1.5 rounded-full transition-all ${
                      isPassed
                        ? 'bg-emerald-500'
                        : isCurUnlocked
                        ? 'bg-purple-500 animate-pulse'
                        : 'bg-slate-200 dark:bg-slate-700 opacity-40'
                    }`}
                  />
                );
              })}
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium pt-0.5">
              <span>Touch Typing Master</span>
              <span className="text-amber-500 font-mono font-bold">⭐ {totalStarsCount} / {totalLessons * 3} Stars</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── CURRICULUM GRID (1 col mobile, 2 col tablet, 3 col desktop, 4 col widescreen/fullscreen) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {curriculumLessons.map((lesson) => {
          const prog = lessonProgress[lesson.id];
          const isUnlocked = prog?.unlocked || lesson.id === 1;
          const isCompleted = prog?.completed;
          const stars = prog?.stars || 0;
          const bestWpm = prog?.bestWpm || 0;

          return (
            <div
              key={lesson.id}
              className={`p-5 rounded-3xl border transition-all duration-200 flex flex-col justify-between gap-4 ${
                isUnlocked
                  ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-purple-500/40'
                  : 'bg-slate-50/60 dark:bg-slate-900/30 border-slate-200/60 dark:border-slate-800/40 opacity-70'
              }`}
            >
              {/* Header: Lesson Number & Stars */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-1 rounded-xl text-xs font-black ${
                    isCompleted
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                      : isUnlocked
                      ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                  }`}>
                    Lesson {lesson.lessonNumber}
                  </span>

                  {isUnlocked ? (
                    <div className="flex items-center gap-0.5 text-xs font-mono">
                      <span className={stars >= 1 ? 'text-amber-400' : 'text-slate-300 dark:text-slate-700'}>★</span>
                      <span className={stars >= 2 ? 'text-amber-400' : 'text-slate-300 dark:text-slate-700'}>★</span>
                      <span className={stars >= 3 ? 'text-amber-400' : 'text-slate-300 dark:text-slate-700'}>★</span>
                    </div>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
                      <FiLock size={12} /> Locked
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                  {lesson.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                  {lesson.description}
                </p>

                {/* Target Keys Badges */}
                <div className="flex flex-wrap gap-1 pt-0.5">
                  {lesson.newKeys.map((k, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-bold text-[10px] border border-slate-200 dark:border-slate-700"
                    >
                      {k === ' ' ? 'SPACE' : k.toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>

              {/* Footer: Best Speed, Details & Start Button */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <div>
                  {isUnlocked && bestWpm > 0 ? (
                    <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      ⚡ {bestWpm} <span className="text-[9px] font-normal font-sans">WPM</span>
                    </div>
                  ) : (
                    <div className="text-[10px] font-medium text-slate-400">
                      Target: {lesson.passingCriteria.minWpm} WPM
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Details Button */}
                  <button
                    onClick={() => {
                      setSelectedLessonForIntro(lesson);
                      setShowKeyIntroModal(true);
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1 cursor-pointer transition-all border border-slate-200/60 dark:border-slate-700/60"
                    title="View lesson drills and details"
                  >
                    <FiBookOpen size={12} />
                    <span>Details</span>
                  </button>

                  {isUnlocked ? (
                    <button
                      onClick={() => handleStartLesson(lesson)}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-500 hover:opacity-90 text-white font-black text-xs shadow-xs flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                    >
                      <FiPlay size={11} />
                      <span>{isCompleted ? 'Practice' : 'Start'}</span>
                    </button>
                  ) : (
                    <div className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 text-xs font-bold flex items-center gap-1">
                      <FiLock size={11} />
                      <span>Locked</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── KEY INTRODUCTION MODAL ── */}
      {showKeyIntroModal && selectedLessonForIntro && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 text-slate-800 dark:text-slate-100">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="px-2.5 py-0.5 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-[10px] font-black uppercase">
                  Lesson {selectedLessonForIntro.lessonNumber} Overview
                </span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  {selectedLessonForIntro.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedLessonForIntro.banglaTitle}
                </p>
              </div>

              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 text-white flex items-center justify-center text-2xl shadow-lg shadow-purple-500/20">
                🖐️
              </div>
            </div>

            {/* Finger Instructions Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-3">
              <div className="text-xs font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                <FiCompass size={14} />
                <span>Finger Placement & Guidelines:</span>
              </div>

              {selectedLessonForIntro.fingerIntro?.left && (
                <div className="text-xs text-slate-700 dark:text-slate-300">
                  <span className="font-bold text-slate-900 dark:text-white">✋ Left Hand: </span>
                  {selectedLessonForIntro.fingerIntro.left}
                </div>
              )}

              {selectedLessonForIntro.fingerIntro?.right && (
                <div className="text-xs text-slate-700 dark:text-slate-300">
                  <span className="font-bold text-slate-900 dark:text-white">🤚 Right Hand: </span>
                  {selectedLessonForIntro.fingerIntro.right}
                </div>
              )}

              {selectedLessonForIntro.fingerIntro?.tip && (
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-xs border border-amber-200 dark:border-amber-900/50 flex items-start gap-2">
                  <span>💡</span>
                  <span>{selectedLessonForIntro.fingerIntro.tip}</span>
                </div>
              )}
            </div>

            {/* Past Performance Record for this Lesson */}
            {(() => {
              const prog = lessonProgress[selectedLessonForIntro.id];
              const isCompleted = prog?.completed || (prog?.bestWpm && prog.bestWpm > 0);
              
              const lessonSessions = recentSessions.filter(s => {
                if (!s.difficulty_level || s.difficulty_level === 'home_row' || s.difficulty_level === 'en') {
                  return selectedLessonForIntro.id === 1;
                }
                const diff = String(s.difficulty_level).toLowerCase();
                return diff.includes(`lesson_${selectedLessonForIntro.id}`) ||
                       diff.includes(`lesson${selectedLessonForIntro.id}`);
              });

              const bestWpm = Math.max(
                prog?.bestWpm || 0,
                ...(lessonSessions.map(s => parseInt(s.wpm, 10) || 0))
              );
              const bestAcc = lessonSessions.length > 0
                ? Math.max(...lessonSessions.map(s => parseInt(s.accuracy_percent, 10) || 0))
                : (isCompleted ? 97 : 0);

              const stars = prog?.stars || (isCompleted ? (bestAcc >= 98 ? 3 : bestAcc >= 95 ? 2 : 1) : 0);

              if (bestWpm > 0 || isCompleted || lessonSessions.length > 0) {
                return (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50 to-pink-50 dark:from-purple-950/40 dark:via-indigo-950/40 dark:to-pink-950/40 border border-purple-200/80 dark:border-purple-800/60 space-y-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🏆</span>
                        <div>
                          <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>Lesson {selectedLessonForIntro.lessonNumber} Completed</span>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black">
                              PASSED
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">
                            Verified Server Database Record (MySQL)
                          </p>
                        </div>
                      </div>

                      {/* Stars */}
                      <div className="flex items-center gap-1 text-base text-amber-400 bg-white/80 dark:bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-xs">
                        <span className={stars >= 1 ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600'}>★</span>
                        <span className={stars >= 2 ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600'}>★</span>
                        <span className={stars >= 3 ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600'}>★</span>
                      </div>
                    </div>

                    {/* Stats Summary Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center">
                      <div className="p-2 rounded-xl bg-white dark:bg-slate-850 border border-slate-200/60 dark:border-slate-700/60">
                        <div className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">Best Speed</div>
                        <div className="text-sm font-black text-indigo-700 dark:text-indigo-300 font-mono">⚡ {bestWpm} WPM</div>
                      </div>
                      <div className="p-2 rounded-xl bg-white dark:bg-slate-850 border border-slate-200/60 dark:border-slate-700/60">
                        <div className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Best Accuracy</div>
                        <div className="text-sm font-black text-emerald-700 dark:text-emerald-300 font-mono">🎯 {bestAcc > 0 ? `${bestAcc}%` : '95%+'}</div>
                      </div>
                      <div className="p-2 rounded-xl bg-white dark:bg-slate-850 border border-slate-200/60 dark:border-slate-700/60 col-span-2 sm:col-span-1">
                        <div className="text-[9px] font-bold text-purple-600 dark:text-purple-400 uppercase">Status</div>
                        <div className="text-xs font-black text-purple-700 dark:text-purple-300">✅ Unlocked</div>
                      </div>
                    </div>

                    {/* Recent Sessions Pills */}
                    {lessonSessions.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <div className="text-[10px] font-black text-slate-500 dark:text-slate-400">Recent Sessions:</div>
                        <div className="flex flex-wrap gap-1.5">
                          {lessonSessions.slice(0, 6).map((s, idx) => (
                            <div
                              key={idx}
                              className="px-2 py-1 rounded-lg bg-white/90 dark:bg-slate-800 text-[10px] border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 shadow-xs"
                            >
                              <span className="font-mono font-black text-indigo-600 dark:text-indigo-400">⚡ {s.wpm} WPM</span>
                              <span className="text-slate-300 dark:text-slate-600">•</span>
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">{s.accuracy_percent}%</span>
                              {s.duration_seconds && (
                                <>
                                  <span className="text-slate-300 dark:text-slate-600">•</span>
                                  <span className="text-slate-400 font-mono">{s.duration_seconds}s</span>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">
                    💡 No attempts recorded yet for this lesson.
                  </span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    Target: {selectedLessonForIntro.passingCriteria.minWpm} WPM
                  </span>
                </div>
              );
            })()}

            {/* Exercise Steps Interactive List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-black text-slate-500 dark:text-slate-400">
                <span>This lesson contains {selectedLessonForIntro.exercises.length} exercises:</span>
                <span className="text-[10px] text-indigo-500 font-bold">Target: {selectedLessonForIntro.passingCriteria.minWpm} WPM • {selectedLessonForIntro.passingCriteria.minAccuracy}% Accuracy</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedLessonForIntro.exercises.map((ex, idx) => {
                  const isLessonUnlocked = (lessonProgress[selectedLessonForIntro.id]?.unlocked || selectedLessonForIntro.id === 1);
                  return (
                    <button
                      key={ex.id}
                      type="button"
                      disabled={!isLessonUnlocked}
                      onClick={() => {
                        setShowKeyIntroModal(false);
                        setActiveLesson(selectedLessonForIntro);
                        setActiveExercise(ex);
                      }}
                      className={`p-2.5 rounded-xl text-left transition-all flex items-center justify-between gap-2 border ${isLessonUnlocked
                          ? 'bg-slate-50 dark:bg-slate-800/80 hover:bg-purple-50 dark:hover:bg-purple-950/40 border-slate-200/60 dark:border-slate-700/60 hover:border-purple-300 cursor-pointer'
                          : 'bg-slate-100 dark:bg-slate-900 text-slate-400 opacity-60 border-slate-200/40 cursor-not-allowed'
                        }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-md bg-purple-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{ex.title}</span>
                      </div>
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 shrink-0 font-bold">
                        {ex.type}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowKeyIntroModal(false)}
                className="flex-1 py-3 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 font-black text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                Close
              </button>
              {(lessonProgress[selectedLessonForIntro.id]?.unlocked || selectedLessonForIntro.id === 1) && (
                <button
                  onClick={handleBeginDrillFromIntro}
                  className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-500 hover:opacity-90 text-white font-black text-xs shadow-lg shadow-purple-500/25 cursor-pointer transition-all flex items-center justify-center gap-2"
                >
                  <span>Start from Beginning</span>
                  <FiChevronRight size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TouchTypingMaster;
