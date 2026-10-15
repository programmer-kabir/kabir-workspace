import React, { useState, useEffect } from "react";
import { FiSave } from "react-icons/fi";
import {
  FaCheckCircle,
  FaClock,
  FaReceipt,
  FaMoneyBillWave,
  FaCalendarAlt,
  FaCreditCard,
  FaFire,
  FaHistory,
  FaTimes,
  FaUser,
  FaExchangeAlt,
} from "react-icons/fa";
import { InstallmentItemRow } from "./InstallmentItemRow";
import { DownPaymentRow } from "./DownPaymentRow";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const headers = [
  "ট্যাগ / কিস্তি",
  "পরিমাণ (৳)",
  "মূলধন (৳)",
  "লাভ (৳)",
  "নির্ধারিত তারিখ",
  "পরিশোধের তারিখ",
  "পেমেন্ট মেথড",
  "রশিদ নম্বর",
  "স্ট্যাটাস",
  "অ্যাকশন",
];

const pad2 = (n) => String(n).padStart(2, "0");
const toYMD = (d) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

const addMonthsYMD = (ymd, add) => {
  const [y, m, d] = (ymd || "").split("-").map(Number);
  if (!y || !m || !d) return "";

  const base = new Date(y, m - 1, d);
  const temp = new Date(base.getFullYear(), base.getMonth() + add, 1);
  const lastDay = new Date(temp.getFullYear(), temp.getMonth() + 1, 0).getDate();
  const day = Math.min(d, lastDay);
  return toYMD(new Date(temp.getFullYear(), temp.getMonth(), day));
};

