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
  FileSpreadsheet
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
    const q = searchTerm.toLowerCase();
    return investorList.filter(
      (inv) =>
        inv.investor_name.toLowerCase().includes(q) ||
        inv.investor_mobile.includes(q) ||
        String(inv.investor_id).includes(q)
    );
  }, [investorList, searchTerm]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-sm font-medium text-slate-600">কোম্পানি সেটেলমেন্ট ও ফাইনাল অডিট হিসাব লোড হচ্ছে...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto mt-12 p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center">
        <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto mb-2" />
        <h3 className="text-base font-bold text-rose-800 mb-1">হিসাব লোড করা যায়নি</h3>
        <p className="text-xs text-rose-600 mb-4">{error}</p>
        <button
          onClick={fetchSettlement}
          className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 transition"
        >
          পুনরায় চেষ্টা করুন
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 space-y-6 print:p-0 print:m-0 print:max-w-full">
      {/* 🧭 Top Header with Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Scale className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                কোম্পানি সেটেলমেন্ট ও ফাইনাল ক্লোজিং অডিট
              </h1>
              <p className="text-xs md:text-sm text-slate-500">
                সব কিস্তি ১০০% পরিশোধ সাপেক্ষে কোম্পানি ও ইনভেস্টরদের সর্বমোট নিষ্পত্তি হিসাব
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchSettlement}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
          >
            <RefreshCw className="w-4 h-4" />
            <span>রিফ্রেশ</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md transition"
          >
            <Printer className="w-4 h-4" />
            <span>প্রিন্ট অডিট শিট</span>
          </button>
        </div>
      </div>

      {/* 🖨️ Printable Header only visible during print */}
      <div className="hidden print:block text-center border-b pb-4 mb-4">
        <h1 className="text-2xl font-bold">SupplyLink Bangladesh Limited</h1>
        <p className="text-sm text-gray-600">Company Final Settlement & Financial Audit Statement</p>
        <p className="text-xs text-gray-500">Cut-off Date: 2026-10-31 | Generated: {new Date().toLocaleDateString('bn-BD')}</p>
      </div>

      {/* 🌟 4 Key Executive Metrics (Bento Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Net Liquid Cash */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">উপলব্ধ নগদ ক্যাশ</span>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Wallet className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900">
            ৳{formatCurrency(summary.net_cash)}
          </p>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>সব কিস্তির টাকা ও বন্ধক ফেরত যুক্ত</span>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
        </div>

        {/* Metric 2: Investor Running Capital */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">ইনভেস্টর আসল মূলধন</span>
            <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900">
            ৳{formatCurrency(summary.investor_principal_payable)}
          </p>
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>{summary.investor_running_count} জন ইনভেস্টর</span>
            <span>{summary.investor_running_cards_count} টি রানিং কার্ড</span>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl pointer-events-none" />
        </div>

        {/* Metric 3: Capital Coverage */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">মূলধন কাভারেজ রেসিও</span>
            <span className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Scale className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900">
            {summary.capital_coverage_percent}%
          </p>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-amber-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(100, summary.capital_coverage_percent)}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500">
            ঘাটতি: ৳{formatCurrency(Math.abs(summary.net_capital_surplus))}
          </p>
        </div>

        {/* Metric 4: Company Lifetime Retained Profit */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">কোম্পানির নিট মুনাফা</span>
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-emerald-600">
            ৳{formatCurrency(summary.company_lifetime_retained_profit)}
          </p>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
            <span>মোট খরচ ও লাভ পে-আউট বাদে মালিকের লাভ</span>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
        </div>
      </div>

      {/* 🧭 Sub-tab Switcher for Interactive Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 print:hidden">
        <div className="inline-flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
              activeTab === "overview"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            সার্বিক লাভ-ক্ষতি ও ব্যালেন্স শিট
          </button>
          <button
            onClick={() => setActiveTab("investors")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
              activeTab === "investors"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            ইনভেস্টরভিত্তিক সেটেলমেন্ট তালিকা ({investorList.length})
          </button>
          <button
            onClick={() => setActiveTab("expenses")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
              activeTab === "expenses"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            অফিস ও পরিচালন ব্যয়
          </button>
        </div>

        {activeTab === "investors" && (
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="নাম বা মোবাইল দিয়ে খুঁজুন..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* TAB 1: OVERALL BUSINESS P&L / BALANCE SHEET */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Revenue & Operational Profit */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                  <ArrowUpRight className="w-4 h-4" />
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  ১. মোট আয় ও পণ্য বিক্রয়ের গ্রস লাভ
                </h3>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-600">মোট বিক্রয় মূল্য (Total Sales)</span>
                  <span className="font-semibold text-slate-900">৳{formatCurrency(summary.lifetime_sales)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-600">পণ্য ক্রয়ের আসল খরচ (Product Cost)</span>
                  <span className="font-semibold text-rose-600">- ৳{formatCurrency(summary.lifetime_cost)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50 bg-emerald-50/50 p-2 rounded-lg font-bold">
                  <span className="text-emerald-800">পণ্য বিক্রির গ্রস লাভ (Gross Profit)</span>
                  <span className="text-emerald-700">৳{formatCurrency(summary.lifetime_gross_profit)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-600">বন্ধক ও অন্যান্য আয় (Other Income)</span>
                  <span className="font-semibold text-emerald-600">+ ৳{formatCurrency(summary.lifetime_other_income)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-600">অফিস পরিচালন ব্যয় (Total Expenses)</span>
                  <span className="font-semibold text-rose-600">- ৳{formatCurrency(summary.lifetime_expenses)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t-2 border-slate-200 text-base font-bold bg-slate-50 p-3 rounded-xl">
                  <span className="text-slate-800">কোম্পানির নিট অপারেটিং লাভ</span>
                  <span className="text-indigo-600">৳{formatCurrency(summary.lifetime_net_operating_profit)}</span>
                </div>
              </div>
            </div>

            {/* Right: Liquidation & Capital Settlement Formula */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Scale className="w-4 h-4" />
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  ২. নগদ ক্যাশ বনাম ইনভেস্টর দায়দেনা
                </h3>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-600">মোট ক্যাশ-ইন (কাস্টমার কিস্তি ও বন্ধক ফেরত সহ)</span>
                  <span className="font-semibold text-emerald-600">৳{formatCurrency(summary.total_cash_in)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-600">মোট ক্যাশ-আউট (ক্রয়, খরচ ও পে-আউট)</span>
                  <span className="font-semibold text-slate-700">- ৳{formatCurrency(summary.total_cash_out)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50 bg-indigo-50/50 p-2 rounded-lg font-bold">
                  <span className="text-indigo-900">হাতে থাকা নগদ তহবিল (Available Pool)</span>
                  <span className="text-indigo-700">৳{formatCurrency(summary.total_liquid_pool)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-600">ইনভেস্টরদের রানিং মূলধন পাওনা</span>
                  <span className="font-semibold text-rose-600">- ৳{formatCurrency(summary.investor_principal_payable)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t-2 border-slate-200 text-base font-bold bg-amber-50/60 p-3 rounded-xl">
                  <span className="text-slate-800">মূলধন পরিশোধ সাপেক্ষে ক্যাশ ব্যবধান</span>
                  <span className="text-amber-700">
                    - ৳{formatCurrency(Math.abs(summary.net_capital_surplus))} ({summary.capital_coverage_percent}% সুরক্ষিত)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* October 2026 Distribution Highlight */}
          <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-2xl p-6 shadow-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="inline-block px-3 py-1 bg-white/10 rounded-full text-xs font-semibold uppercase tracking-wider mb-2 text-indigo-200">
                  অক্টোবর ২০২৬ প্রফিট জেনারেটর আপডেট
                </span>
                <h2 className="text-lg md:text-xl font-bold">
                  অক্টোবর ২০২৬ মাসে মোট বণ্টিত মুনাফা: ৳{formatCurrency(summary.october_2026_profit)}
                </h2>
                <p className="text-xs text-indigo-200 mt-1">
                  মোট {summary.october_2026_records} জন ইনভেস্টরের কার্ডে Time Weighted Value অনুসারে লাভ বণ্টন সম্পন্ন হয়েছে।
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-indigo-300">ইনভেস্টরদের আজ পর্যন্ত মোট লাভ</p>
                <p className="text-xl md:text-2xl font-black text-amber-400">
                  ৳{formatCurrency(summary.investor_total_generated_profit)}
                </p>
                <p className="text-[11px] text-indigo-300 mt-0.5">
                  উত্তোলিত: ৳{formatCurrency(summary.investor_total_withdrawn_profit)} | অপুনরুদ্ধৃত: ৳{formatCurrency(summary.investor_unwithdrawn_profit)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INVESTOR BY INVESTOR BREAKDOWN */}
      {(activeTab === "investors" || activeTab === "overview") && (
        <div className={`bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden ${activeTab === "overview" ? "print:block" : ""}`}>
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                ইনভেস্টরভিত্তিক চূড়ান্ত সেটেলমেন্ট শিট
              </h3>
              <p className="text-xs text-slate-500">
                কার কত টাকা মূলধন, অক্টোবর মাসের লাভ এবং চূড়ান্ত দাবি
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 bg-slate-100 text-slate-700 rounded-full">
              মোট: {filteredInvestors.length} জন ইনভেস্টর
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-semibold text-[11px]">
                  <th className="py-3 px-4">আইডি ও ইনভেস্টর</th>
                  <th className="py-3 px-4">মোবাইল</th>
                  <th className="py-3 px-4 text-center">কার্ড</th>
                  <th className="py-3 px-4 text-right">আসল মূলধন</th>
                  <th className="py-3 px-4 text-right">অক্টোবর ২০২৬ লাভ</th>
                  <th className="py-3 px-4 text-right">লাইফটাইম লাভ</th>
                  <th className="py-3 px-4 text-right">উত্তোলিত</th>
                  <th className="py-3 px-4 text-right">বাকি লাভ</th>
                  <th className="py-3 px-4 text-right bg-indigo-50/60 text-indigo-900 font-bold">মোট পাওনা দাবি</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvestors.map((inv) => (
                  <tr key={inv.investor_id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{inv.investor_name}</p>
                      <p className="text-[10px] text-slate-400">ID: #{inv.investor_id}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{inv.investor_mobile || "-"}</td>
                    <td className="py-3 px-4 text-center font-medium">{inv.total_cards}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-800">
                      ৳{formatCurrency(inv.total_capital)}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-emerald-600">
                      ৳{formatCurrency(inv.oct_2026_profit)}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600">
                      ৳{formatCurrency(inv.total_all_time_profit)}
                    </td>
                    <td className="py-3 px-4 text-right text-rose-600">
                      ৳{formatCurrency(inv.total_withdrawn)}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-700">
                      ৳{formatCurrency(inv.unwithdrawn_profit)}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-indigo-700 bg-indigo-50/40">
                      ৳{formatCurrency(inv.total_settlement_claim)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: EXPENSE BREAKDOWN */}
      {activeTab === "expenses" && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 border-b pb-3">
            কোম্পানির অতীত পরিচালন খরচের খাতভিত্তিক হিসাব
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {expenseBreakdown.map((exp) => (
              <div key={exp.category} className="p-4 rounded-xl border border-slate-100 bg-slate-50 space-y-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{exp.category}</p>
                <p className="text-xl font-bold text-slate-900">৳{formatCurrency(exp.amount)}</p>
                <p className="text-[11px] text-slate-400">{exp.count} টি ভাউচার এন্ট্রি</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Audit Sign-off for Print */}
      <div className="hidden print:flex justify-between pt-16 text-center text-xs">
        <div className="w-48 border-t border-black pt-1">
          <p className="font-bold">মালিক / ব্যবস্থাপনা পরিচালক</p>
          <p className="text-[10px] text-gray-500">SupplyLink Bangladesh Ltd.</p>
        </div>
        <div className="w-48 border-t border-black pt-1">
          <p className="font-bold">প্রধান হিসাবরক্ষণ কর্মকর্তা</p>
          <p className="text-[10px] text-gray-500">Accounts & Audit Dept.</p>
        </div>
      </div>
    </div>
  );
};

export default CompanySettlement;
