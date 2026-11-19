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
import { extractVideo } from './services/api';
import { VideoMetadata } from './types';

export const App: React.FC = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
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

      // Smooth scroll down to the video preview card
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

  return (
    <div className="relative min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white transition-colors duration-300 overflow-x-hidden">
      
      {/* 🌌 Futuristic Background Mesh & Ambient Glow (Linear / Vercel style) */}
      <div className="fixed inset-0 bg-grid-mesh pointer-events-none z-0 opacity-80" />
      <div className="fixed inset-0 bg-dot-pattern opacity-30 pointer-events-none z-0" />
      <div className="horizon-beam" />

      {/* Top Horizon Lighting Accent Line */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-indigo-500/60 to-transparent relative z-20" />

      {/* Top Navigation */}
      <div className="relative z-20">
        <Navbar theme={theme} toggleTheme={toggleTheme} />
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

        {/* FAQ Accordion */}
        <FAQSection />
      </main>

      {/* Footer */}
      <Footer />

    </div>
  );
};

export default App;
