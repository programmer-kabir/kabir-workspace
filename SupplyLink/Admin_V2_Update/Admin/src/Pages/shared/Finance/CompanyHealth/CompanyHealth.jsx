import React, { useState, useMemo } from "react";
import useCustomerInstallmentCards from "../../../../utils/Hooks/useCustomerInstallmentCards";
import useCustomerInstallmentPayments from "../../../../utils/Hooks/Customers/useCustomerInstallmentPayments";
import useCashReports from "../../../../utils/Hooks/cash/useCashReports";
import useInvestInstallment from "../../../../utils/Investors/useInvestInstallment";
import useInvestmentCards from "../../../../utils/Investors/useInvestmentCards";
import useMobileInventory from "../../../../utils/Hooks/useMobileInventory";
import useSupplierPayments from "../../../../utils/Hooks/useSupplierPayments";
import Loader from "../../../../components/Loader/Loader";
import ErrorPage from "../../../ErrorPage";
import {
  FaHeartbeat,
  FaWallet,
  FaBoxes,
  FaHandHoldingUsd,
  FaUsers,
  FaChartLine,
  FaArrowUp,
  FaArrowDown,
  FaSyncAlt,
  FaShieldAlt,
  FaBalanceScale,
  FaMoneyCheckAlt,
  FaFileInvoiceDollar,
  FaPercentage,
  FaCheckCircle,
  FaInfoCircle,
  FaExclamationTriangle,
} from "react-icons/fa";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from "recharts";

