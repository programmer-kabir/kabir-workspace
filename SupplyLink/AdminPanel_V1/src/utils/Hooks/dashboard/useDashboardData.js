import React, { useEffect, useState } from "react";
import useCustomerInstallmentCards from "../useCustomerInstallmentCards";
import useCustomerInstallmentPayments from "../Customers/useCustomerInstallmentPayments";
import useInvestInstallment from "../../Investors/useInvestInstallment";
import useCompanyExpenses from "../Expenses/useCompanyExpenses";
import useInvestorWithdrawApplications from "../../Investors/useInvestorWithdrawApplications";
import useUsers from "../useUsers";
import useProfitHistory from "../useProfitHistory";
import useCashReports from "../cash/useCashReports";

const useDashboardData = () => {
  const [dailyInstallments, setDailyInstallments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // 🔹 Custom hooks (already fetching data)
  const {
    customerInstallmentCards,
    isCustomerInstallmentsCardsLoading,
    isCustomerInstallmentsCardsError,
  } = useCustomerInstallmentCards();
  const { isUsersError, isUsersLoading, users } = useUsers();
  const {
    customerInstallmentPayments,
    isCustomerInstallmentsPaymentsLoading,
    isCustomerInstallmentsPaymentsError,
  } = useCustomerInstallmentPayments();

  const {
    investInstallments,
    inInvestInstallmentsLoading,
    isInvestInstallmentsError,
  } = useInvestInstallment();

    const {CashReports,isCashReportsError,isCashReportsLoading} = useCashReports()
    const companyExpenses = Array.isArray(CashReports)
  ? CashReports.filter(
      (cash) =>
        cash.type === "out" &&
        cash.approval_status === "approved" &&
        cash.source == "company-expense"
    )
  : [];
  const {
    investorWithdrawApplications,
    isInvestorWithdrawApplicationsError,
    isInvestorWithdrawApplicationsLoading,
    refetch: withdrawApplicationsRefetch,
  } = useInvestorWithdrawApplications();
  const {
    isInvestProfitHistoryLoading,
    investorProfitHistory,
    isInvestProfitHistoryError,
  } = useProfitHistory();
//   const today = new Intl.DateTimeFormat("en-CA", {
//   timeZone: "Asia/Dhaka",
// }).format(new Date());
const today = '2026-08-14'

const cashArray = Array.isArray(CashReports)
  ? CashReports
  : [];



const previousCashReports = Array.isArray(CashReports)
  ? CashReports.filter(
      (cash) =>
        cash.approval_status === "approved" &&
        cash.date?.split(" ")[0] < today
    )
  : [];

const openingCashIn = previousCashReports
  .filter((cash) => cash.type === "in")
  .reduce((sum, item) => sum + Number(item.amount || 0), 0);

const openingCashOut = previousCashReports
  .filter((cash) => cash.type === "out")
  .reduce((sum, item) => sum + Number(item.amount || 0), 0);

const openingCash = openingCashIn - openingCashOut;
  
  useEffect(() => {
    const fetchDailyInstallments = async () => {
      try {
        const res = await fetch(
          "https://app.supplylinkbd.com/apis/DailyInstallments/getDailyInstallments.php",
        );
        const data = await res.json();
        setDailyInstallments(data.data || []);
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchDailyInstallments();
  }, []);

  // 🔹 Combined loading state
  const isLoading =
    isCustomerInstallmentsCardsLoading ||
    isCustomerInstallmentsPaymentsLoading ||
    inInvestInstallmentsLoading ||
    isCashReportsLoading ||
    isInvestorWithdrawApplicationsLoading ||
    isUsersLoading || isInvestProfitHistoryLoading||
    loading;

  // 🔹 Combined error state
  const isError =
    isCustomerInstallmentsCardsError ||
    isCustomerInstallmentsPaymentsError ||
    isInvestInstallmentsError ||
    isCashReportsError ||
    isInvestorWithdrawApplicationsError ||
    isUsersError || isInvestProfitHistoryError|| 
    error;
  const roleStats = React.useMemo(() => {
    const stats = {
      total: 0,
      customer: 0,
      investor: 0,
      staff: 0,
      manager: 0,
      admin: 0,
      developer: 0,
    };

    if (!Array.isArray(users)) return stats;

    stats.total = users.length;

    users.forEach((u) => {
      const roles = Array.isArray(u.roles) ? u.roles : [];

      if (roles.includes("customer")) stats.customer++;
      if (roles.includes("investor")) stats.investor++;
      if (roles.includes("staff")) stats.staff++;
      if (roles.includes("manager")) stats.manager++;
      if (roles.includes("admin")) stats.admin++;
      if (roles.includes("developer")) stats.developer++;
    });

    return stats;
  }, [users]);
  return {
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
    roleStats,
    investorProfitHistory,
    openingCash
  };
};

export default useDashboardData;
