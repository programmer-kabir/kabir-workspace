import React, { useMemo, useState, useEffect, useRef } from "react";
import InvestmentCardLayout from "../../InvestmentCardLayout";
import Loader from "../../Loader/Loader";
import Chart from "./Chart";
import useProfitAnalytics from "../../../Utils/Hooks/useProfitAnalytics";
import useUsers from "../../../Utils/Hooks/useUsers";
import { useReactToPrint } from "react-to-print";
import { formatCurrency } from "../../formatCurrency";
import { 
  FileText, 
  Printer, 
  Calendar, 
  Filter, 
  ArrowUpRight, 
  Coins, 
  Clock, 
  CheckCircle2, 
  ChevronDown, 
  ChevronRight,
  Sparkles,
  Award
} from "lucide-react";

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const Invest = () => {
  const fmt = (v) => (v !== null && v !== undefined && v !== "" ? v : "-");

  // Default filter
  const [filterYear, setFilterYear] = useState("all");
  const [filterMonth, setFilterMonth] = useState("all");
  const [selectedHistoryData, setSelectedHistoryData] = useState(null);
  const { isProfitAnalyticsLoading, profitAnalytics = [] } = useProfitAnalytics();
  const { users = [] } = useUsers();

  const userMap = useMemo(() => {
    const map = {};
    (users || []).forEach((u) => {
      if (u?.id && u?.name) {
        map[String(u.id)] = u.name;
      }
    });
    return map;
  }, [users]);

  const getStaffName = (sigId, sigName) => {
    if (sigName) return sigName;
    if (!sigId) return "অনুমোদিত";
    return userMap[String(sigId)] || `আইডি #${sigId}`;
  };

  const [isPrinting, setIsPrinting] = useState(false);
  const tableRef = useRef(null);

  const handlePrint = useReactToPrint({
    contentRef: tableRef,
    onBeforePrint: () =>
      new Promise((resolve) => {
        setIsPrinting(true);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            resolve();
          });
        });
      }),
    onAfterPrint: () => {
      setIsPrinting(false);
    },
  });

  return (
    <div className="space-y-6">
      <InvestmentCardLayout>
        {({
          investInstallments = [],
          inInvestInstallmentsLoading,
          selectedCard,
          statusBadgeClass,
          sortedCards,
        }) => {
          // Available years
          const availableYears = useMemo(() => {
            if (!investInstallments || investInstallments.length === 0) return [];
            const years = investInstallments.map((i) =>
              new Date(i.investment_date).getFullYear()
            );
            return [...new Set(years)].filter(Boolean).sort((a, b) => b - a);
          }, [investInstallments]);

          // Filtered installments
          const filteredInstallments = useMemo(() => {
            if (!investInstallments || investInstallments.length === 0) return [];

            const result = investInstallments.filter((i) => {
              const d = new Date(i.investment_date);
              const year = d.getFullYear();
              const month = d.getMonth() + 1;

              if (filterYear === "all") return true;
              if (year !== Number(filterYear)) return false;
              if (filterMonth === "all") return true;
              return month === Number(filterMonth);
            });

            return [...result].sort((a, b) => {
              const dateDiff =
                new Date(b.investment_date) - new Date(a.investment_date);
              if (dateDiff !== 0) return dateDiff;
              return Number(b.investment_no) - Number(a.investment_no);
            });
          }, [investInstallments, filterYear, filterMonth]);

          // Reset filter when card changes
          useEffect(() => {
            setFilterYear("all");
            setFilterMonth("all");
          }, [selectedCard?.id]);

          return (
            <main className="w-full space-y-6">
              {/* 📜 SELECTED CARD CERTIFICATE OVERVIEW */}
              {selectedCard && (
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                        <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                            {fmt(selectedCard.card_name)}
                          </h3>
                          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                            ID: #{selectedCard.id}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          সাপ্লাইলিঙ্ক রেজিস্টার্ড ডিজিটাল ইনভেস্টমেন্ট সার্টিফিকেট
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${
                          selectedCard.status === "running"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${selectedCard.status === "running" ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                        {selectedCard.status === "running" ? "চলমান কার্ড (Active)" : "মেয়াদ পূর্ণ"}
                      </span>
                    </div>
                  </div>

                  {/* 4-Bento Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
                    <div className="p-3.5 bg-slate-50/70 border border-slate-100 rounded-xl">
                      <p className="text-xs text-slate-400 font-medium">বিনিয়োগকৃত মূলধন</p>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-xs font-semibold text-slate-400">৳</span>
                        <span className="text-lg md:text-xl font-bold text-slate-900 tabular-nums">
                          {formatCurrency(selectedCard?.investment_amount)}
                        </span>
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-50/70 border border-slate-100 rounded-xl">
                      <p className="text-xs text-slate-400 font-medium">পেমেন্ট মেথড</p>
                      <p className="text-sm md:text-base font-bold text-slate-800 mt-1 capitalize">
                        {fmt(selectedCard?.payment_type)}
                      </p>
                    </div>

                    <div className="p-3.5 bg-slate-50/70 border border-slate-100 rounded-xl">
                      <p className="text-xs text-slate-400 font-medium">শুরু ও শেষ তারিখ</p>
                      <p className="text-xs md:text-sm font-semibold text-slate-800 mt-1 font-mono">
                        {fmt(selectedCard?.start_date)} <br />
                        <span className="text-slate-400 font-normal">থেকে </span>
                        {fmt(selectedCard?.maturity_date)}
                      </p>
                    </div>

                    <div className="p-3.5 bg-emerald-50/60 border border-emerald-100 rounded-xl">
                      <p className="text-xs text-emerald-700 font-medium">Time Weighted Value</p>
                      <p className="text-base md:text-lg font-bold text-emerald-700 mt-1 tabular-nums">
                        {fmt(selectedCard?.total_time_wighted_value)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 📈 PERFORMANCE CHART CARD */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-800">
                      বিনিয়োগ ও কিস্তির কিউমুলেটিভ গ্রাফ
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      মাসভিত্তিক ডিপোজিট পারফরম্যান্স চিত্র
                    </p>
                  </div>
                </div>
                <Chart sortedCards={sortedCards} selectedCard={selectedCard} />
              </div>

              {/* 🔍 FILTER & PRINT TOOLBAR */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    ফিল্টার:
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                  {/* Year Select */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-400 font-medium">বছর:</span>
                    <select
                      className="border border-slate-200 bg-slate-50/50 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
                      value={filterYear}
                      onChange={(e) => setFilterYear(e.target.value)}
                    >
                      <option value="all">সকল বছর</option>
                      {availableYears.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Month Select */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-400 font-medium">মাস:</span>
                    <select
                      className="border border-slate-200 bg-slate-50/50 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
                      value={filterMonth}
                      onChange={(e) => setFilterMonth(e.target.value)}
                    >
                      <option value="all">সকল মাস</option>
                      {monthNames.map((name, idx) => (
                        <option key={idx + 1} value={idx + 1}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Print Button */}
                  <button
                    type="button"
                    onClick={() => handlePrint()}
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100 transition-colors cursor-pointer ml-auto sm:ml-2"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    স্টেটমেন্ট প্রিন্ট
                  </button>
                </div>
              </div>

              {/* 📑 FINANCIAL INSTALLMENTS TABLE */}
              <div ref={tableRef} className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
                {inInvestInstallmentsLoading ? (
                  <div className="py-12 flex justify-center items-center">
                    <Loader />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          <th className="px-6 py-3.5">কিস্তি নং</th>
                          <th className="px-6 py-3.5">প্রদানের তারিখ</th>
                          <th className="px-6 py-3.5">জমার পরিমাণ</th>
                          <th className="px-6 py-3.5">অতিক্রান্ত দিন</th>
                          <th className="px-6 py-3.5">অনুমোদনকারী স্বাক্ষর</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {filteredInstallments.length > 0 ? (
                          filteredInstallments.map((i) => {
                            const isHistoryCard = Number(selectedCard?.id) === 1;
                            const openHistoryData = profitAnalytics?.find(
                              (data) => data.id === i.source_profit_id
                            );
                            const isExpanded = isPrinting || selectedHistoryData?.id === i.id;

                            return (
                              <React.Fragment key={`${i.investment_no}-${i.investment_date}`}>
                                <tr className="hover:bg-slate-50/70 transition-colors">
                                  <td className="px-6 py-4 font-semibold text-slate-800">
                                    {isHistoryCard ? (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedHistoryData(
                                            isPrinting || selectedHistoryData?.id === i.id ? null : i
                                          );
                                        }}
                                        className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 cursor-pointer font-bold"
                                      >
                                        {isExpanded ? (
                                          <ChevronDown className="w-4 h-4 text-indigo-600" />
                                        ) : (
                                          <ChevronRight className="w-4 h-4 text-slate-400" />
                                        )}
                                        <span>কিস্তি #{i.investment_no}</span>
                                      </button>
                                    ) : (
                                      <span className="font-mono text-slate-700">#{i.investment_no}</span>
                                    )}
                                  </td>

                                  <td className="px-6 py-4 text-slate-600 font-mono text-xs">
                                    {i.investment_date}
                                  </td>

                                  <td className="px-6 py-4 font-bold text-slate-900 tabular-nums">
                                    ৳{formatCurrency(i.amount)}
                                  </td>

                                  <td className="px-6 py-4 text-slate-600 font-mono text-xs">
                                    {i.active_days} দিন
                                  </td>

                                  <td className="px-6 py-4">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                      {getStaffName(i.signature_by, i.signature_by_name)}
                                    </span>
                                  </td>
                                </tr>

                                {/* Expanded History Sub-card */}
                                {isExpanded && openHistoryData && (
                                  <tr>
                                    <td colSpan={5} className="bg-slate-50/90 px-6 py-4 border-b border-slate-200">
                                      <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                                        <div>
                                          <span className="text-slate-400 font-medium">ইনভেস্টর:</span>{" "}
                                          <span className="font-bold text-slate-800">
                                            {openHistoryData.investor_name} (#{openHistoryData?.investor_id})
                                          </span>
                                        </div>

                                        <div>
                                          <span className="text-slate-400 font-medium">কার্ড আইডি:</span>{" "}
                                          <span className="font-bold text-slate-800">
                                            {openHistoryData.card_id}
                                          </span>
                                        </div>

                                        <div>
                                          <span className="text-slate-400 font-medium">প্রফিট অ্যামাউন্ট:</span>{" "}
                                          <span className="font-bold text-emerald-600">
                                            ৳{Number(openHistoryData.original_profit_amount || 0).toLocaleString()}
                                          </span>
                                        </div>

                                        <div>
                                          <span className="text-slate-400 font-medium">প্রফিট পার্সেন্টেজ:</span>{" "}
                                          <span className="font-bold text-indigo-600">
                                            {Number(openHistoryData.original_percent || 0).toFixed(4)}%
                                          </span>
                                        </div>

                                        <div>
                                          <span className="text-slate-400 font-medium">প্রফিট মাস ও বছর:</span>{" "}
                                          <span className="font-bold text-slate-800">
                                            {monthNames[openHistoryData.profit_month - 1]} {openHistoryData.profit_year}
                                          </span>
                                        </div>

                                        {openHistoryData.note && (
                                          <div className="sm:col-span-2 md:col-span-3 pt-1 border-t border-slate-100">
                                            <span className="text-slate-400 font-medium">নোট:</span>{" "}
                                            <span className="text-slate-700">{openHistoryData.note}</span>
                                          </div>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-400">
                              নির্বাচিত ফিল্টারে কোনো কিস্তির ডাটা পাওয়া যায়নি।
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </main>
          );
        }}
      </InvestmentCardLayout>
    </div>
  );
};

export default Invest;
