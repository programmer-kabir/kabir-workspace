import React from 'react';
import { FiCheckCircle, FiRefreshCw } from 'react-icons/fi';

export const PayrollContractRoadmap = ({
  isYearlyContract = false,
  isStaggeredContract = false,
  summary = {},
  scheme = {},
  targetCompleted = false,
  progressPercent = 0,
  contractRoadmap = null,
  activeTier = null,
}) => {
  if (!isYearlyContract && (!isStaggeredContract || !contractRoadmap)) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Yearly Contract Speedometer / Progress Bar */}
      {isYearlyContract && (
        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  Company Contract Target: ৳{Number(summary.contract_target || 50000).toLocaleString()}
                </h3>
                {targetCompleted ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 text-xs font-bold animate-pulse">
                    <FiCheckCircle className="w-4 h-4" /> 100% Completed!
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 text-xs font-bold">
                    <FiRefreshCw className="w-3.5 h-3.5 animate-spin" /> In Progress
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Contract Period: {scheme.contract_start_date} to {scheme.contract_end_date} (1-Year Duration)
              </p>
            </div>

            <div className="text-right">
              <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                {progressPercent.toFixed(1)}%
              </span>
              <p className="text-xs text-slate-400 font-medium">Progress to Unlock Surplus</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative w-full h-5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-1">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                targetCompleted
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(2, progressPercent))}%` }}
            />
          </div>

          {/* Breakdown metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">1. Company Reserved</span>
              <div className="text-lg font-black text-slate-800 dark:text-slate-200 mt-1">
                ৳ {Number(summary.company_reserved || 0).toLocaleString()} / ৳{Number(summary.contract_target || 50000).toLocaleString()}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">One-time commitment for the full year</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase">2. Staff Surplus Earned</span>
              <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1">
                ৳ {Number(summary.staff_surplus_earned || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">100% staff share after target milestone</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">3. Total Withdrawn / Pending</span>
              <div className="text-lg font-black text-slate-800 dark:text-slate-200 mt-1">
                ৳ {Number(summary.total_withdrawn || 0).toLocaleString()}{' '}
                <span className="text-xs text-amber-500 font-normal">({Number(summary.pending_withdrawn || 0).toLocaleString()} pending)</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Disbursed via bKash / Bank</p>
            </div>
          </div>
        </div>
      )}

      {/* Staggered 1-Year Contract Milestone Roadmap */}
      {isStaggeredContract && contractRoadmap && (
        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-purple-200/80 dark:border-purple-800/60 shadow-sm space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 z-10 relative">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[10px] font-black uppercase tracking-wider border border-purple-200 dark:border-purple-800">
                  📈 ১ বছরের ধাপভিত্তিক চুক্তি (Staggered Contract)
                </span>
                {activeTier && (
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold border border-indigo-200 dark:border-indigo-800 flex items-center gap-1 flex-wrap">
                    <span>বর্তমান: Tier {activeTier.tier_number} (মাস {activeTier.month_index} of {contractRoadmap.total_months})</span>
                    {activeTier.days_elapsed !== undefined && (
                      <span className="opacity-90 font-medium text-slate-500 dark:text-slate-400">
                        • {activeTier.days_elapsed} দিন অতিবাহিত {activeTier.days_remaining > 0 && `(আর ${activeTier.days_remaining} দিন বাকি)`}
                      </span>
                    )}
                  </span>
                )}
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                ১ বছরের ক্যারিয়ার ও ইনক্রিমেন্ট রোডম্যাপ (4-Quarter Career Growth)
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl mt-0.5">
                প্রতি ৩ মাস পর পর আপনার বেতন স্বয়ংক্রিয়ভাবে পরবর্তী ধাপে উন্নীত হবে। পেছনের মাসগুলো স্থায়ীভাবে সেই ধাপের রেটেই সংরক্ষিত থাকে।
              </p>
            </div>

            <div className="flex items-center gap-4 bg-purple-50 dark:bg-purple-950/40 p-3.5 rounded-2xl border border-purple-200 dark:border-purple-800/60 shrink-0">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">বর্তমান মাসিক বেতন</span>
                <div className="text-xl font-black text-purple-700 dark:text-purple-300">
                  ৳ {Number(activeTier?.monthly_salary || 3500).toLocaleString()} <span className="text-xs font-normal text-slate-400">/মাস</span>
                </div>
              </div>
              <div className="h-8 w-px bg-purple-200 dark:bg-purple-800" />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">ঘণ্টা প্রতি রেট</span>
                <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                  ৳ {Number(activeTier?.hourly_rate || 0).toFixed(2)}/h
                </div>
              </div>
              <div className="h-8 w-px bg-purple-200 dark:bg-purple-800 hidden sm:block" />
              <div className="hidden sm:block">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">দৈনিক কাজের লক্ষ্য</span>
                <div className="text-sm font-bold text-purple-900 dark:text-purple-200">
                  ৭ ঘণ্টা ২০ মিনিট <span className="text-[10px] font-normal text-slate-400">(৪০মি. টিফিন)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Overall Contract Progress Bar */}
          <div className="space-y-2 z-10 relative">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-700 dark:text-slate-300">
                বার্ষিক সর্বমোট চুক্তি: ৳ {Number(contractRoadmap.contract_amount || 60000).toLocaleString()}
              </span>
              <span className="text-purple-700 dark:text-purple-300">
                ৳ {Number(contractRoadmap.total_earned || 0).toLocaleString()} অর্জিত ({contractRoadmap.progress_percent}%)
              </span>
            </div>
            <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-600 transition-all duration-700"
                style={{ width: `${Math.min(100, Math.max(3, contractRoadmap.progress_percent))}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>চুক্তির অবশিষ্ট: ৳ {Number(contractRoadmap.remaining_contract || 0).toLocaleString()}</span>
              <span>মোট ১২ মাস • ৪টি ৩-মাসের কোয়ার্টার</span>
            </div>
          </div>

          {/* 4 Quarterly Milestones Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 z-10 relative">
            {(contractRoadmap.tiers || []).map((t) => {
              const isCompleted = t.status === 'completed';
              const isActive = t.status === 'active';

              return (
                <div
                  key={t.tier_number}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between relative overflow-hidden ${
                    isActive
                      ? 'bg-gradient-to-b from-purple-50/80 to-indigo-50/50 dark:from-purple-950/40 dark:to-indigo-950/20 border-purple-400 dark:border-purple-600 shadow-md ring-2 ring-purple-500/20'
                      : isCompleted
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50'
                        : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-80'
                  }`}
                >
                  {isActive && (
                    <div className="absolute top-0 right-0 bg-purple-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-bl-lg">
                      Active Tier
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Tier {t.tier_number}
                      </span>
                      {isCompleted ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                          <FiCheckCircle size={12} /> সম্পন্ন
                        </span>
                      ) : isActive ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-purple-600 dark:text-purple-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping inline-block mr-0.5" />
                          বর্তমান ধাপ
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400">🔒 আসন্ন</span>
                      )}
                    </div>

                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                      {t.tier_name || `Quarter ${t.tier_number}`}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      মাসের {t.start_month_index} থেকে {t.end_month_index} (৩ মাস)
                      {t.start_date && t.end_date && (
                        <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                          📅 {t.start_date} ~ {t.end_date}
                        </span>
                      )}
                    </p>

                    <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
                      <div className="text-[10px] uppercase font-bold text-slate-400">মাসিক বেতন</div>
                      <div className="text-xl font-black text-slate-900 dark:text-white">
                        ৳ {Number(t.monthly_salary).toLocaleString()}
                        <span className="text-xs font-normal text-slate-400">/মাস</span>
                      </div>
                    </div>

                    {/* Days Breakdown in this Quarter */}
                    {t.total_days && (
                      <div className="mt-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/40 text-[10px] space-y-1">
                        <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 font-medium">
                          <span>সময় অতিবাহিত:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-100">
                            {t.days_elapsed} / {t.total_days} দিন
                          </span>
                        </div>
                        {isActive && t.days_remaining > 0 && (
                          <div className="flex items-center justify-between text-purple-700 dark:text-purple-300 font-medium">
                            <span>ইনক্রিমেন্টে বাকি:</span>
                            <span className="font-bold">{t.days_remaining} দিন</span>
                          </div>
                        )}
                        {t.attendance_days > 0 && (
                          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                            <span>উপস্থিতি হাজিরা:</span>
                            <span className="font-bold">{t.attendance_days} দিন</span>
                          </div>
                        )}
                        {isActive && (
                          <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-1">
                            <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${t.days_progress}%` }} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-200/40 dark:border-slate-700/40 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">রেট:</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                      ৳ {Number(t.hourly_rate).toFixed(2)}/h
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollContractRoadmap;
