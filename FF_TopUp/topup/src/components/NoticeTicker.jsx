import React from 'react';
import { useApp } from '../context/AppContext';
import { Megaphone } from 'lucide-react';

export const NoticeTicker = () => {
  const { notice } = useApp();

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 h-10 overflow-hidden relative z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 flex items-center h-full gap-3">
        <div className="bg-gradient-to-r from-rose-600 to-rose-700 text-white px-3 py-1 text-[11px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 shrink-0 rounded-full shadow-sm h-6.5">
          <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
          <Megaphone size={12} />
          <span>নোটিশ</span>
        </div>

        <div className="flex-1 overflow-hidden whitespace-nowrap [mask-image:linear-gradient(to_right,transparent,black_20px,black_calc(100%-20px),transparent)]">
          <div className="notice-scroller text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">
            {notice}
          </div>
        </div>
      </div>
    </div>
  );
};
