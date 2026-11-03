import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaHistory, FaTimes, FaArrowUp, FaArrowDown, FaExchangeAlt } from "react-icons/fa";
import { FiLoader, FiRefreshCw } from "react-icons/fi";

export const InstallmentExtraHistoryModal = ({ isOpen, onClose, cardId, cardNumber }) => {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLogs = async () => {
    if (!cardId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_LOCALHOST_KEY}/customers/get_extra_logs.php?card_id=${cardId}`
      );
      const data = await res.json();
      if (data.success) {
        setLogs(data.data || []);
      } else {
        setError(data.message || "হিস্ট্রি ফেচ করা যায়নি");
      }
    } catch (err) {
      setError("সার্ভার থেকে হিস্ট্রি লোড করা সম্ভব হয়নি");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && cardId) {
      fetchLogs();
    }
  }, [isOpen, cardId]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-3xl rounded-2xl bg-gradient-to-b from-[#0e1628] to-[#070b15] border border-slate-700/80 shadow-2xl overflow-hidden p-6 text-slate-100 max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <FaHistory className="text-lg" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  অতিরিক্ত জমার লেনদেন হিস্ট্রি ও লেজার
                </h3>
                <p className="text-xs text-slate-400">
                  কার্ড #{cardNumber || cardId} এর সকল জমা, সমন্বয় ও নগদ ফেরত রেকর্ড
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchLogs}
                disabled={isLoading}
                title="রিফ্রেশ করুন"
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition"
              >
                <FiRefreshCw className={isLoading ? "animate-spin" : ""} />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition"
              >
                <FaTimes />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto my-4 pr-1">
            {isLoading ? (
              <div className="py-16 text-center text-slate-400">
                <FiLoader className="animate-spin text-3xl mx-auto mb-3 text-amber-400" />
                <p className="text-xs">হিস্ট্রি লোড হচ্ছে...</p>
              </div>
            ) : error ? (
              <div className="py-12 text-center text-rose-400 text-xs">
                {error}
              </div>
            ) : logs.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <span className="text-4xl block mb-2">📜</span>
                <p className="text-sm font-semibold text-slate-300">কোনো লেনদেন রেকর্ড পাওয়া যায়নি</p>
                <p className="text-xs text-slate-500 mt-1">
                  এই কার্ডে এখনো কোনো অতিরিক্ত জমা, সমন্বয় বা নগদ ফেরত রেকর্ড করা হয়নি।
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-800 overflow-hidden bg-[#0a1120]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800 text-[11px]">
                      <th className="py-3 px-3">তারিখ ও সময়</th>
                      <th className="py-3 px-2 text-center">লেনদেনের ধরণ</th>
                      <th className="py-3 px-2 text-right">পরিমাণ (৳)</th>
                      <th className="py-3 px-2 text-right">পূর্ববর্তী ব্যালেন্স</th>
                      <th className="py-3 px-2 text-right">বর্তমান ব্যালেন্স</th>
                      <th className="py-3 px-2 text-center">রশিদ নং</th>
                      <th className="py-3 px-3">বিবরণ / স্টাফ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono text-[11px]">
                    {logs.map((log) => {
                      const isDeposit = log.type === "deposit";
                      const isAdjustment = log.type === "adjustment";
                      const isRefund = log.type === "refund";

                      return (
                        <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-2.5 px-3 whitespace-nowrap text-slate-400">
                            {log.created_at}
                          </td>

                          <td className="py-2.5 px-2 text-center whitespace-nowrap">
                            {isDeposit ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                                <FaArrowDown className="text-[9px]" /> অতিরিক্ত জমা
                              </span>
                            ) : isAdjustment ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/30 text-[10px] font-bold">
                                <FaExchangeAlt className="text-[9px]" /> কিস্তিতে সমন্বয়
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 text-[10px] font-bold">
                                <FaArrowUp className="text-[9px]" /> নগদ ফেরত
                              </span>
                            )}
                          </td>

                          <td className={`py-2.5 px-2 text-right font-bold font-mono ${
                            isDeposit ? "text-emerald-400" : isAdjustment ? "text-sky-300" : "text-rose-400"
                          }`}>
                            {isDeposit ? "+" : "-"} ৳ {log.amount.toLocaleString()}
                          </td>

                          <td className="py-2.5 px-2 text-right text-slate-400 font-mono">
                            ৳ {log.previous_balance.toLocaleString()}
                          </td>

                          <td className="py-2.5 px-2 text-right text-amber-300 font-bold font-mono">
                            ৳ {log.current_balance.toLocaleString()}
                          </td>

                          <td className="py-2.5 px-2 text-center text-slate-400">
                            {log.receipt_number || "—"}
                          </td>

                          <td className="py-2.5 px-3 font-sans text-slate-300 max-w-[200px]">
                            <p className="truncate text-xs text-white" title={log.remarks}>
                              {log.remarks || "—"}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              বাই: {log.creator_name || `ID #${log.created_by}`}
                            </p>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between shrink-0">
            <span className="text-xs text-slate-400">
              সর্বমোট রেকর্ড: <b className="text-white font-mono">{logs.length}</b> টি
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
            >
              বন্ধ করুন
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default InstallmentExtraHistoryModal;
