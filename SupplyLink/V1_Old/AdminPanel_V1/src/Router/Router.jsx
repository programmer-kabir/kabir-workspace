import { createBrowserRouter, Navigate } from "react-router-dom";
import MainLayout from "../Layout/MainLayout";
import Dashboard from "../Pages/Dashboard";
// import ProfitHistory from "../Pages/AdminDashboard/Investors_Profit/ProfitAnalytics";

import AdminLogin from "../Pages/Authencation/AdminLogin/AdminLogin";
import ProtectedRoute from "./ProtectedRoute";
import RoleProtectedRoute from "./RoleProtectedRoute";

import ErrorPage from "../Pages/ErrorPage";
import Assign_Tasks from "../Pages/Assign_Tasks";
import EmployerWorkSessions from "../Pages/shared/AdminMenagerDeveloper/EmployerWorkSessions/EmployerWorkSessions";
import AllUsers from "../Pages/shared/Users/AllUsers";
import Customers from "../Pages/shared/Customers/Customers";
import CustomerGuarantorAssignForm from "../Pages/shared/Users/CustomerGuarantorAssignForm";
import ProductPurchaseApplicationFrom from "../Pages/shared/AdminMenagerDeveloper/ApplicationFrom/ProductPurchaseApplicationFrom";
import InvestmentWithdrawFrom from "../Pages/shared/AdminMenagerDeveloper/ApplicationFrom/InvestmentWithdrawFrom";
import CustomerDetails from "../Pages/shared/Customers/CustomerDetails";
import CustomerCardDetails from "../Pages/shared/Customers/CustomerCardDetails";
import InstallmentCards from "../Pages/shared/Customers/InstallmentCards";
import MonthlyInstallmentOverview from "../Pages/shared/MonthlyInstallments/MonthlyInstallmentOverview";
import InvestmentCards from "../Pages/shared/Investors/InvestmentCards";
import InvestorDetails from "../Pages/shared/Investors/InvestorDetails";
import InvestorDetailsWithId from "../Pages/shared/Investors/InvestorDetailsWithId";
import CreateInvestmentCard from "../Pages/shared/Investors/CreateInvestmentCard";
import InvestmentPayments from "../Pages/shared/Investors/InvestmentPayments";
import UpComingCloseCard from "../Pages/shared/Investors/UpComingCloseCard";
import DailyInvestmentReports from "../Pages/shared/Investors/DailyInvestmentReports";
import MonthlyInvestmentReport from "../Pages/shared/Investors/MonthlyInvestmentReport";
import UpdateInstallmentCard from "../Pages/shared/Customers/UpdateInstallmentCard";
import ProductsSummery from "../Pages/shared/Products/ProductsSummery";
import SalesProducts from "../Pages/shared/SalesProducts/SalesProducts";
import CompanyExpenses from "../Pages/shared/CompanyExpenses/CompanyExpenses";
import AddRoles from "../Pages/shared/Users/AddRoles";
import AddUser from "../Pages/shared/Users/AddUser";
import InstallmentPayments from "../Pages/shared/Customers/InstallmentPayments";
import CreateInstallmentCards from "../Pages/shared/Customers/CreateInstallmentCards";
import InstallmentChart from "../Pages/shared/Customers/InstallmentChart";
import WithdrawAction from "../Pages/shared/AdminMenagerDeveloper/WithdrawAction/WithdrawAction";
import CardCloseHistory from "../Pages/shared/AdminMenagerDeveloper/Investors_Profit/CardCloseHistory";
import ProfitActionHistory from "../Pages/shared/Withdraw/ProfitActionHistory";
import Monthly_Profit_Distributor from "../Pages/shared/AdminMenagerDeveloper/Monthly_Profit_Distributor/Monthly_Profit_Distributor";
import All_profit_Distributor from "../Pages/shared/AdminMenagerDeveloper/Monthly_Profit_Distributor/All_profit_Distributor";
import StaffActivity from "../Pages/shared/Users/StaffActivity";
import EmployerAttendanceLogs from "../Pages/shared/AdminMenagerDeveloper/EmployerAttendanceLogs/EmployerAttendanceLogs";
import InvestmentWithdraw from "../Pages/shared/AdminMenagerDeveloper/ApplicationActions/InvestmentWithdraw";
import StaffReport from "../Pages/MenagerDashobard/ManagerReport/StaffReport";
import ReferencesUsers from "../Pages/MenagerDashobard/ReferencesUsers/ReferencesUsers";
import StaffViewReports from "../Pages/MenagerDashobard/ViewReport/StaffViewReports";
import Investors from "../Pages/shared/Investors/Investors";
import ProfitAnalytics from "../Pages/shared/AdminMenagerDeveloper/Investors_Profit/ProfitAnalytics";
import MonthlyInstallmentOverviews from "../Pages/shared/Customers/MonthlyInstallmentOverviews";
import MonthlyInstallmentReport from "../Pages/shared/Customers/MonthlyInstallmentReport";
import DailyInstallmentsUsers from "../Pages/shared/DailyInstallments/DailyInstallmentsUsers";
import DailyInstallmentsReports from "../Pages/shared/DailyInstallments/DailyInstallmentsReports";
import DailyInstallmentsUsersDetails from "../Pages/shared/DailyInstallments/DailyInstallmentsUsersDetails";
import DailyReport from "../components/cash/DailyReport";
import MonthlyReport from "../components/cash/MonthlyReport";
import YearlyReport from "../components/cash/YearlyReport";
import InventoryList from "../Pages/shared/MobileInventory/InventoryList";
import SupplierPayments from "../Pages/shared/MobileInventory/SupplierPayments";
import CashIn from "../Pages/shared/CashMenage/CashIn";
import CashReport from "../Pages/shared/CashMenage/CashReport";
import CashOut from "../Pages/shared/CashMenage/CashOut";
import CompanyProfit from "../Pages/shared/CompanyProfit/CompanyProfit";
import CashReportApproved from "../Pages/shared/CashMenage/CashReportApproved";
import FinanceOverview from "../Pages/shared/Finance/Finance_Overview/FinanceOverview";
import CompanyHealth from "../Pages/shared/Finance/CompanyHealth/CompanyHealth";
import InstallmentFiles from "../Pages/shared/InstallmentFiles/InstallmentFiles";
import AddNewInstallmentFiles from "../Pages/shared/InstallmentFiles/AddNewInstallmentFiles";
import DailyInstallmentReportPrint from "../Pages/shared/DailyInstallments/DailyInstallmentReportPrint";
import CashReportPrint from "../Pages/shared/CashMenage/CashReportPrint";
import DashboardReport from "../components/Dashboard/DashboardReport";
import DailyInstallmentsPaidReport from "../Pages/shared/DailyInstallments/DailyInstallmentsPaidReport";
import Account from "../Pages/shared/Account/Account";
import MonthlyOverviewsTest from "../Pages/shared/Customers/MonthlyOverviewsTest";

