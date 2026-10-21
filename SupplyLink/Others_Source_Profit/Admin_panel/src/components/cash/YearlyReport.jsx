import React, { useMemo, useState } from "react";
import CashCard from "./CashCard";
import { FaChartLine, FaMoneyBillWave } from "react-icons/fa6";
import { AiOutlineCreditCard } from "react-icons/ai";
import useCashYearlyReports from "../../utils/Hooks/cash/useCashYearlyReports";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const YearlyReport = () => {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);

  const { CashYearlyReports, refetch } = useCashYearlyReports(year);

  const years = [];
  for (let y = currentYear; y >= 2025; y--) {
    years.push(y);
  }

  const report = CashYearlyReports || {};
  const isAll = year === "all";

  // ✅ Stable fake data (no flicker)
  const fakeMonths = useMemo(() => {
    return MONTHS.map(() => {
      const inVal = Math.floor(Math.random() * 500000);
      const outVal = Math.floor(Math.random() * 400000);
      return {
        in: inVal,
        out: outVal,
        net: inVal - outVal,
      };
    });
  }, []);
  const monthsData = isAll
    ? Array.isArray(report?.months)
      ? report.months
      : []
    : [];
  // ✅ Correct totals (ALL vs YEAR)
  const totalIn = isAll
    ? report.totalIn || 0
    : Object.values(report?.months || {}).reduce(
        (sum, m) => sum + (m.in || 0),
        0,
      );

  const totalOut = isAll
    ? report.totalOut || 0
    : Object.values(report?.months || {}).reduce(
        (sum, m) => sum + (m.out || 0),
        0,
      );

  const net = isAll ? report.net || 0 : totalIn - totalOut;
  return (
    <div className="min-h-screen bg-[#0b1120] p-6 text-white">
      {/* 🔹 Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white">
          {isAll ? "🌍 সর্বমোট রিপোর্ট" : "📊 বার্ষিক রিপোর্ট"}
        </h2>

        <div className="flex items-center gap-3 bg-[#0f172a] border border-white/10 px-3 py-2 rounded-2xl">
          {/* Dropdown */}
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="bg-transparent text-white outline-none px-2 py-1 cursor-pointer"
          >
            <option value="all">All</option>
            {years.map((y) => (
              <option key={y} value={y} className="bg-[#0f172a]">
                {y}
              </option>
            ))}
          </select>

          <div className="w-[1px] h-6 bg-white/10"></div>

          <button
            onClick={refetch}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-1.5 rounded-xl text-sm transition"
          >
            Load
          </button>
        </div>
      </div>

      {/* 🔹 Cards */}
      <div className="grid md:grid-cols-3 gap-5">
        <CashCard
          title="মোট আয়"
          value={`৳ ${totalIn.toLocaleString()}`}
          icon={FaMoneyBillWave}
          accent="text-green-400"
        />

        <CashCard
          title="মোট খরচ"
          value={`৳ ${totalOut.toLocaleString()}`}
          icon={AiOutlineCreditCard}
          accent="text-red-400"
        />

        <CashCard
          title="নেট ব্যালেন্স"
          value={`৳ ${net.toLocaleString()}`}
          icon={FaChartLine}
          accent="text-blue-400"
        />
      </div>

      {/* 🔹 Table */}
      <div className="mt-8">
        <h3 className="flex items-center gap-2 text-blue-400 mb-3 font-medium">
          {isAll ? "🌍 All Time Monthly (Demo)" : "📊 মাসভিত্তিক বিশ্লেষণ"}
        </h3>

        <div className="bg-[#0f172a] border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#111827] text-gray-300">
              <tr>
                <th className="p-3 text-left">মাস</th>
                <th className="p-3 text-left">জমা (৳)</th>
                <th className="p-3 text-left">খরচ (৳)</th>
                <th className="p-3 text-left">নেট (৳)</th>
              </tr>
            </thead>

            <tbody>
  {isAll
    ? monthsData.map((item, i) => (
        <tr key={i}>
          <td className="p-3 text-gray-300 font-medium">
            {item.label}
          </td>

          <td className="p-3 text-green-400">
            ৳ {(item.in || 0).toLocaleString()}
          </td>

          <td className="p-3 text-red-400">
            ৳ {(item.out || 0).toLocaleString()}
          </td>

          <td
            className={`p-3 font-bold ${
              item.net >= 0 ? "text-blue-400" : "text-red-400"
            }`}
          >
            ৳ {(item.net || 0).toLocaleString()}
          </td>
        </tr>
      ))
    : MONTHS.map((m, i) => {
        const key = String(i + 1).padStart(2, "0");

        const item = report?.months?.[key] || {
          in: 0,
          out: 0,
          net: 0,
        };

        if (!item.in && !item.out && !item.net) return null;

        return (
          <tr key={key}>
            <td className="p-3 text-gray-300">{m}</td>
            <td className="p-3 text-green-400">
              ৳ {item.in.toLocaleString()}
            </td>
            <td className="p-3 text-red-400">
              ৳ {item.out.toLocaleString()}
            </td>
            <td className="p-3 font-bold">
              ৳ {item.net.toLocaleString()}
            </td>
          </tr>
        );
      })}
</tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default YearlyReport;
