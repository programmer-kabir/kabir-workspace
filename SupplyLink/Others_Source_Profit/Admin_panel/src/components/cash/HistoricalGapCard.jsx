import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FaHandHoldingUsd,
  FaHistory,
  FaPlusCircle,
  FaCheckCircle,
  FaExclamationTriangle,
  FaClock,
  FaFileInvoiceDollar,
  FaChevronDown,
  FaChevronUp,
  FaTimes,
  FaCalendarAlt,
  FaEdit,
  FaTrashAlt,
  FaShieldAlt,
  FaArrowUp,
  FaArrowDown,
  FaInfoCircle,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

const API = import.meta.env.VITE_LOCALHOST_KEY;

export default function HistoricalGapCard({
  user,
  userRole,
  isAdminOrDev,
  setLuxuryToast,
  onRecoverySuccess,
}) {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [gaps, setGaps] = useState([]);
  const [recoveries, setRecoveries] = useState([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState("gaps"); // "gaps" | "recoveries"

  // Modals state
  const [showAddGapModal, setShowAddGapModal] = useState(false);
  const [submittingAddGap, setSubmittingAddGap] = useState(false);
  const [gapForm, setGapForm] = useState({
    title: "অতীত ক্যাশ ঘাটতি সমন্বয়",
    gap_amount: "",
    cut_off_date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const [showEditGapModal, setShowEditGapModal] = useState(false);
  const [submittingEditGap, setSubmittingEditGap] = useState(false);
  const [editingGap, setEditingGap] = useState(null);

  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [submittingRecovery, setSubmittingRecovery] = useState(false);
  const [recoveryForm, setRecoveryForm] = useState({
    amount: "",
    recovery_date: new Date().toISOString().split("T")[0],
    received_from: "",
    gap_id: "",
    remarks: "",
  });

  const [deleteConfirm, setDeleteConfirm] = useState(null); // { type: 'gap' | 'recovery', item }
  const [deleting, setDeleting] = useState(false);

  // Resolved role string
  const resolvedRole = (userRole || user?.role || "admin").toLowerCase();

  // Fetch full gap dataset from API
  const fetchGapData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/cash/historical_gap.php`);
      const result = await res.json();
      if (result.success) {
        setSummary(result.summary);
        setGaps(result.gaps || []);
        setRecoveries(result.recoveries || []);
      }
    } catch (e) {
      console.error("Historical Gap fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGapData();
  }, []);

  // -------------------------------------------------------------------------
  // 1. ADD NEW GAP (Admin Only)
  // -------------------------------------------------------------------------
  const handleAddGap = async (e) => {
    e.preventDefault();
    const amount = Number(gapForm.gap_amount || 0);

    if (amount <= 0) {
      return setLuxuryToast?.({
        title: "সঠিক পরিমাণ দিন ⚠️",
        message: "ঘাটতির সঠিক টাকার পরিমাণ উল্লেখ করুন।",
        type: "warning",
      });
    }

    try {
      setSubmittingAddGap(true);
      const res = await fetch(`${API}/cash/historical_gap.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_gap",
          gap_amount: amount,
          cut_off_date: gapForm.cut_off_date,
          title: gapForm.title.trim() || "অতীত ক্যাশ ঘাটতি সমন্বয়",
          notes: gapForm.notes.trim(),
          created_by: user?.id || 290,
          user_role: resolvedRole,
        }),
      });

      const result = await res.json();
      if (result.success) {
        setLuxuryToast?.({
          title: "ঘাটতি এন্ট্রি সফল! 🟢",
          message: result.message || `৳ ${amount.toLocaleString()} টাকার ঘাটতি ক্যাশ আউট হয়েছে।`,
          type: "success",
          tag: "Cash Gap Added",
          amount: amount,
        });

        setShowAddGapModal(false);
        setGapForm({
          title: "অতীত ক্যাশ ঘাটতি সমন্বয়",
          gap_amount: "",
          cut_off_date: new Date().toISOString().split("T")[0],
          notes: "",
        });

        fetchGapData();
        onRecoverySuccess?.();
      } else {
        setLuxuryToast?.({
          title: "এন্ট্রি ব্যর্থ ⚠️",
          message: result.message || "ঘাটতি সংরক্ষণ করা যায়নি।",
          type: "error",
        });
      }
    } catch (err) {
      setLuxuryToast?.({
        title: "সার্ভার ত্রুটি ⚠️",
        message: err.message,
        type: "error",
      });
    } finally {
      setSubmittingAddGap(false);
    }
  };

  // -------------------------------------------------------------------------
  // 2. EDIT GAP (Admin Only)
  // -------------------------------------------------------------------------
  const handleOpenEditGap = (gap) => {
    setEditingGap({
      id: gap.id,
      title: gap.title || "অতীত ক্যাশ ঘাটতি সমন্বয়",
      gap_amount: gap.gap_amount,
      cut_off_date: gap.cut_off_date,
      notes: gap.notes || "",
    });
    setShowEditGapModal(true);
  };

  const handleUpdateGap = async (e) => {
    e.preventDefault();
    if (!editingGap) return;
    const amount = Number(editingGap.gap_amount || 0);

    if (amount <= 0) {
      return setLuxuryToast?.({
        title: "সঠিক পরিমাণ দিন ⚠️",
        message: "ঘাটতির টাকার পরিমাণ ০ এর চেয়ে বেশি হতে হবে।",
        type: "warning",
      });
    }

    try {
      setSubmittingEditGap(true);
      const res = await fetch(`${API}/cash/historical_gap.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "edit_gap",
          id: editingGap.id,
          gap_amount: amount,
          cut_off_date: editingGap.cut_off_date,
          title: editingGap.title.trim() || "অতীত ক্যাশ ঘাটতি সমন্বয়",
          notes: editingGap.notes.trim(),
          user_role: resolvedRole,
        }),
      });

      const result = await res.json();
      if (result.success) {
        setLuxuryToast?.({
          title: "ঘাটতি সংশোধন সফল! 🟢",
          message: result.message || "ঘাটতি এবং ক্যাশ আউট ভাউচার আপডেট হয়েছে।",
          type: "success",
        });
        setShowEditGapModal(false);
        setEditingGap(null);
        fetchGapData();
        onRecoverySuccess?.();
      } else {
        setLuxuryToast?.({
          title: "আপডেট ব্যর্থ ⚠️",
          message: result.message || "ঘাটতি সংশোধন করা যায়নি।",
          type: "error",
        });
      }
    } catch (err) {
      setLuxuryToast?.({
        title: "সার্ভার ত্রুটি ⚠️",
        message: err.message,
        type: "error",
      });
    } finally {
      setSubmittingEditGap(false);
    }
  };

  // -------------------------------------------------------------------------
  // 3. ADD RECOVERY (Admin Only)
  // -------------------------------------------------------------------------
  const handleAddRecovery = async (e) => {
    e.preventDefault();
    const amount = Number(recoveryForm.amount || 0);

    if (amount <= 0) {
      return setLuxuryToast?.({
        title: "সঠিক পরিমাণ দিন ⚠️",
        message: "আদায়কৃত টাকার সঠিক পরিমাণ উল্লেখ করুন।",
        type: "warning",
      });
    }

    if (summary && amount > summary.remaining_gap) {
      return setLuxuryToast?.({
        title: "অতিরিক্ত পরিমাণ ⚠️",
        message: `আদায়ের পরিমাণ অবশিষ্ট ঘাটতির (৳ ${summary.remaining_gap.toLocaleString()}) চেয়ে বেশি হতে পারবে না।`,
        type: "warning",
      });
    }

    if (!recoveryForm.received_from.trim()) {
      return setLuxuryToast?.({
        title: "তথ্য আবশ্যক ⚠️",
        message: "কার কাছ থেকে টাকা আদায় হলো তা উল্লেখ করা বাধ্যতামূলক।",
        type: "warning",
      });
    }

    try {
      setSubmittingRecovery(true);
      const res = await fetch(`${API}/cash/historical_gap.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_recovery",
          amount: amount,
          recovery_date: recoveryForm.recovery_date,
          received_from: recoveryForm.received_from.trim(),
          gap_id: recoveryForm.gap_id ? Number(recoveryForm.gap_id) : null,
          remarks: recoveryForm.remarks.trim(),
          created_by: user?.id || 290,
          user_role: resolvedRole,
        }),
      });

      const result = await res.json();
      if (result.success) {
        setLuxuryToast?.({
          title: "আদায় সফল! 🎉",
          message: result.message || `৳ ${amount.toLocaleString()} টাকা আদায় হয়ে ক্যাশে যোগ হয়েছে।`,
          type: "success",
          tag: "Recovery Added",
          amount: amount,
        });

        setShowRecoveryModal(false);
        setRecoveryForm({
          amount: "",
          recovery_date: new Date().toISOString().split("T")[0],
          received_from: "",
          gap_id: "",
          remarks: "",
        });

        fetchGapData();
        onRecoverySuccess?.();
      } else {
        setLuxuryToast?.({
          title: "আদায় ব্যর্থ ⚠️",
          message: result.message || "আদায় সংরক্ষণ করা যায়নি।",
          type: "error",
        });
      }
    } catch (err) {
      setLuxuryToast?.({
        title: "সার্ভার ত্রুটি ⚠️",
        message: err.message,
        type: "error",
      });
    } finally {
      setSubmittingRecovery(false);
    }
  };

  // -------------------------------------------------------------------------
  // 4. DELETE GAP or RECOVERY (Admin Only)
  // -------------------------------------------------------------------------
  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    const { type, item } = deleteConfirm;

    try {
      setDeleting(true);
      const actionName = type === "gap" ? "delete_gap" : "delete_recovery";
      const res = await fetch(`${API}/cash/historical_gap.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: actionName,
          id: item.id,
          user_role: resolvedRole,
        }),
      });

      const result = await res.json();
      if (result.success) {
        setLuxuryToast?.({
          title: "সফলভাবে মুছে ফেলা হয়েছে 🗑️",
          message: result.message,
          type: "success",
        });
        setDeleteConfirm(null);
        fetchGapData();
        onRecoverySuccess?.();
      } else {
        setLuxuryToast?.({
          title: "ডিলিট ব্যর্থ ⚠️",
          message: result.message || "মুছে ফেলা সম্ভব হয়নি।",
          type: "error",
        });
      }
    } catch (err) {
      setLuxuryToast?.({
        title: "সার্ভার ত্রুটি ⚠️",
        message: err.message,
        type: "error",
      });
    } finally {
      setDeleting(false);
    }
  };

  if (!summary && loading) {
    return (
      <div className="p-6 rounded-3xl bg-[#071328] border border-cyan-500/20 text-center text-slate-400 text-xs">
        <span className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin inline-block mr-2" />
        ক্যাশ ঘাটতি ও রিকভারি ট্র্যাকার লোড হচ্ছে...
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#071328] via-[#091733] to-[#040e21] border border-cyan-500/30 p-5 sm:p-6 shadow-[0_15px_40px_rgba(0,0,0,0.6)] text-white">
      {/* Background Ambient Glows */}
      <div className="absolute -top-16 -right-16 w-52 h-52 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-52 h-52 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/10 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shadow-inner shrink-0">
            <FaFileInvoiceDollar size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-black text-white tracking-wide">
                অতীত পুঞ্জীভূত ক্যাশ ঘাটতি ও রিকভারি ট্র্যাকার
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                ডায়নামিক লেজার
              </span>
              {isAdminOrDev && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <FaShieldAlt size={9} />
                  <span>এডমিন কন্ট্রোল সক্রিয়</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              অতীতের যে কোনো পরিমাণের ক্যাশ গরমিল পার্কিং (Cash Out) এবং পর্যায়ক্রমে আদায় (Cash In) ট্র্যাকিং
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap self-start lg:self-auto">
          {isAdminOrDev && (
            <button
              onClick={() => setShowAddGapModal(true)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-950/40 cursor-pointer transition-all active:scale-[0.98]"
              title="নতুন কোনো ঘাটতি থাকলে এন্ট্রি দিয়ে ক্যাশ থেকে আউট করুন"
            >
              <FaArrowDown size={11} />
              <span>+ নতুন ঘাটতি ঘোষণা (Cash Out)</span>
            </button>
          )}

          {isAdminOrDev && (
            <button
              onClick={() => setShowRecoveryModal(true)}
              disabled={summary.remaining_gap <= 0}
              className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-lg transition-all ${
                summary.remaining_gap <= 0
                  ? "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed shadow-none"
                  : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-emerald-950/40 cursor-pointer active:scale-[0.98]"
              }`}
              title={summary.remaining_gap <= 0 ? "কোনো ঘাটতি বাকি নেই" : "ঘাটতির টাকা আদায় হলে এন্ট্রি দিয়ে ক্যাশ ইনে যোগ করুন"}
            >
              <FaArrowUp size={11} />
              <span>+ নতুন আদায় জমা দিন (Cash In)</span>
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-white/10 transition cursor-pointer"
          >
            <FaHistory size={11} className="text-cyan-400" />
            <span>{isExpanded ? "লগ লুকান" : "বিস্তারিত খাতা"}</span>
            {isExpanded ? <FaChevronUp size={11} /> : <FaChevronDown size={11} />}
          </button>
        </div>
      </div>

      {/* 4 Core KPI Counter Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 my-4 relative z-10">
        {/* KPI 1: Total Gaps */}
        <div className="p-4 rounded-2xl bg-[#040b17]/80 border border-slate-800/90 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>সর্বমোট ঘোষিত ঘাটতি (Gaps)</span>
            <span className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400">
              <FaArrowDown size={11} />
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black font-mono text-white mt-2">
            ৳ {summary.total_gap_amount.toLocaleString()}
          </p>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            {summary.gaps_count} টি ঘাটতি এন্ট্রি (ক্যাশ আউট হিসেবে সমন্বিত)
          </span>
        </div>

        {/* KPI 2: Total Recovered */}
        <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 shadow-md">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-semibold">
            <span>এ পর্যন্ত মোট আদায়কৃত (Recovered)</span>
            <span className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400">
              <FaCheckCircle size={12} />
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black font-mono text-emerald-300 mt-2">
            ৳ {summary.total_recovered.toLocaleString()}
          </p>
          <span className="text-[10px] text-emerald-400 font-medium mt-0.5 block">
            {summary.recoveries_count} টি কিস্তিতে আদায় সম্পন্ন (ক্যাশ ইন যুক্ত)
          </span>
        </div>

        {/* KPI 3: Remaining Gap */}
        <div className="p-4 rounded-2xl bg-rose-950/25 border border-rose-500/30 shadow-md">
          <div className="flex items-center justify-between text-rose-300 text-xs font-semibold">
            <span>বর্তমানে অনুপস্থিত / বাকি ঘাটতি</span>
            <span className="p-1.5 rounded-lg bg-rose-500/15 text-rose-400">
              <FaExclamationTriangle size={12} />
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black font-mono text-rose-300 mt-2">
            ৳ {summary.remaining_gap.toLocaleString()}
          </p>
          <span className="text-[10px] text-rose-400 font-medium mt-0.5 block">
            {summary.remaining_gap === 0 ? "🎉 সম্পূর্ণ ঘাটতি আদায় হয়ে গেছে!" : "পর্যায়ক্রমে আদায়যোগ্য"}
          </span>
        </div>

        {/* KPI 4: Progress Bar */}
        <div className="p-4 rounded-2xl bg-[#040b17]/80 border border-cyan-500/30 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-cyan-300 text-xs font-semibold">
            <span>আদায় অগ্রগতি (Progress)</span>
            <span className="font-mono font-bold text-cyan-400">{summary.recovery_percentage}%</span>
          </div>
          <div className="my-2">
            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 h-2.5 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, summary.recovery_percentage)}%` }}
              />
            </div>
          </div>
          <span className="text-[10px] text-slate-400">
            {summary.remaining_gap > 0
              ? `বাকি ৳ ${summary.remaining_gap.toLocaleString()} টাকা আদায় প্রক্রিয়াধীন`
              : "ঘাটতি শূন্যে নেমে এসেছে"}
          </span>
        </div>
      </div>

      {/* Integration Notice & Direct Links */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-slate-900/60 border border-white/5 text-[11px] text-slate-300 mb-3">
        <div className="flex items-center gap-2">
          <FaInfoCircle className="text-cyan-400 shrink-0" size={13} />
          <span>
            ঘাটতি ঘোষণা স্বয়ংক্রিয়ভাবে <strong className="text-amber-400">Cash Out</strong> এবং আদায়কৃত টাকা স্বয়ংক্রিয়ভাবে <strong className="text-emerald-400">Cash In</strong> লেজারে সমন্বিত হয়।
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/cash/cash_out"
            className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold transition"
          >
            ক্যাশ আউট রিপোর্ট দেখুন ↗
          </Link>
          <Link
            to="/cash/cash_in"
            className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold transition"
          >
            ক্যাশ ইন রিপোর্ট দেখুন ↗
          </Link>
        </div>
      </div>

      {/* Expandable Section with Tabs */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden pt-2 border-t border-white/10"
          >
            {/* Tab Switcher */}
            <div className="flex items-center gap-2 mb-3 pt-2">
              <button
                onClick={() => setActiveTab("gaps")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                  activeTab === "gaps"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow"
                    : "bg-slate-900/80 text-slate-400 hover:text-white border border-white/5"
                }`}
              >
                <FaArrowDown size={10} className="text-amber-400" />
                <span>ঘাটতি এন্ট্রিসমূহ ({gaps.length})</span>
              </button>

              <button
                onClick={() => setActiveTab("recoveries")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                  activeTab === "recoveries"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow"
                    : "bg-slate-900/80 text-slate-400 hover:text-white border border-white/5"
                }`}
              >
                <FaArrowUp size={10} className="text-emerald-400" />
                <span>আদায় হিস্ট্রি লগ ({recoveries.length})</span>
              </button>
            </div>

            {/* TAB 1: GAPS LIST */}
            {activeTab === "gaps" && (
              <div>
                {gaps.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-[#040b17] border border-slate-800 text-center text-slate-400 text-xs">
                    <FaClock size={20} className="mx-auto text-slate-600 mb-2" />
                    <p className="font-medium text-slate-300">এখনো কোনো ক্যাশ ঘাটতি এন্ট্রি নেই।</p>
                    {isAdminOrDev && (
                      <p className="text-[11px] text-slate-500 mt-1">
                        কোনো তারিখের ঘাটতি ক্যাশ থেকে বাদ দিতে উপরের <strong className="text-amber-400">+ নতুন ঘাটতি ঘোষণা</strong> বাটনে ক্লিক করুন।
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#040b17]">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800">
                        <tr>
                          <th className="py-2.5 px-3">#</th>
                          <th className="py-2.5 px-3">বিবরণ ও শিরোনাম</th>
                          <th className="py-2.5 px-3">কাট-অফ তারিখ</th>
                          <th className="py-2.5 px-3 text-right">ঘাটতির পরিমাণ</th>
                          <th className="py-2.5 px-3">ক্যাশ আউট লিংক</th>
                          <th className="py-2.5 px-3">নোট / কারণ</th>
                          <th className="py-2.5 px-3">এন্ট্রি বাই</th>
                          {isAdminOrDev && <th className="py-2.5 px-3 text-center">অ্যাকশন</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-medium">
                        {gaps.map((gap, idx) => (
                          <tr key={gap.id} className="hover:bg-slate-800/40 transition">
                            <td className="py-2.5 px-3 text-slate-500 font-mono">{idx + 1}</td>
                            <td className="py-2.5 px-3 font-bold text-white">
                              {gap.title || "ক্যাশ ঘাটতি সমন্বয়"}
                            </td>
                            <td className="py-2.5 px-3 text-slate-300 font-mono">{gap.cut_off_date}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-400">
                              - ৳ {Number(gap.gap_amount).toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3">
                              {gap.cash_id ? (
                                <Link
                                  to="/cash/cash_out"
                                  className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 underline"
                                  title="ক্যাশ আউট ভাউচার দেখুন (ক্যাটাগরি: historical_gap_parking)"
                                >
                                  Cash #{gap.cash_id} (Out)
                                </Link>
                              ) : (
                                <span className="text-slate-500">—</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-slate-300 max-w-xs truncate">
                              {gap.notes || "—"}
                            </td>
                            <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                              {gap.created_by_name}
                            </td>
                            {isAdminOrDev && (
                              <td className="py-2.5 px-3 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => handleOpenEditGap(gap)}
                                    className="p-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition cursor-pointer"
                                    title="ঘাটতি এন্ট্রি সংশোধন করুন"
                                  >
                                    <FaEdit size={11} />
                                  </button>
                                  <button
                                    onClick={() =>
                                      setDeleteConfirm({
                                        type: "gap",
                                        item: gap,
                                      })
                                    }
                                    className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 transition cursor-pointer"
                                    title="ঘাটতি ও সংশ্লিষ্ট Cash Out ডিলিট করুন"
                                  >
                                    <FaTrashAlt size={11} />
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: RECOVERIES LIST */}
            {activeTab === "recoveries" && (
              <div>
                {recoveries.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-[#040b17] border border-slate-800 text-center text-slate-400 text-xs">
                    <FaClock size={20} className="mx-auto text-slate-600 mb-2" />
                    <p className="font-medium text-slate-300">এখনো কোনো অতীত ঘাটতি আদায় জমা হয়নি।</p>
                    {isAdminOrDev && (
                      <p className="text-[11px] text-slate-500 mt-1">
                        পুরোনো খাতার বা স্টাফ থেকে টাকা পাওয়া গেলে উপরের <strong className="text-emerald-400">+ নতুন আদায় জমা দিন</strong> বাটনে ক্লিক করে এন্ট্রি দিন।
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#040b17]">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800">
                        <tr>
                          <th className="py-2.5 px-3">#</th>
                          <th className="py-2.5 px-3">আদায়ের তারিখ</th>
                          <th className="py-2.5 px-3">কার কাছ থেকে আদায় হলো</th>
                          <th className="py-2.5 px-3 text-right">আদায়কৃত টাকা</th>
                          <th className="py-2.5 px-3">ক্যাশ ইন লিংক</th>
                          <th className="py-2.5 px-3">মন্তব্য / কৈফিয়ত</th>
                          <th className="py-2.5 px-3">এন্ট্রি বাই</th>
                          {isAdminOrDev && <th className="py-2.5 px-3 text-center">অ্যাকশন</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-medium">
                        {recoveries.map((rec, idx) => (
                          <tr key={rec.id} className="hover:bg-slate-800/40 transition">
                            <td className="py-2.5 px-3 text-slate-500 font-mono">{idx + 1}</td>
                            <td className="py-2.5 px-3 text-white font-mono">{rec.recovery_date}</td>
                            <td className="py-2.5 px-3 font-bold text-cyan-300">{rec.received_from}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                              + ৳ {Number(rec.amount).toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3">
                              {rec.cash_id ? (
                                <Link
                                  to="/cash/cash_in"
                                  className="text-[11px] font-mono text-emerald-400 hover:text-emerald-300 underline"
                                  title="ক্যাশ ইন ভাউচার দেখুন (ক্যাটাগরি: historical_gap_recovery)"
                                >
                                  Cash #{rec.cash_id} (In)
                                </Link>
                              ) : (
                                <span className="text-slate-500">—</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-slate-300 max-w-xs truncate">
                              {rec.remarks || "—"}
                            </td>
                            <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                              {rec.created_by_name}
                            </td>
                            {isAdminOrDev && (
                              <td className="py-2.5 px-3 text-center">
                                <button
                                  onClick={() =>
                                    setDeleteConfirm({
                                      type: "recovery",
                                      item: rec,
                                    })
                                  }
                                  className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 transition cursor-pointer"
                                  title="আদায় ও সংশ্লিষ্ট Cash In ডিলিট করুন"
                                >
                                  <FaTrashAlt size={11} />
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ======================================================================= */}
      {/* 🔴 MODAL 1: ADD NEW GAP DECLARATION (Admin Only)                         */}
      {/* ======================================================================= */}
      {showAddGapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#091224] border border-amber-500/40 w-full max-w-md rounded-3xl shadow-2xl p-6 relative">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                  <FaArrowDown size={16} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">নতুন ক্যাশ ঘাটতি এন্ট্রি (Cash Out)</h3>
                  <p className="text-xs text-slate-400">এডমিন অনুমোদনক্রমে ক্যাশ সমন্বয়</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddGapModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition"
              >
                <FaTimes size={14} />
              </button>
            </div>

            <form onSubmit={handleAddGap} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-semibold mb-1 block">ঘাটতির শিরোনাম / বিবরণ *</label>
                <input
                  type="text"
                  required
                  value={gapForm.title}
                  onChange={(e) => setGapForm({ ...gapForm, title: e.target.value })}
                  placeholder="যেমন: ১ নভেম্বরের পূর্ববর্তী খাতার গরমিল"
                  className="w-full bg-[#050b17] border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-400 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">কাট-অফ তারিখ *</label>
                  <input
                    type="date"
                    required
                    value={gapForm.cut_off_date}
                    onChange={(e) => setGapForm({ ...gapForm, cut_off_date: e.target.value })}
                    className="w-full bg-[#050b17] border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-400 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">ঘাটতির পরিমাণ (টাকা) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="any"
                    placeholder="যেকোনো টাকার অংক"
                    value={gapForm.gap_amount}
                    onChange={(e) => setGapForm({ ...gapForm, gap_amount: e.target.value })}
                    className="w-full bg-[#050b17] border border-amber-500/50 rounded-xl px-3 py-2 text-white font-mono font-bold text-sm outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold mb-1 block">নোট বা কারণ (ঐচ্ছিক)</label>
                <textarea
                  rows="2"
                  placeholder="যেমন: পূর্ববর্তী খাতা ও ক্যাশ ড্রয়ার অমিল সমন্বয়ের জন্য পার্ক করা হলো..."
                  value={gapForm.notes}
                  onChange={(e) => setGapForm({ ...gapForm, notes: e.target.value })}
                  className="w-full bg-[#050b17] border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-400 resize-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 text-amber-200 text-[11px] leading-relaxed">
                ℹ️ <strong>স্বয়ংক্রিয় কার্যপ্রণালী:</strong> সাবমিট করলে উল্লেখিত তারিখে <strong>Cash Out</strong> (ক্যাটাগরি: historical_gap_parking) হিসেবে সংরক্ষিত হবে, ফলে ক্যাশ ড্রয়ার ও খাতার অমিল দূর হবে।
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddGapModal(false)}
                  disabled={submittingAddGap}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submittingAddGap}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold cursor-pointer disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-amber-950/50"
                >
                  {submittingAddGap ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>সংরক্ষণ হচ্ছে...</span>
                    </>
                  ) : (
                    <span>ঘাটতি নিশ্চিত করুন</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* 🟢 MODAL 2: ADD RECOVERY (Admin Only)                                    */}
      {/* ======================================================================= */}
      {showRecoveryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#091224] border border-emerald-500/40 w-full max-w-md rounded-3xl shadow-2xl p-6 relative">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <FaHandHoldingUsd size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">অতীত ঘাটতি আদায় জমা দিন</h3>
                  <p className="text-xs text-slate-400">
                    অবশিষ্ট ঘাটতি: <strong className="text-rose-400 font-mono">৳ {summary.remaining_gap.toLocaleString()}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRecoveryModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition"
              >
                <FaTimes size={14} />
              </button>
            </div>

            <form onSubmit={handleAddRecovery} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">আদায়ের তারিখ *</label>
                  <input
                    type="date"
                    required
                    value={recoveryForm.recovery_date}
                    onChange={(e) => setRecoveryForm({ ...recoveryForm, recovery_date: e.target.value })}
                    className="w-full bg-[#050b17] border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-400 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">আদায়কৃত টাকার পরিমাণ *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max={summary.remaining_gap}
                    step="any"
                    placeholder="যেমন: ৫০,০০০"
                    value={recoveryForm.amount}
                    onChange={(e) => setRecoveryForm({ ...recoveryForm, amount: e.target.value })}
                    className="w-full bg-[#050b17] border border-emerald-500/50 rounded-xl px-3 py-2 text-white font-mono font-bold text-sm outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold mb-1 block">কার কাছ থেকে আদায় হলো *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: রহিম উদ্দিন (ফিল্ড অফিসার) / পুরোনো কিস্তি কালেকশন"
                  value={recoveryForm.received_from}
                  onChange={(e) => setRecoveryForm({ ...recoveryForm, received_from: e.target.value })}
                  className="w-full bg-[#050b17] border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-400 font-medium"
                />
              </div>

              {gaps.length > 1 && (
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">সংশ্লিষ্ট ঘাটতি এন্ট্রি (ঐচ্ছিক)</label>
                  <select
                    value={recoveryForm.gap_id}
                    onChange={(e) => setRecoveryForm({ ...recoveryForm, gap_id: e.target.value })}
                    className="w-full bg-[#050b17] border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-400"
                  >
                    <option value="">সকল ঘাটতির সাধারণ আদায়</option>
                    {gaps.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.title} (৳ {Number(g.gap_amount).toLocaleString()} - {g.cut_off_date})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-slate-300 font-semibold mb-1 block">মন্তব্য / কৈফিয়ত (ঐচ্ছিক)</label>
                <textarea
                  rows="2"
                  placeholder="যেমন: মে মাসের বকেয়া কিস্তির গরমিল নিষ্পত্তি..."
                  value={recoveryForm.remarks}
                  onChange={(e) => setRecoveryForm({ ...recoveryForm, remarks: e.target.value })}
                  className="w-full bg-[#050b17] border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-400 resize-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-200 text-[11px] leading-relaxed">
                ℹ️ <strong>স্বয়ংক্রিয় কার্যপ্রণালী:</strong> সাবমিট নিশ্চিত করলে এই টাকা সাথে সাথে <strong>Cash In</strong> হিসেবে ক্যাশ বইতে যোগ হবে, ঘাটতির পরিমাণ হ্রাস পাবে এবং আজকের ব্যাংক জমার সাথে অন্তর্ভুক্ত হবে।
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowRecoveryModal(false)}
                  disabled={submittingRecovery}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submittingRecovery}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold cursor-pointer disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-emerald-950/50"
                >
                  {submittingRecovery ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>সংরক্ষণ হচ্ছে...</span>
                    </>
                  ) : (
                    <span>আদায় নিশ্চিত করুন</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* ⚙️ MODAL 3: EDIT GAP (Admin Only)                                        */}
      {/* ======================================================================= */}
      {showEditGapModal && editingGap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#091224] border border-amber-500/40 w-full max-w-md rounded-3xl shadow-2xl p-6 relative">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                  <FaEdit size={16} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">ঘাটতি এন্ট্রি সংশোধন</h3>
                  <p className="text-xs text-slate-400">আইডি #{editingGap.id}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowEditGapModal(false);
                  setEditingGap(null);
                }}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition"
              >
                <FaTimes size={14} />
              </button>
            </div>

            <form onSubmit={handleUpdateGap} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-semibold mb-1 block">ঘাটতির শিরোনাম *</label>
                <input
                  type="text"
                  required
                  value={editingGap.title}
                  onChange={(e) => setEditingGap({ ...editingGap, title: e.target.value })}
                  className="w-full bg-[#050b17] border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-400 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">কাট-অফ তারিখ *</label>
                  <input
                    type="date"
                    required
                    value={editingGap.cut_off_date}
                    onChange={(e) => setEditingGap({ ...editingGap, cut_off_date: e.target.value })}
                    className="w-full bg-[#050b17] border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-400 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">ঘাটতির পরিমাণ (টাকা) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="any"
                    value={editingGap.gap_amount}
                    onChange={(e) => setEditingGap({ ...editingGap, gap_amount: e.target.value })}
                    className="w-full bg-[#050b17] border border-amber-500/50 rounded-xl px-3 py-2 text-white font-mono font-bold text-sm outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold mb-1 block">নোট বা রেফারেন্স</label>
                <textarea
                  rows="2"
                  value={editingGap.notes}
                  onChange={(e) => setEditingGap({ ...editingGap, notes: e.target.value })}
                  className="w-full bg-[#050b17] border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-400 resize-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 text-amber-200 text-[11px] leading-relaxed">
                ⚠️ এই পরিমাণ সংশোধন করলে সংশ্লিষ্ট <strong>Cash Out</strong> ভাউচারের পরিমাণ ও তারিখও স্বয়ংক্রিয়ভাবে আপডেট হবে।
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditGapModal(false);
                    setEditingGap(null);
                  }}
                  disabled={submittingEditGap}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submittingEditGap}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold cursor-pointer disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-amber-950/50"
                >
                  {submittingEditGap ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>আপডেট হচ্ছে...</span>
                    </>
                  ) : (
                    <span>আপডেট নিশ্চিত করুন</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* 🗑️ MODAL 4: DELETE CONFIRMATION (Admin Only)                             */}
      {/* ======================================================================= */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#091224] border border-rose-500/40 w-full max-w-sm rounded-3xl shadow-2xl p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto">
              <FaTrashAlt size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {deleteConfirm.type === "gap" ? "ঘাটতি এন্ট্রি মুছবেন?" : "আদায় এন্ট্রি মুছবেন?"}
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                {deleteConfirm.type === "gap" ? (
                  <>
                    এই ঘাটতিটি (৳ {Number(deleteConfirm.item.gap_amount).toLocaleString()}) মুছে ফেললে সংশ্লিষ্ট <strong>Cash Out</strong> ভাউচারটিও স্বয়ংক্রিয়ভাবে ক্যাশ বই থেকে মুছে যাবে।
                  </>
                ) : (
                  <>
                    এই আদায়টি (৳ {Number(deleteConfirm.item.amount).toLocaleString()}) মুছে ফেললে সংশ্লিষ্ট <strong>Cash In</strong> ভাউচারটিও স্বয়ংক্রিয়ভাবে ক্যাশ বই থেকে মুছে যাবে।
                  </>
                )}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer shadow-lg shadow-rose-950/50 flex items-center gap-1.5"
              >
                {deleting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>মুছে ফেলা হচ্ছে...</span>
                  </>
                ) : (
                  <span>হ্যাঁ, মুছে ফেলুন</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
