import React, { useEffect, useMemo, useState, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { MONTHS } from "../../../../../public/month";
import useUsers from "../../../../utils/Hooks/useUsers";
import useInvestmentCards from "../../../../utils/Investors/useInvestmentCards";
import Loader from "../../../../components/Loader/Loader";
import {
  TrendingUp,
  RefreshCw,
  Calendar,
  Search,
  CheckSquare,
  Square,
  Coins,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Layers,
  Clock,
  ArrowUpRight,
} from "lucide-react";

const money = (n) => `৳ ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const getMonthLabel = (m) => {
  const mm = MONTHS.find((x) => Number(x.value) === Number(m));
  return mm?.label || `Month ${m}`;
};

const ProfitAnalytics = () => {
  const { users } = useUsers();
  const { investmentCards } = useInvestmentCards();

  const [data, setData] = useState([]);
  const [latestYear, setLatestYear] = useState(null);
  const [latestMonth, setLatestMonth] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isReinvesting, setIsReinvesting] = useState(false);

  // Fetch only the latest profit month directly from server
  const fetchLatestProfit = useCallback(async () => {
    try {
      setIsLoading(true);
      setIsError(null);

      const url = `${import.meta.env.VITE_LOCALHOST_KEY}/profit_generator/get_profrit_generator.php`;
      const res = await axios.get(url, {
        params: {
          latest: 1,
          limit: 1000,
        },
      });

      const payload = res.data || {};
      if (!payload.success) {
        throw new Error(payload.message || "প্রফিট ডাটা লোড করতে ব্যর্থ হয়েছে");
      }

      setData(Array.isArray(payload.data) ? payload.data : []);
      setLatestYear(payload.profit_year || (payload.data?.[0]?.profit_year ?? null));
      setLatestMonth(payload.profit_month || (payload.data?.[0]?.profit_month ?? null));
      setSelectedIds(new Set());
    } catch (err) {
      console.error(err);
      setIsError(err.message || "নেটওয়ার্ক সমস্যা, অনুগ্রহ করে আবার চেষ্টা করুন");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLatestProfit();
  }, [fetchLatestProfit]);

  // User Map for investor name & phone lookup
  const userById = useMemo(() => {
    const m = new Map();
    (users || []).forEach((u) => m.set(Number(u.id), u));
    return m;
  }, [users]);

  const investorLabel = (investorId, fallbackName) => {
    const u = userById.get(Number(investorId));
    if (!u) return fallbackName || `ID: ${investorId}`;
    const name = u.name || u.full_name || fallbackName || `User ${u.id}`;
    const phone = u.phone || u.mobile || "";
    return phone ? `${name} (${phone})` : name;
  };

  const cardById = useMemo(() => {
    const m = new Map();
    (investmentCards || []).forEach((c) => m.set(Number(c.id), c));
    return m;
  }, [investmentCards]);

  const isForfeitEligible = (card) => {
    if (!card) return false;
    if (String(card.status) !== "closed") return false;
    if (!card.end_date || card.end_date === "0000-00-00") return false;
    if (!card.maturity_date || card.maturity_date === "0000-00-00") return false;
    return String(card.end_date) < String(card.maturity_date);
  };

  // Instant Search filter
  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const t = searchTerm.toLowerCase();

    return data.filter((r) => {
      const inv = investorLabel(r.investor_id, r.investor_name).toLowerCase();
      const card = String(r.card_id || "");
      const cardName = String(r.card_name || "").toLowerCase();
      const status = String(r.status || "").toLowerCase();
      const amount = String(r.amount || "");
      const profit = String(r.profit_amount || "");

      return (
        inv.includes(t) ||
        card.includes(t) ||
        cardName.includes(t) ||
        status.includes(t) ||
        amount.includes(t) ||
        profit.includes(t)
      );
    });
  }, [data, searchTerm, userById]);

  // Quick stats for the latest month
  const stats = useMemo(() => {
    let totalInvest = 0;
    let totalProfit = 0;
    let pendingCount = 0;

    for (const r of data) {
      totalInvest += Number(r.amount || 0);
      totalProfit += Number(r.profit_amount || 0);
      if (String(r.status || "pending") === "pending") pendingCount++;
    }

    return { totalInvest, totalProfit, pendingCount, totalRows: data.length };
  }, [data]);

  // Pagination
  const paginatedRows = useMemo(() => {
    if (pageSize === "All") return filteredRows;
    const start = (currentPage - 1) * Number(pageSize);
    return filteredRows.slice(start, start + Number(pageSize));
  }, [filteredRows, currentPage, pageSize]);

  const totalPages = useMemo(() => {
    if (pageSize === "All" || filteredRows.length === 0) return 1;
    return Math.ceil(filteredRows.length / Number(pageSize));
  }, [filteredRows, pageSize]);

  const toggleSelect = (rowId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) next.delete(rowId);
      else next.add(rowId);
      return next;
    });
  };

  const toggleSelectAllCurrent = () => {
    const currentIds = paginatedRows.map((r) => r.id);
    const allSelected = currentIds.every((id) => selectedIds.has(id));

    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        currentIds.forEach((id) => next.delete(id));
      } else {
        currentIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const handleReinvest = async () => {
    if (selectedIds.size === 0) {
      return toast.info("কোন রো নির্বাচন করা হয়নি");
    }
    const selectedRows = filteredRows.filter((r) => selectedIds.has(r.id));

    try {
      setIsReinvesting(true);
      toast.info("বাল্ক রি-ইনভেস্ট শুরু হয়েছে...");
      const res = await fetch(
        `${import.meta.env.VITE_LOCALHOST_KEY}/profit_generator/reinvest/Admin_auto_reinvest.php`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            rows: selectedRows.map((r) => ({
              id: r.id,
              card_id: r.card_id,
              investor_id: r.investor_id,
              profit_month: r.profit_month,
              profit_year: r.profit_year,
            })),
          }),
        }
      );

      const resData = await res.json();
      if (!resData.success) {
        throw new Error(resData.message);
      }

      toast.success("নির্বাচিত প্রফিট সফলভাবে রি-ইনভেস্ট করা হয়েছে");
      setSelectedIds(new Set());
      fetchLatestProfit();
    } catch (err) {
      toast.error(err.message || "রি-ইনভেস্ট সম্পন্ন করা যায়নি");
    } finally {
      setIsReinvesting(false);
    }
  };

  if (isLoading && data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] space-y-3">
        <Loader />
        <p className="text-xs text-slate-400">সর্বশেষ প্রফিট ডাটা লোড হচ্ছে...</p>
      </div>
    );
  }

  if (isError && data.length === 0) {
    return (
      <div className="p-6">
        <div className="card-surface p-6 rounded-2xl border-rose-500/20 text-center space-y-3 max-w-lg mx-auto">
          <ShieldAlert className="w-10 h-10 text-rose-400 mx-auto" />
          <h2 className="text-lg font-bold text-white">তথ্য লোড করতে সমস্যা হয়েছে</h2>
          <p className="text-sm text-slate-400">{isError}</p>
          <button
            onClick={fetchLatestProfit}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
          >
            পুনরায় চেষ্টা করুন
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-5 md:p-6 space-y-5 max-w-[1600px] mx-auto text-white">
      {/* HEADER BANNER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/25 ring-1 ring-white/20 shrink-0">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                প্রফিট অ্যানালিটিক্স
              </h1>

              {/* Latest Month Highlight Badge */}
              {latestMonth && latestYear && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 shadow-sm shadow-indigo-500/20">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  <span>সর্বশেষ মাস: {getMonthLabel(latestMonth)} {latestYear}</span>
                </span>
              )}

              {isLoading && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/25">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  আপডেট হচ্ছে...
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              সার্ভারের সর্বশেষ প্রফিট মাসের তালিকা এবং পেন্ডিং প্রফিট বাল্ক রি-ইনভেস্ট
            </p>
          </div>
        </div>

        {/* Top Actions: Refresh & Reinvest */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={fetchLatestProfit}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-slate-300 hover:text-white text-xs font-semibold transition active:scale-95 disabled:opacity-50"
            title="সার্ভার থেকে পুনরায় লোড করুন"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-indigo-400" : ""}`}
            />
            <span>রিফ্রেশ</span>
          </button>

          <button
            onClick={handleReinvest}
            disabled={isReinvesting || selectedIds.size === 0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-lg shadow-emerald-500/20 transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Coins className="w-3.5 h-3.5" />
            <span>রি-ইনভেস্ট ({selectedIds.size})</span>
          </button>
        </div>
      </div>

      {/* QUICK STATS STRIP (Clean & Compact) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card-surface p-3.5 rounded-xl border border-white/[0.06]">
          <span className="text-slate-400 text-xs block">মোট রেকর্ড</span>
          <span className="text-lg font-bold text-white font-mono mt-0.5 block">
            {stats.totalRows} টি
          </span>
        </div>

        <div className="card-surface p-3.5 rounded-xl border border-white/[0.06]">
          <span className="text-slate-400 text-xs block">মোট ইনভেস্ট</span>
          <span className="text-lg font-bold text-white font-mono mt-0.5 block truncate">
            {money(stats.totalInvest)}
          </span>
        </div>

        <div className="card-surface p-3.5 rounded-xl border border-white/[0.06]">
          <span className="text-slate-400 text-xs block">মোট প্রফিট</span>
          <span className="text-lg font-bold text-emerald-400 font-mono mt-0.5 block truncate">
            {money(stats.totalProfit)}
          </span>
        </div>

        <div className="card-surface p-3.5 rounded-xl border border-white/[0.06]">
          <span className="text-slate-400 text-xs block">পেন্ডিং প্রফিট</span>
          <span className="text-lg font-bold text-amber-400 font-mono mt-0.5 block">
            {stats.pendingCount} টি
          </span>
        </div>
      </div>

      {/* TABLE CONTAINER */}
      <div className="card-surface rounded-2xl overflow-hidden">
        {/* Table Header: Title, Search, and Page Size */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 px-5 py-3.5 border-b border-white/[0.08] bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-semibold text-white">
              {latestMonth && latestYear
                ? `${getMonthLabel(latestMonth)} ${latestYear} এর প্রফিট তালিকা`
                : "প্রফিট তালিকা"}
            </span>
            <span className="text-xs font-mono text-slate-400">
              ({filteredRows.length} রেকর্ড)
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="ইনভেস্টর বা কার্ড খুঁজুন..."
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-9 pr-7 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Page Size Selector */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400 self-end sm:self-auto">
              <span>প্রতি পেজে:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(e.target.value === "All" ? "All" : Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white outline-none focus:border-indigo-500"
              >
                <option value={25}>২৫</option>
                <option value={50}>৫০</option>
                <option value={100}>১০০</option>
                <option value="All">সব (All)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-sm text-left">
            <thead className="bg-white/[0.03] text-slate-300 uppercase text-xs tracking-wider border-b border-white/[0.08]">
              <tr>
                <th className="px-4 py-3.5 font-semibold">#</th>
                <th className="px-4 py-3.5 text-center">
                  <button
                    onClick={toggleSelectAllCurrent}
                    className="text-slate-400 hover:text-white"
                    title="সব সিলেক্ট / আনসিলেক্ট করুন"
                  >
                    {paginatedRows.length > 0 &&
                    paginatedRows.every((r) => selectedIds.has(r.id)) ? (
                      <CheckSquare className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3.5 font-semibold">ইনভেস্টর</th>
                <th className="px-4 py-3.5 font-semibold">কার্ড</th>
                <th className="px-4 py-3.5 font-semibold text-right">পার্সেন্ট</th>
                <th className="px-4 py-3.5 font-semibold text-right">ইনভেস্ট</th>
                <th className="px-4 py-3.5 font-semibold text-right">প্রফিট</th>
                <th className="px-4 py-3.5 font-semibold text-right">ওয়েট</th>
                <th className="px-4 py-3.5 font-semibold">স্ট্যাটাস</th>
                <th className="px-4 py-3.5 font-semibold">তৈরি</th>
                <th className="px-4 py-3.5 font-semibold">মেয়াদ অবস্থা</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/[0.05]">
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-5 py-12 text-center text-slate-400 space-y-1">
                    <Layers className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-sm">কোন রেকর্ড পাওয়া যায়নি</p>
                  </td>
                </tr>
              ) : (
                paginatedRows.map((r, idx) => {
                  const card = cardById.get(Number(r.card_id));
                  const eligible = isForfeitEligible(card);
                  const isSelected = selectedIds.has(r.id);

                  return (
                    <tr
                      key={r.id}
                      className={`hover:bg-white/[0.02] transition-colors ${
                        isSelected ? "bg-indigo-500/[0.06]" : ""
                      }`}
                    >
                      {/* Index */}
                      <td className="px-4 py-3 font-mono text-xs text-slate-400">
                        {(currentPage - 1) * (pageSize === "All" ? 0 : Number(pageSize)) +
                          idx +
                          1}
                      </td>

                      {/* Checkbox */}
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(r.id)}
                          className="h-4 w-4 cursor-pointer rounded border-slate-600 bg-slate-900 text-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        />
                      </td>

                      {/* Investor */}
                      <td
                        className="px-4 py-3 font-medium text-slate-100 max-w-[220px] truncate"
                        title={investorLabel(r.investor_id, r.investor_name)}
                      >
                        {investorLabel(r.investor_id, r.investor_name)}
                      </td>

                      {/* Card ID */}
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-white/[0.05] border border-white/[0.08] text-slate-300">
                          #{r.card_id}
                        </span>
                      </td>

                      {/* Percent */}
                      <td className="px-4 py-3 text-right font-mono text-slate-300 text-xs">
                        {Number(r.percent || 0).toFixed(4)}%
                      </td>

                      {/* Invest */}
                      <td className="px-4 py-3 text-right font-mono text-slate-200">
                        {money(r.amount)}
                      </td>

                      {/* Profit */}
                      <td className="px-4 py-3 text-right font-mono font-bold text-emerald-400">
                        {money(r.profit_amount)}
                      </td>

                      {/* Weight */}
                      <td className="px-4 py-3 text-right font-mono text-slate-400 text-xs">
                        {Number(r.weight_value || 0).toLocaleString()}
                      </td>

                      {/* Status Badge */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            r.status === "pending"
                              ? "bg-amber-500/15 text-amber-300 border border-amber-500/25"
                              : r.status === "withdraw"
                              ? "bg-blue-500/15 text-blue-300 border border-blue-500/25"
                              : r.status === "auto_reinvest"
                              ? "bg-purple-500/15 text-purple-300 border border-purple-500/25"
                              : r.status === "user_reinvest"
                              ? "bg-teal-500/15 text-teal-300 border border-teal-500/25"
                              : "bg-white/[0.05] text-slate-300 border border-white/[0.08]"
                          }`}
                        >
                          {r.status || "-"}
                        </span>
                      </td>

                      {/* Created Date */}
                      <td className="px-4 py-3 font-mono text-xs text-slate-400 whitespace-nowrap">
                        {r.created_at ? r.created_at.slice(0, 10) : "-"}
                      </td>

                      {/* Forfeited Action Status */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {eligible ? (
                          String(r.status) === "forfeited" ? (
                            <span className="inline-flex items-center rounded-md bg-slate-700/60 px-2 py-0.5 text-[10px] font-medium text-slate-300 border border-slate-600">
                              Transferred
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-300 border border-amber-500/30">
                              মেয়াদপূর্ব বন্ধ
                            </span>
                          )
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 border-t border-white/[0.08] bg-white/[0.02]">
            <span className="text-xs text-slate-400">
              দেখাচ্ছে{" "}
              <span className="font-mono text-slate-200">
                {(currentPage - 1) * Number(pageSize) + 1}
              </span>{" "}
              থেকে{" "}
              <span className="font-mono text-slate-200">
                {Math.min(currentPage * Number(pageSize), filteredRows.length)}
              </span>{" "}
              (মোট{" "}
              <span className="font-mono text-slate-200">
                {filteredRows.length}
              </span>{" "}
              টি রেকর্ড)
            </span>

            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-slate-300 hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>পূর্ববর্তী</span>
              </button>

              <span className="px-3 py-1.5 rounded-lg bg-white/[0.06] text-xs font-mono text-slate-200">
                {currentPage} / {totalPages}
              </span>

              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-slate-300 hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>পরবর্তী</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfitAnalytics;
