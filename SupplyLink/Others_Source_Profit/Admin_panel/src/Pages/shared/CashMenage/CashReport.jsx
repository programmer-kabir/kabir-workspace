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
import {
  Filter,
  RotateCcw,
  Printer,
  ArrowDownLeft,
  ArrowUpRight,
  Scale,
  Wallet,
  Calendar,
  CalendarDays,
  Clock,
  ArrowRight,
  X,
} from "lucide-react";

const CashReport = () => {
  const [selectedDate, setSelectedDate] = React.useState("");
  const [selectedMonth, setSelectedMonth] = React.useState("");
  const [selectedYear, setSelectedYear] = React.useState("");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");

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
  // Month filter
  if (selectedMonth) {
    const endOfMonth = new Date(selectedMonth + "-01");
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);

    const cashIn = AllCashIn
      .filter(item => new Date(item.date) < endOfMonth)
      .reduce((sum, item) => sum + Number(item.amount), 0);

    const cashOut = AllCashOut
      .filter(item => new Date(item.date) < endOfMonth)
      .reduce((sum, item) => sum + Number(item.amount), 0);

    return cashIn - cashOut;
  }

  // Year filter
  if (selectedYear) {
    const endOfYear = new Date(
      Number(selectedYear) + 1,
      0,
      1
    );

    const cashIn = AllCashIn
      .filter(item => new Date(item.date) < endOfYear)
      .reduce((sum, item) => sum + Number(item.amount), 0);

    const cashOut = AllCashOut
      .filter(item => new Date(item.date) < endOfYear)
      .reduce((sum, item) => sum + Number(item.amount), 0);

    return cashIn - cashOut;
  }

  // No filter
  const cashIn = AllCashIn.reduce(
    (sum, item) => sum + Number(item.amount),
    0
  );

  const cashOut = AllCashOut.reduce(
    (sum, item) => sum + Number(item.amount),
    0
  );

  return cashIn - cashOut;
})();
  
  const totalBalance = totalCashIn - totalCashOut;

