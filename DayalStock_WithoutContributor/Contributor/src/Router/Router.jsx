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
const UnderReview = lazy(() => import("../pages/Dashboard/AuthorDashboard/UnderReview"));
const Rejected = lazy(() => import("../pages/Dashboard/AuthorDashboard/Rejected"));
const Published = lazy(() => import("../pages/Dashboard/AuthorDashboard/Published"));
const ExclusiveBuyout = lazy(() => import("../pages/Dashboard/AuthorDashboard/ExclusiveBuyout"));
const Account = lazy(() => import("../pages/Dashboard/AuthorDashboard/Account"));
const DownloadHistory = lazy(() => import("../pages/Dashboard/AuthorDashboard/DownloadHistory"));
const Settings = lazy(() => import("../pages/Dashboard/AuthorDashboard/Settings"));
const Support = lazy(() => import("../pages/Dashboard/AuthorDashboard/Support"));
const SupportTicket = lazy(() => import("../pages/Dashboard/AuthorDashboard/SupportTicket"));

import DayalLoader from "../components/Common/DayalLoader";

// Loading fallback
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[50vh] bg-transparent">
    <DayalLoader size="md" text="Loading studio module..." />
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
