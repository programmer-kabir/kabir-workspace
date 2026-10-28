import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaEnvelope,
  FaCheckCircle,
  FaTimesCircle,
  FaSearch,
  FaCalendarAlt,
  FaRedoAlt,
  FaEye,
  FaExternalLinkAlt,
  FaPaperPlane,
  FaFilter,
  FaBoxOpen,
  FaCoins,
  FaBuilding,
  FaMotorcycle,
  FaTimes,
  FaShieldAlt,
  FaCrown,
  FaUserFriends,
} from "react-icons/fa";
import { RiMailSendLine, RiMailCheckLine } from "react-icons/ri";
import { motion, AnimatePresence } from "framer-motion";
import Loader from "../../../components/Loader/Loader";
import BackButton from "../../../components/BackButton/BackButton";
import LuxuryToast from "../../../components/Modal/LuxuryToast";

const API = import.meta.env.VITE_LOCALHOST_KEY;

const eventTypeConfig = {
  asset_purchase: {
    label: "অ্যাসেট ক্রয়",
    color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    icon: FaBoxOpen,
  },
  share_investment: {
    label: "শেয়ার ইনভেস্ট",
    color: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
    icon: FaBuilding,
  },
  rental_agreement: {
    label: "ভাড়া চুক্তি",
    color: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    icon: FaMotorcycle,
  },
  rental_collection: {
    label: "ভাড়া আদায়",
    color: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
    icon: FaCoins,
  },
  share_dividend: {
    label: "শেয়ার লভ্যাংশ",
    color: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    icon: FaCoins,
  },
  asset_sale: {
    label: "অ্যাসেট বিক্রয়",
    color: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    icon: FaBoxOpen,
  },
  share_exit: {
    label: "শেয়ার এক্সিট",
    color: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    icon: FaBuilding,
  },
  agreement_terminated: {
    label: "চুক্তি সমাপ্ত",
    color: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    icon: FaTimesCircle,
  },
  withdraw_decision_paid: {
    label: "উইথড্র পেইড",
    color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    icon: FaCheckCircle,
  },
  withdraw_decision_rejected: {
    label: "উইথড্র রিজেক্ট",
    color: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    icon: FaTimesCircle,
  },
};

