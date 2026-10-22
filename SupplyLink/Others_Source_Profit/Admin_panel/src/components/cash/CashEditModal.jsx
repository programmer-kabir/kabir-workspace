import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FiCalendar,
  FiDollarSign,
  FiTag,
  FiFileText,
  FiAlertCircle,
  FiCheckCircle,
  FiX,
  FiUser,
  FiSend,
} from "react-icons/fi";
import { toast } from "react-toastify";
import { useAuth } from "../../Provider/AuthProvider";

const CashEditModal = ({ isOpen, onClose, cashItem, onSuccess }) => {
  const { user } = useAuth() || {};

  const [newAmount, setNewAmount] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newSource, setNewSource] = useState("");
  const [newPurpose, setNewPurpose] = useState("");
  const [newRemarks, setNewRemarks] = useState("");
  const [requestReason, setRequestReason] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (cashItem) {
      setNewAmount(cashItem.amount || "");
      setNewDate(cashItem.date || new Date().toISOString().split("T")[0]);
      setNewCategory(cashItem.category || "");
      setNewSource(cashItem.source || "");
      setNewPurpose(cashItem.purpose || "");
      setNewRemarks(cashItem.remarks || "");
      setRequestReason("");
    }
  }, [cashItem]);

  if (!isOpen || !cashItem) return null;

  const isCashIn = cashItem.type === "in";

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!newAmount || Number(newAmount) <= 0) {
      return toast.error("অনুগ্রহ করে সঠিক টাকার পরিমাণ দিন!");
    }
    if (!newDate) {
      return toast.error("অনুগ্রহ করে তারিখ দিন!");
    }
    if (!requestReason.trim()) {
      return toast.error("অনুগ্রহ করে সংশোধনের কারণ লিখুন!");
    }

    try {
      setLoading(true);

      const payload = {
        cash_id: Number(cashItem.id),
        new_amount: Number(newAmount),
        new_date: newDate,
        new_category: newCategory,
        new_source: newSource,
        new_purpose: newPurpose,
        new_remarks: newRemarks,
        request_reason: requestReason.trim(),
        requested_by: user?.id,
      };

      const res = await axios.post(
        `${import.meta.env.VITE_LOCALHOST_KEY}/cash/request_cash_edit.php`,
        payload
      );

      if (res.data?.success) {
        onClose();
        if (onSuccess) {
          onSuccess({
            title: "অনুরোধ পাঠানো হয়েছে! ⏳",
            message:
              res.data.message ||
              `ক্যাশ ${isCashIn ? 'ইন' : 'আউট'} সংশোধনের অনুরোধ সফলভাবে পাঠানো হয়েছে। অ্যাডমিন বা ডেভেলপার অনুমোদন করলে লেজার ও ব্যালেন্স আপডেট হবে।`,
            tag: `ক্যাশ #${cashItem.id} সংশোধন`,
            amount: Number(formData.amount) || 0,
            type: "warning",
          });
        }
      } else {
        toast.error(res.data?.error || "অনুরোধ পাঠানো সম্ভব হয়নি!");
      }
    } catch (err) {
      console.error("Cash edit request error:", err);
      toast.error(
        err.response?.data?.error || "সার্ভার এরর! পুনরায় চেষ্টা করুন।"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/[0.12] bg-[#0c1426] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] px-6 py-4 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
                isCashIn
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  : "border-rose-500/30 bg-rose-500/10 text-rose-400"
              }`}
            >
              <FiDollarSign className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">
                ক্যাশ {isCashIn ? "ইন" : "আউট"} সংশোধন অনুরোধ
              </h3>
              <p className="text-xs text-slate-400">
                আইডি #{cashItem.id} | বর্তমান পরিমাণ: ৳{" "}
                {Number(cashItem.amount).toLocaleString()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Info Banner */}
          <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-300">
            <FiAlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
            <span>
              সংশোধনের অনুরোধটি **অ্যাডমিন** বা **ডেভেলপার** রিভিউ করবেন। তারা অনুমোদন (Approve) করলেই কেবল ক্যাশ লেজার ও ব্যালেন্সে পরিবর্তন ঘটবে।
            </span>
          </div>

          {/* Amount & Date Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                <FiDollarSign className="text-cyan-400" />
                <span>নতুন পরিমাণ (৳) *</span>
              </label>
              <input
                type="number"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                placeholder="0.00"
                required
                className="w-full rounded-xl border border-white/10 bg-[#070d1c] px-3.5 py-2.5 text-sm text-white font-mono outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
              />
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                <FiCalendar className="text-indigo-400" />
                <span>নতুন তারিখ *</span>
              </label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                required
                className="w-full rounded-xl border border-white/10 bg-[#070d1c] px-3.5 py-2.5 text-sm text-white font-mono outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-300">
              <FiTag className="text-amber-400" />
              <span>ক্যাটাগরি</span>
            </label>
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="ক্যাটাগরি..."
              className="w-full rounded-xl border border-white/10 bg-[#070d1c] px-3.5 py-2.5 text-sm text-white outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
            />
          </div>

          {/* Source or Purpose */}
          {isCashIn ? (
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                <FiUser className="text-emerald-400" />
                <span>উৎস (Source)</span>
              </label>
              <input
                type="text"
                value={newSource}
                onChange={(e) => setNewSource(e.target.value)}
                placeholder="উৎস / কার কাছ থেকে এসেছে"
                className="w-full rounded-xl border border-white/10 bg-[#070d1c] px-3.5 py-2.5 text-sm text-white outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition"
              />
            </div>
          ) : (
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                <FiFileText className="text-rose-400" />
                <span>উদ্দেশ্য (Purpose)</span>
              </label>
              <input
                type="text"
                value={newPurpose}
                onChange={(e) => setNewPurpose(e.target.value)}
                placeholder="কিসের জন্য খরচ হয়েছে"
                className="w-full rounded-xl border border-white/10 bg-[#070d1c] px-3.5 py-2.5 text-sm text-white outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400 transition"
              />
            </div>
          )}

          {/* Remarks */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-300">
              <FiFileText className="text-slate-400" />
              <span>মন্তব্য (Remarks)</span>
            </label>
            <input
              type="text"
              value={newRemarks}
              onChange={(e) => setNewRemarks(e.target.value)}
              placeholder="অতিরিক্ত কোনো তথ্য থাকলে লিখুন"
              className="w-full rounded-xl border border-white/10 bg-[#070d1c] px-3.5 py-2.5 text-sm text-white outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition"
            />
          </div>

          {/* Request Reason - MANDATORY */}
          <div>
            <label className="mb-1.5 flex items-center justify-between text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5 text-amber-300">
                <FiAlertCircle className="text-amber-400" />
                <span>সংশোধনের কারণ (Request Reason) *</span>
              </span>
              <span className="text-[10px] text-slate-500">বাধ্যতামূলক</span>
            </label>
            <textarea
              rows="3"
              value={requestReason}
              onChange={(e) => setRequestReason(e.target.value)}
              placeholder="কেন সংশোধন করা হচ্ছে সংক্ষেপে বিস্তারিত লিখুন (যেমন: ভুল এন্ট্রি হয়েছিল, টাকার অংক সঠিক ছিল না)..."
              required
              className="w-full rounded-xl border border-amber-500/30 bg-[#070d1c] p-3 text-sm text-white outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition placeholder-slate-500"
            ></textarea>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition disabled:opacity-50"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2.5 text-xs font-bold text-slate-950 hover:from-amber-400 hover:to-amber-500 transition shadow-lg shadow-amber-950/40 disabled:opacity-50 cursor-pointer"
            >
              <FiSend className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>{loading ? "পাঠানো হচ্ছে..." : "অনুরোধ পাঠান"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CashEditModal;
