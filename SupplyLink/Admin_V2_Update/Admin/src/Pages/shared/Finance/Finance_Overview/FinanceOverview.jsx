import React, { useMemo, useState } from "react";
import useCustomerInstallmentCards from "../../../../utils/Hooks/useCustomerInstallmentCards";
import useCustomerInstallmentPayments from "../../../../utils/Hooks/Customers/useCustomerInstallmentPayments";
import useInvestInstallment from "../../../../utils/Investors/useInvestInstallment";
import useInvestmentCards from "../../../../utils/Investors/useInvestmentCards";
import useCashReports from "../../../../utils/Hooks/cash/useCashReports";
import useMobileInventory from "../../../../utils/Hooks/useMobileInventory";
import useSupplierPayments from "../../../../utils/Hooks/useSupplierPayments";
import useUsers from "../../../../utils/Hooks/useUsers";
import Loader from "../../../../components/Loader/Loader";
import { FinanceModal } from "./FinanceModal";
import {
  FaWallet,
  FaBoxes,
  FaHandHoldingUsd,
  FaUsers,
  FaChartLine,
  FaMoneyBillWave,
  FaFileInvoiceDollar,
  FaBalanceScale,
  FaArrowUp,
  FaArrowDown,
  FaShieldAlt,
  FaStore,
  FaLayerGroup,
  FaCalendarAlt,
  FaSearch,
  FaCheckCircle,
  FaTimesCircle,
  FaInfoCircle,
} from "react-icons/fa";

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

const formatBDTShort = (n) =>
  toNum(n).toLocaleString("en-US", {
    maximumFractionDigits: 0,
  });

