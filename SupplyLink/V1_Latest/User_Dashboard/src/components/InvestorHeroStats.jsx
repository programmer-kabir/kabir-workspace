import React, { useMemo } from "react";
import useCurrentUser from "../Utils/currentUser";
import useInvestInstallmentCards from "../Utils/Hooks/useInvestInstallmentCards";
import useProfitAnalytics from "../Utils/Hooks/useProfitAnalytics";
import usePaymentMethod from "../Utils/Hooks/usePaymentMethod";
import { formatCurrency } from "./formatCurrency";
import { 
  Wallet, 
  TrendingUp, 
  CreditCard, 
  ShieldCheck, 
  CheckCircle2, 
  Sparkles,
  ArrowUpRight,
  Clock
} from "lucide-react";
import { FaUserCircle } from "react-icons/fa";

const InvestorHeroStats = () => {
  const runningUser = useCurrentUser();
  const { investInstallmentCards = [], isInvestInstallmentsCardsLoading } = useInvestInstallmentCards();
  const { profitAnalytics = [], isProfitAnalyticsLoading } = useProfitAnalytics();
  const { paymentMethods, isPaymentMethodsLoading } = usePaymentMethod(runningUser?.id);

  // 🔹 Filter user's specific cards
  const userCards = useMemo(() => {
    return (investInstallmentCards || []).filter(
      (c) => String(c.investor_id) === String(runningUser?.id)
    );
  }, [investInstallmentCards, runningUser?.id]);

  // 🔹 Total Investment
  const totalAmount = useMemo(() => {
    return userCards.reduce((sum, c) => sum + Number(c.investment_amount || 0), 0);
  }, [userCards]);

  // 🔹 Active & Matured Cards count
  const activeCardsCount = useMemo(() => {
    return userCards.filter((c) => c.status === "running").length;
  }, [userCards]);

  const maturedCardsCount = useMemo(() => {
    return userCards.filter((c) => c.status === "completed" || c.status === "closed").length;
  }, [userCards]);

  // 🔹 Total Profit for this investor
  const userProfits = useMemo(() => {
    return (profitAnalytics || []).filter(
      (p) => Number(p.investor_id) === Number(runningUser?.id)
    );
  }, [profitAnalytics, runningUser?.id]);

  const totalProfit = useMemo(() => {
    return userProfits.reduce((sum, item) => sum + parseFloat(item.profit_amount || 0), 0);
  }, [userProfits]);

  // 🔹 VIP Tier Badge calculation
  const getInvestorBadge = (amount) => {
    if (amount >= 1000000) {
      return {
        label: "প্লাটিনাম সদস্য",
        tier: "Platinum Tier",
        icon: "🏆",
        chipBg: "bg-gradient-to-r from-purple-500/10 to-indigo-500/10",
        chipText: "text-purple-700",
        chipBorder: "border-purple-200/80",
        pillColor: "from-purple-600 to-indigo-600",
      };
    } else if (amount >= 500000) {
      return {
        label: "গোল্ড সদস্য",
        tier: "Gold Tier",
        icon: "🥇",
        chipBg: "bg-gradient-to-r from-amber-500/10 to-yellow-500/10",
        chipText: "text-amber-800",
        chipBorder: "border-amber-200/80",
        pillColor: "from-amber-500 to-yellow-500",
      };
    } else if (amount >= 200000) {
      return {
        label: "সিলভার সদস্য",
        tier: "Silver Tier",
        icon: "🥈",
        chipBg: "bg-gradient-to-r from-slate-500/10 to-zinc-500/10",
        chipText: "text-slate-800",
        chipBorder: "border-slate-300/80",
        pillColor: "from-slate-600 to-zinc-600",
      };
    } else if (amount >= 50000) {
      return {
        label: "ব্রোঞ্জ সদস্য",
        tier: "Bronze Tier",
        icon: "🥉",
        chipBg: "bg-gradient-to-r from-orange-500/10 to-amber-500/10",
        chipText: "text-orange-800",
        chipBorder: "border-orange-200/80",
        pillColor: "from-orange-500 to-amber-600",
      };
    }
    return {
      label: "সাধারণ বিনিয়োগকারী",
      tier: "Standard Investor",
      icon: "🌱",
      chipBg: "bg-gradient-to-r from-emerald-500/10 to-teal-500/10",
      chipText: "text-emerald-800",
      chipBorder: "border-emerald-200/80",
      pillColor: "from-emerald-600 to-teal-600",
    };
  };

  const badge = getInvestorBadge(totalAmount);

  // 🔹 Payout gateway info
  const payoutInfo = useMemo(() => {
    if (paymentMethods?.bank_name) {
      return {
        title: paymentMethods.bank_name,
        subtitle: paymentMethods.bank_account_number
          ? `A/C: •••• ${String(paymentMethods.bank_account_number).slice(-4)}`
          : "ব্যাংক অ্যাকাউন্ট",
        isVerified: !!paymentMethods.is_verified,
      };
    }
    if (paymentMethods?.bkash) {
      return {
        title: "বিকাশ ওয়ালেট",
        subtitle: `নম্বর: •••• ${String(paymentMethods.bkash).slice(-4)}`,
        isVerified: !!paymentMethods.is_verified,
      };
    }
    if (paymentMethods?.nagad) {
      return {
        title: "নগদ ওয়ালেট",
        subtitle: `নম্বর: •••• ${String(paymentMethods.nagad).slice(-4)}`,
        isVerified: !!paymentMethods.is_verified,
      };
    }
    return {
      title: "হ্যান্ড ক্যাশ",
      subtitle: "সরাসরি অফিস ক্যাশ",
      isVerified: true,
    };
  }, [paymentMethods]);

  return (
    <div className="space-y-4 mb-6">
      {/* 🌟 1. Investor Identity Card (Clean White Header) */}
      <div className="relative overflow-hidden bg-white border border-slate-200/80 rounded-2xl p-5 md:p-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
        {/* Subtle decorative glow */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-gradient-to-br from-indigo-50/60 to-blue-50/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* User Info */}
          <div className="flex items-center gap-4">
            <div className="relative">
              {runningUser?.photo ? (
                <img
                  src={`https://api.supplylinkbd.com/${runningUser.photo}`}
                  alt={runningUser.name}
                  className="w-14 h-14 md:w-16 md:h-16 rounded-2xl object-cover border-2 border-white shadow-sm ring-1 ring-slate-100"
                />
              ) : (
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-500 border-2 border-white shadow-sm ring-1 ring-slate-100">
                  <FaUserCircle className="w-10 h-10 text-slate-400" />
                </div>
              )}
              {/* Online indicator */}
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow-sm" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                  {runningUser?.name || "সম্মানিত বিনিয়োগকারী"}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                  <CheckCircle2 className="w-3 h-3" />
                  সক্রিয় সদস্য
                </span>
              </div>

              <div className="flex items-center gap-3 mt-1 text-xs md:text-sm text-slate-500 flex-wrap">
                <span className="font-mono bg-slate-100 px-2 py-0.5 rounded-md text-slate-700 font-medium">
                  ID: #{runningUser?.id || "---"}
                </span>
                {runningUser?.mobile && (
                  <span>মোবাইল: {runningUser.mobile}</span>
                )}
                <span className="hidden md:inline text-slate-300">•</span>
                <span className="hidden md:inline text-slate-500">সাপ্লাইলিঙ্ক ইনভেস্টরস ক্লাব</span>
              </div>
            </div>
          </div>

          {/* VIP Tier Badge */}
          <div className="flex items-center">
            <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border ${badge.chipBg} ${badge.chipBorder} shadow-sm backdrop-blur-sm transition-all hover:scale-[1.02]`}>
              <span className="text-2xl">{badge.icon}</span>
              <div>
                <p className={`text-xs font-bold uppercase tracking-wider ${badge.chipText}`}>
                  {badge.tier}
                </p>
                <p className="text-sm font-semibold text-slate-800">
                  {badge.label}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 📊 2. 4-Metric Bento Grid (Clean White Fintech Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: মোট বিনিয়োগ */}
        <div className="group relative bg-white border border-slate-200/80 rounded-2xl p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] hover:shadow-md hover:border-slate-300/80 transition-all duration-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              মোট বিনিয়োগ
            </span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100/80 flex items-center justify-center text-indigo-600 transition-transform group-hover:scale-110">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-semibold text-slate-400">৳</span>
              <span className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums">
                {formatCurrency(totalAmount)}
              </span>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1 pt-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500" />
              {userCards.length} টি বিনিয়োগ ফাইল সংরক্ষিত
            </p>
          </div>
        </div>

        {/* Metric 2: অর্জিত মোট লাভ */}
        <div className="group relative bg-white border border-slate-200/80 rounded-2xl p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] hover:shadow-md hover:border-slate-300/80 transition-all duration-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              অর্জিত মোট লাভ
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100/80 flex items-center justify-center text-emerald-600 transition-transform group-hover:scale-110">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-semibold text-emerald-500">৳</span>
              <span className="text-2xl md:text-3xl font-extrabold text-emerald-600 tracking-tight tabular-nums">
                {formatCurrency(totalProfit)}
              </span>
            </div>
            <p className="text-xs text-emerald-700/80 flex items-center gap-1 pt-1 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              অটো-রিইনভেস্টে চক্রবৃদ্ধি বৃদ্ধি
            </p>
          </div>
        </div>

        {/* Metric 3: সক্রিয় পোর্টফোলিও */}
        <div className="group relative bg-white border border-slate-200/80 rounded-2xl p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] hover:shadow-md hover:border-slate-300/80 transition-all duration-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              সক্রিয় পোর্টফোলিও
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100/80 flex items-center justify-center text-blue-600 transition-transform group-hover:scale-110">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums">
                {activeCardsCount}
              </span>
              <span className="text-sm font-semibold text-slate-500">টি রানিং কার্ড</span>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1 pt-1">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              {maturedCardsCount > 0 ? `${maturedCardsCount} টি মেয়াদ পূর্ণ` : "১ বছর মেয়াদী মুনাফা প্রযোজ্য"}
            </p>
          </div>
        </div>

        {/* Metric 4: পে-আউট গেটওয়ে */}
        <div className="group relative bg-white border border-slate-200/80 rounded-2xl p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] hover:shadow-md hover:border-slate-300/80 transition-all duration-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              পে-আউট চ্যানেল
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100/80 flex items-center justify-center text-amber-600 transition-transform group-hover:scale-110">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="truncate">
              <p className="text-lg md:text-xl font-extrabold text-slate-900 truncate tracking-tight">
                {payoutInfo.title}
              </p>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 pt-1">
              <span className={`inline-flex items-center gap-1 font-semibold ${payoutInfo.isVerified ? "text-emerald-600" : "text-amber-600"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${payoutInfo.isVerified ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`} />
                {payoutInfo.isVerified ? "ভেরিফাইড পে-আউট" : "অপেক্ষমান"}
              </span>
              <span className="text-slate-300">•</span>
              <span className="truncate">{payoutInfo.subtitle}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestorHeroStats;

