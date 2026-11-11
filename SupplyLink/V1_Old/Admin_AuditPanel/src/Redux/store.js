import { configureStore } from "@reduxjs/toolkit";
import UsersSlice from "./Users/UsersSlice";
import companyExpensesSlice from "../Redux/Expenses/companyExpensesSlice";
import staffTaskSlice from "../Redux/Staff/Tasks/staffTaskSlice";
import staffTaskPointSlice from "../Redux/Staff/StaffPoints/staffTaskPointSlice";
import CustomerGranterSlice from "../Redux/Customers/CustomerGranter/CustomerGranterSlice";
import CashDailyReportSlice from "../Redux/Cash/CashDailyReportSlice";
import CashMonthlyReportSlice from "../Redux/Cash/CashMonthlyReportSlice";
import CashYearlyReportSlice from "../Redux/Cash/CashYearlyReportSlice";
import MobileAnalyticsSlice from '../Redux/MobileInventory/MobileAnalyticsSlice'
import SupplierPaymentAnalyticsSlice from '../Redux/SupplierPayment/SupplierPaymentAnalyticsSlice'
import CashReportSlice from '../Redux/Cash/CashReporSlice'
// 
import SalesCardSlice from '../Redux/Sales/SalesCardSlice'
import SalesItemsSlice from '../Redux/Sales/SalesItemsSlice'
import SalesPaymentsSlice from '../Redux/Sales/SalesPaymentsSlice'
import SupplierAnalyticsSlice from '../Redux/Supplier/SupplierAnalyticsSlice'

const store = configureStore({
  reducer: {
    users: UsersSlice,
    companyExpenses: companyExpensesSlice,
    staffTasks: staffTaskSlice,
    CustomerGranter: CustomerGranterSlice,
    staffTasksCreditPoints: staffTaskPointSlice,
    stockMobiles:MobileAnalyticsSlice,
    supplierPayments:SupplierPaymentAnalyticsSlice,
    CashReports:CashReportSlice,
    // 
    salesCards:SalesCardSlice,
    salesItems:SalesItemsSlice,
    salesPayments:SalesPaymentsSlice,
    suppliers:SupplierAnalyticsSlice
  },
});
export default store;
