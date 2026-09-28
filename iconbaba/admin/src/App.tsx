// admin/src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './components/AdminLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import IconsPage from './pages/IconsPage';
import IconUploadPage from './pages/IconUploadPage';
import IconEditPage from './pages/IconEditPage';
import CategoriesPage from './pages/CategoriesPage';
import UsersPage from './pages/UsersPage';
import FavoritesPage from './pages/FavoritesPage';
import CollectionsPage from './pages/CollectionsPage';
import DownloadsPage from './pages/DownloadsPage';
import ContentPagesPage from './pages/ContentPagesPage';
import PricingPage from './pages/PricingPage';
import BillingPage from './pages/BillingPage';
import FaqPage from './pages/FaqPage';
import ContactMessagesPage from './pages/ContactMessagesPage';
import AuditLogsPage from './pages/AuditLogsPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="icons" element={<IconsPage />} />
          <Route path="icons/upload" element={<IconUploadPage />} />
          <Route path="icons/edit/:id" element={<IconEditPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="billing" element={<BillingPage />} />
          <Route path="subscriptions" element={<Navigate to="/billing" replace />} />
          <Route path="payments" element={<Navigate to="/billing" replace />} />
          <Route path="favorites" element={<FavoritesPage />} />
          <Route path="collections" element={<CollectionsPage />} />
          <Route path="downloads" element={<DownloadsPage />} />
          <Route path="content-pages" element={<ContentPagesPage />} />
          <Route path="pricing" element={<PricingPage />} />
          <Route path="faq" element={<FaqPage />} />
          <Route path="contact-messages" element={<ContactMessagesPage />} />
          <Route path="audit-logs" element={<AuditLogsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
