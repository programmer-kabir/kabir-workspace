import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import useUsers from "../../../utils/Hooks/useUsers";
import useCustomerInstallmentCards from "../../../utils/Hooks/useCustomerInstallmentCards";
import useCustomerInstallmentPayments from "../../../utils/Hooks/Customers/useCustomerInstallmentPayments";
import {
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiX,
  FiClock,
  FiCheckCircle,
  FiPrinter,
  FiCalendar,
  FiDollarSign,
  FiUser,
  FiPhone,
  FiMapPin,
  FiCreditCard,
  FiCheck,
  FiAlertTriangle,
  FiRefreshCw,
  FiLock,
  FiTrendingUp,
  FiTrendingDown
} from "react-icons/fi";
import { FaMoneyBillWave, FaReceipt, FaStamp } from "react-icons/fa";
import { toast } from "react-toastify";
import LuxuryActionModal from "../../../components/Modal/LuxuryActionModal";
import LuxuryToast from "../../../components/Modal/LuxuryToast";
import BackButton from "../../../components/BackButton/BackButton";
import { useAuth } from "../../../Provider/AuthProvider";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

const DailyInstallmentsUsersDetails = () => {
  const { id } = useParams();
  const { users = [], isUsersLoading } = useUsers();
  const { user } = useAuth();
  const { customerInstallmentCards = [] } = useCustomerInstallmentCards();
  const { customerInstallmentPayments = [] } = useCustomerInstallmentPayments();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updateReason, setUpdateReason] = useState("");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receiptModal, setReceiptModal] = useState(null);
  const [luxuryToast, setLuxuryToast] = useState(null);
  const [feedbackModal, setFeedbackModal] = useState({
    isOpen: false,
    type: "confirm",
    variant: "cyan",
    title: "",
    description: "",
    confirmText: "ঠিক আছে",
    cancelText: "বাতিল",
    showCancel: false,
    onConfirm: null,
    onClose: () => setFeedbackModal((prev) => ({ ...prev, isOpen: false })),
  });

  // Role checks
  const userRoles = Array.isArray(user?.role) ? user.role : [user?.role];
  const isAdminOrDev = userRoles.some((r) =>
    ["admin", "developer"].includes(String(r || "").toLowerCase())
  );
  const isManagerOrStaff = userRoles.some((r) =>
    ["manager", "staff"].includes(String(r || "").toLowerCase())
  );

  // Current Card & Customer
  const currentCard = customerInstallmentCards.find(
    (card) => Number(card.id) === Number(id)
  );

  const currentUser = users.find(
    (u) => Number(u.id) === Number(currentCard?.user_id)
  );

  // Fetch installments for this card
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `${
          import.meta.env.VITE_LOCALHOST_KEY ||
          "https://api.supplylinkbd.com/apis"
        }/DailyInstallments/getDailyInstallments.php`
      );
      const json = await res.json();
      const filtered = (json.data || []).filter(
        (item) => String(item.cardId) === String(id)
      );
      setData(filtered);
    } catch (err) {
      console.error(err);
      toast.error("ডাটা লোড করতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  // Helper to get User Name & Avatar by ID
  const getUserInfo = (userId) => {
    const found = users.find((u) => Number(u.id) === Number(userId));
    if (!found) {
      if (Number(user?.id) === Number(userId) && user?.name) {
        return {
          name: user.name,
          cleanName: cleanName(user.name),
          photo: user.photo ? `https://api.supplylinkbd.com/${user.photo}` : null,
          mobile: user.mobile || null,
          role: Array.isArray(user.role) ? user.role[0] : user.role,
        };
      }
      return {
        name: `কর্মী #${userId || "—"}`,
        cleanName: `কর্মী #${userId || "—"}`,
        photo: null,
        mobile: null,
        role: "Staff",
      };
    }

    const clean = (found.name || "")
      .replace(/^মোঃ\s*/g, "")
      .replace(/^Md\.?\s*/gi, "")
      .replace(/^Mohammad\s*/gi, "")
      .trim();

    return {
      name: found.name,
      cleanName: clean,
      photo: found.photo
        ? `https://api.supplylinkbd.com/${found.photo}`
        : null,
      mobile: found.mobile,
      role: Array.isArray(found.role) ? found.role[0] : found.role,
    };
  };

  // Calculations
  const totalPaid = useMemo(() => {
    return data.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }, [data]);

  const totalInstallments = data.length;
  const expectedPayment = Number(currentCard?.sale_price || 0);
  const totalDue = Math.max(0, expectedPayment - totalPaid);
  const progressPercent = expectedPayment > 0
    ? Math.min(100, Math.round((totalPaid / expectedPayment) * 100))
    : 0;

  // Search & Sorting
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const text = search.toLowerCase().trim();
      if (!text) return true;
      const receiverInfo = getUserInfo(item.receiver);
      return (
        String(item.date).toLowerCase().includes(text) ||
        String(item.amount).toLowerCase().includes(text) ||
        receiverInfo.name.toLowerCase().includes(text) ||
        receiverInfo.cleanName.toLowerCase().includes(text) ||
        String(item.receiver).includes(text)
      );
    });
  }, [data, search, users]);

  const finalData = useMemo(() => {
    return [...filteredData].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );
  }, [filteredData]);

  // Handle Edit Click
  const openEditModal = (row) => {
    setEditingRow({ ...row, originalAmount: Number(row.amount || 0) });
    setUpdateReason(row.update_reason || "");
    setIsEditOpen(true);
  };

  // Handle Submit Edit (Direct for Admin/Dev, Pending Request for Staff/Manager)
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!updateReason.trim()) {
      toast.error("সংশোধনের কারণ উল্লেখ করা আবশ্যক!");
      return;
    }

    if (!editingRow.amount || Number(editingRow.amount) <= 0) {
      toast.error("বৈধ টাকার পরিমাণ লিখুন!");
      return;
    }

    try {
      setIsSubmitting(true);

      if (isAdminOrDev) {
        // Direct update for Admin / Developer
        const res = await fetch(
          `${import.meta.env.VITE_LOCALHOST_KEY}/DailyInstallments/updateDailyInstallment.php`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id: editingRow.id,
              amount: editingRow.amount,
              date: editingRow.date,
              receiver: editingRow.receiver,
              cardId: editingRow.cardId,
              updated_by: user?.id,
              update_reason: updateReason,
            }),
          }
        );

        const result = await res.json();
        if (!result?.success) {
          toast.error(result?.message || "কিস্তি আপডেট করা যায়নি।");
          return;
        }

        setLuxuryToast({
          title: "সফলভাবে আপডেট হয়েছে! ✅",
          message: "কিস্তির তথ্য সফলভাবে আপডেট হয়েছে এবং ক্যাশ সিঙ্ক হয়েছে।",
          tag: `কার্ড #${editingRow.cardId}`,
          amount: editingRow.amount,
          type: "success",
        });
        setIsEditOpen(false);
        fetchData();
      } else {
        // Request for Approval for Staff/Manager
        const res = await fetch(
          `${import.meta.env.VITE_LOCALHOST_KEY}/DailyInstallments/request_daily_installment_edit.php`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              installment_id: editingRow.id,
              new_amount: editingRow.amount,
              new_date: editingRow.date,
              request_reason: updateReason,
              requested_by: user?.id,
            }),
          }
        );

        const result = await res.json();
        if (!result?.success) {
          toast.error(result?.error || result?.message || "অনুরোধ পাঠানো যায়নি।");
          return;
        }

        setLuxuryToast({
          title: "অনুরোধ পাঠানো হয়েছে! ⏳",
          message: "কিস্তি সংশোধনের অনুরোধ সফলভাবে পাঠানো হয়েছে। অনুমোদনের পর আপডেট হবে।",
          tag: `কার্ড #${editingRow.cardId}`,
          amount: editingRow.amount,
          type: "warning",
        });
        setIsEditOpen(false);
        fetchData();
      }
    } catch (err) {
      toast.error(err?.message || "সার্ভারের সাথে সংযোগ স্থাপন করা যায়নি।");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Click (Strictly Developer & Admin only)
  const handleDelete = (row) => {
    if (!isAdminOrDev) {
      toast.error("শুধুমাত্র অ্যাডমিন এবং ডেভেলপার কিস্তি মুছতে পারেন ❌");
      return;
    }

    setFeedbackModal({
      isOpen: true,
      type: "confirm",
      variant: "danger",
      title: "কিস্তি Delete করবেন?",
      description: `কার্ড #${row.cardId} এর ৳${Number(row.amount).toLocaleString("en-IN")} টাকার কিস্তি এবং সংশ্লিষ্ট ক্যাশ ইন রেকর্ড সম্পূর্ণ মুছে ফেলা হবে। আপনি কি নিশ্চিত?`,
      confirmText: "হ্যাঁ, মুছে ফেলুন",
      cancelText: "বাতিল",
      showCancel: true,
      onConfirm: async () => {
        try {
          const res = await fetch(
            `${import.meta.env.VITE_LOCALHOST_KEY}/DailyInstallments/deleteDailyInstallment.php`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                id: Number(row.id),
                user_id: user?.id,
              }),
            }
          );

          const result = await res.json();
          setFeedbackModal((prev) => ({ ...prev, isOpen: false }));

          if (!result?.success) {
            toast.error(result?.message || "কিস্তি ডিলিট করতে সমস্যা হয়েছে।");
            return;
          }

          setData((prev) => prev.filter((item) => item.id !== row.id));
          setLuxuryToast({
            title: "সফলভাবে মুছে ফেলা হয়েছে! ✅",
            message: "কিস্তি ও সংশ্লিষ্ট ক্যাশ সফলভাবে মুছে ফেলা হয়েছে।",
            tag: `কার্ড #${row.cardId}`,
            amount: row.amount,
            type: "success",
          });
        } catch (e) {
          setFeedbackModal((prev) => ({ ...prev, isOpen: false }));
          toast.error("সার্ভারের সাথে সংযোগ স্থাপন করা যায়নি।");
        }
      },
      onClose: () => setFeedbackModal((prev) => ({ ...prev, isOpen: false })),
    });
  };

  let runningTotal = 0;

  return (
    <div className="min-h-screen text-slate-100 space-y-6 pb-12">
      {/* ================= TOP BREADCRUMB & HEADER ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <BackButton />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              দৈনিক কিস্তি বিবরণী
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-mono">
                কার্ড #{id}
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              এই কার্ডের সকল দৈনিক কিস্তি আদায়, রসিদ এবং সংশোধনের ইতিহাস
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition active:scale-95 flex items-center gap-1.5 shadow"
          >
            <FiPrinter className="text-sm text-cyan-400" />
            <span>প্রিন্ট ভিউ</span>
          </button>
          <Link
            to="/DailyInstallments/daily_installments_users"
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition active:scale-95 flex items-center gap-1.5 shadow shadow-indigo-950/50"
          >
            <FiCreditCard className="text-sm" />
            <span>সকল কার্ড</span>
          </Link>
        </div>
      </div>

      {/* ================= CUSTOMER DOSSIER BANNER ================= */}
      <div className="rounded-2xl bg-gradient-to-r from-[#0c1322] via-[#0e1628] to-[#070b14] border border-white/[0.08] p-5 shadow-xl flex flex-col md:flex-row items-center justify-between gap-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative shrink-0">
            <img
              src={
                currentUser?.photo
                  ? `https://api.supplylinkbd.com/${currentUser.photo}`
                  : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      currentUser?.name || "User"
                    )}&background=0f172a&color=38bdf8&bold=true`
              }
              alt="customer"
              className="w-16 h-16 rounded-2xl border-2 border-white/15 object-cover shadow-lg"
            />
            <span
              className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#0c1322] ${
                currentCard?.status === "Fully Paid"
                  ? "bg-emerald-400"
                  : "bg-cyan-400"
              }`}
            />
          </div>

          <div className="min-w-0">
            <h2 className="text-lg font-bold text-white tracking-wide truncate">
              {currentUser?.name || "অজ্ঞাত গ্রাহক"}
            </h2>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 mt-1">
              <span className="font-mono text-cyan-300 font-semibold">
                গ্রাহক ID: #{currentUser?.id || currentCard?.user_id}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 font-mono text-slate-300">
                <FiPhone className="text-slate-500 text-[10px]" />
                {currentUser?.mobile || "ফোন নেই"}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-slate-400 truncate max-w-xs">
                <FiMapPin className="text-slate-500 text-[10px]" />
                {currentUser?.address || "ঠিকানা নেই"}
              </span>
            </div>
          </div>
        </div>

        {/* Card Status & Progress */}
        <div className="w-full md:w-auto flex md:flex-col items-center md:items-end justify-between gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-white/[0.06]">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono">
              {Number(currentCard?.is_daily) === 1 ? "দৈনিক কিস্তি" : (currentCard?.remarks || "Daily")}
            </span>
            {currentCard?.status === "Fully Paid" ? (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                পরিশোধিত (Fully Paid)
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                চলমান কিস্তি (Running)
              </span>
            )}
          </div>
          <div className="text-right text-xs text-slate-400 font-mono">
            অগ্রগতি: <strong className="text-cyan-400">{progressPercent}%</strong>
          </div>
        </div>
      </div>

      {/* ================= METRIC KPI TILES ================= */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-[#080d1a] border border-white/[0.08] shadow-lg">
          <p className="text-slate-400 text-xs flex items-center justify-between">
            <span>মোট কিস্তির সংখ্যা</span>
            <FiCalendar className="text-slate-500" />
          </p>
          <h2 className="text-2xl font-bold font-mono text-white mt-1">
            {totalInstallments} টি
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">আদায়কৃত কিস্তির সংখ্যা</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#080d1a] border border-white/[0.08] shadow-lg">
          <p className="text-slate-400 text-xs flex items-center justify-between">
            <span>নির্ধারিত মূল্য (Expected)</span>
            <FiCreditCard className="text-indigo-400" />
          </p>
          <h2 className="text-2xl font-bold font-mono text-indigo-400 mt-1">
            ৳{expectedPayment.toLocaleString("en-IN")}
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">মোট লক্ষ্যমাত্রা</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#080d1a] border border-white/[0.08] shadow-lg">
          <p className="text-slate-400 text-xs flex items-center justify-between">
            <span>মোট আদায় (Total Paid)</span>
            <FiDollarSign className="text-emerald-400" />
          </p>
          <h2 className="text-2xl font-bold font-mono text-emerald-400 mt-1">
            ৳{totalPaid.toLocaleString("en-IN")}
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            সরাসরি ক্যাশ ইনভুক্ত
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#080d1a] border border-white/[0.08] shadow-lg">
          <p className="text-slate-400 text-xs flex items-center justify-between">
            <span>অবশিষ্ট বকেয়া (Due)</span>
            <FiClock className="text-rose-400" />
          </p>
          <h2 className="text-2xl font-bold font-mono text-rose-400 mt-1">
            ৳{totalDue.toLocaleString("en-IN")}
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {totalDue <= 0 ? "কোনো বকেয়া নেই" : "পরিশোধের অপেক্ষায়"}
          </p>
        </div>
      </div>

      {/* ================= SEARCH BAR ================= */}
      <div className="relative">
        <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="তারিখ, টাকার পরিমাণ বা সংগ্রাহকের নাম দিয়ে খুঁজুন..."
          className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-[#080d1a] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition shadow-inner"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
          >
            <FiX className="text-xs" />
          </button>
        )}
      </div>

      {/* ================= INSTALLMENTS TABLE ================= */}
      <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#070b16] shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-white/[0.08] bg-[#0a1020] text-slate-400 font-semibold text-[11px]">
                <th className="py-3.5 px-4 min-w-[50px]">#</th>
                <th className="py-3.5 px-4 min-w-[120px]">আদায়ের তারিখ</th>
                <th className="py-3.5 px-4 min-w-[130px] text-right">পরিমাণ (৳)</th>
                <th className="py-3.5 px-4 min-w-[130px] text-right">ক্রমপুঞ্জিত মোট</th>
                <th className="py-3.5 px-4 min-w-[200px]">সংগ্রাহক (Receiver)</th>
                <th className="py-3.5 px-4 min-w-[160px]">স্ট্যাটাস ও সংশোধন</th>
                <th className="py-3.5 px-4 min-w-[130px] text-center">অ্যাকশন</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/[0.04] text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FiRefreshCw className="h-6 w-6 animate-spin text-cyan-400" />
                      <span className="text-xs">ডাটা লোড হচ্ছে...</span>
                    </div>
                  </td>
                </tr>
              ) : finalData.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <FiClock className="h-8 w-8 text-slate-600 mb-2" />
                      <span className="text-sm font-medium text-slate-400">
                        কোনো কিস্তির রেকর্ড পাওয়া যায়নি
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                finalData.map((item, index) => {
                  runningTotal += Number(item.amount || 0);
                  const receiverInfo = getUserInfo(item.receiver);
                  const updaterInfo = item.update_by
                    ? getUserInfo(item.update_by)
                    : null;
                  const hasPending = Boolean(item.has_pending_edit);

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-white/[0.02] transition-colors ${
                        hasPending ? "bg-amber-500/[0.03]" : ""
                      }`}
                    >
                      {/* 1. Index */}
                      <td className="py-3.5 px-4 font-mono text-slate-500">
                        {index + 1}
                      </td>

                      {/* 2. Date */}
                      <td className="py-3.5 px-4 font-mono text-slate-300 font-medium">
                        {item.date}
                      </td>

                      {/* 3. Amount */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400 text-sm">
                        ৳{Number(item.amount).toLocaleString("en-IN")}
                      </td>

                      {/* 4. Running Total */}
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-cyan-300">
                        ৳{runningTotal.toLocaleString("en-IN")}
                      </td>

                      {/* 5. Receiver with Full Name & Avatar (NOT RAW ID) */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          {receiverInfo.photo ? (
                            <img
                              src={receiverInfo.photo}
                              alt={receiverInfo.cleanName}
                              className="w-7 h-7 rounded-full object-cover border border-white/10 shrink-0"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold text-xs shrink-0 font-mono">
                              {receiverInfo.cleanName.charAt(0) || "U"}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-200 text-xs truncate">
                              {receiverInfo.cleanName}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              ID: {item.receiver}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 6. Status & Pending Edit Note */}
                      <td className="py-3.5 px-4">
                        {hasPending ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/35 text-amber-300 text-[11px] font-semibold animate-pulse">
                            <FiClock className="text-xs" />
                            <span>সংশোধন পেন্ডিং (৳{item.pending_new_amount})</span>
                          </div>
                        ) : item.update_at ? (
                          <div className="text-[10px] space-y-0.5">
                            <span className="inline-block px-2 py-0.5 rounded bg-yellow-500/15 border border-yellow-500/30 text-yellow-300 font-semibold">
                              সংশোধিত
                            </span>
                            {updaterInfo && (
                              <div className="text-slate-400">
                                <strong>দ্বারা:</strong> {updaterInfo.cleanName}
                              </div>
                            )}
                            {item.update_reason && (
                              <div
                                className="text-slate-400 truncate max-w-[140px]"
                                title={item.update_reason}
                              >
                                {item.update_reason}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold">
                            ক্যাশ ইনভুক্ত
                          </span>
                        )}
                      </td>

                      {/* 7. Action Buttons */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Digital Voucher Modal */}
                          <button
                            title="ডিজিটাল রসিদ দেখুন"
                            onClick={() =>
                              setReceiptModal({
                                receiptNo: item.id,
                                customerName: currentUser?.name || "গ্রাহক",
                                customerId: currentUser?.id || currentCard?.user_id,
                                cardId: item.cardId,
                                amount: item.amount,
                                date: item.date,
                                collectorName: receiverInfo.cleanName,
                                collectorId: item.receiver,
                                refId: `daily_installment_${item.id}`,
                                createdAt: item.created_at || item.date,
                              })
                            }
                            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 flex items-center justify-center transition active:scale-95 cursor-pointer"
                          >
                            <FaReceipt className="text-xs text-emerald-400" />
                          </button>

                          {/* Edit Button */}
                          <button
                            title={
                              isAdminOrDev
                                ? "সরাসরি কিস্তি এডিট করুন"
                                : "কিস্তি সংশোধনের অনুরোধ পাঠান"
                            }
                            onClick={() => openEditModal(item)}
                            className="w-8 h-8 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/25 flex items-center justify-center transition active:scale-95 cursor-pointer"
                          >
                            <FiEdit2 className="text-xs" />
                          </button>

                          {/* Delete Button STRICTLY Admin & Developer ONLY */}
                          {isAdminOrDev && (
                            <button
                              title="কিস্তি মুছে ফেলুন (অ্যাডমিন/ডেভেলপার শুধুমাত্র)"
                              onClick={() => handleDelete(item)}
                              className="w-8 h-8 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/25 flex items-center justify-center transition active:scale-95 cursor-pointer"
                            >
                              <FiTrash2 className="text-xs" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Table Footer */}
            {finalData.length > 0 && (
              <tfoot>
                <tr className="border-t border-white/[0.08] bg-[#0a1020] font-semibold text-xs">
                  <td colSpan="2" className="py-3 px-4 text-center text-slate-400">
                    সর্বমোট আদায়কৃত কিস্তি ({finalData.length} টি)
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400 text-sm">
                    ৳{totalPaid.toLocaleString("en-IN")}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-cyan-400">
                    ৳{totalPaid.toLocaleString("en-IN")}
                  </td>
                  <td colSpan="3" />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* ================= EDIT / REQUEST EDIT MODAL ================= */}
      {isEditOpen &&
        editingRow &&
        createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#020617]/85 backdrop-blur-xl"
              onClick={() => setIsEditOpen(false)}
            />

            {/* Modal Dialog Card */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 25 }}
              animate={{
                scale: 1,
                opacity: 1,
                y: 0,
                transition: { type: "spring", stiffness: 380, damping: 28 },
              }}
              exit={{ scale: 0.92, opacity: 0, y: 15, transition: { duration: 0.18 } }}
              className="relative w-full max-w-lg rounded-3xl bg-gradient-to-b from-[#0c1427] via-[#090f1f] to-[#060a16] border border-cyan-500/25 p-6 sm:p-7 shadow-[0_25px_80px_rgba(0,0,0,0.95)] text-white space-y-5 overflow-hidden before:absolute before:-inset-px before:rounded-3xl before:bg-gradient-to-b before:from-cyan-500/20 before:via-transparent before:to-emerald-500/20 before:pointer-events-none"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top Glow Ambient Halo */}
              <div className="absolute -top-24 -right-24 w-52 h-52 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-52 h-52 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

              {/* Modal Header */}
              <div className="relative flex items-center justify-between pb-3.5 border-b border-white/[0.08]">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500/20 via-cyan-500/20 to-emerald-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300 shadow-lg shadow-cyan-950/60">
                    <FiEdit2 className="text-base" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-extrabold text-white tracking-wide flex items-center gap-2">
                      <span className="bg-gradient-to-r from-cyan-300 via-teal-200 to-emerald-300 bg-clip-text text-transparent">
                        {isAdminOrDev
                          ? "দৈনিক কিস্তি সরাসরি এডিট"
                          : "কিস্তি সংশোধনের অনুরোধ"}
                      </span>
                      {!isAdminOrDev && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-mono uppercase tracking-wider">
                          Approval Required
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {isAdminOrDev
                        ? "অ্যাডমিন বা ডেভেলপার হিসেবে সরাসরি পরিবর্তন কার্যকর হবে"
                        : "অনুরোধটি অ্যাডমিন অনুমোদন করলে কিস্তি ও ক্যাশ আপডেট হবে"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 flex items-center justify-center transition-all hover:rotate-90"
                >
                  <FiX className="text-sm" />
                </button>
              </div>

              {/* Customer Dossier Card in Edit Modal */}
              <div className="relative p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-slate-900/90 to-slate-950/90 border border-white/10 shadow-inner flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative">
                    <img
                      src={
                        currentUser?.photo
                          ? `https://api.supplylinkbd.com/${currentUser.photo}`
                          : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              currentUser?.name || "Customer"
                            )}&background=0f172a&color=38bdf8&bold=true`
                      }
                      alt="customer"
                      className="w-11 h-11 rounded-xl object-cover border border-cyan-500/30 shadow-md shrink-0"
                    />
                    <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-950" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-bold text-white block truncate">
                      {currentUser?.name || "গ্রাহক"}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono block">
                      কার্ড #{id} • {currentUser?.mobile || `ID #${currentUser?.id || currentCard?.user_id}`}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">
                    পূর্বের কিস্তি
                  </span>
                  <span className="text-sm font-mono font-extrabold text-emerald-400">
                    ৳{Number(editingRow?.originalAmount || editingRow?.amount || 0).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleUpdate} className="space-y-4">
                {/* Amount with Real-time Comparison Preview */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-200">
                      সংশোধিত টাকার পরিমাণ (৳) *
                    </label>
                    {editingRow?.originalAmount > 0 &&
                      Number(editingRow.amount || 0) > 0 &&
                      Number(editingRow.amount) !== Number(editingRow.originalAmount) && (
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-md flex items-center gap-1 ${
                            Number(editingRow.amount) > Number(editingRow.originalAmount)
                              ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                              : "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                          }`}
                        >
                          {Number(editingRow.amount) > Number(editingRow.originalAmount) ? (
                            <>
                              <FiTrendingUp className="text-[10px]" />
                              +৳{(Number(editingRow.amount) - Number(editingRow.originalAmount)).toLocaleString("en-IN")} বাড়বে
                            </>
                          ) : (
                            <>
                              <FiTrendingDown className="text-[10px]" />
                              -৳{(Number(editingRow.originalAmount) - Number(editingRow.amount)).toLocaleString("en-IN")} কমবে
                            </>
                          )}
                        </span>
                      )}
                  </div>

                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      value={editingRow?.amount || ""}
                      onChange={(e) =>
                        setEditingRow({ ...editingRow, amount: e.target.value })
                      }
                      placeholder="নতুন পরিমাণ লিখুন..."
                      className="w-full pl-4 pr-16 py-3 rounded-xl bg-black/60 border border-white/15 text-white font-mono text-base font-bold focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all placeholder:text-slate-600"
                      required
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-cyan-400 font-mono text-xs font-semibold">
                      ৳ BDT
                    </span>
                  </div>
                </div>

                {/* Date - Locked and Not Editable */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                      <FiLock className="text-[11px] text-amber-400" /> আদায়ের তারিখ
                    </label>
                    <span className="text-[10px] text-amber-400 font-medium flex items-center gap-1 font-mono">
                      অপরিবর্তনযোগ্য (ফিক্সড)
                    </span>
                  </div>
                  <div className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-slate-200 font-mono text-xs flex items-center justify-between cursor-not-allowed select-none shadow-inner">
                    <span className="font-semibold text-white tracking-wider flex items-center gap-2">
                      <FiCalendar className="text-cyan-400 text-sm" />
                      {editingRow?.date}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] text-slate-400 font-mono">
                      সংরক্ষিত তারিখ
                    </span>
                  </div>
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    সংশোধনের কারণ (Reason) *
                  </label>
                  <textarea
                    rows={3}
                    value={updateReason}
                    onChange={(e) => setUpdateReason(e.target.value)}
                    placeholder="কি কারণে এই কিস্তি সংশোধন করা হচ্ছে লিখুন (যেমন: ভুলে ৫০০ লেখা হয়েছিল)..."
                    className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/15 text-white text-xs focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all placeholder:text-slate-600"
                    required
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => setIsEditOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold border border-white/10 transition active:scale-95"
                  >
                    বাতিল
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-teal-400 text-white text-xs font-bold shadow-lg shadow-emerald-950/60 transition active:scale-95 flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <FiRefreshCw className="animate-spin text-xs" />
                    ) : (
                      <FiCheck className="text-xs" />
                    )}
                    <span>
                      {isAdminOrDev
                        ? "সরাসরি আপডেট করুন"
                        : "অনুমোদনের অনুরোধ পাঠান"}
                    </span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>,
          document.body
        )}

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
                  ক্যাশ ইনভুক্ত (Approved)
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

      {/* ================= LUXURY ACTION & FEEDBACK MODAL ================= */}
      <LuxuryActionModal {...feedbackModal} />

      {/* ================= LUXURY FLOATING TOAST ================= */}
      <LuxuryToast toast={luxuryToast} onClose={() => setLuxuryToast(null)} />
    </div>
  );
};

export default DailyInstallmentsUsersDetails;
