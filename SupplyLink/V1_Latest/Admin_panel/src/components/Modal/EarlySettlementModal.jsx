import React, { useState, useMemo } from "react";
import { FaFire, FaTimes, FaCheck, FaExclamationTriangle } from "react-icons/fa";
import { toast } from "react-toastify";

const QUICK_DISCOUNTS = [500, 1000, 2000, 3000];

export const EarlySettlementModal = ({
  isOpen,
  onClose,
  card,
  customerName = "গ্রাহক",
  payments = [],
  user,
  onSettlementSuccess,
}) => {
  if (!isOpen || !card) return null;

  const today = new Date().toISOString().split("T")[0];

  // 1. Calculate Financial Baseline
  const { totalOriginal, totalPaidBefore, remainingDue } = useMemo(() => {
    let original = 0;
    let paid = 0;

    payments.forEach((p) => {
      const amt = Number(p.due_amount) || 0;
      original += amt;
      if (p.status === "Paid") {
        paid += amt;
      }
    });

    // If payments array was empty or has no downpayment, fallback to card sale_price
    if (original === 0 && Number(card?.sale_price) > 0) {
      original = Number(card.sale_price);
    }

    const remaining = Math.max(0, original - paid);
    return {
      totalOriginal: original,
      totalPaidBefore: paid,
      remainingDue: remaining,
    };
  }, [payments, card]);

  // Form states
  const [discountAmount, setDiscountAmount] = useState(0);
  const [finalSettledAmount, setFinalSettledAmount] = useState(remainingDue);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [settlementDate, setSettlementDate] = useState(today);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick discount select
  const handleQuickDiscount = (amount) => {
    const cappedDiscount = Math.min(amount, remainingDue);
    setDiscountAmount(cappedDiscount);
    setFinalSettledAmount(Math.max(0, remainingDue - cappedDiscount));
  };

  // Full 100% waiver
  const handleFullWaiver = () => {
    setDiscountAmount(remainingDue);
    setFinalSettledAmount(0);
  };

  // Discount manual input change
  const handleDiscountChange = (e) => {
    const val = Number(e.target.value) || 0;
    const capped = Math.min(Math.max(0, val), remainingDue);
    setDiscountAmount(capped);
    setFinalSettledAmount(Math.max(0, remainingDue - capped));
  };

  // Cash in manual input change
  const handleCashChange = (e) => {
    const val = Number(e.target.value) || 0;
    const capped = Math.min(Math.max(0, val), remainingDue);
    setFinalSettledAmount(capped);
    setDiscountAmount(Math.max(0, remainingDue - capped));
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (remainingDue <= 0) {
      toast.info("এই কার্ডের কোনো অবশিষ্ট বকেয়া নেই।");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        card_id: Number(card.id),
        discount_amount: Number(discountAmount),
        final_settled_amount: Number(finalSettledAmount),
        payment_method: paymentMethod,
        settlement_date: settlementDate || today,
        note: note.trim(),
        settled_by: Number(user?.id || 0),
      };

      const res = await fetch(
        `${import.meta.env.VITE_LOCALHOST_KEY}/customers/card_settlement.php`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await res.json();

      if (!result.success) {
        toast.error(result.message || "নিষ্পত্তি সম্পন্ন করা যায়নি");
        return;
      }

      toast.success(result.message || "কার্ড অগ্রিম নিষ্পত্তি সফলভাবে সম্পন্ন হয়েছে 🎉");
      onSettlementSuccess?.(result.data);
      onClose();
    } catch (err) {
      toast.error("সার্ভারে সমস্যা হয়েছে, পরে আবার চেষ্টা করুন");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn overflow-y-auto">
      <div className="max-w-xl w-full bg-[#0a0f1d] border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl relative text-white space-y-5 my-8">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-lg shadow-amber-500/10">
              <FaFire className="text-xl" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                <span>কার্ড অগ্রিম নিষ্পত্তি ও ছাড় (Early Settlement)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                কার্ড #{card.card_number || card.id} • গ্রাহক: <span className="text-slate-200 font-semibold">{customerName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <FaTimes size={13} />
          </button>
        </div>

        {/* 3 Metrics Cards */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
          <div className="rounded-2xl bg-[#0e172a] border border-slate-800 p-3 text-center">
            <span className="text-[11px] text-slate-400 block font-medium">মোট চুক্তি মূল্য</span>
            <span className="text-sm sm:text-base font-bold text-cyan-300 font-mono mt-1 block">
              ৳{Number(card?.sale_price || totalOriginal).toFixed(2)}
            </span>
          </div>
          <div className="rounded-2xl bg-[#0e172a] border border-slate-800 p-3 text-center">
            <span className="text-[11px] text-slate-400 block font-medium">পরিশোধিত</span>
            <span className="text-sm sm:text-base font-bold text-cyan-300 font-mono mt-1 block">
              ৳{totalPaidBefore.toFixed(2)}
            </span>
          </div>
          <div className="rounded-2xl bg-[#0e172a] border border-cyan-500/30 p-3 text-center shadow-lg shadow-cyan-950/40">
            <span className="text-[11px] text-cyan-400 block font-medium">বর্তমান বকেয়া</span>
            <span className="text-sm sm:text-base font-bold text-cyan-300 font-mono mt-1 block">
              ৳{remainingDue.toFixed(2)}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Field 1: Special Discount Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-rose-300 flex items-center gap-1">
                <span>বিশেষ ছাড় / ডিসকাউন্ট (৳)</span>
              </label>
              <span className="text-rose-400/80 font-mono text-[11px]">মওকুফকৃত পরিমাণ</span>
            </div>
            <div className="relative">
              <input
                type="number"
                min="0"
                max={remainingDue}
                step="any"
                value={discountAmount === 0 ? "" : discountAmount}
                onChange={handleDiscountChange}
                placeholder="0"
                className="w-full rounded-2xl bg-[#060b16] border border-rose-500/30 focus:border-rose-400 px-4 py-3 text-sm font-mono text-pink-400 font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition-all placeholder-slate-700"
              />
            </div>

            {/* Quick Discount Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-slate-500 mr-1 font-mono">কুইক সিলেক্ট:</span>
              {QUICK_DISCOUNTS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleQuickDiscount(amt)}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                    discountAmount === amt
                      ? "bg-rose-500/20 border-rose-400 text-rose-300"
                      : "bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white"
                  }`}
                >
                  ৳{amt}
                </button>
              ))}
              <button
                type="button"
                onClick={handleFullWaiver}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  discountAmount === remainingDue && remainingDue > 0
                    ? "bg-amber-500/25 border-amber-400 text-amber-300"
                    : "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
                }`}
              >
                সম্পূর্ণ ছাড় (১০০%)
              </button>
            </div>
          </div>

          {/* Field 2: Cash In Amount */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-emerald-300">
                কাস্টমার আজ নগদ জমা দেবে (৳)
              </label>
              <span className="text-emerald-400 font-mono text-[11px]">প্রকৃত ক্যাশ ইন</span>
            </div>
            <div className="relative">
              <input
                type="number"
                min="0"
                max={remainingDue}
                step="any"
                value={finalSettledAmount === 0 ? "" : finalSettledAmount}
                onChange={handleCashChange}
                placeholder="0"
                className="w-full rounded-2xl bg-[#060b16] border border-emerald-500/40 focus:border-emerald-400 px-4 py-3 text-base font-mono text-emerald-300 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
            </div>
          </div>

          {/* Field 3: Payment Method and Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-medium">পেমেন্ট মেথড</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full rounded-xl bg-[#060b16] border border-slate-700 px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-400 cursor-pointer"
              >
                <option value="Cash">Cash (নগদ)</option>
                <option value="Bank">Bank (ব্যাংক)</option>
                <option value="Bkash">bKash (বিকাশ)</option>
                <option value="Nagad">Nagad (নগদ)</option>
                <option value="Rocket">Rocket (রকেট)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-medium">নিষ্পত্তির তারিখ</label>
              <input
                type="date"
                value={settlementDate}
                onChange={(e) => setSettlementDate(e.target.value)}
                className="w-full rounded-xl bg-[#060b16] border border-slate-700 px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-400 font-mono cursor-pointer"
              />
            </div>
          </div>

          {/* Field 4: Note */}
          <div className="space-y-1">
            <label className="text-xs text-slate-300 font-medium">মন্তব্য / ছাড়ের কারণ (Note)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="যেমন: এককালীন সম্পূর্ণ পরিশোধ করায় ২,০০০ টাকা বিশেষ ছাড়"
              className="w-full rounded-xl bg-[#060b16] border border-slate-700 px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-400"
            />
          </div>

          {/* Alert Notice Card */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-amber-300 text-xs leading-relaxed">
            <span className="text-base shrink-0 mt-0.5">⚡</span>
            <p>
              নিষ্পত্তি করার পর ক্যাশ রিপোর্টে শুধুমাত্র{" "}
              <strong className="text-white font-mono font-bold">
                ৳{Number(finalSettledAmount).toFixed(2)}
              </strong>{" "}
              টাকা ক্যাশ ইন হিসেবে যোগ হবে। কিস্তির মূল রেকর্ড ডিলিট হবে না, অবশিষ্ট কিস্তিগুলো{" "}
              <strong className="text-white font-semibold">'Waived' (ছাড়)</strong> হিসেবে সংরক্ষিত থাকবে।
            </p>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={isSubmitting || remainingDue <= 0}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:brightness-110 active:scale-[0.98] text-xs font-bold text-white shadow-lg shadow-orange-500/25 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaCheck />
              <span>{isSubmitting ? "প্রসেসিং..." : "ছাড় অনুমোদন ও নিষ্পত্তি সম্পন্ন করুন"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
