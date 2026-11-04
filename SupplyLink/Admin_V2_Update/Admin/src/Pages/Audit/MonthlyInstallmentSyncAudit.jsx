import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import BackButton from "../../components/BackButton/BackButton";
import Loader from "../../components/Loader/Loader";
import {
  FaSyncAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaBolt,
  FaSearch,
  FaCalendarAlt,
  FaUser,
  FaMoneyBillWave,
  FaLayerGroup
} from "react-icons/fa";

const MonthlyInstallmentSyncAudit = () => {
  const [loading, setLoading] = useState(true);
  const [syncingAll, setSyncingAll] = useState(false);
  const [syncingSingleId, setSyncingSingleId] = useState(null);
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
  const [monthFilter, setMonthFilter] = useState("all");

  const baseUrl = import.meta.env.VITE_LOCALHOST_KEY || "http://localhost/supplylink_server/apis";

  const fetchAuditData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${baseUrl}/audit/sync_monthly_installments_to_cash.php?action=audit`, {
        withCredentials: true,
      });

      if (res.data?.success) {
        setData(res.data.data || []);
        setStats(res.data.stats || {});
      } else {
        toast.error("মাসিক কিস্তি অডিট ডাটা লোড করতে ব্যর্থ");
      }
    } catch (err) {
      console.error("Monthly installment audit load error:", err);
      toast.error("সার্ভার থেকে অডিট তথ্য আনা যায়নি");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditData();
  }, []);

  // Filtered List
  const filteredList = useMemo(() => {
    return data.filter((item) => {
      // Filter tab check
      if (activeFilter === "missing" && item.sync_status !== "missing") {
        return false;
      }
      if (activeFilter === "synced" && item.sync_status !== "synced") {
        return false;
      }

      // Month check
      if (monthFilter !== "all" && item.paid_date) {
        if (!item.paid_date.startsWith(monthFilter)) {
          return false;
        }
      }

      // Search check
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const str = `${item.customer_name} ${item.customer_mobile} ${item.card_id} ${item.product_name}`.toLowerCase();
        return str.includes(q);
      }

      return true;
    });
  }, [data, activeFilter, monthFilter, search]);

  // Extract unique months for dropdown
  const uniqueMonths = useMemo(() => {
    const set = new Set();
    data.forEach((x) => {
      if (x.paid_date && x.paid_date.length >= 7) {
        set.add(x.paid_date.substring(0, 7));
      }
    });
    return Array.from(set).sort().reverse();
  }, [data]);

  // Sync Single Missing Item
  const handleSyncSingle = async (item) => {
    setSyncingSingleId(item.payment_id);
    try {
      const res = await axios.post(
        `${baseUrl}/audit/sync_monthly_installments_to_cash.php`,
        {
          action: "fix_single",
          payment_id: item.payment_id,
        },
        { withCredentials: true }
      );

      if (res.data?.success) {
        toast.success(res.data.message || "ক্যাশে সফলভাবে সিঙ্ক হয়েছে");
        fetchAuditData();
      } else {
        toast.error(res.data?.message || "সিঙ্ক ব্যর্থ হয়েছে");
      }
    } catch (err) {
      toast.error("সিঙ্ক করার সময় ত্রুটি ঘটেছে");
    } finally {
      setSyncingSingleId(null);
    }
  };

  // Sync All Missing Items
  const handleSyncAllMissing = async () => {
    const result = await Swal.fire({
      title: "সকল মিসিং কিস্তি ক্যাশে সিঙ্ক করবেন?",
      text: `মোট ${stats.missing_count} টি বাদ পড়া কিস্তি (মোট ৳${Number(stats.missing_amount).toLocaleString()}) ক্যাশ বইয়ে জমা করা হবে।`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "হ্যাঁ, সিঙ্ক করুন",
      cancelButtonText: "না, বাতিল",
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#64748b",
      background: "#0f172a",
      color: "#f8fafc",
    });

    if (!result.isConfirmed) return;

    setSyncingAll(true);
    try {
      const res = await axios.post(
        `${baseUrl}/audit/sync_monthly_installments_to_cash.php`,
        { action: "fix_all" },
        { withCredentials: true }
      );

      if (res.data?.success) {
        Swal.fire({
          icon: "success",
          title: "সফল হয়েছে!",
          text: res.data.message,
          background: "#0f172a",
          color: "#f8fafc",
          confirmButtonColor: "#10b981",
        });
        fetchAuditData();
      } else {
        toast.error(res.data?.message || "সিঙ্ক সম্পন্ন হয়নি");
      }
    } catch (err) {
      toast.error("সার্ভার ত্রুটি ঘটেছে");
    } finally {
      setSyncingAll(false);
    }
  };

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
              Audit & Ledger Reconciliation
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-white">
            মাসিক কিস্তি ও ক্যাশ সিঙ্ক অডিট (Monthly Installment Audit)
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            গ্রাহকদের সকল পেইড মাসিক কিস্তির সাথে ক্যাশ বহির ক্যাশ-ইন মিলিয়ে দেখুন এবং কোনোটি মিসিং থাকলে এক ক্লিকে সিঙ্ক করুন।
          </p>
        </div>

        <div className="flex items-center gap-3">
          {stats.missing_count > 0 ? (
            <button
              onClick={handleSyncAllMissing}
              disabled={syncingAll}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/25 transition active:scale-95 flex items-center gap-2 disabled:opacity-50"
            >
              <FaBolt className={syncingAll ? "animate-spin" : ""} />
              <span>
                {syncingAll ? "সিঙ্ক হচ্ছে..." : `সব মিসিং সিঙ্ক করুন (${stats.missing_count} টি)`}
              </span>
            </button>
          ) : (
            <div className="px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs sm:text-sm font-semibold flex items-center gap-2">
              <FaCheckCircle />
              <span>সকল কিস্তি ক্যাশে শতভাগ মিলেছে</span>
            </div>
          )}

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
        {/* Total Paid Installments */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              মোট পেইড মাসিক কিস্তি
            </span>
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <FaLayerGroup />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            {stats.total_records} <span className="text-sm font-normal text-slate-400">টি</span>
          </div>
          <div className="text-xs text-indigo-400 mt-1 font-medium">
            মোট ৳{Number(stats.total_amount).toLocaleString()}
          </div>
        </div>

        {/* Synced in Cash */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              ক্যাশে সিঙ্কড
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
        <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              ক্যাশে মিসিং
            </span>
            <div className={`p-2.5 rounded-2xl border ${stats.missing_count > 0 ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : "bg-slate-800 text-slate-400 border-slate-700"}`}>
              <FaTimesCircle />
            </div>
          </div>
          <div className={`text-2xl font-black ${stats.missing_count > 0 ? "text-rose-400" : "text-slate-300"}`}>
            {stats.missing_count} <span className="text-sm font-normal text-slate-400">টি</span>
          </div>
          <div className="text-xs text-rose-400/90 mt-1 font-medium">
            {stats.missing_count > 0 ? `মোট ৳${Number(stats.missing_amount).toLocaleString()}` : "কোনো মিসিং কিস্তি নেই"}
          </div>
        </div>

        {/* Health Status */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              সিঙ্ক ইন্টিগ্রিটি
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

      {/* Filter & Search Bar */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 w-full md:w-auto">
          <button
            onClick={() => setActiveFilter("all")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${activeFilter === "all" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30" : "text-slate-400 hover:text-white"}`}
          >
            সব কিস্তি ({data.length})
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

        {/* Month Dropdown & Search */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">সকল মাস</option>
            {uniqueMonths.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          <div className="relative w-full sm:w-64">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />
            <input
              type="text"
              placeholder="গ্রাহক, কার্ড বা ফোন খুঁজুন..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>
        </div>
      </div>

      {/* Audit Data Table */}
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
                  <th className="py-3.5 px-4 font-bold">গ্রাহকের নাম ও মোবাইল</th>
                  <th className="py-3.5 px-4 font-bold">কিস্তির বিবরণ</th>
                  <th className="py-3.5 px-4 font-bold">পণ্য</th>
                  <th className="py-3.5 px-4 font-bold text-right">কিস্তির টাকা</th>
                  <th className="py-3.5 px-4 font-bold">পরিশোধের তারিখ</th>
                  <th className="py-3.5 px-4 font-bold">আদায়কারী</th>
                  <th className="py-3.5 px-4 font-bold text-center">ক্যাশ স্ট্যাটাস</th>
                  <th className="py-3.5 px-4 font-bold text-center">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredList.map((item) => (
                  <tr key={item.payment_id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4 font-black text-indigo-400">
                      #{item.card_id}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <FaUser className="text-[10px] text-slate-500" />
                        <span>{item.customer_name}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {item.customer_mobile || "N/A"}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-xl bg-indigo-500/10 text-indigo-300 font-bold text-[11px] border border-indigo-500/20">
                        {item.installment_no}ম কিস্তি
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-medium">
                      {item.product_name}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-emerald-400 text-sm">
                      ৳{Number(item.amount).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono">
                      {item.paid_date || "N/A"}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {item.collector_name}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {item.sync_status === "synced" ? (
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[11px] font-bold">
                          <FaCheckCircle className="text-[10px]" />
                          <span>ক্যাশে অন্তর্ভুক্ত</span>
                          {item.matched_cash_id && (
                            <span className="text-[10px] text-emerald-300 font-mono ml-0.5">
                              (#{item.matched_cash_id})
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-[11px] font-bold">
                          <FaTimesCircle className="text-[10px]" />
                          <span>ক্যাশে মিসিং</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {item.sync_status === "missing" ? (
                        <button
                          onClick={() => handleSyncSingle(item)}
                          disabled={syncingSingleId === item.payment_id}
                          className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black text-[11px] shadow-md shadow-emerald-500/20 transition active:scale-95 disabled:opacity-50 flex items-center gap-1 mx-auto"
                        >
                          <FaBolt className={syncingSingleId === item.payment_id ? "animate-spin" : ""} />
                          <span>সিঙ্ক করুন</span>
                        </button>
                      ) : (
                        <span className="text-slate-500 text-[11px] font-medium">—</span>
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

export default MonthlyInstallmentSyncAudit;

