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
  TbDiscount,
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

export default function MonthlyInstallmentCashAudit() {
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
  const [activeTab, setActiveTab] = useState("discrepancies"); // discrepancies | discounts | daily | all
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
    }
  };

  // Fetch Audit Data
  const runAudit = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `${API}/utils/sync_date_monthly_installments_to_cash.php?format=json&start_date=${startDate}&end_date=${endDate}&action=audit`
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

  // Fix Single Payment to Cash
  const handleFixSingle = async (paymentId) => {
    try {
      setActionLoadingId(`fix_${paymentId}`);
      const res = await fetch(
        `${API}/utils/sync_date_monthly_installments_to_cash.php`,
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
        title: "সার্ভার ত্রুটি ⚠️",
        message: err.message,
        type: "error",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Delete Ghost Cash Entry
  const handleDeleteGhost = async (cashId) => {
    if (!window.confirm("আপনি কি নিশ্চিত এই অবাঞ্ছিত ক্যাশ এন্ট্রিটি মুছে ফেলতে চান?")) {
      return;
    }
    try {
      setActionLoadingId(`del_${cashId}`);
      const res = await fetch(
        `${API}/utils/sync_date_monthly_installments_to_cash.php`,
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
          title: "মুছে ফেলা সফল! 🟢",
          message: data.message,
          type: "success",
        });
        runAudit();
      } else {
        setLuxuryToast({
          title: "ব্যর্থ ⚠️",
          message: data.message,
          type: "error",
        });
      }
    } catch (err) {
      setLuxuryToast({
        title: "সার্ভার ত্রুটি ⚠️",
        message: err.message,
        type: "error",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Bulk Safe Sync
  const handleBulkSync = async () => {
    try {
      setSyncingBulk(true);
      const res = await fetch(
        `${API}/utils/sync_date_monthly_installments_to_cash.php`,
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
          title: "সিঙ্ক সফল! 🎉",
          message: `${data.summary.inserted_count} টি কিস্তি ক্যাশ লেজারে সিঙ্ক করা হয়েছে।`,
          type: "success",
        });
        runAudit();
      } else {
        setLuxuryToast({
          title: "সিঙ্ক ব্যর্থ ⚠️",
          message: data.message || data.error,
          type: "error",
        });
      }
    } catch (err) {
      setLuxuryToast({
        title: "সার্ভার ত্রুটি ⚠️",
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
    return auditData.discrepancies.filter((item) => {
      const matchFilter =
        discrepancyFilter === "all" || item.type === discrepancyFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        String(item.card_number || "").toLowerCase().includes(q) ||
        String(item.customer_name || "").toLowerCase().includes(q) ||
        String(item.description || "").toLowerCase().includes(q);
      return matchFilter && matchSearch;
    });
  }, [auditData, discrepancyFilter, searchQuery]);

  // Filtered All Payments
  const filteredAllPayments = useMemo(() => {
    if (!auditData?.all_payments) return [];
    const q = searchQuery.toLowerCase().trim();
    if (!q) return auditData.all_payments;
    return auditData.all_payments.filter(
      (p) =>
        String(p.card_number || "").toLowerCase().includes(q) ||
        String(p.customer_name || "").toLowerCase().includes(q) ||
        String(p.receipt_number || "").toLowerCase().includes(q) ||
        String(p.product_name || "").toLowerCase().includes(q)
    );
  }, [auditData, searchQuery]);

  const summary = auditData?.summary;

  return (
    <div className="mx-auto  space-y-6 text-slate-200">
      <BackButton />

      {/* 🔹 Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 mb-1 tracking-wider uppercase">
            <TbShieldCheck size={16} />
            <span>AUDIT PANEL • MONTHLY INSTALLMENT & CASH RECONCILIATION</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span>মাসিক কিস্তি ও ক্যাশ অডিট প্যানেল</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
            গ্রাহক কার্ডের পরিশোধিত কিস্তির বিপরীতে ক্যাশ ম্যানেজমেন্টে টাকা জমা পড়ার পূর্ণাঙ্গ যাচাই। 
            বিশেষ ছাড় (Discounts) ও মাফকৃত (Waived) কিস্তির নির্ভুল হিসাব এবং যেকোনো টাকার গরমিল শনাক্তকরণ ও সমাধান।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="px-3.5 py-1.5 rounded-xl bg-purple-500/15 text-purple-300 border border-purple-500/30 text-xs font-bold flex items-center gap-1.5 shadow-sm">
            <TbShieldCheck size={14} className="text-purple-400" />
            <span>এডমিন ও ডেভেলপার ডেস্ক</span>
          </span>

          <a
            href={`${API}/utils/inspect_installment_dates.php?start_date=${startDate}&end_date=${endDate}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center gap-2 transition cursor-pointer shadow-sm"
            title="কার্ডে পরিশোধের তারিখ বনাম ক্যাশে জমার তারিখের পূর্ণাঙ্গ তালিকা খুলুন"
          >
            <TbCalendar size={14} className="text-cyan-400" />
            <span>তারিখ অডিট ইন্সপেক্টর ↗</span>
          </a>

          <button
            onClick={runAudit}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 border border-white/10 text-xs font-semibold flex items-center gap-2 transition cursor-pointer shadow-sm disabled:opacity-50"
          >
            <TbRefresh size={14} className={loading ? "animate-spin text-cyan-400" : "text-slate-400"} />
            <span>{loading ? "অডিট হচ্ছে..." : "রিফ্রেশ অডিট"}</span>
          </button>
        </div>
      </div>

      {/* 🔹 Date Filter Bar */}
      <div className="p-4 rounded-2xl bg-[#091224] border border-white/10 shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 mr-1">
            <TbCalendar size={14} className="text-cyan-400" />
            <span>সময়সীমা নির্বাচন:</span>
          </span>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 transition font-mono"
            />
            <span className="text-xs text-slate-500">থেকে</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 transition font-mono"
            />
          </div>
        </div>

        {/* Quick Date Select Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: "this_month", label: "চলতি মাস" },
            { id: "last_month", label: "গত মাস" },
            { id: "today", label: "আজ" },
            { id: "last_7", label: "গত ৭ দিন" },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setQuickDate(pill.id)}
              className="px-3 py-1.5 rounded-lg bg-slate-800/70 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-white/5 text-[11px] font-medium transition cursor-pointer"
            >
              {pill.label}
            </button>
          ))}

          {/* Sync Button */}
          {summary && summary.to_insert_count > 0 && (
            <button
              onClick={() => setShowSyncModal(true)}
              className="ml-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition cursor-pointer"
            >
              <TbWand size={14} />
              <span>এক ক্লিকে সিঙ্ক ({summary.to_insert_count})</span>
            </button>
          )}
        </div>
      </div>

      {/* 🔹 4 KPI Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Paid in Cards */}
          <div className="relative overflow-hidden rounded-2xl bg-[#091224] border border-emerald-500/25 p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">গ্রাহক কার্ডে মোট পেইড</span>
              <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
                <TbReceipt size={18} />
              </div>
            </div>
            <p className="text-2xl font-black text-emerald-300 font-mono mt-2">
              ৳ {summary.total_card_paid_amount.toLocaleString()}
            </p>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
              <span>মোট কিস্তি সংখ্যা:</span>
              <span className="font-bold text-white font-mono">{summary.total_card_paid_count} টি</span>
            </div>
          </div>

          {/* Card 2: Cash Ledger Total */}
          <div className="relative overflow-hidden rounded-2xl bg-[#091224] border border-cyan-500/25 p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">ক্যাশ লেজারে মোট জমা</span>
              <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400">
                <TbCashBanknote size={18} />
              </div>
            </div>
            <p className="text-2xl font-black text-cyan-300 font-mono mt-2">
              ৳ {summary.total_cash_in_ledger.toLocaleString()}
            </p>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
              <span>সিঙ্ক + লাম্প-সাম:</span>
              <span className="font-bold text-white font-mono">
                {summary.total_cash_synced_count} টি সিঙ্ক + {summary.old_lumps_count} টি লাম্প-সাম
              </span>
            </div>
          </div>

          {/* Card 3: Discounts & Waivers */}
          <div className="relative overflow-hidden rounded-2xl bg-[#091224] border border-amber-500/25 p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">ছাড় ও কিস্তি মাফ</span>
              <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
                <TbDiscount size={18} />
              </div>
            </div>
            <p className="text-2xl font-black text-amber-300 font-mono mt-2">
              ৳ {(summary.total_discount_amount + summary.total_waived_amount).toLocaleString()}
            </p>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
              <span>ছাড়: ৳{summary.total_discount_amount.toLocaleString()}</span>
              <span>মাফ: ৳{summary.total_waived_amount.toLocaleString()}</span>
            </div>
          </div>

          {/* Card 4: Audit Status */}
          <div
            className={`relative overflow-hidden rounded-2xl bg-[#091224] border p-4 shadow-lg ${
              summary.all_matched
                ? "border-emerald-500/40 bg-emerald-950/10"
                : "border-rose-500/40 bg-rose-950/10"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">অডিট ফলাফল</span>
              <div
                className={`p-2 rounded-xl ${
                  summary.all_matched
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-rose-500/20 text-rose-400"
                }`}
              >
                {summary.all_matched ? <TbCheck size={18} /> : <TbAlertTriangle size={18} />}
              </div>
            </div>
            <p
              className={`text-xl font-black mt-2 ${
                summary.all_matched ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {summary.all_matched
                ? "সব হিসাব সমান্তরাল 🟢"
                : `${summary.discrepancies_count} টি গরমিল / মিসিং ⚠️`}
            </p>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
              <span>নেট পার্থক্য:</span>
              <span
                className={`font-bold font-mono ${
                  summary.net_difference === 0
                    ? "text-emerald-400"
                    : summary.net_difference > 0
                    ? "text-rose-400"
                    : "text-amber-400"
                }`}
              >
                ৳ {summary.net_difference.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 🔹 Old Lump-sum Alert Notice (If exists) */}
      {summary && summary.old_lumps_count > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 shadow-sm">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
            <TbInfoCircle size={18} />
          </div>
          <div className="space-y-1 text-xs">
            <h4 className="font-bold text-amber-300 text-sm">
              পুরোনো এককালীন (Lump-sum) ক্যাশ এন্ট্রি সনাক্ত হয়েছে ({summary.old_lumps_count} টি এন্ট্রি, মোট ৳ {summary.old_lumps_amount.toLocaleString()})
            </h4>
            <p className="text-slate-300 leading-relaxed">
              অতীতে প্রতিটি কিস্তি আলাদা আলাদা এন্ট্রি না হয়ে দিনের শেষে এককালীন মোট টাকা ক্যাশে যোগ করা হয়েছিল। 
              বর্তমানে প্রতিটি কিস্তি পৃথকভাবে সিঙ্ক করলে যাতে ক্যাশে ডুপ্লিকেট না হয়, সে জন্য আপনি এক ক্লিকে পুরোনো লাম্প-সাম মুছে নতুন ইন্ডিভিজুয়াল কিস্তি লেজার সিঙ্ক করতে পারেন।
            </p>
          </div>
        </div>
      )}

      {/* 🔹 Tab Navigation & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-1.5 bg-[#091224] p-1.5 rounded-xl border border-white/10 overflow-x-auto">
          {[
            {
              id: "discrepancies",
              label: "🚨 অসঙ্গতি ও ভুলসমূহ",
              count: auditData?.discrepancies?.length || 0,
              highlight: (auditData?.discrepancies?.length || 0) > 0,
            },
            {
              id: "discounts",
              label: "🎁 ছাড় ও মাফ অডিট",
              count:
                (auditData?.discounts_and_waivers?.settlements?.length || 0) +
                (auditData?.discounts_and_waivers?.waived_installments?.length || 0),
            },
            {
              id: "daily",
              label: "⚖️ তারিখভিত্তিক তুলনা",
              count: auditData?.date_stats?.length || 0,
            },
            {
              id: "all",
              label: "📋 সম্পূর্ণ কিস্তি লেজার",
              count: auditData?.all_payments?.length || 0,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                  tab.highlight && activeTab !== tab.id
                    ? "bg-rose-500 text-white"
                    : "bg-white/10"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[260px]">
          <TbSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input
            type="text"
            placeholder="গ্রাহকের নাম, কার্ড # বা বিবরণ খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#091224] border border-white/10 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
          />
        </div>
      </div>

      {/* 🔹 Loading Spinner */}
      {loading && (
        <div className="py-16 flex items-center justify-center">
          <Loader />
        </div>
      )}

      {/* 🔹 TAB CONTENT 1: DISCREPANCIES & MISTAKES */}
      {!loading && activeTab === "discrepancies" && (
        <div className="space-y-4">
          {/* Sub-filter pills */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                <TbFilter size={13} />
                <span>ফিল্টার:</span>
              </span>
              {[
                { id: "all", label: "সব সমস্যা" },
                { id: "missing_in_cash", label: "ক্যাশে মিসিং" },
                { id: "amount_mismatch", label: "টাকার অমিল" },
                { id: "date_mismatch", label: "তারিখের অমিল" },
                { id: "ghost_cash", label: "অবাঞ্ছিত ক্যাশ" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setDiscrepancyFilter(f.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer ${
                    discrepancyFilter === f.id
                      ? "bg-white/15 text-white border border-white/20"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <span className="text-xs text-slate-400">
              পাওয়া গেছে: <strong className="text-white font-mono">{filteredDiscrepancies.length}</strong> টি সমস্যা
            </span>
          </div>

          {filteredDiscrepancies.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[#091224] border border-emerald-500/20 space-y-2">
              <div className="h-12 w-12 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center mx-auto">
                <TbCheck size={24} />
              </div>
              <h3 className="text-base font-bold text-white">কোনো গরমিল বা ভুল পাওয়া যায়নি!</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                এই সময়সীমায় গ্রাহকদের সকল পরিশোধিত কিস্তির হিসাব ক্যাশ ম্যানেজমেন্টের সাথে নিখুঁতভাবে মিলেছে।
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#091224] shadow-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-slate-900/60 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4">ধরন ও অবস্থা</th>
                    <th className="py-3.5 px-4">তারিখ</th>
                    <th className="py-3.5 px-4">গ্রাহক ও কার্ড</th>
                    <th className="py-3.5 px-4">কিস্তি</th>
                    <th className="py-3.5 px-4 text-right">কার্ডে টাকা</th>
                    <th className="py-3.5 px-4 text-right">ক্যাশে টাকা</th>
                    <th className="py-3.5 px-4 text-right">পার্থক্য</th>
                    <th className="py-3.5 px-4">বিবরণ / কারণ</th>
                    <th className="py-3.5 px-4 text-center">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-medium">
                  {filteredDiscrepancies.map((item, idx) => {
                    const isMissing = item.type === "missing_in_cash";
                    const isAmountMismatch = item.type === "amount_mismatch";
                    const isGhost = item.type === "ghost_cash";
                    const isSettled = item.is_settled_card;

                    return (
                      <tr key={idx} className="hover:bg-white/[0.02] transition">
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                              isGhost
                                ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                                : isSettled
                                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                                : isMissing
                                ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            }`}
                          >
                            <span>{item.title}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-300 font-mono text-[11px]">
                          {item.paid_date}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white">{item.customer_name || "N/A"}</div>
                          <div className="text-[11px] text-slate-400">কার্ড #{item.card_number || "N/A"}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-300">
                            #{item.installment_no} {item.tag ? `(${item.tag})` : ""}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">
                          ৳ {item.card_amount?.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-cyan-300">
                          ৳ {item.cash_amount?.toLocaleString() || "0"}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-400">
                          ৳ {item.difference?.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-slate-300 max-w-xs text-[11px] leading-relaxed">
                          {item.description}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {item.can_fix && (
                            <button
                              onClick={() => handleFixSingle(item.payment_id)}
                              disabled={actionLoadingId === `fix_${item.payment_id}`}
                              className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold transition cursor-pointer shadow-sm disabled:opacity-50 inline-flex items-center gap-1"
                              title="এই কিস্তিটি ক্যাশে সিঙ্ক বা ঠিক করুন"
                            >
                              <TbCheck size={12} />
                              <span>{actionLoadingId === `fix_${item.payment_id}` ? "হচ্ছে..." : "ক্যাশে ফিক্স"}</span>
                            </button>
                          )}
                          {item.can_delete_cash && (
                            <button
                              onClick={() => handleDeleteGhost(item.cash_id)}
                              disabled={actionLoadingId === `del_${item.cash_id}`}
                              className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-[11px] font-bold transition cursor-pointer shadow-sm disabled:opacity-50 inline-flex items-center gap-1"
                              title="অবাঞ্ছিত ক্যাশ এন্ট্রি মুছে ফেলুন"
                            >
                              <TbTrash size={12} />
                              <span>{actionLoadingId === `del_${item.cash_id}` ? "মুছছে..." : "মুছে ফেলুন"}</span>
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

      {/* 🔹 TAB CONTENT 2: DISCOUNTS & WAIVERS */}
      {!loading && activeTab === "discounts" && (
        <div className="space-y-6">
          {/* Section A: Card Settlements with Discount */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <TbDiscount size={18} className="text-amber-400" />
                <span>অগ্রিম কার্ড নিষ্পত্তি ও ছাড় (Card Settlements with Discounts)</span>
              </h3>
              <span className="text-xs text-slate-400">
                মোট ছাড়: <strong className="text-amber-400 font-mono">৳ {summary?.total_discount_amount?.toLocaleString()}</strong>
              </span>
            </div>

            {(!auditData?.discounts_and_waivers?.settlements ||
              auditData.discounts_and_waivers.settlements.length === 0) ? (
              <div className="p-8 text-center rounded-2xl bg-[#091224] border border-white/5 text-slate-400 text-xs">
                এই সময়সীমায় কোনো কার্ড অগ্রিম নিষ্পত্তি বা ছাড় দেওয়া হয়নি।
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#091224] shadow-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/10 bg-slate-900/60 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">নিষ্পত্তির তারিখ</th>
                      <th className="py-3 px-4">গ্রাহক ও কার্ড নং</th>
                      <th className="py-3 px-4">পণ্য</th>
                      <th className="py-3 px-4 text-right">বাকি ছিল</th>
                      <th className="py-3 px-4 text-right text-amber-400">ছাড় দেওয়া হয়েছে</th>
                      <th className="py-3 px-4 text-right text-emerald-400">নগদ আদায় হয়েছে</th>
                      <th className="py-3 px-4">ক্যাশ ভাউচার স্ট্যাটাস</th>
                      <th className="py-3 px-4">মন্তব্য / নোট</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-medium">
                    {auditData.discounts_and_waivers.settlements.map((st) => (
                      <tr key={st.id} className="hover:bg-white/[0.02] transition">
                        <td className="py-3 px-4 font-mono text-slate-300">{st.settlement_date}</td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-white">{st.customer_name}</div>
                          <div className="text-[11px] text-slate-400">কার্ড #{st.card_number}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-300">{st.product_name}</td>
                        <td className="py-3 px-4 text-right font-mono text-slate-300">
                          ৳ {Number(st.remaining_due).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-amber-400">
                          ৳ {Number(st.discount_amount).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                          ৳ {Number(st.final_settled_amount).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          {st.cash_synced ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              ক্যাশ জমা হয়েছে (৳{st.cash_amount.toLocaleString()}) 🟢
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              ক্যাশে নেই (৳০ আদায়)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-[11px]">{st.note || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section B: Waived Installments */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FaExclamationCircle size={16} className="text-rose-400" />
                <span>সম্পূর্ণ মাফকৃত কিস্তি (Waived Installments Audit)</span>
              </h3>
              <span className="text-xs text-slate-400">
                মোট মাফ: <strong className="text-rose-400 font-mono">৳ {summary?.total_waived_amount?.toLocaleString()}</strong>
              </span>
            </div>

            {(!auditData?.discounts_and_waivers?.waived_installments ||
              auditData.discounts_and_waivers.waived_installments.length === 0) ? (
              <div className="p-8 text-center rounded-2xl bg-[#091224] border border-white/5 text-slate-400 text-xs">
                এই সময়সীমায় কোনো কিস্তি সম্পূর্ণ মাফ করা হয়নি।
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#091224] shadow-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/10 bg-slate-900/60 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">কিস্তি আইডি</th>
                      <th className="py-3 px-4">গ্রাহক ও কার্ড</th>
                      <th className="py-3 px-4">কিস্তি নং</th>
                      <th className="py-3 px-4 text-right text-rose-400">মাফকৃত পরিমাণ</th>
                      <th className="py-3 px-4">তারিখ</th>
                      <th className="py-3 px-4">ক্যাশ অডিট যাচাই</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-medium">
                    {auditData.discounts_and_waivers.waived_installments.map((w) => (
                      <tr key={w.payment_id} className="hover:bg-white/[0.02] transition">
                        <td className="py-3 px-4 font-mono text-slate-400">#{w.payment_id}</td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-white">{w.customer_name}</div>
                          <div className="text-[11px] text-slate-400">কার্ড #{w.card_number}</div>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-300">
                          #{w.installment_no} {w.tag ? `(${w.tag})` : ""}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-rose-400">
                          ৳ {Number(w.due_amount).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-300">{w.paid_date || w.due_date}</td>
                        <td className="py-3 px-4">
                          {w.accidental_in_cash ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              🚨 ভুল করে ক্যাশে যোগ হয়েছে (৳{w.cash_amount.toLocaleString()})
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              সঠিক: ক্যাশে কোনো টাকা ঢোকেনি (৳ ০) 🟢
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 🔹 TAB CONTENT 3: DAILY BREAKDOWN */}
      {!loading && activeTab === "daily" && (
        <div className="space-y-3">
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#091224] shadow-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-slate-900/60 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">তারিখ</th>
                  <th className="py-3.5 px-4 text-center">কার্ডে কিস্তি সংখ্যা</th>
                  <th className="py-3.5 px-4 text-right text-emerald-400">কার্ডে মোট টাকা</th>
                  <th className="py-3.5 px-4 text-center">ক্যাশে সিঙ্ক সংখ্যা</th>
                  <th className="py-3.5 px-4 text-right text-cyan-400">ক্যাশে সিঙ্ক টাকা</th>
                  <th className="py-3.5 px-4 text-right text-amber-400">পুরোনো লাম্প-সাম</th>
                  <th className="py-3.5 px-4 text-right font-bold">ক্যাশে মোট টাকা</th>
                  <th className="py-3.5 px-4 text-right">পার্থক্য</th>
                  <th className="py-3.5 px-4 text-center">স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium">
                {auditData?.date_stats?.map((ds) => {
                  const totalInCash = ds.cash_amount + ds.old_lump_amount;
                  const isMatched = ds.status === "matched";
                  return (
                    <tr key={ds.date} className="hover:bg-white/[0.02] transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-white">{ds.date}</td>
                      <td className="py-3.5 px-4 text-center font-mono">{ds.card_count}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">
                        ৳ {ds.card_amount.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono">{ds.cash_count}</td>
                      <td className="py-3.5 px-4 text-right font-mono text-cyan-300">
                        ৳ {ds.cash_amount.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-amber-400">
                        ৳ {ds.old_lump_amount.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                        ৳ {totalInCash.toLocaleString()}
                      </td>
                      <td
                        className={`py-3.5 px-4 text-right font-mono font-bold ${
                          ds.difference === 0 ? "text-slate-400" : "text-rose-400"
                        }`}
                      >
                        ৳ {ds.difference.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {isMatched ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            মিলেছে 🟢
                          </span>
                        ) : Math.abs(ds.difference) === 21600 ? (
                          <span
                            className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                            title={
                              ds.difference > 0
                                ? "এই ২১,৬০০ টাকা ২৬ তারিখে কার্ড সেটেলমেন্টের মাধ্যমে ক্যাশে জমা হয়েছে।"
                                : "৩ তারিখের কিস্তির ২১,৬০০ টাকা এই তারিখে সেটেলমেন্ট হিসেবে ক্যাশে জমা হয়েছে।"
                            }
                          >
                            সেটেলমেন্ট শিফট 🔵
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            অমিল 🔴
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 🔹 TAB CONTENT 4: FULL PAID INSTALLMENTS LEDGER */}
      {!loading && activeTab === "all" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>
              মোট পরিশোধিত কিস্তি: <strong className="text-white font-mono">{filteredAllPayments.length}</strong> টি
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#091224] shadow-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-slate-900/60 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">আইডি</th>
                  <th className="py-3 px-4">পরিশোধের তারিখ</th>
                  <th className="py-3 px-4">গ্রাহকের নাম ও মোবাইল</th>
                  <th className="py-3 px-4">কার্ড # ও পণ্য</th>
                  <th className="py-3 px-4">কিস্তি নং</th>
                  <th className="py-3 px-4 text-right">টাকা</th>
                  <th className="py-3 px-4">পেমেন্ট মেথড</th>
                  <th className="py-3 px-4">আদায়কারী</th>
                  <th className="py-3 px-4 text-center">ক্যাশ স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium">
                {filteredAllPayments.map((p) => (
                  <tr key={p.payment_id} className="hover:bg-white/[0.02] transition">
                    <td className="py-3 px-4 font-mono text-slate-400">#{p.payment_id}</td>
                    <td className="py-3 px-4 font-mono text-slate-300">{p.paid_date}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-white">{p.customer_name}</div>
                      <div className="text-[11px] text-slate-400">{p.customer_mobile || "—"}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-cyan-300">কার্ড #{p.card_number}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-xs">{p.product_name}</div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-300">
                      #{p.installment_no} {p.tag ? `(${p.tag})` : ""}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                      ৳ {Number(p.amount).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-medium">
                      <span className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-[10px]">
                        {p.payment_method || "Cash"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300 text-[11px]">
                      {p.collector_name || "—"}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {p.reconciled_via === "settlement" ? (
                        <span
                          className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                          title={`সেটেলমেন্ট ভাউচার ${p.settlement_voucher} (আদায় ৳${p.settlement_collected?.toLocaleString()}, ছাড় ৳${p.settlement_discount?.toLocaleString()})`}
                        >
                          সেটেলমেন্টে সমন্বিত 🟢
                        </span>
                      ) : p.cash_synced ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          ক্যাশে সিনক্রোনাইজড 🟢
                        </span>
                      ) : (
                        <button
                          onClick={() => handleFixSingle(p.payment_id)}
                          disabled={actionLoadingId === `fix_${p.payment_id}`}
                          className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-[10px] font-bold transition cursor-pointer shadow-sm disabled:opacity-50 inline-flex items-center gap-1"
                        >
                          <TbWand size={11} />
                          <span>{actionLoadingId === `fix_${p.payment_id}` ? "হচ্ছে..." : "সিঙ্ক করুন"}</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 🔹 BULK SAFE SYNC MODAL */}
      {showSyncModal && summary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-[#091224] border border-white/15 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <TbWand size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">নিরাপদ কিস্তি সিঙ্ক</h3>
                <p className="text-xs text-slate-400">ক্যাশ ইন লেজারে সরাসরি এন্ট্রি তৈরি হবে</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3.5 rounded-xl bg-slate-900 border border-white/5 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">নির্বাচিত সময়সীমা:</span>
                  <span className="font-bold text-white font-mono">{startDate} থেকে {endDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">নতুন সিঙ্ক হবে:</span>
                  <span className="font-bold text-emerald-400 font-mono">{summary.to_insert_count} টি কিস্তি</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">মোট টাকার পরিমাণ:</span>
                  <span className="font-bold text-emerald-400 font-mono">৳ {summary.to_insert_amount.toLocaleString()}</span>
                </div>
              </div>

              {/* Old Lump-sum option */}
              {summary.old_lumps_count > 0 && (
                <label className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={removeOldLumps}
                    onChange={(e) => setRemoveOldLumps(e.target.checked)}
                    className="mt-0.5 rounded border-amber-500 text-amber-500 focus:ring-0"
                  />
                  <div>
                    <span className="font-bold text-amber-300 block">
                      পুরোনো {summary.old_lumps_count} টি এককালীন (Lump-sum) ক্যাশ এন্ট্রি মুছে ফেলুন
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      (প্রস্তাবিত: এতে একই টাকার ডুপ্লিকেট এন্ট্রি হবে না এবং নিখুঁত কিস্তি লেজার সংরক্ষিত থাকবে)
                    </span>
                  </div>
                </label>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowSyncModal(false)}
                disabled={syncingBulk}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
              >
                বাতিল
              </button>
              <button
                onClick={handleBulkSync}
                disabled={syncingBulk}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition cursor-pointer shadow-lg disabled:opacity-50 flex items-center gap-2"
              >
                <TbWand size={14} />
                <span>{syncingBulk ? "সিঙ্ক করা হচ্ছে..." : "নিশ্চিত সিঙ্ক করুন"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔹 Toast Notifications */}
      {luxuryToast && (
        <LuxuryToast
          {...luxuryToast}
          onClose={() => setLuxuryToast(null)}
        />
      )}
    </div>
  );
}

