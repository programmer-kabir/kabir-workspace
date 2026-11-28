import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { FiX, FiClock, FiAlertCircle, FiCheck, FiRefreshCw, FiInfo, FiRotateCcw } from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const REASON_CATEGORIES = [
  { key: 'Personal', label: 'Personal Work', icon: '🚶', desc: 'Urgent personal errand or task' },
  { key: 'Emergency', label: 'Emergency', icon: '🚨', desc: 'Unplanned critical emergency' },
  { key: 'Medical', label: 'Doctor / Medical', icon: '🏥', desc: 'Doctor visit or health checkup' },
  { key: 'Prayer', label: 'Prayer / Namaz', icon: '🕌', desc: 'Prayer & refreshment time' },
  { key: 'Tea/Snack', label: 'Tea / Snack', icon: '☕', desc: 'Quick tea or refreshment break' },
  { key: 'Other', label: 'Other Reason', icon: '📝', desc: 'Other valid personal need' },
];

const CATEGORY_SUGGESTIONS = {
  Personal: [
    'Stepping out briefly for urgent personal errand',
    'Attending an important family matter nearby',
    'Taking care of essential bank / utility paperwork'
  ],
  Emergency: [
    'Attending an unplanned urgent personal emergency',
    'Handling an unexpected urgent family situation',
    'Stepping away briefly due to an emergency call'
  ],
  Medical: [
    'Visiting pharmacy / clinic for urgent medication',
    'Feeling unwell, stepping away to rest briefly',
    'Consulting doctor for a sudden health checkup'
  ],
  Prayer: [
    'Taking a short break for Namaz & ablution',
    'Stepping away for daily prayer & refreshment'
  ],
  'Tea/Snack': [
    'Short tea & refreshment break to recharge',
    'Quick tea break outside, returning shortly'
  ],
  Other: [
    'Taking a brief personal break, returning shortly',
    'Stepping away briefly, will be back on schedule'
  ]
};

const clientSmartPolish = (text, category, minutes) => {
  const clean = text.trim();
  const lower = clean.toLowerCase();
  const durSuffix = minutes > 0 ? ` (${minutes} mins)` : '';

  if (
    lower.includes('namaz') || lower.includes('prayer') || lower.includes('salat') ||
    lower.includes('masjid') || lower.includes('wudu') || category === 'Prayer'
  ) {
    return `Stepping away for daily prayer and ablution, returning promptly${durSuffix}.`;
  }

  if (
    lower.includes('soril') || lower.includes('shorir') || lower.includes('khrap') ||
    lower.includes('kharab') || lower.includes('osusto') || lower.includes('sick') ||
    lower.includes('unwell') || lower.includes('doctor') || lower.includes('medicine') ||
    lower.includes('headache') || lower.includes('matha') || lower.includes('osudh') ||
    lower.includes('fever') || lower.includes('jor') || category === 'Medical'
  ) {
    return `Taking a short medical rest as I am feeling unwell; will resume promptly${durSuffix}.`;
  }

  if (
    lower.includes('cha') || lower.includes('tea') || lower.includes('coffee') ||
    lower.includes('snack') || lower.includes('khabar') || category === 'Tea/Snack'
  ) {
    return `Taking a brief tea and refreshment break to recharge${durSuffix}.`;
  }

  if (
    lower.includes('emergency') || lower.includes('urgent') || lower.includes('bipad') ||
    category === 'Emergency'
  ) {
    return `Stepping out briefly to attend to an urgent matter, returning shortly${durSuffix}.`;
  }

  if (
    lower.includes('dorkar') || lower.includes('baire') || lower.includes('kaj') ||
    lower.includes('errand') || lower.includes('personal') || category === 'Personal'
  ) {
    return `Stepping out briefly for an urgent personal errand; will resume work in ${minutes} minutes.`;
  }

  return `Taking a short break to attend to necessary personal matters; will be back in ${minutes} minutes.`;
};

const DURATION_OPTIONS = [
  { value: 10, label: '10 Mins' },
  { value: 15, label: '15 Mins' },
  { value: 20, label: '20 Mins' },
  { value: 30, label: '30 Mins' },
  { value: 45, label: '45 Mins' },
  { value: 60, label: '1 Hour' },
  { value: 90, label: '1.5 Hours' },
  { value: 120, label: '2 Hours' },
];

