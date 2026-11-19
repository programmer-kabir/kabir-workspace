import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  FiCheckSquare, FiSquare, FiVolume2, FiVolumeX,
  FiPlay, FiPause, FiSave, FiCopy,
  FiTrash2, FiAward, FiTarget, FiHeadphones,
  FiFileText, FiChevronLeft, FiChevronRight,
  FiInfo, FiPlus, FiLock, FiAlertCircle
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import { getApiBase } from '../utils/api';
import { ambientSound } from '../utils/ambientSoundEngine';
import { toast } from 'sonner';

const AMBIENT_TRACKS = [
  { key: 'rain', name: 'Rainy Academy', icon: '🌧️', desc: 'Natural calming rainfall' },
  { key: 'waves', name: 'Ocean Waves', icon: '🌊', desc: 'Slow rhythmic tidal swells' },
  { key: 'fire', name: 'Cozy Campfire', icon: '🔥', desc: 'Warm crackling fireplace' },
  { key: 'drone', name: 'Deep Work Flow', icon: '🧘', desc: 'Lush harmonic binaural drone' },
  { key: 'typing', name: 'Cafe & Keyboard', icon: '☕', desc: 'Subtle murmur & mechanical clicks' },
  { key: 'whitenoise', name: 'Pure White Noise', icon: '💨', desc: 'Clean background distractor block' }
];

