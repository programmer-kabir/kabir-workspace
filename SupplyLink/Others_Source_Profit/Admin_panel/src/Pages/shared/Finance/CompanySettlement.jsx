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
  BadgePercent
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
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'investors' | 'expenses'
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
          কোম্পানি ও ইনভেস্টরদের সর্বমোট নিষ্পত্তি হিসাব লোড হচ্ছে...
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
    <div className="w-full  mx-auto px-4 py-6 space-y-6 text-slate-100 print:p-0 print:m-0 print:max-w-full print:text-black">
      {/* 🧭 Top Header with Controls (Dark Theme) */}
      <div className="card-surface p-5 sm:p-6 rounded-2xl border border-white/[0.08] bg-[#0d162b] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl shrink-0">
            <Scale className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                কোম্পানি সেটেলমেন্ট ও ফাইনাল ক্লোজিং অডিট
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                লাইভ অডিট
              </span>
            </div>
            <p className="text-xs md:text-sm text-slate-400 mt-0.5">
              সব কিস্তি ১০০% পরিশোধ সাপেক্ষে কোম্পানি ও ইনভেস্টরদের চূড়ান্ত আর্থিক নিষ্পত্তি
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
            <span>প্রিন্ট অডিট শিট</span>
          </button>
        </div>
      </div>

      {/* 🖨️ Printable Header only visible during print */}
      <div className="hidden print:block text-center border-b pb-4 mb-4 text-black">
        <h1 className="text-2xl font-bold">SupplyLink Bangladesh Limited</h1>
        <p className="text-sm text-gray-700">Company Final Settlement & Financial Audit Statement</p>
        <p className="text-xs text-gray-600">Cut-off Date: 2026-10-31 | Generated: {new Date().toLocaleDateString('bn-BD')}</p>
      </div>

      {/* 🌟 4 Key Executive Metrics (Bento Grid - Dark Themed) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-2">
        {/* Metric 1: Net Liquid Cash */}
        <div className="card-surface p-5 rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-[#0d162b] to-emerald-950/20 shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              উপলব্ধ নগদ ক্যাশ
            </span>
            <span className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
              <Wallet className="w-4 h-4" />
            </span>
          </div>
          <div className="my-3">
            <p className="text-2xl lg:text-3xl font-black font-mono tracking-tight text-white">
              ৳{formatCurrency(summary.net_cash)}
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>সব কিস্তির টাকা ও বন্ধক ফেরত যুক্ত</span>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        </div>

        {/* Metric 2: Investor Running Capital */}
        <div className="card-surface p-5 rounded-2xl border border-blue-500/25 bg-gradient-to-br from-[#0d162b] to-blue-950/20 shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              ইনভেস্টর আসল মূলধন
            </span>
            <span className="p-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="my-3">
            <p className="text-2xl lg:text-3xl font-black font-mono tracking-tight text-white">
              ৳{formatCurrency(summary.investor_principal_payable)}
            </p>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span>{summary.investor_running_count} জন ইনভেস্টর</span>
            <span>{summary.investor_running_cards_count} টি রানিং কার্ড</span>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        </div>

        {/* Metric 3: Capital Coverage */}
        <div className="card-surface p-5 rounded-2xl border border-amber-500/25 bg-gradient-to-br from-[#0d162b] to-amber-950/20 shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              মূলধন কাভারেজ রেসিও
            </span>
            <span className="p-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
              <BadgePercent className="w-4 h-4" />
            </span>
          </div>
          <div className="my-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl lg:text-3xl font-black font-mono tracking-tight text-amber-300">
                {summary.capital_coverage_percent}%
              </span>
              <span className="text-xs text-slate-400 font-medium">ক্যাশ সুরক্ষিত</span>
            </div>
            <div className="w-full bg-slate-900/80 h-2.5 rounded-full overflow-hidden mt-2 p-0.5 border border-white/5">
              <div 
                className="bg-gradient-to-r from-amber-500 to-amber-400 h-full rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, summary.capital_coverage_percent)}%` }}
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            ঘাটতি: <span className="text-rose-400 font-mono font-semibold">৳{formatCurrency(Math.abs(summary.net_capital_surplus))}</span>
          </p>
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        </div>

        {/* Metric 4: Company Lifetime Retained Profit */}
        <div className="card-surface p-5 rounded-2xl border border-indigo-500/25 bg-gradient-to-br from-[#0d162b] to-indigo-950/20 shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              কোম্পানির নিট মুনাফা
            </span>
            <span className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="my-3">
            <p className="text-2xl lg:text-3xl font-black font-mono tracking-tight text-emerald-400">
              ৳{formatCurrency(summary.company_lifetime_retained_profit)}
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
            <span>সব খরচ ও পে-আউট বাদে মালিকের লাভ</span>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        </div>
      </div>

      {/* 🧭 Dark Sub-tab Switcher for Interactive Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-3 print:hidden">
        <div className="inline-flex items-center gap-1.5 bg-[#091022] p-1.5 rounded-xl border border-white/[0.08]">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === "overview"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            সার্বিক লাভ-ক্ষতি ও ব্যালেন্স শিট
          </button>
          <button
            onClick={() => setActiveTab("investors")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === "investors"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            ইনভেস্টরভিত্তিক সেটেলমেন্ট ({investorList.length})
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

      {/* TAB 1: OVERALL BUSINESS P&L / BALANCE SHEET (Dark Themed) */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Revenue & Operational Profit */}
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

            {/* Right: Liquidation & Capital Settlement Formula */}
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
                  <span className="text-indigo-400 font-mono">৳{formatCurrency(summary.total_liquid_pool)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/[0.04]">
                  <span className="text-slate-400">ইনভেস্টরদের রানিং মূলধন পাওনা</span>
                  <span className="font-semibold font-mono text-rose-400">- ৳{formatCurrency(summary.investor_principal_payable)}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-amber-500/30 text-base font-bold bg-amber-500/[0.08] p-3.5 rounded-xl border border-amber-500/20">
                  <span className="text-amber-200">মূলধন পরিশোধ সাপেক্ষে ক্যাশ ব্যবধান</span>
                  <span className="text-amber-400 font-mono">
                    - ৳{formatCurrency(Math.abs(summary.net_capital_surplus))} ({summary.capital_coverage_percent}% সুরক্ষিত)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* October 2026 Distribution Highlight Banner */}
          <div className="card-surface p-6 rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/80 via-slate-900/90 to-indigo-950/80 shadow-2xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="inline-block px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-[11px] font-semibold uppercase tracking-wider mb-2 text-indigo-300">
                  অক্টোবর ২০২৬ প্রফিট জেনারেটর আপডেট
                </span>
                <h2 className="text-lg md:text-xl font-bold text-white">
                  অক্টোবর ২০২৬ মাসে মোট বণ্টিত মুনাফা: <span className="text-emerald-400 font-mono">৳{formatCurrency(summary.october_2026_profit)}</span>
                </h2>
                <p className="text-xs text-slate-300 mt-1">
                  মোট {summary.october_2026_records} জন ইনভেস্টরের কার্ডে Time Weighted Value অনুসারে লাভ বণ্টন সম্পন্ন হয়েছে।
                </p>
              </div>
              <div className="text-left md:text-right shrink-0">
                <p className="text-xs text-slate-400">ইনভেস্টরদের লাইফটাইম মোট লাভ</p>
                <p className="text-xl md:text-2xl font-black font-mono text-amber-300">
                  ৳{formatCurrency(summary.investor_total_generated_profit)}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  উত্তোলিত: <span className="text-rose-400 font-mono">৳{formatCurrency(summary.investor_total_withdrawn_profit)}</span> | অপুনরুদ্ধৃত: <span className="text-emerald-400 font-mono">৳{formatCurrency(summary.investor_unwithdrawn_profit)}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INVESTOR BY INVESTOR BREAKDOWN (Dark Themed Table) */}
      {(activeTab === "investors" || activeTab === "overview") && (
        <div className={`card-surface rounded-2xl border border-white/[0.08] bg-[#0d162b] shadow-xl overflow-hidden ${activeTab === "overview" ? "print:block" : ""}`}>
          <div className="p-5 border-b border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/[0.02]">
            <div>
              <h3 className="text-base font-bold text-white">
                ইনভেস্টরভিত্তিক চূড়ান্ত সেটেলমেন্ট শিট
              </h3>
              <p className="text-xs text-slate-400">
                কার কত টাকা মূলধন, অক্টোবর মাসের লাভ এবং চূড়ান্ত দাবি
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 bg-white/[0.06] border border-white/[0.08] text-slate-200 rounded-full w-fit">
              মোট: {filteredInvestors.length} জন ইনভেস্টর
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-white/[0.03] text-slate-400 border-b border-white/[0.08] uppercase font-semibold text-[11px]">
                  <th className="py-3.5 px-4">আইডি ও ইনভেস্টর</th>
                  <th className="py-3.5 px-4">মোবাইল</th>
                  <th className="py-3.5 px-4 text-center">কার্ড</th>
                  <th className="py-3.5 px-4 text-right">আসল মূলধন</th>
                  <th className="py-3.5 px-4 text-right">অক্টোবর ২০২৬ লাভ</th>
                  <th className="py-3.5 px-4 text-right">লাইফটাইম লাভ</th>
                  <th className="py-3.5 px-4 text-right">উত্তোলিত</th>
                  <th className="py-3.5 px-4 text-right">বাকি লাভ</th>
                  <th className="py-3.5 px-4 text-right bg-indigo-500/10 text-indigo-300 font-bold border-l border-indigo-500/20">
                    মোট পাওনা দাবি
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
                    <td className="py-3 px-4 text-right font-mono text-slate-300">
                      ৳{formatCurrency(inv.unwithdrawn_profit)}
                    </td>
                    <td className="py-3 px-4 text-right font-black font-mono text-indigo-300 bg-indigo-500/10 border-l border-indigo-500/20">
                      ৳{formatCurrency(inv.total_settlement_claim)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: EXPENSE BREAKDOWN (Dark Themed) */}
      {activeTab === "expenses" && (
        <div className="card-surface p-6 rounded-2xl border border-white/[0.08] bg-[#0d162b] shadow-xl space-y-4">
          <h3 className="text-base font-bold text-white border-b border-white/[0.08] pb-3">
            কোম্পানির অতীত পরিচালন খরচের খাতভিত্তিক হিসাব
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

      {/* Footer Audit Sign-off for Print */}
      <div className="hidden print:flex justify-between pt-16 text-center text-xs text-black">
        <div className="w-48 border-t border-black pt-1">
          <p className="font-bold">মালিক / ব্যবস্থাপনা পরিচালক</p>
          <p className="text-[10px] text-gray-600">SupplyLink Bangladesh Ltd.</p>
        </div>
        <div className="w-48 border-t border-black pt-1">
          <p className="font-bold">প্রধান হিসাবরক্ষণ কর্মকর্তা</p>
          <p className="text-[10px] text-gray-600">Accounts & Audit Dept.</p>
        </div>
      </div>
    </div>
  );
};

export default CompanySettlement;
