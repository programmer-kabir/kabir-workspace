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
  Check
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

  // Supported platform compatibility badges
  const supportedBadges = [
    { name: 'TikTok', tag: 'No Watermark', color: '#00F2FE', bg: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20' },
    { name: 'YouTube', tag: '1080p HD', color: '#FF0000', bg: 'bg-red-500/10 text-red-300 border-red-500/20' },
    { name: 'Instagram', tag: 'Reels & Audio', color: '#E1306C', bg: 'bg-pink-500/10 text-pink-300 border-pink-500/20' },
    { name: 'Facebook', tag: 'Watch & HD', color: '#1877F2', bg: 'bg-blue-500/10 text-blue-300 border-blue-500/20' },
    { name: 'Twitter / X', tag: 'MP4 Clips', color: '#1DA1F2', bg: 'bg-sky-500/10 text-sky-300 border-sky-500/20' },
    { name: 'Reddit', tag: 'With Sound', color: '#FF4500', bg: 'bg-orange-500/10 text-orange-300 border-orange-500/20' },
    { name: 'Pinterest', tag: 'Video Pins', color: '#E60023', bg: 'bg-rose-500/10 text-rose-300 border-rose-500/20' },
    { name: '1,500+ Sites', tag: 'Universal', color: '#8B5CF6', bg: 'bg-purple-500/10 text-purple-300 border-purple-500/20' }
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

  return (
    <section id="downloader" className="relative pt-12 pb-16 sm:pt-20 sm:pb-24 overflow-hidden">
      {/* Background glowing ambient beam spanning full widescreen */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1300px] h-[550px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/20 to-pink-500/10 blur-[160px] rounded-full pointer-events-none -z-10" />

      <div className="w-full max-w-[1650px] mx-auto px-4 sm:px-8 lg:px-16 text-center">
        
        {/* Top Feature Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs sm:text-sm font-semibold mb-6 shadow-inner backdrop-blur-md">
          <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
          <span>Universal Video Downloader • 1080p Full HD & MP3 Audio</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-4 sm:mb-6 leading-[1.12] max-w-5xl mx-auto">
          Download Any Video in <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
            Highest Quality & Speed
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg lg:text-xl text-slate-400 max-w-3xl mx-auto mb-8 sm:mb-12 leading-relaxed">
          Paste any public video link from <span className="text-slate-200 font-medium">TikTok, YouTube, Instagram Reels, Facebook, or Twitter</span>. Free, fast, and watermark-free.
        </p>

        {/* 🌟 Wide Prominent Downloader Input Console (Scaled for Widescreen) */}
        <div className="relative max-w-4xl lg:max-w-5xl xl:max-w-6xl w-full mx-auto mb-8">
          <div className="relative p-2.5 sm:p-3 rounded-2xl sm:rounded-3xl glass-panel shadow-2xl shadow-indigo-500/10 border border-slate-700/80 focus-within:border-indigo-500/80 focus-within:ring-4 focus-within:ring-indigo-500/20 transition-all duration-300">
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-2">
              
              {/* Left platform detector badge */}
              <div className="hidden sm:flex items-center pl-4 pr-1 text-slate-400">
                {platform && platform.id !== 'generic' ? (
                  <span 
                    className="px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold text-white shadow-sm flex items-center gap-1.5 transition-transform"
                    style={{ backgroundColor: platform.color }}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{platform.name}</span>
                  </span>
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-indigo-400">
                    <Video className="w-5 h-5" />
                  </div>
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
                className="w-full bg-transparent px-3 py-4 sm:py-4.5 text-slate-100 placeholder:text-slate-500 text-sm sm:text-base lg:text-lg outline-none focus:outline-none"
                disabled={isLoading}
              />

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end px-1 sm:px-0">
                {/* Clear button */}
                {url && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="p-2.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 transition-colors"
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
                  className="flex items-center gap-1.5 px-4 py-3 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700/70 rounded-xl sm:rounded-2xl transition-all"
                  title="Paste from clipboard"
                >
                  {copiedNotification ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400 font-semibold">Pasted!</span>
                    </>
                  ) : (
                    <>
                      <Clipboard className="w-4 h-4 text-indigo-400" />
                      <span>Paste</span>
                    </>
                  )}
                </button>

                {/* Download button */}
                <button
                  type="submit"
                  disabled={isLoading || !url.trim()}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 sm:px-10 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base text-white bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/25 transition-all duration-200 active:scale-95"
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
            </form>
          </div>
        </div>

        {/* 🌐 Clean Horizontal Supported Platforms Badge Row (Spanned naturally) */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 max-w-5xl xl:max-w-6xl mx-auto my-6">
          {supportedBadges.map((badge, idx) => (
            <span
              key={idx}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border backdrop-blur-md transition-all ${badge.bg}`}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: badge.color }} />
              <span>{badge.name}</span>
              <span className="opacity-70 text-[10px] font-normal">• {badge.tag}</span>
            </span>
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

        {/* ⚡ Clean Horizontal Feature Trust Row */}
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs sm:text-sm text-slate-400 mt-8 pt-6 border-t border-slate-800/60 max-w-4xl xl:max-w-5xl mx-auto">
          <span className="flex items-center gap-1.5 text-slate-300 font-medium">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Watermark-Free</span>
          </span>
          <span className="flex items-center gap-1.5 text-slate-300 font-medium">
            <Check className="w-4 h-4 text-indigo-400" />
            <span>1080p & 4K Quality</span>
          </span>
          <span className="flex items-center gap-1.5 text-slate-300 font-medium">
            <Check className="w-4 h-4 text-purple-400" />
            <span>320kbps MP3 Audio</span>
          </span>
          <span className="flex items-center gap-1.5 text-slate-300 font-medium">
            <Check className="w-4 h-4 text-pink-400" />
            <span>100% Free & Unlimited</span>
          </span>
        </div>

      </div>
    </section>
  );
};
