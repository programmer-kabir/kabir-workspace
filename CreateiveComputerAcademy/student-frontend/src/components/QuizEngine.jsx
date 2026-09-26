import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import {
  FiClock, FiCheckCircle, FiXCircle, FiArrowRight, FiLock,
  FiAward, FiAlertTriangle, FiHelpCircle, FiCheck,
  FiChevronRight, FiShield, FiZap, FiBookOpen, FiEdit3
} from 'react-icons/fi';
import {
  HiSparkles, HiAcademicCap, HiLockClosed, HiCheckBadge,
  HiLightBulb, HiOutlineTrophy
} from 'react-icons/hi2';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const QuizEngine = ({
  quizId,
  courseId,
  user,
  onComplete,
  onNextLesson,
  hasNextLesson
}) => {
  const [stage, setStage] = useState('briefing'); // 'briefing' | 'active' | 'submitting' | 'result'
  const [loading, setLoading] = useState(true);
  const [quizData, setQuizData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // { [question_id]: string }
  const [timeLeftSec, setTimeLeftSec] = useState(600);
  const [timeSpentSec, setTimeSpentSec] = useState(0);
  const [resultData, setResultData] = useState(null);
  const [bestAttempt, setBestAttempt] = useState(null);
  const [isLockedSubmission, setIsLockedSubmission] = useState(false);

  const timerRef = useRef(null);
  const inputFocusRef = useRef(null);

  // Helper to reliably extract student user ID
  const getResolvedUserId = () => {
    if (user?.id) return user.id;
    if (user?.student_id) return user.student_id;
    try {
      const stored = JSON.parse(localStorage.getItem('cca_student_user') || '{}');
      return stored?.id || stored?.student_id || 0;
    } catch (e) {
      return 0;
    }
  };

  // Helper to construct a complete review breakdown
  const buildCompletedResult = (data) => {
    if (!data) return null;
    const quiz = data.quiz || {};
    const passingScore = quiz.passing_score_percent || 70;
    const allQuestions = data.questions || [];

    // 1. If backend already sent full completed_result with breakdown
    if (data.completed_result && Array.isArray(data.completed_result.breakdown) && data.completed_result.breakdown.length > 0) {
      return {
        ...data.completed_result,
        passing_score_percent: data.completed_result.passing_score_percent || passingScore
      };
    }

    // 2. If attempts exist, reconstruct breakdown using allQuestions & answers_json
    const attempt = (data.attempts && data.attempts.length > 0) ? data.attempts[0] : (data.best_attempt || null);
    if (!attempt && !data.completed_result) return null;

    const baseAttempt = attempt || data.completed_result;
    let savedAnswers = {};
    try {
      if (typeof baseAttempt.answers_json === 'string') {
        savedAnswers = JSON.parse(baseAttempt.answers_json || '{}');
      } else if (typeof baseAttempt.answers_json === 'object' && baseAttempt.answers_json !== null) {
        savedAnswers = baseAttempt.answers_json;
      }
    } catch (e) {}

    const breakdown = allQuestions.map((quest) => {
      const qId = quest.id;
      const qType = quest.question_type || 'single_choice';
      const studentPick = savedAnswers[qId] !== undefined ? savedAnswers[qId] : (savedAnswers[String(qId)] !== undefined ? savedAnswers[String(qId)] : null);
      const correctOpt = quest.correct_option || 'a';
      const correctText = quest.correct_answer_text || (qType === 'true_false' ? correctOpt : '');

      let isCorrect = false;
      if (studentPick !== null && studentPick !== undefined && String(studentPick).trim() !== '') {
        const studentNorm = String(studentPick).trim().toLowerCase();
        if (qType === 'short_answer') {
          const target = (correctText || correctOpt).trim().toLowerCase();
          isCorrect = studentNorm === target || (target.includes(',') && target.split(',').map(s => s.trim().toLowerCase()).includes(studentNorm));
        } else if (qType === 'true_false') {
          const target = (correctOpt === 'true' || correctOpt === 'a') ? 'true' : 'false';
          isCorrect = studentNorm === target;
        } else {
          isCorrect = studentNorm === String(correctOpt).trim().toLowerCase();
        }
      }

      return {
        question_id: qId,
        question_text: quest.question_text,
        question_type: qType,
        option_a: quest.option_a,
        option_b: quest.option_b,
        option_c: quest.option_c,
        option_d: quest.option_d,
        student_choice: studentPick,
        correct_option: correctOpt,
        correct_answer_text: correctText,
        is_correct: isCorrect,
        explanation: quest.explanation
      };
    });

    return {
      quiz_id: quiz.id || quizId,
      title: quiz.title || 'Assessment Quiz',
      total_questions: baseAttempt.total_questions || allQuestions.length,
      correct_answers: baseAttempt.correct_answers || 0,
      score_percent: baseAttempt.score_percent || 0,
      passing_score_percent: passingScore,
      is_passed: !!baseAttempt.is_passed,
      time_taken_seconds: baseAttempt.time_taken_seconds || 0,
      attempt_number: baseAttempt.attempt_number || 1,
      breakdown: (data.completed_result?.breakdown?.length ? data.completed_result.breakdown : breakdown),
      submitted_at: baseAttempt.created_at
    };
  };

  // ── 1. Fetch Quiz Info & Questions ─────────────────────────────────────────
  const fetchQuiz = async () => {
    if (!quizId) return;
    try {
      setLoading(true);
      const uid = getResolvedUserId();
      const userParam = uid ? `&user_id=${uid}` : '';
      const res = await axios.get(`${API_BASE}api/student/courses/quiz.php?quiz_id=${quizId}${userParam}`);

      if (res.data.status === 'success' && res.data.data) {
        const data = res.data.data;
        setQuizData(data.quiz);
        setQuestions(data.questions || []);
        setBestAttempt(data.best_attempt || null);

        const resolvedResult = buildCompletedResult(data);

        // 🔒 If the student has already submitted this quiz once, permanently load review mode
        if (resolvedResult) {
          setResultData(resolvedResult);
          setIsLockedSubmission(true);
          setStage('result');
          setLoading(false);
          return;
        }

        setIsLockedSubmission(false);
        const limitMin = data.quiz.time_limit_minutes || 10;
        setTimeLeftSec(limitMin * 60);
      } else {
        toast.error(res.data.message || 'Failed to load quiz details.');
      }
    } catch (err) {
      toast.error('Network error loading quiz.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuiz();
    setStage('briefing');
    setSelectedAnswers({});
    setCurrentQIndex(0);
    setResultData(null);
    setTimeSpentSec(0);
    setIsLockedSubmission(false);
  }, [quizId, user]);

  // Focus input when short_answer question loads
  useEffect(() => {
    if (stage === 'active' && questions[currentQIndex]?.question_type === 'short_answer') {
      setTimeout(() => {
        if (inputFocusRef.current) {
          inputFocusRef.current.focus();
        }
      }, 100);
    }
  }, [stage, currentQIndex, questions]);

  // ── 2. Live Exam Countdown Timer ──────────────────────────────────────────
  useEffect(() => {
    if (stage === 'active') {
      timerRef.current = setInterval(() => {
        setTimeLeftSec((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleSubmitQuiz(true); // Auto-submit on time up
            return 0;
          }
          return prev - 1;
        });
        setTimeSpentSec((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stage, selectedAnswers]);

  // ── Keyboard Hotkeys (Strict Forward Only, No Backwards) ──────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (stage !== 'active' || !questions[currentQIndex]) return;

      // When typing inside textarea, Enter advances to next question
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleNextQuestion();
        }
        return;
      }

      const key = e.key.toLowerCase();
      const currentQ = questions[currentQIndex];
      const currentQId = currentQ.id;
      const qType = currentQ.question_type || 'single_choice';

      if (qType === 'single_choice') {
        if (key === '1' || key === 'a') {
          setSelectedAnswers((prev) => ({ ...prev, [currentQId]: 'a' }));
        } else if (key === '2' || key === 'b') {
          setSelectedAnswers((prev) => ({ ...prev, [currentQId]: 'b' }));
        } else if (key === '3' || key === 'c') {
          setSelectedAnswers((prev) => ({ ...prev, [currentQId]: 'c' }));
        } else if (key === '4' || key === 'd') {
          setSelectedAnswers((prev) => ({ ...prev, [currentQId]: 'd' }));
        }
      } else if (qType === 'true_false') {
        if (key === 't' || key === '1') {
          setSelectedAnswers((prev) => ({ ...prev, [currentQId]: 'true' }));
        } else if (key === 'f' || key === '2') {
          setSelectedAnswers((prev) => ({ ...prev, [currentQId]: 'false' }));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stage, currentQIndex, questions, selectedAnswers]);

  // ── 3. Start Exam Action ──────────────────────────────────────────────────
  const handleStartExam = () => {
    if (questions.length === 0) {
      toast.error('No questions configured in this assessment.');
      return;
    }
    const limitMin = quizData?.time_limit_minutes || 10;
    setTimeLeftSec(limitMin * 60);
    setTimeSpentSec(0);
    setSelectedAnswers({});
    setCurrentQIndex(0);
    setStage('active');
  };

  // ── 4. Option / Answer Selection ──────────────────────────────────────────
  const handleSelectOption = (optionVal) => {
    const currentQId = questions[currentQIndex]?.id;
    if (!currentQId) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQId]: optionVal
    }));
  };

  // ── 5. Advance to Next Question (Strict Sequential, No Going Back) ─────────
  const handleNextQuestion = () => {
    const currentQId = questions[currentQIndex]?.id;
    const ans = selectedAnswers[currentQId];
    const isAnswered = typeof ans === 'string' ? ans.trim().length > 0 : !!ans;

    if (!isAnswered) {
      const confirmSkip = window.confirm('আপনি এই প্রশ্নের কোনো উত্তর দেননি। সামনে এগিয়ে গেলে আর এই প্রশ্নে ফিরে আসা যাবে না। আপনি কি নিশ্চিত?');
      if (!confirmSkip) return;
    }

    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex((prev) => prev + 1);
    }
  };

  // ── 6. Submit Quiz Evaluation ─────────────────────────────────────────────
  const handleSubmitQuiz = async (isTimeOut = false) => {
    if (isTimeOut) {
      toast.warning('⏰ Time is up! Evaluating your answers...');
    } else {
      const answeredCount = Object.values(selectedAnswers).filter(val => typeof val === 'string' ? val.trim().length > 0 : !!val).length;
      if (answeredCount < questions.length) {
        const confirmSub = window.confirm(
          `আপনি ${questions.length}টির মধ্যে ${answeredCount}টি প্রশ্নের উত্তর দিয়েছেন। সাবমিট করলে আর কোনো পরিবর্তন করা যাবে না। সাবমিট করতে চান?`
        );
        if (!confirmSub) return;
      }
    }

    if (timerRef.current) clearInterval(timerRef.current);
    setStage('submitting');

    try {
      const uid = getResolvedUserId();
      const res = await axios.post(`${API_BASE}api/student/courses/quiz.php`, {
        action: 'submit',
        user_id: uid,
        quiz_id: quizId,
        course_id: courseId,
        answers: selectedAnswers,
        time_taken_seconds: timeSpentSec
      });

      if (res.data.status === 'success' && res.data.data) {
        const result = res.data.data;
        setResultData(result);
        setIsLockedSubmission(true);
        setStage('result');

        // Confetti Celebration if passed!
        if (result.is_passed) {
          triggerConfettiCelebration();
          toast.success('🎉 Congratulations! You passed the assessment!');
          if (onComplete) {
            onComplete(quizId, true);
          }
        } else {
          toast.info('Assessment submitted. Check your answers breakdown below.');
        }
      } else {
        toast.error(res.data.message || 'Failed to evaluate quiz.');
        setStage('active');
      }
    } catch (err) {
      toast.error('Error submitting quiz answers.');
      setStage('active');
    }
  };

  // ── 7. Confetti Particle Explosion Effect ─────────────────────────────────
  const triggerConfettiCelebration = () => {
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      setTimeout(() => {
        confetti({
          particleCount: 80,
          angle: 60,
          spread: 55,
          origin: { x: 0 }
        });
        confetti({
          particleCount: 80,
          angle: 120,
          spread: 55,
          origin: { x: 1 }
        });
      }, 300);
    } catch (e) {}
  };

  // Format Seconds to MM:SS
  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-4 text-center">
        <div className="w-14 h-14 border-4 border-indigo-200 dark:border-indigo-950 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-sm font-black text-slate-800 dark:text-white">Loading Assessment Engine...</p>
      </div>
    );
  }

  const currentQ = questions[currentQIndex];
  const currentQType = currentQ?.question_type || 'single_choice';
  const answeredTotal = Object.values(selectedAnswers).filter(val => typeof val === 'string' ? val.trim().length > 0 : !!val).length;
  const progressPercent = questions.length > 0 ? Math.round(((currentQIndex + 1) / questions.length) * 100) : 0;
  const passingScore = resultData?.passing_score_percent || quizData?.passing_score_percent || 70;
  const scorePercent = resultData?.score_percent !== undefined ? resultData.score_percent : 0;
  const reviewBreakdown = (resultData?.breakdown && resultData.breakdown.length > 0)
    ? resultData.breakdown
    : (questions.length > 0 ? questions.map((quest) => ({
        question_id: quest.id,
        question_text: quest.question_text,
        question_type: quest.question_type || 'single_choice',
        option_a: quest.option_a,
        option_b: quest.option_b,
        option_c: quest.option_c,
        option_d: quest.option_d,
        student_choice: selectedAnswers[quest.id] || null,
        correct_option: quest.correct_option || 'a',
        correct_answer_text: quest.correct_answer_text || '',
        is_correct: false,
        explanation: quest.explanation
      })) : []);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 select-none">

      {/* ── STAGE 1: BRIEFING LAUNCHPAD ────────────────────────────────────────── */}
      {stage === 'briefing' && (
        <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800/90 bg-white/95 dark:bg-[#0d1322]/95 backdrop-blur-xl p-6 sm:p-10 space-y-8 shadow-xl shadow-slate-200/40 dark:shadow-none transition-colors">
          
          {/* Header Banner */}
          <div className="flex items-start justify-between gap-4 flex-wrap pb-6 border-b border-slate-100 dark:border-slate-800/80">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-gradient-to-r from-indigo-500/15 to-purple-500/15 dark:from-indigo-500/20 dark:to-purple-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800 text-xs font-black uppercase tracking-wider font-mono">
                <HiAcademicCap size={15} />
                <span>Strict Assessment Exam</span>
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {quizData?.title || 'Module Quiz Challenge'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                {quizData?.description || 'Test your understanding on key topics covered in this module. Once you start, questions must be answered sequentially and cannot be revisited.'}
              </p>
            </div>
          </div>

          {/* 4 Assessment Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#070b14]/70 border border-slate-200/80 dark:border-slate-800/80 space-y-1">
              <span className="text-[11px] font-bold text-slate-400">Total Questions</span>
              <p className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-mono">{questions.length} Questions</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#070b14]/70 border border-slate-200/80 dark:border-slate-800/80 space-y-1">
              <span className="text-[11px] font-bold text-slate-400">Time Allowed</span>
              <p className="text-lg sm:text-xl font-black text-indigo-600 dark:text-indigo-400 font-mono">{quizData?.time_limit_minutes || 10} Mins</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#070b14]/70 border border-slate-200/80 dark:border-slate-800/80 space-y-1">
              <span className="text-[11px] font-bold text-slate-400">Passing Score</span>
              <p className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{quizData?.passing_score_percent || 70}%</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#070b14]/70 border border-slate-200/80 dark:border-slate-800/80 space-y-1">
              <span className="text-[11px] font-bold text-slate-400">Exam Rules</span>
              <p className="text-xs sm:text-sm font-black text-purple-600 dark:text-purple-400 font-mono">Sequential (1-Time)</p>
            </div>
          </div>

          {/* Guidelines Box */}
          <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/60 space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
              <HiLightBulb size={15} className="text-indigo-600 dark:text-indigo-400" />
              <span>গুরুত্বপূর্ণ পরীক্ষার নিয়মাবলী (Strict Exam Rules):</span>
            </h4>
            <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 list-disc pl-4 font-medium">
              <li><strong>ধারাবাহিক উত্তর (Sequential Only):</strong> আপনি ক্রমানুসারে (১ থেকে শেষ পর্যন্ত) প্রতিটি প্রশ্নের উত্তর দিয়ে সামনে এগোবেন। সরাসরি লাফ দিয়ে কোনো প্রশ্ন স্কিপ করা যাবে না।</li>
              <li><strong>পেছনে ফেরা নিষেধ (No Going Back):</strong> একবার "Next Question" দিয়ে পরের প্রশ্নে চলে গেলে পূর্বের প্রশ্নে আর ফিরে যাওয়া বা উত্তর পরিবর্তন করা যাবে না।</li>
              <li><strong>একবারই সাবমিট (Single Attempt Review):</strong> পরীক্ষা একবার সম্পন্ন ও সাবমিট হলে পরবর্তীতে শুধু আপনার দেওয়া উত্তর এবং সঠিক উত্তর পর্যালোচনা দেখতে পাবেন।</li>
            </ul>
          </div>

          {/* Launch or View Completed Result Action */}
          <div className="pt-2">
            {(bestAttempt || isLockedSubmission || resultData) ? (
              <div className="p-5 rounded-3xl bg-emerald-50/80 dark:bg-emerald-950/40 border-2 border-emerald-300 dark:border-emerald-700/80 flex items-center justify-between gap-4 flex-wrap">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-[11px] font-black">
                    <HiCheckBadge size={14} />
                    <span>পরীক্ষা সম্পন্ন হয়েছে</span>
                  </div>
                  <h4 className="text-base font-black text-slate-900 dark:text-white">
                    আপনি ইতোমধ্যে এই পরীক্ষাটি সম্পন্ন করেছেন (Score: {scorePercent}%)
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    আপনার দেওয়া উত্তর এবং সঠিক উত্তরের বিস্তারিত অ্যানসার শিট দেখতে নিচের বাটনে ক্লিক করুন।
                  </p>
                </div>

                <button
                  onClick={() => setStage('result')}
                  className="px-7 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm shadow-lg shadow-emerald-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>অ্যানসার শিট ও ফলাফল দেখুন</span>
                  <FiArrowRight size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-end">
                <button
                  onClick={handleStartExam}
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-sm sm:text-base shadow-xl shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Start Assessment Exam</span>
                  <FiArrowRight size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── STAGE 2: ACTIVE LIVE EXAM STREAM ────────────────────────────────────── */}
      {(stage === 'active' || stage === 'submitting') && currentQ && (
        <div className="space-y-6">
          
          {/* Top Sticky Bar: Timer, Step Progress & Status Indicators */}
          <div className="p-4 sm:p-5 rounded-3xl border border-slate-200/90 dark:border-slate-800/90 bg-white/95 dark:bg-[#0d1322]/95 backdrop-blur-xl shadow-sm space-y-4">
            
            <div className="flex items-center justify-between flex-wrap gap-3">
              {/* Question Tracker Badge */}
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white text-xs font-mono font-black flex items-center justify-center shadow-xs shadow-indigo-600/30">
                  {currentQIndex + 1}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                      Question {currentQIndex + 1} of {questions.length}
                    </h3>
                    {currentQType === 'short_answer' && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-black">
                        ✍️ Direct Q&A
                      </span>
                    )}
                    {currentQType === 'true_false' && (
                      <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-black">
                        ⚖️ True/False
                      </span>
                    )}
                    {currentQType === 'single_choice' && (
                      <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[10px] font-black">
                        🔘 MCQ
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold">
                    {answeredTotal}/{questions.length} Answered • No Going Back
                  </p>
                </div>
              </div>

              {/* Live Countdown Timer */}
              <div className={`px-4 py-2 rounded-2xl border flex items-center gap-2 font-mono font-black text-xs sm:text-sm shadow-2xs transition-all ${
                timeLeftSec < 60
                  ? 'bg-rose-50 dark:bg-rose-950/70 border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-300 animate-pulse'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white'
              }`}>
                <FiClock size={15} className={timeLeftSec < 60 ? 'text-rose-500' : 'text-indigo-500'} />
                <span>Time Left: {formatTimer(timeLeftSec)}</span>
              </div>
            </div>

            {/* Linear Progress Bar */}
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>

            {/* Question Step Progress Indicators (Non-clickable, Pure Status) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {questions.map((q, idx) => {
                const isCurrent = idx === currentQIndex;
                const isCompleted = idx < currentQIndex;

                return (
                  <div
                    key={q.id || idx}
                    className={`w-8 h-8 rounded-xl text-xs font-mono font-black shrink-0 flex items-center justify-center select-none transition-all ${
                      isCurrent
                        ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/40 ring-2 ring-indigo-400'
                        : isCompleted
                        ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                        : 'bg-slate-100 dark:bg-slate-800/60 text-slate-400 border border-slate-200/50 dark:border-slate-800'
                    }`}
                    title={isCompleted ? `Question ${idx + 1} Completed` : isCurrent ? `Current Question ${idx + 1}` : `Locked (Upcoming)`}
                  >
                    {isCompleted ? '✓' : idx + 1}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Question & Interactive Response Card */}
          <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-[#0d1322] p-6 sm:p-8 space-y-6 shadow-md transition-colors">
            
            {/* Question Title */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-[10px] font-black uppercase tracking-wider font-mono border border-indigo-200/80 dark:border-indigo-900">
                  {currentQ.marks || 1} Mark
                </span>
                <span className="text-[11px] font-bold text-slate-400">
                  {currentQType === 'short_answer' && '✍️ লিখিত উত্তর টাইপ করুন'}
                  {currentQType === 'true_false' && '⚖️ সত্য অথবা মিথ্যা নির্বাচন করুন'}
                  {currentQType === 'single_choice' && '🔘 সঠিক অপশনটি নির্বাচন করুন'}
                </span>
              </div>
              <h3 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 dark:text-white leading-snug">
                {currentQ.question_text}
              </h3>
            </div>

            {/* ── TYPE 1: DIRECT QUESTION & ANSWER (SHORT ANSWER) ── */}
            {currentQType === 'short_answer' && (
              <div className="space-y-3">
                <div className="relative">
                  <div className="absolute top-4 left-4 text-emerald-500">
                    <FiEdit3 size={18} />
                  </div>
                  <textarea
                    ref={inputFocusRef}
                    rows="3"
                    placeholder="আপনার উত্তর এখানে লিখুন (যেমন: Central Processing Unit / Ctrl+S)..."
                    value={selectedAnswers[currentQ.id] || ''}
                    onChange={(e) => handleSelectOption(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border-2 border-slate-200 dark:border-slate-800 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 transition-all outline-hidden shadow-inner"
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                  <span>💡 সঠিক বানান অথবা মূল শব্দ লিখুন (কীবোর্ডের Enter চাপলে পরের প্রশ্নে যাবে)।</span>
                  <span>{(selectedAnswers[currentQ.id] || '').length} অক্ষর</span>
                </div>
              </div>
            )}

            {/* ── TYPE 2: TRUE / FALSE CARDS ── */}
            {currentQType === 'true_false' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {[
                  { key: 'true', label: 'True (সত্য)', icon: '✅', desc: 'বিবৃতিটি সঠিক' },
                  { key: 'false', label: 'False (মিথ্যা)', icon: '❌', desc: 'বিবৃতিটি ভুল বা সঠিক নয়' }
                ].map((item) => {
                  const isSelected = selectedAnswers[currentQ.id] === item.key;

                  return (
                    <div
                      key={item.key}
                      onClick={() => handleSelectOption(item.key)}
                      className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-4 select-none group ${
                        isSelected
                          ? item.key === 'true'
                            ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 shadow-md shadow-emerald-500/10'
                            : 'border-rose-500 bg-rose-50/80 dark:bg-rose-950/40 shadow-md shadow-rose-500/10'
                          : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <span className="text-2xl">{item.icon}</span>
                        <div>
                          <p className={`text-sm sm:text-base font-black ${
                            isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-800 dark:text-slate-200'
                          }`}>
                            {item.label}
                          </p>
                          <p className="text-[11px] text-slate-400 font-medium">{item.desc}</p>
                        </div>
                      </div>

                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                        isSelected
                          ? item.key === 'true' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-rose-600 bg-rose-600 text-white'
                          : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 group-hover:border-indigo-400'
                      }`}>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white"></div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── TYPE 3: 4 OPTIONS MCQ ── */}
            {currentQType === 'single_choice' && (
              <div className="grid grid-cols-1 gap-3">
                {[
                  { key: 'a', text: currentQ.option_a },
                  { key: 'b', text: currentQ.option_b },
                  { key: 'c', text: currentQ.option_c },
                  { key: 'd', text: currentQ.option_d },
                ].filter(opt => !!opt.text).map((opt) => {
                  const isSelected = selectedAnswers[currentQ.id] === opt.key;

                  return (
                    <div
                      key={opt.key}
                      onClick={() => handleSelectOption(opt.key)}
                      className={`p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-4 select-none group ${
                        isSelected
                          ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/50 shadow-md shadow-indigo-500/10'
                          : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:border-indigo-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Option Key Badge */}
                        <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-mono font-black uppercase transition-colors shrink-0 ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 group-hover:border-indigo-400'
                        }`}>
                          {opt.key}
                        </span>
                        <span className={`text-xs sm:text-sm font-semibold transition-colors ${
                          isSelected ? 'text-indigo-950 dark:text-white font-bold' : 'text-slate-800 dark:text-slate-200'
                        }`}>
                          {opt.text}
                        </span>
                      </div>

                      {/* Radio Bubble */}
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-600 text-white'
                          : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 group-hover:border-indigo-400'
                      }`}>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white"></div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bottom Forward-Only Action Toolbar */}
          <div className="flex items-center justify-between gap-3 p-4 rounded-3xl bg-white dark:bg-[#0d1322] border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold pl-2">
              <FiLock size={14} className="text-amber-500" />
              <span>পূর্বের প্রশ্নে ফেরা যাবে না (Strict Forward Mode)</span>
            </div>

            {/* Next or Submit Button */}
            {currentQIndex < questions.length - 1 ? (
              <button
                type="button"
                onClick={handleNextQuestion}
                className="px-7 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs sm:text-sm shadow-md shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Next Question</span>
                <FiArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSubmitQuiz(false)}
                disabled={stage === 'submitting'}
                className="px-8 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-emerald-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer"
              >
                <FiCheckCircle size={16} />
                <span>{stage === 'submitting' ? 'Submitting Exam...' : 'Submit Assessment Exam'}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── STAGE 3: RESULT & LOCKED ANSWER REVIEW ROOM ────────────────────────── */}
      {stage === 'result' && resultData && (
        <div className="space-y-8">
          
          {/* Hero Celebration / Score Card */}
          <div className={`rounded-3xl p-6 sm:p-10 border-2 text-center space-y-6 shadow-xl transition-all ${
            resultData.is_passed
              ? 'bg-gradient-to-b from-emerald-500/10 via-white to-white dark:from-emerald-950/40 dark:via-[#0d1322] dark:to-[#0d1322] border-emerald-300 dark:border-emerald-700/80 shadow-emerald-500/10'
              : 'bg-gradient-to-b from-amber-500/10 via-white to-white dark:from-amber-950/40 dark:via-[#0d1322] dark:to-[#0d1322] border-amber-300 dark:border-amber-700/80 shadow-amber-500/10'
          }`}>
            
            {/* Locked Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 text-amber-400 border border-amber-500/30 text-xs font-mono font-bold shadow-xs">
              <HiLockClosed size={15} />
              <span>পরীক্ষা সংরক্ষিত ও লকড (Submission Completed)</span>
            </div>

            {/* Animated Icon Badge */}
            <div className={`w-20 h-20 rounded-3xl mx-auto flex items-center justify-center shadow-lg transition-transform hover:scale-110 ${
              resultData.is_passed
                ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-emerald-500/30'
                : 'bg-gradient-to-tr from-amber-500 to-orange-400 text-white shadow-amber-500/30'
            }`}>
              {resultData.is_passed ? <HiOutlineTrophy size={40} /> : <FiAlertTriangle size={36} />}
            </div>

            {/* Score & Verdict Title */}
            <div className="space-y-1">
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {resultData.is_passed ? '🎉 Assessment Passed with Excellence!' : 'Assessment Completed'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-semibold max-w-md mx-auto leading-relaxed">
                {resultData.is_passed
                  ? `আপনি মোট ${scorePercent}% নম্বর পেয়ে পরীক্ষায় উত্তীর্ণ হয়েছেন (পাস মার্ক ছিল ${passingScore}%)।`
                  : `আপনি ${scorePercent}% নম্বর পেয়েছেন (পাস মার্ক ${passingScore}%)। নিচে আপনার দেওয়া উত্তর ও সঠিক উত্তরের পর্যালোচনা দেওয়া হলো।`}
              </p>
            </div>

            {/* 3 Result Metric Pills */}
            <div className="flex items-center justify-center gap-3 sm:gap-6 flex-wrap">
              <div className="px-5 py-3 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-2xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Score</span>
                <p className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">{scorePercent}%</p>
              </div>

              <div className="px-5 py-3 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-2xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Correct Answers</span>
                <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  {resultData.correct_answers}/{resultData.total_questions || questions.length}
                </p>
              </div>

              <div className="px-5 py-3 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-2xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Time Taken</span>
                <p className="text-xl sm:text-2xl font-black text-slate-700 dark:text-slate-200 font-mono">
                  {formatTimer(resultData.time_taken_seconds || timeSpentSec)}
                </p>
              </div>
            </div>

            {/* Action Buttons (NO Retake button - strictly locked review) */}
            {hasNextLesson && (
              <div className="flex items-center justify-center pt-2">
                <button
                  type="button"
                  onClick={onNextLesson}
                  className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-sm shadow-lg shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>Continue to Next Lesson</span>
                  <FiArrowRight size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Detailed Question-by-Question Review Breakdown */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <FiBookOpen size={16} className="text-indigo-600" />
                <span>আপনার দেওয়া উত্তর ও সঠিক উত্তরের পর্যালোচনা (Answer Sheet Review)</span>
              </h4>
              <span className="text-xs font-bold text-slate-400">
                {reviewBreakdown.length} Questions
              </span>
            </div>

            <div className="space-y-4">
              {reviewBreakdown.map((item, idx) => {
                const isCorrect = item.is_correct;
                const qType = item.question_type || 'single_choice';

                return (
                  <div
                    key={item.question_id || idx}
                    className={`p-5 sm:p-6 rounded-3xl border-2 transition-all space-y-4 ${
                      isCorrect
                        ? 'border-emerald-200 dark:border-emerald-900/60 bg-white dark:bg-[#0d1322]'
                        : 'border-rose-200 dark:border-rose-900/60 bg-white dark:bg-[#0d1322]'
                    }`}
                  >
                    {/* Question Header with Status Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-mono font-black shrink-0 ${
                          isCorrect ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                        }`}>
                          {idx + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {qType === 'short_answer' && '✍️ Direct Q&A (Short Ans)'}
                              {qType === 'true_false' && '⚖️ True / False'}
                              {qType === 'single_choice' && '🔘 Multiple Choice (MCQ)'}
                            </span>
                          </div>
                          <h5 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug">
                            {item.question_text}
                          </h5>
                        </div>
                      </div>

                      <span className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 ${
                        isCorrect
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                      }`}>
                        {isCorrect ? <FiCheckCircle size={14} /> : <FiXCircle size={14} />}
                        <span>{isCorrect ? 'সঠিক (+1)' : 'ভুল (0)'}</span>
                      </span>
                    </div>

                    {/* ── TYPE 1: SHORT ANSWER REVIEW ── */}
                    {qType === 'short_answer' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className={`p-3.5 rounded-xl border ${
                          isCorrect
                            ? 'border-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200'
                            : 'border-rose-300 bg-rose-50/60 dark:bg-rose-950/40 text-rose-950 dark:text-rose-200'
                        }`}>
                          <span className="text-[10px] font-black uppercase tracking-wider block opacity-70 mb-1">
                            আপনার দেওয়া উত্তর (Your Answer)
                          </span>
                          <p className="font-bold text-sm">
                            {item.student_choice ? `"${item.student_choice}"` : <span className="italic text-slate-400">কোনো উত্তর দেওয়া হয়নি</span>}
                          </p>
                        </div>

                        <div className="p-3.5 rounded-xl border border-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-950 dark:text-emerald-200">
                          <span className="text-[10px] font-black uppercase tracking-wider block text-emerald-700 dark:text-emerald-400 mb-1">
                            ✓ মূল সঠিক উত্তর (Accepted Correct Answer)
                          </span>
                          <p className="font-black text-sm">
                            "{item.correct_answer_text || item.correct_option}"
                          </p>
                        </div>
                      </div>
                    )}

                    {/* ── TYPE 2: TRUE / FALSE REVIEW ── */}
                    {qType === 'true_false' && (
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        {['true', 'false'].map((val) => {
                          const isStudentPick = item.student_choice === val;
                          const isRightAnswer = (item.correct_option === val || (val === 'true' && item.correct_option === 'a') || (val === 'false' && item.correct_option === 'b'));

                          let style = 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300';
                          if (isRightAnswer) {
                            style = 'border-emerald-400 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 font-bold';
                          } else if (isStudentPick && !isRightAnswer) {
                            style = 'border-rose-400 dark:border-rose-600 bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 font-bold';
                          }

                          return (
                            <div key={val} className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${style}`}>
                              <span className="font-black uppercase">{val === 'true' ? '✅ True (সত্য)' : '❌ False (মিথ্যা)'}</span>
                              {isRightAnswer && <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">✓ Correct</span>}
                              {isStudentPick && !isRightAnswer && <span className="text-[10px] font-black text-rose-600 dark:text-rose-400">✗ Your Pick</span>}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* ── TYPE 3: MCQ OPTIONS REVIEW ── */}
                    {qType === 'single_choice' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {[
                          { key: 'a', text: item.option_a },
                          { key: 'b', text: item.option_b },
                          { key: 'c', text: item.option_c },
                          { key: 'd', text: item.option_d },
                        ].filter(o => !!o.text).map((opt) => {
                          const isStudentPick = item.student_choice === opt.key;
                          const isRightAnswer = item.correct_option === opt.key;

                          let style = 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300';
                          if (isRightAnswer) {
                            style = 'border-emerald-400 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 font-bold';
                          } else if (isStudentPick && !isRightAnswer) {
                            style = 'border-rose-400 dark:border-rose-600 bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 font-bold';
                          }

                          return (
                            <div key={opt.key} className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${style}`}>
                              <div className="flex items-center gap-2 truncate">
                                <span className="font-mono font-black uppercase">{opt.key}.</span>
                                <span className="truncate">{opt.text}</span>
                              </div>
                              {isRightAnswer && <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 shrink-0">✓ Correct</span>}
                              {isStudentPick && !isRightAnswer && <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 shrink-0">✗ Your Choice</span>}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Explanation Box */}
                    {item.explanation && (
                      <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 space-y-1">
                        <p className="text-[11px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
                          <HiLightBulb size={13} />
                          <span>Instructor Explanation:</span>
                        </p>
                        <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                          {item.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizEngine;
