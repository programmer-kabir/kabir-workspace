import React, { useEffect, useState } from "react";
import StatCard from "../components/Dashboard/StatCard";
import ChartCard from "../components/Dashboard/ChartCard";
import { MONTHS } from "../../public/month";
import useDashboardData from "../utils/Hooks/dashboard/useDashboardData";
import { applyPreset, getChartData, sumBy } from "../utils/dashboardUtils";
import DashboardFilter from "../components/Dashboard/DashboardFilter";
import DashboardChart from "../components/Dashboard/DashboardChart";
import PendingInvestWithdraw from "../components/Dashboard/PendingInvestWithdraw";
import NextClosedCardProfit from "../components/Dashboard/NextClosedCardProfit";
import StateCardCopy from "../components/Dashboard/StateCardCopy";
import DashboardReport from "../components/Dashboard/DashboardReport";
import { Link } from "react-router-dom";
import { BarChart3, FileText, ArrowRight } from "lucide-react";

const Dashboard = () => {
  const [filterType, setFilterType] = useState("daily");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [activePreset, setActivePreset] = useState("");

  const {
    customerInstallmentCards,
    customerInstallmentPayments,
    investInstallments,
    companyExpenses,
    dailyInstallments,
    isLoading,
    isError,
    investorWithdrawApplications,
    withdrawApplicationsRefetch,
    users,
    roleStats = {},
    investorProfitHistory,
  } = useDashboardData();

  const currentYear = new Date().getFullYear();

  const yearOptions = Array.from(
    { length: currentYear - 2024 + 1 },
    (_, i) => currentYear - i,
  );
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    setSelectedDate(today);
  }, []);

  const matchDate = (itemDate) => {
    if (!itemDate) return false;
    const cleanDate = itemDate.split(" ")[0];

    if (filterType === "daily") {
      return cleanDate === (selectedDate || today);
    }

    if (filterType === "monthly" && selectedMonth) {
      return cleanDate.startsWith(selectedMonth);
    }

    if (filterType === "yearly" && selectedYear) {
      return cleanDate.startsWith(selectedYear);
    }

    return true;
  };

  const paymentsList = Array.isArray(customerInstallmentPayments)
    ? customerInstallmentPayments
    : [];
  const investmentsList = Array.isArray(investInstallments)
    ? investInstallments
    : [];
  const dailyInstallmentsList = Array.isArray(dailyInstallments)
    ? dailyInstallments
    : [];
  const withdrawAppsList = Array.isArray(investorWithdrawApplications)
    ? investorWithdrawApplications
    : [];
  const profitHistoryList = Array.isArray(investorProfitHistory)
    ? investorProfitHistory
    : [];
  const salesList = Array.isArray(customerInstallmentCards)
    ? customerInstallmentCards
    : [];
  const expensesList = Array.isArray(companyExpenses) ? companyExpenses : [];

  const filteredPayments = paymentsList.filter((p) => {
    const isPaid = p.status === "Paid";
    const isMatchedDate = matchDate(p.paid_date);
    return isPaid && isMatchedDate;
  });

  const filteredInvestments = investmentsList.filter(
    (i) => matchDate(i.investment_date) && Number(i.investment_card_no) !== 1,
  );

  const filteredDailyInstallments = dailyInstallmentsList.filter((d) =>
    matchDate(d.date),
  );
  const filterInvestmentReturn = withdrawAppsList.filter((c) =>
    matchDate(c.reviewed_at),
  );
  const filterProfitReturn = profitHistoryList.filter((c) =>
    matchDate(c.decision_at),
  );

  const filteredSales = salesList.filter((c) => matchDate(c.delivery_date));
  const filteredExpenses = expensesList.filter((c) =>
    matchDate(c.expense_date),
  );

  const totalSalesAmount = sumBy(filteredSales, "sale_price");
  const totalInstallmentAmount = sumBy(filteredPayments, "due_amount");
  const totalInvestmentAmount = sumBy(filteredInvestments, "amount");
  const totalExpenseAmount = sumBy(filteredExpenses, "amount");
  const totalDailyInstallmentAmount = sumBy(
    filteredDailyInstallments,
    "amount",
  );
  const totalInvestmentReturnAmount = sumBy(filterInvestmentReturn, "amount");
  const totalProfitReturnAmount = sumBy(filterProfitReturn, "amount");

  const chartConfig = (data, field, dateField) =>
    getChartData({
      data,
      field,
      dateField,
      startDate,
      endDate,
      activePreset,
      MONTHS,
    });

  const salesChart = chartConfig(salesList, "sale_price", "delivery_date");
  const installmentChart = chartConfig(paymentsList, "due_amount", "paid_date");
  const investmentChart = chartConfig(
    investmentsList.filter((i) => Number(i.investment_card_no) !== 1),
    "amount",
    "investment_date",
  );
  const dailyInstallmentChart = chartConfig(
    dailyInstallmentsList,
    "amount",
    "date",
  );
  const expenseChart = chartConfig(expensesList, "amount", "expense_date");

  const handlePreset = (type) => {
    const { startDate, endDate, activePreset } = applyPreset(type);
    setStartDate(startDate);
    setEndDate(endDate);
    setActivePreset(activePreset);
  };

  useEffect(() => {
    handlePreset("7d");
  }, []);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      {/* 🔹 Top User Role Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        <StateCardCopy title="Total Users" value={roleStats?.total || 0} />
        <StateCardCopy title="Customers" value={roleStats?.customer || 0} />
        <StateCardCopy title="Investors" value={roleStats?.investor || 0} />
        <StateCardCopy title="Staff" value={roleStats?.staff || 0} />
        <StateCardCopy title="Managers" value={roleStats?.manager || 0} />
        <StateCardCopy title="Admins" value={roleStats?.admin || 0} />
        <StateCardCopy title="Developers" value={roleStats?.developer || 0} />
      </div>

      {/* 🔹 Company Overview Analytics Container */}
      <div className="rounded-3xl border border-white/[0.08] bg-[#0c1426]/60 p-5 md:p-6 backdrop-blur-2xl shadow-xl relative overflow-hidden">
        {/* Top subtle highlight */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-inner">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                কোম্পানি সার্বিক বিশ্লেষণ (Company Overview)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                দৈনিক, মাসিক ও বাৎসরিক বিক্রয়, বিনিয়োগ ও ব্যয়ের লাইভ পরিসংখ্যান
              </p>
            </div>
          </div>

          <Link to="/today-report">
            <button className="btn-primary self-start sm:self-auto">
              <FileText className="h-4 w-4" />
              <span>আজকের রিপোর্ট (Today Report)</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </Link>
        </div>

        {/* Filter Toolbar */}
        <DashboardFilter
          filterType={filterType}
          setFilterType={setFilterType}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          yearOptions={yearOptions}
        />

        {/* Financial Stat Cards (7 Metrics) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3.5">
          <StatCard title="Total Sales" value={totalSalesAmount} />
          <StatCard title="Total Installments" value={totalInstallmentAmount} />
          <StatCard title="Total Investment" value={totalInvestmentAmount} />
          <StatCard
            title="Total Daily Installments"
            value={totalDailyInstallmentAmount}
          />
          <StatCard title="Total Company Expense" value={totalExpenseAmount} />
          <StatCard
            title="Total Investment Payable"
            value={totalInvestmentReturnAmount}
          />
          <StatCard
            title="Total Profit Payable"
            value={totalProfitReturnAmount}
          />
        </div>

        {/* Trends Charts */}
        <DashboardChart
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          handlePreset={handlePreset}
          salesChart={salesChart}
          installmentChart={installmentChart}
          investmentChart={investmentChart}
          dailyInstallmentChart={dailyInstallmentChart}
          expenseChart={expenseChart}
          activePreset={activePreset}
          setActivePreset={setActivePreset}
        />
      </div>

      {/* 🔹 Pending Withdraw Applications Table */}
      <PendingInvestWithdraw
        investorWithdrawApplications={investorWithdrawApplications}
        withdrawApplicationsRefetch={withdrawApplicationsRefetch}
      />

      {/* 🔹 Upcoming Maturity Cards Table */}
      <NextClosedCardProfit />
    </div>
  );
};

export default Dashboard;