const StatCard = ({
  title,
  value,
  accent = "emerald",
  icon,
  subtitle,
  onClick,
  badge,
}) => {
  const accentMap = {
    emerald: {
      border: "border-emerald-500/30 hover:border-emerald-500/60",
      bg: "bg-emerald-950/20",
      iconBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      text: "text-emerald-400",
    },
    indigo: {
      border: "border-indigo-500/30 hover:border-indigo-500/60",
      bg: "bg-indigo-950/20",
      iconBg: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
      text: "text-indigo-400",
    },
    amber: {
      border: "border-amber-500/30 hover:border-amber-500/60",
      bg: "bg-amber-950/20",
      iconBg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      text: "text-amber-400",
    },
    rose: {
      border: "border-rose-500/30 hover:border-rose-500/60",
      bg: "bg-rose-950/20",
      iconBg: "bg-rose-500/10 text-rose-400 border-rose-500/20",
      text: "text-rose-400",
    },
    cyan: {
      border: "border-cyan-500/30 hover:border-cyan-500/60",
      bg: "bg-cyan-950/20",
      iconBg: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
      text: "text-cyan-400",
    },
    blue: {
      border: "border-blue-500/30 hover:border-blue-500/60",
      bg: "bg-blue-950/20",
      iconBg: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      text: "text-blue-400",
    },
    purple: {
      border: "border-purple-500/30 hover:border-purple-500/60",
      bg: "bg-purple-950/20",
      iconBg: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      text: "text-purple-400",
    },
  };

  const style = accentMap[accent] || accentMap.emerald;

  return (
    <div
      onClick={onClick}
      className={`group relative rounded-3xl border p-5 shadow-xl bg-gradient-to-b from-slate-900/95 via-[#0B132B]/90 to-slate-950/95 backdrop-blur-md transition-all duration-300 flex flex-col justify-between ${
        style.border
      } ${onClick ? "cursor-pointer hover:scale-[1.02] active:scale-[0.99]" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-xs font-bold text-slate-300 uppercase tracking-wider truncate">
              {title}
            </p>
            {badge && (
              <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-white/10 text-slate-300 border border-white/10">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="mt-1 text-[11px] text-slate-400 leading-snug">
              {subtitle}
            </p>
          )}
        </div>

        <div
          className={`shrink-0 rounded-2xl border p-2.5 text-base flex items-center justify-center shadow-inner ${style.iconBg}`}
        >
          {icon}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-end justify-between">
        <div>
          <p className={`text-xl sm:text-2xl font-black font-mono tracking-tight ${style.text}`}>
            ৳ {formatBDT(value)}
          </p>
        </div>
        {onClick && (
          <span className="text-[10px] font-bold text-slate-500 group-hover:text-slate-300 transition flex items-center gap-1">
            বিস্তারিত ➔
          </span>
        )}
      </div>
    </div>
  );
};

const FinanceOverview = () => {
  const [activeTab, setActiveTab] = useState("all"); // all, assets, collections, dues, investors, suppliers, expenses
  const [openModalType, setOpenModalType] = useState(null); // closedCards, expenses, suppliers, inventory, cashDetails

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

  const { users = [], isUsersError, isUsersLoading } = useUsers();

  const {
    CashReports = [],
    isCashReportsError,
    isCashReportsLoading,
  } = useCashReports();

  const {
    stockMobiles = [],
    isStockMobilesLoading,
    isStockMobilesError,
  } = useMobileInventory();

  const {
    supplierPayments = [],
    isSupplierPaymentsLoading,
    isSupplierPaymentsError,
  } = useSupplierPayments();

  const loading =
    isCustomerInstallmentsCardsLoading ||
    isCustomerInstallmentsPaymentsLoading ||
    inInvestInstallmentsLoading ||
    isUsersLoading ||
    isInvestmentCardsLoading ||
    isCashReportsLoading ||
    isStockMobilesLoading ||
    isSupplierPaymentsLoading;

  const hasError =
    isCustomerInstallmentsCardsError ||
    isCustomerInstallmentsPaymentsError ||
    isInvestInstallmentsError ||
    isUsersError ||
    isInvestmentCardsError ||
    isCashReportsError;

  const cards = customerInstallmentCards || [];
  const payments = customerInstallmentPayments || [];
  const invests = investInstallments || [];
  const invCards = investmentCards || [];
  const cashList = Array.isArray(CashReports) ? CashReports : [];
  const inventoryList = Array.isArray(stockMobiles) ? stockMobiles : [];
  const supplierList = Array.isArray(supplierPayments) ? supplierPayments : [];

  /* ========================================================== */
  /* 📊 MASTER COMPREHENSIVE FINANCIAL CALCULATION ENGINE      */
  /* ========================================================== */
  const finance = useMemo(() => {
    // 1. CASH IN / OUT / BALANCE
    const approvedCash = cashList.filter(
      (c) => c.approval_status === "approved" || !c.approval_status
    );

    const totalCashIn = approvedCash
      .filter((c) => c.type === "in")
      .reduce((sum, item) => sum + toNum(item.amount), 0);

    const totalCashOut = approvedCash
      .filter((c) => c.type === "out")
      .reduce((sum, item) => sum + toNum(item.amount), 0);

    const availableCashBalance = totalCashIn - totalCashOut;

    // 2. INVENTORY STOCK VALUE
    const availableStockItems = inventoryList.filter(
      (item) => String(item.status || "available").toLowerCase() === "available"
    );
    const totalStockUnits = availableStockItems.length;
    const totalStockValue = availableStockItems.reduce(
      (sum, item) => sum + toNum(item.purchase_price || item.cost_price || item.price),
      0
    );

    // 3. CUSTOMER PORTFOLIO (Sales, Collected, Due)
    const totalSalesValue = cards.reduce((sum, c) => sum + toNum(c.sale_price), 0);
    const totalCostValue = cards.reduce((sum, c) => sum + toNum(c.cost_price), 0);
    const projectedGrossProfit = cards.reduce((sum, c) => sum + toNum(c.profit || (c.sale_price - c.cost_price)), 0);

    // Collections (Paid installments)
    const collectedPayments = payments.filter((p) => p.paid_date || String(p.status).toLowerCase() === "paid");
    const totalCollectedSales = collectedPayments.reduce((sum, p) => sum + toNum(p.due_amount || p.amount), 0);
    const totalCollectedPrincipal = collectedPayments.reduce((sum, p) => sum + toNum(p.principal_amount), 0);
    const totalCollectedProfit = collectedPayments.reduce((sum, p) => sum + toNum(p.profit_amount), 0);

    // Outstanding Customer Dues (Unpaid installments)
    const unpaidPayments = payments.filter((p) => !p.paid_date && String(p.status).toLowerCase() !== "paid");
    const totalCustomerReceivables = unpaidPayments.reduce((sum, p) => sum + toNum(p.due_amount || p.amount), 0);
    const customerDuePrincipal = unpaidPayments.reduce((sum, p) => sum + toNum(p.principal_amount), 0);
    const customerDueProfit = unpaidPayments.reduce((sum, p) => sum + toNum(p.profit_amount), 0);

    // 4. INVESTOR LIABILITIES & CAPITAL
    const totalInvestmentDeposited = invests.reduce((sum, r) => sum + toNum(r.amount), 0);
    const closedInvestmentCards = invCards.filter((c) => String(c.status).toLowerCase() === "closed");
    const totalClosedInvestment = closedInvestmentCards.reduce((sum, c) => sum + toNum(c.investment_amount), 0);

    const activeInvestmentCards = invCards.filter((c) => String(c.status).toLowerCase() !== "closed");
    const activeInvestmentCapital = activeInvestmentCards.reduce(
      (sum, c) => sum + toNum(c.investment_amount),
      0
    );

    const activeInvestorProfits = activeInvestmentCards.reduce(
      (sum, c) => sum + toNum(c.profit || c.total_profit),
      0
    );
    const totalInvestorLiabilities = activeInvestmentCapital + activeInvestorProfits;

    // 5. SUPPLIER & DEALER DEBTS
    const totalSupplierPurchases = supplierList.reduce((sum, s) => sum + toNum(s.total_amount), 0);
    const totalSupplierPaid = supplierList.reduce((sum, s) => sum + toNum(s.paid), 0);
    const totalSupplierDue = supplierList.reduce((sum, s) => sum + toNum(s.due), 0);

    // 6. COMPANY OPERATING EXPENSES
    const companyExpensesList = approvedCash.filter(
      (cash) =>
        cash.type === "out" &&
        (cash.source === "company-expense" ||
          cash.category?.toLowerCase() === "expense" ||
          cash.category?.toLowerCase() === "office-expense")
    );
    const totalCompanyExpenses = companyExpensesList.reduce((sum, r) => sum + toNum(r.amount), 0);

    // 7. BALANCE SHEET PILLARS
    // Total Assets = Available Cash + Stock Valuation + Customer Receivables
    const totalCompanyAssets = availableCashBalance + totalStockValue + totalCustomerReceivables;

    // Total Liabilities = Active Investor Capital + Supplier Due
    const totalOutsideLiabilities = activeInvestmentCapital + Math.max(0, totalSupplierDue);

    // Net Company Equity (Net Worth) = Assets - Liabilities
    const netCompanyEquity = totalCompanyAssets - totalOutsideLiabilities;

    // Realized Net Company Profit = Collected Profit - Office Expenses
    const realizedNetProfit = totalCollectedProfit - totalCompanyExpenses;

    return {
      totalCashIn,
      totalCashOut,
      availableCashBalance,
      totalStockUnits,
      totalStockValue,
      totalSalesValue,
      totalCostValue,
      projectedGrossProfit,
      totalCollectedSales,
      totalCollectedPrincipal,
      totalCollectedProfit,
      totalCustomerReceivables,
      customerDuePrincipal,
      customerDueProfit,
      totalInvestmentDeposited,
      totalClosedInvestment,
      activeInvestmentCapital,
      activeInvestorProfits,
      totalInvestorLiabilities,
      totalSupplierPurchases,
      totalSupplierPaid,
      totalSupplierDue,
      totalCompanyExpenses,
      companyExpensesList,
      totalCompanyAssets,
      totalOutsideLiabilities,
      netCompanyEquity,
      realizedNetProfit,
      closedInvestmentCards,
    };
  }, [cards, payments, invests, invCards, cashList, inventoryList, supplierList]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] bg-[#050811]">
        <Loader />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#050811] via-[#080E1E] to-[#050811] text-slate-100 p-3 md:p-6 space-y-6 pb-28">
      {/* ==================================================== */}
      {/* 🌟 1. EXECUTIVE MASTER BALANCE SHEET BANNER          */}
      {/* ==================================================== */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-[#0B132B] to-slate-900 border border-slate-800 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <span className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/25">
              <FaBalanceScale className="text-2xl" />
            </span>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                  Finance Master Overview
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse">
                  LIVE SYNC
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-400 mt-1">
                প্রতিষ্ঠানের সামগ্রিক আর্থিক হিসাব, সম্পদ, দায়-দেনা, কিস্তি ও নিট মুনাফার পূর্ণাঙ্গ ড্যাশবোর্ড
              </p>
            </div>
          </div>

          {/* Quick Status Pill */}
          <div className="flex items-center gap-3 bg-slate-950/80 border border-slate-800/90 px-4 py-2.5 rounded-2xl shadow-inner">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Company Health</span>
              <span className="text-xs font-black text-emerald-400">
                {finance.netCompanyEquity >= 0 ? "উদ্বৃত্ত ও শক্তিশালী (Solvent)" : "দায়বদ্ধ (Requires Attention)"}
              </span>
            </div>
          </div>
        </div>

        {/* The 4 Executive Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {/* Pillar 1: Total Assets */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-emerald-500/30 flex flex-col justify-between shadow-lg">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                মোট কোম্পানি সম্পদ (Assets)
              </span>
              <FaWallet className="text-emerald-400" />
            </div>
            <div className="mt-3">
              <h2 className="text-2xl font-black font-mono text-emerald-400">
                ৳ {formatBDTShort(finance.totalCompanyAssets)}
              </h2>
              <p className="text-[10px] text-slate-500 mt-1">
                ক্যাশ (৳ {formatBDTShort(finance.availableCashBalance)}) + স্টক + কাস্টমার বাকি
              </p>
            </div>
          </div>

          {/* Pillar 2: Total Outside Liabilities */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-amber-500/30 flex flex-col justify-between shadow-lg">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                মোট দায় ও দেনা (Liabilities)
              </span>
              <FaHandHoldingUsd className="text-amber-400" />
            </div>
            <div className="mt-3">
              <h2 className="text-2xl font-black font-mono text-amber-400">
                ৳ {formatBDTShort(finance.totalOutsideLiabilities)}
              </h2>
              <p className="text-[10px] text-slate-500 mt-1">
                ইনভেস্টর মূলধন (৳ {formatBDTShort(finance.activeInvestmentCapital)}) + সাপ্লায়ার বাকি
              </p>
            </div>
          </div>

          {/* Pillar 3: Net Equity */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-indigo-500/30 flex flex-col justify-between shadow-lg">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                নিট কোম্পানির মূলধন (Net Worth)
              </span>
              <FaBalanceScale className="text-indigo-400" />
            </div>
            <div className="mt-3">
              <h2 className="text-2xl font-black font-mono text-indigo-300">
                ৳ {formatBDTShort(finance.netCompanyEquity)}
              </h2>
              <p className="text-[10px] text-slate-500 mt-1">
                (মোট সম্পদ − মোট দায়-দেনা)
              </p>
            </div>
          </div>

          {/* Pillar 4: Realized Net Profit */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-cyan-500/30 flex flex-col justify-between shadow-lg">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                আদায়কৃত নিট লাভ (Net Profit)
              </span>
              <FaChartLine className="text-cyan-400" />
            </div>
            <div className="mt-3">
              <h2 className="text-2xl font-black font-mono text-cyan-400">
                ৳ {formatBDTShort(finance.realizedNetProfit)}
              </h2>
              <p className="text-[10px] text-slate-500 mt-1">
                আদায়কৃত লাভ (৳ {formatBDTShort(finance.totalCollectedProfit)}) − অফিস খরচ
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 🌟 2. CATEGORY TABS                                  */}
      {/* ==================================================== */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: "all", label: "সব হিসাব (All Summary)", icon: <FaLayerGroup /> },
          { id: "cash", label: "ক্যাশ ও প্রবাহ (Cash Flow)", icon: <FaWallet /> },
          { id: "customers", label: "গ্রাহক কিস্তি (Installments)", icon: <FaUsers /> },
          { id: "stock", label: "স্টক পণ্য (Stock Assets)", icon: <FaBoxes /> },
          { id: "investors", label: "ইনভেস্টর হিসাব (Investors)", icon: <FaHandHoldingUsd /> },
          { id: "suppliers", label: "সাপ্লায়ার বাকি (Suppliers)", icon: <FaStore /> },
          { id: "expenses", label: "অফিস খরচ (Expenses)", icon: <FaFileInvoiceDollar /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap shadow-md ${
              activeTab === tab.id
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-500/25"
                : "bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ==================================================== */}
      {/* 🌟 3. FINANCIAL SECTIONS GRID                        */}
      {/* ==================================================== */}

      {/* SECTION A: Cash & Liquidity */}
      {(activeTab === "all" || activeTab === "cash") && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm md:text-base font-bold text-white flex items-center gap-2">
              <FaWallet className="text-emerald-400" />
              <span>নগদ ক্যাশ ও তহবিল প্রবাহ (Cash & Liquidity)</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Available: ৳ {formatBDT(finance.availableCashBalance)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              title="Available Cash Balance"
              subtitle="বর্তমান ক্যাশ ইন হ্যান্ড (ক্যাশ ইন − ক্যাশ আউট)"
              value={finance.availableCashBalance}
              accent="emerald"
              icon={<FaWallet />}
              badge="In Hand"
            />
            <StatCard
              title="Total Cash Received"
              subtitle="অনুমোদিত সর্বমোট ক্যাশ ইন (Inflow)"
              value={finance.totalCashIn}
              accent="cyan"
              icon={<FaArrowDown />}
            />
            <StatCard
              title="Total Cash Disbursed"
              subtitle="অনুমোদিত সর্বমোট ক্যাশ আউট (Outflow)"
              value={finance.totalCashOut}
              accent="rose"
              icon={<FaArrowUp />}
            />
          </div>
        </section>
      )}

      {/* SECTION B: Customer Installment Portfolio */}
      {(activeTab === "all" || activeTab === "customers") && (
        <section className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm md:text-base font-bold text-white flex items-center gap-2">
              <FaUsers className="text-blue-400" />
              <span>গ্রাহক কিস্তি পোর্টফোলিও (Customer Portfolio)</span>
            </h3>
            <span className="text-xs text-slate-400">
              মোট কার্ড: {cards.length} টি
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              title="Total Sale Value"
              subtitle="সকল কাস্টমার কার্ডের বিক্রয়মূল্য"
              value={finance.totalSalesValue}
              accent="indigo"
              icon={<FaMoneyBillWave />}
            />
            <StatCard
              title="Total Product Cost"
              subtitle="বিক্রীত পণ্যের মোট ক্রয়মূল্য"
              value={finance.totalCostValue}
              accent="blue"
              icon={<FaBoxes />}
            />
            <StatCard
              title="Projected Margin"
              subtitle="কিস্তির মোট সম্ভাব্য লাভ (Sale − Cost)"
              value={finance.projectedGrossProfit}
              accent="purple"
              icon={<FaChartLine />}
            />

            <StatCard
              title="Collected Sales"
              subtitle="গ্রাহকদের নিকট থেকে মোট আদায়কৃত টাকা"
              value={finance.totalCollectedSales}
              accent="emerald"
              icon={<FaCheckCircle />}
              badge="Collected"
            />
            <StatCard
              title="Collected Principal"
              subtitle="আদায়কৃত বিক্রয়ের মূলধন অংশ"
              value={finance.totalCollectedPrincipal}
              accent="cyan"
              icon={<FaShieldAlt />}
            />
            <StatCard
              title="Collected Profit"
              subtitle="আদায়কৃত বিক্রয়ের লাভ অংশ"
              value={finance.totalCollectedProfit}
              accent="emerald"
              icon={<FaChartLine />}
              badge="Realized"
            />

            <StatCard
              title="Outstanding Receivables"
              subtitle="গ্রাহকদের কাছে বর্তমান মোট বকেয়া কিস্তি"
              value={finance.totalCustomerReceivables}
              accent="rose"
              icon={<FaHandHoldingUsd />}
              badge="Due"
            />
            <StatCard
              title="Due Principal"
              subtitle="বকেয়া কিস্তির আটকে থাকা মূলধন"
              value={finance.customerDuePrincipal}
              accent="amber"
              icon={<FaBalanceScale />}
            />
            <StatCard
              title="Due Profit"
              subtitle="ভবিষ্যতে কিস্তিতে আসার অপেক্ষায় থাকা লাভ"
              value={finance.customerDueProfit}
              accent="rose"
              icon={<FaChartLine />}
            />
          </div>
        </section>
      )}

      {/* SECTION C: Stock & Inventory Assets */}
      {(activeTab === "all" || activeTab === "stock") && (
        <section className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm md:text-base font-bold text-white flex items-center gap-2">
              <FaBoxes className="text-cyan-400" />
              <span>মজুদ পণ্য ও সম্পদ মূল্যায়ন (Inventory & Stock Assets)</span>
            </h3>
            <span className="text-xs text-slate-400">
              মজুদ ইউনিট: {finance.totalStockUnits} টি
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              title="Available Stock Valuation"
              subtitle="দোকানে মজুত সকল অবিক্রীত পণ্যের মোট ক্রয়মূল্য"
              value={finance.totalStockValue}
              accent="cyan"
              icon={<FaBoxes />}
              badge={`${finance.totalStockUnits} Units`}
            />
            <StatCard
              title="Total Liquid & Stock Assets"
              subtitle="ক্যাশ ব্যালেন্স + মজুত পণ্যের ক্রয়মূল্য"
              value={finance.availableCashBalance + finance.totalStockValue}
              accent="emerald"
              icon={<FaShieldAlt />}
            />
            <StatCard
              title="Total Company Assets"
              subtitle="ক্যাশ + মজুত স্টক + কাস্টমার বকেয়া"
              value={finance.totalCompanyAssets}
              accent="indigo"
              icon={<FaBalanceScale />}
            />
          </div>
        </section>
      )}

      {/* SECTION D: Investor Capital & Liabilities */}
      {(activeTab === "all" || activeTab === "investors") && (
        <section className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm md:text-base font-bold text-white flex items-center gap-2">
              <FaHandHoldingUsd className="text-amber-400" />
              <span>ইনভেস্টর মূলধন ও হিসাব (Investor Capital & Liabilities)</span>
            </h3>
            <button
              onClick={() => setOpenModalType("closedCards")}
              className="text-xs text-amber-400 hover:text-amber-300 font-bold underline"
            >
              Closed Cards ({finance.closedInvestmentCards.length})
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Active Investment Capital"
              subtitle="সক্রিয় চলমান ইনভেস্টর মূলধন"
              value={finance.activeInvestmentCapital}
              accent="amber"
              icon={<FaUsers />}
              badge="Active"
            />
            <StatCard
              title="Active Investor Profit"
              subtitle="ইনভেস্টরদের প্রদেয় বকেয়া লভ্যাংশ"
              value={finance.activeInvestorProfits}
              accent="amber"
              icon={<FaChartLine />}
            />
            <StatCard
              title="Total Investor Debt"
              subtitle="ইনভেস্টর মূলধন + পাওনা লাভ"
              value={finance.totalInvestorLiabilities}
              accent="rose"
              icon={<FaHandHoldingUsd />}
            />
            <StatCard
              title="Closed Investment"
              subtitle="পরিশোধিত / সমাপ্ত ইনভেস্টমেন্ট কার্ড"
              value={finance.totalClosedInvestment}
              accent="slate"
              icon={<FaCheckCircle />}
              onClick={() => setOpenModalType("closedCards")}
              badge="Closed"
            />
          </div>
        </section>
      )}

      {/* SECTION E: Supplier & Dealer Dues */}
      {(activeTab === "all" || activeTab === "suppliers") && (
        <section className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm md:text-base font-bold text-white flex items-center gap-2">
              <FaStore className="text-purple-400" />
              <span>সাপ্লায়ার ও ডিলার খতিয়ান (Supplier & Dealer Ledger)</span>
            </h3>
            <span className="text-xs text-slate-400">
              মেমো সংখ্যা: {supplierList.length} টি
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              title="Total Supplier Purchase"
              subtitle="সাপ্লায়ারদের নিকট থেকে মোট ক্রয়কৃত মেমো"
              value={finance.totalSupplierPurchases}
              accent="purple"
              icon={<FaStore />}
            />
            <StatCard
              title="Total Supplier Paid"
              subtitle="সাপ্লায়ারদের মোট পরিশোধিত টাকা"
              value={finance.totalSupplierPaid}
              accent="emerald"
              icon={<FaCheckCircle />}
            />
            <StatCard
              title="Current Supplier Due"
              subtitle="সাপ্লায়ার ও ডিলারদের কাছে বর্তমান বকেয়া দেনা"
              value={finance.totalSupplierDue}
              accent="rose"
              icon={<FaHandHoldingUsd />}
              badge="Debt"
            />
          </div>
        </section>
      )}

      {/* SECTION F: Office Expenses & Net Profit */}
      {(activeTab === "all" || activeTab === "expenses") && (
        <section className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm md:text-base font-bold text-white flex items-center gap-2">
              <FaFileInvoiceDollar className="text-rose-400" />
              <span>অফিস খরচ ও নিট কোম্পানি মুনাফা (Expenses & Net Profit)</span>
            </h3>
            <button
              onClick={() => setOpenModalType("expenses")}
              className="text-xs text-rose-400 hover:text-rose-300 font-bold underline"
            >
              সকল খরচ তালিকা ({finance.companyExpensesList.length})
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              title="Total Office Expenses"
              subtitle="অনুমোদিত অফিস ও পরিচালনা মোট খরচ"
              value={finance.totalCompanyExpenses}
              accent="rose"
              icon={<FaFileInvoiceDollar />}
              onClick={() => setOpenModalType("expenses")}
              badge="Expense"
            />
            <StatCard
              title="Realized Net Profit"
              subtitle="আদায়কৃত লাভ − অফিস পরিচালনা খরচ"
              value={finance.realizedNetProfit}
              accent="cyan"
              icon={<FaChartLine />}
              badge="Net Profit"
            />
            <StatCard
              title="Net Company Equity"
              subtitle="কোম্পানির নিট সার্বিক সম্পদ (Assets − Liabilities)"
              value={finance.netCompanyEquity}
              accent="indigo"
              icon={<FaBalanceScale />}
              badge="Net Worth"
            />
          </div>
        </section>
      )}

      {/* ==================================================== */}
      {/* 🌟 4. DETAIL BREAKDOWN MODALS                         */}
      {/* ==================================================== */}

      {/* Closed Cards Modal */}
      <FinanceModal
        open={openModalType === "closedCards"}
        onClose={() => setOpenModalType(null)}
        title="Closed Investment Cards (সমাপ্ত ইনভেস্টমেন্ট কার্ডসমূহ)"
      >
        {finance.closedInvestmentCards.length === 0 ? (
          <p className="text-center text-slate-400 py-6 text-xs">
            কোনো Closed Card পাওয়া যায়নি
          </p>
        ) : (
          <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
            <table className="w-full text-xs border border-slate-800 rounded-xl overflow-hidden">
              <thead className="bg-slate-900 text-slate-300">
                <tr>
                  <th className="px-3 py-2.5 text-left">Card ID</th>
                  <th className="px-3 py-2.5 text-left">Card Name</th>
                  <th className="px-3 py-2.5 text-left">Investor</th>
                  <th className="px-3 py-2.5 text-right">Amount (৳)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {finance.closedInvestmentCards.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/40">
                    <td className="px-3 py-2 text-slate-400 font-mono">#{c.id}</td>
                    <td className="px-3 py-2 text-slate-200 font-bold">{c.card_name || "—"}</td>
                    <td className="px-3 py-2 text-slate-300">{c.investor_name || `Investor #${c.investor_id}`}</td>
                    <td className="px-3 py-2 text-right font-mono font-bold text-amber-300">
                      ৳ {formatBDT(c.investment_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </FinanceModal>

      {/* Expenses Modal */}
      <FinanceModal
        open={openModalType === "expenses"}
        onClose={() => setOpenModalType(null)}
        title="Company Office Expenses (কোম্পানির মোট অনুমোদিত খরচ)"
      >
        {finance.companyExpensesList.length === 0 ? (
          <p className="text-center text-slate-400 py-6 text-xs">
            কোনো খরচের তালিকা পাওয়া যায়নি
          </p>
        ) : (
          <div className="overflow-x-auto max-h-[65vh] overflow-y-auto">
            <table className="w-full text-xs border border-slate-800 rounded-xl overflow-hidden">
              <thead className="bg-slate-900 text-slate-300">
                <tr>
                  <th className="px-3 py-2.5 text-left">#</th>
                  <th className="px-3 py-2.5 text-left">Date</th>
                  <th className="px-3 py-2.5 text-left">Purpose</th>
                  <th className="px-3 py-2.5 text-left">Category</th>
                  <th className="px-3 py-2.5 text-right">Amount (৳)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {finance.companyExpensesList.map((exp, index) => (
                  <tr key={exp?.id || index} className="hover:bg-slate-800/40">
                    <td className="px-3 py-2 text-slate-500">{index + 1}</td>
                    <td className="px-3 py-2 text-slate-300 font-mono">
                      {exp?.date ? exp.date.split(" ")[0] : "—"}
                    </td>
                    <td className="px-3 py-2 text-slate-200 font-medium">{exp?.purpose || "—"}</td>
                    <td className="px-3 py-2 text-slate-400">{exp?.category || exp?.source || "—"}</td>
                    <td className="px-3 py-2 text-right font-mono font-bold text-rose-400">
                      ৳ {formatBDT(exp?.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </FinanceModal>
    </main>
  );
};

export default FinanceOverview;

