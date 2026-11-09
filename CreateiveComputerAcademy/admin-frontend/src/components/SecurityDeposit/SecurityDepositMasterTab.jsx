import React, { useState } from 'react';
import {
  FiShield,
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
  FiSearch,
  FiRefreshCw,
  FiTrendingUp,
  FiDollarSign,
  FiArrowRight,
  FiFileText,
  FiUser
} from 'react-icons/fi';
import { FaCoins } from 'react-icons/fa6';

/**
 * SecurityDepositMasterTab
 * Master Overview table and KPI dashboard for all Staff Security Deposits.
 * Answers:
 * - কার কত দেওয়ার কথা (Target Amount)
 * - কে কত দিছে (Collected Amount)
 * - কত রইছে (Remaining Amount)
 * - কোন ডেটে কত (Date-wise breakdown & Last Deposit Date)
 */
export default function SecurityDepositMasterTab({
  depositsList = [],
  metrics = null,
  loading = false,
  onRefresh,
  onManageUser,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'FULFILLED' | 'EXEMPT'

  const filteredList = depositsList.filter((item) => {
    const matchesSearch =
      item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.designation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.department_name?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'ACTIVE') return item.has_deposit && !item.is_fulfilled && item.status === 'active';
    if (statusFilter === 'FULFILLED') return item.is_fulfilled || item.status === 'fulfilled';
    if (statusFilter === 'EXEMPT') return !item.has_deposit || item.status === 'exempt';

    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 4 Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {/* Card 1: Total Target Committed */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <FaCoins className="w-3.5 h-3.5 text-amber-500" /> ১. দেওয়ার কথা (মোট লক্ষ্যমাত্রা)
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            ৳ {Number(metrics?.total_target || 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            চুক্তিবদ্ধ সকল স্টাফের সম্মিলিত চূড়ান্ত লক্ষ্যমাত্রা
          </p>
        </div>

        {/* Card 2: Total Collected in Vault */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-amber-200/80 dark:border-amber-800/40 shadow-sm space-y-2 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <FiShield className="w-3.5 h-3.5 text-amber-500" /> ২. সংগৃহীত জামানত (কে কত দিছে)
            </span>
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
            ৳ {Number(metrics?.total_collected || 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            নিরাপদে জামানত তহবিলে জমা রয়েছে
          </p>
        </div>

        {/* Card 3: Total Remaining Due */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-emerald-200/80 dark:border-emerald-800/40 shadow-sm space-y-2 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <FiTrendingUp className="w-3.5 h-3.5 text-emerald-500" /> ৩. মোট বাকি (কত রইছে)
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
            ৳ {Number(metrics?.total_remaining || 0).toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            মাসিক উদ্বৃত্ত আয় ও অফলাইন জমা থেকে আদায় হবে
          </p>
        </div>

        {/* Card 4: Staff Status Distribution */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-indigo-200/80 dark:border-indigo-800/40 shadow-sm space-y-2 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
              <FiCheckCircle className="w-3.5 h-3.5 text-indigo-500" /> ৪. স্টাফ অগ্রগতি অনুপাত
            </span>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span className="text-amber-600 dark:text-amber-400">{metrics?.active_count || 0} চলমান</span>
            <span className="text-slate-300 dark:text-slate-700">&bull;</span>
            <span className="text-emerald-600 dark:text-emerald-400">{metrics?.fulfilled_count || 0} সম্পূর্ণ</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            মোট স্টাফ: {metrics?.total_staff || depositsList.length} জন ({metrics?.exempt_count || 0} ফুল বেতন)
          </p>
        </div>
      </div>

      {/* Control Bar: Search & Status Filter Pills */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 md:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        {/* Search */}
        <div className="relative w-full lg:w-96">
          <FiSearch className="absolute left-4 top-3.5 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="স্টাফের নাম, পদবি বা বিভাগ খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-2xl text-xs md:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-medium"
          />
        </div>

        {/* Filter Pills & Refresh */}
        <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto justify-end">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            সবাই ({depositsList.length})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('ACTIVE')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              statusFilter === 'ACTIVE'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100'
            }`}
          >
            🟡 জামানত চলমান ({metrics?.active_count || 0})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('FULFILLED')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              statusFilter === 'FULFILLED'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
            }`}
          >
            🔵 সম্পন্ন ({metrics?.fulfilled_count || 0})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('EXEMPT')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              statusFilter === 'EXEMPT'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100'
            }`}
          >
            🟢 ফুল বেতন ({metrics?.exempt_count || 0})
          </button>

          <button
            type="button"
            onClick={onRefresh}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition cursor-pointer border border-slate-200 dark:border-slate-700 ml-1"
            title="রিফ্রেশ করুন"
          >
            <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Master Security Deposit Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading && depositsList.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
            <FiRefreshCw className="w-5 h-5 animate-spin text-amber-500" />
            <span>জামানত তথ্য লোড হচ্ছে...</span>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <FiShield className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">কোনো রেকর্ড পাওয়া যায়নি</p>
            <p className="text-xs text-slate-400">ফিল্টার বা সার্চ কিওয়ার্ড পরিবর্তন করে দেখুন।</p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="p-4 md:p-5">স্টাফের বিবরণ</th>
                  <th className="p-4 md:p-5">মূল বেতন (মাসিক খরচ)</th>
                  <th className="p-4 md:p-5 text-right">দেওয়ার কথা (Target)</th>
                  <th className="p-4 md:p-5 text-right">কে কত দিছে (Paid)</th>
                  <th className="p-4 md:p-5 text-right">কত রইছে (Due)</th>
                  <th className="p-4 md:p-5 text-center min-w-[130px]">প্রগ্রেস %</th>
                  <th className="p-4 md:p-5">সর্বশেষ জমার তারিখ</th>
                  <th className="p-4 md:p-5 text-center">স্ট্যাটাস</th>
                  <th className="p-4 md:p-5 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredList.map((item) => {
                  const target = item.target_amount || 0;
                  const collected = item.collected_amount || 0;
                  const remaining = item.remaining_amount || 0;
                  const progress = item.progress_percent || 0;
                  const lastDate = item.last_deposit_date ? item.last_deposit_date.split(' ')[0] : (item.initial_offline_deposit > 0 ? 'প্রারম্ভিক জমা' : '—');

                  return (
                    <tr
                      key={item.user_id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors duration-150"
                    >
                      {/* Staff Info */}
                      <td className="p-4 md:p-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-700 dark:text-amber-300 font-black flex items-center justify-center text-sm border border-amber-300/40 shrink-0">
                            {item.name ? item.name.charAt(0).toUpperCase() : <FiUser />}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white text-sm">
                              {item.name}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              {item.designation} &bull; {item.department_name}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Base Salary */}
                      <td className="p-4 md:p-5 whitespace-nowrap">
                        <div className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                          ৳ {item.monthly_salary ? Number(item.monthly_salary).toLocaleString() : '—'}
                        </div>
                        <span className="text-[10px] text-slate-400">চুক্তিবদ্ধ বেতন</span>
                      </td>

                      {/* Target (দেওয়ার কথা) */}
                      <td className="p-4 md:p-5 text-right whitespace-nowrap">
                        {item.has_deposit ? (
                          <div className="font-black text-slate-900 dark:text-white text-sm">
                            ৳ {Number(target).toLocaleString()}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                        <span className="text-[10px] text-slate-400">লক্ষ্যমাত্রা</span>
                      </td>

                      {/* Collected (কে কত দিছে) */}
                      <td className="p-4 md:p-5 text-right whitespace-nowrap">
                        {item.has_deposit ? (
                          <div className="font-black text-amber-600 dark:text-amber-400 text-sm">
                            ৳ {Number(collected).toLocaleString()}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                        <span className="text-[10px] text-slate-400">জমা হয়েছে</span>
                      </td>

                      {/* Remaining (কত রইছে) */}
                      <td className="p-4 md:p-5 text-right whitespace-nowrap">
                        {item.has_deposit ? (
                          <div className={`font-black text-sm ${remaining <= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>
                            ৳ {Number(remaining).toLocaleString()}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                        <span className="text-[10px] text-slate-400">{remaining <= 0 ? 'পরিশোধিত' : 'অবশিষ্ট বাকি'}</span>
                      </td>

                      {/* Progress % */}
                      <td className="p-4 md:p-5 text-center">
                        {item.has_deposit ? (
                          <div className="space-y-1 max-w-[120px] mx-auto">
                            <div className="flex items-center justify-between text-[11px] font-bold">
                              <span className={item.is_fulfilled ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
                                {progress}%
                              </span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  item.is_fulfilled ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-500 to-orange-500'
                                }`}
                                style={{ width: `${Math.min(100, Math.max(4, progress))}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">প্রযোজ্য নয়</span>
                        )}
                      </td>

                      {/* Last Deposit Date */}
                      <td className="p-4 md:p-5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                          <FiClock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{lastDate}</span>
                        </div>
                        {item.ledger_entries_count > 0 && (
                          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold block">
                            {item.ledger_entries_count} টি কিস্তি/জমা লগ
                          </span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="p-4 md:p-5 text-center whitespace-nowrap">
                        {!item.has_deposit || item.status === 'exempt' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 inline-flex items-center gap-1">
                            <span>🟢 ফুল বেতন</span>
                          </span>
                        ) : item.is_fulfilled || item.status === 'fulfilled' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 inline-flex items-center gap-1">
                            <FiCheckCircle className="w-3 h-3" />
                            <span>🔵 ১০০% সম্পন্ন</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 inline-flex items-center gap-1">
                            <FiShield className="w-3 h-3 text-amber-600" />
                            <span>🟡 জামানত চলমান</span>
                          </span>
                        )}
                      </td>

                      {/* Action Button */}
                      <td className="p-4 md:p-5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onManageUser(item)}
                          className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <FiFileText className="w-3.5 h-3.5" />
                          <span>📜 খতিয়ান ও পরিচালনা</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

