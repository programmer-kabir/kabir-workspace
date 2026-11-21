import React from 'react';
import { Download, ShieldCheck, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950/80 text-slate-400 py-12">
      <div className="w-full max-w-[1700px] mx-auto px-6 sm:px-10 lg:px-16 2xl:px-24">
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-pink-500 flex items-center justify-center text-white font-bold">
              <Download className="w-4 h-4" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">
              StreamVault
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm">
            <a href="#downloader" className="hover:text-indigo-400 transition-colors">Downloader</a>
            <a href="#supported" className="hover:text-indigo-400 transition-colors">Supported Platforms</a>
            <a href="#how-it-works" className="hover:text-indigo-400 transition-colors">How It Works</a>
            <a href="#faq" className="hover:text-indigo-400 transition-colors">FAQ</a>
          </div>
        </div>

        {/* Legal Disclaimer */}
        <div className="pt-8 text-center text-xs text-slate-500 space-y-3 max-w-3xl mx-auto">
          <p className="flex items-center justify-center gap-1.5 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Fair Use & Copyright Policy</span>
          </p>
          <p>
            StreamVault is an independent web tool intended strictly for personal backup, education, and offline access to public content that users have authorized access to download. We do not host or store any media on our servers; all video streams are fetched directly from target content delivery networks. DRM-protected content is not supported.
          </p>
          <p className="text-slate-600 pt-2">
            © {new Date().getFullYear()} StreamVault. All rights reserved. Built with precision.
          </p>
        </div>

      </div>
    </footer>
  );
};
