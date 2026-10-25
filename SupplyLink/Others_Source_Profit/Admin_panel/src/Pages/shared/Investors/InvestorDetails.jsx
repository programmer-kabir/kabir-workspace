import React, { useMemo, useState } from "react";
import { useSearchParams, Navigate, Link } from "react-router-dom";
import useUsers from "../../../utils/Hooks/useUsers";
import useInvestInstallment from "../../../utils/Investors/useInvestInstallment";
import useInvestmentCards from "../../../utils/Investors/useInvestmentCards";
import NoDataFound from "../../../components/NoData/NoDataFound";
import Loader from "../../../components/Loader/Loader";
import BackButton from "../../../components/BackButton/BackButton";
import useProfitAnalytics from "../../../utils/Hooks/useProfitAnalytics";
import { 
  FiUser, 
  FiCreditCard, 
  FiPhone, 
  FiMapPin, 
  FiAward, 
  FiTrendingUp, 
  FiChevronDown, 
  FiChevronUp,
  FiCalendar,
  FiCheckCircle,
  FiArrowRight
} from "react-icons/fi";
import { FaMoneyBillWave, FaCoins, FaReceipt } from "react-icons/fa";

const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const getInstallmentCardNo = (row) => {
  return (
    row?.investment_card_no ??
    row?.card_id ??
    row?.investment_card_id ??
    row?.invest_card_id ??
    row?.card_no
  );
};

