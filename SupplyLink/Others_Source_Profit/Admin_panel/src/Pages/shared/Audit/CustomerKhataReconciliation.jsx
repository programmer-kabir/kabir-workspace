import React, { useState, useEffect, useMemo, useCallback } from "react";
import BackButton from "../../../components/BackButton/BackButton";
import LuxuryToast from "../../../components/Modal/LuxuryToast";
import Loader from "../../../components/Loader/Loader";
import { useAuth } from "../../../Provider/AuthProvider";
import {
  TbBook2,
  TbCheck,
  TbAlertTriangle,
  TbSearch,
  TbFilter,
  TbRefresh,
  TbPrinter,
  TbPlus,
  TbX,
  TbChecklist,
  TbDeviceFloppy,
  TbClock,
  TbArrowBackUp,
  TbCash,
  TbFileInvoice,
} from "react-icons/tb";
import { FaBookOpen, FaExclamationCircle } from "react-icons/fa";

const API = import.meta.env.VITE_LOCALHOST_KEY;
const STORAGE_KEY = "supplylink_khata_audit_draft_v1";

export default function CustomerKhataReconciliation() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState({
    total_installments: 0,
    total_audited: 0,
    matched_count: 0,
    matched_amount: 0,
    in_khata_not_app_count: 0,
    in_khata_not_app_amount: 0,
    in_app_not_khata_count: 0,
    in_app_not_khata_amount: 0,
    amount_mismatch_count: 0,
    amount_mismatch_diff: 0,
    total_gap_amount: 0,
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [cardFilter, setCardFilter] = useState("");
  const [luxuryToast, setLuxuryToast] = useState(null);
  const [savingRowId, setSavingRowId] = useState(null);

  // Missing entry modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    card_id: "",
    installment_no: "",
    amount: "",
    paid_date: new Date().toISOString().split("T")[0],
    note: "",
  });
  const [isAddSubmitting, setIsAddSubmitting] = useState(false);

  // Fetch data from API
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (search.trim()) params.append("search", search.trim());
      if (cardFilter.trim()) params.append("card_id", cardFilter.trim());
      params.append("limit", "250");

      const res = await fetch(
        `${API}/audit/khata_reconciliation.php?${params.toString()}`,
        { credentials: "include" }
      );
      const resJson = await res.json();

      if (resJson.success) {
        setData(resJson.data || []);
        if (resJson.summary) {
          setSummary(resJson.summary);
        }
      } else {
        setLuxuryToast({
          title: "ডেটা লোড ত্রুটি ⚠️",
          message: resJson.message || "অডিট ডেটা লোড করা যায়নি।",
          type: "error",
        });
      }
    } catch (err) {
      setLuxuryToast({
        title: "নেটওয়ার্ক এরর ❌",
        message: err.message || "সার্ভার এরর",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, cardFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Update audit status for a single row
  const handleUpdateStatus = async (item, newStatus, customKhataAmount = null, customNote = null) => {
    const rowKey = `${item.card_id}_${item.installment_no}`;
    setSavingRowId(rowKey);

    const khataAmt = customKhataAmount !== null ? customKhataAmount : (item.khata_amount || item.due_amount);
    const noteText = customNote !== null ? customNote : (item.audit_note || "");

    // Optimistic UI update
    setData((prev) =>
      prev.map((row) => {
        if (row.card_id === item.card_id && row.installment_no === item.installment_no) {
          return {
            ...row,
            audit_status: newStatus,
            khata_amount: khataAmt,
            audit_note: noteText,
            audited_at: new Date().toISOString(),
          };
        }
        return row;
      })
    );

    try {
      const res = await fetch(`${API}/audit/khata_reconciliation.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "save_single",
          card_id: item.card_id,
          installment_no: item.installment_no,
          status: newStatus,
          khata_amount: khataAmt,
          expected_amount: item.due_amount,
          customer_id: item.customer_id,
          payment_id: item.payment_id,
          note: noteText,
        }),
      });
      const resJson = await res.json();

      if (resJson.success) {
        // Update summary counts locally
        setLuxuryToast({
          title: "সংরক্ষিত হয়েছে ✅",
          message: `কার্ড #${item.card_id} (কিস্তি #${item.installment_no}) অডিট আপডেট সম্পন্ন।`,
          type: "success",
        });
      } else {
        setLuxuryToast({
          title: "সংরক্ষণ ব্যর্থ ⚠️",
          message: resJson.message || resJson.error || "সেভ করা যায়নি",
          type: "error",
        });
      }
    } catch (err) {
      setLuxuryToast({
        title: "নেটওয়ার্ক এরর ❌",
        message: err.message,
        type: "error",
      });
    } finally {
      setSavingRowId(null);
    }
  };

  // Add missing installment directly to app from khata
  const handleAddMissingSubmit = async (e) => {
    e.preventDefault();
    if (!addForm.card_id || addForm.installment_no === "" || !addForm.amount) {
      setLuxuryToast({
        title: "তথ্য অসম্পূর্ণ ⚠️",
        message: "কার্ড আইডি, কিস্তি নম্বর এবং টাকার পরিমাণ দিন।",
        type: "warning",
      });
      return;
    }

    try {
      setIsAddSubmitting(true);
      const res = await fetch(`${API}/audit/khata_reconciliation.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "add_missing_to_app",
          card_id: parseInt(addForm.card_id, 10),
          installment_no: parseInt(addForm.installment_no, 10),
          amount: parseFloat(addForm.amount),
          paid_date: addForm.paid_date,
          note: addForm.note || "Added from khata reconciliation audit",
        }),
      });
      const resJson = await res.json();

      if (resJson.success) {
        setLuxuryToast({
          title: "যুক্ত হয়েছে ✅",
          message: resJson.message,
          type: "success",
        });
        setIsAddModalOpen(false);
        setAddForm({
          card_id: "",
          installment_no: "",
          amount: "",
          paid_date: new Date().toISOString().split("T")[0],
          note: "",
        });
        fetchData();
      } else {
        setLuxuryToast({
          title: "ব্যর্থ ⚠️",
          message: resJson.message || resJson.error || "যুক্ত করা সম্ভব হয়নি",
          type: "error",
        });
      }
    } catch (err) {
      setLuxuryToast({
        title: "এরর ❌",
        message: err.message,
        type: "error",
      });
    } finally {
      setIsAddSubmitting(false);
    }
  };

  // Reset audit status
  const handleResetRow = async (item) => {
    try {
      const res = await fetch(`${API}/audit/khata_reconciliation.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "reset",
          card_id: item.card_id,
          installment_no: item.installment_no,
        }),
      });
      const resJson = await res.json();
      if (resJson.success) {
        setData((prev) =>
          prev.map((row) =>
            row.card_id === item.card_id && row.installment_no === item.installment_no
              ? { ...row, audit_status: "unverified", audit_note: "" }
              : row
          )
        );
        setLuxuryToast({
          title: "রিসেট সম্পন্ন 🔄",
          message: "স্ট্যাটাস রিসেট করা হয়েছে।",
          type: "info",
        });
      }
    } catch (err) {
      setLuxuryToast({
        title: "ত্রুটি ❌",
        message: err.message,
        type: "error",
      });
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1700px] mx-auto text-slate-100">
      {/* Toast */}
      {luxuryToast && (
        <LuxuryToast
          title={luxuryToast.title}
          message={luxuryToast.message}
          type={luxuryToast.type}
          onClose={() => setLuxuryToast(null)}
        />
      )}

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <BackButton />
            <div className="p-2.5 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
              <TbBook2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                কাস্টমার খাতা ও অ্যাপ রিকনসিলিয়েশন
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  অডিট ভার্সন ১.০
                </span>
              </h1>
              <p className="text-xs md:text-sm text-slate-400">
                শারীরিক খাতার কিস্তির সাথে অ্যাপসের ডেটাবেজ মেলানো, গরমিল ও অনুপস্থিত কিস্তি শনাক্তকরণ
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs md:text-sm font-semibold shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
          >
            <TbPlus className="w-4 h-4" />
            খাতায় আছে কিন্তু অ্যাপে নাই কিস্তি যুক্ত করুন
          </button>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-slate-200 text-xs md:text-sm font-medium transition-all"
          >
            <TbRefresh className={`w-4 h-4 ${loading ? "animate-spin text-indigo-400" : ""}`} />
            রিফ্রেশ
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-slate-200 text-xs md:text-sm font-medium transition-all"
          >
            <TbPrinter className="w-4 h-4 text-slate-300" />
            প্রিন্ট
          </button>
        </div>
      </div>

      {/* 📊 Live Statistics Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Installments */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-800/50 border border-slate-700/60 shadow-lg shadow-black/20">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">মোট কিস্তি সারি</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-white font-mono">{summary.total_installments.toLocaleString()}</span>
            <span className="text-[10px] text-slate-400">টি কিস্তি</span>
          </div>
          <div className="mt-2 w-full bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500"
              style={{
                width: `${summary.total_installments ? (summary.total_audited / summary.total_installments) * 100 : 0}%`,
              }}
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5">অডিট সম্পন্ন: {summary.total_audited} টি</p>
        </div>

        {/* Matched */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/60 to-emerald-900/30 border border-emerald-500/30 shadow-lg shadow-emerald-950/30">
          <p className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <TbCheck className="w-3.5 h-3.5" /> মিল আছে (Matched)
          </p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-300 font-mono">{summary.matched_count}</span>
            <span className="text-xs font-semibold text-emerald-400 font-mono">
              ৳ {summary.matched_amount.toLocaleString()}
            </span>
          </div>
          <p className="text-[10px] text-emerald-400/70 mt-3">খাতা ও অ্যাপ উভয় জায়গায় সঠিক</p>
        </div>

        {/* In Khata, Not in App */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-950/60 to-rose-900/30 border border-rose-500/30 shadow-lg shadow-rose-950/30">
          <p className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
            <TbAlertTriangle className="w-3.5 h-3.5" /> খাতায় আছে, অ্যাপে নাই
          </p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-rose-300 font-mono">{summary.in_khata_not_app_count}</span>
            <span className="text-xs font-bold text-rose-400 font-mono">
              ৳ {summary.in_khata_not_app_amount.toLocaleString()}
            </span>
          </div>
          <p className="text-[10px] text-rose-400/80 mt-3">অ্যাপসে কিস্তির এন্ট্রি বাদ পড়েছে</p>
        </div>

        {/* In App, Not in Khata */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/60 to-amber-900/30 border border-amber-500/30 shadow-lg shadow-amber-950/30">
          <p className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <TbFileInvoice className="w-3.5 h-3.5" /> অ্যাপে আছে, খাতায় নাই
          </p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-300 font-mono">{summary.in_app_not_khata_count}</span>
            <span className="text-xs font-bold text-amber-400 font-mono">
              ৳ {summary.in_app_not_khata_amount.toLocaleString()}
            </span>
          </div>
          <p className="text-[10px] text-amber-400/80 mt-3">ফিজিক্যাল খাতায় কর্মীর সই নেই</p>
        </div>

        {/* Amount Mismatch */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-950/60 to-orange-900/30 border border-orange-500/30 shadow-lg shadow-orange-950/30">
          <p className="text-[11px] font-semibold text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
            <TbCash className="w-3.5 h-3.5" /> টাকায় গরমিল
          </p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-orange-300 font-mono">{summary.amount_mismatch_count}</span>
            <span className="text-xs font-bold text-orange-400 font-mono">
              ৳ {summary.amount_mismatch_diff.toLocaleString()}
            </span>
          </div>
          <p className="text-[10px] text-orange-400/80 mt-3">খাতা ও অ্যাপের কিস্তির টাকার অমিল</p>
        </div>

        {/* Net Discrepancy Gap */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-950/60 to-indigo-900/40 border border-purple-500/30 shadow-lg shadow-purple-950/30">
          <p className="text-[11px] font-semibold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
            🚨 সর্বমোট গ্যাপ (Gap)
          </p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-purple-200 font-mono">
              ৳ {summary.total_gap_amount.toLocaleString()}
            </span>
          </div>
          <p className="text-[10px] text-purple-300/80 mt-3">মোট আর্থিক অমিলের হিসাব</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md flex flex-col md:flex-row gap-3.5 items-center justify-between">
        <div className="flex items-center gap-3 w-full md:w-auto flex-1">
          <div className="relative w-full max-w-md">
            <TbSearch className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="গ্রাহকের নাম, মোবাইল, বা কার্ড নম্বর দিয়ে খুঁজুন..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-slate-400 text-xs md:text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="relative w-36 shrink-0">
            <input
              type="number"
              placeholder="Card ID..."
              value={cardFilter}
              onChange={(e) => setCardFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-slate-400 text-xs md:text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar w-full md:w-auto pb-1 md:pb-0">
          {[
            { id: "all", label: "সবগুলো" },
            { id: "unverified", label: "অডিট বাকি" },
            { id: "matched", label: "✅ মিল আছে" },
            { id: "discrepancies", label: "⚠️ শুধুমাত্র গরমিল" },
            { id: "in_khata_not_app", label: "📖 খাতায় আছে অ্যাপে নাই" },
            { id: "in_app_not_khata", label: "📱 অ্যাপে আছে খাতায় নাই" },
            { id: "amount_mismatch", label: "❌ টাকায় অমিল" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === tab.id
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Reconciliation Table */}
      <div className="rounded-2xl border border-white/[0.08] bg-slate-900/60 overflow-hidden shadow-2xl backdrop-blur-xl">
        {loading ? (
          <div className="p-20 text-center">
            <Loader />
            <p className="mt-4 text-xs md:text-sm text-slate-400">কিস্তির অডিট ডেটা লোড হচ্ছে...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <TbChecklist className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-300">কোনো কিস্তির রেকর্ড পাওয়া যায়নি</p>
            <p className="text-xs text-slate-500">অন্য কোনো ফিল্টার বা সার্চ দিয়ে চেষ্টা করুন।</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs md:text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/[0.08] bg-white/[0.02] text-slate-400 font-semibold text-[11px] uppercase tracking-wider select-none">
                  <th className="py-3 px-4 text-center w-12">চেক</th>
                  <th className="py-3 px-4">গ্রাহকের নাম ও আইডি</th>
                  <th className="py-3 px-4">কার্ড আইডি ও পণ্য</th>
                  <th className="py-3 px-4">কিস্তি নং</th>
                  <th className="py-3 px-4 text-right">অ্যাপসের টাকা</th>
                  <th className="py-3 px-4 text-right">খাতার টাকা (৳)</th>
                  <th className="py-3 px-4 text-center">অডিট স্ট্যাটাস অ্যাকশন</th>
                  <th className="py-3 px-4">মন্তব্য / নোট</th>
                  <th className="py-3 px-3 text-center">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {data.map((item) => {
                  const isSaving = savingRowId === `${item.card_id}_${item.installment_no}`;
                  const isMatched = item.audit_status === "matched";
                  const isKhataNotApp = item.audit_status === "in_khata_not_app";
                  const isAppNotKhata = item.audit_status === "in_app_not_khata";
                  const isMismatch = item.audit_status === "amount_mismatch";

                  // Row background style based on status
                  let rowBg = "hover:bg-white/[0.02]";
                  if (isMatched) rowBg = "bg-emerald-950/15 hover:bg-emerald-950/25";
                  if (isKhataNotApp) rowBg = "bg-rose-950/20 hover:bg-rose-950/30";
                  if (isAppNotKhata) rowBg = "bg-amber-950/20 hover:bg-amber-950/30";
                  if (isMismatch) rowBg = "bg-orange-950/20 hover:bg-orange-950/30";

                  return (
                    <tr key={`${item.card_id}_${item.installment_no}`} className={`transition-colors ${rowBg}`}>
                      {/* 1. Quick Checkbox */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleUpdateStatus(item, isMatched ? "unverified" : "matched")}
                          disabled={isSaving}
                          title={isMatched ? "আনভেরিফাইড করুন" : "মিল আছে হিসেবে চিহ্নিত করুন"}
                          className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
                            isMatched
                              ? "bg-emerald-500 border-emerald-400 text-white shadow-md shadow-emerald-500/30"
                              : "border-slate-600 hover:border-slate-400 bg-white/[0.02]"
                          }`}
                        >
                          {isMatched && <TbCheck className="w-4 h-4 stroke-[3]" />}
                        </button>
                      </td>

                      {/* 2. Customer Name & ID */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white tracking-tight">
                          {item.customer_name || "—"}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                          <span className="font-mono text-indigo-300">ID: {item.customer_id}</span>
                          {item.customer_mobile && <span>• {item.customer_mobile}</span>}
                        </div>
                      </td>

                      {/* 3. Card ID & Product */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white px-2 py-0.5 rounded-md bg-white/[0.06] border border-white/10 text-xs">
                            Card #{item.card_id}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[180px]">
                          {item.product_name || "পণ্য"}
                        </div>
                      </td>

                      {/* 4. Installment No & Status */}
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-200">
                          {item.installment_no === 0 ? "ডাউনপেমেন্ট (#০)" : `কিস্তি #${item.installment_no}`}
                        </span>
                        <div className="mt-0.5">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              item.payment_status === "Paid"
                                ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                                : "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                            }`}
                          >
                            {item.payment_status === "Paid" ? "পরিশোধিত" : "বকেয়া"}
                          </span>
                        </div>
                      </td>

                      {/* 5. App Expected Amount */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-white">
                        ৳ {item.due_amount?.toLocaleString() || "0"}
                      </td>

                      {/* 6. Khata Amount Input */}
                      <td className="py-3 px-4 text-right">
                        <input
                          type="number"
                          defaultValue={item.khata_amount || item.due_amount}
                          onBlur={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            if (val !== item.khata_amount) {
                              const newSt = val === item.due_amount ? "matched" : "amount_mismatch";
                              handleUpdateStatus(item, newSt, val);
                            }
                          }}
                          className={`w-24 px-2.5 py-1 text-right font-mono text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all ${
                            isMismatch
                              ? "bg-orange-950/40 border-orange-500/50 text-orange-200"
                              : "bg-white/[0.04] border-white/10 text-white"
                          }`}
                        />
                      </td>

                      {/* 7. Action Status Buttons */}
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-950/60 border border-white/10">
                          {/* Matched */}
                          <button
                            onClick={() => handleUpdateStatus(item, "matched")}
                            title="খাতা ও অ্যাপ উভয় জায়গায় মিল আছে"
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                              isMatched
                                ? "bg-emerald-600 text-white shadow-sm"
                                : "text-slate-400 hover:text-white hover:bg-white/[0.05]"
                            }`}
                          >
                            মিল আছে
                          </button>

                          {/* In Khata, Not in App */}
                          <button
                            onClick={() => handleUpdateStatus(item, "in_khata_not_app")}
                            title="খাতায় কর্মীর সই ও কিস্তি আছে কিন্তু অ্যাপে নেই"
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                              isKhataNotApp
                                ? "bg-rose-600 text-white shadow-sm"
                                : "text-slate-400 hover:text-white hover:bg-white/[0.05]"
                            }`}
                          >
                            খাতায় আছে
                          </button>

                          {/* In App, Not in Khata */}
                          <button
                            onClick={() => handleUpdateStatus(item, "in_app_not_khata")}
                            title="অ্যাপে কালেকশন দেখাচ্ছে কিন্তু ফিজিক্যাল খাতায় নেই"
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                              isAppNotKhata
                                ? "bg-amber-600 text-white shadow-sm"
                                : "text-slate-400 hover:text-white hover:bg-white/[0.05]"
                            }`}
                          >
                            অ্যাপে আছে
                          </button>

                          {/* Amount Mismatch */}
                          <button
                            onClick={() => handleUpdateStatus(item, "amount_mismatch")}
                            title="টাকার পরিমাণে গরমিল রয়েছে"
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                              isMismatch
                                ? "bg-orange-600 text-white shadow-sm"
                                : "text-slate-400 hover:text-white hover:bg-white/[0.05]"
                            }`}
                          >
                            টাকায় গরমিল
                          </button>
                        </div>
                      </td>

                      {/* 8. Audit Note */}
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          placeholder="মন্তব্য লিখুন..."
                          defaultValue={item.audit_note || ""}
                          onBlur={(e) => {
                            if (e.target.value !== (item.audit_note || "")) {
                              handleUpdateStatus(item, item.audit_status, null, e.target.value);
                            }
                          }}
                          className="w-full min-w-[130px] px-2 py-1 text-xs rounded-lg bg-white/[0.04] border border-white/10 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                        />
                      </td>

                      {/* 9. Reset Button */}
                      <td className="py-3 px-3 text-center">
                        {item.audit_status !== "unverified" && (
                          <button
                            onClick={() => handleResetRow(item)}
                            title="এই সারির অডিট রিসেট করুন"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                          >
                            <TbArrowBackUp className="w-4 h-4" />
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

      {/* ➕ Modal: Add Missing Installment to App */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-white/10 shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <TbBook2 className="w-5 h-5 text-emerald-400" />
                খাতায় থাকা মিসিং কিস্তি অ্যাপসে যুক্ত করুন
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <TbX className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              ফিজিক্যাল রেজিস্টার খাতায় আদায়কৃত কিস্তি পাওয়া গেছে কিন্তু অ্যাপে কোনো রেকর্ড নেই? এখানে তথ্য দিয়ে সরাসরি
              অ্যাপসে যুক্ত করুন। এটি স্বয়ংক্রিয়ভাবে অডিটে 'মিল আছে' হিসেবে সেভ হবে।
            </p>

            <form onSubmit={handleAddMissingSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">কার্ড নম্বর (Card ID) *</label>
                <input
                  type="number"
                  required
                  placeholder="যেমন: 241"
                  value={addForm.card_id}
                  onChange={(e) => setAddForm({ ...addForm, card_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white text-xs md:text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">কিস্তি নম্বর *</label>
                  <input
                    type="number"
                    required
                    placeholder="যেমন: 1, 2, 3..."
                    value={addForm.installment_no}
                    onChange={(e) => setAddForm({ ...addForm, installment_no: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white text-xs md:text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">কিস্তির টাকা (৳) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="টাকার পরিমাণ..."
                    value={addForm.amount}
                    onChange={(e) => setAddForm({ ...addForm, amount: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white text-xs md:text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">আদায়ের তারিখ</label>
                <input
                  type="date"
                  value={addForm.paid_date}
                  onChange={(e) => setAddForm({ ...addForm, paid_date: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white text-xs md:text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">অডিট নোট / খাতার রেফারেন্স</label>
                <textarea
                  rows="2"
                  placeholder="যেমন: খাতা পৃষ্ঠা #১২, কর্মী রহিমের সই আছে..."
                  value={addForm.note}
                  onChange={(e) => setAddForm({ ...addForm, note: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white text-xs md:text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/10 text-slate-300 text-xs font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isAddSubmitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2"
                >
                  {isAddSubmitting && <TbRefresh className="w-4 h-4 animate-spin" />}
                  অ্যাপসে যুক্ত ও ভেরিফাই করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
