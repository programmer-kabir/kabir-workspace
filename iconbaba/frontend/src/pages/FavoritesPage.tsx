import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Heart, Sparkles } from 'lucide-react';
import SiteHeader from '@/components/header/SiteHeader';
import IconGrid from '@/components/grid/IconGrid';
import IconDetailDrawer from '@/components/drawer/IconDetailDrawer';
import AddToCollectionModal from '@/components/collections/AddToCollectionModal';
import { IconItem } from '@/types/icon';
import { getFavorites } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useIconCustomization } from '@/context/IconCustomizationContext';

export default function FavoritesPage() {
  const { user, setShowAuthModal, setAuthMode } = useAuth();
  const { style } = useIconCustomization();

  const [favorites, setFavorites] = useState<IconItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIcon, setSelectedIcon] = useState<IconItem | null>(null);
  const [collectionModalIcon, setCollectionModalIcon] = useState<IconItem | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    getFavorites(style).then((res) => {
      if (res.success && res.data?.favorites) {
        setFavorites(res.data.favorites);
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
                <Heart className="size-6 text-pink-400 fill-pink-400" />
                My Favorite Icons
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {favorites.length} saved icons in your personal library
              </p>
            </div>
          </div>
        </div>

        {!user ? (
          <div className="text-center py-20 bg-[#141522] rounded-3xl border border-white/10 p-8">
            <div className="size-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 mx-auto mb-3">
              <Sparkles className="size-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Sign in to view favorites</h3>
            <p className="text-xs text-slate-400 mb-4 max-w-xs mx-auto">
              Log in with your IconBaba account to save and organize your favorite icons.
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
        ) : (
          <IconGrid
            icons={favorites}
            loading={loading}
            onSelectIcon={setSelectedIcon}
            hasMore={false}
            onLoadMore={() => {}}
            loadingMore={false}
          />
        )}
      </main>

      <IconDetailDrawer
        icon={selectedIcon}
        onClose={() => setSelectedIcon(null)}
        onOpenAddToCollection={(icon) => setCollectionModalIcon(icon)}
        onSelectIcon={(icon) => setSelectedIcon(icon)}
      />

      <AddToCollectionModal
        icon={collectionModalIcon}
        onClose={() => setCollectionModalIcon(null)}
      />
    </div>
  );
}