export default function EmailLogs() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [luxuryToast, setLuxuryToast] = useState(null);

  // Audience Filter: 'all', 'admin', 'users'
  const [audienceFilter, setAudienceFilter] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Detail / Preview Modal
  const [selectedMail, setSelectedMail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [resending, setResending] = useState(false);

  // Fetch Logs from dedicated /email_logs/get_email_logs.php
  const fetchLogs = async (targetPage = page) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: targetPage,
        limit: 15,
      });

      if (audienceFilter !== "all") params.append("audience", audienceFilter);
      if (selectedCategory !== "all") params.append("category", selectedCategory);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (search.trim()) params.append("search", search.trim());
      if (startDate) params.append("start_date", startDate);
      if (endDate) params.append("end_date", endDate);

      const res = await fetch(`${API}/email_logs/get_email_logs.php?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setLogs(data.data || []);
        setSummary(data.summary || null);
        setPage(data.pagination?.page || 1);
        setTotalPages(data.pagination?.total_pages || 1);
        setTotalRecords(data.pagination?.total_records || 0);
      } else {
        setLuxuryToast({
          title: "লোড ব্যর্থ ❌",
          message: data.message || "ইমেইল লগ লোড করা যায়নি।",
          type: "error",
        });
      }
    } catch (err) {
      setLuxuryToast({
        title: "সার্ভার এরর ❌",
        message: "সার্ভারে সংযোগ স্থাপন করা যায়নি।",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, [audienceFilter, selectedCategory, statusFilter, startDate, endDate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLogs(1);
  };

  const handleClearFilters = () => {
    setAudienceFilter("all");
    setSelectedCategory("all");
    setStatusFilter("all");
    setSearch("");
    setStartDate("");
    setEndDate("");
    fetchLogs(1);
  };

  // Open Email Detail
  const handleOpenDetail = async (logItem) => {
    try {
      setLoadingDetail(true);
      const res = await fetch(`${API}/email_logs/get_email_detail.php?id=${logItem.id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedMail(data.data);
      } else {
        setLuxuryToast({
          title: "লোড ব্যর্থ ❌",
          message: data.message || "ইমেইল প্রিভিউ পাওয়া যায়নি।",
          type: "error",
        });
      }
    } catch (err) {
      setLuxuryToast({
        title: "সার্ভার এরর ❌",
        message: "সার্ভারে সমস্যা হয়েছে।",
        type: "error",
      });
    } finally {
      setLoadingDetail(false);
    }
  };

  // Resend Email
  const handleResend = async (id) => {
    if (!id) return;
    try {
      setResending(true);
      const res = await fetch(`${API}/email_logs/resend_email.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        setLuxuryToast({
          title: "ইমেইল পাঠানো হয়েছে 🎉",
          message: data.message || "ইমেইলটি পুনরায় সফলভাবে জিমেইলে সেন্ড করা হয়েছে।",
          tag: "ইমেইল সেন্ড",
          type: "success",
        });
        fetchLogs(page);
      } else {
        setLuxuryToast({
          title: "পুনরায় পাঠানো ব্যর্থ ❌",
          message: data.message || "ইমেইল পাঠানো যায়নি।",
          type: "error",
        });
      }
    } catch (err) {
      setLuxuryToast({
        title: "সার্ভার এরর ❌",
        message: "সার্ভারে সমস্যা হয়েছে।",
        type: "error",
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070c18] text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <BackButton />
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/25">
                <RiMailSendLine size={20} />
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                System Email Hub & Logs
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              অ্যাডমিন নোটিফিকেশন এবং গ্রাহক/ইনভেস্টরদের কাছে পাঠানো সমস্ত স্বয়ংক্রিয় মেইল অডিট
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => navigate("/other-sources/assets")}
            className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-semibold text-slate-300 transition-all flex items-center justify-center gap-2"
          >
            <FaBoxOpen size={14} className="text-indigo-400" />
            <span>অ্যাসেট ম্যানেজমেন্ট</span>
          </button>
          <button
            onClick={() => fetchLogs(page)}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-xs font-semibold text-indigo-300 transition-all flex items-center gap-2"
            title="রিফ্রেশ করুন"
          >
            <FaRedoAlt size={12} className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">রিফ্রেশ</span>
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-[#0b1329]/80 border border-white/[0.08] rounded-2xl p-4 backdrop-blur-md shadow-xl relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-indigo-500/10 rounded-full blur-xl group-hover:bg-indigo-500/20 transition-all" />
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
              <FaEnvelope size={12} className="text-indigo-400" /> মোট প্রেরিত ইমেইল
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-1.5 font-mono">
              {Number(summary.total).toLocaleString()} <span className="text-xs text-slate-400 font-sans">টি</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">সিস্টেম থেকে ডেলিভারি লগ</p>
          </div>

          <div
            onClick={() => setAudienceFilter("admin")}
            className="bg-[#0b1329]/80 border border-purple-500/30 hover:border-purple-500/60 rounded-2xl p-4 backdrop-blur-md shadow-xl relative overflow-hidden group cursor-pointer transition-all"
          >
            <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-purple-500/10 rounded-full blur-xl group-hover:bg-purple-500/20 transition-all" />
            <span className="text-[11px] font-medium text-purple-400 uppercase tracking-wider block flex items-center gap-1.5">
              <FaCrown size={12} /> অ্যাডমিন নোটিফিকেশন (Admin)
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-purple-300 mt-1.5 font-mono">
              {Number(summary.admin_mails).toLocaleString()} <span className="text-xs text-slate-400 font-sans">টি</span>
            </h3>
            <p className="text-[11px] text-purple-400/80 mt-1">প্রাপক: supplylinkb@gmail.com</p>
          </div>

          <div
            onClick={() => setAudienceFilter("users")}
            className="bg-[#0b1329]/80 border border-cyan-500/30 hover:border-cyan-500/60 rounded-2xl p-4 backdrop-blur-md shadow-xl relative overflow-hidden group cursor-pointer transition-all"
          >
            <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-cyan-500/10 rounded-full blur-xl group-hover:bg-cyan-500/20 transition-all" />
            <span className="text-[11px] font-medium text-cyan-400 uppercase tracking-wider block flex items-center gap-1.5">
              <FaUserFriends size={12} /> গ্রাহক ও ইনভেস্টর মেইল
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-cyan-400 mt-1.5 font-mono">
              {Number(summary.user_mails).toLocaleString()} <span className="text-xs text-slate-400 font-sans">টি</span>
            </h3>
            <p className="text-[11px] text-cyan-400/80 mt-1">উইথড্র ও ইনভেস্টর কনফার্মেশন</p>
          </div>

          <div className="bg-[#0b1329]/80 border border-white/[0.08] rounded-2xl p-4 backdrop-blur-md shadow-xl relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-rose-500/10 rounded-full blur-xl group-hover:bg-rose-500/20 transition-all" />
            <span className="text-[11px] font-medium text-rose-400 uppercase tracking-wider block flex items-center gap-1.5">
              <FaTimesCircle size={12} /> ডেলিভারি সমস্যা (Failed)
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-rose-400 mt-1.5 font-mono">
              {Number(summary.failed).toLocaleString()} <span className="text-xs text-slate-400 font-sans">টি</span>
            </h3>
            <p className="text-[11px] text-rose-500/80 mt-1">সার্ভার বা কানেকশন ত্রুটি</p>
          </div>
        </div>
      )}

      {/* Main Tabs (Audience Selector: Admin vs Users) */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-[#0b1329]/90 border border-white/[0.08] rounded-2xl backdrop-blur-md">
        <button
          onClick={() => setAudienceFilter("all")}
          className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            audienceFilter === "all"
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
              : "text-slate-400 hover:text-white hover:bg-white/[0.05]"
          }`}
        >
          <FaEnvelope size={12} />
          <span>সকল ইমেইল ({summary?.total || 0})</span>
        </button>

        <button
          onClick={() => setAudienceFilter("admin")}
          className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            audienceFilter === "admin"
              ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
              : "text-slate-400 hover:text-white hover:bg-white/[0.05]"
          }`}
        >
          <FaCrown size={12} className={audienceFilter === "admin" ? "text-amber-300" : "text-purple-400"} />
          <span>👑 অ্যাডমিন নোটিফিকেশন ({summary?.admin_mails || 0})</span>
        </button>

        <button
          onClick={() => setAudienceFilter("users")}
          className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            audienceFilter === "users"
              ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/30"
              : "text-slate-400 hover:text-white hover:bg-white/[0.05]"
          }`}
        >
          <FaUserFriends size={12} />
          <span>👥 গ্রাহক ও ইনভেস্টরদের মেইল ({summary?.user_mails || 0})</span>
        </button>
      </div>

      {/* Sub-Filters & Search Bar */}
      <div className="bg-[#0b1329]/90 border border-white/[0.08] rounded-2xl p-4 space-y-4 backdrop-blur-md shadow-xl">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: "all", label: "সব বিষয়" },
              { id: "others_profit", label: "📦 অ্যাসেট ও শেয়ার" },
              { id: "withdraw", label: "💳 উইথড্র" },
              { id: "investor", label: "📈 ইনভেস্টর" },
              { id: "installment", label: "🪙 কিস্তি" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedCategory === tab.id
                    ? "bg-white/15 text-white border border-white/20"
                    : "bg-white/[0.03] text-slate-400 hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 bg-black/30 p-1 rounded-xl border border-white/[0.06] shrink-0">
            {[
              { id: "all", label: "সকল স্ট্যাটাস" },
              { id: "sent", label: "ডেলিভার্ড (Sent)" },
              { id: "failed", label: "ব্যর্থ (Failed)" },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                  statusFilter === st.id
                    ? "bg-white/15 text-white font-semibold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search & Date Filter Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-white/[0.06]">
          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />
            <input
              type="text"
              placeholder="সাবজেক্ট বা প্রাপক লিখে খুঁজুন..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-black/40 border border-white/[0.08] rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/60"
            />
          </form>

          {/* Start Date */}
          <div className="relative">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-black/40 border border-white/[0.08] rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500/60"
              title="শুরুর তারিখ"
            />
          </div>

          {/* End Date */}
          <div className="relative">
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-black/40 border border-white/[0.08] rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500/60"
              title="শেষ তারিখ"
            />
          </div>

          {/* Filter / Reset Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchLogs(1)}
              className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md flex items-center justify-center gap-1.5"
            >
              <FaFilter size={10} />
              <span>ফিল্টার প্রয়োগ</span>
            </button>
            {(search || startDate || endDate || selectedCategory !== "all" || statusFilter !== "all" || audienceFilter !== "all") && (
              <button
                onClick={handleClearFilters}
                className="px-3 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-semibold transition-all"
                title="ফিল্টার ক্লিয়ার"
              >
                রিসেট
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Email Logs Table */}
      <div className="bg-[#0b1329]/90 border border-white/[0.08] rounded-2xl overflow-hidden backdrop-blur-md shadow-2xl">
        <div className="px-5 py-4 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RiMailCheckLine className="text-indigo-400" size={18} />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              {audienceFilter === "admin"
                ? "👑 অ্যাডমিন নোটিফিকেশন লগ"
                : audienceFilter === "users"
                ? "👥 গ্রাহক/ইনভেস্টর মেইল লগ"
                : "সমস্ত প্রেরিত মেইল তালিকা"} ({totalRecords})
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            পৃষ্ঠা {page} / {totalPages}
          </span>
        </div>

        {loading ? (
          <div className="py-20 flex items-center justify-center">
            <Loader />
          </div>
        ) : logs.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-slate-500">
              <FaEnvelope size={24} />
            </div>
            <p className="text-slate-300 font-semibold text-sm">কোনো ইমেইল রেকর্ড পাওয়া যায়নি</p>
            <p className="text-slate-500 text-xs">
              নতুন কোনো নোটিফিকেশন পাঠানো হলে এখানে স্বয়ংক্রিয়ভাবে অডিট লগ হিসেবে যুক্ত হবে।
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-white/[0.03] text-slate-400 border-b border-white/[0.06] font-semibold">
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4">তারিখ ও সময়</th>
                  <th className="py-3 px-4">ইভেন্ট ও বিষয়</th>
                  <th className="py-3 px-4">প্রাপক (Recipient Type)</th>
                  <th className="py-3 px-4">ইমেইল সাবজেক্ট (Subject)</th>
                  <th className="py-3 px-4 text-center">ডেলিভারি</th>
                  <th className="py-3 px-4 text-center">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {logs.map((log) => {
                  const evConf = eventTypeConfig[log.event_type] || {
                    label: log.event_type || "নোটিফিকেশন",
                    color: "bg-slate-500/15 text-slate-300 border-slate-500/30",
                    icon: FaEnvelope,
                  };
                  const EvIcon = evConf.icon;
                  const isSent = log.status === "sent";
                  const isAdminRecipient = log.recipient === "supplylinkb@gmail.com";

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-white/[0.03] transition-colors group cursor-pointer"
                      onClick={() => handleOpenDetail(log)}
                    >
                      {/* ID */}
                      <td className="py-3.5 px-4 text-center font-mono text-slate-500">
                        {log.id}
                      </td>

                      {/* Date & Time */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-medium text-slate-200">
                          {new Date(log.sent_at).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {new Date(log.sent_at).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>

                      {/* Event Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${evConf.color}`}
                        >
                          <EvIcon size={11} />
                          <span>{evConf.label}</span>
                        </span>
                      </td>

                      {/* Recipient */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isAdminRecipient ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                              <FaCrown size={9} className="text-amber-300" />
                              <span>অ্যাডমিন অ্যালার্ট</span>
                            </span>
                            <div className="font-mono text-slate-300 text-[11px]">
                              {log.recipient}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                              <FaUserFriends size={9} />
                              <span>ইনভেস্টর / গ্রাহক</span>
                            </span>
                            <div className="font-mono text-slate-300 text-[11px]">
                              {log.recipient}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Subject */}
                      <td className="py-3.5 px-4">
                        <p className="font-medium text-slate-100 max-w-md line-clamp-1 group-hover:text-indigo-300 transition-colors">
                          {log.subject}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {isSent ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span>Delivered</span>
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30"
                            title={log.error_message}
                          >
                            <FaTimesCircle size={10} />
                            <span>Failed</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenDetail(log)}
                            className="p-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white transition-all border border-indigo-500/30"
                            title="সম্পূর্ণ ইমেইল পড়ুন"
                          >
                            <FaEye size={12} />
                          </button>
                          <button
                            onClick={() => handleResend(log.id)}
                            disabled={resending}
                            className="p-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white transition-all border border-emerald-500/30"
                            title="পুনরায় পাঠান (Resend)"
                          >
                            <FaPaperPlane size={11} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-white/[0.08] flex items-center justify-between">
            <p className="text-xs text-slate-400">
              সর্বমোট {totalRecords} টির মধ্যে পৃষ্ঠা {page}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchLogs(page - 1)}
                disabled={page <= 1 || loading}
                className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs font-semibold text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-all"
              >
                পূর্ববর্তী
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pNum = i + 1;
                  if (totalPages > 5 && page > 3) {
                    pNum = page - 2 + i;
                    if (pNum > totalPages) pNum = totalPages - (4 - i);
                  }
                  return (
                    <button
                      key={pNum}
                      onClick={() => fetchLogs(pNum)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                        page === pNum
                          ? "bg-indigo-600 text-white"
                          : "bg-white/[0.04] text-slate-400 hover:text-white"
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => fetchLogs(page + 1)}
                disabled={page >= totalPages || loading}
                className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs font-semibold text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-all"
              >
                পরবর্তী
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Live Email Preview Modal (Iframe Sandbox) */}
      <AnimatePresence>
        {selectedMail && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#0b1329] border border-white/20 rounded-2xl w-full max-w-4xl h-[92vh] flex flex-col overflow-hidden shadow-2xl relative"
            >
              {/* Modal Header */}
              <div className="px-5 py-4 border-b border-white/10 bg-[#070c18] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                    <FaEnvelope size={18} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-bold text-white truncate">
                      {selectedMail.subject}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span>প্রেরক: <strong className="text-slate-300">{selectedMail.sender}</strong></span>
                      <span>•</span>
                      <span>
                        প্রাপক:{" "}
                        <strong
                          className={
                            selectedMail.recipient === "supplylinkb@gmail.com"
                              ? "text-purple-400 font-mono"
                              : "text-cyan-400 font-mono"
                          }
                        >
                          {selectedMail.recipient === "supplylinkb@gmail.com"
                            ? "👑 Admin (supplylinkb@gmail.com)"
                            : selectedMail.recipient}
                        </strong>
                      </span>
                      <span>•</span>
                      <span>সময়: {new Date(selectedMail.sent_at).toLocaleString("en-GB")}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <button
                    onClick={() => handleResend(selectedMail.id)}
                    disabled={resending}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md"
                  >
                    <FaPaperPlane size={11} />
                    <span className="hidden sm:inline">পুনরায় পাঠান</span>
                  </button>
                  <button
                    onClick={() => setSelectedMail(null)}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all"
                  >
                    <FaTimes size={16} />
                  </button>
                </div>
              </div>

              {/* Status Banner */}
              <div className="px-5 py-2 bg-white/[0.02] border-b border-white/[0.06] flex items-center justify-between text-xs shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">ডেলিভারি অবস্থা:</span>
                  {selectedMail.status === "sent" ? (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <FaCheckCircle size={12} /> সফলভাবে প্রেরিত (Delivered to Gmail)
                    </span>
                  ) : (
                    <span className="text-rose-400 font-semibold flex items-center gap-1">
                      <FaTimesCircle size={12} /> ডেলিভারি ব্যর্থ: {selectedMail.error_message || "Unknown error"}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-500 font-mono">
                  Log ID: #{selectedMail.id}
                </span>
              </div>

              {/* Email Content rendered inside Isolated Iframe */}
              <div className="flex-1 bg-white p-1 overflow-hidden relative">
                <iframe
                  title="Email Preview"
                  srcDoc={selectedMail.html_body}
                  className="w-full h-full border-0 rounded-lg"
                  sandbox="allow-same-origin"
                />
              </div>

              {/* Modal Footer */}
              <div className="px-5 py-3 border-t border-white/10 bg-[#070c18] flex items-center justify-between text-xs text-slate-400 shrink-0">
                <span className="flex items-center gap-1 text-slate-400">
                  <FaShieldAlt size={12} className="text-indigo-400" />
                  SupplyLink Transactional Audit Trail
                </span>
                <button
                  onClick={() => setSelectedMail(null)}
                  className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium transition-all"
                >
                  বন্ধ করুন (Close)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Luxury Toast Notification */}
      <LuxuryToast toast={luxuryToast} onClose={() => setLuxuryToast(null)} duration={4500} />
    </div>
  );
}
