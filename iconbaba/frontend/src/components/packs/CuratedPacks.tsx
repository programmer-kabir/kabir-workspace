// frontend/src/components/packs/CuratedPacks.tsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, Layers, Filter } from 'lucide-react';
import { getPacks } from '@/lib/api';
import { PackItem } from '@/types/icon';
import PackCard from '@/components/packs/PackCard';

interface CuratedPacksProps {
  onSelectPack?: (searchTerm: string) => void;
  selectedStyle?: string;
  onStyleChange?: (style: string) => void;
}

const STYLE_TABS = [
  { slug: 'all', label: 'All Styles' },
  { slug: 'flat', label: 'Flat Color' },
  { slug: 'gradient', label: 'Gradient' },
  { slug: 'lineal-color', label: 'Lineal Color' },
  { slug: 'outlined', label: 'Lineal' },
  { slug: 'filled', label: 'Solid' },
];

export default function CuratedPacks({ onSelectPack, selectedStyle = 'all', onStyleChange }: CuratedPacksProps) {
  const [packs, setPacks] = useState<PackItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeStyle, setActiveStyle] = useState<string>(selectedStyle);

  useEffect(() => {
    setActiveStyle(selectedStyle);
  }, [selectedStyle]);

  useEffect(() => {
    let isCancelled = false;
    async function fetchPacks() {
      setLoading(true);
      try {
        const res = await getPacks({
          limit: 8,
          sort: 'popular',
          style: activeStyle === 'all' ? undefined : activeStyle,
        });
        if (!isCancelled && res.success && res.data?.packs) {
          setPacks(res.data.packs);
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
  }, [activeStyle]);

  const handleTabClick = (slug: string) => {
    setActiveStyle(slug);
    onStyleChange?.(slug);
  };

  return (
    <section className="w-full py-12 px-4 sm:px-6 border-b border-slate-200/80 dark:border-white/5 transition-colors">
      <div className="max-w-7xl mx-auto">
        {/* Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-1">
              <Sparkles className="size-3.5" />
              <span>Curated Icon Packs</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Featured Vector Bundles
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              6-icon preview packs with complete multi-style coverage and 1-click ZIP export
            </p>
          </div>

          <Link
            to="/packs"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors group"
          >
            <span>View all packs</span>
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Style Filter Pills Bar (Flaticon Style) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
          {STYLE_TABS.map((tab) => {
            const isActive = activeStyle === tab.slug;
            return (
              <button
                key={tab.slug}
                onClick={() => handleTabClick(tab.slug)}
                className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25 ring-2 ring-purple-600/30'
                    : 'bg-white dark:bg-[#121322] border border-slate-200/90 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Packs Grid */}
        {loading ? (
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
          <div className="text-center py-12 rounded-2xl border border-dashed border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
            <Layers className="size-10 text-slate-400 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              No packs found for this style filter.
            </p>
            <button
              onClick={() => handleTabClick('all')}
              className="mt-3 text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline"
            >
              Reset to all styles
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {packs.map((pack) => (
              <PackCard key={pack.id} pack={pack} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