export default function InvestorDetails() {
  const [searchParams] = useSearchParams();
  const cardIdRaw = searchParams.get("card_id");
  const cardId = Number(cardIdRaw);
  const [showProfitDetails, setShowProfitDetails] = useState(false);

  const { isUsersLoading, users = [], isUsersError } = useUsers();
  const {
    inInvestInstallmentsLoading,
    investInstallments = [],
    isInvestInstallmentsError,
  } = useInvestInstallment();

  const {
    investmentCards = [],
    isInvestmentCardsError,
    isInvestmentCardsLoading,
  } = useInvestmentCards();

  const { isProfitAnalyticsLoading, isUProfitAnalyticsError, profitAnalytics = [] } = useProfitAnalytics();
  
  const currentCardProfit = useMemo(() => {
    return profitAnalytics.filter((card) => Number(card.card_id) === cardId);
  }, [profitAnalytics, cardId]);

  const totalProfit = useMemo(() => {
    return currentCardProfit.reduce(
      (sum, item) => sum + Number(item.profit_amount || 0),
      0
    );
  }, [currentCardProfit]);

  const isLoading =
    isUsersLoading ||
    inInvestInstallmentsLoading ||
    isInvestmentCardsLoading ||
    isProfitAnalyticsLoading ||
    (!isInvestmentCardsError && (!investmentCards?.length || !investorCard));

  const isError =
    isUsersError || isInvestInstallmentsError || isInvestmentCardsError || isUProfitAnalyticsError;

  // 1) investorCard (safe)
  const investorCard = useMemo(() => {
    if (!cardId || Number.isNaN(cardId)) return null;
    return investmentCards.find((c) => Number(c?.id) === Number(cardId)) || null;
  }, [investmentCards, cardId]);

  // 2) investor (safe)
  const investor = useMemo(() => {
    if (!investorCard?.investor_id) return null;
    const investors = users.filter(
      (u) => Array.isArray(u?.roles) && u.roles.includes("investor")
    );
    return (
      investors.find((inv) => String(inv?.id) === String(investorCard?.investor_id)) || null
    );
  }, [users, investorCard]);

  // 3) cardPayments (always returns array)
  const cardPayments = useMemo(() => {
    if (!cardId || Number.isNaN(cardId)) return [];
    return investInstallments.filter(
      (row) => Number(getInstallmentCardNo(row)) === Number(cardId)
    );
  }, [investInstallments, cardId]);

  // 4) deposit
  const deposit = useMemo(() => {
    return cardPayments.reduce((sum, row) => sum + toNum(row?.amount), 0);
  }, [cardPayments]);

  // 5) rank among all cards by total deposit
  const rank = useMemo(() => {
    if (!cardId || Number.isNaN(cardId)) return 0;
    const totalsMap = new Map();
    investInstallments.forEach((row) => {
      const cNo = Number(getInstallmentCardNo(row));
      if (!cNo) return;
      totalsMap.set(cNo, (totalsMap.get(cNo) || 0) + toNum(row?.amount));
    });

    const totalsArr = Array.from(totalsMap.entries()).map(([cNo, total]) => ({
      cardNo: cNo,
      total,
    }));

    if (!totalsArr.length) return 0;
    totalsArr.sort((a, b) => b.total - a.total);
    const idx = totalsArr.findIndex((x) => Number(x.cardNo) === Number(cardId));
    return idx === -1 ? 0 : idx + 1;
  }, [investInstallments, cardId]);

  const currentBalance = Number(investorCard?.investment_amount || 0) + totalProfit;

  if (!cardIdRaw || !cardId || Number.isNaN(cardId)) {
    return <Navigate to="/not-found" replace />;
  }

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader />
        <p className="text-xs text-slate-400 font-medium">ইনভেস্টর বিবরণ লোড হচ্ছে...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <NoDataFound
        message="ডাটা লোড করা যায়নি"
        subMessage="সার্ভার সংযোগে সমস্যা হয়েছে, অনুগ্রহ করে পেজটি রিফ্রেশ করুন"
      />
    );
  }

  if (!investorCard) {
    return (
      <NoDataFound
        message="Investment card not found"
        subMessage={`card_id: ${cardId}`}
      />
    );
  }

  if (!investor) {
    return (
      <NoDataFound
        message="Investor not found"
        subMessage={`investor_id: ${investorCard?.investor_id}`}
      />
    );
  }

  const normalizeStatus = (s) => String(s ?? "").toLowerCase().trim();
  const status = normalizeStatus(investorCard?.status);
  const isClosed = status === "closed" || status === "close";

  const avatarUrl = investor?.photo
    ? `https://api.supplylinkbd.com/${investor.photo.replace(/^\/?(uploads\/)?/, "uploads/")}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(investor.name || "Investor")}&background=0284c7&color=fff&bold=true`;

  return (
    <div className="mx-auto p-4  space-y-6 text-slate-200">
      <BackButton />

      {/* Main Glassmorphic Profile Window */}
      <div className="rounded-3xl border border-white/[0.08] bg-gradient-to-b from-[#0c162b]/95 via-[#091122]/95 to-[#060b17]/95 p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        {/* Subtle Ambient Glowing Background */}
        <div className="pointer-events-none absolute -top-32 -left-32 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl" />

        {/* Header Profile Section */}
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
              <span
                className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-[#091122] ${
                  isClosed ? "bg-rose-500" : "bg-emerald-400"
                }`}
              />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide">
                  {investor.name}
                </h1>
                <span
                  className={`px-3 py-0.5 text-xs rounded-full font-bold border ${
                    isClosed
                      ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                      : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                  }`}
                >
                  {isClosed ? "Closed Card" : "Active Investor"}
                </span>
              </div>

              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1 font-mono">
                <FiPhone className="h-3 w-3 text-cyan-400" />
                <span>{investor.mobile || "মোবাইল নম্বর নেই"}</span>
              </p>

              <p className="text-xs text-cyan-300/80 font-mono mt-1">
                কার্ড: <strong>{investorCard?.card_name ?? investorCard?.id}</strong> (কার্ড #{cardId})
              </p>
            </div>
          </div>

          {!isClosed && (
            <Link
              to={`/investors/investment_payments?card_id=${cardId}`}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-950/50 transition cursor-pointer"
            >
              <FaMoneyBillWave className="h-4 w-4" />
              <span>কিস্তি কালেকশন পেজে যান</span>
            </Link>
          )}
        </div>

        {/* 7 Core Info Metric Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 my-6 relative z-10">
          <InfoCard 
            label="ইনভেস্টর আইডি" 
            value={`ID #${investor.id}`} 
            icon={FiUser} 
            color="text-slate-200" 
          />
          <InfoCard 
            label="কার্ড র‍্যাংক" 
            value={rank ? `#${rank}` : "-"} 
            icon={FiAward} 
            color="text-amber-300 font-bold" 
            highlight 
          />
          <InfoCard 
            label="জমা টাকা (This Card)" 
            value={`৳${deposit.toLocaleString("en-IN")}`} 
            icon={FaMoneyBillWave} 
            color="text-emerald-300 font-mono font-bold" 
            highlight 
          />
          <InfoCard 
            label="নির্ধারিত মূল বিনিয়োগ" 
            value={`৳${toNum(investorCard?.investment_amount).toLocaleString("en-IN")}`} 
            icon={FiCreditCard} 
            color="text-cyan-300 font-mono font-bold" 
          />
          <InfoCard 
            label="জাতীয় পরিচয়পত্র (NID)" 
            value={investor.id_number ?? "-"} 
            icon={FiCreditCard} 
            color="text-slate-300 font-mono" 
          />
          <InfoCard 
            label="ঠিকানা (Address)" 
            value={investor.address ?? "-"} 
            icon={FiMapPin} 
            color="text-slate-300 line-clamp-1" 
          />
          <InfoCard 
            label="মোট কিস্তি এন্ট্রি" 
            value={`${cardPayments.length} টি পেমেন্ট`} 
            icon={FaReceipt} 
            color="text-purple-300 font-mono" 
          />
          <InfoCard 
            label="বর্তমান ব্যালেন্স" 
            value={`৳${currentBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`} 
            icon={FiTrendingUp} 
            color="text-emerald-300 font-mono font-bold" 
            highlight 
          />
        </div>

        {/* Collapsible Monthly Profit Accordion */}
        <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.06] overflow-hidden transition relative z-10">
          <div
            onClick={() => setShowProfitDetails(!showProfitDetails)}
            className="flex items-center justify-between p-4.5 cursor-pointer hover:bg-emerald-500/10 transition"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300">
                <FaCoins className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-emerald-400 font-semibold">মোট অর্জিত মুনাফা (Total Profit)</p>
                <h3 className="text-xl sm:text-2xl font-bold font-mono text-emerald-300 mt-0.5">
                  ৳{totalProfit.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
              <span>{showProfitDetails ? "লুকান" : "মাসিক বিবরণ দেখুন"}</span>
              {showProfitDetails ? <FiChevronUp className="h-4 w-4" /> : <FiChevronDown className="h-4 w-4" />}
            </div>
          </div>

          {showProfitDetails && (
            <div className="p-4.5 border-t border-emerald-500/20 bg-black/30 space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                মাসিক মুনাফা বণ্টন হিস্ট্রি (Monthly Profit Records)
              </h4>

              {currentCardProfit.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">
                  এই কার্ডে এখনও কোনো মাসিক মুনাফা বণ্টন রেকর্ড নেই
                </p>
              ) : (
                <div className="space-y-2">
                  {currentCardProfit.map((profit) => (
                    <div
                      key={profit.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5 text-xs"
                    >
                      <div>
                        <p className="font-semibold text-white">
                          {new Date(profit.profit_year, profit.profit_month - 1).toLocaleString("bn-BD", {
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                          স্ট্যাটাস: <span className="text-emerald-400 uppercase">{profit.status}</span>
                        </p>
                      </div>

                      <div className="font-mono font-bold text-emerald-400 text-sm">
                        ৳{Number(profit.profit_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Accordion Footer Totals */}
              <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between text-xs gap-3">
                <div className="text-slate-400">
                  সর্বমোট মুনাফা: <strong className="font-mono text-emerald-400 text-sm">৳{totalProfit.toFixed(2)}</strong>
                </div>
                <div className="text-slate-400">
                  মূল টাকা সহ সমাপনী ব্যালেন্স: <strong className="font-mono text-cyan-300 text-sm">৳{currentBalance.toFixed(2)}</strong>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoCard({ label, value, icon: Icon, color = "text-white", highlight }) {
  return (
    <div
      className={`rounded-2xl p-4 border transition ${
        highlight
          ? "bg-gradient-to-br from-indigo-500/10 to-cyan-500/5 border-cyan-500/30"
          : "bg-black/30 border-white/[0.06]"
      }`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] text-slate-400">{label}</span>
        {Icon && <Icon className="h-3.5 w-3.5 text-slate-500" />}
      </div>
      <div className={`text-base font-semibold break-words ${color}`}>{value}</div>
    </div>
  );
}
