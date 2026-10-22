import React, { useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import BackButton from "../../../components/BackButton/BackButton";
import useInvestmentCards from "../../../utils/Investors/useInvestmentCards";
import useUsers from "../../../utils/Hooks/useUsers";
import Loader from "../../../components/Loader/Loader";
import NoDataFound from "../../../components/NoData/NoDataFound";
import { 
  FiSearch, 
  FiCreditCard, 
  FiPhone, 
  FiMapPin, 
  FiCheckCircle, 
  FiArrowRight, 
  FiCalendar, 
  FiExternalLink, 
  FiLayers, 
  FiX, 
  FiChevronLeft, 
  FiChevronRight 
} from "react-icons/fi";
import { FaUserCircle, FaMoneyBillWave, FaReceipt } from "react-icons/fa";

const PAGE_SIZE = 8;

const money = (n) => {
  const num = Number(n || 0);
  return `৳ ${num.toLocaleString("en-IN")}`;
};

export default function InvestorDetailsWithId() {
  const [searchParams] = useSearchParams();
  const userId = Number(searchParams.get("user_id") || 0);
  const { users, isUsersLoading, isUsersError } = useUsers();

  const { investmentCards, isInvestmentCardsError, isInvestmentCardsLoading } = useInvestmentCards();

  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const investor = useMemo(() => {
    if (!users?.length) return null;
    return users.find((u) => Number(u.id) === userId) || null;
  }, [users, userId]);

  const investorCards = useMemo(() => {
    const list = (investmentCards || []).filter(
      (c) => Number(c.investor_id) === userId,
    );

    const keyword = q.trim().toLowerCase();
    if (!keyword) return list;

    return list.filter((c) => {
      const hay = [
        c.id,
        c.card_no,
        c.title,
        c.card_name,
        c.note,
        c.amount,
        c.investment_amount,
        c.deposit,
        c.profit,
        c.created_at,
        c.date,
        c.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(keyword);
    });
  }, [investmentCards, userId, q]);

  const stats = useMemo(() => {
    const totalDeposit = investorCards.reduce(
      (sum, c) => sum + Number(c?.investment_amount || 0),
      0,
    );
    const activeCount = investorCards.filter(
      (c) => String(c?.status || "").toLowerCase() === "running" || String(c?.status || "").toLowerCase() === "active",
    ).length;

    return {
      totalDeposit,
      activeCount,
      totalCards: investorCards.length,
    };
  }, [investorCards]);

  const totalPages = Math.max(1, Math.ceil(investorCards.length / PAGE_SIZE));

  const pagedCards = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return investorCards.slice(start, start + PAGE_SIZE);
  }, [investorCards, page]);

  React.useEffect(() => {
    setPage(1);
  }, [q, userId]);

  if (isUsersLoading || isInvestmentCardsLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader />
        <p className="text-xs text-slate-400 font-medium">ইনভেস্টর প্রোফাইল লোড হচ্ছে...</p>
      </div>
    );
  }

  if (isUsersError || isInvestmentCardsError) {
    return (
      <NoDataFound
        message="ডাটা লোড করা যায়নি"
        subMessage="সার্ভার সংযোগে ত্রুটি হয়েছে, অনুগ্রহ করে পেজটি রিফ্রেশ করুন"
      />
    );
  }

  if (!userId || !investor) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <BackButton />
        <div className="mt-6">
          <NoDataFound
            message="Investor পাওয়া যায়নি"
            subMessage={`User ID #${userId} এর জন্য কোনো তথ্য খুঁজে পাওয়া যায়নি`}
          />
        </div>
      </div>
    );
  }

  const avatarUrl = investor?.photo
    ? `https://api.supplylinkbd.com/${investor.photo.replace(/^\/?(uploads\/)?/, "uploads/")}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(investor?.name || "Investor")}&background=0284c7&color=fff&bold=true`;

  const userAppUrl = import.meta.env.VITE_USER_APP_URL || (window.location.hostname === "localhost" ? "http://localhost:5176" : "");
  const loginUrl = `${userAppUrl}/login?id=${investor?.id}&password=${investor?.password || ""}`;

  return (
    <div className="mx-auto  p-4  space-y-6 text-slate-200">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <BackButton />

        <a
          href={loginUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-950/50 transition cursor-pointer"
        >
          <FaUserCircle className="text-sm" />
          <span>ইনভেস্টর পোর্টালে সরাসরি লগইন (Auto Login)</span>
          <FiExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* Main Investor Profile Header Card */}
      <div className="rounded-3xl border border-white/[0.08] bg-gradient-to-b from-[#0c162b]/95 via-[#091122]/95 to-[#060b17]/95 p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        {/* Glowing Background Auras */}
        <div className="pointer-events-none absolute -top-32 -left-32 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 pb-6 border-b border-white/[0.08] relative z-10">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <img
                src={avatarUrl}
                alt={investor.name}
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(investor.name || "Investor")}&background=0284c7&color=fff&bold=true`;
                }}
                className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-cyan-400/40 shadow-xl"
              />
              <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-400 border-2 border-[#091122]" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide">
                  {investor.name}
                </h1>
                <span className="px-3 py-0.5 text-xs rounded-full font-bold border bg-emerald-500/15 text-emerald-300 border-emerald-500/30">
                  Active Investor
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-400">
                <span className="flex items-center gap-1 font-mono">
                  <FiPhone className="h-3 w-3 text-cyan-400" />
                  {investor.mobile || "N/A"}
                </span>
                {investor.id_number && (
                  <span className="flex items-center gap-1 font-mono">
                    <FiCreditCard className="h-3 w-3 text-slate-500" />
                    NID: {investor.id_number}
                  </span>
                )}
                {investor.address && (
                  <span className="flex items-center gap-1">
                    <FiMapPin className="h-3 w-3 text-slate-500" />
                    {investor.address}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-right self-stretch sm:self-auto">
            <div className="text-[10px] text-slate-400 uppercase font-mono">INVESTOR ID</div>
            <div className="text-lg font-bold font-mono text-cyan-300 mt-0.5">#{investor.id}</div>
          </div>
        </div>

        {/* 3 Executive Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-6 relative z-10">
          <div className="rounded-2xl p-4 border border-emerald-500/25 bg-gradient-to-br from-emerald-950/20 to-black/40 shadow-lg">
            <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold">
              <span>মোট বিনিয়োগ স্থিতি (Total Deposit)</span>
              <FaMoneyBillWave className="h-4 w-4" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-300 mt-2">
              {money(stats.totalDeposit)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">এই গ্রাহকের সকল কার্ডের মোট স্থিতি</div>
          </div>

          <div className="rounded-2xl p-4 border border-cyan-500/25 bg-gradient-to-br from-cyan-950/20 to-black/40 shadow-lg">
            <div className="flex items-center justify-between text-xs text-cyan-400 font-semibold">
              <span>সক্রিয় কার্ড (Active Cards)</span>
              <FiCheckCircle className="h-4 w-4" />
            </div>
            <div className="text-2xl font-bold font-mono text-cyan-200 mt-2">
              {stats.activeCount} টি
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">বর্তমানে চলমান ও কিস্তির কার্ড</div>
          </div>

          <div className="rounded-2xl p-4 border border-purple-500/25 bg-gradient-to-br from-purple-950/20 to-black/40 shadow-lg">
            <div className="flex items-center justify-between text-xs text-purple-400 font-semibold">
              <span>সর্বমোট কার্ড সংখ্যা</span>
              <FiCreditCard className="h-4 w-4" />
            </div>
            <div className="text-2xl font-bold font-mono text-purple-200 mt-2">
              {stats.totalCards} টি
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">সিস্টেমে নিবন্ধিত মোট কার্ড</div>
          </div>
        </div>
      </div>

      {/* Cards List Section with Search */}
      <div className="rounded-3xl border border-white/[0.08] bg-gradient-to-b from-[#0c162b]/95 to-[#070d19]/95 p-5 sm:p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
              এই ইনভেস্টরের কার্ডসমূহ (Investment Cards)
            </h2>
            <p className="text-xs text-slate-400">প্রতিটি কার্ডের মেয়াদ, কিস্তি ধরন ও সঞ্চিত ব্যালেন্স</p>
          </div>

          <div className="relative w-full sm:w-72">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="কার্ড আইডি, নাম বা বিবরণ দিয়ে খুঁজুন..."
              className="w-full rounded-xl bg-black/40 border border-white/10 pl-10 pr-8 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400/50"
            />
            {q && (
              <button onClick={() => setQ("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                <FiX className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Cards Grid */}
        {pagedCards.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <FiCreditCard className="h-8 w-8 text-slate-600 mx-auto mb-2" />
            <p className="font-semibold text-slate-300">কোনো ইনভেস্টমেন্ট কার্ড পাওয়া যায়নি</p>
            <p className="text-xs text-slate-500 mt-0.5">সার্চ ফিল্টার ক্লিয়ার করে দেখুন</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pagedCards.map((c) => {
              const isClosed = (c.status || "").toLowerCase() === "closed";

              return (
                <div
                  key={c.id}
                  className="rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] p-4.5 transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    {/* Top */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white/[0.05] text-cyan-300 border border-white/10">
                            কার্ড #{c.id}
                          </span>
                          <span className="text-xs font-bold text-white">
                            {c.card_name || c.title || `Investment Card #${c.id}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400 font-mono">
                          <span>শুরু: {c.start_date || "-"}</span>
                          <span>•</span>
                          <span>মেয়াদ: {c.maturity_date || c.start_date || "-"}</span>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border font-bold ${
                          isClosed
                            ? "bg-rose-500/15 border-rose-500/30 text-rose-300"
                            : "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                        }`}
                      >
                        {c.status || "RUNNING"}
                      </span>
                    </div>

                    {/* 3 Metric Pills */}
                    <div className="grid grid-cols-3 gap-2 my-3.5">
                      <div className="rounded-xl border border-white/5 bg-black/30 p-2.5 text-center">
                        <div className="text-[10px] text-slate-400">বিনিয়োগ স্থিতি</div>
                        <div className="text-xs sm:text-sm font-bold font-mono text-emerald-300 mt-0.5">
                          {money(c.investment_amount)}
                        </div>
                      </div>

                      <div className="rounded-xl border border-white/5 bg-black/30 p-2.5 text-center">
                        <div className="text-[10px] text-slate-400">ওয়েটেড ভ্যালু</div>
                        <div className="text-xs sm:text-sm font-bold font-mono text-cyan-300 mt-0.5 truncate">
                          {c.total_time_wighted_value || "0"}
                        </div>
                      </div>

                      <div className="rounded-xl border border-white/5 bg-black/30 p-2.5 text-center">
                        <div className="text-[10px] text-slate-400">পেমেন্ট ধরণ</div>
                        <div className="text-xs sm:text-sm font-bold text-white mt-0.5 capitalize truncate">
                          {c.payment_type || "Flexible"}
                        </div>
                      </div>
                    </div>

                    {c.note && (
                      <p className="text-xs text-slate-400 italic line-clamp-1 mb-2">
                        "{c.note}"
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-white/[0.04]">
                    <Link
                      to={`/investors/investment_cards/details?card_id=${c.id}`}
                      className="flex-1 text-center py-2 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-semibold text-slate-200 transition"
                    >
                      ডিটেইলস
                    </Link>
                    {!isClosed && (
                      <Link
                        to={`/investors/investment_payments?card_id=${c.id}`}
                        className="flex-1 text-center py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-xs font-bold text-white shadow-md shadow-cyan-950/40 transition"
                      >
                        কিস্তি কালেকশন
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {investorCards.length > PAGE_SIZE && (
          <div className="flex items-center justify-between pt-4 border-t border-white/[0.08] text-xs">
            <span className="text-slate-400">
              পৃষ্ঠা <strong className="text-white font-mono">{page}</strong> এর <strong className="text-white font-mono">{totalPages}</strong>
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-black/30 px-3 py-1.5 text-slate-300 hover:text-white disabled:opacity-40 transition cursor-pointer"
              >
                <FiChevronLeft className="h-3.5 w-3.5" />
                <span>পূর্ববর্তী</span>
              </button>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-black/30 px-3 py-1.5 text-slate-300 hover:text-white disabled:opacity-40 transition cursor-pointer"
              >
                <span>পরবর্তী</span>
                <FiChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
