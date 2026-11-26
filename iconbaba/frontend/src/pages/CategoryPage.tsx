// frontend/src/pages/CategoryPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { 
  Layers, 
  Folder, 
  Sparkles, 
  ArrowLeft, 
  Filter, 
  PackageOpen, 
  Grid3X3, 
  Palette,
  ArrowRight
} from 'lucide-react';
import SiteHeader from '@/components/header/SiteHeader';
import SiteFooter from '@/components/footer/SiteFooter';
import PackCard from '@/components/packs/PackCard';
import IconGrid from '@/components/grid/IconGrid';
import IconDetailDrawer from '@/components/drawer/IconDetailDrawer';
import AddToCollectionModal from '@/components/collections/AddToCollectionModal';
import { getPacks, getCategories, getIcons } from '@/lib/api';
import { PackItem, CategoryItem, IconItem } from '@/types/icon';

const STYLE_TABS = [
  { slug: 'all', label: 'All Styles' },
  { slug: 'flat', label: 'Flat Color' },
  { slug: 'gradient', label: 'Gradient' },
  { slug: 'lineal-color', label: 'Lineal Color' },
  { slug: 'outlined', label: 'Lineal' },
  { slug: 'filled', label: 'Solid' },
];

export default function CategoryPage() {
  const { slug } = useParams<{ slug?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeStyle = searchParams.get('style') || 'all';
  const activeView = searchParams.get('view') || 'packs'; // 'packs' or 'icons'

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [currentCategory, setCurrentCategory] = useState<CategoryItem | null>(null);

  const [packs, setPacks] = useState<PackItem[]>([]);
  const [loadingPacks, setLoadingPacks] = useState<boolean>(true);

  // For individual icons view
  const [icons, setIcons] = useState<IconItem[]>([]);
  const [loadingIcons, setLoadingIcons] = useState<boolean>(false);
  const [selectedIcon, setSelectedIcon] = useState<IconItem | null>(null);
  const [collectionModalIcon, setCollectionModalIcon] = useState<IconItem | null>(null);

  // Fetch categories on mount
  useEffect(() => {
    async function loadMeta() {
      const res = await getCategories();
      if (res.success && res.data?.categories) {
        setCategories(res.data.categories);
        if (slug) {
          const match = res.data.categories.find(c => c.slug.toLowerCase() === slug.toLowerCase());
          if (match) {
            setCurrentCategory(match);
          }
        }
      }
    }
    loadMeta();
  }, [slug]);

  // Fetch packs for this category
  useEffect(() => {
    if (!slug) return;
    let isCancelled = false;
    async function fetchCategoryPacks() {
      setLoadingPacks(true);
      try {
        const res = await getPacks({
          category: slug,
          style: activeStyle === 'all' ? undefined : activeStyle,
          limit: 36,
        });
        if (!isCancelled && res.success && res.data?.packs) {
          setPacks(res.data.packs);
        }
      } catch (err) {
        console.error('Failed to load category packs:', err);
      } finally {
        if (!isCancelled) {
          setLoadingPacks(false);
        }
      }
    }
    fetchCategoryPacks();
    return () => {
      isCancelled = true;
    };
  }, [slug, activeStyle]);

  // Fetch individual icons if 'icons' view is selected
  useEffect(() => {
    if (!slug || activeView !== 'icons') return;
    let isCancelled = false;
    async function fetchCategoryIcons() {
      setLoadingIcons(true);
      try {
        const res = await getIcons({
          category: slug,
          style: (activeStyle === 'all' ? 'outlined' : activeStyle) as any,
          limit: 60,
        });
        if (!isCancelled && res.success && res.data?.icons) {
          setIcons(res.data.icons);
        }
      } catch (err) {
        console.error('Failed to load category icons:', err);
      } finally {
        if (!isCancelled) {
          setLoadingIcons(false);
        }
      }
    }
    fetchCategoryIcons();
    return () => {
      isCancelled = true;
    };
  }, [slug, activeView, activeStyle]);

  const setStyleFilter = (styleSlug: string) => {
    const next = new URLSearchParams(searchParams);
    if (styleSlug === 'all') {
      next.delete('style');
    } else {
      next.set('style', styleSlug);
    }
    setSearchParams(next);
  };

  const setViewMode = (mode: 'packs' | 'icons') => {
    const next = new URLSearchParams(searchParams);
    if (mode === 'packs') {
      next.delete('view');
    } else {
      next.set('view', mode);
    }
    setSearchParams(next);
  };

  // If no slug is specified, render the All Categories Directory
  if (!slug) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#08090f] text-slate-900 dark:text-slate-100 transition-colors">
        <SiteHeader />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-12">
          <div className="mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              Taxonomy Directory
            </span>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
              All Categories
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Browse icons organized by industry domains and curated packs
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((c) => (
              <Link
                key={c.id}
                to={`/category/${c.slug}`}
                className="group p-5 rounded-2xl bg-white dark:bg-[#121322] border border-slate-200/90 dark:border-white/10 hover:border-purple-400/60 dark:hover:border-purple-500/50 shadow-sm hover:shadow-xl hover:shadow-purple-500/10 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="size-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <Folder className="size-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    {c.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {c.pack_count || 0} packs • {c.icon_count || 0} icons
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-400">
                  <span>Explore</span>
                  <ArrowRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  // Category Single Page (Flaticon Style)
  const categoryName = currentCategory ? currentCategory.name : slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#08090f] text-slate-900 dark:text-slate-100 transition-colors">
      <SiteHeader />

      <main className="flex-1">
        {/* Category Hero Banner */}
        <div className="w-full bg-white dark:bg-[#0e0f18] border-b border-slate-200/90 dark:border-white/5 py-10 px-4 sm:px-6 transition-colors">
          <div className="max-w-7xl mx-auto">
            <Link
              to="/categories"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 mb-4 transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              <span>All Categories</span>
            </Link>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-1">
                  <Layers className="size-3.5" />
                  <span>Category Showcase</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {categoryName} Icons & Packs
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 max-w-2xl leading-relaxed">
                  Discover curated {categoryName.toLowerCase()} vector packs crafted in modern Flat Color, Gradient, Lineal, and Solid variants.
                </p>
              </div>

              {/* View Switcher: Packs vs Single Icons */}
              <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 shrink-0">
                <button
                  onClick={() => setViewMode('packs')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeView === 'packs'
                      ? 'bg-white dark:bg-[#1c1d2e] text-purple-600 dark:text-purple-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <PackageOpen className="size-4" />
                  <span>Curated Packs</span>
                  {packs.length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
                      {packs.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setViewMode('icons')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeView === 'icons'
                      ? 'bg-white dark:bg-[#1c1d2e] text-purple-600 dark:text-purple-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Grid3X3 className="size-4" />
                  <span>All Icons</span>
                </button>
              </div>
            </div>

            {/* Style Filter Bar */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 mt-6 scrollbar-none">
              {STYLE_TABS.map((st) => {
                const isActive = activeStyle === st.slug;
                return (
                  <button
                    key={st.slug}
                    onClick={() => setStyleFilter(st.slug)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-all shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-purple-600 text-white shadow-sm ring-2 ring-purple-600/30'
                        : 'bg-white dark:bg-[#141524] border border-slate-200/90 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'
                    }`}
                  >
                    {st.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          {activeView === 'packs' ? (
            /* Category Packs Grid */
            loadingPacks ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={`skel-p-${i}`}
                    className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121322] p-4 animate-pulse"
                  >
                    <div className="aspect-[3/2] bg-slate-100 dark:bg-white/5 rounded-xl mb-4" />
                    <div className="h-4 bg-slate-200 dark:bg-white/10 rounded w-2/3 mb-2" />
                    <div className="h-3 bg-slate-100 dark:bg-white/5 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : packs.length === 0 ? (
              <div className="text-center py-16 rounded-2xl border border-dashed border-slate-200 dark:border-white/10 bg-white/40 dark:bg-white/[0.02]">
                <PackageOpen className="size-12 text-slate-400 mx-auto mb-3 opacity-40" />
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                  No packs found in this style for {categoryName}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Try switching to "All Styles" or check other categories.
                </p>
                <button
                  onClick={() => setStyleFilter('all')}
                  className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 text-white hover:bg-purple-500 transition-colors cursor-pointer"
                >
                  Show All {categoryName} Packs
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {packs.map((pack) => (
                  <PackCard key={pack.id} pack={pack} />
                ))}
              </div>
            )
          ) : (
            /* Category Single Icons Grid */
            <div>
              <IconGrid
                icons={icons}
                loading={loadingIcons}
                onSelectIcon={setSelectedIcon}
                hasMore={false}
                onLoadMore={() => {}}
                loadingMore={false}
              />
            </div>
          )}
        </div>
      </main>

      {/* Single Icon Drawer */}
      <IconDetailDrawer
        icon={selectedIcon}
        onClose={() => setSelectedIcon(null)}
        onOpenAddToCollection={(icon) => setCollectionModalIcon(icon)}
        onSelectIcon={(icon) => setSelectedIcon(icon)}
      />

      {/* Add to Collection Modal */}
      <AddToCollectionModal
        icon={collectionModalIcon}
        onClose={() => setCollectionModalIcon(null)}
      />

      <SiteFooter />
    </div>
  );
}
