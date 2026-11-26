// frontend/src/pages/PacksPage.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Sparkles, Filter, SlidersHorizontal, ArrowUpDown, X, Layers, PackageOpen } from 'lucide-react';
import SiteHeader from '@/components/header/SiteHeader';
import SiteFooter from '@/components/footer/SiteFooter';
import PackCard from '@/components/packs/PackCard';
import { getPacks, getCategories, getStyles } from '@/lib/api';
import { PackItem, CategoryItem, IconStyleMeta } from '@/types/icon';

export default function PacksPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const currentCategory = searchParams.get('category') || 'all';
  const currentStyle = searchParams.get('style') || 'all';
  const currentTier = (searchParams.get('tier') as 'all' | 'free' | 'pro') || 'all';
  const currentSort = (searchParams.get('sort') as 'popular' | 'recent' | 'name' | 'icons') || 'popular';
  const currentSearch = searchParams.get('search') || '';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  const [packs, setPacks] = useState<PackItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [styles, setStyles] = useState<IconStyleMeta[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [searchInputValue, setSearchInputValue] = useState<string>(currentSearch);

  // Sync search input with URL
  useEffect(() => {
    setSearchInputValue(currentSearch);
  }, [currentSearch]);

  // Load Categories & Styles
  useEffect(() => {
    async function loadMeta() {
      const [catsRes, stylesRes] = await Promise.all([getCategories(), getStyles()]);
      if (catsRes.success && catsRes.data?.categories) {
        setCategories(catsRes.data.categories);
      }
      if (stylesRes.success && stylesRes.data) {
        setStyles(stylesRes.data);
      }
    }
    loadMeta();
  }, []);

  // Fetch Packs
  useEffect(() => {
    let isCancelled = false;
    async function fetchPacks() {
      setLoading(true);
      try {
        const res = await getPacks({
          category: currentCategory !== 'all' ? currentCategory : undefined,
          style: currentStyle !== 'all' ? currentStyle : undefined,
          tier: currentTier !== 'all' ? currentTier : undefined,
          sort: currentSort,
          search: currentSearch || undefined,
          page: currentPage,
          limit: 24,
        });

        if (!isCancelled && res.success && res.data) {
          setPacks(res.data.packs);
          setTotalPages(res.data.pagination.total_pages);
          setTotalCount(res.data.pagination.total);
        }
      } catch (err) {
        console.error('Failed to load packs:', err);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    fetchPacks();
    return () => {
      isCancelled = true;
    };
  }, [currentCategory, currentStyle, currentTier, currentSort, currentSearch, currentPage]);

  const updateFilters = (updates: Record<string, string | null>) => {
    const nextParams = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === '' || value === 'all') {
        nextParams.delete(key);
      } else {
        nextParams.set(key, value);
      }
    }
    // Reset to page 1 on filter changes unless changing page directly
    if (!('page' in updates)) {
      nextParams.delete('page');
    }
    setSearchParams(nextParams);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: searchInputValue.trim() });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0d0e15] text-slate-800 dark:text-slate-100 transition-colors">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <div className="relative border-b border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#11121d] py-12 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 text-xs font-semibold uppercase tracking-wider mb-4">
              <Layers className="size-3.5" />
              <span>Flaticon Style Icon Sets</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              Curated Vector Icon Packs
            </h1>
            <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Download cohesive icon families crafted with pixel precision. Switch between Lineal, Solid, and Color styles or grab full ZIP packages in 1 click.
            </p>

            {/* Pack Search Bar */}
            <form onSubmit={handleSearchSubmit} className="mt-6 max-w-2xl mx-auto relative flex items-center">
              <Search className="absolute left-4 size-5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchInputValue}
                onChange={(e) => setSearchInputValue(e.target.value)}
                placeholder="Search packs by keyword (e.g. animals, business, interface)..."
                className="w-full pl-11 pr-24 py-3.5 rounded-2xl bg-slate-100/90 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 shadow-sm"
              />
              {searchInputValue && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInputValue('');
                    updateFilters({ search: null });
                  }}
                  className="absolute right-20 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="size-4" />
                </button>
              )}
              <button
                type="submit"
                className="absolute right-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-sm"
              >
                Search
              </button>
            </form>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="sticky top-16 z-30 bg-white/95 dark:bg-[#0d0e15]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-white/10 py-3.5 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Style Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              <button
                onClick={() => updateFilters({ style: 'all' })}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  currentStyle === 'all'
                    ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
                    : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
                }`}
              >
                All Styles
              </button>
              {styles.map((st) => (
                <button
                  key={st.slug}
                  onClick={() => updateFilters({ style: st.slug })}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    currentStyle === st.slug
                      ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
                      : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
                  }`}
                >
                  {st.name}
                </button>
              ))}
            </div>

            {/* Category, Tier & Sort Controls */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-between md:justify-end">
              {/* Category Dropdown */}
              <select
                value={currentCategory}
                onChange={(e) => updateFilters({ category: e.target.value })}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name} {c.pack_count ? `(${c.pack_count})` : ''}
                  </option>
                ))}
              </select>

              {/* Tier Filter */}
              <div className="flex items-center rounded-xl bg-slate-100 dark:bg-white/5 p-0.5 border border-slate-200 dark:border-white/10">
                {(['all', 'free', 'pro'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => updateFilters({ tier: t })}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                      currentTier === t
                        ? 'bg-white dark:bg-[#1a1c2e] text-purple-600 dark:text-purple-400 shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Sort Selector */}
              <select
                value={currentSort}
                onChange={(e) => updateFilters({ sort: e.target.value })}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="popular">Most Popular</option>
                <option value="recent">Newest Packs</option>
                <option value="name">Name (A-Z)</option>
                <option value="icons">Icon Count</option>
              </select>
            </div>
          </div>
        </div>

        {/* Packs Grid Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Packs Available</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300">
                {totalCount}
              </span>
            </h2>

            {currentSearch && (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Results for &quot;<strong className="text-slate-800 dark:text-slate-200">{currentSearch}</strong>&quot;
              </span>
            )}
          </div>

          {loading ? (
            /* Loading Skeletons */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={`skeleton-${i}`}
                  className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121322] p-4 animate-pulse"
                >
                  <div className="aspect-[3/2] bg-slate-100 dark:bg-white/5 rounded-xl mb-4" />
                  <div className="h-4 bg-slate-200 dark:bg-white/10 rounded w-2/3 mb-2" />
                  <div className="h-3 bg-slate-100 dark:bg-white/5 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : packs.length > 0 ? (
            /* Live Pack Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {packs.map((pack) => (
                <PackCard key={pack.id} pack={pack} />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="py-20 text-center max-w-md mx-auto">
              <div className="size-16 rounded-3xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto mb-4">
                <PackageOpen className="size-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                No matching icon packs found
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                Try clearing your search query or adjusting your style and category filters.
              </p>
              <button
                onClick={() => updateFilters({ search: null, category: null, style: null, tier: null })}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-sm"
              >
                Reset All Filters
              </button>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-12 flex items-center justify-center gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => updateFilters({ page: (currentPage - 1).toString() })}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-white/10"
              >
                Previous
              </button>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 px-3">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => updateFilters({ page: (currentPage + 1).toString() })}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-white/10"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
