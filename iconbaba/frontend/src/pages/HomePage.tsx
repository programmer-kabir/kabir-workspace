// frontend/src/pages/HomePage.tsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Download, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  Layers, 
  ArrowRight, 
  Code2, 
  FileCheck
} from 'lucide-react';
import SiteHeader from '@/components/header/SiteHeader';
import HomeHero from '@/components/hero/HomeHero';
import CuratedPacks from '@/components/packs/CuratedPacks';
import CategoryCardsGrid from '@/components/categories/CategoryCardsGrid';
import StyleFamiliesShowcase from '@/components/styles/StyleFamiliesShowcase';
import IconDetailDrawer from '@/components/drawer/IconDetailDrawer';
import AddToCollectionModal from '@/components/collections/AddToCollectionModal';
import SiteFooter from '@/components/footer/SiteFooter';
import { CategoryItem, IconItem } from '@/types/icon';
import { getCategories } from '@/lib/api';

export default function HomePage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [totalIcons, setTotalIcons] = useState<number>(90);
  const [totalPacks, setTotalPacks] = useState<number>(7);
  const [loadingCategories, setLoadingCategories] = useState<boolean>(true);

  const [selectedStyle, setSelectedStyle] = useState<string>('all');
  const [selectedIcon, setSelectedIcon] = useState<IconItem | null>(null);
  const [collectionModalIcon, setCollectionModalIcon] = useState<IconItem | null>(null);

  // Load categories and live counts on mount
  useEffect(() => {
    let isCancelled = false;
    async function loadCategoryData() {
      try {
        const res = await getCategories('outlined');
        if (!isCancelled && res.success && res.data) {
          setCategories(res.data.categories);
          setTotalIcons(res.data.total_icons || 90);
          setTotalPacks(res.data.total_packs || 7);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      } finally {
        if (!isCancelled) {
          setLoadingCategories(false);
        }
      }
    }
    loadCategoryData();
    return () => {
      isCancelled = true;
    };
  }, []);

  const handleSearch = (term: string) => {
    navigate(`/packs?search=${encodeURIComponent(term)}`);
  };

  const handleSelectStyle = (styleSlug: string) => {
    setSelectedStyle(styleSlug);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#08090f] text-slate-900 dark:text-slate-100 transition-colors">
      {/* Site Header */}
      <SiteHeader />

      {/* Hero Showcase with Flaticon Quick Search */}
      <HomeHero 
        onSelectTag={handleSearch}
        totalIcons={totalIcons}
      />

      {/* Featured / Trending Curated Packs Section (Flaticon Pack Model) */}
      <CuratedPacks 
        selectedStyle={selectedStyle}
        onStyleChange={setSelectedStyle}
      />

      {/* Explore by Category Showcase (Clean Category Cards with Pack & Icon Counts) */}
      <CategoryCardsGrid 
        categories={categories}
        loading={loadingCategories}
      />

      {/* Explore by Design Style (Flat, Gradient, Lineal-Color, Lineal, Solid) */}
      <StyleFamiliesShowcase 
        onSelectStyle={handleSelectStyle}
      />

      {/* Prototyping & Developer Value Proposition Section */}
      <section className="w-full py-16 px-4 sm:px-6 bg-gradient-to-b from-white to-slate-100/80 dark:from-[#0b0c14] dark:to-[#08090f] border-b border-slate-200/80 dark:border-white/5 transition-colors">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40">
              Developer & Designer Ready
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-3">
              Everything You Need in One Vector Platform
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-2">
              Designed from the ground up for modern UI/UX design workflows and fast developer implementation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-[#121322] border border-slate-200/90 dark:border-white/10 shadow-sm flex flex-col items-start">
              <div className="size-12 rounded-xl bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4">
                <Download className="size-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">1-Click Full Pack ZIPs</h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                Download entire cohesive icon packs structured into clean style folders with official commercial license included.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-[#121322] border border-slate-200/90 dark:border-white/10 shadow-sm flex flex-col items-start">
              <div className="size-12 rounded-xl bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
                <Code2 className="size-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Clean SVG & React JSX</h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                Copy optimized SVGs with zero clutter or export clean React components directly into your clipboard.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-[#121322] border border-slate-200/90 dark:border-white/10 shadow-sm flex flex-col items-start">
              <div className="size-12 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                <Zap className="size-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Live Style Switching</h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                Instantly preview and convert entire icon collections across Flat, Gradient, Lineal, and Solid variants with zero reloads.
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link
              to="/packs"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:via-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-xl shadow-purple-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Sparkles className="size-4.5" />
              <span>Explore All {totalPacks} Packs</span>
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Icon Detail Drawer (if opened from preview) */}
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
