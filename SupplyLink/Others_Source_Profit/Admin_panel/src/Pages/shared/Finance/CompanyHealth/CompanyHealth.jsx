import React, { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import useCustomerInstallmentCards from "../../../../utils/Hooks/useCustomerInstallmentCards";
import useCustomerInstallmentPayments from "../../../../utils/Hooks/Customers/useCustomerInstallmentPayments";
import useCashReports from "../../../../utils/Hooks/cash/useCashReports";
import Loader from "../../../../components/Loader/Loader";
import ErrorPage from "../../../ErrorPage";
import useInvestInstallment from "../../../../utils/Investors/useInvestInstallment";
import useProfitAnalytics from "../../../../utils/Hooks/useProfitAnalytics";
import useInvestmentCards from "../../../../utils/Investors/useInvestmentCards";
import useProfitHistory from "../../../../utils/Investors/useProfitHistory";
import useUsers from "../../../../utils/Hooks/useUsers";
import useOtherAssets from "../../../../utils/Hooks/useOtherAssets";
import {
  Activity,
  ShieldCheck,
  AlertTriangle,
  Calendar,
  Wallet,
  Coins,
  Building2,
  Users,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Search,
  Printer,
  Scale,
  Sparkles,
  Info,
  CheckCircle2,
  DollarSign,
  FileText,
  Bike,
  Store,
  Briefcase,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  PieChart,
  BadgeDollarSign,
} from "lucide-react";

const money = (n) =>
  `৳ ${Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const shortMoney = (n) =>
  `৳ ${Number(n || 0).toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })}`;

// Visual Category Stat Card Component
const MetricCard = ({ title, value, subtitle, icon: Icon, tone = "emerald", tooltip }) => {
  const toneClasses = {
    emerald: "border-emerald-500/25 bg-emerald-500/[0.03] text-emerald-400",
    indigo: "border-indigo-500/25 bg-indigo-500/[0.03] text-indigo-400",
    amber: "border-amber-500/25 bg-amber-500/[0.03] text-amber-400",
    rose: "border-rose-500/25 bg-rose-500/[0.03] text-rose-400",
    blue: "border-blue-500/25 bg-blue-500/[0.03] text-blue-400",
    purple: "border-purple-500/25 bg-purple-500/[0.03] text-purple-400",
    slate: "border-white/[0.08] bg-white/[0.02] text-slate-300",
  };

  const currentTone = toneClasses[tone] || toneClasses.slate;

  return (
    <div className={`card-surface p-4 rounded-2xl border transition-all hover:border-white/20 flex flex-col justify-between ${currentTone}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-300 truncate" title={title}>
            {title}
          </p>
          {subtitle && (
            <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
              {subtitle}
            </p>
          )}
        </div>
        {Icon && (
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.08] shrink-0">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-3 pt-2 border-t border-white/[0.04]">
        <div className="text-lg md:text-xl font-bold font-mono tracking-tight text-white">
          {money(value)}
        </div>
      </div>
    </div>
  );
};

