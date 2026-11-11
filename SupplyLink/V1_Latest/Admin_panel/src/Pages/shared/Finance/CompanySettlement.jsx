import React, { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import { 
  Building2, 
  Wallet, 
  TrendingUp, 
  ShieldAlert, 
  CheckCircle2, 
  Printer, 
  Search, 
  Layers, 
  DollarSign, 
  Users, 
  Clock, 
  ArrowDownRight, 
  ArrowUpRight,
  PieChart,
  Scale,
  RefreshCw,
  FileSpreadsheet,
  AlertTriangle,
  BadgePercent,
  Sparkles,
  CreditCard,
  ArrowRightLeft,
  CheckCircle,
  HelpCircle,
  History,
  Info
} from "lucide-react";

const formatCurrency = (num) => {
  const n = Number(num || 0);
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const CompanySettlement = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("cards"); // 'cards' | 'company_cards' | 'expenses'

  const fetchSettlement = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_LOCALHOST_KEY || "http://localhost/supplylink/apis"}/settlement/get_company_settlement.php`,
        { withCredentials: true }
      );
      if (res.data?.success) {
        setData(res.data);
      } else {
        setError(res.data?.message || "ডাটা লোড করতে ব্যর্থ হয়েছে");
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || "সার্ভার এরর");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettlement();
  }, []);

  const summary = data?.summary || {};
  const invStages = summary.investor_stages || {};
  const compStages = summary.company_stages || {};
  const cardList = data?.card_breakdown || [];
  const companyCards = data?.company_cards || [];
  const expenseBreakdown = data?.expense_breakdown || [];

  // 100% Dynamic Decision Scenarios from Server Data
  const scenarios = summary.scenarios || {};
  const s1 = scenarios.scenario_1 || {
    expense_injected: summary.lifetime_expenses || 0,
    new_total_cash: (summary.net_cash || 0) + (summary.lifetime_expenses || 0),
    investor_claim: invStages.remaining?.total_claim || 0,
    company_claim: compStages.remaining?.total_claim || 0,
    admin_surplus_cash: ((summary.net_cash || 0) + (summary.lifetime_expenses || 0)) - ((invStages.remaining?.total_claim || 0) + (compStages.remaining?.total_claim || 0))
  };
  const s2 = scenarios.scenario_2 || {
    current_cash: summary.net_cash || 0,
    investor_claim: invStages.remaining?.total_claim || 0,
    admin_remaining_cash: summary.cash_surplus_after_all_claims || 0,
    company_claims_on_paper: compStages.remaining?.total_claim || 0,
    expense_covered_by_company: summary.lifetime_expenses || 0
  };

  // Filtered Cards (শুধুমাত্র যাদের টাকা বকেয়া বা ব্যালেন্স বাকি আছে, ব্যালেন্স ০ বাদে)
  const filteredCards = useMemo(() => {
    const activeCards = cardList.filter((c) => Number(c.total_balance || 0) > 0.001);

    if (!searchTerm.trim()) return activeCards;
    const term = searchTerm.toLowerCase();
    return activeCards.filter((c) =>
      c.card_name?.toLowerCase().includes(term) ||
      c.investor_name?.toLowerCase().includes(term) ||
      c.investor_mobile?.toLowerCase().includes(term) ||
      c.card_id?.toString().includes(term) ||
      c.investor_id?.toString().includes(term)
    );
  }, [cardList, searchTerm]);

  // Dynamic Total Sum of Filtered Cards Table
  const cardTableTotals = useMemo(() => {
    return filteredCards.reduce(
      (acc, c) => {
        acc.count += 1;
        acc.capital += Number(c.capital || 0);
        acc.profit += Number(c.total_all_time_profit || 0);
        acc.withdrawn += Number(c.total_withdrawn || 0);
        acc.unwithdrawn += Number(c.unwithdrawn_profit || 0);
        acc.balance += Number(c.total_balance || 0);
        return acc;
      },
      { count: 0, capital: 0, profit: 0, withdrawn: 0, unwithdrawn: 0, balance: 0 }
    );
  }, [filteredCards]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center space-y-4 text-slate-400">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-sm font-medium animate-pulse text-slate-300">
          ইনভেস্টর ও কোম্পানি কার্ডের ৩-ধাপের হিসাব লোড হচ্ছে...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-2xl mx-auto my-12 p-6 card-surface border-rose-500/30 bg-rose-500/[0.04] rounded-2xl text-center space-y-3">
        <ShieldAlert className="w-10 h-10 text-rose-400 mx-auto" />
        <h3 className="text-base font-bold text-rose-300">হিসাব লোড করতে সমস্যা হয়েছে</h3>
        <p className="text-xs text-rose-400/90">{error}</p>
        <button
          onClick={fetchSettlement}
          className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-500 transition shadow-lg shadow-rose-600/30"
        >
          পুনরায় চেষ্টা করুন
        </button>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto px-4 py-6 space-y-7 text-slate-100 print:p-0 print:m-0 print:max-w-full print:text-black">
      {/* 🧭 Top Header (Dark Theme) */}
      <div className="card-surface p-5 sm:p-6 rounded-2xl border border-white/[0.08] bg-[#0d162b] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl shrink-0">
            <Scale className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                ইনভেস্টর বনাম কোম্পানি ৩-ধাপের হিসাব বিবরণী
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                স্বতন্ত্র অডিট
              </span>
            </div>
            <p className="text-xs md:text-sm text-slate-400 mt-0.5">
              ১. সর্বমোট ইতিহাস → ২. উত্তোলিত পরিশোধ → ৩. বর্তমানে অবশিষ্ট পাওনা
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchSettlement}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 text-xs font-semibold rounded-xl border border-white/[0.08] transition shadow-sm"
          >
            <RefreshCw className="w-4 h-4 text-slate-300" />
            <span>রিফ্রেশ</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition"
          >
            <Printer className="w-4 h-4" />
            <span>প্রিন্ট রিপোর্ট</span>
          </button>
        </div>
      </div>

      {/* 🖨️ Printable Header */}
      <div className="hidden print:block text-center border-b pb-4 mb-4 text-black">
        <h1 className="text-2xl font-bold">SupplyLink Bangladesh Limited</h1>
        <p className="text-sm text-gray-700">3-Stage Investor & Company Financial Audit Statement</p>
        <p className="text-xs text-gray-600">Generated: {new Date().toLocaleDateString('bn-BD')}</p>
      </div>

      {/* =========================================================================
          SECTION 1: সাধারণ ইনভেস্টরদের ৩টি পর্যায় (৩টি কার্ড)
          ========================================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg">
              <Users className="w-4 h-4" />
            </span>
            <h2 className="text-sm md:text-base font-bold text-white uppercase tracking-wider">
              সাধারণ ইনভেস্টরদের হিসাব (কোম্পানির ৩টি কার্ড বাদে)
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            সর্বমোট {invStages.all_time?.cards || 0}টি কার্ডের পূর্ণাঙ্গ ৩-ধাপের গতিধারা
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* STAGE 1: ALL-TIME TOTAL */}
          <div className="card-surface p-5 rounded-2xl border border-blue-500/30 bg-gradient-to-br from-[#0d162b] via-[#0f1d3d] to-[#0a1226] shadow-lg flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between border-b border-blue-500/20 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
                  <History className="w-4 h-4" />
                </span>
                <h3 className="text-xs font-bold text-blue-300 uppercase tracking-wider">
                  ১. সর্বমোট ইতিহাস (All-Time)
                </h3>
              </div>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-200">
                {invStages.all_time?.cards || 0} টি কার্ড
              </span>
            </div>

            <div className="space-y-3">
              <div className="bg-slate-900/60 p-3 rounded-xl border border-white/[0.06]">
                <p className="text-[11px] text-slate-400 uppercase font-medium">মোট আসল মূলধন</p>
                <p className="text-xl lg:text-2xl font-black font-mono text-white">
                  ৳{formatCurrency(invStages.all_time?.capital)}
                </p>
                <p className="text-[10px] text-slate-400">{invStages.all_time?.count || 0} জন ইনভেস্টরের দেওয়া মূলধন</p>
              </div>

              <div className="bg-slate-900/60 p-3 rounded-xl border border-white/[0.06]">
                <p className="text-[11px] text-slate-400 uppercase font-medium">মোট অর্জিত লাভ (Profit)</p>
                <p className="text-xl lg:text-2xl font-black font-mono text-emerald-400">
                  ৳{formatCurrency(invStages.all_time?.profit)}
                </p>
                <p className="text-[10px] text-slate-400">লাইফটাইম সর্বমোট মুনাফা</p>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 text-center pt-1 border-t border-white/[0.05]">
              শুরু থেকে আজ পর্যন্ত ইনভেস্টরদের মোট অবদান
            </p>
          </div>

          {/* STAGE 2: ALREADY WITHDRAWN / PAID OUT */}
          <div className="card-surface p-5 rounded-2xl border border-rose-500/30 bg-gradient-to-br from-[#0d162b] via-[#24101d] to-[#0a1226] shadow-lg flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between border-b border-rose-500/20 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-rose-500/10 text-rose-400 rounded-lg border border-rose-500/20">
                  <CheckCircle className="w-4 h-4" />
                </span>
                <h3 className="text-xs font-bold text-rose-300 uppercase tracking-wider">
                  ২. ইতোমধ্যে উত্তোলিত (পরিশোধিত)
                </h3>
              </div>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-200">
                {invStages.withdrawn?.cards || 0} টি ক্লোজড
              </span>
            </div>

            <div className="space-y-3">
              <div className="bg-slate-900/60 p-3 rounded-xl border border-white/[0.06]">
                <p className="text-[11px] text-slate-400 uppercase font-medium">উত্তোলিত মূলধন (আসল)</p>
                <p className="text-xl lg:text-2xl font-black font-mono text-rose-300">
                  ৳{formatCurrency(invStages.withdrawn?.capital)}
                </p>
                <p className="text-[10px] text-slate-400">{invStages.withdrawn?.cards || 0}টি সমাপ্ত কার্ডের আসল ফেরত</p>
              </div>

              <div className="bg-slate-900/60 p-3 rounded-xl border border-white/[0.06]">
                <p className="text-[11px] text-slate-400 uppercase font-medium">উত্তোলিত লাভ (Profit)</p>
                <p className="text-xl lg:text-2xl font-black font-mono text-rose-400">
                  ৳{formatCurrency(invStages.withdrawn?.profit)}
                </p>
                <p className="text-[10px] text-slate-400">ক্যাশ তুলে নেওয়া হয়েছে</p>
              </div>
            </div>

            <div className="pt-2 border-t border-rose-500/20 text-xs font-bold flex justify-between items-center text-rose-200">
              <span>মোট ফেরত সম্পন্ন:</span>
              <span className="font-mono text-rose-300">৳{formatCurrency(invStages.withdrawn?.total_withdrawn)}</span>
            </div>
          </div>

          {/* STAGE 3: CURRENTLY REMAINING / ACTIVE CLAIMS */}
          <div className="card-surface p-5 rounded-2xl border border-emerald-500/35 bg-gradient-to-br from-[#0d162b] via-[#0b241e] to-[#0a1226] shadow-xl flex flex-col justify-between space-y-4 ring-1 ring-emerald-500/30">
            <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
                  <Sparkles className="w-4 h-4" />
                </span>
                <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                  ৩. বর্তমানে অবশিষ্ট (রানিং পাওনা)
                </h3>
              </div>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200">
                {invStages.remaining?.cards || 0} টি রানিং
              </span>
            </div>

            <div className="space-y-3">
              <div className="bg-slate-900/60 p-3 rounded-xl border border-white/[0.06]">
                <p className="text-[11px] text-slate-400 uppercase font-medium">বাকি থাকা মূলধন (আসল)</p>
                <p className="text-xl lg:text-2xl font-black font-mono text-white">
                  ৳{formatCurrency(invStages.remaining?.capital)}
                </p>
                <p className="text-[10px] text-emerald-400 font-medium">{invStages.remaining?.count || 0} জন ইনভেস্টরের বকেয়া আসল</p>
              </div>

              <div className="bg-slate-900/60 p-3 rounded-xl border border-white/[0.06]">
                <p className="text-[11px] text-slate-400 uppercase font-medium">বাকি থাকা নিট লাভ</p>
                <p className="text-xl lg:text-2xl font-black font-mono text-emerald-400">
                  ৳{formatCurrency(invStages.remaining?.profit)}
                </p>
                <p className="text-[10px] text-slate-400">সক্রিয় রানিং কার্ডের বকেয়া লাভ</p>
              </div>
            </div>

            <div className="pt-2.5 pb-1 px-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs font-bold flex justify-between items-center text-emerald-200">
              <span>মোট বর্তমান দায় (আসল + লাভ):</span>
              <span className="font-mono text-base text-emerald-300">
                ৳{formatCurrency(invStages.remaining?.total_claim)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 2: কোম্পানির নিজস্ব ৩টি কার্ড (কার্ড ১, ২, ৩)
          ========================================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-lg">
              <Building2 className="w-4 h-4" />
            </span>
            <h2 className="text-sm md:text-base font-bold text-white uppercase tracking-wider">
              কোম্পানির নিজস্ব অংশ (কার্ড ১, ২ ও ৩ - সাপ্লাইলিঙ্ক)
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            মেয়াদপূর্ব মুনাফা, অংশীদারি মুনাফা ও বিনিয়োগ হিসাব
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* COMPANY STAGE 1: ALL-TIME */}
          <div className="card-surface p-5 rounded-2xl border border-purple-500/30 bg-gradient-to-br from-[#0d162b] via-[#1f1035] to-[#0a1226] shadow-lg flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
              <h3 className="text-xs font-bold text-purple-300 uppercase tracking-wider">
                ১. কোম্পানির সর্বমোট বিনিয়োগ ও লাভ
              </h3>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-200">
                ৩ টি কার্ড
              </span>
            </div>

            <div className="space-y-3">
              <div className="bg-slate-900/60 p-3 rounded-xl border border-white/[0.06]">
                <p className="text-[11px] text-slate-400 uppercase font-medium">কোম্পানির মোট বিনিয়োগ</p>
                <p className="text-xl lg:text-2xl font-black font-mono text-white">
                  ৳{formatCurrency(compStages.all_time?.capital)}
                </p>
                <p className="text-[10px] text-purple-400 font-medium">কার্ড ১ (মেয়াদপূর্ব মুনাফা হিসাব)</p>
              </div>

              <div className="bg-slate-900/60 p-3 rounded-xl border border-white/[0.06]">
                <p className="text-[11px] text-slate-400 uppercase font-medium">কোম্পানির মোট অর্জিত লাভ</p>
                <p className="text-xl lg:text-2xl font-black font-mono text-purple-300">
                  ৳{formatCurrency(compStages.all_time?.profit)}
                </p>
                <p className="text-[10px] text-slate-400">কার্ড ২ (অংশীদারি) ও ১ এর লাভ</p>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 text-center pt-1 border-t border-white/[0.05]">
              কোম্পানির নামে রক্ষিত নিজস্ব তহবিল
            </p>
          </div>

          {/* COMPANY STAGE 2: WITHDRAWN */}
          <div className="card-surface p-5 rounded-2xl border border-white/[0.08] bg-slate-900/60 shadow-lg flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                ২. ইতোমধ্যে উত্তোলিত (পরিশোধিত)
              </h3>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/[0.08] text-slate-300">
                ০ টি ক্লোজড
              </span>
            </div>

            <div className="space-y-3">
              <div className="bg-slate-950/60 p-3 rounded-xl border border-white/[0.04]">
                <p className="text-[11px] text-slate-400 uppercase font-medium">উত্তোলিত মূলধন (বিনিয়োগ)</p>
                <p className="text-xl lg:text-2xl font-black font-mono text-slate-400">
                  ৳{formatCurrency(compStages.withdrawn?.capital)}
                </p>
                <p className="text-[10px] text-slate-500">কোনো মূলধন তোলা হয়নি</p>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-white/[0.04]">
                <p className="text-[11px] text-slate-400 uppercase font-medium">উত্তোলিত লাভ</p>
                <p className="text-xl lg:text-2xl font-black font-mono text-slate-400">
                  ৳{formatCurrency(compStages.withdrawn?.profit)}
                </p>
                <p className="text-[10px] text-slate-500">লেজারে সংরক্ষিত রয়েছে</p>
              </div>
            </div>

            <div className="pt-2 border-t border-white/[0.06] text-xs font-bold flex justify-between items-center text-slate-400">
              <span>মোট উত্তোলন:</span>
              <span className="font-mono text-slate-300">৳0.00</span>
            </div>
          </div>

          {/* COMPANY STAGE 3: REMAINING */}
          <div className="card-surface p-5 rounded-2xl border border-purple-500/35 bg-gradient-to-br from-[#0d162b] via-[#1a0e2d] to-[#0a1226] shadow-xl flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
              <h3 className="text-xs font-bold text-purple-300 uppercase tracking-wider">
                ৩. বর্তমানে অবশিষ্ট (কোম্পানি ব্যালেন্স)
              </h3>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-200">
                ৩ টি রানিং
              </span>
            </div>

            <div className="space-y-3">
              <div className="bg-slate-900/60 p-3 rounded-xl border border-white/[0.06]">
                <p className="text-[11px] text-slate-400 uppercase font-medium">বাকি থাকা মূলধন</p>
                <p className="text-xl lg:text-2xl font-black font-mono text-white">
                  ৳{formatCurrency(compStages.remaining?.capital)}
                </p>
                <p className="text-[10px] text-purple-400 font-medium">কার্ড ১ এর অক্ষত মূলধন</p>
              </div>

              <div className="bg-slate-900/60 p-3 rounded-xl border border-white/[0.06]">
                <p className="text-[11px] text-slate-400 uppercase font-medium">বাকি থাকা নিট লাভ</p>
                <p className="text-xl lg:text-2xl font-black font-mono text-purple-300">
                  ৳{formatCurrency(compStages.remaining?.profit)}
                </p>
                <p className="text-[10px] text-slate-400">কার্ড ২ ও ১ এর জমে থাকা লাভ</p>
              </div>
            </div>

            <div className="pt-2.5 pb-1 px-3 rounded-xl bg-purple-500/15 border border-purple-500/30 text-xs font-bold flex justify-between items-center text-purple-200">
              <span>কোম্পানির মোট ব্যালেন্স:</span>
              <span className="font-mono text-base text-purple-300">
                ৳{formatCurrency(compStages.remaining?.total_claim)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 3: নগদ ক্যাশ ও দায় পরিশোধের কভারেজ ব্যানার
          ========================================================================= */}
      <div className="card-surface p-5 sm:p-6 rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-slate-900/90 to-emerald-950/30 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="inline-block px-3 py-0.5 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-[10px] font-bold uppercase tracking-wider text-emerald-300">
              ক্যাশ ও দায় পরিশোধ স্ট্যাটাস
            </span>
            <h3 className="text-lg md:text-xl font-bold text-white">
              হাতে থাকা মোট নগদ ক্যাশ: <span className="font-mono text-emerald-400 font-black">৳{formatCurrency(summary.net_cash)}</span>
            </h3>
            <p className="text-xs text-slate-300">
              ইনভেস্টরদের সর্বমোট পাওনা (আসল + বাকি লাভ): <span className="font-mono font-bold text-white">৳{formatCurrency(invStages.remaining?.total_claim)}</span>
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 bg-slate-900/80 p-3.5 rounded-xl border border-emerald-500/30">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
            <div>
              <p className="text-[11px] text-slate-400 font-medium">ইনভেস্টর পাওনা বাদে ক্যাশ উদ্বৃত্ত</p>
              <p className="text-xl font-black font-mono text-emerald-400">
                + ৳{formatCurrency(summary.cash_surplus_after_all_claims)}
              </p>
              <p className="text-[10px] text-emerald-300 font-semibold">১০০% ক্যাশ কভারেজ সুরক্ষিত</p>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 4: এক্সিকিউটিভ সিদ্ধান্ত ও সম্পূর্ণ ডাইনামিক অডিট রোডম্যাপ
          (১০০% সার্ভারের লাইভ ডাটা দিয়ে কম-বেশি ক্যালকুলেট হবে)
          ========================================================================= */}
      <div className="card-surface p-6 rounded-2xl border border-indigo-500/30 bg-[#0d162b] shadow-2xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
              <Scale className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-white">
                কোম্পানি ক্লোজিং ও আর্থিক সিদ্ধান্ত নির্দেশিকা (Executive Decision Guide)
              </h2>
              <p className="text-xs text-slate-400">
                অফিস খরচ কোম্পানি বহন করলে বনাম বর্তমান ক্যাশ দিয়ে চূড়ান্ত নিষ্পত্তি করলে কী ঘটবে
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 w-fit">
            ডাইনামিক অডিট গাইডলাইন
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* SCENARIO 1: কোম্পানি যদি নিজ থেকে অফিস খরচ ক্যাশে রিফান্ড করে */}
          <div className="p-5 rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/30 via-slate-900/60 to-[#0a1226] space-y-4">
            <div className="flex items-center justify-between border-b border-indigo-500/20 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse" />
                <h3 className="text-sm font-bold text-indigo-300">
                  পরিস্থিতি ১: কোম্পানি নিজ থেকে অফিস খরচ বহন করলে
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-200">
                +৳{formatCurrency(s1.expense_injected)} যুক্ত হবে
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              যদি কোম্পানি/মালিক বিগত মাসগুলোর অফিস পরিচালন ব্যয় (বেতন, ভাড়া ও বিল বাবদ মোট ৳{formatCurrency(s1.expense_injected)}) নিজ থেকে ক্যাশে রিফান্ড করে:
            </p>

            <div className="space-y-2 text-xs text-slate-300 bg-slate-950/60 p-3.5 rounded-xl border border-white/[0.05]">
              <div className="flex justify-between py-1">
                <span className="text-slate-400">• নতুন মোট ক্যাশ তহবিল:</span>
                <span className="font-bold font-mono text-white">৳{formatCurrency(s1.new_total_cash)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">• সাধারণ ইনভেস্টরদের পাওনা মিটিয়ে দিতে লাগবে:</span>
                <span className="font-semibold font-mono text-rose-400">- ৳{formatCurrency(s1.investor_claim)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">• কোম্পানির ৩টি কার্ডের সম্পূর্ণ বিনিয়োগ ও লাভ:</span>
                <span className="font-semibold font-mono text-purple-400">- ৳{formatCurrency(s1.company_claim)}</span>
              </div>
              <div className="flex justify-between py-1.5 px-2.5 bg-indigo-500/15 border border-indigo-500/30 rounded-lg font-bold text-indigo-200 mt-2">
                <span>সব পরিশোধের পর ক্যাশ উদ্বৃত্ত থাকবে:</span>
                <span className="font-mono text-emerald-400 text-sm">+ ৳{formatCurrency(s1.admin_surplus_cash)}</span>
              </div>
            </div>

            <div className="p-3 bg-emerald-500/[0.08] border border-emerald-500/20 rounded-xl text-xs space-y-1">
              <p className="font-bold text-emerald-300">💡 বাকি ৳{formatCurrency(s1.admin_surplus_cash)} টাকা কে নিবে?</p>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                ইনভেস্টর ও কোম্পানি কার্ডের সব টাকা পরিশোধের পর এই অতিরিক্ত ৳{formatCurrency(s1.admin_surplus_cash)} সম্পূর্ণ <strong>এডমিন / কোম্পানির মালিকের ব্যক্তিগত লাভ</strong> হিসেবে থাকবে। কারণ কাস্টমারদের পণ্যের আসল মুনাফা থেকে এটি অবণ্টিত রয়ে গিয়েছিল।
              </p>
            </div>
          </div>

          {/* SCENARIO 2: কোম্পানি যদি নিজ থেকে কোনো টাকা না দেয় (বর্তমান ক্যাশে ক্লোজ করলে) */}
          <div className="p-5 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-950/30 via-slate-900/60 to-[#0a1226] space-y-4">
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <h3 className="text-sm font-bold text-amber-300">
                  পরিস্থিতি ২: কোম্পানি বাড়তি টাকা না দিলে (বর্তমান ক্যাশে নিষ্পত্তি)
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-200">
                বর্তমান ক্যাশ ৳{formatCurrency(s2.current_cash)}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              যদি কোম্পানি নিজ থেকে কোনো বাড়তি টাকা না দেয় এবং বর্তমানে ক্যাশে থাকা ৳{formatCurrency(s2.current_cash)} দিয়েই সব ক্লোজ করে দেওয়া হয়:
            </p>

            <div className="space-y-2 text-xs text-slate-300 bg-slate-950/60 p-3.5 rounded-xl border border-white/[0.05]">
              <div className="flex justify-between py-1">
                <span className="text-slate-400">• বর্তমান মোট ক্যাশ তহবিল:</span>
                <span className="font-bold font-mono text-white">৳{formatCurrency(s2.current_cash)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">• সাধারণ ইনভেস্টরদের সম্পূর্ণ পাওনা (আসল + লাভ):</span>
                <span className="font-semibold font-mono text-rose-400">- ৳{formatCurrency(s2.investor_claim)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">• ইনভেস্টরদের পরিশোধের পর ক্যাশে অবশিষ্ট থাকে:</span>
                <span className="font-bold font-mono text-emerald-400">+ ৳{formatCurrency(s2.admin_remaining_cash)}</span>
              </div>
              <div className="flex justify-between py-1.5 px-2.5 bg-amber-500/15 border border-amber-500/30 rounded-lg font-bold text-amber-200 mt-2">
                <span>কোম্পানির পাওনা বাবদ ক্যাশ তুলে নেওয়া হবে:</span>
                <span className="font-mono text-amber-300 text-sm">৳{formatCurrency(s2.admin_remaining_cash)} (ক্যাশ উদ্বৃত্ত)</span>
              </div>
            </div>

            <div className="p-3 bg-amber-500/[0.08] border border-amber-500/20 rounded-xl text-xs space-y-1">
              <p className="font-bold text-amber-300">💡 কোম্পানির ৳{formatCurrency(s2.company_claims_on_paper)} টাকার কী হবে?</p>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                কোম্পানির নিজস্ব মূলধন ও লাভ (৳{formatCurrency(s2.company_claims_on_paper)}) দিয়ে মূলত অতীতে অফিসের বেতন, ভাড়া ও বিল (৳{formatCurrency(s2.expense_covered_by_company)}) পরিশোধ হয়ে গেছে। তাই সাধারণ ইনভেস্টরদের ১০০% পাওনা মিটিয়ে দিয়ে ক্যাশের অবশিষ্ট ৳{formatCurrency(s2.admin_remaining_cash)} এডমিন নিবে এবং কোম্পানি সম্পূর্ণ দায়মুক্তভাবে ক্লোজ হবে।
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 🧭 Sub-tab Switcher for Interactive Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-3 print:hidden">
        <div className="inline-flex items-center gap-1.5 bg-[#091022] p-1.5 rounded-xl border border-white/[0.08]">
          <button
            onClick={() => setActiveTab("cards")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === "cards"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            ১. ইনভেস্টমেন্ট কার্ডের তালিকা ({filteredCards.length}টি)
          </button>
          <button
            onClick={() => setActiveTab("company_cards")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === "company_cards"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            ২. কোম্পানির ৩টি কার্ড ({companyCards.length})
          </button>
          <button
            onClick={() => setActiveTab("expenses")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === "expenses"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            ৩. অফিস পরিচালন ব্যয় ({expenseBreakdown.length} খাত)
          </button>
        </div>

        {activeTab === "cards" && (
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="কার্ড আইডি, নাম বা মোবাইল দিয়ে খুঁজুন..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-slate-900/90 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none transition"
            />
          </div>
        )}
      </div>

      {/* TAB 1: CARD-WISE LIST (Excluding Company Cards 1, 2, 3) */}
      {activeTab === "cards" && (
        <div className="card-surface rounded-2xl border border-white/[0.08] bg-[#0d162b] shadow-xl overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/[0.02]">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-400" />
                বকেয়া ইনভেস্টমেন্ট কার্ড তালিকা (কার্ডভিত্তিক)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                যেসব কার্ডের পাওনা বাকি আছে শুধুমাত্র তাদের হিসাব (কার্ড ১, ২ ও ৩ বাদে)
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-full w-fit">
              মোট: {filteredCards.length} টি কার্ড
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-white/[0.03] text-slate-400 border-b border-white/[0.08] uppercase font-semibold text-[11px]">
                  <th className="py-3.5 px-3 text-center">ক্রঃ</th>
                  <th className="py-3.5 px-4">কার্ড আইডি ও নাম</th>
                  <th className="py-3.5 px-4">ইনভেস্টর (আইডি ও নাম)</th>
                  <th className="py-3.5 px-4">মোবাইল নম্বর</th>
                  <th className="py-3.5 px-4 text-right font-bold text-slate-200">কার্ডের আসল (মূলধন)</th>
                  <th className="py-3.5 px-4 text-right text-emerald-400 font-bold">মোট অর্জিত লাভ</th>
                  <th className="py-3.5 px-4 text-right text-rose-400">উত্তোলিত লাভ</th>
                  <th className="py-3.5 px-4 text-right text-blue-300 font-bold">বাকি লাভ</th>
                  <th className="py-3.5 px-4 text-right text-indigo-300 font-black bg-indigo-500/10 border-l border-indigo-500/20">
                    মোট পাওনা ব্যালেন্স
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredCards.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      কোনো বকেয়া কার্ড পাওয়া যায়নি
                    </td>
                  </tr>
                ) : (
                  filteredCards.map((card, idx) => (
                    <tr key={card.card_id} className="hover:bg-white/[0.03] transition-colors">
                      <td className="py-3 px-3 text-center font-mono text-slate-500">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-white flex items-center gap-1.5">
                          <span className="text-indigo-400 font-mono">#{card.card_id}</span>
                          <span className="text-slate-200">{card.card_name}</span>
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {card.start_date ? `${card.start_date} → ${card.maturity_date || "চলমান"}` : ""}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-white">{card.investor_name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">ID: #{card.investor_id}</p>
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-mono">{card.investor_mobile || "-"}</td>
                      <td className="py-3 px-4 text-right font-bold font-mono text-slate-100">
                        ৳{formatCurrency(card.capital)}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold font-mono text-emerald-400">
                        ৳{formatCurrency(card.total_all_time_profit)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-rose-400">
                        ৳{formatCurrency(card.total_withdrawn)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold font-mono text-blue-300">
                        ৳{formatCurrency(card.unwithdrawn_profit)}
                      </td>
                      <td className="py-3 px-4 text-right font-black font-mono text-indigo-300 bg-indigo-500/10 border-l border-indigo-500/20">
                        ৳{formatCurrency(card.total_balance)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr className="bg-blue-950/40 border-t-2 border-blue-500/40 font-bold text-xs text-white">
                  <td colSpan={4} className="py-4 px-4 text-blue-200 uppercase font-black tracking-wider">
                    সর্বমোট ({filteredCards.length} টি কার্ড):
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-white font-black text-sm">
                    ৳{formatCurrency(cardTableTotals.capital)}
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-emerald-400 font-black text-sm">
                    ৳{formatCurrency(cardTableTotals.profit)}
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-rose-400 font-black text-sm">
                    ৳{formatCurrency(cardTableTotals.withdrawn)}
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-blue-300 font-black text-sm">
                    ৳{formatCurrency(cardTableTotals.unwithdrawn)}
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-indigo-300 font-black text-base bg-indigo-500/20 border-l border-indigo-500/40">
                    ৳{formatCurrency(cardTableTotals.balance)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: COMPANY 3 CARDS SPECIFICALLY */}
      {activeTab === "company_cards" && (
        <div className="card-surface rounded-2xl border border-purple-500/30 bg-[#0d162b] shadow-xl overflow-hidden">
          <div className="p-5 border-b border-purple-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-purple-950/20">
            <div>
              <h3 className="text-base font-bold text-white">
                কোম্পানির ৩টি নিজস্ব কার্ড বিবরণী
              </h3>
              <p className="text-xs text-slate-400">
                কার্ড ১, ২ এবং ৩ এর বিনিয়োগ আসল ও অর্জিত মুনাফা
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-300 rounded-full w-fit">
              মোট: ৩ টি কার্ড
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-white/[0.03] text-slate-400 border-b border-white/[0.08] uppercase font-semibold text-[11px]">
                  <th className="py-3.5 px-4">কার্ড আইডি</th>
                  <th className="py-3.5 px-4">কার্ডের নাম</th>
                  <th className="py-3.5 px-4 text-right font-bold text-slate-200">বিনিয়োগ (আসল)</th>
                  <th className="py-3.5 px-4 text-right font-bold text-purple-400">মোট অর্জিত লাভ</th>
                  <th className="py-3.5 px-4 text-right text-slate-400">উত্তোলিত</th>
                  <th className="py-3.5 px-4 text-right font-black text-purple-300 bg-purple-500/10 border-l border-purple-500/20">
                    মোট পাওনা ব্যালেন্স
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {companyCards.map((c) => (
                  <tr key={c.card_id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="py-4 px-4 font-mono font-bold text-purple-400">
                      Card #{c.card_id}
                    </td>
                    <td className="py-4 px-4 font-bold text-white">
                      {c.card_name}
                    </td>
                    <td className="py-4 px-4 text-right font-bold font-mono text-slate-100 text-sm">
                      ৳{formatCurrency(c.capital)}
                    </td>
                    <td className="py-4 px-4 text-right font-semibold font-mono text-purple-400 text-sm">
                      ৳{formatCurrency(c.total_all_time_profit)}
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-slate-400 text-sm">
                      ৳{formatCurrency(c.withdrawn_profit)}
                    </td>
                    <td className="py-4 px-4 text-right font-black font-mono text-purple-300 text-base bg-purple-500/10 border-l border-purple-500/20">
                      ৳{formatCurrency(c.net_balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-purple-950/40 border-t border-purple-500/30 font-bold text-sm">
                  <td colSpan={2} className="py-3.5 px-4 text-purple-200">কোম্পানির ৩টি কার্ডের সর্বমোট:</td>
                  <td className="py-3.5 px-4 text-right font-mono text-white">
                    ৳{formatCurrency(summary.company_total_capital)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-purple-300">
                    ৳{formatCurrency(summary.company_lifetime_profit)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-400">
                    ৳{formatCurrency(summary.company_withdrawn_profit)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-purple-200 bg-purple-500/20 border-l border-purple-500/30">
                    ৳{formatCurrency(summary.company_total_balance)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: EXPENSE BREAKDOWN */}
      {activeTab === "expenses" && (
        <div className="card-surface p-6 rounded-2xl border border-white/[0.08] bg-[#0d162b] shadow-xl space-y-4">
          <h3 className="text-base font-bold text-white border-b border-white/[0.08] pb-3">
            কোম্পানির পরিচালন খরচের খাতভিত্তিক হিসাব
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {expenseBreakdown.map((exp) => (
              <div key={exp.category} className="p-4 rounded-xl border border-white/[0.08] bg-slate-900/60 space-y-1">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{exp.category}</p>
                <p className="text-xl font-bold font-mono text-white">৳{formatCurrency(exp.amount)}</p>
                <p className="text-[11px] text-slate-400">{exp.count} টি ভাউচার এন্ট্রি</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanySettlement;