const formatMinutesToHuman = (totalMins) => {
  if (!totalMins || totalMins <= 0) return '0 mins';
  const h = Math.floor(totalMins / 60);
  const m = Math.round(totalMins % 60);
  if (h === 0) return `${m} mins`;
  if (m === 0) return `${h} hr${h > 1 ? 's' : ''}`;
  return `${h} hr${h > 1 ? 's' : ''} ${m} min${m > 1 ? 's' : ''}`;
};

const BreakRequestModal = ({ isOpen, onClose, onSuccess }) => {
  const { currentUser } = useAuth();
  const [loadingBank, setLoadingBank] = useState(true);
  const [availableMinutes, setAvailableMinutes] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('Personal');
  const [estimatedMinutes, setEstimatedMinutes] = useState(15);
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [polishing, setPolishing] = useState(false);
  const [previousReason, setPreviousReason] = useState(null);

  const callGeminiDirect = async (rawNote, cat, mins) => {
    // 1. Fetch key from live system_settings
    let apiKey = '';
    try {
      const sRes = await axios.get(`${API_BASE}api/settings/get_system_settings.php?t=${Date.now()}`);
      if (sRes.data?.status === 'success' && sRes.data?.settings?.gemini_api_key) {
        apiKey = String(sRes.data.settings.gemini_api_key).trim();
      }
    } catch {
      // ignore
    }

    if (!apiKey) return null;

    const promptText = `You are a professional HR assistant for an office.
An employee submitted this informal break note: "${rawNote}".
(This note might be in English, Bengali, or Banglish such as 'soril khrap' for sick/unwell, 'matha betha' for headache, 'baire dorkar' for urgent errand).
Category: ${cat}
Duration: ${mins} minutes

Rules:
1. Translate and rewrite this into EXACTLY ONE polite, formal, grammatically perfect English office break sentence (10 to 18 words).
2. If it mentions feeling unwell / sick / soril khrap / fever / headache, make it a dignified medical/health rest statement.
3. Output ONLY the single sentence. Do NOT use quotation marks, bullet points, or labels like "Note:".`;

    const payload = {
      contents: [{ parts: [{ text: promptText }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 60 }
    };

    // Try modern Google Gemini models in order
    const models = ['gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-3.8-flash'];
    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
        const gRes = await axios.post(url, payload, { headers: { 'Content-Type': 'application/json' }, timeout: 7000 });
        const cand = gRes.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (cand && typeof cand === 'string' && cand.trim().length > 5) {
          return cand.trim().replace(/^["'`]|["'`]$/g, '').trim();
        }
      } catch (err) {
        // try next model
        console.warn(`Gemini ${model} failed, trying next:`, err?.response?.data || err?.message);
      }
    }
    return null;
  };

  const handlePolishWithAI = async () => {
    if (!reason.trim()) {
      toast.info('Please write a few words first, then AI will polish it!');
      return;
    }
    setPolishing(true);
    setPreviousReason(reason);
    try {
      // Priority 1: Direct Gemini AI call using the API key you added in database
      const directAiResult = await callGeminiDirect(reason.trim(), selectedCategory, estimatedMinutes);
      if (directAiResult) {
        setReason(directAiResult);
        toast.success('✨ Polished into a professional note using Gemini AI!');
        return;
      }

      // Priority 2: Call backend polish endpoint if deployed
      try {
        const res = await axios.post(`${API_BASE}api/breaks/polish_break_note.php`, {
          text: reason.trim(),
          category: selectedCategory,
          duration: estimatedMinutes
        });
        if (res.data?.status === 'success' && res.data?.polished_note) {
          setReason(res.data.polished_note);
          toast.success('✨ Polished into a professional note!');
          return;
        }
      } catch {
        // backend not yet uploaded
      }

      // Priority 3: Smart Bengali/Banglish translation dictionary fallback
      const local = clientSmartPolish(reason, selectedCategory, estimatedMinutes);
      setReason(local);
      toast.success('✨ Polished into a professional note!');
    } catch {
      const local = clientSmartPolish(reason, selectedCategory, estimatedMinutes);
      setReason(local);
      toast.success('✨ Polished into a professional note!');
    } finally {
      setPolishing(false);
    }
  };

  const handleUndo = () => {
    if (previousReason !== null) {
      setReason(previousReason);
      setPreviousReason(null);
      toast.info('Reverted to your previous note.');
    }
  };

  // Fetch staff's live Mango Overtime Bank balance when modal opens
  useEffect(() => {
    if (!isOpen || !currentUser?.id) return;

    let isMounted = true;
    const fetchBalance = async () => {
      try {
        setLoadingBank(true);
        const res = await axios.get(`${API_BASE}api/breaks/get_mango_break_bank.php?user_id=${currentUser.id}&t=${Date.now()}`);
        if (isMounted && res.data?.status === 'success') {
          const availHrs = Number(res.data.data?.summary?.available_break_hours || 0);
          const mins = Math.max(0, Math.round(availHrs * 60));
          setAvailableMinutes(mins);

          // Auto-adjust default duration to available time
          if (mins < 10) {
            setIsEmergencyMode(true);
            setSelectedCategory('Emergency');
            setEstimatedMinutes(15);
          } else if (mins < 15 && mins >= 10) {
            setEstimatedMinutes(10);
          } else if (mins >= 15) {
            setEstimatedMinutes(15);
          }
        }
      } catch (err) {
        console.error('Failed to fetch mango overtime balance:', err);
      } finally {
        if (isMounted) setLoadingBank(false);
      }
    };

    fetchBalance();
    return () => {
      isMounted = false;
    };
  }, [isOpen, currentUser]);

  if (!isOpen) return null;
  const isManualUser = Boolean(
    currentUser?.is_manual_break ||
    currentUser?.has_tiffin_break === 0 ||
    currentUser?.has_tiffin_break === false ||
    (Number(currentUser?.allocated_break_minutes) > 0 && currentUser?.has_tiffin_break === 0)
  );
  if (isManualUser) return null; // Guard: Manual break users use direct BreakWidget

  const canAffordAny = availableMinutes >= 10;
  const canAffordSelected = availableMinutes >= estimatedMinutes;
  const remainingMinutes = Math.max(0, availableMinutes - estimatedMinutes);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isEmergencyMode) {
      if (!reason.trim()) {
        toast.error('Emergency Break requires an explanation note for Admin.');
        return;
      }
      if (estimatedMinutes > 60) {
        toast.error('Emergency Break cannot exceed 60 minutes.');
        return;
      }

      setSubmitting(true);
      try {
        const fullReason = `[Emergency Gap - ${selectedCategory}] ${reason.trim()}`;
        const res = await axios.post(`${API_BASE}api/breaks/request_break.php`, {
          user_id: currentUser.id,
          break_type: 'Emergency Break',
          is_emergency: true,
          is_emergency_gap: true,
          reason: fullReason,
          estimated_minutes: estimatedMinutes
        });

        if (res.data.status === 'success') {
          toast.success(res.data.message || '🚨 Emergency Break request submitted to Admin!');
          if (onSuccess) onSuccess(res.data.data);
          onClose();
        } else {
          toast.error(res.data.message || 'Failed to submit break request.');
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Error submitting break request.');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (!canAffordAny) {
      toast.error('Insufficient Mango Overtime balance. You cannot request custom breaks without overtime.');
      return;
    }

    if (!canAffordSelected) {
      toast.error(`Your Mango Overtime balance (${availableMinutes} mins) is less than ${estimatedMinutes} mins.`);
      return;
    }

    if (!reason.trim()) {
      toast.error('Please enter a brief note explaining your break request.');
      return;
    }

    setSubmitting(true);
    try {
      const fullReason = `[${selectedCategory}] ${reason.trim()}`;
      const res = await axios.post(`${API_BASE}api/breaks/request_break.php`, {
        user_id: currentUser.id,
        break_type: 'Mango Break', // Standardized: all non-tiffin custom breaks are funded by Mango Overtime
        reason: fullReason,
        estimated_minutes: estimatedMinutes
      });

      if (res.data.status === 'success') {
        toast.success(res.data.message || '🥭 Mango Break request submitted to Admin!');
        if (onSuccess) onSuccess(res.data.data);
        onClose();
      } else {
        toast.error(res.data.message || 'Failed to submit break request.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error submitting break request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className={`px-6 py-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between shrink-0 transition-colors ${
          isEmergencyMode
            ? 'bg-gradient-to-r from-rose-500/15 via-red-500/10 to-transparent'
            : 'bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center text-2xl shadow-xs ${
              isEmergencyMode
                ? 'bg-rose-500/15 border-rose-500/30 text-rose-600'
                : 'bg-amber-500/15 border-amber-500/30'
            }`}>
              {isEmergencyMode ? '🚨' : '🥭'}
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                <span>{isEmergencyMode ? 'Request Emergency Break' : 'Request Custom Break'}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                  isEmergencyMode
                    ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700/60'
                    : 'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700/60'
                }`}>
                  {isEmergencyMode ? 'Work Shift Gap' : 'Mango Overtime'}
                </span>
              </h3>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {isEmergencyMode
                  ? 'Counts as an approved work shift gap for today (Admin Approval Required)'
                  : 'Funded by your earned Mango Overtime Bank'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="px-6 pt-3 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <button
            type="button"
            onClick={() => setIsEmergencyMode(false)}
            className={`pb-2.5 px-3 text-xs font-extrabold border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
              !isEmergencyMode
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <span>🥭</span>
            <span>Mango Overtime Break</span>
            {!loadingBank && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                canAffordAny
                  ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300/60'
                  : 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-300/60'
              }`}>
                {availableMinutes}m
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setIsEmergencyMode(true);
              if (selectedCategory !== 'Emergency' && selectedCategory !== 'Medical') {
                setSelectedCategory('Emergency');
              }
              if (estimatedMinutes > 60) setEstimatedMinutes(30);
            }}
            className={`pb-2.5 px-3 text-xs font-extrabold border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
              isEmergencyMode
                ? 'border-rose-500 text-rose-600 dark:text-rose-400'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            <span>🚨</span>
            <span>Emergency Gap Break</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-black border border-rose-300/60">
              0 Mango / Work Gap
            </span>
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto custom-scrollbar">

          {/* Mango Bank Balance Card */}
          <div className={`p-4 rounded-2xl border transition-all ${loadingBank
            ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
            : isEmergencyMode
              ? 'bg-gradient-to-r from-rose-500/10 via-red-500/5 to-amber-500/5 border-rose-300 dark:border-rose-800/60'
              : canAffordAny
                ? 'bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-emerald-500/10 border-amber-300 dark:border-amber-700/60'
                : 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800/60'
            }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">{isEmergencyMode ? '🚨' : '🥭'}</span>
                <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                  {isEmergencyMode ? 'Emergency Mode (Work Shift Gap):' : 'Your Mango Overtime Bank:'}
                </span>
              </div>
              {loadingBank ? (
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <FiRefreshCw className="animate-spin w-3.5 h-3.5" />
                  <span>Checking bank...</span>
                </div>
              ) : isEmergencyMode ? (
                <span className="text-sm font-black px-2.5 py-0.5 rounded-xl border bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700">
                  0 Mango Needed (Gap Mode)
                </span>
              ) : (
                <span className={`text-sm font-black px-2.5 py-0.5 rounded-xl border ${canAffordAny
                  ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                  : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700'
                  }`}>
                  {formatMinutesToHuman(availableMinutes)} ({availableMinutes} mins)
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              {isEmergencyMode
                ? <><strong>Emergency Gap Policy:</strong> ম্যাঙ্গো ব্যালেন্স ০ হলেও জরুরি প্রয়োজনে আপনি অ্যাডমিন অনুমোদনের আবেদন করতে পারেন। এটি আপনার দৈনিক কাজের সময়ে গ্যাপ (ঘাটতি) হিসেবে হিসাব হবে।</>
                : <><strong>Company Rule:</strong> Standard Tiffin Break is provided on daily schedule for free. All other custom breaks (personal, tea, emergency) are funded directly from your accumulated Overtime Bank.</>
              }
            </p>

            {/* Zero Balance Alert in Normal Mode */}
            {!loadingBank && !canAffordAny && !isEmergencyMode && (
              <div className="mt-3 p-3 rounded-xl bg-rose-100/80 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <FiAlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                  <div>
                    <strong>Insufficient Overtime Balance!</strong>
                    <p className="mt-0.5 text-[11px]">
                      আপনার কোনো ম্যাঙ্গো ওভারটাইম ব্যালেন্স নেই। জরুরি প্রয়োজনে নিচের অপশনটি ব্যবহার করে <strong>Emergency Break</strong> আবেদন করুন।
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsEmergencyMode(true);
                    setSelectedCategory('Emergency');
                  }}
                  className="px-3 py-1 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-extrabold shrink-0 cursor-pointer shadow-xs"
                >
                  Switch to Emergency
                </button>
              </div>
            )}
          </div>

          {/* Break Purpose / Reason Categories */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              1. What is this break for?
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {REASON_CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`p-2.5 rounded-2xl border text-left transition-all flex flex-col gap-1 cursor-pointer ${selectedCategory === cat.key
                    ? 'bg-amber-500/10 border-amber-500/50 text-amber-900 dark:text-amber-200 shadow-xs ring-2 ring-amber-500/20'
                    : 'border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                    }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">{cat.icon}</span>
                    <span className="text-xs font-black">{cat.label}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 line-clamp-1">{cat.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Estimated Duration Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                2. Select Duration
              </label>
              <span className="text-[11px] font-bold text-slate-400">
                {isEmergencyMode ? (
                  <span className="text-rose-500 font-extrabold">Emergency Max: 60 mins</span>
                ) : (
                  <>Max Allowed: <strong>{formatMinutesToHuman(availableMinutes)}</strong></>
                )}
              </span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-4 gap-2">
              {DURATION_OPTIONS.filter((dur) => (isEmergencyMode ? dur.value <= 60 : true)).map((dur) => {
                const disabled = !isEmergencyMode && dur.value > availableMinutes;
                const isSelected = estimatedMinutes === dur.value;
                return (
                  <button
                    key={dur.value}
                    type="button"
                    disabled={disabled}
                    onClick={() => setEstimatedMinutes(dur.value)}
                    className={`py-2.5 px-1 text-center rounded-xl border text-xs font-bold transition-all relative ${
                      disabled
                        ? 'opacity-35 bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed border-slate-200 dark:border-slate-800'
                        : isSelected
                          ? isEmergencyMode
                            ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white border-rose-600 shadow-xs shadow-rose-600/30 cursor-pointer font-black scale-102'
                            : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-amber-500 shadow-xs shadow-amber-500/30 cursor-pointer font-black scale-102'
                          : isEmergencyMode
                            ? 'border-rose-200 dark:border-rose-800 text-slate-700 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-slate-800 cursor-pointer'
                            : 'border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-slate-800 cursor-pointer'
                    }`}
                  >
                    <span>{dur.label}</span>
                    {disabled && (
                      <span className="block text-[8px] font-normal text-rose-500 uppercase tracking-tighter">
                        Exceeds
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Deduction Preview / Work Shift Impact */}
          {isEmergencyMode ? (
            <div className="p-3.5 rounded-2xl bg-rose-50/90 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold">
                <FiClock className="w-4 h-4 text-rose-600" />
                <span>Shift Time Impact:</span>
              </div>
              <div className="flex items-center gap-1.5 font-extrabold text-xs text-rose-700 dark:text-rose-300">
                <span>Recorded as:</span>
                <span className="px-2 py-0.5 rounded-lg bg-rose-600 text-white font-black text-[11px] shadow-xs">
                  -{estimatedMinutes}m Work Shift Gap
                </span>
              </div>
            </div>
          ) : (
            canAffordAny && (
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 text-xs flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                  <FiClock className="w-4 h-4 text-amber-500" />
                  <span>Overtime Impact:</span>
                </div>
                <div className="flex items-center gap-2 font-black text-xs">
                  <span className="text-rose-500">-{estimatedMinutes} mins</span>
                  <span className="text-slate-400">➔</span>
                  <span className="text-emerald-600 dark:text-emerald-400">
                    Left: {formatMinutesToHuman(remainingMinutes)}
                  </span>
                </div>
              </div>
            )
          )}

          {/* Reason Input with Quick Chips & AI Polish */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                3. Note / Explanation <span className="text-rose-500">*</span>
              </label>
              {previousReason && previousReason !== reason && (
                <button
                  type="button"
                  onClick={handleUndo}
                  className="text-[11px] font-semibold text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <FiRotateCcw size={12} />
                  <span>Undo Polish</span>
                </button>
              )}
            </div>

            {/* Quick Suggestions Chips */}
            <div className="mb-2.5">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 flex items-center gap-1">
                <span>⚡ Quick Suggestions:</span>
                <span className="text-slate-400 font-normal lowercase">(click to auto-fill)</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(CATEGORY_SUGGESTIONS[selectedCategory] || CATEGORY_SUGGESTIONS.Personal).map((sug, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setPreviousReason(reason);
                      setReason(sug);
                    }}
                    className={`text-[11px] px-2.5 py-1 rounded-full border transition-all text-left flex items-center gap-1.5 cursor-pointer ${
                      reason === sug
                        ? 'bg-amber-500/15 border-amber-500/60 text-amber-900 dark:text-amber-200 font-bold shadow-2xs ring-1 ring-amber-500/20'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-amber-400 hover:bg-amber-50/50 dark:hover:bg-slate-700/60 font-medium'
                    }`}
                  >
                    <span>💡</span>
                    <span>{sug}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Input with AI Polish button */}
            <div className="relative">
              <textarea
                rows={2}
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Taking 15 mins for personal work outside..."
                className="w-full px-4 py-2.5 pr-28 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all resize-none font-medium"
              />

              {/* AI Polish Button */}
              <button
                type="button"
                onClick={handlePolishWithAI}
                disabled={polishing || !reason.trim()}
                title="Rewrite your note into formal professional office English using Gemini AI"
                className={`absolute right-2.5 bottom-3.5 px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                  polishing
                    ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-300 cursor-wait'
                    : !reason.trim()
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-50'
                      : 'bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-purple-500/20 hover:scale-102 active:scale-95'
                }`}
              >
                {polishing ? (
                  <>
                    <FiRefreshCw className="animate-spin w-3 h-3 text-purple-600 dark:text-purple-300" />
                    <span>Polishing...</span>
                  </>
                ) : (
                  <>
                    <HiSparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                    <span>AI Polish</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Footer Notice */}
          {isEmergencyMode ? (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2.5 text-[11px] text-rose-800 dark:text-rose-300">
              <FiInfo size={16} className="shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <div>
                <strong className="block font-bold">Emergency Break Rules (জরুরি বিরতির নিয়মাবলী):</strong>
                <p className="mt-0.5 leading-relaxed text-slate-600 dark:text-slate-300">
                  ১. এই বিরতির জন্য কোনো ম্যাঙ্গো কাটবে না (Zero Mango deduction)।<br />
                  ২. অ্যাডমিনের অনুমোদন পেলেই টাইমার শুরু হবে এবং এই সময়টুকু আজকের শিফটের ঘাটতি (Work Gap) হিসেবে গণ্য হবে।<br />
                  ৩. প্রতি ক্যালেন্ডার মাসে সর্বোচ্চ ৩টি জরুরি বিরতি নেওয়া যাবে।
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 flex items-start gap-2.5 text-[11px] text-amber-800 dark:text-amber-300">
              <FiInfo size={15} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <p>
                Once submitted, Admin will receive a notification to approve your Mango break. Your timer starts upon approval, and you can end it when you return.
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || (isEmergencyMode ? !reason.trim() : (!canAffordAny || !canAffordSelected))}
              className={`px-6 py-2.5 rounded-xl text-white text-xs font-bold shadow-md active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                isEmergencyMode
                  ? 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 shadow-rose-600/30'
                  : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-500/20'
              }`}
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : isEmergencyMode ? (
                <>
                  <FiCheck size={14} />
                  <span>Request Emergency Break ({estimatedMinutes}m Gap)</span>
                </>
              ) : !canAffordAny ? (
                <>
                  <FiAlertCircle size={14} />
                  <span>Insufficient Mango Overtime</span>
                </>
              ) : !canAffordSelected ? (
                <>
                  <FiAlertCircle size={14} />
                  <span>Duration Exceeds Bank</span>
                </>
              ) : (
                <>
                  <FiCheck size={14} />
                  <span>Request Mango Break ({estimatedMinutes}m)</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default BreakRequestModal;

