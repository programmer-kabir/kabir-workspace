import React, { useMemo, useState } from "react";
import useCustomerInstallmentCards from "../../../utils/Hooks/useCustomerInstallmentCards";
import useUsers from "../../../utils/Hooks/useUsers";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import { useAuth } from "../../../Provider/AuthProvider";
import Loader from "../../../components/Loader/Loader";
import NoDataFound from "../../../components/NoData/NoDataFound";
import {
  FaSearch,
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaCreditCard,
  FaUser,
  FaMoneyBillWave,
  FaCheckCircle,
  FaClock,
  FaChartLine,
  FaPlusCircle,
  FaTimes,
  FaSyncAlt,
  FaLayerGroup,
  FaArrowRight,
  FaCalendarAlt,
} from "react-icons/fa";
import { RiMoneyDollarCircleFill } from "react-icons/ri";
import { TbCashBanknote } from "react-icons/tb";

const DailyInstallmentsUsers = () => {
  const {
    isCustomerInstallmentsCardsLoading,
    customerInstallmentCards,
    isCustomerInstallmentsCardsError,
    refetch: refetchCards,
  } = useCustomerInstallmentCards();

  const { isUsersLoading, users, isUsersError, refetch: refetchUsers } = useUsers();
  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const allowedRoles = ["staff", "manager", "admin", "developer"];
  const { user } = useAuth();

  const hasPermission = useMemo(() => {
    if (!user) return false;
    if (Array.isArray(user?.role)) {
      return user.role.some((r) => allowedRoles.includes(String(r).toLowerCase()));
    }
    if (Array.isArray(user?.roles)) {
      return user.roles.some((r) => allowedRoles.includes(String(r).toLowerCase()));
    }
    const r = user?.role || user?.role_name || user?.user_role || "";
    return allowedRoles.includes(String(r).toLowerCase());
  }, [user]);

  const [formData, setFormData] = useState({
    amount: "",
    date: new Date().toISOString().split("T")[0],
  });

  const validate = () => {
    let newErrors = {};
    if (!formData.amount || Number(formData.amount) <= 0) {
      newErrors.amount = "বৈধ টাকার পরিমাণ লিখুন";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Filter only Daily cards
  const DailyInstallmentsCards = useMemo(() => {
    return (customerInstallmentCards || []).filter(
      (card) => (card.remarks || "").trim().toLowerCase() === "daily"
    );
  }, [customerInstallmentCards]);

  // Merge card + customer user
  const cardsWithCustomer = useMemo(() => {
    if (!DailyInstallmentsCards || !users) return [];

    return DailyInstallmentsCards.map((card) => {
      const customer = users.find(
        (u) => String(u.user_id) === String(card.user_id)
      );

      const rawPhoto = customer?.photo || customer?.image || customer?.image_url;
      const photoUrl = rawPhoto
        ? String(rawPhoto).startsWith("http")
          ? rawPhoto
          : `https://management.supplylinkbd.com/${String(rawPhoto).replace(/^\/+/, "")}`
        : null;

      const cardDisplayId = card.card_id ?? card.id;

      return {
        ...card,
        cardDisplayId,
        customer: customer || null,
        photoUrl,
        customerName: customer?.name || "Unknown User",
        customerId: card.user_id || customer?.user_id || "N/A",
        mobile: customer?.mobile || "N/A",
        address: customer?.address || "N/A",
        salePrice: Number(card.sale_price || 0),
        downPayment: Number(card.down_payment || 0),
        dueAmount: Number(card.total_due_amount || 0),
        perAmount: Number(card.per_installment_amount || 0),
        isFullyPaid: card.status === "Fully Paid",
      };
    });
  }, [DailyInstallmentsCards, users]);

  // Financial KPI Metrics
  const stats = useMemo(() => {
    const totalCount = cardsWithCustomer.length;
    const runningCount = cardsWithCustomer.filter((c) => !c.isFullyPaid).length;
    const fullyPaidCount = cardsWithCustomer.filter((c) => c.isFullyPaid).length;
    const totalSalesValue = cardsWithCustomer.reduce(
      (sum, c) => sum + Number(c.salePrice || 0),
      0
    );
    const totalDueValue = cardsWithCustomer.reduce(
      (sum, c) => sum + Number(c.dueAmount || 0),
      0
    );

    return {
      totalCount,
      runningCount,
      fullyPaidCount,
      totalSalesValue,
      totalDueValue,
    };
  }, [cardsWithCustomer]);

  // Filter & Search
  const filteredCards = useMemo(() => {
    let result = cardsWithCustomer;

    // Status tab filter
    if (statusTab === "running") {
      result = result.filter((c) => !c.isFullyPaid);
    } else if (statusTab === "fully_paid") {
      result = result.filter((c) => c.isFullyPaid);
    }

    // Search filter
    if (search.trim()) {
      const term = search.toLowerCase().trim();
      result = result.filter((card) => {
        return (
          card.customerName?.toLowerCase().includes(term) ||
          String(card.cardDisplayId).includes(term) ||
          String(card.id).includes(term) ||
          String(card.customerId).includes(term) ||
          String(card.mobile).includes(term) ||
          card.address?.toLowerCase().includes(term) ||
          card.product_name?.toLowerCase().includes(term)
        );
      });
    }

    // Sort: Running cards first, Fully Paid last
    return result.sort((a, b) => {
      if (a.isFullyPaid && !b.isFullyPaid) return 1;
      if (!a.isFullyPaid && b.isFullyPaid) return -1;
      return Number(a.cardDisplayId || 0) - Number(b.cardDisplayId || 0);
    });
  }, [search, statusTab, cardsWithCustomer]);

  const handleOpenPayModal = (card) => {
    if (card.isFullyPaid) return;
    if (!hasPermission) {
      toast.error("আপনার কিস্তি পেমেন্ট রিসিভ করার অনুমতি নেই ❌");
      return;
    }
    setSelectedCard(card);
    setFormData({
      amount: card.perAmount > 0 ? String(card.perAmount) : "",
      date: new Date().toISOString().split("T")[0],
    });
    setErrors({});
    setShowModal(true);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (!hasPermission) {
      toast.error("আপনার পেমেন্ট রিসিভ করার অনুমতি নেই ❌");
      return;
    }

    setIsSubmitting(true);
    const payload = {
      userId: selectedCard?.user_id || selectedCard?.customerId,
      cardId: selectedCard?.card_id,
      amount: formData.amount,
      date: formData.date || new Date().toISOString().split("T")[0],
      receiver: user?.user_id || user?.id || 1,
    };

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_LOCALHOST_KEY}/DailyInstallments/addDailyInstallment.php`,
        payload
      );

      const data = res.data;
      if (data.success || data.status === "success") {
        toast.success("✅ কিস্তি পেমেন্ট সফলভাবে এন্ট্রি হয়েছে!");
        setFormData({
          amount: "",
          date: new Date().toISOString().split("T")[0],
        });
        setShowModal(false);
        refetchCards?.();
        refetchUsers?.();
      } else {
        toast.error(data.message || "পেমেন্ট এন্ট্রি ব্যর্থ হয়েছে ❌");
      }
    } catch (err) {
      toast.error("সার্ভার বা নেটওয়ার্ক সমস্যা ❌");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = isCustomerInstallmentsCardsLoading || isUsersLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader />
      </div>
    );
  }

  if (isCustomerInstallmentsCardsError || isUsersError) {
    return (
      <div className="p-6">
        <NoDataFound
          message="ডাটা লোড করতে সমস্যা হয়েছে"
          subMessage="দয়া করে রিলোড দিন অথবা ইন্টারনেট কানেকশন চেক করুন"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-2 pb-16 text-slate-100">
      {/* ===== HERO HEADER ===== */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-gradient-to-br from-indigo-500/20 via-blue-500/20 to-cyan-500/20 border border-indigo-500/30 text-indigo-400 shadow-lg shadow-indigo-500/10">
              <TbCashBanknote className="text-2xl" />
            </span>
            <div>
              <h1 className="text-xl md:text-2xl font-black bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                ডেইলি কিস্তি গ্রাহক তালিকা
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                দৈনিক কিস্তির কার্ডসমূহ পরিচালনা, কিস্তি গ্রহণ ও হিসাব মনিটরিং
              </p>
            </div>
          </div>
        </div>

        {/* Top Search & Refresh */}
        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-80">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
            <input
              type="text"
              placeholder="গ্রাহকের নাম, কার্ড আইডি, ফোন বা ঠিকানা..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl bg-slate-900/90 border border-slate-700/80 hover:border-indigo-500 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 shadow-sm transition"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <button
            onClick={() => {
              refetchCards?.();
              refetchUsers?.();
            }}
            title="Refresh Data"
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition"
          >
            <FaSyncAlt className="text-xs" />
          </button>
        </div>
      </div>

      {/* ===== FINANCIAL KPI CARDS ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Daily Cards */}
        <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-slate-900/90 via-indigo-950/20 to-slate-950/90 border border-indigo-500/30 shadow-lg shadow-indigo-500/5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">
              মোট ডেইলি কার্ড
            </span>
            <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
              <FaLayerGroup className="text-xs" />
            </span>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-black font-mono text-white">
              {stats.totalCount} <span className="text-xs text-slate-400 font-normal">টি</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400">
            ডেইলি ক্যাটাগরির অন্তর্ভুক্ত
          </div>
        </div>

        {/* KPI 2: Active Running */}
        <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-slate-900/90 via-cyan-950/20 to-slate-950/90 border border-cyan-500/30 shadow-lg shadow-cyan-500/5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider">
              চলতি কিস্তি (Running)
            </span>
            <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
              <FaClock className="text-xs" />
            </span>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-black font-mono text-cyan-300">
              {stats.runningCount} <span className="text-xs text-slate-400 font-normal">টি</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-800/80 text-[10px] text-cyan-400/80">
            বর্তমানে চলমান রয়েছে
          </div>
        </div>

        {/* KPI 3: Total Portfolio Value */}
        <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-slate-900/90 via-emerald-950/20 to-slate-950/90 border border-emerald-500/30 shadow-lg shadow-emerald-500/5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">
              মোট সেলস মূল্য
            </span>
            <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <FaMoneyBillWave className="text-xs" />
            </span>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-black font-mono text-emerald-400">
              ৳ {stats.totalSalesValue.toLocaleString()}
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-800/80 text-[10px] text-emerald-400/80">
            ডেইলি কার্ডের মোট বিক্রয়মূল্য
          </div>
        </div>

        {/* KPI 4: Fully Paid */}
        <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-slate-900/90 via-teal-950/20 to-slate-950/90 border border-teal-500/30 shadow-lg shadow-teal-500/5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-teal-300 uppercase tracking-wider">
              পরিশোধিত (Fully Paid)
            </span>
            <span className="p-1.5 rounded-lg bg-teal-500/20 text-teal-400">
              <FaCheckCircle className="text-xs" />
            </span>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-black font-mono text-teal-300">
              {stats.fullyPaidCount} <span className="text-xs text-slate-400 font-normal">টি</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-800/80 text-[10px] text-teal-400/80">
            সম্পূর্ণ পরিশোধিত কার্ড
          </div>
        </div>
      </div>

      {/* ===== FILTER TABS ===== */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-slate-900/80 border border-slate-800/90 w-fit">
        <button
          onClick={() => setStatusTab("all")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${statusTab === "all"
              ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-500/20"
              : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
        >
          <span>সব কার্ড</span>
          <span className="px-1.5 py-0.5 rounded-md bg-black/30 font-mono text-[10px]">
            {stats.totalCount}
          </span>
        </button>

        <button
          onClick={() => setStatusTab("running")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${statusTab === "running"
              ? "bg-cyan-600 text-white shadow-md shadow-cyan-500/20"
              : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
        >
          <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
          <span>চলমান কিস্তি</span>
          <span className="px-1.5 py-0.5 rounded-md bg-black/30 font-mono text-[10px]">
            {stats.runningCount}
          </span>
        </button>

        <button
          onClick={() => setStatusTab("fully_paid")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${statusTab === "fully_paid"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
              : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>সম্পূর্ণ পরিশোধিত</span>
          <span className="px-1.5 py-0.5 rounded-md bg-black/30 font-mono text-[10px]">
            {stats.fullyPaidCount}
          </span>
        </button>
      </div>

      {/* ===== CARDS GRID ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCards.length === 0 ? (
          <div className="col-span-full py-12">
            <NoDataFound
              message="কোনো ডেইলি কার্ড পাওয়া যায়নি"
              subMessage="অনুগ্রহ করে সার্চ কুয়েরি বা ফিল্টার পরিবর্তন করে চেষ্টা করুন"
            />
          </div>
        ) : (
          filteredCards.map((card) => {
            return (
              <div
                key={card.id}
                className="group relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900/95 via-[#0c1427]/90 to-slate-950/95 border border-slate-800/90 hover:border-indigo-500/50 hover:shadow-[0_12px_35px_rgba(99,102,241,0.15)] transition-all duration-300 p-5 flex flex-col justify-between space-y-4 shadow-lg"
              >
                {/* Top Accent Gradient Bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-cyan-500 to-transparent opacity-80 group-hover:opacity-100 transition-opacity"></div>

                {/* Top Profile & Price Header */}
                <div className="space-y-3.5">
                  <div className="flex items-start justify-between gap-3">
                    {/* User Profile */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <div className="w-13 h-13 rounded-2xl overflow-hidden bg-slate-800 border-2 border-indigo-500/40 p-0.5 shadow-md">
                          {card.photoUrl ? (
                            <img
                              src={card.photoUrl}
                              alt={card.customerName}
                              className="w-full h-full object-cover rounded-[13px]"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(card.customerName || "U")}&background=312e81&color=818cf8`;
                              }}
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-tr from-indigo-950 to-slate-900 flex items-center justify-center text-indigo-300 font-extrabold text-base rounded-[13px]">
                              {card.customerName?.charAt(0).toUpperCase() || "U"}
                            </div>
                          )}
                        </div>
                        {/* Active status pulse dot */}
                        <span
                          className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${card.isFullyPaid ? "bg-emerald-500" : "bg-cyan-500 animate-pulse"
                            }`}
                        ></span>
                      </div>

                      <div className="min-w-0">
                        <h3 className="font-bold text-white text-sm truncate group-hover:text-indigo-300 transition">
                          {card.customerName}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                            ID: #{card.customerId}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                            Daily
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Price Badge */}
                    <div className="text-right shrink-0">
                      <div className="text-lg font-black font-mono text-indigo-300">
                        ৳ {card.salePrice.toLocaleString()}
                      </div>
                      <span className="text-[10px] text-slate-400 block font-medium">
                        মোট বিক্রয়মূল্য
                      </span>
                    </div>
                  </div>

                  {/* Badges / Quick Meta Details */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-300 bg-slate-950/60 px-2.5 py-1.5 rounded-xl border border-slate-800">
                      <FaCreditCard className="text-[11px] text-cyan-400 shrink-0" />
                      <span className="truncate font-mono font-bold text-cyan-200">
                        কার্ড #{card.cardDisplayId}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-300 bg-slate-950/60 px-2.5 py-1.5 rounded-xl border border-slate-800">
                      <FaPhoneAlt className="text-[10px] text-emerald-400 shrink-0" />
                      <span className="truncate font-mono text-slate-300">
                        {card.mobile}
                      </span>
                    </div>

                    <div className="col-span-2 flex items-center gap-1.5 text-slate-400 bg-slate-950/40 px-2.5 py-1.5 rounded-xl border border-slate-800/60 text-[11px]">
                      <FaMapMarkerAlt className="text-[10px] text-amber-400 shrink-0" />
                      <span className="truncate">{card.address}</span>
                    </div>
                  </div>

                  {/* Financial Breakdown Progress */}
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/90 flex items-center justify-between text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase">
                        ডাউন পেমেন্ট
                      </span>
                      <span className="font-bold text-yellow-300">
                        ৳ {card.downPayment.toLocaleString()}
                      </span>
                    </div>

                    {card.perAmount > 0 && (
                      <div className="text-center">
                        <span className="text-[10px] text-slate-500 block uppercase">
                          কিস্তির হার
                        </span>
                        <span className="font-bold text-cyan-300">
                          ৳ {card.perAmount.toLocaleString()}
                        </span>
                      </div>
                    )}

                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block uppercase">
                        স্ট্যাটাস
                      </span>
                      <span
                        className={`font-bold text-xs ${card.isFullyPaid ? "text-emerald-400" : "text-cyan-400"
                          }`}
                      >
                        {card.status || "Running"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2">
                  <Link
                    to={`${card.cardDisplayId}`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold border border-slate-700 transition active:scale-95 shadow-sm"
                  >
                    <span>হিসাব বিবরণ (Details)</span>
                    <FaArrowRight className="text-[10px]" />
                  </Link>

                  <button
                    onClick={() => handleOpenPayModal(card)}
                    disabled={card.isFullyPaid || !hasPermission}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md ${card.isFullyPaid
                        ? "bg-slate-800/60 text-slate-500 border border-slate-800 cursor-not-allowed"
                        : !hasPermission
                          ? "bg-rose-950/40 text-rose-400 border border-rose-800/50 cursor-not-allowed"
                          : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/20 active:scale-95 cursor-pointer"
                      }`}
                  >
                    <RiMoneyDollarCircleFill className="text-sm" />
                    <span>
                      {card.isFullyPaid
                        ? "Paid"
                        : !hasPermission
                          ? "No Access"
                          : "কিস্তি জমা (Pay)"}
                    </span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ===== QUICK PAY MODAL ===== */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div
            className="fixed inset-0"
            onClick={() => !isSubmitting && setShowModal(false)}
          ></div>

          <div
            className="relative bg-gradient-to-b from-slate-900 via-[#0b1324] to-slate-950 w-full max-w-md rounded-3xl p-6 border border-slate-700 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <RiMoneyDollarCircleFill className="text-lg" />
                </span>
                <div>
                  <h2 className="text-base font-bold text-white">
                    ডেইলি কিস্তি কালেকশন এন্ট্রি
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    গ্রাহকের অ্যাকাউন্টে দৈনিক কিস্তির টাকা জমা করুন
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                disabled={isSubmitting}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <FaTimes className="text-xs" />
              </button>
            </div>

            {/* Customer Summary Card */}
            <div className="my-4 p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-indigo-950 border border-indigo-800 flex items-center justify-center text-indigo-300 font-bold shrink-0">
                  {selectedCard?.customerName?.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-white text-xs truncate">
                    {selectedCard?.customerName}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    User ID: #{selectedCard?.customerId} | Card #{selectedCard?.cardDisplayId}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[10px] text-slate-500 block">বিক্রয়মূল্য</span>
                <span className="font-mono font-bold text-xs text-indigo-300">
                  ৳ {selectedCard?.salePrice?.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitForm} className="space-y-4">
              {/* Amount Input */}
              <div>
                <label className="text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>টাকার পরিমাণ (৳) *</span>
                  {selectedCard?.perAmount > 0 && (
                    <span className="text-[10px] text-cyan-400 font-normal">
                      নির্ধারিত: ৳{selectedCard.perAmount}
                    </span>
                  )}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">
                    ৳
                  </span>
                  <input
                    type="number"
                    step="any"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    placeholder="উদাহরণ: 500"
                    autoFocus
                    className={`w-full pl-8 pr-4 py-2.5 text-sm font-mono font-bold rounded-xl bg-slate-950 border ${errors.amount
                        ? "border-rose-500 text-rose-300"
                        : "border-slate-700 text-white focus:border-emerald-500"
                      } focus:outline-none focus:ring-2 focus:ring-emerald-500/40`}
                  />
                </div>
                {errors.amount && (
                  <p className="text-rose-400 text-[11px] mt-1 font-medium">
                    {errors.amount}
                  </p>
                )}

                {/* Quick Amount Suggestion Chips */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  {[200, 300, 500, 1000, 1500, 2000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, amount: String(amt) })
                      }
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-mono font-bold text-slate-300 border border-slate-700 transition"
                    >
                      +{amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Input */}
              <div>
                <label className="text-xs font-bold text-slate-300 mb-1.5 block">
                  জমার তারিখ (Collection Date)
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className="w-full px-3.5 py-2 text-xs font-mono rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition"
                >
                  বাতিল (Cancel)
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 transition active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? "জমা হচ্ছে..." : "পেমেন্ট নিশ্চিত করুন (Submit)"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyInstallmentsUsers;

