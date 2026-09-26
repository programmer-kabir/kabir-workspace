import { createBrowserRouter, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";

// ---------- Eager imports (needed on first render) ----------
import DashboardLayout from "../Layout/DashboardLayout";
import PrivateRoute from "./PrivateRoute";

// ---------- Loading Spinner Fallback ----------
const PageLoader = () => (
  <div style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "60vh",
    width: "100%",
  }}>
    <div style={{
      width: "40px",
      height: "40px",
      border: "4px solid rgba(99, 102, 241, 0.2)",
      borderTop: "4px solid #6366f1",
      borderRadius: "50%",
      animation: "spin 0.8s linear infinite",
    }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

/** Helper – wraps a lazy component in Suspense */
const S = (LazyComponent) => (
  <Suspense fallback={<PageLoader />}>
    <LazyComponent />
  </Suspense>
);

// ---------- Lazy-loaded page components ----------
const Login = lazy(() => import("../pages/Authentications/Login"));
const NotFound = lazy(() => import("../components/NotFound"));

// Dashboards
const AdminDashboard = lazy(() => import("../pages/Dashboards/AdminDashboard"));
const Notifications = lazy(() => import("../pages/Dashboards/Notifications"));

// Content Management
const AllContents = lazy(() => import("../pages/ContentManagement/AllContents"));
const PendingReview = lazy(() => import("../pages/ContentManagement/PendingReview"));
const Published = lazy(() => import("../pages/ContentManagement/Published"));
const Rejected = lazy(() => import("../pages/ContentManagement/Rejected"));
const ExclusiveBuyout = lazy(() => import("../pages/ContentManagement/ExclusiveBuyout"));
const Collections = lazy(() => import("../pages/ContentManagement/Collections"));

// Users
const AllUsers = lazy(() => import("../pages/Users/AllUsers"));
const Contributors = lazy(() => import("../pages/Users/Contributors"));
const ContributorRequests = lazy(() => import("../pages/Users/ContributorRequests"));
const VerificationRequests = lazy(() => import("../pages/Users/VerificationRequests"));
const PaymentVerification = lazy(() => import("../pages/Users/PaymentVerification"));
const WithdrawalRequests = lazy(() => import("../pages/Users/WithdrawalRequests"));

// Author
const AuthorProfile = lazy(() => import("../pages/Author/AuthorProfile"));
const AuthorLimits = lazy(() => import("../pages/Author/AuthorLimits"));

// Categories & Tags
const Categories = lazy(() => import("../pages/Categories/Categories"));
const Tags = lazy(() => import("../pages/Tags/Tags"));

// Finance
const Payouts = lazy(() => import("../pages/Finance/Payouts"));
const CompanyEarnings = lazy(() => import("../pages/Finance/CompanyEarnings"));
const PaymentHistory = lazy(() => import("../pages/Finance/PaymentHistory"));
const BillingInvoices = lazy(() => import("../pages/Finance/BillingInvoices"));

// Reports
const ContentReports = lazy(() => import("../pages/Reports/ContentReports"));
const UserReports = lazy(() => import("../pages/Reports/UserReports"));
const EmailLogs = lazy(() => import("../pages/Reports/EmailLogs"));

// Settings
const Settings = lazy(() => import("../pages/Settings/Settings"));
const Testimonials = lazy(() => import("../pages/Settings/Testimonials"));
const SeoManagement = lazy(() => import("../pages/Settings/SeoManagement"));
const SystemHealth = lazy(() => import("../pages/Settings/SystemHealth"));

// Pages
const PagesList = lazy(() => import("../pages/Pages/PagesList"));
const PageEdit = lazy(() => import("../pages/Pages/PageEdit"));
const Faqs = lazy(() => import("../pages/Pages/Faqs"));

// Subscriptions & Credits
const SubscriptionPlans = lazy(() => import("../pages/Subscriptions/SubscriptionPlans"));
const CreditPackages = lazy(() => import("../pages/Credits/CreditPackages"));

// Support
const SupportTickets = lazy(() => import("../pages/Support/SupportTickets"));
const TicketConversation = lazy(() => import("../pages/Support/TicketConversation"));

// Account
const Account = lazy(() => import("../pages/Account/Account"));

// ---------- Routes ----------
const routes = createBrowserRouter([
  {
    path: "/login",
    element: S(Login),
  },

  {
    path: "/",
    element: <PrivateRoute><DashboardLayout /></PrivateRoute>,
    errorElement: S(NotFound),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: "dashboard",
        element: S(AdminDashboard),
      },
      {
        path: "dashboard/allcontent",
        element: S(AllContents),
      },
      {
        path: "dashboard/content/pending",
        element: S(PendingReview),
      },
      {
        path: "dashboard/content/published",
        element: S(Published),
      },
      {
        path: "dashboard/content/rejected",
        element: S(Rejected),
      },
      {
        path: "dashboard/content/exclusive-buyout",
        element: S(ExclusiveBuyout),
      },
      {
        path: "dashboard/allusers",
        element: S(AllUsers),
      },
      {
        path: "dashboard/users/contributors",
        element: S(Contributors),
      },
      {
        path: "dashboard/users/requests",
        element: S(ContributorRequests),
      },
      {
        path: "dashboard/users/author-limits",
        element: S(AuthorLimits),
      },
      {
        path: "dashboard/categories",
        element: S(Categories),
      },
      {
        path: "dashboard/tags",
        element: S(Tags),
      },
      {
        path: "dashboard/finance/payouts",
        element: S(Payouts),
      },
      {
        path: "dashboard/finance/company-earnings",
        element: S(CompanyEarnings),
      },
      {
        path: "dashboard/finance/payment-history",
        element: S(PaymentHistory),
      },
      {
        path: "dashboard/reports/content",
        element: S(ContentReports),
      },
      {
        path: "dashboard/reports/users",
        element: S(UserReports),
      },
      {
        path: "dashboard/reports/email-logs",
        element: S(EmailLogs),
      },
      {
        path: "dashboard/settings",
        element: S(Settings),
      },
      {
        path: "dashboard/pages",
        element: S(PagesList),
      },
      {
        path: "dashboard/pages/edit/:slug",
        element: S(PageEdit),
      },
      {
        path: "dashboard/account",
        element: S(Account),
      },
      {
        path: "dashboard/billing-invoices",
        element: S(BillingInvoices),
      },
      {
        path: "dashboard/author/:id",
        element: S(AuthorProfile),
      },
      {
        path: "dashboard/testimonials",
        element: S(Testimonials),
      },
      {
        path: "dashboard/subscriptions",
        element: S(SubscriptionPlans),
      },
      {
        path: "dashboard/credit-packages",
        element: S(CreditPackages),
      },
      {
        path: "dashboard/pages/faqs",
        element: S(Faqs),
      },
      {
        path: "dashboard/content/collections",
        element: S(Collections),
      },
      {
        path: "dashboard/users/verifications",
        element: S(VerificationRequests),
      },
      {
        path: "dashboard/users/payment-verifications",
        element: S(PaymentVerification),
      },
      {
        path: "dashboard/finance/withdrawals",
        element: S(WithdrawalRequests),
      },
      {
        path: "dashboard/notifications",
        element: S(Notifications),
      },
      {
        path: "dashboard/settings/seo",
        element: S(SeoManagement),
      },
      {
        path: "dashboard/support-tickets",
        element: S(SupportTickets),
      },
      {
        path: "dashboard/support-tickets/:id",
        element: S(TicketConversation),
      },
      {
        path: "dashboard/system-health",
        element: S(SystemHealth),
      }
    ],
  },
]);

export default routes;
