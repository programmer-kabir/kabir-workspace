// frontend/src/pages/HomePage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import SiteHeader from '@/components/header/SiteHeader';
import HomeHero from '@/components/hero/HomeHero';
import CuratedPacks from '@/components/packs/CuratedPacks';
import ControlsToolbar from '@/components/toolbar/ControlsToolbar';
import CategoryPillBar from '@/components/categories/CategoryPillBar';
import IconGrid from '@/components/grid/IconGrid';
import IconDetailDrawer from '@/components/drawer/IconDetailDrawer';
import AddToCollectionModal from '@/components/collections/AddToCollectionModal';
import SiteFooter from '@/components/footer/SiteFooter';
import { CategoryItem, IconItem, IconTier } from '@/types/icon';
import { getCategories, getIcons } from '@/lib/api';
import { useIconCustomization } from '@/context/IconCustomizationContext';

export default function HomePage() {
  const { style } = useIconCustomization();

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [totalIcons, setTotalIcons] = useState<number>(5148);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [tier, setTier] = useState<IconTier>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [icons, setIcons] = useState<IconItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalFiltered, setTotalFiltered] = useState<number>(0);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);

  const [selectedIcon, setSelectedIcon] = useState<IconItem | null>(null);
  const [collectionModalIcon, setCollectionModalIcon] = useState<IconItem | null>(null);

  // Load categories and live counts when style changes
  useEffect(() => {
    getCategories(style).then((res) => {
      if (res.success && res.data) {
        setCategories(res.data.categories);
        setTotalIcons(res.data.total_icons);
      }
    });
  }, [style]);

  // Fetch icons
  const loadIcons = useCallback(
    async (isPageAppend = false, targetPage = 1) => {
      if (!isPageAppend) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const res = await getIcons({
          category: selectedCategory === 'all' ? undefined : selectedCategory,
          style,
          tier,
          search: searchQuery.trim() || undefined,
          page: targetPage,
          limit: 48,
        });

        if (res.success && res.data) {
          if (isPageAppend) {
            setIcons((prev) => [...prev, ...res.data!.icons]);
          } else {
            setIcons(res.data.icons);
          }
          setTotalPages(res.data.pagination.total_pages);
          setTotalFiltered(res.data.pagination.total);
          setPage(targetPage);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [selectedCategory, style, tier, searchQuery]
  );

  // Trigger fetch when category, style, or search changes
  useEffect(() => {
    const timer = setTimeout(() => {
      loadIcons(false, 1);
    }, 150);

    return () => clearTimeout(timer);
  }, [loadIcons]);

  // Load more icons (pagination)
  const handleLoadMore = () => {
    if (page < totalPages && !loadingMore) {
      loadIcons(true, page + 1);
    }
  };

  const handleTagClick = (tag: string) => {
    setSearchQuery(tag);
    // Smooth scroll to catalog section
    const catalogEl = document.getElementById('catalog-section');
    if (catalogEl) {
      catalogEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#08090f] text-slate-900 dark:text-slate-100 transition-colors">
      {/* Site Header */}
      <SiteHeader />

      {/* Hero Showcase with Live Sandbox */}
      <HomeHero 
        onSelectTag={handleTagClick}
        totalIcons={totalIcons}
      />

      {/* Curated Packs Section */}
      <CuratedPacks 
        onSelectPack={(query) => {
          setSearchQuery(query);
          const catalogEl = document.getElementById('catalog-section');
          if (catalogEl) {
            catalogEl.scrollIntoView({ behavior: 'smooth' });
          }
        }}
      />

      {/* Catalog & Studio Section */}
      <section id="catalog-section" className="relative flex-1 flex flex-col">
        
        {/* Floating Glassmorphic Studio Dock */}
        <ControlsToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          totalIconsFound={totalFiltered}
          tier={tier}
          onTierChange={setTier}
        />

        {/* Horizontal Category Pill Bar */}
        <CategoryPillBar
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={(slug) => {
            setSelectedCategory(slug);
          }}
          totalIcons={totalIcons}
        />

        {/* Responsive Full-Width Icon Grid */}
        <main className="flex-1 min-h-[400px]">
          <IconGrid
            icons={icons}
            loading={loading}
            onSelectIcon={setSelectedIcon}
            hasMore={page < totalPages}
            onLoadMore={handleLoadMore}
            loadingMore={loadingMore}
          />
        </main>
      </section>

      {/* Icon Detail Drawer */}
      <IconDetailDrawer
        icon={selectedIcon}
        onClose={() => setSelectedIcon(null)}
        onOpenAddToCollection={(icon) => {
          setCollectionModalIcon(icon);
        }}
        onSelectIcon={(icon) => setSelectedIcon(icon)}
      />

      {/* Add to Collection Modal */}
      <AddToCollectionModal
        icon={collectionModalIcon}
        onClose={() => setCollectionModalIcon(null)}
      />

      {/* Global Site Footer */}
      <SiteFooter />
    </div>
  );
}
