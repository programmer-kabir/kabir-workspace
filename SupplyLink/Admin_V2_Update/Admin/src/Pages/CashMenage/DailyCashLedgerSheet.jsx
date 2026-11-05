import React, { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import { useReactToPrint } from "react-to-print";
import BackButton from "../../components/BackButton/BackButton";
import Loader from "../../components/Loader/Loader";
import {
  FaFileExcel,
  FaPrint,
  FaSyncAlt,
  FaCalendarAlt,
  FaSearch,
  FaArrowUp,
  FaArrowDown,
  FaWallet,
  FaCoins,
  FaReceipt,
  FaInfoCircle,
  FaTimes
} from "react-icons/fa";

const DailyCashLedgerSheet = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState({
    baseline_opening: 0,
    total_cash_in: 0,
    total_cash_out: 0,
    final_closing_cash: 0,
    net_change: 0,
  });
  const [dateRange, setDateRange] = useState({
    start_date: "",
    end_date: "",
    total_calendar_days: 0,
    active_days: 0,
  });

  // Current month default
  const now = new Date();
  const defaultYear = now.getFullYear();
  const defaultMonth = String(now.getMonth() + 1).padStart(2, "0");
  const defaultFirstDay = `${defaultYear}-${defaultMonth}-01`;
  const defaultToday = now.toISOString().split("T")[0];

  const [startDate, setStartDate] = useState(defaultFirstDay);
  const [endDate, setEndDate] = useState(defaultToday);
  const [includeEmptyDays, setIncludeEmptyDays] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedDayDetails, setSelectedDayDetails] = useState(null);

  const printRef = useRef(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Daily_Cash_Sheet_${startDate}_to_${endDate}`,
  });

  const baseUrl = import.meta.env.VITE_LOCALHOST_KEY || "https://management.supplylinkbd.com/apis";

  const fetchLedgerSheet = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${baseUrl}/cash/daily_ledger_sheet.php`, {
        params: {
          start_date: startDate,
          end_date: endDate,
          include_empty_days: includeEmptyDays ? 1 : 0,
        },
        withCredentials: true,
      });

      if (res.data?.success) {
        setData(res.data.data || []);
        setSummary(res.data.summary || {});
        setDateRange(res.data.date_range || {});
      } else {
        toast.error("ক্যাশ শিট ডাটা লোড করতে ব্যর্থ হয়েছে");
      }
    } catch (err) {
      console.error(err);
      toast.error("সার্ভার ত্রুটি: ক্যাশ শিট লোড করা যায়নি");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedgerSheet();
  }, [includeEmptyDays]);

  const handleApplyFilter = (e) => {
    e?.preventDefault();
    fetchLedgerSheet();
  };

  // Quick Preset Handlers
  const handlePreset = (type) => {
    const curNow = new Date();
    const y = curNow.getFullYear();
    const m = curNow.getMonth(); // 0-based

    if (type === "this_month") {
      const s = `${y}-${String(m + 1).padStart(2, "0")}-01`;
      const e = curNow.toISOString().split("T")[0];
      setStartDate(s);
      setEndDate(e);
      setTimeout(() => fetchCustomRange(s, e), 50);
    } else if (type === "last_month") {
      const lastMonthDate = new Date(y, m - 1, 1);
      const ly = lastMonthDate.getFullYear();
      const lm = String(lastMonthDate.getMonth() + 1).padStart(2, "0");
      const lastDay = new Date(ly, lastMonthDate.getMonth() + 1, 0).getDate();
      const s = `${ly}-${lm}-01`;
      const e = `${ly}-${lm}-${String(lastDay).padStart(2, "0")}`;
      setStartDate(s);
      setEndDate(e);
      setTimeout(() => fetchCustomRange(s, e), 50);
    } else if (type === "last_30_days") {
      const past30 = new Date(curNow.getTime() - 29 * 24 * 60 * 60 * 1000);
      const s = past30.toISOString().split("T")[0];
      const e = curNow.toISOString().split("T")[0];
      setStartDate(s);
      setEndDate(e);
      setTimeout(() => fetchCustomRange(s, e), 50);
    } else if (type === "all_time") {
      const s = "2026-08-01";
      const e = curNow.toISOString().split("T")[0];
      setStartDate(s);
      setEndDate(e);
      setTimeout(() => fetchCustomRange(s, e), 50);
    }
  };

  const fetchCustomRange = async (s, e) => {
    setLoading(true);
    try {
      const res = await axios.get(`${baseUrl}/cash/daily_ledger_sheet.php`, {
        params: {
          start_date: s,
          end_date: e,
          include_empty_days: includeEmptyDays ? 1 : 0,
        },
        withCredentials: true,
      });

      if (res.data?.success) {
        setData(res.data.data || []);
        setSummary(res.data.summary || {});
        setDateRange(res.data.date_range || {});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Export to Real Excel (.xlsx)
  const handleExportExcel = () => {
    if (!data.length) {
      toast.warning("এক্সপোর্ট করার মতো কোনো ডাটা নেই!");
      return;
    }

    const excelRows = data.map((item, index) => ({
      "ক্রমিক (SL)": index + 1,
      "তারিখ (Date)": item.date,
      "বার (Day)": item.day_name_bn,
      "প্রারম্ভিক ক্যাশ (Opening)": item.opening_cash,
      "ক্যাশ ইন (Cash In)": item.cash_in,
      "ক্যাশ আউট (Cash Out)": item.cash_out,
      "দৈনিক পার্থক্য (Change)": item.daily_change,
      "সমাপনী ক্যাশ (Closing Net)": item.net_closing_cash,
      "ক্যাশ ইন সংখ্যা": item.in_count,
      "ক্যাশ আউট সংখ্যা": item.out_count,
    }));

    // Add Summary Row
    excelRows.push({
      "ক্রমিক (SL)": "মোট / ফলাফল",
      "তারিখ (Date)": `${startDate} থেকে ${endDate}`,
      "বার (Day)": `মোট সক্রিয় দিন: ${dateRange.active_days}`,
      "প্রারম্ভিক ক্যাশ (Opening)": summary.baseline_opening,
      "ক্যাশ ইন (Cash In)": summary.total_cash_in,
      "ক্যাশ আউট (Cash Out)": summary.total_cash_out,
      "দৈনিক পার্থক্য (Change)": summary.net_change,
      "সমাপনী ক্যাশ (Closing Net)": summary.final_closing_cash,
      "ক্যাশ ইন সংখ্যা": "-",
      "ক্যাশ আউট সংখ্যা": "-",
    });

    const worksheet = XLSX.utils.json_to_sheet(excelRows);
    worksheet["!cols"] = [
      { wch: 10 },
      { wch: 14 },
      { wch: 14 },
      { wch: 18 },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 },
      { wch: 20 },
      { wch: 14 },
      { wch: 14 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Daily Cash Sheet");
    XLSX.writeFile(workbook, `SupplyLink_Daily_Cash_Sheet_${startDate}_to_${endDate}.xlsx`);
    toast.success("এক্সেল ফাইল সফলভাবে ডাউনলোড হয়েছে!");
  };

  // Filtered rows
  const filteredRows = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter(
      (r) =>
        r.date.includes(q) ||
        r.day_name.toLowerCase().includes(q) ||
        r.day_name_bn.includes(q)
    );
  }, [data, search]);

  return (
    <div className="min-h-screen bg-[#0b132b] text-white p-4 sm:p-6 lg:p-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <BackButton />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <FaFileExcel className="text-emerald-400" />
              দৈনিক ক্যাশ ফ্লো ও ব্যালেন্স শিট (Excel Ledger)
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
              তারিখ অনুযায়ী প্রারম্ভিক ক্যাশ, ক্যাশ ইন, ক্যাশ আউট ও সমাপনী ক্যাশের এক্সেল ভিউ
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-lg text-xs shadow-lg shadow-emerald-950/40 transition-all cursor-pointer"
            title="Excel ফাইল ডাউনলোড করুন"
          >
            <FaFileExcel className="text-sm" />
            Excel ডাউনলোড
          </button>

          <button
            onClick={() => handlePrint()}
            className="flex items-center gap-2 px-4 py-2 bg-[#1c2541] hover:bg-[#253256] text-gray-200 border border-gray-700 rounded-lg text-xs transition-all cursor-pointer"
            title="প্রিন্ট বা PDF করুন"
          >
            <FaPrint className="text-cyan-400" />
            প্রিন্ট / PDF
          </button>

          <button
            onClick={fetchLedgerSheet}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#1c2541] hover:bg-[#253256] text-gray-200 border border-gray-700 rounded-lg text-xs transition-all cursor-pointer disabled:opacity-50"
            title="রিফ্রেশ করুন"
          >
            <FaSyncAlt className={loading ? "animate-spin text-cyan-400" : ""} />
            রিফ্রেশ
          </button>
        </div>
      </div>

      {/* Filter Toolbar & Presets */}
      <div className="bg-[#1c2541]/80 backdrop-blur border border-gray-800 rounded-xl p-4 mb-6 shadow">
        <form onSubmit={handleApplyFilter} className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Date Range Pickers */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-[#0b132b] px-3 py-1.5 rounded-lg border border-gray-700">
              <span className="text-xs text-gray-400 font-medium">শুরু:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-white text-xs font-mono focus:outline-none"
              />
            </div>

            <span className="text-gray-500 text-xs">থেকে</span>

            <div className="flex items-center gap-2 bg-[#0b132b] px-3 py-1.5 rounded-lg border border-gray-700">
              <span className="text-xs text-gray-400 font-medium">শেষ:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-white text-xs font-mono focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow transition-all cursor-pointer"
            >
              রিপোর্ট দেখুন
            </button>
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handlePreset("this_month")}
              className="px-2.5 py-1.5 bg-[#0b132b] hover:bg-[#253256] text-gray-300 rounded-lg text-xs transition-all cursor-pointer border border-gray-700"
            >
              চলতি মাস
            </button>
            <button
              type="button"
              onClick={() => handlePreset("last_month")}
              className="px-2.5 py-1.5 bg-[#0b132b] hover:bg-[#253256] text-gray-300 rounded-lg text-xs transition-all cursor-pointer border border-gray-700"
            >
              গত মাস
            </button>
            <button
              type="button"
              onClick={() => handlePreset("last_30_days")}
              className="px-2.5 py-1.5 bg-[#0b132b] hover:bg-[#253256] text-gray-300 rounded-lg text-xs transition-all cursor-pointer border border-gray-700"
            >
              গত ৩০ দিন
            </button>
            <button
              type="button"
              onClick={() => handlePreset("all_time")}
              className="px-2.5 py-1.5 bg-[#0b132b] hover:bg-[#253256] text-gray-300 rounded-lg text-xs transition-all cursor-pointer border border-gray-700"
            >
              সব সময়
            </button>
          </div>
        </form>

        {/* Options Row */}
        <div className="mt-3 pt-3 border-t border-gray-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <label className="flex items-center gap-2 cursor-pointer text-gray-300 hover:text-white">
            <input
              type="checkbox"
              checked={includeEmptyDays}
              onChange={(e) => setIncludeEmptyDays(e.target.checked)}
              className="rounded bg-[#0b132b] border-gray-700 text-indigo-600 focus:ring-0 cursor-pointer"
            />
            <span>লেনদেনবিহীন দিনগুলোও তালিকায় দেখাও (All Calendar Days)</span>
          </label>

          {/* Table Search */}
          <div className="relative w-full sm:w-56">
            <FaSearch className="absolute left-3 top-2.5 text-gray-500 text-xs" />
            <input
              type="text"
              placeholder="তারিখ খুঁজুন (YYYY-MM-DD)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#0b132b] border border-gray-700 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Baseline Opening */}
        <div className="bg-[#1c2541]/80 backdrop-blur border border-gray-800 rounded-xl p-4 shadow">
          <div className="flex items-center justify-between">
            <p className="text-xs text-indigo-400 font-medium">প্রারম্ভিক ক্যাশ ({startDate})</p>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-sm">
              <FaWallet />
            </div>
          </div>
          <h3 className="text-2xl font-bold font-mono text-white mt-1">
            ৳{Number(summary.baseline_opening || 0).toLocaleString()}
          </h3>
          <p className="text-[11px] text-gray-400 mt-0.5">রিপোর্ট শুরুর পূর্ববর্তী ব্যালেন্স</p>
        </div>

        {/* Total Cash In */}
        <div className="bg-[#1c2541]/80 backdrop-blur border border-emerald-900/40 rounded-xl p-4 shadow">
          <div className="flex items-center justify-between">
            <p className="text-xs text-emerald-400 font-medium">মোট ক্যাশ ইন (জমা)</p>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-sm">
              <FaArrowDown />
            </div>
          </div>
          <h3 className="text-2xl font-bold font-mono text-emerald-400 mt-1">
            ৳{Number(summary.total_cash_in || 0).toLocaleString()}
          </h3>
          <p className="text-[11px] text-emerald-300/80 mt-0.5">
            সক্রিয় দিন: {dateRange.active_days} দিন
          </p>
        </div>

        {/* Total Cash Out */}
        <div className="bg-[#1c2541]/80 backdrop-blur border border-rose-900/40 rounded-xl p-4 shadow">
          <div className="flex items-center justify-between">
            <p className="text-xs text-rose-400 font-medium">মোট ক্যাশ আউট (খরচ)</p>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 text-sm">
              <FaArrowUp />
            </div>
          </div>
          <h3 className="text-2xl font-bold font-mono text-rose-400 mt-1">
            ৳{Number(summary.total_cash_out || 0).toLocaleString()}
          </h3>
          <p className="text-[11px] text-rose-300/80 mt-0.5">ক্রয়, খরচ ও সকল ব্যয়</p>
        </div>

        {/* Final Closing Net Cash */}
        <div className="bg-[#1c2541]/80 backdrop-blur border border-cyan-900/50 rounded-xl p-4 shadow">
          <div className="flex items-center justify-between">
            <p className="text-xs text-cyan-400 font-medium">সমাপনী ক্যাশ ({endDate})</p>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 text-sm">
              <FaCoins />
            </div>
          </div>
          <h3 className="text-2xl font-bold font-mono text-cyan-400 mt-1">
            ৳{Number(summary.final_closing_cash || 0).toLocaleString()}
          </h3>
          <p className="text-[11px] text-gray-300 mt-0.5">
            পিরিয়ডের নিট পরিবর্তন:{" "}
            <span
              className={`font-semibold ${
                summary.net_change >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {summary.net_change >= 0 ? "+" : ""}৳
              {Number(summary.net_change || 0).toLocaleString()}
            </span>
          </p>
        </div>
      </div>

      {/* Main Excel-like Table View */}
      <div
        ref={printRef}
        className="bg-[#1c2541]/90 backdrop-blur border border-gray-800 rounded-xl overflow-hidden shadow-xl print:bg-white print:text-black print:border-black"
      >
        {/* Printable Header */}
        <div className="hidden print:block p-6 text-center border-b border-gray-300">
          <h2 className="text-2xl font-bold text-gray-900">SUPPLYLINK MANAGEMENT</h2>
          <h3 className="text-lg font-semibold text-gray-700 mt-1">Daily Cash Flow Ledger Statement</h3>
          <p className="text-xs text-gray-500 mt-1">
            Period: {startDate} to {endDate} | Generated on: {new Date().toLocaleString()}
          </p>
        </div>

        {loading ? (
          <div className="py-24">
            <Loader />
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="py-20 text-center text-gray-400">
            <FaCalendarAlt className="mx-auto text-4xl text-gray-600 mb-2" />
            <p className="text-sm">নির্বাচিত সময়কালে কোনো ক্যাশ ডাটা পাওয়া যায়নি।</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-sans">
              <thead>
                <tr className="bg-[#141d36] text-gray-200 border-b border-gray-700 uppercase tracking-wider font-semibold print:bg-gray-100 print:text-black">
                  <th className="py-3 px-3.5 text-center w-12 border-r border-gray-800 print:border-gray-300">#</th>
                  <th className="py-3 px-4 border-r border-gray-800 print:border-gray-300">তারিখ (Date)</th>
                  <th className="py-3 px-3 border-r border-gray-800 print:border-gray-300">বার</th>
                  <th className="py-3 px-4 text-right border-r border-gray-800 text-indigo-300 print:text-black print:border-gray-300">
                    প্রারম্ভিক ক্যাশ (Opening)
                  </th>
                  <th className="py-3 px-4 text-right border-r border-gray-800 text-emerald-400 print:text-black print:border-gray-300">
                    ক্যাশ ইন (Cash In)
                  </th>
                  <th className="py-3 px-4 text-right border-r border-gray-800 text-rose-400 print:text-black print:border-gray-300">
                    ক্যাশ আউট (Cash Out)
                  </th>
                  <th className="py-3 px-4 text-right border-r border-gray-800 print:border-gray-300">
                    দৈনিক পার্থক্য (Change)
                  </th>
                  <th className="py-3 px-4 text-right border-r border-gray-800 text-cyan-400 print:text-black print:border-gray-300 font-bold">
                    সমাপনী ক্যাশ (Closing Net)
                  </th>
                  <th className="py-3 px-3 text-center print:hidden">বিস্তারিত</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/80 font-mono print:divide-gray-300">
                {filteredRows.map((row, idx) => {
                  const isPositiveChange = row.daily_change >= 0;
                  const isZeroActivity = !row.has_activity;

                  return (
                    <tr
                      key={row.date}
                      className={`hover:bg-[#222e54]/50 transition-colors ${
                        idx % 2 === 0 ? "bg-[#1c2541]/40" : "bg-transparent"
                      } ${isZeroActivity ? "opacity-50" : ""}`}
                    >
                      {/* SL */}
                      <td className="py-2.5 px-3.5 text-center text-gray-400 border-r border-gray-800/80 font-sans print:border-gray-300">
                        {idx + 1}
                      </td>

                      {/* Date */}
                      <td className="py-2.5 px-4 font-semibold text-white whitespace-nowrap border-r border-gray-800/80 print:border-gray-300 print:text-black">
                        {row.date}
                      </td>

                      {/* Day Name */}
                      <td className="py-2.5 px-3 text-gray-400 font-sans whitespace-nowrap border-r border-gray-800/80 print:border-gray-300 print:text-black">
                        {row.day_name_bn}
                      </td>

                      {/* Opening Cash */}
                      <td className="py-2.5 px-4 text-right text-indigo-300 whitespace-nowrap border-r border-gray-800/80 print:border-gray-300 print:text-black">
                        ৳{Number(row.opening_cash).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>

                      {/* Cash In */}
                      <td className="py-2.5 px-4 text-right text-emerald-400 font-semibold whitespace-nowrap border-r border-gray-800/80 print:border-gray-300 print:text-black">
                        {row.cash_in > 0 ? (
                          `৳${Number(row.cash_in).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                        ) : (
                          <span className="text-gray-500 font-normal">0.00</span>
                        )}
                      </td>

                      {/* Cash Out */}
                      <td className="py-2.5 px-4 text-right text-rose-400 font-semibold whitespace-nowrap border-r border-gray-800/80 print:border-gray-300 print:text-black">
                        {row.cash_out > 0 ? (
                          `৳${Number(row.cash_out).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                        ) : (
                          <span className="text-gray-500 font-normal">0.00</span>
                        )}
                      </td>

                      {/* Daily Change */}
                      <td
                        className={`py-2.5 px-4 text-right font-semibold whitespace-nowrap border-r border-gray-800/80 print:border-gray-300 ${
                          row.daily_change === 0
                            ? "text-gray-500"
                            : isPositiveChange
                            ? "text-emerald-400"
                            : "text-rose-400"
                        }`}
                      >
                        {row.daily_change > 0 ? "+" : ""}
                        ৳{Number(row.daily_change).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>

                      {/* Closing Net Cash */}
                      <td className="py-2.5 px-4 text-right text-cyan-400 font-bold whitespace-nowrap border-r border-gray-800/80 print:border-gray-300 print:text-black">
                        ৳{Number(row.net_closing_cash).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>

                      {/* Details Button */}
                      <td className="py-2.5 px-3 text-center print:hidden font-sans">
                        {row.has_activity ? (
                          <button
                            onClick={() => setSelectedDayDetails(row)}
                            className="p-1 px-2 rounded bg-indigo-900/40 hover:bg-indigo-900/70 text-indigo-300 hover:text-white transition-all text-[11px] cursor-pointer inline-flex items-center gap-1"
                            title="লেনদেনের বিবরণ দেখুন"
                          >
                            <FaInfoCircle className="text-[10px]" />
                            {row.in_count + row.out_count} টি
                          </button>
                        ) : (
                          <span className="text-gray-600 text-[11px]">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Excel Bottom Summary Row */}
              <tfoot>
                <tr className="bg-[#141d36] text-white border-t-2 border-b-2 border-indigo-500/50 font-mono font-bold print:bg-gray-200 print:text-black">
                  <td colSpan={3} className="py-3 px-4 font-sans text-right uppercase tracking-wider text-xs border-r border-gray-700 print:border-gray-400">
                    সর্বমোট / সমাপনী ব্যালেন্স:
                  </td>
                  <td className="py-3 px-4 text-right text-indigo-300 border-r border-gray-700 print:border-gray-400 print:text-black">
                    ৳{Number(summary.baseline_opening || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-right text-emerald-400 border-r border-gray-700 print:border-gray-400 print:text-black">
                    ৳{Number(summary.total_cash_in || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-right text-rose-400 border-r border-gray-700 print:border-gray-400 print:text-black">
                    ৳{Number(summary.total_cash_out || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td
                    className={`py-3 px-4 text-right border-r border-gray-700 print:border-gray-400 ${
                      summary.net_change >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {summary.net_change >= 0 ? "+" : ""}৳
                    {Number(summary.net_change || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-right text-cyan-400 text-sm border-r border-gray-700 print:border-gray-400 print:text-black font-extrabold">
                    ৳{Number(summary.final_closing_cash || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="print:hidden"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Transaction Breakdown Modal for Selected Day */}
      {selectedDayDetails && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1c2541] border border-gray-700 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-fade-in">
            {/* Modal Header */}
            <div className="p-4 bg-[#141d36] border-b border-gray-700 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FaReceipt className="text-cyan-400" />
                  {selectedDayDetails.date} ({selectedDayDetails.day_name_bn}) লেনদেন বিবরণ
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  প্রারম্ভিক: ৳{Number(selectedDayDetails.opening_cash).toLocaleString()} | সমাপনী: ৳{Number(selectedDayDetails.net_closing_cash).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedDayDetails(null)}
                className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <FaTimes />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
              {/* Cash In Categories */}
              <div>
                <h4 className="font-semibold text-emerald-400 flex items-center gap-1.5 mb-2 uppercase tracking-wider text-[11px]">
                  <FaArrowDown /> ক্যাশ ইন খাতসমূহ (মোট: ৳{Number(selectedDayDetails.cash_in).toLocaleString()})
                </h4>
                {selectedDayDetails.in_breakdown?.length === 0 ? (
                  <p className="text-gray-500 italic pl-2">এই দিনে কোনো ক্যাশ ইন হয়নি</p>
                ) : (
                  <div className="space-y-1.5">
                    {selectedDayDetails.in_breakdown.map((cat, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2 rounded-lg bg-[#0b132b] border border-emerald-900/30"
                      >
                        <span className="capitalize font-medium text-gray-300">
                          {cat.category} ({cat.count} টি)
                        </span>
                        <span className="font-mono font-bold text-emerald-400">
                          ৳{Number(cat.amount).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Cash Out Categories */}
              <div>
                <h4 className="font-semibold text-rose-400 flex items-center gap-1.5 mb-2 uppercase tracking-wider text-[11px]">
                  <FaArrowUp /> ক্যাশ আউট খাতসমূহ (মোট: ৳{Number(selectedDayDetails.cash_out).toLocaleString()})
                </h4>
                {selectedDayDetails.out_breakdown?.length === 0 ? (
                  <p className="text-gray-500 italic pl-2">এই দিনে কোনো ক্যাশ আউট হয়নি</p>
                ) : (
                  <div className="space-y-1.5">
                    {selectedDayDetails.out_breakdown.map((cat, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2 rounded-lg bg-[#0b132b] border border-rose-900/30"
                      >
                        <span className="capitalize font-medium text-gray-300">
                          {cat.category} ({cat.count} টি)
                        </span>
                        <span className="font-mono font-bold text-rose-400">
                          ৳{Number(cat.amount).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-[#141d36] border-t border-gray-700 text-right">
              <button
                onClick={() => setSelectedDayDetails(null)}
                className="px-4 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-xs font-semibold cursor-pointer transition-all"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyCashLedgerSheet;
