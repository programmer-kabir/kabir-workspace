import React from "react";
import { Link } from "react-router-dom";
import {
  FaBox,
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaCreditCard,
  FaMoneyBillWave,
  FaReceipt,
  FaExternalLinkAlt,
} from "react-icons/fa";

const CustomerCardView = ({ card }) => {
  const payments = card.payments || [];
  const downPayment = payments.find((p) => Number(p.installment_no) === 0);
  const hasDownPayment = !!downPayment;

  const regularInstallments = payments.filter(
    (p) => Number(p.installment_no) > 0
  );

  const allInstallments = hasDownPayment
    ? [downPayment, ...regularInstallments]
    : regularInstallments;

  const paidCount = allInstallments.filter((p) => p.status === "Paid").length;

  const totalInstallments =
    Number(card.installment_count) + (hasDownPayment ? 1 : 0);

  const progress = Math.min(
    100,
    totalInstallments ? Math.round((paidCount / totalInstallments) * 100) : 0
  );

  const downPaymentAmount = downPayment ? Number(downPayment.due_amount) : 0;

  const paidInstallmentAmount = regularInstallments
    .filter((p) => p.status === "Paid")
    .reduce((sum, p) => sum + Number(p.due_amount), 0);

  const baseInstallmentAmount = Number(card.sale_price) - downPaymentAmount;

  const totalRemaining = Math.max(
    0,
    baseInstallmentAmount - paidInstallmentAmount
  );

  const isCompleted = progress === 100 || card.status === "Fully Paid";
  const displayCardId = card.card_id || card.id;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900/90 via-[#0C1427]/85 to-slate-950/95 border border-slate-800/90 hover:border-cyan-500/40 backdrop-blur-xl p-5 sm:p-6 shadow-2xl transition-all duration-200 space-y-5 mb-6">
      {/* Decorative Top Accent Line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500/50 via-indigo-500/50 to-transparent"></div>

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/90">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0 shadow-md">
            <FaBox className="text-lg" />
          </div>
          <div className="min-w-0">
            <h3 className="font-extrabold text-white text-base sm:text-lg tracking-wide truncate">
              {card.product_name || "Product Name"}
            </h3>
            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
              <span>Installment Plan</span>
              {card.created_at && (
                <>
                  <span>•</span>
                  <span className="font-mono text-[11px]">Date: {card.created_at.split(" ")[0]}</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Card ID & Status Badges & Quick Action */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
          {/* 💳 High-Visibility Card ID */}
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 font-mono font-black text-xs sm:text-sm shadow-[0_0_15px_rgba(6,182,212,0.25)] tracking-wider">
            <FaCreditCard className="text-xs text-cyan-400" />
            <span className="text-cyan-400 font-semibold text-[10px] uppercase">Card</span>
            <span className="text-white">#{displayCardId}</span>
          </span>

          {/* Status Badge */}
          <span
            className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl border ${
              isCompleted
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/20"
                : "bg-indigo-500/20 text-indigo-300 border-indigo-500/40 shadow-sm shadow-indigo-500/20"
            }`}
          >
            {isCompleted ? (
              <>
                <FaCheckCircle className="text-xs" /> Fully Paid
              </>
            ) : (
              <>
                <FaClock className="text-xs" /> Running
              </>
            )}
          </span>

          {/* Quick Link to Card Details / Manage */}
          <Link
            to={`/customers/installment_cards/card_Details?cardId=${displayCardId}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition shadow-sm"
          >
            <FaExternalLinkAlt className="text-[10px] text-cyan-400" />
            <span>Manage Card</span>
          </Link>
        </div>
      </div>

      {/* Financial Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-[#070D1E]/80 border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <FaMoneyBillWave className="text-indigo-400 text-xs" /> Sale Price
          </span>
          <p className="text-base sm:text-lg font-black text-white font-mono">
            ৳ {Number(card.sale_price || 0).toLocaleString()}
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#070D1E]/80 border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <FaReceipt className="text-emerald-400 text-xs" /> Down Payment
          </span>
          <p className="text-base sm:text-lg font-black text-emerald-300 font-mono">
            ৳ {Number(card.down_payment || 0).toLocaleString()}
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#070D1E]/80 border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <FaMoneyBillWave className="text-rose-400 text-xs" /> Total Remaining
          </span>
          <p className="text-base sm:text-lg font-black text-rose-300 font-mono">
            ৳ {Number(totalRemaining || 0).toLocaleString()}
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#070D1E]/80 border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <FaCalendarAlt className="text-cyan-400 text-xs" /> Installments
          </span>
          <p className="text-base sm:text-lg font-black text-cyan-300 font-mono">
            {paidCount} / {totalInstallments}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5 bg-[#070D1E]/60 border border-slate-800/80 p-3 rounded-2xl">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-300 font-semibold flex items-center gap-1.5">
            <span>Payment Completion</span>
          </span>
          <span className="font-mono font-bold text-cyan-300">{progress}% Completed</span>
        </div>
        <div className="h-2.5 bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
          <div
            className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-400"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Installment Schedule & Payments Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800/90 sl-scroll">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-[#070D1E] text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Installment</th>
              <th className="py-3 px-4">Due Date</th>
              <th className="py-3 px-4">Amount</th>
              <th className="py-3 px-4">Paid Date</th>
              <th className="py-3 px-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
            {allInstallments.map((p, idx) => {
              const isPaid = p.status === "Paid";
              const isDown = Number(p.installment_no) === 0;

              return (
                <tr
                  key={p.id || idx}
                  className="hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-3 px-4 font-semibold text-white flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isPaid ? "bg-emerald-400" : "bg-slate-500"
                      }`}
                    ></span>
                    <span>{isDown ? "Down Payment" : p.tag || `Installment #${p.installment_no}`}</span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-300">
                    {p.due_date || "-"}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-white">
                    ৳ {Number(p.due_amount || 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-300">
                    {p.paid_date || "-"}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase border ${
                        isPaid
                          ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                          : "bg-slate-800 text-slate-400 border-slate-700"
                      }`}
                    >
                      {isPaid ? "Paid" : "Unpaid"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CustomerCardView;
