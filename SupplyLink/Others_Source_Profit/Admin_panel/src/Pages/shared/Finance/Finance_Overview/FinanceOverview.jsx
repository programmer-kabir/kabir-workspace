import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import useCustomerInstallmentCards from "../../../../utils/Hooks/useCustomerInstallmentCards";
import useCustomerInstallmentPayments from "../../../../utils/Hooks/Customers/useCustomerInstallmentPayments";
import useInvestInstallment from "../../../../utils/Investors/useInvestInstallment";
import useInvestmentCards from "../../../../utils/Investors/useInvestmentCards";
import Loader from "../../../../components/Loader/Loader";
import useProfitHistory from "../../../../utils/Hooks/useProfitHistory";
import { FinanceModal } from "./FinanceModal";
import useUsers from "../../../../utils/Hooks/useUsers";
import useCompanyExpenses from "../../../../utils/Hooks/Expenses/useCompanyExpenses";
import useCashReports from "../../../../utils/Hooks/cash/useCashReports";
import {
  TrendingUp,
  Receipt,
  Tag,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  Users,
  Wallet,
  Coins,
  ArrowUpRight,
  RefreshCw,
  Search,
  ExternalLink,
  Layers,
  Sparkles,
  Scale,
  Landmark,
  LogOut,
  ShieldCheck,
  Activity,
  Briefcase,
} from "lucide-react";

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

const shortBDT = (n) =>
  toNum(n).toLocaleString("en-US", {
    maximumFractionDigits: 0,
  });

