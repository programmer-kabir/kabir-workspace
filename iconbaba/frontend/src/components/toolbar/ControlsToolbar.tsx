// frontend/src/components/toolbar/ControlsToolbar.tsx
'use client';

import React, { useState } from 'react';
import {
  Search,
  X,
  Sliders,
  Palette,
  Copy,
  Lock,
  Layers,
  Sparkles,
  RotateCcw,
  Zap
} from 'lucide-react';
import { useIconCustomization } from '@/context/IconCustomizationContext';
import { useAuth } from '@/context/AuthContext';

interface ControlsToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalIconsFound: number;
  tier?: import('@/types/icon').IconTier;
  onTierChange?: (tier: import('@/types/icon').IconTier) => void;
}

const COLOR_PRESETS = [
  { label: 'Black', value: '#0f172a', bg: 'bg-slate-900 border border-slate-700' },
  { label: 'Violet', value: '#a855f7', bg: 'bg-purple-500' },
  { label: 'Cyan', value: '#06b6d4', bg: 'bg-cyan-500' },
  { label: 'Emerald', value: '#10b981', bg: 'bg-emerald-500' },
  { label: 'Rose', value: '#f43f5e', bg: 'bg-rose-500' },
  { label: 'Amber', value: '#f59e0b', bg: 'bg-amber-500' },
  { label: 'White', value: '#ffffff', bg: 'bg-white border border-slate-300 dark:border-white/40' },
];

const SIZE_PRESETS = [48, 64, 96, 128];
const STROKE_PRESETS = [2.0, 2.5, 3.5];

