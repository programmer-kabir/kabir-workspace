'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Layers } from 'lucide-react';

interface CategoryItem {
  name_bn: string;
  name_en: string;
  slug: string;
  icon: string;
}

export default function CategoryDropdown({ categories }: { categories: CategoryItem[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        className="flex items-center gap-1.5 hover:text-store-primary transition pb-1 font-bold focus:outline-none"
      >
        <span>ক্যাটাগরি (Categories)</span>
        <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180 text-store-primary' : ''}`} />
      </button>

      {isOpen && (
        <div 
          onMouseLeave={() => setIsOpen(false)}
          className="absolute left-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 py-3 z-50 animate-in fade-in duration-150"
        >
          <div className="px-4 py-2 border-b border-gray-100 flex items-center gap-2 text-xs font-bold text-gray-900 uppercase font-sans tracking-wide">
            <Layers size={14} className="text-store-primary" />
            <span>সকল ক্যাটাগরি ব্রাউজ করুন</span>
          </div>

          <div className="max-h-[380px] overflow-y-auto py-1">
            {categories.map((cat, idx) => (
              <a
                key={idx}
                href={`/category/${cat.slug}`}
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between px-4 py-2.5 hover:bg-emerald-50 text-gray-700 hover:text-store-primary transition group text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="text-base group-hover:scale-110 transition">{cat.icon}</span>
                  <div>
                    <strong className="block text-gray-900 group-hover:text-store-primary font-bangla font-semibold leading-tight">
                      {cat.name_bn}
                    </strong>
                    <span className="text-[10px] text-gray-400 font-sans block">
                      {cat.name_en}
                    </span>
                  </div>
                </div>
                <span className="text-gray-300 group-hover:text-store-primary transition font-sans">➜</span>
              </a>
            ))}
          </div>

          <div className="px-4 pt-2 border-t border-gray-100 mt-1">
            <a
              href="#categories"
              onClick={() => setIsOpen(false)}
              className="block text-center py-2 bg-emerald-50 text-store-primary hover:bg-emerald-100 font-bold rounded-xl text-xs transition"
            >
              সব ক্যাটাগরি একসাথে দেখুন ➜
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
