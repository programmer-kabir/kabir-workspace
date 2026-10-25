import React, { useEffect, useMemo, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import useInvestmentCards from "../../../utils/Investors/useInvestmentCards";
import { useSearchParams, Link } from "react-router-dom";
import { toast } from "react-toastify";
import useUsers from "../../../utils/Hooks/useUsers";
import NoDataFound from "../../../components/NoData/NoDataFound";
import BackButton from "../../../components/BackButton/BackButton";
import Loader from "../../../components/Loader/Loader";
import { 
  FiEdit2, 
  FiTrash2, 
  FiPlus, 
  FiCalendar, 
  FiCreditCard, 
  FiUser, 
  FiCheckCircle, 
  FiX, 
  FiDollarSign, 
  FiFilter, 
  FiPhone,
  FiBell,
  FiCheck,
  FiPrinter,
  FiClock,
  FiShield,
  FiLoader
} from "react-icons/fi";
import { FaMoneyBillWave, FaReceipt, FaCoins } from "react-icons/fa";
import LuxuryActionModal from "../../../components/Modal/LuxuryActionModal";
import LuxuryToast from "../../../components/Modal/LuxuryToast";
import { useAuth } from "../../../Provider/AuthProvider";
import { MONTHS } from "../../../../public/month";

export default function InvestmentPayments() {
  const [searchParams] = useSearchParams();
  const cardIdRaw = searchParams.get("card_id");
  const cardId = Number(cardIdRaw);
  const today = useMemo(() => new Date().toISOString().split("T")[0], []);
  const [installmentNo, setInstallmentNo] = useState("");
  const [amount, setAmount] = useState("");
  const [installmentDate, setInstallmentDate] = useState(new Date().toISOString().split("T")[0]);
  const { user } = useAuth();
  const userRole = String(user?.role || "").toLowerCase();
  const isAdminOrDev = ["admin", "developer"].includes(userRole);

  // Luxury Toast state
  const [luxuryToast, setLuxuryToast] = useState(null);

  // Success Receipt Modal State
  const [successReceipt, setSuccessReceipt] = useState(null);

  // Pending edit requests state
  const [pendingEdits, setPendingEdits] = useState([]);
  const [reviewModalEdit, setReviewModalEdit] = useState(null);

  // edit modal state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [editDate, setEditDate] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [update_reason, setUpdate_reason] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterDate, setFilterDate] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
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

  const { investmentCards, isInvestmentCardsLoading, isInvestmentCardsError } = useInvestmentCards();
  const { users, isUsersLoading, isUsersError } = useUsers();

  // ⚡ Fast card-level installments state & fetcher (only ~10-20 rows instead of 14,000+)
  const [cardInvestInstallments, setCardInvestInstallments] = useState([]);
  const [isInstallmentsLoading, setIsInstallmentsLoading] = useState(true);
  const [isInstallmentsError, setIsInstallmentsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCardInstallments = useCallback(async (silent = false) => {
    if (!cardId) return;
    if (!silent) setIsInstallmentsLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_LOCALHOST_KEY}/investors/getAllInstallments.php?investment_card_no=${cardId}`
      );
      const json = await res.json();
      if (json && json.success && Array.isArray(json.data)) {
        setCardInvestInstallments(json.data);
        setIsInstallmentsError(false);
      } else {
        setIsInstallmentsError(true);
      }
    } catch (e) {
      console.error("Error fetching card installments:", e);
      setIsInstallmentsError(true);
    } finally {
      if (!silent) setIsInstallmentsLoading(false);
    }
  }, [cardId]);

  useEffect(() => {
    fetchCardInstallments();
  }, [fetchCardInstallments]);

  const card = useMemo(
    () => investmentCards.find((c) => String(c.id) === String(cardId)),
    [investmentCards, cardId],
  );

  const lastInstallmentAmount = useMemo(() => {
    if (!cardInvestInstallments || cardInvestInstallments.length === 0) return null;
    const sorted = [...cardInvestInstallments].sort(
      (a, b) => Number(b.investment_no || 0) - Number(a.investment_no || 0),
    );
    const lastAmt = sorted[0]?.amount;
    return lastAmt ? Number(lastAmt) : null;
  }, [cardInvestInstallments]);

  const filteredInstallments = useMemo(() => {
    let data = [...cardInvestInstallments];

    if (filterType === "date" && filterDate) {
      data = data.filter((item) => item.investment_date === filterDate);
    }

    if (filterType === "month" && filterMonth) {
      data = data.filter((item) => {
        const date = new Date(item.investment_date);
        return (
          date.getMonth() + 1 === Number(filterMonth) &&
          date.getFullYear() === Number(filterYear)
        );
      });
    }

    if (filterType === "year" && filterYear) {
      data = data.filter((item) => {
        const date = new Date(item.investment_date);
        return date.getFullYear() === Number(filterYear);
      });
    }

    return data;
  }, [cardInvestInstallments, filterType, filterDate, filterMonth, filterYear]);

  const totalFilteredAmount = useMemo(() => {
    return filteredInstallments.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0,
    );
  }, [filteredInstallments]);

  const mergedInvestmentCards = useMemo(
    () => users.find((u) => u?.id === card?.investor_id),
    [users, card?.investor_id],
  );

  const formatMoney = (v) =>
    Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 });

  const avatarUrl = useMemo(() => {
    return mergedInvestmentCards?.photo
      ? `https://api.supplylinkbd.com/${mergedInvestmentCards.photo.replace(/^\/?(uploads\/)?/, "uploads/")}`
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(card?.card_name || "Investor")}&background=0284c7&color=fff&bold=true`;
  }, [mergedInvestmentCards?.photo, card?.card_name]);

  useEffect(() => {
    if (cardInvestInstallments?.length > 0) {
      const lastInstallmentNo = Math.max(
        ...cardInvestInstallments.map((item) => Number(item.investment_no)),
      );
      setInstallmentNo(lastInstallmentNo + 1);
    } else {
      setInstallmentNo(1);
    }
  }, [cardInvestInstallments]);

  const handleInvestInstallments = async () => {
    if (!installmentNo) {
      setLuxuryToast({
        title: "কিস্তি নং আবশ্যক ⚠️",
        message: "অনুগ্রহ করে কিস্তি নম্বর প্রদান করুন।",
        type: "warning",
      });
      return;
    }
    if (!amount) {
      setLuxuryToast({
        title: "পরিমাণ আবশ্যক ⚠️",
        message: "অনুগ্রহ করে কিস্তির টাকার পরিমাণ লিখুন।",
        type: "warning",
      });
      return;
    }
    if (Number(amount) <= 0) {
      setLuxuryToast({
        title: "অকার্যকর পরিমাণ ⚠️",
        message: "কিস্তির পরিমাণ অবশ্যই ০ এর বেশি হতে হবে।",
        type: "warning",
      });
      return;
    }
    if (!installmentDate) {
      setLuxuryToast({
        title: "তারিখ আবশ্যক ⚠️",
        message: "অনুগ্রহ করে কিস্তির কালেকশন তারিখ নির্বাচন করুন।",
        type: "warning",
      });
      return;
    }
    if (!isAdminOrDev && installmentDate > today) {
      setLuxuryToast({
        title: "ভবিষ্যতের তারিখ নিষিদ্ধ ⚠️",
        message: "ভবিষ্যতের তারিখে কিস্তি এন্ট্রি দেওয়া সম্ভব নয়।",
        type: "warning",
      });
      return;
    }
    if (!card?.id || !card?.investor_id) {
      setLuxuryToast({
        title: "কার্ড তথ্য পাওয়া যায়নি ⚠️",
        message: "বিনিয়োগ কার্ডের তথ্য সঠিকভাবে লোড হয়নি।",
        type: "warning",
      });
      return;
    }

    const finalDate = (isAdminOrDev && installmentDate) ? installmentDate : (installmentDate || today);

    const data = {
      investment_card_no: Number(card?.id),
      investor_id: Number(card?.investor_id),
      installment_no: Number(installmentNo),
      installment_date: finalDate,
      amount: Number(amount),
      signature_by: user?.id || 0,
    };

    setIsSubmitting(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_LOCALHOST_KEY}/investors/insert_investment_installment.php`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );

      const rawText = await res.text();
      let result = null;
      try {
        result = JSON.parse(rawText);
      } catch (parseErr) {
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]);
        }
      }

      if (!result || !result.success) {
        setLuxuryToast({
          title: "কিস্তি যোগ ব্যর্থ ❌",
          message: result?.error || result?.message || "সার্ভার থেকে সঠিক সাড়া পাওয়া যায়নি",
          type: "error",
        });
        return;
      }

      const resData = result?.data || {};

      // ⚡ Optimistic UI: তাৎক্ষণিক টেবিলে কিস্তি যুক্ত করা (0ms Latency)
      const newCreatedInstallment = {
        id: result?.insert_id || Date.now(),
        investment_card_no: Number(card?.id),
        investor_id: Number(card?.investor_id),
        investment_no: Number(installmentNo),
        investment_date: finalDate,
        amount: Number(amount),
        signature_by: user?.name || userRole || "কর্মী",
        active_days: 0,
      };

      setCardInvestInstallments((prev) => [newCreatedInstallment, ...prev]);

      setSuccessReceipt({
        isOpen: true,
        investorName: resData.investor_name || card?.card_name || mergedInvestmentCards?.name || "ইনভেস্টর",
        cardId: resData.card_id || card?.id,
        cardName: resData.card_name || card?.card_name,
        installmentNo: resData.installment_no || installmentNo,
        amount: Number(resData.amount || amount),
        date: resData.date || finalDate,
        collectorName: resData.collector_name || user?.name || "স্টাফ",
        collectorId: user?.id,
        avatarUrl: avatarUrl,
      });

      setLuxuryToast({
        title: "কিস্তি আদায় সম্পন্ন 🎉",
        message: `${card?.card_name || "ইনভেস্টর"} এর কিস্তি #${installmentNo} (${finalDate}) সফলভাবে যোগ হয়েছে।`,
        tag: `কিস্তি #${installmentNo}`,
        amount: Number(amount),
        type: "success",
      });

      setAmount("");
      setInstallmentDate(today);

      // ব্যাকগ্রাউন্ডে সাইলেন্ট রিফ্রেশ (কোনো লোডার আসবে না)
      fetchCardInstallments(true);
    } catch (error) {
      setLuxuryToast({
        title: "সার্ভারে সমস্যা ❌",
        message: "সার্ভারের সাথে সংযোগ স্থাপন করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchPendingEdits = useCallback(async () => {
    if (!cardId) return;
    try {
      const res = await fetch(
        `${import.meta.env.VITE_LOCALHOST_KEY}/investors/get_investment_edits.php?card_id=${cardId}&status=pending`
      );
      const resData = await res.json();
      if (resData.success && Array.isArray(resData.data)) {
        setPendingEdits(resData.data);
      } else {
        setPendingEdits([]);
      }
    } catch (e) {
      console.error("Failed to load pending edits:", e);
    }
  }, [cardId]);

  useEffect(() => {
    fetchPendingEdits();
  }, [fetchPendingEdits]);

  const openEditModal = (row) => {
    const existing = pendingEdits.find(
      (p) => Number(p.installment_id) === Number(row?.id)
    );
    if (existing) {
      setLuxuryToast({
        title: "অনুরোধ পেন্ডিং রয়েছে ⏳",
        message: `এই কিস্তির (পূর্বের ৳${formatMoney(existing.old_amount)} ➔ নতুন ৳${formatMoney(existing.new_amount)}) একটি সংশোধনের অনুরোধ ইতোমধ্যে পাঠানো হয়েছে।`,
        tag: `কিস্তি #${row?.investment_no}`,
        amount: existing.new_amount,
        type: "warning",
      });
      return;
    }
    setEditingRow(row);
    setEditDate(row?.investment_date || "");
    setEditAmount(String(row?.amount ?? ""));
    setIsEditOpen(true);
  };

  const closeEditModal = () => {
    setIsEditOpen(false);
    setEditingRow(null);
    setUpdate_reason("");
  };

  const handleUpdate = async () => {
    if (!editingRow?.id) return;
    if (!editDate) {
      setLuxuryToast({
        title: "তারিখ প্রয়োজন ⚠️",
        message: "অনুগ্রহ করে কিস্তির তারিখ প্রদান করুন।",
        type: "warning",
      });
      return;
    }
    if (!editAmount || Number(editAmount) <= 0) {
      setLuxuryToast({
        title: "সঠিক পরিমাণ দিন ⚠️",
        message: "কিস্তির পরিমাণ অবশ্যই ০ এর চেয়ে বেশি হতে হবে।",
        type: "warning",
      });
      return;
    }
    if (!update_reason.trim()) {
      setLuxuryToast({
        title: "কারণ উল্লেখ করুন ⚠️",
        message: "সংশোধনের সঠিক কারণ লিখতে হবে।",
        type: "warning",
      });
      return;
    }

    const payload = {
      installment_id: Number(editingRow.id),
      new_date: editDate,
      new_amount: Number(editAmount),
      request_reason: update_reason,
      requested_by: user?.id,
    };

    try {
      const res = await fetch(
        `${import.meta.env.VITE_LOCALHOST_KEY}/investors/request_investment_edit.php`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const result = await res.json();

      if (!result?.success) {
        setLuxuryToast({
          title: "অনুরোধ পাঠানো যায়নি ❌",
          message: result?.error || "কিছু একটা সমস্যা হয়েছে।",
          type: "error",
        });
        return;
      }

      closeEditModal();
      fetchPendingEdits();
      setLuxuryToast({
        title: "অনুরোধ পাঠানো হয়েছে! ⏳",
        message: result.message || "কিস্তি সংশোধনের অনুরোধ সফলভাবে পাঠানো হয়েছে। অ্যাডমিন বা ডেভেলপার অনুমোদন করলে কিস্তি ও ক্যাশ ব্যালেন্স আপডেট হবে।",
        tag: `কিস্তি #${editingRow?.investment_no}`,
        amount: editAmount,
        type: "warning",
      });
    } catch (e) {
      setLuxuryToast({
        title: "সার্ভারে সমস্যা ❌",
        message: "সার্ভারে যোগাযোগ করা যায়নি।",
        type: "error",
      });
    }
  };

  const handleReviewAction = (editItem, action) => {
    if (!editItem?.id) return;
    const isApprove = action === "approved";
    const title = isApprove ? "অনুমোদন নিশ্চিত করুন" : "বাতিল নিশ্চিত করুন";
    const text = isApprove
      ? `আপনি কি কিস্তি #${editItem?.installment_no} এর সংশোধিত পরিমাণ ৳${formatMoney(editItem?.new_amount)} অনুমোদন করতে চান? সংশ্লিষ্ট ক্যাশ-ইন স্বয়ংক্রিয়ভাবে আপডেট হবে।`
      : `আপনি কি কিস্তি #${editItem?.installment_no} এর সংশোধনের অনুরোধটি বাতিল করতে চান? কিস্তি পূর্বের অবস্থায় বহাল থাকবে।`;

    setFeedbackModal({
      isOpen: true,
      type: "confirm",
      variant: isApprove ? "success" : "danger",
      title,
      description: text,
      confirmText: isApprove ? "হ্যাঁ, অনুমোদন করুন" : "হ্যাঁ, বাতিল করুন",
      cancelText: "ফিরে যান",
      showCancel: true,
      onConfirm: async () => {
        try {
          const res = await fetch(
            `${import.meta.env.VITE_LOCALHOST_KEY}/investors/action_investment_edit.php`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                edit_id: editItem.id,
                action: action,
                reviewer_id: user?.id,
              }),
            }
          );
          const resJson = await res.json();
          setFeedbackModal((prev) => ({ ...prev, isOpen: false }));
          setReviewModalEdit(null);
          refetch();
          fetchPendingEdits();

          if (resJson.success) {
            setLuxuryToast({
              title: isApprove ? "অনুমোদিত হয়েছে! ✅" : "বাতিল করা হয়েছে! 🚫",
              message: resJson.message || "কার্যক্রম সফল হয়েছে।",
              tag: `কিস্তি #${editItem?.installment_no}`,
              amount: editItem?.new_amount,
              type: isApprove ? "success" : "warning",
            });
          } else {
            setLuxuryToast({
              title: "ব্যর্থ হয়েছে ❌",
              message: resJson.error || "কার্যক্রম সম্পন্ন করা যায়নি",
              type: "error",
            });
          }
        } catch (err) {
          setFeedbackModal((prev) => ({ ...prev, isOpen: false }));
          setLuxuryToast({
            title: "সার্ভার এরর ❌",
            message: "সার্ভারে সমস্যা হয়েছে",
            type: "error",
          });
        }
      },
      onClose: () => setFeedbackModal((prev) => ({ ...prev, isOpen: false })),
    });
  };

  const handleDelete = (row) => {
    if (!isAdminOrDev) {
      toast.error("শুধুমাত্র অ্যাডমিন এবং ডেভেলপার কিস্তি ডিলিট করতে পারেন");
      return;
    }

    setFeedbackModal({
      isOpen: true,
      type: "confirm",
      variant: "danger",
      title: "কিস্তি Delete করবেন?",
      description: `বিনিয়োগ কিস্তি #${row?.investment_no} (৳${formatMoney(row?.amount)}) delete করলে সংশ্লিষ্ট ক্যাশ রেকর্ড মুছে যাবে। আপনি কি নিশ্চিত?`,
      confirmText: "হ্যাঁ, মুছে ফেলুন",
      cancelText: "বাতিল",
      showCancel: true,
      onConfirm: async () => {
        try {
          const res = await fetch(
            `${import.meta.env.VITE_LOCALHOST_KEY}/investors/delete_investment_installment.php`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: Number(row.id) }),
            }
          );
          const rawText = await res.text();
          let result = null;
          try {
            result = JSON.parse(rawText);
          } catch (parseErr) {
            const jsonMatch = rawText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              result = JSON.parse(jsonMatch[0]);
            }
          }

          setFeedbackModal((prev) => ({ ...prev, isOpen: false }));

          const isSuccess = result?.success || rawText.includes('"success":true') || rawText.includes('deleted');

          if (!isSuccess) {
            setLuxuryToast({
              title: "Delete করা যায়নি ❌",
              message: result?.error || result?.message || "মুছে ফেলা যায়নি",
              type: "error",
            });
            return;
          }

          // ⚡ Optimistic UI: তাৎক্ষণিক ডিলিট
          setCardInvestInstallments((prev) =>
            prev.filter((item) => Number(item.id) !== Number(row?.id))
          );
          fetchCardInstallments(true);

          setLuxuryToast({
            title: "সফলভাবে মুছে ফেলা হয়েছে! ✅",
            message: "কিস্তি ও সংশ্লিষ্ট ক্যাশ সফলভাবে মুছে ফেলা হয়েছে।",
            tag: `কিস্তি #${row?.investment_no}`,
            amount: row?.amount,
            type: "success",
          });
        } catch (e) {
          setFeedbackModal((prev) => ({ ...prev, isOpen: false }));
          setLuxuryToast({
            title: "সার্ভার এরর ❌",
            message: "সার্ভারের সাথে সংযোগ স্থাপন করা যায়নি।",
            type: "error",
          });
        }
      },
      onClose: () => setFeedbackModal((prev) => ({ ...prev, isOpen: false })),
    });
  };

  const isPageLoading =
    isUsersLoading ||
    isInvestmentCardsLoading ||
    (isInstallmentsLoading && cardInvestInstallments.length === 0) ||
    (!isInvestmentCardsError && (!investmentCards?.length || (cardId && !card)));

  if (isPageLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader />
        <p className="text-xs text-slate-400 font-medium">কিস্তি ব্যবস্থাপনা লোড হচ্ছে...</p>
      </div>
    );
  }

  if (isInstallmentsError || isUsersError || isInvestmentCardsError) {
    return (
      <NoDataFound
        message="ডাটা লোড করা যায়নি"
        subMessage="সার্ভার সংযোগে সমস্যা হয়েছে, অনুগ্রহ করে পেজটি রিফ্রেশ করুন"
      />
    );
  }

  if (cardId && !card) {
    return (
      <NoDataFound
        message="বিনিয়োগ কার্ড পাওয়া যায়নি"
        subMessage={`কার্ড আইডি #${cardId} এর কোনো তথ্য পাওয়া যায়নি।`}
      />
    );
  }

  const canDelete = isAdminOrDev; // শুধুমাত্র অ্যাডমিন এবং ডেভেলপার ডিলিট করতে পারবে
  const showAction = true;

  return (
    <div className="mx-auto  p-4 space-y-6 text-slate-200">
      <BackButton />

      {/* Header Profile Ribbon */}
      <div className="rounded-3xl border border-white/[0.08] bg-gradient-to-r from-[#0c162b]/95 via-[#091122]/95 to-[#060b17]/95 p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src={avatarUrl}
            alt="investor"
            onError={(e) => {
              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(card?.card_name || "Investor")}&background=0284c7&color=fff&bold=true`;
            }}
            className="w-16 h-16 rounded-2xl border-2 border-cyan-400/40 object-cover shadow-md shrink-0"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white/[0.05] text-cyan-300 border border-white/10">
                কার্ড #{card?.id}
              </span>
              <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded-full border border-emerald-400/30 bg-emerald-500/15 text-emerald-300 font-bold">
                {card?.status || "RUNNING"}
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-wide mt-1">
              {card?.card_name || mergedInvestmentCards?.name || "নামহীন কার্ড"}
            </h1>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5 font-mono">
              <FiPhone className="text-cyan-400 h-3 w-3" />
              <span>{mergedInvestmentCards?.mobile || "N/A"}</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400 font-sans">{mergedInvestmentCards?.address || "ঠিকানা নেই"}</span>
            </p>
          </div>
        </div>

        <Link
          to={`/investors/investment_cards/details?card_id=${card?.id}`}
          className="rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] px-4 py-2 text-xs font-semibold text-slate-200 transition"
        >
          কার্ড ডিটেইলস দেখুন
        </Link>
      </div>

      {/* Add New Installment Form Box */}
      <div className="rounded-2xl border border-cyan-500/25 bg-gradient-to-br from-[#0c1a2e]/90 to-[#070e1a]/95 p-5 sm:p-6 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400">
            <FaMoneyBillWave className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">
              নতুন কিস্তি আদায় (Add Installment Collection)
            </h2>
            <p className="text-[11px] text-slate-400">বিনিয়োগকারীর প্রাপ্ত কিস্তির টাকা এন্ট্রি করুন</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-end">
          <div className="sm:col-span-3">
            <label className="text-xs font-semibold text-slate-300 mb-1 block">
              কিস্তি নং (Slip / No)
            </label>
            <div className="relative">
              <FaReceipt className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
              <input
                type="text"
                placeholder="কিস্তি নং"
                value={installmentNo}
                onChange={(e) => setInstallmentNo(e.target.value)}
                className="w-full rounded-xl bg-black/40 border border-white/10 pl-10 pr-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-cyan-400/50"
              />
            </div>
          </div>

          <div className="sm:col-span-3">
            <label className="text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
              <span>কালেকশন তারিখ</span>
              {isAdminOrDev ? (
                <span className="text-[10px] text-amber-400 font-medium">
                  ★ পুরানো তারিখ নির্বাচন
                </span>
              ) : (
                <span className="text-[10px] text-slate-400 font-normal">
                  (আজকের তারিখ)
                </span>
              )}
            </label>
            <div className="relative">
              <FiCalendar className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 ${isAdminOrDev ? "text-amber-400" : "text-slate-400"}`} />
              <input
                type="date"
                value={installmentDate}
                onChange={(e) => setInstallmentDate(e.target.value)}
                readOnly={!isAdminOrDev}
                max={isAdminOrDev ? undefined : today}
                className={`w-full rounded-xl bg-black/40 border pl-10 pr-3 py-2 text-sm text-white font-mono focus:outline-none transition ${
                  isAdminOrDev
                    ? "border-amber-500/40 focus:border-amber-400/70 cursor-pointer shadow-[0_0_12px_rgba(245,158,11,0.15)]"
                    : "border-white/10 opacity-75 cursor-not-allowed"
                }`}
                title={
                  isAdminOrDev
                    ? "অ্যাডমিন/ডেভেলপার প্রিভিলেজ: আপনি যেকোনো পুরানো তারিখ নির্বাচন করতে পারেন"
                    : "শুধুমাত্র অ্যাডমিন এবং ডেভেলপার পুরানো তারিখ পরিবর্তন করতে পারেন"
                }
              />
            </div>
          </div>

          <div className="sm:col-span-3">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-300">
                পরিমাণ (Amount in BDT)
              </label>
              {amount && (
                <button
                  type="button"
                  onClick={() => setAmount("")}
                  className="text-[10px] text-rose-400 hover:text-rose-300 font-medium cursor-pointer"
                >
                  ক্লিয়ার ✕
                </button>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-400 font-bold text-sm">৳</span>
              <input
                type="number"
                placeholder="যেমন: 500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl bg-black/40 border border-white/10 pl-9 pr-4 py-2.5 text-sm text-white font-mono font-bold focus:outline-none focus:border-cyan-400/50"
              />
            </div>
          </div>

          <div className="sm:col-span-3">
            <button
              disabled={isSubmitting}
              onClick={handleInvestInstallments}
              className={`w-full inline-flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white shadow-lg transition ${
                isSubmitting
                  ? "bg-slate-700 cursor-not-allowed opacity-80"
                  : "bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 cursor-pointer shadow-cyan-950/50"
              }`}
            >
              {isSubmitting ? (
                <>
                  <FiLoader className="h-4 w-4 animate-spin text-cyan-300" />
                  <span>জমা হচ্ছে...</span>
                </>
              ) : (
                <>
                  <FiPlus className="h-4 w-4" />
                  <span>কিস্তি জমা করুন</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Amount Suggestion Pills */}
        <div className="mt-3.5 pt-3 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 mr-1">
              <span className="text-cyan-400 text-xs">⚡</span> সাজেস্ট:
            </span>
            {[50, 100, 200, 300, 500, 1000].map((amt) => {
              const isSelected = String(amount) === String(amt);
              return (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAmount(String(amt))}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1 cursor-pointer border ${
                    isSelected
                      ? "bg-cyan-500/25 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.35)] ring-1 ring-cyan-400/50"
                      : "bg-white/[0.04] border-white/10 text-slate-300 hover:bg-cyan-500/15 hover:border-cyan-500/30 hover:text-white"
                  }`}
                  title={`ক্লিক করে টাকার পরিমাণ ৳${amt} নির্ধারণ করুন`}
                >
                  <span>৳{amt}</span>
                </button>
              );
            })}

            {lastInstallmentAmount && ![50, 100, 200, 300, 500, 1000].includes(lastInstallmentAmount) && (
              <button
                type="button"
                onClick={() => setAmount(String(lastInstallmentAmount))}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                  String(amount) === String(lastInstallmentAmount)
                    ? "bg-emerald-500/25 border-emerald-400 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.35)] ring-1 ring-emerald-400/50"
                    : "bg-emerald-950/30 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-500/50"
                }`}
                title={`পূর্ববর্তী কিস্তির পরিমাণ ৳${lastInstallmentAmount} নির্ধারণ করুন`}
              >
                <span className="text-[10px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-sans font-medium">
                  পূর্বের কিস্তি
                </span>
                <span>৳{lastInstallmentAmount}</span>
              </button>
            )}
          </div>

          {/* Quick Increment */}
          {amount && Number(amount) > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-500 mr-0.5 hidden sm:inline">যোগ:</span>
              <button
                type="button"
                onClick={() => setAmount(String(Number(amount) + 50))}
                className="px-2.5 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-[11px] font-mono text-cyan-300 transition cursor-pointer"
                title="বর্তমান পরিমাণে +৫০ টাকা যোগ করুন"
              >
                +৫০
              </button>
              <button
                type="button"
                onClick={() => setAmount(String(Number(amount) + 100))}
                className="px-2.5 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-[11px] font-mono text-cyan-300 transition cursor-pointer"
                title="বর্তমান পরিমাণে +১০০ টাকা যোগ করুন"
              >
                +১০০
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Pending Edits Alert Banner if any */}
      {pendingEdits.length > 0 && (
        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-[#1f1609]/50 to-amber-950/30 p-4 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300">
              <FiClock className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                <span>এই কার্ডে {pendingEdits.length}টি কিস্তি সংশোধনের অনুরোধ পেন্ডিং রয়েছে</span>
                <span className="px-2 py-0.2 rounded-full bg-amber-500/20 border border-amber-500/40 text-[10px] font-mono text-amber-300 font-bold">
                  {isAdminOrDev ? "অনুমোদন প্রয়োজন" : "অ্যাডমিন অনুমোদনের অপেক্ষায়"}
                </span>
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {isAdminOrDev
                  ? "অ্যাডমিন বা ডেভেলপার হিসেবে আপনি নিচের তালিকা থেকে সরাসরি 'রিভিউ' বাটনে ক্লিক করে অনুমোদন বা বাতিল করতে পারেন।"
                  : "আপনার পাঠানো কিস্তি সংশোধনের অনুরোধটি অ্যাডমিন ও ডেভেলপারের পর্যালোচনার জন্য অপেক্ষমাণ রয়েছে।"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filter Ribbon & Total Amount */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-[#0d162a] via-[#0b1325] to-[#090f1d] border border-white/[0.08] shadow-lg flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-xl bg-black/40 border border-white/10 px-3.5 py-2 text-xs font-semibold text-white outline-none focus:border-cyan-400/50 cursor-pointer"
          >
            <option value="all" className="bg-[#0b1322]">সকল কিস্তি (All)</option>
            <option value="date" className="bg-[#0b1322]">তারিখ অনুযায়ী (Date)</option>
            <option value="month" className="bg-[#0b1322]">মাস অনুযায়ী (Month)</option>
            <option value="year" className="bg-[#0b1322]">বছর অনুযায়ী (Year)</option>
          </select>

          {filterType === "date" && (
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="rounded-xl bg-black/40 border border-white/10 px-3 py-1.5 text-xs text-white outline-none focus:border-cyan-400/50 cursor-pointer"
            />
          )}

          {filterType === "month" && (
            <>
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="rounded-xl bg-black/40 border border-white/10 px-3 py-1.5 text-xs text-white outline-none focus:border-cyan-400/50 cursor-pointer"
              >
                <option value="" className="bg-[#0b1322]">মাস নির্বাচন করুন</option>
                {MONTHS.map((month) => (
                  <option key={month.value} value={month.value} className="bg-[#0b1322]">
                    {month.label}
                  </option>
                ))}
              </select>

              <input
                type="number"
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                placeholder="Year"
                className="w-24 rounded-xl bg-black/40 border border-white/10 px-3 py-1.5 text-xs text-white outline-none focus:border-cyan-400/50"
              />
            </>
          )}

          {filterType === "year" && (
            <input
              type="number"
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              placeholder="Year"
              className="w-24 rounded-xl bg-black/40 border border-white/10 px-3 py-1.5 text-xs text-white outline-none focus:border-cyan-400/50"
            />
          )}
        </div>

        {/* Total Filtered Summary Pill */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-slate-400">মোট সংগৃহীত:</span>
          <span className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 font-mono font-extrabold text-emerald-300 text-sm sm:text-base">
            ৳{formatMoney(totalFilteredAmount)}
          </span>
        </div>
      </div>

      {/* Installments Table */}
      <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#0c162b]/95 to-[#070d19]/95 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="border-b border-white/[0.08] bg-black/40 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 text-center w-14">কিস্তি নং</th>
                <th className="py-3 px-4">কালেকশন তারিখ</th>
                <th className="py-3 px-4 text-right">পরিমাণ (৳)</th>
                <th className="py-3 px-4 text-center">স্বাক্ষরকারী / আইডি</th>
                {showAction && <th className="py-3 px-4 text-right w-28">অ্যাকশন</th>}
              </tr>
            </thead>

            <tbody className="divide-y divide-white/[0.04]">
              {filteredInstallments.length === 0 ? (
                <tr>
                  <td colSpan={showAction ? 5 : 4} className="py-12 text-center text-slate-400">
                    <FaReceipt className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                    <p className="font-semibold text-slate-300">কোনো কিস্তি রেকর্ড পাওয়া যায়নি</p>
                    <p className="text-xs text-slate-500 mt-0.5">নতুন কিস্তি যোগ করুন অথবা ফিল্টার পরিবর্তন করুন</p>
                  </td>
                </tr>
              ) : (
                filteredInstallments.map((row) => {
                  const pendingEditForRow = pendingEdits.find(
                    (e) => Number(e.installment_id) === Number(row.id)
                  );
                  const signer = users.find(
                    (u) => String(u?.id) === String(row?.signature_by)
                  );
                  return (
                    <tr key={row.id} className="hover:bg-white/[0.02] transition">
                      <td className="py-3.5 px-4 text-center font-mono">
                        <span className="px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/10 text-cyan-300 text-xs font-bold">
                          #{row?.investment_no}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-white">
                        {row?.investment_date}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400 text-sm sm:text-base">
                        <div>৳{formatMoney(row?.amount)}</div>
                        {pendingEditForRow && (
                          <div className="mt-1 flex items-center justify-end">
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/35 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                              <FiClock className="h-2.5 w-2.5 animate-spin" />
                              <span>পেন্ডিং: ৳{formatMoney(pendingEditForRow.new_amount)}</span>
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-bold overflow-hidden shadow-sm">
                            {signer?.photo ? (
                              <img
                                src={`https://api.supplylinkbd.com/${signer.photo.replace(/^\/?(uploads\/)?/, "uploads/")}`}
                                alt=""
                                className="h-full w-full object-cover"
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            ) : (
                              (signer?.name || "U")[0]?.toUpperCase()
                            )}
                          </div>
                          <div className="text-left min-w-0">
                            <div className="text-xs font-bold text-white tracking-wide truncate max-w-[130px]">
                              {signer?.name || `User #${row?.signature_by || "-"}`}
                            </div>
                            <div className="text-[10px] font-mono text-cyan-400">
                              ID: {row?.signature_by || "-"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {showAction && (
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {pendingEditForRow && isAdminOrDev && (
                              <button
                                title="অনুরোধ পর্যালোচনা ও অনুমোদন করুন"
                                onClick={() => setReviewModalEdit(pendingEditForRow)}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition cursor-pointer"
                              >
                                <FiShield className="h-3.5 w-3.5" />
                                <span>রিভিউ</span>
                              </button>
                            )}
                            <button
                              title={pendingEditForRow ? "সংশোধনের অনুরোধ পেন্ডিং রয়েছে" : "Edit"}
                              onClick={() => openEditModal(row)}
                              className={`flex h-8 w-8 items-center justify-center rounded-lg border transition cursor-pointer ${
                                pendingEditForRow 
                                  ? "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20" 
                                  : "bg-white/[0.05] hover:bg-cyan-500/20 border-white/10 hover:border-cyan-500/40 text-slate-300 hover:text-white"
                              }`}
                            >
                              <FiEdit2 className="h-3.5 w-3.5" />
                            </button>
                            {canDelete && (
                              <button
                                title="Delete"
                                onClick={() => handleDelete(row)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 text-rose-300 transition cursor-pointer"
                              >
                                <FiTrash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Installment Request Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={closeEditModal} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

          <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-gradient-to-b from-[#0d162b] to-[#070d19] p-6 shadow-2xl z-10 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-white tracking-wide">
                  কিস্তি সংশোধনের অনুরোধ (Edit Request)
                </h3>
                <p className="text-xs text-cyan-300 font-mono mt-0.5">
                  কিস্তি নং #{editingRow?.investment_no}
                </p>
              </div>
              <button onClick={closeEditModal} className="h-8 w-8 rounded-lg bg-white/[0.05] text-slate-400 hover:text-white flex items-center justify-center cursor-pointer">
                <FiX className="h-4 w-4" />
              </button>
            </div>

            {/* Approval Notice Box */}
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 flex items-start gap-2.5 text-xs text-amber-300">
              <FiClock className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
              <p className="text-[11px] leading-relaxed">
                সংশোধনের এই তথ্যটি সরাসরি আপডেট হবে না। এটি অনুমোদনের জন্য অ্যাডমিন ও ডেভেলপারের কাছে পেন্ডিং থাকবে এবং অনুমোদন পেলেই ক্যাশ ও কিস্তিতে কার্যকর হবে।
              </p>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block">কালেকশন তারিখ</label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full rounded-xl bg-black/40 border border-white/10 px-3.5 py-2.5 text-xs sm:text-sm text-white outline-none focus:border-cyan-400/50"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300 block">নতুন পরিমাণ (New Amount ৳)</label>
                  {editAmount && (
                    <button
                      type="button"
                      onClick={() => setEditAmount("")}
                      className="text-[10px] text-rose-400 hover:text-rose-300 font-medium cursor-pointer"
                    >
                      ক্লিয়ার ✕
                    </button>
                  )}
                </div>
                <input
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="w-full rounded-xl bg-black/40 border border-white/10 px-3.5 py-2.5 text-xs sm:text-sm text-white font-mono font-bold outline-none focus:border-cyan-400/50"
                />
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[10px] text-slate-400">সাজেস্ট:</span>
                  {[50, 100, 200, 300, 500, 1000].map((amt) => {
                    const isSelected = String(editAmount) === String(amt);
                    return (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setEditAmount(String(amt))}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition cursor-pointer border ${
                          isSelected
                            ? "bg-amber-500/25 border-amber-400 text-amber-300 ring-1 ring-amber-400/40"
                            : "bg-white/5 hover:bg-white/10 border-white/10 text-slate-300 hover:text-white"
                        }`}
                      >
                        ৳{amt}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block">
                  সংশোধনের কারণ (Update Reason) <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={3}
                  value={update_reason}
                  onChange={(e) => setUpdate_reason(e.target.value)}
                  placeholder="কিস্তি পরিবর্তনের সঠিক কারণ লিখুন (অ্যাডমিন পর্যালোচনার জন্য প্রয়োজন)..."
                  className="w-full rounded-xl bg-black/40 border border-white/10 p-3 text-xs sm:text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-400/50 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={closeEditModal}
                  className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  onClick={handleUpdate}
                  className="rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-500 hover:to-orange-500 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-amber-950/50 transition cursor-pointer"
                >
                  অনুরোধ পাঠান (Submit)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin/Developer Review & Action Modal */}
      {reviewModalEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setReviewModalEdit(null)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

          <div className="relative w-full max-w-md rounded-3xl border border-amber-500/30 bg-gradient-to-b from-[#0d162b] to-[#070d19] p-6 shadow-2xl z-10 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
                  <FiShield className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-wide">
                    কিস্তি সংশোধন পর্যালোচনা
                  </h3>
                  <p className="text-xs text-amber-400 font-mono mt-0.5">
                    কিস্তি নং #{reviewModalEdit?.installment_no} • রিকোয়েস্ট #{reviewModalEdit?.id}
                  </p>
                </div>
              </div>
              <button onClick={() => setReviewModalEdit(null)} className="h-8 w-8 rounded-lg bg-white/[0.05] text-slate-400 hover:text-white flex items-center justify-center cursor-pointer">
                <FiX className="h-4 w-4" />
              </button>
            </div>

            <div className="rounded-2xl bg-black/40 border border-white/[0.08] p-4 divide-y divide-white/[0.06] text-xs space-y-3">
              <div className="flex items-center justify-between pb-2">
                <span className="text-slate-400">অনুরোধকারী কর্মী</span>
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <FiUser className="text-cyan-400 h-3.5 w-3.5" />
                  <span>{reviewModalEdit?.requester_name || `User #${reviewModalEdit?.requested_by}`}</span>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 py-2">
                <div>
                  <span className="text-[10px] text-slate-400 block">বর্তমান পরিমাণ</span>
                  <span className="text-rose-400 font-mono font-bold text-sm">
                    ৳{formatMoney(reviewModalEdit?.old_amount)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">অনুরোধকৃত নতুন পরিমাণ</span>
                  <span className="text-emerald-400 font-mono font-bold text-base">
                    ৳{formatMoney(reviewModalEdit?.new_amount)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 py-2">
                <div>
                  <span className="text-[10px] text-slate-400 block">বর্তমান তারিখ</span>
                  <span className="text-slate-300 font-mono">
                    {reviewModalEdit?.old_date}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">অনুরোধকৃত তারিখ</span>
                  <span className="text-cyan-300 font-mono font-semibold">
                    {reviewModalEdit?.new_date}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <span className="text-[10px] text-slate-400 block mb-1">সংশোধনের কারণ:</span>
                <p className="rounded-xl bg-white/[0.03] p-2.5 text-xs text-slate-200 border border-white/5 italic">
                  "{reviewModalEdit?.request_reason}"
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => handleReviewAction(reviewModalEdit, "rejected")}
                className="flex-1 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 py-2.5 text-xs font-bold text-rose-300 transition cursor-pointer text-center"
              >
                ✕ বাতিল করুন (Reject)
              </button>
              <button
                onClick={() => handleReviewAction(reviewModalEdit, "approved")}
                className="flex-1 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-950/50 transition cursor-pointer text-center"
              >
                ✓ অনুমোদন দিন (Approve)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Luxury Digital Receipt Confirmation Modal */}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {successReceipt && (
              <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
                <style>{`
                  @media print {
                    body * { visibility: hidden !important; }
                    #investment-receipt-modal, #investment-receipt-modal * { visibility: visible !important; }
                    #investment-receipt-modal {
                      position: fixed !important;
                      left: 0 !important;
                      top: 0 !important;
                      width: 100% !important;
                      background: #ffffff !important;
                      color: #0f172a !important;
                      box-shadow: none !important;
                      border: 1px solid #e2e8f0 !important;
                    }
                    .no-print { display: none !important; }
                  }
                `}</style>

                {/* Backdrop Blur */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSuccessReceipt(null)}
                  className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
                />

                {/* Modal Container */}
                <motion.div
                  id="investment-receipt-modal"
                  initial={{ opacity: 0, scale: 0.88, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  transition={{ type: "spring", stiffness: 380, damping: 26 }}
                  className="relative w-full max-w-md my-auto overflow-hidden rounded-3xl border border-emerald-500/35 bg-gradient-to-b from-[#0c1a2e] via-[#091224] to-[#050914] shadow-2xl shadow-black/90 z-10 text-slate-100"
                >
                  {/* Glowing Ambient Top Halo */}
                  <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />

                  {/* Close Cross Button */}
                  <button
                    onClick={() => setSuccessReceipt(null)}
                    className="no-print absolute top-4 right-4 z-20 flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.12] transition cursor-pointer"
                    title="বন্ধ করুন"
                  >
                    <FiX className="h-4 w-4" />
                  </button>

                  {/* Header & Animated Badge */}
                  <div className="p-6 pb-2 text-center relative z-10">
                    <motion.div
                      initial={{ scale: 0, rotate: -35 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.08 }}
                      className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 text-white shadow-xl shadow-emerald-500/30 border-2 border-emerald-300/40"
                    >
                      <FiCheckCircle className="h-9 w-9 stroke-[2.2]" />
                    </motion.div>

                    <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>কিস্তি আদায় সম্পন্ন</span>
                    </div>

                    <h3 className="text-xl font-black text-white tracking-wide mt-1.5">
                      বিনিয়োগ কিস্তির ডিজিটাল রসিদ
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      ইনভেস্টরের কার্ডে কিস্তির অর্থ সফলভাবে যুক্ত হয়েছে
                    </p>

                    {/* Prominent Amount Box */}
                    <div className="mt-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/50 via-[#06241a]/60 to-emerald-950/50 border border-emerald-500/30 p-3.5 shadow-inner">
                      <span className="text-[10px] font-semibold text-emerald-300/80 uppercase tracking-wider block">
                        সংগৃহীত কিস্তির পরিমাণ
                      </span>
                      <div className="text-3xl sm:text-4xl font-extrabold font-mono text-emerald-300 mt-1 flex items-center justify-center gap-1">
                        <span>৳</span>
                        <span>{formatMoney(successReceipt.amount)}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 mt-0.5 inline-block">
                        Digital Investment Voucher • Cash In Hand
                      </span>
                    </div>
                  </div>

                  {/* Voucher Breakdown Card */}
                  <div className="px-6 py-2.5 relative z-10">
                    <div className="rounded-2xl bg-black/40 border border-white/[0.08] p-4 divide-y divide-white/[0.06] text-xs">
                      {/* Investor Profile */}
                      <div className="flex items-center justify-between pb-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={successReceipt.avatarUrl}
                            alt="Investor"
                            className="w-10 h-10 rounded-xl border border-cyan-400/40 object-cover shrink-0"
                            onError={(e) => {
                              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(successReceipt.investorName)}&background=0284c7&color=fff&bold=true`;
                            }}
                          />
                          <div>
                            <span className="text-slate-400 text-[10px] block">বিনিয়োগকারী</span>
                            <span className="text-white font-bold text-sm block leading-tight">
                              {successReceipt.investorName}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block font-mono">কার্ড আইডি</span>
                          <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono font-bold text-xs">
                            #{successReceipt.cardId}
                          </span>
                        </div>
                      </div>

                      {/* Installment No & Date */}
                      <div className="grid grid-cols-2 gap-3 py-3">
                        <div>
                          <span className="text-[10px] text-slate-400 block">কিস্তি নম্বর</span>
                          <span className="text-slate-100 font-bold font-mono text-sm">
                            কিস্তি #{successReceipt.installmentNo}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block">কালেকশন তারিখ</span>
                          <span className="text-slate-200 font-mono font-semibold">
                            {successReceipt.date}
                          </span>
                        </div>
                      </div>

                      {/* Collector Info */}
                      <div className="flex items-center justify-between pt-3">
                        <span className="text-slate-400">কালেকশনকারী কর্মী</span>
                        <span className="font-semibold text-white flex items-center gap-1.5">
                          <FiUser className="text-cyan-400 h-3.5 w-3.5" />
                          <span>{successReceipt.collectorName}</span>
                          {successReceipt.collectorId && (
                            <span className="text-[10px] text-slate-400 font-mono">(ID #{successReceipt.collectorId})</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Real-time Notification Alert Pill */}
                  <div className="px-6 py-2 relative z-10 no-print">
                    <div className="rounded-xl bg-gradient-to-r from-cyan-950/40 to-blue-950/40 border border-cyan-500/30 p-3 flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-300 mt-0.5">
                        <FiBell className="h-4 w-4 animate-bounce" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h5 className="text-xs font-bold text-cyan-300">
                            অ্যাডমিন ও ডেভেলপারকে নোটিফিকেশন পাঠানো হয়েছে
                          </h5>
                          <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        </div>
                        <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                          স্বয়ংক্রিয়ভাবে অ্যাডমিন ও ডেভেলপার প্যানেলে এলার্ট চলে গেছে যে <span className="text-white font-semibold">{successReceipt.investorName}</span> এর ৳{formatMoney(successReceipt.amount)} টাকা কিস্তি আদায় সম্পন্ন হয়েছে।
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-6 pt-3 flex items-center gap-2.5 relative z-10 no-print">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.05] hover:bg-white/[0.1] px-4 py-2.5 text-xs font-semibold text-slate-200 transition cursor-pointer"
                    >
                      <FiPrinter className="h-3.5 w-3.5" />
                      <span>প্রিন্ট রসিদ</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSuccessReceipt(null)}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-950/50 transition cursor-pointer"
                    >
                      <FiCheck className="h-4 w-4" />
                      <span>ঠিক আছে, সম্পন্ন</span>
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}

      {/* ================= LUXURY ACTION & FEEDBACK MODAL ================= */}
      <LuxuryActionModal {...feedbackModal} />

      {/* ================= LUXURY FLOATING TOAST ================= */}
      <LuxuryToast toast={luxuryToast} onClose={() => setLuxuryToast(null)} />
    </div>
  );
}
