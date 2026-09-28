import React, { useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import PricingPage from './pages/PricingPage';
import FaqPage from './pages/FaqPage';
import ContactPage from './pages/ContactPage';
import CollectionsPage from './pages/CollectionsPage';
import FavoritesPage from './pages/FavoritesPage';
import HistoryPage from './pages/HistoryPage';
import LicensesPage from './pages/LicensesPage';
import FreeLicensePage from './pages/FreeLicensePage';
import ProLicensePage from './pages/ProLicensePage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import RefundPolicyPage from './pages/RefundPolicyPage';
import TermsPage from './pages/TermsPage';
import BillingPage from './pages/BillingPage';
import IconPage from './pages/IconPage';
import AuthModal from './components/auth/AuthModal';
import WelcomeToast from './components/auth/WelcomeToast';
import RealtimeListener from './components/notifications/RealtimeListener';
import { useAuth } from './context/AuthContext';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default function App() {
  const { welcomePayload, clearWelcome } = useAuth();

  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/icon/:slug" element={<IconPage />} />
        <Route path="/icons/:slug" element={<IconPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/billing" element={<BillingPage />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/collections" element={<CollectionsPage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/licenses" element={<LicensesPage />} />
        <Route path="/licenses/free" element={<FreeLicensePage />} />
        <Route path="/licenses/pro" element={<ProLicensePage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/refund-policy" element={<RefundPolicyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {/* Global Auth Modal mounted at root for all pages */}
      <AuthModal />
      {/* Global Toast on successful login/register/logout */}
      {welcomePayload && (
        <WelcomeToast
          user={welcomePayload.user}
          type={welcomePayload.type}
          onClose={clearWelcome}
        />
      )}
      {/* Global Realtime Pusher Listener for Team Invites & Notifications */}
      <RealtimeListener />
    </>
  );
}
