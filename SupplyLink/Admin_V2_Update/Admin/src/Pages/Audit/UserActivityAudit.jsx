import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  FaSearch,
  FaFilter,
  FaCalendarAlt,
  FaUser,
  FaMoneyBillWave,
  FaSignInAlt,
  FaHistory,
  FaMobileAlt,
  FaDesktop,
  FaEye,
  FaTimes,
  FaSync,
  FaShieldAlt,
  FaCheckCircle,
  FaRoute,
  FaEdit
} from "react-icons/fa";
import { TbActivity, TbReportMoney } from "react-icons/tb";

const UserActivityAudit = () => {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({
    total_today: 0,
    active_users_today: 0,
    financial_volume_today: 0,
    logins_today: 0,
  });
  const [usersList, setUsersList] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

  // Filters
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [page, setPage] = useState(1);
  const limit = 40;

  // Selected Log Details Modal
  const [activeModalLog, setActiveModalLog] = useState(null);

  const baseUrl = import.meta.env.VITE_LOCALHOST_KEY || "https://management.supplylinkbd.com/apis";

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${baseUrl}/audit/get_activity_logs.php`, {
        params: {
          user_id: selectedUser || undefined,
          category: selectedCategory !== "all" ? selectedCategory : undefined,
          search: search || undefined,
          date: date || undefined,
          page,
          limit,
        },
        withCredentials: true,
      });

      if (res.data?.success) {
        setLogs(res.data.logs || []);
        setStats(res.data.stats || {});
        setUsersList(res.data.users || []);
        setTotalCount(res.data.total || 0);
        setTotalAmount(res.data.total_amount || 0);
      }
    } catch (err) {
      console.error("Error fetching activity logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedUser, selectedCategory, date, page]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs();
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Helpers
  const getCategoryBadge = (cat) => {
    switch (cat) {
      case "financial":
        return {
          label: "টাকা / লেনদেন",
          classes: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
          icon: <FaMoneyBillWave className="mr-1 inline text-xs" />,
        };
      case "auth":
        return {
          label: "লগইন / সিকিউরিটি",
          classes: "bg-amber-500/15 text-amber-400 border-amber-500/30",
          icon: <FaSignInAlt className="mr-1 inline text-xs" />,
        };
      case "navigation":
        return {
          label: "পেজ ভিজিট",
          classes: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
          icon: <FaRoute className="mr-1 inline text-xs" />,
        };
      case "modification":
        return {
          label: "এডিট / পরিবর্তন",
          classes: "bg-rose-500/15 text-rose-400 border-rose-500/30",
          icon: <FaEdit className="mr-1 inline text-xs" />,
        };
      default:
        return {
          label: "সিস্টেম",
          classes: "bg-slate-500/15 text-slate-400 border-slate-500/30",
          icon: <FaShieldAlt className="mr-1 inline text-xs" />,
        };
    }
  };

  const getDeviceIcon = (ua) => {
    if (!ua) return <FaDesktop className="text-gray-400" title="Desktop" />;
    const isMobile = /mobile|android|iphone|ipad/i.test(ua);
    return isMobile ? (
      <FaMobileAlt className="text-indigo-400 inline" title={ua} />
    ) : (
      <FaDesktop className="text-cyan-400 inline" title={ua} />
    );
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1700px] mx-auto text-slate-100 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <TbActivity className="text-xl" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                ইউজার অ্যাক্টিভিটি অডিট ও ট্র্যাকার
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 font-medium">
                  Live Audit
                </span>
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">
                সিস্টেমে অ্যাডমিন, ম্যানেজার ও সকল স্টাফের প্রতিটি লগইন, পেজ ভিজিট এবং কিস্তি আদায়ের পূর্ণাঙ্গ ডিজিটাল রেকর্ড
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1c2541] hover:bg-[#253256] border border-gray-700 text-xs font-semibold text-gray-200 hover:text-white transition cursor-pointer active:scale-95 disabled:opacity-50"
        >
          <FaSync className={`text-xs ${loading ? "animate-spin" : ""}`} />
          <span>রিফ্রেশ ডাটা</span>
        </button>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Activities Today */}
        <div className="bg-[#1c2541]/80 backdrop-blur border border-gray-800 rounded-xl p-4 shadow">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400 font-medium">আজকের মোট কাজ / অ্যাকশন</p>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-sm">
              <FaHistory />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-mono text-white">
              {stats.total_today?.toLocaleString() || 0}
            </span>
            <span className="text-xs text-gray-400 ml-1.5">টি এন্ট্রি</span>
          </div>
        </div>

        {/* Financial Volume Today */}
        <div className="bg-[#1c2541]/80 backdrop-blur border border-emerald-500/20 rounded-xl p-4 shadow">
          <div className="flex items-center justify-between">
            <p className="text-xs text-emerald-400 font-medium">আজকের লেনদেন / আদায় ভলিউম</p>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-sm">
              <TbReportMoney />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-mono text-emerald-400">
              ৳{Number(stats.financial_volume_today || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Logins Today */}
        <div className="bg-[#1c2541]/80 backdrop-blur border border-amber-500/20 rounded-xl p-4 shadow">
          <div className="flex items-center justify-between">
            <p className="text-xs text-amber-400 font-medium">আজকের লগইন সেশন</p>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-sm">
              <FaSignInAlt />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-mono text-amber-400">
              {stats.logins_today || 0}
            </span>
            <span className="text-xs text-gray-400 ml-1.5">বার লগইন</span>
          </div>
        </div>

        {/* Active Staff Today */}
        <div className="bg-[#1c2541]/80 backdrop-blur border border-cyan-500/20 rounded-xl p-4 shadow">
          <div className="flex items-center justify-between">
            <p className="text-xs text-cyan-400 font-medium">সক্রিয় ব্যবহারকারী / স্টাফ</p>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 text-sm">
              <FaUser />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-mono text-cyan-400">
              {stats.active_users_today || 0}
            </span>
            <span className="text-xs text-gray-400 ml-1.5">জন অ্যাক্টিভ</span>
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-[#1c2541]/90 backdrop-blur border border-gray-800 rounded-2xl p-4 shadow-md space-y-4">
        {/* Category Pill Tabs */}
        <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-gray-800">
          {[
            { id: "all", label: "সকল অ্যাক্টিভিটি" },
            { id: "financial", label: "টাকা / কিস্তি ও ক্যাশ", icon: <FaMoneyBillWave className="inline mr-1" /> },
            { id: "navigation", label: "পেজ ভিজিট ট্র্যাকার", icon: <FaRoute className="inline mr-1" /> },
            { id: "auth", label: "লগইন হিস্ট্রি", icon: <FaSignInAlt className="inline mr-1" /> },
            { id: "modification", label: "এডিট ও ডিলিট", icon: <FaEdit className="inline mr-1" /> },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                setPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer border ${
                selectedCategory === cat.id
                  ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm"
                  : "bg-[#0b132b] text-gray-400 border-gray-700 hover:text-white hover:bg-[#253256]"
              }`}
            >
              {cat.icon}
              {cat.label}
            </button>
          ))}
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* User Select Dropdown */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 mb-1">
              ব্যবহারকারী / স্টাফ নির্বাচন করুন
            </label>
            <select
              value={selectedUser}
              onChange={(e) => {
                setSelectedUser(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-[#0b132b] border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
            >
              <option value="">সকল ব্যবহারকারী (All Staff & Admins)</option>
              {usersList.map((u) => (
                <option key={u.user_id} value={u.user_id}>
                  {u.user_name || `User #${u.user_id}`} ({u.user_role || "User"})
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 mb-1">
              তারিখ নির্বাচন করুন
            </label>
            <div className="relative">
              <input
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 bg-[#0b132b] border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400 [color-scheme:dark] cursor-pointer"
              />
            </div>
          </div>

          {/* Search Box */}
          <div className="lg:col-span-2">
            <label className="block text-[11px] font-semibold text-gray-400 mb-1">
              বিবরণ বা কার্ড নং দিয়ে খুঁজুন
            </label>
            <div className="relative">
              <FaSearch className="absolute left-3 top-3 text-gray-500 text-xs" />
              <input
                type="text"
                placeholder="যেমন: মো: রফিক, কার্ড #104, লগইন..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-4 py-2 bg-[#0b132b] border border-gray-700 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-white"
                >
                  <FaTimes />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Results Summary Bar */}
      <div className="flex items-center justify-between text-xs text-gray-400 px-1">
        <div>
          পাওয়া গেছে: <span className="font-semibold text-white">{totalCount}</span> টি লগ
          {totalAmount > 0 && (
            <span className="ml-3">
              মোট টাকা: <span className="font-mono font-bold text-emerald-400">৳{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </span>
          )}
        </div>
        <div className="text-[11px]">
          পেজ {page} / {Math.max(1, Math.ceil(totalCount / limit))}
        </div>
      </div>

      {/* Activity Timeline Table */}
      <div className="bg-[#1c2541]/80 backdrop-blur border border-gray-800 rounded-2xl overflow-hidden shadow-lg">
        {loading ? (
          <div className="p-12 text-center text-gray-400">
            <FaSync className="animate-spin text-2xl mx-auto mb-2 text-cyan-400" />
            <p className="text-xs">অ্যাক্টিভিটি ডাটা লোড হচ্ছে...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <FaHistory className="text-3xl mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium text-gray-300">কোনো অ্যাক্টিভিটি পাওয়া যায়নি</p>
            <p className="text-xs text-gray-500 mt-1">
              তারিখ পরিবর্তন করুন অথবা অন্য কোনো ফিল্টার নির্বাচন করে চেষ্টা করুন।
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#0b132b] text-gray-300 border-b border-gray-800 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 font-semibold">সময়</th>
                  <th className="py-3 px-4 font-semibold">ব্যবহারকারী / স্টাফ</th>
                  <th className="py-3 px-4 font-semibold">ক্যাটেগরি</th>
                  <th className="py-3 px-4 font-semibold">কাজের বিবরণ</th>
                  <th className="py-3 px-4 font-semibold text-right">টাকা (BDT)</th>
                  <th className="py-3 px-4 font-semibold">ডিভাইস ও IP</th>
                  <th className="py-3 px-4 font-semibold text-center">ডিটেইলস</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 font-sans">
                {logs.map((log) => {
                  const badge = getCategoryBadge(log.category);
                  const timeStr = log.created_at ? log.created_at.split(" ")[1] : "";
                  const dateStr = log.created_at ? log.created_at.split(" ")[0] : "";

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-white/[0.02] transition-colors group"
                    >
                      {/* Time */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-mono text-cyan-300 font-medium">
                          {timeStr}
                        </span>
                        <p className="text-[10px] text-gray-500">{dateStr}</p>
                      </td>

                      {/* User */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold text-xs uppercase">
                            {log.user_name ? log.user_name[0] : "U"}
                          </div>
                          <div>
                            <p className="font-medium text-white">
                              {log.user_name || `User #${log.user_id}`}
                            </p>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-gray-800 text-gray-400 font-mono">
                              {log.user_role || "Staff"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center text-[10px] font-semibold px-2.5 py-1 rounded-full border ${badge.classes}`}
                        >
                          {badge.icon}
                          {badge.label}
                        </span>
                      </td>

                      {/* Description */}
                      <td className="py-3 px-4 text-gray-200">
                        <p className="font-medium text-xs leading-relaxed">
                          {log.description}
                        </p>
                        {log.entity_id && (
                          <span className="text-[10px] text-gray-400 font-mono">
                            {log.entity_type ? `${log.entity_type}: ` : ""}
                            {log.entity_id}
                          </span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {log.amount > 0 ? (
                          <span className="font-mono font-bold text-emerald-400 text-xs">
                            ৳{Number(log.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <span className="text-gray-500 font-mono">-</span>
                        )}
                      </td>

                      {/* Device & IP */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs text-gray-300">
                          {getDeviceIcon(log.user_agent)}
                          <span className="font-mono text-[11px] text-gray-400">
                            {log.ip_address || "127.0.0.1"}
                          </span>
                        </div>
                      </td>

                      {/* Action / Details */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => setActiveModalLog(log)}
                          className="px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700 text-[11px] transition cursor-pointer"
                        >
                          <FaEye className="inline mr-1" /> ভিউ
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalCount > limit && (
          <div className="p-4 border-t border-gray-800 flex items-center justify-between text-xs bg-[#0b132b]/50">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3.5 py-1.5 rounded-lg bg-[#1c2541] hover:bg-[#253256] text-gray-300 disabled:opacity-40 cursor-pointer border border-gray-700"
            >
              পূর্ববর্তী পেজ
            </button>
            <span className="text-gray-400">
              পেজ {page} / {Math.ceil(totalCount / limit)}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= Math.ceil(totalCount / limit)}
              className="px-3.5 py-1.5 rounded-lg bg-[#1c2541] hover:bg-[#253256] text-gray-300 disabled:opacity-40 cursor-pointer border border-gray-700"
            >
              পরবর্তী পেজ
            </button>
          </div>
        )}
      </div>

      {/* Log Details Modal */}
      {activeModalLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#1c2541] border border-gray-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FaShieldAlt className="text-cyan-400" />
                অ্যাক্টিভিটি অডিট বিস্তারিত (Log #{activeModalLog.id})
              </h3>
              <button
                onClick={() => setActiveModalLog(null)}
                className="text-gray-400 hover:text-white text-base p-1"
              >
                <FaTimes />
              </button>
            </div>

            <div className="space-y-3.5 mt-4 text-gray-300">
              <div className="grid grid-cols-2 gap-3 bg-[#0b132b] p-3 rounded-xl border border-gray-800">
                <div>
                  <span className="text-[10px] text-gray-500 uppercase block font-semibold">ব্যবহারকারী</span>
                  <span className="text-white font-medium">{activeModalLog.user_name || "N/A"}</span>
                  <span className="text-[10px] text-gray-400 block font-mono">Role: {activeModalLog.user_role || "N/A"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase block font-semibold">তারিখ ও সময়</span>
                  <span className="text-white font-mono">{activeModalLog.created_at}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-gray-500 uppercase block font-semibold">কাজের বিবরণ</span>
                <p className="text-white font-medium mt-0.5 bg-[#0b132b] p-2.5 rounded-xl border border-gray-800">
                  {activeModalLog.description}
                </p>
              </div>

              {activeModalLog.amount > 0 && (
                <div>
                  <span className="text-[10px] text-gray-500 uppercase block font-semibold">টাকার পরিমাণ</span>
                  <p className="text-emerald-400 font-mono font-bold text-sm mt-0.5">
                    ৳{Number(activeModalLog.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              )}

              {activeModalLog.details && (
                <div>
                  <span className="text-[10px] text-gray-500 uppercase block font-semibold mb-1">
                    অতিরিক্ত ডাটা পে-লোড (Payload Details)
                  </span>
                  <pre className="p-3 bg-[#0b132b] border border-gray-800 rounded-xl overflow-x-auto text-[11px] font-mono text-cyan-300 max-h-48">
                    {JSON.stringify(activeModalLog.details, null, 2)}
                  </pre>
                </div>
              )}

              <div className="bg-[#0b132b] p-3 rounded-xl border border-gray-800 text-[11px] space-y-1">
                <div>
                  <span className="text-gray-500">আইপি অ্যাড্রেস: </span>
                  <span className="font-mono text-gray-300">{activeModalLog.ip_address || "127.0.0.1"}</span>
                </div>
                <div className="break-all">
                  <span className="text-gray-500">ডিভাইস / ইউজার এজেন্ট: </span>
                  <span className="text-gray-400 text-[10px]">{activeModalLog.user_agent || "Browser Client"}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-gray-800 text-right">
              <button
                onClick={() => setActiveModalLog(null)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserActivityAudit;
