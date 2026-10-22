import React, { useEffect, useMemo, useState } from "react";
import useInvestmentCards from "../../../utils/Investors/useInvestmentCards";
import useUsers from "../../../utils/Hooks/useUsers";
import { Link } from "react-router-dom";
import Loader from "../../../components/Loader/Loader";
import NoDataFound from "../../../components/NoData/NoDataFound";
import { 
  FiSearch, 
  FiFilter, 
  FiPhone, 
  FiMapPin, 
  FiCreditCard, 
  FiEye, 
  FiCheckCircle, 
  FiXCircle, 
  FiX, 
  FiArrowRight,
  FiPlus
} from "react-icons/fi";
import { FaMoneyBillWave, FaReceipt } from "react-icons/fa";

export default function InvestmentCards() {
  const [search, setSearch] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const {
    investmentCards = [],
    isInvestmentCardsLoading,
    isInvestmentCardsError,
  } = useInvestmentCards();
  const { users, isUsersLoading, isUsersError } = useUsers();

  const mergedInvestmentCards = useMemo(() => {
    if (!investmentCards || !users) return [];

    return investmentCards.map((card) => {
      const investor = users.find((user) => user.id === card.investor_id);
      return { ...card, investor };
    });
  }, [investmentCards, users]);

  // 🔍 search logic & sorting
  const filteredCards = useMemo(() => {
    let result = mergedInvestmentCards;

    if (search) {
      const term = search.toLowerCase().trim();

      result = result.filter((card) => {
        const investor = card.investor;

        return (
          investor?.name?.toLowerCase().includes(term) ||
          String(investor?.id).includes(term) ||
          String(card?.id).includes(term) ||
          card?.card_name?.toLowerCase().includes(term)
        );
      });
    }

    if (minAmount) {
      result = result.filter(
        (card) => Number(card.investment_amount || 0) >= Number(minAmount)
      );
    }

    if (maxAmount) {
      result = result.filter(
        (card) => Number(card.investment_amount || 0) <= Number(maxAmount)
      );
    }

    if (statusFilter) {
      result = result.filter(
        (card) => (card.status || "").toLowerCase() === statusFilter.toLowerCase()
      );
    }

    return [...result].sort((a, b) => {
      if (a.status === "closed" && b.status !== "closed") return 1;
      if (a.status !== "closed" && b.status === "closed") return -1;
      return Number(b.id || 0) - Number(a.id || 0);
    });
  }, [
    search,
    minAmount,
    maxAmount,
    statusFilter,
    mergedInvestmentCards,
  ]);

  useEffect(() => {
    if (!isInvestmentCardsLoading && filteredCards?.length > 0) {
      const savedPos = window.scrollPositions?.[window.location.pathname];
      if (savedPos) {
        const scrollElement = document.getElementById("app-scroll-container");
        if (scrollElement) {
          scrollElement.scrollTo({ top: savedPos, behavior: 'instant' });
          setTimeout(() => {
            scrollElement.scrollTo({ top: savedPos, behavior: 'instant' });
          }, 100);
        }
      }
    }
  }, [isInvestmentCardsLoading, filteredCards.length]);

  // 📊 Stats calculation
  const totalCount = mergedInvestmentCards.length;
  const activeCount = mergedInvestmentCards.filter((card) => card.status !== "closed").length;
  const closedCount = mergedInvestmentCards.filter((card) => card.status === "closed").length;

  if (isInvestmentCardsLoading || isUsersLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader />
        <p className="text-xs text-slate-400 font-medium">ইনভেস্টমেন্ট কার্ড লোড হচ্ছে...</p>
      </div>
    );
  }

  if (isInvestmentCardsError || isUsersError) {
    return (
      <NoDataFound
        message="ডাটা লোড করা যায়নি"
        subMessage="সার্ভার সংযোগে সমস্যা হয়েছে, অনুগ্রহ করে পেজটি রিফ্রেশ করুন"
      />
    );
  }

  return (
    <div className="mx-auto max-w-[1600px] p-4 sm:p-6 space-y-6 text-slate-200">
      {/* ===== Header & Title ===== */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/25">
              <FiCreditCard className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide">
                ইনভেস্টমেন্ট কার্ড তালিকা (Investment Cards)
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                সকল বিনিয়োগকারীর কার্ড, কিস্তি কালেকশন ও স্ট্যাটাস ট্র্যাকিং
              </p>
            </div>
          </div>
        </div>

        <Link
          to="/investor/create_investment_card"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-950/50 transition cursor-pointer self-start lg:self-auto"
        >
          <FiPlus className="h-4 w-4" />
          <span>নতুন কার্ড তৈরি করুন</span>
        </Link>
      </div>

      {/* ===== KPI Summary Cards ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Total Cards */}
        <div 
          onClick={() => setStatusFilter("")}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            statusFilter === "" 
              ? "border-cyan-500/60 bg-gradient-to-br from-[#071626] to-[#0c243c] ring-2 ring-cyan-500/30" 
              : "border-white/10 bg-gradient-to-br from-[#0c1424] to-[#101b30] hover:border-white/20"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">সর্বমোট কার্ড</span>
            <span className="h-2 w-2 rounded-full bg-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-1.5">{totalCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">সিস্টেমের মোট নিবন্ধিত কার্ড</div>
        </div>

        {/* Active Cards */}
        <div 
          onClick={() => setStatusFilter("running")}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            statusFilter === "running" 
              ? "border-emerald-500/60 bg-gradient-to-br from-[#081a15] to-[#0e2e22] ring-2 ring-emerald-500/30" 
              : "border-emerald-500/20 bg-gradient-to-br from-[#0c1424] to-[#101b30] hover:border-emerald-500/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400">সক্রিয় কার্ড (Running)</span>
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-300 mt-1.5">{activeCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">নিয়মিত কিস্তি ও রিটার্ন চলমান</div>
        </div>

        {/* Closed Cards */}
        <div 
          onClick={() => setStatusFilter("closed")}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            statusFilter === "closed" 
              ? "border-rose-500/60 bg-gradient-to-br from-[#1a080d] to-[#2e0f17] ring-2 ring-rose-500/30" 
              : "border-rose-500/20 bg-gradient-to-br from-[#0c1424] to-[#101b30] hover:border-rose-500/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-400">ক্লোজড কার্ড (Closed)</span>
            <span className="h-2 w-2 rounded-full bg-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-300 mt-1.5">{closedCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">সম্পূর্ণ মেয়াদী বা উত্তোলিত কার্ড</div>
        </div>
      </div>

      {/* ===== Filters Bar ===== */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-[#0d162a] via-[#0b1325] to-[#090f1d] border border-white/[0.08] shadow-lg flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
          <input
            type="text"
            placeholder="কার্ড আইডি, ইনভেস্টর আইডি বা নাম..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl bg-black/40 border border-white/10 pl-10 pr-9 py-2 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/40 transition"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <FiX className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Status Pills & Amount Range */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Pills */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-black/40 border border-white/10">
            <button
              onClick={() => setStatusFilter("")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                statusFilter === "" ? "bg-cyan-600 text-white shadow" : "text-slate-400 hover:text-white"
              }`}
            >
              সকল
            </button>
            <button
              onClick={() => setStatusFilter("running")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                statusFilter === "running" ? "bg-emerald-600 text-white shadow" : "text-slate-400 hover:text-white"
              }`}
            >
              সক্রিয়
            </button>
            <button
              onClick={() => setStatusFilter("closed")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                statusFilter === "closed" ? "bg-rose-600 text-white shadow" : "text-slate-400 hover:text-white"
              }`}
            >
              ক্লোজড
            </button>
          </div>

          {/* Amount inputs */}
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              placeholder="মিন. টাকা"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              className="w-24 px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400/50"
            />
            <span className="text-slate-500 text-xs">-</span>
            <input
              type="number"
              placeholder="ম্যাক্স. টাকা"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
              className="w-24 px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400/50"
            />
          </div>
        </div>
      </div>

      {/* ===== Cards Grid ===== */}
      {filteredCards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-white/[0.06] bg-white/[0.01] text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.03] border border-white/10 text-slate-500 mb-3 shadow-inner">
            <FiCreditCard className="h-7 w-7" />
          </div>
          <h3 className="text-sm font-bold text-slate-300">কোনো ইনভেস্টমেন্ট কার্ড পাওয়া যায়নি</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন অথবা একটি নতুন ইনভেস্টমেন্ট কার্ড তৈরি করুন।
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCards.map((card) => {
            const investor = card.investor;
            const isClosed = card.status === "closed";
            const avatarUrl = investor?.photo
              ? `https://api.supplylinkbd.com/${investor.photo.replace(/^\/?(uploads\/)?/, "uploads/")}`
              : `https://ui-avatars.com/api/?name=${encodeURIComponent(card?.card_name || investor?.name || "User")}&background=0284c7&color=fff&bold=true`;

            return (
              <div
                key={card.id}
                className={`group relative flex flex-col justify-between rounded-2xl border p-4.5 sm:p-5 transition-all duration-300 shadow-xl ${
                  isClosed
                    ? "bg-gradient-to-br from-[#120f14]/90 via-[#0d0c12]/90 to-[#07060a]/95 border-rose-500/20 hover:border-rose-500/40"
                    : "bg-gradient-to-br from-[#0c162b]/90 via-[#0a1222]/90 to-[#070c18]/95 border-white/[0.08] hover:border-cyan-500/40 hover:shadow-cyan-950/30"
                }`}
              >
                <div>
                  {/* Top: Avatar, Name & Status Badge */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="relative shrink-0">
                      <img
                        src={avatarUrl}
                        alt="investor"
                        onError={(e) => {
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(card?.card_name || "User")}&background=0284c7&color=fff&bold=true`;
                        }}
                        className={`w-13 h-13 rounded-2xl object-cover border-2 shadow-md ${
                          isClosed ? "border-rose-500/30 grayscale" : "border-cyan-400/40"
                        }`}
                      />
                      <span
                        className={`absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-[#091122] ${
                          isClosed ? "bg-rose-500" : "bg-emerald-400"
                        }`}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white/[0.05] text-cyan-300 border border-white/10">
                          কার্ড #{card.id}
                        </span>
                        <span
                          className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded-full border font-bold ${
                            isClosed
                              ? "bg-rose-500/15 border-rose-500/30 text-rose-300"
                              : "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                          }`}
                        >
                          {isClosed ? "CLOSED" : "RUNNING"}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white truncate mt-1 group-hover:text-cyan-300 transition-colors">
                        {card?.card_name || investor?.name || "নামহীন কার্ড"}
                      </h3>
                      <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <FiPhone className="text-cyan-400 h-3 w-3 shrink-0" />
                        <span className="font-mono">{investor?.mobile || "N/A"}</span>
                      </p>
                    </div>
                  </div>

                  {/* Metadata Chips */}
                  <div className="space-y-1.5 text-xs text-slate-300 rounded-xl bg-black/30 border border-white/[0.04] p-3 mb-3.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>ইনভেস্টর আইডি:</span>
                      <span className="font-mono font-semibold text-slate-200">ID #{investor?.id || card.investor_id}</span>
                    </div>
                    {card.investment_amount && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">বিনিয়োগ পরিমাণ:</span>
                        <span className="font-mono font-bold text-emerald-400">
                          ৳{Number(card.investment_amount).toLocaleString("en-IN")}
                        </span>
                      </div>
                    )}
                    <div className="flex items-start gap-1.5 text-[11px] text-slate-400 pt-1 border-t border-white/[0.04]">
                      <FiMapPin className="h-3 w-3 text-slate-500 shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{investor?.address || "ঠিকানা নেই"}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <Link
                    to={`/investors/investment_cards/details?card_id=${card.id}`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-cyan-500/30 py-2 px-3 text-xs font-semibold text-slate-200 hover:text-white transition cursor-pointer"
                  >
                    <FiEye className="h-3.5 w-3.5 text-slate-400" />
                    <span>দেখুন</span>
                  </Link>

                  {isClosed ? (
                    <button
                      disabled
                      className="flex-1 rounded-xl py-2 px-3 text-xs font-bold text-center bg-rose-500/10 border border-rose-500/20 text-rose-400 cursor-not-allowed"
                      title="এই কার্ডটি বন্ধ (Closed), নতুন কিস্তি নেওয়া সম্ভব নয়"
                    >
                      ক্লোজড
                    </button>
                  ) : (
                    <Link
                      to={`/investors/investment_payments?card_id=${card.id}`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 py-2 px-3 text-xs font-bold text-white shadow-md shadow-cyan-950/40 transition cursor-pointer"
                    >
                      <FaMoneyBillWave className="h-3.5 w-3.5" />
                      <span>কিস্তি</span>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
