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
  FaCreditCard,
  FaCalendarAlt,
  FaUser,
  FaBox
} from "react-icons/fa";

const DownpaymentSyncAudit = () => {
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

  const baseUrl = import.meta.env.VITE_LOCALHOST_KEY || "https://management.supplylinkbd.com/apis";

  const fetchAuditData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${baseUrl}/audit/sync_downpayment_to_cash.php?action=audit`, {
        withCredentials: true,
      });

      if (res.data?.success) {
        setData(res.data.data || []);
        setStats(res.data.stats || {});
      } else {
        toast.error("ডাটা লোড করতে ব্যর্থ হয়েছে");
      }
    } catch (err) {
      console.error("Audit load error:", err);
      toast.error("সার্ভার থেকে অডিট ডাটা পাওয়া যায়নি");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditData();
  }, []);

  // 🔹 ফিল্টার্ড তালিকা
  const filteredList = useMemo(() => {
    return data.filter((item) => {
      // Filter tab check
      if (activeFilter === "missing" && item.sync_status !== "missing" && item.sync_status !== "mismatch") {
        return false;
      }
      if (activeFilter === "synced" && item.sync_status !== "synced") {
        return false;
      }
      if (activeFilter === "daily" && item.installment_type !== "daily") {
        return false;
      }
      if (activeFilter === "monthly" && item.installment_type !== "monthly") {
        return false;
      }

      // Search check
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const str = `${item.customer_name} ${item.customer_mobile} ${item.card_id} ${item.product_name}`.toLowerCase();
        return str.includes(q);
      }

      return true;
    });
  }, [data, activeFilter, search]);

  // 🔹 একক ডাউনপেমেন্ট সিঙ্ক
  const handleFixSingle = async (item) => {
    const result = await Swal.fire({
      title: "ডাউনপেমেন্ট ক্যাশ ইন করবেন?",
      html: `
        <div class="text-left text-sm space-y-1 p-2 bg-slate-800 rounded-lg text-slate-200">
          <p><strong>কার্ড নং:</strong> #${item.card_id}</p>
          <p><strong>গ্রাহক:</strong> ${item.customer_name}</p>
          <p><strong>টাকা:</strong> ৳${Number(item.amount).toLocaleString()}</p>
          <p><strong>তারিখ:</strong> ${item.date}</p>
          <p><strong>টাইপ:</strong> ${item.installment_type === 'daily' ? 'দৈনিক কিস্তি' : 'মাসিক কিস্তি'}</p>
        </div>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "হ্যাঁ, ক্যাশ ইন করুন",
      cancelButtonText: "বাতিল",
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#64748b",
      background: "#0f172a",
      color: "#f8fafc",
    });

    if (!result.isConfirmed) return;

    setSyncingSingleId(item.payment_id);
    try {
      const res = await axios.post(
        `${baseUrl}/audit/sync_downpayment_to_cash.php`,
        {
          action: "fix_single",
          payment_id: item.payment_id,
          card_id: item.card_id,
        },
        { withCredentials: true }
      );

      if (res.data?.success) {
        Swal.fire({
          icon: "success",
          title: "সফল!",
          text: res.data.message,
          background: "#0f172a",
          color: "#f8fafc",
          confirmButtonColor: "#10b981",
        });
        fetchAuditData();
      } else {
        toast.error(res.data?.message || "সিঙ্ক ব্যর্থ হয়েছে");
      }
    } catch (err) {
      toast.error("সার্ভার এরর ঘটেছে");
    } finally {
      setSyncingSingleId(null);
    }
  };

  // 🔹 সব মিসিং ডাউনপেমেন্ট একসাথে সিঙ্ক
  const handleSyncAllMissing = async () => {
    const result = await Swal.fire({
      title: "সব মিসিং ডাউনপেমেন্ট সিঙ্ক করবেন?",
      text: `মোট ${stats.missing_count} টি বাদ পড়া ডাউনপেমেন্ট (৳${Number(stats.missing_amount).toLocaleString()}) ক্যাশ টেবিলে স্বয়ংক্রিয়ভাবে জমা হবে।`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "হ্যাঁ, সবগুলো সিঙ্ক করুন",
      cancelButtonText: "না, পরে করব",
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#64748b",
      background: "#0f172a",
      color: "#f8fafc",
    });

    if (!result.isConfirmed) return;

    setSyncingAll(true);
    try {
      const res = await axios.post(
        `${baseUrl}/audit/sync_downpayment_to_cash.php`,
        { action: "sync_all_missing" },
        { withCredentials: true }
      );

      if (res.data?.success) {
        Swal.fire({
          icon: "success",
          title: "অভিনন্দন!",
          text: res.data.message,
          background: "#0f172a",
          color: "#f8fafc",
          confirmButtonColor: "#10b981",
        });
        fetchAuditData();
      } else {
        toast.error(res.data?.message || "সিঙ্ক করা সম্ভব হয়নি");
      }
    } catch (err) {
      toast.error("সার্ভার সংযোগে সমস্যা হয়েছে");
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

      {/* 🔹 টপ হেডার বার */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              Audit & Ledger Sync
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-white">
            ডাউনপেমেন্ট ও ক্যাশ সিঙ্ক অডিটর (Daily & Monthly)
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            দৈনিক ও মাসিক সকল কিস্তির ডাউনপেমেন্ট যাচাই করুন এবং বাদ পড়া টাকাগুলো এক ক্লিকে ক্যাশে জমা দিন।
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
            <div className="px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
              <FaCheckCircle /> সকল ডাউনপেমেন্ট ক্যাশে জমা আছে!
            </div>
          )}

          <button
            onClick={fetchAuditData}
            className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="রিফ্রেশ"
          >
            <FaSyncAlt className={loading ? "animate-spin text-indigo-400" : ""} />
          </button>
        </div>
      </div>

      {/* 🔹 স্ট্যাটস কার্ডসমূহ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0f172a] border border-slate-800 p-5 rounded-2xl shadow-lg">
          <p className="text-xs text-slate-400 font-medium">মোট ডাউনপেমেন্ট রেকর্ড</p>
          <h3 className="text-2xl font-black text-white mt-1">
            {stats.total_records} <span className="text-xs font-normal text-slate-400">টি</span>
          </h3>
          <p className="text-xs font-mono text-indigo-400 mt-1">
            মোট: ৳{Number(stats.total_amount).toLocaleString()}
          </p>
        </div>

        <div className="bg-[#0f172a] border border-emerald-500/20 p-5 rounded-2xl shadow-lg">
          <p className="text-xs text-emerald-400 font-medium">ক্যাশ খাতায় জমা আছে (Synced)</p>
          <h3 className="text-2xl font-black text-emerald-400 mt-1">
            {stats.synced_count} <span className="text-xs font-normal text-slate-400">টি</span>
          </h3>
          <p className="text-xs font-mono text-emerald-300 mt-1">
            জমা: ৳{Number(stats.synced_amount).toLocaleString()}
          </p>
        </div>

        <div className="bg-[#0f172a] border border-rose-500/20 p-5 rounded-2xl shadow-lg">
          <p className="text-xs text-rose-400 font-medium">ক্যাশ খাতায় বাদ পড়েছে (Missing)</p>
          <h3 className="text-2xl font-black text-rose-400 mt-1">
            {stats.missing_count} <span className="text-xs font-normal text-slate-400">টি</span>
          </h3>
          <p className="text-xs font-mono text-rose-300 mt-1">
            বাকি: ৳{Number(stats.missing_amount).toLocaleString()}
          </p>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 p-5 rounded-2xl shadow-lg">
          <p className="text-xs text-slate-400 font-medium">সিঙ্ক অগ্রগতি (Sync Progress)</p>
          <h3 className="text-2xl font-black text-white mt-1">{progressPercent}%</h3>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* 🔹 ফিল্টার ও সার্চ বার */}
      <div className="bg-[#0f172a] border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: "all", label: `সবগুলো (${stats.total_records})` },
            { id: "missing", label: `❌ শুধু বাদ পড়াগুলো (${stats.missing_count})`, color: "text-rose-400" },
            { id: "synced", label: `✅ ক্যাশে জমা আছে (${stats.synced_count})`, color: "text-emerald-400" },
            { id: "daily", label: "📅 দৈনিক কিস্তি", color: "text-amber-400" },
            { id: "monthly", label: "🗓️ মাসিক কিস্তি", color: "text-blue-400" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                activeFilter === tab.id
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : `bg-slate-800 hover:bg-slate-700 ${tab.color || "text-slate-300"}`
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <FaSearch className="absolute left-3 top-3 text-slate-500 text-xs" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="গ্রাহকের নাম, মোবাইল বা কার্ড নং..."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition shadow-inner font-sans"
          />
        </div>
      </div>

      {/* 🔹 টেবিল কনটেইনার */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <Loader />
          </div>
        ) : filteredList.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            কোনো ডাউনপেমেন্ট ডাটা পাওয়া যায়নি।
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#070d1e] text-slate-400 font-bold uppercase text-[11px] border-b border-slate-800">
                <tr>
                  <th className="p-4">#</th>
                  <th className="p-4">কার্ড নং</th>
                  <th className="p-4">টাইপ</th>
                  <th className="p-4">গ্রাহকের নাম ও মোবাইল</th>
                  <th className="p-4">পণ্য</th>
                  <th className="p-4">তারিখ</th>
                  <th className="p-4 text-right">ডাউনপেমেন্ট (৳)</th>
                  <th className="p-4 text-center">ক্যাশ স্ট্যাটাস</th>
                  <th className="p-4 text-center">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {filteredList.map((item, index) => {
                  const isSyncing = syncingSingleId === item.payment_id;

                  return (
                    <tr key={item.payment_id} className="hover:bg-slate-800/40 transition">
                      <td className="p-4 font-mono text-slate-500">{index + 1}</td>

                      <td className="p-4 font-mono font-bold text-white">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-indigo-300">
                          #{item.card_id}
                        </span>
                      </td>

                      <td className="p-4">
                        {item.installment_type === "daily" ? (
                          <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 font-semibold text-[10px]">
                            দৈনিক কিস্তি
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 font-semibold text-[10px]">
                            মাসিক কিস্তি
                          </span>
                        )}
                      </td>

                      <td className="p-4">
                        <div className="font-bold text-white text-sm">{item.customer_name}</div>
                        <div className="text-slate-400 font-mono text-[11px]">{item.customer_mobile}</div>
                      </td>

                      <td className="p-4 text-slate-300 max-w-xs truncate" title={item.product_name}>
                        {item.product_name}
                      </td>

                      <td className="p-4 font-mono text-slate-300">
                        {item.date}
                      </td>

                      <td className="p-4 text-right font-mono font-bold text-sm text-emerald-400">
                        ৳ {Number(item.amount).toLocaleString()}
                      </td>

                      <td className="p-4 text-center">
                        {item.sync_status === "synced" ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                              <FaCheckCircle className="text-[10px]" /> ক্যাশে জমা আছে
                            </span>
                            {item.matched_cash_id && (
                              <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                                Cash ID: #{item.matched_cash_id}
                              </div>
                            )}
                          </div>
                        ) : item.sync_status === "mismatch" ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold">
                            <FaExclamationTriangle className="text-[10px]" /> গরমিল
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-bold">
                            <FaTimesCircle className="text-[10px]" /> ক্যাশে জমা হয়নি
                          </span>
                        )}
                      </td>

                      <td className="p-4 text-center">
                        {item.sync_status === "synced" ? (
                          <button
                            disabled
                            className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-500 text-xs cursor-not-allowed"
                          >
                            সিঙ্কড ✅
                          </button>
                        ) : (
                          <button
                            onClick={() => handleFixSingle(item)}
                            disabled={isSyncing}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition active:scale-95 disabled:opacity-50"
                          >
                            {isSyncing ? "সিঙ্ক হচ্ছে..." : "⚡ ক্যাশ ইন করুন"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DownpaymentSyncAudit;

