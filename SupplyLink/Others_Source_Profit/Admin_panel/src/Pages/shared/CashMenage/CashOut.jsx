import React, { useState } from "react";
import useCashReports from "../../../utils/Hooks/cash/useCashReports";
import Loader from "../../../components/Loader/Loader";
import CashStateCard from "../../../components/cash/CashStateCard";
import CashOutModal from "../../../components/cash/CashOutModal";
import CashEditModal from "../../../components/cash/CashEditModal";
import LuxuryToast from "../../../components/Modal/LuxuryToast";
import {
  ArrowUpRight,
  Filter,
  Plus,
  RotateCcw,
  CheckCircle2,
  MessageSquare,
  X,
  Calendar,
  CalendarDays,
  Clock,
  ArrowRight,
  Banknote,
  Edit3,
} from "lucide-react";

const CashOut = () => {
  const { CashReports, isCashReportsError, isCashReportsLoading, refetch } =
    useCashReports();
  const [editingCash, setEditingCash] = useState(null);
  const [luxuryToast, setLuxuryToast] = useState(null);
  const [selectedDate, setSelectedDate] = React.useState("");
  const [selectedMonth, setSelectedMonth] = React.useState("");
  const [selectedYear, setSelectedYear] = React.useState("");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [selectedRemark, setSelectedRemark] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("");
  const [openCashOutModal, setOpenCashOutModal] = useState(false);
  const [priceRange, setPriceRange] = useState({
    min: "",
    max: "",
  });

  const normalCashOut = Array.isArray(CashReports)
    ? CashReports.filter(
        (cash) => cash.type === "out" && cash.approval_status === "approved"
      )
    : [];

  const AllCashOut = [...normalCashOut].sort((a, b) => {
    return new Date(b.date) - new Date(a.date);
  });

  const currentYear = new Date().getFullYear();
  const years = [];
  for (let year = 2025; year <= currentYear; year++) {
    years.push(year);
  }

  const DateFilteredCashOut = AllCashOut.filter((cash) => {
    const cashDate = new Date(cash.date);
    const cashYear = cashDate.getFullYear().toString();
    const cashMonth = `${cashDate.getFullYear()}-${String(
      cashDate.getMonth() + 1
    ).padStart(2, "0")}`;

    if (selectedDate && cash.date !== selectedDate) return false;
    if (selectedMonth && cashMonth !== selectedMonth) return false;
    if (selectedYear && cashYear !== selectedYear) return false;

    if (startDate) {
      const current = new Date(cash.date).getTime();
      const start = new Date(startDate).getTime();
      if (current < start) return false;
    }
    if (endDate) {
      const current = new Date(cash.date).getTime();
      const end = new Date(endDate).getTime();
      if (current > end) return false;
    }

    return true;
  });

  const FilteredCashOut = DateFilteredCashOut.filter((cash) => {
    if (selectedCategory) {
      if (selectedCategory === "others") {
        const knownCategories = [
          "salary",
          "purchase",
          "rent",
          "bill",
          "office-expense",
          "loan-repayment",
          "loan-given",
          "investor-payout",
          "profit-payout",
          "asset_purchase",
          "share_investment",
        ];
        if (knownCategories.includes(cash.category?.toLowerCase().trim())) {
          return false;
        }
      } else if (cash.category?.toLowerCase().trim() !== selectedCategory) {
        return false;
      }
    }
    const amount = Number(cash.amount);
    if (priceRange.min !== "" && !isNaN(priceRange.min) && amount < Number(priceRange.min)) {
      return false;
    }
    if (priceRange.max !== "" && !isNaN(priceRange.max) && amount > Number(priceRange.max)) {
      return false;
    }
    return true;
  });

  const SummaryCashOut = DateFilteredCashOut.filter((cash) => {
    const amount = Number(cash.amount);
    if (priceRange.min !== "" && !isNaN(priceRange.min) && amount < Number(priceRange.min)) {
      return false;
    }
    if (priceRange.max !== "" && !isNaN(priceRange.max) && amount > Number(priceRange.max)) {
      return false;
    }
    return true;
  });

  const totalCashOut = SummaryCashOut.reduce(
    (total, item) => total + Number(item.amount),
    0
  );

  const salaryTotal = SummaryCashOut.filter(
    (item) => item.category?.toLowerCase().trim() === "salary"
  ).reduce((sum, item) => sum + Number(item.amount), 0);

  const purchaseTotal = SummaryCashOut.filter(
    (item) => item.category?.toLowerCase().trim() === "purchase"
  ).reduce((sum, item) => sum + Number(item.amount), 0);

  const rentTotal = SummaryCashOut.filter(
    (item) => item.category?.toLowerCase().trim() === "rent"
  ).reduce((sum, item) => sum + Number(item.amount), 0);

  const billTotal = SummaryCashOut.filter(
    (item) => item.category?.toLowerCase().trim() === "bill"
  ).reduce((sum, item) => sum + Number(item.amount), 0);

  const officeExpenseTotal = SummaryCashOut.filter(
    (item) => item.category?.toLowerCase().trim() === "office-expense"
  ).reduce((sum, item) => sum + Number(item.amount), 0);

  const loanRepaymentTotal = SummaryCashOut.filter(
    (item) => item.category?.toLowerCase().trim() === "loan-repayment"
  ).reduce((sum, item) => sum + Number(item.amount), 0);

  const investorPayoutTotal = SummaryCashOut.filter(
    (item) => item.category?.toLowerCase().trim() === "investor-payout"
  ).reduce((sum, item) => sum + Number(item.amount), 0);

  const profitPayoutTotal = SummaryCashOut.filter(
    (item) => item.category?.toLowerCase().trim() === "profit-payout"
  ).reduce((sum, item) => sum + Number(item.amount), 0);

  const loanGivenTotal = SummaryCashOut.filter(
    (item) => item.category?.trim() === "loan-given"
  ).reduce((sum, item) => sum + Number(item.amount), 0);

  const assetPurchaseTotal = SummaryCashOut.filter(
    (item) => item.category?.toLowerCase().trim() === "asset_purchase"
  ).reduce((sum, item) => sum + Number(item.amount), 0);

  const shareInvestmentTotal = SummaryCashOut.filter(
    (item) => item.category?.toLowerCase().trim() === "share_investment"
  ).reduce((sum, item) => sum + Number(item.amount), 0);

  const otherTotal = SummaryCashOut.filter(
    (item) =>
      ![
        "salary",
        "purchase",
        "rent",
        "bill",
        "office-expense",
        "loan-repayment",
        "loan-given",
        "investor-payout",
        "profit-payout",
        "asset_purchase",
        "share_investment",
      ].includes(item.category?.toLowerCase().trim())
  ).reduce((sum, item) => sum + Number(item.amount), 0);

  const categoryName = (category) => {
    switch (category?.toLowerCase().trim()) {
      case "salary":
        return "বেতন";
      case "purchase":
        return "কেনাকাটা";
      case "rent":
        return "ভাড়া";
      case "bill":
        return "বিল";
      case "office-expense":
        return "অফিস খরচ";
      case "loan-repayment":
        return "লোন পরিশোধ";
      case "investor-payout":
        return "ইনভেস্টর পেআউট";
      case "profit-payout":
        return "প্রফিট পেআউট";
      case "loan-given":
        return "লোন প্রদান";
      case "asset_purchase":
        return "অ্যাসেট ক্রয়";
      case "share_investment":
        return "শেয়ার বিনিয়োগ";
      default:
        return "অন্যান্য";
    }
  };

  const categoryStyle = (category) => {
    switch (category?.toLowerCase().trim()) {
      case "salary":
        return "bg-blue-500/15 text-blue-400 border border-blue-500/30";
      case "purchase":
        return "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30";
      case "rent":
        return "bg-amber-500/15 text-amber-400 border border-amber-500/30";
      case "bill":
        return "bg-rose-500/15 text-rose-400 border border-rose-500/30";
      case "office-expense":
        return "bg-purple-500/15 text-purple-400 border border-purple-500/30";
      case "loan-repayment":
        return "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30";
      case "investor-payout":
        return "bg-orange-500/15 text-orange-400 border border-orange-500/30";
      case "profit-payout":
        return "bg-teal-500/15 text-teal-400 border border-teal-500/30";
      case "loan-given":
        return "bg-pink-500/15 text-pink-400 border border-pink-500/30";
      case "asset_purchase":
        return "bg-sky-500/15 text-sky-400 border border-sky-500/30";
      case "share_investment":
        return "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30";
      default:
        return "bg-slate-500/15 text-slate-300 border border-slate-500/30";
    }
  };

  if (isCashReportsLoading || isCashReportsError) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#060a14]">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white space-y-6 max-w-[1600px] mx-auto pb-10">
      {/* 🔹 Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-inner">
            <ArrowUpRight className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              ক্যাশ আউট হিসাব (Cash Out Report)
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              অনুমোদিত সকল ক্যাশ আউট ও খরচ সংক্রান্ত পূর্ণাঙ্গ তালিকা
            </p>
          </div>
        </div>

        {/* Add Cash Out button */}
        <button
          onClick={() => setOpenCashOutModal(true)}
          className="btn-danger self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>নতুন ক্যাশ আউট (Add Cash Out)</span>
        </button>
      </div>

      {/* 🔹 Filter Section Card (Crystal Clear & Intuitive) */}
      <div className="card-surface p-4 sm:p-5 rounded-2xl border border-white/[0.08] shadow-xl space-y-4">
        {/* Panel Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/15 border border-indigo-500/25 text-indigo-400 shadow-inner">
              <Filter className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                ফিল্টার অপশন (Filter Criteria)
              </h3>
              <p className="text-[11px] text-slate-400">
                নির্দিষ্ট তারিখ বা শুরু-শেষ তারিখের পরিসীমা এবং টাকার রেঞ্জ অনুযায়ী ফিল্টার করুন
              </p>
            </div>
          </div>

          {/* Reset Button */}
          {(selectedDate || selectedMonth || selectedYear || startDate || endDate || priceRange.min || priceRange.max || selectedCategory) && (
            <button
              onClick={() => {
                setSelectedDate("");
                setSelectedMonth("");
                setSelectedYear("");
                setStartDate("");
                setEndDate("");
                setSelectedCategory("");
                setPriceRange({ min: "", max: "" });
              }}
              className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 hover:border-rose-500/50 transition-all active:scale-95 shadow-sm"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>ফিল্টার ক্লিয়ার করুন</span>
            </button>
          )}
        </div>

        {/* 6-Column Responsive Filter Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
          {/* 1. নির্দিষ্ট দিন */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
              <Calendar className="h-3.5 w-3.5 text-indigo-400" />
              <span>নির্দিষ্ট দিন</span>
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                if (e.target.value) {
                  setSelectedMonth("");
                  setSelectedYear("");
                  setStartDate("");
                  setEndDate("");
                }
              }}
              className="w-full rounded-xl border border-white/[0.08] bg-[#070d1c] px-3 py-2 text-base text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
            />
          </div>

          {/* 2. মাস নির্বাচন */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
              <CalendarDays className="h-3.5 w-3.5 text-indigo-400" />
              <span>মাস নির্বাচন</span>
            </label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                if (e.target.value) {
                  setSelectedDate("");
                  setSelectedYear("");
                  setStartDate("");
                  setEndDate("");
                }
              }}
              className="w-full rounded-xl border border-white/[0.08] bg-[#070d1c] px-3 py-2 text-base text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
            />
          </div>

          {/* 3. বছর নির্বাচন */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
              <Clock className="h-3.5 w-3.5 text-indigo-400" />
              <span>বছর নির্বাচন</span>
            </label>
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                if (e.target.value) {
                  setSelectedDate("");
                  setSelectedMonth("");
                  setStartDate("");
                  setEndDate("");
                }
              }}
              className="w-full rounded-xl border border-white/[0.08] bg-[#070d1c] px-3 py-2 text-base text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            >
              <option value="" className="bg-[#0b1220] text-slate-300">সকল বছর</option>
              {years.map((y) => (
                <option key={y} value={y} className="bg-[#0b1220] text-white">
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* 4. তারিখ পরিসীমা (শুরুর তারিখ) */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
              <ArrowRight className="h-3.5 w-3.5" />
              <span>শুরুর তারিখ (From)</span>
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                if (e.target.value) {
                  setSelectedDate("");
                  setSelectedMonth("");
                  setSelectedYear("");
                }
              }}
              className="w-full rounded-xl border border-emerald-500/30 bg-[#070d1c] px-3 py-2 text-base text-white outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all font-mono"
            />
          </div>

          {/* 5. তারিখ পরিসীমা (শেষ তারিখ) */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
              <ArrowRight className="h-3.5 w-3.5" />
              <span>শেষ তারিখ (To)</span>
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                if (e.target.value) {
                  setSelectedDate("");
                  setSelectedMonth("");
                  setSelectedYear("");
                }
              }}
              className="w-full rounded-xl border border-emerald-500/30 bg-[#070d1c] px-3 py-2 text-base text-white outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all font-mono"
            />
          </div>

          {/* 6. টাকার রেঞ্জ (Min - Max ৳) */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
              <Banknote className="h-3.5 w-3.5" />
              <span>টাকার রেঞ্জ (Min - Max ৳)</span>
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                placeholder="Min ৳"
                value={priceRange.min}
                onChange={(e) => setPriceRange((prev) => ({ ...prev, min: e.target.value }))}
                className="w-1/2 rounded-xl border border-amber-500/30 bg-[#070d1c] px-2.5 py-2 text-base text-white outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 font-mono text-center placeholder-slate-600"
              />
              <span className="text-slate-500 text-xs">-</span>
              <input
                type="number"
                placeholder="Max ৳"
                value={priceRange.max}
                onChange={(e) => setPriceRange((prev) => ({ ...prev, max: e.target.value }))}
                className="w-1/2 rounded-xl border border-amber-500/30 bg-[#070d1c] px-2.5 py-2 text-base text-white outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 font-mono text-center placeholder-slate-600"
              />
            </div>
          </div>
        </div>

        {/* Active Filters Pill Bar (shows only when a filter is applied) */}
        {(selectedDate || selectedMonth || selectedYear || startDate || endDate || priceRange.min || priceRange.max || selectedCategory) && (
          <div className="flex flex-wrap items-center gap-2 pt-2.5 border-t border-white/[0.06]">
            <span className="text-[11px] font-semibold text-slate-400">সক্রিয় ফিল্টার:</span>
            {selectedDate && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-mono">
                দিন: {selectedDate}
                <button onClick={() => setSelectedDate("")} className="hover:text-white"><X className="h-3 w-3" /></button>
              </span>
            )}
            {selectedMonth && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-mono">
                মাস: {selectedMonth}
                <button onClick={() => setSelectedMonth("")} className="hover:text-white"><X className="h-3 w-3" /></button>
              </span>
            )}
            {selectedYear && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-mono">
                বছর: {selectedYear}
                <button onClick={() => setSelectedYear("")} className="hover:text-white"><X className="h-3 w-3" /></button>
              </span>
            )}
            {(startDate || endDate) && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
                পরিসীমা: {startDate || "শুরু"} থেকে {endDate || "বর্তমান"}
                <button onClick={() => { setStartDate(""); setEndDate(""); }} className="hover:text-white"><X className="h-3 w-3" /></button>
              </span>
            )}
            {(priceRange.min || priceRange.max) && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono">
                টাকা: ৳{priceRange.min || 0} - ৳{priceRange.max || "সর্বোচ্চ"}
                <button onClick={() => setPriceRange({ min: "", max: "" })} className="hover:text-white"><X className="h-3 w-3" /></button>
              </span>
            )}
            {selectedCategory && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs">
                ক্যাটাগরি: {categoryName(selectedCategory)}
                <button onClick={() => setSelectedCategory("")} className="hover:text-white"><X className="h-3 w-3" /></button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* 🔹 Category KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3 md:gap-3.5">
        <CashStateCard
          title="Total Cash Out"
          amount={totalCashOut}
          icon="💸"
          text="text-rose-400"
          onClick={() => setSelectedCategory("")}
        />
        <CashStateCard
          title="Transactions"
          amount={FilteredCashOut.length}
          icon="📊"
          text="text-cyan-400"
          onClick={() => setSelectedCategory("")}
        />
        <CashStateCard
          title="Salary"
          amount={salaryTotal}
          icon="👨‍💼"
          text="text-blue-400"
          onClick={() => setSelectedCategory("salary")}
        />
        <CashStateCard
          title="Purchase"
          amount={purchaseTotal}
          icon="🛒"
          text="text-emerald-400"
          onClick={() => setSelectedCategory("purchase")}
        />
        <CashStateCard
          title="Rent"
          amount={rentTotal}
          icon="🏠"
          text="text-amber-400"
          onClick={() => setSelectedCategory("rent")}
        />
        <CashStateCard
          title="Bill"
          amount={billTotal}
          icon="⚡"
          text="text-rose-400"
          onClick={() => setSelectedCategory("bill")}
        />
        <CashStateCard
          title="Office Expenses"
          amount={officeExpenseTotal}
          icon="🏢"
          text="text-purple-400"
          onClick={() => setSelectedCategory("office-expense")}
        />
        <CashStateCard
          title="Loan Given"
          amount={loanGivenTotal}
          icon="🤝"
          text="text-pink-400"
          onClick={() => setSelectedCategory("loan-given")}
        />
        <CashStateCard
          title="Loan Repayment"
          amount={loanRepaymentTotal}
          icon="💳"
          text="text-cyan-400"
          onClick={() => setSelectedCategory("loan-repayment")}
        />
        <CashStateCard
          title="Investor Payout"
          amount={investorPayoutTotal}
          icon="💼"
          text="text-orange-400"
          onClick={() => setSelectedCategory("investor-payout")}
        />
        <CashStateCard
          title="Profit Payout"
          amount={profitPayoutTotal}
          icon="📈"
          text="text-teal-400"
          onClick={() => setSelectedCategory("profit-payout")}
        />
        <CashStateCard
          title="Asset Purchase"
          amount={assetPurchaseTotal}
          icon="🚜"
          text="text-sky-400"
          onClick={() => setSelectedCategory("asset_purchase")}
        />
        <CashStateCard
          title="Share Investment"
          amount={shareInvestmentTotal}
          icon="💎"
          text="text-indigo-400"
          onClick={() => setSelectedCategory("share_investment")}
        />
        <CashStateCard
          title="Others"
          amount={otherTotal}
          icon="📦"
          text="text-slate-400"
          onClick={() => setSelectedCategory("others")}
        />
      </div>

      {/* 🔹 Table Section */}
      <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0c1426]/75 shadow-xl backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4 bg-slate-900/60">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              ক্যাশ আউট লেনদেন তালিকা
            </h2>
            <p className="text-xs text-slate-400">
              মোট {FilteredCashOut.length} টি ক্যাশ আউট রেকর্ড
            </p>
          </div>
          <span className="font-mono text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-full">
            ফিল্টারকৃত মোট: ৳ {totalCashOut.toLocaleString()}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-300">
            <thead className="border-b border-white/[0.08] bg-slate-900/80 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-5 py-3.5 text-center w-12">#</th>
                <th className="px-5 py-3.5">উদ্দেশ্য (Purpose)</th>
                <th className="px-5 py-3.5">ক্যাটাগরি</th>
                <th className="px-5 py-3.5 text-right">টাকার পরিমাণ</th>
                <th className="px-5 py-3.5">মন্তব্য (Remarks)</th>
                <th className="px-5 py-3.5 text-center">তারিখ</th>
                <th className="px-5 py-3.5 text-center">অ্যাকশন</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/[0.06]">
              {FilteredCashOut.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-center">
                      <CheckCircle2 className="h-8 w-8 text-rose-400 mb-2 opacity-80" />
                      <p className="text-sm font-medium text-slate-300">কোনো ক্যাশ আউট লেনদেন পাওয়া যায়নি</p>
                      <p className="text-xs text-slate-500">অন্য ফিল্টার বা তারিখ দিয়ে চেষ্টা করুন</p>
                    </div>
                  </td>
                </tr>
              ) : (
                FilteredCashOut.map((cash, index) => {
                  const hasPendingEdit = !!cash.pending_edit_id;

                  return (
                    <tr
                      key={cash.id}
                      className="transition-colors hover:bg-white/[0.03]"
                    >
                      <td className="px-5 py-3.5 text-center text-xs font-medium text-slate-500">
                        {FilteredCashOut.length - index}
                      </td>

                      <td className="px-5 py-3.5 font-medium text-white">
                        <div className="flex flex-col">
                          <span>{cash.purpose || "N/A"}</span>
                          {hasPendingEdit && (
                            <span className="mt-1 inline-flex w-fit items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                              ⏳ সংশোধনাধীন (প্রস্তাবিত: ৳{Number(cash.pending_new_amount || 0).toLocaleString()})
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${categoryStyle(
                            cash.category
                          )}`}
                        >
                          {categoryName(cash.category)}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <span className="font-mono text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-full">
                          ৳ {Number(cash.amount).toLocaleString()}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 max-w-[200px]">
                        {cash.remarks ? (
                          <p
                            onClick={() => setSelectedRemark(cash.remarks)}
                            className="truncate text-xs text-slate-300 hover:text-indigo-400 cursor-pointer transition flex items-center gap-1"
                            title="বিস্তারিত দেখতে ক্লিক করুন"
                          >
                            <MessageSquare className="h-3 w-3 shrink-0 opacity-60" />
                            <span className="truncate">{cash.remarks}</span>
                          </p>
                        ) : (
                          <span className="text-slate-600 text-xs">—</span>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-center font-mono text-xs text-slate-400">
                        {cash.date}
                      </td>

                      <td className="px-5 py-3.5 text-center">
                        <button
                          onClick={() => setEditingCash(cash)}
                          className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-300 transition hover:border-amber-500/40 hover:bg-amber-500/10 hover:text-amber-300 cursor-pointer"
                          title="সংশোধনের অনুরোধ পাঠান"
                        >
                          <Edit3 className="h-3 w-3" />
                          <span>সংশোধন</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Remarks Modal Popup */}
      {selectedRemark && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl p-5">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-indigo-400" />
                <span>মন্তব্য (Remarks)</span>
              </h3>
              <button
                onClick={() => setSelectedRemark("")}
                className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-3 text-sm text-slate-300 leading-relaxed break-words">
              {selectedRemark}
            </p>
          </div>
        </div>
      )}

      <CashOutModal
        openCashOutModal={openCashOutModal}
        onClose={() => setOpenCashOutModal(false)}
        onSuccess={(toastPayload) => {
          refetch();
          if (toastPayload) {
            setLuxuryToast(toastPayload);
          }
        }}
      />

      <CashEditModal
        isOpen={!!editingCash}
        cashItem={editingCash}
        onClose={() => setEditingCash(null)}
        onSuccess={(toastPayload) => {
          refetch();
          if (toastPayload) {
            setLuxuryToast(toastPayload);
          }
        }}
      />

      <LuxuryToast toast={luxuryToast} onClose={() => setLuxuryToast(null)} duration={4500} />
    </div>
  );
};

export default CashOut;
