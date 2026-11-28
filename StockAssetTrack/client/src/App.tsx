import { useEffect, useState } from 'react';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Navbar } from './components/Navbar';
import { SavedDrawer } from './components/SavedDrawer';
import { AuthProvider } from './hooks/useAuth';
import { AuthPage } from './pages/AuthPage';
import { CalendarPage } from './pages/CalendarPage';
import { DashboardPage } from './pages/DashboardPage';
import { DeviceLimitPage } from './pages/DeviceLimitPage';
import { HeatmapPage } from './pages/HeatmapPage';
import { LandingPage } from './pages/LandingPage';
import { LegalPage } from './pages/LegalPage';
import { PricingPage } from './pages/PricingPage';
import { PromptEngineerPage } from './pages/PromptEngineerPage';
import { SearchPage } from './pages/SearchPage';
import { SimilarPage } from './pages/SimilarPage';
import { TagClusterPage } from './pages/TagClusterPage';
import { TrackerPage } from './pages/TrackerPage';
import { TrendingPage } from './pages/TrendingPage';
import { fetchHealth } from './services/api';
import type { HealthResponse } from './types/stock';

export default function App() {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('sat_theme') !== 'light';
  });
  const [savedOpen, setSavedOpen] = useState(false);
  const [health, setHealth] = useState<HealthResponse | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('sat_theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    let active = true;
    fetchHealth()
      .then((res) => {
        if (active) setHealth(res);
      })
      .catch(() => {
        if (active) setHealth(null);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
          <div className="bg-grid-mesh pointer-events-none fixed inset-0 z-0" />
          <Navbar
            darkMode={darkMode}
            onToggleTheme={() => setDarkMode((prev) => !prev)}
            onOpenSaved={() => setSavedOpen(true)}
            health={health}
          />

          <main className="relative z-10 flex-1">
            <Routes>
              <Route path="/" element={<LandingPage health={health} />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/trending" element={<TrendingPage />} />
              <Route path="/similar" element={<SimilarPage />} />
              <Route path="/tracker" element={<TrackerPage />} />
              <Route path="/heatmap" element={<HeatmapPage />} />
              <Route path="/tags" element={<TagClusterPage />} />
              <Route path="/prompts" element={<PromptEngineerPage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/auth/device-limit" element={<DeviceLimitPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/contact" element={<LegalPage kind="contact" />} />
              <Route path="/privacy" element={<LegalPage kind="privacy" />} />
              <Route path="/terms" element={<LegalPage kind="terms" />} />
              <Route path="/disclosure" element={<LegalPage kind="disclosure" />} />
              <Route path="/affiliate-disclosure" element={<LegalPage kind="disclosure" />} />
            </Routes>
          </main>

          <footer className="relative z-10 border-t border-slate-200/80 bg-white/70 py-8 text-xs text-slate-500 dark:border-slate-800/80 dark:bg-slate-950/80 dark:text-slate-400">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/70 pb-6 dark:border-slate-800/70">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white">StockAssetTrack</span>
                  <span>&copy; {new Date().getFullYear()} · Microstock Intelligence Platform</span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs">
                  {/* Adobe Review Submission: <Link to="/pricing" className="hover:text-brand-indigo transition">Pricing</Link> */}
                  <Link to="/contact" className="hover:text-brand-indigo transition">Contact &amp; Support</Link>
                  <Link to="/privacy" className="hover:text-brand-indigo transition">Privacy Policy</Link>
                  <Link to="/terms" className="hover:text-brand-indigo transition">Terms of Service</Link>
                  <Link to="/disclosure" className="hover:text-brand-indigo transition">Affiliate Disclosure</Link>
                  <Link to="/dashboard" className="hover:text-brand-indigo transition">Dashboard</Link>
                </div>
              </div>

              <div className="mt-5 space-y-2 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                <p>
                  <strong>Disclaimer:</strong> StockAssetTrack is an independent software-as-a-service platform for digital creators and is not affiliated with, sponsored by, authorized by, or endorsed by Adobe Inc. Adobe, Adobe Stock, and Creative Cloud are registered trademarks of Adobe Inc. in the United States and/or other countries.
                </p>
                <p>
                  <strong>Affiliate Disclosure:</strong> Some outbound links on this website pointing to Adobe Stock or partner platforms may be affiliate links. StockAssetTrack may earn an affiliate commission on qualifying purchases or subscriptions at no additional cost to you.
                </p>
              </div>
            </div>
          </footer>

          <SavedDrawer open={savedOpen} onClose={() => setSavedOpen(false)} />
          <Toaster richColors position="bottom-right" />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
