import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Zap, Sparkles, Flame, Crown, Gift, ThumbsUp } from 'lucide-react';
import { sounds } from '../services/soundEffects';

export const ProductCatalog = () => {
  const { products, startTopup } = useApp();
  const [activeTab, setActiveTab] = useState('all');

  const filteredProducts = activeTab === 'all' 
    ? products 
    : products.filter(p => p.category === activeTab);

  const tabs = [
    { id: 'all', label: 'সব সার্ভিস', icon: Sparkles },
    { id: 'freefire', label: 'Free Fire UID', icon: Flame },
    { id: 'membership', label: 'মেম্বারশিপ VIP', icon: Crown },
    { id: 'special', label: 'স্পেশাল এয়ারড্রপ', icon: Gift },
    { id: 'likes', label: 'প্রোফাইল লাইক', icon: ThumbsUp }
  ];

  return (
    <section className="my-6 sm:my-8">
      
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-1 h-5.5 bg-gradient-to-b from-sky-500 to-rose-500 rounded-full"></div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">জনপ্রিয় টপ-আপ প্যাকেজ</h2>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
            ইনস্ট্যান্ট ডেলিভারি
          </span>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs font-semibold whitespace-nowrap border flex items-center gap-1.5 transition-all cursor-pointer ${
                isActive 
                  ? 'bg-sky-500/15 border-sky-500 text-sky-600 dark:text-sky-400 font-bold shadow-xs' 
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-sky-500/40 shadow-xs'
              }`}
              onClick={() => {
                sounds.playClick();
                setActiveTab(tab.id);
              }}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Product Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5 mt-4">
        {filteredProducts.map(product => {
          const minPrice = Math.min(...product.packages.map(p => p.price));
          return (
            <div 
              key={product.id} 
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs hover:shadow-xl hover:border-sky-500/40 hover:-translate-y-1 transition-all duration-300 flex flex-col relative cursor-pointer group"
              onClick={() => startTopup(product)}
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-800">
                <img 
                  src={product.image} 
                  alt={product.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2 right-2 bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs uppercase tracking-wider">
                  {product.badge}
                </div>
              </div>

              <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-sky-500 transition-colors">
                    {product.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5 mb-2.5">
                    {product.subtitle}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">শুরু মাত্র</span>
                    <div className="text-sm sm:text-base font-black text-slate-900 dark:text-white">৳{minPrice}</div>
                  </div>

                  <button 
                    className="inline-flex items-center gap-1 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs shadow-sky-500/20 active:scale-95 transition-all cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      startTopup(product);
                    }}
                  >
                    <Zap size={14} fill="currentColor" />
                    <span>টপ-আপ</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </section>
  );
};
