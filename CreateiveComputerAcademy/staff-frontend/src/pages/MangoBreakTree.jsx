import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { soundFx } from '../utils/soundFx';
import {
  FiClock,
  FiAward,
  FiCalendar,
  FiCheckCircle,
  FiInfo,
  FiRefreshCw,
  FiTrendingUp,
  FiTrendingDown,
  FiSun,
  FiX,
  FiAlertCircle
} from 'react-icons/fi';
import { toast } from 'sonner';
import P2POvertimeMarket from '../components/P2POvertimeMarket';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Formats decimal hours (e.g. 0.64, 1.07, 232.47) into friendly human format:
 * "38 mins", "1 hr 4 mins", "232 hrs 28 mins", "13 hrs 2 mins"
 */
export const formatHoursToHuman = (val, { showSign = false, forceSign = null } = {}) => {
  if (val === null || val === undefined || isNaN(val)) return '0 mins';
  const num = Number(val);
  const isNeg = forceSign === '-' || (forceSign === null && num < 0);
  const abs = Math.abs(num);
  const h = Math.floor(abs);
  const m = Math.round((abs - h) * 60);

  const finalH = m === 60 ? h + 1 : h;
  const finalM = m === 60 ? 0 : m;

  let text = '';
  if (finalH === 0 && finalM === 0) {
    text = '0 mins';
  } else if (finalH === 0) {
    text = `${finalM} min${finalM === 1 ? '' : 's'}`;
  } else if (finalM === 0) {
    text = `${finalH} hr${finalH === 1 ? '' : 's'}`;
  } else {
    text = `${finalH} hr${finalH === 1 ? '' : 's'} ${finalM} min${finalM === 1 ? '' : 's'}`;
  }

  if (isNeg) return `-${text}`;
  if (showSign && num > 0) return `+${text}`;
  return text;
};

