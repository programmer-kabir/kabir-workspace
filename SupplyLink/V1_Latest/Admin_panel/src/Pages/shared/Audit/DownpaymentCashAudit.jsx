import React, { useState, useEffect, useMemo } from "react";
import BackButton from "../../../components/BackButton/BackButton";
import LuxuryToast from "../../../components/Modal/LuxuryToast";
import Loader from "../../../components/Loader/Loader";
import { useAuth } from "../../../Provider/AuthProvider";
import useUserRole from "../../../utils/Hooks/useUserRole";
import { Link } from "react-router-dom";
import {
  TbShieldCheck,
  TbAlertTriangle,
  TbCheck,
  TbReceipt,
  TbCashBanknote,
  TbRefresh,
  TbSearch,
  TbFilter,
  TbCalendar,
  TbArrowRight,
  TbTrash,
  TbWand,
  TbChecklist,
  TbClock,
  TbInfoCircle,
} from "react-icons/tb";
import {
  FaHistory,
  FaFileInvoiceDollar,
  FaExclamationCircle,
  FaArrowUp,
  FaArrowDown,
} from "react-icons/fa";

const API = import.meta.env.VITE_LOCALHOST_KEY;

export default function DownpaymentCashAudit() {
  const { user } = useAuth();
  const { isAdminOrDev } = useUserRole();

  // Date filters - default to 1st of current month to today
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  const [loading, setLoading] = useState(false);
  const [auditData, setAuditData] = useState(null);
  const [luxuryToast, setLuxuryToast] = useState(null);
  const [activeTab, setActiveTab] = useState("discrepancies"); // discrepancies | daily | all
  const [searchQuery, setSearchQuery] = useState("");
  const [discrepancyFilter, setDiscrepancyFilter] = useState("all"); // all | missing_in_cash | amount_mismatch | date_mismatch | ghost_cash

  // Single Fix / Ghost Delete loading
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Bulk Sync Modal
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [removeOldLumps, setRemoveOldLumps] = useState(false);
  const [syncingBulk, setSyncingBulk] = useState(false);

  // Quick Date Select Helper
  const setQuickDate = (type) => {
    const today = new Date();
    if (type === "this_month") {
      const start = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
      const end = today.toISOString().split("T")[0];
      setStartDate(start);
      setEndDate(end);
    } else if (type === "last_month") {
      const firstOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      setStartDate(firstOfLastMonth.toISOString().split("T")[0]);
      setEndDate(lastOfLastMonth.toISOString().split("T")[0]);
    } else if (type === "today") {
      const t = today.toISOString().split("T")[0];
      setStartDate(t);
      setEndDate(t);
    } else if (type === "last_7") {
      const past = new Date();
      past.setDate(past.getDate() - 7);
      setStartDate(past.toISOString().split("T")[0]);
      setEndDate(today.toISOString().split("T")[0]);
    } else if (type === "all_time") {
      setStartDate("2025-01-01");
      setEndDate(today.toISOString().split("T")[0]);
    }
  };

  // Fetch Audit Data
  const runAudit = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `${API}/utils/sync_date_downpayment_to_cash.php?format=json&start_date=${startDate}&end_date=${endDate}&action=audit`
      );
      const data = await res.json();
      if (data.success) {
        setAuditData(data);
      } else {
        setLuxuryToast({
          title: "অডিট ত্রুটি ⚠️",
          message: data.message || data.error || "অডিট ডেটা লোড করা যায়নি।",
          type: "error",
        });
      }
    } catch (err) {
      setLuxuryToast({
        title: "নেটওয়ার্ক ত্রুটি ⚠️",
        message: err.message,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runAudit();
  }, [startDate, endDate]);

  // Fix Single Down Payment to Cash
  const handleFixSingle = async (paymentId) => {
    try {
      setActionLoadingId(`fix_${paymentId}`);
      const res = await fetch(
        `${API}/utils/sync_date_downpayment_to_cash.php`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "fix_single",
            payment_id: paymentId,
            format: "json",
          }),
        }
      );
      const data = await res.json();
      if (data.success) {
        setLuxuryToast({
          title: "সমাধান সফল! 🟢",
          message: data.message,
          type: "success",
        });
        runAudit();
      } else {
        setLuxuryToast({
          title: "সমাধান ব্যর্থ ⚠️",
          message: data.message || "সিঙ্ক করা সম্ভব হয়নি।",
          type: "error",
        });
      }
    } catch (err) {
      setLuxuryToast({
        title: "ত্রুটি ⚠️",
        message: err.message,
        type: "error",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Delete Ghost Cash Entry
  const handleDeleteGhost = async (cashId) => {
    if (!window.confirm("আপনি কি নিশ্চিতভাবে এই অবাঞ্ছিত ক্যাশ এন্ট্রিটি মুছে ফেলতে চান?")) {
      return;
    }
    try {
      setActionLoadingId(`del_${cashId}`);
      const res = await fetch(
        `${API}/utils/sync_date_downpayment_to_cash.php`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "delete_ghost",
            cash_id: cashId,
            format: "json",
          }),
        }
      );
      const data = await res.json();
      if (data.success) {
        setLuxuryToast({
          title: "মুছে ফেলা হয়েছে 🗑️",
          message: data.message,
          type: "success",
        });
        runAudit();
      } else {
        setLuxuryToast({
          title: "ব্যর্থ ⚠️",
          message: data.message || "মুছে ফেলা সম্ভব হয়নি।",
          type: "error",
        });
      }
    } catch (err) {
      setLuxuryToast({
        title: "ত্রুটি ⚠️",
        message: err.message,
        type: "error",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Bulk Sync
  const handleBulkSync = async () => {
    try {
      setSyncingBulk(true);
      const res = await fetch(
        `${API}/utils/sync_date_downpayment_to_cash.php`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "sync",
            start_date: startDate,
            end_date: endDate,
            remove_old_lumps: removeOldLumps ? 1 : 0,
            format: "json",
          }),
        }
      );
      const data = await res.json();
      if (data.success) {
        setShowSyncModal(false);
        setLuxuryToast({
          title: "সিঙ্ক সম্পন্ন! 🟢",
          message: `${data.summary?.inserted_count || 0} টি ডাউন পেমেন্ট ক্যাশে সফলভাবে সিঙ্ক হয়েছে।`,
          type: "success",
        });
        runAudit();
      } else {
        setLuxuryToast({
          title: "সিঙ্ক ত্রুটি ⚠️",
          message: data.message || data.error || "সিঙ্ক সম্পন্ন করা যায়নি।",
          type: "error",
        });
      }
    } catch (err) {
      setLuxuryToast({
        title: "নেটওয়ার্ক ত্রুটি ⚠️",
        message: err.message,
        type: "error",
      });
    } finally {
      setSyncingBulk(false);
    }
  };

  // Filtered Discrepancies
  const filteredDiscrepancies = useMemo(() => {
    if (!auditData?.discrepancies) return [];
    let list = auditData.discrepancies;
    if (discrepancyFilter !== "all") {
      list = list.filter((d) => d.type === discrepancyFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (d) =>
          (d.customer_name && d.customer_name.toLowerCase().includes(q)) ||
          (d.card_number && String(d.card_number).includes(q)) ||
          (d.title && d.title.toLowerCase().includes(q)) ||
          (d.description && d.description.toLowerCase().includes(q)) ||
          (d.paid_date && d.paid_date.includes(q))
      );
    }
    return list;
  }, [auditData?.discrepancies, discrepancyFilter, searchQuery]);

  // Filtered All Payments
  const filteredAllPayments = useMemo(() => {
    if (!auditData?.all_payments) return [];
    if (!searchQuery.trim()) return auditData.all_payments;
    const q = searchQuery.toLowerCase();
    return auditData.all_payments.filter(
      (p) =>
        (p.customer_name && p.customer_name.toLowerCase().includes(q)) ||
        (p.card_number && String(p.card_number).includes(q)) ||
        (p.product_name && p.product_name.toLowerCase().includes(q)) ||
        (p.paid_date && p.paid_date.includes(q))
    );
  }, [auditData?.all_payments, searchQuery]);

  const summary = auditData?.summary;
  const isAllMatched = summary?.all_matched;

  return (
    <div className="w-full min-h-screen p-4 sm:p-6 lg:p-8 bg-[#0b1329] text-gray-100 flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-5">
        <div>
          <BackButton />
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400 mt-2">
            <span>Audit Panel</span>
            <span>•</span>
            <span>Down Payment & Cash Ledger Reconciliation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3 mt-1">
            <span className="p-2 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/20">
              <TbReceipt className="text-2xl" />
            </span>
            ডাউন পেমেন্ট ও ক্যাশ অডিট প্যানেল
          </h1>
          <p className="text-sm text-gray-400 mt-1 max-w-3xl">
            গ্রাহক কার্ডে ডাউন পেমেন্টের বিপরীতে ক্যাশ ম্যানেজমেন্টে টাকা জমা পড়ার পূর্ণাঙ্গ যাচাই, কিস্তির সাথে সংমিশ্রণ প্রতিরোধ ও অডিট সমাধান।
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-3">
          <Link
            to="/cash/gap-tracker"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-sm font-medium transition shadow-sm"
          >
            <FaHistory />
            অতীত ঘাটতি ট্র্যাকার
          </Link>
          <button
            onClick={runAudit}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 text-sm font-medium transition shadow-sm"
          >
            <TbRefresh className={`text-base ${loading ? "animate-spin text-cyan-400" : ""}`} />
            রিফ্রেশ অডিট
          </button>
        </div>
      </div>

      {/* Date Range & Quick Picker Bar */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-gray-900/90 via-[#101b38] to-gray-900/90 border border-gray-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-950/70 border border-gray-800 px-3.5 py-2 rounded-xl text-sm">
            <TbCalendar className="text-cyan-400 text-lg" />
            <span className="text-gray-400 text-xs">সময়সীমা নির্ধারণ:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer text-xs sm:text-sm"
            />
            <span className="text-gray-500 px-1">থেকে</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer text-xs sm:text-sm"
            />
          </div>

          {/* Quick Select Buttons */}
          <div className="flex items-center gap-1.5 bg-gray-950/40 p-1 rounded-xl border border-gray-800 text-xs">
            <button
              onClick={() => setQuickDate("this_month")}
              className="px-2.5 py-1.5 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white transition"
            >
              চলতি মাস
            </button>
            <button
              onClick={() => setQuickDate("last_month")}
              className="px-2.5 py-1.5 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white transition"
            >
              গত মাস
            </button>
            <button
              onClick={() => setQuickDate("today")}
              className="px-2.5 py-1.5 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white transition"
            >
              আজ
            </button>
            <button
              onClick={() => setQuickDate("last_7")}
              className="px-2.5 py-1.5 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white transition"
            >
              গত ৭ দিন
            </button>
            <button
              onClick={() => setQuickDate("all_time")}
              className="px-2.5 py-1.5 rounded-lg hover:bg-cyan-900/30 text-cyan-300 hover:text-cyan-100 transition"
            >
              সব সময়
            </button>
          </div>
        </div>

        {/* Bulk Sync Trigger */}
        {summary && summary.to_insert_count > 0 && (
          <button
            onClick={() => setShowSyncModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm shadow-lg shadow-emerald-600/20 transition transform active:scale-95"
          >
            <TbWand className="text-lg" />
            এক ক্লিকে সিঙ্ক ({summary.to_insert_count})
          </button>
        )}
      </div>

      {/* KPI Cards Row */}
      {summary ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Customer Card Paid */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-gray-900/90 to-[#101b38] border border-gray-800 hover:border-gray-700 transition relative overflow-hidden group shadow-lg">
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                গ্রাহক কার্ড মোট ডাউন পেমেন্ট
              </span>
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
                <TbReceipt className="text-xl" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
                ৳ {Number(summary.total_card_paid_amount || 0).toLocaleString("en-IN")}
              </div>
              <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                <span>মোট ডাউন পেমেন্ট সংখ্যা:</span>
                <span className="font-semibold text-cyan-300">{summary.total_card_paid_count} টি</span>
              </div>
            </div>
          </div>

          {/* Card 2: Cash Ledger Total */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-gray-900/90 to-[#101b38] border border-gray-800 hover:border-gray-700 transition relative overflow-hidden group shadow-lg">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                ক্যাশ লেজারে মোট জমা
              </span>
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
                <TbCashBanknote className="text-xl" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl lg:text-3xl font-extrabold text-blue-200 tracking-tight">
                ৳ {Number(summary.total_cash_in_ledger || 0).toLocaleString("en-IN")}
              </div>
              <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                <span>সিঙ্ক:</span>
                <span className="font-semibold text-blue-300">{summary.total_cash_synced_count} টি</span>
                <span className="text-gray-500">+</span>
                <span>লাম্প-সাম:</span>
                <span className="font-semibold text-amber-300">{summary.old_lumps_count} টি</span>
              </div>
            </div>
          </div>

          {/* Card 3: Old Lump-Sums in Cash */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-gray-900/90 to-[#101b38] border border-gray-800 hover:border-gray-700 transition relative overflow-hidden group shadow-lg">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                পুরনো লাম্প-সাম এন্ট্রি
              </span>
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
                <TbAlertTriangle className="text-xl" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl lg:text-3xl font-extrabold text-amber-300 tracking-tight">
                ৳ {Number(summary.old_lumps_amount || 0).toLocaleString("en-IN")}
              </div>
              <div className="text-xs text-gray-400 mt-1 flex items-center justify-between">
                <span>একত্রিত এন্ট্রি: {summary.old_lumps_count} টি</span>
                <span className="text-[11px] text-amber-400/80">ভাউচারবিহীন</span>
              </div>
            </div>
          </div>

          {/* Card 4: Audit Status */}
          <div
            className={`p-5 rounded-2xl bg-gradient-to-b border transition relative overflow-hidden shadow-lg ${
              isAllMatched
                ? "from-emerald-950/40 to-gray-900/90 border-emerald-500/40"
                : "from-rose-950/40 to-gray-900/90 border-rose-500/40"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                অডিট ফলাফল
              </span>
              <div
                className={`p-2.5 rounded-xl ${
                  isAllMatched
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-rose-500/10 text-rose-400"
                }`}
              >
                {isAllMatched ? (
                  <TbShieldCheck className="text-xl" />
                ) : (
                  <TbAlertTriangle className="text-xl" />
                )}
              </div>
            </div>
            <div className="mt-3">
              <div
                className={`text-xl lg:text-2xl font-bold flex items-center gap-2 ${
                  isAllMatched ? "text-emerald-300" : "text-rose-400"
                }`}
              >
                {isAllMatched ? (
                  <>সব হিসাব সমান্তরাল 🟢</>
                ) : (
                  <>{summary.discrepancies_count} টি গরমিল / মিসিং ⚠️</>
                )}
              </div>
              <div className="text-xs text-gray-400 mt-1 flex items-center justify-between">
                <span>নেট পার্থক্য:</span>
                <span
                  className={`font-semibold ${
                    Math.abs(summary.net_difference || 0) < 0.01
                      ? "text-emerald-400"
                      : "text-rose-400"
                  }`}
                >
                  ৳ {Number(summary.net_difference || 0).toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Navigation Tabs Bar & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveTab("discrepancies")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition whitespace-nowrap ${
              activeTab === "discrepancies"
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm"
                : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
            }`}
          >
            <TbAlertTriangle className="text-base" />
            <span>অসঙ্গতি ও ভুলসমূহ</span>
            {summary && summary.discrepancies_count > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-rose-500 text-white font-bold">
                {summary.discrepancies_count}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("daily")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition whitespace-nowrap ${
              activeTab === "daily"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
            }`}
          >
            <TbCalendar className="text-base" />
            <span>তারিখভিত্তিক তুলনা</span>
            {auditData?.date_stats && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-gray-800 text-gray-300">
                {auditData.date_stats.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("all")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition whitespace-nowrap ${
              activeTab === "all"
                ? "bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm"
                : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
            }`}
          >
            <TbChecklist className="text-base" />
            <span>সম্পূর্ণ ডাউন পেমেন্ট লেজার</span>
            {auditData?.all_payments && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-gray-800 text-gray-300">
                {auditData.all_payments.length}
              </span>
            )}
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[260px]">
          <TbSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base" />
          <input
            type="text"
            placeholder="গ্রাহকের নাম, কার্ড # বা তারিখ খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-900/80 border border-gray-800 focus:border-cyan-500 text-sm text-gray-200 placeholder-gray-500 focus:outline-none transition"
          />
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="p-16 flex flex-col items-center justify-center gap-3 bg-gray-900/40 rounded-2xl border border-gray-800">
          <Loader />
          <p className="text-sm text-gray-400 animate-pulse">
            ডাউন পেমেন্ট ও ক্যাশ লেজার মাইক্রোস্কোপিক অডিট সম্পন্ন হচ্ছে...
          </p>
        </div>
      ) : (
        <>
          {/* TAB 1: DISCREPANCIES */}
          {activeTab === "discrepancies" && (
            <div className="flex flex-col gap-4">
              {/* Sub-filter chips */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                <span className="text-gray-400 flex items-center gap-1">
                  <TbFilter /> ফিল্টার:
                </span>
                <button
                  onClick={() => setDiscrepancyFilter("all")}
                  className={`px-3 py-1.5 rounded-lg border transition ${
                    discrepancyFilter === "all"
                      ? "bg-gray-800 text-white border-gray-600 font-medium"
                      : "bg-transparent text-gray-400 border-gray-800 hover:border-gray-700"
                  }`}
                >
                  সব সমস্যা
                </button>
                <button
                  onClick={() => setDiscrepancyFilter("missing_in_cash")}
                  className={`px-3 py-1.5 rounded-lg border transition ${
                    discrepancyFilter === "missing_in_cash"
                      ? "bg-rose-900/30 text-rose-300 border-rose-500 font-medium"
                      : "bg-transparent text-gray-400 border-gray-800 hover:border-gray-700"
                  }`}
                >
                  ক্যাশে মিসিং
                </button>
                <button
                  onClick={() => setDiscrepancyFilter("amount_mismatch")}
                  className={`px-3 py-1.5 rounded-lg border transition ${
                    discrepancyFilter === "amount_mismatch"
                      ? "bg-amber-900/30 text-amber-300 border-amber-500 font-medium"
                      : "bg-transparent text-gray-400 border-gray-800 hover:border-gray-700"
                  }`}
                >
                  টাকার অমিল
                </button>
                <button
                  onClick={() => setDiscrepancyFilter("date_mismatch")}
                  className={`px-3 py-1.5 rounded-lg border transition ${
                    discrepancyFilter === "date_mismatch"
                      ? "bg-blue-900/30 text-blue-300 border-blue-500 font-medium"
                      : "bg-transparent text-gray-400 border-gray-800 hover:border-gray-700"
                  }`}
                >
                  তারিখের অমিল
                </button>
                <button
                  onClick={() => setDiscrepancyFilter("ghost_cash")}
                  className={`px-3 py-1.5 rounded-lg border transition ${
                    discrepancyFilter === "ghost_cash"
                      ? "bg-purple-900/30 text-purple-300 border-purple-500 font-medium"
                      : "bg-transparent text-gray-400 border-gray-800 hover:border-gray-700"
                  }`}
                >
                  অবাঞ্ছিত ক্যাশ
                </button>
              </div>

              {filteredDiscrepancies.length === 0 ? (
                <div className="p-12 text-center bg-gray-900/40 rounded-2xl border border-gray-800">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-3xl mx-auto mb-3">
                    <TbShieldCheck />
                  </div>
                  <h3 className="text-lg font-bold text-emerald-300">
                    কোনো ডাউন পেমেন্ট গরমিল বা অসঙ্গতি পাওয়া যায়নি!
                  </h3>
                  <p className="text-sm text-gray-400 mt-1 max-w-md mx-auto">
                    এই নির্বাচিত সময়সীমায় গ্রাহকের সমস্ত ডাউন পেমেন্ট এবং ক্যাশ লেজার শতভাগ সমান্তরাল রয়েছে।
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-gray-800 bg-gray-900/60 shadow-xl">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-gray-800 bg-gray-950/70 text-gray-400 font-semibold uppercase tracking-wider text-[11px]">
                        <th className="py-3.5 px-4">ধরণ ও অবস্থা</th>
                        <th className="py-3.5 px-4">তারিখ</th>
                        <th className="py-3.5 px-4">গ্রাহক ও কার্ড</th>
                        <th className="py-3.5 px-4">কার্ডে টাকা</th>
                        <th className="py-3.5 px-4">ক্যাশে টাকা</th>
                        <th className="py-3.5 px-4">পার্থক্য</th>
                        <th className="py-3.5 px-4">বিবরণ / কারণ</th>
                        <th className="py-3.5 px-4 text-center">অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/60">
                      {filteredDiscrepancies.map((d, idx) => {
                        const isFixing =
                          actionLoadingId === `fix_${d.payment_id}` ||
                          actionLoadingId === `del_${d.cash_id}`;

                        let badgeColor = "bg-rose-500/10 text-rose-400 border-rose-500/30";
                        if (d.type === "amount_mismatch")
                          badgeColor = "bg-amber-500/10 text-amber-400 border-amber-500/30";
                        if (d.type === "date_mismatch")
                          badgeColor = "bg-blue-500/10 text-blue-400 border-blue-500/30";
                        if (d.type === "ghost_cash")
                          badgeColor = "bg-purple-500/10 text-purple-400 border-purple-500/30";

                        return (
                          <tr
                            key={idx}
                            className="hover:bg-gray-800/40 transition group"
                          >
                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-block px-2.5 py-1 rounded-lg text-xs font-semibold border ${badgeColor}`}
                              >
                                {d.title}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-mono text-xs text-gray-300">
                              {d.paid_date || "—"}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-white">
                                {d.customer_name || d.source || "গ্রাহক"}
                              </div>
                              {d.card_number && (
                                <div className="text-xs text-cyan-400">
                                  কার্ড #{d.card_number}
                                </div>
                              )}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-cyan-300 font-mono">
                              ৳ {Number(d.card_amount || 0).toLocaleString("en-IN")}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-gray-300 font-mono">
                              ৳ {Number(d.cash_amount || 0).toLocaleString("en-IN")}
                            </td>
                            <td className="py-3.5 px-4 font-bold font-mono">
                              <span
                                className={
                                  (d.difference || 0) > 0
                                    ? "text-rose-400"
                                    : "text-amber-400"
                                }
                              >
                                ৳ {Number(d.difference || 0).toLocaleString("en-IN")}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-xs text-gray-400 max-w-xs">
                              {d.description}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              {d.can_fix && d.payment_id && (
                                <button
                                  onClick={() => handleFixSingle(d.payment_id)}
                                  disabled={isFixing}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition inline-flex items-center gap-1.5"
                                >
                                  {isFixing ? (
                                    <span className="animate-spin">⏳</span>
                                  ) : (
                                    <TbCheck />
                                  )}
                                  ক্যাশে ফিক্স
                                </button>
                              )}
                              {d.can_delete_cash && d.cash_id && (
                                <button
                                  onClick={() => handleDeleteGhost(d.cash_id)}
                                  disabled={isFixing}
                                  className="px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-semibold transition inline-flex items-center gap-1.5"
                                >
                                  {isFixing ? (
                                    <span className="animate-spin">⏳</span>
                                  ) : (
                                    <TbTrash />
                                  )}
                                  ক্যাশ মুছুন
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DAILY COMPARISON */}
          {activeTab === "daily" && (
            <div className="overflow-x-auto rounded-2xl border border-gray-800 bg-gray-900/60 shadow-xl">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-gray-800 bg-gray-950/70 text-gray-400 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4">তারিখ</th>
                    <th className="py-3.5 px-4">কার্ড সংখ্যা</th>
                    <th className="py-3.5 px-4">কার্ড মোট টাকা</th>
                    <th className="py-3.5 px-4">ক্যাশ সিঙ্ক সংখ্যা</th>
                    <th className="py-3.5 px-4">ক্যাশ সিঙ্ক টাকা</th>
                    <th className="py-3.5 px-4">পুরনো লাম্প-সাম</th>
                    <th className="py-3.5 px-4">ক্যাশে মোট টাকা</th>
                    <th className="py-3.5 px-4">পার্থক্য</th>
                    <th className="py-3.5 px-4 text-center">স্ট্যাটাস</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60 font-mono">
                  {(auditData?.date_stats || []).map((row, idx) => {
                    const totalCash = (row.cash_amount || 0) + (row.old_lump_amount || 0);
                    const diff = (row.card_amount || 0) - totalCash;
                    const isMatched = Math.abs(diff) < 0.01;

                    return (
                      <tr
                        key={idx}
                        className="hover:bg-gray-800/40 transition group"
                      >
                        <td className="py-3.5 px-4 font-bold text-white">
                          {row.date}
                        </td>
                        <td className="py-3.5 px-4 text-gray-300">
                          {row.card_count || 0}
                        </td>
                        <td className="py-3.5 px-4 text-cyan-300 font-bold">
                          ৳ {Number(row.card_amount || 0).toLocaleString("en-IN")}
                        </td>
                        <td className="py-3.5 px-4 text-gray-300">
                          {row.cash_count || 0}
                        </td>
                        <td className="py-3.5 px-4 text-blue-300 font-bold">
                          ৳ {Number(row.cash_amount || 0).toLocaleString("en-IN")}
                        </td>
                        <td className="py-3.5 px-4 text-amber-300">
                          ৳ {Number(row.old_lump_amount || 0).toLocaleString("en-IN")}
                        </td>
                        <td className="py-3.5 px-4 text-gray-200 font-bold">
                          ৳ {Number(totalCash).toLocaleString("en-IN")}
                        </td>
                        <td className="py-3.5 px-4 font-bold">
                          <span
                            className={
                              isMatched
                                ? "text-emerald-400"
                                : diff > 0
                                ? "text-rose-400"
                                : "text-amber-400"
                            }
                          >
                            ৳ {Number(diff).toLocaleString("en-IN")}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {isMatched ? (
                            <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                              মিল রয়েছে 🟢
                            </span>
                          ) : (
                            <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                              গরমিল 🔴
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: ALL DOWNPAYMENTS */}
          {activeTab === "all" && (
            <div className="overflow-x-auto rounded-2xl border border-gray-800 bg-gray-900/60 shadow-xl">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-gray-800 bg-gray-950/70 text-gray-400 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4">পেমেন্ট আইডি</th>
                    <th className="py-3.5 px-4">তারিখ</th>
                    <th className="py-3.5 px-4">গ্রাহকের নাম ও কার্ড</th>
                    <th className="py-3.5 px-4">পণ্য</th>
                    <th className="py-3.5 px-4">ডাউন পেমেন্ট</th>
                    <th className="py-3.5 px-4">পদ্ধতি ও রশিদ</th>
                    <th className="py-3.5 px-4">ক্যাশ সিঙ্ক স্ট্যাটাস</th>
                    <th className="py-3.5 px-4 text-center">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {filteredAllPayments.map((p, idx) => {
                    const isSynced = p.cash_synced;
                    const isFixing = actionLoadingId === `fix_${p.payment_id}`;

                    return (
                      <tr
                        key={idx}
                        className="hover:bg-gray-800/40 transition group"
                      >
                        <td className="py-3.5 px-4 font-mono text-gray-400">
                          #{p.payment_id}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-gray-300">
                          {p.paid_date}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-white">
                            {p.customer_name || "গ্রাহক"}
                          </div>
                          <div className="text-xs text-cyan-400 font-mono">
                            কার্ড #{p.card_number}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-gray-300 max-w-xs truncate">
                          {p.product_name || "—"}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-cyan-300 font-mono">
                          ৳ {Number(p.amount || 0).toLocaleString("en-IN")}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-gray-400">
                          <div>{p.payment_method || "Cash"}</div>
                          {p.receipt_number && (
                            <div className="font-mono text-gray-500">
                              #{p.receipt_number}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {isSynced ? (
                            <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                              সিঙ্ক হয়েছে 🟢
                            </span>
                          ) : (
                            <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                              ক্যাশে নেই ⚠️
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {!isSynced && (
                            <button
                              onClick={() => handleFixSingle(p.payment_id)}
                              disabled={isFixing}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition inline-flex items-center gap-1"
                            >
                              {isFixing ? (
                                <span className="animate-spin">⏳</span>
                              ) : (
                                <TbCheck />
                              )}
                              ক্যাশে ফিক্স
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Bulk Sync Modal */}
      {showSyncModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#101b38] border border-gray-700 w-full max-w-lg rounded-2xl p-6 shadow-2xl flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <TbWand className="text-cyan-400 text-xl" />
                এক ক্লিকে ডাউন পেমেন্ট সিঙ্ক
              </h3>
              <button
                onClick={() => setShowSyncModal(false)}
                className="text-gray-400 hover:text-white text-xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="text-sm text-gray-300 flex flex-col gap-3">
              <p>
                আপনি{" "}
                <span className="font-semibold text-cyan-300">
                  {startDate}
                </span>{" "}
                থেকে{" "}
                <span className="font-semibold text-cyan-300">
                  {endDate}
                </span>{" "}
                তারিখের মধ্যে{" "}
                <span className="font-bold text-white">
                  {summary?.to_insert_count}
                </span>{" "}
                টি ডাউন পেমেন্ট (মোট ৳ {Number(summary?.to_insert_amount || 0).toLocaleString("en-IN")}) ক্যাশ ম্যানেজমেন্টে ইনসার্ট করতে যাচ্ছেন।
              </p>

              {summary && summary.old_lumps_count > 0 && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col gap-2">
                  <div className="flex items-start gap-2 text-amber-300 font-semibold text-xs">
                    <TbAlertTriangle className="text-lg shrink-0 mt-0.5" />
                    <span>
                      পুরনো ভাউচারবিহীন লাম্প-সাম ক্যাশ এন্ট্রি সনাক্ত হয়েছে!
                    </span>
                  </div>
                  <p className="text-xs text-amber-200/80 pl-6">
                    এই তারিখে ৳ {Number(summary.old_lumps_amount || 0).toLocaleString("en-IN")} টাকার {summary.old_lumps_count} টি পুরানো একত্রিত এন্ট্রি রয়েছে।
                  </p>
                  <label className="flex items-center gap-2 text-xs font-semibold text-white pl-6 cursor-pointer mt-1">
                    <input
                      type="checkbox"
                      checked={removeOldLumps}
                      onChange={(e) => setRemoveOldLumps(e.target.checked)}
                      className="rounded accent-cyan-500 w-4 h-4 cursor-pointer"
                    />
                    <span>পুরনো লাম্প-সাম এন্ট্রি মুছে ফেলে নতুন ভাউচার দিয়ে প্রতিস্থাপন করুন (ডুপ্লিকেট ব্যালেন্স এড়াতে এটি সুপারিশকৃত)</span>
                  </label>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-800">
              <button
                onClick={() => setShowSyncModal(false)}
                disabled={syncingBulk}
                className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium transition"
              >
                বাতিল
              </button>
              <button
                onClick={handleBulkSync}
                disabled={syncingBulk}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-semibold transition flex items-center gap-2 shadow-lg shadow-emerald-600/20"
              >
                {syncingBulk ? (
                  <>
                    <span className="animate-spin">⏳</span> সিঙ্ক হচ্ছে...
                  </>
                ) : (
                  <>
                    <TbCheck /> নিশ্চিত সিঙ্ক করুন
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LuxuryToast Notifications */}
      {luxuryToast && (
        <LuxuryToast
          title={luxuryToast.title}
          message={luxuryToast.message}
          type={luxuryToast.type}
          onClose={() => setLuxuryToast(null)}
        />
      )}
    </div>
  );
}

