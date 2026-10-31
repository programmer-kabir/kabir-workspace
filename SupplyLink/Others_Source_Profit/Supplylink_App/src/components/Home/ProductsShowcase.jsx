import React, { useState, useMemo } from "react";
import {
  FiSmartphone,
  FiShoppingBag,
  FiTv,
  FiSearch,
  FiCheckCircle,
  FiArrowRight,
  FiTag,
} from "react-icons/fi";
import { FaMotorcycle, FaLaptop, FaWhatsapp } from "react-icons/fa";
import { getWhatsAppUrl } from "../../constants/links";

const CATEGORIES = [
  { id: "all", name: "সকল পণ্য", icon: FiShoppingBag },
  { id: "phone", name: "স্মার্টফোন", icon: FiSmartphone },
  { id: "bike", name: "মোটরসাইকেল", icon: FaMotorcycle },
  { id: "laptop", name: "ল্যাপটপ ও পিসি", icon: FaLaptop },
  { id: "appliance", name: "হোম অ্যাপ্লায়েন্স", icon: FiTv },
];

const PRODUCTS = [
  // ================= SMARTPHONES =================
  {
    id: 1,
    category: "phone",
    name: "Redmi Note 13 (8GB / 256GB)",
    brand: "Xiaomi Official",
    mrp: 22999,
    badge: "সেরা পছন্দ",
    icon: "📱",
    specs: "108MP ক্যামেরা • 120Hz AMOLED • 33W ফাস্ট চার্জ",
  },
  {
    id: 2,
    category: "phone",
    name: "Redmi 13C (6GB / 128GB)",
    brand: "Xiaomi Official",
    mrp: 14999,
    badge: "বাজেট সেলার",
    icon: "📱",
    specs: "50MP ট্রিপল ক্যামেরা • 5000mAh ব্যাটারি",
  },
  {
    id: 3,
    category: "phone",
    name: "Realme C67 (8GB / 128GB)",
    brand: "Realme Official",
    mrp: 19999,
    badge: "জনপ্রিয় ফোন",
    icon: "📱",
    specs: "108MP আল্ট্রা ক্লিয়ার ক্যামেরা • Snapdragon 685",
  },
  {
    id: 4,
    category: "phone",
    name: "Realme 12+ 5G (8GB / 256GB)",
    brand: "Realme Official",
    mrp: 37999,
    badge: "৫জি স্পিড",
    icon: "📱",
    specs: "Sony LYT-600 OIS • 67W SuperVOOC চার্জ",
  },
  {
    id: 5,
    category: "phone",
    name: "Realme Note 50 (4GB / 64GB)",
    brand: "Realme Official",
    mrp: 10999,
    badge: "কম বাজেটে সেরা",
    icon: "📱",
    specs: "90Hz ডিসপ্লে • IP54 ডাস্ট ও স্প্ল্যাশ প্রুফ",
  },
  {
    id: 6,
    category: "phone",
    name: "Vivo Y27s (8GB / 128GB)",
    brand: "Vivo Official",
    mrp: 19999,
    badge: "স্টাইলিশ লুক",
    icon: "📱",
    specs: "44W ফ্ল্যাশচার্জ • Snapdragon 680 প্রসেসর",
  },
  {
    id: 7,
    category: "phone",
    name: "Vivo Y17s (6GB / 128GB)",
    brand: "Vivo Official",
    mrp: 14999,
    badge: "বাজেট ফ্রেন্ডলি",
    icon: "📱",
    specs: "50MP পোর্ট্রেট ক্যামেরা • 5000mAh দীর্ঘস্থায়ী ব্যাটারি",
  },
  {
    id: 8,
    category: "phone",
    name: "Vivo V30 Lite (8GB / 256GB)",
    brand: "Vivo Official",
    mrp: 32999,
    badge: "প্রিমিয়াম ক্যামেরা",
    icon: "📱",
    specs: "80W ফাস্ট চার্জ • 120Hz AMOLED • অরা লাইট",
  },
  {
    id: 9,
    category: "phone",
    name: "Oppo A78 (8GB / 256GB)",
    brand: "Oppo Official",
    mrp: 23990,
    badge: "বেস্ট সেলার",
    icon: "📱",
    specs: "67W SUPERVOOC চার্জ • FHD+ AMOLED ডিসপ্লে",
  },
  {
    id: 10,
    category: "phone",
    name: "Oppo A58 (6GB / 128GB)",
    brand: "Oppo Official",
    mrp: 17990,
    badge: "জনপ্রিয় মডেল",
    icon: "📱",
    specs: "33W ফাস্ট চার্জ • 50MP AI ক্যামেরা • স্টেরিও স্পিকার",
  },
  {
    id: 11,
    category: "phone",
    name: "Samsung Galaxy A15 (6GB / 128GB)",
    brand: "Samsung Official",
    mrp: 20999,
    badge: "স্যামসাং অফিসিয়াল",
    icon: "📱",
    specs: "Super AMOLED 90Hz • 50MP ট্রিপল ক্যামেরা",
  },
  {
    id: 12,
    category: "phone",
    name: "Samsung Galaxy A05s (4GB / 64GB)",
    brand: "Samsung Official",
    mrp: 16999,
    badge: "বাজেট স্যামসাং",
    icon: "📱",
    specs: "FHD+ স্ক্রিন • 25W ফাস্ট চার্জিং সাপোর্ট",
  },

  // ================= MOTORCYCLES & BIKES =================
  {
    id: 13,
    category: "bike",
    name: "Suzuki Gixxer Monotone (155cc)",
    brand: "Suzuki Official",
    mrp: 205950,
    badge: "সবচেয়ে জনপ্রিয়",
    icon: "🏍️",
    specs: "155cc SEP ইঞ্জিন • ডিস্ক ব্রেক • স্মার্ট স্পোর্টস লুক",
  },
  {
    id: 14,
    category: "bike",
    name: "Suzuki Gixxer SF Fi ABS (155cc)",
    brand: "Suzuki Official",
    mrp: 239950,
    badge: "স্পোর্টস ফেয়ারিং",
    icon: "🏍️",
    specs: "ফুল ফেয়ারিং • সিঙ্গেল চ্যানেল ABS • Fi টেকনোলজি",
  },
  {
    id: 15,
    category: "bike",
    name: "Hero Splendor+ XTEC (100cc)",
    brand: "Hero MotoCorp",
    mrp: 124990,
    badge: "সেরা মাইলেজ",
    icon: "🏍️",
    specs: "ডিজিটাল মিটার • ব্লুটুথ কানেক্টিভিটি • সর্বোচ্চ মাইলেজ",
  },
  {
    id: 16,
    category: "bike",
    name: "Hero Thriller 160R Fi ABS (160cc)",
    brand: "Hero MotoCorp",
    mrp: 195000,
    badge: "১৬০সিসি পাওয়ার",
    icon: "🏍️",
    specs: "০-৬০ কিমি মাত্র ৪.৭ সেকেন্ডে • ফ্রন্ট ABS • LED লাইট",
  },
  {
    id: 17,
    category: "bike",
    name: "Hero Hunk 150R Double Disc (150cc)",
    brand: "Hero MotoCorp",
    mrp: 175000,
    badge: "ম্যাসকুলার বাইক",
    icon: "🏍️",
    specs: "150cc শক্তিশালী ইঞ্জিন • ডাবল ডিস্ক • মনোশক সাসপেনশন",
  },
  {
    id: 18,
    category: "bike",
    name: "Honda Livo 110 Disc (110cc)",
    brand: "Honda Official",
    mrp: 128500,
    badge: "হোন্ডা কমিউটার",
    icon: "🏍️",
    specs: "কম্প্যাক্ট ও টেকসই • ফ্রন্ট ডিস্ক ব্রেক • দারুণ মাইলেজ",
  },
  {
    id: 19,
    category: "bike",
    name: "Honda X-Blade 160 Single Disc (160cc)",
    brand: "Honda Official",
    mrp: 195000,
    badge: "রোবোটিক লুক",
    icon: "🏍️",
    specs: "রোবো-ফেস LED হেডল্যাম্প • ডুয়াল আউটলেট মাফলার",
  },
  {
    id: 20,
    category: "bike",
    name: "Bajaj Pulsar 150 Single Disc (150cc)",
    brand: "Bajaj Official",
    mrp: 192500,
    badge: "কিং অব কমফোর্ট",
    icon: "🏍️",
    specs: "DTS-i টুইন স্পার্ক ইঞ্জিন • ক্ল্যাসিক ও নির্ভরযোগ্য",
  },
  {
    id: 21,
    category: "bike",
    name: "Yamaha FZ-S Fi V3 Deluxe (150cc)",
    brand: "Yamaha Official",
    mrp: 262000,
    badge: "টপ প্রিমিয়াম",
    icon: "🏍️",
    specs: "ব্লু-কোর Fi ইঞ্জিন • সিঙ্গেল চ্যানেল ABS • এলইডি লাইটিং",
  },

  // ================= LAPTOPS =================
  {
    id: 22,
    category: "laptop",
    name: "HP 15s Core i5 12th Gen (8GB/512GB SSD)",
    brand: "HP Official",
    mrp: 69000,
    badge: "অফিস ও ফ্রিল্যান্সিং",
    icon: "💻",
    specs: "Intel Core i5-1235U • 15.6\" FHD • ব্যাকলিট কীবোর্ড",
  },
  {
    id: 23,
    category: "laptop",
    name: "HP 15s Core i3 12th Gen (8GB/512GB SSD)",
    brand: "HP Official",
    mrp: 52000,
    badge: "স্টুডেন্ট বাজেট",
    icon: "💻",
    specs: "Intel Core i3-1215U • দীর্ঘস্থায়ী ব্যাটারি ব্যাকআপ",
  },
  {
    id: 24,
    category: "laptop",
    name: "Dell Inspiron 15 Core i3 (8GB/512GB SSD)",
    brand: "Dell Official",
    mrp: 56000,
    badge: "শক্তিশালী বডি",
    icon: "💻",
    specs: "15.6\" অ্যান্টি-গ্লেয়ার স্ক্রিন • এক্সপ্রেস চার্জ সুবিধা",
  },
  {
    id: 25,
    category: "laptop",
    name: "Lenovo IdeaPad 3 Core i3 (8GB/512GB SSD)",
    brand: "Lenovo Official",
    mrp: 48500,
    badge: "বাজেট ল্যাপটপ",
    icon: "💻",
    specs: "স্লিম ও হালকা • প্রাইভেসি শাটার ক্যামেরা • ডলবি অডিও",
  },

  // ================= HOME APPLIANCES =================
  {
    id: 26,
    category: "appliance",
    name: "Walton 213L Direct Cool Refrigerator",
    brand: "Walton Inverter",
    mrp: 38500,
    badge: "বেস্ট সেলার ফ্রিজ",
    icon: "❄️",
    specs: "স্মার্ট ইনভার্টার কম্প্রেসার • বিদ্যুৎ সাশ্রয়ী • ১২ বছর ওয়ারেন্টি",
  },
  {
    id: 27,
    category: "appliance",
    name: "Walton 254L Non-Frost Refrigerator",
    brand: "Walton Inverter",
    mrp: 46900,
    badge: "নন-ফ্রস্ট মডেল",
    icon: "❄️",
    specs: "আইস ফ্রি কুলিং • মেটালিক ডোর • পরিবেশবান্ধব গ্যাস",
  },
  {
    id: 28,
    category: "appliance",
    name: "Singer 43\" 4K Smart Android TV",
    brand: "Singer Official",
    mrp: 34900,
    badge: "৪কে স্মার্ট টিভি",
    icon: "📺",
    specs: "গুগল টিভি ওএস • বেজেল-লেস ডিজাইন • ভয়েস কন্ট্রোল",
  },
  {
    id: 29,
    category: "appliance",
    name: "Walton 32\" Smart Frameless TV",
    brand: "Walton Official",
    mrp: 18500,
    badge: "বাজেট স্মার্ট টিভি",
    icon: "📺",
    specs: "ইউটিউব ও নেটফ্লিক্স সাপোর্ট • HD ক্লিয়ার ভিউ",
  },
  {
    id: 30,
    category: "appliance",
    name: "Walton 1.0 Ton Inverter AC",
    brand: "Walton Official",
    mrp: 48000,
    badge: "ইনভার্টার এসি",
    icon: "❄️",
    specs: "দ্রুত কুলিং • ৭০% বিদ্যুৎ সাশ্রয় • ১০ বছর কম্প্রেসার গ্যারান্টি",
  },
  {
    id: 31,
    category: "appliance",
    name: "Haier 1.5 Ton Clean Cool Inverter AC",
    brand: "Haier Official",
    mrp: 65000,
    badge: "দেড় টন ইনভার্টার",
    icon: "❄️",
    specs: "সেলফ ক্লিনিং টেকনোলজি • ট্রিপল ইনভার্টার স্পিড",
  },
];