export const formatTime12 = (timeStr) => {
  if (!timeStr) return '';
  try {
    const rawTime = timeStr.includes(' ') ? timeStr.split(' ')[1] : timeStr;
    const [h, m] = rawTime.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${m} ${ampm}`;
  } catch {
    return timeStr;
  }
};

export const parseLedgerDate = (dateStr) => {
  if (!dateStr) return { dayOfWeek: '', dayNumber: '', monthStr: '', formatted: dateStr || '', raw: dateStr || '' };
  try {
    const cleanDate = dateStr.includes(' ') ? dateStr.split(' ')[0] : dateStr;
    const d = new Date(cleanDate + 'T00:00:00');
    if (isNaN(d.getTime())) {
      return { dayOfWeek: '', dayNumber: '', monthStr: '', formatted: cleanDate, raw: dateStr };
    }
    const dayOfWeek = d.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNumber = d.getDate();
    const monthStr = d.toLocaleDateString('en-US', { month: 'short' });
    const formatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return { dayOfWeek, dayNumber, monthStr, formatted, raw: cleanDate };
  } catch {
    return { dayOfWeek: '', dayNumber: '', monthStr: '', formatted: dateStr, raw: dateStr };
  }
};

export default function MangoBreakTree() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [selectedMango, setSelectedMango] = useState(null);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [claimDate, setClaimDate] = useState('');
  const [claimReason, setClaimReason] = useState('');
  const [claiming, setClaiming] = useState(false);
  const [activeLedgerTab, setActiveLedgerTab] = useState('overtime'); // 'overtime' | 'leaves' | 'claims'
  const [isMarketOpen, setIsMarketOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('current');
  const [availableMonths, setAvailableMonths] = useState([]);
  const [boyBouncing, setBoyBouncing] = useState(false);
  const [boyQuoteIndex, setBoyQuoteIndex] = useState(0);

  const handleBoyClick = (e) => {
    e?.stopPropagation?.();
    try {
      soundFx?.playPop?.();
    } catch { }
    setBoyBouncing(true);
    const boyQuotes = [
      extraBasketMangoesCount > 0
        ? `মাশাল্লাহ! গাছে ৪টি আর ঝুড়িতে +${extraBasketMangoesCount}টি পাকা আম জমা হয়েছে! 🧺🥭`
        : 'কখন যে পাকা টসটসে আমটা পড়বে! 🥭🤤',
      'এক কামড় দিতে পারলে মনটা জুড়িয়ে যেত! 😋',
      'গাছের ডালে ঝুলছে মিষ্টি আম, আমার ছুটি হবে রঙিন! ✨',
      'খোকা গাছে তাকিয়ে দিন গুনছে, ওভারটাইমের পাকা আম! 👦🥭'
    ];
    const currentQuote = boyQuotes[boyQuoteIndex % boyQuotes.length];
    setBoyQuoteIndex((prev) => (prev + 1) % boyQuotes.length);
    toast(currentQuote, {
      icon: '🥭',
      duration: 3500,
      description: 'খোকা অধীর আগ্রহে গাছের পাকা আমের দিকে চেয়ে আছে!'
    });
    setTimeout(() => setBoyBouncing(false), 700);
  };

  const fetchTreeData = useCallback(async (targetMonth = selectedMonth) => {
    if (!currentUser?.id) return;
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}api/breaks/get_mango_break_bank.php?user_id=${currentUser.id}&month=${targetMonth}&t=${Date.now()}`);
      if (res.data.status === 'success') {
        setData(res.data.data);
        if (res.data.data?.summary?.available_months) {
          setAvailableMonths(res.data.data.summary.available_months);
        }
        if (targetMonth === 'current' && res.data.data?.summary?.selected_month) {
          setSelectedMonth(res.data.data.summary.selected_month);
        }
      } else {
        toast.error(res.data.message || 'Failed to load Mango Tree data');
      }
    } catch (err) {
      console.error('Failed to load mango break bank:', err);
      toast.error('Network error loading Mango Break Bank');
    } finally {
      setLoading(false);
    }
  }, [currentUser, selectedMonth]);

  useEffect(() => {
    fetchTreeData('current');
  }, [currentUser]);

  const handleMangoClick = (mango) => {
    try {
      soundFx?.play('click');
    } catch { }
    setSelectedMango(mango);
    setIsClaimModalOpen(true);
  };

  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    if (!claimDate) {
      toast.error('Please pick a date for your earned break day.');
      return;
    }
    setClaiming(true);
    try {
      const res = await axios.post(`${API_BASE}api/breaks/claim_mango_break.php`, {
        user_id: currentUser.id,
        mango_index: selectedMango?.id || 1,
        hours: selectedMango?.hours || 8,
        leave_date: claimDate,
        reason: claimReason || 'Redeemed from Mango Tree Overtime Bank'
      });

      if (res.data.status === 'success') {
        try {
          soundFx?.play('success');
        } catch { }
        toast.success(res.data.message || '🥭 Mango Break Redeemed Successfully!');
        setIsClaimModalOpen(false);
        setClaimDate('');
        setClaimReason('');
        await fetchTreeData();
      } else {
        toast.error(res.data.message || 'Failed to claim break');
      }
    } catch (err) {
      toast.error('Error claiming break day');
    } finally {
      setClaiming(false);
    }
  };

  const summary = data?.summary || {};
  const ripeCount = summary?.ripe_mangoes_count || 0;
  // All ripe mangoes earned by the user
  const allRipeMangoes = (data?.mangoes || []).slice(0, ripeCount);
  // Display rule: Maximum 4 ripe mangoes on the tree branches at once
  const maxTreeRipeMangoes = 4;
  const treeMangoes = allRipeMangoes.slice(0, maxTreeRipeMangoes);
  // Any extra ripe mangoes beyond 4 are stored in the rustic Harvest Basket
  const extraBasketMangoesCount = Math.max(0, ripeCount - maxTreeRipeMangoes);
  const growingMango = data?.growing_mango || null;
  const shiftHours = summary?.shift_hours || 8;
  const totalOvertime = summary?.total_overtime_hours || 0;
  const availableBreakHours = summary?.available_break_hours || 0;
  const availableBreakDays = summary?.available_break_days || 0;

  // Safe collision-free coordinates for the 4 tree mangoes (Crown Apex, High Left, High Right, Mid Right)
  const safeTreePositions = [
    { x: 38, y: 24, branch: 'crown-left' },   // High Left Crown (y=24% is ~163px, boy's head is at y=440px -> 277px clearance!)
    { x: 62, y: 24, branch: 'crown-right' },  // High Right Crown
    { x: 50, y: 20, branch: 'crown-apex' },   // Apex Center Top
    { x: 66, y: 34, branch: 'mid-right' }     // Mid Right Branch (far right, opposite side from boy)
  ];

  return (
    <div className="mx-auto space-y-8 animate-fadeIn  pb-12">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-teal-500/10 dark:from-emerald-950/40 dark:via-slate-900 dark:to-amber-950/30 p-6 md:p-8 rounded-3xl border border-amber-500/20 dark:border-emerald-500/20 shadow-xs relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700/60 text-amber-800 dark:text-amber-300 text-xs font-black uppercase tracking-wider">
            <span>🌳</span> Overtime-to-Break Orchard
          </div>
          <h1 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <span>The Mango Break Tree</span>
            <span className="text-3xl animate-bounce">🥭</span>
          </h1>
          <p className="text-slate-600 dark:text-slate-300 text-xs md:text-sm max-w-2xl leading-relaxed">
            Your extra work hours naturally bloom into sweet break rewards! Every <strong>{shiftHours} hours of accumulated overtime</strong> grows <strong>1 ripe Mango</strong> (equal to 1 full paid day of break).
          </p>
        </div>

        <div className="flex items-center gap-2.5 z-10 shrink-0 flex-wrap">
          {/* Month Selector Dropdown */}
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={(e) => {
                const newMonth = e.target.value;
                setSelectedMonth(newMonth);
                fetchTreeData(newMonth);
              }}
              className="appearance-none flex items-center gap-2 pl-9 pr-8 py-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 border-2 border-indigo-500/40 dark:border-indigo-500/50 focus:border-indigo-500 rounded-2xl text-xs font-black text-slate-800 dark:text-slate-100 transition shadow-xs cursor-pointer outline-none"
            >
              {(availableMonths.length > 0 ? availableMonths : [
                { month_key: 'current', label: '📅 Current Month' },
                { month_key: 'all', label: '🌐 All Time (সব সময়)' }
              ]).map((m) => (
                <option key={m.month_key} value={m.month_key}>
                  {m.label}
                </option>
              ))}
            </select>
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-500 text-sm">
              📅
            </div>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">
              ▼
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsMarketOpen(true)}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-2xl text-xs font-black transition shadow-lg shadow-amber-500/25 active:scale-95 cursor-pointer"
          >
            <span>🛒</span>
            <span>P2P Overtime Market</span>
          </button>

          <button
            onClick={() => fetchTreeData(selectedMonth)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 transition shadow-xs cursor-pointer disabled:opacity-50"
          >
            <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* 4 Stat Cards: Expected Target ➔ Actual Worked ➔ Total Gap (Shortfall + Leaves) ➔ Net Overtime Balance */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Expected Target */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-indigo-400/60 transition duration-300 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-wider border border-indigo-200 dark:border-indigo-800/60">
                1. Target &bull; {summary?.selected_month_label || 'Month'}
              </span>
              <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl text-indigo-600 dark:text-indigo-400">
                <FiClock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-baseline gap-2 flex-wrap">
              <span>{formatHoursToHuman(summary?.total_expected_hours)}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                ({summary?.total_expected_hours || 0}h)
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Scheduled duty requirement based on roster
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
              <span>Standard Shift:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{shiftHours} hrs / day</span>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
              <span>Duty Sessions:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{summary?.total_sessions_counted || 0} days</span>
            </div>
          </div>
        </div>

        {/* Card 2: Actual Worked */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-blue-400/60 transition duration-300 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-wider border border-blue-200 dark:border-blue-800/60">
                2. Worked &bull; {summary?.selected_month_label || 'Month'}
              </span>
              <div className="p-2 bg-blue-50 dark:bg-blue-950/60 rounded-xl text-blue-600 dark:text-blue-400">
                <FiCheckCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-blue-600 dark:text-blue-400 tracking-tight flex items-baseline gap-2 flex-wrap">
              <span>{formatHoursToHuman(summary?.total_worked_hours)}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-100/70 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300">
                ({summary?.total_worked_hours || 0}h)
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Total clocked-in work time verified
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5 text-xs">
            <button
              type="button"
              onClick={() => setActiveLedgerTab('overtime')}
              className="w-full flex items-center justify-between text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition cursor-pointer text-left"
            >
              <span className="underline decoration-dotted">Gross Overtime:</span>
              <span className="font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                +{formatHoursToHuman(summary?.total_overtime_hours)} (+{summary?.total_overtime_hours || 0}h)
                <span className="text-[10px]">➔</span>
              </span>
            </button>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
              <span>Verified Sessions:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{summary?.total_sessions_counted || 0} logged</span>
            </div>
          </div>
        </div>

        {/* Card 3: Total Gap (Deficits + Leaves) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-rose-400/60 transition duration-300 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-wider border border-rose-200 dark:border-rose-800/60">
                3. Gap &bull; {summary?.selected_month_label || 'Month'}
              </span>
              <div className="p-2 bg-rose-50 dark:bg-rose-950/60 rounded-xl text-rose-600 dark:text-rose-400">
                <FiAlertCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-rose-600 dark:text-rose-400 tracking-tight flex items-baseline gap-2 flex-wrap">
              <span>-{formatHoursToHuman(summary?.total_gap_hours)}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-rose-100/70 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300">
                (-{summary?.total_gap_hours || 0}h)
              </span>
            </div>
            <p className="text-xs text-rose-600/90 dark:text-rose-400/90 mt-1 font-semibold flex items-center gap-1">
              <span>ℹ️</span> Shift shortfalls are handled in Monthly Payroll
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5 text-xs">
            <button
              type="button"
              onClick={() => setActiveLedgerTab('short_time')}
              className="w-full flex items-center justify-between text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer text-left"
            >
              <span className="underline decoration-dotted">Shift Shortfalls:</span>
              <span className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                -{formatHoursToHuman(summary?.total_short_hours)}
                <span className="text-[10px]">➔</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveLedgerTab('leaves')}
              className="w-full flex items-center justify-between text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer text-left"
            >
              <span className="underline decoration-dotted">Leaves & Absent:</span>
              <span className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1 flex-wrap justify-end">
                -{formatHoursToHuman(summary?.total_leave_deducted_hours)} ({summary?.total_leave_days || 0} {summary?.total_leave_days === 1 ? 'day' : 'days'})
                {Number(summary?.total_absent_days || 0) > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-black">
                    {summary.total_absent_days} absent
                  </span>
                )}
                <span className="text-[10px]">➔</span>
              </span>
            </button>
          </div>
        </div>

        {/* Card 4: Net Overtime Balance vs Overtime Debt */}
        <div className={`text-white p-6 rounded-3xl shadow-md relative overflow-hidden flex flex-col justify-between group hover:shadow-lg transition duration-300 ${summary?.has_overtime_debt
          ? 'bg-gradient-to-br from-rose-600 via-rose-700 to-red-800 hover:shadow-rose-600/30'
          : 'bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 hover:shadow-amber-500/20'
          }`}>
          <div>
            <div className="flex items-center justify-between text-white/90 mb-3">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-xs border ${summary?.has_overtime_debt
                ? 'bg-black/25 text-rose-100 border-rose-300/40'
                : 'bg-white/20 text-white border-white/20'
                }`}>
                {summary?.has_overtime_debt ? '4. Debt' : '4. Overtime Balance'} &bull; {summary?.selected_month_label || 'Month'}
              </span>
              <span className="text-2xl group-hover:scale-125 transition-transform duration-300">
                {summary?.has_overtime_debt ? '⚠️' : '🥭'}
              </span>
            </div>

            {summary?.has_overtime_debt ? (
              <>
                <div className="text-3xl font-black text-white tracking-tight flex items-baseline gap-2 flex-wrap">
                  <span>-{formatHoursToHuman(summary?.overtime_debt_hours)}</span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-white/20 text-rose-100">
                    (-{summary?.overtime_debt_hours}h)
                  </span>
                </div>
                <div className="mt-1 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/30 text-rose-100 font-bold text-xs border border-rose-400/30">
                  <span>⚠️</span>
                  <span>0 Ripe Mangoes (Debt active &bull; Unexcused absence)</span>
                </div>
              </>
            ) : (
              <>
                <div className="text-3xl font-black text-white tracking-tight flex items-baseline gap-2 flex-wrap">
                  <span>+{formatHoursToHuman(availableBreakHours)}</span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-white/25 text-white">
                    ({availableBreakHours}h)
                  </span>
                </div>
                <div className="mt-1 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/20 text-white font-black text-xs">
                  <span>🥭</span>
                  <span>{ripeCount} Ripe {ripeCount === 1 ? 'Mango' : 'Mangoes'} ({availableBreakDays} Full Days Break)</span>
                </div>
              </>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-white/20 space-y-1.5 text-xs text-white/90">
            <div className="flex items-center justify-between text-[11px]">
              <span>Overtime Reward Bank:</span>
              <span className="font-semibold">
                {summary?.has_overtime_debt
                  ? `Gross +${formatHoursToHuman(summary?.total_gross_overtime_hours)} - Debt ${formatHoursToHuman(summary?.total_deducted_hours)}`
                  : `+${formatHoursToHuman(summary?.total_gross_overtime_hours || summary?.total_overtime_hours)} (টাকা ৳ বা ছুটি 🌴)`}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] pt-0.5">
              <span>Tiffin Impact:</span>
              <span className="font-bold">
                {(summary?.tiffin_summary?.net_tiffin_delta || 0) >= 0
                  ? `+${summary?.tiffin_summary?.net_tiffin_delta || 0}m bonus`
                  : `${summary?.tiffin_summary?.net_tiffin_delta}m penalty`}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] pt-1">
              {summary?.has_overtime_debt ? (
                <span className="text-rose-200 font-semibold">
                  Clear {formatHoursToHuman(summary?.overtime_debt_hours)} debt to start ripening mangoes
                </span>
              ) : (
                <>
                  <span>Next Mango: {summary?.progress_to_next_mango || 0}%</span>
                  {ripeCount > 0 ? (
                    <button
                      type="button"
                      onClick={() => {
                        const firstRipe = allRipeMangoes.find(m => m.type === 'ripe') || allRipeMangoes[0];
                        if (firstRipe) {
                          setSelectedMango(firstRipe);
                          setIsClaimModalOpen(true);
                        }
                      }}
                      className="font-black text-white underline hover:text-amber-200 cursor-pointer"
                    >
                      Redeem (টাকা বা ছুটি) ➔
                    </button>
                  ) : (
                    <span className="text-amber-200 font-bold">
                      ({formatHoursToHuman(summary?.remaining_hours_for_next || shiftHours)} বাকি)
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Overtime Debt Alert Notification Banner */}
      {summary?.has_overtime_debt && (
        <div className="p-4 md:p-5 rounded-3xl bg-gradient-to-r from-rose-500/15 via-red-500/10 to-amber-500/10 border-2 border-rose-500/30 text-rose-900 dark:text-rose-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-600 text-white shadow-md text-lg shrink-0">
              ⚠️
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-sm md:text-base text-rose-800 dark:text-rose-100">
                  আম গাছে ঘাটতি ঋণ চালু রয়েছে (-{formatHoursToHuman(summary?.overtime_debt_hours)})
                </h3>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-600 text-white uppercase tracking-wider">
                  Overtime Debt Active
                </span>
              </div>
              <p className="text-xs text-rose-700/90 dark:text-rose-300 mt-1 leading-relaxed">
                অনুপস্থিতির কারণে আপনার আম গাছ থেকে ৮ ঘণ্টার ঘাটতি ঋণ প্রযোজ্য হয়েছে। ভবিষ্যৎ কর্মদিবসে অতিরিক্ত কাজ (Overtime) অথবা টিফিন বিরতি সাশ্রয় (+বোনাস মিনিট) থেকে প্রথমে এই <strong>-{formatHoursToHuman(summary?.overtime_debt_hours)}</strong> ঘাটতি স্বয়ংক্রিয়ভাবে পরিশোধ হবে, এরপরেই গাছে নতুন পাকা আম ধরবে!
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveLedgerTab('leaves')}
            className="shrink-0 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md transition cursor-pointer"
          >
            অনুপস্থিতির হিসাব দেখুন ➔
          </button>
        </div>
      )}

      {/* Visual Calculation Workflow Ribbon */}
      <div className="bg-white dark:bg-slate-900 p-4 md:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px]">
          <FiInfo className="w-4 h-4 text-amber-500 shrink-0" />
          <span>Calculation Sequence:</span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 text-xs font-semibold">
          <div className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50">
            1. Expected: <strong>{formatHoursToHuman(summary?.total_expected_hours)}</strong>
          </div>
          <span className="text-slate-400 font-black">➔</span>
          <div className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50">
            2. Worked: <strong>{formatHoursToHuman(summary?.total_worked_hours)}</strong>
          </div>
          <span className="text-slate-400 font-black">➔</span>
          <div className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50 flex items-center gap-1.5">
            <span>3. Shortfall: <strong>-{formatHoursToHuman(summary?.total_short_hours)}</strong></span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-rose-200/60 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 font-bold">
              Payroll Salary ৳
            </span>
          </div>
          {Number(summary?.total_cashed_out_overtime_hours || 0) > 0 && (
            <>
              <span className="text-slate-400 font-black">➔</span>
              <div className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50">
                4. Cashed Out ৳: <strong>-{formatHoursToHuman(summary?.total_cashed_out_overtime_hours)}</strong>
              </div>
            </>
          )}
          <span className="text-slate-400 font-black">➔</span>
          <button
            type="button"
            onClick={() => setActiveLedgerTab('tiffin')}
            title="Click to view Tiffin break efficiency details"
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 cursor-pointer transition hover:scale-105 ${Number(summary?.total_tiffin_bonus_hours || 0) > 0
              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50'
              : Number(summary?.total_tiffin_penalty_hours || 0) > 0
                ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/50'
                : 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/50'
              }`}
          >
            <span>🥪 Tiffin Impact: <strong>{
              (summary?.tiffin_summary?.net_tiffin_delta || 0) >= 0
                ? `+${summary?.tiffin_summary?.net_tiffin_delta || 0}m`
                : `${summary?.tiffin_summary?.net_tiffin_delta}m`
            }</strong></span>
          </button>
          <span className="text-slate-400 font-black">➔</span>
          {summary?.has_overtime_debt ? (
            <div className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 text-white font-black shadow-xs flex items-center gap-1.5 animate-pulse">
              <span>Overtime Debt: <strong>-{formatHoursToHuman(summary?.overtime_debt_hours)}</strong></span>
              <span>(0 Mangoes ⚠️)</span>
            </div>
          ) : (
            <div className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black shadow-xs flex items-center gap-1.5">
              <span>Net Balance: <strong>+{formatHoursToHuman(availableBreakHours)}</strong></span>
              <span>= {ripeCount} Mangoes 🥭</span>
            </div>
          )}
        </div>
      </div>

      {/* The Visual Mango Tree Interactive Canvas */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 md:p-8 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>Interactive Mango Orchard</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-700/60">
                Live Interactive Tree
              </span>
            </h2>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Click on any ripe mango 🥭 hanging on the tree to inspect details, see which days earned it, and book your break day!
            </p>
          </div>

          <div className="flex items-center gap-3 md:gap-4 text-xs font-bold shrink-0 bg-slate-50 dark:bg-slate-800/80 p-2.5 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex-wrap">
            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
              <span className="text-base">🥭</span>
              <span>
                Ripe ({ripeCount})
                {extraBasketMangoesCount > 0 && (
                  <span className="ml-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                    (গাছে ৪টি • ঝুড়িতে {extraBasketMangoesCount}টি)
                  </span>
                )}
              </span>
            </div>
            <div className="w-px h-4 bg-slate-300 dark:bg-slate-700" />
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <span className="text-base">🍏</span>
              <span>Growing ({growingMango ? '1' : '0'})</span>
            </div>
            {!summary?.is_all_time && (summary?.all_time_ripe_mangoes_count || 0) > 0 && (
              <>
                <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 hidden sm:block" />
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMonth('all');
                    fetchTreeData('all');
                  }}
                  title="Click to view all cumulative ripe mangoes across all time"
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition cursor-pointer text-[11px] font-bold border border-indigo-200 dark:border-indigo-800/60"
                >
                  <span>🌐 All-Time Bank: {summary?.all_time_ripe_mangoes_count} Ripe 🥭</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tree Container Canvas */}
        <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] max-h-[620px] min-h-[420px] bg-gradient-to-b from-sky-100/80 via-emerald-50/50 to-amber-50/70 dark:from-slate-950 dark:via-emerald-950/25 dark:to-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden flex items-center justify-center select-none shadow-inner">
          {/* Embedded Custom Keyframe Animations */}
          <style>{`
            @keyframes mangoSway {
              0%, 100% { transform: rotate(-3.5deg); }
              50% { transform: rotate(3.5deg); }
            }
            @keyframes foliageDrift {
              0%, 100% { transform: scale(1) rotate(0deg); }
              50% { transform: scale(1.008) rotate(0.4deg); }
            }
            @keyframes sunRayGleam {
              0%, 100% { opacity: 0.2; }
              50% { opacity: 0.35; }
            }
            @keyframes basketGlow {
              0%, 100% { box-shadow: 0 4px 20px rgba(245, 158, 11, 0.25); }
              50% { box-shadow: 0 8px 30px rgba(245, 158, 11, 0.45); }
            }
            @keyframes boyIdleBreath {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-3px); }
            }
            @keyframes boyThoughtFloat {
              0%, 100% { transform: translateY(0px); opacity: 0.95; }
              50% { transform: translateY(-5px); opacity: 1; }
            }
            @keyframes boyJumpAction {
              0% { transform: translateY(0) scale(1, 1); }
              20% { transform: translateY(5px) scale(1.06, 0.94); }
              50% { transform: translateY(-28px) scale(0.95, 1.06); }
              75% { transform: translateY(-8px) scale(1.02, 0.98); }
              100% { transform: translateY(0) scale(1, 1); }
            }
            .boy-idle {
              animation: boyIdleBreath 3.2s ease-in-out infinite;
            }
            .boy-jumping {
              animation: boyJumpAction 0.65s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
            }
          `}</style>

          {/* Sky Ambient Light & Sunlight Beams */}
          <div className="absolute top-4 left-8 w-40 h-40 bg-amber-300/30 dark:bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-8 right-16 w-52 h-52 bg-emerald-400/25 dark:bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -top-12 left-1/4 w-72 h-36 bg-yellow-200/20 dark:bg-yellow-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* Realistic Sculpted Mango Tree SVG */}
          <svg
            viewBox="0 0 1000 680"
            className="w-full h-full object-contain pointer-events-none drop-shadow-lg"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Sun Flare Gradient */}
              <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fef08a" stopOpacity="0.9" />
                <stop offset="35%" stopColor="#fde047" stopOpacity="0.6" />
                <stop offset="70%" stopColor="#f59e0b" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
              </radialGradient>

              {/* Realistic Bark & Wood Gradients */}
              <linearGradient id="trunkMainGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3d1d06" />
                <stop offset="25%" stopColor="#5c2e0b" />
                <stop offset="55%" stopColor="#783a0e" />
                <stop offset="80%" stopColor="#542607" />
                <stop offset="100%" stopColor="#2e1302" />
              </linearGradient>

              <linearGradient id="barkHighlightGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#9a3412" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#78350f" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#451a03" stopOpacity="1" />
              </linearGradient>

              {/* Foliage Layer 1: Deep Core Foliage (Shadows & Depth) */}
              <radialGradient id="deepFoliage" cx="45%" cy="40%" r="65%">
                <stop offset="0%" stopColor="#166534" />
                <stop offset="55%" stopColor="#14532d" />
                <stop offset="85%" stopColor="#052e16" />
                <stop offset="100%" stopColor="#022c22" />
              </radialGradient>

              {/* Foliage Layer 2: Mid-Canopy Lush Mango Leaves */}
              <radialGradient id="midFoliage" cx="40%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#4ade80" />
                <stop offset="40%" stopColor="#22c55e" />
                <stop offset="75%" stopColor="#16a34a" />
                <stop offset="100%" stopColor="#15803d" />
              </radialGradient>

              {/* Foliage Layer 3: Sun-drenched Canopy Highlights */}
              <radialGradient id="sunlitFoliage" cx="35%" cy="30%" r="65%">
                <stop offset="0%" stopColor="#bbf7d0" />
                <stop offset="35%" stopColor="#86efac" />
                <stop offset="75%" stopColor="#22c55e" />
                <stop offset="100%" stopColor="#16a34a" />
              </radialGradient>

              {/* Crown Sun-Kissed Crest */}
              <radialGradient id="crownFoliage" cx="50%" cy="20%" r="60%">
                <stop offset="0%" stopColor="#dcfce7" />
                <stop offset="40%" stopColor="#4ade80" />
                <stop offset="80%" stopColor="#15803d" />
                <stop offset="100%" stopColor="#14532d" />
              </radialGradient>

              {/* Rolling Grassy Hills Gradients */}
              <linearGradient id="hillForeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#22c55e" />
                <stop offset="45%" stopColor="#16a34a" />
                <stop offset="100%" stopColor="#14532d" />
              </linearGradient>

              <linearGradient id="hillBackGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#4ade80" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#15803d" stopOpacity="0.9" />
              </linearGradient>

              {/* Soft Drop Shadow Filter for Leaves */}
              <filter id="foliageShadow" x="-10%" y="-10%" width="120%" height="120%">
                <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#064e3b" floodOpacity="0.35" />
              </filter>

              {/* Boy Character Design Gradients */}
              <linearGradient id="boySkinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffedd5" />
                <stop offset="100%" stopColor="#fed7aa" />
              </linearGradient>

              <linearGradient id="boyHairGrad" x1="0%" y1="0%" x2="60%" y2="100%">
                <stop offset="0%" stopColor="#451a03" />
                <stop offset="60%" stopColor="#271103" />
                <stop offset="100%" stopColor="#0f0501" />
              </linearGradient>

              <linearGradient id="boyShirtGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="45%" stopColor="#ea580c" />
                <stop offset="100%" stopColor="#c2410c" />
              </linearGradient>

              <linearGradient id="boyShortsGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1e3a8a" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>

              <linearGradient id="boySneakerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#b91c1c" />
              </linearGradient>

              <linearGradient id="boyBubbleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#fef3c7" />
              </linearGradient>
            </defs>

            {/* Sun in upper corner with radiant sunbeams */}
            <circle cx="110" cy="80" r="70" fill="url(#sunGlow)" />
            <polygon points="110,80 320,320 230,360" fill="#fef08a" opacity="0.07" style={{ animation: 'sunRayGleam 6s ease-in-out infinite' }} />
            <polygon points="110,80 520,380 430,420" fill="#fef08a" opacity="0.05" style={{ animation: 'sunRayGleam 7s ease-in-out infinite' }} />
            <polygon points="110,80 680,280 600,320" fill="#fef08a" opacity="0.04" style={{ animation: 'sunRayGleam 8s ease-in-out infinite' }} />

            {/* Background Hill */}
            <path
              d="M-50,640 Q240,580 500,600 T1050,620 L1050,680 L-50,680 Z"
              fill="url(#hillBackGrad)"
            />

            {/* Foreground Grassy Lawn & Orchard Ground Mound */}
            <path
              d="M-50,670 Q280,575 500,580 T1050,605 L1050,680 L-50,680 Z"
              fill="url(#hillForeGrad)"
            />
            {/* Tree Base Root Mound Soil Shadow */}
            <ellipse cx="500" cy="635" rx="220" ry="25" fill="#0f391b" opacity="0.45" />

            {/* Dotted Orchard Lawn Flowers (Buttercups & Wild Flora) */}
            <circle cx="160" cy="625" r="3.5" fill="#fde047" />
            <circle cx="168" cy="628" r="2.5" fill="#ffffff" />
            <circle cx="270" cy="610" r="3" fill="#fde047" />
            <circle cx="360" cy="622" r="3" fill="#ffffff" />
            <circle cx="680" cy="615" r="3.5" fill="#fde047" />
            <circle cx="750" cy="628" r="3" fill="#fbcfe8" />
            <circle cx="860" cy="625" r="3.5" fill="#fde047" />

            {/* Fallen Golden Mango Leaves on the Meadow */}
            <path d="M320,626 Q332,621 342,627 Q332,631 320,626 Z" fill="#ca8a04" opacity="0.85" />
            <path d="M640,628 Q654,624 664,630 Q652,634 640,628 Z" fill="#ca8a04" opacity="0.85" />
            <path d="M410,634 Q422,630 432,635 Q420,638 410,634 Z" fill="#15803d" opacity="0.75" />

            {/* ============================================================== */}
            {/* 1. DEEP BACKGROUND FOLIAGE CANOPY (Rich Dense Core & Shadow)   */}
            {/* ============================================================== */}
            <g filter="url(#foliageShadow)">
              {/* Massive lush deep background core */}
              <path
                d="M120,330 C70,270 90,190 160,150 C210,100 300,90 370,130 C420,70 530,60 610,100 C670,70 770,90 820,150 C890,180 920,260 880,330 C840,400 740,410 660,390 C580,420 420,420 340,390 C260,420 160,400 120,330 Z"
                fill="url(#deepFoliage)"
              />
            </g>

            {/* ============================================================== */}
            {/* 2. CONTINUOUS SCULPTED TREE TRUNK & ORGANIC BRANCH SKELETON    */}
            {/* ============================================================== */}
            <g id="treeWoodWork">
              {/* Single Continuous Solid Organic Tree Trunk & Sweeping Limbs */}
              <path
                d="M 370,640 
                   C 410,605 440,555 450,485 
                   C 445,430 420,390 350,350 
                   C 290,320 220,300 150,290 
                   C 210,310 280,335 340,370 
                   C 385,398 410,430 425,470
                   C 400,380 370,300 330,220 
                   C 355,230 380,270 410,330 
                   C 435,380 445,420 455,470
                   C 465,410 475,340 485,260 
                   C 490,200 495,160 500,140 
                   C 505,160 510,200 515,260 
                   C 525,340 535,410 545,470
                   C 555,420 565,380 590,330 
                   C 620,270 645,230 670,220 
                   C 630,300 600,380 575,470
                   C 590,430 615,398 660,370 
                   C 720,335 790,310 850,290 
                   C 780,300 710,320 650,350 
                   C 580,390 555,430 550,485 
                   C 560,555 590,605 630,640 
                   C 560,645 440,645 370,640 Z"
                fill="url(#trunkMainGrad)"
              />

              {/* Natural Bark Grain Striations & Shadow Crevices */}
              <path d="M410,635 C435,600 450,560 455,500" stroke="#1c0b02" strokeWidth="4.5" strokeLinecap="round" opacity="0.65" fill="none" />
              <path d="M590,635 C565,600 550,560 545,500" stroke="#1c0b02" strokeWidth="4.5" strokeLinecap="round" opacity="0.65" fill="none" />
              <path d="M500,640 C500,580 502,520 498,460" stroke="#1c0b02" strokeWidth="5.5" strokeLinecap="round" opacity="0.6" fill="none" />

              <path d="M475,540 C470,490 460,440 435,395" stroke="#78350f" strokeWidth="3.5" opacity="0.75" fill="none" />
              <path d="M525,540 C530,490 540,440 565,395" stroke="#2e1302" strokeWidth="3.5" opacity="0.65" fill="none" />
              <path d="M490,460 C485,390 470,320 440,260" stroke="#9a3412" strokeWidth="2.5" opacity="0.75" fill="none" />
              <path d="M510,460 C515,390 530,320 560,260" stroke="#451a03" strokeWidth="3" opacity="0.65" fill="none" />

              {/* Secondary Wood Twigs Weaving Towards Mango Zones */}
              {/* Left bough twigs */}
              <path d="M340,370 C290,340 240,320 180,310 C210,325 260,350 310,375" stroke="#5c2e0b" strokeWidth="6" strokeLinecap="round" fill="none" />
              <path d="M250,330 C220,300 180,270 140,250 C170,270 210,295 240,325" stroke="#451a03" strokeWidth="4.5" strokeLinecap="round" fill="none" />
              {/* Right bough twigs */}
              <path d="M660,370 C710,340 760,320 820,310 C790,325 740,350 690,375" stroke="#5c2e0b" strokeWidth="6" strokeLinecap="round" fill="none" />
              <path d="M750,330 C780,300 820,270 860,250 C830,270 790,295 760,325" stroke="#451a03" strokeWidth="4.5" strokeLinecap="round" fill="none" />
              {/* High Crown twigs */}
              <path d="M485,260 C460,220 420,180 370,160 C410,180 445,215 475,250" stroke="#451a03" strokeWidth="4" strokeLinecap="round" fill="none" />
              <path d="M515,260 C540,220 580,180 630,160 C590,180 555,215 525,250" stroke="#451a03" strokeWidth="4" strokeLinecap="round" fill="none" />
            </g>

            {/* ============================================================== */}
            {/* 3. MID & FOREGROUND FOLIAGE CLUSTERS NESTLED ON BRANCHES      */}
            {/* ============================================================== */}
            <g id="lushCanopy" style={{ animation: 'foliageDrift 9s ease-in-out infinite' }}>
              {/* Outer Left Canopy Cloud */}
              <path
                d="M130,320 C90,290 100,230 140,200 C120,160 160,110 210,120 C250,80 310,90 340,130 C380,100 430,120 450,160 C470,200 450,250 410,270 C430,310 390,360 330,360 C270,370 220,360 180,340 C150,350 135,335 130,320 Z"
                fill="url(#midFoliage)"
                opacity="0.94"
              />

              {/* Outer Right Canopy Cloud */}
              <path
                d="M870,320 C910,290 900,230 860,200 C880,160 840,110 790,120 C750,80 690,90 660,130 C620,100 570,120 550,160 C530,200 550,250 590,270 C570,310 610,360 670,360 C730,370 780,360 820,340 C850,350 865,335 870,320 Z"
                fill="url(#midFoliage)"
                opacity="0.94"
              />

              {/* Center Crown Canopy Cloud */}
              <path
                d="M310,250 C280,200 310,140 360,120 C400,80 470,75 510,110 C560,70 630,85 660,130 C700,160 700,220 660,260 C680,310 630,360 570,355 C510,370 460,360 410,350 C360,360 320,310 310,250 Z"
                fill="url(#midFoliage)"
                opacity="0.96"
              />

              {/* Sun-Kissed Crests */}
              <path
                d="M210,210 C190,170 220,120 270,130 C310,100 360,110 380,150 C410,130 450,150 460,190 C440,230 390,250 350,240 C310,260 250,250 210,210 Z"
                fill="url(#sunlitFoliage)"
                opacity="0.92"
              />
              <path
                d="M590,210 C570,160 620,120 670,130 C710,100 760,115 780,155 C810,140 840,170 840,210 C820,240 770,255 730,240 C690,260 630,250 590,210 Z"
                fill="url(#sunlitFoliage)"
                opacity="0.9"
              />

              {/* Highest Sunlit Tree Crown */}
              <path
                d="M370,130 C350,80 400,30 460,25 C520,20 570,50 590,95 C620,85 650,115 640,150 C610,185 550,190 510,180 C460,195 410,180 370,130 Z"
                fill="url(#crownFoliage)"
                opacity="0.95"
              />

              {/* Leaf silhouettes along edges */}
              <path d="M130,250 C105,245 95,260 85,265 C100,275 118,270 132,262 Z" fill="#22c55e" />
              <path d="M200,130 C180,105 168,112 158,115 C170,132 185,135 202,132 Z" fill="#4ade80" />
              <path d="M430,30 C425,8 440,2 450,0 C458,18 452,30 435,35 Z" fill="#86efac" />
              <path d="M540,28 C550,8 568,2 578,0 C578,20 568,30 545,35 Z" fill="#86efac" />
              <path d="M860,250 C885,245 895,260 905,265 C890,275 872,270 858,262 Z" fill="#22c55e" />
              <path d="M790,130 C810,105 822,112 832,115 C820,132 805,135 788,132 Z" fill="#4ade80" />
            </g>

            {/* ============================================================== */}
            {/* CUTE BOY CHARACTER LOOKING UP AT MANGOES (INTERACTIVE)          */}
            {/* ============================================================== */}
            <g
              id="eagerBoyIllustration"
              onClick={handleBoyClick}
              className={`select-none cursor-pointer group/boy ${boyBouncing ? 'boy-jumping' : 'boy-idle'}`}
              style={{
                pointerEvents: 'auto',
                transformOrigin: '325px 614px'
              }}
            >
              <title>আমের দিকে চেয়ে থাকা খোকা (ক্লিক করুন!)</title>

              {/* Ground Shadow underneath the Boy */}
              <ellipse cx="325" cy="614" rx="36" ry="7" fill="#04230c" opacity="0.45" />

              {/* --- Shoes & Feet --- */}
              {/* Left Sneaker (slightly back) */}
              <rect x="298" y="610" width="22" height="4" rx="2" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="0.8" />
              <path d="M299,610 C298,604 306,601 313,605 C319,608 319,610 320,610 Z" fill="url(#boySneakerGrad)" />
              <path d="M316,610 C317,607 319,607 320,610 Z" fill="#ffffff" />
              <path d="M305,606 L311,608 M304,608 L310,610" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" />

              {/* Right Sneaker (forward towards tree) */}
              <rect x="330" y="612" width="24" height="4" rx="2" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="0.8" />
              <path d="M331,612 C330,605 340,602 348,607 C354,610 354,612 354,612 Z" fill="url(#boySneakerGrad)" />
              <path d="M349,612 C350,608 353,608 354,612 Z" fill="#ffffff" />
              <path d="M337,607 L343,609 M336,609 L342,611" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" />

              {/* --- Socks --- */}
              <rect x="303" y="598" width="11" height="8" rx="2" fill="#ffffff" />
              <line x1="303" y1="601" x2="314" y2="601" stroke="#3b82f6" strokeWidth="1" />
              <rect x="334" y="600" width="11" height="8" rx="2" fill="#ffffff" />
              <line x1="334" y1="603" x2="345" y2="603" stroke="#3b82f6" strokeWidth="1" />

              {/* --- Legs --- */}
              <rect x="304" y="568" width="10" height="32" rx="5" fill="url(#boySkinGrad)" />
              <rect x="335" y="568" width="10" height="34" rx="5" fill="url(#boySkinGrad)" />
              <path d="M306,585 Q309,587 312,585" stroke="#ea580c" strokeWidth="1" strokeLinecap="round" opacity="0.3" fill="none" />
              <path d="M337,586 Q340,588 343,586" stroke="#ea580c" strokeWidth="1" strokeLinecap="round" opacity="0.3" fill="none" />

              {/* --- Denim Shorts --- */}
              <path d="M298,536 C298,535 348,535 348,536 L348,570 C348,573 328,573 328,570 L323,552 L318,570 C318,573 298,573 298,570 Z" fill="url(#boyShortsGrad)" />
              <rect x="297" y="567" width="21" height="4.5" rx="1.5" fill="#2563eb" opacity="0.6" />
              <rect x="328" y="567" width="21" height="4.5" rx="1.5" fill="#2563eb" opacity="0.6" />
              <path d="M302,544 Q310,556 314,562" stroke="#f59e0b" strokeWidth="0.9" strokeDasharray="2,2" fill="none" opacity="0.8" />
              <path d="M344,544 Q336,556 332,562" stroke="#f59e0b" strokeWidth="0.9" strokeDasharray="2,2" fill="none" opacity="0.8" />
              <rect x="297" y="535" width="52" height="4.5" rx="1" fill="#334155" />
              <rect x="320" y="534" width="7" height="6.5" rx="1.5" fill="#f59e0b" stroke="#78350f" strokeWidth="0.8" />

              {/* --- Torso & Mango T-Shirt --- */}
              <path d="M301,482 C312,479 336,479 347,482 L349,537 C349,538 299,538 299,537 Z" fill="url(#boyShirtGrad)" />
              <path d="M315,480 Q324,487 333,480" stroke="#ffffff" strokeWidth="3" fill="none" strokeLinecap="round" />
              {/* Cute mango emblem on chest */}
              <ellipse cx="328" cy="504" rx="5" ry="6.5" fill="#fde047" transform="rotate(-15 328 504)" />
              <path d="M328,498 Q331,496 333,498" stroke="#15803d" strokeWidth="1.2" strokeLinecap="round" fill="none" />

              {/* --- Left Arm (Relaxed at side) --- */}
              <path d="M301,482 C293,487 290,496 290,503 L298,505 C299,499 301,490 304,485 Z" fill="url(#boyShirtGrad)" />
              <path d="M293,503 C291,514 292,525 295,534 C299,534 302,532 299,522 C297,515 296,507 297,504 Z" fill="url(#boySkinGrad)" />
              <circle cx="296" cy="535" r="4.5" fill="url(#boySkinGrad)" />

              {/* --- Right Arm (Excitedly pointing up at mangoes) --- */}
              <path d="M344,482 C350,483 356,488 358,495 L351,497 C349,492 346,486 343,484 Z" fill="url(#boyShirtGrad)" />
              <path d="M352,488 C360,474 368,456 376,438 C381,440 383,444 378,450 C371,465 364,481 356,494 Z" fill="url(#boySkinGrad)" />
              <circle cx="377" cy="439" r="4.5" fill="url(#boySkinGrad)" />
              <path d="M376,438 Q384,428 388,422" stroke="url(#boySkinGrad)" strokeWidth="3.6" strokeLinecap="round" fill="none" />

              {/* --- Neck --- */}
              <rect x="319" y="470" width="9" height="14" rx="3" fill="url(#boySkinGrad)" transform="rotate(7 323 477)" />

              {/* --- Head Tilted Upwards looking at Canopy --- */}
              <g transform="rotate(-15 324 452)">
                {/* Back hair shadow */}
                <ellipse cx="323" cy="442" rx="18" ry="19" fill="#1f0e04" />

                {/* Ear */}
                <path d="M309,448 C306,444 308,440 311,441 L313,450 C310,450 308,449 309,448 Z" fill="url(#boySkinGrad)" />

                {/* Face Contour */}
                <path d="M312,450 C310,436 322,427 335,429 C348,431 355,442 353,454 C351,466 337,472 325,468 C316,465 312,458 312,450 Z" fill="url(#boySkinGrad)" />

                {/* Rosy Cheeks */}
                <ellipse cx="320" cy="453" rx="4.5" ry="3" fill="#f87171" opacity="0.55" />
                <ellipse cx="343" cy="455" rx="4.5" ry="3" fill="#f87171" opacity="0.55" />

                {/* Left Eye looking up-right */}
                <ellipse cx="323" cy="445" rx="5" ry="6.5" fill="#0f172a" />
                <circle cx="325" cy="443" r="2.2" fill="#ffffff" />
                <circle cx="322" cy="447" r="1.1" fill="#ffffff" />
                <path d="M318,446 Q323,439 328,445" stroke="#020617" strokeWidth="1.2" fill="none" />

                {/* Right Eye looking up-right */}
                <ellipse cx="339" cy="446" rx="5" ry="6.5" fill="#0f172a" />
                <circle cx="341" cy="444" r="2.2" fill="#ffffff" />
                <circle cx="338" cy="448" r="1.1" fill="#ffffff" />
                <path d="M334,447 Q339,440 344,446" stroke="#020617" strokeWidth="1.2" fill="none" />

                {/* Eyebrows arched in wonder */}
                <path d="M317,437 Q323,432 329,436" stroke="#451a03" strokeWidth="2.2" strokeLinecap="round" fill="none" />
                <path d="M334,437 Q340,432 346,437" stroke="#451a03" strokeWidth="2.2" strokeLinecap="round" fill="none" />

                {/* Cute Nose */}
                <path d="M331,448 Q333,450 330,451" stroke="#ea580c" strokeWidth="1.4" strokeLinecap="round" fill="none" />

                {/* Excited Open Smile */}
                <path d="M326,456 Q333,465 340,456 Q333,460 326,456 Z" fill="#881337" stroke="#4c0519" strokeWidth="0.8" />
                <path d="M328,456 Q333,459 338,456" fill="#ffffff" />
                <path d="M329,461 Q333,458 337,461" fill="#fb7185" />

                {/* Styled Trendy Hair */}
                <path d="M310,440 C308,426 316,415 328,414 C342,412 355,420 357,432 C359,440 354,444 350,442 C346,434 338,426 328,427 C322,428 316,434 315,441 C314,440 312,442 310,440 Z" fill="url(#boyHairGrad)" />
                <path d="M324,417 Q330,409 337,416 Q345,411 349,420 Q358,417 356,428" stroke="#5c2e0b" strokeWidth="1.8" fill="none" strokeLinecap="round" />
              </g>

              {/* --- Thought Bubble Floating Above Boy --- */}
              <circle cx="352" cy="402" r="3.5" fill="#ffffff" opacity="0.9" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.12))" />
              <circle cx="360" cy="388" r="5" fill="#ffffff" opacity="0.95" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.12))" />

              <g style={{ animation: 'boyThoughtFloat 3.5s ease-in-out infinite' }}>
                <rect
                  x="328"
                  y="335"
                  width="172"
                  height="44"
                  rx="22"
                  fill="url(#boyBubbleGrad)"
                  stroke="#f59e0b"
                  strokeWidth="1.6"
                  filter="drop-shadow(0 4px 12px rgba(0,0,0,0.15))"
                />
                <text x="344" y="362" fontSize="16">🤤</text>
                <text x="368" y="354" fontSize="11" fontWeight="800" fill="#92400e" fontFamily="sans-serif">
                  {extraBasketMangoesCount > 0 ? `ঝুড়িতে +${extraBasketMangoesCount}টি আম জমা!` : 'কখন পড়বে আমটা!'}
                </text>
                <text x="368" y="368" fontSize="9.5" fontWeight="700" fill="#b45309" fontFamily="sans-serif">
                  {extraBasketMangoesCount > 0 ? `গাছে ৪টি • ঝুড়িতে ${extraBasketMangoesCount}টি 🧺` : 'পাকা আম দেখছে খোকা 🥭'}
                </text>
              </g>
            </g>
          </svg>

          {/* ============================================================== */}
          {/* 4. INTERACTIVE MANGOES WITH DEDICATED BRANCH ANCHORS & LEAVES  */}
          {/* Displaying maximum 4 ripe mangoes on tree on safe coordinates   */}
          {/* ============================================================== */}
          {treeMangoes.map((mango, idx) => {
            const swayDelay = ((idx * 0.45) % 2.5).toFixed(2);
            const swayDuration = (3.2 + (idx % 3) * 0.5).toFixed(2);
            const pos = safeTreePositions[idx % safeTreePositions.length];
            return (
              <div
                key={mango.id || idx}
                onClick={() => handleMangoClick(mango)}
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-30 group select-none"
                title={`Click to inspect: ${mango.title} (+${mango.hours}h Break)`}
              >
                {/* Natural Branch Anchor & Leaf Sprig (Anchors the Mango to the Tree) */}
                <div className="relative flex flex-col items-center">
                  {/* Organic Wooden Branch Node Passing Above */}
                  <svg
                    width="96"
                    height="32"
                    viewBox="0 0 100 34"
                    className="overflow-visible pointer-events-none -mb-1 z-10 drop-shadow-md"
                  >
                    <defs>
                      <linearGradient id={`branchWood_${idx}`} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3d1d06" />
                        <stop offset="35%" stopColor="#5c2e0b" />
                        <stop offset="70%" stopColor="#78350f" />
                        <stop offset="100%" stopColor="#2e1302" />
                      </linearGradient>
                    </defs>

                    {/* Wooden Branch Segment */}
                    <path
                      d="M -15,16 Q 25,10 50,16 Q 75,22 115,14"
                      stroke={`url(#branchWood_${idx})`}
                      strokeWidth="7.5"
                      strokeLinecap="round"
                      fill="none"
                    />
                    <path
                      d="M -15,15 Q 25,9 50,15 Q 75,21 115,13"
                      stroke="#9a3412"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      fill="none"
                      opacity="0.8"
                    />

                    {/* Branch Knot Spur connecting down to fruit stem */}
                    <circle cx="50" cy="17" r="4.5" fill="#3d1d06" />

                    {/* Fresh Green Mango Leaves Sprouting from the Branch Spur */}
                    {/* Left Mango Leaf */}
                    <path
                      d="M 46,16 C 24,2 10,10 2,19 C 16,23 32,21 46,18 Z"
                      fill="#15803d"
                      className="drop-shadow-xs"
                    />
                    <path d="M 46,16 Q 22,11 4,19" stroke="#86efac" strokeWidth="1.2" fill="none" opacity="0.85" />

                    {/* Right Mango Leaf */}
                    <path
                      d="M 54,17 C 76,4 90,10 98,19 C 84,23 68,21 54,19 Z"
                      fill="#16a34a"
                      className="drop-shadow-xs"
                    />
                    <path d="M 54,17 Q 78,12 96,19" stroke="#bbf7d0" strokeWidth="1.2" fill="none" opacity="0.85" />
                  </svg>

                  {/* Pendulum Sway Wrapper holding the Stem & Mango Fruit */}
                  <div
                    style={{
                      transformOrigin: 'top center',
                      animation: `mangoSway ${swayDuration}s ease-in-out infinite alternate`,
                      animationDelay: `${swayDelay}s`
                    }}
                    className="flex flex-col items-center transition-transform duration-300 group-hover:scale-115 group-hover:z-40"
                  >
                    {/* Hanging Wooden Fruit Pedicel / Stem */}
                    <div className="w-[3.5px] h-4.5 bg-gradient-to-b from-[#3d1d06] to-[#78350f] rounded-full -mb-1 shadow-xs" />

                    {/* Mango Fruit Graphic Container */}
                    <div className="relative flex flex-col items-center">
                      {/* Golden Ambient Radiance Halo on Ripe Fruit */}
                      <div className="absolute inset-0 bg-amber-400/40 rounded-full blur-xl scale-110 group-hover:bg-amber-300/60 group-hover:blur-2xl transition-all duration-300" />

                      {/* Realistic SVG Juicy Tropical Mango */}
                      <svg
                        width="66"
                        height="80"
                        viewBox="0 0 100 120"
                        className="relative z-10 filter drop-shadow-[0_10px_16px_rgba(180,83,9,0.45)] group-hover:drop-shadow-[0_14px_24px_rgba(245,158,11,0.7)] transition-all duration-200"
                      >
                        <defs>
                          {/* Luscious Multi-Stop Alphonso/Fazli Mango Skin Gradient */}
                          <radialGradient id={`juicySkin_${idx}`} cx="35%" cy="32%" r="70%">
                            <stop offset="0%" stopColor="#fffbeb" />   {/* Sunlit specular glow */}
                            <stop offset="15%" stopColor="#fef08a" />  {/* Sweet honey yellow */}
                            <stop offset="42%" stopColor="#fbbf24" />  {/* Golden ripe mango */}
                            <stop offset="70%" stopColor="#f97316" />  {/* Luscious rich orange */}
                            <stop offset="92%" stopColor="#e11d48" />  {/* Sun-kissed ruby blush */}
                            <stop offset="100%" stopColor="#be123c" /> {/* Deep crimson contour */}
                          </radialGradient>

                          {/* Leaf Gradient */}
                          <linearGradient id={`leafSkin_${idx}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#4ade80" />
                            <stop offset="60%" stopColor="#15803d" />
                            <stop offset="100%" stopColor="#052e16" />
                          </linearGradient>
                        </defs>

                        {/* Natural Stem Collar & Leaf attached to fruit top */}
                        <g id="mangoLeafGroup">
                          {/* Tropical Lanceolate Leaf */}
                          <path
                            d="M50,14 C72,-4 92,6 98,20 C82,24 66,22 50,16 Z"
                            fill={`url(#leafSkin_${idx})`}
                            className="drop-shadow-sm"
                          />
                          {/* Leaf Vein */}
                          <path
                            d="M50,15 Q74,8 96,19"
                            stroke="#86efac"
                            strokeWidth="1.2"
                            strokeLinecap="round"
                            fill="none"
                            opacity="0.8"
                          />
                          {/* Stem Cap */}
                          <circle cx="50" cy="16" r="3.5" fill="#451a03" />
                        </g>

                        {/* Iconic Natural Mango Curved Silhouette (Curved Shoulder + Plump Belly + Signature Beak) */}
                        <path
                          d="M48,16 C28,16 15,34 13,58 C11,83 24,106 45,114 C64,120 80,114 87,98 C91,88 90,76 88,58 C86,34 70,16 48,16 Z"
                          fill={`url(#juicySkin_${idx})`}
                        />

                        {/* Inner Golden Belly Warmth Layer */}
                        <path
                          d="M45,22 C30,22 20,38 18,58 C16,78 26,96 42,104 C32,88 28,66 34,44 C38,30 42,24 45,22 Z"
                          fill="#fef08a"
                          opacity="0.3"
                        />

                        {/* 3D Glossy Specular Curved Highlight (Juicy Dewdrop Sheen) */}
                        <path
                          d="M26,36 C22,48 23,64 28,76 C29,64 28,48 33,38 C30,36 28,36 26,36 Z"
                          fill="#ffffff"
                          opacity="0.55"
                        />
                        <circle cx="28" cy="40" r="3" fill="#ffffff" opacity="0.75" />

                        {/* Delicate Secondary Ambient Rim Light on bottom contour */}
                        <path
                          d="M46,111 C60,116 74,111 82,99"
                          stroke="#fef08a"
                          strokeWidth="2"
                          strokeLinecap="round"
                          fill="none"
                          opacity="0.6"
                        />
                      </svg>

                      {/* Prominent High-Contrast Reward Pill Badge */}
                      <div className="mt-1 px-2.5 py-0.5 rounded-full bg-slate-900/95 text-amber-300 text-[10px] font-black tracking-wide border border-amber-400/50 shadow-md flex items-center gap-1 z-20 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-white transition-all duration-200">
                        <span>🥭</span>
                        <span>+{mango.hours}h</span>
                      </div>
                    </div>

                    {/* Rich Floating Card Tooltip on Hover */}
                    <div className="absolute left-1/2 -translate-x-1/2 -bottom-14 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none bg-slate-950/95 text-white text-[11px] font-bold px-3 py-1.5 rounded-2xl shadow-2xl whitespace-nowrap z-50 border border-amber-500/40 flex flex-col items-center gap-0.5">
                      <span className="text-amber-400 font-black">🥭 {mango.title} (1 Full Day Off)</span>
                      <span className="text-[10px] text-slate-300 font-semibold">100% Ripe &bull; Click to Redeem!</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* ============================================================== */}
          {/* 5. GROWING / UNRIPE MANGO (IN PROGRESS)                        */}
          {/* Positioned safely at center mid-canopy (Total on tree = max 5) */}
          {/* ============================================================== */}
          {growingMango && (
            <div
              onClick={() => handleMangoClick(growingMango)}
              style={{
                left: '50%',
                top: '33%'
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-30 group select-none"
              title={`Ripening: ${growingMango.current_hours}h / ${growingMango.target_hours}h`}
            >
              {/* Natural Branch Anchor for Growing Mango */}
              <div className="relative flex flex-col items-center">
                {/* Branch Node */}
                <svg
                  width="86"
                  height="28"
                  viewBox="0 0 100 34"
                  className="overflow-visible pointer-events-none -mb-1 z-10 drop-shadow-sm"
                >
                  <path
                    d="M -10,16 Q 25,10 50,16 Q 75,22 110,14"
                    stroke="#451a03"
                    strokeWidth="6.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <path
                    d="M -10,15 Q 25,9 50,15 Q 75,21 110,13"
                    stroke="#78350f"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <circle cx="50" cy="17" r="4" fill="#2e1302" />
                  {/* Leaves */}
                  <path d="M 46,16 C 26,4 12,12 2,20 C 16,24 32,22 46,18 Z" fill="#15803d" />
                  <path d="M 54,17 C 74,6 88,12 98,20 C 84,24 68,22 54,19 Z" fill="#16a34a" />
                </svg>

                <div
                  style={{
                    transformOrigin: 'top center',
                    animation: 'mangoSway 3.8s ease-in-out infinite alternate'
                  }}
                  className="flex flex-col items-center transition-transform duration-300 group-hover:scale-115 group-hover:z-40"
                >
                  {/* Stem */}
                  <div className="w-[3px] h-4 bg-[#2e1d09] rounded-full -mb-1 shadow-xs" />

                  {/* Young Crisp Green Mango */}
                  <div className="relative flex flex-col items-center">
                    <div className="absolute inset-0 bg-lime-400/25 rounded-full blur-md" />

                    <svg width="54" height="66" viewBox="0 0 100 120" className="relative z-10 filter drop-shadow-md">
                      <defs>
                        <radialGradient id="growingRawGrad" cx="35%" cy="32%" r="70%">
                          <stop offset="0%" stopColor="#f7fee7" />
                          <stop offset="25%" stopColor="#d9f99d" />
                          <stop offset="60%" stopColor="#84cc16" />
                          <stop offset="90%" stopColor="#4d7c0f" />
                          <stop offset="100%" stopColor="#365314" />
                        </radialGradient>
                      </defs>

                      {/* Green Stem Leaf */}
                      <path d="M50,14 C70,-2 88,6 94,18 C78,22 64,20 50,16 Z" fill="#15803d" />
                      <circle cx="50" cy="16" r="3" fill="#2e1d09" />

                      {/* Fresh Raw Mango Silhouette */}
                      <path
                        d="M48,16 C30,16 18,34 16,56 C14,80 26,104 46,112 C64,118 78,112 85,98 C89,88 88,76 86,58 C84,34 70,16 48,16 Z"
                        fill="url(#growingRawGrad)"
                      />
                      {/* Young Specular highlight */}
                      <ellipse cx="30" cy="44" rx="4" ry="12" fill="#ffffff" opacity="0.4" transform="rotate(-18 30 44)" />
                    </svg>

                    {/* Ripening Progress Pill */}
                    <div className="mt-1 px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 text-[9px] font-black tracking-wide border border-emerald-500/50 shadow-md flex items-center gap-1">
                      <span>🍏</span>
                      <span>{Math.round(growingMango.progress_percent)}%</span>
                    </div>
                  </div>

                  {/* Tooltip */}
                  <div className="absolute left-1/2 -translate-x-1/2 -bottom-14 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none bg-slate-950/95 text-white text-[11px] font-bold px-3 py-1.5 rounded-2xl shadow-2xl whitespace-nowrap z-50 border border-emerald-500/40 flex flex-col items-center gap-0.5">
                    <span className="text-emerald-400 font-black">🍏 Ripening: {formatHoursToHuman(growingMango.current_hours)} / {formatHoursToHuman(growingMango.target_hours)}</span>
                    <span className="text-[10px] text-slate-300 font-semibold">+{formatHoursToHuman(growingMango.remaining_hours)} more overtime to mature</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* 6. RUSTIC HARVEST WICKER BASKET ON ORCHARD LAWN                */}
          {/* Stores overflow ripe mangoes beyond the 4 on the tree          */}
          {/* ============================================================== */}
          {ripeCount > 0 && (
            <div
              onClick={() => {
                const firstRipe = allRipeMangoes[0];
                if (firstRipe) {
                  try { soundFx?.playPop?.(); } catch { }
                  setSelectedMango(firstRipe);
                  setIsClaimModalOpen(true);
                }
              }}
              className="absolute right-4 sm:right-8 md:right-12 bottom-3 sm:bottom-5 z-20 flex items-center gap-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border-2 border-amber-400 dark:border-amber-600 shadow-xl cursor-pointer hover:scale-105 active:scale-95 transition-all select-none group"
              style={{ animation: 'basketGlow 4s ease-in-out infinite' }}
              title="ক্লিক করে ছুটি বা টাকা রেডিম করুন ➔"
            >
              <div className="relative text-3xl shrink-0">
                <span>🧺</span>
                <span className="absolute -top-1.5 -right-1.5 text-base animate-bounce">🥭</span>
                {extraBasketMangoesCount > 0 && (
                  <span className="absolute -bottom-1 -left-1 px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[9px] font-black border border-white dark:border-slate-900 shadow-sm animate-pulse">
                    +{extraBasketMangoesCount}
                  </span>
                )}
              </div>
              <div className="text-left">
                <div className="text-xs font-black text-amber-950 dark:text-amber-200 flex items-center gap-1.5 flex-wrap">
                  <span>Harvest Ready:</span>
                  <span className="px-2 py-0.5 rounded-lg bg-amber-500 text-white text-[11px] font-black shadow-xs">
                    {ripeCount} Mango{ripeCount > 1 ? 'es' : ''}
                  </span>
                  {extraBasketMangoesCount > 0 && (
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-600 text-white text-[10px] font-black shadow-xs animate-pulse">
                      +{extraBasketMangoesCount} ঝুড়িতে জমা
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                  {extraBasketMangoesCount > 0
                    ? `গাছে ৪টি • ঝুড়িতে ${extraBasketMangoesCount}টি • ক্লিক করে রেডিম করুন ➔`
                    : `${ripeCount} paid break day${ripeCount > 1 ? 's' : ''} stored in orchard • ক্লিক করুন ➔`}
                </div>
              </div>
            </div>
          )}

          {/* Empty Tree Banner when 0 Mangoes */}
          {allRipeMangoes.length === 0 && !growingMango && (
            <div className="absolute inset-x-8 bottom-8 md:bottom-12 max-w-lg mx-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-5 rounded-3xl border border-slate-200 dark:border-slate-800 text-center shadow-xl space-y-2 z-20 animate-fadeIn">
              <span className="text-3xl">🌱</span>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">Your Mango Tree is Waiting to Bloom!</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Work beyond your standard {shiftHours}-hour shift. Every {shiftHours} hours of accumulated overtime will bear 1 delicious ripe mango here!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Tabs for Ledger: Overtime (+) vs Leaves Taken (-) vs Claims */}
      <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl p-5 sm:p-7 md:p-8 rounded-[28px] border border-slate-200/90 dark:border-slate-800/90 shadow-[0_4px_25px_-4px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] space-y-6 transition-all duration-300">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5 pb-5 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400/20 via-orange-400/15 to-amber-500/10 dark:from-amber-500/20 dark:via-orange-500/15 dark:to-transparent border border-amber-200/80 dark:border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-xs shrink-0">
              <FiSun className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg tracking-tight">
                  Break Bank Ledger & History
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-700/60 inline-flex items-center gap-1.5 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Verified Ledger</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                Track your extra work hours, leaves deducted in between, and redeemed break days.
              </p>
            </div>
          </div>

          {/* Modern Tab Switcher - Responsive horizontal scrollable or wrapped pills */}
          <div className="flex items-center gap-1.5 bg-slate-100/90 dark:bg-slate-950/80 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800/90 overflow-x-auto max-w-full custom-scrollbar self-start xl:self-auto shrink-0 shadow-inner">
            {/* Tab 1: Overtime */}
            <button
              onClick={() => setActiveLedgerTab('overtime')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-2 shrink-0 ${activeLedgerTab === 'overtime'
                ? 'bg-white dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 shadow-sm border border-emerald-200/90 dark:border-emerald-500/40 ring-2 ring-emerald-500/10 dark:ring-0 font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60'
                }`}
            >
              <span className="text-sm">🌿</span>
              <span>Overtime</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black transition-colors ${activeLedgerTab === 'overtime'
                ? 'bg-emerald-100 dark:bg-emerald-500/30 text-emerald-800 dark:text-emerald-200'
                : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                {data?.contributions?.length || 0}
              </span>
            </button>

            {/* Tab 2: Short Time */}
            <button
              onClick={() => setActiveLedgerTab('short_time')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-2 shrink-0 ${activeLedgerTab === 'short_time'
                ? 'bg-white dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 shadow-sm border border-rose-200/90 dark:border-rose-500/40 ring-2 ring-rose-500/10 dark:ring-0 font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60'
                }`}
            >
              <span className="text-sm">⏱️</span>
              <span>Short Time</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black transition-colors ${activeLedgerTab === 'short_time'
                ? 'bg-rose-100 dark:bg-rose-500/30 text-rose-800 dark:text-rose-200'
                : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                {data?.gaps?.length || 0}
              </span>
            </button>

            {/* Tab 3: Leaves */}
            <button
              onClick={() => setActiveLedgerTab('leaves')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-2 shrink-0 ${activeLedgerTab === 'leaves'
                ? 'bg-white dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 shadow-sm border border-amber-200/90 dark:border-amber-500/40 ring-2 ring-amber-500/10 dark:ring-0 font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60'
                }`}
            >
              <span className="text-sm">🏖️</span>
              <span>Leaves Deducted</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black transition-colors ${activeLedgerTab === 'leaves'
                ? 'bg-amber-100 dark:bg-amber-500/30 text-amber-800 dark:text-amber-200'
                : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                {data?.leaves_taken?.length || 0}
              </span>
            </button>

            {/* Tab 4: Tiffin */}
            <button
              onClick={() => setActiveLedgerTab('tiffin')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-2 shrink-0 ${activeLedgerTab === 'tiffin'
                ? 'bg-white dark:bg-orange-500/15 text-orange-700 dark:text-orange-300 shadow-sm border border-orange-200/90 dark:border-orange-500/40 ring-2 ring-orange-500/10 dark:ring-0 font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60'
                }`}
            >
              <span className="text-sm">🥪</span>
              <span>Tiffin Breaks</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black transition-colors ${activeLedgerTab === 'tiffin'
                ? 'bg-orange-100 dark:bg-orange-500/30 text-orange-800 dark:text-orange-200'
                : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                {data?.tiffin_history?.length || summary?.tiffin_summary?.total_tiffin_count || 0}
              </span>
            </button>

            {/* Tab 5: Claims */}
            <button
              onClick={() => setActiveLedgerTab('claims')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-2 shrink-0 ${activeLedgerTab === 'claims'
                ? 'bg-white dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 shadow-sm border border-indigo-200/90 dark:border-indigo-500/40 ring-2 ring-indigo-500/10 dark:ring-0 font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60'
                }`}
            >
              <span className="text-sm">🥭</span>
              <span>Claimed Breaks</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black transition-colors ${activeLedgerTab === 'claims'
                ? 'bg-indigo-100 dark:bg-indigo-500/30 text-indigo-800 dark:text-indigo-200'
                : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                {data?.recent_claims?.length || 0}
              </span>
            </button>
          </div>
        </div>

        {/* Tab 1: Overtime Contributions */}
        {activeLedgerTab === 'overtime' && (
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white/60 dark:bg-slate-950/40 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto max-h-[420px] custom-scrollbar">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-md text-slate-500 dark:text-slate-400 border-b border-slate-200/90 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4 font-bold">Date & Day</th>
                    <th className="py-3.5 px-4 font-bold">Worked Duration</th>
                    <th className="py-3.5 px-4 font-bold">Shift Target</th>
                    <th className="py-3.5 px-4 font-bold">Overtime Earned</th>
                    <th className="py-3.5 px-4 font-bold text-right">Bank Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-600 dark:text-slate-300 font-medium">
                  {data?.contributions && data.contributions.length > 0 ? (
                    data.contributions.map((item, idx) => {
                      const dateObj = parseLedgerDate(item.date);
                      return (
                        <tr
                          key={idx}
                          className="hover:bg-slate-50/90 dark:hover:bg-slate-800/40 transition-colors duration-150 group"
                        >
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 flex flex-col items-center justify-center text-center shrink-0 group-hover:border-emerald-300/60 dark:group-hover:border-emerald-700/50 transition-colors">
                                <span className="text-[9px] font-extrabold uppercase text-slate-500 dark:text-slate-400 leading-none">
                                  {dateObj.dayOfWeek}
                                </span>
                                <span className="text-xs font-black text-slate-800 dark:text-slate-100 leading-none mt-0.5">
                                  {dateObj.dayNumber}
                                </span>
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 dark:text-white text-xs">
                                  {dateObj.formatted}
                                </div>
                                <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                                  {item.date}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400">
                                <FiClock className="w-3.5 h-3.5" />
                              </div>
                              <div>
                                <span className="font-bold text-slate-800 dark:text-slate-100 text-xs">
                                  {formatHoursToHuman(item.worked_hours)}
                                </span>
                                <span className="block text-[10px] text-slate-400 dark:text-slate-500">
                                  Logged shift
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 text-xs font-semibold">
                              <span className="text-[11px]">🎯</span>
                              <span>{formatHoursToHuman(item.expected_hours)}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/90 dark:border-emerald-700/60 text-emerald-700 dark:text-emerald-300 text-xs font-black shadow-2xs">
                              <FiTrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              <span>+{formatHoursToHuman(item.overtime_hours)}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {item.is_tiffin_bonus ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[11px] font-black border border-amber-300 dark:border-amber-700/60 shadow-2xs">
                                <span>🥪</span>
                                <span>Tiffin Savings</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/70 dark:to-teal-950/70 text-emerald-700 dark:text-emerald-300 text-[11px] font-extrabold border border-emerald-200/90 dark:border-emerald-700/70 shadow-2xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span>+ Added to Tree</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="5" className="py-12 px-4 text-center">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-slate-400 flex items-center justify-center text-2xl shadow-inner">
                            🌿
                          </div>
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                            No Overtime Hours Logged
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                            Work past your {shiftHours}h shift target to accumulate overtime and earn ripe mangoes!
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Short Time / Shift Shortfalls */}
        {activeLedgerTab === 'short_time' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/50 text-xs text-rose-900 dark:text-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-start sm:items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 shrink-0">
                  <FiInfo className="w-4 h-4" />
                </div>
                <span>
                  <strong>Short Time (Gap):</strong> Shifts where work ended earlier than the standard {shiftHours}h shift target. These shortfalls are deducted from your gross overtime.
                </span>
              </div>
              <div className="shrink-0 px-3 py-1 rounded-xl bg-white dark:bg-rose-900/60 border border-rose-200 dark:border-rose-700/60 text-rose-700 dark:text-rose-200 font-black text-xs self-start sm:self-auto shadow-2xs">
                Total Short Time: -{formatHoursToHuman(summary?.total_short_hours)}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white/60 dark:bg-slate-950/40 overflow-hidden shadow-2xs">
              <div className="overflow-x-auto max-h-[420px] custom-scrollbar">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 z-10 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-md text-slate-500 dark:text-slate-400 border-b border-slate-200/90 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4 font-bold">Date & Day</th>
                      <th className="py-3.5 px-4 font-bold">Worked Duration</th>
                      <th className="py-3.5 px-4 font-bold">Shift Target</th>
                      <th className="py-3.5 px-4 font-bold">Short Time (Gap)</th>
                      <th className="py-3.5 px-4 font-bold text-right">Bank Impact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-600 dark:text-slate-300 font-medium">
                    {data?.gaps && data.gaps.length > 0 ? (
                      data.gaps.map((item, idx) => {
                        const dateObj = parseLedgerDate(item.date);
                        return (
                          <tr key={idx} className="hover:bg-slate-50/90 dark:hover:bg-slate-800/40 transition-colors duration-150">
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 flex flex-col items-center justify-center text-center shrink-0">
                                  <span className="text-[9px] font-extrabold uppercase text-slate-500 dark:text-slate-400 leading-none">
                                    {dateObj.dayOfWeek}
                                  </span>
                                  <span className="text-xs font-black text-slate-800 dark:text-slate-100 leading-none mt-0.5">
                                    {dateObj.dayNumber}
                                  </span>
                                </div>
                                <div>
                                  <div className="font-bold text-slate-900 dark:text-white text-xs">{dateObj.formatted}</div>
                                  <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500">{item.date}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="font-bold text-slate-800 dark:text-slate-100 text-xs">
                                {formatHoursToHuman(item.worked_hours)}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="text-slate-500 dark:text-slate-400 font-medium">
                                {formatHoursToHuman(item.expected_hours)}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200/90 dark:border-rose-700/60 text-rose-700 dark:text-rose-300 text-xs font-black shadow-2xs">
                                <FiTrendingDown className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                                <span>-{formatHoursToHuman(item.short_hours)}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-[11px] font-bold border border-rose-200 dark:border-rose-700/60 shadow-2xs">
                                <span>- Deducted from OT</span>
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="5" className="py-12 px-4 text-center">
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-2xl shadow-inner">
                              🎉
                            </div>
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                              No Short Shifts Recorded!
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                              You've met or exceeded the {shiftHours}h target every working day.
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Leaves & Absences Deducted */}
        {activeLedgerTab === 'leaves' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 text-xs text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-start sm:items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 shrink-0">
                  <FiInfo className="w-4 h-4" />
                </div>
                <span>
                  <strong>Note:</strong> Approved leaves or absent days taken in between are automatically deducted from your overtime break bank (at {shiftHours}h per day).
                </span>
              </div>
              <div className="shrink-0 px-3 py-1 rounded-xl bg-white dark:bg-amber-900/60 border border-amber-200 dark:border-amber-700/60 text-amber-700 dark:text-amber-200 font-black text-xs self-start sm:self-auto shadow-2xs">
                Total: -{formatHoursToHuman(summary?.total_leave_deducted_hours)}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white/60 dark:bg-slate-950/40 overflow-hidden shadow-2xs">
              <div className="overflow-x-auto max-h-[420px] custom-scrollbar">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 z-10 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-md text-slate-500 dark:text-slate-400 border-b border-slate-200/90 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4 font-bold">Leave Date</th>
                      <th className="py-3.5 px-4 font-bold">Type</th>
                      <th className="py-3.5 px-4 font-bold">Reason / Source</th>
                      <th className="py-3.5 px-4 font-bold">Hours Deducted</th>
                      <th className="py-3.5 px-4 font-bold text-right">Bank Impact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-600 dark:text-slate-300 font-medium">
                    {data?.leaves_taken && data.leaves_taken.length > 0 ? (
                      data.leaves_taken.map((leave, idx) => {
                        const dateObj = parseLedgerDate(leave.date);
                        return (
                          <tr
                            key={idx}
                            className={`transition-colors duration-150 ${leave.type === 'Absent'
                              ? 'bg-rose-50/40 dark:bg-rose-950/20 hover:bg-rose-50/70'
                              : 'hover:bg-slate-50/90 dark:hover:bg-slate-800/40'
                              }`}
                          >
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 flex flex-col items-center justify-center text-center shrink-0">
                                  <span className="text-[9px] font-extrabold uppercase text-slate-500 dark:text-slate-400 leading-none">
                                    {dateObj.dayOfWeek}
                                  </span>
                                  <span className="text-xs font-black text-slate-800 dark:text-slate-100 leading-none mt-0.5">
                                    {dateObj.dayNumber}
                                  </span>
                                </div>
                                <div>
                                  <div className="font-bold text-slate-900 dark:text-white text-xs">{dateObj.formatted}</div>
                                  <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500">{leave.date}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black border ${leave.type === 'Absent'
                                ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                }`}>
                                {leave.type === 'Absent' ? 'Absent ⚠️' : leave.type}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                              {leave.type === 'Absent' ? (
                                <span className="font-bold text-rose-700 dark:text-rose-300">
                                  Unexcused Absence (Overtime Debt Penalty)
                                </span>
                              ) : (
                                leave.reason || 'Approved Leave'
                              )}
                            </td>
                            <td className="py-3.5 px-4 font-black text-rose-600 dark:text-rose-400 text-xs">
                              -{formatHoursToHuman(leave.hours_deducted || shiftHours)}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border shadow-2xs ${leave.type === 'Absent'
                                ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-700/80 font-black'
                                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-700/60'
                                }`}>
                                {leave.type === 'Absent' ? '-8h Debt Impact' : '- Deducted'}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="5" className="py-12 px-4 text-center">
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-2xl shadow-inner">
                              🏖️
                            </div>
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                              No Leaves or Absences Taken!
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                              Your overtime break bank is 100% intact.
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Claimed Mango Breaks (Full Day + In-Shift) */}
        {activeLedgerTab === 'claims' && (
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white/60 dark:bg-slate-950/40 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto max-h-[420px] custom-scrollbar">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-md text-slate-500 dark:text-slate-400 border-b border-slate-200/90 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4 font-bold">Date & Day</th>
                    <th className="py-3.5 px-4 font-bold">Break / Claim Type</th>
                    <th className="py-3.5 px-4 font-bold">Time / Hours Deducted</th>
                    <th className="py-3.5 px-4 font-bold">Reason & Context</th>
                    <th className="py-3.5 px-4 font-bold text-right">Ledger Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-600 dark:text-slate-300 font-medium">
                  {data?.recent_claims && data.recent_claims.length > 0 ? (
                    data.recent_claims.map((claim, idx) => {
                      const dateObj = parseLedgerDate(claim.leave_date || claim.claim_date);
                      const isOverBreak = claim.type?.includes('Over-Break') || claim.purpose === 'Over-Break Penalty';
                      const isSold = claim.type?.includes('Sold');
                      const isFullDay = claim.type?.includes('Full Day');
                      return (
                        <tr
                          key={idx}
                          className={`transition-colors duration-150 ${isOverBreak
                            ? 'bg-rose-50/20 dark:bg-rose-950/10 hover:bg-rose-50/50 dark:hover:bg-rose-950/20'
                            : 'hover:bg-slate-50/90 dark:hover:bg-slate-800/40'
                            }`}
                        >
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 flex flex-col items-center justify-center text-center shrink-0">
                                <span className="text-[9px] font-extrabold uppercase text-slate-500 dark:text-slate-400 leading-none">
                                  {dateObj.dayOfWeek}
                                </span>
                                <span className="text-xs font-black text-slate-800 dark:text-slate-100 leading-none mt-0.5">
                                  {dateObj.dayNumber}
                                </span>
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 dark:text-white text-xs">{dateObj.formatted}</div>
                                <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500">{claim.leave_date || claim.claim_date}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black border shadow-2xs ${isOverBreak
                                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700/60'
                                : isSold
                                  ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/60'
                                  : isFullDay
                                    ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
                                    : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                                }`}>
                                {claim.type || 'Mango Break'}
                              </span>
                              {claim.purpose && (
                                <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase border ${isOverBreak
                                  ? 'bg-rose-100/70 dark:bg-rose-900/40 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800/50'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                  }`}>
                                  {isOverBreak ? '⚠️ ' : '🎯 '}{claim.purpose}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-black text-xs">
                            {isOverBreak ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/50 shadow-2xs">
                                <span>-</span>
                                <span>{claim.duration_minutes ? `${claim.duration_minutes} mins` : formatHoursToHuman(claim.hours_claimed)}</span>
                              </span>
                            ) : (
                              <span className="text-slate-900 dark:text-white">
                                {claim.duration_minutes
                                  ? `${claim.duration_minutes} mins (${formatHoursToHuman(claim.hours_claimed)})`
                                  : formatHoursToHuman(claim.hours_claimed)}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                            {claim.reason || 'Overtime Break'}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold border shadow-2xs ${isOverBreak
                              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-700/60'
                              : claim.status === 'Pending'
                                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700/60'
                                : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/60'
                              }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${isOverBreak
                                ? 'bg-rose-500'
                                : claim.status === 'Pending'
                                  ? 'bg-amber-500 animate-pulse'
                                  : 'bg-emerald-500'
                                }`} />
                              <span>{claim.status}</span>
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="5" className="py-12 px-4 text-center">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center text-2xl shadow-inner">
                            🥭
                          </div>
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                            No Mango Break Tokens Claimed Yet
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                            Click a ripe mango on the tree or request an in-shift Mango Break to redeem your earned break days!
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 5: Tiffin Break Efficiency & Tree Impact */}
        {activeLedgerTab === 'tiffin' && (
          <div className="space-y-5">
            {/* Quick Metrics Bar - 5 High-Value Columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-50 via-amber-50/20 to-emerald-50/20 dark:from-slate-950/80 dark:via-amber-950/20 dark:to-emerald-950/20 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs">
              {/* Col 1 */}
              <div className="p-3.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800 shadow-2xs space-y-1">
                <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Tiffins Completed</div>
                <div className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-baseline gap-1.5">
                  <span>{summary?.tiffin_summary?.total_tiffin_count || 0}</span>
                  <span className="text-xs font-semibold text-slate-400">/ {summary?.total_sessions_counted || 34} sessions</span>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  {summary?.total_sessions_counted ? `${(summary?.total_sessions_counted || 34) - (summary?.tiffin_summary?.total_tiffin_count || 0)} left before 1:20 PM` : 'Standard 40m / day'}
                </div>
              </div>

              {/* Col 2 */}
              <div className="p-3.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800 shadow-2xs space-y-1">
                <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                  <span>🎯</span> Target Allowed
                </div>
                <div className="text-xl font-black text-indigo-700 dark:text-indigo-300">
                  {formatHoursToHuman(summary?.tiffin_summary?.total_target_hours || ((summary?.tiffin_summary?.total_tiffin_count || 0) * 40 / 60))}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  {summary?.tiffin_summary?.total_tiffin_count || 0} দিন &times; ৪০ মিনিট = {((summary?.tiffin_summary?.total_tiffin_count || 0) * 40)} মি.
                </div>
              </div>

              {/* Col 3 */}
              <div className="p-3.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800 shadow-2xs space-y-1">
                <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                  <span>⏱️</span> Actual Taken
                </div>
                <div className="text-xl font-black text-blue-700 dark:text-blue-300">
                  {summary?.tiffin_summary?.total_taken_hours
                    ? formatHoursToHuman(summary?.tiffin_summary?.total_taken_hours)
                    : `${(data?.tiffin_history || []).reduce((acc, t) => acc + Number(t.duration_minutes || 0), 0)} mins`}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  বাস্তব ব্রেক টাইম লগ
                </div>
              </div>

              {/* Col 4 */}
              <div className="p-3.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800 shadow-2xs space-y-1">
                <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span>🥭</span> Efficiency Bonus
                </div>
                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                  +{summary?.tiffin_summary?.bonus_minutes || 0}m <span className="text-xs font-bold">({summary?.total_tiffin_bonus_hours || 0}h)</span>
                </div>
                <div className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80">
                  {summary?.tiffin_summary?.penalty_minutes > 0 ? `Penalty: -${summary?.tiffin_summary?.penalty_minutes}m` : 'বাস্তব সাশ্রয়ী সময়'}
                </div>
              </div>

              {/* Col 5 */}
              <div className="p-3.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800 shadow-2xs space-y-1">
                <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <span>🌳</span> Net Bank Impact
                </div>
                <div className={`text-xl font-black ${(summary?.tiffin_summary?.net_tiffin_delta || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {(summary?.tiffin_summary?.net_tiffin_delta || 0) >= 0 ? `+${summary?.tiffin_summary?.net_tiffin_delta || 0}m` : `${summary?.tiffin_summary?.net_tiffin_delta}m`}
                  <span className="text-xs font-bold ml-1">
                    (+{((summary?.tiffin_summary?.net_tiffin_delta || 0) / 60).toFixed(2)}h)
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  সরাসরি ওভারটাইম ব্যাংকে যোগ
                </div>
              </div>
            </div>


            {/* Table of Tiffins */}
            <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white/60 dark:bg-slate-950/40 overflow-hidden shadow-2xs">
              <div className="overflow-x-auto max-h-[420px] custom-scrollbar">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 z-10 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-md text-slate-500 dark:text-slate-400 border-b border-slate-200/90 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4 font-bold">Date & Day</th>
                      <th className="py-3.5 px-4 font-bold">Time Window</th>
                      <th className="py-3.5 px-4 font-bold">Duration Taken</th>
                      <th className="py-3.5 px-4 font-bold">Target Limit</th>
                      <th className="py-3.5 px-4 font-bold text-right">Mango Tree Impact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-600 dark:text-slate-300 font-medium">
                    {data?.tiffin_history && data.tiffin_history.length > 0 ? (
                      data.tiffin_history.map((tf, idx) => {
                        const delta = Number(tf.tiffin_delta_minutes || 0);
                        const dateObj = parseLedgerDate(tf.date);
                        return (
                          <tr key={idx} className="hover:bg-slate-50/90 dark:hover:bg-slate-800/40 transition-colors duration-150">
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 flex flex-col items-center justify-center text-center shrink-0">
                                  <span className="text-[9px] font-extrabold uppercase text-slate-500 dark:text-slate-400 leading-none">
                                    {dateObj.dayOfWeek}
                                  </span>
                                  <span className="text-xs font-black text-slate-800 dark:text-slate-100 leading-none mt-0.5">
                                    {dateObj.dayNumber}
                                  </span>
                                </div>
                                <div>
                                  <div className="font-bold text-slate-900 dark:text-white text-xs">{dateObj.formatted}</div>
                                  <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500">{tf.date}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                              {tf.start_time ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/50">
                                  <span>{formatTime12(tf.start_time)}</span>
                                  <span className="text-slate-400">→</span>
                                  <span>{tf.end_time ? formatTime12(tf.end_time) : 'Ongoing'}</span>
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">Scheduled 1:20 PM</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                                {tf.duration_minutes ? `${tf.duration_minutes} mins` : '40 mins'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-medium">
                              40 mins
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              {delta > 0 ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 text-[10px] font-black border border-emerald-300 dark:border-emerald-700/60 shadow-2xs">
                                  <span>🥭</span>
                                  <span>+{delta}m Bonus (Added to Tree)</span>
                                </span>
                              ) : delta < 0 ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 text-[10px] font-black border border-rose-300 dark:border-rose-700/60 shadow-2xs">
                                  <span>⚡</span>
                                  <span>{delta}m Penalty (Deducted)</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold border border-slate-200 dark:border-slate-700">
                                  <span>0m (Standard 40m)</span>
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="5" className="py-12 px-4 text-center">
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center text-2xl shadow-inner">
                              🥪
                            </div>
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                              No Completed Tiffin Breaks Logged Yet
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                              Tiffin records will appear here after your daily lunch break is completed.
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Claim / Inspection Modal */}
      {isClaimModalOpen && selectedMango && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl relative space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-4xl">
                  {selectedMango.type === 'ripe' ? '🥭' : '🍏'}
                </span>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    {selectedMango.title}
                  </h3>
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                    {selectedMango.type === 'ripe' ? '100% Ripe & Sweet • Ready to Redeem' : 'Ripening in progress'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsClaimModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Mango Details Summary */}
            <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-400 font-semibold">Break Value:</span>
                <strong className="text-slate-900 dark:text-white font-black text-sm">
                  {selectedMango.type === 'ripe'
                    ? `${formatHoursToHuman(selectedMango.hours)} (1 Full Day Off)`
                    : `${formatHoursToHuman(selectedMango.current_hours)} / ${formatHoursToHuman(selectedMango.target_hours)}`}
                </strong>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-400 font-semibold">Orchard Equivalent:</span>
                <span className="text-emerald-700 dark:text-emerald-300 font-bold">100% Paid Compensatory Leave</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-amber-200/60 dark:border-amber-800/40">
                {selectedMango.description}
              </p>
            </div>

            {/* Redemption Form (Only for Ripe Mangoes) */}
            {selectedMango.type === 'ripe' ? (
              <form onSubmit={handleClaimSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Select Date for this Break Day
                  </label>
                  <input
                    type="date"
                    required
                    value={claimDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setClaimDate(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white font-semibold text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Note / Purpose (Optional)
                  </label>
                  <input
                    type="text"
                    value={claimReason}
                    onChange={(e) => setClaimReason(e.target.value)}
                    placeholder="e.g. Taking personal day earned from overtime"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsClaimModalOpen(false)}
                    className="px-5 py-3 rounded-2xl font-bold text-xs text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={claiming}
                    className="px-6 py-3 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-white font-black rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-amber-500/25 transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
                  >
                    <span>🥭</span>
                    <span>{claiming ? 'Redeeming...' : 'Redeem 1 Day Break'}</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsClaimModalOpen(false)}
                  className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-2xl text-xs transition cursor-pointer"
                >
                  Got It
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* P2P Overtime Market Modal */}
      <P2POvertimeMarket
        isOpen={isMarketOpen}
        onClose={() => setIsMarketOpen(false)}
        onTradeUpdated={fetchTreeData}
      />
    </div>
  );
}