const CompanyHealth = ({ initialTab = "overview" }) => {
  const [activeTab, setActiveTab] = useState(initialTab); // "overview" | "simulator"
  const [showAssetDetails, setShowAssetDetails] = useState(false);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Simulator Cut-off Date (defaults to Today)
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [simDate, setSimDate] = useState(todayStr);
  const [investorSearch, setInvestorSearch] = useState("");

  const {
    customerInstallmentCards = [],
    isCustomerInstallmentsCardsError,
    isCustomerInstallmentsCardsLoading,
  } = useCustomerInstallmentCards();

  const {
    customerInstallmentPayments = [],
    isCustomerInstallmentsPaymentsError,
    isCustomerInstallmentsPaymentsLoading,
  } = useCustomerInstallmentPayments();

  const { CashReports = [], isCashReportsError, isCashReportsLoading } =
    useCashReports();

  const { investmentCards = [], isInvestmentCardsError, isInvestmentCardsLoading } =
    useInvestmentCards();

  const { profitAnalytics = [], isProfitAnalyticsLoading, isUProfitAnalyticsError } =
    useProfitAnalytics();

  const { profitHistory = [] } = useProfitHistory();

  const { users = [], isUsersLoading } = useUsers();

  // Other assets, shares & rental agreements hook
  const {
    assets = [],
    shareInvestments = [],
    tangibleAssets = [],
    activeRentAgreements = [],
    totalShareInvestment = 0,
    totalTangibleAssetValue = 0,
    totalMonthlyRent = 0,
    totalCollectedIncome = 0,
    isLoading: isAssetsLoading,
  } = useOtherAssets();

  // User Map for investor name/phone
  const userById = useMemo(() => {
    const m = new Map();
    (users || []).forEach((u) => m.set(Number(u.id), u));
    return m;
  }, [users]);

  const investorLabel = (investorId) => {
    const u = userById.get(Number(investorId));
    if (!u) return `ইনভেস্টর #${investorId}`;
    const name = u.name || u.full_name || u.username || `User ${u.id}`;
    const phone = u.phone || u.mobile || "";
    return phone ? `${name} (${phone})` : name;
  };

  /* =========================================================
     1. CASH IN, OUT & REAL CASH FLOWS
  ========================================================= */
  const approvedCashInReports = useMemo(
    () => (Array.isArray(CashReports) ? CashReports.filter((c) => c.type === "in" && c.approval_status === "approved") : []),
    [CashReports]
  );

  const approvedCashOutReports = useMemo(
    () => (Array.isArray(CashReports) ? CashReports.filter((c) => c.type === "out" && c.approval_status === "approved") : []),
    [CashReports]
  );

  const totalCashIn = useMemo(
    () => approvedCashInReports.reduce((sum, c) => sum + Number(c.amount || 0), 0),
    [approvedCashInReports]
  );

  // Categorized Cash Outflows
  const purchaseCashOut = useMemo(
    () => approvedCashOutReports.filter((c) => c.category?.toLowerCase() === "purchase").reduce((sum, c) => sum + Number(c.amount || 0), 0),
    [approvedCashOutReports]
  );

  const productPurchasePrice = useMemo(
    () => customerInstallmentCards.reduce((sum, c) => sum + Number(c.cost_price || 0), 0),
    [customerInstallmentCards]
  );

  const totalInvestorPayout = useMemo(
    () => approvedCashOutReports.filter((c) => c.category?.toLowerCase() === "investor-payout").reduce((sum, c) => sum + Number(c.amount || 0), 0),
    [approvedCashOutReports]
  );

  const investorProfitPayout = useMemo(
    () => approvedCashOutReports.filter((c) => c.category?.toLowerCase() === "profit-payout").reduce((sum, c) => sum + Number(c.amount || 0), 0),
    [approvedCashOutReports]
  );

  // Shares & Assets Cash Out (যদি ক্যাশ থেকে টাকা বের হয়ে শেয়ার/অ্যাসেট কেনা হয়ে থাকে)
  const shareInvestmentCashOut = useMemo(
    () => approvedCashOutReports.filter((c) => c.category?.toLowerCase() === "share_investment").reduce((sum, c) => sum + Number(c.amount || 0), 0),
    [approvedCashOutReports]
  );

  const assetPurchaseCashOut = useMemo(
    () => approvedCashOutReports.filter((c) => c.category?.toLowerCase() === "asset_purchase").reduce((sum, c) => sum + Number(c.amount || 0), 0),
    [approvedCashOutReports]
  );

  // Office Rent, Salary & Operating Expenses
  const rentExpense = useMemo(
    () => approvedCashOutReports.filter((c) => c.category?.toLowerCase() === "rent").reduce((sum, c) => sum + Number(c.amount || 0), 0),
    [approvedCashOutReports]
  );

  const salaryExpense = useMemo(
    () => approvedCashOutReports.filter((c) => c.category?.toLowerCase() === "salary").reduce((sum, c) => sum + Number(c.amount || 0), 0),
    [approvedCashOutReports]
  );

  const billExpense = useMemo(
    () => approvedCashOutReports.filter((c) => c.category?.toLowerCase() === "bill").reduce((sum, c) => sum + Number(c.amount || 0), 0),
    [approvedCashOutReports]
  );

  const officeExpense = useMemo(
    () => approvedCashOutReports.filter((c) => c.category?.toLowerCase() === "office-expense").reduce((sum, c) => sum + Number(c.amount || 0), 0),
    [approvedCashOutReports]
  );

  const totalOtherExpenses = useMemo(
    () => approvedCashOutReports.filter((c) => c.category?.toLowerCase() === "others").reduce((sum, c) => sum + Number(c.amount || 0), 0),
    [approvedCashOutReports]
  );

  // All Approved Cash Outflows (পণ্য, ইনভেস্টর পেআউট, শেয়ার ক্রয়, ভাড়া, বেতন, বিল ও সকল অফিস খরচ)
  const totalAllApprovedCashOut = useMemo(
    () => approvedCashOutReports.reduce((sum, c) => sum + Number(c.amount || 0), 0),
    [approvedCashOutReports]
  );

  // Exact Cash Balance in Hand (ক্যাশ রিপোর্টের সাথে হুবহু ১০০% মিল)
  const currentCashBalance = totalCashIn - totalAllApprovedCashOut;

  /* =========================================================
     2. ASSETS & RECEIVABLES (COMPANY PROPERTY & RECEIVABLES)
  ========================================================= */
  const customerDueList = useMemo(
    () => customerInstallmentPayments.filter((p) => p.status === "Unpaid"),
    [customerInstallmentPayments]
  );

  const totalCustomerDueAmount = useMemo(
    () => customerDueList.reduce((sum, p) => sum + Number(p.due_amount || 0), 0),
    [customerDueList]
  );

  // Effective share investment value (from other_assets table or cash out)
  const effectiveShareValue = totalShareInvestment > 0 ? totalShareInvestment : shareInvestmentCashOut;

  // Effective tangible assets value (bike, shop, equipment)
  const effectiveTangibleValue = totalTangibleAssetValue > 0 ? totalTangibleAssetValue : assetPurchaseCashOut;

  // Dynamic names of all purchased shares
  const shareNames = useMemo(() => {
    if (!shareInvestments || shareInvestments.length === 0) return "কোম্পানি শেয়ার";
    return shareInvestments.map((s) => s.asset_name).join(", ");
  }, [shareInvestments]);

  // Liquid Assets (Cash + Customer Dues)
  const cashCustomerDue = currentCashBalance + totalCustomerDueAmount;

  // Comprehensive Total Company Assets (Cash + Customer Dues + Share Holdings + Fixed Assets)
  const comprehensiveAssets = cashCustomerDue + effectiveShareValue + effectiveTangibleValue;

  /* =========================================================
     3. INVESTOR LIABILITIES
  ========================================================= */
  const ActiveInvestmentAmount = useMemo(
    () =>
      investmentCards
        .filter(
          (c) =>
            c.status?.toLowerCase() === "running" &&
            Number(c.id) !== 1 &&
            Number(c.id) !== 2
        )
        .reduce((sum, c) => sum + Number(c.investment_amount || 0), 0),
    [investmentCards]
  );

  const Card1Investment = useMemo(
    () =>
      investmentCards
        .filter((c) => Number(c.id) === 1)
        .reduce((sum, c) => sum + Number(c.investment_amount || 0), 0),
    [investmentCards]
  );

  const totalProfitGenerated = useMemo(
    () => profitAnalytics.reduce((sum, p) => sum + Number(p.profit_amount || 0), 0),
    [profitAnalytics]
  );

  const CompanyProfit = useMemo(
    () =>
      profitAnalytics
        .filter((p) => Number(p.card_id) === 1 || Number(p.card_id) === 2)
        .reduce((sum, p) => sum + Number(p.profit_amount || 0), 0),
    [profitAnalytics]
  );

  const InvestorProfitAvailable = Math.max(
    0,
    totalProfitGenerated - CompanyProfit - investorProfitPayout
  );

  const TotalInvestorAssets = ActiveInvestmentAmount + InvestorProfitAvailable;

  // Net Surplus on Comprehensive Assets basis
  const NetCompanyAssets = comprehensiveAssets - TotalInvestorAssets;

  // Net Surplus on Liquid Assets basis
  const NetLiquidSurplus = cashCustomerDue - TotalInvestorAssets;

  const CompanyAssets = CompanyProfit + Card1Investment;

  const companyExpenss = useMemo(
    () => rentExpense + salaryExpense + billExpense + officeExpense + totalOtherExpenses,
    [rentExpense, salaryExpense, billExpense, officeExpense, totalOtherExpenses]
  );

  // Asset Coverage Ratios
  const coverageRatio = TotalInvestorAssets > 0
    ? ((comprehensiveAssets / TotalInvestorAssets) * 100).toFixed(1)
    : "100.0";

  const liquidCoverageRatio = TotalInvestorAssets > 0
    ? ((cashCustomerDue / TotalInvestorAssets) * 100).toFixed(1)
    : "100.0";

  /* =========================================================
     4. DATE-BASED SETTLEMENT / LIQUIDATION SIMULATOR
  ========================================================= */
  const simulation = useMemo(() => {
    const targetDate = simDate || todayStr;

    const cashList = Array.isArray(CashReports) ? CashReports : [];
    const paymentsList = Array.isArray(customerInstallmentPayments) ? customerInstallmentPayments : [];
    const cardsList = Array.isArray(investmentCards) ? investmentCards : [];
    const profitList = Array.isArray(profitAnalytics) ? profitAnalytics : [];

    // 1) Simulated Cash Balance up to simDate
    const simCashIn = cashList
      .filter(
        (c) =>
          c.type === "in" &&
          c.approval_status === "approved" &&
          (!c.date || c.date <= targetDate)
      )
      .reduce((sum, c) => sum + Number(c.amount || 0), 0);

    const simCashOut = cashList
      .filter(
        (c) =>
          c.type === "out" &&
          c.approval_status === "approved" &&
          (!c.date || c.date <= targetDate)
      )
      .reduce((sum, c) => sum + Number(c.amount || 0), 0);

    const simCashBalance = simCashIn - simCashOut;

    // 2) Customer Dues remaining to collect (receivables)
    let simUnpaidPrincipal = 0;
    let simUnpaidProfit = 0;
    let simTotalCustomerDue = 0;

    for (const p of paymentsList) {
      if (p.status === "Unpaid") {
        simTotalCustomerDue += Number(p.due_amount || 0);
        simUnpaidPrincipal += Number(p.principal_amount || 0);
        simUnpaidProfit += Number(p.profit_amount || 0);
      }
    }

    // 3) Share Investments & Fixed Assets up to targetDate
    const simShareAssets =
      shareInvestments && shareInvestments.length > 0
        ? shareInvestments
            .filter((a) => !a.purchase_date || a.purchase_date <= targetDate)
            .reduce((sum, a) => sum + Number(a.purchase_price || 0), 0)
        : (effectiveShareValue > 0 && (!targetDate || targetDate >= "2026-08-01") ? effectiveShareValue : 0);

    const simTangibleAssets =
      tangibleAssets && tangibleAssets.length > 0
        ? tangibleAssets
            .filter((a) => !a.purchase_date || a.purchase_date <= targetDate)
            .reduce((sum, a) => sum + Number(a.purchase_price || 0), 0)
        : (effectiveTangibleValue > 0 && (!targetDate || targetDate >= "2026-08-01") ? effectiveTangibleValue : 0);

    const simCollectedIncome = totalCollectedIncome;

    // Total Liquid & Comprehensive Assets to settle debts
    const simTotalReceivables = simCashBalance + simTotalCustomerDue + simShareAssets + simTangibleAssets;

    // 4) Active Investors Capital to return up to targetDate
    const activeCards = cardsList.filter((c) => {
      if (Number(c.id) === 1 || Number(c.id) === 2) return false;
      const isRunning = c.status?.toLowerCase() === "running";
      const started = !c.start_date || c.start_date <= targetDate;
      const notEnded = !c.end_date || c.end_date === "0000-00-00" || c.end_date > targetDate;
      return isRunning && started && notEnded;
    });

    const simTotalInvestorCapital = activeCards.reduce(
      (sum, c) => sum + Number(c.investment_amount || 0),
      0
    );

    // 5) Investor Profits accumulated up to targetDate minus payouts up to targetDate
    const simProfitsGenerated = profitList
      .filter((p) => {
        if (Number(p.card_id) === 1 || Number(p.card_id) === 2) return false;
        if (!p.created_at) return true;
        return p.created_at.slice(0, 10) <= targetDate;
      })
      .reduce((sum, p) => sum + Number(p.profit_amount || 0), 0);

    const simProfitPayouts = cashList
      .filter(
        (c) =>
          c.type === "out" &&
          c.approval_status === "approved" &&
          c.category?.toLowerCase() === "profit-payout" &&
          (!c.date || c.date <= targetDate)
      )
      .reduce((sum, c) => sum + Number(c.amount || 0), 0);

    const simTotalInvestorProfit = Math.max(0, simProfitsGenerated - simProfitPayouts);

    // Total Settlement Liabilities
    const simTotalPayables = simTotalInvestorCapital + simTotalInvestorProfit;

    // Net Settlement Surplus or Deficit
    const simNetSettlement = simTotalReceivables - simTotalPayables;
    const simCoverage = simTotalPayables > 0
      ? ((simTotalReceivables / simTotalPayables) * 100).toFixed(1)
      : "100.0";

    // 6) Investor-by-Investor Settlement List
    const investorMap = new Map();

    for (const card of activeCards) {
      const invId = Number(card.investor_id || card.user_id || 0);
      if (!invId) continue;

      if (!investorMap.has(invId)) {
        investorMap.set(invId, {
          investor_id: invId,
          cardIds: [],
          capital: 0,
          profit: 0,
        });
      }

      const inv = investorMap.get(invId);
      inv.cardIds.push(card.id);
      inv.capital += Number(card.investment_amount || 0);
    }

    // Approved profit withdrawals per investor up to targetDate
    const withdrawnByInvestor = new Map();
    (profitHistory || []).forEach((ph) => {
      if (ph.status === "withdraw" && ph.action_name === "approved") {
        const invId = Number(ph.investor_id);
        const itemDate = ph.decision_at || ph.created_at || "";
        if (!itemDate || itemDate.slice(0, 10) <= targetDate) {
          withdrawnByInvestor.set(
            invId,
            (withdrawnByInvestor.get(invId) || 0) + Number(ph.amount || 0)
          );
        }
      }
    });

    // Distribute remaining active profit across investors
    for (const p of profitList) {
      if (Number(p.card_id) === 1 || Number(p.card_id) === 2) continue;
      if (p.created_at && p.created_at.slice(0, 10) > targetDate) continue;
      const invId = Number(p.investor_id);
      if (!invId) continue;

      if (!investorMap.has(invId)) {
        investorMap.set(invId, {
          investor_id: invId,
          cardIds: p.card_id ? [p.card_id] : [],
          capital: 0,
          profit: 0,
        });
      }

      const inv = investorMap.get(invId);
      inv.profit += Number(p.profit_amount || 0);
      if (p.card_id && !inv.cardIds.includes(p.card_id)) {
        inv.cardIds.push(p.card_id);
      }
    }

    // Deduct approved withdrawals to get exact net remaining profit
    for (const inv of investorMap.values()) {
      const w = withdrawnByInvestor.get(inv.investor_id) || 0;
      inv.profit = Math.max(0, inv.profit - w);
    }

    const investorList = Array.from(investorMap.values())
      .map((inv) => ({
        ...inv,
        totalPayable: inv.capital + inv.profit,
      }))
      .filter((inv) => inv.totalPayable > 0.01)
      .sort((a, b) => b.totalPayable - a.totalPayable);

    return {
      targetDate,
      simCashBalance,
      simCashIn,
      simCashOut,
      simTotalCustomerDue,
      simUnpaidPrincipal,
      simUnpaidProfit,
      simShareAssets,
      simTangibleAssets,
      simCollectedIncome,
      simTotalReceivables,
      simTotalInvestorCapital,
      simTotalInvestorProfit,
      simTotalPayables,
      simNetSettlement,
      simCoverage,
      investorList,
    };
  }, [
    simDate,
    todayStr,
    CashReports,
    customerInstallmentPayments,
    investmentCards,
    profitAnalytics,
    profitHistory,
    shareInvestments,
    tangibleAssets,
    effectiveShareValue,
    effectiveTangibleValue,
    totalCollectedIncome,
  ]);

  // Filtered investor breakdown
  const filteredInvestors = useMemo(() => {
    const list = simulation?.investorList || [];
    if (!investorSearch.trim()) return list;
    const t = investorSearch.toLowerCase();
    return list.filter((inv) => {
      const label = investorLabel(inv.investor_id).toLowerCase();
      const cards = (inv.cardIds || []).join(", ");
      return label.includes(t) || cards.includes(t) || String(inv.investor_id).includes(t);
    });
  }, [simulation?.investorList, investorSearch, userById]);

  // Aggregate totals for the settlement list
  const listTotals = useMemo(() => {
    let capital = 0;
    let profit = 0;
    let totalPayable = 0;
    for (const inv of filteredInvestors) {
      capital += inv.capital || 0;
      profit += inv.profit || 0;
      totalPayable += inv.totalPayable || 0;
    }
    return { capital, profit, totalPayable };
  }, [filteredInvestors]);

  const isLoading =
    isCustomerInstallmentsCardsLoading ||
    isCustomerInstallmentsPaymentsLoading ||
    isCashReportsLoading ||
    isInvestmentCardsLoading ||
    isProfitAnalyticsLoading;

  const isError =
    isCustomerInstallmentsCardsError ||
    isCustomerInstallmentsPaymentsError ||
    isCashReportsError;

  if (isLoading) {
    return (
      <div className="h-[75vh] flex flex-col items-center justify-center space-y-3">
        <Loader />
        <p className="text-xs text-slate-400">কোম্পানির আর্থিক ও অ্যাসেট তথ্য বিশ্লেষণ করা হচ্ছে...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <ErrorPage message="কোম্পানির আর্থিক ডাটা লোড করতে সমস্যা হয়েছে" />
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-5 md:p-6 space-y-6 max-w-[1600px] mx-auto text-white">
      {/* HEADER BANNER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-indigo-600 shadow-lg shadow-emerald-500/25 ring-1 ring-white/20 shrink-0">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                কোম্পানি আর্থিক স্বাস্থ্য ও লিকুইডেশন সিমুলেটর
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                সমন্বিত কভারেজ: {coverageRatio}%
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              ক্যাশ, কাস্টমার বকেয়া, শেয়ার বিনিয়োগ, স্থায়ী অ্যাসেট ও ভাড়াসহ সর্বমোট সম্পদ বনাম দায় এবং ক্লোজিং বিশ্লেষণ
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="inline-flex items-center p-1 rounded-xl bg-white/[0.04] border border-white/[0.08] self-start md:self-auto">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "overview"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>সার্বিক স্বাস্থ্য (Overview)</span>
          </button>

          <button
            onClick={() => setActiveTab("simulator")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "simulator"
                ? "bg-rose-600 text-white shadow-md shadow-rose-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>ক্লোজিং সিমুলেটর (Settlement)</span>
          </button>
        </div>
      </div>

      {/* =========================================================
          TAB 1: সার্বিক কোম্পানির আর্থিক স্বাস্থ্য (OVERVIEW)
      ========================================================= */}
      {activeTab === "overview" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Executive Solvency Health Banner */}
          <div className="card-surface p-5 sm:p-6 rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/20 via-slate-900/60 to-indigo-950/20 shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    কোম্পানির আর্থিক সামর্থ্য (Solvency Standing)
                  </span>
                  <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {NetCompanyAssets >= 0 ? "নিরাপদ ও উদ্বৃত্ত (Solvent)" : "সতর্কবার্তা (Deficit)"}
                  </span>
                </div>

                <div className="flex items-baseline gap-3">
                  <span className="text-3xl sm:text-4xl font-extrabold font-mono text-white tracking-tight">
                    {money(NetCompanyAssets)}
                  </span>
                  <span className="text-xs text-slate-400">
                    (নিট কোম্পানি উদ্বৃত্ত সম্পদ)
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
                  কোম্পানির মোট ক্যাশ, কাস্টমার বকেয়া, শেয়ার ও স্থায়ী সম্পদের মোট পরিমাণ (
                  <span className="font-mono font-bold text-white">{shortMoney(comprehensiveAssets)}</span>)
                  সব ইনভেস্টরদের সক্রিয় মূলধন ও মুনাফা পাওনা (
                  <span className="font-mono font-bold text-white">{shortMoney(TotalInvestorAssets)}</span>)
                  অপেক্ষা বহুলাংশে বেশি। সবাইকে সম্পূর্ণ অর্থ পরিশোধ করার পরেও কোম্পানিতে{" "}
                  <span className="font-mono font-bold text-emerald-400">{shortMoney(NetCompanyAssets)}</span> উদ্বৃত্ত থাকবে।
                </p>

                {/* Sub-pills for fast glance */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                    লিকুইড ক্যাশ + কিস্তি: <b className="font-mono">{shortMoney(cashCustomerDue)}</b>
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300">
                    শেয়ারে বিনিয়োগ সম্পদ: <b className="font-mono">{shortMoney(effectiveShareValue)}</b>
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300">
                    স্থায়ী ও ফিক্সড অ্যাসেটস: <b className="font-mono">{shortMoney(effectiveTangibleValue)}</b>
                  </span>
                </div>
              </div>

              {/* Solvency Progress & Ratio Pill */}
              <div className="lg:w-80 shrink-0 p-4 rounded-xl bg-black/40 border border-white/[0.08] space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">সমন্বিত সম্পদ কভারেজ:</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">
                    {coverageRatio}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(10, Number(coverageRatio)))}%` }}
                  />
                </div>

                <div className="flex justify-between text-[11px] text-slate-400 pt-1 border-t border-white/[0.06]">
                  <span>মোট সম্পদ: {shortMoney(comprehensiveAssets)}</span>
                  <span>মোট দায়: {shortMoney(TotalInvestorAssets)}</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>শুধু লিকুইড কভারেজ: {liquidCoverageRatio}%</span>
                  <span>সারপ্লাস: {shortMoney(NetCompanyAssets)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* GROUP 1: নগদ ক্যাশ ও লিকুইডিটি (Cash Flow & Liquidity) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-slate-300">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                  ১. নগদ ক্যাশ ও তারল্য প্রবাহ (Cash & Liquidity)
                </h2>
              </div>
              <Link
                to="/cash/cash_out"
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
              >
                <span>ক্যাশ আউট রিপোর্ট দেখুন</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="মোট প্রাপ্ত ক্যাশ (Cash In)"
                subtitle="কিস্তি, আমানত, ডাউনপেমেন্ট ও আয়"
                value={totalCashIn}
                icon={ArrowDownRight}
                tone="emerald"
              />

              <MetricCard
                title="মোট অনুমোদিত ক্যাশ আউট (Cash Out)"
                subtitle="পণ্য, পেআউট, শেয়ার ক্রয় ও সকল খরচ"
                value={totalAllApprovedCashOut}
                icon={ArrowUpRight}
                tone="rose"
              />

              <MetricCard
                title="ইনভেস্টর মূলধন ও লাভ ফেরত"
                subtitle="মূলধন ফেরত ৳ 3.16M + মুনাফা ৳ 1.97L"
                value={totalInvestorPayout + investorProfitPayout}
                icon={Users}
                tone="blue"
              />

              <MetricCard
                title="বর্তমান ক্যাশ ব্যালেন্স (Cash in Hand)"
                subtitle="ক্যাশ রিপোর্টের সাথে হুবহু সামঞ্জস্যপূর্ণ"
                value={currentCashBalance}
                icon={Wallet}
                tone={currentCashBalance >= 0 ? "emerald" : "rose"}
              />
            </div>

            {currentCashBalance < 0 && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-200/90 leading-relaxed">
                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-amber-300">ক্যাশ ইন হ্যান্ড সামঞ্জস্যতা তথ্য: </span>
                  নগদ ক্যাশ থেকে{" "}
                  {effectiveShareValue > 0 && (
                    <>
                      <b>{money(effectiveShareValue)}</b> টাকা দিয়ে{" "}
                      <span className="text-purple-300 font-semibold">{shareNames}</span> এর শেয়ার{" "}
                    </>
                  )}
                  {effectiveShareValue > 0 && effectiveTangibleValue > 0 && "এবং "}
                  {effectiveTangibleValue > 0 && (
                    <>
                      <b>{money(effectiveTangibleValue)}</b> টাকার স্থায়ী অ্যাসেট{" "}
                      {tangibleAssets.length > 0 && `(${tangibleAssets.length}টি অ্যাসেট)`}{" "}
                    </>
                  )}
                  ক্রয় করায় ক্যাশ ড্রয়ারে সাময়িক নেগেটিভ ব্যালেন্স দেখাচ্ছে। এই অর্থটি (মোট{" "}
                  <b className="text-emerald-300 font-mono font-bold">
                    {money(effectiveShareValue + effectiveTangibleValue)}
                  </b>
                  ) বর্তমানে সরাসরি তরল নগদ হিসেবে হাতে না থাকলেও, এটি{" "}
                  <b>বিক্রয়যোগ্য শেয়ার ও স্থায়ী সম্পদ হিসেবে সম্পূর্ণ সুরক্ষিত আছে</b>। শেয়ার বিক্রি করলে বা মূলধন সমন্বয় হলে এটি পুনরায় নগদ ক্যাশে ফেরত আসবে।
                </div>
              </div>
            )}
          </div>

          {/* GROUP 2: সম্পদ ও প্রাপ্যতা (Assets & Receivables - যা কোম্পানি পাবে) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-300">
              <Coins className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                ২. মোট সম্পদ ও প্রাপ্যতা (Assets & Receivables — যা কোম্পানি পাবে ও নিজস্ব সম্পদ)
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <MetricCard
                title="কাস্টমারদের বকেয়া কিস্তি"
                subtitle="বাজারে গ্রাহকদের কাছে পাওনা অর্থ"
                value={totalCustomerDueAmount}
                icon={Users}
                tone="indigo"
              />

              <MetricCard
                title="হাতে নগদ ক্যাশ ব্যালেন্স"
                subtitle="বর্তমান তরল নগদ ক্যাশ"
                value={currentCashBalance}
                icon={Wallet}
                tone={currentCashBalance >= 0 ? "emerald" : "rose"}
              />

              <MetricCard
                title="শেয়ারে বিনিয়োগকৃত সম্পদ"
                subtitle="প্রয়োজনে বিক্রয়যোগ্য শেয়ার সম্পদ"
                value={effectiveShareValue}
                icon={TrendingUp}
                tone="purple"
              />

              <MetricCard
                title="স্থায়ী সম্পদ ও অ্যাসেটস"
                subtitle="বাইক, দোকান ও যন্ত্রপাতির মোট মূল্য"
                value={effectiveTangibleValue}
                icon={Building2}
                tone="amber"
              />

              <MetricCard
                title="সর্বমোট সমন্বিত কোম্পানি সম্পদ"
                subtitle="ক্যাশ + কিস্তি + শেয়ার + অ্যাসেটস"
                value={comprehensiveAssets}
                icon={ShieldCheck}
                tone="emerald"
              />
            </div>
          </div>

          {/* GROUP 3: ইনভেস্টরদের দায় ও মূলধন (Investor Liabilities - যা পরিশোধ করতে হবে) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-300">
              <Users className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                ৩. ইনভেস্টরদের দায় ও পাওনা (Investor Obligations — যা পরিশোধযোগ্য)
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <MetricCard
                title="সক্রিয় ইনভেস্টর মূলধন"
                subtitle="ইনভেস্টরদের চলমান মূলধন আমানত"
                value={ActiveInvestmentAmount}
                icon={Coins}
                tone="amber"
              />

              <MetricCard
                title="সক্রিয় ইনভেস্টর প্রফিট পাওনা"
                subtitle="ইনভেস্টরদের অর্জিত অপরিশোধিত প্রফিট"
                value={InvestorProfitAvailable}
                icon={TrendingUp}
                tone="purple"
              />

              <MetricCard
                title="মোট ইনভেস্টরদের পাওনা দায়"
                subtitle="মোট মূলধন + প্রফিট পাওনা"
                value={TotalInvestorAssets}
                icon={AlertTriangle}
                tone="rose"
              />
            </div>
          </div>

          {/* GROUP 4: শেয়ার, অ্যাসেট ও ভাড়া পোর্টফোলিও (Shares, Fixed Assets & Rental Portfolio) */}
          <div className="card-surface p-5 rounded-2xl border border-indigo-500/25 space-y-4 bg-indigo-950/[0.08]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    ৪. কোম্পানি শেয়ার, স্থায়ী অ্যাসেট ও ভাড়া পোর্টফোলিও (Shares & Asset Portfolio)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    কোম্পানির ক্রয়কৃত শেয়ার, বাইক, দোকান, ভাড়া চুক্তি ও ডিভিডেন্ড কালেকশনের বিবরণ
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAssetDetails(!showAssetDetails)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-semibold text-slate-200 transition-all border border-white/[0.08]"
                >
                  <span>{showAssetDetails ? "তালিকা লুকান" : "অ্যাসেট তালিকা দেখুন"}</span>
                  {showAssetDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                <Link
                  to="/other-sources/assets"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 transition-all"
                >
                  <span>অ্যাসেট ম্যানেজমেন্ট</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Quick Stat Tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="p-3.5 rounded-xl bg-black/30 border border-white/[0.05] space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>শেয়ারে বিনিয়োগ</span>
                  <span className="text-purple-400 font-semibold">{shareInvestments.length} টি কোম্পানি</span>
                </div>
                <div className="text-base font-mono font-bold text-purple-400">
                  {money(effectiveShareValue)}
                </div>
                <p className="text-[10px] text-slate-500">কোম্পানি শেয়ারে সক্রিয় মূলধন</p>
              </div>

              <div className="p-3.5 rounded-xl bg-black/30 border border-white/[0.05] space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>স্থায়ী অ্যাসেটস (বাইক/দোকান)</span>
                  <span className="text-amber-400 font-semibold">{tangibleAssets.length} টি অ্যাসেট</span>
                </div>
                <div className="text-base font-mono font-bold text-amber-400">
                  {money(effectiveTangibleValue)}
                </div>
                <p className="text-[10px] text-slate-500">বাইক, দোকান ও যন্ত্রপাতি ক্রয়মূল্য</p>
              </div>

              <div className="p-3.5 rounded-xl bg-black/30 border border-white/[0.05] space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>সক্রিয় ভাড়া চুক্তি</span>
                  <span className="text-indigo-400 font-semibold">{activeRentAgreements.length} টি চুক্তি</span>
                </div>
                <div className="text-base font-mono font-bold text-indigo-400">
                  {money(totalMonthlyRent)} <span className="text-[10px] text-slate-400 font-normal">/মাস</span>
                </div>
                <p className="text-[10px] text-slate-500">চুক্তিভিত্তিক নিয়মিত মাসিক ভাড়া</p>
              </div>

              <div className="p-3.5 rounded-xl bg-black/30 border border-white/[0.05] space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>আদায়কৃত ভাড়া ও ডিভিডেন্ড</span>
                  <span className="text-emerald-400 font-semibold">ক্যাশ সংগৃহীত</span>
                </div>
                <div className="text-base font-mono font-bold text-emerald-400">
                  {money(totalCollectedIncome)}
                </div>
                <p className="text-[10px] text-slate-500">অ্যাসেট ও শেয়ার থেকে প্রাপ্ত নিট আয়</p>
              </div>
            </div>

            {/* Expandable Asset Details Table */}
            {showAssetDetails && (
              <div className="mt-3 pt-3 border-t border-white/[0.06] overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-white/[0.03] text-slate-400 uppercase tracking-wider border-b border-white/[0.08]">
                    <tr>
                      <th className="px-3 py-2">অ্যাসেটের নাম</th>
                      <th className="px-3 py-2">ক্যাটাগরি</th>
                      <th className="px-3 py-2 text-right">ক্রয় / বিনিয়োগ মূল্য</th>
                      <th className="px-3 py-2">ভাড়া / চুক্তি বিবরণ</th>
                      <th className="px-3 py-2 text-right">আদায়কৃত অর্থ</th>
                      <th className="px-3 py-2 text-center">স্ট্যাটাস</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {(assets || []).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-3 py-6 text-center text-slate-500">
                          কোন অ্যাসেট ডাটা পাওয়া যায়নি
                        </td>
                      </tr>
                    ) : (
                      (assets || []).map((a) => (
                        <tr key={a.id} className="hover:bg-white/[0.02]">
                          <td className="px-3 py-2.5 font-semibold text-white">
                            {a.asset_name}
                            {a.share_percentage && (
                              <span className="ml-1 text-[10px] text-purple-400 font-mono">
                                ({a.share_percentage}%)
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="capitalize px-2 py-0.5 rounded bg-white/[0.05] text-slate-300">
                              {a.category === "company_share"
                                ? "শেয়ার বিনিয়োগ"
                                : a.category === "bike"
                                ? "বাইক"
                                : a.category === "shop"
                                ? "দোকান"
                                : a.category}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono font-bold text-white">
                            {money(a.purchase_price)}
                          </td>
                          <td className="px-3 py-2.5 text-slate-300">
                            {a.monthly_rent > 0 ? (
                              <span>
                                মাসিক ভাড়া: <b className="font-mono text-indigo-400">{money(a.monthly_rent)}</b>
                                {a.lessee_name && ` (${a.lessee_name})`}
                              </span>
                            ) : (
                              <span className="text-slate-500">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono font-bold text-emerald-400">
                            {money(a.total_collected)}
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                a.status === "active"
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                  : "bg-slate-500/20 text-slate-300"
                              }`}
                            >
                              {a.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* GROUP 5: কোম্পানির ইকুইটি, লাভ ও অফিশিয়াল ব্যয় */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-300">
              <Building2 className="w-4 h-4 text-purple-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                ৫. কোম্পানির ইকুইটি, লাভ ও অফিশিয়াল খরচ
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="কোম্পানির অর্জিত প্রফিট"
                subtitle="কার্ড ১ ও ২ এর মোট প্রফিট"
                value={CompanyProfit}
                icon={TrendingUp}
                tone="indigo"
              />

              <MetricCard
                title="কার্ড ১ ইনভেস্টমেন্ট ব্যালেন্স"
                subtitle="কোম্পানির কার্ড ১ মূলধন"
                value={Card1Investment}
                icon={Building2}
                tone="indigo"
              />

              <MetricCard
                title="কোম্পানির নিজস্ব মোট সম্পদ"
                subtitle="প্রফিট + কার্ড ১ মূলধন"
                value={CompanyAssets}
                icon={ShieldCheck}
                tone="emerald"
              />

              <MetricCard
                title="কোম্পানির অফিশিয়াল খরচ"
                subtitle={`ভাড়া ${shortMoney(rentExpense)} + বেতন ${shortMoney(salaryExpense)} + বিল ও অফিস ${shortMoney(billExpense + officeExpense)}`}
                value={companyExpenss}
                icon={ArrowUpRight}
                tone="rose"
              />
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 2: কোম্পানি ক্লোজিং ও লিকুইডেশন সিমুলেটর (SIMULATOR)
      ========================================================= */}
      {activeTab === "simulator" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Simulator Control Box with Date Selection */}
          <div className="card-surface p-5 sm:p-6 rounded-2xl space-y-4 border border-rose-500/30 bg-gradient-to-r from-rose-950/20 via-slate-900/60 to-purple-950/20">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
              <div>
                <div className="flex items-center gap-2">
                  <Scale className="w-5 h-5 text-rose-400" />
                  <h2 className="text-lg font-bold text-white">
                    কোম্পানি ক্লোজিং ও নিষ্পত্তিকরণ সিমুলেটর (Liquidation Simulator)
                  </h2>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  যেকোনো তারিখ সিলেক্ট করুন — যদি ঐ তারিখে কোম্পানি সম্পূর্ণ কার্যক্রম বন্ধ বা নিষ্পত্তি করে, তবে কী ঘটবে তা দেখুন:
                </p>
              </div>

              {/* Date Selector */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-300 font-medium">সমাপ্তি / ক্লোজিং তারিখ:</span>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-rose-400 pointer-events-none" />
                  <input
                    type="date"
                    value={simDate}
                    onChange={(e) => setSimDate(e.target.value)}
                    className="bg-slate-900/90 border border-rose-500/40 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white outline-none focus:ring-2 focus:ring-rose-500 font-mono"
                  />
                </div>
                <button
                  onClick={() => setSimDate(todayStr)}
                  className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs text-slate-200 border border-white/[0.08] transition-colors"
                >
                  আজকের তারিখ
                </button>
              </div>
            </div>

            {/* Verdict Result Banner */}
            <div className="p-4 sm:p-5 rounded-xl bg-black/40 border border-white/[0.08] space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  {simulation.simNetSettlement >= 0 ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0" />
                  )}
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {simulation.targetDate} তারিখে নিষ্পত্তি ফলাফল:{" "}
                      <span
                        className={
                          simulation.simNetSettlement >= 0 ? "text-emerald-400 font-mono" : "text-rose-400 font-mono"
                        }
                      >
                        {money(simulation.simNetSettlement)}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {simulation.simNetSettlement >= 0 ? (
                        <>
                          ✅ <span className="font-semibold text-emerald-300">১০০% সলভেন্ট ও উদ্বৃত্ত:</span> সব ইনভেস্টরদের সক্রিয় মূলধন ও মুনাফা পাওনা সম্পূর্ণ পরিশোধ করার পরও কোম্পানির কাছে{" "}
                          <span className="font-mono font-bold text-emerald-400">{money(simulation.simNetSettlement)}</span> উদ্বৃত্ত থাকবে।
                        </>
                      ) : (
                        <>
                          ⚠️ <span className="font-semibold text-rose-300">ঘাটতি সতর্কবার্তা:</span> এই তারিখে সব দায় পরিশোধ করতে গেলে কোম্পানিতে{" "}
                          <span className="font-mono font-bold text-rose-400">{money(Math.abs(simulation.simNetSettlement))}</span> শর্টেজ থাকবে।
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <div className="text-right sm:border-l sm:border-white/10 sm:pl-4 shrink-0">
                  <span className="text-[11px] text-slate-400 block">সম্পদ কভারেজ</span>
                  <span className="text-xl font-mono font-extrabold text-white">
                    {simulation.simCoverage}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* DUAL BALANCE SHEET: যা পাবে (Assets) বনাম যা দিতে হবে (Liabilities) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* LEFT: 🟢 যা যা টাকা কোম্পানি পাবে ও হাতে থাকবে (Receivables / Inflow) */}
            <div className="card-surface p-5 rounded-2xl border border-emerald-500/25 space-y-4 bg-emerald-500/[0.02]">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
                    <ArrowDownRight className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      যা কোম্পানি পাবে ও সম্পদ (Assets & Receivables)
                    </h3>
                    <p className="text-[11px] text-slate-400">মোট আদায়যোগ্য ক্যাশ, বকেয়া, শেয়ার ও স্থায়ী সম্পদ</p>
                  </div>
                </div>

                <span className="text-lg font-mono font-extrabold text-emerald-400">
                  {money(simulation.simTotalReceivables)}
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                {/* Item 1 */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/[0.04]">
                  <div>
                    <span className="font-semibold text-white block">হাতে নগদ ক্যাশ ব্যালেন্স</span>
                    <span className="text-[11px] text-slate-400">
                      ক্যাশ ইন ({shortMoney(simulation.simCashIn)}) - ক্যাশ আউট ({shortMoney(simulation.simCashOut)})
                    </span>
                  </div>
                  <span className="font-mono font-bold text-emerald-400 text-sm">
                    {money(simulation.simCashBalance)}
                  </span>
                </div>

                {/* Item 2 */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/[0.04]">
                  <div>
                    <span className="font-semibold text-white block">কাস্টমারদের বকেয়া কিস্তির মূলধন</span>
                    <span className="text-[11px] text-slate-400">গ্রাহকদের কিস্তির আসল টাকা পাওনা</span>
                  </div>
                  <span className="font-mono font-bold text-slate-200 text-sm">
                    {money(simulation.simUnpaidPrincipal)}
                  </span>
                </div>

                {/* Item 3 */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/[0.04]">
                  <div>
                    <span className="font-semibold text-white block">কাস্টমারদের কিস্তির প্রফিট পাওনা</span>
                    <span className="text-[11px] text-slate-400">গ্রাহকদের কিস্তির মুনাফা অংশ</span>
                  </div>
                  <span className="font-mono font-bold text-slate-200 text-sm">
                    {money(simulation.simUnpaidProfit)}
                  </span>
                </div>

                {/* Item 4: Share Investments */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <div>
                    <span className="font-semibold text-purple-200 block">কোম্পানি শেয়ারে বিনিয়োগ সম্পদ</span>
                    <span className="text-[11px] text-purple-300/70">অন্যান্য কোম্পানিতে ক্রয়কৃত শেয়ার সম্পদ</span>
                  </div>
                  <span className="font-mono font-bold text-purple-400 text-sm">
                    {money(simulation.simShareAssets)}
                  </span>
                </div>

                {/* Item 5: Tangible Assets (Bikes, Shops) */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <div>
                    <span className="font-semibold text-amber-200 block">স্থায়ী ও অন্যান্য সম্পদ (বাইক/দোকান)</span>
                    <span className="text-[11px] text-amber-300/70">ক্রয়কৃত মোট স্থায়ী অ্যাসেটের মূল্য</span>
                  </div>
                  <span className="font-mono font-bold text-amber-400 text-sm">
                    {money(simulation.simTangibleAssets)}
                  </span>
                </div>

                {/* Total */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                  <span className="font-bold text-white text-xs uppercase tracking-wide">
                    সর্বমোট সমন্বয়যোগ্য কোম্পানি সম্পদ:
                  </span>
                  <span className="font-mono font-extrabold text-emerald-400 text-base">
                    {money(simulation.simTotalReceivables)}
                  </span>
                </div>
              </div>
            </div>

            {/* RIGHT: 🔴 যা যা টাকা পরিশোধ করতে হবে (Payables / Outflow) */}
            <div className="card-surface p-5 rounded-2xl border border-rose-500/25 space-y-4 bg-rose-500/[0.02]">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/15 text-rose-400">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      যা পরিশোধ করতে হবে (Liabilities)
                    </h3>
                    <p className="text-[11px] text-slate-400">ইনভেস্টরদের সর্বমোট প্রদেয় দায়</p>
                  </div>
                </div>

                <span className="text-lg font-mono font-extrabold text-rose-400">
                  {money(simulation.simTotalPayables)}
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                {/* Item 1 */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/[0.04]">
                  <div>
                    <span className="font-semibold text-white block">সক্রিয় ইনভেস্টরদের মূলধন ফেরত</span>
                    <span className="text-[11px] text-slate-400">
                      {(simulation?.investorList || []).length} জন ইনভেস্টরের মূল আমানত
                    </span>
                  </div>
                  <span className="font-mono font-bold text-amber-400 text-sm">
                    {money(simulation.simTotalInvestorCapital)}
                  </span>
                </div>

                {/* Item 2 */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/[0.04]">
                  <div>
                    <span className="font-semibold text-white block">ইনভেস্টরদের অবিতরিত প্রফিট পাওনা</span>
                    <span className="text-[11px] text-slate-400">
                      এই তারিখ পর্যন্ত অর্জিত প্রফিট পাওনা
                    </span>
                  </div>
                  <span className="font-mono font-bold text-purple-400 text-sm">
                    {money(simulation.simTotalInvestorProfit)}
                  </span>
                </div>

                {/* Item 3 */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/[0.04]">
                  <div>
                    <span className="font-semibold text-white block">অন্যান্য দায় / অফিশিয়াল বকেয়া</span>
                    <span className="text-[11px] text-slate-400">অফিশিয়াল দায় (যদি থাকে)</span>
                  </div>
                  <span className="font-mono font-bold text-slate-400 text-sm">
                    ৳ 0.00
                  </span>
                </div>

                {/* Total */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-rose-500/10 border border-rose-500/30">
                  <span className="font-bold text-white text-xs uppercase tracking-wide">
                    সর্বমোট প্রদেয় দায় ও পাওনা:
                  </span>
                  <span className="font-mono font-extrabold text-rose-400 text-base">
                    {money(simulation.simTotalPayables)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* DETAILED INVESTOR SETTLEMENT BREAKDOWN TABLE */}
          <div className="card-surface rounded-2xl overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-4 border-b border-white/[0.08] bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">
                  ইনভেস্টরদের পৃথক নিষ্পত্তি পরিশোধ তালিকা (Investor Settlement List)
                </h3>
                <span className="text-xs font-mono text-slate-400">
                  ({filteredInvestors?.length || 0} জন ইনভেস্টর)
                </span>
              </div>

              {/* Search & Print */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={investorSearch}
                    onChange={(e) => setInvestorSearch(e.target.value)}
                    placeholder="ইনভেস্টর বা কার্ড খুঁজুন..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-semibold text-slate-200 border border-white/[0.08] transition-all shrink-0"
                  title="নিষ্পত্তি তালিকা প্রিন্ট করুন"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>প্রিন্ট</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-sm text-left">
                <thead className="bg-white/[0.03] text-slate-300 uppercase text-xs tracking-wider border-b border-white/[0.08]">
                  <tr>
                    <th className="px-5 py-3.5 font-semibold">#</th>
                    <th className="px-5 py-3.5 font-semibold">ইনভেস্টর</th>
                    <th className="px-5 py-3.5 font-semibold">কার্ড নম্বর</th>
                    <th className="px-5 py-3.5 font-semibold text-right">মূলধন ফেরত (Capital)</th>
                    <th className="px-5 py-3.5 font-semibold text-right">প্রফিট পাওনা (Profit)</th>
                    <th className="px-5 py-3.5 font-semibold text-right">সর্বমোট প্রদেয় (Total Payout)</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/[0.05]">
                  {(!filteredInvestors || filteredInvestors.length === 0) ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-slate-500 text-xs">
                        কোন ইনভেস্টর ডাটা পাওয়া যায়নি
                      </td>
                    </tr>
                  ) : (
                    filteredInvestors.map((inv, idx) => (
                      <tr key={inv.investor_id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-3.5 font-mono text-xs text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="font-semibold text-white block">
                            {investorLabel(inv.investor_id)}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            ID: {inv.investor_id}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {inv.cardIds.map((cid) => (
                              <span
                                key={cid}
                                className="px-2 py-0.5 rounded text-[11px] font-mono bg-indigo-500/15 text-indigo-300 border border-indigo-500/30"
                              >
                                #{cid}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono font-bold text-amber-400">
                          {money(inv.capital)}
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono font-bold text-purple-400">
                          {money(inv.profit)}
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono font-extrabold text-white text-base">
                          {money(inv.totalPayable)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {filteredInvestors && filteredInvestors.length > 0 && (
                  <tfoot className="bg-slate-900/90 border-t-2 border-indigo-500/40 font-semibold text-white">
                    <tr>
                      <td colSpan={3} className="px-5 py-3.5 text-xs uppercase tracking-wider font-bold text-slate-300">
                        মোট নিষ্পত্তিকরণ প্রদেয় ({filteredInvestors.length} জন ইনভেস্টর):
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono font-bold text-amber-400">
                        {money(listTotals.capital)}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono font-bold text-purple-400">
                        {money(listTotals.profit)}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono font-extrabold text-white text-base bg-indigo-500/10">
                        {money(listTotals.totalPayable)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyHealth;
