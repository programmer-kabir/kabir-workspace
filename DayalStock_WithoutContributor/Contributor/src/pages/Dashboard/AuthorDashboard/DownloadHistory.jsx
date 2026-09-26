import { useState, useMemo } from "react";
import useAuth from "../../../utlis/Hooks/useAuth";
import useAuthorByEmail from "../../../utlis/Hooks/useAuthorByEmail";
import useDownloadHistory from "../../../utlis/Hooks/useDownloadHistory";
import { Download, Filter, ChevronDown } from "lucide-react";
import DayalLoader from "../../../components/Common/DayalLoader";

const DownloadHistory = () => {
  const { user } = useAuth();
  const { data: author } = useAuthorByEmail(user?.email);
  const [chartMode, setChartMode] = useState("monthly");
  
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  
  // Generate years from 2026 to current year
  const years = useMemo(() => {
    const startYear = 2026;
    const endYear = Math.max(currentYear, startYear);
    return Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);
  }, [currentYear]);

  const monthNames = [
    { value: 1, label: "January", short: "Jan" }, { value: 2, label: "February", short: "Feb" }, 
    { value: 3, label: "March", short: "Mar" }, { value: 4, label: "April", short: "Apr" }, 
    { value: 5, label: "May", short: "May" }, { value: 6, label: "June", short: "Jun" },
    { value: 7, label: "July", short: "Jul" }, { value: 8, label: "August", short: "Aug" }, 
    { value: 9, label: "September", short: "Sep" }, { value: 10, label: "October", short: "Oct" }, 
    { value: 11, label: "November", short: "Nov" }, { value: 12, label: "December", short: "Dec" }
  ];
  
  const { data: rawChartData, isLoading: isChartLoading } = useDownloadHistory(author?.id, chartMode, selectedYear, selectedMonth);
  
  // Fill missing data so the chart always spans full month or full year
  const chartData = useMemo(() => {
    const fetchedData = rawChartData || [];
    let fullData = [];

    if (chartMode === "monthly") {
      const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        const dayStr = String(i).padStart(2, "0");
        const fullDateStr = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${dayStr}`;
        const found = fetchedData.find(d => d.label === fullDateStr);
        fullData.push({
          label: dayStr,
          val: found ? found.downloads : 0,
          fullDate: fullDateStr
        });
      }
    } else {
      monthNames.forEach(m => {
        const found = fetchedData.find(d => d.label === m.short);
        fullData.push({
          label: m.short,
          val: found ? found.downloads : 0,
          fullDate: `${m.short} ${selectedYear}`
        });
      });
    }
    return fullData;
  }, [rawChartData, chartMode, selectedYear, selectedMonth]);

  const maxDownload = chartData.length > 0 ? Math.max(...chartData.map(d => d.val)) : 0;
  
  // Calculate Y-axis steps (5 steps: 0, 5, 10, 15, 20 like in screenshot)
  const yAxisMax = Math.max(20, Math.ceil(maxDownload / 5) * 5); // Minimum 20, snaps to nearest 5
  const yAxisSteps = [yAxisMax, yAxisMax * 0.75, yAxisMax * 0.5, yAxisMax * 0.25, 0].map(Math.round);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-white/5 bg-[#14141E] p-6 lg:p-8 flex flex-col gap-8 shadow-2xl">
        
        {/* HEADER & FILTER ROW */}
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 border-b border-white/[0.02] pb-6">
          
          {/* TITLE SEC */}
          <div className="flex items-start gap-4">
            <div className="bg-[#6C4FE0]/10 border border-[#6C4FE0]/20 p-2.5 rounded-xl text-[#7b61ff]">
              <Download size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-[17px] font-bold text-white tracking-wide leading-tight">Download Performance</h2>
              <p className="text-[13px] text-gray-500 mt-1">Total downloads over time</p>
            </div>
          </div>

          {/* FILTERS */}
          <div className="flex flex-wrap items-center gap-1 bg-[#1A1A27] p-1.5 rounded-xl border border-white/5">
            <div className="pl-3 pr-2 text-gray-500">
              <Filter size={14} />
            </div>

            {/* VIEW MODE */}
            <div className="relative">
              <select
                value={chartMode}
                onChange={(e) => setChartMode(e.target.value)}
                className="appearance-none cursor-pointer bg-transparent border-none text-gray-300 text-xs font-semibold rounded-lg pl-3 pr-7 py-2 outline-none transition-colors hover:text-white"
              >
                <option value="yearly" className="bg-[#14141E]">Yearly View</option>
                <option value="monthly" className="bg-[#14141E]">Monthly View</option>
              </select>
              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            </div>

            {/* YEAR SELECTOR */}
            <div className="relative">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="appearance-none cursor-pointer bg-transparent border-none text-gray-300 text-xs font-semibold rounded-lg pl-3 pr-7 py-2 outline-none transition-colors hover:text-white"
              >
                {years.map(y => (
                  <option key={y} value={y} className="bg-[#14141E]">{y}</option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            </div>

            {/* MONTH SELECTOR */}
            {chartMode === "monthly" && (
              <div className="relative">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="appearance-none cursor-pointer bg-transparent border-none text-gray-300 text-xs font-semibold rounded-lg pl-3 pr-7 py-2 outline-none transition-colors hover:text-white"
                >
                  {monthNames.map(m => (
                    <option key={m.value} value={m.value} className="bg-[#14141E]">{m.label}</option>
                  ))}
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>
            )}
          </div>
        </div>

        {/* CHART AREA */}
        <div className="flex w-full h-[320px] pt-4 pb-4 relative">
          
          {/* Y-AXIS */}
          <div className="flex flex-col justify-between items-end pr-6 text-[11px] text-gray-600 font-medium h-[260px]">
            {yAxisSteps.map((step, i) => (
              <span key={i}>{step}</span>
            ))}
          </div>

          {/* MAIN GRAPH BODY */}
          <div className="flex-1 relative h-[260px] flex items-end">
            
            {/* Horizontal Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none z-0">
               {yAxisSteps.map((_, i) => (
                <div key={i} className="w-full h-px bg-white/[0.01]" />
               ))}
            </div>

            {/* BARS AND X-AXIS */}
            <div className="w-full flex items-end justify-between h-full relative z-10">
              {chartData.map((bar, i) => {
                const heightPercent = yAxisMax > 0 ? (bar.val / yAxisMax) * 100 : 0;
                return (
                  <div key={i} className="flex flex-col items-center group relative h-full justify-end w-full">
                    {/* Tooltip */}
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-10 transition-opacity bg-white text-black text-xs font-bold py-1 px-2.5 rounded shadow-lg pointer-events-none whitespace-nowrap z-50">
                      {bar.val} Downloads
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rotate-45"></div>
                    </div>
                    
                    {/* Bar Line */}
                    <div 
                      style={{ height: `${heightPercent}%` }}
                      className={`w-2.5 sm:w-3.5 rounded-t-sm transition-all duration-500 ease-in-out ${
                        bar.val > 0 
                          ? "bg-[#7b61ff] group-hover:bg-[#927dff]" 
                          : "bg-transparent"
                      }`}
                    />
                    
                    {/* X-Axis Label */}
                    <span className="absolute -bottom-8 text-[11px] text-gray-600 font-medium w-10 text-center">
                      {bar.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Loading Overlay */}
            {isChartLoading && (
              <DayalLoader isOverlay={true} size="sm" text="Updating history..." />
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default DownloadHistory;
