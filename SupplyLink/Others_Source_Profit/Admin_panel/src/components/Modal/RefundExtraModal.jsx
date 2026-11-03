import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaMoneyBillWave, FaTimes, FaCheck, FaExclamationTriangle } from "react-icons/fa";
import { FiLoader } from "react-icons/fi";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

export const RefundExtraModal = ({ isOpen, onClose, card, user, onSuccess }) => {
  const currentExtraBalance = Number(card?.extra_balance || 0);

  const [refundAmount, setRefundAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [receiptNumber, setReceiptNumber] = useState("");
  const [remarks, setRemarks] = useState("");
  const [refundDate, setRefundDate] = useState(new Date().toISOString().split("T")[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amount = Number(refundAmount);

    if (!amount || amount <= 0) {
      toast.error("অনুগ্রহ করে সঠিক টাকার পরিমাণ লিখুন");
      return;
    }

    if (amount > currentExtraBalance) {
      toast.error(`পর্যাপ্ত ব্যালেন্স নেই। সর্বোচ্চ ফেরত দেওয়া যাবে ৳ ${currentExtraBalance.toLocaleString()}`);
      return;
    }

    const confirmRes = await Swal.fire({
      title: "টাকা ফেরত নিশ্চিতকরণ",
      html: `আপনি কি কার্ড <b>#${card?.card_number || card?.id}</b> থেকে গ্রাহককে নগদ <b>৳ ${amount.toLocaleString()}</b> ফেরত দিতে চান?<br><br><span style="color: #f87171; font-size: 13px;">⚠️ এটি মূল ক্যাশ ম্যানেজমেন্টে সরাসরি <b>Cash Out</b> ভাউচার হিসেবে অন্তর্ভুক্ত হবে।</span>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e11d48",
      cancelButtonColor: "#475569",
      confirmButtonText: "হ্যাঁ, নগদ ফেরত দিন",
      cancelButtonText: "বাতিল",
      background: "#0f172a",
      color: "#f8fafc",
    });

    if (!confirmRes.isConfirmed) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_LOCALHOST_KEY}/customers/refund_extra_amount.php`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            card_id: card?.id,
            refund_amount: amount,
            payment_method: paymentMethod,
            receipt_number: receiptNumber,
            remarks: remarks || "গ্রাহককে অতিরিক্ত জমার টাকা নগদ ফেরত",
            refund_date: refundDate,
            signature: user?.id,
          }),
        }
      );

      const data = await res.json();
      if (data.success) {
        Swal.fire({
          title: "ফেরত সফল হয়েছে! 🎉",
          html: `গ্রাহককে <b>৳ ${amount.toLocaleString()}</b> সফলভাবে ক্যাশ আউট করে ফেরত দেওয়া হয়েছে।<br>অবশিষ্ট জমার ব্যালেন্স: <b>৳ ${Number(data.current_balance || 0).toLocaleString()}</b>`,
          icon: "success",
          background: "#0f172a",
          color: "#f8fafc",
        });
        onSuccess?.();
        onClose();
      } else {
        toast.error(data.message || "ফেরত সম্পন্ন করা যায়নি");
      }
    } catch (err) {
      toast.error("সার্ভার সমস্যা হয়েছে, অনুগ্রহ করে আবার চেষ্টা করুন");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-lg rounded-2xl bg-gradient-to-b from-[#0e1628] to-[#070b15] border border-slate-700/80 shadow-2xl overflow-hidden p-6 text-slate-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <FaMoneyBillWave className="text-xl" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  অতিরিক্ত জমা টাকা নগদ ফেরত (Cash Out)
                </h3>
                <p className="text-xs text-slate-400">
                  কার্ড #{card?.card_number || card?.id} এর গ্রাহক রিফান্ড
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition"
            >
              <FaTimes />
            </button>
          </div>

          {/* Current Balance Banner */}
          <div className="my-4 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 flex items-center justify-between">
            <div>
              <p className="text-xs text-amber-300/90 font-medium">বর্তমানে কার্ডে অতিরিক্ত জমা আছে:</p>
              <p className="text-2xl font-mono font-extrabold text-amber-400 mt-0.5">
                ৳ {currentExtraBalance.toLocaleString()}
              </p>
            </div>
            <span className="text-2xl">💰</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Refund Amount */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                ফেরতের পরিমাণ (৳) <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  max={currentExtraBalance}
                  required
                  placeholder={`সর্বোচ্চ ৳ ${currentExtraBalance}`}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="w-full rounded-xl bg-[#09101d] border border-slate-700/80 px-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-rose-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setRefundAmount(String(currentExtraBalance))}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-[11px] font-semibold transition"
                >
                  সবটুকু (All)
                </button>
              </div>
            </div>

            {/* Payment Method & Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  পেমেন্ট মাধ্যম
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full rounded-xl bg-[#09101d] border border-slate-700/80 px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="Cash">Cash (নগদ)</option>
                  <option value="Bank">Bank (ব্যাংক)</option>
                  <option value="Bkash">Bkash (বিকাশ)</option>
                  <option value="Nagad">Nagad (নগদ অ্যাপ)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  ফেরতের তারিখ
                </label>
                <input
                  type="date"
                  value={refundDate}
                  onChange={(e) => setRefundDate(e.target.value)}
                  className="w-full rounded-xl bg-[#09101d] border border-slate-700/80 px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Receipt Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                রশিদ নম্বর (ঐচ্ছিক)
              </label>
              <input
                type="text"
                placeholder="যেমন: REF-1024"
                value={receiptNumber}
                onChange={(e) => setReceiptNumber(e.target.value)}
                className="w-full rounded-xl bg-[#09101d] border border-slate-700/80 px-4 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                মন্তব্য / কারণ
              </label>
              <textarea
                rows={2}
                placeholder="যেমন: গ্রাহক অতিরিক্ত জমার টাকা ফেরত নিয়েছেন"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full rounded-xl bg-[#09101d] border border-slate-700/80 px-4 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                বাতিল
              </button>
              <button
                type="submit"
                disabled={isSubmitting || currentExtraBalance <= 0}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg transition-all ${
                  currentExtraBalance > 0
                    ? "bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-rose-950/40 cursor-pointer"
                    : "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <FiLoader className="animate-spin text-sm" />
                    <span>প্রক্রিয়াধীন...</span>
                  </>
                ) : (
                  <>
                    <FaCheck />
                    <span>নগদ ফেরত নিশ্চিত করুন (Cash Out)</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default RefundExtraModal;
