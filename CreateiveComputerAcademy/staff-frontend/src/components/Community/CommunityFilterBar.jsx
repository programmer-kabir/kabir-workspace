import React from 'react';
import { CATEGORIES } from './communityUtils.jsx';

export default function CommunityFilterBar({
  selectedCategory,
  setSelectedCategory,
  activeFilter,
  setActiveFilter
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      {/* Category Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
        <button
          type="button"
          onClick={() => setSelectedCategory('all')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-black transition cursor-pointer whitespace-nowrap border ${
            selectedCategory === 'all'
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-indigo-400'
          }`}
        >
          🌐 All Topics
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id.toLowerCase())}
            className={`px-3.5 py-1.5 rounded-full text-xs font-black transition cursor-pointer whitespace-nowrap border flex items-center gap-1.5 ${
              selectedCategory === cat.id.toLowerCase()
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-indigo-400'
            }`}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* View Filter (Stream / Pinned / My Posts) */}
      <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 shrink-0 self-start sm:self-auto text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveFilter('all')}
          className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
            activeFilter === 'all'
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-black'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Stream
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter('pinned')}
          className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 ${
            activeFilter === 'pinned'
              ? 'bg-slate-100 dark:bg-slate-800 text-amber-600 dark:text-amber-400 font-black'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>📌</span>
          <span>Pinned</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter('my_posts')}
          className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
            activeFilter === 'my_posts'
              ? 'bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-black'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          My Posts
        </button>
      </div>
    </div>
  );
}

