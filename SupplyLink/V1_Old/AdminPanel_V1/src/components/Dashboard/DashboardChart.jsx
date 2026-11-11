import React from "react";
import ChartCard from "./ChartCard";

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
setActivePreset
}) => {
const buttons = [
{ label: "7D", value: "7d", color: "green" },
{ label: "30D", value: "30d", color: "purple" },
{ label: "Month", value: "month", color: "orange" },
{ label: "Year", value: "year", color: "blue" },
];

return ( <div>
 <div className="flex flex-wrap items-center gap-4 pt-5 pb-7">

    <input
      type="date"
      value={startDate}
      onChange={(e) => {
setStartDate(e.target.value);
setActivePreset(""); // 🔥 important
}}
      className="px-3 py-2 bg-[#020617] border border-gray-700 rounded date-fix"
    />

    <input
      type="date"
      value={endDate}
     onChange={(e) => {
setEndDate(e.target.value);
setActivePreset(""); // 🔥 important
}}
      className="px-3 py-2 bg-[#020617] border border-gray-700 rounded date-fix"
    />

    <div className="flex gap-2 flex-wrap">
      {buttons.map((btn) => {
        const isActive = activePreset === btn.value;

        const colorClasses = {
          green: isActive
            ? "bg-green-500 text-white"
            : "bg-green-500/10 text-green-400 border-green-500/20",
          purple: isActive
            ? "bg-purple-500 text-white"
            : "bg-purple-500/10 text-purple-400 border-purple-500/20",
          orange: isActive
            ? "bg-orange-500 text-white"
            : "bg-orange-500/10 text-orange-400 border-orange-500/20",
          blue: isActive
            ? "bg-blue-500 text-white"
            : "bg-blue-500/10 text-blue-400 border-blue-500/20",
        };

        return (
          <button
            key={btn.value}
            onClick={() => handlePreset(btn.value)}
            className={`px-4 py-2 rounded-md text-sm border transition-all duration-200
              ${colorClasses[btn.color]}
              ${!isActive && "hover:opacity-80 hover:scale-105"}
              ${isActive && "shadow-lg scale-105"}
            `}
          >
            {btn.label}
          </button>
        );
      })}
    </div>
  </div>

  {/* 🔹 CHART */}
  <div className="grid grid-cols-1 gap-4 mt-5">
    <ChartCard title="Sales Trend" data={salesChart} />
    <ChartCard title="Installments Trend" data={installmentChart} />
    <ChartCard title="Investment Trend" data={investmentChart} />
    <ChartCard
      title="Daily Installments Trend"
      data={dailyInstallmentChart}
    />
    <ChartCard title="Expense Trend" data={expenseChart} />
  </div>
</div>


);
};

export default DashboardChart;
