import React from "react";
import useCashReports from "../../../utils/Hooks/cash/useCashReports";
import Loader from "../../../components/Loader/Loader";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import { MONTHS } from "../../../../public/month";
import ChartCashReports from "../../../components/cash/ChartCashReports";
import YearCashReport from "../../../components/cash/YearCashReport";
import { Link } from "react-router-dom";
import {
  Printer,
  Filter,
  RotateCcw,
  Calendar,
  CalendarDays,
  Clock,
  ArrowRight,
  ArrowLeft,
  X,
  Layers,
  ShoppingBag,
  TrendingDown,
  Receipt,
} from "lucide-react";

const CashReportPrint = () => {
  const [selectedDate, setSelectedDate] = React.useState("");
  const [selectedMonth, setSelectedMonth] = React.useState("");
  const [selectedYear, setSelectedYear] = React.useState("");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [filterType, setFilterType] = React.useState("all");

  const { CashReports, isCashReportsError, isCashReportsLoading } =
    useCashReports();

  // cash out
  const AllCashOut = Array.isArray(CashReports)
    ? CashReports.filter((cash) => cash.type === "out")
    : [];

  // cash in
  const AllCashIn = Array.isArray(CashReports)
    ? CashReports.filter((cash) => cash.type === "in")
    : [];

  // years
  const currentYear = new Date().getFullYear();

  const years = [];

  for (let year = 2025; year <= currentYear; year++) {
    years.push(year);
  }

  // filter function
  const filterData = (cash) => {
    const rawDate = String(cash.date || "").trim();
    const cashDateOnly = rawDate.split(" ")[0];
    const cashYear = cashDateOnly.split("-")[0];
    const cashMonth = cashDateOnly.slice(0, 7);

    // custom filters
    if (filterType === "expenses") {
      const source = (cash.source || cash.category || "").toLowerCase();
      if (!source.includes("company-expense")) {
        return false;
      }
    } else if (filterType === "purchases") {
      const source = (cash.source || cash.category || cash.details || cash.note || "").toLowerCase();
      if (!source.includes("purchase") && !source.includes("ক্রয়") && !source.includes("product")) {
        return false;
      }
    } else if (filterType === "exclude-expenses") {
      const source = (cash.source || cash.category || "").toLowerCase();
      if (source.includes("company-expense")) {
        return false;
      }
    }

    // single date
    if (selectedDate && cashDateOnly !== selectedDate) {
      return false;
    }

    // month
    if (selectedMonth && cashMonth !== selectedMonth) {
      return false;
    }

    // year
    if (selectedYear && cashYear !== selectedYear) {
      return false;
    }

    // range
    if (startDate && cashDateOnly < startDate) return false;
    if (endDate && cashDateOnly > endDate) return false;

    return true;
  };

  // filtered
  const FilteredCashIn = AllCashIn.filter(filterData);

  const FilteredCashOut = AllCashOut.filter(filterData);

  // totals
  const totalCashIn = FilteredCashIn.reduce(
    (sum, item) => sum + Number(item.amount),
    0,
  );

  const totalCashOut = FilteredCashOut.reduce(
    (sum, item) => sum + Number(item.amount),
    0,
  );

  const currentBalance = (() => {
    const BalanceCashIn = AllCashIn;
    const BalanceCashOut = filterType === "exclude-expenses"
      ? AllCashOut.filter(cash => {
          const source = (cash.source || cash.category || "").toLowerCase();
          return !source.includes("company-expense");
        })
      : AllCashOut;

    // Month filter
    if (selectedMonth) {
      const endOfMonth = new Date(selectedMonth + "-01");
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);

      const cashIn = BalanceCashIn.filter(
        (item) => new Date(item.date) < endOfMonth,
      ).reduce((sum, item) => sum + Number(item.amount), 0);

      const cashOut = BalanceCashOut.filter(
        (item) => new Date(item.date) < endOfMonth,
      ).reduce((sum, item) => sum + Number(item.amount), 0);

      return cashIn - cashOut;
    }

    // Year filter
    if (selectedYear) {
      const endOfYear = new Date(Number(selectedYear) + 1, 0, 1);

      const cashIn = BalanceCashIn.filter(
        (item) => new Date(item.date) < endOfYear,
      ).reduce((sum, item) => sum + Number(item.amount), 0);

      const cashOut = BalanceCashOut.filter(
        (item) => new Date(item.date) < endOfYear,
      ).reduce((sum, item) => sum + Number(item.amount), 0);

      return cashIn - cashOut;
    }

    // No filter
    const cashIn = BalanceCashIn.reduce(
      (sum, item) => sum + Number(item.amount),
      0,
    );

    const cashOut = BalanceCashOut.reduce(
      (sum, item) => sum + Number(item.amount),
      0,
    );

    return cashIn - cashOut;
  })();

  const totalBalance = totalCashIn - totalCashOut;

  const printTransactions = React.useMemo(() => {
    return [...FilteredCashIn, ...FilteredCashOut].sort(
      (a, b) => new Date(a.date) - new Date(b.date),
    );
  }, [FilteredCashIn, FilteredCashOut]);
  const COLORS = ["#22c55e", "#ef4444"];

  if (isCashReportsLoading || isCashReportsError)
    return (
      <div className="h-screen flex items-center justify-center bg-[#0f172a]">
        <Loader />
      </div>
    );

  return (
    <>
      <div className="p-4 md:p-6 font-sans text-slate-200 print-wrapper">
        <div className="mx-auto space-y-6">
          {/* Top Bar with Back and Print Action */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08] print:hidden">
            <div className="flex items-center gap-3">
              <Link
                to="/cash/cash_reports"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-slate-300 hover:text-white hover:bg-white/[0.08] text-xs font-semibold transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>রিপোর্টে ফিরুন</span>
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <Printer className="w-4 h-4" />
                  </div>
                  <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                    ক্যাশ রিপোর্ট প্রিন্ট ও প্রিভিউ
                  </h1>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  ফিল্টার সেট করুন এবং সহজেই সরাসরি প্রিন্ট বা PDF হিসেবে সংরক্ষণ করুন
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => window.print()}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98]"
              >
                <Printer className="w-4 h-4" />
                <span>প্রিন্ট করুন (Print Report)</span>
              </button>
            </div>
          </div>

          {/* Spacious Filter Card */}
          <div className="card-surface p-5 rounded-2xl print:hidden space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-semibold text-white">ফিল্টার সেটিংস</span>
                {(selectedMonth || selectedYear || startDate || endDate || filterType !== "all") && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/25">
                    ফিল্টার সক্রিয়
                  </span>
                )}
              </div>

              {(selectedMonth || selectedYear || startDate || endDate || filterType !== "all") && (
                <button
                  onClick={() => {
                    setSelectedDate("");
                    setSelectedMonth("");
                    setSelectedYear("");
                    setStartDate("");
                    setEndDate("");
                    setFilterType("all");
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>ফিল্টার রিসেট</span>
                </button>
              )}
            </div>

            {/* Inputs grid - comfortable and readable text */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-300 mb-1.5 block">
                  মাস নির্বাচন (Month)
                </label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-base text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 mb-1.5 block">
                  বছর নির্বাচন (Year)
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-base text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                >
                  <option value="">সকল বছর</option>
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 mb-1.5 block">
                  শুরুর তারিখ (From Date)
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-base text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 mb-1.5 block">
                  শেষ তারিখ (To Date)
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-base text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                />
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="pt-2 border-t border-white/[0.06] flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400 mr-1">রিপোর্ট টাইপ:</span>
              <button
                onClick={() => setFilterType("all")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition border ${
                  filterType === "all"
                    ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30"
                    : "bg-white/[0.03] text-slate-400 border-white/[0.08] hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                সকল রেকর্ড (All)
              </button>
              <button
                onClick={() => setFilterType("expenses")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition border ${
                  filterType === "expenses"
                    ? "bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-600/30"
                    : "bg-white/[0.03] text-slate-400 border-white/[0.08] hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                কোম্পানি খরচ
              </button>
              <button
                onClick={() => setFilterType("purchases")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition border ${
                  filterType === "purchases"
                    ? "bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-600/30"
                    : "bg-white/[0.03] text-slate-400 border-white/[0.08] hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                ক্রয় (Purchase)
              </button>
              <button
                onClick={() => setFilterType("exclude-expenses")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition border ${
                  filterType === "exclude-expenses"
                    ? "bg-teal-600 text-white border-teal-500 shadow-md shadow-teal-600/30"
                    : "bg-white/[0.03] text-slate-400 border-white/[0.08] hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                কোম্পানি খরচ ব্যতীত
              </button>
            </div>
          </div>

          {/* Report Preview Section with Print Classes */}
          <div className="text-center mb-8 print-header">
            <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 print-title">
              {filterType === "expenses"
                ? "কোম্পানি খরচ রিপোর্ট"
                : filterType === "purchases"
                ? "ক্রয় (Purchase) রিপোর্ট"
                : filterType === "exclude-expenses"
                ? "ক্যাশ রিপোর্ট (কোম্পানি খরচ ব্যতীত)"
                : "SupplyLink Cash Report"}
            </h1>

            <p className="text-base md:text-lg mt-2 text-slate-400 print-subtitle">
              {startDate && endDate
                ? `সময়সীমা: ${startDate} থেকে ${endDate}`
                : startDate
                ? `${startDate} এর পর থেকে`
                : endDate
                ? `${endDate} পর্যন্ত`
                : selectedMonth
                ? `মাসিক রিপোর্ট (${selectedMonth})`
                : selectedYear
                ? `বার্ষিক রিপোর্ট (${selectedYear})`
                : "সকল রিপোর্ট"}
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-3 print-summary-grid">
              {filterType === "expenses" || filterType === "purchases" ? (
                <>
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 min-w-[160px] shadow-lg print-stat-card">
                    <p className="text-xs text-slate-400 mb-1">
                      {filterType === "expenses" ? "Total Expenses" : "Total Purchase"}
                    </p>
                    <p className="text-2xl font-bold font-mono text-rose-400 print-stat-val">
                      ৳ {(totalCashOut + totalCashIn).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 min-w-[160px] shadow-lg print-stat-card">
                    <p className="text-xs text-slate-400 mb-1">Total Transactions</p>
                    <p className="text-2xl font-bold font-mono text-indigo-400 print-stat-val">
                      {FilteredCashIn.length + FilteredCashOut.length}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 min-w-[140px] shadow-lg print-stat-card">
                    <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider">Total Cash In</p>
                    <p className="text-xl font-bold font-mono text-emerald-400 print-stat-val">
                      ৳ {totalCashIn.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 min-w-[140px] shadow-lg print-stat-card">
                    <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider">Total Cash Out</p>
                    <p className="text-xl font-bold font-mono text-rose-400 print-stat-val">
                      ৳ {totalCashOut.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 min-w-[140px] shadow-lg print-stat-card">
                    <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider">Net Cash Flow</p>
                    <p
                      className={`text-xl font-bold font-mono print-stat-val ${
                        totalBalance >= 0 ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      ৳ {totalBalance.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 min-w-[140px] shadow-lg print-stat-card">
                    <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider">Current Balance</p>
                    <p className="text-xl font-bold font-mono text-indigo-400 print-stat-val">
                      ৳ {currentBalance.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 min-w-[140px] shadow-lg print-stat-card">
                    <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider">Transactions</p>
                    <p className="text-xl font-bold font-mono text-slate-200 print-stat-val">
                      {FilteredCashIn.length + FilteredCashOut.length}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Table with print-table-wrapper */}
          <div className="card-surface rounded-2xl overflow-hidden print-table-wrapper">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-white/[0.04] text-slate-300 uppercase text-xs tracking-wider border-b border-white/[0.08]">
                  <tr>
                    <th className="p-4 font-semibold">#</th>
                    <th className="p-4 font-semibold">তারিখ</th>
                    <th className="p-4 font-semibold">ধরণ</th>
                    <th className="p-4 font-semibold">বিবরণ / উৎস</th>
                    <th className="p-4 font-semibold">উদ্দেশ্য</th>
                    <th className="p-4 font-semibold">মন্তব্য</th>
                    <th className="p-4 font-semibold text-right">পরিমাণ</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/[0.05]">
                  {printTransactions.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-slate-500">
                        কোন লেনদেন পাওয়া যায়নি
                      </td>
                    </tr>
                  ) : (
                    printTransactions.map((item, index) => (
                      <tr
                        key={item.id || index}
                        className="hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="p-4 text-slate-400 font-mono">{index + 1}</td>
                        <td className="p-4 whitespace-nowrap text-slate-300 font-mono">
                          {item.date}
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                              item.type === "in"
                                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                                : "bg-rose-500/15 text-rose-400 border border-rose-500/20"
                            }`}
                          >
                            {item.type === "in" ? "Cash In" : "Cash Out"}
                          </span>
                        </td>
                        <td className="p-4 text-slate-200 font-medium">
                          {item.source ||
                            item.category ||
                            item.details ||
                            item.note ||
                            "-"}
                        </td>
                        <td className="p-4 text-slate-400">
                          {item.purpose || "-"}
                        </td>
                        <td className="p-4 text-slate-400">
                          {item.remarks || item.note || "-"}
                        </td>
                        <td className="p-4 text-right font-mono font-bold text-white">
                          ৳{Number(item.amount).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
<style>{`
@media print {
  @page {
    size: A4 portrait;
  }

  html, body, .print-wrapper {
    margin: 0 !important;
    padding: 0 !important;
    background: #ffffff !important;
    color: #1a1a1a !important;
    min-height: auto !important;
    height: auto !important;
  }

  .print-table-wrapper, .overflow-x-auto {
    overflow: visible !important;
    height: auto !important;
  }

  .print-header {
    text-align: center !important;
    margin-bottom: 30px !important;
  }

  .print-title {
    color: #000 !important;
    background: none !important;
    -webkit-text-fill-color: #000 !important;
    font-size: 24pt !important;
    margin-bottom: 5px !important;
  }

  .print-subtitle {
    color: #666 !important;
    font-size: 12pt !important;
  }

  .print-summary-grid {
    display: flex !important;
    flex-direction: row !important;
    flex-wrap: wrap !important;
    gap: 10px !important;
    justify-content: center !important;
    margin-top: 20px !important;
    margin-bottom: 30px !important;
  }

  .print-stat-card {
    border: 1px solid #ddd !important;
    background: #f9fafb !important;
    border-radius: 8px !important;
    padding: 12px 16px !important;
    box-shadow: none !important;
    min-width: 120px !important;
    text-align: center !important;
  }
  
  .print-stat-card p {
    color: #444 !important;
    margin: 0 0 4px 0 !important;
  }

  .print-stat-val {
    color: #000 !important;
    font-size: 14pt !important;
    font-weight: bold !important;
  }

  .print-table-wrapper {
    border: none !important;
    box-shadow: none !important;
    background: #fff !important;
    border-radius: 0 !important;
  }

  table {
    width: 100% !important;
    border-collapse: collapse !important;
    page-break-inside: auto !important;
  }

  thead {
    display: table-header-group !important;
  }

  tbody {
    page-break-inside: auto !important;
  }

  th {
    background-color: #f3f4f6 !important;
    color: #111827 !important;
    border: 1px solid #e5e7eb !important;
    padding: 10px !important;
    font-weight: bold !important;
    text-transform: uppercase !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }

  td {
    border: 1px solid #e5e7eb !important;
    padding: 8px 10px !important;
    color: #374151 !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }

  tr {
    page-break-inside: avoid !important;
    break-inside: avoid-page !important;
    -webkit-column-break-inside: avoid !important;
  }

  .page-break {
    page-break-before: always !important;
    border: none !important;
  }

  .text-emerald-400, .text-red-400, .text-slate-400, .text-blue-400, .text-slate-300 {
    color: inherit !important;
  }
}
`}</style>
    </>
  );
};

export default CashReportPrint;
