import React, { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FiBell, 
  FiCheck, 
  FiCheckCircle, 
  FiClock, 
  FiCreditCard, 
  FiExternalLink, 
  FiRefreshCw, 
  FiXCircle, 
  FiChevronRight,
  FiTrendingUp
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";

export default function NotificationDropdown({
  isOpen,
  onClose,
  notifications = [],
  unreadCount = 0,
  pendingCount = 0,
  onRefresh,
  markAsRead,
  markAllAsRead,
  isAdminOrDev = false,
  userRole = "staff",
}) {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose?.();
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleNotificationClick = (item) => {
    if (item.id) {
      markAsRead?.(item.id);
    }
    onClose?.();
    if (item.link) {
      navigate(item.link);
    } else {
      navigate("/approval-center");
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diffMs = now - d;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);

      if (diffMins < 1) return "এইমাত্র";
      if (diffMins < 60) return `${diffMins} মি. আগে`;
      if (diffHours < 24) return `${diffHours} ঘণ্টা আগে`;

      return d.toLocaleDateString("bn-BD", {
        month: "short",
        day: "numeric",
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, y: 8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.96 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="absolute right-0 top-full mt-2.5 w-[340px] sm:w-[410px] max-w-[calc(100vw-32px)] z-50 overflow-hidden rounded-2xl border border-white/10 bg-[#070b16]/95 backdrop-blur-2xl shadow-2xl shadow-black/80 ring-1 ring-white/5"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.08] bg-gradient-to-r from-[#0a1020] via-[#0d1627] to-[#121c32] px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
                <FiBell className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-white tracking-wide">
                    নোটিফিকেশন
                  </h4>
                  {unreadCount > 0 && (
                    <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-cyan-500 px-1 text-[9px] font-bold text-black">
                      {unreadCount}
                    </span>
                  )}
                  {isAdminOrDev && pendingCount > 0 && (
                    <span className="flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-500/40 px-1.5 py-0.2 text-[9px] font-bold text-amber-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                      <span>{pendingCount} পেন্ডিং</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  title="সবগুলো পঠিত মার্ক করুন"
                  className="flex items-center gap-1 text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer"
                >
                  <FiCheck className="h-3 w-3" />
                  <span>পঠিত মার্ক</span>
                </button>
              )}
              <button
                onClick={onRefresh}
                title="রিফ্রেশ করুন"
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <FiRefreshCw className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-white/[0.04]">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-2">
                  <FiCheck className="h-5 w-5" />
                </div>
                <p className="text-xs font-semibold text-slate-300">
                  কোনো নতুন নোটিফিকেশন নেই
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  সব আপডেট ও তথ্য আপ-টু-ডেট রয়েছে
                </p>
              </div>
            ) : (
              notifications.map((item) => {
                const isUnpaidReq = item.type === "installment_unpaid_request";
                const isApproved = item.type === "installment_unpaid_approved";
                const isRejected = item.type === "installment_unpaid_rejected";
                const isPaid = item.type === "installment_paid";
                const isInvestmentDeposit = item.type === "investment_deposit";
                const isInvestEditReq = item.type === "investment_edit_request";
                const isInvestEditApproved = item.type === "investment_edit_approved";
                const isInvestEditRejected = item.type === "investment_edit_rejected";
                const isDailyDeposit = item.type === "daily_installment_deposit";
                const isDailyEditReq = item.type === "daily_installment_edit_request";
                const isDailyEditApproved = item.type === "daily_installment_edit_approved";
                const isDailyEditRejected = item.type === "daily_installment_edit_rejected";
                const isUnread = item.is_read === 0;

                let Icon = FiBell;
                let iconStyle = "bg-indigo-500/10 border-indigo-500/25 text-indigo-400";

                if (isInvestmentDeposit || isDailyDeposit) {
                  Icon = isDailyDeposit ? FiCreditCard : FiTrendingUp;
                  iconStyle = "bg-emerald-500/20 border-emerald-500/35 text-emerald-300";
                } else if (isInvestEditReq || isDailyEditReq) {
                  Icon = FiClock;
                  iconStyle = "bg-amber-500/20 border-amber-500/40 text-amber-300";
                } else if (isInvestEditApproved || isDailyEditApproved) {
                  Icon = FiCheckCircle;
                  iconStyle = "bg-emerald-500/20 border-emerald-500/40 text-emerald-300";
                } else if (isInvestEditRejected || isDailyEditRejected) {
                  Icon = FiXCircle;
                  iconStyle = "bg-rose-500/20 border-rose-500/40 text-rose-300";
                } else if (isUnpaidReq) {
                  Icon = FiClock;
                  iconStyle = "bg-amber-500/15 border-amber-500/30 text-amber-400";
                } else if (isApproved) {
                  Icon = FiCheckCircle;
                  iconStyle = "bg-emerald-500/15 border-emerald-500/30 text-emerald-400";
                } else if (isRejected) {
                  Icon = FiXCircle;
                  iconStyle = "bg-rose-500/15 border-rose-500/30 text-rose-400";
                } else if (isPaid) {
                  Icon = FiCreditCard;
                  iconStyle = "bg-cyan-500/15 border-cyan-500/30 text-cyan-400";
                }

                return (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    className={`group relative flex items-start gap-3 p-3.5 transition-all cursor-pointer ${
                      isUnread
                        ? "bg-indigo-950/20 hover:bg-indigo-900/30"
                        : "hover:bg-white/[0.03]"
                    }`}
                  >
                    {/* Unread Glowing Dot */}
                    {isUnread && (
                      <span className="absolute left-1.5 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-cyan-400 ring-2 ring-cyan-500/30" />
                    )}

                    {/* Icon */}
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border mt-0.5 ${iconStyle}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-1">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <h5
                          className={`text-xs font-semibold truncate ${
                            isUnread ? "text-white" : "text-slate-300"
                          }`}
                        >
                          {item.title}
                        </h5>
                        <span className="text-[10px] font-mono text-slate-500 shrink-0">
                          {formatTime(item.created_at)}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {item.message}
                      </p>
                    </div>

                    {/* Arrow hint on hover */}
                    <FiChevronRight className="h-4 w-4 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition shrink-0 self-center" />
                  </div>
                );
              })
            )}
          </div>

          {/* Footer: Dedicated Common Requests Page Link */}
          <div className="border-t border-white/[0.08] bg-[#070b16] px-4 py-2.5 flex items-center justify-between text-xs">
            <span className="text-[10px] text-slate-500 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>লাইভ নোটিফিকেশন</span>
            </span>

            <button
              onClick={() => {
                onClose?.();
                navigate("/approval-center");
              }}
              className="flex items-center gap-1 text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer"
            >
              <span>Requests & Approvals</span>
              <FiExternalLink className="h-3 w-3" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
