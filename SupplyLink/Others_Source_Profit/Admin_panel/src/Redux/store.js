import { configureStore } from "@reduxjs/toolkit";
import InvestmentProfitStatusSlice from "../Redux/Investors/ProfitAction/InvestmentProfitActionSlice";
import UsersSlice from "./Users/UsersSlice";
import investmentCardsSlice from "./Investors/InvestmentCards/investmentCardsSlice";
import InvestmentsProfitSlice from "../Redux/Investors/InvestmentsProfit/InvestmentsProfitSlice";
import customerInstallmentCardsSlice from "../Redux/Customers/InstallmentCards/InstallmentCardSlice";
import InvestInstallments from "../Redux/Investors/InvestmentPayments/investInstallments";
import customerInstallmentPaymentsSlice from "../Redux/Customers/InstallmentPayment/InstallmentPaymentSlice";
import companyExpensesSlice from "../Redux/Expenses/companyExpensesSlice";
import ProfitAnalyticsSlice from "../Redux/Profit/ProfitAnalytics/ProfitAnalyticsSlice";
import investorsProfitHistorySlice from "../Redux/Profit/ProfitHistory/investorsProfitHistorySlice";
import customerApplicationFromSlice from "../Redux/Applications/customerApplicationFromSlice";
import fetchInvestorWithdrawApplications from "../Redux/Applications/InvestorWithdrawApplicationFromSlice";
import CustomerGranterSlice from "../Redux/Customers/CustomerGranter/CustomerGranterSlice";
import profitAutoReinvestCardsSlice from "../Redux/AutoReinvest/profitAutoReinvestCardsSlice";
import profitAutoReinvestInstallmentsSlice from "../Redux/AutoReinvest/profitAutoReinvestInstallmentsSlice";
import CashDailyReportSlice from "../Redux/Cash/CashDailyReportSlice";
import CashMonthlyReportSlice from "../Redux/Cash/CashMonthlyReportSlice";
import CashYearlyReportSlice from "../Redux/Cash/CashYearlyReportSlice";
import MobileAnalyticsSlice from '../Redux/MobileInventory/MobileAnalyticsSlice'
import SupplierPaymentAnalyticsSlice from '../Redux/SupplierPayment/SupplierPaymentAnalyticsSlice'
import CashReportSlice from '../Redux/Cash/CashReporSlice'
import InstallmentFileSlice from '../Redux/InstallmentFiles/InstallmentFilesSlice'
const store = configureStore({
  reducer: {
    profitHistory: InvestmentProfitStatusSlice,
    users: UsersSlice,
    investmentCards: investmentCardsSlice,
    investProfit: InvestmentsProfitSlice,
    customerInstallmentCards: customerInstallmentCardsSlice,
    investInstallments: InvestInstallments,
    customerInstallmentPayments: customerInstallmentPaymentsSlice,
    companyExpenses: companyExpensesSlice,
    investorProfitHistory: investorsProfitHistorySlice,
    profitAnalytics: ProfitAnalyticsSlice,
    customerApplications: customerApplicationFromSlice,
    investorWithdrawApplications: fetchInvestorWithdrawApplications,
    CustomerGranter: CustomerGranterSlice,
    profitReinvestCards: profitAutoReinvestCardsSlice,
    profitReinvestInstallments: profitAutoReinvestInstallmentsSlice,
    DailyCashReports: CashDailyReportSlice,
    CashMonthlyReports: CashMonthlyReportSlice,
    CashYearlyReports: CashYearlyReportSlice,
    stockMobiles:MobileAnalyticsSlice,
    supplierPayments:SupplierPaymentAnalyticsSlice,
    CashReports:CashReportSlice,
    installmentFiles:InstallmentFileSlice
  },
});
export default store;
