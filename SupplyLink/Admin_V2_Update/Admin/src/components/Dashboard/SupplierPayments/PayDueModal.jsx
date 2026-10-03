import React, { useState, useEffect } from "react";
import { FaTimes, FaMoneyBillWave, FaCalendarAlt, FaStore, FaWallet } from "react-icons/fa";
import axios from "axios";
import { toast } from "react-toastify";

const PayDueModal = ({ isOpen, onClose, onSuccess, shop }) => {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (shop) {
      const currentDue = parseFloat(shop.current_due || 0);
      setAmount(currentDue > 0 ? currentDue : "");
    }
  }, [shop]);

  if (!isOpen || !shop) return null;

  const currentDue = parseFloat(shop.current_due || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payVal = parseFloat(amount || 0);
    if (payVal <= 0) {
      toast.info("পরিশোধের পরিমাণ 0 এর বেশি হতে হবে!");
      return;
    }

    setIsSubmitting(true);
    try {
      // First attempt: Dedicated paySupplierDue.php
      let res;
      try {
        res = await axios.post(
          `${import.meta.env.VITE_LOCALHOST_KEY}/supplierPayments/paySupplierDue.php`,
          {
            shop_name: shop.shop_name,
            amount: payVal,
            date,
            payment_method: paymentMethod,
            remarks,
          }
        );
      } catch (firstErr) {
        // Fallback: Use addSupplierPayments.php if endpoint not yet deployed
        const form = new FormData();
        form.append("memo_no", `PAY-${Date.now()}`);
        form.append("date", date);
        form.append("shop_name", shop.shop_name);
        form.append("supplier", shop.owner_name || shop.shop_name);
        form.append("brand", "Payment / পরিশোধ");
        form.append("total_amount", 0);
        form.append("paid", payVal);
        form.append("due", -payVal);
        form.append("remarks", `বকেয়া পরিশোধ (${paymentMethod})${remarks ? `: ${remarks}` : ""}`);

        res = await axios.post(
          `${import.meta.env.VITE_LOCALHOST_KEY}/supplierPayments/addSupplierPayments.php`,
          form,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
      }

      if (res?.data?.success) {
        toast.success(res.data?.message || "বকেয়া পরিশোধ সফলভাবে সম্পন্ন হয়েছে! ✅");
        onSuccess && onSuccess();
        onClose();
      } else {
        toast.error(res?.data?.message || "পেমেন্ট সম্পন্ন করতে সমস্যা হয়েছে ❌");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "পেমেন্ট সম্পন্ন করতে ব্যর্থ ❌");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="fixed inset-0" onClick={onClose}></div>

      <div
        className="relative bg-gradient-to-b from-slate-900 via-[#0B132B] to-slate-950 p-6 md:p-8 rounded-3xl w-full max-w-lg border border-slate-700/80 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span className="p-3 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/25">
              <FaMoneyBillWave className="text-xl" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-white">
                সাপ্লায়ার বকেয়া পরিশোধ (Pay Due)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {shop.shop_name} ({shop.owner_name || "-"})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            <FaTimes className="text-sm" />
          </button>
        </div>

        {/* Due Summary Card */}
        <div className="my-4 p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 block">
              বর্তমান বকেয়া (Current Due)
            </span>
            <div className="text-2xl font-black font-mono text-rose-400 mt-0.5">
              ৳ {currentDue.toLocaleString()}
            </div>
          </div>

          <div className="text-right text-xs">
            <span className="text-slate-400 block">মোট ক্রয়: ৳ {parseFloat(shop.total_bought || 0).toLocaleString()}</span>
            <span className="text-emerald-400 block font-medium">পরিশোধিত: ৳ {parseFloat(shop.total_paid || 0).toLocaleString()}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Amount */}
          <div>
            <label className="text-slate-300 font-semibold mb-1 block">
              পরিশোধের টাকার পরিমাণ (Amount ৳) *
            </label>
            <input
              type="number"
              step="any"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="যেমন: 200 বা 5000"
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-emerald-500 focus:outline-none font-mono text-base font-black text-emerald-400"
            />
          </div>

          {/* Date & Payment Method */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                <FaCalendarAlt className="text-slate-400" />
                <span>পরিশোধের তারিখ</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                <FaWallet className="text-slate-400" />
                <span>পেমেন্ট মাধ্যম</span>
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="Cash">নগদ ক্যাশ (Cash)</option>
                <option value="bKash">বিকাশ (bKash)</option>
                <option value="Nagad">নগদ (Nagad)</option>
                <option value="Bank">ব্যাংক ট্রান্সফার (Bank)</option>
              </select>
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="text-slate-300 font-semibold mb-1 block">
              মন্তব্য / রসিদ নোট (Remarks)
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="যেমন: চালান নং পরিশোধ, নগদ ক্যাশ প্রদান"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800 mt-5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-bold transition"
            >
              বাতিল (Cancel)
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition"
            >
              {isSubmitting ? "পরিশোধ হচ্ছে..." : "বকেয়া পরিশোধ সম্পন্ন করুন"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PayDueModal;
