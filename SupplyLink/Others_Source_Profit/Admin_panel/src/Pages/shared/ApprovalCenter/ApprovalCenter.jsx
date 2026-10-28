import React, { useState, useEffect, useCallback } from "react";
import {
  FiSearch,
  FiCalendar,
  FiFilter,
  FiCheck,
  FiX,
  FiClock,
  FiExternalLink,
  FiRefreshCw,
  FiCheckCircle,
  FiXCircle,
  FiUser,
  FiArrowRight,
  FiCreditCard,
  FiRotateCcw,
  FiTag,
  FiLayers,
  FiBookmark,
  FiShield
} from "react-icons/fi";
import { FaMoneyBillWave, FaListAlt, FaHandHoldingUsd, FaPiggyBank, FaStamp, FaBuilding } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../Provider/AuthProvider";
import useUsers from "../../../utils/Hooks/useUsers";
import LuxuryActionModal from "../../../components/Modal/LuxuryActionModal";
import LuxuryToast from "../../../components/Modal/LuxuryToast";
import InstallmentHistoryModal from "../../../components/Chart/InstallmentHistoryModal";

export default function ApprovalCenter() {
  const navigate = useNavigate();
  const { user } = useAuth() || {};
  const { users = [] } = useUsers();
  const currentUser = users.find((u) => u?.id === user?.id);

  // Luxury Toast state
  const [luxuryToast, setLuxuryToast] = useState(null);

  const targetRoles = ["developer", "staff", "manager", "admin"];
  const userRole =
    targetRoles?.find((role) => user?.role?.includes(role)) || "staff";
  const isAdminOrDev = ["admin", "developer"].some((r) =>
    userRole?.toLowerCase()?.includes(r)
  );
  const isManagerOrStaff = ["manager", "staff"].some((r) =>
    userRole?.toLowerCase()?.includes(r)
  );

  // Data & loading state
  const [data, setData] = useState([]);
  const [stats, setStats] = useState({
    pending_count: 0,
    approved_count: 0,
    rejected_count: 0,
    total_count: 0,
    pending_amount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  // Module totals for tab badges
  const [moduleTotals, setModuleTotals] = useState({
    installment: 0,
    investment: 0,
    daily: 0,
    cash: 0,
    asset: 0,
  });

  // Filters state
  const [scopeFilter, setScopeFilter] = useState("all"); // 'all' | 'my_requests'
  const [activeModule, setActiveModule] = useState("installment"); // 'installment' | 'investment' | 'cash'
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'pending' | 'approved' | 'rejected'
  const [installmentType, setInstallmentType] = useState("all"); // 'all' | 'regular' | 'down_payment'
  const [monthFilter, setMonthFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [activeDatePreset, setActiveDatePreset] = useState("all"); 

  // Full history modal state
  const [historyModal, setHistoryModal] = useState({
    isOpen: false,
    cardId: null,
    paymentId: null,
    customerName: "",
    installmentTag: "",
  });

  // Luxury Feedback & Action Modal state
  const [feedbackModal, setFeedbackModal] = useState({
    isOpen: false,
    type: "confirm",
    variant: "cyan",
    title: "",
    description: "",
    confirmText: "ঠিক আছে",
    cancelText: "বাতিল",
    showCancel: false,
    requiresInput: false,
    inputPlaceholder: "",
    inputLabel: "",
    onConfirm: null,
    onClose: () => setFeedbackModal((prev) => ({ ...prev, isOpen: false })),
  });

  const fetchAllModuleCounts = useCallback(async () => {
    try {
      const base = import.meta.env.VITE_LOCALHOST_KEY;
      const [instRes, invRes, dailyRes, cashRes, assetRes] = await Promise.allSettled([
        axios.get(`${base}/customers/get_installment_edits.php`),
        axios.get(`${base}/investors/get_investment_edits.php`),
        axios.get(`${base}/DailyInstallments/get_daily_installment_edits.php`),
        axios.get(`${base}/cash/get_cash_edits.php`),
        axios.get(`${base}/other_sources/get_asset_edits.php`),
      ]);

      const getCount = (r) => {
        if (r.status !== "fulfilled" || !r.value?.data?.success) return 0;
        const d = r.value.data;
        if (d.stats && typeof d.stats.total_count === "number") return d.stats.total_count;
        if (typeof d.count === "number") return d.count;
        if (Array.isArray(d.data)) return d.data.length;
        return 0;
      };

      setModuleTotals({
        installment: getCount(instRes),
        investment: getCount(invRes),
        daily: getCount(dailyRes),
        cash: getCount(cashRes),
        asset: getCount(assetRes),
      });
    } catch (e) {
      // silent
    }
  }, []);

  const handleModuleChange = (newModule) => {
    if (newModule === activeModule) return;
    setActiveModule(newModule);
    setData([]);
    setStats({
      pending_count: 0,
      approved_count: 0,
      rejected_count: 0,
      total_count: 0,
      pending_amount: 0,
    });
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== "all") params.status = statusFilter;
      if (installmentType !== "all") params.installment_type = installmentType;
      if (monthFilter) params.month = monthFilter;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (search.trim()) params.search = search.trim();
      if (scopeFilter === "my_requests") {
        params.requested_by = currentUser?.id || user?.id;
      }

      const endpoint =
        activeModule === "asset"
          ? `${import.meta.env.VITE_LOCALHOST_KEY}/other_sources/get_asset_edits.php`
          : activeModule === "cash"
          ? `${import.meta.env.VITE_LOCALHOST_KEY}/cash/get_cash_edits.php`
          : activeModule === "investment"
          ? `${import.meta.env.VITE_LOCALHOST_KEY}/investors/get_investment_edits.php`
          : activeModule === "daily"
          ? `${import.meta.env.VITE_LOCALHOST_KEY}/DailyInstallments/get_daily_installment_edits.php`
          : `${import.meta.env.VITE_LOCALHOST_KEY}/customers/get_installment_edits.php`;

      const res = await axios.get(endpoint, { params });

      if (res.data?.success && Array.isArray(res.data?.data)) {
        setData(res.data.data);
        if (res.data.stats) {
          setStats(res.data.stats);
          setModuleTotals((prev) => ({
            ...prev,
            [activeModule]: res.data.stats.total_count ?? res.data.data.length,
          }));
        } else {
          const list = res.data.data;
          const calculatedStats = {
            pending_count: list.filter((x) => x.status === "pending").length,
            approved_count: list.filter((x) => x.status === "approved").length,
            rejected_count: list.filter((x) => x.status === "rejected").length,
            total_count: list.length,
            pending_amount: list
              .filter((x) => x.status === "pending")
              .reduce((sum, x) => sum + Number(x.new_purchase_price || x.new_amount || x.amount || 0), 0),
          };
          setStats(calculatedStats);
          setModuleTotals((prev) => ({
            ...prev,
            [activeModule]: list.length,
          }));
        }
      } else {
        setData([]);
        setStats({
          pending_count: 0,
          approved_count: 0,
          rejected_count: 0,
          total_count: 0,
          pending_amount: 0,
        });
      }
    } catch (err) {
      console.error("Failed to fetch approval requests:", err);
      setData([]);
      setStats({
        pending_count: 0,
        approved_count: 0,
        rejected_count: 0,
        total_count: 0,
        pending_amount: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [activeModule, statusFilter, installmentType, monthFilter, startDate, endDate, search, scopeFilter, currentUser, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchAllModuleCounts();
  }, [fetchAllModuleCounts]);

  // Date Presets Handler
  const applyDatePreset = (preset) => {
    setActiveDatePreset(preset);
    const now = new Date();
    const formatDate = (d) => d.toISOString().split("T")[0];

    if (preset === "all") {
      setStartDate("");
      setEndDate("");
      setMonthFilter("");
    } else if (preset === "today") {
      const todayStr = formatDate(now);
      setStartDate(todayStr);
      setEndDate(todayStr);
      setMonthFilter("");
    } else if (preset === "yesterday") {
      const yest = new Date(now);
      yest.setDate(yest.getDate() - 1);
      const yestStr = formatDate(yest);
      setStartDate(yestStr);
      setEndDate(yestStr);
      setMonthFilter("");
    } else if (preset === "7days") {
      const past7 = new Date(now);
      past7.setDate(past7.getDate() - 7);
      setStartDate(formatDate(past7));
      setEndDate(formatDate(now));
      setMonthFilter("");
    } else if (preset === "this_month") {
      const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      setMonthFilter(ym);
      setStartDate("");
      setEndDate("");
    }
  };

  // Handle Approve or Reject
  const handleAction = (item, action) => {
    const isApprove = action === "approved";
    const isAsset = activeModule === "asset";
    const isCash = activeModule === "cash";
    const isInvest = activeModule === "investment";
    const isDaily = activeModule === "daily";
    const confirmTitle = isApprove ? "অনুমোদন নিশ্চিত করুন" : "বাতিল নিশ্চিত করুন";
    const confirmText = isAsset
      ? (isApprove
          ? `আপনি কি "${item.new_asset_name || item.old_asset_name || "অ্যাসেট"}" (অ্যাসেট #${item.asset_id}) এর সংশোধিত তথ্য ও ক্রয়মূল্য ৳${Number(item.new_purchase_price || 0).toLocaleString('en-IN')} অনুমোদন করতে চান? সংশ্লিষ্ট ক্যাশ লেজার ও ভাউচার স্বয়ংক্রিয়ভাবে আপডেট হবে।`
          : `আপনি কি অ্যাসেট #${item.asset_id} এর সংশোধনের অনুরোধটি বাতিল করতে চান? অ্যাসেটটি পূর্বের তথ্যে বহাল থাকবে।`)
      : isCash
      ? (isApprove
          ? `আপনি কি ক্যাশ ${item.type === 'in' ? 'ইন' : 'আউট'} #${item.cash_id} (${item.new_source || item.new_purpose || 'লেনদেন'}) এর সংশোধিত পরিমাণ ৳${Number(item.new_amount || item.amount || 0).toLocaleString('en-IN')} অনুমোদন করতে চান? সংশ্লিষ্ট ক্যাশ লেজার ও ব্যালেন্স সাথে সাথে আপডেট হবে।`
          : `আপনি কি ক্যাশ #${item.cash_id} এর সংশোধনের অনুরোধটি বাতিল করতে চান? ক্যাশ লেনদেন পূর্বের অবস্থায় বহাল থাকবে।`)
      : isDaily
      ? (isApprove
          ? `আপনি কি কার্ড #${item.card_id} এর দৈনিক কিস্তির সংশোধিত পরিমাণ ৳${Number(item.new_amount || item.amount || 0).toLocaleString('en-IN')} অনুমোদন করতে চান? সংশ্লিষ্ট ক্যাশ-ইন স্বয়ংক্রিয়ভাবে আপডেট হবে।`
          : `আপনি কি কার্ড #${item.card_id} এর দৈনিক কিস্তি সংশোধনের অনুরোধটি বাতিল করতে চান?`)
      : isInvest
      ? (isApprove 
          ? `আপনি কি ইনভেস্টর "${item.investor_name || "ইনভেস্টর"}" - কার্ড #${item.card_id} এর কিস্তি #${item.installment_no || 1} এর সংশোধিত পরিমাণ ৳${Number(item.new_amount || item.amount || 0).toLocaleString('en-IN')} অনুমোদন করতে চান? সংশ্লিষ্ট ক্যাশ-ইন স্বয়ংক্রিয়ভাবে আপডেট হবে।`
          : `আপনি কি কার্ড #${item.card_id} এর কিস্তি সংশোধনের অনুরোধটি বাতিল করতে চান? কিস্তি পূর্বের অবস্থায় বহাল থাকবে।`)
      : (isApprove
          ? `আপনি কি কার্ড #${item.card_id} এর "${item.installment_tag || "কিস্তি"}" আনপেইড করার অনুরোধ অনুমোদন করতে চান? সংশ্লিষ্ট ক্যাশ-ইন স্বয়ংক্রিয়ভাবে রিভার্ট হবে।`
          : `আপনি কি কার্ড #${item.card_id} এর "${item.installment_tag || "কিস্তি"}" আনপেইড করার অনুরোধটি বাতিল করতে চান? কিস্তিটি পেইড অবস্থায় বহাল থাকবে।`);

    setFeedbackModal({
      isOpen: true,
      type: "confirm",
      variant: isApprove ? "success" : "danger",
      title: confirmTitle,
      description: confirmText,
      confirmText: isApprove ? "হ্যাঁ, অনুমোদন দিন" : "হ্যাঁ, বাতিল করুন",
      cancelText: "ফিরে যান",
      showCancel: true,
      requiresInput: !isApprove,
      inputLabel: "বাতিলের কারণ (মন্তব্য) *",
      inputPlaceholder: "কেন বাতিল করা হচ্ছে সংক্ষেপে লিখুন...",
      onConfirm: async (rejectNote) => {
        try {
          setProcessingId(item.id);
          setFeedbackModal((prev) => ({ ...prev, isSubmitting: true }));
          const actionEndpoint = isAsset
            ? `${import.meta.env.VITE_LOCALHOST_KEY}/other_sources/action_asset_edit.php`
            : isCash
            ? `${import.meta.env.VITE_LOCALHOST_KEY}/cash/action_cash_edit.php`
            : isDaily
            ? `${import.meta.env.VITE_LOCALHOST_KEY}/DailyInstallments/action_daily_installment_edit.php`
            : isInvest
            ? `${import.meta.env.VITE_LOCALHOST_KEY}/investors/action_investment_edit.php`
            : `${import.meta.env.VITE_LOCALHOST_KEY}/customers/action_installment_edit.php`;

          const res = await axios.post(actionEndpoint, {
            edit_id: item.id,
            action: action,
            reviewer_id: currentUser?.id || user?.id,
            review_note: rejectNote || "",
          });

          setFeedbackModal((prev) => ({ ...prev, isOpen: false, isSubmitting: false }));

          if (res.data?.success) {
            setLuxuryToast({
              title: isApprove ? "অনুমোদিত হয়েছে! ✅" : "বাতিল করা হয়েছে! 🚫",
              message: res.data.message || (isApprove ? "অনুরোধটি সফলভাবে অনুমোদিত হয়েছে।" : "অনুরোধটি বাতিল করা হয়েছে।"),
              tag: isAsset ? `অ্যাসেট সংশোধন` : isCash ? `ক্যাশ ${item.type === 'in' ? 'ইন' : 'আউট'}` : item.installment_tag || (isDaily ? `দৈনিক কিস্তি` : isInvest ? `বিনিয়োগ কিস্তি` : `কিস্তি`),
              amount: isAsset ? (item.new_purchase_price || item.old_purchase_price) : (item.new_amount || item.amount),
              type: isApprove ? "success" : "warning",
            });
            window.dispatchEvent(new CustomEvent("installment_updated"));
            window.dispatchEvent(new CustomEvent("cash_updated"));
            window.dispatchEvent(new CustomEvent("asset_updated"));
            fetchData();
            fetchAllModuleCounts();
          } else {
            setLuxuryToast({
              title: "ব্যর্থ হয়েছে ❌",
              message: res.data?.message || res.data?.error || "কার্যক্রম সম্পন্ন করা যায়নি।",
              type: "error",
            });
          }
        } catch (err) {
          setFeedbackModal((prev) => ({ ...prev, isOpen: false, isSubmitting: false }));
          setLuxuryToast({
            title: "সার্ভার এরর ❌",
            message: err.response?.data?.message || err.response?.data?.error || "সার্ভারে ত্রুটি হয়েছে।",
            type: "error",
          });
        } finally {
          setProcessingId(null);
        }
      },
      onClose: () => setFeedbackModal((prev) => ({ ...prev, isOpen: false })),
    });
  };

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setInstallmentType("all");
    setScopeFilter("all");
    setMonthFilter("");
    setStartDate("");
    setEndDate("");
    setActiveDatePreset("all");
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      const d = new Date(dateStr);
      return d.toLocaleString("bn-BD", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch (e) {
      return dateStr;
    }
  };

  // Month options generator for last 12 months
  const getMonthOptions = () => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleString("bn-BD", { month: "long", year: "numeric" });
      options.push({ value: val, label });
    }
    return options;
  };

  const hasActiveFilters =
    Boolean(search) ||
    statusFilter !== "all" ||
    installmentType !== "all" ||
    scopeFilter !== "all" ||
    Boolean(monthFilter) ||
    Boolean(startDate) ||
    Boolean(endDate);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-blue-600 text-white shadow-xl shadow-cyan-950/40">
              <FaStamp className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
                <span>Requests & Approvals</span>
                <span className="rounded-full bg-cyan-500/10 border border-cyan-500/25 px-2.5 py-0.5 text-xs font-mono font-medium text-cyan-400">
                  {isAdminOrDev ? "Approval Hub" : "Request Tracker"}
                </span>
                <span className="rounded-full bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 text-[11px] font-mono uppercase text-indigo-300">
                  {userRole}
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                {isAdminOrDev
                  ? "সকল কর্মীর পাঠানো কিস্তি আনপেইড ও অন্যান্য অনুরোধ পর্যালোচনা, অনুমোদন ও বাতিল হাব"
                  : "আপনার ও আপনার ব্রাঞ্চের পাঠানো সকল রিকোয়েস্টের লাইভ স্ট্যাটাস, অনুমোদন ও অগ্রগতি ট্র্যাকিং"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer shadow-sm"
          >
            <FiRefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>রিফ্রেশ</span>
          </button>
        </div>
      </div>

      {/* Unified System Modules Filter (Architecture for All Modules) */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-1.5 rounded-2xl bg-[#090e1c] border border-white/[0.08]">
        {/* Module Switcher */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => handleModuleChange("installment")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeModule === "installment"
                ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-950/50"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <FaListAlt className="h-3.5 w-3.5" />
            <span>গ্রাহক কিস্তি (Customer)</span>
            {moduleTotals.installment > 0 && (
              <span className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-mono font-bold ${
                activeModule === "installment" ? "bg-black/40 text-white" : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
              }`}>
                {moduleTotals.installment}
              </span>
            )}
          </button>

          <button
            onClick={() => handleModuleChange("investment")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeModule === "investment"
                ? "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-lg shadow-indigo-950/50"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <FaPiggyBank className="h-3.5 w-3.5 text-indigo-300" />
            <span>বিনিয়োগ কিস্তি সংশোধন (Investment)</span>
            {moduleTotals.investment > 0 && (
              <span className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-mono font-bold ${
                activeModule === "investment" ? "bg-black/40 text-white" : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
              }`}>
                {moduleTotals.investment}
              </span>
            )}
          </button>

          <button
            onClick={() => handleModuleChange("daily")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeModule === "daily"
                ? "bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white shadow-lg shadow-teal-950/50"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <FiCreditCard className="h-3.5 w-3.5 text-emerald-300" />
            <span>দৈনিক কিস্তি সংশোধন (Daily)</span>
            {moduleTotals.daily > 0 && (
              <span className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-mono font-bold ${
                activeModule === "daily" ? "bg-black/40 text-white" : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
              }`}>
                {moduleTotals.daily}
              </span>
            )}
          </button>

          <button
            onClick={() => handleModuleChange("cash")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeModule === "cash"
                ? "bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 text-white shadow-lg shadow-orange-950/50"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <FaMoneyBillWave className="h-3.5 w-3.5 text-amber-300" />
            <span>ক্যাশ সংশোধন (Cash In/Out)</span>
            {moduleTotals.cash > 0 && (
              <span className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-mono font-bold ${
                activeModule === "cash" ? "bg-black/40 text-white" : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
              }`}>
                {moduleTotals.cash}
              </span>
            )}
          </button>

          <button
            onClick={() => handleModuleChange("asset")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeModule === "asset"
                ? "bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 text-white shadow-lg shadow-teal-950/50"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <FaBuilding className="h-3.5 w-3.5 text-teal-300" />
            <span>অ্যাসেট সংশোধন (Assets)</span>
            {moduleTotals.asset > 0 && (
              <span className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-mono font-bold ${
                activeModule === "asset" ? "bg-black/40 text-white" : "bg-teal-500/20 text-teal-300 border border-teal-500/30"
              }`}>
                {moduleTotals.asset}
              </span>
            )}
          </button>

          <button
            onClick={() => navigate("/applications/all_invest_withdraw")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
            title="ইনভেস্টমেন্ট উইথড্র রিকোয়েস্ট পেজে যান"
          >
            <span>ইনভেস্টমেন্ট উইথড্র</span>
            <FiExternalLink className="h-3 w-3 text-slate-500" />
          </button>

          <button
            onClick={() => navigate("/cash/cash-report-approval")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
            title="ক্যাশ রিপোর্ট ও অনুদান অনুমোদন পেজে যান"
          >
            <FaHandHoldingUsd className="h-3.5 w-3.5 text-emerald-400" />
            <span>ক্যাশ অনুদান</span>
            <FiExternalLink className="h-3 w-3 text-slate-500" />
          </button>
        </div>

        {/* Scope Toggle: All Requests vs My Requests (Especially useful for Staff/Manager) */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/5 ml-auto">
          <button
            onClick={() => setScopeFilter("all")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${scopeFilter === "all"
                ? "bg-indigo-600 text-white shadow"
                : "text-slate-400 hover:text-white"
              }`}
          >
            সকল রিকোয়েস্ট
          </button>
          <button
            onClick={() => setScopeFilter("my_requests")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${scopeFilter === "my_requests"
                ? "bg-cyan-600 text-white shadow"
                : "text-slate-400 hover:text-white"
              }`}
          >
            <FiUser className="h-3 w-3" />
            <span>আমার পাঠানো রিকোয়েস্ট</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Pending Approvals */}
        <div
          onClick={() => setStatusFilter("pending")}
          className={`rounded-2xl border p-4.5 shadow-lg relative overflow-hidden cursor-pointer transition-all ${statusFilter === "pending"
              ? "border-amber-500/60 bg-gradient-to-br from-[#171408] to-[#251e0c] ring-2 ring-amber-500/40"
              : "border-amber-500/20 bg-gradient-to-br from-[#0c1424] to-[#121c32] hover:border-amber-500/40"
            }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">অনুমোদন অপেক্ষমাণ</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400">
              <FiClock className="h-4 w-4 animate-pulse" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">
            {stats.pending_count}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
            <span>মোট অপেক্ষমাণ অর্থ:</span>
            <strong className="text-white font-mono">৳{Number(stats.pending_amount).toLocaleString("en-IN")}</strong>
          </div>
          <div className="absolute -bottom-6 -right-6 w-20 h-20 rounded-full bg-amber-500/5 blur-xl pointer-events-none" />
        </div>

        {/* 2. Approved Requests */}
        <div
          onClick={() => setStatusFilter("approved")}
          className={`rounded-2xl border p-4.5 shadow-lg relative overflow-hidden cursor-pointer transition-all ${statusFilter === "approved"
              ? "border-emerald-500/60 bg-gradient-to-br from-[#081a15] to-[#0f2e23] ring-2 ring-emerald-500/40"
              : "border-emerald-500/20 bg-gradient-to-br from-[#0c1424] to-[#121c32] hover:border-emerald-500/40"
            }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">অনুমোদিত রিকোয়েস্ট</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
              <FiCheckCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {stats.approved_count}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            সফলভাবে আনপেইড ও ক্যাশ রিভার্ট সম্পন্ন
          </div>
          <div className="absolute -bottom-6 -right-6 w-20 h-20 rounded-full bg-emerald-500/5 blur-xl pointer-events-none" />
        </div>

        {/* 3. Rejected Requests */}
        <div
          onClick={() => setStatusFilter("rejected")}
          className={`rounded-2xl border p-4.5 shadow-lg relative overflow-hidden cursor-pointer transition-all ${statusFilter === "rejected"
              ? "border-rose-500/60 bg-gradient-to-br from-[#1a080d] to-[#2e0f17] ring-2 ring-rose-500/40"
              : "border-rose-500/20 bg-gradient-to-br from-[#0c1424] to-[#121c32] hover:border-rose-500/40"
            }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">বাতিলকৃত অনুরোধ</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400">
              <FiXCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-rose-400">
            {stats.rejected_count}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            পেইড স্ট্যাটাস বহাল রাখা হয়েছে
          </div>
          <div className="absolute -bottom-6 -right-6 w-20 h-20 rounded-full bg-rose-500/5 blur-xl pointer-events-none" />
        </div>

        {/* 4. Total Requests */}
        <div
          onClick={() => setStatusFilter("all")}
          className={`rounded-2xl border p-4.5 shadow-lg relative overflow-hidden cursor-pointer transition-all ${statusFilter === "all"
              ? "border-cyan-500/60 bg-gradient-to-br from-[#071624] to-[#0c243c] ring-2 ring-cyan-500/40"
              : "border-cyan-500/20 bg-gradient-to-br from-[#0c1424] to-[#121c32] hover:border-cyan-500/40"
            }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">সর্বমোট রিকোয়েস্ট</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-400">
              <FaMoneyBillWave className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-400">
            {stats.total_count}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            আনপেইড ও এডিট সংক্রান্ত সকল অনুরোধ
          </div>
          <div className="absolute -bottom-6 -right-6 w-20 h-20 rounded-full bg-cyan-500/5 blur-xl pointer-events-none" />
        </div>
      </div>

      {/* Advanced Filter Toolbar */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#070b16] p-4.5 space-y-4 shadow-xl">
        {/* Row 1: Status Tabs + Quick Date Presets */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-white/[0.03] border border-white/5">
            {[
              { id: "all", label: "সবগুলো" },
              { id: "pending", label: "পেন্ডিং অনুমোদন", badge: stats.pending_count },
              { id: "approved", label: "অনুমোদিত" },
              { id: "rejected", label: "বাতিলকৃত" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${statusFilter === tab.id
                    ? tab.id === "pending"
                      ? "bg-amber-600 text-white shadow"
                      : "bg-cyan-600 text-white shadow"
                    : "text-slate-400 hover:text-white"
                  }`}
              >
                <span>{tab.label}</span>
                {tab.badge > 0 && (
                  <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-400 text-black px-1 text-[9px] font-bold">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Quick Date Presets */}
          <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-white/[0.02] border border-white/5 text-[11px]">
            <span className="text-slate-400 px-2 font-medium flex items-center gap-1">
              <FiCalendar className="h-3.5 w-3.5 text-cyan-400" />
              <span>তারিখ:</span>
            </span>
            {[
              { id: "all", label: "সকল সময়" },
              { id: "today", label: "আজ" },
              { id: "yesterday", label: "গতকাল" },
              { id: "7days", label: "৭ দিন" },
              { id: "this_month", label: "চলতি মাস" },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => applyDatePreset(p.id)}
                className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${activeDatePreset === p.id
                    ? "bg-indigo-600 text-white shadow"
                    : "text-slate-400 hover:text-white hover:bg-white/[0.05]"
                  }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 underline cursor-pointer ml-auto"
            >
              <span>ফিল্টার রিসেট করুন</span>
              <FiX className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Row 2: Category, Month Filter, Date Range & Live Search */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-white/[0.05]">
          {/* 1. Installment Type (Down Payment vs Regular) */}
          <div className="relative">
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              কিস্তির ধরণ (Type)
            </label>
            <select
              value={installmentType}
              onChange={(e) => setInstallmentType(e.target.value)}
              className="w-full rounded-xl bg-[#0c1424] border border-white/10 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer appearance-none"
            >
              <option value="all">সকল কিস্তির ধরণ</option>
              <option value="regular">সাধারণ কিস্তি (Regular)</option>
              <option value="down_payment">ডাউন পেমেন্ট (Down Payment)</option>
            </select>
            <span className="absolute right-3 top-[28px] text-slate-400 text-[10px] pointer-events-none">
              ▼
            </span>
          </div>

          {/* 2. Monthly Selector */}
          <div className="relative">
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              মাসিক ফিল্টার (Month)
            </label>
            <select
              value={monthFilter}
              onChange={(e) => {
                setMonthFilter(e.target.value);
                setStartDate("");
                setEndDate("");
                setActiveDatePreset("");
              }}
              className="w-full rounded-xl bg-[#0c1424] border border-white/10 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer appearance-none"
            >
              <option value="">সকল মাস (All Months)</option>
              {getMonthOptions().map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-[#0c1424]">
                  {opt.label}
                </option>
              ))}
            </select>
            <span className="absolute right-3 top-[28px] text-slate-400 text-[10px] pointer-events-none">
              ▼
            </span>
          </div>

          {/* 3. Date Range (From - To) */}
          <div className="relative">
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              কাস্টম তারিখ রেঞ্জ
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setMonthFilter("");
                  setActiveDatePreset("");
                }}
                className="w-1/2 rounded-xl bg-[#0c1424] border border-white/10 px-2 py-2 text-[11px] text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
                title="শুরুর তারিখ"
              />
              <span className="text-slate-500 text-xs">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setMonthFilter("");
                  setActiveDatePreset("");
                }}
                className="w-1/2 rounded-xl bg-[#0c1424] border border-white/10 px-2 py-2 text-[11px] text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
                title="শেষের তারিখ"
              />
            </div>
          </div>

          {/* 4. Live Search */}
          <div className="relative">
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              অনুসন্ধান (Search)
            </label>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-3.5 w-3.5" />
              <input
                type="text"
                placeholder="গ্রাহকের নাম, কার্ড # বা স্টাফ..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl bg-[#0c1424] border border-white/10 pl-8.5 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#070b16] shadow-2xl overflow-hidden">
        {/* Table summary bar */}
        <div className="px-5 py-3 border-b border-white/[0.06] bg-[#090e1c] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="text-slate-400">মোট রিকোয়েস্ট:</span>
            <span className="font-mono font-bold text-cyan-400">{data.length} টি</span>
            {scopeFilter === "my_requests" && (
              <span className="rounded bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 text-[10px] font-medium text-indigo-300">
                আমার পাঠানো রিকোয়েস্ট ফিল্টার সক্রিয়
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-slate-400 text-[11px]">
            <span>পেন্ডিং: <strong className="text-amber-400 font-mono">{stats.pending_count}</strong></span>
            <span>•</span>
            <span>অনুমোদিত: <strong className="text-emerald-400 font-mono">{stats.approved_count}</strong></span>
            <span>•</span>
            <span>বাতিল: <strong className="text-rose-400 font-mono">{stats.rejected_count}</strong></span>
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.08] bg-[#0a1020] text-slate-400 font-semibold text-[11px]">
                <th className="py-3.5 px-4 min-w-[140px]">তারিখ ও সময়</th>
                <th className="py-3.5 px-3 min-w-[170px]">
                  {activeModule === "asset"
                    ? "অ্যাসেট ও বিবরণ"
                    : activeModule === "cash"
                    ? "ক্যাশ লেনদেন ও উৎস/উদ্দেশ্য"
                    : "গ্রাহক ও কার্ড নং"}
                </th>
                <th className="py-3.5 px-3 min-w-[110px]">
                  {activeModule === "asset" || activeModule === "cash" ? "ক্যাটাগরি" : "কিস্তির ট্যাগ"}
                </th>
                <th className="py-3.5 px-3 min-w-[100px] text-right">পরিমাণ (৳)</th>
                <th className="py-3.5 px-3 min-w-[130px]">অনুরোধের ধরণ</th>
                <th className="py-3.5 px-3 min-w-[150px]">অনুরোধকারী (কর্মী)</th>
                <th className="py-3.5 px-3 min-w-[120px] text-center">স্ট্যাটাস</th>
                <th className="py-3.5 px-3 min-w-[150px]">অনুমোদনকারী</th>
                <th className="py-3.5 px-4 min-w-[190px] text-center">অ্যাকশন</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/[0.04] text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FiRefreshCw className="h-6 w-6 animate-spin text-cyan-400" />
                      <span className="text-xs">অনুরোধের তালিকা লোড হচ্ছে...</span>
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <FiClock className="h-8 w-8 text-slate-600 mb-2" />
                      <span className="text-sm font-medium text-slate-400">
                        {scopeFilter === "my_requests"
                          ? "আপনার পাঠানো কোনো রিকোয়েস্ট রেকর্ড পাওয়া যায়নি"
                          : "কোনো রিকোয়েস্ট রেকর্ড পাওয়া যায়নি"}
                      </span>
                      <span className="text-xs text-slate-500 mt-0.5">
                        নতুন কোনো অনুমোদন অনুরোধ আসলে এখানে প্রদর্শিত হবে
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((item) => {
                  const isPending = item.status === "pending";
                  const isApproved = item.status === "approved";
                  const isRejected = item.status === "rejected";
                  const isProcessing = processingId === item.id;
                  const isMyRequest = (item.requested_by === currentUser?.id || item.requested_by === user?.id);

                  const installmentTag =
                    item.installment_tag ||
                    (item.installment_no === 0
                      ? "ডাউন পেমেন্ট"
                      : `${item.installment_no}তম কিস্তি`);

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-white/[0.02] transition-colors ${isMyRequest ? "bg-cyan-500/[0.015]" : ""
                        }`}
                    >
                      {/* 1. Date & Time */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-300">
                        {formatDateTime(item.created_at)}
                      </td>

                      {/* 2. Customer & Card / Cash / Asset details */}
                      <td className="py-3.5 px-3">
                        {activeModule === "asset" ? (
                          <div>
                            <div className="font-semibold text-white tracking-wide flex items-center gap-1.5">
                              <span className="rounded bg-teal-500/15 text-teal-300 border border-teal-500/30 px-1.5 py-0.5 text-[10px] font-bold">
                                অ্যাসেট #{item.asset_id}
                              </span>
                              <span className="truncate max-w-[150px] text-xs font-medium" title={item.new_asset_name || item.old_asset_name}>
                                {item.new_asset_name || item.old_asset_name}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-400 font-mono">
                              {item.new_vendor_name || item.old_vendor_name ? (
                                <span>বিক্রেতা: {item.new_vendor_name || item.old_vendor_name}</span>
                              ) : item.new_reg_no || item.old_reg_no ? (
                                <span>রেজিস্ট্রেশন: {item.new_reg_no || item.old_reg_no}</span>
                              ) : (
                                <span>ক্রয়: {item.new_purchase_date || item.old_purchase_date}</span>
                              )}
                            </div>
                          </div>
                        ) : activeModule === "cash" ? (
                          <div>
                            <div className="font-semibold text-white tracking-wide flex items-center gap-1.5">
                              <span
                                className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                                  item.type === "in"
                                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                    : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                                }`}
                              >
                                {item.type === "in" ? "ক্যাশ ইন" : "ক্যাশ আউট"}
                              </span>
                              <span className="truncate max-w-[140px] text-xs">
                                {item.new_source || item.new_purpose || item.old_source || item.old_purpose || "লেনদেন"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="rounded bg-amber-500/10 border border-amber-500/25 px-1.5 py-0.2 text-[10px] font-mono text-amber-300">
                                ক্যাশ #{item.cash_id}
                              </span>
                              {item.new_date && (
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {item.new_date}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="font-semibold text-white tracking-wide">
                              {item.customer_name || item.investor_name || "গ্রাহক/ইনভেস্টর"}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="rounded bg-cyan-500/10 border border-cyan-500/25 px-1.5 py-0.2 text-[10px] font-mono text-cyan-300">
                                কার্ড #{item.card_id}
                              </span>
                              {(item.customer_mobile || item.card_name) && (
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {item.customer_mobile || item.card_name}
                                </span>
                              )}
                            </div>
                          </>
                        )}
                      </td>

                      {/* 3. Installment Tag / Cash / Asset Category */}
                      <td className="py-3.5 px-3">
                        <span className="inline-block rounded-lg bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 text-xs font-medium text-indigo-300">
                          {activeModule === "asset"
                            ? item.new_category || item.old_category || "স্থায়ী সম্পদ"
                            : activeModule === "cash"
                            ? item.new_category || (item.type === "in" ? "ক্যাশ ইন" : "ক্যাশ আউট")
                            : activeModule === "daily"
                            ? "দৈনিক কিস্তি"
                            : activeModule === "investment"
                            ? (item.installment_no ? `কিস্তি #${item.installment_no}` : "বিনিয়োগ কিস্তি")
                            : installmentTag}
                        </span>
                      </td>

                      {/* 4. Amount */}
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-white text-xs">
                        {activeModule === "asset" ? (
                          <div>
                            <span className="text-rose-400/80 line-through text-[10px] block font-mono">
                              ৳{Number(item.old_purchase_price || 0).toLocaleString("en-IN")}
                            </span>
                            <span className="text-emerald-400 font-bold font-mono text-xs block">
                              ৳{Number(item.new_purchase_price || 0).toLocaleString("en-IN")}
                            </span>
                          </div>
                        ) : activeModule === "investment" || activeModule === "daily" || activeModule === "cash" ? (
                          <div>
                            <span className="text-rose-400/80 line-through text-[10px] block font-mono">
                              ৳{Number(item.old_amount || 0).toLocaleString("en-IN")}
                            </span>
                            <span className="text-emerald-400 font-bold font-mono text-xs block">
                              ৳{Number(item.new_amount || item.amount || 0).toLocaleString("en-IN")}
                            </span>
                          </div>
                        ) : (
                          <span>৳{Number(item.amount || item.due_amount || 0).toLocaleString("en-IN")}</span>
                        )}
                      </td>

                      {/* 5. Transition / Action Type */}
                      <td className="py-3.5 px-3">
                        {activeModule === "asset" || activeModule === "investment" || activeModule === "daily" || activeModule === "cash" ? (
                          <div className="text-xs font-mono">
                            <span className="text-cyan-300 font-semibold">সংশোধন (Edit)</span>
                            {item.request_reason && (
                              <div className="text-[10px] text-slate-400 truncate max-w-[130px]" title={item.request_reason}>
                                {item.request_reason}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                            <span>{item.old_status || "Paid"}</span>
                            <FiArrowRight className="h-3 w-3 text-cyan-400" />
                            <span className="text-amber-400 font-semibold">
                              {item.new_status || "Unpaid"}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* 6. Requested By */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 font-bold text-[11px] shrink-0">
                            {(item.requester_name || "U")[0]?.toUpperCase()}
                          </div>
                          <div>
                            <div className="text-slate-200 font-medium text-xs leading-none flex items-center gap-1.5">
                              <span>{item.requester_name || "স্টাফ"}</span>
                              {isMyRequest && (
                                <span className="rounded bg-cyan-500/20 text-cyan-300 px-1 text-[9px] font-bold">
                                  আপনি
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] font-mono uppercase text-indigo-400 mt-0.5">
                              {item.requester_role || "Staff"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 7. Status Badge */}
                      <td className="py-3.5 px-3 text-center">
                        {isPending ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 text-[11px] font-semibold text-amber-400 animate-pulse">
                            <FiClock className="h-2.5 w-2.5" />
                            <span>পেন্ডিং</span>
                          </span>
                        ) : isApproved ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
                            <FiCheck className="h-2.5 w-2.5" />
                            <span>অনুমোদিত</span>
                          </span>
                        ) : isRejected ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 border border-rose-500/30 px-2.5 py-0.5 text-[11px] font-semibold text-rose-400">
                            <FiX className="h-2.5 w-2.5" />
                            <span>বাতিল</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>

                      {/* 8. Reviewed By */}
                      <td className="py-3.5 px-3 text-xs text-slate-400">
                        {item.reviewer_name ? (
                          <div>
                            <div className="text-slate-200 font-medium leading-none">
                              {item.reviewer_name}
                            </div>
                            <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                              {formatDateTime(item.reviewed_at)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-xs italic">অপেক্ষমাণ</span>
                        )}
                      </td>

                      {/* 9. Action Buttons */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Approve / Reject buttons if pending and Admin/Dev */}
                          {isAdminOrDev && isPending && (
                            <>
                              <button
                                disabled={isProcessing}
                                onClick={() => handleAction(item, "approved")}
                                title="অনুরোধ অনুমোদন করুন"
                                className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30 hover:border-emerald-500/60 transition disabled:opacity-50 cursor-pointer shadow-sm shadow-emerald-950"
                              >
                                {isProcessing ? (
                                  <FiRefreshCw className="h-3 w-3 animate-spin" />
                                ) : (
                                  <FiCheck className="h-3.5 w-3.5" />
                                )}
                              </button>

                              <button
                                disabled={isProcessing}
                                onClick={() => handleAction(item, "rejected")}
                                title="অনুরোধ বাতিল করুন"
                                className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:bg-rose-500/30 hover:border-rose-500/60 transition disabled:opacity-50 cursor-pointer shadow-sm shadow-rose-950"
                              >
                                <FiX className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}

                          {/* View Full Card History Modal (only for installments) */}
                          {activeModule !== "cash" && activeModule !== "asset" && (
                            <button
                              onClick={() =>
                                setHistoryModal({
                                  isOpen: true,
                                  cardId: item.card_id,
                                  paymentId: item.payment_id,
                                  customerName: item.customer_name,
                                  installmentTag: installmentTag,
                                })
                              }
                              title="এই কিস্তির এডিট হিস্ট্রি টাইমলাইন দেখুন"
                              className="flex items-center gap-1 rounded-lg bg-indigo-500/10 border border-indigo-500/25 px-2 py-1 text-[11px] font-semibold text-indigo-300 hover:bg-indigo-500/20 hover:border-indigo-400 transition cursor-pointer"
                            >
                              <FiClock className="h-3 w-3" />
                              <span>হিস্ট্রি</span>
                            </button>
                          )}

                          {/* Direct Link */}
                          <button
                            onClick={() => {
                              if (activeModule === "asset") {
                                navigate("/other-sources/assets");
                              } else if (activeModule === "cash") {
                                navigate(item.type === "in" ? "/cash/cash-in" : "/cash/cash-out");
                              } else if (activeModule === "daily") {
                                navigate(`/DailyInstallments/daily_installments_users/${item.card_id}`);
                              } else if (activeModule === "investment") {
                                navigate(`/investors/investor_cards/${item.card_id}`);
                              } else {
                                navigate(`/customer/update_installment_chart?cardId=${item.card_id}`);
                              }
                            }}
                            title="বিস্তারিত পেজে যান"
                            className="flex items-center gap-1 rounded-lg bg-cyan-500/10 border border-cyan-500/25 px-2.5 py-1 text-[11px] font-semibold text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-400 transition cursor-pointer"
                          >
                            <span>
                              {activeModule === "asset"
                                ? "অ্যাসেট"
                                : activeModule === "cash"
                                ? item.type === "in"
                                  ? "ক্যাশ ইন"
                                  : "ক্যাশ আউট"
                                : activeModule === "daily"
                                ? "ডিটেইল"
                                : activeModule === "investment"
                                ? "ইনভেস্টর"
                                : "চার্ট"}
                            </span>
                            <FiExternalLink className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Full History Timeline Modal */}
      <InstallmentHistoryModal
        isOpen={historyModal.isOpen}
        onClose={() => setHistoryModal((prev) => ({ ...prev, isOpen: false }))}
        cardId={historyModal.cardId}
        paymentId={historyModal.paymentId}
        customerName={historyModal.customerName}
        installmentTag={historyModal.installmentTag}
      />

      {/* Luxury Action & Feedback Modal */}
      <LuxuryActionModal {...feedbackModal} />

      {/* Luxury Floating Toast Notification */}
      <LuxuryToast toast={luxuryToast} onClose={() => setLuxuryToast(null)} />
    </div>
  );
}