/* ---------- Modern StatCard ---------- */
const StatCard = ({
  title,
  value,
  accent = "emerald",
  icon: Icon,
  subtitle,
  badge,
  onClick,
}) => {
  const accentMap = {
    emerald: {
      card: "border-emerald-500/25 bg-emerald-500/[0.03] text-emerald-400 hover:border-emerald-500/40",
      icon: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
    },
    indigo: {
      card: "border-indigo-500/25 bg-indigo-500/[0.03] text-indigo-400 hover:border-indigo-500/40",
      icon: "bg-indigo-500/10 text-indigo-400 border-indigo-500/25",
    },
    amber: {
      card: "border-amber-500/25 bg-amber-500/[0.03] text-amber-400 hover:border-amber-500/40",
      icon: "bg-amber-500/10 text-amber-400 border-amber-500/25",
    },
    rose: {
      card: "border-rose-500/25 bg-rose-500/[0.03] text-rose-400 hover:border-rose-500/40",
      icon: "bg-rose-500/10 text-rose-400 border-rose-500/25",
    },
    sky: {
      card: "border-sky-500/25 bg-sky-500/[0.03] text-sky-400 hover:border-sky-500/40",
      icon: "bg-sky-500/10 text-sky-400 border-sky-500/25",
    },
    purple: {
      card: "border-purple-500/25 bg-purple-500/[0.03] text-purple-400 hover:border-purple-500/40",
      icon: "bg-purple-500/10 text-purple-400 border-purple-500/25",
    },
    slate: {
      card: "border-white/[0.08] bg-white/[0.02] text-slate-300 hover:border-white/20",
      icon: "bg-white/[0.05] text-slate-300 border-white/10",
    },
  };

  const style = accentMap[accent] || accentMap.emerald;

  return (
    <div
      onClick={onClick}
      className={`group relative rounded-2xl border p-4 shadow-sm backdrop-blur transition-all duration-200 h-full flex flex-col justify-between ${style.card} ${
        onClick ? "cursor-pointer hover:scale-[1.01] hover:shadow-lg" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-semibold text-slate-200 truncate">{title}</p>
            {badge && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/[0.08] text-slate-300 border border-white/[0.08]">
                {badge}
              </span>
            )}
          </div>
          {subtitle ? (
            <p className="mt-1 text-[11px] text-slate-400 leading-snug line-clamp-1">
              {subtitle}
            </p>
          ) : null}
        </div>

        {Icon && (
          <div
            className={`shrink-0 rounded-xl border p-2 text-sm flex items-center justify-center ${style.icon}`}
          >
            {typeof Icon === "string" ? <span>{Icon}</span> : <Icon className="w-4 h-4" />}
          </div>
        )}
      </div>

      <div className="mt-3 pt-2 border-t border-white/[0.04] flex items-baseline justify-between">
        <p className="text-xl font-bold font-mono tracking-tight text-white">
          ৳ {formatBDT(value)}
        </p>
        {onClick && (
          <span className="text-[10px] text-indigo-400 group-hover:underline flex items-center gap-0.5">
            বিস্তারিত <ExternalLink className="w-2.5 h-2.5" />
          </span>
        )}
      </div>
    </div>
  );
};

/* ---------- Section Header ---------- */
const Section = ({ title, hint, icon: SectionIcon, children }) => (
  <section className="space-y-3">
    <div className="flex items-center gap-2 border-b border-white/[0.06] pb-2">
      {SectionIcon && <SectionIcon className="w-4 h-4 text-indigo-400" />}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
          {title}
        </h3>
        {hint ? <p className="text-[11px] text-slate-400 mt-0.5">{hint}</p> : null}
      </div>
    </div>
    {children}
  </section>
);

const FinanceOverview = () => {
  const {
    isCustomerInstallmentsCardsLoading,
    customerInstallmentCards = [],
    isCustomerInstallmentsCardsError,
  } = useCustomerInstallmentCards();

  const {
    isCustomerInstallmentsPaymentsLoading,
    customerInstallmentPayments = [],
    isCustomerInstallmentsPaymentsError,
  } = useCustomerInstallmentPayments();

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

  const {
    isInvestProfitHistoryLoading,
    investorProfitHistory = [],
    isInvestProfitHistoryError,
  } = useProfitHistory();

  const { users = [], isUsersError, isUsersLoading } = useUsers();

  const {
    companyExpenses = [],
    isCompanyExpensesError,
    isCompanyExpensesLoading,
  } = useCompanyExpenses();

  const {
    CashReports = [],
    isCashReportsLoading,
    isCashReportsError,
  } = useCashReports();

  const loading =
    isCustomerInstallmentsCardsLoading ||
    isCustomerInstallmentsPaymentsLoading ||
    inInvestInstallmentsLoading ||
    isInvestProfitHistoryLoading ||
    isUsersLoading ||
    isCompanyExpensesLoading ||
    isInvestmentCardsLoading ||
    isCashReportsLoading;

  const hasError =
    isCustomerInstallmentsCardsError ||
    isCustomerInstallmentsPaymentsError ||
    isInvestInstallmentsError ||
    isInvestProfitHistoryError ||
    isUsersError ||
    isCompanyExpensesError ||
    isInvestmentCardsError ||
    isCashReportsError;

  const cards = customerInstallmentCards || [];
  const payments = customerInstallmentPayments || [];
  const invests = investInstallments || [];
  const invCards = investmentCards || [];
  const WithdrawnHistory = investorProfitHistory || [];
  const Expenses = companyExpenses || [];

  // User Map for fast lookup
  const userById = useMemo(() => {
    const m = new Map();
    (users || []).forEach((u) => m.set(Number(u.id), u));
    return m;
  }, [users]);

  /* ---------- Metrics Calculation ---------- */
  const {
    totalCostPrice,
    totalSalePrice,
    totalProfit,
    WithdrawnProfit,
    totalDuePaid,
    totalPaidPrincipal,
    paidProfit,
    totalDueUnPaid,
    totalUnPaidPrincipal,
    totalUnPaidProfit,
    totalInvestment,
    totalClosedInvestment,
    activeInvestment,
    totalCompanyExpenses,
    currentCashBalance,
    netOperatingMargin,
  } = useMemo(() => {
    // 1. Sales Margin
    const totalCostPrice = cards.reduce(
      (sum, c) => sum + toNum(c.cost_price),
      0
    );
    const totalSalePrice = cards.reduce(
      (sum, c) => sum + toNum(c.sale_price),
      0
    );
    const totalProfit = cards.reduce((sum, c) => sum + toNum(c.profit), 0);

    // 2. Collections (paid_date based)
    const paidList = payments.filter((p) => p.paid_date || p.status === "Paid");
    const totalDuePaid = paidList.reduce(
      (sum, p) => sum + toNum(p.due_amount),
      0
    );
    const totalPaidPrincipal = paidList.reduce(
      (sum, p) => sum + toNum(p.principal_amount),
      0
    );
    const paidProfit = paidList.reduce(
      (sum, p) => sum + toNum(p.profit_amount),
      0
    );

    // 3. Dues (Unpaid status)
    const unpaidPayments = payments.filter(
      (p) => String(p.status).toLowerCase() === "unpaid"
    );
    const totalDueUnPaid = unpaidPayments.reduce(
      (sum, p) => sum + toNum(p.due_amount),
      0
    );
    const totalUnPaidPrincipal = unpaidPayments.reduce(
      (sum, p) => sum + toNum(p.principal_amount),
      0
    );
    const totalUnPaidProfit = unpaidPayments.reduce(
      (sum, p) => sum + toNum(p.profit_amount),
      0
    );

    // 4. Investments & Withdrawn
    const totalInvestment = invests.reduce(
      (sum, r) => sum + toNum(r.amount),
      0
    );
    const WithdrawnProfit = WithdrawnHistory.reduce(
      (sum, r) => sum + toNum(r.amount),
      0
    );

    // Closed investment cards
    const totalClosedInvestment = invCards
      .filter((c) => String(c.status).toLowerCase() === "closed")
      .reduce((sum, c) => sum + toNum(c.investment_amount), 0);

    const activeInvestment = totalInvestment - totalClosedInvestment;

    // 5. Operating Expenses
    const totalCompanyExpenses = Expenses.reduce(
      (sum, r) => sum + toNum(r.amount),
      0
    );

    // 6. Net Operating Margin (Realized customer profit - Operating expenses)
    const netOperatingMargin = paidProfit - totalCompanyExpenses;

    // 7. Cash in Hand from CashReports
    const cashInTotal = (Array.isArray(CashReports) ? CashReports : [])
      .filter((c) => c.type === "in" && c.approval_status === "approved")
      .reduce((sum, c) => sum + toNum(c.amount), 0);

    const cashOutTotal = (Array.isArray(CashReports) ? CashReports : [])
      .filter((c) => c.type === "out" && c.approval_status === "approved")
      .reduce((sum, c) => sum + toNum(c.amount), 0);

    const currentCashBalance = cashInTotal - cashOutTotal;

    return {
      totalCostPrice,
      totalSalePrice,
      totalProfit,
      WithdrawnProfit,
      totalDuePaid,
      totalPaidPrincipal,
      paidProfit,
      totalDueUnPaid,
      totalUnPaidPrincipal,
      totalUnPaidProfit,
      totalInvestment,
      totalClosedInvestment,
      activeInvestment,
      totalCompanyExpenses,
      currentCashBalance,
      netOperatingMargin,
    };
  }, [cards, payments, invests, invCards, WithdrawnHistory, Expenses, CashReports]);

  // Modal States
  const [openClosedModal, setOpenClosedModal] = useState(false);
  const [openProfitModal, setOpenProfitModal] = useState(false);
  const [profitSearch, setProfitSearch] = useState("");
  const [closedSearch, setClosedSearch] = useState("");

  // Withdrawn Profit Rows
  const withdrawnProfitRows = useMemo(() => {
    if (!WithdrawnHistory.length) return [];

    return WithdrawnHistory.map((r) => {
      const uid = Number(r.user_id || r.investor_id || 0);
      const user = userById.get(uid);

      return {
        id: r.id || `${uid}-${r.created_at}`,
        name: user?.name || user?.full_name || `Investor #${uid}`,
        phone: user?.phone || user?.mobile || "",
        amount: toNum(r.amount),
        date: r.created_at || r.decision_at || "",
        cardId: r?.card_id,
        status: r?.status,
        action: r?.action_name,
      };
    }).sort((a, b) => b.amount - a.amount);
  }, [WithdrawnHistory, userById]);

  // Filtered Withdrawn Profit
  const filteredWithdrawnRows = useMemo(() => {
    if (!profitSearch.trim()) return withdrawnProfitRows;
    const s = profitSearch.toLowerCase();
    return withdrawnProfitRows.filter(
      (r) =>
        r.name.toLowerCase().includes(s) ||
        String(r.cardId || "").includes(s) ||
        r.phone.includes(s)
    );
  }, [withdrawnProfitRows, profitSearch]);

  // Closed Cards List with resolved Investor Names
  const closedCards = useMemo(() => {
    return invCards
      .filter((c) => String(c.status).toLowerCase() === "closed")
      .map((c) => {
        const uid = Number(c.investor_id || c.user_id || 0);
        const user = userById.get(uid);
        return {
          ...c,
          investorName: user?.name || user?.full_name || `Investor #${uid}`,
          investorPhone: user?.phone || user?.mobile || "",
        };
      })
      .sort((a, b) => toNum(b.investment_amount) - toNum(a.investment_amount));
  }, [invCards, userById]);

  // Filtered Closed Cards
  const filteredClosedCards = useMemo(() => {
    if (!closedSearch.trim()) return closedCards;
    const s = closedSearch.toLowerCase();
    return closedCards.filter(
      (c) =>
        String(c.id).includes(s) ||
        (c.card_name || "").toLowerCase().includes(s) ||
        c.investorName.toLowerCase().includes(s) ||
        c.investorPhone.includes(s)
    );
  }, [closedCards, closedSearch]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[65vh] space-y-3">
        <Loader />
        <p className="text-xs text-slate-400">আর্থিক তথ্য লোড করা হচ্ছে...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-100">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 py-6 pb-24 space-y-6">
        {/* HEADER HERO BANNER */}
        <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-slate-900/80 via-slate-900/50 to-indigo-950/30 backdrop-blur p-5 sm:p-6 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-teal-500 shadow-lg shadow-indigo-500/25 ring-1 ring-white/20 shrink-0">
                <Activity className="w-6 h-6 text-white" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                    আর্থিক স্ন্যাপশট (Financial Snapshot)
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    লাইভ ডাটা
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  এক নজরে সামগ্রিক আর্থিক চিত্র (Sales • Collections • Dues • Expenses • Cash)
                </p>
              </div>
            </div>

            {/* Quick Navigation Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to="/finance/company-health"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-xs font-semibold text-indigo-300 transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>কোম্পানি হেলথ</span>
              </Link>

              <Link
                to="/finance/company-settlement-simulator"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-xs font-semibold text-rose-300 transition-colors"
              >
                <Scale className="w-3.5 h-3.5" />
                <span>ক্লোজিং সিমুলেটর</span>
              </Link>

              <Link
                to="/other-sources/assets"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-xs font-semibold text-purple-300 transition-colors"
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>অন্যান্য সম্পদ</span>
              </Link>

              <Link
                to="/cash/cash_reports"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-xs font-semibold text-emerald-300 transition-colors"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>ক্যাশ রিপোর্ট</span>
              </Link>
            </div>
          </div>

          {/* Micro Summary Stats Strip */}
          <div className="mt-4 pt-4 border-t border-white/[0.06] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 rounded-xl bg-black/30 border border-white/[0.04]">
              <span className="text-slate-400 block text-[11px]">মোট কাস্টমার কার্ড:</span>
              <span className="text-base font-bold font-mono text-white">
                {cards.length} টি
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-black/30 border border-white/[0.04]">
              <span className="text-slate-400 block text-[11px]">মোট কিস্তি রেকর্ড:</span>
              <span className="text-base font-bold font-mono text-white">
                {payments.length} টি
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-black/30 border border-white/[0.04]">
              <span className="text-slate-400 block text-[11px]">সক্রিয় ইনভেস্টর কার্ড:</span>
              <span className="text-base font-bold font-mono text-indigo-400">
                {invCards.filter((c) => c.status?.toLowerCase() === "running").length} টি
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-black/30 border border-white/[0.04]">
              <span className="text-slate-400 block text-[11px]">নিট পরিচালন মার্জিন:</span>
              <span
                className={`text-base font-bold font-mono ${
                  netOperatingMargin >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                ৳ {shortBDT(netOperatingMargin)}
              </span>
            </div>
          </div>
        </div>

        {/* SECTION 1: SALES & PRODUCT MARGIN */}
        <Section
          title="১. বিক্রয় ও পণ্য মুনাফা (Sales & Product Margin)"
          hint="সকল কাস্টমার কিস্তি কার্ডের মোট ক্রয়মূল্য, বিক্রয়মূল্য ও সম্ভাব্য মুনাফা"
          icon={Tag}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              title="মোট পণ্য ক্রয়মূল্য (Cost Price)"
              subtitle="সকল কাস্টমার কিস্তি কার্ডের কেনা দাম"
              value={totalCostPrice}
              accent="emerald"
              icon={Receipt}
            />
            <StatCard
              title="মোট বিক্রয়মূল্য (Sale Price)"
              subtitle="সকল কাস্টমার কিস্তি কার্ডের বিক্রয়মূল্য"
              value={totalSalePrice}
              accent="indigo"
              icon={Tag}
            />
            <StatCard
              title="সর্বমোট সম্ভাব্য মুনাফা (Total Profit)"
              subtitle="প্রত্যাশিত গ্রস লাভ = বিক্রয়মূল্য - ক্রয়মূল্য"
              value={totalProfit}
              accent="amber"
              icon={TrendingUp}
            />
          </div>
        </Section>

        {/* SECTION 2: COLLECTIONS */}
        <Section
          title="২. আদায়কৃত অর্থ (Collections)"
          hint="পরিশোধিত তারিখ (Paid date) অনুযায়ী কাস্টমারদের থেকে আদায়কৃত হিসাব"
          icon={CheckCircle2}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              title="মোট আদায়কৃত বিক্রয়মূল্য (Collected Total)"
              subtitle="গ্রাহকদের পরিশোধিত কিস্তির মোট টাকা"
              value={totalDuePaid}
              accent="sky"
              icon={CheckCircle2}
            />
            <StatCard
              title="আদায়কৃত আসল মূলধন (Collected Principal)"
              subtitle="আদায়কৃত টাকার মধ্যে পণ্যের আসল কেনা দাম"
              value={totalPaidPrincipal}
              accent="slate"
              icon={Coins}
            />
            <StatCard
              title="বাস্তব আদায়কৃত লাভ (Collected Profit)"
              subtitle="আদায়কৃত কিস্তির মধ্যে অর্জিত আসল মুনাফা"
              value={paidProfit}
              accent="emerald"
              icon={Sparkles}
            />
          </div>
        </Section>

        {/* SECTION 3: DUES & RECEIVABLES */}
        <Section
          title="৩. বাজারে বকেয়া কিস্তি (Dues & Market Receivables)"
          hint="Unpaid স্ট্যাটাস অনুযায়ী বাজারে গ্রাহকদের কাছে মোট বকেয়া পাওনা"
          icon={Clock}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              title="মোট কাস্টমার বকেয়া (Total Due)"
              subtitle="বাজারে গ্রাহকদের কাছে পাওনা মোট অর্থ"
              value={totalDueUnPaid}
              accent="rose"
              icon={AlertTriangle}
            />
            <StatCard
              title="বকেয়া আসল মূলধন (Due Principal)"
              subtitle="বাজারে আটকে থাকা মোট আসল মূলধন"
              value={totalUnPaidPrincipal}
              accent="amber"
              icon={Coins}
            />
            <StatCard
              title="বকেয়া মুনাফা পাওনা (Due Profit)"
              subtitle="ভবিষ্যতে কিস্তির সাথে আদায়যোগ্য লাভ"
              value={totalUnPaidProfit}
              accent="purple"
              icon={Clock}
            />
          </div>
        </Section>

        {/* SECTION 4: EXPENSES & OPERATING MARGIN */}
        <Section
          title="৪. কোম্পানির খরচ ও পরিচালন মুনাফা (Expenses & Net Operating Margin)"
          hint="কোম্পানির মোট অফিশিয়াল খরচ বনাম আদায়কৃত গ্রস মুনাফার সমন্বয়"
          icon={Building2}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              title="মোট অফিশিয়াল খরচ (Total Expenses)"
              subtitle="বেতন, অফিস, ইউটিলিটি বিল ও পরিচালন খরচ"
              value={totalCompanyExpenses}
              accent="rose"
              icon={Building2}
            />
            <StatCard
              title="আদায়কৃত গ্রস মুনাফা (Collected Profit)"
              subtitle="গ্রাহকদের কিস্তি থেকে সংগৃহীত অর্জিত লাভ"
              value={paidProfit}
              accent="emerald"
              icon={Sparkles}
            />
            <StatCard
              title="নিট পরিচালন মুনাফা (Net Operating Profit)"
              subtitle="আদায়কৃত লাভ - অফিশিয়াল খরচ (পরিচালন উদ্বৃত্ত)"
              value={netOperatingMargin}
              accent={netOperatingMargin >= 0 ? "emerald" : "rose"}
              badge={netOperatingMargin >= 0 ? "লাভজনক" : "ঘাটতি"}
              icon={Scale}
            />
          </div>
        </Section>

        {/* SECTION 5: INVESTMENTS, WITHDRAWALS & LIQUID CASH */}
        <Section
          title="৫. বিনিয়োগ, উত্তোলন ও নগদ তারল্য (Investments & Liquidity)"
          hint="ইনভেস্টর সংগ্রহ, বন্ধকৃত মূলধন, উত্তোলিত প্রফিট ও বর্তমান ক্যাশ ব্যালেন্স"
          icon={Users}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard
              title="মোট সংগৃহীত বিনিয়োগ"
              subtitle="ইনভেস্টরদের মোট জমা মূলধন"
              value={totalInvestment}
              accent="emerald"
              icon={Users}
            />

            <StatCard
              title="মোট ফেরত মূলধন (Closed)"
              subtitle="কার্ড বন্ধের পর ফেরত দেওয়া মূলধন"
              value={totalClosedInvestment}
              accent="amber"
              icon={Landmark}
              badge="ক্লিক করুন"
              onClick={() => setOpenClosedModal(true)}
            />

            <StatCard
              title="মোট উত্তোলিত প্রফিট"
              subtitle="ইনভেস্টরদের পরিশোধিত মুনাফা"
              value={WithdrawnProfit}
              accent="rose"
              icon={LogOut}
              badge="ক্লিক করুন"
              onClick={() => setOpenProfitModal(true)}
            />

            <StatCard
              title="চলমান সক্রিয় বিনিয়োগ"
              subtitle="মোট সংগ্রহ - ক্লোজড মূলধন"
              value={activeInvestment}
              accent="indigo"
              icon={RefreshCw}
            />

            <StatCard
              title="বর্তমান ক্যাশ ব্যালেন্স"
              subtitle="ক্যাশ ড্রয়ারে মোট তরল ব্যালেন্স"
              value={currentCashBalance}
              accent={currentCashBalance >= 0 ? "emerald" : "rose"}
              icon={Wallet}
              badge="Cash Report"
            />
          </div>
        </Section>
      </div>

      {/* MODAL 1: CLOSED INVESTMENT CARDS */}
      <FinanceModal
        open={openClosedModal}
        onClose={() => setOpenClosedModal(false)}
        title="বন্ধকৃত ইনভেস্টমেন্ট কার্ডসমূহ (Closed Investment Cards)"
      >
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
            <div className="text-xs text-slate-300">
              মোট ক্লোজড কার্ড: <b className="font-mono text-amber-400">{closedCards.length}</b> টি | মোট ফেরত মূলধন:{" "}
              <b className="font-mono text-amber-400">৳ {formatBDT(totalClosedInvestment)}</b>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={closedSearch}
                onChange={(e) => setClosedSearch(e.target.value)}
                placeholder="কার্ড বা ইনভেস্টর খুঁজুন..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {filteredClosedCards.length === 0 ? (
            <p className="text-center text-slate-400 py-8 text-xs">
              কোনো closed card পাওয়া যায়নি
            </p>
          ) : (
            <div className="overflow-x-auto max-h-[60vh]">
              <table className="w-full text-xs text-left">
                <thead className="bg-white/5 text-slate-300 uppercase tracking-wider sticky top-0 backdrop-blur">
                  <tr>
                    <th className="px-3.5 py-2.5">কার্ড নং</th>
                    <th className="px-3.5 py-2.5">ইনভেস্টর</th>
                    <th className="px-3.5 py-2.5">কার্ডের নাম</th>
                    <th className="px-3.5 py-2.5">মেয়াদকাল</th>
                    <th className="px-3.5 py-2.5 text-right">মূলধন (৳)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredClosedCards.map((c) => (
                    <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-3.5 py-2.5 font-mono text-indigo-400 font-semibold">
                        #{c.id}
                      </td>
                      <td className="px-3.5 py-2.5">
                        <span className="font-semibold text-white block">
                          {c.investorName}
                        </span>
                        {c.investorPhone && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            {c.investorPhone}
                          </span>
                        )}
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-300">
                        {c.card_name || "—"}
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-400 font-mono text-[11px]">
                        {c.start_date ? c.start_date.slice(0, 10) : "—"} হতে{" "}
                        {c.end_date ? c.end_date.slice(0, 10) : "—"}
                      </td>
                      <td className="px-3.5 py-2.5 text-right font-mono font-bold text-amber-300">
                        ৳ {formatBDT(c.investment_amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </FinanceModal>

      {/* MODAL 2: WITHDRAWN PROFIT DETAILS */}
      <FinanceModal
        open={openProfitModal}
        onClose={() => setOpenProfitModal(false)}
        title="উত্তোলিত মুনাফার বিস্তারিত তালিকা (Withdrawn Profit Details)"
      >
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
            <div className="text-xs text-slate-300">
              মোট উত্তোলন রেকর্ড: <b className="font-mono text-rose-400">{withdrawnProfitRows.length}</b> টি | মোট উত্তোলিত মুনাফা:{" "}
              <b className="font-mono text-rose-400">৳ {formatBDT(WithdrawnProfit)}</b>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={profitSearch}
                onChange={(e) => setProfitSearch(e.target.value)}
                placeholder="ইনভেস্টর বা কার্ড খুঁজুন..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {filteredWithdrawnRows.length === 0 ? (
            <p className="text-center text-slate-400 py-8 text-xs">
              কোনো withdrawn profit পাওয়া যায়নি
            </p>
          ) : (
            <div className="overflow-x-auto max-h-[60vh]">
              <table className="w-full text-xs text-left">
                <thead className="bg-white/5 text-slate-300 uppercase tracking-wider sticky top-0 backdrop-blur">
                  <tr>
                    <th className="px-3.5 py-2.5">কার্ড নং</th>
                    <th className="px-3.5 py-2.5">ইনভেস্টর</th>
                    <th className="px-3.5 py-2.5 text-right">উত্তোলিত মুনাফা (৳)</th>
                    <th className="px-3.5 py-2.5">তারিখ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredWithdrawnRows.map((row) => (
                    <tr key={row.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-3.5 py-2.5 font-mono text-indigo-400 font-semibold">
                        #{row.cardId || "—"}
                      </td>
                      <td className="px-3.5 py-2.5">
                        <span className="font-semibold text-white block">
                          {row.name}
                        </span>
                        {row.phone && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            {row.phone}
                          </span>
                        )}
                      </td>
                      <td className="px-3.5 py-2.5 text-right font-mono font-bold text-rose-400 text-sm">
                        ৳ {formatBDT(row.amount)}
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-400 font-mono text-[11px]">
                        {row.date ? row.date.slice(0, 10) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </FinanceModal>
    </main>
  );
};

export default FinanceOverview;
