import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { VideoCard } from './components/VideoCard';
import { LoadingSkeleton } from './components/LoadingSkeleton';
import { LiveStatsStrip } from './components/LiveStatsStrip';
import { SupportedSites } from './components/SupportedSites';
import { HowItWorks } from './components/HowItWorks';
import { Features } from './components/Features';
import { FAQSection } from './components/FAQSection';
import { Footer } from './components/Footer';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthModal } from './components/auth/AuthModal';
import { DashboardLayout } from './components/dashboard/DashboardLayout';
import { PricingSection } from './components/PricingSection';
import { AdminPaymentView } from './components/admin/AdminPaymentView';
import { extractVideo } from './services/api';
import { VideoMetadata } from './types';
import { ShieldCheck, ArrowLeft, LogOut, Download } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, logout } = useAuth();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [view, setView] = useState<'home' | 'dashboard' | 'admin'>(() => {
    const path = window.location.pathname;
    if (path === '/admin') return 'admin';
    if (path === '/dashboard') return 'dashboard';
    return 'home';
  });
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [videoData, setVideoData] = useState<VideoMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync theme class on html tag
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [theme]);

  // Sync URL history state
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/admin') setView('admin');
      else if (path === '/dashboard') setView('dashboard');
      else setView('home');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (newView: 'home' | 'dashboard' | 'admin') => {
    setView(newView);
    const targetPath = newView === 'admin' ? '/admin' : newView === 'dashboard' ? '/dashboard' : '/';
    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, '', targetPath);
    }
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAuthModalOpen(false);
      } else if (e.altKey && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        if (user) {
          navigateTo(view === 'home' ? 'dashboard' : 'home');
        } else {
          setAuthModalOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [view, user]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleFetch = async (urlToFetch?: string) => {
    const targetUrl = (urlToFetch || url).trim();
    if (!targetUrl) return;

    setIsLoading(true);
    setError(null);
    setVideoData(null);

    try {
      const data = await extractVideo(targetUrl);
      setVideoData(data);

      setTimeout(() => {
        const previewElement = document.getElementById('video-preview');
        if (previewElement) {
          previewElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(
        err.message ||
        'Could not fetch video info. Please make sure the video is public and the link is valid.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // If in admin view, enforce separate admin panel layout
  if (view === 'admin') {
    if (!user) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center space-y-4">
          <ShieldCheck className="w-16 h-16 text-indigo-500 animate-pulse" />
          <h1 className="text-2xl font-black text-white">StreamVault Administrator Portal</h1>
          <p className="text-sm text-slate-400 max-w-md">
            Administrative credentials required to access manual payment verification and system settings.
          </p>
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => navigateTo('home')}
              className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300"
            >
              Back to Home
            </button>
            <button
              onClick={() => setAuthModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-500/25"
            >
              Sign In as Admin
            </button>
          </div>
          <AuthModal
            isOpen={authModalOpen}
            onClose={() => setAuthModalOpen(false)}
            onSuccess={() => navigateTo('admin')}
          />
        </div>
      );
    }

    if (user.role !== 'admin') {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-2xl border border-rose-500/30">
            403
          </div>
          <h1 className="text-2xl font-black text-white">Access Denied</h1>
          <p className="text-sm text-slate-400 max-w-md">
            This private administrative area is restricted to system administrators only.
          </p>
          <button
            onClick={() => navigateTo('dashboard')}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
          >
            Return to User Dashboard
          </button>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        {/* Admin Header */}
        <header className="h-16 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-md">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-sm font-black text-white">StreamVault Admin Panel</span>
              <span className="block text-[10px] text-purple-400 font-semibold uppercase">Superadmin Session</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigateTo('dashboard')}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>User Workspace</span>
            </button>
            <button
              onClick={() => navigateTo('home')}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Public Site</span>
            </button>
            <button
              onClick={logout}
              className="px-3.5 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto flex-1">
          <AdminPaymentView />
        </main>
      </div>
    );
  }

  // If in dashboard view and authenticated, render User Dashboard Layout
  if (view === 'dashboard' && user) {
    return (
      <>
        <DashboardLayout
          onBackToHome={() => navigateTo('home')}
          theme={theme}
          toggleTheme={toggleTheme}
        />
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
        />
      </>
    );
  }

  // Otherwise, render Public Landing Page
  return (
    <div className="relative min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white transition-colors duration-300 overflow-x-hidden">
      
      {/* 🌌 Futuristic Background Mesh & Ambient Glow */}
      <div className="fixed inset-0 bg-grid-mesh pointer-events-none z-0 opacity-80" />
      <div className="fixed inset-0 bg-dot-pattern opacity-30 pointer-events-none z-0" />
      <div className="horizon-beam" />

      {/* Top Horizon Lighting Accent Line */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-indigo-500/60 to-transparent relative z-20" />

      {/* Top Navigation */}
      <div className="relative z-20">
        <Navbar
          theme={theme}
          toggleTheme={toggleTheme}
          onOpenAuth={() => setAuthModalOpen(true)}
          onOpenDashboard={() => navigateTo('dashboard')}
        />
      </div>

      {/* Main Content */}
      <main className="flex-1 relative z-10">
        {/* Hero & Input Section */}
        <HeroSection
          url={url}
          setUrl={setUrl}
          onFetch={handleFetch}
          isLoading={isLoading}
          error={error}
          clearError={() => setError(null)}
        />

        {/* Loading Indicator */}
        {isLoading && <LoadingSkeleton />}

        {/* Result Card */}
        {videoData && (
          <div id="video-preview">
            <VideoCard data={videoData} />
          </div>
        )}

        {/* ⚡ Live Stats / Trust Metrics Strip */}
        <LiveStatsStrip />

        {/* Platform Grid */}
        <SupportedSites />

        {/* 3-Step Guide */}
        <HowItWorks />

        {/* Feature Cards */}
        <Features />

        {/* 💳 Public Pricing & Plans Section */}
        <PricingSection onSelectPlan={() => (user ? navigateTo('dashboard') : setAuthModalOpen(true))} />

        {/* FAQ Accordion */}
        <FAQSection />
      </main>

      {/* Footer */}
      <Footer />

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => navigateTo('dashboard')}
      />

    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
