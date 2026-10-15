import { createBrowserRouter, Navigate } from "react-router-dom";
import MainLayout from "../Layout/MainLayout";
import Dashboard from "../Pages/Dashboard";

import AdminLogin from "../Pages/Authencation/AdminLogin/AdminLogin";
import ProtectedRoute from "./ProtectedRoute";
import RoleProtectedRoute from "./RoleProtectedRoute";

import ErrorPage from "../Pages/ErrorPage";
import Assign_Tasks from "../Pages/Assign_Tasks";
import EmployerWorkSessions from "../Pages/shared/AdminMenagerDeveloper/EmployerWorkSessions/EmployerWorkSessions";
import AllUsers from "../Pages/shared/Users/AllUsers";
import Customers from "../Pages/shared/Customers/Customers";
import CustomerGuarantorAssignForm from "../Pages/shared/Users/CustomerGuarantorAssignForm";
import CustomerDetails from "../Pages/shared/Customers/CustomerDetails";
import CustomerCardDetails from "../Pages/shared/Customers/CustomerCardDetails";
import MonthlyInstallmentOverview from "../Pages/shared/MonthlyInstallments/MonthlyInstallmentOverview";
import UpdateInstallmentCard from "../Pages/shared/Customers/UpdateInstallmentCard";
import CompanyExpenses from "../Pages/shared/CompanyExpenses/CompanyExpenses";
import AddRoles from "../Pages/shared/Users/AddRoles";
import FinanceOverview from "../Pages/shared/Finance Overview/FinanceOverview";
import AddUser from "../Pages/shared/Users/AddUser";
import InstallmentPayments from "../Pages/shared/Customers/InstallmentPayments";
import CreateInstallmentCards from "../Pages/shared/Customers/CreateInstallmentCards";
import InstallmentChart from "../Pages/shared/Customers/InstallmentChart";
import StaffActivity from "../Pages/shared/Users/StaffActivity";
import EmployerAttendanceLogs from "../Pages/shared/AdminMenagerDeveloper/EmployerAttendanceLogs/EmployerAttendanceLogs";
import StaffReport from "../Pages/MenagerDashobard/ManagerReport/StaffReport";
import ReferencesUsers from "../Pages/MenagerDashobard/ReferencesUsers/ReferencesUsers";
import StaffViewReports from "../Pages/MenagerDashobard/ViewReport/StaffViewReports";
import MonthlyInstallmentOverviews from "../Pages/shared/Customers/MonthlyInstallmentOverviews";
import MonthlyInstallmentReport from "../Pages/shared/Customers/MonthlyInstallmentReport";
import DailyInstallmentsUsers from "../Pages/shared/DailyInstallments/DailyInstallmentsUsers";
import DailyInstallmentsReports from "../Pages/shared/DailyInstallments/DailyInstallmentsReports";
import DailyInstallmentsUsersDetails from "../Pages/shared/DailyInstallments/DailyInstallmentsUsersDetails";
import SupplierPayments from "../Pages/shared/MobileInventory/SupplierPayments";
import CashIn from "../Pages/shared/CashMenage/CashIn";
import CashReport from "../Pages/shared/CashMenage/CashReport";
import CashOut from "../Pages/shared/CashMenage/CashOut";
import CompanyProfit from "../Pages/shared/CompanyProfit/CompanyProfit";
import SalesCards from "../Pages/shared/SalesCards/SalesCards";
import CreateSalesItem from "../Pages/shared/SalesItems/CreateSalesItems";
import SalesCardDetails from "../Pages/shared/SalesCards/SalesCardDetails";
import CreateSalesCards from "../Pages/shared/SalesCards/CreateSalesCards";
import SalesCardInvoicePrint from "../Pages/shared/SalesCards/SalesCardInvoicePrint";
import InventoryList from "../Pages/shared/MobileInventory/InventoryList";
import ProfitReport from "../Pages/shared/Profit/ProfitReport";
import ProductsSummery from "../Pages/shared/Products/ProductsSummery";


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

          { path: "/all_users", element: <AllUsers /> },

          { path: "/customers/all_customer", element: <Customers /> },
          {
            path: "/customers/customer_guarantor_assign",
            element: <CustomerGuarantorAssignForm />,
          },

          {
            path: "customers/all_customer/customer_details",
            element: <CustomerDetails />,
          },
          //new 
          {
            path: "/customers/sales_cards",
            element: <SalesCards />,
          },
          {
            path:"/customers/create_sales_items",
            element:<CreateSalesItem />
          },
                        {
                path: "/customers/create_sales_cards",
                element: <CreateSalesCards />,
              },
                        {
                path: "/customers/sales-card-invoices",
                element: <SalesCardInvoicePrint />,
              },

          // ses
          {
            path: "customers/installment_cards/card_Details",
            element: <SalesCardDetails />,
          },
          {
            path: "/customers/monthly_installment_overview",
            element: <MonthlyInstallmentOverview />,
          },

          {
            path: "/customers/monthly_installment_overviews",
            element: <MonthlyInstallmentOverviews />,
          },
          {
            path: "/customers/monthly_installment_reports",
            element: <MonthlyInstallmentReport />,
          },

          {
            path: "/UpdateInstallmentCard",
            element: <UpdateInstallmentCard />,
          },
          
          {
            path: "/company_expenses",
            element: <CompanyExpenses />,
          },
          {
            path: "/sales/sales_products_summary",
            element: <ProductsSummery />,
          },
          {
            path: "/profit_reports",
            element: <ProfitReport />,
          },
          {
            path: "/add_roles",
            element: <AddRoles />,
          },
          {
            path: "/finance_overview",
            element: <FinanceOverview />,
          },
          { path: "/add_user", element: <AddUser /> },
          {
            path: "/DailyInstallments/daily_installments_users",
            element: <DailyInstallmentsUsers />,
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
            path: "/cash/cash_in",
            element: <CashIn />,
          },
          {
            path: "/cash/cash_out",
            element: <CashOut />,
          },
          {
            path: "/cash/cash_reports",
            element: <CashReport />,
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
            element: (
              <RoleProtectedRoute allow={["admin", "developer", "manager"]} />
            ),
            children: [
              {
                path: "/customers/Installment_payments/:cardId",
                element: <InstallmentPayments />,
              },


              {
                path: "/customer/create_installment_chart",
                element: <InstallmentChart />,
              },

              {
                path: "/staff/activity",
                element: <StaffActivity />,
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
