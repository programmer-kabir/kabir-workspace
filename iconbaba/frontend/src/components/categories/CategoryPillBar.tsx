// frontend/src/components/categories/CategoryPillBar.tsx
'use client';

import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Layers, Grid } from 'lucide-react';
import { CategoryItem } from '@/types/icon';

interface CategoryPillBarProps {
  categories: CategoryItem[];
  selectedCategory: string;
  onSelectCategory: (slug: string) => void;
  totalIcons: number;
  onOpenAllCategories?: () => void;
}

export default function CategoryPillBar({
  categories,
  selectedCategory,
  onSelectCategory,
  totalIcons,
  onOpenAllCategories,
}: CategoryPillBarProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const offset = direction === 'left' ? -250 : 250;
      scrollContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full bg-slate-50/90 dark:bg-[#0a0b14]/80 border-b border-slate-200 dark:border-white/5 py-2.5 px-4 sm:px-6 relative transition-colors">
      <div className=" mx-auto flex items-center gap-2">
        
        {/* Left Scroll Arrow */}
        <button
          onClick={() => handleScroll('left')}
          className="hidden sm:flex size-7 items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/5 transition-colors shrink-0"
          aria-label="Scroll left"
        >
          <ChevronLeft className="size-4" />
        </button>

        {/* Horizontal Category Scroll View */}
        <div
          ref={scrollContainerRef}
          className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1"
        >
          {/* 'All Icons' Pill */}
          <button
            onClick={() => onSelectCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/25 ring-1 ring-purple-400/50'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.03] dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/10'
            }`}
          >
            <Grid className="size-3.5" />
            <span>All Icons</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              selectedCategory === 'all' ? 'bg-black/30 text-purple-100' : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-400'
            }`}>
              {totalIcons.toLocaleString()}
            </span>
          </button>

          {/* Individual Categories */}
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.slug;

            return (
              <button
                key={cat.id || cat.slug}
                onClick={() => onSelectCategory(cat.slug)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 capitalize ${
                  isSelected
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/25 ring-1 ring-purple-400/50'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.03] dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/10'
                }`}
              >
                <span>{cat.name}</span>
                {cat.icon_count !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected ? 'bg-black/30 text-purple-100' : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-400'
                  }`}>
                    {cat.icon_count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right Scroll Arrow */}
        <button
          onClick={() => handleScroll('right')}
          className="hidden sm:flex size-7 items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/5 transition-colors shrink-0"
          aria-label="Scroll right"
        >
          <ChevronRight className="size-4" />
        </button>

        {/* All Categories Modal/Drawer Trigger */}
        {onOpenAllCategories && (
          <button
            onClick={onOpenAllCategories}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold shrink-0 transition-colors"
            title="Browse all categories"
          >
            <Layers className="size-3.5" />
            <span className="hidden sm:inline">Browse Categories</span>
          </button>
        )}

      </div>
    </div>
  );
}
