import React, { useMemo, useState } from "react";
import useInvestorWithdrawApplications from "../../../../utils/Investors/useInvestorWithdrawApplications";
import { MONTHS } from "../../../../../public/month";
import {
  IoCloseCircleOutline,
  IoCashOutline,
  IoPrintOutline,
  IoSearchOutline,
  IoRefreshOutline,
  IoDocumentTextOutline,
  IoTimeOutline,
  IoCheckmarkCircleOutline,
  IoWalletOutline,
  IoCopyOutline,
  IoCheckmarkOutline,
  IoCloseOutline,
  IoCallOutline,
} from "react-icons/io5";
import { useAuth } from "../../../../Provider/AuthProvider";
import {
  createWithdrawActions,
  handlePrint,
} from "../../../../components/InvestmentWithdraw/InvestWithdrawActions";
import LuxuryToast from "../../../../components/Modal/LuxuryToast";

/* ---------- helpers ---------- */
const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const formatBDT = (n) =>
  toNum(n).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const ymd = (d) => {
  if (!d) return "";
  if (String(d).length >= 10) return String(d).slice(0, 10);
  return "";
};

const getYM = (dateStr) => {
  const s = ymd(dateStr);
  if (!s) return { y: "", m: "" };
  return { y: s.slice(0, 4), m: String(Number(s.slice(5, 7))) };
};

