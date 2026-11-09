import React from 'react';
import { FiShield, FiCheckCircle, FiRefreshCw, FiInfo, FiTrendingUp } from 'react-icons/fi';

/**
 * SecurityDepositVaultCard
 * Displays Staff Security Deposit (জামানত) status, progress bar,
 * and Option A monthly living allowance vs deposit deduction breakdown.
 */
export default function SecurityDepositVaultCard({ securityDeposit = {} }) {
  if (!securityDeposit || !securityDeposit.has_deposit) {
    return null;
  }

  const target = parseFloat(securityDeposit.target_amount || 0);
  const collected = parseFloat(securityDeposit.collected_amount || 0);
  const remaining = Math.max(0, target - collected);
  const isFulfilled = Boolean(securityDeposit.is_fulfilled);
  const progressPercent = Math.min(100, Math.max(0, parseFloat(securityDeposit.progress_percent || 0)));
  const livingAllowance = parseFloat(securityDeposit.monthly_living_allowance || 5000);
  const split = securityDeposit.current_month_split || {};
  const currentEarned = parseFloat(split.monthly_earned || 0);
  const takeHome = parseFloat(split.take_home_amount || 0);
  const deducted = parseFloat(split.deducted_amount || 0);

  return (
    <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400/20 via-orange-400/15 to-amber-500/10 dark:from-amber-500/20 dark:via-orange-500/15 dark:to-transparent border border-amber-200/80 dark:border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-xs shrink-0">
            <FiShield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="font-black text-slate-900 dark:text-white text-lg tracking-tight">
                Security Deposit Vault (জামানত তহবিল)
              </h3>
              {isFulfilled ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 inline-flex items-center gap-1.5 shadow-2xs animate-pulse">
                  <FiCheckCircle className="w-3.5 h-3.5" />
                  <span>১০০% সম্পন্ন — ফুল বেতন আনলকড</span>
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 inline-flex items-center gap-1.5 shadow-2xs">
                  <FiRefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>জামানত চলমান</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              মোট লক্ষ্যমাত্রা: <strong>৳ {target.toLocaleString()}</strong> &bull; মাসিক মূল বেতন / খরচ: <strong>৳ {livingAllowance.toLocaleString()}</strong>
            </p>
          </div>
        </div>

        {/* Big percentage display */}
        <div className="text-right shrink-0">
          <span className="text-2xl md:text-3xl font-black text-amber-600 dark:text-amber-400">
            {progressPercent.toFixed(1)}%
          </span>
          <p className="text-[11px] text-slate-400 font-medium">জামানত প্রগ্রেস</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="relative w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${
              isFulfilled
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600'
            }`}
            style={{ width: `${Math.min(100, Math.max(2, progressPercent))}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400 pt-0.5">
          <span>জমা হয়েছে: <strong className="text-amber-600 dark:text-amber-400">৳ {collected.toLocaleString()}</strong></span>
          <span>অবশিষ্ট বাকি: <strong className="text-slate-900 dark:text-white">৳ {remaining.toLocaleString()}</strong></span>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">১. মোট লক্ষ্যমাত্রা</span>
          <div className="text-lg font-black text-slate-900 dark:text-white">
            ৳ {target.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400">চুক্তিভিত্তিক জামানতের চূড়ান্ত সীমা</p>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/40 space-y-1">
          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">২. তহবিলে সংরক্ষিত</span>
          <div className="text-lg font-black text-amber-700 dark:text-amber-300">
            ৳ {collected.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400">নিরাপদে অ্যাকাউন্টে সঞ্চিত আছে</p>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-800/40 space-y-1">
          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">৩. মাসিক বেতন / খরচ রক্ষা</span>
          <div className="text-lg font-black text-emerald-700 dark:text-emerald-300">
            ৳ {livingAllowance.toLocaleString()} / মাস
          </div>
          <p className="text-[11px] text-slate-400">নির্ধারিত বেতনের অংশ সর্বদা আপনার হাতে</p>
        </div>
      </div>

      {/* Option A Current Month Split Ribbon */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-50 via-amber-50/20 to-emerald-50/20 dark:from-slate-850 dark:via-amber-950/15 dark:to-emerald-950/15 border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
          <FiTrendingUp className="w-4 h-4 text-amber-500" />
          <span>চলতি মাসের হিসাব ও বণ্টন (Option A):</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:gap-3 text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold shadow-2xs">
            মাসিক আয়: <strong>৳ {currentEarned.toLocaleString()}</strong>
          </div>
          <span className="text-slate-400 font-black">➔</span>
          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 font-bold shadow-2xs">
            হাতে পাচ্ছেন (খরচ): <strong>৳ {takeHome.toLocaleString()}</strong>
          </div>
          <span className="text-slate-400 font-black">➔</span>
          <div className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 font-bold shadow-2xs">
            জামানতে জমা: <strong>৳ {deducted.toLocaleString()}</strong>
          </div>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pt-1 border-t border-slate-200/60 dark:border-slate-800 flex items-start gap-1.5">
          <FiInfo className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
          {isFulfilled ? (
            <span className="text-emerald-700 dark:text-emerald-300 font-semibold">
              আপনার জামানতের লক্ষ্য ১০০% পূরণ হয়েছে। এখন থেকে আপনার সম্পূর্ণ উপার্জিত টাকা আপনি প্রতি মাসে কোনো কর্তন ছাড়াই উত্তোলন করতে পারবেন।
            </span>
          ) : (
            <span>
              বেঁচে থাকার ন্যূনতম খরচ (৳ {livingAllowance.toLocaleString()}) সর্বদা আপনার হাতে সুরক্ষিত রাখা হচ্ছে। এর অতিরিক্ত আয় সরাসরি জামানত তহবিলে জমা হচ্ছে। লক্ষ্যমাত্রা ৳ {target.toLocaleString()} পূর্ণ হওয়া মাত্রই আপনি সম্পূর্ণ বেতন তোলার সুবিধা পাবেন।
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

