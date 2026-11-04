import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import BackButton from "../../components/BackButton/BackButton";
import Loader from "../../components/Loader/Loader";
import {
  FaSyncAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaSearch,
  FaBoxOpen,
  FaMoneyBillWave,
  FaCreditCard,
  FaStore
} from "react-icons/fa";

const StockPurchaseSyncAudit = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [stats, setStats] = useState({
    total_records: 0,
    total_amount: 0,
    synced_count: 0,
    synced_amount: 0,
    missing_count: 0,
    missing_amount: 0,
  });

  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch] = useState("");

  const baseUrl = import.meta.env.VITE_LOCALHOST_KEY || "http://localhost/supplylink_server/apis";

  const fetchAuditData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${baseUrl}/audit/sync_purchases_to_cash.php?action=audit`, {
        withCredentials: true,
      });

      if (res.data?.success) {
        setData(res.data.data || []);
        setStats(res.data.stats || {});
      } else {
        toast.error("পণ্য ক্রয় অডিট ডাটা লোড করতে ব্যর্থ");
      }
    } catch (err) {
      console.error("Stock purchase audit load error:", err);
      toast.error("সার্ভার থেকে অডিট তথ্য পাওয়া যায়নি");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditData();
  }, []);

  const filteredList = useMemo(() => {
    return data.filter((item) => {
      if (activeFilter === "missing" && item.sync_status !== "missing") {
        return false;
      }
      if (activeFilter === "synced" && item.sync_status !== "synced") {
        return false;
      }

      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const str = `${item.product_name} ${item.card_id} ${item.customer_name} ${item.supplier_name}`.toLowerCase();
        return str.includes(q);
      }

      return true;
    });
  }, [data, activeFilter, search]);

  const progressPercent = stats.total_amount > 0
    ? Math.round((stats.synced_amount / stats.total_amount) * 100)
    : 100;

  return (
    <div className="min-h-screen bg-[#070d1e] text-slate-100 p-4 md:p-6 space-y-6">
      <BackButton />

      {/* Header Banner */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              Inventory & Expense Audit
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-white">
            পণ্য ক্রয় ও ক্যাশ-আউট অডিট (Stock Purchase & Expense Audit)
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            গ্রাহকদের কিস্তিতে প্রদানকৃত সকল পণ্যের ক্রয়মূল্য ক্যাশ বই থেকে খরচ (Cash Out) হিসেবে অন্তর্ভুক্ত হয়েছে কি না তা নিরীক্ষা করুন।
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs sm:text-sm font-semibold flex items-center gap-2">
            <FaCheckCircle />
            <span>সকল পণ্যের ক্রয়মূল্য ক্যাশে সিঙ্কড</span>
          </div>

          <button
            onClick={fetchAuditData}
            disabled={loading}
            className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition active:scale-95 border border-slate-700"
            title="রিফ্রেশ করুন"
          >
            <FaSyncAlt className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Products */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-5 shadow-lg">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              মোট ক্রয়কৃত পণ্য
            </span>
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <FaBoxOpen />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            {stats.total_records} <span className="text-sm font-normal text-slate-400">টি</span>
          </div>
          <div className="text-xs text-indigo-400 mt-1 font-medium">
            মোট ক্রয় ব্যয় ৳{Number(stats.total_amount).toLocaleString()}
          </div>
        </div>

        {/* Synced in Cash */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-5 shadow-lg">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              ক্যাশ-আউটে অন্তর্ভুক্ত
            </span>
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <FaCheckCircle />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400">
            {stats.synced_count} <span className="text-sm font-normal text-slate-400">টি</span>
          </div>
          <div className="text-xs text-emerald-400/90 mt-1 font-medium">
            মোট ৳{Number(stats.synced_amount).toLocaleString()} ({progressPercent}%)
          </div>
        </div>

        {/* Missing in Cash */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-5 shadow-lg">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              ক্যাশ খরচ মিসিং
            </span>
            <div className={`p-2.5 rounded-2xl border ${stats.missing_count > 0 ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : "bg-slate-800 text-slate-400 border-slate-700"}`}>
              <FaTimesCircle />
            </div>
          </div>
          <div className={`text-2xl font-black ${stats.missing_count > 0 ? "text-rose-400" : "text-slate-300"}`}>
            {stats.missing_count} <span className="text-sm font-normal text-slate-400">টি</span>
          </div>
          <div className="text-xs text-rose-400/90 mt-1 font-medium">
            {stats.missing_count > 0 ? `মোট ৳${Number(stats.missing_amount).toLocaleString()}` : "কোনো মিসিং ব্যয় নেই"}
          </div>
        </div>

        {/* Integrity */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-5 shadow-lg">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              ব্যয় রিকনসিলিয়েশন
            </span>
            <div className="p-2.5 rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <FaMoneyBillWave />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            {progressPercent}%
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 w-full md:w-auto">
          <button
            onClick={() => setActiveFilter("all")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${activeFilter === "all" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30" : "text-slate-400 hover:text-white"}`}
          >
            সকল পণ্য ({data.length})
          </button>
          <button
            onClick={() => setActiveFilter("synced")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${activeFilter === "synced" ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30" : "text-slate-400 hover:text-white"}`}
          >
            সিঙ্কড ({stats.synced_count})
          </button>
          <button
            onClick={() => setActiveFilter("missing")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${activeFilter === "missing" ? "bg-rose-600 text-white shadow-md shadow-rose-600/30" : "text-slate-400 hover:text-white"}`}
          >
            মিসিং ({stats.missing_count})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />
          <input
            type="text"
            placeholder="মডেল, কার্ড # বা গ্রাহক খুঁজুন..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center items-center">
            <Loader />
          </div>
        ) : filteredList.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <FaExclamationTriangle className="mx-auto text-3xl text-amber-400/60 mb-2" />
            <p className="text-sm font-semibold">কোনো তথ্য পাওয়া যায়নি</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4 font-bold">কার্ড #</th>
                  <th className="py-3.5 px-4 font-bold">পণ্যের নাম</th>
                  <th className="py-3.5 px-4 font-bold">গ্রাহকের নাম</th>
                  <th className="py-3.5 px-4 font-bold text-right">ক্রয়মূল্য / ব্যয়</th>
                  <th className="py-3.5 px-4 font-bold">ডেলিভারি / ক্রয়ের তারিখ</th>
                  <th className="py-3.5 px-4 font-bold">সাপ্লায়ার</th>
                  <th className="py-3.5 px-4 font-bold text-center">ক্যাশ-আউট স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredList.map((item) => (
                  <tr key={item.card_id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4 font-black text-indigo-400">
                      #{item.card_id}
                    </td>
                    <td className="py-3 px-4 font-bold text-white">
                      {item.product_name}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {item.customer_name}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-rose-400 text-sm">
                      ৳{Number(item.cost_price).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono">
                      {item.delivery_date || "N/A"}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      <div className="flex items-center gap-1">
                        <FaStore className="text-[10px] text-slate-500" />
                        <span>{item.supplier_name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {item.sync_status === "synced" ? (
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[11px] font-bold">
                          <FaCheckCircle className="text-[10px]" />
                          <span>ক্যাশ-আউট সিঙ্কড</span>
                          {item.matched_cash_id && (
                            <span className="text-[10px] text-emerald-300 font-mono ml-0.5">
                              (#{item.matched_cash_id})
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-[11px] font-bold">
                          <FaTimesCircle className="text-[10px]" />
                          <span>খরচ মিসিং</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockPurchaseSyncAudit;

