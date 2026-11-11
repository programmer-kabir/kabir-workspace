import React from "react";
import ChartCard from "./ChartCard";
import { Calendar } from "lucide-react";

const DashboardChart = ({
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  handlePreset,
  salesChart,
  installmentChart,
  investmentChart,
  dailyInstallmentChart,
  expenseChart,
  activePreset,
  setActivePreset,
}) => {
  const buttons = [
    { label: "7D", value: "7d" },
    { label: "30D", value: "30d" },
    { label: "Month", value: "month" },
    { label: "Year", value: "year" },
  ];

  return (
    <div className="mt-8">
      {/* Date Range & Preset Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/[0.08] bg-[#0c1426]/60 p-4 backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <Calendar className="h-4 w-4 text-indigo-400" />
            <span>তারিখ পরিসীমা:</span>
          </div>

          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setActivePreset("");
            }}
            className="rounded-xl border border-white/10 bg-[#060a14] px-3.5 py-2 text-xs font-medium text-white outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 date-fix"
          />

          <span className="text-slate-500 text-xs">থেকে</span>

          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setActivePreset("");
            }}
            className="rounded-xl border border-white/10 bg-[#060a14] px-3.5 py-2 text-xs font-medium text-white outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 date-fix"
          />
        </div>

        {/* Preset Pills */}
        <div className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-[#060a14] p-1">
          {buttons.map((btn) => {
            const isActive = activePreset === btn.value;
            return (
              <button
                key={btn.value}
                onClick={() => handlePreset(btn.value)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/25 scale-105"
                    : "text-slate-400 hover:text-white hover:bg-white/[0.05]"
                }`}
              >
                {btn.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 🔹 CHARTS GRID */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <ChartCard title="Sales Trend (বিক্রয় চার্ট)" data={salesChart} />
        <ChartCard title="Installments Trend (কিস্তি চার্ট)" data={installmentChart} />
        <ChartCard title="Investment Trend (বিনিয়োগ চার্ট)" data={investmentChart} />
        <ChartCard
          title="Daily Installments Trend (দৈনিক কিস্তি)"
          data={dailyInstallmentChart}
        />
        <ChartCard title="Expense Trend (কোম্পানি ব্যয়)" data={expenseChart} />
      </div>
    </div>
  );
};

export default DashboardChart;
