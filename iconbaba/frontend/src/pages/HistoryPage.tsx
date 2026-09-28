import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, History, Download, Sparkles } from 'lucide-react';
import SiteHeader from '@/components/header/SiteHeader';
import IconDetailDrawer from '@/components/drawer/IconDetailDrawer';
import { DownloadHistoryItem, IconItem } from '@/types/icon';
import { getDownloadHistory } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useIconCustomization } from '@/context/IconCustomizationContext';
import { applyCustomizationToSvg } from '@/lib/svg-utils';
import ProtectedCanvasPreview from '@/components/common/ProtectedCanvasPreview';

export default function HistoryPage() {
  const { user, setShowAuthModal, setAuthMode } = useAuth();
  const { customization, style } = useIconCustomization();

  const [history, setHistory] = useState<DownloadHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIcon, setSelectedIcon] = useState<IconItem | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    getDownloadHistory(style).then((res) => {
      if (res.success && res.data?.downloads) {
        setHistory(res.data.downloads);
      }
      setLoading(false);
    });
  }, [user, style]);

  return (
    <div className="min-h-screen flex flex-col bg-[#0d0e15]">
      <SiteHeader sidebarOpen={false} onToggleSidebar={() => {}} />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="size-4" />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                <History className="size-6 text-indigo-400" />
                Download History
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Your past icon downloads and exports
              </p>
            </div>
          </div>
        </div>

        {!user ? (
          <div className="text-center py-20 bg-[#141522] rounded-3xl border border-white/10 p-8">
            <div className="size-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 mx-auto mb-3">
              <Sparkles className="size-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Sign in to view download history</h3>
            <p className="text-xs text-slate-400 mb-4 max-w-xs mx-auto">
              Track and re-download icons you have exported in SVG or PNG format.
            </p>
            <button
              onClick={() => {
                setAuthMode('login');
                setShowAuthModal(true);
              }}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 shadow-md transition-all"
            >
              Sign In
            </button>
          </div>
        ) : loading ? (
          <div className="py-20 text-center text-xs text-slate-400">Loading history...</div>
        ) : history.length === 0 ? (
          <div className="text-center py-20 bg-[#141522] rounded-3xl border border-white/10 p-8">
            <p className="text-sm text-slate-400">No downloads recorded yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {history.map((item) => (
              <div
                key={item.download_id}
                onClick={() => setSelectedIcon(item.icon)}
                onContextMenu={(e) => e.preventDefault()}
                className="group aspect-square rounded-2xl p-3 flex flex-col items-center justify-center relative overflow-hidden cursor-pointer select-none bg-[#141522] border border-white/5 hover:border-purple-500/40 transition-all hover:shadow-xl"
              >
                <div
                  className="relative z-10 flex items-center justify-center mb-2 pointer-events-none"
                  style={{ width: '40px', height: '40px' }}
                >
                  <ProtectedCanvasPreview
                    svgContent={applyCustomizationToSvg(item.icon.svg, customization, style)}
                    size={40}
                  />
                </div>
                <span className="relative z-10 text-[11px] font-medium text-slate-300 truncate w-full text-center">
                  {item.icon.name}
                </span>
                <span className="relative z-10 text-[9px] uppercase font-bold text-purple-400 mt-1 flex items-center gap-1">
                  <Download className="size-2.5" />
                  {item.format} • {item.size}px
                </span>
              </div>
            ))}
          </div>
        )}
      </main>

      <IconDetailDrawer
        icon={selectedIcon}
        onClose={() => setSelectedIcon(null)}
        onOpenAddToCollection={() => {}}
        onSelectIcon={(icon) => setSelectedIcon(icon)}
      />
    </div>
  );
}
