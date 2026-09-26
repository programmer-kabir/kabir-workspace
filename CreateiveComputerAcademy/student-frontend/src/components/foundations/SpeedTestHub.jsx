import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FiClock, FiZap, FiAward, FiPlay, FiBookOpen,
  FiFilter, FiFileText, FiCheckCircle, FiSearch, FiLayers
} from 'react-icons/fi';
import {
  TYPING_TEST_PASSAGES,
  TEST_DURATIONS,
  PASSAGE_CATEGORIES
} from '../../data/typingTestPassages';
import SpeedTestEngine from './SpeedTestEngine';
import CustomTextModal from './CustomTextModal';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const SpeedTestHub = ({
  user,
  isMasterFullscreen = false,
  toggleMasterFullscreen
}) => {
  // Test Selection state
  const [selectedDuration, setSelectedDuration] = useState(120); // default 2 minutes (120s)
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Active Exam state
  const [activePassage, setActivePassage] = useState(null);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);

  // Student stats from database
  const [userStats, setUserStats] = useState({
    bestWpm: 0,
    avgAccuracy: 100,
    totalTests: 0
  });

  // Fetch student's speed test records from DB
  const fetchStudentStats = async () => {
    if (!user?.id) return;
    try {
      const res = await axios.get(`${API_BASE}api/student/foundations/get_progress.php?user_id=${user.id}`);
      if (res.data?.status === 'success') {
        const s = res.data?.data?.stats || {};
        setUserStats({
          bestWpm: parseInt(s.best_wpm_en, 10) || 0,
          avgAccuracy: Math.round(parseFloat(s.avg_typing_accuracy) || 100),
          totalTests: parseInt(s.total_typing_tests, 10) || 0
        });
      }
    } catch (e) {
      console.error('Could not fetch student stats', e);
    }
  };

  useEffect(() => {
    fetchStudentStats();
  }, [user?.id]);

  // Filter passages
  const filteredPassages = TYPING_TEST_PASSAGES.filter((p) => {
    const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
    const matchDiff = selectedDifficulty === 'all' || p.difficulty === selectedDifficulty;
    const matchSearch = searchQuery === '' ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchDiff && matchSearch;
  });

  // If inside an active speed test
  if (activePassage) {
    return (
      <SpeedTestEngine
        passage={activePassage}
        durationSec={activePassage.durationSec !== undefined ? activePassage.durationSec : selectedDuration}
        user={user}
        isFullscreen={isMasterFullscreen}
        onExit={() => setActivePassage(null)}
        onSessionComplete={() => fetchStudentStats()}
      />
    );
  }

  return (
    <div className={`space-y-5 ${isMasterFullscreen ? 'overflow-y-auto flex-1 max-h-full custom-scrollbar pr-1' : ''}`}>
      
      {/* ── TOP BANNER: SPEED TEST HUB HUD ──────────────────────────── */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1 max-w-xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[11px] font-black">
            <span>⚡ Typing Master Speed Exam Hub</span>
            <span className="px-1.5 py-0.2 rounded bg-indigo-600 text-white text-[9px] font-black">
              OFFICIAL CERTIFICATION
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Touch Typing Speed & Accuracy Tests
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Test your typing speed with international standard timing and earn verified Creative Computer Academy diplomas.
          </p>
        </div>

        {/* Live Personal Best Card */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="p-3 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center gap-4 min-w-[220px]">
            <div className="space-y-1 flex-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">Personal Best</span>
                <span className="font-black font-mono text-indigo-600 dark:text-indigo-400">
                  ⚡ {userStats.bestWpm} WPM
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Avg Accuracy:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  {userStats.avgAccuracy}%
                </span>
              </div>
              <div className="text-[10px] text-slate-400 pt-0.5">
                Total Exams Taken: <span className="font-bold text-slate-700 dark:text-slate-200">{userStats.totalTests}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsCustomModalOpen(true)}
            className="p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white font-black text-xs shadow-md cursor-pointer transition-all flex flex-col items-center justify-center gap-1 active:scale-95 min-w-[130px]"
          >
            <FiFileText size={18} />
            <span>Custom Text</span>
            <span className="text-[10px] text-purple-200 font-normal">Paste or .txt file</span>
          </button>
        </div>
      </div>

      {/* ── TEST DURATION SELECTOR ──────────────────────────────────── */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <FiClock className="text-indigo-600" size={14} />
            <span>Select Test Duration:</span>
          </span>
          <span className="text-[11px] text-slate-400">
            {selectedDuration >= 120 ? '🏆 Eligible for Official Certificate' : '⚡ Quick warmup test'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {TEST_DURATIONS.map((dur) => {
            const isSelected = selectedDuration === dur.seconds;
            return (
              <button
                key={dur.id}
                type="button"
                onClick={() => setSelectedDuration(dur.seconds)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-400 dark:border-indigo-600 shadow-xs ring-2 ring-indigo-500/20'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/60 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg">{dur.icon}</span>
                  {dur.recommended && (
                    <span className="px-1.5 py-0.2 rounded bg-indigo-600 text-white text-[9px] font-black">
                      POPULAR
                    </span>
                  )}
                  {dur.certEligible && !dur.recommended && (
                    <span className="px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 text-[9px] font-black">
                      DIPLOMA
                    </span>
                  )}
                </div>

                <div className="pt-2">
                  <p className={`text-xs font-black ${isSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-800 dark:text-slate-200'}`}>
                    {dur.label}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {dur.seconds} Seconds Exam
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── FILTER & SEARCH BAR ─────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        {/* Category Chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          {PASSAGE_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                selectedCategory === cat.id
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span className="mr-1">{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Difficulty Filter & Search */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="all">All Levels</option>
            <option value="beginner">🌱 Beginner</option>
            <option value="intermediate">🚀 Intermediate</option>
            <option value="advanced">🔥 Advanced</option>
          </select>

          <div className="relative flex-1 sm:w-48">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
            <input
              type="text"
              placeholder="Search passages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* ── PASSAGE GRID ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPassages.map((passage) => {
          const isBeginner = passage.difficulty === 'beginner';
          const isIntermediate = passage.difficulty === 'intermediate';

          return (
            <div
              key={passage.id}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-purple-500/40 transition-all flex flex-col justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase ${
                    isBeginner
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                      : isIntermediate
                      ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                      : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                  }`}>
                    {passage.difficulty}
                  </span>

                  <span className="text-[11px] font-mono text-slate-400">
                    {passage.wordCount} words
                  </span>
                </div>

                <h3 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                  {passage.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                  {passage.description}
                </p>

                {/* Sample snippet */}
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-800 text-[11px] font-mono text-slate-600 dark:text-slate-400 line-clamp-2 italic">
                  "{passage.text.substring(0, 100)}..."
                </div>
              </div>

              {/* Start Test Button */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <div className="text-[11px] font-bold text-slate-400">
                  ⏱️ {Math.round(selectedDuration / 60)}m Test
                </div>

                <button
                  onClick={() => setActivePassage(passage)}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-500 hover:opacity-90 text-white font-black text-xs shadow-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                >
                  <FiPlay size={12} />
                  <span>Start Exam</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── CUSTOM TEXT MODAL ───────────────────────────────────────── */}
      <CustomTextModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onStartPractice={(customPassage) => {
          setActivePassage(customPassage);
        }}
      />
    </div>
  );
};

export default SpeedTestHub;
