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
  FaLayerGroup,
  FaUserTie,
  FaBalanceScale,
  FaMoneyBillWave
} from "react-icons/fa";

const DailyInstallmentSyncAudit = () => {
  const [loading, setLoading] = useState(true);
  const [syncingAll, setSyncingAll] = useState(false);
  const [syncingSingleId, setSyncingSingleId] = useState(null);
  const [convertingBatches, setConvertingBatches] = useState(false);
  const [data, setData] = useState([]);
  const [extraCash, setExtraCash] = useState([]);
  const [stats, setStats] = useState({
    total_records: 0,
    total_amount: 0,
    synced_count: 0,
    synced_amount: 0,
    batch_count: 0,
    batch_amount: 0,
    missing_count: 0,
    missing_amount: 0,
    extra_cash_count: 0,
    extra_cash_amount: 0,
  });

  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const baseUrl = import.meta.env.VITE_LOCALHOST_KEY || "https://management.supplylinkbd.com/apis";

  const fetchAuditData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${baseUrl}/audit/sync_daily_installments_to_cash.php?action=audit`, {
        withCredentials: true,
      });

      if (res.data?.success) {
        setData(res.data.data || []);
        setExtraCash(res.data.extra_cash || []);
        setStats(res.data.stats || {});
      } else {
        toast.error("ডাটা লোড করতে ব্যর্থ হয়েছে");
      }
    } catch (err) {
      console.error(err);
      toast.error("সার্ভার ত্রুটি: অডিট ডাটা লোড করা যাচ্ছে না");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditData();
  }, []);

  // Filtered rows for daily installments
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      // Status filter
      if (activeFilter === "missing" && item.sync_status !== "missing") return false;
      if (activeFilter === "synced" && item.sync_status !== "synced") return false;
      if (activeFilter === "batch" && item.sync_status !== "batch_synced") return false;

      // Date filter
      if (dateFilter && item.date !== dateFilter) return false;

      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const name = (item.customer_name || "").toLowerCase();
        const mobile = (item.customer_mobile || "").toLowerCase();
        const cardId = String(item.card_id || "");
        const dailyId = String(item.daily_id || "");
        const receiver = (item.receiver_name || "").toLowerCase();
        const product = (item.product_name || "").toLowerCase();

        return (
          name.includes(q) ||
          mobile.includes(q) ||
          cardId.includes(q) ||
          dailyId.includes(q) ||
          receiver.includes(q) ||
          product.includes(q)
        );
      }
      return true;
    });
  }, [data, activeFilter, dateFilter, search]);

  // Handle Single Sync
  const handleSyncSingle = async (row) => {
    const result = await Swal.fire({
      title: "ক্যাশে সিঙ্ক নিশ্চিতকরণ",
      html: `
        <div class="text-left text-sm space-y-2">
          <p><strong>কিস্তি আইডি:</strong> #${row.daily_id}</p>
          <p><strong>কাস্টমার:</strong> ${row.customer_name}</p>
          <p><strong>কার্ড নং:</strong> #${row.card_id}</p>
          <p><strong>তারিখ:</strong> ${row.date}</p>
          <p><strong>কালেকশন পরিমাণ:</strong> ৳${Number(row.amount).toLocaleString()}</p>
        </div>
        <p class="mt-3 text-sm text-gray-400">এই কিস্তিটি ক্যাশ টেবিলে 'daily-installment' হিসেবে জমা হবে।</p>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#059669",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "হ্যাঁ, ক্যাশে যোগ করুন",
      cancelButtonText: "বাতিল",
    });

    if (!result.isConfirmed) return;

    setSyncingSingleId(row.daily_id);
    try {
      const res = await axios.post(
        `${baseUrl}/audit/sync_daily_installments_to_cash.php`,
        {
          action: "fix_single",
          daily_id: row.daily_id,
        },
        { withCredentials: true }
      );

      if (res.data?.success) {
        Swal.fire({
          icon: "success",
          title: "সফল!",
          text: `কিস্তি #${row.daily_id} সফলভাবে ক্যাশে সিঙ্ক হয়েছে।`,
          timer: 2000,
          showConfirmButton: false,
        });
        fetchAuditData();
      } else {
        Swal.fire({
          icon: "error",
          title: "ব্যর্থ",
          text: res.data?.message || "সিঙ্ক করতে সমস্যা হয়েছে",
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "ত্রুটি",
        text: err.response?.data?.message || "সার্ভার এরর",
      });
    } finally {
      setSyncingSingleId(null);
    }
  };

  // Handle Bulk Sync All Missing
  const handleSyncAll = async () => {
    if (stats.missing_count === 0) {
      toast.info("কোনো মিসিং দৈনিক কিস্তি নেই!");
      return;
    }

    const result = await Swal.fire({
      title: "সব মিসিং কিস্তি ক্যাশে সিঙ্ক করবেন?",
      html: `
        <div class="text-left text-sm space-y-1">
          <p><strong>মোট মিসিং রেকর্ড:</strong> ${stats.missing_count} টি</p>
          <p><strong>মোট মিসিং টাকার পরিমাণ:</strong> ৳${Number(stats.missing_amount).toLocaleString()}</p>
          <p class="text-emerald-400 mt-2 font-semibold">বিঃ দ্রঃ পূর্বে লাম্পসাম/ব্যাচ ক্যাশে যুক্ত কিস্তিগুলো বাদ রেখে কেবল প্রকৃত মিসিংগুলো সিঙ্ক করা হবে। কোনো ডুপ্লিকেট হবে না।</p>
        </div>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#6b7280",
      confirmButtonText: `হ্যাঁ, সব (${stats.missing_count} টি) সিঙ্ক করুন`,
      cancelButtonText: "বাতিল",
    });

    if (!result.isConfirmed) return;

    setSyncingAll(true);
    try {
      const res = await axios.post(
        `${baseUrl}/audit/sync_daily_installments_to_cash.php`,
        { action: "fix_all" },
        { withCredentials: true }
      );

      if (res.data?.success) {
        Swal.fire({
          icon: "success",
          title: "সিঙ্ক সফল!",
          html: `
            <p>${res.data.message}</p>
          `,
        });
        fetchAuditData();
      } else {
        Swal.fire({
          icon: "error",
          title: "ব্যর্থ",
          text: res.data?.message || "সিঙ্ক সম্পূর্ণ হয়নি",
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "সার্ভার এরর",
        text: err.response?.data?.message || "সিঙ্ক করতে ব্যর্থ হয়েছে",
      });
    } finally {
      setSyncingAll(false);
    }
  };

  // Handle Convert Batches to Real Itemized Installments
  const handleConvertBatches = async () => {
    const result = await Swal.fire({
      title: "পুরোনো ব্যাচ এন্ট্রি আসল নামে রূপান্তর করবেন?",
      html: `
        <div class="text-left text-sm space-y-2">
          <p><strong>কী পরিবর্তন হবে:</strong></p>
          <ul class="list-disc pl-5 space-y-1 text-gray-300">
            <li>ক্যাশ টেবিলের নামবিহীন <strong class="text-cyan-400">${stats.batch_count} টি পুরানো ব্যাচ এন্ট্রি</strong> রিমুভ (আর্কাইভ) করা হবে।</li>
            <li>সেগুলোর পরিবর্তে <strong class="text-emerald-400">আসল গ্রাহকের নাম, কার্ড নম্বর ও আদায়কারীসহ পৃথক পৃথক কিস্তি</strong> ক্যাশে তৈরি হবে।</li>
            <li>মিসিং কিস্তিগুলোসহ সব কিস্তির হিসাব ১০০% নির্ভুল ও কাস্টমারভিত্তিক হবে।</li>
          </ul>
        </div>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#0284c7",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "হ্যাঁ, আসল নামসহ রূপান্তর করুন",
      cancelButtonText: "বাতিল",
    });

    if (!result.isConfirmed) return;

    setConvertingBatches(true);
    try {
      const res = await axios.post(
        `${baseUrl}/audit/sync_daily_installments_to_cash.php`,
        { action: "convert_batches" },
        { withCredentials: true }
      );

      if (res.data?.success) {
        Swal.fire({
          icon: "success",
          title: "রূপান্তর সম্পন্ন!",
          html: `<p>${res.data.message}</p>`,
        });
        fetchAuditData();
      } else {
        Swal.fire({
          icon: "error",
          title: "ব্যর্থ",
          text: res.data?.message || "রূপান্তর করা যায়নি",
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "সার্ভার এরর",
        text: err.response?.data?.message || "অপারেশন সম্পন্ন করা যায়নি",
      });
    } finally {
      setConvertingBatches(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b132b] text-white p-4 sm:p-6 lg:p-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <BackButton />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <FaBalanceScale className="text-indigo-400" />
              দৈনিক কিস্তি ও ক্যাশ ২-মুখী অডিট (Reconciliation)
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
              `cash` টেবিল এবং `daily_installments` টেবিলের রিয়েল-টাইম তথ্য যাচাই (মিসিং ও অতিরিক্ত ক্যাশ শনাক্তকরণ)
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={fetchAuditData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-[#1c2541] hover:bg-[#253256] text-gray-200 rounded-lg text-sm transition-all border border-gray-700 disabled:opacity-50"
          >
            <FaSyncAlt className={loading ? "animate-spin text-cyan-400" : ""} />
            রিফ্রেশ
          </button>

          {stats.batch_count > 0 && (
            <button
              onClick={handleConvertBatches}
              disabled={convertingBatches}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold rounded-lg text-sm shadow-lg shadow-cyan-900/30 transition-all disabled:opacity-50"
              title="পুরানো নামবিহীন ব্যাচ ক্যাশ এন্ট্রিগুলো সরিয়ে আসল গ্রাহকের নাম ও কার্ড নম্বরসহ ক্যাশে রূপান্তর করুন"
            >
              <FaLayerGroup className={convertingBatches ? "animate-spin text-cyan-200" : "text-cyan-200"} />
              {convertingBatches ? "রূপান্তর হচ্ছে..." : `ব্যাচ রূপান্তর করুন (${stats.batch_count})`}
            </button>
          )}

          {stats.missing_count > 0 && (
            <button
              onClick={handleSyncAll}
              disabled={syncingAll}
              className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-lg text-sm shadow-lg shadow-emerald-900/30 transition-all disabled:opacity-50"
            >
              <FaBolt className={syncingAll ? "animate-bounce text-yellow-300" : "text-yellow-300"} />
              {syncingAll ? "সিঙ্ক হচ্ছে..." : `মিসিংগুলো ক্যাশে যোগ করুন (${stats.missing_count})`}
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Cards (5 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mb-6">
        {/* Total Records */}
        <div className="bg-[#1c2541]/80 backdrop-blur border border-gray-800 rounded-xl p-3.5 shadow">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400 font-medium">মোট কালেকশন রেকর্ড</p>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-sm">
              <FaCreditCard />
            </div>
          </div>
          <h3 className="text-xl font-bold text-white mt-1">
            {stats.total_records} <span className="text-xs font-normal text-gray-400">টি</span>
          </h3>
          <p className="text-xs text-indigo-400 font-semibold mt-0.5">
            মোট: ৳{Number(stats.total_amount).toLocaleString()}
          </p>
        </div>

        {/* Itemized Synced */}
        <div className="bg-[#1c2541]/80 backdrop-blur border border-emerald-900/40 rounded-xl p-3.5 shadow">
          <div className="flex items-center justify-between">
            <p className="text-xs text-emerald-400 font-medium">ক্যাশে সিঙ্কড (আইটেম)</p>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-sm">
              <FaCheckCircle />
            </div>
          </div>
          <h3 className="text-xl font-bold text-emerald-400 mt-1">
            {stats.synced_count} <span className="text-xs font-normal text-gray-400">টি</span>
          </h3>
          <p className="text-xs text-emerald-300 font-semibold mt-0.5">
            ৳{Number(stats.synced_amount).toLocaleString()}
          </p>
        </div>

        {/* Batch Synced */}
        <div className="bg-[#1c2541]/80 backdrop-blur border border-cyan-900/40 rounded-xl p-3.5 shadow">
          <div className="flex items-center justify-between">
            <p className="text-xs text-cyan-400 font-medium">ক্যাশে ব্যাচ অন্তর্ভুক্ত</p>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 text-sm">
              <FaLayerGroup />
            </div>
          </div>
          <h3 className="text-xl font-bold text-cyan-400 mt-1">
            {stats.batch_count} <span className="text-xs font-normal text-gray-400">টি</span>
          </h3>
          <p className="text-xs text-cyan-300 font-semibold mt-0.5">
            ৳{Number(stats.batch_amount).toLocaleString()}
          </p>
        </div>

        {/* Missing Count */}
        <div
          className={`backdrop-blur border rounded-xl p-3.5 shadow transition-all ${
            stats.missing_count > 0
              ? "bg-rose-950/30 border-rose-800/60"
              : "bg-[#1c2541]/80 border-gray-800"
          }`}
        >
          <div className="flex items-center justify-between">
            <p
              className={`text-xs font-medium ${
                stats.missing_count > 0 ? "text-rose-400" : "text-gray-400"
              }`}
            >
              ক্যাশে মিসিং (নাই)
            </p>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                stats.missing_count > 0
                  ? "bg-rose-500/10 border border-rose-500/30 text-rose-400"
                  : "bg-gray-500/10 text-gray-400"
              }`}
            >
              {stats.missing_count > 0 ? <FaTimesCircle /> : <FaCheckCircle />}
            </div>
          </div>
          <h3
            className={`text-xl font-bold mt-1 ${
              stats.missing_count > 0 ? "text-rose-400" : "text-gray-300"
            }`}
          >
            {stats.missing_count} <span className="text-xs font-normal text-gray-400">টি</span>
          </h3>
          <p
            className={`text-xs font-semibold mt-0.5 ${
              stats.missing_count > 0 ? "text-rose-300" : "text-gray-400"
            }`}
          >
            ৳{Number(stats.missing_amount).toLocaleString()}
          </p>
        </div>

        {/* Extra / Discrepancy Cash in DB */}
        <div
          className={`backdrop-blur border rounded-xl p-3.5 shadow transition-all ${
            stats.extra_cash_count > 0
              ? "bg-amber-950/30 border-amber-800/60"
              : "bg-[#1c2541]/80 border-gray-800"
          }`}
        >
          <div className="flex items-center justify-between">
            <p
              className={`text-xs font-medium ${
                stats.extra_cash_count > 0 ? "text-amber-400" : "text-gray-400"
              }`}
            >
              ক্যাশে বেশি / অমিল
            </p>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                stats.extra_cash_count > 0
                  ? "bg-amber-500/10 border border-amber-500/30 text-amber-400"
                  : "bg-gray-500/10 text-gray-400"
              }`}
            >
              <FaExclamationTriangle />
            </div>
          </div>
          <h3
            className={`text-xl font-bold mt-1 ${
              stats.extra_cash_count > 0 ? "text-amber-400" : "text-gray-300"
            }`}
          >
            {stats.extra_cash_count} <span className="text-xs font-normal text-gray-400">টি</span>
          </h3>
          <p
            className={`text-xs font-semibold mt-0.5 ${
              stats.extra_cash_count > 0 ? "text-amber-300" : "text-gray-400"
            }`}
          >
            ৳{Number(stats.extra_cash_amount).toLocaleString()} বেশি
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-[#1c2541]/80 backdrop-blur border border-gray-800 rounded-xl p-4 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setActiveFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeFilter === "all"
                ? "bg-indigo-600 text-white shadow"
                : "bg-[#0b132b] text-gray-300 hover:bg-[#253256]"
            }`}
          >
            সব কালেকশন ({stats.total_records})
          </button>
          <button
            onClick={() => setActiveFilter("missing")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeFilter === "missing"
                ? "bg-rose-600 text-white shadow"
                : "bg-[#0b132b] text-gray-300 hover:bg-[#253256]"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                stats.missing_count > 0 ? "bg-rose-400 animate-pulse" : "bg-gray-500"
              }`}
            />
            ক্যাশে নাই / মিসিং ({stats.missing_count})
          </button>
          <button
            onClick={() => setActiveFilter("synced")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeFilter === "synced"
                ? "bg-emerald-600 text-white shadow"
                : "bg-[#0b132b] text-gray-300 hover:bg-[#253256]"
            }`}
          >
            সিঙ্কড ({stats.synced_count})
          </button>
          <button
            onClick={() => setActiveFilter("batch")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeFilter === "batch"
                ? "bg-cyan-600 text-white shadow"
                : "bg-[#0b132b] text-gray-300 hover:bg-[#253256]"
            }`}
          >
            ব্যাচ অন্তর্ভুক্ত ({stats.batch_count})
          </button>
          <button
            onClick={() => setActiveFilter("extra_cash")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeFilter === "extra_cash"
                ? "bg-amber-600 text-white shadow"
                : "bg-[#0b132b] text-gray-300 hover:bg-[#253256]"
            }`}
          >
            <FaExclamationTriangle className="text-[10px] text-amber-400" />
            ক্যাশে বেশি / অমিল ({stats.extra_cash_count})
          </button>
        </div>

        {/* Date & Search */}
        {activeFilter !== "extra_cash" && (
          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Date Picker */}
            <div className="relative">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="bg-[#0b132b] border border-gray-700 text-gray-300 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
                title="তারিখ দিয়ে ফিল্টার করুন"
              />
              {dateFilter && (
                <button
                  onClick={() => setDateFilter("")}
                  className="absolute right-2 top-2.5 text-gray-400 hover:text-white text-xs"
                  title="ফিল্টার মুছুন"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Search Box */}
            <div className="relative flex-1 md:w-64">
              <FaSearch className="absolute left-3 top-3 text-gray-500 text-xs" />
              <input
                type="text"
                placeholder="কাস্টমার, কার্ড, আদায়কারী খুঁজুন..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#0b132b] border border-gray-700 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-all"
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {activeFilter === "extra_cash" ? (
        /* Extra / Discrepancy Cash Table */
        <div className="bg-[#1c2541]/80 backdrop-blur border border-amber-900/50 rounded-xl overflow-hidden shadow">
          <div className="p-4 bg-amber-950/20 border-b border-amber-900/40 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-amber-400 flex items-center gap-2">
                <FaExclamationTriangle />
                ক্যাশ টেবিলে অতিরিক্ত / অমিল এন্ট্রি তালিকা
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                এই এন্ট্রিগুলোতে ক্যাশ টেবিলের টাকার পরিমাণ দৈনিক কিস্তির রেকর্ডের চেয়ে বেশি অথবা কিস্তি রেকর্ড ছাড়াই ক্যাশ এন্ট্রি হয়েছে।
              </p>
            </div>
            <span className="px-3 py-1 bg-amber-500/20 text-amber-300 text-xs rounded-full border border-amber-500/30 font-medium">
              মোট অমিল: ৳{Number(stats.extra_cash_amount).toLocaleString()}
            </span>
          </div>

          {extraCash.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <FaCheckCircle className="mx-auto text-4xl text-emerald-400 mb-2" />
              <p className="text-sm">ক্যাশ টেবিলে কোনো অতিরিক্ত বা অমিল এন্ট্রি নেই! সম্পূর্ণ ব্যালেন্সড।</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#141d36] text-gray-300 border-b border-gray-800 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">ক্যাশ #ID</th>
                    <th className="py-3 px-4">তারিখ</th>
                    <th className="py-3 px-4">ক্যাশ এন্ট্রি পরিমাণ</th>
                    <th className="py-3 px-4">ঐ তারিখের মোট কিস্তি আদায়</th>
                    <th className="py-3 px-4 text-amber-400">ক্যাশে বেশি (পার্থক্য)</th>
                    <th className="py-3 px-4">ক্যাশ সোর্স / বিবরণ</th>
                    <th className="py-3 px-4">অডিট বিস্তারিত</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {extraCash.map((row) => (
                    <tr key={row.cash_id} className="hover:bg-[#222e54]/50 transition-colors bg-amber-950/10">
                      <td className="py-3 px-4 font-mono font-bold text-amber-400">
                        #{row.cash_id}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-gray-300">
                        {row.date}
                      </td>
                      <td className="py-3 px-4 font-bold text-sm text-white">
                        ৳{Number(row.amount).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-300">
                        ৳{Number(row.daily_total || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-bold text-sm text-amber-400">
                        +৳{Number(row.excess_amount || row.amount).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-gray-300">
                        <div className="font-semibold">{row.source || "Daily Installment"}</div>
                        {row.remarks && <div className="text-[11px] text-gray-400">{row.remarks}</div>}
                      </td>
                      <td className="py-3 px-4 text-gray-300 text-[11px] max-w-xs">
                        <span className="text-amber-300/90 leading-tight">
                          {row.description}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Regular Daily Installments Audit Table */
        <div className="bg-[#1c2541]/80 backdrop-blur border border-gray-800 rounded-xl overflow-hidden shadow">
          {activeFilter === "batch" && stats.batch_count > 0 && (
            <div className="p-4 bg-cyan-950/20 border-b border-cyan-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-cyan-400 flex items-center gap-2">
                  <FaLayerGroup />
                  পুরোনো ব্যাচ এন্ট্রি থেকে আসল নামে রূপান্তর
                </h4>
                <p className="text-xs text-gray-400 mt-0.5">
                  এই {stats.batch_count}টি কিস্তি পূর্বে ক্যাশ টেবিলে এককালীন 'DAILY INSTALLMENT COLLECTION' হিসেবে যুক্ত ছিল। 'এখনই রূপান্তর করুন' বাটনে ক্লিক করলে এগুলো গ্রাহকের আসল নাম, মোবাইল ও কার্ড নম্বরসহ ক্যাশে পৃথক পৃথকভাবে যুক্ত হবে।
                </p>
              </div>
              <button
                onClick={handleConvertBatches}
                disabled={convertingBatches}
                className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold whitespace-nowrap shadow transition-all disabled:opacity-50"
              >
                {convertingBatches ? "রূপান্তর হচ্ছে..." : "এখনই রূপান্তর করুন"}
              </button>
            </div>
          )}
          {loading ? (
            <div className="py-20">
              <Loader />
            </div>
          ) : filteredData.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <FaCheckCircle className="mx-auto text-4xl text-gray-600 mb-2" />
              <p className="text-sm">কোনো রেকর্ড পাওয়া যায়নি</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#141d36] text-gray-300 border-b border-gray-800 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">#ID</th>
                    <th className="py-3 px-4">তারিখ</th>
                    <th className="py-3 px-4">কাস্টমার</th>
                    <th className="py-3 px-4">কার্ড নং ও প্রোডাক্ট</th>
                    <th className="py-3 px-4">আদায়কারী</th>
                    <th className="py-3 px-4 text-right">কালেকশন পরিমাণ</th>
                    <th className="py-3 px-4 text-center">ক্যাশ স্ট্যাটাস</th>
                    <th className="py-3 px-4">ক্যাশ রেফারেন্স / তথ্য</th>
                    <th className="py-3 px-4 text-center">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {filteredData.map((row) => {
                    const isMissing = row.sync_status === "missing";
                    const isBatch = row.sync_status === "batch_synced";
                    const isSynced = row.sync_status === "synced";

                    return (
                      <tr
                        key={row.daily_id}
                        className={`hover:bg-[#222e54]/50 transition-colors ${
                          isMissing ? "bg-rose-950/10" : ""
                        }`}
                      >
                        {/* ID */}
                        <td className="py-3 px-4 font-mono text-gray-400">
                          #{row.daily_id}
                        </td>

                        {/* Date */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="flex items-center gap-1.5 text-gray-300">
                            <FaCalendarAlt className="text-gray-500 text-[10px]" />
                            {row.date}
                          </span>
                        </td>

                        {/* Customer */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white flex items-center gap-1.5">
                            <FaUser className="text-indigo-400 text-[10px]" />
                            {row.customer_name}
                          </div>
                          {row.customer_mobile && (
                            <div className="text-[11px] text-gray-400">
                              {row.customer_mobile}
                            </div>
                          )}
                        </td>

                        {/* Card & Product */}
                        <td className="py-3 px-4">
                          <span className="inline-block px-1.5 py-0.5 rounded bg-indigo-900/50 text-indigo-300 font-mono text-[10px] mr-1.5">
                            কার্ড #{row.card_id}
                          </span>
                          <span className="text-gray-300 text-[11px]">
                            {row.product_name}
                          </span>
                        </td>

                        {/* Receiver */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="flex items-center gap-1.5 text-gray-300">
                            <FaUserTie className="text-cyan-400 text-[10px]" />
                            {row.receiver_name}
                          </span>
                        </td>

                        {/* Amount */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <span className="font-bold text-sm text-emerald-400">
                            ৳{Number(row.amount).toLocaleString()}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {isSynced && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                              <FaCheckCircle className="text-[10px]" />
                              সিঙ্কড
                            </span>
                          )}
                          {isBatch && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                              <FaLayerGroup className="text-[10px]" />
                              ব্যাচ অন্তর্ভুক্ত
                            </span>
                          )}
                          {isMissing && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30 animate-pulse">
                              <FaTimesCircle className="text-[10px]" />
                              ক্যাশে নাই
                            </span>
                          )}
                        </td>

                        {/* Cash Ref / Note */}
                        <td className="py-3 px-4">
                          {isSynced && (
                            <div className="text-[11px] text-gray-300">
                              ক্যাশ আইডি:{" "}
                              <span className="font-mono text-emerald-400 font-semibold">
                                #{row.matched_cash_id}
                              </span>
                            </div>
                          )}
                          {isBatch && (
                            <div className="text-[11px] text-cyan-300/90 leading-tight">
                              {row.batch_note || `ক্যাশ আইডি #${row.matched_cash_id} তে অন্তর্ভুক্ত`}
                            </div>
                          )}
                          {isMissing && (
                            <span className="text-[11px] text-rose-400/80 italic">
                              ক্যাশ এন্ট্রি পাওয়া যায়নি
                            </span>
                          )}
                        </td>

                        {/* Action */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {isMissing ? (
                            <button
                              onClick={() => handleSyncSingle(row)}
                              disabled={syncingSingleId === row.daily_id}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-all shadow disabled:opacity-50 flex items-center gap-1.5 mx-auto"
                            >
                              <FaBolt className={syncingSingleId === row.daily_id ? "animate-spin" : "text-yellow-300"} />
                              {syncingSingleId === row.daily_id ? "সিঙ্ক হচ্ছে..." : "ক্যাশে যোগ করুন"}
                            </button>
                          ) : (
                            <span className="text-gray-500 text-xs">✓ ঠিক আছে</span>
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
      )}
    </div>
  );
};

export default DailyInstallmentSyncAudit;
