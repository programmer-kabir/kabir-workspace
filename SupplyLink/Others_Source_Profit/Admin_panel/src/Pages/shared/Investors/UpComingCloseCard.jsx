import React, { useMemo, useState } from "react";
import useInvestmentCards from "../../../utils/Investors/useInvestmentCards";
import { Link } from "react-router-dom";
import { MONTHS } from "../../../../public/month";
import useProfitAnalytics from "../../../utils/Hooks/useProfitAnalytics";
import Loader from "../../../components/Loader/Loader";
import useUsers from "../../../utils/Hooks/useUsers";
import BackButton from "../../../components/BackButton/BackButton";
import { 
  FiCalendar, 
  FiClock, 
  FiCreditCard, 
  FiPhone, 
  FiLayers, 
  FiGrid, 
  FiList, 
  FiAlertCircle, 
  FiTrendingUp,
  FiUser
} from "react-icons/fi";
import { FaMoneyBillWave, FaCoins, FaCheckCircle } from "react-icons/fa";

export default function UpComingCloseCard() {
  const { investmentCards, isInvestmentCardsLoading, isInvestmentCardsError } = useInvestmentCards();
  const { users } = useUsers();
  const { isProfitAnalyticsLoading, profitAnalytics, isUProfitAnalyticsError } = useProfitAnalytics();
  
  const [amountType, setAmountType] = useState("main"); // main | profit | both
  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [viewMode, setViewMode] = useState("report"); // card | report

  /* Dynamic Years */
  const years = [];
  for (let y = 2025; y <= currentYear + 1; y++) {
    years.push(y);
  }

  /* Profit Map (FAST LOOKUP) */
  const profitMap = useMemo(() => {
    const map = {};
    profitAnalytics?.forEach((p) => {
      const id = p.card_id;
      if (!map[id]) map[id] = 0;
      map[id] += Number(p.profit_amount || 0);
    });
    return map;
  }, [profitAnalytics]);

  /* User Map */
  const userMap = useMemo(() => {
    const map = {};
    users?.forEach((user) => {
      map[user.id] = user;
    });
    return map;
  }, [users]);

  /* Filter Cards with upcoming maturity */
  const upcomingMaturity = useMemo(() => {
    if (!investmentCards) return [];

    return investmentCards.filter((card) => {
      if (!card.maturity_date) return false;
      const maturity = new Date(card.maturity_date);

      return (
        maturity.getMonth() === selectedMonth &&
        maturity.getFullYear() === selectedYear &&
        card.status?.toLowerCase() !== "closed" &&
        !card.end_date
      );
    });
  }, [investmentCards, selectedMonth, selectedYear]);

  /* Total Amount based on amountType */
  const totalAmount = useMemo(() => {
    return upcomingMaturity.reduce((sum, card) => {
      const profit = profitMap[card.id] || 0;
      let amount = Number(card.investment_amount || 0);

      if (amountType === "profit") amount = profit;
      if (amountType === "both") amount = amount + profit;

      return sum + amount;
    }, 0);
  }, [upcomingMaturity, amountType, profitMap]);

  /* Remaining Days */
  const getRemainingDays = (date) => {
    const diff = new Date(date) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const totals = useMemo(() => {
    let main = 0;
    let profit = 0;

    upcomingMaturity.forEach((card) => {
      const m = Number(card.investment_amount || 0);
      const p = profitMap[card.id] || 0;
      main += m;
      profit += p;
    });

    return {
      main,
      profit,
      grand: main + profit,
    };
  }, [upcomingMaturity, profitMap]);

  if (isInvestmentCardsLoading || isProfitAnalyticsLoading) {
    return (
      <div className="flex flex-col min-h-[60vh] items-center justify-center gap-3">
        <Loader />
        <p className="text-xs text-slate-400 font-medium">আসন্ন মেয়াদের কার্ড লোড হচ্ছে...</p>
      </div>
    );
  }

  if (isInvestmentCardsError || isUProfitAnalyticsError) {
    return (
      <div className="p-8 mx-auto max-w-lg my-12 rounded-2xl border border-rose-500/20 bg-rose-500/5 text-center">
        <p className="text-sm font-bold text-rose-300">ডাটা লোড করতে সমস্যা হয়েছে</p>
        <p className="text-xs text-slate-400 mt-1">অনুগ্রহ করে পেজটি রিফ্রেশ করুন</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1600px] p-4 sm:p-6 space-y-6 text-slate-200">
      <BackButton />

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-rose-600 text-white shadow-lg shadow-amber-500/25">
              <FiClock className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide">
                আসন্ন মেয়াদোত্তীর্ণ কার্ড (Upcoming Close Cards)
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                যে সকল ইনভেস্টমেন্ট কার্ডের মেয়াদ এই মাসে পূর্ণ হতে চলেছে এবং উইথড্র/ক্লোজিং প্রস্তুত
              </p>
            </div>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 p-1 rounded-xl bg-black/40 border border-white/10 self-start lg:self-auto">
          <button
            onClick={() => setViewMode("report")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              viewMode === "report" ? "bg-cyan-600 text-white shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            <FiList className="h-3.5 w-3.5" />
            <span>রিপোর্ট ভিউ (Report Table)</span>
          </button>
          <button
            onClick={() => setViewMode("card")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              viewMode === "card" ? "bg-cyan-600 text-white shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            <FiGrid className="h-3.5 w-3.5" />
            <span>গ্রিড ভিউ (Card Grid)</span>
          </button>
        </div>
      </div>

      {/* 3 Executive Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Total Main */}
        <div className="p-4.5 rounded-2xl border border-white/10 bg-gradient-to-br from-[#0c1424] to-[#101b30] shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>মোট মূল টাকা (Main Amount)</span>
            <FaMoneyBillWave className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-white mt-2">
            ৳{totals.main.toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            আসন্ন মোট {upcomingMaturity.length} টি কার্ডের মূল বিনিয়োগ
          </div>
        </div>

        {/* Total Profit */}
        <div className="p-4.5 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-[#1c1409] to-[#2b1f0c] shadow-lg">
          <div className="flex items-center justify-between text-xs text-amber-400 font-semibold">
            <span>মোট সঞ্চিত মুনাফা (Generated Profit)</span>
            <FaCoins className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-amber-300 mt-2">
            ৳{totals.profit.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            বিনিয়োগকারীদের প্রদেয় লভ্যাংশ
          </div>
        </div>

        {/* Grand Total */}
        <div className="p-4.5 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-[#081a15] to-[#0e2e22] shadow-lg">
          <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold">
            <span>সর্বমোট প্রদেয় (Grand Total)</span>
            <FiTrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-300 mt-2">
            ৳{totals.grand.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            মূল বিনিয়োগ + সঞ্চিত মুনাফা
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-[#0d162a] via-[#0b1325] to-[#090f1d] border border-white/[0.08] shadow-lg flex flex-wrap items-center justify-between gap-3">
        {/* Month & Year Selectors */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="rounded-xl bg-black/40 border border-white/10 px-3.5 py-2 text-xs sm:text-sm text-white outline-none focus:border-cyan-400/50 cursor-pointer"
          >
            {MONTHS.map((month) => (
              <option key={month.value} value={month.value} className="bg-[#0b1322]">
                {month.label}
              </option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="rounded-xl bg-black/40 border border-white/10 px-3.5 py-2 text-xs sm:text-sm text-white outline-none focus:border-cyan-400/50 cursor-pointer"
          >
            {years.map((year) => (
              <option key={year} value={year} className="bg-[#0b1322]">
                {year}
              </option>
            ))}
          </select>
        </div>

        {/* Amount Type Display Selector */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400">প্রদর্শন ধরণ:</span>
          <select
            value={amountType}
            onChange={(e) => setAmountType(e.target.value)}
            className="rounded-xl bg-black/40 border border-white/10 px-3.5 py-2 text-xs sm:text-sm text-white outline-none focus:border-cyan-400/50 cursor-pointer"
          >
            <option value="main" className="bg-[#0b1322]">শুধু মূল টাকা (Main Amount)</option>
            <option value="profit" className="bg-[#0b1322]">শুধু মুনাফা (Profit Only)</option>
            <option value="both" className="bg-[#0b1322]">মূল টাকা + মুনাফা (Both)</option>
          </select>
        </div>
      </div>

      {/* Content: Card Grid View */}
      {viewMode === "card" && (
        <>
          {upcomingMaturity.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-white/[0.06] bg-white/[0.01] text-center">
              <FiCalendar className="h-10 w-10 text-slate-600 mb-2" />
              <h3 className="text-sm font-bold text-slate-300">নির্বাচিত মাসে কোনো মেয়াদোত্তীর্ণ কার্ড নেই</h3>
              <p className="text-xs text-slate-500 mt-1">অন্য মাস বা বছর নির্বাচন করে চেক করুন</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingMaturity.map((card) => {
                const days = getRemainingDays(card.maturity_date);
                const isUrgent = days <= 5;
                const isWarning = days <= 10;

                const progress = Math.max(0, Math.min(100, ((30 - days) / 30) * 100));

                const profit = profitMap[card.id] || 0;
                let displayAmount = Number(card.investment_amount || 0);
                if (amountType === "profit") displayAmount = profit;
                if (amountType === "both") displayAmount = displayAmount + profit;

                return (
                  <Link
                    key={card.id}
                    to={`/investors/details?user_id=${card.investor_id}`}
                    className="group rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#0c162b]/90 via-[#0a1222]/90 to-[#070c18]/95 p-5 hover:border-cyan-500/40 hover:shadow-xl hover:shadow-cyan-950/30 transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Bar */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="min-w-0">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white/[0.05] text-cyan-300 border border-white/10">
                            কার্ড #{card.id}
                          </span>
                          <h3 className="text-sm font-bold text-white truncate mt-1 group-hover:text-cyan-300 transition-colors">
                            {card.card_name}
                          </h3>
                        </div>

                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-bold border ${
                            isUrgent
                              ? "bg-rose-500/20 text-rose-300 border-rose-500/30 animate-pulse"
                              : isWarning
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                              : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                          }`}
                        >
                          {days > 0 ? `${days} দিন বাকি` : "মেয়াদ পূর্ণ"}
                        </span>
                      </div>

                      {/* Phone & Maturity */}
                      <div className="space-y-1 text-xs text-slate-400 mb-4">
                        <div className="flex items-center gap-1.5">
                          <FiCalendar className="text-slate-500 h-3.5 w-3.5" />
                          <span>মেয়াদ উত্তীর্ণ: <strong className="font-mono text-slate-200">{card.maturity_date}</strong></span>
                        </div>
                        {userMap[card.investor_id]?.mobile && (
                          <div className="flex items-center gap-1.5">
                            <FiPhone className="text-cyan-400 h-3.5 w-3.5" />
                            <span className="font-mono text-slate-300">{userMap[card.investor_id]?.mobile}</span>
                          </div>
                        )}
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-black/40 rounded-full h-2 overflow-hidden border border-white/5 mb-4">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isUrgent ? "bg-gradient-to-r from-orange-500 to-rose-500" : "bg-gradient-to-r from-cyan-500 to-emerald-500"
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Amount Chip */}
                    <div className="flex items-center justify-between pt-3 border-t border-white/[0.06] text-xs">
                      <span className="text-slate-400">প্রদেয় পরিমাণ:</span>
                      <span className="font-mono font-bold text-emerald-400 text-sm">
                        ৳{displayAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Content: Report Table View */}
      {viewMode === "report" && (
        <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#0c162b]/95 to-[#070d19]/95 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="border-b border-white/[0.08] bg-black/40 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 text-center w-12">#</th>
                  <th className="py-3 px-4">কার্ডের নাম</th>
                  <th className="py-3 px-4">কার্ড আইডি</th>
                  <th className="py-3 px-4">মোবাইল নম্বর</th>
                  <th className="py-3 px-4 text-right">মূল টাকা (৳)</th>
                  <th className="py-3 px-4 text-right">মুনাফা (৳)</th>
                  <th className="py-3 px-4 text-right">সর্বমোট (৳)</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/[0.04]">
                {upcomingMaturity.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-400">
                      <FiCalendar className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                      <p className="font-semibold text-slate-300">নির্বাচিত মাসে কোনো মেয়াদোত্তীর্ণ কার্ড নেই</p>
                      <p className="text-xs text-slate-500 mt-0.5">অন্য কোনো মাস বা বছর নির্বাচন করে চেক করুন</p>
                    </td>
                  </tr>
                ) : (
                  upcomingMaturity.map((card, index) => {
                    const main = Number(card.investment_amount || 0);
                    const profit = profitMap[card.id] || 0;
                    const phone = userMap[card.investor_id]?.mobile;

                    return (
                      <tr key={card.id} className="hover:bg-white/[0.02] transition">
                        <td className="py-3.5 px-4 text-center font-mono text-slate-500">{index + 1}</td>
                        <td className="py-3.5 px-4 font-semibold text-white">
                          <Link
                            to={`/investors/details?user_id=${card.investor_id}`}
                            className="hover:text-cyan-300 transition"
                          >
                            {card.card_name}
                          </Link>
                        </td>
                        <td className="py-3.5 px-4 font-mono">
                          <span className="px-2 py-0.5 rounded bg-white/[0.05] border border-white/10 text-cyan-300 text-xs">
                            #{card.id}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-300">
                          {phone ? (
                            <a href={`tel:${phone}`} className="text-cyan-400 hover:underline flex items-center gap-1">
                              <FiPhone className="h-3 w-3" />
                              <span>{phone}</span>
                            </a>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-200">
                          ৳{main.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-amber-300">
                          ৳{profit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400 text-sm">
                          ৳{(main + profit).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              {/* Total Footer */}
              {upcomingMaturity.length > 0 && (
                <tfoot className="border-t-2 border-white/10 bg-black/60 font-bold">
                  <tr>
                    <td colSpan="4" className="py-3.5 px-4 text-right text-xs uppercase tracking-wider text-slate-300">
                      সর্বমোট যোগফল:
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-sm text-slate-200">
                      ৳{totals.main.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-sm text-amber-300">
                      ৳{totals.profit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-base font-extrabold text-emerald-300">
                      ৳{totals.grand.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
