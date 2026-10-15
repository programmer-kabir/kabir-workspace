import React from "react";

const DashboardFilter = ({
  filterType,
  setFilterType,
  selectedDate,
  setSelectedDate,
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
  yearOptions,
}) => {
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="bg-[#0f172a] p-4 rounded-xl border border-gray-800 mb-5 flex flex-wrap gap-3 items-center">
      <select
        value={filterType}
        onChange={(e) => setFilterType(e.target.value)}
        className="px-3 py-2 bg-[#020617] border border-gray-700 rounded "
      >
        <option value="daily">Daily</option>
        <option value="monthly">Monthly</option>
        <option value="yearly">Yearly</option>
      </select>

      {/* DATE */}
      {filterType === "daily" && (
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-3 py-2 bg-[#020617] border border-gray-700 rounded date-fix"
        />
      )}

      {/* MONTH */}
      {filterType === "monthly" && (
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="px-3 py-2 bg-[#020617] border border-gray-700 rounded date-fix"
        />
      )}

      {/* YEAR */}
      {filterType === "yearly" && (
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="px-3 py-2 bg-[#020617] border border-gray-700 rounded"
        >
          <option value="">Select Year</option>
          {yearOptions.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      )}

      {/* RESET */}
      <button
        onClick={() => {
          setSelectedDate(today);
          setSelectedMonth("");
          setSelectedYear("");
          setFilterType("daily");
        }}
        className="px-4 py-2 bg-red-500/20 text-red-400 rounded"
      >
        Reset
      </button>
    </div>
  );
};

export default DashboardFilter;
