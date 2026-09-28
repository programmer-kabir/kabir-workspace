// frontend/src/components/packs/CuratedPacks.tsx
'use client';

import React from 'react';
import { Sparkles, ArrowRight, Cpu, CreditCard, ShoppingBag, ShieldCheck } from 'lucide-react';

interface CuratedPacksProps {
  onSelectPack: (searchTerm: string) => void;
}

const PACKS = [
  {
    id: 'fintech',
    title: 'FinTech & Web3',
    subtitle: 'Wallets, payment cards, cryptos & ledgers',
    count: '140+ Icons',
    icon: CreditCard,
    cardClasses: 'bg-purple-50/60 hover:bg-purple-50 dark:bg-[#121322] dark:hover:bg-[#17182c] border-purple-200/70 dark:border-purple-500/20 dark:hover:border-purple-500/50 hover:shadow-purple-500/10',
    iconBg: 'bg-white dark:bg-purple-950/60 border-purple-200 dark:border-purple-500/40 text-purple-600 dark:text-purple-400',
    badgeClass: 'bg-purple-100/80 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30',
    arrowColor: 'text-purple-600 dark:text-purple-400',
    query: 'money',
  },
  {
    id: 'ai',
    title: 'AI & Machine Intelligence',
    subtitle: 'Neural processors, bots, magic & automation',
    count: '95+ Icons',
    icon: Cpu,
    cardClasses: 'bg-cyan-50/60 hover:bg-cyan-50 dark:bg-[#121322] dark:hover:bg-[#17182c] border-cyan-200/70 dark:border-cyan-500/20 dark:hover:border-cyan-500/50 hover:shadow-cyan-500/10',
    iconBg: 'bg-white dark:bg-cyan-950/60 border-cyan-200 dark:border-cyan-500/40 text-cyan-600 dark:text-cyan-400',
    badgeClass: 'bg-cyan-100/80 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30',
    arrowColor: 'text-cyan-600 dark:text-cyan-400',
    query: 'cpu',
  },
  {
    id: 'ecommerce',
    title: 'E-Commerce & Retail',
    subtitle: 'Shopping carts, price tags, delivery & rewards',
    count: '180+ Icons',
    icon: ShoppingBag,
    cardClasses: 'bg-amber-50/60 hover:bg-amber-50 dark:bg-[#121322] dark:hover:bg-[#17182c] border-amber-200/70 dark:border-amber-500/20 dark:hover:border-amber-500/50 hover:shadow-amber-500/10',
    iconBg: 'bg-white dark:bg-amber-950/60 border-amber-200 dark:border-amber-500/40 text-amber-600 dark:text-amber-400',
    badgeClass: 'bg-amber-100/80 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30',
    arrowColor: 'text-amber-600 dark:text-amber-400',
    query: 'shop',
  },
  {
    id: 'security',
    title: 'Security & Verification',
    subtitle: 'Shields, locks, keys & identity tokens',
    count: '110+ Icons',
    icon: ShieldCheck,
    cardClasses: 'bg-emerald-50/60 hover:bg-emerald-50 dark:bg-[#121322] dark:hover:bg-[#17182c] border-emerald-200/70 dark:border-emerald-500/20 dark:hover:border-emerald-500/50 hover:shadow-emerald-500/10',
    iconBg: 'bg-white dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-500/40 text-emerald-600 dark:text-emerald-400',
    badgeClass: 'bg-emerald-100/80 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30',
    arrowColor: 'text-emerald-600 dark:text-emerald-400',
    query: 'shield',
  },
];

export default function CuratedPacks({ onSelectPack }: CuratedPacksProps) {
  return (
    <div className="w-full mx-auto px-4 sm:px-6 py-6 border-b border-slate-200 dark:border-white/5 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
            <Sparkles className="size-3.5" />
            <span>Curated Icon Packs</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Themed Bundles for Rapid Prototyping</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {PACKS.map((pack) => {
          const IconCmp = pack.icon;

          return (
            <div
              key={pack.id}
              onClick={() => onSelectPack(pack.query)}
              className={`p-4 rounded-2xl ${pack.cardClasses} border backdrop-blur-md hover:scale-[1.02] transition-all cursor-pointer group shadow-sm hover:shadow-md`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`size-10 rounded-xl ${pack.iconBg} border flex items-center justify-center shadow-sm transition-transform group-hover:scale-105`}>
                  <IconCmp className="size-5" />
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${pack.badgeClass} font-semibold`}>
                  {pack.count}
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">
                {pack.title}
              </h4>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-1">{pack.subtitle}</p>
              
              <div className={`mt-3 flex items-center gap-1 text-[11px] font-semibold ${pack.arrowColor} transition-colors`}>
                <span>Explore Bundle</span>
                <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
