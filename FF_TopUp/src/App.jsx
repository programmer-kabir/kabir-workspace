import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { NoticeTicker } from './components/NoticeTicker';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { TrustBadges } from './components/TrustBadges';
import { ProductCatalog } from './components/ProductCatalog';
import { HowToOrder } from './components/HowToOrder';
import { RecentOrdersFeed } from './components/RecentOrdersFeed';
import { CustomerReviews } from './components/CustomerReviews';
import { FaqAccordion } from './components/FaqAccordion';
import { LiveStatsCounter } from './components/LiveStatsCounter';
import { LivePurchasePopup } from './components/LivePurchasePopup';
import { Footer } from './components/Footer';
import { TopUpModal } from './components/TopUpModal';
import { WalletModal } from './components/WalletModal';
import { OrderReceiptModal } from './components/OrderReceiptModal';
import { OrderHistoryModal } from './components/OrderHistoryModal';
import { OrderTrackerModal } from './components/OrderTrackerModal';
import { LoginModal } from './components/LoginModal';
import { BottomMobileNav } from './components/BottomMobileNav';
import { ToastContainer } from './components/ToastContainer';
import { AdminLayout } from './layouts/AdminLayout';

function StoreLayout() {
  return (
    <div className="topup-app-root">
      {/* Toast Alert System */}
      <ToastContainer />

      {/* Real-time Notice Marquee */}
      <NoticeTicker />

      {/* Glassmorphic Navbar */}
      <Navbar />

      {/* Main App Container */}
      <main className="app-container">
        {/* Hero Banner Showcase */}
        <HeroBanner />

        {/* 4 Trust Highlights & Security Guarantees */}
        <TrustBadges />

        {/* Live Platform Stats & Social Proof Counters */}
        <LiveStatsCounter />

        {/* Product Catalog with Diamond Packs */}
        <ProductCatalog />

        {/* 3-Step How To Order */}
        <HowToOrder />

        {/* Live Orders Stream */}
        <RecentOrdersFeed />

        {/* Customer Reviews & Social Proof */}
        <CustomerReviews />

        {/* FAQ Accordion */}
        <FaqAccordion />
      </main>

      {/* App Footer & Floating WhatsApp */}
      <Footer />

      {/* Real-time Live Purchase Notification Toast (Social Proof) */}
      <LivePurchasePopup />

      {/* Bottom Mobile Navigation for Phone Gamers */}
      <BottomMobileNav />

      {/* Interactive Modals */}
      <LoginModal />
      <TopUpModal />
      <WalletModal />
      <OrderReceiptModal />
      <OrderHistoryModal />
      <OrderTrackerModal />
    </div>
  );
}

function MainAppRouter() {
  const { currentRoute } = useApp();

  if (currentRoute && currentRoute.startsWith('/admin')) {
    return (
      <div className="admin-app-root">
        <ToastContainer />
        <AdminLayout />
        <OrderReceiptModal />
      </div>
    );
  }

  return <StoreLayout />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <MainAppRouter />
      </AppProvider>
    </AuthProvider>
  );
}
