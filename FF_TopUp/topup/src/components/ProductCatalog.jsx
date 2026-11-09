import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Zap, Sparkles, Flame, Crown, Gift, ThumbsUp } from 'lucide-react';
import { sounds } from '../services/soundEffects';

const SUBTITLE_FALLBACKS = {
  'ff-bd-uid': 'BD Server (১ মিনিটে অটো ডেলিভারি)',
  'ff-membership': 'Weekly & Monthly VIP Pass',
  'ff-evo-tokens': 'গান স্কিন আপগ্রেড টোকেন',
  'ff-special-airdrop': 'লটারি ও লাকি ড্র বক্স',
  'ff-custom-room': 'কাস্টম রুম কার্ড',
  'ff-profile-like': 'প্রোফাইল বুস্ট ও ফেমাস আইডি',
  'pubg-uc': 'গ্লোবাল ও বিডি প্লেয়ার আইডি ইউসি',
  'hok-tokens': 'ইনস্ট্যান্ট প্লেয়ার আইডি টপ-আপ'
};

const BADGE_FALLBACKS = {
  'ff-bd-uid': 'সেরা অফার 🔥',
  'ff-membership': 'VIP পাস 👑',
  'ff-evo-tokens': 'হট ডিল ⚡',
  'ff-special-airdrop': '৯৯% ডিসকাউন্ট 🎁',
  'ff-custom-room': 'রুম কার্ড ⚔️',
  'ff-profile-like': 'ইনস্ট্যান্ট লাইক 👍',
  'pubg-uc': 'রয়েল পাস 🪂',
  'hok-tokens': 'নতুন গেম 🛡️'
};

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
    <section className="my-8 sm:my-12" id="product-catalog-section">
      
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-2 h-7 bg-gradient-to-b from-sky-500 via-blue-600 to-indigo-600 rounded-full" />
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              জনপ্রিয় টপ-আপ প্যাকেজ
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              সবচেয়ে কম দামে বিশ্বস্ত ফ্রি ফায়ার ডায়মন্ড কালেকশন
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
          <Zap size={14} className="fill-current text-sky-600" />
          <span>ইনস্ট্যান্ট অটো ডেলিভারি</span>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              className={`px-4 sm:px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap border flex items-center gap-2 transition-all cursor-pointer ${
                isActive 
                  ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white border-sky-600 shadow-md shadow-sky-500/25 scale-[1.02]' 
                  : 'bg-white border-slate-200 text-slate-700 hover:border-sky-300 hover:text-slate-900 shadow-xs'
              }`}
              onClick={() => {
                sounds.playClick();
                setActiveTab(tab.id);
              }}
            >
              <Icon size={16} className={isActive ? 'text-amber-300' : 'text-slate-400'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Product Cards Grid with Generous Padding */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mt-6">
        {filteredProducts.map(product => {
          const minPrice = Math.min(...product.packages.map(p => p.price));
          
          const cleanSubtitle = (!product.subtitle || product.subtitle.includes('???'))
            ? (SUBTITLE_FALLBACKS[product.id] || 'ইনস্ট্যান্ট অটো ডেলিভারি')
            : product.subtitle;

          const cleanBadge = (!product.badge || product.badge.includes('???'))
            ? (BADGE_FALLBACKS[product.id] || 'সেরা অফার 🔥')
            : product.badge;

          return (
            <div 
              key={product.id} 
              className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:border-sky-400 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group cursor-pointer"
              onClick={() => {
                sounds.playClick();
                startTopup(product);
              }}
            >
              {/* Product Thumbnail Container */}
              <div className="relative aspect-[16/11] overflow-hidden bg-slate-950">
                <img 
                  src={product.image} 
                  alt={product.title} 
                  className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                
                {/* Floating Badge */}
                <div className="absolute top-3 right-3 bg-rose-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-md uppercase tracking-wider backdrop-blur-xs">
                  {cleanBadge}
                </div>
              </div>

              {/* Product Details with Generous Padding */}
              <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3.5">
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 line-clamp-1 group-hover:text-sky-600 transition-colors">
                    {product.title}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium line-clamp-1 mt-1">
                    {cleanSubtitle}
                  </p>
                </div>

                {/* Pricing & CTA Button */}
                <div className="flex items-center justify-between pt-3.5 border-t border-slate-100">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      শুরু মাত্র
                    </span>
                    <div className="text-base sm:text-lg font-black text-slate-900">
                      ৳{minPrice}
                    </div>
                  </div>

                  <button 
                    className="inline-flex items-center gap-1.5 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white text-xs font-black px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl shadow-md shadow-sky-500/20 active:scale-95 transition-all cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      sounds.playClick();
                      startTopup(product);
                    }}
                  >
                    <Zap size={14} className="fill-current text-white" />
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
