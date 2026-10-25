import React, { useMemo, useState } from "react";
import useCustomerInstallmentCards from "../../../utils/Hooks/useCustomerInstallmentCards";
import useUsers from "../../../utils/Hooks/useUsers";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import { useAuth } from "../../../Provider/AuthProvider";
import {
  FiSearch,
  FiX,
  FiDollarSign,
  FiUser,
  FiPhone,
  FiMapPin,
  FiCreditCard,
  FiCheckCircle,
  FiClock,
  FiArrowRight,
  FiPrinter,
  FiCheck,
  FiCalendar,
  FiRefreshCw
} from "react-icons/fi";
import { FaMoneyBillWave, FaReceipt } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import LuxuryToast from "../../../components/Modal/LuxuryToast";

const DailyInstallmentsUsers = () => {
  const {
    isCustomerInstallmentsCardsLoading,
    customerInstallmentCards = [],
    refetch: refetchCards,
  } = useCustomerInstallmentCards();

  const { isUsersLoading, users = [] } = useUsers();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'running' | 'paid'
  const [showModal, setShowModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receiptModal, setReceiptModal] = useState(null);
  const [luxuryToast, setLuxuryToast] = useState(null);

  const userRoles = Array.isArray(user?.role) ? user.role : [user?.role];
  const allowedRoles = ["staff", "manager", "admin", "developer"];
  const hasPermission = userRoles.some((r) =>
    allowedRoles.includes(String(r || "").toLowerCase())
  );
  const isAdminOrDev = userRoles.some((r) =>
    ["admin", "developer"].includes(String(r || "").toLowerCase())
  );

  const todayDate = useMemo(() => {
    return new Date().toISOString().split("T")[0];
  }, []);

  const currentStaff = useMemo(() => {
    return (users || []).find((u) => Number(u.id) === Number(user?.id));
  }, [users, user?.id]);

  const collectorName = currentStaff?.name || user?.name || "সংগ্রাহক কর্মী";
  const cleanCollectorName = useMemo(() => {
    return (collectorName || "")
      .replace(/^মোঃ\s*/g, "")
      .replace(/^Md\.?\s*/gi, "")
      .replace(/^Mohammad\s*/gi, "")
      .trim();
  }, [collectorName]);

  const collectorPhoto = currentStaff?.photo
    ? `https://api.supplylinkbd.com/${currentStaff.photo}`
    : user?.photo
    ? `https://api.supplylinkbd.com/${user.photo}`
    : null;

  const [formData, setFormData] = useState({
    amount: "",
  });

  const validate = () => {
    let newErrors = {};
    if (!formData.amount || Number(formData.amount) <= 0) {
      newErrors.amount = "বৈধ টাকার পরিমাণ লিখুন";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const DailyInstallmentsCards = useMemo(() => {
    return (customerInstallmentCards || []).filter(
      (card) => Number(card.is_daily) === 1 || String(card.remarks || "").toLowerCase() === "daily"
    );
  }, [customerInstallmentCards]);

  // Merge card + customer
  const cardsWithCustomer = useMemo(() => {
    if (!DailyInstallmentsCards || !users) return [];

    return DailyInstallmentsCards.map((card) => {
      const customer = users.find((u) => Number(u.id) === Number(card.user_id));
      return {
        ...card,
        customer: customer || null,
      };
    });
  }, [DailyInstallmentsCards, users]);

  // Filter & Search
  const filteredCards = useMemo(() => {
    let result = cardsWithCustomer;

    if (search.trim()) {
      const term = search.toLowerCase().trim();
      result = result.filter((card) => {
        return (
          card.customer?.name?.toLowerCase().includes(term) ||
          String(card.id).includes(term) ||
          String(card.customer?.id).includes(term) ||
          card.customer?.mobile?.includes(term) ||
          card.customer?.address?.toLowerCase().includes(term)
        );
      });
    }

    if (statusFilter === "running") {
      result = result.filter((card) => card.status !== "Fully Paid");
    } else if (statusFilter === "paid") {
      result = result.filter((card) => card.status === "Fully Paid");
    }

    // Sort: Running first, Fully Paid last
    return [...result].sort((a, b) => {
      if (a.status === "Fully Paid" && b.status !== "Fully Paid") return 1;
      if (a.status !== "Fully Paid" && b.status === "Fully Paid") return -1;
      return Number(b.id || 0) - Number(a.id || 0);
    });
  }, [search, statusFilter, cardsWithCustomer]);

  // KPI Stats
  const stats = useMemo(() => {
    const total = DailyInstallmentsCards.length;
    const fullyPaid = DailyInstallmentsCards.filter(
      (c) => c.status === "Fully Paid"
    ).length;
    const running = total - fullyPaid;
    const totalVolume = DailyInstallmentsCards.reduce(
      (sum, c) => sum + Number(c.sale_price || 0),
      0
    );
    return { total, running, fullyPaid, totalVolume };
  }, [DailyInstallmentsCards]);

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    if (!hasPermission) {
      toast.error("আপনার কিস্তি সংগ্রহ করার অনুমতি নেই ❌");
      return;
    }

    const payload = {
      userId: selectedCard?.customer?.id,
      cardId: selectedCard?.id,
      amount: formData.amount,
      date: todayDate,
      receiver: user?.id,
    };

    try {
      setIsSubmitting(true);
      const res = await axios.post(
        `${import.meta.env.VITE_LOCALHOST_KEY}/DailyInstallments/addDailyInstallment.php`,
        payload
      );

      const data = res.data;
      if (data.success) {
        toast.success("দৈনিক কিস্তি সফলভাবে আদায় ও ক্যাশ ইন হয়েছে ✅");

        setLuxuryToast({
          title: "দৈনিক কিস্তি আদায় সফল! 🎉",
          message: `গ্রাহক ${selectedCard?.customer?.name || "গ্রাহক"} এর কার্ড #${selectedCard?.id} এ ৳${Number(formData.amount).toLocaleString()} জমা হয়েছে ও ইমেইল নোটিফিকেশন পাঠানো হয়েছে।`,
          tag: `রসিদ #${data.receipt?.id || data.data?.id}`,
          amount: formData.amount,
          type: "success",
        });

        // Trigger Receipt Modal
        setReceiptModal({
          receiptNo: data.receipt?.id || data.data?.id || Date.now(),
          customerName: selectedCard?.customer?.name || "গ্রাহক",
          customerId: selectedCard?.customer?.id,
          cardId: selectedCard?.id,
          amount: formData.amount,
          date: todayDate,
          collectorName: cleanCollectorName,
          collectorAvatar: collectorPhoto,
          refId: data.receipt?.refId || `daily_installment_${data.data?.id}`,
          createdAt: data.receipt?.createdAt || new Date().toLocaleString(),
        });

        // Reset
        setFormData({
          amount: "",
        });
        setShowModal(false);
        refetchCards?.();
      } else {
        toast.error(data.message || "Failed ❌");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "সার্ভার এরর ❌");
    } finally {
      setIsSubmitting(false);
    }
  };

  const cleanName = (name) => {
    return (name || "")
      .replace(/^মোঃ\s*/g, "")
      .replace(/^Md\.?\s*/gi, "")
      .replace(/^Mohammad\s*/gi, "")
      .trim();
  };

  return (
    <div className="min-h-screen text-slate-100 space-y-6 pb-12">
      {/* ================= HEADER & BREADCRUMB ================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25">
              <FaMoneyBillWave className="text-xl" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                দৈনিক কিস্তি গ্রাহক তালিকা
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-medium font-mono">
                  Daily Installments
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                দৈনিক কিস্তি গ্রাহকদের পরিচালনা করুন, তাৎক্ষণিক কিস্তি এন্ট্রি দিন এবং ক্যাশ ট্র্যাকিং পর্যবেক্ষণ করুন
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <Link
            to="/DailyInstallments/daily_installments_reports"
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition active:scale-95 flex items-center gap-1.5 shadow"
          >
            <FiCalendar className="text-sm text-cyan-400" />
            <span>দৈনিক রিপোর্ট</span>
          </Link>
          <Link
            to="/DailyInstallments/daily_installments_PaidReport"
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition active:scale-95 flex items-center gap-1.5 shadow"
          >
            <FiCheckCircle className="text-sm text-emerald-400" />
            <span>আদায় রিপোর্ট</span>
          </Link>
        </div>
      </div>

      {/* ================= STATS OVERVIEW CARDS ================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0c1322] to-[#070b14] border border-white/[0.08] shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/15 transition-all" />
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>মোট কিস্তি কার্ড</span>
            <FiCreditCard className="text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white tracking-tight">
            {stats.total}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 font-mono">
            মোট টার্গেট: <span className="text-cyan-400 font-semibold">৳{stats.totalVolume.toLocaleString("en-IN")}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0c1322] to-[#070b14] border border-white/[0.08] shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/15 transition-all" />
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>চলমান কিস্তি (Running)</span>
            <FiClock className="text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-300 tracking-tight">
            {stats.running}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            বর্তমানে নিয়মিত আদায়যোগ্য কার্ড
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0c1322] to-[#070b14] border border-white/[0.08] shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/15 transition-all" />
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>পরিশোধিত কার্ড</span>
            <FiCheckCircle className="text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 tracking-tight">
            {stats.fullyPaid}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            সম্পূর্ণ পরিশোধিত (Fully Paid)
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0c1322] to-[#070b14] border border-white/[0.08] shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/15 transition-all" />
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>খোঁজা হয়েছে</span>
            <FiSearch className="text-indigo-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-indigo-300 tracking-tight">
            {filteredCards.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            ফিল্টার অনুসারে প্রদর্শিত কার্ড
          </div>
        </div>
      </div>

      {/* ================= SEARCH & STATUS FILTER ================= */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#080d1a] border border-white/[0.08] shadow-lg">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
          <input
            type="text"
            placeholder="গ্রাহকের নাম, কার্ড #, ফোন বা ঠিকানা..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-9 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <FiX className="text-xs" />
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/5 w-full sm:w-auto">
          <button
            onClick={() => setStatusFilter("all")}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              statusFilter === "all"
                ? "bg-indigo-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            সকল কার্ড ({stats.total})
          </button>
          <button
            onClick={() => setStatusFilter("running")}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              statusFilter === "running"
                ? "bg-amber-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            চলমান ({stats.running})
          </button>
          <button
            onClick={() => setStatusFilter("paid")}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              statusFilter === "paid"
                ? "bg-emerald-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            পরিশোধিত ({stats.fullyPaid})
          </button>
        </div>
      </div>

      {/* ================= CUSTOMER CARDS GRID ================= */}
      {isCustomerInstallmentsCardsLoading || isUsersLoading ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
          <FiRefreshCw className="h-8 w-8 animate-spin text-cyan-400 mb-3" />
          <p className="text-sm font-semibold">গ্রাহক তালিকা লোড হচ্ছে...</p>
        </div>
      ) : filteredCards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl bg-[#080d1a] border border-white/[0.06]">
          <div className="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center text-slate-500 mb-3">
            <FiSearch className="text-2xl" />
          </div>
          <h3 className="text-base font-bold text-slate-200">কোনো কার্ড পাওয়া যায়নি</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            আপনার অনুসন্ধান বা ফিল্টারের সাথে মিলে এমন কোনো দৈনিক কিস্তি কার্ডের তথ্য নেই।
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCards.map((card) => {
            const isFullyPaid = card.status === "Fully Paid";
            const customer = card.customer;
            const displayName = customer?.name || "নাম পাওয়া যায়নি";
            const avatarUrl = customer?.photo
              ? `https://api.supplylinkbd.com/${customer.photo}`
              : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  displayName
                )}&background=0f172a&color=38bdf8&bold=true`;

            return (
              <div
                key={card.id}
                className={`group relative rounded-2xl p-5 border transition-all duration-300 shadow-xl overflow-hidden flex flex-col justify-between ${
                  isFullyPaid
                    ? "bg-[#080e1b]/80 border-emerald-500/20 hover:border-emerald-500/40"
                    : "bg-[#090f20]/90 border-white/[0.08] hover:border-cyan-500/40 hover:shadow-cyan-950/20"
                }`}
              >
                {/* Background Glow */}
                <div
                  className={`absolute -right-8 -top-8 w-32 h-32 rounded-full blur-3xl pointer-events-none transition-all ${
                    isFullyPaid ? "bg-emerald-500/10" : "bg-cyan-500/10 group-hover:bg-cyan-500/20"
                  }`}
                />

                {/* Top Section */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        <img
                          src={avatarUrl}
                          alt={displayName}
                          className="w-13 h-13 rounded-2xl object-cover border-2 border-white/10 shadow-md group-hover:border-cyan-400/50 transition-colors"
                        />
                        <span
                          className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#090f20] ${
                            isFullyPaid ? "bg-emerald-400" : "bg-cyan-400"
                          }`}
                        />
                      </div>

                      <div className="min-w-0">
                        <h3 className="font-bold text-white text-sm tracking-wide truncate group-hover:text-cyan-300 transition-colors">
                          {displayName}
                        </h3>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-cyan-400 font-semibold">
                            ID: {customer?.id || card.user_id}
                          </span>
                          <span>•</span>
                          <span className="font-mono font-medium text-slate-300">
                            কার্ড #{card.id}
                          </span>
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold uppercase tracking-wider">
                            {Number(card.is_daily) === 1 ? "দৈনিক কিস্তি" : (card.remarks || "Daily")}
                          </span>
                          {isFullyPaid ? (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-semibold">
                              Fully Paid
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-semibold">
                              Running
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Target Amount */}
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold font-mono text-emerald-400">
                        ৳{Number(card.sale_price || 0).toLocaleString("en-IN")}
                      </p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                        বিক্রয় মূল্য
                      </p>
                    </div>
                  </div>

                  {/* Customer Meta Details */}
                  <div className="space-y-1.5 pt-3 border-t border-white/[0.06] text-xs text-slate-400">
                    <div className="flex items-center gap-2 truncate">
                      <FiPhone className="text-slate-500 shrink-0 text-xs" />
                      <span className="font-mono text-slate-300">
                        {customer?.mobile || "ফোন নম্বর নেই"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 truncate">
                      <FiMapPin className="text-slate-500 shrink-0 text-xs" />
                      <span className="truncate text-slate-400" title={customer?.address}>
                        {customer?.address || "ঠিকানা নেই"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Buttons */}
                <div className="flex items-center justify-between gap-2 pt-4 mt-4 border-t border-white/[0.06]">
                  <Link
                    to={`/DailyInstallments/daily_installments_users/${card.id}`}
                    className="flex-1 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white border border-white/10 text-xs font-semibold text-center transition active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <span>বিস্তারিত দেখুন</span>
                    <FiArrowRight className="text-xs text-cyan-400" />
                  </Link>

                  <button
                    disabled={isFullyPaid || !hasPermission}
                    onClick={() => {
                      if (isFullyPaid) return;
                      if (!hasPermission) {
                        toast.error("আপনার কিস্তি আদায় করার অনুমতি নেই ❌");
                        return;
                      }
                      setSelectedCard(card);
                      setShowModal(true);
                    }}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition active:scale-95 flex items-center justify-center gap-1.5 shadow-md ${
                      isFullyPaid
                        ? "bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed opacity-60"
                        : !hasPermission
                        ? "bg-rose-950/60 text-rose-400 border border-rose-800/60 cursor-not-allowed"
                        : "bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white shadow-emerald-950/40 cursor-pointer"
                    }`}
                  >
                    <FiDollarSign className="text-xs" />
                    <span>{isFullyPaid ? "পরিশোধিত" : "কিস্তি আদায় (Pay)"}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= PAYMENT COLLECTION MODAL ================= */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/75 backdrop-blur-md"
              onClick={() => setShowModal(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative w-full max-w-md rounded-2xl bg-[#090f20] border border-white/10 p-6 shadow-2xl text-white space-y-5 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Background Glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <FaMoneyBillWave className="text-lg" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white tracking-wide">
                      দৈনিক কিস্তি এন্ট্রি
                    </h3>
                    <p className="text-xs text-slate-400">
                      কিস্তি আদায় করুন ও ক্যাশ ইন রেকর্ড করুন
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowModal(false)}
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition"
                >
                  <FiX className="text-sm" />
                </button>
              </div>

              {/* Customer Dossier Badge */}
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={
                      selectedCard?.customer?.photo
                        ? `https://api.supplylinkbd.com/${selectedCard.customer.photo}`
                        : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            selectedCard?.customer?.name || "User"
                          )}&background=0f172a&color=38bdf8&bold=true`
                    }
                    alt="customer"
                    className="w-10 h-10 rounded-xl object-cover border border-white/10 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">
                      {selectedCard?.customer?.name || "গ্রাহক"}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      কার্ড #{selectedCard?.id} • ID #{selectedCard?.customer?.id}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">
                    বিক্রয় মূল্য
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    ৳{Number(selectedCard?.sale_price || 0).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmitForm} className="space-y-4">
                {/* Amount */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    টাকার পরিমাণ (৳) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData({ ...formData, amount: e.target.value })
                      }
                      placeholder="যেমন: ৫০০"
                      className={`w-full px-4 py-2.5 rounded-xl bg-[#030712] border ${
                        errors.amount ? "border-rose-500" : "border-white/10"
                      } text-white font-mono text-sm focus:outline-none focus:border-emerald-500`}
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-xs">
                      BDT
                    </span>
                  </div>
                  {errors.amount && (
                    <p className="text-rose-400 text-[11px] mt-1">{errors.amount}</p>
                  )}

                  {/* Quick Amount Suggestion Pills */}
                  <div className="flex items-center gap-2 mt-2">
                    {[100, 200, 500, 1000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, amount: String(amt) })
                        }
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/40 text-[11px] font-mono text-slate-300 hover:text-emerald-300 transition cursor-pointer"
                      >
                        +৳{amt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date - Permanently Fixed to Today */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      আদায়ের তারিখ
                    </label>
                    <span className="text-[10px] text-cyan-400 font-medium flex items-center gap-1 font-mono">
                      <FiClock className="text-[11px]" /> আজকের তারিখ (ফিক্সড)
                    </span>
                  </div>
                  <div className="w-full px-4 py-2.5 rounded-xl bg-[#030712] border border-white/10 text-slate-200 font-mono text-xs flex items-center justify-between cursor-not-allowed select-none shadow-inner">
                    <span className="font-semibold text-white tracking-wider flex items-center gap-2">
                      <FiCalendar className="text-cyan-400 text-sm" />
                      {todayDate}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] text-slate-400 font-mono">
                      অপরিবর্তনযোগ্য
                    </span>
                  </div>
                </div>

                {/* Receiver Info */}
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {collectorPhoto ? (
                      <img
                        src={collectorPhoto}
                        alt={cleanCollectorName}
                        className="w-9 h-9 rounded-full object-cover border border-white/10 shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs shrink-0 font-mono">
                        {cleanCollectorName.charAt(0) || "U"}
                      </div>
                    )}
                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-400 block leading-tight">
                        সংগ্রাহক কর্মী (Receiver)
                      </span>
                      <span className="text-xs font-bold text-white block truncate">
                        {cleanCollectorName}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-semibold">
                      ID: #{user?.id}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition"
                  >
                    বাতিল
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/50 transition active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <FiRefreshCw className="animate-spin text-xs" />
                    ) : (
                      <FiCheck className="text-xs" />
                    )}
                    <span>পেমেন্ট জমা দিন ও ক্যাশ ইন করুন</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= DIGITAL RECEIPT CONFIRMATION MODAL ================= */}
      {receiptModal &&
        createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 print:p-0">
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-md print:hidden"
              onClick={() => setReceiptModal(null)}
            />
            <div className="relative w-full max-w-md rounded-2xl bg-[#070b16] border border-white/15 p-6 shadow-2xl text-white space-y-5 print:border-none print:shadow-none print:bg-white print:text-black">
              {/* Receipt Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] print:border-black">
                <div className="flex items-center gap-2">
                  <FaReceipt className="text-emerald-400 text-lg print:text-black" />
                  <div>
                    <h3 className="text-sm font-bold tracking-wide">
                      ডিজিটাল কিস্তি রসিদ
                    </h3>
                    <p className="text-[10px] text-slate-400 print:text-gray-600 font-mono">
                      ভাউচার #{receiptModal.receiptNo}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 print:hidden">
                  <button
                    onClick={() => window.print()}
                    className="p-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs flex items-center gap-1"
                    title="প্রিন্ট করুন"
                  >
                    <FiPrinter className="text-xs" />
                    <span>প্রিন্ট</span>
                  </button>
                  <button
                    onClick={() => setReceiptModal(null)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                  >
                    <FiX className="text-xs" />
                  </button>
                </div>
              </div>

              {/* Amount Highlight */}
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-center print:border-black print:bg-gray-100">
                <p className="text-xs text-emerald-400 print:text-black font-semibold">
                  আদায়কৃত কিস্তির পরিমাণ
                </p>
                <h2 className="text-3xl font-extrabold font-mono text-emerald-300 print:text-black my-1">
                  ৳{Number(receiptModal.amount).toLocaleString("en-IN")}
                </h2>
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono border border-emerald-500/30 print:border-black">
                  ক্যাশ ইন সফল (Approved)
                </span>
              </div>

              {/* Receipt Meta Details */}
              <div className="space-y-2 text-xs divide-y divide-white/[0.05] print:divide-gray-300">
                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-400 print:text-gray-600">গ্রাহকের নাম:</span>
                  <span className="font-semibold text-white print:text-black">
                    {receiptModal.customerName}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-400 print:text-gray-600">গ্রাহক ID:</span>
                  <span className="font-mono text-cyan-300 print:text-black">
                    #{receiptModal.customerId}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-400 print:text-gray-600">কার্ড নম্বর:</span>
                  <span className="font-mono text-amber-300 print:text-black font-semibold">
                    #{receiptModal.cardId}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-400 print:text-gray-600">আদায়ের তারিখ:</span>
                  <span className="font-mono text-slate-200 print:text-black">
                    {receiptModal.date}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-400 print:text-gray-600">সংগ্রাহক (কর্মী):</span>
                  <span className="font-semibold text-slate-200 print:text-black">
                    {receiptModal.collectorName}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-400 print:text-gray-600">ট্রানজেকশন Ref:</span>
                  <span className="font-mono text-[10px] text-slate-400 print:text-gray-600">
                    {receiptModal.refId}
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-white/[0.08] text-center text-[10px] text-slate-500 print:text-gray-600">
                SupplyLink Enterprise System • ডিজিটাল রশিদ
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* 🌟 Luxury Toast Notification */}
      <LuxuryToast
        toast={luxuryToast}
        onClose={() => setLuxuryToast(null)}
        duration={4500}
      />
    </div>
  );
};

export default DailyInstallmentsUsers;

