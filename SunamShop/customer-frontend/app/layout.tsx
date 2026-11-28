import type { Metadata } from 'next';
import './globals.css';
import CategoryDropdown from '@/components/CategoryDropdown';
import { 
  ShoppingBag, 
  Search, 
  Heart, 
  User, 
  Phone, 
  ChevronDown,
  Truck
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'সুনাম শপ (SUNAM SHOP) — Grocery & Fresh Market | Sunamganj Sadar',
  description: 'সুনামগঞ্জ সদরের সবচেয়ে বিশ্বস্ত অনলাইন সুপারশপ ও তাজা বাজার। তাজা মাছ, শাকসবজি, মাংস ও নিত্যপ্রয়োজনীয় গ্রোসারি হোম ডেলিভারি।',
  openGraph: {
    title: 'সুনাম শপ (SUNAM SHOP) — গ্রোসারি ও তাজা বাজার',
    description: 'আপনার বাজার, এখন আপনার হাতেই। সুনামগঞ্জ সদর পৌর এলাকা ও উপ-শহরে দ্রুততম হোম ডেলিভারি।',
    locale: 'bn_BD',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const categories = [
    { name_bn: 'চাল, ডাল ও আটা', name_en: 'Rice, Lentils & Flour', slug: 'rice-lentils-flour', icon: '🌾' },
    { name_bn: 'তেল ও রান্নার মসলা', name_en: 'Oil & Spices', slug: 'oil-spices', icon: '🧂' },
    { name_bn: 'তাজা মাছ (হাওর ও নদী)', name_en: 'Fresh Fish (River Catch)', slug: 'fresh-fish', icon: '🐟' },
    { name_bn: 'তাজা মাংস ও মুরগি', name_en: 'Meat & Chicken', slug: 'meat-poultry', icon: '🍗' },
    { name_bn: 'তাজা শাকসবজি', name_en: 'Fresh Vegetables', slug: 'fresh-vegetables', icon: '🥦' },
    { name_bn: 'তাজা ফলমূল', name_en: 'Fresh Fruits', slug: 'fruits', icon: '🍎' },
    { name_bn: 'দুধ ও ফার্মের ডিম', name_en: 'Milk, Dairy & Eggs', slug: 'milk-eggs', icon: '🥛' },
    { name_bn: 'স্ন্যাকস ও পানীয়', name_en: 'Snacks & Beverages', slug: 'snacks-beverages', icon: '🥤' },
    { name_bn: 'টয়লেট্রিস ও গৃহস্থালি', name_en: 'Toiletries & Household', slug: 'household-goods', icon: '🧼' },
  ];

  return (
    <html lang="bn" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-[#F9FBFA] text-gray-900 font-bangla antialiased selection:bg-emerald-100 selection:text-emerald-900">
        
        {/* 1. TOP ANNOUNCEMENT BAR */}
        <div className="bg-store-dark text-white text-[12px] py-2 px-4 sm:px-8 border-b border-white/10 w-full">
          <div className="max-w-[1720px] mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 font-medium">
              <Truck size={14} className="text-emerald-400" />
              <span>সুনামগঞ্জ সদরে ২০০+ টাকার অর্ডারে ফ্রি হোম ডেলিভারি! | Free Delivery on orders over BDT 200</span>
            </div>

            <div className="hidden md:flex items-center gap-6 text-[11px] text-gray-300 font-sans">
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold font-bangla">
                <Phone size={12} />
                <span>হেল্পলাইন: 01700-000000</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bangla font-bold text-white">বাংলা</span>
                <span className="text-gray-500">|</span>
                <span>EN</span>
              </div>
              <div className="flex items-center gap-1">
                <span>BDT (৳)</span>
                <ChevronDown size={11} />
              </div>
              <a href="/account/login" className="flex items-center gap-1.5 hover:text-white transition font-medium">
                <User size={13} />
                <span className="font-bangla">লগইন / Login</span>
              </a>
            </div>
          </div>
        </div>

        {/* 2. MAIN NAVBAR */}
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm transition-all w-full">
          <div className="max-w-[1720px] mx-auto px-4 sm:px-8 h-20 flex items-center justify-between gap-6">
            
            {/* Brand Logo */}
            <a href="/" className="flex items-center gap-2.5 group flex-shrink-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-store-primary group-hover:scale-105 transition shadow-sm">
                <ShoppingBag size={22} className="text-store-primary" />
              </div>
              <div>
                <span className="text-2xl font-black tracking-tight text-gray-900 block leading-tight font-sans">
                  SUNAM <span className="text-store-primary">SHOP</span>
                </span>
                <span className="text-[10px] text-gray-400 block -mt-0.5 tracking-widest font-sans uppercase font-bold">
                  GROCERY & FRESH MARKET
                </span>
              </div>
            </a>

            {/* Navigation Links with Category Dropdown */}
            <nav className="hidden xl:flex items-center gap-7 text-[13px] font-semibold text-gray-700 font-sans">
              <a href="/" className="text-store-primary border-b-2 border-store-primary pb-1 font-bold">
                হোম (Home)
              </a>
              
              <a href="#best-sellers" className="hover:text-store-primary transition pb-1">
                শপ (Shop)
              </a>

              {/* Dynamic Category Dropdown Leaf Component */}
              <CategoryDropdown categories={categories} />

              <a href="#offers" className="hover:text-store-primary transition pb-1">
                অফার (Offers)
              </a>
              <a href="#best-sellers" className="hover:text-store-primary transition pb-1">
                নতুন আগমন (New Arrivals)
              </a>
              <a href="#delivery-info" className="hover:text-store-primary transition pb-1">
                ডেলিভারি এরিয়া (Areas)
              </a>
              <a href="/contact" className="hover:text-store-primary transition pb-1">
                যোগাযোগ (Contact)
              </a>
            </nav>

            {/* Search Bar */}
            <div className="hidden lg:flex items-center relative flex-1 max-w-sm">
              <input
                type="text"
                placeholder="পণ্য খুঁজুন... (Search groceries)"
                className="w-full pl-9 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-full focus:bg-white focus:border-store-primary focus:ring-2 focus:ring-emerald-100 transition-all outline-none"
              />
              <Search size={14} className="absolute left-3.5 text-gray-400" />
            </div>

            {/* Right Action Icons: Wishlist & Cart */}
            <div className="flex items-center gap-3.5 flex-shrink-0">
              <button className="hidden sm:flex p-2 text-gray-600 hover:text-store-primary hover:bg-gray-50 rounded-full transition relative">
                <Heart size={20} />
                <span className="w-1.5 h-1.5 rounded-full bg-store-accent absolute top-2 right-2"></span>
              </button>

              <a
                href="/cart"
                className="flex items-center gap-2.5 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100/90 border border-emerald-200/80 rounded-full text-store-primary font-bold text-xs transition shadow-sm"
              >
                <div className="relative">
                  <ShoppingBag size={18} />
                  <span className="w-4 h-4 rounded-full bg-store-primary text-white text-[10px] font-bold flex items-center justify-center absolute -top-1.5 -right-2 font-sans">
                    0
                  </span>
                </div>
                <span className="hidden sm:inline font-sans font-bold text-gray-900">৳ ০.০০</span>
              </a>
            </div>

          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 w-full">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-store-dark text-gray-400 text-xs mt-20 border-t border-white/10 w-full">
          <div className="max-w-[1720px] mx-auto px-4 sm:px-8 py-16 grid grid-cols-1 md:grid-cols-4 gap-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-store-primary text-white flex items-center justify-center">
                  <ShoppingBag size={22} />
                </div>
                <div>
                  <span className="text-white font-black text-lg font-sans block leading-tight">
                    SUNAM SHOP
                  </span>
                  <span className="text-[10px] text-emerald-400 font-sans tracking-widest uppercase font-bold">
                    সুনাম শপ — গ্রোসারি ও তাজা বাজার
                  </span>
                </div>
              </div>
              <p className="text-gray-400 text-xs leading-relaxed mb-4">
                "আপনার বাজার, এখন আপনার হাতেই।" সুনামগঞ্জ পৌর শহরের প্রতিটি ঘরে সকাল-সন্ধ্যা টাটকা মাছ, মাংস ও খাঁটি মুদি পণ্য নির্ভরযোগ্যভাবে পৌঁছে দেওয়ার স্থানীয় অনলাইন প্ল্যাটফর্ম।
              </p>
              <div className="flex items-center gap-2 text-white text-xs font-bold">
                <Phone size={14} className="text-emerald-400" />
                <span>হেল্পলাইন: 01700-000000 (সকাল ৭টা - রাত ৯টা)</span>
              </div>
            </div>

            <div>
              <h4 className="text-white font-bold text-sm mb-4">ডেলিভারি এলাকা (Delivery Coverage)</h4>
              <ul className="space-y-2 text-xs">
                <li>• হাসন নগর ও নতুনপাড়া (Hasason Nagar & Notunpara)</li>
                <li>• পুরাতন জেল রোড ও ষোলঘর (Puraton Jail Road & Shologhor)</li>
                <li>• আরপিন নগর ও ট্রাফিক পয়েন্ট (Arpin Nagar & Traffic Point)</li>
                <li>• জগন্নাথবাড়ি রোড ও কাজীর পয়েন্ট (Jagannathbari Road)</li>
                <li>• ওয়েজখালী ও মোল্লাপাড়া (Oyezkhali & Mollapara)</li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold text-sm mb-4">নীতিমালা ও লিংক (Quick Links)</h4>
              <ul className="space-y-2 text-xs">
                <li><a href="/about" className="hover:text-white transition">আমাদের সম্পর্কে (About Us)</a></li>
                <li><a href="/delivery-policy" className="hover:text-white transition">ডেলিভারি পলিসি ও চার্জ (Delivery Policy)</a></li>
                <li><a href="/return-policy" className="hover:text-white transition">রিটার্ন ও রিফান্ড পলিসি (Refund Policy)</a></li>
                <li><a href="/terms" className="hover:text-white transition">ব্যবহারের শর্তাবলী (Terms & Conditions)</a></li>
                <li><a href="/privacy" className="hover:text-white transition">গোপনীয়তা নীতি (Privacy Policy)</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold text-sm mb-4">সেন্ট্রাল হাব ও সেবাসমূহ (Hub & Hours)</h4>
              <p className="text-xs mb-2 leading-relaxed">
                সুনামগঞ্জ সদর, সুনামগঞ্জ-৩০০০, সিলেট বিভাগ, বাংলাদেশ।
              </p>
              <p className="text-xs text-emerald-400 font-semibold mb-3">
                🕒 প্রতিদিন সকাল ৭:০০ টা হতে রাত ৯:০০ টা পর্যন্ত অর্ডার গ্রহণ ও ডেলিভারি।
              </p>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-[11px] leading-relaxed">
                💵 <strong className="text-white">Cash on Delivery (ক্যাশ অন ডেলিভারি):</strong> পণ্য হাতে পেয়ে চেক করে সম্পূর্ণ নিরাপদ মূল্য পরিশোধের সুবিধা।
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 py-6 text-xs text-gray-500 max-w-[1720px] mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p>© {new Date().getFullYear()} SUNAM SHOP. All Rights Reserved. Built with precision for Sunamganj Sadar.</p>
            <p className="text-gray-400 font-sans">Local E-Commerce & Home Delivery System</p>
          </div>
        </footer>

      </body>
    </html>
  );
}