const chartData = selectedYear

  // ✅ YEAR FILTER MODE
  ? MONTHS.map((m, index) => {

      const month = index;

      const monthlyCashIn =
        FilteredCashIn.filter((item) => {

          const itemDate =
            new Date(item.date);

          return (
            itemDate.getMonth() === month &&
            itemDate.getFullYear() === Number(selectedYear)
          );

        }).reduce(
          (sum, item) =>
            sum + Number(item.amount),
          0
        );

      const monthlyCashOut =
        FilteredCashOut.filter((item) => {

          const itemDate =
            new Date(item.date);

          return (
            itemDate.getMonth() === month &&
            itemDate.getFullYear() === Number(selectedYear)
          );

        }).reduce(
          (sum, item) =>
            sum + Number(item.amount),
          0
        );

      return {
        name: m.label.slice(0, 3),
        cashIn: monthlyCashIn,
        cashOut: monthlyCashOut,
      };

    })

  // ✅ NORMAL MODE (LAST 12 MONTHS)
  : Array.from({ length: 12 }, (_, index) => {

      const date = new Date();

      date.setMonth(
        date.getMonth() - (11 - index)
      );

      const month =
        date.getMonth();

      const year =
        date.getFullYear();

      const monthlyCashIn =
        FilteredCashIn.filter((item) => {

          const itemDate =
            new Date(item.date);

          return (
            itemDate.getMonth() === month &&
            itemDate.getFullYear() === year
          );

        }).reduce(
          (sum, item) =>
            sum + Number(item.amount),
          0
        );

      const monthlyCashOut =
        FilteredCashOut.filter((item) => {

          const itemDate =
            new Date(item.date);

          return (
            itemDate.getMonth() === month &&
            itemDate.getFullYear() === year
          );

        }).reduce(
          (sum, item) =>
            sum + Number(item.amount),
          0
        );

      return {
        name: MONTHS[month].label.slice(0, 3),
        cashIn: monthlyCashIn,
        cashOut: monthlyCashOut,
      };

    });
  // pie data
  const pieData = [
    {
      name: "Cash In",
      value: totalCashIn,
    },
    {
      name: "Cash Out",
      value: totalCashOut,
    },
  ];

  const COLORS = ["#22c55e", "#ef4444"];

  if (isCashReportsLoading || isCashReportsError)
    return (
      <div className="h-screen flex items-center justify-center bg-[#0f172a]">
        <Loader />
      </div>
    );

  return (
    <div className="space-y-5 min-h-screen text-white">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shadow-inner">
            <Scale className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              ক্যাশ রিপোর্ট (Cash Overview & Reports)
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              সামগ্রিক নগদ প্রবাহ, আয়-ব্যয় অনুপাত ও আর্থিক বিশ্লেষণের পূর্ণাঙ্গ ড্যাশবোর্ড
            </p>
          </div>
        </div>

        <button
          onClick={() => window.print()}
          className="btn-secondary self-start sm:self-auto gap-2 text-xs"
        >
          <Printer className="h-4 w-4 text-indigo-400" />
          <span>প্রিন্ট রিপোর্ট (Print)</span>
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
                নির্দিষ্ট দিন, মাস, বছর অথবা তারিখ পরিসীমা (শুরু - শেষ) অনুযায়ী রিপোর্ট দেখুন
              </p>
            </div>
          </div>

          {/* Reset Button */}
          {(selectedDate || selectedMonth || selectedYear || startDate || endDate) && (
            <button
              onClick={() => {
                setSelectedDate("");
                setSelectedMonth("");
                setSelectedYear("");
                setStartDate("");
                setEndDate("");
              }}
              className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 hover:border-rose-500/50 transition-all active:scale-95 shadow-sm"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>ফিল্টার ক্লিয়ার করুন</span>
            </button>
          )}
        </div>

        {/* 5-Column Responsive Filter Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5">
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
        </div>

        {/* Active Filters Pill Bar (shows only when a filter is applied) */}
        {(selectedDate || selectedMonth || selectedYear || startDate || endDate) && (
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
          </div>
        )}
      </div>

      {/* 🔹 Top Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cash In */}
        <div className="card-surface p-5 hover:-translate-y-0.5 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-400 tracking-wide uppercase">মোট ক্যাশ ইন (In)</p>
              <h2 className="text-2xl lg:text-3xl font-black text-white mt-1.5 font-mono">
                ৳ {totalCashIn.toLocaleString()}
              </h2>
              <p className="text-[11px] text-slate-400 mt-1">
                {FilteredCashIn.length} টি অনুমোদিত লেনদেন
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ArrowDownLeft className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Cash Out */}
        <div className="card-surface p-5 hover:-translate-y-0.5 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-rose-400 tracking-wide uppercase">মোট ক্যাশ আউট (Out)</p>
              <h2 className="text-2xl lg:text-3xl font-black text-white mt-1.5 font-mono">
                ৳ {totalCashOut.toLocaleString()}
              </h2>
              <p className="text-[11px] text-slate-400 mt-1">
                {FilteredCashOut.length} টি অনুমোদিত লেনদেন
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <ArrowUpRight className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Net Cash Flow */}
        <div className="card-surface p-5 hover:-translate-y-0.5 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-amber-400 tracking-wide uppercase">নেট ক্যাশ ফ্লো</p>
              <h2 className={`text-2xl lg:text-3xl font-black mt-1.5 font-mono ${totalBalance >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                ৳ {totalBalance.toLocaleString()}
              </h2>
              <p className="text-[11px] text-slate-400 mt-1">
                আয় - ব্যয় ব্যবধান
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Scale className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Current Balance */}
        <div className="card-surface p-5 hover:-translate-y-0.5 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-cyan-400 tracking-wide uppercase">বর্তমান ব্যালেন্স</p>
              <h2 className="text-2xl lg:text-3xl font-black text-white mt-1.5 font-mono">
                ৳ {currentBalance.toLocaleString()}
              </h2>
              <p className="text-[11px] text-slate-400 mt-1">
                মোট ট্রানজেকশন: {FilteredCashIn.length + FilteredCashOut.length} টি
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Wallet className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>
      {/* bar chart */}
      <ChartCashReports chartData={chartData} />

      {/* charts */}
      <div className="">
        {/* yearly summary */}
        {/* header */}
        {!selectedMonth &&
          !selectedYear &&
          !startDate &&
          !endDate &&
          !selectedDate && (
            <div className="bg-[#131c31] border border-[#1d2942] rounded-3xl p-5">
              <YearCashReport
                years={years}
                AllCashIn={AllCashIn}
                AllCashOut={AllCashOut}
                totalCashIn={totalCashIn}
                totalCashOut={totalCashOut}
                totalBalance={totalBalance}
              />
            </div>
          )}

        {/* pie chart */}
        <div className="bg-[#131c31] border border-[#1d2942] rounded-3xl p-5">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-white">Cash Distribution</h2>

            <p className="text-sm text-gray-400 mt-1">আয় বনাম ব্যয়</p>
          </div>

          <div className="h-[380px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>

                <Tooltip />

                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashReport;
