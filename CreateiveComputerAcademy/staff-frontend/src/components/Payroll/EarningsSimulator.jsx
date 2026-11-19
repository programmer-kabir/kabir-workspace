import React, { useState, useMemo } from 'react';
import {
  FiSliders, FiDollarSign, FiClock, FiCalendar,
  FiTrendingUp, FiAward, FiSun, FiCheckCircle,
  FiRotateCcw, FiInfo, FiShield, FiArrowRight
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import AnimatedCounter from '../AnimatedCounter';

export default function EarningsSimulator({ summary, currentUser }) {
  // ── Extract Live Baseline Stats ──
  const activeRate = Number(summary?.active_hourly_rate || summary?.scheme?.hourly_rate || 72.12);
  const shiftHours = Number(summary?.overtime_bank?.shift_hours || summary?.scheme?.standard_daily_hours || 8);
  const currentRipeMangoes = Number(summary?.overtime_bank?.ripe_mangoes || 0);
  const currentAvailableWithdrawable = Number(summary?.available_withdrawable || summary?.available_withdrawable_total || 0);
  const monthlySalary = Number(summary?.monthly_salary || summary?.scheme?.salary_amount || (activeRate * shiftHours * 26));

  // ── Interactive Simulator State ──
  const [projectedOtHours, setProjectedOtHours] = useState(16); // e.g. 16 hours OT
  const [mangoCashoutCount, setMangoCashoutCount] = useState(
    Math.min(currentRipeMangoes, Math.max(1, Math.floor(currentRipeMangoes / 2)))
  );
  const [committedWorkDays, setCommittedWorkDays] = useState(26); // default 26 days
  const [rateMultiplier, setRateMultiplier] = useState(1.0); // 1.0 (current), 1.1 (+10%), 1.25 (+25%)

  // Reset to Defaults
  const handleReset = () => {
    setProjectedOtHours(16);
    setMangoCashoutCount(Math.min(currentRipeMangoes, Math.max(1, Math.floor(currentRipeMangoes / 2))));
    setCommittedWorkDays(26);
    setRateMultiplier(1.0);
  };

  // ── Real-Time Financial Calculations ──
  const effectiveRate = activeRate * rateMultiplier;
  const cashPerMango = shiftHours * effectiveRate;

  // 1. Base Salary from working days
  const projectedBaseSalary = committedWorkDays * shiftHours * effectiveRate;

  // 2. New Overtime Money & Projected New Mangoes
  const newOtEarnings = projectedOtHours * effectiveRate;
  const newMangoesEarned = Math.floor(projectedOtHours / shiftHours);
  const remainderOtMinutes = Math.round((projectedOtHours % shiftHours) * 60);

  // 3. Mango Liquidation vs Leave Reserve
  const safeMangoCashCount = Math.min(currentRipeMangoes, Math.max(0, mangoCashoutCount));
  const mangoCashEarnings = safeMangoCashCount * cashPerMango;
  const mangoLeavesReserved = Math.max(0, currentRipeMangoes - safeMangoCashCount);

  // 4. Combined Total Projected Payout
  const totalProjectedPayout = Math.round(
    currentAvailableWithdrawable + projectedBaseSalary + newOtEarnings + mangoCashEarnings
  );

  const totalMonthlyPotential = Math.round(projectedBaseSalary + newOtEarnings + mangoCashEarnings);

  // Percentages for stacked progress bar
  const pctBase = totalMonthlyPotential > 0 ? Math.round((projectedBaseSalary / totalMonthlyPotential) * 100) : 0;
  const pctOt = totalMonthlyPotential > 0 ? Math.round((newOtEarnings / totalMonthlyPotential) * 100) : 0;
  const pctMango = totalMonthlyPotential > 0 ? Math.max(0, 100 - pctBase - pctOt) : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* ── Top Hero Banner (White Mode & Dark Mode adaptive) ── */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-10 text-slate-900 dark:text-white shadow-xl dark:shadow-2xl bg-gradient-to-br from-white via-indigo-50/40 to-slate-50 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900 border border-slate-200/90 dark:border-slate-800 transition-colors duration-300">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-bold uppercase tracking-wider backdrop-blur-md border border-amber-200/80 dark:border-amber-900/60">
              <HiSparkles className="text-amber-500" />
              <span>CCA Financial Intelligence & Simulator</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
              <span>Earnings & Mango Simulator</span>
              <span className="text-2xl sm:text-3xl">💰🥭</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
              Simulate your future payout based on additional overtime, mango vault cashouts vs leave reservations, and contract tier promotions.
            </p>
          </div>

          {/* Quick Baseline Stats Capsule */}
          <div className="flex flex-wrap items-center gap-3 bg-white/90 dark:bg-white/5 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-slate-200/90 dark:border-white/10 shadow-lg">
            <div className="text-center px-3 sm:px-4 border-r border-slate-200/80 dark:border-white/10">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Rate</div>
              <div className="text-lg sm:text-xl font-black text-indigo-600 dark:text-indigo-400">
                ৳{effectiveRate.toFixed(2)}<span className="text-xs font-medium text-slate-400">/hr</span>
              </div>
            </div>

            <div className="text-center px-3 sm:px-4 border-r border-slate-200/80 dark:border-white/10">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Shift Length</div>
              <div className="text-lg sm:text-xl font-black text-slate-800 dark:text-white">
                {shiftHours} hrs
              </div>
            </div>

            <div className="text-center px-3 sm:px-4">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ripe Mangoes</div>
              <div className="text-lg sm:text-xl font-black text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1">
                <span>🥭</span>
                <span>{currentRipeMangoes}</span>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-600 dark:text-white transition ml-auto"
              title="Reset Simulator to Defaults"
            >
              <FiRotateCcw size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Two-Column Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ── Left Column: Interactive Controls & Sliders (7 cols) ── */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <FiSliders className="text-indigo-500" />
                  <span>Interactive Forecast Controls</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Adjust sliders to see real-time impact on month-end earnings
                </p>
              </div>

              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-900">
                Live Dynamic
              </span>
            </div>

            {/* 1. PROJECTED OVERTIME HOURS SLIDER */}
            <div className="space-y-3 p-4 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300">
                    <FiClock size={16} />
                  </span>
                  <div>
                    <div className="text-xs font-black uppercase tracking-wider text-indigo-900 dark:text-indigo-300">
                      Additional Overtime Work
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Extra hours invested beyond standard daily shifts
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                    +{projectedOtHours} hrs
                  </span>
                  <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    +{Math.round(newOtEarnings).toLocaleString()} BDT
                  </div>
                </div>
              </div>

              <input
                type="range"
                min="0"
                max="60"
                step="1"
                value={projectedOtHours}
                onChange={(e) => setProjectedOtHours(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
              />

              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400 pt-1">
                <span>0 hrs</span>
                <span className="text-indigo-600 dark:text-indigo-300">
                  Yields: 🥭 <strong>+{newMangoesEarned} Ripe Mangoes</strong> {remainderOtMinutes > 0 && `(+${remainderOtMinutes}m)`}
                </span>
                <span>60 hrs</span>
              </div>
            </div>

            {/* 2. MANGO LIQUIDATION VS LEAVE STRATEGY */}
            <div className="space-y-3 p-4 rounded-2xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">
                    <FiSun size={16} />
                  </span>
                  <div>
                    <div className="text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-300">
                      Mango Vault Liquidation Strategy
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Convert to cash at withdrawal OR preserve as paid leaves
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xl font-black text-amber-600 dark:text-amber-400">
                    {safeMangoCashCount} / {currentRipeMangoes}
                  </span>
                  <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    +{Math.round(mangoCashEarnings).toLocaleString()} BDT Cashout
                  </div>
                </div>
              </div>

              {currentRipeMangoes > 0 ? (
                <>
                  <input
                    type="range"
                    min="0"
                    max={currentRipeMangoes}
                    step="1"
                    value={safeMangoCashCount}
                    onChange={(e) => setMangoCashoutCount(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
                  />

                  <div className="flex items-center justify-between text-xs pt-1">
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                      <FiDollarSign size={13} />
                      <span>Cash-out: ৳{Math.round(mangoCashEarnings).toLocaleString()}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold">
                      <FiShield size={13} />
                      <span>Leave Reserve: {mangoLeavesReserved} Paid Days Off</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-3 rounded-xl bg-white/70 dark:bg-white/5 border border-amber-200/60 dark:border-amber-900/40 text-center text-xs text-amber-800 dark:text-amber-300">
                  No ripe mangoes in vault yet. Work overtime to accumulate ripe mangoes!
                </div>
              )}
            </div>

            {/* 3. WORKING DAYS & PUNCTUALITY COMMITMENT */}
            <div className="space-y-3 p-4 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                    <FiCalendar size={16} />
                  </span>
                  <div>
                    <div className="text-xs font-black uppercase tracking-wider text-emerald-900 dark:text-emerald-300">
                      Committed Working Days in Month
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Standard monthly schedule (Fridays off)
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                    {committedWorkDays} days
                  </span>
                  <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    {committedWorkDays * shiftHours} Total Shift Hours
                  </div>
                </div>
              </div>

              <input
                type="range"
                min="18"
                max="26"
                step="1"
                value={committedWorkDays}
                onChange={(e) => setCommittedWorkDays(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
              />

              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400 pt-1">
                <span>18 Days (Part-Time / Leave)</span>
                <span className="text-emerald-700 dark:text-emerald-300 font-bold">
                  Base Pay: ৳{Math.round(projectedBaseSalary).toLocaleString()}
                </span>
                <span>26 Days (Full Attendance)</span>
              </div>
            </div>

            {/* 4. CAREER CONTRACT MILESTONE & PROMOTION BOOST */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300">
                    <FiTrendingUp size={16} />
                  </span>
                  <div>
                    <div className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      Quarterly Tier Increment Explorer
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Simulate earnings if promoted to the next contract milestone
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setRateMultiplier(1.0)}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    rateMultiplier === 1.0
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="text-xs font-bold">Current Tier</div>
                  <div className="text-sm font-black mt-0.5">৳{activeRate.toFixed(2)}/h</div>
                </button>

                <button
                  type="button"
                  onClick={() => setRateMultiplier(1.10)}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    rateMultiplier === 1.10
                      ? 'bg-purple-600 text-white border-purple-600 shadow-md'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="text-xs font-bold">+10% Q-Tier Boost</div>
                  <div className="text-sm font-black mt-0.5">৳{(activeRate * 1.10).toFixed(2)}/h</div>
                </button>

                <button
                  type="button"
                  onClick={() => setRateMultiplier(1.25)}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    rateMultiplier === 1.25
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="text-xs font-bold">+25% Promotion</div>
                  <div className="text-sm font-black mt-0.5">৳{(activeRate * 1.25).toFixed(2)}/h</div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Column: Forecast Cards & Strategic Insights (5 cols) ── */}
        <div className="lg:col-span-5 space-y-6">
          {/* Main Projected Payout Card */}
          <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-indigo-500/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                  <FiAward className="text-amber-400" />
                  <span>Total Simulated Payout</span>
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 font-bold text-amber-300">
                  Month-End Forecast
                </span>
              </div>

              <div>
                <div className="text-3xl sm:text-4xl font-black text-amber-400 tracking-tight">
                  ৳ <AnimatedCounter value={totalProjectedPayout} />
                </div>
                <div className="text-xs text-indigo-200/80 mt-1">
                  Estimated total cash in wallet including current matured balances
                </div>
              </div>

              {/* Stacked Visual Bar */}
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                  <span>Monthly Contribution Split</span>
                  <span>100%</span>
                </div>
                <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden flex shadow-inner">
                  <div
                    style={{ width: `${pctBase}%` }}
                    className="bg-emerald-400 transition-all duration-500"
                    title={`Base: ${pctBase}%`}
                  />
                  <div
                    style={{ width: `${pctOt}%` }}
                    className="bg-indigo-400 transition-all duration-500"
                    title={`Overtime: ${pctOt}%`}
                  />
                  <div
                    style={{ width: `${pctMango}%` }}
                    className="bg-amber-400 transition-all duration-500"
                    title={`Mangoes: ${pctMango}%`}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-300 pt-0.5">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Base ({pctBase}%)</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-400 inline-block" /> OT ({pctOt}%)</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Mango ({pctMango}%)</span>
                </div>
              </div>

              {/* Granular Breakdown List */}
              <div className="divide-y divide-white/10 pt-2 text-xs">
                <div className="py-2.5 flex items-center justify-between text-slate-200">
                  <span>Standard Base Shift Earnings</span>
                  <span className="font-bold text-emerald-400">+ ৳{Math.round(projectedBaseSalary).toLocaleString()}</span>
                </div>
                <div className="py-2.5 flex items-center justify-between text-slate-200">
                  <span>Additional Overtime Hours ({projectedOtHours}h)</span>
                  <span className="font-bold text-indigo-300">+ ৳{Math.round(newOtEarnings).toLocaleString()}</span>
                </div>
                <div className="py-2.5 flex items-center justify-between text-slate-200">
                  <span>Mangoes Liquidated ({safeMangoCashCount} 🥭)</span>
                  <span className="font-bold text-amber-400">+ ৳{Math.round(mangoCashEarnings).toLocaleString()}</span>
                </div>
                <div className="py-2.5 flex items-center justify-between text-slate-300">
                  <span>Current Matured Withdrawable Balance</span>
                  <span className="font-semibold text-slate-200">+ ৳{Math.round(currentAvailableWithdrawable).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Strategic Recommendations Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <HiSparkles className="text-amber-500" />
              <span>Smart Optimizer Insights</span>
            </h3>

            <div className="space-y-3 text-xs leading-relaxed">
              <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-slate-800 dark:text-slate-200 space-y-1">
                <div className="font-black text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                  <span>🥭 Mango Balanced Allocation:</span>
                </div>
                <p>
                  You chose to cash out <strong>{safeMangoCashCount} ripe mangoes (৳{Math.round(mangoCashEarnings).toLocaleString()})</strong> and reserve <strong>{mangoLeavesReserved} mangoes as paid leaves</strong>. This protects your salary if you take emergency days off!
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/40 text-slate-800 dark:text-slate-200 space-y-1">
                <div className="font-black text-indigo-800 dark:text-indigo-400 flex items-center gap-1.5">
                  <span>⏱️ Daily 40-Min Micro Habit:</span>
                </div>
                <p>
                  Working just <strong>45 minutes extra per day</strong> yields ~19.5 overtime hours per month, creating <strong>2 extra ripe mangoes (৳{Math.round(2 * cashPerMango).toLocaleString()})</strong> completely on autopilot!
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 text-slate-800 dark:text-slate-200 space-y-1">
                <div className="font-black text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                  <span>🛡️ Loss Prevention Guarantee:</span>
                </div>
                <p>
                  Maintaining zero excess breaks and checking in before 9:15 AM guarantees 100% payout protection and accelerates your Daily Streak XP.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