export default function ProductsShowcase() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter products by category and search query
  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter((item) => {
      const matchCat =
        activeCategory === "all" || item.category === activeCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.brand.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [activeCategory, searchQuery]);

  return (
    <section id="products" className="py-14 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-slate-50/70 border-t border-slate-200/60">
      <div className=" mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto">
          <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 bg-indigo-50 border border-indigo-100 px-3.5 py-1.5 rounded-full mb-3">
            সহজ কিস্তিতে পণ্য ক্যাটালগ
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
            জনপ্রিয় স্মার্টফোন, মোটরসাইকেল ও অ্যাপ্লায়েন্স
          </h2>
          <p className="mt-3 text-slate-600 text-sm sm:text-base">
            সুনামগঞ্জ সদরে আসল বাজার মূল্যে ন্যূনতম ৩০% ডাউনপেমেন্টে যেকোনো অফিসিয়াল পণ্য কিস্তিতে বুক করুন।
          </p>
        </div>

        {/* Search Bar & Category Tabs */}
        <div className="mt-10 max-w-xl mx-auto">
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
            <input
              type="text"
              placeholder="পণ্য বা মডেল দিয়ে খুঁজুন (যেমন: Gixxer, Splendor, Redmi, Vivo, Fridge...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 py-3.5 pl-11 pr-4 text-xs sm:text-sm text-slate-900 outline-none focus:border-indigo-600 focus:bg-white shadow-xs transition"
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            const count =
              cat.id === "all"
                ? PRODUCTS.length
                : PRODUCTS.filter((p) => p.category === cat.id).length;

            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  isActive
                    ? "bg-slate-900 text-white shadow-md scale-105"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{cat.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                    isActive ? "bg-white/20 text-white" : "bg-white text-slate-500"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Products Grid */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-7">
          {filteredProducts.map((product) => {
            const downPayment = Math.round(product.mrp * 0.3);
            const remaining = product.mrp - downPayment;
            const emi12 = Math.ceil((remaining * 1.15) / 12);
            const emi6 = Math.ceil((remaining * 1.1) / 6);

            const waMessage = `হ্যালো SupplyLink, আমি কিস্তিতে "${product.name}" (মূল্য: ৳ ${product.mrp.toLocaleString()}) নিতে আগ্রহী। ডাউনপেমেন্ট ৳ ${downPayment.toLocaleString()} এবং মাসিক কিস্তির প্রসেসটি জানতে চাই।`;
            const waUrl = getWhatsAppUrl(waMessage);

            return (
              <div
                key={product.id}
                className="group relative flex flex-col rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm hover:shadow-xl hover:border-indigo-400 transition-all duration-300"
              >
                {/* Product Header: Brand & Badge */}
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                  <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
                    {product.brand}
                  </span>
                  <span className="rounded-full bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-0.5 text-[10px] font-bold">
                    {product.badge}
                  </span>
                </div>

                {/* Product Icon & Name */}
                <div className="py-5 flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-slate-100 to-indigo-50/60 text-2xl shadow-inner group-hover:scale-110 transition-transform">
                    {product.icon}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm sm:text-base leading-snug group-hover:text-indigo-600 transition-colors">
                      {product.name}
                    </h3>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-xs text-slate-400">বাজার মূল্য:</span>
                      <span className="font-mono text-sm font-bold text-slate-800">
                        ৳ {product.mrp.toLocaleString()}
                      </span>
                    </div>
                    {product.specs && (
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                        {product.specs}
                      </p>
                    )}
                  </div>
                </div>

                {/* EMI & Financial Breakdown Box */}
                <div className="mt-auto rounded-2xl bg-slate-50 p-4 border border-slate-100 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-medium text-slate-500">
                          ১২ মাসের কিস্তি
                        </span>
                        <span className="text-[9px] font-bold text-slate-700 bg-slate-200/80 px-1.5 py-0.2 rounded">
                          ১৫% ফি
                        </span>
                      </div>
                      <div className="text-lg font-black font-mono text-emerald-600 mt-0.5">
                        ৳ {emi12.toLocaleString()}
                        <span className="text-[10px] font-normal text-slate-400">
                          {" "}
                          /মাস
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="text-[10px] font-medium text-slate-500">
                          ৬ মাসের কিস্তি
                        </span>
                        <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.2 rounded">
                          ১০% ফি
                        </span>
                      </div>
                      <div className="text-sm font-bold font-mono text-slate-700 mt-0.5">
                        ৳ {emi6.toLocaleString()}
                        <span className="text-[10px] font-normal text-slate-400">
                          {" "}
                          /মাস
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-500">
                      ডাউনপেমেন্ট (৩০%):
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      ৳ {downPayment.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-dashed border-slate-200/60 pt-1.5">
                    <span>✓ হিডেন চার্জ ৳০</span>
                    <span className="text-emerald-600 font-semibold">আগে দিলে রিবেট ছাড়</span>
                  </div>
                </div>

                {/* Direct WhatsApp Booking Button */}
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white text-xs sm:text-sm font-bold shadow-md shadow-green-500/20 transition-all hover:scale-[1.01] active:scale-95 cursor-pointer"
                >
                  <FaWhatsapp className="h-4 w-4" />
                  <span>WhatsApp-এ বুক করুন</span>
                </a>
              </div>
            );
          })}
        </div>

        {/* Empty Search State */}
        {filteredProducts.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-base font-bold text-slate-700">
              দুঃখিত, আপনার খোঁজা নামের কোনো পণ্য পাওয়া যায়নি।
            </p>
            <p className="text-xs text-slate-500 mt-1">
              যেকোনো পছন্দের মডেলের নাম লিখে আমাদের সরাসরি WhatsApp-এ জানান।
            </p>
          </div>
        )}

        {/* Custom Request Banner */}
        <div className="mt-14 rounded-3xl border border-indigo-100 bg-gradient-to-r from-indigo-50 via-purple-50/50 to-indigo-50 p-6 sm:p-8 text-center flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-left">
            <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider block">
              কাস্টম অর্ডার সুবিধা
            </span>
            <h4 className="font-extrabold text-slate-900 text-lg sm:text-xl mt-0.5">
              তালিকায় আপনার পছন্দের নির্দিষ্ট কোনো পণ্য নেই?
            </h4>
            <p className="text-slate-600 text-xs sm:text-sm mt-1">
              যেকোনো গ্যাজেট, বাইক, ল্যাপটপ বা শোরুম পণ্যের নাম লিখে WhatsApp-এ মেসেজ দিন। আমরা সরবরাহ করব।
            </p>
          </div>
          <a
            href={getWhatsAppUrl("হ্যালো SupplyLink, আমি তালিকায় নেই এমন একটি নির্দিষ্ট মডেল কিস্তিতে নিতে চাই। বিস্তারিত জানাবেন।")}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/25 transition-all"
          >
            <span>কাস্টম পণ্যের আবেদন</span>
            <FiArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
