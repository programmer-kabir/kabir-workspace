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
    const payload = {
      id: updatedItem.id,
      paid_date:
        updatedItem.status === "Paid" ? updatedItem.paid_date || today : null,
      payment_method: updatedItem.payment_method,
      receipt_number: updatedItem.receipt_number,
      status: updatedItem.status,
      signature: user?.id,
    };
    try {
      const res = await fetch(
        `${import.meta.env.VITE_LOCALHOST_KEY}/customers/installment_payment_update.php`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
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
      const targetCardId = card?.card_id || card?.id;
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
    payments.length > 0 && payments.every((p) => p.status === "Paid");

  const handleMarkFullPaid = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_LOCALHOST_KEY}/customers/installment_card_update.php`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            card_id: card.card_id,
            status: "Fully Paid",
          }),
        }
      );

      const data = await res.json();
      if (data.success) {
        toast.success(`কার্ড #${card.card_id || card.id} সম্পূর্ণ পরিশোধিত (Fully Paid) হিসেবে চিহ্নিত হয়েছে ✅`);
        setTimeout(() => {
          navigate("/customers/installment_cards");
        }, 300);
      }
    } catch (err) {
      toast.error("কার্ড আপডেট করা যায়নি");
    }
  };

  const handleEarlyClose = () => {
    const updated = [...payments];
    const firstUnpaidIndex = updated.findIndex((p) => p.status !== "Paid");
    if (firstUnpaidIndex === -1) return;

    const currentItem = updated[firstUnpaidIndex];

    const totalPaidPrincipalAmount = updated
      .filter((p) => p.status === "Paid")
      .reduce((sum, p) => sum + Number(p.principal_amount || 0), 0);

    const totalPaidProfitAmount = updated
      .filter((p) => p.status === "Paid")
      .reduce((sum, p) => sum + Number(p.profit_amount || 0), 0);

    const totalPrincipal = Number(card?.cost_price || 0);
    const totalProfit = Number(card?.sale_price || 0) - totalPrincipal;

    const lastPrincipal = totalPrincipal - totalPaidPrincipalAmount;
    const lastProfit = totalProfit - totalPaidProfitAmount;
    const lastAmount = lastPrincipal + lastProfit;

    Swal.fire({
      title: "Full Settlement Confirmation",
      background: "#0B1324",
      color: "#f8fafc",
      html: `
      <p style="color:#94a3b8;">You are about to <b>close and fully settle all remaining installments</b>.</p>
      <div style="background:#070D1E; border:1px solid #1e293b; border-radius:16px; padding:16px; margin:16px 0;">
        <span style="font-size:12px; color:#94a3b8; text-transform:uppercase; letter-spacing:1px; font-weight:700;">Final Payable Amount:</span>
        <div style="font-size:24px; font-weight:900; color:#38bdf8; font-family:monospace; margin-top:4px;">৳ ${lastAmount.toFixed(2)}</div>
        <div style="font-size:12px; color:#64748b; margin-top:4px;">(Principal: ৳ ${lastPrincipal.toFixed(2)} + Profit: ৳ ${lastProfit.toFixed(2)})</div>
      </div>
      <p style="color:#f87171; font-size:13px; font-weight:600;">⚠️ This action will mark this card as Fully Paid.</p>
    `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#0284c7",
      cancelButtonColor: "#334155",
      confirmButtonText: "Yes, Close All & Settle",
      cancelButtonText: "Cancel",
    }).then(async (result) => {
      if (!result.isConfirmed) return;

      Swal.fire({
        title: "Processing Settlement...",
        background: "#0B1324",
        color: "#f8fafc",
        allowOutsideClick: false,
        showConfirmButton: false,
      });

      try {
        await fetch(
          `${import.meta.env.VITE_LOCALHOST_KEY}/customers/installment_full_close.php`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              card_id: currentItem.card_id,
              installment_no: currentItem.installment_no,
              due_amount: lastAmount,
              principal_amount: lastPrincipal,
              profit_amount: lastProfit,
            }),
          }
        );

        updated[firstUnpaidIndex] = {
          ...updated[firstUnpaidIndex],
          due_amount: lastAmount,
          principal_amount: lastPrincipal,
          profit_amount: lastProfit,
          status: "Paid",
          paid_date: today,
        };

        const finalList = updated.slice(0, firstUnpaidIndex + 1);
        setPayments(finalList);

        Swal.fire({
          title: "Settlement Complete! 🎉",
          text: "All remaining installments have been closed and card marked as Paid.",
          icon: "success",
          background: "#0B1324",
          color: "#f8fafc",
          confirmButtonColor: "#0284c7",
        });
        refetch();
      } catch (err) {
        Swal.fire({
          title: "Failed!",
          text: "Something went wrong during settlement.",
          icon: "error",
          background: "#0B1324",
          color: "#f8fafc",
        });
      }
    });
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
              const isPaid = payments[index]?.status === "Paid";
              const tagText = getCleanTag(item, index);

              return (
                <tr
                  key={item.id || index}
                  className={`hover:bg-slate-800/40 transition-colors ${
                    isPaid ? "bg-emerald-500/[0.03]" : ""
                  }`}
                >
                  {/* Tag Column */}
                  <td className="py-3 px-3.5 font-bold text-white whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          isPaid ? "bg-emerald-400" : "bg-slate-500"
                        }`}
                      />
                      <span>{tagText}</span>
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
                      onChange={(e) => handlePaymentMethodChange(index, e.target.value)}
                      className="bg-[#070D1E] border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
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
                      onChange={(e) => handleReceiptChange(index, e.target.value)}
                      placeholder="Receipt #"
                      className="w-24 bg-[#070D1E] border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400"
                    />
                  </td>

                  {/* Status Dropdown */}
                  <td className="py-3 px-3.5">
                    <select
                      value={payments[index]?.status || "Unpaid"}
                      onChange={(e) => handleStatusChange(index, e.target.value)}
                      className={`rounded-xl px-2.5 py-1.5 text-xs font-bold border focus:outline-none ${
                        isPaid
                          ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                          : "bg-slate-800 border-slate-700 text-slate-300"
                      }`}
                    >
                      <option value="Paid" className="bg-slate-900 text-emerald-300 font-bold">
                        Paid
                      </option>
                      <option value="Unpaid" className="bg-slate-900 text-slate-300">
                        Unpaid
                      </option>
                    </select>
                  </td>

                  {/* Action Save Button */}
                  <td className="py-3 px-3.5">
                    <button
                      onClick={() => handleUpdateInstallment(index)}
                      title="Save Changes"
                      className="w-8 h-8 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-400/30 flex items-center justify-center transition shadow-sm"
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

          {/* Mark Full Paid */}
          {InstallmentPayments.length > 0 && (
            <button
              disabled={!isAllPaid}
              onClick={handleMarkFullPaid}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition shadow-lg ${
                isAllPaid
                  ? "bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white shadow-emerald-500/25"
                  : "bg-slate-800/80 border border-slate-700 text-slate-500 cursor-not-allowed opacity-60"
              }`}
            >
              <FaCheckCircle />
              <span>Mark as Full Paid</span>
            </button>
          )}

          {/* Full Settlement (Early Close) */}
          {InstallmentPayments.length > 0 && !isAllPaid && (
            <button
              onClick={handleEarlyClose}
              className="flex items-center gap-2 rounded-2xl px-5 py-2.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-xs sm:text-sm font-bold text-white shadow-lg shadow-rose-500/20 transition"
            >
              <FaFire className="text-xs" />
              <span>Full Settlement (Early Close)</span>
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
                            className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold border ${
                              isMarkedPaid
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
                                  className={`px-2 py-0.5 rounded-md text-[11px] ${
                                    ch.old === "Paid"
                                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold"
                                      : "bg-slate-800 text-slate-400 border border-slate-700"
                                  }`}
                                >
                                  {ch.old || "None"}
                                </span>

                                <FaExchangeAlt className="text-slate-600 text-[10px]" />

                                <span className="text-[10px] text-slate-400 uppercase font-semibold">পরে:</span>
                                <span
                                  className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                                    ch.new === "Paid"
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
    </div>
  );
};