const CompanyHealth = () => {
  const [activeTab, setActiveTab] = useState("overview");

  // Hooks for all financial modules
  const {
    customerInstallmentCards = [],
    isCustomerInstallmentsCardsLoading,
    isCustomerInstallmentsCardsError,
    refetch: refetchCards,
  } = useCustomerInstallmentCards();

  const {
    customerInstallmentPayments = [],
    isCustomerInstallmentsPaymentsLoading,
    isCustomerInstallmentsPaymentsError,
    refetch: refetchPayments,
  } = useCustomerInstallmentPayments();

  const {
    CashReports = [],
    isCashReportsLoading,
    isCashReportsError,
    refetch: refetchCash,
  } = useCashReports();

  const {
    investInstallments = [],
    inInvestInstallmentsLoading,
    isInvestInstallmentsError,
  } = useInvestInstallment();

  const {
    investmentCards = [],
    isInvestmentCardsLoading,
    isInvestmentCardsError,
  } = useInvestmentCards();

  const {
    stockMobiles = [],
    isStockMobilesLoading,
    isStockMobilesError,
    refetch: refetchStocks,
  } = useMobileInventory();

  const {
    supplierPayments = [],
    isSupplierPaymentsLoading,
    isSupplierPaymentsError,
    refetch: refetchSuppliers,
  } = useSupplierPayments();

  const handleRefetchAll = () => {
    refetchCards && refetchCards();
    refetchPayments && refetchPayments();
    refetchCash && refetchCash();
    refetchStocks && refetchStocks();
    refetchSuppliers && refetchSuppliers();
  };

  // ==========================================
  // 1. CASH FLOW CALCULATIONS
  // ==========================================
  const cashStats = useMemo(() => {
    if (!Array.isArray(CashReports)) {
      return { totalIn: 0, totalOut: 0, balance: 0, companyExpenses: 0, investorPayouts: 0, supplierPayouts: 0 };
    }

    const approvedCash = CashReports.filter((c) => c.approval_status === "approved");

    const totalIn = approvedCash
      .filter((c) => c.type === "in")
      .reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

    const totalOut = approvedCash
      .filter((c) => c.type === "out")
      .reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

    const balance = totalIn - totalOut;

    const companyExpenses = approvedCash
      .filter((c) => c.type === "out" && (c.source === "company-expense" || c.category?.toLowerCase() === "expense" || c.category?.toLowerCase() === "office-expense"))
      .reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

    const investorPayouts = approvedCash
      .filter((c) => c.type === "out" && (c.category?.toLowerCase() === "investor-payout" || c.category?.toLowerCase() === "profit-payout"))
      .reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

    const supplierPayouts = approvedCash
      .filter((c) => c.type === "out" && (c.category?.toLowerCase() === "purchase" || c.category?.toLowerCase() === "supplier-payment"))
      .reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

    return { totalIn, totalOut, balance, companyExpenses, investorPayouts, supplierPayouts };
  }, [CashReports]);

  // ==========================================
  // 2. STOCK & INVENTORY VALUATION
  // ==========================================
  const inventoryStats = useMemo(() => {
    const list = Array.isArray(stockMobiles) ? stockMobiles : [];
    const availableItems = list.filter((item) => (item.status || "").toLowerCase() === "available");
    const soldItems = list.filter((item) => (item.status || "").toLowerCase() === "sold");

    const availableStockValue = availableItems.reduce(
      (sum, item) => sum + (parseFloat(item.purchase_price) || 0),
      0
    );

    const availableStockMRP = availableItems.reduce(
      (sum, item) => sum + (parseFloat(item.mrp) || 0),
      0
    );

    const soldStockCost = soldItems.reduce(
      (sum, item) => sum + (parseFloat(item.purchase_price) || 0),
      0
    );

    return {
      totalCount: list.length,
      availableCount: availableItems.length,
      soldCount: soldItems.length,
      availableStockValue,
      availableStockMRP,
      soldStockCost,
    };
  }, [stockMobiles]);

  // ==========================================
  // 3. CUSTOMER INSTALLMENT RECEIVABLES
  // ==========================================
  const customerStats = useMemo(() => {
    const cards = Array.isArray(customerInstallmentCards) ? customerInstallmentCards : [];
    const payments = Array.isArray(customerInstallmentPayments) ? customerInstallmentPayments : [];

    const totalContractValue = cards.reduce(
      (sum, c) => sum + (parseFloat(c.total_amount || c.sale_price) || 0),
      0
    );

    const totalProductCost = cards.reduce(
      (sum, c) => sum + (parseFloat(c.cost_price) || 0),
      0
    );

    const totalDownPayment = cards.reduce(
      (sum, c) => sum + (parseFloat(c.down_payment) || 0),
      0
    );

    const paidInstallments = payments
      .filter((p) => (p.status || "").toLowerCase() === "paid")
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

    const totalCollected = totalDownPayment + paidInstallments;

    const unpaidPayments = payments.filter(
      (p) => (p.status || "").toLowerCase() === "unpaid"
    );

    const currentOverdue = unpaidPayments.reduce(
      (sum, p) => sum + (parseFloat(p.due_amount || p.amount) || 0),
      0
    );

    // Total outstanding receivables from customers (contract value minus collected)
    const totalOutstandingReceivable = Math.max(0, totalContractValue - totalCollected);

    const projectedGrossProfit = Math.max(0, totalContractValue - totalProductCost);

    return {
      totalCards: cards.length,
      totalContractValue,
      totalProductCost,
      totalCollected,
      currentOverdue,
      totalOutstandingReceivable,
      projectedGrossProfit,
    };
  }, [customerInstallmentCards, customerInstallmentPayments]);

  // ==========================================
  // 4. INVESTOR PORTFOLIO & LIABILITIES
  // ==========================================
  const investorStats = useMemo(() => {
    const cards = Array.isArray(investmentCards) ? investmentCards : [];

    // Active running investments excluding internal admin reserves if any
    const activeInvestments = cards.filter(
      (c) => (c.status || "").toLowerCase() === "running"
    );

    const activeCapital = activeInvestments.reduce(
      (sum, c) => sum + (parseFloat(c.investment_amount) || 0),
      0
    );

    const totalInvestorCount = new Set(cards.map((c) => c.investor_id || c.user_id)).size;

    return {
      activeCardsCount: activeInvestments.length,
      totalInvestorCount,
      activeCapital,
    };
  }, [investmentCards]);

  // ==========================================
  // 5. SUPPLIER LIABILITIES (DUE)
  // ==========================================
  const supplierStats = useMemo(() => {
    const list = Array.isArray(supplierPayments) ? supplierPayments : [];
    const totalSupplierDue = list.reduce(
      (sum, item) => sum + (parseFloat(item.due) || 0),
      0
    );
    const totalSupplierPurchases = list.reduce(
      (sum, item) => sum + (parseFloat(item.total_amount) || 0),
      0
    );
    const totalSupplierPaid = list.reduce(
      (sum, item) => sum + (parseFloat(item.paid) || 0),
      0
    );

    return { totalSupplierDue, totalSupplierPurchases, totalSupplierPaid };
  }, [supplierPayments]);

  // ==========================================
  // 6. OVERALL BALANCE SHEET & NET EQUITY
  // ==========================================
  const balanceSheet = useMemo(() => {
    // Current Liquid & Tangible Assets
    const liquidCash = Math.max(0, cashStats.balance);
    const inventoryAsset = inventoryStats.availableStockValue;
    const customerReceivableAsset = customerStats.totalOutstandingReceivable;

    const totalCompanyAssets = liquidCash + inventoryAsset + customerReceivableAsset;

    // Liabilities (Debts to outside parties)
    const investorLiability = investorStats.activeCapital;
    const supplierLiability = supplierStats.totalSupplierDue;

    const totalLiabilities = investorLiability + supplierLiability;

    // Net Equity (Net Company Worth)
    const netCompanyEquity = totalCompanyAssets - totalLiabilities;

    // Solvency Health Score (0 - 100)
    let healthScore = 100;
    if (totalCompanyAssets > 0) {
      const ratio = totalCompanyAssets / Math.max(1, totalLiabilities);
      if (ratio >= 2.0) healthScore = 98;
      else if (ratio >= 1.5) healthScore = 90;
      else if (ratio >= 1.2) healthScore = 80;
      else if (ratio >= 1.0) healthScore = 70;
      else healthScore = Math.max(20, Math.round(ratio * 60));
    }

    return {
      liquidCash,
      inventoryAsset,
      customerReceivableAsset,
      totalCompanyAssets,
      investorLiability,
      supplierLiability,
      totalLiabilities,
      netCompanyEquity,
      healthScore,
    };
  }, [cashStats, inventoryStats, customerStats, investorStats, supplierStats]);

  const isLoading =
    isCustomerInstallmentsCardsLoading ||
    isCustomerInstallmentsPaymentsLoading ||
    isCashReportsLoading ||
    isStockMobilesLoading ||
    isSupplierPaymentsLoading;

  const isError =
    isCustomerInstallmentsCardsError &&
    isCustomerInstallmentsPaymentsError &&
    isCashReportsError;

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#050811]">
        <Loader />
      </div>
    );
  }

  if (isError) {
    return (
      <div>
        <ErrorPage />
      </div>
    );
  }

  // Chart data
  const assetChartData = [
    { name: "ক্যাশ ব্যালেন্স", value: balanceSheet.liquidCash, color: "#10b981" },
    { name: "মজুদ পণ্য (Stock)", value: balanceSheet.inventoryAsset, color: "#06b6d4" },
    { name: "কাস্টমার বাকি (Receivables)", value: balanceSheet.customerReceivableAsset, color: "#3b82f6" },
  ];

  const liabilityVsEquityData = [
    { name: "ইনভেস্টর দায়", value: balanceSheet.investorLiability, color: "#f59e0b" },
    { name: "সাপ্লায়ার বাকি", value: balanceSheet.supplierLiability, color: "#f43f5e" },
    { name: "নিট কোম্পানি মূলধন", value: Math.max(0, balanceSheet.netCompanyEquity), color: "#8b5cf6" },
  ];

  return (
    <div className="min-h-screen p-3 md:p-6 space-y-6 select-none">
      {/* Top Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-[#0B132B] to-slate-900 border border-slate-800 p-6 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-500 text-white shadow-xl shadow-emerald-500/25">
              <FaHeartbeat className="text-2xl md:text-3xl animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black text-white tracking-wide">
                  কোম্পানি হেলথ ও আর্থিক বিশ্লেষণ
                </h1>
                <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Real-time Solvency
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-400 mt-1">
                প্রতিষ্ঠানটির মোট সম্পদ, দেনা, ক্যাশ ইন-আউট, ইনভেন্টরি ভ্যালু এবং নিট ইক্যুইটি পর্যবেক্ষণ
              </p>
            </div>
          </div>

          {/* Quick Action Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefetchAll}
              title="সব ডাটা রিফ্রেশ করুন"
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-slate-300 hover:text-white transition shadow-sm text-xs font-bold"
            >
              <FaSyncAlt className="text-xs" />
              <span>রিফ্রেশ</span>
            </button>
          </div>
        </div>
      </div>

      {/* Health Score & Solvency Alert Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-slate-900/90 via-[#0a152d] to-slate-900/90 border border-slate-800/90 backdrop-blur-md shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/40 flex flex-col items-center justify-center shrink-0">
            <span className="text-xl font-black text-emerald-400 font-mono">
              {balanceSheet.healthScore}%
            </span>
            <span className="text-[9px] uppercase font-bold text-slate-400">Score</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping inline-block" />
              <h3 className="text-sm md:text-base font-bold text-white">
                {balanceSheet.healthScore >= 80
                  ? "আর্থিক সক্ষমতা অত্যন্ত শক্তিশালী ও নিরাপদ (Excellent Solvency)"
                  : balanceSheet.healthScore >= 50
                  ? "আর্থিক সক্ষমতা স্থিতিশীল (Stable Solvency)"
                  : "দায়-দেনার চাপ বিদ্যমান (Requires Attention)"}
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              প্রতিষ্ঠানটির মোট কার্যকরী সম্পদ দায়-দেনার চেয়ে{" "}
              <span className="text-emerald-400 font-bold font-mono">
                ৳ {balanceSheet.netCompanyEquity.toLocaleString()}
              </span>{" "}
              উদ্বৃত্ত রয়েছে।
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="px-3.5 py-2 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Asset / Debt Ratio</span>
            <span className="text-xs font-black text-cyan-400 font-mono">
              {(balanceSheet.totalCompanyAssets / Math.max(1, balanceSheet.totalLiabilities)).toFixed(2)}x
            </span>
          </div>
          <div className="px-3.5 py-2 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Liquid Cash Ratio</span>
            <span className="text-xs font-black text-emerald-400 font-mono">
              {((balanceSheet.liquidCash / Math.max(1, balanceSheet.totalCompanyAssets)) * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* The Big 4 Pillars: Assets, Liabilities, Net Equity, & Profit */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Assets Card */}
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 backdrop-blur-md shadow-xl flex flex-col justify-between group hover:border-emerald-500/40 transition duration-300">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <FaWallet className="text-xl" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Assets
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              মোট কোম্পানি সম্পদ (Total Assets)
            </p>
            <h2 className="text-2xl md:text-3xl font-black text-emerald-400 font-mono mt-1">
              ৳ {balanceSheet.totalCompanyAssets.toLocaleString()}
            </h2>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <span>ক্যাশ</span> + <span>স্টক পণ্য</span> + <span>কাস্টমার কিস্তি পাওনা</span>
            </p>
          </div>
        </div>

        {/* Total Liabilities Card */}
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 backdrop-blur-md shadow-xl flex flex-col justify-between group hover:border-amber-500/40 transition duration-300">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <FaHandHoldingUsd className="text-xl" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Liabilities
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              মোট দায় ও দেনা (Total Liabilities)
            </p>
            <h2 className="text-2xl md:text-3xl font-black text-amber-400 font-mono mt-1">
              ৳ {balanceSheet.totalLiabilities.toLocaleString()}
            </h2>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <span>ইনভেস্টর মূলধন</span> + <span>সাপ্লায়ার বাকি</span>
            </p>
          </div>
        </div>

        {/* Net Company Equity */}
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 backdrop-blur-md shadow-xl flex flex-col justify-between group hover:border-indigo-500/40 transition duration-300">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <FaBalanceScale className="text-xl" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Net Equity
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              নিট কোম্পানির সম্পদ (Net Worth)
            </p>
            <h2 className="text-2xl md:text-3xl font-black text-indigo-300 font-mono mt-1">
              ৳ {balanceSheet.netCompanyEquity.toLocaleString()}
            </h2>
            <p className="text-[11px] text-slate-500 mt-1">
              (মোট সম্পদ − মোট দায় দেনা)
            </p>
          </div>
        </div>

        {/* Projected Gross Profit */}
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 backdrop-blur-md shadow-xl flex flex-col justify-between group hover:border-cyan-500/40 transition duration-300">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <FaChartLine className="text-xl" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Margin
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              সম্ভাব্য সেলস লাভ (Installment Margin)
            </p>
            <h2 className="text-2xl md:text-3xl font-black text-cyan-400 font-mono mt-1">
              ৳ {customerStats.projectedGrossProfit.toLocaleString()}
            </h2>
            <p className="text-[11px] text-slate-500 mt-1">
              কিস্তির মোট মূল্য − পণ্যের ক্রয়মূল্য
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto scrollbar-none">
        {[
          { id: "overview", label: "📊 সামগ্রিক বিশ্লেষণ (Overview)", icon: FaChartLine },
          { id: "assets", label: "💎 সম্পদ ও তারল্য (Assets)", icon: FaWallet },
          { id: "liabilities", label: "🤝 দায় ও ইনভেস্টর (Liabilities)", icon: FaHandHoldingUsd },
          { id: "cashflow", label: "💸 ক্যাশ ফ্লো ও ব্যয় (Cash Flow)", icon: FaMoneyCheckAlt },
          { id: "statement", label: "📑 ব্যালেন্স শিট টেবিল (Statement)", icon: FaFileInvoiceDollar },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                isSelected
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25"
                  : "bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700"
              }`}
            >
              <Icon className="text-xs" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & VISUAL CHARTS */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Chart: Asset Allocation Breakdown */}
            <div className="lg:col-span-6 p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <FaWallet className="text-emerald-400" />
                    <span>কোম্পানির সম্পদের অনুপাত (Asset Allocation)</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    মোট সম্পদ ৳ {balanceSheet.totalCompanyAssets.toLocaleString()} এর বিভাজন
                  </p>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={assetChartData} layout="vertical" margin={{ left: 10, right: 30, top: 10, bottom: 10 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={140} tickLine={false} />
                    <Tooltip
                      formatter={(val) => [`৳ ${Number(val).toLocaleString()}`, "পরিমাণ"]}
                      contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "1rem", color: "#fff", fontSize: "12px" }}
                    />
                    <Bar dataKey="value" radius={[0, 10, 10, 0]}>
                      {assetChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-800/80 text-center">
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                  <span className="text-[10px] text-emerald-400 font-bold block">ক্যাশ ব্যালেন্স</span>
                  <span className="text-xs font-black text-white font-mono">
                    ৳ {balanceSheet.liquidCash.toLocaleString()}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                  <span className="text-[10px] text-cyan-400 font-bold block">ইনভেন্টরি স্টক</span>
                  <span className="text-xs font-black text-white font-mono">
                    ৳ {balanceSheet.inventoryAsset.toLocaleString()}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                  <span className="text-[10px] text-blue-400 font-bold block">কাস্টমার বাকি</span>
                  <span className="text-xs font-black text-white font-mono">
                    ৳ {balanceSheet.customerReceivableAsset.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Chart: Liabilities vs Net Worth Distribution */}
            <div className="lg:col-span-6 p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <FaBalanceScale className="text-indigo-400" />
                    <span>দায় ও নিট মূলধন অনুপাত (Liabilities vs Equity)</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    মোট দায় ৳ {balanceSheet.totalLiabilities.toLocaleString()} বনাম নিট মূলধন
                  </p>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={liabilityVsEquityData} layout="vertical" margin={{ left: 10, right: 30, top: 10, bottom: 10 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={130} tickLine={false} />
                    <Tooltip
                      formatter={(val) => [`৳ ${Number(val).toLocaleString()}`, "পরিমাণ"]}
                      contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "1rem", color: "#fff", fontSize: "12px" }}
                    />
                    <Bar dataKey="value" radius={[0, 10, 10, 0]}>
                      {liabilityVsEquityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-800/80 text-center">
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                  <span className="text-[10px] text-amber-400 font-bold block">ইনভেস্টর দায়</span>
                  <span className="text-xs font-black text-white font-mono">
                    ৳ {balanceSheet.investorLiability.toLocaleString()}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                  <span className="text-[10px] text-rose-400 font-bold block">সাপ্লায়ার বাকি</span>
                  <span className="text-xs font-black text-white font-mono">
                    ৳ {balanceSheet.supplierLiability.toLocaleString()}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                  <span className="text-[10px] text-purple-400 font-bold block">নিট ইকুইটি</span>
                  <span className="text-xs font-black text-white font-mono">
                    ৳ {balanceSheet.netCompanyEquity.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ASSETS & LIQUIDITY */}
      {activeTab === "assets" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Available Cash Balance */}
          <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <FaWallet className="text-xl" />
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                Liquid Asset
              </span>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase">উপলব্ধ ক্যাশ ব্যালেন্স (Available Cash)</p>
              <h2 className="text-2xl font-black text-emerald-400 font-mono mt-1">
                ৳ {balanceSheet.liquidCash.toLocaleString()}
              </h2>
            </div>
            <div className="space-y-2 pt-3 border-t border-slate-800 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>অনুমোদিত মোট ক্যাশ ইন:</span>
                <span className="text-emerald-400 font-mono font-bold">৳ {cashStats.totalIn.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>অনুমোদিত মোট ক্যাশ আউট:</span>
                <span className="text-rose-400 font-mono font-bold">৳ {cashStats.totalOut.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Stock Inventory Value */}
          <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <FaBoxes className="text-xl" />
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300">
                Stock Asset
              </span>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase">মজুদ পণ্যের ক্রয়মূল্য (Available Stock)</p>
              <h2 className="text-2xl font-black text-cyan-400 font-mono mt-1">
                ৳ {inventoryStats.availableStockValue.toLocaleString()}
              </h2>
            </div>
            <div className="space-y-2 pt-3 border-t border-slate-800 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>মজুদ পণ্যের সংখ্যা:</span>
                <span className="text-white font-mono font-bold">{inventoryStats.availableCount} টি</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>সম্ভাব্য বিক্রয়মূল্য (MRP):</span>
                <span className="text-cyan-300 font-mono font-bold">৳ {inventoryStats.availableStockMRP.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Customer Receivables */}
          <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="p-3 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <FaFileInvoiceDollar className="text-xl" />
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300">
                Receivables
              </span>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase">কাস্টমার কিস্তি পাওনা (Total Due)</p>
              <h2 className="text-2xl font-black text-blue-400 font-mono mt-1">
                ৳ {customerStats.totalOutstandingReceivable.toLocaleString()}
              </h2>
            </div>
            <div className="space-y-2 pt-3 border-t border-slate-800 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>মোট কিস্তির চুক্তি মূল্য:</span>
                <span className="text-white font-mono font-bold">৳ {customerStats.totalContractValue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>আদায়কৃত কিস্তি ও ডাউনপেমেন্ট:</span>
                <span className="text-emerald-400 font-mono font-bold">৳ {customerStats.totalCollected.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LIABILITIES & INVESTORS */}
      {activeTab === "liabilities" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Active Investor Capital */}
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <FaUsers className="text-xl" />
              </span>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300">
                Investor Capital
              </span>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase">সক্রিয় ইনভেস্টর মূলধন (Active Investments)</p>
              <h2 className="text-3xl font-black text-amber-400 font-mono mt-1">
                ৳ {investorStats.activeCapital.toLocaleString()}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                মোট {investorStats.totalInvestorCount} জন ইনভেস্টরের {investorStats.activeCardsCount} টি রানিং শেয়ার মূলধন।
              </p>
            </div>
            <div className="space-y-2.5 pt-4 border-t border-slate-800 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>ইনভেস্টরদের মোট মূলধন প্রদান:</span>
                <span className="font-mono font-bold text-amber-400">৳ {cashStats.investorPayouts.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Supplier Due */}
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="p-3 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <FaHandHoldingUsd className="text-xl" />
              </span>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300">
                Supplier Debt
              </span>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase">সাপ্লায়ার / ডিলার বকেয়া (Supplier Due)</p>
              <h2 className="text-3xl font-black text-rose-400 font-mono mt-1">
                ৳ {supplierStats.totalSupplierDue.toLocaleString()}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                ডিলার ও সরবরাহকারীদের ক্রয়কৃত পণ্যের অপরিশোধিত মোট বিল।
              </p>
            </div>
            <div className="space-y-2.5 pt-4 border-t border-slate-800 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>মোট পণ্য ক্রয়ের বিল:</span>
                <span className="font-mono font-bold text-white">৳ {supplierStats.totalSupplierPurchases.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>সাপ্লায়ারদের পরিশোধিত ক্যাশ:</span>
                <span className="font-mono font-bold text-emerald-400">৳ {supplierStats.totalSupplierPaid.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CASH FLOW & EXPENSES */}
      {activeTab === "cashflow" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl">
            <span className="text-[10px] uppercase font-bold text-emerald-400">মোট ক্যাশ ইন (Inflow)</span>
            <h3 className="text-2xl font-black text-emerald-400 font-mono mt-1">
              ৳ {cashStats.totalIn.toLocaleString()}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">অনুমোদিত মোট জমা ক্যাশ</p>
          </div>

          <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl">
            <span className="text-[10px] uppercase font-bold text-rose-400">মোট ক্যাশ আউট (Outflow)</span>
            <h3 className="text-2xl font-black text-rose-400 font-mono mt-1">
              ৳ {cashStats.totalOut.toLocaleString()}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">পণ্য ক্রয়, খরচ ও পে-আউট</p>
          </div>

          <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl">
            <span className="text-[10px] uppercase font-bold text-amber-400">কোম্পানির খরচ (Expenses)</span>
            <h3 className="text-2xl font-black text-amber-400 font-mono mt-1">
              ৳ {cashStats.companyExpenses.toLocaleString()}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">অফিস পরিচালনা ও আনুষঙ্গিক ব্যয়</p>
          </div>

          <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl">
            <span className="text-[10px] uppercase font-bold text-cyan-400">ইনভেস্টর পে-আউট (Payouts)</span>
            <h3 className="text-2xl font-black text-cyan-400 font-mono mt-1">
              ৳ {cashStats.investorPayouts.toLocaleString()}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">ইনভেস্টরদের প্রদত্ত মূলধন ও লাভ</p>
          </div>
        </div>
      )}

      {/* TAB 5: BALANCE SHEET STATEMENT TABLE */}
      {activeTab === "statement" && (
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 backdrop-blur-md shadow-2xl overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FaFileInvoiceDollar className="text-cyan-400" />
                <span>কোম্পানি ব্যালেন্স শিট সারাংশ (Company Financial Statement)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                সম্পদ (Assets) এবং দায় (Liabilities) এর সমাপনী হিসাব বিবরণী
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/90 text-slate-400 uppercase font-bold border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">হিসাবের বিবরণ (Account Item)</th>
                  <th className="px-6 py-4">ক্যাটাগরি</th>
                  <th className="px-6 py-4 text-right">টাকার পরিমাণ (৳)</th>
                  <th className="px-6 py-4">মন্তব্য / সূত্র</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {/* Assets Section */}
                <tr className="bg-slate-950/40">
                  <td colSpan="4" className="px-6 py-2.5 text-xs font-bold text-emerald-400 uppercase font-sans">
                    ১. কোম্পানির মোট সম্পদ (Assets)
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-3 font-sans text-white font-bold">💵 ক্যাশ ব্যালেন্স (Cash in Hand)</td>
                  <td className="px-6 py-3 text-slate-400 font-sans">Liquid Cash</td>
                  <td className="px-6 py-3 text-right font-bold text-emerald-400">
                    ৳ {balanceSheet.liquidCash.toLocaleString()}
                  </td>
                  <td className="px-6 py-3 text-slate-500 font-sans text-[11px]">
                    অনুমোদিত ক্যাশ ইন − ক্যাশ আউট
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-3 font-sans text-white font-bold">📦 মজুদ পণ্য ভ্যালু (Stock Inventory)</td>
                  <td className="px-6 py-3 text-slate-400 font-sans">Tangible Assets</td>
                  <td className="px-6 py-3 text-right font-bold text-cyan-400">
                    ৳ {balanceSheet.inventoryAsset.toLocaleString()}
                  </td>
                  <td className="px-6 py-3 text-slate-500 font-sans text-[11px]">
                    বিদ্যমান সকল পণ্যের মোট ক্রয়মূল্য ({inventoryStats.availableCount} টি)
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-3 font-sans text-white font-bold">👥 কাস্টমার কিস্তি পাওনা (Installment Due)</td>
                  <td className="px-6 py-3 text-slate-400 font-sans">Accounts Receivable</td>
                  <td className="px-6 py-3 text-right font-bold text-blue-400">
                    ৳ {balanceSheet.customerReceivableAsset.toLocaleString()}
                  </td>
                  <td className="px-6 py-3 text-slate-500 font-sans text-[11px]">
                    মোট চুক্তিমূল্য − আদায়কৃত কিস্তি
                  </td>
                </tr>
                <tr className="bg-emerald-500/5 font-bold border-t border-b border-emerald-500/20">
                  <td className="px-6 py-3.5 text-emerald-400 font-sans uppercase">
                    মোট কোম্পানির কার্যকরী সম্পদ (Total Assets)
                  </td>
                  <td className="px-6 py-3.5 text-emerald-300 font-sans">Total Assets</td>
                  <td className="px-6 py-3.5 text-right font-black text-emerald-400 text-sm">
                    ৳ {balanceSheet.totalCompanyAssets.toLocaleString()}
                  </td>
                  <td className="px-6 py-3.5 text-emerald-400/80 font-sans text-[11px]">
                    ক্যাশ + ইনভেন্টরি + কাস্টমার বাকি
                  </td>
                </tr>

                {/* Liabilities Section */}
                <tr className="bg-slate-950/40">
                  <td colSpan="4" className="px-6 py-2.5 text-xs font-bold text-amber-400 uppercase font-sans">
                    ২. কোম্পানির মোট দায় ও ঋণ (Liabilities)
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-3 font-sans text-white font-bold">🤝 সক্রিয় বিনিয়োগকারী মূলধন</td>
                  <td className="px-6 py-3 text-slate-400 font-sans">Investor Capital</td>
                  <td className="px-6 py-3 text-right font-bold text-amber-400">
                    ৳ {balanceSheet.investorLiability.toLocaleString()}
                  </td>
                  <td className="px-6 py-3 text-slate-500 font-sans text-[11px]">
                    রানিং ইনভেস্টর কার্ডগুলোর সক্রিয় মূলধন
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-3 font-sans text-white font-bold">🏢 সরবরাহকারী / ডিলার বকেয়া</td>
                  <td className="px-6 py-3 text-slate-400 font-sans">Supplier Payables</td>
                  <td className="px-6 py-3 text-right font-bold text-rose-400">
                    ৳ {balanceSheet.supplierLiability.toLocaleString()}
                  </td>
                  <td className="px-6 py-3 text-slate-500 font-sans text-[11px]">
                    পণ্য ক্রয়ের অপরিশোধিত বকেয়া বিল
                  </td>
                </tr>
                <tr className="bg-amber-500/5 font-bold border-t border-b border-amber-500/20">
                  <td className="px-6 py-3.5 text-amber-400 font-sans uppercase">
                    মোট দায় ও দেনা (Total Liabilities)
                  </td>
                  <td className="px-6 py-3.5 text-amber-300 font-sans">Total Liabilities</td>
                  <td className="px-6 py-3.5 text-right font-black text-amber-400 text-sm">
                    ৳ {balanceSheet.totalLiabilities.toLocaleString()}
                  </td>
                  <td className="px-6 py-3.5 text-amber-400/80 font-sans text-[11px]">
                    ইনভেস্টর দায় + সাপ্লায়ার বাকি
                  </td>
                </tr>

                {/* Net Company Equity */}
                <tr className="bg-indigo-500/10 font-bold border-t-2 border-indigo-500/40">
                  <td className="px-6 py-4 text-indigo-300 font-sans text-sm uppercase">
                    💎 নিট কোম্পানির সম্পদ / ইক্যুইটি (Net Worth)
                  </td>
                  <td className="px-6 py-4 text-indigo-300 font-sans">Owner Equity</td>
                  <td className="px-6 py-4 text-right font-black text-indigo-300 text-base">
                    ৳ {balanceSheet.netCompanyEquity.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-indigo-300/80 font-sans text-xs">
                    মোট সম্পদ − মোট দায় (Net Surplus)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyHealth;
