import { createBrowserRouter, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";

// ---------- Eager imports (needed on first render) ----------
import DashboardLayout from "../Layout/DashboardLayout";
import PrivateRoute from "./PrivateRoute";

import DayalLoader from "../components/Common/DayalLoader";

// ---------- Loading Spinner Fallback ----------
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[50vh] bg-transparent">
    <DayalLoader size="md" text="Loading admin module..." />
  </div>
);

/** Helper – wraps a lazy component in Suspense */
const S = (LazyComponent) => (
  <Suspense fallback={<LoadingFallback />}>
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
const UploadFiles = lazy(() => import("../pages/ContentManagement/UploadFiles"));
const AllContents = lazy(() => import("../pages/ContentManagement/AllContents"));
const Published = lazy(() => import("../pages/ContentManagement/Published"));
const Rejected = lazy(() => import("../pages/ContentManagement/Rejected"));
const ExclusiveBuyout = lazy(() => import("../pages/ContentManagement/ExclusiveBuyout"));
const Collections = lazy(() => import("../pages/ContentManagement/Collections"));

// Users
const AllUsers = lazy(() => import("../pages/Users/AllUsers"));

// Categories & Tags
const Categories = lazy(() => import("../pages/Categories/Categories"));
const Tags = lazy(() => import("../pages/Tags/Tags"));

// Finance
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
const AIKeysManager = lazy(() => import("../pages/Settings/AIKeysManager"));

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
        path: "dashboard/upload",
        element: S(UploadFiles),
      },
      {
        path: "dashboard/content/upload",
        element: S(UploadFiles),
      },
      {
        path: "dashboard/allcontent",
        element: S(AllContents),
      },
      {
        path: "dashboard/content/published",
        element: S(AllContents),
      },
      {
        path: "dashboard/content/rejected",
        element: S(AllContents),
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
        path: "dashboard/categories",
        element: S(Categories),
      },
      {
        path: "dashboard/tags",
        element: S(Tags),
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
        path: "dashboard/settings/ai-keys",
        element: S(AIKeysManager),
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
