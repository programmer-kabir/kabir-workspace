import React, { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FiX, 
  FiBell, 
  FiCheck, 
  FiAlertTriangle, 
  FiUser, 
  FiCalendar, 
  FiRefreshCw,
  FiExternalLink,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiCreditCard
} from "react-icons/fi";
import axios from "axios";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchInstallmentsPayments } from "../../Redux/Customers/InstallmentPayment/InstallmentPaymentSlice";

export default function InstallmentApprovalModal({ 
  isOpen, 
  onClose, 
  notifications = [],
  pendingRequests = [], 
  onRefresh, 
  currentUser,
  userRole = "staff",
  markAsRead,
  markAllAsRead
}) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'pending'
  const [processingId, setProcessingId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  if (!isOpen) return null;

  const isAdminOrDev = ["admin", "developer"].some((r) =>
    userRole?.toLowerCase()?.includes(r)
  );

  const handleAction = async (editId, action, notifId) => {
    try {
      setProcessingId(editId);
      setFeedback(null);

      const res = await axios.post(
        `${import.meta.env.VITE_LOCALHOST_KEY}/customers/action_installment_edit.php`,
        {
          edit_id: editId,
          action: action, // 'approved' | 'rejected'
          reviewer_id: currentUser?.id,
        }
      );

      if (res.data?.success) {
        setFeedback({
          type: action === "approved" ? "success" : "warning",
          message:
            res.data.message ||
            (action === "approved"
              ? "অনুরোধটি অনুমোদিত হয়েছে এবং কিস্তি আনপেইড করা হয়েছে!"
              : "অনুরোধটি বাতিল করা হয়েছে!"),
        });
        
        if (notifId) markAsRead?.(notifId);

        // Refetch notifications & payments
        onRefresh?.();
        dispatch(fetchInstallmentsPayments());
        window.dispatchEvent(new CustomEvent("installment_updated"));
      } else {
        setFeedback({
          type: "error",
          message: res.data?.message || "অনুমোদন সম্পন্ন করা যায়নি।",
        });
      }
    } catch (err) {
      setFeedback({
        type: "error",
        message: err.response?.data?.message || "সার্ভার এরর, পুনরায় চেষ্টা করুন।",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleNavigateToLink = (link, notifId) => {
    if (notifId) markAsRead?.(notifId);
    onClose?.();
    if (link) {
      navigate(link);
    }
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

  const displayedList =
    activeTab === "pending"
      ? notifications.filter(
          (n) => n.type === "installment_unpaid_request" && n.edit_status === "pending"
        )
      : notifications;

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative my-auto w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-[#070b16] shadow-2xl shadow-indigo-950/50 z-10 flex flex-col max-h-[88vh]"
        >
          {/* Header */}
          <div className="relative border-b border-white/[0.08] bg-gradient-to-r from-[#0a1020] via-[#0d1627] to-[#121c32] px-6 py-4.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/25 text-indigo-400">
                <FiBell className="h-5 w-5" />
                {pendingRequests.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-lg ring-2 ring-[#070b16] animate-pulse">
                    {pendingRequests.length}
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-base font-semibold text-white tracking-wide flex items-center gap-2">
                  <span>সিস্টেম নোটিফিকেশন সেন্টার</span>
                  <span className="rounded-full bg-indigo-500/15 border border-indigo-500/30 px-2.5 py-0.5 text-xs font-mono font-medium text-indigo-300 uppercase">
                    {userRole}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  কিস্তি লেনদেন, অনুমোদন অনুরোধ ও লাইভ আপডেট
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onRefresh}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                title="রিফ্রেশ করুন"
              >
                <FiRefreshCw className="h-4 w-4" />
              </button>
              <button
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Segmented Filter Bar for Admin / Developer */}
          {isAdminOrDev && (
            <div className="flex items-center justify-between border-b border-white/[0.06] bg-[#050813] px-6 py-2.5">
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.04] border border-white/5">
                <button
                  onClick={() => setActiveTab("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    activeTab === "all"
                      ? "bg-indigo-600 text-white shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  সকল নোটিফিকেশন ({notifications.length})
                </button>
                <button
                  onClick={() => setActiveTab("pending")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                    activeTab === "pending"
                      ? "bg-amber-600 text-white shadow"
                      : "text-amber-400/80 hover:text-amber-300"
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                  <span>অনুমোদন পেন্ডিং ({pendingRequests.length})</span>
                </button>
              </div>

              {notifications.some((n) => n.is_read === 0) && (
                <button
                  onClick={markAllAsRead}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer"
                >
                  সবগুলো পঠিত মার্ক করুন
                </button>
              )}
            </div>
          )}

          {/* Feedback Alert if any */}
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mx-6 mt-4 p-3.5 rounded-2xl border text-xs font-medium flex items-center justify-between ${
                feedback.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : feedback.type === "warning"
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                  : "bg-rose-500/10 border-rose-500/30 text-rose-400"
              }`}
            >
              <span>{feedback.message}</span>
              <button
                onClick={() => setFeedback(null)}
                className="text-slate-400 hover:text-white"
              >
                <FiX className="h-4 w-4" />
              </button>
            </motion.div>
          )}

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-3.5">
            {displayedList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-3 shadow-inner">
                  <FiCheck className="h-7 w-7" />
                </div>
                <h4 className="text-sm font-semibold text-slate-200">
                  {activeTab === "pending"
                    ? "কোনো পেন্ডিং অনুমোদন নেই"
                    : "কোনো নতুন নোটিফিকেশন নেই"}
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  {activeTab === "pending"
                    ? "বর্তমান সময়ে কোনো কিস্তি আনপেইড করার অনুরোধ অপেক্ষমাণ নেই।"
                    : "আপনার একাউন্টের সব নোটিফিকেশন আপ-টু-ডেট রয়েছে।"}
                </p>
              </div>
            ) : (
              displayedList.map((item) => {
                const isUnpaidReq = item.type === "installment_unpaid_request";
                const isApproved = item.type === "installment_unpaid_approved";
                const isRejected = item.type === "installment_unpaid_rejected";
                const isPaid = item.type === "installment_paid";
                const isPendingAction = isUnpaidReq && item.edit_status === "pending";
                const isProcessing = processingId === item.edit_id;

                let cardBorder = "border-white/[0.08] hover:border-white/15";
                let Icon = FiBell;
                let iconColor = "bg-indigo-500/10 border-indigo-500/25 text-indigo-400";

                if (isUnpaidReq) {
                  cardBorder = isPendingAction
                    ? "border-amber-500/30 bg-amber-500/[0.03] hover:border-amber-500/50"
                    : "border-white/[0.08]";
                  Icon = FiClock;
                  iconColor = "bg-amber-500/10 border-amber-500/30 text-amber-400";
                } else if (isApproved) {
                  Icon = FiCheckCircle;
                  iconColor = "bg-emerald-500/10 border-emerald-500/30 text-emerald-400";
                } else if (isRejected) {
                  Icon = FiXCircle;
                  iconColor = "bg-rose-500/10 border-rose-500/30 text-rose-400";
                } else if (isPaid) {
                  Icon = FiCreditCard;
                  iconColor = "bg-cyan-500/10 border-cyan-500/30 text-cyan-400";
                }

                return (
                  <div
                    key={item.id}
                    className={`relative overflow-hidden rounded-2xl border bg-[#0d1627]/90 p-4.5 transition-all shadow-md ${cardBorder}`}
                  >
                    {/* Unread indicator */}
                    {item.is_read === 0 && (
                      <span className="absolute top-3 right-3 h-2 w-2 rounded-full bg-cyan-400 ring-4 ring-[#0d1627]" />
                    )}

                    <div className="flex items-start gap-3.5">
                      {/* Icon */}
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${iconColor}`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                          <h4 className="text-sm font-semibold text-white tracking-wide">
                            {item.title}
                          </h4>
                          <span className="text-[11px] font-mono text-slate-400">
                            {formatDateTime(item.created_at)}
                          </span>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed mb-3">
                          {item.message}
                        </p>

                        {/* Action buttons row */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/[0.05]">
                          {/* Direct Link button */}
                          {item.link ? (
                            <button
                              onClick={() => handleNavigateToLink(item.link, item.id)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 hover:border-cyan-400 transition cursor-pointer"
                            >
                              <span>চার্ট পেজে যান</span>
                              <FiExternalLink className="h-3.5 w-3.5" />
                            </button>
                          ) : (
                            <div />
                          )}

                          {/* If Admin/Dev and pending request: Show Approve/Reject right here */}
                          {isAdminOrDev && isPendingAction && item.edit_id && (
                            <div className="flex items-center gap-2 ml-auto">
                              <button
                                disabled={isProcessing}
                                onClick={() => handleAction(item.edit_id, "rejected", item.id)}
                                className="flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/50 transition disabled:opacity-50 cursor-pointer"
                              >
                                <FiX className="h-3.5 w-3.5" />
                                <span>বাতিল</span>
                              </button>

                              <button
                                disabled={isProcessing}
                                onClick={() => handleAction(item.edit_id, "approved", item.id)}
                                className="flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/20 px-3.5 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/30 hover:border-emerald-500/60 shadow-lg shadow-emerald-950/30 transition disabled:opacity-50 cursor-pointer"
                              >
                                {isProcessing ? (
                                  <FiRefreshCw className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <FiCheck className="h-3.5 w-3.5" />
                                )}
                                <span>অনুমোদন</span>
                              </button>
                            </div>
                          )}

                          {/* If already resolved */}
                          {isUnpaidReq && item.edit_status && item.edit_status !== "pending" && (
                            <span
                              className={`ml-auto text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                                item.edit_status === "approved"
                                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                                  : "bg-rose-500/10 border-rose-500/30 text-rose-400"
                              }`}
                            >
                              {item.edit_status === "approved" ? "অনুমোদিত" : "বাতিলকৃত"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-white/[0.08] bg-[#070b16] px-6 py-3.5 flex items-center justify-between text-xs text-slate-500">
            <button
              onClick={() => {
                onClose?.();
                navigate("/customers/installment_edit_requests");
              }}
              className="inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 hover:underline text-xs font-medium cursor-pointer"
            >
              <span>সকল রিকোয়েস্ট ও ফিল্টারিং পেজ দেখুন</span>
              <FiExternalLink className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              বন্ধ করুন
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
