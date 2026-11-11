import React, { useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Wallet,
  Calendar,
  User,
  X,
  AlertTriangle,
  Building2,
  ArrowRight
} from "lucide-react";
import { MONTHS } from "../../../../../public/month";
import useUsers from "../../../../utils/Hooks/useUsers";
import useProfitAnalytics from "../../../../utils/Hooks/useProfitAnalytics";
import useInvestmentCards from "../../../../utils/Investors/useInvestmentCards";
import { useAuth } from "../../../../Provider/AuthProvider";

const money = (n) => `৳ ${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const getMonthLabel = (m) => {
  const mm = MONTHS.find((x) => Number(x.value) === Number(m));
  return mm?.label || `Month ${m}`;
};

const CardCloseHistory = () => {
  const { users = [] } = useUsers();
  const {
    isProfitAnalyticsLoading,
    profitAnalytics,
    isUProfitAnalyticsError,
    refetch,
  } = useProfitAnalytics();
  const { user } = useAuth();
  const { investmentCards = [] } = useInvestmentCards();

  const rows = Array.isArray(profitAnalytics) ? profitAnalytics : [];

  // Filter States
  const [yearFilter, setYearFilter] = useState("All");
  const [monthFilter, setMonthFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All"); // 'All' | 'pending' | 'forfeited'
  const [searchQuery, setSearchQuery] = useState("");
  const [transferringCardIds, setTransferringCardIds] = useState(new Set());

  // Modal States
  const [openNoteModal, setOpenNoteModal] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [noteMeta, setNoteMeta] = useState({
    profitGeneratorId: null,
    cardId: null,
    investorName: "",
    amount: 0,
    month: null,
    year: null,
  });

  /* ================= MAP HELPERS ================= */
  const cardById = useMemo(() => {
    const m = new Map();
    investmentCards.forEach((c) => m.set(Number(c.id), c));
    return m;
  }, [investmentCards]);

  const userById = useMemo(() => {
    const m = new Map();
    users.forEach((u) => m.set(Number(u.id), u));
    return m;
  }, [users]);

  const investorLabel = (investorId) => {
    const u = userById.get(Number(investorId));
    if (!u) return `ID: ${investorId}`;
    return u.name || u.full_name || u.username || `User ${u.id}`;
  };

  /* ================= STRICT EARLY WITHDRAWAL (FORFEIT) CHECK ================= */
  // Only cards closed BEFORE maturity are forfeit-eligible
  const isForfeitEligible = (card) => {
    if (!card) return false;
    if (String(card.status) !== "closed") return false;
    if (!card.end_date || !card.maturity_date) return false;
    return new Date(card.end_date) < new Date(card.maturity_date);
  };

  /* ================= EARLY CLOSED ROWS ONLY ================= */
  const earlyClosedRows = useMemo(() => {
    return rows.filter((r) => {
      const card = cardById.get(Number(r.card_id));
      return (
        card &&
        String(card.payment_type) === "flexible" &&
        isForfeitEligible(card)
      );
    });
  }, [rows, cardById]);

  /* ================= YEAR LIST (From early closed data only) ================= */
  const years = useMemo(() => {
    return [...new Set(earlyClosedRows.map((r) => r.profit_year))]
      .filter(Boolean)
      .sort((a, b) => b - a);
  }, [earlyClosedRows]);

  /* ================= MONTH LIST ================= */
  const availableMonths = useMemo(() => {
    if (yearFilter === "All") return [];
    return [
      ...new Set(
        earlyClosedRows
          .filter((r) => String(r.profit_year) === String(yearFilter))
          .map((r) => r.profit_month),
      ),
    ]
      .filter(Boolean)
      .sort((a, b) => a - b);
  }, [earlyClosedRows, yearFilter]);

  /* ================= KPI STATS ================= */
  const stats = useMemo(() => {
    const uniqueCards = new Set(earlyClosedRows.map((r) => r.card_id)).size;
    let pendingProfit = 0;
    let pendingCount = 0;
    let transferredCount = 0;

    earlyClosedRows.forEach((r) => {
      const isForfeited = String(r.status) === "forfeited" || Number(r.profit_amount) === 0;
      if (isForfeited) {
        transferredCount++;
      } else {
        pendingCount++;
        pendingProfit += Number(r.profit_amount || 0);
      }
    });

    return {
      uniqueCards,
      pendingProfit,
      pendingCount,
      transferredCount,
    };
  }, [earlyClosedRows]);

  /* ================= FILTERED ROWS ================= */
  const filteredRows = useMemo(() => {
    let data = earlyClosedRows;

    if (yearFilter !== "All") {
      data = data.filter((r) => String(r.profit_year) === String(yearFilter));
    }

    if (monthFilter !== "All") {
      data = data.filter((r) => String(r.profit_month) === String(monthFilter));
    }

    if (statusFilter === "pending") {
      data = data.filter(
        (r) => String(r.status) !== "forfeited" && Number(r.profit_amount) > 0,
      );
    } else if (statusFilter === "forfeited") {
      data = data.filter(
        (r) => String(r.status) === "forfeited" || Number(r.profit_amount) === 0,
      );
    }

    if (searchQuery.trim() !== "") {
      const query = searchQuery.trim().toLowerCase();
      data = data.filter((r) => {
        const cardMatch = String(r.card_id).includes(query);
        const investorName = investorLabel(r.investor_id).toLowerCase();
        const investorMatch = investorName.includes(query);
        return cardMatch || investorMatch;
      });
    }

    return data;
  }, [earlyClosedRows, yearFilter, monthFilter, statusFilter, searchQuery]);

  const totalFilteredProfit = useMemo(() => {
    return filteredRows.reduce((sum, r) => sum + Number(r.profit_amount || 0), 0);
  }, [filteredRows]);

  /* ================= TRANSFER MODAL HANDLERS ================= */
  const openTransferNoteModal = (r) => {
    const card = cardById.get(Number(r.card_id));
    setNoteMeta({
      profitGeneratorId: Number(r.id),
      cardId: Number(r.card_id),
      investorName: investorLabel(r.investor_id),
      amount: Number(r.profit_amount || 0),
      month: Number(r.profit_month),
      year: Number(r.profit_year),
    });
    setNoteText("");
    setOpenNoteModal(true);
  };

  const handleTransferToCompany = async (
    profitGeneratorId,
    cardId,
    profit_month,
    profit_year,
    note = "",
  ) => {
    const id = Number(cardId);
    const card = cardById.get(id);
    if (!card) return toast.info("Card not found");

    setTransferringCardIds((prev) => new Set(prev).add(id));
    try {
      const res = await fetch(
        `${
          import.meta.env.VITE_LOCALHOST_KEY
        }/profit_generator/transfer_closed_card_profit.php`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            profit_generator_id: profitGeneratorId,
            card_id: id,
            investor_id: card.investor_id,
            end_date: card.end_date,
            profit_month,
            profit_year,
            note: String(note || "").trim(),
            signature_by: user?.role?.[0] || "client",
          }),
        },
      );
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Transfer failed");
      }

      toast.success("মুনাফা সফলভাবে Card 1 (মেয়াদপূর্ব মুনাফা হিসাব)-এ জমা করা হয়েছে।");
      refetch();
    } catch (err) {
      toast.error(err.message || "Transfer failed");
    } finally {
      setTransferringCardIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleConfirmTransfer = async () => {
    const { cardId, month, year, profitGeneratorId } = noteMeta;
    if (!cardId || !month || !year || !profitGeneratorId) {
      return toast.error("Invalid Request parameters");
    }
    await handleTransferToCompany(profitGeneratorId, cardId, month, year, noteText);
    setOpenNoteModal(false);
    setNoteMeta({
      profitGeneratorId: null,
      cardId: null,
      investorName: "",
      amount: 0,
      month: null,
      year: null,
    });
    setNoteText("");
  };

  if (isUProfitAnalyticsError) {
    return (
      <div className="p-8">
        <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-red-400">
          <AlertTriangle className="h-6 w-6 shrink-0" />
          <span>Failed to load Profit Analytics data. Please check connection.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 text-white bg-slate-950">
      {/* ================= HEADER SECTION ================= */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-7 w-7 text-rose-500" />
            <h1 className="text-2xl font-bold tracking-tight text-white">
              মেয়াদপূর্ব বন্ধ কার্ডের মুনাফা হিসাব
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            চুক্তির মেয়াদ পূর্ণ হওয়ার পূর্বে বন্ধ হওয়া কার্ডগুলোর বাজেয়াপ্ত মুনাফা কোম্পানি Card 1-এ স্থানান্তর ব্যবস্থাপনা
          </p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isProfitAnalyticsLoading}
          className="flex items-center gap-2 self-start md:self-auto rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-sm font-medium text-slate-200 transition-all hover:bg-slate-700 hover:text-white"
        >
          <RefreshCw className={`h-4 w-4 ${isProfitAnalyticsLoading ? "animate-spin text-indigo-400" : ""}`} />
          <span>{isProfitAnalyticsLoading ? "লোড হচ্ছে..." : "রিফ্রেশ"}</span>
        </button>
      </div>

      {/* ================= KPI STATS CARDS ================= */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Early Closed Cards */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              মেয়াদপূর্ব বন্ধ কার্ড সংখ্যা
            </span>
            <div className="rounded-xl bg-indigo-500/10 p-2.5 text-indigo-400">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{stats.uniqueCards}</span>
            <span className="text-xs text-slate-400">টি কার্ড</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            স্বাভাবিক মেয়াদ পূর্ণ করা কার্ডগুলো স্বয়ংক্রিয়ভাবে বাদ দেওয়া হয়েছে
          </p>
        </div>

        {/* Pending Transfer Profit */}
        <div className="relative overflow-hidden rounded-2xl border border-rose-500/20 bg-rose-950/20 p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-300">
              স্থানান্তরযোগ্য বাজেয়াপ্ত মুনাফা
            </span>
            <div className="rounded-xl bg-rose-500/20 p-2.5 text-rose-400">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-400">
              {money(stats.pendingProfit)}
            </span>
          </div>
          <p className="mt-2 text-xs text-rose-300/80">
            {stats.pendingCount} টি রেকর্ড এখনও Card 1-এ ট্রান্সফারের অপেক্ষমাণ
          </p>
        </div>

        {/* Transferred to Card 1 */}
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
              কোম্পানিতে স্থানান্তরিত রেকর্ড
            </span>
            <div className="rounded-xl bg-emerald-500/20 p-2.5 text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-400">
              {stats.transferredCount}
            </span>
            <span className="text-xs text-slate-400">টি রেকর্ড</span>
          </div>
          <p className="mt-2 text-xs text-emerald-300/80">
            ইতিমধ্যে Card 1 এর মূলধনে ক্রেডিট করা হয়েছে
          </p>
        </div>
      </div>

      {/* ================= FILTER TOOLBAR ================= */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative min-w-[220px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="কার্ড আইডি বা ইনভেস্টরের নাম..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800/90 py-2 pl-9 pr-3 text-sm text-white placeholder-slate-400 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Year Filter */}
          <div className="relative">
            <select
              value={yearFilter}
              onChange={(e) => {
                setYearFilter(e.target.value);
                setMonthFilter("All");
              }}
              className="rounded-xl border border-slate-700 bg-slate-800/90 px-3 py-2 text-sm text-white outline-none transition focus:border-indigo-500"
            >
              <option value="All">সকল বছর</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Month Filter */}
          <div className="relative">
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="rounded-xl border border-slate-700 bg-slate-800/90 px-3 py-2 text-sm text-white outline-none transition focus:border-indigo-500"
            >
              <option value="All">সকল মাস</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {getMonthLabel(m)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Tab Pills */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-800/80 p-1 border border-slate-700/60">
          <button
            onClick={() => setStatusFilter("All")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              statusFilter === "All"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            সবগুলো ({earlyClosedRows.length})
          </button>
          <button
            onClick={() => setStatusFilter("pending")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              statusFilter === "pending"
                ? "bg-rose-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            ট্রান্সফার বাকি ({stats.pendingCount})
          </button>
          <button
            onClick={() => setStatusFilter("forfeited")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              statusFilter === "forfeited"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            স্থানান্তরিত ({stats.transferredCount})
          </button>
        </div>
      </div>

      {/* ================= TABLE CONTAINER ================= */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-300">
            <thead className="border-b border-slate-800 bg-slate-800/60 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-5 py-3.5 text-center w-12">#</th>
                <th className="px-5 py-3.5">ইনভেস্টর</th>
                <th className="px-5 py-3.5">কার্ড আইডি ও ক্লোজ মেয়াদ</th>
                <th className="px-5 py-3.5 text-right">মূল বিনিয়োগ</th>
                <th className="px-5 py-3.5 text-right">বাজেয়াপ্ত মুনাফা</th>
                <th className="px-5 py-3.5 text-center">মুনাফার মাস/বছর</th>
                <th className="px-5 py-3.5 text-center">স্ট্যাটাস ও অ্যাকশন</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center">
                    <div className="mx-auto flex max-w-sm flex-col items-center justify-center text-center">
                      <div className="rounded-full bg-slate-800/80 p-3 text-slate-500 mb-3">
                        <CheckCircle2 className="h-8 w-8" />
                      </div>
                      <p className="text-base font-medium text-slate-300">কোনো রেকর্ড পাওয়া যায়নি</p>
                      <p className="mt-1 text-xs text-slate-500">
                        বর্তমান ফিল্টারে স্থানান্তরযোগ্য কোনো মেয়াদপূর্ব বাজেয়াপ্ত মুনাফা নেই।
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRows.map((r, idx) => {
                  const card = cardById.get(Number(r.card_id));
                  const isForfeited =
                    String(r.status) === "forfeited" || Number(r.profit_amount) === 0;
                  const isTransferring = transferringCardIds.has(Number(r.card_id));

                  return (
                    <tr
                      key={r.id}
                      className="transition-colors hover:bg-slate-800/40"
                    >
                      {/* Row Index */}
                      <td className="px-5 py-4 text-center text-xs text-slate-500">
                        {idx + 1}
                      </td>

                      {/* Investor */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                            <User className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-white">
                              {investorLabel(r.investor_id)}
                            </div>
                            <div className="text-xs text-slate-500">
                              Investor ID: {r.investor_id}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Card Info & Dates */}
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-sm font-bold text-indigo-300">
                              Card #{r.card_id}
                            </span>
                            <span className="rounded bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-medium text-rose-400 border border-rose-500/20">
                              Early Exit
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Closed: <span className="text-rose-400">{card?.end_date}</span>
                            <span className="mx-1 text-slate-600">|</span>
                            Maturity: <span className="text-slate-400">{card?.maturity_date}</span>
                          </div>
                        </div>
                      </td>

                      {/* Main Amount */}
                      <td className="px-5 py-4 text-right font-medium text-sky-400">
                        {money(card?.amount || card?.investment_amount || card?.main_amount)}
                      </td>

                      {/* Profit Amount */}
                      <td className="px-5 py-4 text-right">
                        <span
                          className={`font-mono text-sm font-bold ${
                            isForfeited ? "text-slate-500 line-through" : "text-emerald-400"
                          }`}
                        >
                          {money(r.profit_amount)}
                        </span>
                      </td>

                      {/* Month & Year */}
                      <td className="px-5 py-4 text-center">
                        <span className="inline-flex items-center gap-1 rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-300">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {getMonthLabel(r.profit_month)} {r.profit_year}
                        </span>
                      </td>

                      {/* Status & Action */}
                      <td className="px-5 py-4 text-center">
                        {isForfeited ? (
                          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Transferred</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => openTransferNoteModal(r)}
                            disabled={isTransferring}
                            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold text-white shadow-md transition-all ${
                              isTransferring
                                ? "cursor-not-allowed bg-slate-700 opacity-60"
                                : "bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 hover:shadow-rose-600/25 active:scale-95"
                            }`}
                          >
                            <Building2 className="h-3.5 w-3.5" />
                            <span>{isTransferring ? "প্রক্রিয়াধীন..." : "Transfer to Card 1"}</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Table Footer */}
            {filteredRows.length > 0 && (
              <tfoot className="border-t-2 border-slate-700 bg-slate-800/80 text-sm font-semibold text-white">
                <tr>
                  <td colSpan={4} className="px-5 py-4 text-right text-slate-300">
                    ফিল্টারকৃত মোট স্থানান্তরিতযোগ্য মুনাফা:
                  </td>
                  <td className="px-5 py-4 text-right font-mono text-base font-bold text-emerald-400">
                    {money(totalFilteredProfit)}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* ================= TRANSFER MODAL ================= */}
      {openNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-800/50 p-5">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-rose-500" />
                <h3 className="text-lg font-bold text-white">কোম্পানি Card 1-এ স্থানান্তর</h3>
              </div>
              <button
                onClick={() => {
                  setOpenNoteModal(false);
                  setNoteMeta({
                    profitGeneratorId: null,
                    cardId: null,
                    investorName: "",
                    amount: 0,
                    month: null,
                    year: null,
                  });
                  setNoteText("");
                }}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Info Notice */}
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3.5 text-xs text-amber-300 leading-relaxed">
                <strong>নিশ্চিতকরণ:</strong> চুক্তি অনুযায়ী ইনভেস্টর মেয়াদপূর্ণ করার পূর্বেই কার্ড বন্ধ করায় অর্জিত মুনাফা বাজেয়াপ্ত হচ্ছে। এই অর্থ সরাসরি কোম্পানির <strong>Card 1 (সাপ্লাইলিংক মেয়াদপূর্ব মুনাফা হিসাব)</strong>-এর মূলধনে যোগ হবে।
              </div>

              {/* Summary Detail Box */}
              <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-xs">
                <div>
                  <span className="text-slate-400">ইনভেস্টর:</span>
                  <div className="mt-0.5 font-semibold text-white">{noteMeta.investorName}</div>
                </div>
                <div>
                  <span className="text-slate-400">কার্ড আইডি:</span>
                  <div className="mt-0.5 font-mono font-semibold text-indigo-400">#{noteMeta.cardId}</div>
                </div>
                <div>
                  <span className="text-slate-400">মুনাফার সময়কাল:</span>
                  <div className="mt-0.5 font-semibold text-slate-300">
                    {getMonthLabel(noteMeta.month)} {noteMeta.year}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">স্থানান্তরিত অর্থ:</span>
                  <div className="mt-0.5 font-mono text-sm font-extrabold text-emerald-400">
                    {money(noteMeta.amount)}
                  </div>
                </div>
              </div>

              {/* Note Input */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                  স্থানান্তর নোট বা রেফারেন্স (ঐচ্ছিক)
                </label>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/90 p-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="যেমন: মেয়াদপূর্ব উত্তোলনের কারণে বাজেয়াপ্ত মুনাফা কোম্পানি অ্যাকাউন্টে স্থানান্তর..."
                />
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setOpenNoteModal(false);
                    setNoteMeta({
                      profitGeneratorId: null,
                      cardId: null,
                      investorName: "",
                      amount: 0,
                      month: null,
                      year: null,
                    });
                    setNoteText("");
                  }}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition"
                >
                  বাতিল
                </button>

                {(() => {
                  const id = Number(noteMeta.cardId);
                  const isTransferring = transferringCardIds.has(id);

                  return (
                    <button
                      type="button"
                      disabled={isTransferring}
                      onClick={handleConfirmTransfer}
                      className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold text-white shadow-lg transition ${
                        isTransferring
                          ? "cursor-not-allowed bg-slate-700 opacity-60"
                          : "bg-rose-600 hover:bg-rose-500 shadow-rose-600/30"
                      }`}
                    >
                      {isTransferring ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span>স্থানান্তর হচ্ছে...</span>
                        </>
                      ) : (
                        <>
                          <ArrowRight className="h-4 w-4" />
                          <span>নিশ্চিত ও স্থানান্তর করুন</span>
                        </>
                      )}
                    </button>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CardCloseHistory;
