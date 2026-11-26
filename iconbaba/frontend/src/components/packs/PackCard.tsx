// frontend/src/components/packs/PackCard.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Layers, Sparkles, Download, Check } from 'lucide-react';
import { PackItem } from '@/types/icon';

interface PackCardProps {
  pack: PackItem;
}

export default function PackCard({ pack }: PackCardProps) {
  const previews = pack.preview_icons || [];
  const previewSlices = previews.slice(0, 6);

  return (
    <Link
      to={`/pack/${pack.slug}`}
      className="group flex flex-col rounded-2xl bg-white dark:bg-[#121322] border border-slate-200/90 dark:border-white/10 hover:border-purple-400/60 dark:hover:border-purple-500/50 shadow-sm hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 overflow-hidden"
    >
      {/* 6-Icon Preview Showcase Grid (Flaticon Style) */}
      <div className="relative p-3.5 bg-slate-50/80 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5">
        <div className="grid grid-cols-3 gap-2.5 aspect-[3/2] items-center justify-items-center">
          {previewSlices.map((icon, idx) => (
            <div
              key={icon.id || idx}
              className="w-full h-full min-h-[52px] rounded-xl bg-white dark:bg-[#1c1d2e] border border-slate-200/80 dark:border-white/10 flex items-center justify-center p-2.5 transition-transform group-hover:scale-105 shadow-sm"
            >
              {icon.svg ? (
                <div
                  className="size-7 text-slate-800 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors flex items-center justify-center [&_svg]:w-full [&_svg]:h-full [&_svg]:max-h-full [&_svg]:max-w-full [&_svg:not([data-multicolor])]:fill-current [&_path:not([fill])]:fill-current"
                  dangerouslySetInnerHTML={{ __html: icon.svg }}
                />
              ) : (
                <div className="size-5 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
              )}
            </div>
          ))}
          {/* Pad to 6 if less */}
          {Array.from({ length: Math.max(0, 6 - previewSlices.length) }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="w-full h-full min-h-[52px] rounded-xl bg-slate-100/50 dark:bg-white/[0.02] border border-dashed border-slate-200 dark:border-white/5 flex items-center justify-center"
            >
              <div className="size-2 rounded-full bg-slate-200 dark:bg-white/10" />
            </div>
          ))}
        </div>

        {/* Floating Tier Badge */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
          {pack.is_premium ? (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm">
              <Sparkles className="size-3" />
              <span>Pro</span>
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
              Free
            </span>
          )}
        </div>
      </div>

      {/* Card Info */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
              {pack.category_name}
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              {pack.icon_count} icons
            </span>
          </div>

          <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-1">
            {pack.name}
          </h3>

          {pack.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
              {pack.description}
            </p>
          )}
        </div>

        {/* Footer: Style pills & Author */}
        <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {(pack.available_styles || ['outlined']).slice(0, 3).map((st) => (
              <span
                key={st}
                className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 capitalize"
              >
                {st.replace('-', ' ')}
              </span>
            ))}
          </div>

          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 truncate max-w-[110px]">
            {pack.author_name || 'IconBaba'}
          </span>
        </div>
      </div>
    </Link>
  );
}
