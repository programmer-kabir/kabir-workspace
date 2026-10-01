import React, { useEffect, useState } from "react";
import {
  FaTimes,
  FaHistory,
  FaClock,
  FaArrowRight,
  FaCheckCircle,
  FaEdit,
  FaBoxOpen,
  FaSyncAlt,
  FaExchangeAlt,
} from "react-icons/fa";
import axios from "axios";

const ACTION_CONFIG = {
  Created: {
    label: "স্টক তৈরি (Initial Entry)",
    color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    dot: "bg-emerald-400",
    icon: FaBoxOpen,
  },
  Updated: {
    label: "তথ্য আপডেট (Updated)",
    color: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    dot: "bg-blue-400",
    icon: FaEdit,
  },
  "Status Changed": {
    label: "স্ট্যাটাস পরিবর্তন (Status Changed)",
    color: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    dot: "bg-purple-400",
    icon: FaExchangeAlt,
  },
};

const StockHistoryModal = ({ stockItem, onClose }) => {
  const [historyList, setHistoryList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHistory = async () => {
    if (!stockItem?.id) return;
    setIsLoading(true);
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_LOCALHOST_KEY}/Inventory/getStockHistory.php?stock_id=${stockItem.id}`
      );
      if (res.data?.success) {
        setHistoryList(res.data?.data || []);
      }
    } catch (error) {
      console.error("Failed to load history", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [stockItem?.id]);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="fixed inset-0" onClick={onClose}></div>

      <div
        className="relative bg-gradient-to-b from-slate-900 via-[#0B132B] to-slate-950 p-6 md:p-8 rounded-3xl w-full max-w-2xl border border-slate-700/80 shadow-2xl z-10 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span className="p-3 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25">
              <FaHistory className="text-xl" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg md:text-xl font-bold text-white">
                  স্টক পরিবর্তন ইতিহাস (Audit History)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-cyan-300 border border-slate-700">
                  #{stockItem?.id}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                <span className="font-bold text-slate-200">{stockItem?.brand} {stockItem?.model}</span> ({stockItem?.variant || "N/A"})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchHistory}
              title="রিফ্রেশ"
              className="p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition"
            >
              <FaSyncAlt className={`text-xs ${isLoading ? "animate-spin text-cyan-400" : ""}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition"
            >
              <FaTimes className="text-sm" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="mt-6">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
              <FaSyncAlt className="animate-spin text-2xl text-cyan-400" />
              <p className="text-xs">হিস্ট্রি লোড হচ্ছে...</p>
            </div>
          ) : historyList.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <p className="text-sm font-bold text-slate-300">কোনো পরিবর্তনের ইতিহাস পাওয়া যায়নি</p>
              <p className="text-xs text-slate-500 mt-1">
                এই পণ্যটিতে এখনো কোনো এডিট বা পরিবর্তন করা হয়নি।
              </p>
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
              {historyList.map((hist, idx) => {
                const config = ACTION_CONFIG[hist.action] || ACTION_CONFIG.Updated;
                const Icon = config.icon;
                const isInitial = hist.action === "Created";

                return (
                  <div key={hist.id || idx} className="relative group">
                    {/* Timeline Dot */}
                    <div
                      className={`absolute -left-6 top-1.5 w-5 h-5 rounded-full border-2 border-slate-900 ${config.dot} flex items-center justify-center shadow-md`}
                    ></div>

                    <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 transition hover:border-slate-700">
                      {/* Top Bar of Log */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border ${config.color}`}
                          >
                            <Icon className="text-[10px]" />
                            <span>{config.label}</span>
                          </span>
                          <span className="text-xs text-slate-400 font-medium">
                            {hist.note}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px]">
                          <FaClock className="text-[10px]" />
                          <span>{hist.created_at}</span>
                        </div>
                      </div>

                      {/* Changes Breakdown */}
                      {isInitial && hist.changes ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-900 text-xs">
                          {Object.entries(hist.changes).map(([k, v]) => (
                            <div key={k} className="bg-slate-900/60 p-2 rounded-xl border border-slate-800/60">
                              <span className="text-[10px] text-slate-500 block uppercase font-bold">{k}</span>
                              <span className="text-slate-200 font-medium truncate block">
                                {k === "purchase_price" || k === "mrp" ? `৳ ${v}` : String(v || "-")}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : hist.changes && typeof hist.changes === "object" && Object.keys(hist.changes).length > 0 ? (
                        <div className="space-y-2 mt-3 pt-3 border-t border-slate-900">
                          {Object.entries(hist.changes).map(([key, diff]) => (
                            <div
                              key={key}
                              className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 text-xs"
                            >
                              <span className="font-bold text-slate-300">
                                {diff?.label || key}:
                              </span>

                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 line-through text-[11px] font-mono">
                                  {key === "purchase_price" || key === "mrp" ? `৳ ${diff?.old}` : diff?.old || "ফাঁকা"}
                                </span>
                                <FaArrowRight className="text-slate-500 text-[10px]" />
                                <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-[11px] font-mono">
                                  {key === "purchase_price" || key === "mrp" ? `৳ ${diff?.new}` : diff?.new || "ফাঁকা"}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-500 mt-1 italic">
                          তথ্য আপডেট সম্পন্ন করা হয়েছে।
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-5 mt-5 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition"
          >
            বন্ধ করুন (Close)
          </button>
        </div>
      </div>
    </div>
  );
};

export default StockHistoryModal;