const routes = createBrowserRouter([
  {
    path: "/sign_in",
    element: <AdminLogin />,
  },
  { path: "/not-found", element: <ErrorPage /> },
  { path: "*", element: <Navigate to="/not-found" replace /> },
  {
    element: <ProtectedRoute />,
    errorElement: <ErrorPage />,
    children: [
      {
        element: <MainLayout />,
        children: [
          { path: "/", element: <Dashboard /> },
          { path: "/assign_task", element: <Assign_Tasks /> },
          {
            path: "staff/employer_work_record",
            element: <EmployerWorkSessions />,
          },
          { path: "/all_users", element: <AllUsers /> },

          { path: "/customers/all_customer", element: <Customers /> },
          {
            path: "/customers/customer_guarantor_assign",
            element: <CustomerGuarantorAssignForm />,
          },
          // {
          //   path: "/applications/product-purchase_request",
          //   element: <ProductPurchaseApplicationFrom />,
          // },

          {
            path: "/applications/invest_withdraw_request",
            element: <InvestmentWithdrawFrom />,
          },

          {
            path: "customers/all_customer/customer_details",
            element: <CustomerDetails />,
          },

          {
            path: "customers/installment_cards/card_Details",
            element: <CustomerCardDetails />,
          },
          {
            path: "/customers/installment_cards",
            element: <InstallmentCards />,
          },
          {
            path: "/customers/monthly_installment_overview",
            element: <MonthlyInstallmentOverview />,
          },

          { path: "/investors/all_investors", element: <Investors /> },
          { path: "/investors/investment_cards", element: <InvestmentCards /> },
          {
            path: "/investors/investment_cards/details",
            element: <InvestorDetails />,
          },
          { path: "/investors/details", element: <InvestorDetailsWithId /> },
          {
            path: "/investor/create_investment_card",
            element: <CreateInvestmentCard />,
          },
          {
            path: "/investors/investment_payments",
            element: <InvestmentPayments />,
          },
          {
            path: "/investors/upComingCloseCard",
            element: <UpComingCloseCard />,
          },
          {
            path: "/customers/monthly_installment_overviews",
            element: <MonthlyInstallmentOverviews />,
          },
          {
            path: "/customers/monthly_installment_overviews_test",
            element: <MonthlyOverviewsTest />,
          },

          {
            path: "/customers/monthly_installment_reports",
            element: <MonthlyInstallmentReport />,
          },
          {
            path: "/investors/daily_investment_reports",
            element: <DailyInvestmentReports />,
          },
          {
            path: "/investors/monthly_investment_reports",
            element: <MonthlyInvestmentReport />,
          },
          {
            path: "/UpdateInstallmentCard",
            element: <UpdateInstallmentCard />,
          },
          {
            path: "/products_summery",
            element: <ProductsSummery />,
          },
          {
            path: "products/sales_products",
            element: <SalesProducts />,
          },
          {
            path: "/company_expenses",
            element: <CompanyExpenses />,
          },
          {
            path: "/add_roles",
            element: <AddRoles />,
          },
          {
            path: "/finance/finance_overview",
            element: <FinanceOverview />,
          },
          {
            path: "/finance/company-health",
            element: <CompanyHealth />,
          },
          { path: "/add_user", element: <AddUser /> },
          {
            path: "/DailyInstallments/daily_installments_users",
            element: <DailyInstallmentsUsers />,
          },
          {
            path: "/DailyInstallments/daily_installments_PaidReport",
            element: <DailyInstallmentsPaidReport />,
          },
          {
            path: "/DailyInstallments/daily_installments_users/:id",
            element: <DailyInstallmentsUsersDetails />,
          },
          {
            path: "/DailyInstallments/daily_installments_reports",
            element: <DailyInstallmentsReports />,
          },
          {
            path: "/DailyInstallments/daily_installments_report_print",
            element: <DailyInstallmentReportPrint />,
          },
          {
            path: "/cash/cash_in",
            element: <CashIn />,
          },
          {
            path: "/cash/cash_out",
            element: <CashOut />,
          },
          {
            path: "/cash/cash-report-approval",
            element: <CashReportApproved />,
          },

          {
            path: "/cash/cash_reports",
            element: <CashReport />,
          },
          {
            path: "/cash/cash_reports_print",
            element: <CashReportPrint />,
          },
          {
            path: "/cash/daily_reports",
            element: <DailyReport />,
          },
          {
            path: "/cash/monthly_reports",
            element: <MonthlyReport />,
          },
          {
            path: "/cash/yearly_reports",
            element: <YearlyReport />,
          },
          {
            path: "/inventory/inventory_list",
            element: <InventoryList />,
          },
          {
            path: "/inventory/supplier_payments",
            element: <SupplierPayments />,
          },
          {
            path: "/staff/employer_attendance_logs",
            element: <EmployerAttendanceLogs />,
          },
          {
            path: "/today-report",
            element: <DashboardReport />,
          },
          // {
          //   path: "/account",
          //   element: <Account />,
          // },
          {
            element: (
              <RoleProtectedRoute allow={["admin", "developer", "manager","staff"]} />
            ),
            children: [
              {
                path: "/customers/Installment_payments/:cardId",
                element: <InstallmentPayments />,
              },
              {
                path: "/customers/create_installment_cards",
                element: <CreateInstallmentCards />,
              },

              {
                path: "/customer/create_installment_chart",
                element: <InstallmentChart />,
              },
              {
                path: "/profit/profit-analytics",
                element: <ProfitAnalytics />,
              },
              { path: "/profit/withdraw-action", element: <WithdrawAction /> },
              {
                path: "/profit/card-close-history",
                element: <CardCloseHistory />,
              },
              {
                path: "/profit/profit_action_history",
                element: <ProfitActionHistory />,
              },

              {
                path: "/profit/monthly_profit_distributor",
                element: <Monthly_Profit_Distributor />,
              },
              {
                path: "/profit/all_profit_distributor",
                element: <All_profit_Distributor />,
              },
              {
                path: "/staff/activity",
                element: <StaffActivity />,
              },

              // {
              //   path: "/applications/all_product-purchase",
              //   element: <ProductPurchaseApplication />,
              // },
              {
                path: "/applications/all_invest_withdraw",
                element: <InvestmentWithdraw />,
              },
              {
                path: "/installment_file_record",
                element: <InstallmentFiles />,
              },
              {
                path: "/add_installment_file",
                element: <AddNewInstallmentFiles />,
              },
            ],
          },
          {
            element: <RoleProtectedRoute allow={["manager", "developer"]} />,
            children: [
              {
                path: "/manager/staff_reports",
                element: <StaffReport />,
              },
              {
                path: "/manager/staff_reports/referred-users",
                element: <ReferencesUsers />,
              },
              {
                path: "/manager/staff_reports/view_reports",
                element: <StaffViewReports />,
              },
            ],
          },
          // Only Developer
          {
            element: <RoleProtectedRoute allow={["developer"]} />,
            children: [
              {
                path: "/developer/staff_activity",
                element: <StaffActivity />,
              },
            ],
          },
        ],
      },
    ],
  },
]);

export default routes;
