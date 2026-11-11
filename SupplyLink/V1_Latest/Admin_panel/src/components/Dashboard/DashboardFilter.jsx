import React from "react";
import { Filter, RotateCcw, Calendar } from "lucide-react";

const DashboardFilter = ({
  filterType,
  setFilterType,
  selectedDate,
  setSelectedDate,
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
  yearOptions = [],
}) => {
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-[#0c1426]/75 p-4 backdrop-blur-xl shadow-lg">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 pr-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <Filter className="h-4 w-4 text-indigo-400" />
          <span>ফিল্টার:</span>
        </div>

        {/* Filter Type Selector */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="rounded-xl border border-white/10 bg-[#060a14] px-3.5 py-2 text-xs font-medium text-white outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        >
          <option value="daily">Daily (দৈনিক)</option>
          <option value="monthly">Monthly (মাসিক)</option>
          <option value="yearly">Yearly (বাৎসরিক)</option>
        </select>

        {/* DATE PICKER */}
        {filterType === "daily" && (
          <div className="relative">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-xl border border-white/10 bg-[#060a14] px-3.5 py-2 text-xs font-medium text-white outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 date-fix"
            />
          </div>
        )}

        {/* MONTH PICKER */}
        {filterType === "monthly" && (
          <div className="relative">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="rounded-xl border border-white/10 bg-[#060a14] px-3.5 py-2 text-xs font-medium text-white outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 date-fix"
            />
          </div>
        )}

        {/* YEAR PICKER */}
        {filterType === "yearly" && (
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="rounded-xl border border-white/10 bg-[#060a14] px-3.5 py-2 text-xs font-medium text-white outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">বছর সিলেক্ট করুন</option>
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* RESET BUTTON */}
      <button
        onClick={() => {
          setSelectedDate(today);
          setSelectedMonth("");
          setSelectedYear("");
          setFilterType("daily");
        }}
        className="flex items-center gap-1.5 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3.5 py-2 text-xs font-semibold text-rose-400 transition hover:bg-rose-500/20 hover:text-rose-300 active:scale-95"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        <span>রিসেট (Reset)</span>
      </button>
    </div>
  );
};

export default DashboardFilter;
