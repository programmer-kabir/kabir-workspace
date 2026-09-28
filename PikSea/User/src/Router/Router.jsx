import { createBrowserRouter, Navigate } from "react-router-dom";
import MainLayout from "../Layout/MainLayout";
import CategoryDispatcher from "../pages/CategoryDispatcher";
import HomePage from "../pages/HomePage";
import Login from "../pages/Authencations/Login";
import NotFound from "../components/NotFound";
import SearchPage from "../pages/SearchPage";
import PricingPage from "../pages/PricingPage";
import CheckoutPage from "../pages/CheckoutPage";
import SuccessPage from "../pages/SuccessPage";
import CollectionsDashboard from "../pages/AccountPages/CollectionsDashboard";
import SingleCollectionView from "../pages/AccountPages/SingleCollectionView";

// Static Pages
import AboutUs from "../pages/StaticPages/AboutUs";
import ContactUs from "../pages/StaticPages/ContactUs";
import FaqPage from "../pages/StaticPages/FaqPage";
import Licensing from "../pages/StaticPages/Licensing";
import PrivacyPolicy from "../pages/StaticPages/PrivacyPolicy";
import Terms from "../pages/StaticPages/Terms";
import Dmca from "../pages/StaticPages/Dmca";
import RefundPolicy from "../pages/StaticPages/RefundPolicy";
import AccountPage from "../pages/MemberPages/AccountPage";

const routes = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    errorElement: <NotFound />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/about-us", element: <AboutUs /> },
      { path: "/contact-us", element: <ContactUs /> },
      { path: "/faqs", element: <FaqPage /> },
      { path: "/licensing", element: <Licensing /> },
      { path: "/privacy-policy", element: <PrivacyPolicy /> },
      { path: "/terms-of-use", element: <Terms /> },
      { path: "/dmca", element: <Dmca /> },
      { path: "/refund-policy", element: <RefundPolicy /> },
      { path: "/login", element: <Login /> },
      { path: "/join-pro", element: <PricingPage /> },
      { path: "/checkout/:planId", element: <CheckoutPage /> },
      { path: "/success", element: <SuccessPage /> },
      { path: "/accounts", element: <AccountPage /> },
      { path: "/account/collections", element: <CollectionsDashboard /> },
      { path: "/account/collections/:id", element: <SingleCollectionView /> },
      { path: "/collection/:id", element: <SingleCollectionView /> },
      { path: "/search", element: <SearchPage /> },
      { path: "/:category", element: <HomePage /> },
      { path: "/:category/:slugOrSub", element: <CategoryDispatcher /> },
      // React Router level fallback 301 redirect
      { path: "/:category/content/:slug", element: <Navigate to="/:category/:slug" replace={true} /> },
    ],
  },
  { path: "/404", element: <NotFound /> },
  { path: "*", element: <NotFound /> },
]);
export default routes;
