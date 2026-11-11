import React, { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import { useReactToPrint } from "react-to-print";
import { MONTHS } from "../../../public/month";
import { FaCloudUploadAlt, FaPrint, FaSyncAlt, FaLayerGroup, FaListUl } from "react-icons/fa";
import LuxuryToast from "../Modal/LuxuryToast";

// 🏷️ Category Label Mapping (Bangla Friendly)
const CATEGORY_MAP = {
  // Cash In Categories
  "daily-installment": { label: "দৈনিক কিস্তি আদায়", en: "Daily Installment", color: "emerald" },
  "daily_installment": { label: "দৈনিক কিস্তি আদায়", en: "Daily Installment", color: "emerald" },
  "installment": { label: "নিয়মিত কিস্তি আদায়", en: "Regular Installment", color: "blue" },
  "downpayment": { label: "ডাউন পেমেন্ট", en: "Down Payment", color: "cyan" },
  "invest": { label: "বিনিয়োগ গ্রহণ", en: "Investment", color: "indigo" },
  "investment": { label: "বিনিয়োগ গ্রহণ", en: "Investment", color: "indigo" },
  "share_dividend": { label: "শেয়ার লভ্যাংশ আয়", en: "Share Dividend", color: "teal" },
  "asset_sale": { label: "স্থায়ী সম্পদ বিক্রয়", en: "Asset Sale", color: "purple" },
  "rental_income": { label: "ভাড়া বাবদ আয়", en: "Rental Income", color: "sky" },

  // Cash Out Categories
  "office-expense": { label: "অফিস খরচ", en: "Office Expense", color: "rose" },
  "office_expense": { label: "অফিস খরচ", en: "Office Expense", color: "rose" },
  "purchase": { label: "ক্রয় / ইনভেন্টরি", en: "Purchase", color: "orange" },
  "investor-payout": { label: "বিনিয়োগকারী আসল ফেরত / উত্তোলন", en: "Investor Payout", color: "red" },
  "profit-payout": { label: "লভ্যাংশ প্রদান", en: "Profit Payout", color: "pink" },
  "salary": { label: "স্টাফ বেতন ও সম্মানী", en: "Staff Salary", color: "violet" },
  "bill": { label: "ইউটিলিটি ও অফিস বিল", en: "Utility / Bills", color: "amber" },
  "rent": { label: "অফিস ও দোকান ভাড়া", en: "Office Rent", color: "yellow" },
  "asset_purchase": { label: "স্থায়ী সম্পদ ক্রয়", en: "Asset Purchase", color: "indigo" },
  "share_investment": { label: "শেয়ার বিনিয়োগ", en: "Share Investment", color: "blue" },
  "others": { label: "অন্যান্য খরচ / সমন্বয়", en: "Others", color: "gray" },
};

const getCategoryInfo = (rawCategory) => {
  const key = String(rawCategory || "").toLowerCase().trim();
  if (CATEGORY_MAP[key]) {
    return CATEGORY_MAP[key];
  }
  // Fallback for custom category names
  const formatted = rawCategory
    ? String(rawCategory).replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "সাধারণ (General)";
  return { label: formatted, en: formatted, color: "gray" };
};

const DashboardReport = () => {
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Dhaka",
    }).format(new Date());
  });

  const [reportData, setReportData] = useState({
    openingCash: 0,
    totalIn: 0,
    totalOut: 0,
    net: 0,
    closingBalance: 0,
    cashInList: [],
    cashOutList: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isDriveSaving, setIsDriveSaving] = useState(false);
  const [luxuryToast, setLuxuryToast] = useState(null);
  const [viewMode, setViewMode] = useState("grouped"); // 'grouped' or 'flat'

  const printRef = useRef(null);

  // Fetch Cash Data based on selected date
  const fetchDailyCashData = async (dateStr) => {
    try {
      setIsLoading(true);
      const res = await axios.get(
        `${import.meta.env.VITE_LOCALHOST_KEY}/cash/report_daily.php?date=${dateStr}`
      );
      if (res.data?.success) {
        setReportData({
          openingCash: Number(res.data.openingCash || 0),
          totalIn: Number(res.data.totalIn || 0),
          totalOut: Number(res.data.totalOut || 0),
          net: Number(res.data.net || 0),
          closingBalance: Number(res.data.closingBalance || 0),
          cashInList: res.data.cashInList || [],
          cashOutList: res.data.cashOutList || [],
        });
      }
    } catch (err) {
      console.error("Error fetching daily cash report:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyCashData(selectedDate);
  }, [selectedDate]);

  const [year, month, day] = (selectedDate || "").split("-");
  const monthObj = MONTHS.find((m) => m.value === Number(month));
  const formattedDate = `${monthObj?.label || month} ${Number(day)}, ${year}`;

  // 📊 Grouping Logic for Cash In
  const categoryInGroups = useMemo(() => {
    const map = {};
    (reportData.cashInList || []).forEach((item) => {
      const catKey = String(item.category || "others").trim() || "others";
      if (!map[catKey]) {
        const info = getCategoryInfo(catKey);
        map[catKey] = {
          categoryKey: catKey,
          label: info.label,
          en: info.en,
          color: info.color,
          items: [],
          total: 0,
        };
      }
      map[catKey].items.push(item);
      map[catKey].total += Number(item.amount || 0);
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [reportData.cashInList]);

  // 📊 Grouping Logic for Cash Out
  const categoryOutGroups = useMemo(() => {
    const map = {};
    (reportData.cashOutList || []).forEach((item) => {
      const catKey = String(item.category || "others").trim() || "others";
      if (!map[catKey]) {
        const info = getCategoryInfo(catKey);
        map[catKey] = {
          categoryKey: catKey,
          label: info.label,
          en: info.en,
          color: info.color,
          items: [],
          total: 0,
        };
      }
      map[catKey].items.push(item);
      map[catKey].total += Number(item.amount || 0);
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [reportData.cashOutList]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Daily_Cash_Report_${selectedDate}`,
  });

  const handleSaveToServer = async () => {
    try {
      setIsDriveSaving(true);
      const res = await axios.post(
        `${import.meta.env.VITE_LOCALHOST_KEY}/cash/save_daily_report_drive.php`
      );

      if (res.data?.success) {
        setLuxuryToast({
          title: "সার্ভারে সংরক্ষিত! 📁",
          message: `আজকের দৈনিক রিপোর্টটি সফলভাবে সার্ভারে সেভ হয়েছে (${res.data.file_path || res.data.file_name})।`,
          tag: "Server Saved",
          amount: reportData.net,
          type: "success",
        });
      } else {
        setLuxuryToast({
          title: "সংরক্ষণ ব্যর্থ! ⚠",
          message:
            res.data?.error ||
            "সার্ভারে সেভ করা যায়নি। অনুগ্রহ করে ফোল্ডার পারমিশন চেক করুন।",
          tag: "Save Error",
          type: "error",
        });
      }
    } catch (err) {
      setLuxuryToast({
        title: "সংরক্ষণ ব্যর্থ! ⚠",
        message:
          err.response?.data?.error ||
          err.message ||
          "সার্ভারে ফাইল সেভ করতে সমস্যা হয়েছে।",
        tag: "Save Error",
        type: "error",
      });
    } finally {
      setIsDriveSaving(false);
    }
  };

  return (
    <>
      <div className="bg-white text-black p-6 print:p-2 min-h-screen">
        {/* Top Header & Actions Bar (Hidden in Print) */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-200 print:hidden">
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-gray-700">তারিখ নির্বাচন:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => fetchDailyCashData(selectedDate)}
              title="রিফ্রেশ করুন"
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition"
            >
              <FaSyncAlt className={`text-base ${isLoading ? "animate-spin" : ""}`} />
            </button>

            {/* View Mode Switcher */}
            <div className="ml-2 flex items-center bg-gray-100 p-1 rounded-lg border border-gray-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setViewMode("grouped")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition ${
                  viewMode === "grouped"
                    ? "bg-white text-blue-700 shadow-sm font-bold"
                    : "text-gray-600 hover:text-black"
                }`}
                title="ক্যাটাগরি অনুযায়ী গ্রুপ করে দেখুন"
              >
                <FaLayerGroup />
                <span>ক্যাটাগরি ভিউ</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("flat")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition ${
                  viewMode === "flat"
                    ? "bg-white text-blue-700 shadow-sm font-bold"
                    : "text-gray-600 hover:text-black"
                }`}
                title="একক সরল তালিকা"
              >
                <FaListUl />
                <span>একক তালিকা</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSaveToServer}
              disabled={isDriveSaving || isLoading}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              {isDriveSaving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>সার্ভারে সেভ হচ্ছে...</span>
                </>
              ) : (
                <>
                  <FaCloudUploadAlt className="text-base" />
                  <span>Save Daily Report</span>
                </>
              )}
            </button>

            <button
              onClick={handlePrint}
              disabled={isLoading}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-md transition cursor-pointer"
            >
              <FaPrint className="text-sm" />
              <span>Print Report</span>
            </button>
          </div>
        </div>

        {/* Printable Audit Document Container */}
        <div ref={printRef} className="dashboard-report-print">
          <div className="px-8 pt-4">
            {/* Report Header */}
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                SupplyLink Operational System
              </h1>
              <p className="text-base font-semibold text-gray-600 mt-1">
                Daily Cash Ledger & Audit Report
              </p>
              <p className="text-sm text-gray-500 mt-0.5">তারিখ: {formattedDate}</p>
            </div>

            {/* Executive Cash Summary Box */}
            <div className="border-2 border-black rounded-lg p-6 mb-8 bg-gray-50/50">
              <h2 className="text-xl font-bold text-center mb-5 pb-2 border-b border-gray-300">
                {formattedDate} Cash Summary
              </h2>

              <div className="space-y-3.5 text-base">
                <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                  <span className="font-semibold text-gray-700">💰 1. Opening Cash Balance</span>
                  <span className="font-bold text-gray-900">
                    ৳ {reportData.openingCash.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                  <span className="font-semibold text-gray-700">🟢 2. Today Approved Cash In</span>
                  <span className="font-bold text-emerald-600">
                    ৳ {reportData.totalIn.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                  <span className="font-semibold text-gray-700">🔴 3. Today Approved Cash Out</span>
                  <span className="font-bold text-rose-600">
                    ৳ {reportData.totalOut.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2 text-lg">
                  <span className="font-bold text-gray-900">💵 4. Closing Hand Cash Balance</span>
                  <span
                    className={`font-bold ${
                      reportData.closingBalance >= 0 ? "text-blue-700" : "text-rose-600"
                    }`}
                  >
                    ৳ {reportData.closingBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* 🌟 EXECUTIVE CATEGORY SUMMARY BOX (ক্যাটাগরি-ভিত্তিক আয় ও ব্যয়ের সারসংক্ষেপ) */}
            <div className="mb-10">
              <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 bg-blue-600 rounded-sm"></span>
                <span>ক্যাটাগরি-ভিত্তিক সারসংক্ষেপ (Category Summary Breakdown)</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Cash In Category Summary */}
                <div className="border border-emerald-300 rounded-lg overflow-hidden bg-white shadow-sm">
                  <div className="bg-emerald-700 text-white px-4 py-2 text-sm font-bold flex justify-between items-center">
                    <span>🟢 জমার খাত (Cash In Categories)</span>
                    <span>মোট: ৳ {reportData.totalIn.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <table className="w-full text-xs sm:text-sm">
                    <thead className="bg-emerald-50 text-emerald-950 font-semibold border-b border-emerald-200">
                      <tr>
                        <th className="p-2 text-left">খাত / ক্যাটাগরি</th>
                        <th className="p-2 text-center w-20">ভাউচার</th>
                        <th className="p-2 text-right w-36">পরিমাণ (৳)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categoryInGroups.length > 0 ? (
                        categoryInGroups.map((grp, idx) => (
                          <tr key={idx} className="border-b border-gray-100 hover:bg-emerald-50/30">
                            <td className="p-2 font-medium text-gray-800">
                              {grp.label}
                              <span className="block text-[11px] text-gray-400 font-mono">({grp.categoryKey})</span>
                            </td>
                            <td className="p-2 text-center text-gray-600 font-medium">{grp.items.length} টি</td>
                            <td className="p-2 text-right font-bold text-emerald-700">
                              ৳ {grp.total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" className="p-4 text-center text-gray-400 italic">কোনো জমা নেই</td>
                        </tr>
                      )}
                    </tbody>
                    {categoryInGroups.length > 0 && (
                      <tfoot className="bg-emerald-50/60 font-bold border-t border-emerald-200">
                        <tr>
                          <td className="p-2 text-emerald-900">মোট জমা</td>
                          <td className="p-2 text-center text-emerald-900">{reportData.cashInList?.length || 0} টি</td>
                          <td className="p-2 text-right text-emerald-900">
                            ৳ {reportData.totalIn.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>

                {/* Cash Out Category Summary */}
                <div className="border border-rose-300 rounded-lg overflow-hidden bg-white shadow-sm">
                  <div className="bg-rose-700 text-white px-4 py-2 text-sm font-bold flex justify-between items-center">
                    <span>🔴 খরচের খাত (Cash Out Categories)</span>
                    <span>মোট: ৳ {reportData.totalOut.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <table className="w-full text-xs sm:text-sm">
                    <thead className="bg-rose-50 text-rose-950 font-semibold border-b border-rose-200">
                      <tr>
                        <th className="p-2 text-left">খাত / ক্যাটাগরি</th>
                        <th className="p-2 text-center w-20">ভাউচার</th>
                        <th className="p-2 text-right w-36">পরিমাণ (৳)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categoryOutGroups.length > 0 ? (
                        categoryOutGroups.map((grp, idx) => (
                          <tr key={idx} className="border-b border-gray-100 hover:bg-rose-50/30">
                            <td className="p-2 font-medium text-gray-800">
                              {grp.label}
                              <span className="block text-[11px] text-gray-400 font-mono">({grp.categoryKey})</span>
                            </td>
                            <td className="p-2 text-center text-gray-600 font-medium">{grp.items.length} টি</td>
                            <td className="p-2 text-right font-bold text-rose-700">
                              ৳ {grp.total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" className="p-4 text-center text-gray-400 italic">কোনো খরচ নেই</td>
                        </tr>
                      )}
                    </tbody>
                    {categoryOutGroups.length > 0 && (
                      <tfoot className="bg-rose-50/60 font-bold border-t border-rose-200">
                        <tr>
                          <td className="p-2 text-rose-900">মোট খরচ</td>
                          <td className="p-2 text-center text-rose-900">{reportData.cashOutList?.length || 0} টি</td>
                          <td className="p-2 text-right text-rose-900">
                            ৳ {reportData.totalOut.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            </div>

            {/* 📁 Table 1: Approved Cash In Transactions */}
            <div className="mb-10">
              <div className="bg-emerald-800 text-white px-4 py-2.5 rounded-t-lg font-bold text-sm sm:text-base flex justify-between items-center">
                <span>1. Approved Cash In Transactions (আজকের মোট জমা)</span>
                <span className="text-emerald-100 font-extrabold">
                  সর্বমোট: ৳ {reportData.totalIn.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>

              {viewMode === "grouped" ? (
                // 📂 Grouped by Category View
                categoryInGroups.length > 0 ? (
                  categoryInGroups.map((grp, gIdx) => (
                    <div key={gIdx} className="border-x border-b border-gray-300">
                      {/* Category Header Row */}
                      <div className="bg-emerald-50 px-4 py-2 border-b border-emerald-200 flex justify-between items-center text-xs sm:text-sm font-bold">
                        <span className="text-emerald-950 flex items-center gap-2">
                          <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                          <span>{grp.label}</span>
                          <span className="text-[11px] font-mono text-gray-500 font-normal">({grp.categoryKey})</span>
                        </span>
                        <span className="text-emerald-800 font-extrabold">
                          {grp.items.length} টি ভাউচার | সাব-টোটাল: ৳ {grp.total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      {/* Items Table */}
                      <table className="w-full text-xs sm:text-sm border-collapse">
                        <thead>
                          <tr className="bg-gray-50 text-gray-700 text-xs border-b border-gray-200">
                            <th className="p-2 text-center w-12">#</th>
                            <th className="p-2 text-left w-24">Voucher</th>
                            <th className="p-2 text-left">Source / Depositor</th>
                            <th className="p-2 text-left">Purpose / Particulars</th>
                            <th className="p-2 text-right w-36">Amount (৳)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {grp.items.map((item, idx) => (
                            <tr key={item.id ?? idx} className="border-b border-gray-100 hover:bg-gray-50/40">
                              <td className="p-2 text-center text-gray-500 text-xs">{idx + 1}</td>
                              <td className="p-2 font-mono font-semibold text-blue-700 text-xs">V-{item.id}</td>
                              <td className="p-2 font-medium text-gray-900">{item.source || "Cash In"}</td>
                              <td className="p-2 text-gray-600">{item.purpose || item.remarks || "-"}</td>
                              <td className="p-2 text-right font-bold text-gray-900">
                                {Number(item.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))
                ) : (
                  <div className="border border-gray-300 p-6 text-center text-gray-500 italic text-sm rounded-b-lg">
                    আজকের জন্য কোনো অনুমোদিত জমা (Cash In) পাওয়া যায়নি।
                  </div>
                )
              ) : (
                // 📋 Flat List View
                reportData.cashInList?.length > 0 ? (
                  <div className="border-x border-b border-gray-300 rounded-b-lg overflow-hidden">
                    <table className="w-full text-xs sm:text-sm border-collapse">
                      <thead>
                        <tr className="bg-gray-100 text-gray-700 text-xs border-b border-gray-200 font-bold">
                          <th className="p-2 text-center w-12">#</th>
                          <th className="p-2 text-left w-24">Voucher</th>
                          <th className="p-2 text-left">Source / Depositor</th>
                          <th className="p-2 text-left">Purpose / Particulars</th>
                          <th className="p-2 text-left w-44">Category</th>
                          <th className="p-2 text-right w-36">Amount (৳)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.cashInList.map((item, idx) => (
                          <tr key={item.id ?? idx} className="border-b border-gray-100 hover:bg-gray-50/40">
                            <td className="p-2 text-center text-gray-500 text-xs">{idx + 1}</td>
                            <td className="p-2 font-mono font-semibold text-blue-700 text-xs">V-{item.id}</td>
                            <td className="p-2 font-medium text-gray-900">{item.source || "Cash In"}</td>
                            <td className="p-2 text-gray-600">{item.purpose || item.remarks || "-"}</td>
                            <td className="p-2 text-gray-700 text-xs font-medium">
                              {getCategoryInfo(item.category).label}
                            </td>
                            <td className="p-2 text-right font-bold text-gray-900">
                              {Number(item.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="border border-gray-300 p-6 text-center text-gray-500 italic text-sm rounded-b-lg">
                    আজকের জন্য কোনো অনুমোদিত জমা (Cash In) পাওয়া যায়নি।
                  </div>
                )
              )}

              {reportData.cashInList?.length > 0 && (
                <div className="bg-emerald-50 border border-emerald-300 px-4 py-2.5 rounded-b-lg flex justify-between items-center font-bold text-emerald-950 mt-[-1px]">
                  <span>মোট অনুমোদিত ক্যাশ ইন (Total Cash In)</span>
                  <span className="text-base sm:text-lg">
                    ৳ {reportData.totalIn.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </div>

            {/* 📁 Table 2: Approved Cash Out Transactions */}
            <div className="mb-10">
              <div className="bg-rose-800 text-white px-4 py-2.5 rounded-t-lg font-bold text-sm sm:text-base flex justify-between items-center">
                <span>2. Approved Cash Out Transactions (আজকের মোট খরচ ও প্রদান)</span>
                <span className="text-rose-100 font-extrabold">
                  সর্বমোট: ৳ {reportData.totalOut.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>

              {viewMode === "grouped" ? (
                // 📂 Grouped by Category View
                categoryOutGroups.length > 0 ? (
                  categoryOutGroups.map((grp, gIdx) => (
                    <div key={gIdx} className="border-x border-b border-gray-300">
                      {/* Category Header Row */}
                      <div className="bg-rose-50 px-4 py-2 border-b border-rose-200 flex justify-between items-center text-xs sm:text-sm font-bold">
                        <span className="text-rose-950 flex items-center gap-2">
                          <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-600"></span>
                          <span>{grp.label}</span>
                          <span className="text-[11px] font-mono text-gray-500 font-normal">({grp.categoryKey})</span>
                        </span>
                        <span className="text-rose-800 font-extrabold">
                          {grp.items.length} টি ভাউচার | সাব-টোটাল: ৳ {grp.total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      {/* Items Table */}
                      <table className="w-full text-xs sm:text-sm border-collapse">
                        <thead>
                          <tr className="bg-gray-50 text-gray-700 text-xs border-b border-gray-200">
                            <th className="p-2 text-center w-12">#</th>
                            <th className="p-2 text-left w-24">Voucher</th>
                            <th className="p-2 text-left">Expense Head / Source</th>
                            <th className="p-2 text-left">Purpose / Particulars</th>
                            <th className="p-2 text-right w-36">Amount (৳)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {grp.items.map((item, idx) => (
                            <tr key={item.id ?? idx} className="border-b border-gray-100 hover:bg-gray-50/40">
                              <td className="p-2 text-center text-gray-500 text-xs">{idx + 1}</td>
                              <td className="p-2 font-mono font-semibold text-rose-700 text-xs">V-{item.id}</td>
                              <td className="p-2 font-medium text-gray-900">{item.source || "Expense"}</td>
                              <td className="p-2 text-gray-600">{item.purpose || item.remarks || "-"}</td>
                              <td className="p-2 text-right font-bold text-gray-900">
                                {Number(item.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))
                ) : (
                  <div className="border border-gray-300 p-6 text-center text-gray-500 italic text-sm rounded-b-lg">
                    আজকের জন্য কোনো অনুমোদিত খরচ (Cash Out) পাওয়া যায়নি।
                  </div>
                )
              ) : (
                // 📋 Flat List View
                reportData.cashOutList?.length > 0 ? (
                  <div className="border-x border-b border-gray-300 rounded-b-lg overflow-hidden">
                    <table className="w-full text-xs sm:text-sm border-collapse">
                      <thead>
                        <tr className="bg-gray-100 text-gray-700 text-xs border-b border-gray-200 font-bold">
                          <th className="p-2 text-center w-12">#</th>
                          <th className="p-2 text-left w-24">Voucher</th>
                          <th className="p-2 text-left">Expense Head / Source</th>
                          <th className="p-2 text-left">Purpose / Particulars</th>
                          <th className="p-2 text-left w-44">Category</th>
                          <th className="p-2 text-right w-36">Amount (৳)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.cashOutList.map((item, idx) => (
                          <tr key={item.id ?? idx} className="border-b border-gray-100 hover:bg-gray-50/40">
                            <td className="p-2 text-center text-gray-500 text-xs">{idx + 1}</td>
                            <td className="p-2 font-mono font-semibold text-rose-700 text-xs">V-{item.id}</td>
                            <td className="p-2 font-medium text-gray-900">{item.source || "Expense"}</td>
                            <td className="p-2 text-gray-600">{item.purpose || item.remarks || "-"}</td>
                            <td className="p-2 text-gray-700 text-xs font-medium">
                              {getCategoryInfo(item.category).label}
                            </td>
                            <td className="p-2 text-right font-bold text-gray-900">
                              {Number(item.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="border border-gray-300 p-6 text-center text-gray-500 italic text-sm rounded-b-lg">
                    আজকের জন্য কোনো অনুমোদিত খরচ (Cash Out) পাওয়া যায়নি।
                  </div>
                )
              )}

              {reportData.cashOutList?.length > 0 && (
                <div className="bg-rose-50 border border-rose-300 px-4 py-2.5 rounded-b-lg flex justify-between items-center font-bold text-rose-950 mt-[-1px]">
                  <span>মোট অনুমোদিত ক্যাশ আউট (Total Cash Out)</span>
                  <span className="text-base sm:text-lg">
                    ৳ {reportData.totalOut.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </div>

            {/* Signature Block for Official Print */}
            <div className="mt-16 pt-8 border-t border-gray-300 grid grid-cols-3 gap-8 text-center text-sm font-semibold text-gray-700">
              <div>
                <div className="border-t border-gray-400 w-3/4 mx-auto mb-2" />
                Prepared By
              </div>
              <div>
                <div className="border-t border-gray-400 w-3/4 mx-auto mb-2" />
                Checked By
              </div>
              <div>
                <div className="border-t border-gray-400 w-3/4 mx-auto mb-2" />
                Approved By (Manager / Director)
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .dashboard-report-print {
          background: #fff;
          color: #000;
          width: 100%;
        }

        .dashboard-report-print table {
          width: 100%;
          border-collapse: collapse;
        }

        .dashboard-report-print th,
        .dashboard-report-print td {
          border: 1px solid #d1d5db;
          padding: 8px;
          font-size: 13px;
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }

          .dashboard-report-print {
            padding: 0 !important;
          }

          .dashboard-report-print table {
            page-break-inside: auto;
          }

          .dashboard-report-print tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
        }
      `}</style>

      {luxuryToast && (
        <LuxuryToast
          title={luxuryToast.title}
          message={luxuryToast.message}
          tag={luxuryToast.tag}
          amount={luxuryToast.amount}
          type={luxuryToast.type}
          onClose={() => setLuxuryToast(null)}
        />
      )}
    </>
  );
};

export default DashboardReport;
