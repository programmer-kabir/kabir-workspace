import React, { useState, useEffect } from 'react';
import { 
  Clipboard, 
  ArrowRight, 
  X, 
  Loader2, 
  CheckCircle2, 
  Video, 
  AlertCircle,
  Sparkles,
  Zap,
  ShieldCheck,
  Film,
  Flame
} from 'lucide-react';
import { detectLocalPlatform } from '../services/api';
import { PlatformInfo } from '../types';

interface HeroSectionProps {
  url: string;
  setUrl: (url: string) => void;
  onFetch: (urlToFetch?: string) => void;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  url,
  setUrl,
  onFetch,
  isLoading,
  error,
  clearError
}) => {
  const [platform, setPlatform] = useState<PlatformInfo | null>(null);
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Curated demo samples for 1-click instant testing
  const sampleLinks = [
    {
      label: 'YouTube (1080p HD)',
      platform: 'youtube',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      style: 'bg-red-500/10 text-red-300 border-red-500/20 hover:border-red-500/50 hover:bg-red-500/20 shadow-sm shadow-red-500/10',
      dotColor: '#EF4444'
    },
    {
      label: 'TikTok (No Watermark)',
      platform: 'tiktok',
      url: 'https://www.tiktok.com/@scout2015/video/6718335390845095173',
      style: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20 hover:border-cyan-500/50 hover:bg-cyan-500/20 shadow-sm shadow-cyan-500/10',
      dotColor: '#06B6D4'
    },
    {
      label: 'Instagram Reel',
      platform: 'instagram',
      url: 'https://www.instagram.com/reel/DOvzTywjPGN/',
      style: 'bg-pink-500/10 text-pink-300 border-pink-500/20 hover:border-pink-500/50 hover:bg-pink-500/20 shadow-sm shadow-pink-500/10',
      dotColor: '#EC4899'
    }
  ];

  useEffect(() => {
    if (url.trim()) {
      setPlatform(detectLocalPlatform(url));
    } else {
      setPlatform(null);
    }
  }, [url]);

  const handlePaste = async () => {
    try {
      clearError();
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text);
        setCopiedNotification(true);
        setTimeout(() => setCopiedNotification(false), 2000);
        if (text.startsWith('http://') || text.startsWith('https://')) {
          onFetch(text);
        }
      }
    } catch (err) {
      console.warn('Clipboard read permission denied or unsupported:', err);
    }
  };

  const handleClear = () => {
    setUrl('');
    clearError();
    setPlatform(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onFetch();
    }
  };

  const handleSampleClick = (sampleUrl: string) => {
    clearError();
    setUrl(sampleUrl);
    onFetch(sampleUrl);
  };

  return (
    <section id="downloader" className="relative pt-12 pb-16 sm:pt-20 sm:pb-24 overflow-hidden">
      {/* Background glowing ambient orbs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[380px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/20 to-pink-500/10 blur-[130px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        
        {/* Top Feature Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs sm:text-sm font-semibold mb-6 shadow-inner backdrop-blur-md">
          <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
          <span>Universal Video Downloader • 1080p Full HD & MP3 Audio</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
          Download Videos from <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
            Any Platform in Seconds
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto mb-8 leading-relaxed">
          Paste any public video link from <span className="text-slate-200 font-medium">TikTok, YouTube, Instagram Reels, Facebook, or Twitter</span>. Free, fast, and watermark-free.
        </p>

        {/* Search & URL Input Box */}
        <form onSubmit={handleSubmit} className="relative max-w-3xl mx-auto mb-4">
          <div className="relative flex flex-col sm:flex-row items-center p-2 rounded-2xl glass-panel shadow-2xl shadow-indigo-500/10 border border-slate-700/60 focus-within:border-indigo-500/80 focus-within:ring-4 focus-within:ring-indigo-500/20 transition-all duration-300">
            
            {/* Left Platform Detector or Icon */}
            <div className="hidden sm:flex items-center pl-3 pr-2 text-slate-400">
              {platform && platform.id !== 'generic' ? (
                <span 
                  className="px-2.5 py-1 rounded-lg text-xs font-bold text-white shadow-sm flex items-center gap-1.5 transition-transform"
                  style={{ backgroundColor: platform.color }}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {platform.badge}
                </span>
              ) : (
                <Video className="w-5 h-5 text-slate-400" />
              )}
            </div>

            {/* Input Field */}
            <input
              type="text"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (error) clearError();
              }}
              placeholder="Paste video URL here (e.g. https://www.tiktok.com/...)"
              className="w-full bg-transparent px-3 py-3.5 sm:py-3 text-slate-100 placeholder:text-slate-500 text-sm sm:text-base outline-none focus:outline-none"
              disabled={isLoading}
            />

            {/* Quick Action Buttons inside bar */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end px-2 sm:px-0">
              {/* Clear button */}
              {url && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors"
                  title="Clear link"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* Paste button */}
              <button
                type="button"
                onClick={handlePaste}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 rounded-xl transition-all"
                title="Paste from clipboard"
              >
                {copiedNotification ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">Pasted!</span>
                  </>
                ) : (
                  <>
                    <Clipboard className="w-4 h-4 text-indigo-400" />
                    <span>Paste</span>
                  </>
                )}
              </button>

              {/* Download / Fetch Button */}
              <button
                type="submit"
                disabled={isLoading || !url.trim()}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm sm:text-base text-white bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/25 transition-all duration-200 active:scale-95"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <span>Download</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* 🔥 1-Click Quick Test Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 my-5">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 pr-1">
            <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>Try Quick Sample:</span>
          </span>

          {sampleLinks.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSampleClick(sample.url)}
              disabled={isLoading}
              className={`group flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border backdrop-blur-md transition-all duration-200 hover:scale-105 active:scale-95 ${sample.style}`}
            >
              <span 
                className="w-1.5 h-1.5 rounded-full" 
                style={{ backgroundColor: sample.dotColor }} 
              />
              <span>{sample.label}</span>
              <Sparkles className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>

        {/* Error notification card */}
        {error && (
          <div className="max-w-2xl mx-auto mt-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-start gap-3 text-left animate-shake">
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-rose-200">Unable to process this link</p>
              <p className="text-rose-300/90 text-xs sm:text-sm mt-0.5">{error}</p>
            </div>
            <button 
              onClick={clearError} 
              className="text-rose-400 hover:text-rose-200 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Bottom trust line */}
        <p className="text-xs text-slate-500 mt-8">
          ✓ Non-DRM public media only &nbsp;•&nbsp; ✓ No extensions needed &nbsp;•&nbsp; ✓ 100% Free & Unlimited
        </p>

      </div>
    </section>
  );
};
