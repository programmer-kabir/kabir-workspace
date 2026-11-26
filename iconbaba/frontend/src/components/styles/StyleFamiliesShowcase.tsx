// frontend/src/components/styles/StyleFamiliesShowcase.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Palette, Sparkles, Feather, CircleDot, Layers, ArrowRight } from 'lucide-react';

interface StyleFamiliesShowcaseProps {
  onSelectStyle?: (styleSlug: string) => void;
}

const STYLES = [
  {
    slug: 'flat',
    name: 'Flat Color',
    badge: 'Popular',
    desc: 'Borderless, vibrant 2D geometric shapes with rich multi-tone color palettes.',
    icon: Palette,
    accent: 'from-amber-500/20 to-orange-500/20 text-amber-500 border-amber-500/30',
    dotBg: 'bg-amber-500',
  },
  {
    slug: 'gradient',
    name: 'Luminous Gradient',
    badge: 'Trending',
    desc: 'Smooth multi-stop gradients for tech branding, modern UI, and SaaS landing pages.',
    icon: Sparkles,
    accent: 'from-purple-500/20 to-pink-500/20 text-purple-500 border-purple-500/30',
    dotBg: 'bg-gradient-to-r from-purple-500 to-pink-500',
  },
  {
    slug: 'lineal-color',
    name: 'Lineal Color',
    badge: 'Signature',
    desc: 'Dark structured outer outlines filled with cheerful pastel and accent tones.',
    icon: Layers,
    accent: 'from-emerald-500/20 to-teal-500/20 text-emerald-500 border-emerald-500/30',
    dotBg: 'bg-emerald-500',
  },
  {
    slug: 'outlined',
    name: 'Lineal / Outlined',
    badge: 'Classic',
    desc: 'Minimalist 2px stroke line vectors with transparent interiors for clean wireframes.',
    icon: Feather,
    accent: 'from-blue-500/20 to-indigo-500/20 text-blue-500 border-blue-500/30',
    dotBg: 'bg-blue-500',
  },
  {
    slug: 'filled',
    name: 'Solid / Glyphs',
    badge: 'High Contrast',
    desc: 'Bold opaque single-color glyphs optimized for instant recognition and mobile menus.',
    icon: CircleDot,
    accent: 'from-slate-500/20 to-slate-700/20 text-slate-400 border-slate-500/30',
    dotBg: 'bg-slate-500',
  },
];

export default function StyleFamiliesShowcase({ onSelectStyle }: StyleFamiliesShowcaseProps) {
  return (
    <section className="w-full py-12 px-4 sm:px-6 border-b border-slate-200/80 dark:border-white/5 bg-slate-50/50 dark:bg-[#07080d]/50 transition-colors">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-1">
              <Palette className="size-3.5" />
              <span>Flaticon Multi-Style Architecture</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Browse by Design Style
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Switch effortlessly between 5 cohesive vector styles across every curated pack
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {STYLES.map((st) => {
            const IconComponent = st.icon;
            return (
              <Link
                key={st.slug}
                to={`/packs?style=${st.slug}`}
                onClick={() => onSelectStyle?.(st.slug)}
                className="group relative p-5 rounded-2xl bg-white dark:bg-[#121322] border border-slate-200/90 dark:border-white/10 hover:border-purple-400/60 dark:hover:border-purple-500/50 shadow-sm hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <div className={`size-10 rounded-xl flex items-center justify-center border ${st.accent}`}>
                      <IconComponent className="size-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300">
                      {st.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    {st.name}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed line-clamp-3">
                    {st.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  <span>View Packs</span>
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