export const InstallmentRow = ({
  installmentType,
  hasDownPayment,
  card,
  onSaveSuccess,
  InstallmentPayments,
  user,
  refetch,
}) => {
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];

  const installmentCount = Number(installmentType || 0);

  const bnNumbers = [
    "১ম", "২য়", "৩য়", "৪র্থ", "৫ম", "৬ষ্ঠ", "৭ম", "৮ম", "৯ম", "১০ম",
    "১১তম", "১২তম", "১৩তম", "১৪তম", "১৫তম", "১৬তম", "১৭তম", "১৮তম", "১৯তম", "২০তম",
    "২১তম", "২২তম", "২৩তম", "২৪তম"
  ];

  const costPrice = Number(card?.cost_price || 0);
  const salePrice = Number(card?.sale_price || 0);
  const baseAmount = Number(card?.per_installment_amount || 0);

  const calculatePrincipalProfit = (amount) => {
    const due = Number(amount) || 0;
    if (costPrice > 0 && salePrice > 0) {
      const principal = Number(((due * costPrice) / salePrice).toFixed(2));
      const profit = Number((due - principal).toFixed(2));
      return { principal, profit };
    }
    return { principal: 0, profit: 0 };
  };

  const downPaymentAmount = Number(card?.down_payment || 0);
  const downPaymentCalc = calculatePrincipalProfit(downPaymentAmount);

  const basePrincipal = Number(
    ((baseAmount * costPrice) / (salePrice || 1)).toFixed(2)
  );
  const principalSum = basePrincipal * installmentCount;
  const principalDiff = Number((costPrice - principalSum).toFixed(2));

  const [installments, setInstallments] = useState([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  // Early Settlement States
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);
  const [isSettlementDetailsOpen, setIsSettlementDetailsOpen] = useState(false);
  const [settlementDiscount, setSettlementDiscount] = useState(0);
  const [settledCashAmount, setSettledCashAmount] = useState(0);
  const [settlementPaymentMethod, setSettlementPaymentMethod] = useState("Cash");
  const [settlementDate, setSettlementDate] = useState(today);
  const [settlementNote, setSettlementNote] = useState("");
  const [isSettling, setIsSettling] = useState(false);
  const [cardSettlementInfo, setCardSettlementInfo] = useState(null);

  const fetchCardSettlement = async () => {
    try {
      const targetId = Number(card?.card_id);
      if (!targetId) return;
      const res = await fetch(
        `${import.meta.env.VITE_LOCALHOST_KEY}/customers/settle_installment_card.php?card_id=${targetId}`
      );
      const data = await res.json();
      if (data.success && data.settled) {
        setCardSettlementInfo(data.data);
      } else {
        setCardSettlementInfo(null);
      }
    } catch (err) {}
  };

  useEffect(() => {
    fetchCardSettlement();
  }, [card?.card_id]);

  useEffect(() => {
    setInstallments(
      Array.from({ length: installmentCount }).map((_, index) => {
        if (!hasDownPayment && index === 0 && principalDiff !== 0) {
          const adjustedPrincipal = basePrincipal + principalDiff;
          const adjustedAmount = Number(
            ((adjustedPrincipal * salePrice) / (costPrice || 1)).toFixed(2)
          );
          return { amount: adjustedAmount };
        }
        return { amount: baseAmount };
      })
    );
  }, [
    installmentCount,
    baseAmount,
    basePrincipal,
    principalDiff,
    hasDownPayment,
    costPrice,
    salePrice,
  ]);

  const handleAmountChange = (index, value) => {
    const updated = [...installments];
    updated[index].amount = Number(value) || 0;
    setInstallments(updated);
  };

  const [payments, setPayments] = useState([]);

  useEffect(() => {
    setPayments(InstallmentPayments.map((p) => ({ ...p })));
  }, [InstallmentPayments]);

  const handlePaidDateChange = (index, value) => {
    const updated = [...payments];
    updated[index].paid_date = value;
    setPayments(updated);
  };

  const handleStatusChange = (index, value) => {
    const updated = [...payments];
    updated[index].status = value;
    if (value === "Paid") {
      if (!updated[index].paid_date) {
        updated[index].paid_date = today;
      }
    } else {
      updated[index].paid_date = null;
    }
    setPayments(updated);
  };

  const handlePaymentMethodChange = (index, value) => {
    const updated = [...payments];
    updated[index].payment_method = value;
    setPayments(updated);
  };

  const handleReceiptChange = (index, value) => {
    const updated = [...payments];
    updated[index].receipt_number = value;
    setPayments(updated);
  };

  const handleUpdateInstallment = async (index) => {
    const updatedItem = payments[index];
    const activeStaffId = Number(user?.user_id ?? user?.id ?? 0);

    if (updatedItem.status === "Paid" && !activeStaffId) {
      toast.error("লগইন ইউজারের তথ্য পাওয়া যায়নি! দয়া করে পেজটি রিফ্রেশ করে আবার চেষ্টা করুন।");
      return;
    }

    const payload = {
      id: updatedItem.id,
      paid_date:
        updatedItem.status === "Paid" ? updatedItem.paid_date || today : null,
      payment_method: updatedItem.payment_method,
      receipt_number: updatedItem.receipt_number,
      status: updatedItem.status,
      signature: activeStaffId || null,
      collected_by: activeStaffId || null,
    };
    try {
      const res = await fetch(
        `${import.meta.env.VITE_LOCALHOST_KEY}/customers/installment_payment_update.php`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();
      if (data.success) {
        toast.success("কিস্তি পেমেন্ট ও হিস্ট্রি সফলভাবে আপডেট করা হয়েছে ✅");
        refetch?.();
      } else {
        toast.error(data.message || "আপডেট ব্যর্থ হয়েছে");
      }
    } catch (err) {
      toast.error("আপডেট সম্পন্ন করা যায়নি");
    }
  };

  // Fetch payment history logs
  const fetchPaymentHistory = async () => {
    setIsHistoryLoading(true);
    setIsHistoryModalOpen(true);
    try {
      const targetCardId = Number(card?.card_id);
      if (!targetCardId) return;
      const res = await fetch(
        `${import.meta.env.VITE_LOCALHOST_KEY}/customers/installment_payment_history.php?card_id=${targetCardId}`
      );
      const data = await res.json();
      if (data.success) {
        setHistoryLogs(data.data || []);
      }
    } catch (err) {
      toast.error("হিস্ট্রি লোড করা যায়নি");
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const buildPaymentsPayload = () => {
    const rows = [];
    if (hasDownPayment && downPaymentAmount > 0) {
      const { principal, profit } = calculatePrincipalProfit(downPaymentAmount);
      const collectorId = user?.id || card?.reference_user_id || null;

      rows.push({
        card_id: card.card_id,
        installment_no: 0,
        tag: "ডাউন পেমেন্ট",
        due_amount: downPaymentAmount,
        principal_amount: principal,
        profit_amount: profit,
        due_date: card.delivery_date || today,
        paid_date: card.delivery_date || today,
        payment_method: "Cash",
        receipt_number: "",
        signature: collectorId,
        collected_by: collectorId,
        status: "Paid",
      });
    }

    const firstDue = card.first_installment_date || today;

    installments.forEach((inst, index) => {
      const { principal, profit } = calculatePrincipalProfit(inst.amount);
      const dueDate = addMonthsYMD(firstDue, index);
      rows.push({
        card_id: card.card_id,
        installment_no: index + 1,
        tag: `${bnNumbers[index] || index + 1} কিস্তি`,
        due_amount: inst.amount,
        principal_amount: principal,
        profit_amount: profit,
        due_date: dueDate,
        paid_date: null,
        payment_method: "Cash",
        receipt_number: "",
        Signature: null,
        status: "Unpaid",
      });
    });

    return rows;
  };

  const handleSaveAll = async () => {
    const payload = buildPaymentsPayload();
    try {
      const res = await fetch(
        `${import.meta.env.VITE_LOCALHOST_KEY}/customers/installment_payments_insert.php`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (data.success) {
        toast.success("কিস্তি সংক্রান্ত সকল তথ্য সফলভাবে সিস্টেমে সংরক্ষিত হয়েছে ✅");
        onSaveSuccess?.();
        navigate("/customers/installment_cards");
      }
    } catch (err) {
      toast.error("সার্ভার সমস্যা হয়েছে, পরে আবার চেষ্টা করুন");
    }
  };

  const isAllPaid =
    Boolean(cardSettlementInfo) ||
    (payments.length > 0 &&
      payments.every((p) => p.status === "Paid" || p.status === "Waived"));

  const totalOriginalAmount = payments.reduce(
    (sum, p) => sum + Number(p.due_amount || 0),
    0
  );
  const totalPaidSoFar = payments
    .filter((p) => p.status === "Paid")
    .reduce((sum, p) => sum + Number(p.due_amount || 0), 0);
  const remainingDue = Math.max(0, totalOriginalAmount - totalPaidSoFar);

  const handleOpenSettlement = () => {
    setSettlementDiscount(0);
    setSettledCashAmount(remainingDue);
    setSettlementDate(today);
    setSettlementPaymentMethod("Cash");
    setSettlementNote("");
    setIsSettlementModalOpen(true);
  };

  const handleDiscountChange = (val) => {
    const d = Math.max(0, Number(val) || 0);
    setSettlementDiscount(val);
    setSettledCashAmount(Math.max(0, Number((remainingDue - d).toFixed(2))));
  };

  const handleCashChange = (val) => {
    const c = Math.max(0, Number(val) || 0);
    setSettledCashAmount(val);
    setSettlementDiscount(Math.max(0, Number((remainingDue - c).toFixed(2))));
  };

  const handleConfirmSettlement = async () => {
    const activeStaffId = Number(user?.user_id ?? user?.id ?? 0);
    if (!activeStaffId) {
      toast.error("লগইন ইউজারের তথ্য পাওয়া যায়নি! দয়া করে আবার লগইন করুন।");
      return;
    }

    const disc = Number(settlementDiscount) || 0;
    const cash = Number(settledCashAmount) || 0;

    if (disc < 0 || cash < 0) {
      toast.warning("টাকার পরিমাণ সঠিক নয়!");
      return;
    }

    if (Math.abs(disc + cash - remainingDue) > 0.05) {
      toast.warning(
        `ছাড় এবং গৃহীত ক্যাশের যোগফল অবশ্যই মোট বকেয়ার (৳${remainingDue.toFixed(2)}) সমান হতে হবে!`
      );
      return;
    }

    setIsSettling(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_LOCALHOST_KEY}/customers/settle_installment_card.php`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            card_id: Number(card?.card_id),
            discount_amount: disc,
            final_settled_amount: cash,
            payment_method: settlementPaymentMethod || "Cash",
            settlement_date: settlementDate || today,
            note: settlementNote,
            settled_by: activeStaffId,
          }),
        }
      );

      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "কার্ড নিষ্পত্তি সফল হয়েছে 🎉");
        setIsSettlementModalOpen(false);
        fetchCardSettlement();
        refetch?.();
      } else {
        toast.error(data.message || "নিষ্পত্তি ব্যর্থ হয়েছে");
      }
    } catch (err) {
      toast.error("সার্ভার এরর: নিষ্পত্তি সম্পন্ন করা যায়নি");
    } finally {
      setIsSettling(false);
    }
  };

  const handleMarkFullPaid = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_LOCALHOST_KEY}/customers/installment_card_update.php`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            card_id: Number(card?.card_id),
            status: "Fully Paid",
          }),
        }
      );

      const data = await res.json();
      if (data.success) {
        toast.success(`কার্ড #${card.card_id} সম্পূর্ণ পরিশোধিত (Fully Paid) হিসেবে চিহ্নিত হয়েছে ✅`);
        setTimeout(() => {
          navigate("/customers/installment_cards");
        }, 300);
      }
    } catch (err) {
      toast.error("কার্ড আপডেট করা যায়নি");
    }
  };



  // Helper to fix any corrupted tag in Bengali
  const getCleanTag = (item, index) => {
    if (Number(item?.installment_no) === 0) return "ডাউন পেমেন্ট";
    if (!item?.tag || item.tag.includes("?") || item.tag.trim() === "") {
      const idx = Number(item?.installment_no) || index + 1;
      return `${bnNumbers[idx - 1] || `${idx}তম`} কিস্তি`;
    }
    return item.tag;
  };

  return (
    <div className="space-y-6">
      {/* ===== Existing Settlement Banner ===== */}
      {cardSettlementInfo && (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-950/40 via-slate-900/90 to-emerald-950/40 border border-amber-500/30 shadow-2xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center text-xl shadow-inner">
              <FaReceipt />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-white">অগ্রিম নিষ্পত্তিকৃত কার্ড</span>
                <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/40">Settled Early</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                তারিখ: {cardSettlementInfo.settlement_date} &bull; অনুমোদনকারী: {cardSettlementInfo.staff_name || cardSettlementInfo.settled_by_name || "Admin"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
            <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-400">বকেয়া ছিল: </span>
              <span className="text-white font-bold">৳{Number(cardSettlementInfo.remaining_due).toFixed(2)}</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-rose-950/40 border border-rose-500/30">
              <span className="text-rose-300">ছাড়: </span>
              <span className="text-rose-400 font-extrabold">-৳{Number(cardSettlementInfo.discount_amount).toFixed(2)}</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
              <span className="text-emerald-300">গৃহীত ক্যাশ: </span>
              <span className="text-emerald-400 font-extrabold">৳{Number(cardSettlementInfo.final_settled_amount).toFixed(2)}</span>
            </div>
            <button
              onClick={() => setIsSettlementDetailsOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-400/30 font-sans font-bold transition cursor-pointer"
            >
              বিস্তারিত দেখুন
            </button>
          </div>
        </div>
      )}

      {/* ===== Table Container ===== */}
      <div className="overflow-x-auto rounded-3xl bg-gradient-to-b from-slate-900/95 via-[#0C1427]/90 to-slate-950/95 border border-slate-800 shadow-2xl sl-scroll">
        <table className="w-full text-left text-xs text-slate-300 min-w-[950px]">
          <thead className="bg-[#070D1E] text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
            <tr>
              {headers.map((h, i) => (
                <th key={i} className="py-4 px-3.5 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
            {/* DOWN PAYMENT ROW */}
            {hasDownPayment && (
              <DownPaymentRow
                card={card}
                amount={downPaymentAmount}
                calc={downPaymentCalc}
                today={today}
              />
            )}

            {/* UNINITIALIZED INSTALLMENTS */}
            {installments.map((item, index) => (
              <InstallmentItemRow
                key={index}
                index={index}
                item={item}
                card={card}
                bnNumbers={bnNumbers}
                costPrice={costPrice}
                salePrice={salePrice}
                onAmountChange={handleAmountChange}
                payments={InstallmentPayments}
              />
            ))}

            {/* SAVED PAYMENTS */}
            {InstallmentPayments.map((item, index) => {
              const currentStatus =
                payments[index]?.status ||
                (cardSettlementInfo ? "Waived" : "Unpaid");
              const isPaid = currentStatus === "Paid";
              const isWaived =
                currentStatus === "Waived" || (Boolean(cardSettlementInfo) && !isPaid);
              const tagText = getCleanTag(item, index);

              return (
                <tr
                  key={item.id || index}
                  className={`hover:bg-slate-800/40 transition-colors ${
                    isPaid
                      ? "bg-emerald-500/[0.03]"
                      : isWaived
                      ? "bg-amber-500/[0.03]"
                      : ""
                  }`}
                >
                  {/* Tag Column */}
                  <td className="py-3 px-3.5 font-bold text-white whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          isPaid
                            ? "bg-emerald-400"
                            : isWaived
                            ? "bg-amber-400 animate-pulse"
                            : "bg-slate-500"
                        }`}
                      />
                      <span>{tagText}</span>
                      {isWaived && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 font-semibold ml-1">
                          মওকুফ
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Due Amount */}
                  <td className="py-3 px-3.5">
                    <input
                      value={item?.due_amount}
                      readOnly
                      className="w-24 bg-[#070D1E] border border-slate-700/80 rounded-xl px-2.5 py-1.5 font-mono font-bold text-white text-xs text-center focus:outline-none"
                    />
                  </td>

                  {/* Principal */}
                  <td className="py-3 px-3.5">
                    <input
                      value={item?.principal_amount}
                      readOnly
                      className="w-24 bg-[#070D1E] border border-slate-700/80 rounded-xl px-2.5 py-1.5 font-mono font-semibold text-emerald-400 text-xs text-center focus:outline-none"
                    />
                  </td>

                  {/* Profit */}
                  <td className="py-3 px-3.5">
                    <input
                      value={item?.profit_amount}
                      readOnly
                      className="w-24 bg-[#070D1E] border border-slate-700/80 rounded-xl px-2.5 py-1.5 font-mono font-semibold text-amber-300 text-xs text-center focus:outline-none"
                    />
                  </td>

                  {/* Due Date */}
                  <td className="py-3 px-3.5">
                    <input
                      type="date"
                      defaultValue={item?.due_date}
                      readOnly
                      className="bg-[#070D1E] border border-slate-700/80 rounded-xl px-2.5 py-1.5 font-mono text-slate-300 text-xs focus:outline-none date-fix"
                    />
                  </td>

                  {/* Paid Date */}
                  <td className="py-3 px-3.5">
                    {isPaid ? (
                      <input
                        type="date"
                        value={payments[index]?.paid_date || today}
                        onChange={(e) => handlePaidDateChange(index, e.target.value)}
                        className="bg-[#070D1E] border border-emerald-500/50 rounded-xl px-2.5 py-1.5 font-mono text-emerald-300 text-xs focus:outline-none date-fix"
                      />
                    ) : isWaived ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-950/40 px-2.5 py-1.5 rounded-xl border border-amber-500/40">
                        <FaCheckCircle className="text-[10px]" /> Waived / ছাড়
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-700/50">
                        <FaClock className="text-[10px]" /> Not Paid
                      </span>
                    )}
                  </td>

                  {/* Payment Method */}
                  <td className="py-3 px-3.5">
                    <select
                      value={payments[index]?.payment_method || "Cash"}
                      disabled={Boolean(cardSettlementInfo)}
                      onChange={(e) => handlePaymentMethodChange(index, e.target.value)}
                      className={`bg-[#070D1E] border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400 ${
                        cardSettlementInfo ? "opacity-60 cursor-not-allowed" : ""
                      }`}
                    >
                      <option value="Cash">Cash</option>
                      <option value="Bank">Bank</option>
                      <option value="Bkash">Bkash</option>
                      <option value="Nagad">Nagad</option>
                    </select>
                  </td>

                  {/* Receipt Number */}
                  <td className="py-3 px-3.5">
                    <input
                      value={payments[index]?.receipt_number || ""}
                      disabled={Boolean(cardSettlementInfo)}
                      onChange={(e) => handleReceiptChange(index, e.target.value)}
                      placeholder="Receipt #"
                      className={`w-24 bg-[#070D1E] border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 ${
                        cardSettlementInfo ? "opacity-60 cursor-not-allowed" : ""
                      }`}
                    />
                  </td>

                  {/* Status Dropdown */}
                  <td className="py-3 px-3.5">
                    <select
                      value={isWaived ? "Waived" : (payments[index]?.status || "Unpaid")}
                      disabled={Boolean(cardSettlementInfo)}
                      onChange={(e) => handleStatusChange(index, e.target.value)}
                      className={`rounded-xl px-2.5 py-1.5 text-xs font-bold border focus:outline-none ${
                        cardSettlementInfo ? "opacity-70 cursor-not-allowed" : ""
                      } ${
                        isPaid
                          ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                          : isWaived
                          ? "bg-amber-500/15 border-amber-500/40 text-amber-300"
                          : "bg-slate-800 border-slate-700 text-slate-300"
                      }`}
                    >
                      <option value="Paid" className="bg-slate-900 text-emerald-300 font-bold">
                        Paid
                      </option>
                      <option value="Unpaid" className="bg-slate-900 text-slate-300">
                        Unpaid
                      </option>
                      <option value="Waived" className="bg-slate-900 text-amber-300 font-bold">
                        Waived (মওকুফ/ছাড়)
                      </option>
                    </select>
                  </td>

                  {/* Action Save Button */}
                  <td className="py-3 px-3.5">
                    <button
                      onClick={() => handleUpdateInstallment(index)}
                      disabled={Boolean(cardSettlementInfo)}
                      title={cardSettlementInfo ? "কার্ডটি ইতোমধ্যে নিষ্পত্তি করা হয়েছে" : "Save Changes"}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center transition shadow-sm ${
                        cardSettlementInfo
                          ? "bg-slate-800 text-slate-600 border border-slate-700 cursor-not-allowed"
                          : "bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-400/30"
                      }`}
                    >
                      <FiSave className="text-xs" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ===== Bottom Actions Bar ===== */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        {/* Payment Edit History Button */}
        {InstallmentPayments.length > 0 && (
          <button
            onClick={fetchPaymentHistory}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#0C1427] hover:bg-[#131f3b] text-cyan-300 hover:text-cyan-200 border border-cyan-500/30 text-xs font-bold shadow-md shadow-cyan-500/10 transition"
          >
            <FaHistory className="text-cyan-400" />
            <span>পেমেন্ট এডিট হিস্ট্রি দেখুন</span>
          </button>
        )}

        <div className="flex flex-wrap items-center gap-3 ml-auto">
          {/* Save New Schedule */}
          {installmentType && (
            <button
              onClick={() => {
                handleSaveAll();
                onSaveSuccess?.();
              }}
              className="flex items-center gap-2 rounded-2xl px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-xs sm:text-sm font-bold text-white shadow-lg shadow-cyan-500/25 transition"
            >
              <FiSave className="text-sm" />
              <span>Save Installment Schedule</span>
            </button>
          )}

          {/* Mark Full Paid (Only for running cards that are not yet settled) */}
          {InstallmentPayments.length > 0 && !cardSettlementInfo && card?.status !== "Fully Paid" && (
            <button
              disabled={!isAllPaid}
              onClick={handleMarkFullPaid}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition shadow-lg ${isAllPaid
                  ? "bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white shadow-emerald-500/25 cursor-pointer"
                  : "bg-slate-800/80 border border-slate-700 text-slate-500 cursor-not-allowed opacity-60"
                }`}
            >
              <FaCheckCircle />
              <span>Mark as Full Paid</span>
            </button>
          )}

          {/* Settled indicator badge when already settled */}
          {(Boolean(cardSettlementInfo) || card?.status === "Fully Paid") && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
              <FaCheckCircle className="text-emerald-400" />
              <span>কার্ডটি সম্পূর্ণ পরিশোধিত ও নিষ্পত্তি সম্পন্ন</span>
            </div>
          )}

          {/* Early Settlement Button */}
          {InstallmentPayments.length > 0 && !isAllPaid && remainingDue > 0 && !cardSettlementInfo && (
            <button
              onClick={handleOpenSettlement}
              className="flex items-center gap-2 rounded-2xl px-5 py-2.5 bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-xs sm:text-sm font-bold text-white shadow-lg shadow-amber-500/20 transition cursor-pointer"
            >
              <FaFire className="text-xs" />
              <span>অগ্রিম নিষ্পত্তি ও ছাড় (Early Settlement)</span>
            </button>
          )}


        </div>
      </div>

      {/* ===== Audit History Modal ===== */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl rounded-3xl bg-[#0B1324] border border-slate-800 p-6 space-y-5 shadow-2xl max-h-[85vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex items-center justify-center text-sm shadow-sm">
                  <FaHistory />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">কিস্তি পেমেন্ট এডিট হিস্ট্রি ও অডিট লগ</h3>
                  <p className="text-xs text-slate-400">কার্ড #{card?.card_id || card?.id} এর সকল পেমেন্ট পরিবর্তনের টাইমলাইন</p>
                </div>
              </div>
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
              >
                <FaTimes />
              </button>
            </div>

            {/* Modal Content / Timeline */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 sl-scroll">
              {isHistoryLoading ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  হিস্ট্রি লোড হচ্ছে...
                </div>
              ) : historyLogs.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-[#070D1E] border border-slate-800 text-slate-400 space-y-1">
                  <FaClock className="text-2xl text-slate-600 mx-auto mb-2" />
                  <p className="font-semibold text-slate-300">কোন এডিট হিস্ট্রি নেই</p>
                  <p className="text-xs text-slate-500">এখনো পর্যন্ত এই কার্ডের কোন কিস্তি পরিবর্তন বা এডিট করা হয়নি।</p>
                </div>
              ) : (
                historyLogs.map((log) => {
                  const instNo = Number(log?.installment_no);
                  const cleanTagText =
                    instNo === 0
                      ? "ডাউন পেমেন্ট"
                      : !log?.tag || log.tag.includes("?")
                        ? `${bnNumbers[instNo - 1] || `${instNo}তম`} কিস্তি`
                        : log.tag;

                  const isMarkedPaid = log.new_status === "Paid";
                  const isMarkedUnpaid = log.old_status === "Paid" && log.new_status === "Unpaid";

                  return (
                    <div
                      key={log.id}
                      className="p-4 rounded-2xl bg-[#070D1E]/95 border border-slate-800/90 hover:border-slate-700 space-y-3 transition shadow-md"
                    >
                      {/* Top Action & Timestamp Row */}
                      <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-xl bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-400/30 text-xs shadow-sm">
                            {cleanTagText}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold border ${isMarkedPaid
                                ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                                : isMarkedUnpaid
                                  ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                                  : "bg-indigo-500/15 text-indigo-300 border-indigo-500/30"
                              }`}
                          >
                            {log.action || (isMarkedPaid ? "কিস্তি পেইড করা হয়েছে" : "পেমেন্ট আপডেট")}
                          </span>
                        </div>

                        {/* Exact Date & Time */}
                        <span className="text-[11px] font-mono font-bold text-slate-300 bg-slate-800/90 px-2.5 py-1 rounded-lg border border-slate-700/60 flex items-center gap-1.5 shadow-sm">
                          <FaClock className="text-cyan-400 text-[10px]" />
                          <span>{log.created_at}</span>
                        </span>
                      </div>

                      {/* Highlighted Banner for Payment Date & Cancellation */}
                      {(log.old_paid_date || log.new_paid_date) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {log.old_paid_date && log.old_paid_date !== "None" && (
                            <div className="p-2.5 rounded-xl bg-[#070D1E] border border-slate-800 flex items-center justify-between">
                              <span className="text-slate-400 flex items-center gap-1.5">
                                <FaCalendarAlt className="text-amber-400 text-[10px]" /> পূর্বের পরিশোধের তারিখ:
                              </span>
                              <span className="font-mono font-bold text-amber-300">
                                {log.old_paid_date}
                              </span>
                            </div>
                          )}

                          {log.new_paid_date && log.new_paid_date !== "None" && (
                            <div className="p-2.5 rounded-xl bg-[#070D1E] border border-slate-800 flex items-center justify-between">
                              <span className="text-slate-400 flex items-center gap-1.5">
                                <FaCalendarAlt className="text-emerald-400 text-[10px]" /> বর্তমান পরিশোধের তারিখ:
                              </span>
                              <span className="font-mono font-bold text-emerald-300">
                                {log.new_paid_date}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Detailed Changes Matrix */}
                      <div className="space-y-1.5 pt-0.5">
                        {log.changes_list && log.changes_list.length > 0 ? (
                          log.changes_list.map((ch, cIdx) => (
                            <div
                              key={cIdx}
                              className="flex items-center justify-between gap-3 text-xs bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80"
                            >
                              <span className="text-slate-300 font-semibold w-32 shrink-0">
                                {ch.field === "Status"
                                  ? "স্ট্যাটাস (Status)"
                                  : ch.field === "Paid Date"
                                    ? "পরিশোধের তারিখ (Paid Date)"
                                    : ch.field === "Payment Method"
                                      ? "পেমেন্ট মেথড"
                                      : ch.field === "Receipt Number"
                                        ? "রশিদ নম্বর"
                                        : ch.field}
                                :
                              </span>

                              <div className="flex items-center gap-2 font-mono flex-wrap justify-end">
                                <span className="text-[10px] text-slate-500 uppercase font-semibold">আগে:</span>
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[11px] ${ch.old === "Paid"
                                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold"
                                      : "bg-slate-800 text-slate-400 border border-slate-700"
                                    }`}
                                >
                                  {ch.old || "None"}
                                </span>

                                <FaExchangeAlt className="text-slate-600 text-[10px]" />

                                <span className="text-[10px] text-slate-400 uppercase font-semibold">পরে:</span>
                                <span
                                  className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${ch.new === "Paid"
                                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                      : ch.new === "Unpaid"
                                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                        : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                                    }`}
                                >
                                  {ch.new || "None"}
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-xs text-slate-400 bg-slate-900/50 p-2 rounded-xl">
                            {log.action}
                          </div>
                        )}
                      </div>

                      {/* Editor & Author Info */}
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1.5 border-t border-slate-800/60">
                        <span className="flex items-center gap-1.5">
                          <FaUser className="text-cyan-400 text-[10px]" />
                          <span>পরিবর্তনকারী স্টাফ/এডমিন:</span>
                          <span className="text-slate-200 font-bold">{log.edited_by_name}</span>
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Early Settlement Modal ===== */}
      {isSettlementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-xl rounded-3xl bg-[#0B1324] border border-amber-500/30 p-6 sm:p-7 space-y-6 shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center text-lg shadow-inner">
                  <FaFire />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    কার্ড অগ্রিম নিষ্পত্তি ও ছাড় (Early Settlement)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    কার্ড #{card?.card_id || card?.id} &bull; গ্রাহক: {card?.user_name || "Customer"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSettlementModalOpen(false)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition cursor-pointer"
              >
                <FaTimes />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto space-y-5 pr-1 sl-scroll">
              {/* Summary 3-Box Grid */}
              <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-center">
                  <p className="text-[10px] sm:text-xs text-slate-400 font-medium">মোট চুক্তি মূল্য</p>
                  <p className="text-xs sm:text-sm font-bold text-slate-200 mt-1 font-mono">
                    ৳{totalOriginalAmount.toFixed(2)}
                  </p>
                </div>
                <div className="p-3 sm:p-3.5 rounded-2xl bg-emerald-950/25 border border-emerald-500/25 text-center">
                  <p className="text-[10px] sm:text-xs text-emerald-400 font-medium">পরিশোধিত</p>
                  <p className="text-xs sm:text-sm font-bold text-emerald-300 mt-1 font-mono">
                    ৳{totalPaidSoFar.toFixed(2)}
                  </p>
                </div>
                <div className="p-3 sm:p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-500/35 text-center">
                  <p className="text-[10px] sm:text-xs text-cyan-300 font-bold">বর্তমান বকেয়া</p>
                  <p className="text-xs sm:text-sm font-extrabold text-cyan-200 mt-1 font-mono">
                    ৳{remainingDue.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Settlement Form Inputs */}
              <div className="space-y-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 p-4">
                {/* Discount Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-bold text-rose-300">
                      বিশেষ ছাড় / ডিসকাউন্ট (৳)
                    </label>
                    <span className="text-[10px] text-slate-400">মওকুফকৃত পরিমাণ</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max={remainingDue}
                    value={settlementDiscount}
                    onChange={(e) => handleDiscountChange(e.target.value)}
                    placeholder="0"
                    className="w-full bg-[#070D1E] border border-rose-500/40 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-rose-300 focus:outline-none focus:border-rose-400"
                  />
                  {/* Preset Discount Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-slate-500">কুইক সিলেক্ট:</span>
                    {[500, 1000, 2000, 3000].filter(a => a < remainingDue).map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handleDiscountChange(preset)}
                        className="px-2 py-0.5 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-mono transition cursor-pointer"
                      >
                        ৳{preset}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleDiscountChange(remainingDue)}
                      className="px-2 py-0.5 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono transition cursor-pointer"
                    >
                      সম্পূর্ণ ছাড় (১০০%)
                    </button>
                  </div>
                </div>

                {/* Final Cash Payable Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-bold text-emerald-300">
                      কাস্টমার আজ নগদ জমা দেবে (৳)
                    </label>
                    <span className="text-[10px] text-emerald-400">প্রকৃত ক্যাশ ইন</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max={remainingDue}
                    value={settledCashAmount}
                    onChange={(e) => handleCashChange(e.target.value)}
                    placeholder="0"
                    className="w-full bg-[#070D1E] border border-emerald-500/40 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-emerald-300 focus:outline-none focus:border-emerald-400"
                  />
                </div>

                {/* Payment Method & Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      পেমেন্ট মেথড
                    </label>
                    <select
                      value={settlementPaymentMethod}
                      onChange={(e) => setSettlementPaymentMethod(e.target.value)}
                      className="w-full bg-[#070D1E] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    >
                      <option value="Cash">Cash (নগদ)</option>
                      <option value="Bkash">bKash</option>
                      <option value="Nagad">Nagad</option>
                      <option value="Bank">Bank Transfer</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      নিষ্পত্তির তারিখ
                    </label>
                    <input
                      type="date"
                      value={settlementDate}
                      onChange={(e) => setSettlementDate(e.target.value)}
                      className="w-full bg-[#070D1E] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* Note */}
                <div className="space-y-1.5 pt-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    মন্তব্য / ছাড়ের কারণ (Note)
                  </label>
                  <input
                    type="text"
                    value={settlementNote}
                    onChange={(e) => setSettlementNote(e.target.value)}
                    placeholder="যেমন: এককালীন সম্পূর্ণ পরিশোধ করায় ২,০০০ টাকা বিশেষ ছাড়"
                    className="w-full bg-[#070D1E] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Informational Notice */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 leading-relaxed flex items-start gap-2.5">
                <FaFire className="text-amber-400 shrink-0 mt-0.5" />
                <p>
                  নিষ্পত্তি করার পর ক্যাশ রিপোর্টে শুধুমাত্র <b>৳{Number(settledCashAmount || 0).toFixed(2)}</b> টাকা ক্যাশ ইন হিসেবে যোগ হবে। কিস্তির মূল রেকর্ড ডিলিট হবে না, অবশিষ্ট কিস্তিগুলো <b>'Waived' (ছাড়)</b> হিসেবে সংরক্ষিত থাকবে।
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                disabled={isSettling}
                onClick={() => setIsSettlementModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                disabled={isSettling}
                onClick={handleConfirmSettlement}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-xs font-bold text-white shadow-lg shadow-amber-500/25 transition cursor-pointer disabled:opacity-60"
              >
                {isSettling ? (
                  <span>প্রসেসিং হচ্ছে...</span>
                ) : (
                  <>
                    <FaCheckCircle className="text-xs" />
                    <span>ছাড় অনুমোদন ও নিষ্পত্তি সম্পন্ন করুন</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Existing Settlement Details Modal ===== */}
      {isSettlementDetailsOpen && cardSettlementInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-[#0B1324] border border-amber-500/30 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center text-sm">
                  <FaReceipt />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">অগ্রিম নিষ্পত্তি মেমো ও বিবরণী</h3>
                  <p className="text-xs text-slate-400">কার্ড #{cardSettlementInfo.card_id} &bull; আইডি #{cardSettlementInfo.id}</p>
                </div>
              </div>
              <button
                onClick={() => setIsSettlementDetailsOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <FaTimes />
              </button>
            </div>

            <div className="space-y-3 text-xs divide-y divide-slate-800/80 font-mono">
              <div className="flex justify-between py-1.5 text-slate-300">
                <span>মূল চুক্তি মূল্য:</span>
                <span className="font-bold text-white">৳{Number(cardSettlementInfo.total_original_amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1.5 text-slate-300">
                <span>নিষ্পত্তির পূর্বে পরিশোধিত:</span>
                <span className="font-bold text-emerald-400">৳{Number(cardSettlementInfo.total_paid_before).toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1.5 text-slate-300">
                <span>নিষ্পত্তিকালীন বকেয়া:</span>
                <span className="font-bold text-cyan-300">৳{Number(cardSettlementInfo.remaining_due).toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1.5 text-slate-300">
                <span className="text-rose-400 font-bold">অনুমোদিত বিশেষ ছাড়:</span>
                <span className="font-extrabold text-rose-400">-৳{Number(cardSettlementInfo.discount_amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 text-sm bg-emerald-950/20 px-3 rounded-xl border border-emerald-500/20">
                <span className="text-emerald-300 font-bold">নগদ গৃহীত টাকা:</span>
                <span className="font-extrabold text-emerald-400">৳{Number(cardSettlementInfo.final_settled_amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1.5 text-slate-400 font-sans">
                <span>পেমেন্ট মেথড:</span>
                <span className="text-slate-200">{cardSettlementInfo.payment_method}</span>
              </div>
              <div className="flex justify-between py-1.5 text-slate-400 font-sans">
                <span>নিষ্পত্তির তারিখ:</span>
                <span className="text-slate-200">{cardSettlementInfo.settlement_date}</span>
              </div>
              <div className="flex justify-between py-1.5 text-slate-400 font-sans">
                <span>অনুমোদনকারী স্টাফ:</span>
                <span className="text-slate-200 font-bold">{cardSettlementInfo.staff_name || cardSettlementInfo.settled_by_name || "Admin"}</span>
              </div>
              {cardSettlementInfo.note && (
                <div className="py-2 text-slate-400 font-sans">
                  <span className="block font-semibold text-slate-300 mb-0.5">নোট:</span>
                  <p className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 text-slate-300">{cardSettlementInfo.note}</p>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setIsSettlementDetailsOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
