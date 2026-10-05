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
  FiSun,
  FiShield,
  FiArrowRight,
  FiX,
  FiAlertCircle
} from 'react-icons/fi';
import { toast } from 'sonner';

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

  const fetchTreeData = useCallback(async () => {
    if (!currentUser?.id) return;
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}api/breaks/get_mango_break_bank.php?user_id=${currentUser.id}&t=${Date.now()}`);
      if (res.data.status === 'success') {
        setData(res.data.data);
      } else {
        toast.error(res.data.message || 'Failed to load Mango Tree data');
      }
    } catch (err) {
      console.error('Failed to load mango break bank:', err);
      toast.error('Network error loading Mango Break Bank');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchTreeData();
  }, [fetchTreeData]);

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
  const mangoes = data?.mangoes || [];
  const growingMango = data?.growing_mango || null;
  const shiftHours = summary?.shift_hours || 8;
  const ripeCount = summary?.ripe_mangoes_count || 0;
  const totalOvertime = summary?.total_overtime_hours || 0;
  const availableBreakHours = summary?.available_break_hours || 0;
  const availableBreakDays = summary?.available_break_days || 0;

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

        <div className="flex items-center gap-3 z-10 shrink-0">
          <button
            onClick={fetchTreeData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 transition shadow-xs cursor-pointer disabled:opacity-50"
          >
            <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Orchard
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
                1. Expected Target
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
                2. Actual Worked
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
                3. Total Gap & Leaves
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
              <span>ℹ️</span> Leaves taken are added directly to this gap
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
              <span className="underline decoration-dotted">Leaves Deducted:</span>
              <span className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                -{formatHoursToHuman(summary?.total_leave_deducted_hours)} ({summary?.total_leave_days || 0} {summary?.total_leave_days === 1 ? 'day' : 'days'})
                <span className="text-[10px]">➔</span>
              </span>
            </button>
          </div>
        </div>

        {/* Card 4: Net Overtime Balance & Mango Breaks */}
        <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 text-white p-6 rounded-3xl shadow-md relative overflow-hidden flex flex-col justify-between group hover:shadow-lg hover:shadow-amber-500/20 transition duration-300">
          <div>
            <div className="flex items-center justify-between text-amber-100 mb-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-black uppercase tracking-wider backdrop-blur-xs border border-white/20">
                4. Net Overtime Balance
              </span>
              <span className="text-2xl group-hover:scale-125 transition-transform duration-300">🥭</span>
            </div>
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
          </div>

          <div className="mt-4 pt-3 border-t border-white/20 space-y-1.5 text-xs text-amber-100">
            <div className="flex items-center justify-between text-[11px]">
              <span>Net Formula:</span>
              <span className="font-semibold">
                +{formatHoursToHuman(summary?.total_overtime_hours)} - {formatHoursToHuman(summary?.total_gap_hours)} gap
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] pt-1">
              <span>Next Mango: {summary?.progress_to_next_mango || 0}%</span>
              {ripeCount > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    const firstRipe = mangoes.find(m => m.type === 'ripe') || mangoes[0];
                    if (firstRipe) {
                      setSelectedMango(firstRipe);
                      setIsClaimModalOpen(true);
                    }
                  }}
                  className="font-black text-white underline hover:text-amber-200 cursor-pointer"
                >
                  Redeem ➔
                </button>
              ) : (
                <span className="text-amber-200">
                  ({formatHoursToHuman(summary?.remaining_hours_for_next || shiftHours)} left)
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

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
            <span>3. Gap & Leaves: <strong>-{formatHoursToHuman(summary?.total_gap_hours)}</strong></span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-rose-200/60 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 font-bold">
              {summary?.total_leave_days || 0} leave day(s)
            </span>
          </div>
          <span className="text-slate-400 font-black">➔</span>
          <div className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black shadow-xs flex items-center gap-1.5">
            <span>4. Net Overtime: <strong>+{formatHoursToHuman(availableBreakHours)}</strong></span>
            <span>= {ripeCount} Mangoes 🥭</span>
          </div>
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

          <div className="flex items-center gap-4 text-xs font-bold shrink-0 bg-slate-50 dark:bg-slate-800/80 p-2.5 px-4 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
              <span className="text-base">🥭</span>
              <span>Ripe ({ripeCount})</span>
            </div>
            <div className="w-px h-4 bg-slate-300 dark:bg-slate-700" />
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <span className="text-base">🍏</span>
              <span>Growing ({growingMango ? '1' : '0'})</span>
            </div>
          </div>
        </div>

        {/* Tree Container Canvas */}
        <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] max-h-[580px] min-h-[380px] bg-gradient-to-b from-sky-100/60 via-emerald-50/40 to-amber-50/60 dark:from-slate-950 dark:via-emerald-950/20 dark:to-slate-900 rounded-3xl border border-slate-200/70 dark:border-slate-800/70 overflow-hidden flex items-center justify-center select-none shadow-inner">
          {/* Sky Ambient Glows */}
          <div className="absolute top-6 left-12 w-28 h-28 bg-amber-300/30 dark:bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute top-10 right-20 w-44 h-44 bg-emerald-400/20 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Majestic Tree SVG Background */}
          <svg
            viewBox="0 0 1000 650"
            className="w-full h-full object-contain pointer-events-none drop-shadow-md"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Wood Gradient */}
              <linearGradient id="trunkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#854d0e" />
                <stop offset="50%" stopColor="#713f12" />
                <stop offset="100%" stopColor="#451a03" />
              </linearGradient>

              {/* Foliage Gradients */}
              <radialGradient id="leafGrad1" cx="40%" cy="40%" r="60%">
                <stop offset="0%" stopColor="#4ade80" />
                <stop offset="60%" stopColor="#15803d" />
                <stop offset="100%" stopColor="#14532d" />
              </radialGradient>
              <radialGradient id="leafGrad2" cx="30%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#86efac" />
                <stop offset="50%" stopColor="#16a34a" />
                <stop offset="100%" stopColor="#166534" />
              </radialGradient>
              <radialGradient id="leafGrad3" cx="50%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#bbf7d0" />
                <stop offset="60%" stopColor="#22c55e" />
                <stop offset="100%" stopColor="#15803d" />
              </radialGradient>

              {/* Ground Hill Gradient */}
              <linearGradient id="groundGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#15803d" />
                <stop offset="100%" stopColor="#14532d" />
              </linearGradient>
            </defs>

            {/* Grassy Ground Mount */}
            <ellipse cx="500" cy="620" rx="420" ry="60" fill="url(#groundGrad)" opacity="0.9" />
            <ellipse cx="500" cy="635" rx="490" ry="50" fill="#14532d" opacity="0.6" />

            {/* Tree Trunk & Major Branches */}
            <path
              d="M470,610 Q460,450 430,360 Q400,280 340,240 Q390,270 450,330 Q470,250 490,190 Q510,250 540,320 Q600,260 660,230 Q600,280 570,360 Q540,450 530,610 Z"
              fill="url(#trunkGrad)"
            />

            {/* Secondary branches */}
            <path d="M430,360 Q340,340 270,300 Q330,330 420,380 Z" fill="url(#trunkGrad)" />
            <path d="M570,360 Q660,340 730,310 Q670,335 580,380 Z" fill="url(#trunkGrad)" />
            <path d="M490,260 Q440,210 390,160 Q440,200 490,250 Z" fill="url(#trunkGrad)" />
            <path d="M510,260 Q560,210 610,160 Q560,200 510,250 Z" fill="url(#trunkGrad)" />

            {/* Tree Canopy Layer 1 (Deep background foliage) */}
            <circle cx="340" cy="240" r="115" fill="url(#leafGrad1)" opacity="0.95" />
            <circle cx="660" cy="240" r="115" fill="url(#leafGrad1)" opacity="0.95" />
            <circle cx="500" cy="180" r="130" fill="url(#leafGrad1)" opacity="0.95" />

            {/* Tree Canopy Layer 2 (Mid-ground lush foliage) */}
            <circle cx="260" cy="310" r="95" fill="url(#leafGrad2)" opacity="0.95" />
            <circle cx="740" cy="310" r="95" fill="url(#leafGrad2)" opacity="0.95" />
            <circle cx="400" cy="220" r="110" fill="url(#leafGrad2)" opacity="0.95" />
            <circle cx="600" cy="220" r="110" fill="url(#leafGrad2)" opacity="0.95" />
            <circle cx="500" cy="270" r="120" fill="url(#leafGrad2)" opacity="0.9" />

            {/* Tree Canopy Layer 3 (Foreground highlights & leaves) */}
            <circle cx="340" cy="330" r="85" fill="url(#leafGrad3)" opacity="0.95" />
            <circle cx="660" cy="330" r="85" fill="url(#leafGrad3)" opacity="0.95" />
            <circle cx="480" cy="150" r="90" fill="url(#leafGrad3)" opacity="0.9" />
            <circle cx="530" cy="160" r="95" fill="url(#leafGrad3)" opacity="0.9" />
            <circle cx="500" cy="330" r="90" fill="url(#leafGrad3)" opacity="0.85" />
          </svg>

          {/* Interactive Ripe Mangoes Pinned on Tree */}
          {mangoes.map((mango, idx) => (
            <div
              key={mango.id || idx}
              onClick={() => handleMangoClick(mango)}
              style={{
                left: `${mango.position.x}%`,
                top: `${mango.position.y}%`
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group transform transition-all duration-300 hover:scale-130 hover:z-30"
              title={`Click to inspect: ${mango.title} (+${mango.hours}h Break)`}
            >
              {/* Hanging Stem Line */}
              <div className="w-[2px] h-4 bg-amber-900 mx-auto -mb-1 opacity-80" />

              {/* Mango Graphic Body */}
              <div className="relative flex items-center justify-center">
                {/* Gentle Pulsing Glow */}
                <div className="absolute inset-0 bg-amber-400/40 rounded-full blur-md animate-pulse" />

                {/* SVG Juicy Mango */}
                <svg
                  width="44"
                  height="50"
                  viewBox="0 0 100 115"
                  className="relative z-10 drop-shadow-lg filter group-hover:brightness-110 transition-all duration-200"
                >
                  <defs>
                    <linearGradient id={`mangoSkin_${idx}`} x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#fde047" />
                      <stop offset="45%" stopColor="#f59e0b" />
                      <stop offset="85%" stopColor="#ea580c" />
                      <stop offset="100%" stopColor="#dc2626" />
                    </linearGradient>
                  </defs>

                  {/* Leaf on stem */}
                  <path d="M50,8 Q65,2 72,12 Q65,18 50,14 Z" fill="#22c55e" />
                  <path d="M50,10 L50,18" stroke="#78350f" strokeWidth="4" strokeLinecap="round" />

                  {/* Organic Mango Shape */}
                  <path
                    d="M50,18 C28,18 16,36 16,62 C16,92 34,108 55,108 C78,108 86,88 86,60 C86,34 72,18 50,18 Z"
                    fill={`url(#mangoSkin_${idx})`}
                  />

                  {/* Glossy highlight */}
                  <ellipse cx="34" cy="46" rx="8" ry="16" fill="#ffffff" opacity="0.45" transform="rotate(-20 34 46)" />
                </svg>

                {/* Badge Number */}
                <span className="absolute bottom-1 bg-slate-900/90 text-amber-300 text-[10px] font-black px-1.5 py-0.2 rounded-full border border-amber-400/40 shadow-xs z-20">
                  +{mango.hours}h
                </span>
              </div>

              {/* Floating Tooltip on Hover */}
              <div className="absolute left-1/2 -translate-x-1/2 -bottom-9 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none bg-slate-900 text-white text-[11px] font-bold px-2.5 py-1 rounded-xl shadow-xl whitespace-nowrap z-40 border border-slate-700">
                🥭 {mango.title} (1 Day Break) &bull; Click to Claim!
              </div>
            </div>
          ))}

          {/* Growing / Unripe Mango (if any progress) */}
          {growingMango && (
            <div
              onClick={() => handleMangoClick(growingMango)}
              style={{
                left: `${growingMango.position.x}%`,
                top: `${growingMango.position.y}%`
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group transform transition-all duration-300 hover:scale-125 hover:z-30"
              title={`Ripening: ${growingMango.current_hours}h / ${growingMango.target_hours}h`}
            >
              <div className="w-[2px] h-3 bg-emerald-900 mx-auto -mb-1 opacity-80" />

              <div className="relative flex items-center justify-center">
                {/* SVG Growing Green Mango */}
                <svg width="36" height="42" viewBox="0 0 100 115" className="relative z-10 drop-shadow-md">
                  <defs>
                    <linearGradient id="growingMangoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#bef264" />
                      <stop offset="60%" stopColor="#84cc16" />
                      <stop offset="100%" stopColor="#4d7c0f" />
                    </linearGradient>
                  </defs>
                  <path d="M50,8 Q65,2 72,12 Q65,18 50,14 Z" fill="#15803d" />
                  <path d="M50,10 L50,18" stroke="#78350f" strokeWidth="4" strokeLinecap="round" />
                  <path
                    d="M50,18 C30,18 20,36 20,62 C20,92 36,108 55,108 C76,108 84,88 84,60 C84,34 70,18 50,18 Z"
                    fill="url(#growingMangoGrad)"
                  />
                  <ellipse cx="34" cy="46" rx="6" ry="12" fill="#ffffff" opacity="0.35" transform="rotate(-20 34 46)" />
                </svg>

                {/* Progress Pill */}
                <span className="absolute bottom-0 bg-emerald-950 text-emerald-300 text-[9px] font-black px-1.5 py-0.2 rounded-full border border-emerald-500/40 shadow-xs z-20">
                  {Math.round(growingMango.progress_percent)}%
                </span>
              </div>

              {/* Tooltip */}
              <div className="absolute left-1/2 -translate-x-1/2 -bottom-9 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none bg-slate-900 text-white text-[11px] font-bold px-2.5 py-1 rounded-xl shadow-xl whitespace-nowrap z-40 border border-slate-700">
                🍏 Ripening: {formatHoursToHuman(growingMango.current_hours)} / {formatHoursToHuman(growingMango.target_hours)} (need +{formatHoursToHuman(growingMango.remaining_hours)} more to mature)
              </div>
            </div>
          )}

          {/* Empty Tree Banner when 0 Mangoes */}
          {mangoes.length === 0 && !growingMango && (
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
      <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/60 rounded-2xl text-amber-600 dark:text-amber-400">
              <FiSun className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Break Bank Ledger & History</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Track your extra work hours, leaves deducted in between, and redeemed break days.
              </p>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 self-start sm:self-auto">
            <button
              onClick={() => setActiveLedgerTab('overtime')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${activeLedgerTab === 'overtime'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
            >
              <span>🌿</span>
              <span>Overtime ({data?.contributions?.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveLedgerTab('short_time')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${activeLedgerTab === 'short_time'
                  ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
            >
              <span>⏱️</span>
              <span>Short Time ({data?.gaps?.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveLedgerTab('leaves')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${activeLedgerTab === 'leaves'
                  ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
            >
              <span>🏖️</span>
              <span>Leaves Deducted ({data?.leaves_taken?.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveLedgerTab('claims')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${activeLedgerTab === 'claims'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
            >
              <span>🥭</span>
              <span>Claimed Breaks ({data?.recent_claims?.length || 0})</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Overtime Contributions */}
        {activeLedgerTab === 'overtime' && (
          <div className="overflow-x-auto max-h-[360px] custom-scrollbar">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900">
                <tr>
                  <th className="pb-3 font-semibold">Date</th>
                  <th className="pb-3 font-semibold">Worked Hours</th>
                  <th className="pb-3 font-semibold">Shift Target</th>
                  <th className="pb-3 font-semibold">Overtime Earned</th>
                  <th className="pb-3 font-semibold text-right">Bank Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-600 dark:text-slate-300 font-medium">
                {data?.contributions && data.contributions.length > 0 ? (
                  data.contributions.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">{item.date}</td>
                      <td className="py-3">{formatHoursToHuman(item.worked_hours)}</td>
                      <td className="py-3">{formatHoursToHuman(item.expected_hours)}</td>
                      <td className="py-3 font-black text-emerald-600 dark:text-emerald-400">
                        +{formatHoursToHuman(item.overtime_hours)}
                      </td>
                      <td className="py-3 text-right">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200 dark:border-emerald-700/60">
                          + Added to Tree
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-400 font-normal">
                      No overtime hours logged in recent attendance.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Short Time / Shift Shortfalls */}
        {activeLedgerTab === 'short_time' && (
          <div className="overflow-x-auto max-h-[360px] custom-scrollbar">
            <div className="p-3 mb-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 text-xs text-rose-800 dark:text-rose-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FiInfo className="w-4 h-4 text-rose-500 shrink-0" />
                <span>
                  <strong>Short Time (Gap):</strong> Shifts where work ended earlier than the standard {shiftHours}h shift target. These shortfalls are deducted from your gross overtime.
                </span>
              </div>
              <span className="font-black shrink-0 ml-2">
                Total Short Time: -{formatHoursToHuman(summary?.total_short_hours)}
              </span>
            </div>

            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900">
                <tr>
                  <th className="pb-3 font-semibold">Date</th>
                  <th className="pb-3 font-semibold">Worked Hours</th>
                  <th className="pb-3 font-semibold">Shift Target</th>
                  <th className="pb-3 font-semibold">Short Time (Gap)</th>
                  <th className="pb-3 font-semibold text-right">Bank Impact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-600 dark:text-slate-300 font-medium">
                {data?.gaps && data.gaps.length > 0 ? (
                  data.gaps.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">{item.date}</td>
                      <td className="py-3 font-medium">{formatHoursToHuman(item.worked_hours)}</td>
                      <td className="py-3 text-slate-500 dark:text-slate-400">{formatHoursToHuman(item.expected_hours)}</td>
                      <td className="py-3 font-black text-rose-600 dark:text-rose-400">
                        -{formatHoursToHuman(item.short_hours)}
                      </td>
                      <td className="py-3 text-right">
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-[10px] font-bold border border-rose-200 dark:border-rose-700/60">
                          - Deducted from OT
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-400 font-normal">
                      🎉 No short shifts recorded! You've met or exceeded the {shiftHours}h target every working day.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Leaves & Absences Deducted */}
        {activeLedgerTab === 'leaves' && (
          <div className="overflow-x-auto max-h-[360px] custom-scrollbar">
            <div className="p-3 mb-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 text-xs text-rose-800 dark:text-rose-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FiInfo className="w-4 h-4 text-rose-500 shrink-0" />
                <span>
                  <strong>Note:</strong> Approved leaves or absent days taken in between are automatically deducted from your overtime break bank (at {shiftHours}h per day).
                </span>
              </div>
              <span className="font-black shrink-0 ml-2">
                Total: -{formatHoursToHuman(summary?.total_leave_deducted_hours)}
              </span>
            </div>

            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900">
                <tr>
                  <th className="pb-3 font-semibold">Leave Date</th>
                  <th className="pb-3 font-semibold">Type</th>
                  <th className="pb-3 font-semibold">Reason / Source</th>
                  <th className="pb-3 font-semibold">Hours Deducted</th>
                  <th className="pb-3 font-semibold text-right">Bank Impact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-600 dark:text-slate-300 font-medium">
                {data?.leaves_taken && data.leaves_taken.length > 0 ? (
                  data.leaves_taken.map((leave, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">{leave.date}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                          {leave.type}
                        </span>
                      </td>
                      <td className="py-3 text-slate-500 dark:text-slate-400">{leave.reason || 'Approved Leave'}</td>
                      <td className="py-3 font-black text-rose-600 dark:text-rose-400">
                        -{formatHoursToHuman(leave.hours_deducted || shiftHours)}
                      </td>
                      <td className="py-3 text-right">
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-[10px] font-bold border border-rose-200 dark:border-rose-700/60">
                          - Deducted
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-400 font-normal">
                      🎉 No leaves or absences taken! Your overtime break bank is 100% intact.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 4: Claimed Mango Breaks (Full Day + In-Shift) */}
        {activeLedgerTab === 'claims' && (
          <div className="overflow-x-auto max-h-[360px] custom-scrollbar">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900">
                <tr>
                  <th className="pb-3 font-semibold">Date</th>
                  <th className="pb-3 font-semibold">Break Type</th>
                  <th className="pb-3 font-semibold">Time / Hours Claimed</th>
                  <th className="pb-3 font-semibold">Reason</th>
                  <th className="pb-3 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-600 dark:text-slate-300 font-medium">
                {data?.recent_claims && data.recent_claims.length > 0 ? (
                  data.recent_claims.map((claim, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">
                        {claim.leave_date || claim.claim_date}
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          claim.type?.includes('Full Day')
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60'
                            : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                        }`}>
                          {claim.type || 'Mango Break'}
                        </span>
                      </td>
                      <td className="py-3 font-black text-slate-900 dark:text-white">
                        {claim.duration_minutes
                          ? `${claim.duration_minutes} mins (${formatHoursToHuman(claim.hours_claimed)})`
                          : formatHoursToHuman(claim.hours_claimed)}
                      </td>
                      <td className="py-3 text-slate-500 dark:text-slate-400">{claim.reason || 'Overtime Break'}</td>
                      <td className="py-3 text-right">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                          {claim.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-400 font-normal">
                      No mango break tokens claimed yet. Click a ripe mango on the tree or request an in-shift Mango Break!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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
    </div>
  );
}
