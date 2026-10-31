import React, { useState } from "react";
import {
  FiCheckCircle,
  FiMaximize2,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiMapPin,
  FiShoppingBag,
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { getWhatsAppUrl } from "../../constants/links";

const GALLERY_ITEMS = [
  {
    id: 1,
    src: "https://supplylinkbd.com/img/customer_with_product/(1).jpg",
    title: "অফিসিয়াল স্মার্টফোন ডেলিভারি",
    category: "phone",
    location: "মঙ্গলকাটা, সুনামগঞ্জ সদর",
    tag: "স্মার্টফোন",
  },
  {
    id: 2,
    src: "https://supplylinkbd.com/img/customer_with_product/(2).jpg",
    title: "মোটরসাইকেল কিস্তি হস্তান্তর",
    category: "bike",
    location: "জাহাঙ্গীরনগর, সুনামগঞ্জ সদর",
    tag: "মোটরসাইকেল",
  },
  {
    id: 3,
    src: "https://supplylinkbd.com/img/customer_with_product/(3).jpg",
    title: "স্মার্টফোন কিস্তি ডেলিভারি",
    category: "phone",
    location: "ইসলামপুর, সুনামগঞ্জ সদর",
    tag: "স্মার্টফোন",
  },
  {
    id: 4,
    src: "https://supplylinkbd.com/img/customer_with_product/(4).jpg",
    title: "রেফ্রিজারেটর ডেলিভারি সম্পন্ন",
    category: "appliance",
    location: "সুরমা, সুনামগঞ্জ",
    tag: "হোম অ্যাপ্লায়েন্স",
  },
  {
    id: 5,
    src: "https://supplylinkbd.com/img/customer_with_product/(5).jpg",
    title: "স্মার্ট এলইডি টিভি ডেলিভারি",
    category: "appliance",
    location: "মঙ্গলকাটা বাজার",
    tag: "হোম অ্যাপ্লায়েন্স",
  },
  {
    id: 6,
    src: "https://supplylinkbd.com/img/customer_with_product/(6).jpg",
    title: "গ্যাজেট ও স্মার্টফোন হস্তান্তর",
    category: "phone",
    location: "সুনামগঞ্জ সদর",
    tag: "স্মার্টফোন",
  },
  {
    id: 7,
    src: "https://supplylinkbd.com/img/customer_with_product/(7).jpg",
    title: "মোটরসাইকেল কিস্তি ডেলিভারি",
    category: "bike",
    location: "মঙ্গলকাটা, সুনামগঞ্জ সদর",
    tag: "মোটরসাইকেল",
  },
  {
    id: 8,
    src: "https://supplylinkbd.com/img/customer_with_product/(8).jpg",
    title: "নতুন মডেলের ফোন ডেলিভারি",
    category: "phone",
    location: "জাহাঙ্গীরনগর, সুনামগঞ্জ",
    tag: "স্মার্টফোন",
  },
  {
    id: 9,
    src: "https://supplylinkbd.com/img/customer_with_product/(9).jpg",
    title: "হোম অ্যাপ্লায়েন্স কিস্তি প্রদান",
    category: "appliance",
    location: "ইসলামপুর, সুনামগঞ্জ",
    tag: "হোম অ্যাপ্লায়েন্স",
  },
  {
    id: 10,
    src: "https://supplylinkbd.com/img/customer_with_product/(10).jpg",
    title: "স্মার্টফোন কিস্তি ডেলিভারি",
    category: "phone",
    location: "মঙ্গলকাটা, সুনামগঞ্জ",
    tag: "স্মার্টফোন",
  },
  {
    id: 11,
    src: "https://supplylinkbd.com/img/customer_with_product/(11).jpg",
    title: "গ্রাহক সন্তুষ্টি ও পণ্য গ্রহণ",
    category: "phone",
    location: "সুনামগঞ্জ সদর",
    tag: "স্মার্টফোন",
  },
  {
    id: 12,
    src: "https://supplylinkbd.com/img/customer_with_product/(12).jpg",
    title: "মোটরসাইকেল ডেলিভারি সেলিব্রেশন",
    category: "bike",
    location: "মঙ্গলকাটা বাজার",
    tag: "মোটরসাইকেল",
  },
];

const CATEGORIES = [
  { id: "all", label: "সকল ডেলিভারি" },
  { id: "phone", label: "স্মার্টফোন ও গ্যাজেট" },
  { id: "bike", label: "মোটরসাইকেল" },
  { id: "appliance", label: "হোম অ্যাপ্লায়েন্স" },
];

export default function About() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedItemIndex, setSelectedItemIndex] = useState(null);

  const filteredItems =
    activeFilter === "all"
      ? GALLERY_ITEMS
      : GALLERY_ITEMS.filter((item) => item.category === activeFilter);

  const activeModalItem =
    selectedItemIndex !== null ? filteredItems[selectedItemIndex] : null;

  const handlePrev = (e) => {
    e.stopPropagation();
    setSelectedItemIndex((prev) =>
      prev === 0 ? filteredItems.length - 1 : prev - 1
    );
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setSelectedItemIndex((prev) =>
      prev === filteredItems.length - 1 ? 0 : prev + 1
    );
  };

  return (
    <section id="about" className="py-14 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white border-t border-slate-200/60 relative">
      <div className=" mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 bg-indigo-50 border border-indigo-100 px-3.5 py-1.5 rounded-full mb-3">
            বাস্তব ডেলিভারি অ্যালবাম
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            সন্তুষ্ট গ্রাহকদের সরাসরি ডেলিভারি গ্যালারি
          </h2>
          <p className="mt-3 text-slate-600 text-sm sm:text-base">
            সুনামগঞ্জ সদর ও আশপাশের শত শত গ্রাহক নির্ভরযোগ্য কিস্তিতে স্মার্টফোন, বাইক ও অ্যাপ্লায়েন্স ডেলিভারি বুঝে নিয়েছেন।
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-10">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveFilter(cat.id);
                setSelectedItemIndex(null);
              }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeFilter === cat.id
                  ? "bg-slate-900 text-white shadow-md scale-105"
                  : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {filteredItems.map((item, index) => (
            <div
              key={item.id}
              onClick={() => setSelectedItemIndex(index)}
              className="group relative overflow-hidden rounded-3xl bg-white border border-slate-200/90 shadow-sm aspect-square cursor-pointer hover:shadow-2xl hover:border-indigo-500/50 transition-all duration-300"
            >
              {/* Image */}
              <img
                src={item.src}
                alt={item.title}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-108"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />

              {/* Permanent / Hover Glass Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent opacity-85 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-between">
                {/* Top Badge */}
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-slate-900/80 backdrop-blur-md border border-white/20 text-white px-2.5 py-0.5 text-[10px] font-bold">
                    {item.tag}
                  </span>
                  <div className="h-7 w-7 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <FiMaximize2 className="h-3.5 w-3.5" />
                  </div>
                </div>

                {/* Bottom Title & Location */}
                <div>
                  <h4 className="font-bold text-white text-xs sm:text-sm leading-snug drop-shadow-md">
                    {item.title}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-300 mt-1">
                    <FiMapPin className="text-emerald-400 h-3 w-3 shrink-0" />
                    <span>{item.location}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Lightbox Modal for Full View */}
        {activeModalItem && (
          <div
            onClick={() => setSelectedItemIndex(null)}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-4 sm:p-6 animate-fade-in"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-2xl w-full rounded-3xl bg-slate-900 border border-white/10 overflow-hidden shadow-2xl flex flex-col text-white"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedItemIndex(null)}
                className="absolute top-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-slate-950/70 text-white hover:bg-white hover:text-slate-950 transition"
              >
                <FiX className="h-5 w-5" />
              </button>

              {/* Modal Image */}
              <div className="relative aspect-[4/3] bg-black flex items-center justify-center overflow-hidden">
                <img
                  src={activeModalItem.src}
                  alt={activeModalItem.title}
                  className="max-h-full max-w-full object-contain"
                />

                {/* Left Arrow */}
                <button
                  onClick={handlePrev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-950/70 text-white hover:bg-white hover:text-slate-950 transition"
                >
                  <FiChevronLeft className="h-5 w-5" />
                </button>

                {/* Right Arrow */}
                <button
                  onClick={handleNext}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-950/70 text-white hover:bg-white hover:text-slate-950 transition"
                >
                  <FiChevronRight className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Bottom Info */}
              <div className="p-5 sm:p-6 bg-slate-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-white/10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold flex items-center gap-1">
                      <FiCheckCircle className="h-3 w-3" />
                      <span>ভেরিফাইড ডেলিভারি</span>
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {selectedItemIndex + 1} / {filteredItems.length}
                    </span>
                  </div>
                  <h3 className="font-bold text-white text-base sm:text-lg">
                    {activeModalItem.title}
                  </h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                    <FiMapPin className="text-emerald-400 h-3.5 w-3.5" />
                    <span>{activeModalItem.location}</span>
                  </p>
                </div>

                <a
                  href={getWhatsAppUrl(`হ্যালো SupplyLink, আমি আপনাদের গ্যালারিতে "${activeModalItem.title}" দেখেছি। আমিও কিস্তিতে পণ্য নিতে আগ্রহী।`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white text-xs font-bold shadow-md shadow-green-500/20 transition-all shrink-0"
                >
                  <FaWhatsapp className="h-4 w-4" />
                  <span>এই কিস্তির নিয়ম জানুন</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Local Office Bottom CTA */}
        <div className="mt-14 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 text-center flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="text-left">
            <span className="text-indigo-600 text-[11px] font-bold uppercase tracking-wider block">
              সরাসরি অফিসে আমন্ত্রণ
            </span>
            <h4 className="font-extrabold text-slate-900 text-base sm:text-lg mt-0.5">
              অফিসে এসে নিজে দেখে পণ্য ও কিস্তি নিশ্চিত করতে চান?
            </h4>
            <p className="text-slate-600 text-xs sm:text-sm mt-1">
              আমাদের অবস্থান: রফিক মঞ্জিল, মঙ্গলকাটা বাজার, সুনামগঞ্জ সদর, সুনামগঞ্জ।
            </p>
          </div>

          <a
            href={getWhatsAppUrl("হ্যালো SupplyLink, আমি আপনাদের সুনামগঞ্জ অফিসে সরাসরি এসে কিস্তিতে পণ্য নেওয়ার ব্যাপারে কথা বলতে চাই।")}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-bold text-xs sm:text-sm shadow-md shadow-green-500/20 transition-all hover:scale-105 active:scale-95"
          >
            <FaWhatsapp className="h-4 w-4" />
            <span>অফিস ভিজিটের জন্য WhatsApp করুন</span>
          </a>
        </div>
      </div>
    </section>
  );
}
