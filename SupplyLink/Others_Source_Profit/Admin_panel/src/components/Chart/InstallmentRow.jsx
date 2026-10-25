import { useState, useEffect } from "react";
import { FiSave, FiCheck, FiLoader, FiAlertTriangle, FiClock, FiRotateCcw } from "react-icons/fi";
import { FaCheckCircle, FaMoneyBillWave, FaFire } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { InstallmentItemRow } from "./InstallmentItemRow";
import { DownPaymentRow } from "./DownPaymentRow";
import InstallmentHistoryModal from "./InstallmentHistoryModal";
import { EarlySettlementModal } from "../Modal/EarlySettlementModal";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const pad2 = (n) => String(n).padStart(2, "0");

const toYMD = (d) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

const addMonthsYMD = (ymd, add) => {
  const [y, m, d] = (ymd || "").split("-").map(Number);
  if (!y || !m || !d) return "";

  const base = new Date(y, m - 1, d);
  const temp = new Date(base.getFullYear(), base.getMonth() + add, 1);

  const lastDay = new Date(
    temp.getFullYear(),
    temp.getMonth() + 1,
    0,
  ).getDate();

  const day = Math.min(d, lastDay);
  return toYMD(new Date(temp.getFullYear(), temp.getMonth(), day));
};

export const InstallmentRow = ({
  installmentType,
  hasDownPayment,
  card,
  onSaveSuccess,
  InstallmentPayments = [],
  user,
  refetch,
}) => {
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];

  /* ================= BASIC ================= */
  const installmentCount = Number(installmentType || 0);

  const bnNumbers = [
    "১ম", "২য়", "৩য়", "৪র্থ", "৫ম", "৬ষ্ঠ", "৭ম", "৮ম", "৯ম", "১০ম",
    "১১তম", "১২তম", "১৩তম", "১৪তম", "১৫তম", "১৬তম", "১৭তম", "১৮তম", "১৯তম", "২০তম",
    "২১তম", "২২তম", "২৩তম", "২৪তম",
  ];

  const costPrice = Number(card?.cost_price || 0);
  const salePrice = Number(card?.sale_price || 0);
  const baseAmount = Number(card?.per_installment_amount || 0);

  /* ================= CORE CALCULATION ================= */
  const calculatePrincipalProfit = (amount) => {
    const due = Number(amount) || 0;

    if (costPrice > 0 && salePrice > 0) {
      const principal = Number(((due * costPrice) / salePrice).toFixed(2));
      const profit = Number((due - principal).toFixed(2));
      return { principal, profit };
    }

    return { principal: 0, profit: 0 };
  };

  /* ================= DOWN PAYMENT ================= */
  const downPaymentAmount = Number(card?.down_payment || 0);
  const downPaymentCalc = calculatePrincipalProfit(downPaymentAmount);

  /* ================= PRINCIPAL-BASED ADJUSTMENT ================= */
  const basePrincipal = Number(
    ((baseAmount * costPrice) / salePrice).toFixed(2),
  );
  const principalSum = basePrincipal * installmentCount;
  const principalDiff = Number((costPrice - principalSum).toFixed(2));

  /* ================= INSTALLMENTS STATE ================= */
  const [installments, setInstallments] = useState([]);
  const [savingIndex, setSavingIndex] = useState(null);
  const [savedRowIndex, setSavedRowIndex] = useState(null);
  const [popup, setPopup] = useState(null);
  const [isCardHistoryOpen, setIsCardHistoryOpen] = useState(false);
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);

  useEffect(() => {
    const handleUpdateEvent = () => {
      refetch?.();
    };
    window.addEventListener("installment_updated", handleUpdateEvent);
    return () => {
      window.removeEventListener("installment_updated", handleUpdateEvent);
    };
  }, [refetch]);

  useEffect(() => {
    if (!popup) return;
    const timer = setTimeout(() => {
      setPopup(null);
    }, 3800);
    return () => clearTimeout(timer);
  }, [popup]);

  useEffect(() => {
    setInstallments(
      Array.from({ length: installmentCount }).map((_, index) => {
        if (!hasDownPayment && index === 0 && principalDiff !== 0) {
          const adjustedPrincipal = basePrincipal + principalDiff;
          const adjustedAmount = Number(
            ((adjustedPrincipal * salePrice) / costPrice).toFixed(2),
          );
          return { amount: adjustedAmount };
        }
        return { amount: baseAmount };
      }),
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

  /* ================= EXISTING PAYMENTS STATE ================= */
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    const sorted = [...InstallmentPayments].sort((a, b) => {
      const isADown =
        Number(a.installment_no) === 0 ||
        String(a.tag).includes("ডাউন") ||
        String(a.tag).toLowerCase().includes("down");
      const isBDown =
        Number(b.installment_no) === 0 ||
        String(b.tag).includes("ডাউন") ||
        String(b.tag).toLowerCase().includes("down");
      if (isADown && !isBDown) return -1;
      if (!isADown && isBDown) return 1;
      return Number(a.installment_no || 0) - Number(b.installment_no || 0);
    });

    setPayments(
      sorted.map((p) => ({
        ...p,
      })),
    );
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

  /* ================= SINGLE ROW UPDATE ================= */
  const handleUpdateInstallment = async (index) => {
    const updatedItem = payments[index];
    const payload = {
      id: updatedItem.id,
      paid_date:
        updatedItem.status === "Paid" ? updatedItem.paid_date || today : null,
      payment_method: updatedItem.payment_method,
      receipt_number: updatedItem.receipt_number,
      status: updatedItem.status,
      signature: user?.id,
    };

    setSavingIndex(index);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_LOCALHOST_KEY}/customers/installment_payment_update.php`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const data = await res.json();
      if (data.success !== false) {
        if (data.pending_approval) {
          setPopup({
            title: "অনুরোধটি পেন্ডিং রয়েছে",
            message:
              data.message ||
              "পেইড কিস্তি আনপেইড করার অনুরোধটি সফলভাবে জমা হয়েছে। অ্যাডমিন বা ডেভেলপার অনুমোদন করলে এটি আনপেইড হবে।",
            tag: updatedItem.tag || "কিস্তি",
            amount: updatedItem.due_amount,
            type: "warning",
          });
        } else {
          setPopup({
            title: "পেমেন্ট সফলভাবে সংরক্ষিত!",
            message: data.cash_synced
              ? "ক্যাশ ইন (Approved) হিসেবে সফলভাবে অন্তর্ভুক্ত হয়েছে।"
              : "কিস্তির তথ্য সফলভাবে আপডেট হয়েছে।",
            tag: updatedItem.tag || "কিস্তি",
            amount: updatedItem.due_amount,
            type: "success",
          });
        }
        setSavedRowIndex(index);
        setTimeout(() => setSavedRowIndex(null), 2500);
        refetch?.();
      } else {
        setPopup({
          title: "সংরক্ষণ ব্যর্থ হয়েছে",
          message: data.message || data.error || "অনুগ্রহ করে পুনরায় চেষ্টা করুন।",
          type: "error",
        });
      }
    } catch (err) {
      setPopup({
        title: "সার্ভার এরর",
        message: "সার্ভারে সমস্যা হয়েছে, তথ্য আপডেট করা যায়নি।",
        type: "error",
      });
    } finally {
      setSavingIndex(null);
    }
  };

  /* ================= BUILD PAYLOAD ================= */
  const buildPaymentsPayload = () => {
    const rows = [];

    if (hasDownPayment && downPaymentAmount > 0) {
      const { principal, profit } = calculatePrincipalProfit(downPaymentAmount);
      rows.push({
        card_id: card.id,
        installment_no: 0,
        tag: "ডাউন পেমেন্ট",
        due_amount: downPaymentAmount,
        principal_amount: principal,
        profit_amount: profit,
        due_date: card.delivery_date || today,
        paid_date: card.delivery_date || today,
        payment_method: "Cash",
        receipt_number: "",
        signature: null,
        status: "Paid",
      });
    }

    const firstDue = card.first_installment_date;
    installments.forEach((inst, index) => {
      const { principal, profit } = calculatePrincipalProfit(inst.amount);
      const dueDate = addMonthsYMD(firstDue, index);
      rows.push({
        card_id: card.id,
        installment_no: index + 1,
        tag: `${bnNumbers[index] || index + 1} কিস্তি`,
        due_amount: inst.amount,
        principal_amount: principal,
        profit_amount: profit,
        due_date: dueDate,
        paid_date: null,
        payment_method: "Cash",
        receipt_number: "",
        signature: null,
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
        },
      );
      const data = await res.json();
      if (data.success) {
        toast.success(
          "কিস্তি সংক্রান্ত সকল তথ্য সফলভাবে সিস্টেমে সংরক্ষিত হয়েছে।",
        );
        onSaveSuccess?.();
        refetch?.();
        navigate("/customers/installment_cards");
      } else {
        toast.error(data.error || "সংরক্ষণ করা যায়নি");
      }
    } catch (err) {
      toast.error("সার্ভার সমস্যা হয়েছে, পরে আবার চেষ্টা করুন");
    }
  };

  /* ================= MARK FULL PAID ================= */
  const isAllPaid =
    payments.length > 0 &&
    payments.every((p) => p.status === "Paid" || p.status === "Waived");

  const handleMarkFullPaid = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_LOCALHOST_KEY}/customers/installment_card_update.php`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            card_id: card.id,
            status: "Fully Paid",
          }),
        },
      );

      const data = await res.json();
      if (data.success) {
        refetch?.();
        navigate("/customers/installment_cards", {
          state: {
            luxuryToast: {
              title: "সম্পূর্ণ পরিশোধিত! 🎉",
              message: `কার্ড #${card.card_number || card.id} সম্পূর্ণ পরিশোধিত (Fully Paid) হিসেবে চিহ্নিত করা হয়েছে।`,
              tag: `কার্ড #${card.card_number || card.id}`,
              amount: card.sale_price || card.total_due_amount,
              type: "success",
            },
          },
        });
      }
    } catch (err) {
      toast.error("কার্ড আপডেট করা যায়নি");
    }
  };

  /* ================= FULL SETTLEMENT / EARLY CLOSE ================= */
  const handleEarlyClose = () => {
    setIsSettlementModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* ================= TABLE WRAPPER ================= */}
      <div className="rounded-2xl bg-[#060b18] border border-slate-800/80 shadow-2xl overflow-hidden p-3 sm:p-5">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-xs border-separate border-spacing-y-2.5">
            <thead>
              <tr className="text-slate-400 font-medium text-[11px]">
                <th className="pb-3 px-3 min-w-[120px]">ট্যাগ / কিস্তি</th>
                <th className="pb-3 px-2 min-w-[105px] text-center">পরিমাণ (৳)</th>
                <th className="pb-3 px-2 min-w-[105px] text-center">মূলধন (৳)</th>
                <th className="pb-3 px-2 min-w-[95px] text-center">লাভ (৳)</th>
                <th className="pb-3 px-2 min-w-[115px] text-center">নির্ধারিত তারিখ</th>
                <th className="pb-3 px-2 min-w-[135px] text-center">পরিশোধের তারিখ</th>
                <th className="pb-3 px-2 min-w-[105px] text-center">পেমেন্ট মেথড</th>
                <th className="pb-3 px-2 min-w-[105px] text-center">রশিদ নম্বর</th>
                <th className="pb-3 px-2 min-w-[105px] text-center">স্ট্যাটাস</th>
                <th className="pb-3 px-2 min-w-[65px] text-center">অ্যাকশন</th>
              </tr>
            </thead>

            <tbody className="text-slate-200">
              {/* ===== DOWN PAYMENT (IF ANY) ===== */}
              {hasDownPayment && (
                <DownPaymentRow
                  card={card}
                  amount={downPaymentAmount}
                  calc={downPaymentCalc}
                  today={today}
                />
              )}

              {/* ===== INSTALLMENTS FOR NEW GENERATION ===== */}
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

              {/* ===== EXISTING PAYMENTS (VIEW & UPDATE) ===== */}
              {payments.map((item, index) => {
                const isPaid = item.status === "Paid";
                const isWaived = item.status === "Waived";
                const isSavingThis = savingIndex === index;
                const isSavedRecently = savedRowIndex === index;

                return (
                  <tr
                    key={item.id || index}
                    className="hover:bg-slate-800/20 transition-colors"
                  >
                    {/* 1. Tag with glowing dot */}
                    <td className="py-1 px-3">
                      <div className="flex items-center gap-2 font-medium whitespace-nowrap">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            isWaived
                              ? "bg-purple-400 shadow-[0_0_8px_#c084fc]"
                              : Boolean(item.has_pending_edit)
                              ? "bg-amber-400 shadow-[0_0_8px_#fbbf24] animate-pulse"
                              : isPaid
                              ? "bg-emerald-400 shadow-[0_0_8px_#34d399]"
                              : "bg-slate-500"
                          }`}
                        />
                        <span
                          className={`text-xs ${
                            isWaived
                              ? "text-purple-300 font-semibold"
                              : isPaid
                              ? "text-slate-100 font-semibold"
                              : "text-slate-300"
                          }`}
                        >
                          {item.tag || `${bnNumbers[index] || index + 1} কিস্তি`}
                        </span>

                        {/* If Pending Edit Approval */}
                        {Boolean(item.has_pending_edit) && (
                          <span
                            className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] font-semibold text-amber-400"
                            title="অ্যাডমিন বা ডেভেলপারের অনুমোদনের অপেক্ষায় রয়েছে"
                          >
                            <FiClock className="h-2.5 w-2.5 animate-spin" />
                            <span>অনুমোদন পেন্ডিং</span>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 2. Due Amount */}
                    <td className="py-1 px-2">
                      <div className="w-full text-center rounded-full bg-[#0d1627] border border-slate-700/60 px-3 py-1.5 text-xs font-mono text-slate-100 font-medium">
                        {item.due_amount}
                      </div>
                    </td>

                    {/* 3. Principal Amount */}
                    <td className="py-1 px-2">
                      <div className="w-full text-center rounded-full bg-[#0d1627] border border-slate-700/60 px-3 py-1.5 text-xs font-mono text-emerald-400 font-medium">
                        {item.principal_amount}
                      </div>
                    </td>

                    {/* 4. Profit Amount */}
                    <td className="py-1 px-2">
                      <div className="w-full text-center rounded-full bg-[#0d1627] border border-slate-700/60 px-3 py-1.5 text-xs font-mono text-amber-300 font-medium">
                        {item.profit_amount}
                      </div>
                    </td>

                    {/* 5. Due Date */}
                    <td className="py-1 px-2">
                      <div className="w-full text-center rounded-full bg-[#0d1627] border border-slate-700/60 px-3 py-1.5 text-xs font-mono text-slate-300">
                        {item.due_date || "—"}
                      </div>
                    </td>

                    {/* 6. Paid Date */}
                    <td className="py-1 px-2">
                      {isWaived ? (
                        <div className="w-full text-center rounded-full bg-purple-950/40 border border-purple-500/30 px-3 py-1.5 text-[11px] font-semibold text-purple-300">
                          মওকুফ (Waived)
                        </div>
                      ) : isPaid ? (
                        <div className="w-full text-center rounded-full bg-[#0d1627] border border-slate-700/60 px-3 py-1.5 text-xs font-mono text-slate-200">
                          {item.paid_date || today}
                        </div>
                      ) : (
                        <div className="w-full rounded-full bg-[#0d1627] border border-slate-800 px-3 py-1.5 text-[11px] font-medium text-slate-400 flex items-center justify-center gap-1.5">
                          <span className="text-slate-500 text-xs">ⓘ</span> Not Paid
                        </div>
                      )}
                    </td>

                    {/* 7. Payment Method */}
                    <td className="py-1 px-2">
                      <div className="relative">
                        <select
                          disabled={isWaived}
                          value={item.payment_method || "Cash"}
                          onChange={(e) =>
                            handlePaymentMethodChange(index, e.target.value)
                          }
                          className="w-full rounded-full bg-[#0d1627] border border-slate-700/60 px-3 py-1.5 text-xs text-slate-200 text-center font-medium focus:outline-none focus:border-cyan-500 cursor-pointer appearance-none pr-6 disabled:opacity-50"
                        >
                          <option value="Cash" className="bg-[#0b1324]">
                            Cash
                          </option>
                          <option value="Bank" className="bg-[#0b1324]">
                            Bank
                          </option>
                          <option value="Bkash" className="bg-[#0b1324]">
                            Bkash
                          </option>
                          <option value="Nagad" className="bg-[#0b1324]">
                            Nagad
                          </option>
                        </select>
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[9px] pointer-events-none">
                          ▼
                        </span>
                      </div>
                    </td>

                    {/* 8. Receipt Number */}
                    <td className="py-1 px-2">
                      <input
                        type="text"
                        disabled={isWaived}
                        placeholder={isWaived ? "মওকুফ" : "Receipt #"}
                        value={item.receipt_number || ""}
                        onChange={(e) =>
                          handleReceiptChange(index, e.target.value)
                        }
                        className="w-full rounded-full bg-[#0d1627] border border-slate-700/60 px-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 text-center focus:outline-none focus:border-cyan-500 disabled:opacity-50"
                      />
                    </td>

                    {/* 9. Status */}
                    <td className="py-1 px-2">
                      {isWaived ? (
                        <div className="w-full rounded-full px-3 py-1.5 text-xs font-bold text-center bg-purple-500/15 border border-purple-500/40 text-purple-300 shadow-sm shadow-purple-500/10">
                          Waived (ছাড়)
                        </div>
                      ) : Boolean(item.has_pending_edit) ? (
                        <div
                          className="relative"
                          title="এই কিস্তিটি আনপেইড করার অনুরোধ বর্তমানে অ্যাডমিনের অনুমোদনের অপেক্ষায় রয়েছে"
                        >
                          <div className="w-full rounded-full px-3 py-1.5 text-xs font-semibold text-center bg-amber-500/15 border border-amber-500/40 text-amber-400 flex items-center justify-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />
                            <span>অনুমোদন পেন্ডিং</span>
                          </div>
                        </div>
                      ) : (
                        <div className="relative">
                          <select
                            value={item.status || "Unpaid"}
                            onChange={(e) =>
                              handleStatusChange(index, e.target.value)
                            }
                            className={`w-full rounded-full px-3 py-1.5 text-xs font-semibold text-center cursor-pointer appearance-none focus:outline-none transition-all pr-6 ${
                              isPaid
                                ? "bg-[#06201b] border border-emerald-500/60 text-emerald-400"
                                : "bg-[#0d1627] border border-slate-700/60 text-slate-300"
                            }`}
                          >
                            <option
                              value="Paid"
                              className="bg-[#06201b] text-emerald-400 font-semibold"
                            >
                              Paid
                            </option>
                            <option
                              value="Unpaid"
                              className="bg-[#0b1324] text-slate-300"
                            >
                              Unpaid
                            </option>
                            <option
                              value="Waived"
                              className="bg-[#1f0f35] text-purple-300 font-semibold"
                            >
                              Waived (ছাড়)
                            </option>
                          </select>
                          <span
                            className={`absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] pointer-events-none ${
                              isPaid ? "text-emerald-400" : "text-slate-400"
                            }`}
                          >
                            ▼
                          </span>
                        </div>
                      )}
                    </td>

                    {/* 10. Action Button (Save) */}
                    <td className="py-1 px-2 text-center">
                      <button
                        title={
                          Boolean(item.has_pending_edit)
                            ? "অনুরোধটি বর্তমানে পেন্ডিং রয়েছে"
                            : "এই কিস্তির তথ্য সেভ করুন"
                        }
                        disabled={isSavingThis || Boolean(item.has_pending_edit)}
                        onClick={() => handleUpdateInstallment(index)}
                        className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all mx-auto cursor-pointer ${
                          Boolean(item.has_pending_edit)
                            ? "bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed opacity-60"
                            : isSavedRecently
                            ? "bg-emerald-500 text-white border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                            : isSavingThis
                            ? "bg-slate-800 text-slate-400 border-slate-700 cursor-wait"
                            : "bg-teal-500/10 hover:bg-teal-500 text-teal-400 hover:text-black border-teal-500/40 hover:border-teal-400 shadow-[0_0_8px_rgba(20,184,166,0.2)]"
                        }`}
                      >
                        {isSavingThis ? (
                          <FiLoader className="animate-spin text-xs" />
                        ) : isSavedRecently ? (
                          <FiCheck className="text-xs" />
                        ) : (
                          <FiSave className="text-xs" />
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= BOTTOM ACTION BAR ================= */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <FaMoneyBillWave className="text-emerald-400 text-base" />
            <span>
              মোট আদায়:{" "}
              <b className="text-emerald-400 font-mono text-sm">
                ৳{" "}
                {payments
                  .filter((p) => p.status === "Paid")
                  .reduce((sum, p) => sum + Number(p.due_amount || 0), 0)
                  .toLocaleString()}
              </b>
            </span>
          </div>
          <span className="text-slate-700">|</span>
          <div>
            অবশিষ্ট:{" "}
            <b className="text-rose-400 font-mono text-sm">
              ৳{" "}
              {payments
                .filter((p) => p.status !== "Paid" && p.status !== "Waived")
                .reduce((sum, p) => sum + Number(p.due_amount || 0), 0)
                .toLocaleString()}
            </b>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* New Chart Save All */}
          {installmentType && (
            <button
              onClick={() => {
                handleSaveAll();
                onSaveSuccess?.();
              }}
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-sm font-bold text-white shadow-lg shadow-green-900/40 hover:from-green-500 hover:to-emerald-500 hover:scale-[1.02] transition-all cursor-pointer"
            >
              <FiSave className="text-base" />
              সম্পূর্ণ চার্ট সেভ করুন
            </button>
          )}

          {/* Early Settlement Button */}
          {payments.length > 0 && payments.some((p) => p.status !== "Paid" && p.status !== "Waived") && (
            <button
              type="button"
              onClick={handleEarlyClose}
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 text-sm font-bold text-white shadow-lg shadow-orange-950/40 hover:brightness-110 hover:scale-[1.02] transition-all cursor-pointer"
            >
              <FaFire className="text-amber-200" />
              অগ্রিম নিষ্পত্তি ও ছাড় (Early Settlement)
            </button>
          )}

          {/* Mark as Full Paid Button */}
          {payments.length > 0 && (
            <button
              disabled={!isAllPaid}
              onClick={handleMarkFullPaid}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg ${
                isAllPaid
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-900/40 hover:scale-[1.02] cursor-pointer"
                  : "bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed opacity-60"
              }`}
            >
              <FaCheckCircle />
              সম্পূর্ণ পরিশোধিত (Mark as Full Paid)
            </button>
          )}

          {/* View Payment Edit History Pill Button */}
          {payments.length > 0 && (
            <button
              type="button"
              onClick={() => setIsCardHistoryOpen(true)}
              className="flex items-center gap-2 rounded-full border border-cyan-500/60 bg-[#061224] px-5 py-2 text-xs sm:text-sm font-semibold text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:bg-cyan-500/15 hover:border-cyan-400 hover:shadow-[0_0_22px_rgba(6,182,212,0.5)] transition-all cursor-pointer"
            >
              <FiRotateCcw className="h-4 w-4 stroke-[2.5]" />
              <span>পেমেন্ট এডিট হিস্ট্রি দেখুন</span>
            </button>
          )}
        </div>
      </div>

      {/* ================= PREMIUM DARK GLASSMORPHIC POPUP ================= */}
      <AnimatePresence>
        {popup && (
          <motion.div
            initial={{ opacity: 0, y: -25, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className={`fixed top-6 right-6 z-[99999] pointer-events-auto w-full max-w-sm rounded-2xl bg-[#080e1e]/95 p-4 backdrop-blur-2xl text-white overflow-hidden border shadow-[0_20px_50px_rgba(0,0,0,0.85)] ${
              popup.type === "success"
                ? "border-emerald-500/40 shadow-[0_0_25px_rgba(16,185,129,0.2)]"
                : popup.type === "warning"
                ? "border-amber-500/40 shadow-[0_0_25px_rgba(245,158,11,0.25)]"
                : "border-rose-500/40 shadow-[0_0_25px_rgba(244,63,94,0.2)]"
            }`}
          >
            {/* Top row */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                    popup.type === "success"
                      ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                      : popup.type === "warning"
                      ? "bg-amber-500/15 border-amber-500/30 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                      : "bg-rose-500/15 border-rose-500/30 text-rose-400"
                  }`}
                >
                  {popup.type === "success" ? (
                    <FiCheck className="text-xl stroke-[3]" />
                  ) : popup.type === "warning" ? (
                    <FiClock className="text-xl stroke-[2]" />
                  ) : (
                    <FiAlertTriangle className="text-xl stroke-[2]" />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white tracking-wide">
                    {popup.title}
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                    {popup.message}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setPopup(null)}
                className="w-7 h-7 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                ✕
              </button>
            </div>

            {/* Badges details */}
            {popup.tag && (
              <div className="mt-3 pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-semibold font-mono">
                  {popup.tag}
                </span>
                {popup.amount && (
                  <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                    ৳ {Number(popup.amount).toLocaleString()}
                  </span>
                )}
              </div>
            )}

            {/* Glowing animated progress countdown line */}
            <motion.div
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 3.8, ease: "linear" }}
              className={`absolute bottom-0 left-0 h-1 ${
                popup.type === "success"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_8px_#10b981]"
                  : popup.type === "warning"
                  ? "bg-gradient-to-r from-amber-500 to-yellow-400 shadow-[0_0_8px_#f59e0b]"
                  : "bg-gradient-to-r from-rose-500 to-red-400 shadow-[0_0_8px_#f43f5e]"
              }`}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= EARLY SETTLEMENT MODAL ================= */}
      <EarlySettlementModal
        isOpen={isSettlementModalOpen}
        onClose={() => setIsSettlementModalOpen(false)}
        card={card}
        customerName={card?.customer?.name || card?.user_name || "গ্রাহক"}
        payments={payments}
        user={user}
        onSettlementSuccess={() => {
          refetch?.();
        }}
      />

      {/* ================= AUDIT HISTORY MODAL ================= */}
      <InstallmentHistoryModal
        isOpen={isCardHistoryOpen}
        onClose={() => setIsCardHistoryOpen(false)}
        cardId={card?.id}
        card={card}
      />
    </div>
  );
};