export default function ProductivityPlannerView({ currentUser: propUser }) {
  const authContext = useAuth?.() || {};
  const currentUser = propUser || authContext.currentUser;
  const userId = currentUser?.id;
  const apiBase = (getApiBase() || '').replace(/\/+$/, '');

  // Selected Date (defaults to today)
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const isPastDate = selectedDate < todayStr;
  const isToday = selectedDate === todayStr;

  // Daily Plan State
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [savingPlan, setSavingPlan] = useState(false);
  const [majorGoal, setMajorGoal] = useState('');
  const [majorCompleted, setMajorCompleted] = useState(false);
  const [mediumGoals, setMediumGoals] = useState([]);
  const [smallGoals, setSmallGoals] = useState([]);
  const [xpAwarded, setXpAwarded] = useState(0);

  // Input states for adding new items
  const [newMajorText, setNewMajorText] = useState('');
  const [isEditingMajor, setIsEditingMajor] = useState(false);
  const [newMediumText, setNewMediumText] = useState('');
  const [newSmallText, setNewSmallText] = useState('');

  // Scratchpad State
  const [scratchpad, setScratchpad] = useState('');
  const [loadingPad, setLoadingPad] = useState(true);
  const [padSavedStatus, setPadSavedStatus] = useState('All changes saved');
  const padSaveTimerRef = useRef(null);

  // Ambient Audio State
  const [activeTrack, setActiveTrack] = useState('rain');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioVolume, setAudioVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);

  // ── 1. Fetch Daily Plan ──
  const fetchPlan = async (date) => {
    if (!userId) return;
    setLoadingPlan(true);
    setIsEditingMajor(false);
    setNewMajorText('');
    setNewMediumText('');
    setNewSmallText('');
    try {
      const res = await axios.get(`${apiBase}/api/productivity/get_daily_plan.php?user_id=${userId}&date=${date}`);
      if (res.data?.status === 'success') {
        const d = res.data.data;
        setMajorGoal(d.major_goal || '');
        setMajorCompleted(Boolean(d.major_completed));
        setMediumGoals(Array.isArray(d.medium_goals) ? d.medium_goals : []);
        setSmallGoals(Array.isArray(d.small_goals) ? d.small_goals : []);
        setXpAwarded(d.xp_awarded || 0);
      }
    } catch (err) {
      console.error('Failed to fetch daily plan', err);
    } finally {
      setLoadingPlan(false);
    }
  };

  // ── 2. Fetch Scratchpad ──
  const fetchScratchpad = async () => {
    if (!userId) return;
    setLoadingPad(true);
    try {
      const res = await axios.get(`${apiBase}/api/productivity/get_scratchpad.php?user_id=${userId}`);
      if (res.data?.status === 'success') {
        setScratchpad(res.data.data?.content || '');
      }
    } catch (err) {
      console.error('Failed to fetch scratchpad', err);
    } finally {
      setLoadingPad(false);
    }
  };

  useEffect(() => {
    fetchPlan(selectedDate);
  }, [userId, selectedDate]);

  useEffect(() => {
    fetchScratchpad();
    return () => {
      ambientSound.stop();
    };
  }, [userId]);

  // ── Save Plan Handler ──
  const handleSavePlan = async (
    silent = false,
    updatedMajor = majorGoal,
    updatedMajorComp = majorCompleted,
    updatedMedium = mediumGoals,
    updatedSmall = smallGoals
  ) => {
    if (!userId) return;
    setSavingPlan(true);
    try {
      const res = await axios.post(`${apiBase}/api/productivity/save_daily_plan.php`, {
        user_id: userId,
        plan_date: selectedDate,
        major_goal: updatedMajor,
        major_completed: updatedMajorComp ? 1 : 0,
        medium_goals: updatedMedium,
        small_goals: updatedSmall
      });

      if (res.data?.status === 'success') {
        if (!silent) toast.success('1-3-5 Planner saved successfully!');
        if (res.data.data?.newly_earned_xp) {
          toast.success('🎉 Congratulations! +25 XP awarded for 100% daily plan completion!');
          setXpAwarded(1);
        }
      }
    } catch (err) {
      console.error('Failed to save plan', err);
      const msg = err.response?.data?.message || 'Failed to save planner';
      if (!silent) toast.error(msg);
    } finally {
      setSavingPlan(false);
    }
  };

  // ── Checkmark Toggles (Active for Today, Future, AND Past Dates) ──
  const toggleMajorCompleted = () => {
    const nextVal = !majorCompleted;
    setMajorCompleted(nextVal);
    handleSavePlan(true, majorGoal, nextVal, mediumGoals, smallGoals);
  };

  const toggleMediumCompleted = (index) => {
    const copy = [...mediumGoals];
    copy[index] = { ...copy[index], completed: !copy[index].completed };
    setMediumGoals(copy);
    handleSavePlan(true, majorGoal, majorCompleted, copy, smallGoals);
  };

  const toggleSmallCompleted = (index) => {
    const copy = [...smallGoals];
    copy[index] = { ...copy[index], completed: !copy[index].completed };
    setSmallGoals(copy);
    handleSavePlan(true, majorGoal, majorCompleted, mediumGoals, copy);
  };

  // ── Goal Adding & Deleting (Only Today or Future) ──
  const handleSetMajorGoal = (e) => {
    e.preventDefault();
    if (isPastDate) {
      toast.error('Cannot add new goals to past dates.');
      return;
    }
    const val = newMajorText.trim();
    if (!val) return;
    setMajorGoal(val);
    setMajorCompleted(false);
    setIsEditingMajor(false);
    setNewMajorText('');
    handleSavePlan(false, val, false, mediumGoals, smallGoals);
  };

  const handleClearMajor = () => {
    if (isPastDate) return;
    setMajorGoal('');
    setMajorCompleted(false);
    handleSavePlan(true, '', false, mediumGoals, smallGoals);
  };

  const handleAddMedium = (e) => {
    e.preventDefault();
    if (isPastDate) {
      toast.error('Cannot add new goals to past dates.');
      return;
    }
    const val = newMediumText.trim();
    if (!val) return;
    if (mediumGoals.length >= 3) {
      toast.error('Maximum 3 medium priorities allowed.');
      return;
    }
    const updated = [
      ...mediumGoals,
      { id: `med_${Date.now()}`, text: val, completed: false }
    ];
    setMediumGoals(updated);
    setNewMediumText('');
    handleSavePlan(true, majorGoal, majorCompleted, updated, smallGoals);
  };

  const handleRemoveMedium = (index) => {
    if (isPastDate) return;
    const updated = mediumGoals.filter((_, i) => i !== index);
    setMediumGoals(updated);
    handleSavePlan(true, majorGoal, majorCompleted, updated, smallGoals);
  };

  const handleAddSmall = (e) => {
    e.preventDefault();
    if (isPastDate) {
      toast.error('Cannot add new items to past dates.');
      return;
    }
    const val = newSmallText.trim();
    if (!val) return;
    if (smallGoals.length >= 5) {
      toast.error('Maximum 5 quick checklist items allowed.');
      return;
    }
    const updated = [
      ...smallGoals,
      { id: `sm_${Date.now()}`, text: val, completed: false }
    ];
    setSmallGoals(updated);
    setNewSmallText('');
    handleSavePlan(true, majorGoal, majorCompleted, mediumGoals, updated);
  };

  const handleRemoveSmall = (index) => {
    if (isPastDate) return;
    const updated = smallGoals.filter((_, i) => i !== index);
    setSmallGoals(updated);
    handleSavePlan(true, majorGoal, majorCompleted, mediumGoals, updated);
  };

  // ── Auto-save Scratchpad on typing (Debounced 1s) ──
  const handleScratchpadChange = (e) => {
    const val = e.target.value;
    setScratchpad(val);
    setPadSavedStatus('Typing...');

    if (padSaveTimerRef.current) clearTimeout(padSaveTimerRef.current);
    padSaveTimerRef.current = setTimeout(async () => {
      try {
        setPadSavedStatus('Saving to cloud...');
        await axios.post(`${apiBase}/api/productivity/save_scratchpad.php`, {
          user_id: userId,
          content: val
        });
        setPadSavedStatus('All changes saved');
      } catch (err) {
        setPadSavedStatus('Save failed (check network)');
      }
    }, 1000);
  };

  // ── Calculate Progress ──
  let totalCount = 0;
  let doneCount = 0;
  if (majorGoal && majorGoal.trim()) {
    totalCount++;
    if (majorCompleted) doneCount++;
  }
  mediumGoals.forEach(m => {
    if (m.text && m.text.trim()) {
      totalCount++;
      if (m.completed) doneCount++;
    }
  });
  smallGoals.forEach(s => {
    if (s.text && s.text.trim()) {
      totalCount++;
      if (s.completed) doneCount++;
    }
  });
  const progressPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  // ── Audio Controls ──
  const togglePlayTrack = (trackKey) => {
    if (isPlayingAudio && activeTrack === trackKey) {
      ambientSound.stop();
      setIsPlayingAudio(false);
    } else {
      setActiveTrack(trackKey);
      ambientSound.setVolume(isMuted ? 0 : audioVolume / 100);
      ambientSound.play(trackKey);
      setIsPlayingAudio(true);
    }
  };

  const handleVolumeChange = (e) => {
    const val = Number(e.target.value);
    setAudioVolume(val);
    if (!isMuted) {
      ambientSound.setVolume(val / 100);
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      ambientSound.setVolume(audioVolume / 100);
    } else {
      setIsMuted(true);
      ambientSound.setVolume(0);
    }
  };

  const handleCopyScratchpad = () => {
    navigator.clipboard.writeText(scratchpad);
    toast.success('Notes copied to clipboard!');
  };

  // ── Date Switcher ──
  const shiftDate = (days) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 animate-in fade-in duration-300">
      {/* ── Top Hero Banner (White Mode & Dark Mode adaptive) ── */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-10 text-slate-900 dark:text-white shadow-xl dark:shadow-2xl bg-gradient-to-br from-white via-indigo-50/40 to-slate-50 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900 border border-slate-200/90 dark:border-slate-800 transition-colors duration-300">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-white/10 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider backdrop-blur-md border border-indigo-200/80 dark:border-white/10">
              <HiSparkles className="text-amber-500" />
              <span>CCA Workstation Flow & Planner</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
              <span>Productivity & Focus Hub</span>
              <span className="text-2xl sm:text-3xl">📝🎧</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
              Plan your daily 1-3-5 architecture, drown out noise with zero-bandwidth procedural soundscapes, and keep persistent cloud notes.
            </p>
          </div>

          {/* Quick Date & Progress Capsule */}
          <div className="flex flex-wrap items-center gap-3 bg-white/90 dark:bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-slate-200/90 dark:border-white/10 shadow-lg">
            <div className="flex items-center gap-2 pr-4 border-r border-slate-200/80 dark:border-white/10">
              <button
                onClick={() => shiftDate(-1)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white transition"
                title="Previous Day"
              >
                <FiChevronLeft size={16} />
              </button>
              <div className="text-center min-w-[125px]">
                <div className="text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1">
                  {isToday ? (
                    <span className="text-indigo-600 dark:text-indigo-400">Today</span>
                  ) : isPastDate ? (
                    <span className="text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                      <FiLock size={10} /> Past Date
                    </span>
                  ) : (
                    <span className="text-emerald-600 dark:text-emerald-400">Future Date</span>
                  )}
                </div>
                <div className="text-sm font-black text-slate-800 dark:text-white">{selectedDate}</div>
              </div>
              <button
                onClick={() => shiftDate(1)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white transition"
                title="Next Day"
              >
                <FiChevronRight size={16} />
              </button>
            </div>

            <div className="pl-2">
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Plan Completion
              </div>
              <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <span>{progressPct}%</span>
                <span className="text-xs font-medium text-slate-400">({doneCount}/{totalCount || 0})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Level XP Banner Notice */}
        {xpAwarded === 1 && (
          <div className="mt-6 pt-4 border-t border-slate-200/80 dark:border-white/10 flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400">
            <FiAward size={16} />
            <span>Daily 1-3-5 Planner completed! +25 XP awarded to your Career Level profile! 🏆</span>
          </div>
        )}
      </div>

      {/* ── Main Two-Column Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ── Left Column: 1-3-5 Daily Planner (7 cols) ── */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <FiTarget className="text-rose-500" />
                  <span>The 1-3-5 Daily Planner</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  1 Big Goal • 3 Medium Priorities • 5 Quick Checklist Items
                </p>
              </div>

              <div className="flex items-center gap-2">
                {isPastDate && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-[11px] font-bold">
                    <FiLock size={12} /> Checklist Only
                  </span>
                )}
                {!isPastDate && (
                  <button
                    onClick={() => handleSavePlan(false)}
                    disabled={savingPlan}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
                  >
                    <FiSave size={14} className={savingPlan ? 'animate-spin' : ''} />
                    <span>{savingPlan ? 'Saving...' : 'Save Plan'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* ── 1. THE 1 BIG WIN ── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-[10px] font-black uppercase tracking-wider">
                    Tier 1 • Must Complete
                  </span>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">1 Big Goal for Today</span>
                </div>
              </div>

              {majorGoal ? (
                <div className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 group transition">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={toggleMajorCompleted}
                      className={`text-xl transition shrink-0 ${majorCompleted ? 'text-emerald-500' : 'text-rose-400 hover:text-rose-600'}`}
                      title={majorCompleted ? 'Mark Incomplete' : 'Mark Completed'}
                    >
                      {majorCompleted ? <FiCheckSquare /> : <FiSquare />}
                    </button>
                    <span
                      className={`text-sm sm:text-base font-black truncate ${
                        majorCompleted
                          ? 'line-through text-slate-400 dark:text-slate-500'
                          : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {majorGoal}
                    </span>
                  </div>

                  {!isPastDate && (
                    <button
                      type="button"
                      onClick={handleClearMajor}
                      className="opacity-0 group-hover:opacity-100 p-2 rounded-xl text-rose-500 hover:bg-rose-100/60 dark:hover:bg-rose-900/40 transition shrink-0"
                      title="Clear Big Goal"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  )}
                </div>
              ) : (
                <div>
                  {isPastDate ? (
                    <div className="p-3.5 rounded-2xl bg-slate-50/60 dark:bg-slate-800/20 border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                      No big goal was logged for this date.
                    </div>
                  ) : isEditingMajor ? (
                    <form onSubmit={handleSetMajorGoal} className="flex items-center gap-2">
                      <input
                        type="text"
                        autoFocus
                        value={newMajorText}
                        onChange={(e) => setNewMajorText(e.target.value)}
                        placeholder="e.g. Complete Student Batch-12 PHP Curriculum & Exam Sheets"
                        className="flex-1 px-4 py-3 rounded-2xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-300 dark:border-rose-900 text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                      />
                      <button
                        type="submit"
                        disabled={!newMajorText.trim()}
                        className="px-4 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition disabled:opacity-40"
                      >
                        Set Goal
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingMajor(false)}
                        className="px-3 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                      >
                        Cancel
                      </button>
                    </form>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEditingMajor(true)}
                      className="w-full p-3.5 rounded-2xl border border-dashed border-rose-300 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/10 text-rose-600 dark:text-rose-400 hover:bg-rose-50/60 dark:hover:bg-rose-950/30 text-xs font-bold flex items-center justify-center gap-2 transition"
                    >
                      <FiPlus size={16} />
                      <span>Set Today's Big Goal</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* ── 2. THE 3 MEDIUM PRIORITIES ── */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-300 text-[10px] font-black uppercase tracking-wider">
                    Tier 2 • Important
                  </span>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    3 Medium Priorities ({mediumGoals.length}/3)
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                {mediumGoals.map((g, idx) => (
                  <div
                    key={g.id || idx}
                    className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 group transition hover:border-amber-300 dark:hover:border-amber-800"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => toggleMediumCompleted(idx)}
                        className={`text-lg transition shrink-0 ${g.completed ? 'text-emerald-500' : 'text-slate-400 hover:text-slate-600'}`}
                        title={g.completed ? 'Mark Incomplete' : 'Mark Completed'}
                      >
                        {g.completed ? <FiCheckSquare /> : <FiSquare />}
                      </button>
                      <span
                        className={`text-xs sm:text-sm font-semibold truncate ${
                          g.completed
                            ? 'line-through text-slate-400 dark:text-slate-500'
                            : 'text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {g.text}
                      </span>
                    </div>

                    {!isPastDate && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMedium(idx)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition shrink-0"
                        title="Delete Priority"
                      >
                        <FiTrash2 size={13} />
                      </button>
                    )}
                  </div>
                ))}

                {mediumGoals.length === 0 && (
                  <div className="p-3.5 rounded-2xl bg-slate-50/60 dark:bg-slate-800/20 border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                    {isPastDate ? 'No medium priorities logged.' : 'No medium priorities added yet.'}
                  </div>
                )}
              </div>

              {/* Inline Add Form */}
              {!isPastDate && mediumGoals.length < 3 && (
                <form onSubmit={handleAddMedium} className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={newMediumText}
                    onChange={(e) => setNewMediumText(e.target.value)}
                    placeholder={`+ Add priority #${mediumGoals.length + 1} (e.g. Review Task #104)...`}
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-dashed border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 transition"
                  />
                  <button
                    type="submit"
                    disabled={!newMediumText.trim()}
                    className="px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition disabled:opacity-40"
                  >
                    + Add
                  </button>
                </form>
              )}
            </div>

            {/* ── 3. THE 5 QUICK TO-DOS ── */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-900 text-indigo-700 dark:text-indigo-300 text-[10px] font-black uppercase tracking-wider">
                    Tier 3 • Checklist
                  </span>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    5 Quick To-Dos & Calls ({smallGoals.length}/5)
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                {smallGoals.map((g, idx) => (
                  <div
                    key={g.id || idx}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-50/60 dark:bg-slate-800/20 border border-slate-200/60 dark:border-slate-800/60 group transition hover:border-indigo-300 dark:hover:border-indigo-800"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => toggleSmallCompleted(idx)}
                        className={`text-base transition shrink-0 ${g.completed ? 'text-emerald-500' : 'text-slate-400 hover:text-slate-600'}`}
                        title={g.completed ? 'Mark Incomplete' : 'Mark Completed'}
                      >
                        {g.completed ? <FiCheckSquare /> : <FiSquare />}
                      </button>
                      <span
                        className={`text-xs font-medium truncate ${
                          g.completed
                            ? 'line-through text-slate-400 dark:text-slate-500'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {g.text}
                      </span>
                    </div>

                    {!isPastDate && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSmall(idx)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition shrink-0"
                        title="Delete Item"
                      >
                        <FiTrash2 size={12} />
                      </button>
                    )}
                  </div>
                ))}

                {smallGoals.length === 0 && (
                  <div className="p-3.5 rounded-2xl bg-slate-50/60 dark:bg-slate-800/20 border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                    {isPastDate ? 'No checklist items logged.' : 'No checklist items added yet.'}
                  </div>
                )}
              </div>

              {/* Inline Add Form */}
              {!isPastDate && smallGoals.length < 5 && (
                <form onSubmit={handleAddSmall} className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={newSmallText}
                    onChange={(e) => setNewSmallText(e.target.value)}
                    placeholder={`+ Add quick checklist #${smallGoals.length + 1} (e.g. Call student guardian)...`}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-dashed border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 transition"
                  />
                  <button
                    type="submit"
                    disabled={!newSmallText.trim()}
                    className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition disabled:opacity-40"
                  >
                    + Add
                  </button>
                </form>
              )}
            </div>

            {/* Bottom Status & Rules Info */}
            <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-400 border-t border-slate-100 dark:border-slate-800">
              {isPastDate ? (
                <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold">
                  <FiAlertCircle size={13} />
                  <span>Past date entry restriction: Adding or modifying goal text is locked; checkmarks remain updateable.</span>
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <FiInfo size={13} /> Completing all defined goals awards +25 XP.
                </span>
              )}
              <span className="text-[11px]">Instant auto-saving on checkmark click</span>
            </div>
          </div>
        </div>

        {/* ── Right Column: Ambient Audio + Scratchpad (5 cols) ── */}
        <div className="lg:col-span-5 space-y-6">
          {/* Ambient Sound Player */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-lg shadow-sm">
                  <FiHeadphones />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    Ambient Focus Beats
                    {isPlayingAudio && (
                      <span className="flex items-center gap-0.5">
                        <span className="w-1 h-3 bg-indigo-500 animate-pulse rounded-full" />
                        <span className="w-1 h-4 bg-indigo-500 animate-pulse delay-100 rounded-full" />
                        <span className="w-1 h-2 bg-indigo-500 animate-pulse delay-200 rounded-full" />
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-slate-400">Procedural zero-bandwidth audio</p>
                </div>
              </div>

              {/* Volume Slider & Mute */}
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMute}
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white transition"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted || audioVolume === 0 ? <FiVolumeX size={16} /> : <FiVolume2 size={16} />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={isMuted ? 0 : audioVolume}
                  onChange={handleVolumeChange}
                  className="w-16 sm:w-20 accent-indigo-600 cursor-pointer"
                  title="Volume"
                />
              </div>
            </div>

            {/* Track Buttons */}
            <div className="grid grid-cols-2 gap-2.5">
              {AMBIENT_TRACKS.map((t) => {
                const isActive = isPlayingAudio && activeTrack === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => togglePlayTrack(t.key)}
                    className={`p-3 rounded-2xl text-left border transition-all flex items-center justify-between ${
                      isActive
                        ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-400 dark:border-indigo-600 shadow-sm'
                        : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 truncate">
                        <span>{t.icon}</span>
                        <span className="truncate">{t.name}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate mt-0.5">{t.desc}</div>
                    </div>
                    <div className={`p-1.5 rounded-xl ${isActive ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>
                      {isActive ? <FiPause size={12} /> : <FiPlay size={12} />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Persistent Scratchpad & Notes */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FiFileText className="text-amber-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Persistent Scratchpad
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-slate-400">
                  {padSavedStatus}
                </span>
                <button
                  onClick={handleCopyScratchpad}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
                  title="Copy All to Clipboard"
                >
                  <FiCopy size={13} />
                </button>
              </div>
            </div>

            <textarea
              value={scratchpad}
              onChange={handleScratchpadChange}
              placeholder="Jot down quick thoughts, temporary student phone numbers, meeting notes, links, or code snippets here... Auto-saves to your cloud profile!"
              className="w-full h-56 p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-xs sm:text-sm font-mono text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none leading-relaxed"
            />

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>{scratchpad.length} characters • {scratchpad.split(/\s+/).filter(Boolean).length} words</span>
              <span>Available anywhere you sign in</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
