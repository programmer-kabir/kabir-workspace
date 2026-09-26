/* eslint-disable react-refresh/only-export-components */
import { createBrowserRouter, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import Login from "../pages/Authencations/Login";
import NotFound from "../components/NotFound";

// Dashboard Components
import DashboardLayout from "../Layout/DashboardLayout";
import PrivateRoute from "./PrivetRoute";

const AuthorDashboard = lazy(() => import("../pages/Dashboard/AuthorDashboard/AuthorDashboard"));
const UploadFiles = lazy(() => import("../pages/Dashboard/AuthorDashboard/UploadFiles"));
const FilesPortfolio = lazy(() => import("../pages/Dashboard/AuthorDashboard/FilesPortfolio"));
const Earnings = lazy(() => import("../pages/Dashboard/AuthorDashboard/Earnings"));
const UnderReview = lazy(() => import("../pages/Dashboard/AuthorDashboard/UnderReview"));
const Rejected = lazy(() => import("../pages/Dashboard/AuthorDashboard/Rejected"));
const Published = lazy(() => import("../pages/Dashboard/AuthorDashboard/Published"));
const ExclusiveBuyout = lazy(() => import("../pages/Dashboard/AuthorDashboard/ExclusiveBuyout"));
const Account = lazy(() => import("../pages/Dashboard/AuthorDashboard/Account"));
const DownloadHistory = lazy(() => import("../pages/Dashboard/AuthorDashboard/DownloadHistory"));
const Settings = lazy(() => import("../pages/Dashboard/AuthorDashboard/Settings"));
const BillingInvoices = lazy(() => import("../pages/Dashboard/AuthorDashboard/BillingInvoices"));
const Verification = lazy(() => import("../pages/Dashboard/AuthorDashboard/Verification"));
const Support = lazy(() => import("../pages/Dashboard/AuthorDashboard/Support"));
const SupportTicket = lazy(() => import("../pages/Dashboard/AuthorDashboard/SupportTicket"));

// Add a simple loading fallback
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[50vh] bg-transparent">
    <div className="w-10 h-10 border-4 border-[#6C4FE0] border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const withSuspense = (Component) => (
  <Suspense fallback={<LoadingFallback />}>
    <Component />
  </Suspense>
);

const routes = createBrowserRouter([
  // Root → redirect to /dashboard
  {
    path: "/",
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/dashboard",
    element: (
      <PrivateRoute>
        <DashboardLayout />
      </PrivateRoute>
    ),
    errorElement: <NotFound />,
    children: [
      {
        path: "",
        element: withSuspense(AuthorDashboard),
      },
      {
        path: "files/upload",
        element: withSuspense(UploadFiles),
      },
      {
        path: "files/review",
        element: withSuspense(UnderReview),
      },
      {
        path: "files/rejected",
        element: withSuspense(Rejected),
      },
      {
        path: "files/published",
        element: withSuspense(Published),
      },
      {
        path: "files/exclusive-buyout",
        element: withSuspense(ExclusiveBuyout),
      },
      {
        path: "files",
        element: withSuspense(FilesPortfolio),
      },
      {
        path: "earnings",
        element: withSuspense(Earnings),
      },
      {
        path: "account",
        element: withSuspense(Account),
      },
      {
        path: "downloads",
        element: withSuspense(DownloadHistory),
      },
      {
        path: "settings",
        element: withSuspense(Settings),
      },
      {
        path: "billing-invoices",
        element: withSuspense(BillingInvoices),
      },
      {
        path: "verification",
        element: withSuspense(Verification),
      },
      {
        path: "support",
        element: withSuspense(Support),
      },
      {
        path: "support/:id",
        element: withSuspense(SupportTicket),
      },
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

export default routes;
