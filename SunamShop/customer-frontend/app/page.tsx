import { fetchApi } from '@/lib/api';
import { Category, DeliveryZone } from '@/types';
import { 
  Truck, 
  ShieldCheck, 
  RotateCcw, 
  CreditCard, 
  Star, 
  Heart, 
  Plus, 
  ChevronRight,
  ArrowRight,
  Sparkles,
  ShoppingBag,
  Percent,
  Clock
} from 'lucide-react';

async function getInitialData() {
  try {
    const [categoriesRes, zonesRes] = await Promise.all([
      fetchApi<Category[]>('/categories').catch(() => ({ data: [] as Category[] })),
      fetchApi<DeliveryZone[]>('/delivery-zones').catch(() => ({ data: [] as DeliveryZone[] })),
    ]);

    return {
      categories: categoriesRes?.data || [],
      zones: zonesRes?.data || [],
    };
  } catch {
    return { categories: [], zones: [] };
  }
}

export default async function HomePage() {
  const { categories, zones } = await getInitialData();

  // Curated categories with Bengali & English
  const curatedCategories = [
    { name_bn: 'চাল, ডাল ও আটা', name_en: 'Rice, Lentils & Flour', slug: 'rice-lentils-flour', image: '🌾', count: '৪২+ আইটেম' },
    { name_bn: 'তেল ও রান্নার মসলা', name_en: 'Oil & Spices', slug: 'oil-spices', image: '🧂', count: '৩৮+ আইটেম' },
    { name_bn: 'তাজা মাছ (হাওর ও নদী)', name_en: 'Fresh Fish (River Catch)', slug: 'fresh-fish', image: '🐟', count: '১৮+ তাজা মাছ' },
    { name_bn: 'তাজা মাংস ও মুরগি', name_en: 'Fresh Meat & Chicken', slug: 'meat-poultry', image: '🍗', count: '১২+ আইটেম' },
    { name_bn: 'তাজা শাকসবজি', name_en: 'Fresh Vegetables', slug: 'fresh-vegetables', image: '🥦', count: '৩৫+ আইটেম' },
    { name_bn: 'তাজা ফলমূল', name_en: 'Fresh Fruits', slug: 'fruits', image: '🍎', count: '২৪+ আইটেম' },
    { name_bn: 'দুধ ও ফার্মের ডিম', name_en: 'Milk, Dairy & Eggs', slug: 'milk-eggs', image: '🥛', count: '১৬+ আইটেম' },
    { name_bn: 'স্ন্যাকস ও পানীয়', name_en: 'Snacks & Beverages', slug: 'snacks-beverages', image: '🥤', count: '৫০+ আইটেম' },
    { name_bn: 'টয়লেট্রিস ও গৃহস্থালি', name_en: 'Toiletries & Household', slug: 'household-goods', image: '🧼', count: '৬০+ আইটেম' },
  ];

  // Best selling products matching the reference design cards
  const bestSellers = [
    {
      id: 1,
      title_bn: 'তাজা রুই মাছ (সুরমা নদী ও হাওর)',
      title_en: 'Fresh Ruhi Fish (Medium Size)',
      weight: '১ কেজি (আনুমানিক / Variable Weight)',
      price: '৩৮০.০০',
      oldPrice: '৪২০.০০',
      rating: 4.9,
      reviews: 128,
      badge: 'BEST SELLER',
      image: '🐟',
    },
    {
      id: 2,
      title_bn: 'চিনিগুঁড়া সুগন্ধি চাল (প্রিমিয়াম বাছাই)',
      title_en: 'Chinigura Aromatic Rice 1kg Pack',
      weight: '১ কেজি প্যাকেট (1kg Sealed Pack)',
      price: '১৫০.০০',
      oldPrice: '১৬৫.০০',
      rating: 4.8,
      reviews: 96,
      badge: 'POPULAR',
      image: '🌾',
    },
    {
      id: 3,
      title_bn: 'ফার্মের ফ্রেশ লাল ডিম (১ ডজন)',
      title_en: 'Farm Fresh Brown Eggs (12 pcs)',
      weight: '১২ পিস বক্স (12 Pieces Tray)',
      price: '১৪৫.০০',
      oldPrice: '১৬০.০০',
      rating: 4.7,
      reviews: 74,
      badge: 'DAILY FRESH',
      image: '🥚',
    },
    {
      id: 4,
      title_bn: 'রূপচাঁদা খাঁটি ফর্টিফাইড সয়াবিন তেল',
      title_en: 'Rupchanda Fortified Soybean Oil 2L',
      weight: '২ লিটার বোতল (2 Liter Bottle)',
      price: '৩৬৫.০০',
      oldPrice: '৩৮০.০০',
      rating: 4.9,
      reviews: 215,
      badge: 'BEST SELLER',
      image: '🫒',
    },
    {
      id: 5,
      title_bn: 'দেশি ব্রয়লার মুরগি (লাইভ কাটা ও পরিষ্কার)',
      title_en: 'Fresh Dressed Chicken 1kg',
      weight: '১ কেজি (কাটার পর নিট ওজন)',
      price: '১৯৫.০০',
      oldPrice: '২১০.০০',
      rating: 4.6,
      reviews: 84,
      badge: 'FRESH MEAT',
      image: '🍗',
    },
    {
      id: 6,
      title_bn: 'দেশি লাল আলু ও পেঁয়াজ সাশ্রয়ী কম্বো',
      title_en: 'Fresh Potato & Red Onion Combo Pack',
      weight: '২ কেজি কম্বো (1kg Potato + 1kg Onion)',
      price: '১৩০.০০',
      oldPrice: '১৪৫.০০',
      rating: 4.7,
      reviews: 62,
      badge: 'COMBO DEAL',
      image: '🥔',
    },
  ];

  return (
    <div className="space-y-12 pb-24 w-full">
      
      {/* 1. GRAND FULL-WIDTH HERO BANNER (Exactly matching the reference image layout) */}
      <section className="max-w-[1720px] mx-auto px-4 sm:px-8 pt-6">
        <div className="bg-[#F4F7F4] rounded-3xl sm:rounded-[2.5rem] p-8 sm:p-14 lg:p-16 border border-[#E2EAE2] relative overflow-hidden shadow-sm w-full">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-10 lg:gap-14">
            
            {/* Left Content (Clean, Bold, Bilingual) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/90 text-store-primary text-xs font-bold font-sans tracking-wide">
                <Sparkles size={14} className="text-store-primary" />
                <span>সুনামগঞ্জ সদর বিশেষ হোম ডেলিভারি | Sunamganj Sadar Service</span>
              </div>

              <div className="space-y-2">
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight leading-[1.12]">
                  Fresh Groceries, <br />
                  <span className="text-store-accent">Delivered to You</span>
                </h1>
                <p className="text-lg sm:text-xl font-bold text-gray-800 font-bangla pt-1">
                  আপনার বাজার, এখন আপনার হাতেই — তাজা ও খাঁটি পণ্যের বিশ্বস্ত ঠিকানা
                </p>
              </div>

              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed max-w-xl">
                সুনামগঞ্জ সদরের পুরাতন বাজার ও নতুন বাজার থেকে প্রতিদিন সকালে সংগৃহীত টাটকা মাছ, মাংস, শাকসবজি এবং মানসম্মত মুদি পণ্য সবচেয়ে দ্রুততম সময়ে সরাসরি আপনার ঘরে পৌঁছে দিচ্ছে সুনাম শপ।
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-4">
                <a
                  href="#best-sellers"
                  className="px-9 py-4 bg-store-primary hover:bg-store-primaryHover text-white text-xs sm:text-sm font-bold rounded-full shadow-lg transition flex items-center gap-2.5 group"
                >
                  <span>SHOP NOW (বাজার শুরু করুন)</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1.5 transition" />
                </a>

                <a
                  href="#categories"
                  className="px-7 py-4 bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 text-xs sm:text-sm font-bold rounded-full transition shadow-sm"
                >
                  ক্যাটাগরি দেখুন (View Categories)
                </a>
              </div>
            </div>

            {/* Right Visual Element (Fresh Crate Graphic with Floating 100% Fresh Guarantee Badge) */}
            <div className="lg:col-span-5 relative flex justify-center items-center">
              
              {/* Floating Guarantee Badge */}
              <div className="absolute -top-4 right-2 sm:right-6 bg-white/95 backdrop-blur-md border border-emerald-100 shadow-lg rounded-2xl p-3 flex items-center gap-2.5 z-10 animate-bounce duration-1000">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-store-primary flex items-center justify-center font-bold text-xl">
                  🌿
                </div>
                <div>
                  <span className="text-xs font-black text-gray-900 block leading-tight font-sans">
                    100% FRESH
                  </span>
                  <span className="text-[10px] text-gray-500 block uppercase tracking-wider font-semibold">
                    GUARANTEE
                  </span>
                </div>
              </div>

              {/* Central Produce Basket */}
              <div className="w-full max-w-md aspect-square bg-gradient-to-b from-emerald-100/70 to-emerald-200/50 rounded-3xl sm:rounded-[2.5rem] p-8 flex flex-col items-center justify-center border border-emerald-200/60 shadow-inner group">
                <div className="text-9xl filter drop-shadow-lg group-hover:scale-105 transition-transform duration-300">
                  🧺
                </div>
                <div className="mt-4 px-5 py-1.5 bg-store-primary text-white rounded-full text-xs font-bold tracking-widest font-sans uppercase shadow-md">
                  SUNAM SHOP FRESH CRATE
                </div>
              </div>
            </div>

          </div>

          {/* Carousel dots indicator at bottom */}
          <div className="flex justify-center items-center gap-2 mt-8">
            <span className="w-7 h-2 rounded-full bg-store-primary transition-all"></span>
            <span className="w-2.5 h-2 rounded-full bg-gray-300"></span>
            <span className="w-2.5 h-2 rounded-full bg-gray-300"></span>
          </div>

        </div>
      </section>

      {/* 2. VALUE PROPS ROW (4 Clean Features Across Full Width) */}
      <section className="max-w-[1720px] mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          
          <div className="bg-white p-5 rounded-2xl border border-gray-100 flex items-center gap-4 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-store-primary flex items-center justify-center flex-shrink-0">
              <Truck size={24} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900 leading-tight">Same Day Delivery</h4>
              <p className="text-[11px] text-gray-500 mt-0.5 font-bangla">সুনামগঞ্জ সদর পৌর শহর (৩০-৬০ মিনিট)</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 flex items-center gap-4 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-store-primary flex items-center justify-center flex-shrink-0">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900 leading-tight">Fresh Guarantee</h4>
              <p className="text-[11px] text-gray-500 mt-0.5 font-bangla">হাওর ও নদীর তাজা মাছ এবং খাঁটি পণ্য</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 flex items-center gap-4 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-store-primary flex items-center justify-center flex-shrink-0">
              <CreditCard size={24} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900 leading-tight">Secure Payments</h4>
              <p className="text-[11px] text-gray-500 mt-0.5 font-bangla">ক্যাশ অন ডেলিভারি (Cash on Delivery)</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 flex items-center gap-4 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-store-primary flex items-center justify-center flex-shrink-0">
              <RotateCcw size={24} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900 leading-tight">Easy Returns</h4>
              <p className="text-[11px] text-gray-500 mt-0.5 font-bangla">পণ্য অপছন্দ হলে তাৎক্ষণিক পরিবর্তন</p>
            </div>
          </div>

        </div>
      </section>

      {/* 3. MINI CATEGORIES HORIZONTAL PILLS ROW (Matching reference design 6 pill cards) */}
      <section className="max-w-[1720px] mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {[
            { name_bn: 'ফল ও শাকসবজি', name_en: 'Fruits & Veg', icon: '🥦', link: '#categories' },
            { name_bn: 'দুধ ও ডিম', name_en: 'Dairy & Eggs', icon: '🥛', link: '#categories' },
            { name_bn: 'স্ন্যাকস ও পানীয়', name_en: 'Snacks & Drinks', icon: '🥤', link: '#categories' },
            { name_bn: 'চাল ও ডাল', name_en: 'Staples & Rice', icon: '🌾', link: '#categories' },
            { name_bn: 'ভোজ্য তেল', name_en: 'Cooking Oil', icon: '🫒', link: '#categories' },
            { name_bn: 'গৃহস্থালি সামগ্রী', name_en: 'Household', icon: '🧼', link: '#categories' },
          ].map((item, idx) => (
            <a
              key={idx}
              href={item.link}
              className="bg-white border border-gray-100 hover:border-emerald-300 p-3.5 rounded-2xl flex items-center gap-3.5 shadow-sm hover:shadow transition group"
            >
              <span className="text-2xl group-hover:scale-115 transition-transform">{item.icon}</span>
              <div>
                <span className="text-xs font-bold text-gray-900 block leading-tight font-sans">
                  {item.name_en}
                </span>
                <span className="text-[10px] text-gray-500 block font-bangla">
                  {item.name_bn}
                </span>
                <span className="text-[10px] text-store-primary font-bold block mt-0.5">
                  Shop Now ➜
                </span>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* 4. SHOP BY CATEGORY (Big Square Cards with Neutral Background matching reference image) */}
      <section id="categories" className="max-w-[1720px] mx-auto px-4 sm:px-8 pt-4">
        <div className="flex items-center justify-between mb-6 pb-2 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-store-primary"></span>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 font-sans tracking-tight uppercase">
                SHOP BY CATEGORY | পণ্য ক্যাটাগরি
              </h2>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              প্রয়োজনীয় ক্যাটাগরি অনুযায়ী সাজানো তাজা বাজার ও মুদি সামগ্রী
            </p>
          </div>
          <a
            href="/categories"
            className="text-xs font-bold text-store-primary hover:text-store-primaryHover flex items-center gap-1 transition font-sans uppercase tracking-wider"
          >
            <span>সকল ক্যাটাগরি (VIEW ALL)</span>
            <ChevronRight size={14} />
          </a>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-9 gap-4">
          {curatedCategories.map((cat, idx) => (
            <a
              key={idx}
              href={`/category/${cat.slug}`}
              className="group bg-[#F6F7F9] hover:bg-white border border-transparent hover:border-emerald-300 rounded-2xl p-4 text-center flex flex-col items-center justify-between transition-all duration-200 shadow-sm hover:shadow-md aspect-[4/5]"
            >
              <div className="w-full flex-1 flex items-center justify-center">
                <span className="text-5xl group-hover:scale-115 transition-transform duration-300 filter drop-shadow-sm">
                  {cat.image}
                </span>
              </div>

              <div className="mt-2 w-full">
                <h3 className="font-bold text-xs sm:text-sm text-gray-900 group-hover:text-store-primary transition leading-snug truncate">
                  {cat.name_bn}
                </h3>
                <span className="text-[10px] text-gray-400 font-sans block truncate mt-0.5">
                  {cat.name_en}
                </span>
                <span className="text-[9px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-1 font-semibold">
                  {cat.count}
                </span>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* 5. BEST SELLERS (Product Cards Grid matching reference image) */}
      <section id="best-sellers" className="max-w-[1720px] mx-auto px-4 sm:px-8 pt-6">
        <div className="flex items-center justify-between mb-6 pb-2 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-store-accent"></span>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 font-sans tracking-tight uppercase">
                BEST SELLERS | সেরা বিক্রিত পণ্য
              </h2>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              সুনামগঞ্জ সদরের সবচেয়ে জনপ্রিয় ও গ্রাহকদের সর্বাধিক পছন্দের পণ্যসমূহ
            </p>
          </div>
          <a
            href="/products"
            className="text-xs font-bold text-store-primary hover:text-store-primaryHover flex items-center gap-1 transition font-sans uppercase tracking-wider"
          >
            <span>সব পণ্য দেখুন (VIEW ALL)</span>
            <ChevronRight size={14} />
          </a>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-5">
          {bestSellers.map((product) => (
            <div
              key={product.id}
              className="bg-white border border-gray-100 hover:border-emerald-300 rounded-3xl p-4 sm:p-5 flex flex-col justify-between shadow-sm hover:shadow-lg transition-all group relative"
            >
              {/* Badge & Wishlist */}
              <div className="flex items-center justify-between w-full mb-2">
                <span className="px-2.5 py-0.5 bg-emerald-50 text-store-primary font-bold text-[9px] rounded-full font-sans tracking-wider border border-emerald-100">
                  {product.badge}
                </span>
                <button className="text-gray-400 hover:text-rose-500 transition p-1">
                  <Heart size={16} />
                </button>
              </div>

              {/* Product Visual Area */}
              <div className="w-full aspect-square bg-[#F8F9FA] rounded-2xl flex items-center justify-center my-2 group-hover:scale-105 transition-transform duration-300">
                <span className="text-6xl filter drop-shadow-md">{product.image}</span>
              </div>

              {/* Product Info */}
              <div className="space-y-1.5 pt-2">
                <span className="text-[10px] text-gray-400 font-medium block">{product.weight}</span>
                <h3 className="font-bold text-xs sm:text-sm text-gray-900 group-hover:text-store-primary transition line-clamp-2 leading-snug">
                  {product.title_bn}
                </h3>
                <span className="text-[10px] text-gray-400 font-sans block truncate">
                  {product.title_en}
                </span>

                {/* Rating Stars */}
                <div className="flex items-center gap-1.5 pt-1">
                  <div className="flex text-amber-400">
                    <Star size={12} fill="currentColor" />
                  </div>
                  <span className="text-[11px] font-bold text-gray-800">{product.rating}</span>
                  <span className="text-[10px] text-gray-400 font-sans">({product.reviews})</span>
                </div>

                {/* Price & Add to Cart Action */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-50 mt-2">
                  <div>
                    <span className="text-base font-black text-gray-900 block leading-tight font-sans">
                      ৳ {product.price}
                    </span>
                    {product.oldPrice && (
                      <span className="text-[10px] text-gray-400 line-through font-sans">
                        ৳ {product.oldPrice}
                      </span>
                    )}
                  </div>

                  <button
                    className="w-9 h-9 rounded-full bg-emerald-50 hover:bg-store-primary text-store-primary hover:text-white flex items-center justify-center transition shadow-sm font-bold"
                    title="কার্টে যোগ করুন (Add to Cart)"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. SUNAMGANJ SADAR DELIVERY HUB & AREAS (Expansive Full Width Section) */}
      <section id="delivery-info" className="max-w-[1720px] mx-auto px-4 sm:px-8 pt-8">
        <div className="bg-[#F4F7F4] rounded-3xl p-8 sm:p-12 border border-[#E2EAE2]">
          <div className="max-w-3xl mb-8">
            <span className="text-xs font-bold text-store-primary uppercase tracking-wider block mb-1">
              ডেলিভারি নেটওয়ার্ক | DELIVERY NETWORK
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              সুনামগঞ্জ সদর পৌর এলাকা ও উপ-শহরের প্রতিটি কোণায় আমাদের সেবা
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1.5 leading-relaxed">
              সকাল ৭:০০টা থেকে রাত ৯:০০টা পর্যন্ত আপনার অর্ডারের সর্বোচ্চ ৬০ মিনিটের মধ্যে তাজা মাছ, শাকসবজি ও গ্রোসারি পৌঁছে দিচ্ছে সুনাম শপ রাইডার টিম।
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-7 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-gray-900 text-base">জোন ১: সদর পৌর এলাকা (Core Municipality)</h4>
                  <p className="text-xs text-gray-500 mt-0.5">আনুমানিক সময়: ৩০-৬০ মিনিট | সর্বনিম্ন অর্ডার: ৳২০০</p>
                </div>
                <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-store-primary text-white">
                  চার্জ ৳৩০
                </span>
              </div>
              <div className="pt-3 border-t border-gray-100 flex flex-wrap gap-2 text-xs text-gray-700">
                <span className="px-3 py-1 bg-gray-100 rounded-lg font-medium">হাসন নগর (Hasason Nagar)</span>
                <span className="px-3 py-1 bg-gray-100 rounded-lg font-medium">নতুনপাড়া (Notunpara)</span>
                <span className="px-3 py-1 bg-gray-100 rounded-lg font-medium">পুরাতন জেল রোড (Puraton Jail Rd)</span>
                <span className="px-3 py-1 bg-gray-100 rounded-lg font-medium">ষোলঘর (Shologhor)</span>
                <span className="px-3 py-1 bg-gray-100 rounded-lg font-medium">জগন্নাথবাড়ি রোড (Jagannathbari Rd)</span>
                <span className="px-3 py-1 bg-gray-100 rounded-lg font-medium">আরপিন নগর (Arpin Nagar)</span>
                <span className="px-3 py-1 bg-gray-100 rounded-lg font-medium">কাজীর পয়েন্ট (Kajir Point)</span>
                <span className="px-3 py-1 bg-gray-100 rounded-lg font-medium">ট্রাফিক পয়েন্ট (Traffic Point)</span>
              </div>
            </div>

            <div className="bg-white p-7 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-gray-900 text-base">জোন ২: সদর উপ-শহর ও সংলগ্ন অঞ্চল (Sub-Urban)</h4>
                  <p className="text-xs text-gray-500 mt-0.5">আনুমানিক সময়: ৪৫-৯০ মিনিট | সর্বনিম্ন অর্ডার: ৳৩০০</p>
                </div>
                <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-gray-800 text-white">
                  চার্জ ৳৫০
                </span>
              </div>
              <div className="pt-3 border-t border-gray-100 flex flex-wrap gap-2 text-xs text-gray-700">
                <span className="px-3 py-1 bg-gray-100 rounded-lg font-medium">ওয়েজখালী (Oyezkhali)</span>
                <span className="px-3 py-1 bg-gray-100 rounded-lg font-medium">মোল্লাপাড়া (Mollapara)</span>
                <span className="px-3 py-1 bg-gray-100 rounded-lg font-medium">ধারারগাঁও (Dharargaon)</span>
                <span className="px-3 py-1 bg-gray-100 rounded-lg font-medium">পৌর শহর সংলগ্ন উপশহরীয় অঞ্চল</span>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
