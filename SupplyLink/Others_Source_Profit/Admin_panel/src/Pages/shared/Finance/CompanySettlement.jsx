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
  CreditCard
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
  const [activeTab, setActiveTab] = useState("investors"); // 'investors' | 'company_cards' | 'overview' | 'expenses'
  const printRef = useRef(null);

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
  const investorList = data?.investor_breakdown || [];
  const companyCards = data?.company_cards || [];
  const expenseBreakdown = data?.expense_breakdown || [];

  // Filtered Investors
  const filteredInvestors = useMemo(() => {
    if (!searchTerm.trim()) return investorList;
    const term = searchTerm.toLowerCase();
    return investorList.filter((inv) =>
      inv.investor_name?.toLowerCase().includes(term) ||
      inv.investor_mobile?.toLowerCase().includes(term) ||
      inv.investor_id?.toString().includes(term)
    );
  }, [investorList, searchTerm]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center space-y-4 text-slate-400">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-sm font-medium animate-pulse text-slate-300">
          ইনভেস্টর ও কোম্পানি কার্ডের বিস্তারিত হিসাব লোড হচ্ছে...
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
    <div className="w-full max-w-7xl mx-auto px-4 py-6 space-y-6 text-slate-100 print:p-0 print:m-0 print:max-w-full print:text-black">
      {/* 🧭 Top Header (Dark Theme) */}
      <div className="card-surface p-5 sm:p-6 rounded-2xl border border-white/[0.08] bg-[#0d162b] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl shrink-0">
            <Scale className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                ইনভেস্টর বনাম কোম্পানি কার্ড হিসাব বিবরণী
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                স্বতন্ত্র অডিট
              </span>
            </div>
            <p className="text-xs md:text-sm text-slate-400 mt-0.5">
              সাধারণ ইনভেস্টরদের মূল টাকা ও লাভ এবং কোম্পানির ৩টি নিজস্ব কার্ডের সুনির্দিষ্ট হিসাব
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
        <p className="text-sm text-gray-700">Investor vs Company Capital & Profit Audit Statement</p>
        <p className="text-xs text-gray-600">Cut-off Date: 2026-10-31 | Generated: {new Date().toLocaleDateString('bn-BD')}</p>
      </div>

      {/* 🌟 2 HERO HIGHLIGHT PANELS: INVESTORS VS COMPANY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:grid-cols-2">
        {/* PANEL 1: GENERAL INVESTORS PORTION (Cards 1, 2, 3 Excluded) */}
        <div className="card-surface p-6 rounded-2xl border border-blue-500/30 bg-gradient-to-br from-[#0d162b] via-[#0e1a38] to-[#0a1226] shadow-xl relative overflow-hidden flex flex-col justify-between space-y-5">
          <div className="flex items-center justify-between border-b border-blue-500/20 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl">
                <Users className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-base font-bold text-white">
                  ১. সাধারণ ইনভেস্টরদের অংশ ({summary.investor_running_count} জন)
                </h2>
                <p className="text-[11px] text-slate-400">কোম্পানির ৩টি নিজস্ব কার্ড বাদে প্রকৃত বিনিয়োগকারীদের দায়</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/20">
              {summary.investor_running_cards_count} টি রানিং কার্ড
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900/60 border border-white/[0.08] p-4 rounded-xl space-y-1">
              <p className="text-xs text-slate-400 uppercase font-semibold">ইনভেস্টরদের মূল টাকা (আসল)</p>
              <p className="text-2xl font-black font-mono text-white tracking-tight">
                ৳{formatCurrency(summary.investor_running_capital)}
              </p>
              <p className="text-[11px] text-blue-400 font-medium">১২৬ জন ইনভেস্টরের মূলধন</p>
            </div>

            <div className="bg-slate-900/60 border border-white/[0.08] p-4 rounded-xl space-y-1">
              <p className="text-xs text-slate-400 uppercase font-semibold">ইনভেস্টরদের মোট লাভ</p>
              <p className="text-2xl font-black font-mono text-emerald-400 tracking-tight">
                ৳{formatCurrency(summary.investor_lifetime_profit)}
              </p>
              <p className="text-[11px] text-slate-400 font-medium">লাইফটাইম অর্জিত মুনাফা</p>
            </div>
          </div>

          <div className="space-y-2 text-xs border-t border-white/[0.08] pt-3 text-slate-300">
            <div className="flex justify-between py-1">
              <span className="text-slate-400">• অক্টোবর ২০২৬ মাসের লাভ:</span>
              <span className="font-semibold font-mono text-emerald-400">৳{formatCurrency(summary.investor_oct_2026_profit)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">• ইনভেস্টররা ইতোমধ্যে তুলেছে (Withdrawn):</span>
              <span className="font-semibold font-mono text-rose-400">৳{formatCurrency(summary.investor_withdrawn_profit)}</span>
            </div>
            <div className="flex justify-between py-1.5 px-3 bg-blue-500/10 border border-blue-500/20 rounded-xl font-bold">
              <span className="text-blue-300">ইনভেস্টরদের বাকি থাকা নিট লাভ:</span>
              <span className="font-mono text-blue-400">৳{formatCurrency(summary.investor_unwithdrawn_profit)}</span>
            </div>
          </div>

          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* PANEL 2: COMPANY OWN 3 CARDS (Cards 1, 2, 3) */}
        <div className="card-surface p-6 rounded-2xl border border-purple-500/30 bg-gradient-to-br from-[#0d162b] via-[#1a1032] to-[#0a1226] shadow-xl relative overflow-hidden flex flex-col justify-between space-y-5">
          <div className="flex items-center justify-between border-b border-purple-500/20 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl">
                <Building2 className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-base font-bold text-white">
                  ২. কোম্পানির নিজস্ব অংশ (কার্ড ১, ২, ৩)
                </h2>
                <p className="text-[11px] text-slate-400">সাপ্লাইলিংক মেয়াদপূর্ব, অংশীদারি ও বিনিয়োগ হিসাব</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20">
              ৩ টি কোম্পানি কার্ড
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900/60 border border-white/[0.08] p-4 rounded-xl space-y-1">
              <p className="text-xs text-slate-400 uppercase font-semibold">কোম্পানির মূল টাকা (বিনিয়োগ)</p>
              <p className="text-2xl font-black font-mono text-white tracking-tight">
                ৳{formatCurrency(summary.company_total_capital)}
              </p>
              <p className="text-[11px] text-purple-400 font-medium">কার্ড ১ এর মূলধন</p>
            </div>

            <div className="bg-slate-900/60 border border-white/[0.08] p-4 rounded-xl space-y-1">
              <p className="text-xs text-slate-400 uppercase font-semibold">কোম্পানির মোট লাভ</p>
              <p className="text-2xl font-black font-mono text-purple-400 tracking-tight">
                ৳{formatCurrency(summary.company_lifetime_profit)}
              </p>
              <p className="text-[11px] text-slate-400 font-medium">কার্ড ২ ও ১ এর মোট লাভ</p>
            </div>
          </div>

          <div className="space-y-2 text-xs border-t border-white/[0.08] pt-3 text-slate-300">
            <div className="flex justify-between py-1">
              <span className="text-slate-400">• কোম্পানির অক্টোবর ২০২৬ লাভ:</span>
              <span className="font-semibold font-mono text-purple-400">৳{formatCurrency(summary.company_oct_2026_profit)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">• কার্ড ১ (মেয়াদপূর্ব মুনাফা):</span>
              <span className="font-semibold font-mono text-slate-200">মূলধন ৳৭২,১৬৭.৭৬ | লাভ ৳৫,৯০৬.০১</span>
            </div>
            <div className="flex justify-between py-1.5 px-3 bg-purple-500/10 border border-purple-500/20 rounded-xl font-bold">
              <span className="text-purple-300">কার্ড ২ (অংশীদারি মুনাফা হিসাব):</span>
              <span className="font-mono text-purple-400">লাভ ৳৭,৭৭,৮৩৫.০৭</span>
            </div>
          </div>

          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        </div>
      </div>

      {/* 💼 3 Summary Overview Cards: Liquid Cash, Total Capital, Total Profit */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-surface p-5 rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-[#0d162b] to-emerald-950/20 shadow-md space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">উপলব্ধ মোট নগদ ক্যাশ</span>
            <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <Wallet className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black font-mono text-white">
            ৳{formatCurrency(summary.net_cash)}
          </p>
          <p className="text-[11px] text-emerald-400 font-medium">সব কিস্তি ও বন্ধক ফেরত যুক্ত নগদ তহবিল</p>
        </div>

        <div className="card-surface p-5 rounded-2xl border border-white/[0.08] bg-slate-900/60 shadow-md space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">সর্বমোট রানিং মূলধন (উভয়)</span>
            <span className="p-2 bg-white/[0.06] text-slate-300 rounded-xl border border-white/[0.08]">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black font-mono text-white">
            ৳{formatCurrency(summary.total_combined_capital)}
          </p>
          <p className="text-[11px] text-slate-400">ইনভেস্টর ১৯.৬২L + কোম্পানি ৭২.১k</p>
        </div>

        <div className="card-surface p-5 rounded-2xl border border-amber-500/25 bg-gradient-to-br from-[#0d162b] to-amber-950/20 shadow-md space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">সর্বমোট অর্জিত লাভ (উভয়)</span>
            <span className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black font-mono text-amber-400">
            ৳{formatCurrency(summary.total_combined_lifetime_profit)}
          </p>
          <p className="text-[11px] text-slate-400">ইনভেস্টর ৫.১০L + কোম্পানি ৭.৮৩L</p>
        </div>
      </div>

      {/* 🧭 Sub-tab Switcher for Interactive Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-3 print:hidden">
        <div className="inline-flex items-center gap-1.5 bg-[#091022] p-1.5 rounded-xl border border-white/[0.08]">
          <button
            onClick={() => setActiveTab("investors")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === "investors"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            ১. সাধারণ ইনভেস্টরদের তালিকা ({investorList.length})
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
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === "overview"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            সার্বিক লাভ-ক্ষতি (P&L)
          </button>
          <button
            onClick={() => setActiveTab("expenses")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === "expenses"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            অফিস পরিচালন ব্যয়
          </button>
        </div>

        {activeTab === "investors" && (
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="নাম বা মোবাইল দিয়ে খুঁজুন..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-slate-900/90 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none transition"
            />
          </div>
        )}
      </div>

      {/* TAB 1: GENERAL INVESTORS LIST (Excluding Company Cards 1, 2, 3) */}
      {activeTab === "investors" && (
        <div className="card-surface rounded-2xl border border-white/[0.08] bg-[#0d162b] shadow-xl overflow-hidden">
          <div className="p-5 border-b border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/[0.02]">
            <div>
              <h3 className="text-base font-bold text-white">
                সাধারণ ইনভেস্টরদের বিস্তারিত তালিকা (কার্ড ১, ২ ও ৩ বাদে)
              </h3>
              <p className="text-xs text-slate-400">
                ১২৬ জন প্রকৃত ইনভেস্টরের মূল টাকা (আসল) এবং তাদের অর্জিত লাভের হিসাব
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-300 rounded-full w-fit">
              মোট: {filteredInvestors.length} জন ইনভেস্টর
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-white/[0.03] text-slate-400 border-b border-white/[0.08] uppercase font-semibold text-[11px]">
                  <th className="py-3.5 px-4">আইডি ও ইনভেস্টর</th>
                  <th className="py-3.5 px-4">মোবাইল</th>
                  <th className="py-3.5 px-4 text-center">কার্ড সংখ্যা</th>
                  <th className="py-3.5 px-4 text-right font-bold text-slate-200">মূল টাকা (আসল)</th>
                  <th className="py-3.5 px-4 text-right text-emerald-400">অক্টোবর ২০২৬ লাভ</th>
                  <th className="py-3.5 px-4 text-right">মোট অর্জিত লাভ</th>
                  <th className="py-3.5 px-4 text-right text-rose-400">উত্তোলিত</th>
                  <th className="py-3.5 px-4 text-right text-blue-300 font-bold bg-blue-500/10 border-l border-blue-500/20">
                    বাকি লাভ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredInvestors.map((inv) => (
                  <tr key={inv.investor_id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-white">{inv.investor_name}</p>
                      <p className="text-[10px] text-slate-400">ID: #{inv.investor_id}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-mono">{inv.investor_mobile || "-"}</td>
                    <td className="py-3 px-4 text-center font-medium text-slate-300">{inv.total_cards}</td>
                    <td className="py-3 px-4 text-right font-bold font-mono text-slate-100">
                      ৳{formatCurrency(inv.total_capital)}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold font-mono text-emerald-400">
                      ৳{formatCurrency(inv.oct_2026_profit)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-300">
                      ৳{formatCurrency(inv.total_all_time_profit)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-rose-400">
                      ৳{formatCurrency(inv.total_withdrawn)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold font-mono text-blue-300 bg-blue-500/10 border-l border-blue-500/20">
                      ৳{formatCurrency(inv.unwithdrawn_profit)}
                    </td>
                  </tr>
                ))}
              </tbody>
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
                  <th className="py-3.5 px-4 text-right font-bold text-slate-200">মূল টাকা (বিনিয়োগ)</th>
                  <th className="py-3.5 px-4 text-right text-purple-400">অক্টোবর ২০২৬ লাভ</th>
                  <th className="py-3.5 px-4 text-right font-bold text-purple-300 bg-purple-500/10 border-l border-purple-500/20">
                    মোট অর্জিত লাভ
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
                      ৳{formatCurrency(c.oct_2026_profit)}
                    </td>
                    <td className="py-4 px-4 text-right font-black font-mono text-purple-300 text-base bg-purple-500/10 border-l border-purple-500/20">
                      ৳{formatCurrency(c.total_all_time_profit)}
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
                    ৳{formatCurrency(summary.company_oct_2026_profit)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-purple-200 bg-purple-500/20 border-l border-purple-500/30">
                    ৳{formatCurrency(summary.company_lifetime_profit)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: OVERALL BUSINESS P&L */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card-surface p-6 rounded-2xl border border-white/[0.08] bg-[#0d162b] shadow-xl space-y-4">
              <div className="flex items-center gap-2.5 border-b border-white/[0.08] pb-3">
                <span className="p-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl">
                  <ArrowUpRight className="w-4 h-4" />
                </span>
                <h3 className="text-base font-bold text-white">
                  ১. মোট আয় ও পণ্য বিক্রয়ের গ্রস লাভ
                </h3>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-white/[0.04]">
                  <span className="text-slate-400">মোট বিক্রয় মূল্য (Total Sales)</span>
                  <span className="font-semibold font-mono text-white">৳{formatCurrency(summary.lifetime_sales)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/[0.04]">
                  <span className="text-slate-400">পণ্য ক্রয়ের আসল খরচ (Product Cost)</span>
                  <span className="font-semibold font-mono text-rose-400">- ৳{formatCurrency(summary.lifetime_cost)}</span>
                </div>
                <div className="flex justify-between py-2.5 px-3 border border-emerald-500/20 bg-emerald-500/[0.06] rounded-xl font-bold">
                  <span className="text-emerald-300">পণ্য বিক্রির গ্রস লাভ (Gross Profit)</span>
                  <span className="text-emerald-400 font-mono">৳{formatCurrency(summary.lifetime_gross_profit)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/[0.04]">
                  <span className="text-slate-400">বন্ধক ও অন্যান্য আয় (Other Income)</span>
                  <span className="font-semibold font-mono text-emerald-400">+ ৳{formatCurrency(summary.lifetime_other_income)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/[0.04]">
                  <span className="text-slate-400">অফিস পরিচালন ব্যয় (Total Expenses)</span>
                  <span className="font-semibold font-mono text-rose-400">- ৳{formatCurrency(summary.lifetime_expenses)}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-indigo-500/30 text-base font-bold bg-indigo-500/[0.08] p-3.5 rounded-xl border border-indigo-500/20">
                  <span className="text-indigo-200">কোম্পানির নিট অপারেটিং লাভ</span>
                  <span className="text-indigo-400 font-mono">৳{formatCurrency(summary.lifetime_net_operating_profit)}</span>
                </div>
              </div>
            </div>

            <div className="card-surface p-6 rounded-2xl border border-white/[0.08] bg-[#0d162b] shadow-xl space-y-4">
              <div className="flex items-center gap-2.5 border-b border-white/[0.08] pb-3">
                <span className="p-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl">
                  <Scale className="w-4 h-4" />
                </span>
                <h3 className="text-base font-bold text-white">
                  ২. নগদ ক্যাশ বনাম ইনভেস্টর দায়দেনা
                </h3>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-white/[0.04]">
                  <span className="text-slate-400">মোট ক্যাশ-ইন (কাস্টমার কিস্তি ও বন্ধক ফেরত সহ)</span>
                  <span className="font-semibold font-mono text-emerald-400">৳{formatCurrency(summary.total_cash_in)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/[0.04]">
                  <span className="text-slate-400">মোট ক্যাশ-আউট (ক্রয়, খরচ ও পে-আউট)</span>
                  <span className="font-semibold font-mono text-slate-300">- ৳{formatCurrency(summary.total_cash_out)}</span>
                </div>
                <div className="flex justify-between py-2.5 px-3 border border-indigo-500/20 bg-indigo-500/[0.06] rounded-xl font-bold">
                  <span className="text-indigo-300">হাতে থাকা নগদ তহবিল (Available Pool)</span>
                  <span className="text-indigo-400 font-mono">৳{formatCurrency(summary.net_cash)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/[0.04]">
                  <span className="text-slate-400">সাধারণ ইনভেস্টরদের আসল মূলধন পাওনা</span>
                  <span className="font-semibold font-mono text-blue-400">৳{formatCurrency(summary.investor_running_capital)}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-emerald-500/30 text-base font-bold bg-emerald-500/[0.08] p-3.5 rounded-xl border border-emerald-500/20">
                  <span className="text-emerald-200">ইনভেস্টর আসল বাদে ক্যাশ উদ্বৃত্ত</span>
                  <span className="text-emerald-400 font-mono">
                    + ৳{formatCurrency(summary.net_capital_surplus)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: EXPENSE BREAKDOWN */}
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