const InvestmentWithdraw = () => {
  const {
    investorWithdrawApplications = [],
    isLoading,
    isError,
    refetch,
  } = useInvestorWithdrawApplications();
  const { user } = useAuth();

  // ====== BD today ======
  const todayBD = useMemo(() => {
    const d = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" }),
    );
    return d.toISOString().slice(0, 10);
  }, []);

  // ====== year list ======
  const START_YEAR = 2025;
  const CURRENT_YEAR = new Date().getFullYear();
  const years = useMemo(() => {
    const arr = [];
    for (let y = START_YEAR; y <= CURRENT_YEAR; y++) arr.push(y);
    return arr;
  }, [CURRENT_YEAR]);

  // ====== filters ======
  const [decisionFilter, setDecisionFilter] = useState("all");
  const [filterType, setFilterType] = useState("all"); // all | daily | monthly | yearly
  const [selectedDate, setSelectedDate] = useState(todayBD);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState(String(CURRENT_YEAR));
  const [search, setSearch] = useState("");

  // ====== modal states ======
  const [reasonModalOpen, setReasonModalOpen] = useState(false);
  const [reasonModalText, setReasonModalText] = useState("");
  const [reasonModalTitle, setReasonModalTitle] = useState("");
  const [copied, setCopied] = useState(false);

  // ====== luxury toast state ======
  const [toast, setToast] = useState(null);
  const showToast = (type, title, message) => {
    setToast({ type, title, message });
  };

  // ====== withdraw action handlers ======
  const { handleReject, handlePaid } = useMemo(
    () =>
      createWithdrawActions({
        user,
        refetch,
        baseUrl: import.meta.env.VITE_LOCALHOST_KEY,
        showToast,
      }),
    [user?.id, refetch],
  );

  // ====== Filter by Date and Search (base list for stats) ======
  const dateAndSearchFiltered = useMemo(() => {
    const list = Array.isArray(investorWithdrawApplications)
      ? investorWithdrawApplications
      : [];

    return list.filter((r) => {
      // date filters -> requested_at
      const reqDate = ymd(r?.requested_at || r?.created_at);
      if (filterType === "daily") {
        if (reqDate !== selectedDate) return false;
      }
      if (filterType === "monthly") {
        if (!selectedMonth) return true;
        const { m } = getYM(reqDate);
        if (String(m) !== String(selectedMonth)) return false;
      }
      if (filterType === "yearly") {
        if (!selectedYear) return true;
        const { y } = getYM(reqDate);
        if (String(y) !== String(selectedYear)) return false;
      }

      // search query
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const hay = [
          r?.id,
          r?.investor_name,
          r?.card_name,
          r?.mobile,
          r?.status,
          r?.reason,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }

      return true;
    });
  }, [
    investorWithdrawApplications,
    filterType,
    selectedDate,
    selectedMonth,
    selectedYear,
    search,
  ]);

  // ====== Stats calculation (Paid, Unpaid/Pending, Rejected, Total Amounts & Counts) ======
  const stats = useMemo(() => {
    let pendingCount = 0;
    let pendingAmount = 0;
    let paidCount = 0;
    let paidAmount = 0;
    let rejectedCount = 0;
    let rejectedAmount = 0;
    let totalAmount = 0;
    let totalPayable = 0;
    let totalProfit = 0;

    dateAndSearchFiltered.forEach((r) => {
      const s = String(r?.status || "").toLowerCase();
      const amt = toNum(r?.amount);
      const payable = toNum(r?.payable_amount);
      const profit = toNum(r?.total_profit);

      totalAmount += amt;
      totalPayable += payable;
      totalProfit += profit;

      if (s === "pending") {
        pendingCount++;
        pendingAmount += amt;
      } else if (s === "paid") {
        paidCount++;
        paidAmount += amt;
      } else if (s === "rejected") {
        rejectedCount++;
        rejectedAmount += amt;
      }
    });

    return {
      totalCount: dateAndSearchFiltered.length,
      totalAmount,
      totalPayable,
      totalProfit,
      pendingCount,
      pendingAmount,
      paidCount,
      paidAmount,
      rejectedCount,
      rejectedAmount,
    };
  }, [dateAndSearchFiltered]);

  // ====== Filtered list by Decision ======
  const filtered = useMemo(() => {
    return dateAndSearchFiltered
      .filter((r) => {
        if (decisionFilter !== "all") {
          if (String(r?.status || "").toLowerCase() !== decisionFilter)
            return false;
        }
        return true;
      })
      .sort((a, b) => Number(b?.id || 0) - Number(a?.id || 0));
  }, [dateAndSearchFiltered, decisionFilter]);

  // ====== Filtered Table Totals ======
  const filteredTotals = useMemo(() => {
    let amount = 0;
    let payable = 0;
    let profit = 0;
    filtered.forEach((r) => {
      amount += toNum(r?.amount);
      payable += toNum(r?.payable_amount);
      profit += toNum(r?.total_profit);
    });
    return { amount, payable, profit };
  }, [filtered]);

  const openReasonModal = (row) => {
    setReasonModalTitle(`Note (Request #${row?.id || ""})`);
    setReasonModalText(row?.reason || "-");
    setReasonModalOpen(true);
    setCopied(false);
  };

  const closeReasonModal = () => {
    setReasonModalOpen(false);
    setReasonModalText("");
    setReasonModalTitle("");
    setCopied(false);
  };

  const handleCopyNote = () => {
    navigator.clipboard?.writeText(reasonModalText || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Badge component
  const renderBadge = (v) => {
    const s = String(v || "").toLowerCase();
    if (s === "approved") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          Approved
        </span>
      );
    }
    if (s === "rejected") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
          Rejected
        </span>
      );
    }
    if (s === "paid") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium bg-sky-500/10 text-sky-400 border border-sky-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
          Paid
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
        Pending
      </span>
    );
  };

  const totalCols = 14;

  return (
    <div className="w-full p-4 sm:p-6 space-y-5 text-slate-100">
      {/* ===== HEADER SECTION ===== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10 shrink-0">
            <IoDocumentTextOutline className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-bold tracking-tight text-white">
                Investment Withdraw Requests
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                {filtered.length} Requests
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Review, approve, and track investor withdrawal applications
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <IoSearchOutline className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search: investor / card / phone / ID..."
            className="w-full h-10 pl-10 pr-9 rounded-xl bg-slate-900/80 border border-white/10 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all shadow-inner"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 transition"
              title="Clear search"
            >
              <IoCloseOutline className="text-base" />
            </button>
          )}
        </div>
      </div>

      {/* ===== QUICK STATS CARDS (Paid, Unpaid/Pending, Total, Rejected) ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Requested */}
        <button
          type="button"
          onClick={() => setDecisionFilter("all")}
          className={`p-4 rounded-2xl border text-left transition-all backdrop-blur-md cursor-pointer ${
            decisionFilter === "all"
              ? "bg-slate-800/90 border-cyan-500/40 ring-1 ring-cyan-500/20 shadow-lg shadow-cyan-500/5"
              : "bg-slate-900/60 border-white/[0.08] hover:border-white/20"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Requested
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <IoWalletOutline className="text-base" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-white tracking-tight">
            ৳ {formatBDT(stats.totalAmount)}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-white/5 border border-white/10 font-semibold text-slate-200">
              {stats.totalCount} Requests
            </span>
            <span>overall volume</span>
          </div>
        </button>

        {/* Pending (Unpaid) */}
        <button
          type="button"
          onClick={() =>
            setDecisionFilter(decisionFilter === "pending" ? "all" : "pending")
          }
          className={`p-4 rounded-2xl border text-left transition-all backdrop-blur-md cursor-pointer ${
            decisionFilter === "pending"
              ? "bg-amber-500/15 border-amber-500/50 ring-1 ring-amber-500/30 shadow-lg shadow-amber-500/10"
              : "bg-slate-900/60 border-white/[0.08] hover:border-amber-500/30"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              Pending (Unpaid)
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <IoTimeOutline className="text-base" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-amber-300 tracking-tight">
            ৳ {formatBDT(stats.pendingAmount)}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-200/80">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 font-semibold text-amber-300">
              {stats.pendingCount} Unpaid
            </span>
            <span>waiting approval</span>
          </div>
        </button>

        {/* Paid */}
        <button
          type="button"
          onClick={() =>
            setDecisionFilter(decisionFilter === "paid" ? "all" : "paid")
          }
          className={`p-4 rounded-2xl border text-left transition-all backdrop-blur-md cursor-pointer ${
            decisionFilter === "paid"
              ? "bg-sky-500/15 border-sky-500/50 ring-1 ring-sky-500/30 shadow-lg shadow-sky-500/10"
              : "bg-slate-900/60 border-white/[0.08] hover:border-sky-500/30"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-400"></span>
              Total Paid
            </span>
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <IoCheckmarkCircleOutline className="text-base" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-sky-300 tracking-tight">
            ৳ {formatBDT(stats.paidAmount)}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-sky-200/80">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-sky-500/20 border border-sky-500/30 font-semibold text-sky-300">
              {stats.paidCount} Paid
            </span>
            <span>disbursed</span>
          </div>
        </button>

        {/* Rejected */}
        <button
          type="button"
          onClick={() =>
            setDecisionFilter(
              decisionFilter === "rejected" ? "all" : "rejected",
            )
          }
          className={`p-4 rounded-2xl border text-left transition-all backdrop-blur-md cursor-pointer ${
            decisionFilter === "rejected"
              ? "bg-rose-500/15 border-rose-500/50 ring-1 ring-rose-500/30 shadow-lg shadow-rose-500/10"
              : "bg-slate-900/60 border-white/[0.08] hover:border-rose-500/30"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-400"></span>
              Total Rejected
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <IoCloseCircleOutline className="text-base" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-rose-400 tracking-tight">
            ৳ {formatBDT(stats.rejectedAmount)}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-rose-200/80">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/30 font-semibold text-rose-300">
              {stats.rejectedCount} Rejected
            </span>
            <span>declined</span>
          </div>
        </button>
      </div>

      {/* ===== FILTER BAR ===== */}
      <div className="rounded-2xl border border-white/[0.08] bg-slate-900/60 backdrop-blur-md p-4 shadow-xl">
        <div className="flex flex-wrap items-end gap-3 sm:gap-4">
          {/* Decision (Status) */}
          <div className="flex flex-col gap-1.5 flex-1 min-w-[140px]">
            <label className="text-xs font-medium text-slate-300">
              Decision Status
            </label>
            <select
              value={decisionFilter}
              onChange={(e) => setDecisionFilter(e.target.value)}
              className="h-10 rounded-xl bg-slate-800/80 px-3 text-sm text-white outline-none border border-white/10 hover:border-white/20 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition cursor-pointer"
            >
              <option value="all">All Decisions</option>
              <option value="pending">Pending Only</option>
              <option value="paid">Paid Only</option>
              <option value="rejected">Rejected Only</option>
            </select>
          </div>

          {/* View (Request Date Type) */}
          <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
            <label className="text-xs font-medium text-slate-300">
              View (Request Date)
            </label>
            <select
              value={filterType}
              onChange={(e) => {
                const v = e.target.value;
                setFilterType(v);
                if (v !== "daily") setSelectedDate(todayBD);
                if (v !== "monthly") setSelectedMonth("");
                if (v !== "yearly")
                  setSelectedYear(String(new Date().getFullYear()));
              }}
              className="h-10 rounded-xl bg-slate-800/80 px-3 text-sm text-white outline-none border border-white/10 hover:border-white/20 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition cursor-pointer"
            >
              <option value="all">All Dates</option>
              <option value="daily">Daily</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          {/* Daily Date Picker */}
          {filterType === "daily" && (
            <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
              <label className="text-xs font-medium text-slate-300">
                Select Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-10 rounded-xl bg-slate-800/80 px-3 text-sm text-white outline-none border border-white/10 hover:border-white/20 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition dark:[color-scheme:dark]"
              />
            </div>
          )}

          {/* Monthly Picker */}
          {filterType === "monthly" && (
            <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
              <label className="text-xs font-medium text-slate-300">
                Select Month
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="h-10 rounded-xl bg-slate-800/80 px-3 text-sm text-white outline-none border border-white/10 hover:border-white/20 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition cursor-pointer"
              >
                <option value="">All Months</option>
                {MONTHS.map((m, idx) => {
                  const value = m?.value ?? String(idx + 1);
                  const label = m?.label ?? m;
                  return (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {/* Yearly Picker */}
          {filterType === "yearly" && (
            <div className="flex flex-col gap-1.5 flex-1 min-w-[130px]">
              <label className="text-xs font-medium text-slate-300">
                Select Year
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="h-10 rounded-xl bg-slate-800/80 px-3 text-sm text-white outline-none border border-white/10 hover:border-white/20 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition cursor-pointer"
              >
                <option value="">All Years</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Reset Button */}
          <button
            onClick={() => {
              setFilterType("all");
              setSelectedDate(todayBD);
              setSelectedMonth("");
              setSelectedYear(String(new Date().getFullYear()));
              setDecisionFilter("all");
              setSearch("");
            }}
            className="h-10 px-4 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-slate-300 hover:text-white border border-white/10 flex items-center justify-center gap-2 text-sm font-medium transition cursor-pointer active:scale-95"
            type="button"
            title="Reset all filters"
          >
            <IoRefreshOutline className="text-base" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* ===== TABLE CONTAINER ===== */}
      <div className="rounded-2xl border border-white/[0.08] bg-slate-900/70 backdrop-blur-md shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[1250px] w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/70 border-b border-white/[0.08]">
                <th className="px-4 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  #ID
                </th>
                <th className="px-4 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Investor
                </th>
                <th className="px-4 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Card
                </th>
                <th className="px-4 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-4 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Number
                </th>
                <th className="px-4 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Withdraw Date
                </th>
                <th className="px-4 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Requested At
                </th>
                <th className="px-4 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Total Profit
                </th>
                <th className="px-4 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Payable
                </th>
                <th className="px-4 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Requested By
                </th>
                <th className="px-4 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Reviewed By
                </th>
                <th className="px-4 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Notes
                </th>
                {decisionFilter === "paid" ? (
                  <th className="px-4 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Payment Method
                  </th>
                ) : decisionFilter === "rejected" ? (
                  <th className="px-4 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Reject Note
                  </th>
                ) : (
                  <th className="px-4 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center">
                    Actions
                  </th>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-white/[0.04]">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={totalCols}
                    className="py-16 text-center text-slate-400"
                  >
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin"></div>
                      <p className="text-sm font-medium text-slate-300">
                        Loading withdraw requests...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td
                    colSpan={totalCols}
                    className="py-12 text-center text-rose-400"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <IoCloseCircleOutline className="text-3xl text-rose-500" />
                      <p className="text-sm font-medium">
                        Failed to load withdraw requests
                      </p>
                      <button
                        onClick={() => refetch?.()}
                        className="mt-1 px-3 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-xs text-rose-300 border border-rose-500/20 transition"
                      >
                        Try Again
                      </button>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={totalCols}
                    className="py-16 text-center text-slate-400"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500">
                        <IoDocumentTextOutline className="text-2xl" />
                      </div>
                      <p className="text-sm font-medium text-slate-300">
                        No withdraw requests found
                      </p>
                      <p className="text-xs text-slate-500">
                        Try adjusting your search or filters
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-cyan-500/[0.03] transition-colors"
                  >
                    {/* ID */}
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-800/90 border border-white/10 text-cyan-300">
                        #{r.id}
                      </span>
                    </td>

                    {/* Investor */}
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-white/95 leading-snug">
                          {r.investor_name || `#${r.investor_id}`}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          ID: {r.investor_id}
                        </span>
                      </div>
                    </td>

                    {/* Card */}
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-200 leading-snug">
                          {r.card_name || `Card #${r.card_id}`}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          Card ID: {r.card_id}
                        </span>
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-3.5">
                      <span className="text-sm font-bold text-white font-mono">
                        ৳ {formatBDT(r.amount) || "-"}
                      </span>
                    </td>

                    {/* Mobile */}
                    <td className="px-4 py-3.5">
                      {r.mobile ? (
                        <a
                          href={`tel:${r.mobile}`}
                          className="inline-flex items-center gap-1.5 text-xs font-mono text-sky-400 hover:text-sky-300 hover:underline"
                        >
                          <IoCallOutline className="text-xs opacity-75" />
                          <span>{r.mobile}</span>
                        </a>
                      ) : (
                        <span className="text-slate-500 text-xs">-</span>
                      )}
                    </td>

                    {/* Withdraw Date */}
                    <td className="px-4 py-3.5">
                      <span className="text-xs font-mono text-slate-300">
                        {ymd(r.withdraw_date) || "-"}
                      </span>
                    </td>

                    {/* Requested At */}
                    <td className="px-4 py-3.5">
                      <span className="text-xs font-mono text-slate-400">
                        {ymd(r.requested_at || r.created_at) || "-"}
                      </span>
                    </td>

                    {/* Total Profit */}
                    <td className="px-4 py-3.5">
                      <span className="text-xs font-mono font-medium text-emerald-400">
                        {formatBDT(r.total_profit)}
                      </span>
                    </td>

                    {/* Payable */}
                    <td className="px-4 py-3.5">
                      <span className="text-xs font-mono font-medium text-cyan-300">
                        {formatBDT(r.payable_amount)}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-3.5">{renderBadge(r.status)}</td>

                    {/* Requested By */}
                    <td className="px-4 py-3.5">
                      <span className="text-xs text-slate-300">
                        {r.requested_by_name || `#${r.requested_by}`}
                      </span>
                    </td>

                    {/* Reviewed By */}
                    <td className="px-4 py-3.5">
                      <span className="text-xs text-slate-300">
                        {r.reviewed_by_name ||
                          (r.reviewed_by ? `#${r.reviewed_by}` : "-")}
                      </span>
                    </td>

                    {/* Notes */}
                    <td className="px-4 py-3.5">
                      <button
                        type="button"
                        onClick={() => openReasonModal(r)}
                        className="group inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 text-left text-xs text-slate-300 hover:text-white transition cursor-pointer"
                        title="Click to view full note"
                      >
                        <span className="max-w-[110px] truncate">
                          {r.reason || "-"}
                        </span>
                      </button>
                    </td>

                    {/* Dynamic Action / Method Column */}
                    {decisionFilter === "paid" ? (
                      <td className="px-4 py-3.5">
                        <button
                          type="button"
                          onClick={() => {
                            setReasonModalTitle(
                              `Payment Method (Request #${r?.id || ""})`,
                            );
                            setReasonModalText(r?.payment_method || "-");
                            setReasonModalOpen(true);
                            setCopied(false);
                          }}
                          className="group inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 text-left text-xs text-sky-300 transition cursor-pointer"
                          title="Click to view payment method"
                        >
                          <span className="max-w-[150px] truncate">
                            {r?.payment_method || "-"}
                          </span>
                        </button>
                      </td>
                    ) : decisionFilter === "rejected" ? (
                      <td className="px-4 py-3.5">
                        <button
                          type="button"
                          onClick={() => {
                            setReasonModalTitle(
                              `Reject Note (Request #${r?.id || ""})`,
                            );
                            setReasonModalText(r?.reject_reason || "-");
                            setReasonModalOpen(true);
                            setCopied(false);
                          }}
                          className="group inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-left text-xs text-rose-300 transition cursor-pointer"
                          title="Click to view reject note"
                        >
                          <span className="max-w-[150px] truncate">
                            {r?.reject_reason || "-"}
                          </span>
                        </button>
                      </td>
                    ) : (
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Reject */}
                          <button
                            disabled={
                              String(r.status).toLowerCase() !== "pending"
                            }
                            onClick={() => handleReject(r)}
                            className={`rounded-lg p-2 text-base transition-all cursor-pointer ${
                              String(r.status).toLowerCase() === "pending"
                                ? "bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/25 hover:scale-105 active:scale-95 shadow-sm"
                                : "cursor-not-allowed bg-white/[0.02] text-white/20 border border-white/5 opacity-50"
                            }`}
                            title={
                              String(r.status).toLowerCase() === "pending"
                                ? "Reject Request"
                                : "Already processed"
                            }
                          >
                            <IoCloseCircleOutline />
                          </button>

                          {/* Paid */}
                          <button
                            disabled={
                              String(r.status).toLowerCase() !== "pending"
                            }
                            onClick={() => handlePaid(r)}
                            className={`rounded-lg p-2 text-base transition-all cursor-pointer ${
                              String(r.status).toLowerCase() === "pending"
                                ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/25 hover:scale-105 active:scale-95 shadow-sm"
                                : "cursor-not-allowed bg-white/[0.02] text-white/20 border border-white/5 opacity-50"
                            }`}
                            title={
                              String(r.status).toLowerCase() === "pending"
                                ? "Mark as Paid"
                                : "Already processed"
                            }
                          >
                            <IoCashOutline />
                          </button>

                          {/* Print */}
                          <button
                            onClick={() => handlePrint(r)}
                            className="rounded-lg p-2 text-base bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/25 hover:scale-105 active:scale-95 transition-all shadow-sm cursor-pointer"
                            title="Print Voucher"
                          >
                            <IoPrintOutline />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info & Table Financial Totals */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 border-t border-white/[0.08] px-4 py-3 bg-slate-800/60 text-xs">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="text-slate-300">
              Showing: <strong className="text-white font-semibold">{filtered.length}</strong> of{" "}
              <strong className="text-white font-semibold">{stats.totalCount}</strong> records
            </div>
            <span className="hidden sm:inline text-slate-600">|</span>
            <div className="text-slate-300">
              Table Amount:{" "}
              <span className="font-mono font-bold text-white">
                ৳ {formatBDT(filteredTotals.amount)}
              </span>
            </div>
            <span className="hidden sm:inline text-slate-600">|</span>
            <div className="text-slate-300">
              Table Payable:{" "}
              <span className="font-mono font-bold text-cyan-300">
                ৳ {formatBDT(filteredTotals.payable)}
              </span>
            </div>
            <span className="hidden sm:inline text-slate-600">|</span>
            <div className="text-slate-300">
              Table Profit:{" "}
              <span className="font-mono font-bold text-emerald-400">
                ৳ {formatBDT(filteredTotals.profit)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400 shrink-0">
            <span>•</span>
            <span>Sorted newest first</span>
          </div>
        </div>
      </div>

      {/* ===== NOTE / REASON MODAL ===== */}
      {reasonModalOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150"
          onClick={closeReasonModal}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-5 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="mb-4 flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-semibold text-white">
                {reasonModalTitle || "Details"}
              </h3>
              <button
                type="button"
                onClick={closeReasonModal}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition"
              >
                <IoCloseOutline className="text-lg" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="max-h-[60vh] overflow-auto whitespace-pre-wrap rounded-xl bg-slate-950/70 border border-white/5 p-4 text-sm text-slate-200 font-mono leading-relaxed">
              {reasonModalText}
            </div>

            {/* Modal Actions */}
            <div className="mt-4 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={handleCopyNote}
                className="inline-flex items-center gap-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/25 px-4 py-2 text-xs font-semibold text-sky-300 transition active:scale-95 cursor-pointer"
              >
                {copied ? (
                  <>
                    <IoCheckmarkOutline className="text-base text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <IoCopyOutline className="text-base" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={closeReasonModal}
                className="rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 text-xs font-medium text-slate-300 hover:text-white transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Luxury Toast Notification */}
      <LuxuryToast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};

export default InvestmentWithdraw;