export default function ControlsToolbar({
  searchQuery,
  onSearchChange,
  totalIconsFound,
  tier = 'all',
  onTierChange,
}: ControlsToolbarProps) {
  const {
    customization,
    setSize,
    setColor,
    setStrokeWidth,
    style,
    setStyle,
    quickCopyMode,
    setQuickCopyMode,
    resetCustomization,
  } = useIconCustomization();
  const { user, setShowAuthModal, setAuthMode } = useAuth();

  return (
    <div className="w-full shrink-0 z-20 py-3 px-4 sm:px-6 bg-white/95 dark:bg-[#090a12]/95 backdrop-blur-xl border-b border-slate-200 dark:border-white/10 sticky top-16 shadow-sm dark:shadow-xl transition-colors">
      <div className="mx-auto flex flex-col md:flex-row items-center justify-between gap-3">

        {/* Left: Quick Search with Live Count */}
        <div className="relative flex-1 w-full min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-purple-600 dark:text-purple-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={`Search across ${totalIconsFound.toLocaleString()} vector icons...`}
            className="w-full h-11 pl-10 pr-24 rounded-2xl bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 shadow-sm transition-all"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {searchQuery ? (
              <button
                onClick={() => onSearchChange('')}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                title="Clear search"
              >
                <X className="size-3.5" />
              </button>
            ) : (
              <span className="hidden sm:inline-block text-[11px] font-mono px-2 py-0.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-semibold border border-purple-200/80 dark:border-purple-500/30">
                {totalIconsFound.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* Right: Floating Glassmorphic Studio Dock Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-between md:justify-end">

          {/* Tier Selector: All / Free / 👑 Pro */}
          {onTierChange && (
            <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 shadow-sm">
              <button
                onClick={() => onTierChange('all')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${tier === 'all'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/5'
                  }`}
              >
                All
              </button>
              <button
                onClick={() => onTierChange('free')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${tier === 'free'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/5'
                  }`}
              >
                Free
              </button>
              <button
                onClick={() => onTierChange('pro')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${tier === 'pro'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-50/60 dark:hover:bg-amber-500/10'
                  }`}
                title="Pro premium icons only"
              >
                <span>👑</span>
                <span>Pro</span>
              </button>
            </div>
          )}

          {/* Style Selector: Outline / Filled */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 shadow-sm">
            <button
              onClick={() => setStyle('outlined')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${style === 'outlined'
                ? 'bg-purple-600 text-white shadow'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/5'
                }`}
            >
              Outline
            </button>
            <button
              onClick={() => setStyle('filled')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${style === 'filled'
                ? 'bg-purple-600 text-white shadow'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/5'
                }`}
              title="Filled vector shapes"
            >
              Filled
            </button>
          </div>

          {/* Color Palette Swatches */}
          <div className="flex items-center gap-1.5 p-1 px-2 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 shadow-sm">
            {COLOR_PRESETS.map((c) => (
              <button
                key={c.value}
                onClick={() => setColor(c.value)}
                className={`size-5.5 sm:size-6 rounded-full transition-transform cursor-pointer ${c.bg} ${customization.color.toLowerCase() === c.value.toLowerCase()
                  ? 'ring-2 ring-purple-500 scale-110 shadow-md'
                  : 'opacity-70 hover:opacity-100 hover:scale-105'
                  }`}
                title={c.label}
              />
            ))}
            {/* Custom Hex Picker Input */}
            <div className="relative size-5.5 sm:size-6 rounded-full overflow-hidden border border-slate-300 dark:border-white/20 cursor-pointer ml-0.5 shadow-sm">
              <input
                type="color"
                value={customization.color}
                onChange={(e) => setColor(e.target.value)}
                className="absolute -top-2 -left-2 size-10 cursor-pointer opacity-0"
                title="Custom Hex Color"
              />
              <div
                className="w-full h-full"
                style={{ backgroundColor: customization.color }}
              />
            </div>
          </div>

          {/* Size Quick Chips */}
          <div className="hidden sm:flex items-center p-1 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-xs font-medium shadow-sm">
            {SIZE_PRESETS.map((sz) => (
              <button
                key={sz}
                onClick={() => setSize(sz)}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${customization.size === sz
                  ? 'bg-purple-600 text-white font-semibold shadow'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/5'
                  }`}
              >
                {sz}px
              </button>
            ))}
          </div>

          {/* Stroke Width Steppers */}
          {style === 'outlined' && (
            <div className="hidden lg:flex items-center p-1 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-xs font-medium shadow-sm">
              {STROKE_PRESETS.map((sw) => (
                <button
                  key={sw}
                  onClick={() => setStrokeWidth(sw)}
                  className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${customization.strokeWidth === sw
                    ? 'bg-purple-600 text-white font-semibold shadow'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/5'
                    }`}
                >
                  {sw}w
                </button>
              ))}
            </div>
          )}

          {/* 1-Click Quick Copy SVG Mode Switcher */}
          <button
            onClick={() => {
              if (!user) {
                setAuthMode('login');
                setShowAuthModal(true);
                return;
              }
              setQuickCopyMode(!quickCopyMode);
            }}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${!user
              ? 'bg-slate-100 hover:bg-slate-200/80 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/10'
              : quickCopyMode
                ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 ring-1 ring-emerald-500/30'
                : 'bg-slate-100 hover:bg-slate-200/80 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/10'
              }`}
            title={
              !user
                ? 'Sign in to unlock 1-Click Copy SVG'
                : 'When active, clicking any icon card copies its SVG directly to clipboard without opening drawer'
            }
          >
            {!user ? (
              <Lock className="size-3.5 text-amber-500" />
            ) : (
              <Copy className={`size-3.5 ${quickCopyMode ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`} />
            )}
            <span className="hidden sm:inline">1-Click Copy SVG</span>
            <span className="sm:hidden">Quick Copy</span>
            {user && quickCopyMode && (
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
            )}
          </button>

          {/* Reset Customization Button */}
          <button
            onClick={resetCustomization}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 transition-colors cursor-pointer"
            title="Reset All Adjustments"
          >
            <RotateCcw className="size-3.5" />
          </button>

        </div>
      </div>
    </div>
  );
}
