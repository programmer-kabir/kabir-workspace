// frontend/src/components/categories/CategoryCardsGrid.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ShoppingCart, 
  Coins, 
  Cpu, 
  HeartPulse, 
  UtensilsCrossed, 
  MessageSquare, 
  PawPrint,
  Folder,
  ArrowRight,
  Layers
} from 'lucide-react';
import { CategoryItem } from '@/types/icon';

interface CategoryCardsGridProps {
  categories: CategoryItem[];
  loading?: boolean;
}

// Icon mapping helper for categories
function getCategoryIcon(slug: string) {
  const s = slug.toLowerCase();
  if (s.includes('e-commerce') || s.includes('shop')) return <ShoppingCart className="size-6 text-blue-500" />;
  if (s.includes('currenc') || s.includes('bank') || s.includes('money')) return <Coins className="size-6 text-amber-500" />;
  if (s.includes('computer') || s.includes('device') || s.includes('develop')) return <Cpu className="size-6 text-emerald-500" />;
  if (s.includes('health') || s.includes('medic')) return <HeartPulse className="size-6 text-rose-500" />;
  if (s.includes('food') || s.includes('drink')) return <UtensilsCrossed className="size-6 text-orange-500" />;
  if (s.includes('communicat') || s.includes('chat') || s.includes('social')) return <MessageSquare className="size-6 text-purple-500" />;
  if (s.includes('animal')) return <PawPrint className="size-6 text-teal-500" />;
  return <Folder className="size-6 text-indigo-500" />;
}

export default function CategoryCardsGrid({ categories, loading }: CategoryCardsGridProps) {
  // Prioritize categories with published packs or icons
  const activeCategories = categories
    .filter(c => (c.pack_count && c.pack_count > 0) || (c.icon_count && c.icon_count > 0))
    .slice(0, 8);

  return (
    <section className="w-full py-12 px-4 sm:px-6 border-b border-slate-200/80 dark:border-white/5 bg-white/50 dark:bg-[#0b0c14]/50 backdrop-blur-sm transition-colors">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-1">
              <Layers className="size-3.5" />
              <span>Flaticon Taxonomy</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Explore by Category
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Organized curated packs structured across standard industry domains
            </p>
          </div>

          <Link
            to="/packs"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors group"
          >
            <span>Browse all categories & packs</span>
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={`skel-cat-${i}`}
                className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121322] p-5 animate-pulse"
              >
                <div className="size-10 rounded-xl bg-slate-100 dark:bg-white/5 mb-3" />
                <div className="h-4 bg-slate-200 dark:bg-white/10 rounded w-2/3 mb-2" />
                <div className="h-3 bg-slate-100 dark:bg-white/5 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {activeCategories.map((cat) => (
              <Link
                key={cat.id}
                to={`/packs?category=${cat.slug}`}
                className="group relative p-5 rounded-2xl bg-white dark:bg-[#121322] border border-slate-200/90 dark:border-white/10 hover:border-purple-400/60 dark:hover:border-purple-500/50 shadow-sm hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 flex flex-col justify-between overflow-hidden"
              >
                {/* Glow accent */}
                <div className="absolute top-0 right-0 -mr-6 -mt-6 size-20 rounded-full bg-purple-500/5 dark:bg-purple-500/10 blur-xl group-hover:bg-purple-500/20 transition-all" />

                <div>
                  <div className="size-12 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 flex items-center justify-center mb-3.5 group-hover:scale-110 transition-transform shadow-xs">
                    {getCategoryIcon(cat.slug)}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-1">
                    {cat.name}
                  </h3>

                  <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-purple-600 dark:text-purple-400">
                      {cat.pack_count || 1} {cat.pack_count === 1 ? 'pack' : 'packs'}
                    </span>
                    <span>•</span>
                    <span>{cat.icon_count || 0} icons</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  <span>Explore Packs</span>
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
