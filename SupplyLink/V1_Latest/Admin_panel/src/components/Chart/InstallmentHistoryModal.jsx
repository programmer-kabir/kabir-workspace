import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FiX, 
  FiClock, 
  FiCheckCircle, 
  FiAlertCircle, 
  FiXCircle, 
  FiCalendar, 
  FiArrowRight, 
  FiRefreshCw, 
  FiShield, 
  FiCheck, 
  FiCheckSquare,
  FiUser
} from "react-icons/fi";
import { FaMoneyBillWave, FaHistory, FaReceipt } from "react-icons/fa";
import axios from "axios";

// Helper: Resolve image URL safely with fallback
const getAvatarUrl = (photo) => {
  if (!photo) return null;
  if (photo.startsWith("http://") || photo.startsWith("https://")) return photo;
  const clean = photo.replace(/^\/?(uploads\/)?/, "");
  const base = import.meta.env.VITE_IMG_KEY || "http://localhost/supplylink/uploads";
  return `${base}/${clean}`;
};

// Component: Modern User Avatar with image fallback to gradient initial
function UserAvatar({ photo, name, gradient = "from-cyan-500 to-blue-600" }) {
  const [imgError, setImgError] = useState(false);
  const photoUrl = getAvatarUrl(photo);
  const initial = (name || "U")[0]?.toUpperCase();

  if (photoUrl && !imgError) {
    return (
      <img
        src={photoUrl}
        alt={name || "User"}
        onError={() => setImgError(true)}
        className="h-9 w-9 rounded-xl object-cover border border-white/10 shadow-sm shrink-0 ring-1 ring-white/10"
      />
    );
  }

  return (
    <div
      className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr ${gradient} text-white font-bold text-xs shadow-md shrink-0 border border-white/15`}
    >
      {initial}
    </div>
  );
}

export default function InstallmentHistoryModal({ 
  isOpen, 
  onClose, 
  payment, 
  card, 
  cardId, 
  paymentId, 
  customerName, 
  installmentTag 
}) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const effectiveCardId = cardId || card?.id || payment?.card_id;
  const effectivePaymentId = paymentId || payment?.id;

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen, effectivePaymentId, effectiveCardId]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      let url = "";
      if (effectivePaymentId) {
        url = `${import.meta.env.VITE_LOCALHOST_KEY}/customers/get_installment_edits.php?payment_id=${effectivePaymentId}`;
      } else if (effectiveCardId) {
        url = `${import.meta.env.VITE_LOCALHOST_KEY}/customers/get_installment_edits.php?card_id=${effectiveCardId}`;
      } else {
        return;
      }

      const res = await axios.get(url);
      if (res.data?.success && Array.isArray(res.data?.data)) {
        setHistory(res.data.data);
      } else {
        setHistory([]);
      }
    } catch (err) {
      console.error("Failed to load payment history:", err);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Derive contextual display metadata from props or latest history item
  const latestItem = history[0] || {};
  const displayCustomerName = 
    customerName || card?.user_name || payment?.customer_name || latestItem.customer_name;
  const displayTag = 
    installmentTag || payment?.tag || latestItem.installment_tag || 
    (latestItem.installment_no ? `${latestItem.installment_no}তম কিস্তি` : "কিস্তি");
  const displayProductName = card?.product_name || latestItem.product_name;
  const displayCardId = effectiveCardId || latestItem.card_id;
  const totalAmount = latestItem.amount || latestItem.due_amount || payment?.amount || 0;

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
        second: "2-digit",
        hour12: true,
      });
    } catch (e) {
      return dateStr;
    }
  };

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        {/* Deep Backdrop with ultra-smooth blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal Window Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          className="relative my-auto w-full max-w-2xl sm:max-w-3xl overflow-hidden rounded-[26px] border border-cyan-500/20 bg-gradient-to-b from-[#0d162b] via-[#091021] to-[#060b17] shadow-[0_0_50px_rgba(6,182,212,0.15),0_25px_50px_-12px_rgba(0,0,0,0.85)] z-10 flex flex-col max-h-[90vh] ring-1 ring-white/10"
        >
          {/* Subtle Ambient Glowing Auras */}
          <div className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 rounded-full bg-cyan-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-indigo-500/15 blur-3xl" />

          {/* Top Header Bar */}
          <div className="relative border-b border-white/[0.08] bg-gradient-to-r from-[#0d1b33] via-[#0f2142] to-[#0a1529] px-6 py-4.5 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-lg shadow-cyan-500/30 ring-1 ring-white/20">
                <FaHistory className="h-5 w-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                    পেমেন্ট এডিট ও অডিট হিস্ট্রি
                  </h3>
                  {displayCardId && (
                    <span className="rounded-full bg-cyan-500/15 border border-cyan-500/35 px-2.5 py-0.5 text-xs font-mono font-bold text-cyan-300 shadow-sm">
                      কার্ড #{displayCardId}
                    </span>
                  )}
                  {displayCustomerName && (
                    <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-white/[0.06] border border-white/10 px-2.5 py-0.5 text-xs font-medium text-slate-300">
                      <FiUser className="h-3 w-3 text-cyan-400" />
                      {displayCustomerName}
                    </span>
                  )}
                  {displayTag && (
                    <span className="rounded-full bg-indigo-500/20 border border-indigo-500/35 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-300">
                      {displayTag}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  এই কিস্তির পরিবর্তন, অনুমোদন ও সম্পূর্ণ লাইফসাইকেল অডিট টাইমলাইন
                </p>
              </div>
            </div>

            {/* Action Tools */}
            <div className="flex items-center gap-2">
              <button
                onClick={loadHistory}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/10 hover:border-cyan-500/30 transition cursor-pointer"
                title="রিফ্রেশ করুন"
              >
                <FiRefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-cyan-400" : ""}`} />
              </button>
              <button
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-400 hover:text-white hover:bg-rose-500/20 hover:border-rose-500/30 hover:text-rose-300 transition cursor-pointer"
                title="বন্ধ করুন (Esc)"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-5">
            {/* Quick Summary Dashboard Ribbon (when history exists) */}
            {!loading && history.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-white/[0.03] via-white/[0.05] to-white/[0.03] border border-white/[0.08] backdrop-blur-md shadow-inner">
                {/* Metric 1: Amount */}
                <div className="flex items-center gap-2.5 px-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shrink-0">
                    <FaMoneyBillWave className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] text-slate-400 font-medium">কিস্তির পরিমাণ</div>
                    <div className="text-xs sm:text-sm font-bold font-mono text-emerald-300 truncate">
                      ৳{Number(totalAmount).toLocaleString("en-IN")}
                    </div>
                  </div>
                </div>

                {/* Metric 2: Installment Tag */}
                <div className="flex items-center gap-2.5 px-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 shrink-0">
                    <FaReceipt className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] text-slate-400 font-medium">কিস্তির বিবরণ</div>
                    <div className="text-xs font-bold text-white truncate">
                      {displayTag || "কিস্তি"}
                    </div>
                  </div>
                </div>

                {/* Metric 3: Current Status */}
                <div className="flex items-center gap-2.5 px-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 shrink-0">
                    <FiShield className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] text-slate-400 font-medium">বর্তমান স্ট্যাটাস</div>
                    <div className="text-xs font-bold flex items-center gap-1.5 truncate">
                      <span className={`h-2 w-2 rounded-full ${
                        latestItem.new_status === "Paid" 
                          ? "bg-emerald-400 shadow-[0_0_8px_#34d399]" 
                          : "bg-amber-400 shadow-[0_0_8px_#fbbf24]"
                      }`} />
                      <span className={latestItem.new_status === "Paid" ? "text-emerald-300" : "text-amber-300"}>
                        {latestItem.new_status === "Paid" ? "পেইড (পরিশোধিত)" : "আনপেইড (বকেয়া)"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Metric 4: Total Logged Events */}
                <div className="flex items-center gap-2.5 px-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 shrink-0">
                    <FaHistory className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] text-slate-400 font-medium">লাইফসাইকেল ইভেন্ট</div>
                    <div className="text-xs font-bold text-purple-200">
                      মোট {history.length} টি রেকর্ড
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Timeline View */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                <FiRefreshCw className="h-8 w-8 animate-spin text-cyan-400" />
                <span className="text-xs font-medium">হিস্ট্রি অডিট রেকর্ড লোড হচ্ছে...</span>
              </div>
            ) : history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.03] border border-white/10 text-slate-500 mb-3 shadow-inner">
                  <FiClock className="h-8 w-8 text-slate-500" />
                </div>
                <h4 className="text-sm font-semibold text-slate-300">
                  কোনো পূর্ববর্তী এডিট রেকর্ড নেই
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  কার্ডটি তৈরি হওয়ার পর থেকে এই কিস্তিতে এখনও কোনো পরিবর্তন বা এডিট করা হয়নি।
                </p>
              </div>
            ) : (
              <div className="relative pl-7 sm:pl-9 space-y-6">
                {/* Vertical Timeline Track Spine */}
                <div className="absolute left-[13px] sm:[17px] top-4 bottom-4 w-[2.5px] bg-gradient-to-b from-cyan-400 via-indigo-500 to-slate-800 rounded-full" />

                {history.map((item, idx) => {
                  const isRequestUnpaid = item.action_type === "request_unpaid" || item.action_type === "unpaid_request";
                  const isPaid = item.action_type === "paid";
                  const isPending = item.status === "pending";
                  const isApproved = item.status === "approved";
                  const isRejected = item.status === "rejected";

                  // Theme configurations
                  let nodeBorder = "border-cyan-400 bg-cyan-500 text-white shadow-[0_0_14px_rgba(6,182,212,0.5)]";
                  let cardBorder = "border-cyan-500/30 hover:border-cyan-400/50";
                  let cardBg = "bg-gradient-to-br from-[#101b33]/90 via-[#0c1527]/90 to-[#080d19]/95";
                  let badge = "সম্পন্ন";
                  let badgeStyle = "bg-cyan-500/15 border-cyan-500/30 text-cyan-300";
                  let title = "পেমেন্ট কার্যক্রম সম্পন্ন";
                  let subtitleEng = "Payment Action Processed";
                  let Icon = FiCheckCircle;
                  let iconBg = "bg-cyan-500/20 text-cyan-300 border-cyan-500/40";
                  let actorLabel = "কর্মী / ইউজার";

                  if (isPaid) {
                    nodeBorder = "border-emerald-400 bg-emerald-500 text-white shadow-[0_0_14px_rgba(16,185,129,0.5)]";
                    cardBorder = "border-emerald-500/30 hover:border-emerald-400/50";
                    cardBg = "bg-gradient-to-br from-[#0c2420]/90 via-[#0a1b1a]/90 to-[#071112]/95";
                    badge = "✓ পেইড সম্পন্ন";
                    badgeStyle = "bg-emerald-500/15 border-emerald-500/35 text-emerald-300";
                    title = "কিস্তি আদায় ও ক্যাশ-ইন সম্পন্ন";
                    subtitleEng = "Installment Payment Collected & Confirmed";
                    Icon = FaMoneyBillWave;
                    iconBg = "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
                    actorLabel = "আদায়কারী কর্মী";
                  } else if (isRequestUnpaid) {
                    actorLabel = "অনুরোধকারী কর্মী";
                    if (isPending) {
                      nodeBorder = "border-amber-400 bg-amber-500 text-white shadow-[0_0_14px_rgba(245,158,11,0.5)] animate-pulse";
                      cardBorder = "border-amber-500/35 hover:border-amber-400/55";
                      cardBg = "bg-gradient-to-br from-[#261d0f]/90 via-[#1a140b]/90 to-[#0f0c07]/95";
                      badge = "⏳ অনুমোদন অপেক্ষমাণ";
                      badgeStyle = "bg-amber-500/15 border-amber-500/35 text-amber-300";
                      title = "আনপেইড করার অনুরোধ";
                      subtitleEng = "Unpaid Status Request (Awaiting Admin Review)";
                      Icon = FiClock;
                      iconBg = "bg-amber-500/20 text-amber-300 border-amber-500/40";
                    } else if (isApproved) {
                      nodeBorder = "border-cyan-400 bg-cyan-500 text-white shadow-[0_0_14px_rgba(6,182,212,0.5)]";
                      cardBorder = "border-cyan-500/35 hover:border-cyan-400/60";
                      cardBg = "bg-gradient-to-br from-[#0c203b]/90 via-[#0a182c]/90 to-[#07101e]/95";
                      badge = "✓ অনুমোদিত সম্পন্ন";
                      badgeStyle = "bg-cyan-500/15 border-cyan-500/35 text-cyan-300";
                      title = "আনপেইড অনুরোধ অনুমোদন সম্পন্ন";
                      subtitleEng = "Unpaid Request Approved by Authority";
                      Icon = FiCheck;
                      iconBg = "bg-cyan-500/20 text-cyan-300 border-cyan-500/40";
                    } else if (isRejected) {
                      nodeBorder = "border-rose-400 bg-rose-500 text-white shadow-[0_0_14px_rgba(244,63,94,0.5)]";
                      cardBorder = "border-rose-500/35 hover:border-rose-400/60";
                      cardBg = "bg-gradient-to-br from-[#2a1017]/90 via-[#1e0c11]/90 to-[#12070a]/95";
                      badge = "✕ অনুরোধ বাতিল";
                      badgeStyle = "bg-rose-500/15 border-rose-500/35 text-rose-300";
                      title = "আনপেইড অনুরোধ বাতিল";
                      subtitleEng = "Unpaid Request Rejected by Authority";
                      Icon = FiX;
                      iconBg = "bg-rose-500/20 text-rose-300 border-rose-500/40";
                    }
                  }

                  const itemTag =
                    item.installment_tag ||
                    (item.installment_no === 0
                      ? "ডাউন পেমেন্ট"
                      : `${item.installment_no}তম কিস্তি`);

                  const eventOrderNumber = history.length - idx;

                  return (
                    <div key={item.id || idx} className="relative group">
                      {/* Timeline Node Badge with Icon */}
                      <div
                        className={`absolute -left-[35px] sm:-left-[43px] top-4.5 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border-2 ring-4 ring-[#080d19] z-10 transition-transform group-hover:scale-110 ${nodeBorder}`}
                      >
                        <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </div>

                      {/* Main Event Card */}
                      <div
                        className={`rounded-2xl border ${cardBg} ${cardBorder} p-4.5 sm:p-5.5 transition-all duration-300 shadow-xl backdrop-blur-md hover:shadow-cyan-950/40 relative overflow-hidden`}
                      >
                        {/* Event Top Bar: Order Pill, Tag, Title & Status */}
                        <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3.5">
                          <div className="flex items-center gap-3">
                            <div className={`flex h-9 w-9 items-center justify-center rounded-xl border shadow-sm ${iconBg}`}>
                              <Icon className="h-4.5 w-4.5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="rounded-md bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.5 text-[10px] font-mono font-bold text-indigo-300 uppercase">
                                  {itemTag}
                                </span>
                                <span className="rounded-md bg-white/[0.06] border border-white/10 px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
                                  ইভেন্ট #{eventOrderNumber}
                                </span>
                                <h4 className="text-xs sm:text-sm font-bold text-white tracking-wide">
                                  {title}
                                </h4>
                              </div>
                              <div className="text-[11px] text-slate-400 font-sans mt-0.5">
                                {subtitleEng}
                              </div>
                            </div>
                          </div>

                          <span className={`rounded-full border px-3 py-1 text-xs font-bold shadow-sm ${badgeStyle}`}>
                            {badge}
                          </span>
                        </div>

                        {/* Transition Bar & Financial Amount */}
                        <div className="rounded-xl bg-[#070d1a]/85 border border-white/[0.07] p-3 sm:px-4 sm:py-3 mb-3 shadow-inner flex flex-wrap items-center justify-between gap-3">
                          {/* Left: Status Flow */}
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-[11px] text-slate-400 font-medium">স্ট্যাটাস রূপান্তর:</span>
                            <span className="rounded-lg bg-white/[0.06] border border-white/10 px-2.5 py-1 font-mono font-bold text-slate-300">
                              {item.old_status || "Unpaid"}
                            </span>
                            <FiArrowRight className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
                            <span
                              className={`rounded-lg px-2.5 py-1 font-mono font-bold shadow-sm ${
                                item.new_status === "Paid"
                                  ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300"
                                  : "bg-amber-500/20 border border-amber-500/40 text-amber-300"
                              }`}
                            >
                              {item.new_status || "Unpaid"}
                            </span>
                          </div>

                          {/* Right: Amount Chip */}
                          <div className="flex items-center gap-2 ml-auto">
                            <span className="text-[11px] text-slate-400 font-medium">পরিমাণ:</span>
                            <div className="flex items-center gap-1 rounded-xl bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 shadow-sm">
                              <span className="text-xs font-bold text-cyan-400">৳</span>
                              <span className="font-mono font-extrabold text-white text-sm sm:text-base tracking-tight">
                                {Number(item.amount || item.due_amount || 0).toLocaleString("en-IN")}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Request Reason Quote (if applicable) */}
                        {item.request_reason && (
                          <div className="mb-3.5 flex items-start gap-2.5 rounded-xl bg-amber-500/[0.07] border border-amber-500/25 px-3.5 py-2.5 text-xs text-amber-200/90">
                            <FiAlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-semibold text-amber-300">আবেদনের কারণ: </span>
                              <span className="italic font-normal">"{item.request_reason}"</span>
                            </div>
                          </div>
                        )}

                        {/* Actors & Verification Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-white/[0.07]">
                          {/* Actor Box 1: Initiator / Requester / Collector */}
                          <div className="flex items-center gap-3 rounded-xl bg-white/[0.025] hover:bg-white/[0.04] border border-white/[0.06] p-3 transition">
                            <UserAvatar 
                              photo={item.requester_photo} 
                              name={item.requester_name}
                              gradient="from-indigo-600 to-cyan-600"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-[10px] text-slate-400 font-medium">
                                  {actorLabel}
                                </span>
                                {item.requester_role && (
                                  <span className="rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.2 text-[9px] font-mono uppercase font-bold">
                                    {item.requester_role}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs sm:text-sm font-bold text-white truncate mt-0.5">
                                {item.requester_name || "স্টাফ সদস্য"}
                              </div>
                              <div className="text-[11px] font-mono text-slate-400 mt-1 flex items-center gap-1.5">
                                <FiCalendar className="h-3 w-3 text-cyan-400" />
                                <span>{formatDateTime(item.created_at)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Actor Box 2: Reviewer / Approver / Direct status */}
                          <div className="flex items-center gap-3 rounded-xl bg-white/[0.025] hover:bg-white/[0.04] border border-white/[0.06] p-3 transition">
                            {item.reviewer_name ? (
                              <>
                                <UserAvatar 
                                  photo={item.reviewer_photo} 
                                  name={item.reviewer_name}
                                  gradient={isRejected ? "from-rose-600 to-orange-600" : "from-emerald-600 to-teal-600"}
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="text-[10px] text-slate-400 font-medium">
                                      {isRejected ? "বাতিলকারী কর্তৃপক্ষ" : "অনুমোদনকারী কর্তৃপক্ষ"}
                                    </span>
                                    <span className={`rounded px-1.5 py-0.2 text-[9px] font-mono uppercase font-bold border ${
                                      isRejected 
                                        ? "bg-rose-500/20 text-rose-300 border-rose-500/30" 
                                        : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                                    }`}>
                                      {item.reviewer_role || "ADMIN"}
                                    </span>
                                  </div>
                                  <div className={`text-xs sm:text-sm font-bold truncate mt-0.5 ${
                                    isRejected ? "text-rose-300" : "text-emerald-300"
                                  }`}>
                                    {item.reviewer_name}
                                  </div>
                                  <div className="text-[11px] font-mono text-slate-400 mt-1 flex items-center gap-1.5">
                                    <FiCheckCircle className={`h-3 w-3 ${isRejected ? "text-rose-400" : "text-emerald-400"}`} />
                                    <span>{formatDateTime(item.reviewed_at)}</span>
                                  </div>
                                </div>
                              </>
                            ) : isRequestUnpaid && isPending ? (
                              <div className="flex items-center gap-3 w-full">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shrink-0">
                                  <FiClock className="h-4.5 w-4.5 animate-spin" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-[10px] text-amber-400/90 font-bold uppercase tracking-wider">
                                    অনুমোদন অপেক্ষমাণ
                                  </div>
                                  <div className="text-xs font-bold text-amber-300 mt-0.5">
                                    অ্যাডমিন বা কর্তৃপক্ষের যাচাইয়ের জন্য পেন্ডিং
                                  </div>
                                  <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                                    অনুমোদিত হলে সিস্টেম স্বয়ংক্রিয়ভাবে কার্যকর করবে
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-3 w-full">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shrink-0">
                                  <FiCheckSquare className="h-4.5 w-4.5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-[10px] text-emerald-400/90 font-bold uppercase tracking-wider">
                                    সরাসরি আদায় ভেরিফায়েড
                                  </div>
                                  <div className="text-xs font-bold text-slate-200 mt-0.5">
                                    তাৎক্ষণিক ক্যাশ-ইন সম্পন্ন
                                  </div>
                                  <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                                    সিস্টেম ডাটাবেজে নিয়মিত পেমেন্ট হিসেবে নিবন্ধিত
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Bar */}
          <div className="border-t border-white/[0.08] bg-[#070e1c] px-6 py-4 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-400 text-[11px]">
              <FiShield className="h-4 w-4 text-cyan-400 shrink-0" />
              <span>
                সুরক্ষিত ক্রিপ্টোগ্রাফিক টাইমস্ট্যাম্প • <strong className="text-slate-300 font-semibold">SupplyLink Audit Security</strong>
              </span>
            </div>
            
            <button
              onClick={onClose}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] hover:bg-white/[0.12] hover:border-cyan-500/30 px-5 py-2 text-xs font-bold text-white transition shadow-sm cursor-pointer"
            >
              <span>বন্ধ করুন</span>
              <kbd className="hidden sm:inline-block rounded bg-black/40 border border-white/10 px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
                ESC
              </kbd>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
