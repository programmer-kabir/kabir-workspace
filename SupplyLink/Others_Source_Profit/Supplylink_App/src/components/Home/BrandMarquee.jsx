import React from "react";
import { SiSamsung, SiXiaomi, SiHp, SiDell } from "react-icons/si";
import { FiCheckCircle } from "react-icons/fi";

const BRANDS = [
  { name: "Hero", sub: "Splendor & Thriller", icon: null, textIcon: "🏍️" },
  { name: "Suzuki", sub: "Gixxer Monotone & SF", icon: null, textIcon: "🏍️" },
  { name: "Honda", sub: "Livo & X-Blade", icon: null, textIcon: "🏍️" },
  { name: "Yamaha", sub: "FZ-S & Saluto", icon: null, textIcon: "🏍️" },
  { name: "Bajaj", sub: "Pulsar & Discover", icon: null, textIcon: "🏍️" },
  { name: "Redmi / Xiaomi", sub: "Note 13 & 13C", icon: SiXiaomi },
  { name: "Realme", sub: "C67 & 12 Series", icon: null, textIcon: "📱" },
  { name: "Vivo", sub: "Y27s & V30 Series", icon: null, textIcon: "📱" },
  { name: "Oppo", sub: "A78 & A58 Series", icon: null, textIcon: "📱" },
  { name: "Samsung", sub: "Galaxy A Series", icon: SiSamsung },
  { name: "Walton", sub: "Fridge, AC & TV", icon: null, textIcon: "❄️" },
  { name: "Singer", sub: "Smart LED TV & AC", icon: null, textIcon: "📺" },
  { name: "HP & Dell", sub: "Core i3/i5 Laptops", icon: SiHp },
];

export default function BrandMarquee() {
  const brandList = [...BRANDS, ...BRANDS]; // Duplicate for seamless infinite loop

  return (
    <section className="py-7 bg-slate-100/80 border-y border-slate-200/80 overflow-hidden relative">
      <div className="max-width mx-auto px-4 mb-3.5 flex items-center justify-center gap-2 text-center">
        <FiCheckCircle className="text-emerald-500 h-4 w-4" />
        <span className="text-xs font-bold text-slate-700 uppercase tracking-widest">
          ১০০% অফিশিয়াল ব্র্যান্ডের পণ্য ও শোরুম ওয়ারেন্টি সহ কিস্তি সুবিধা
        </span>
      </div>

      {/* Fade Gradients at the Edges */}
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-slate-100 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-slate-100 to-transparent z-10 pointer-events-none" />

      {/* Infinite Scrolling Track */}
      <div className="animate-marquee items-center gap-6 py-1.5">
        {brandList.map((brand, idx) => {
          const Icon = brand.icon;
          return (
            <div
              key={idx}
              className="flex items-center gap-3 px-4.5 py-2 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-indigo-400 hover:shadow-md transition-all cursor-default select-none shrink-0"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 text-slate-800 text-lg">
                {Icon ? <Icon className="h-4 w-4 text-indigo-600" /> : <span>{brand.textIcon}</span>}
              </div>
              <div className="text-left">
                <span className="block text-xs font-bold text-slate-900 leading-tight">
                  {brand.name}
                </span>
                <span className="block text-[10px] text-slate-500 font-medium">
                  {brand.sub}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
