import React from 'react';
import { useApp } from '../context/AppContext';
import { Megaphone, Flame } from 'lucide-react';

export const NoticeTicker = () => {
  const { notice } = useApp();

  return (
    <div className="bg-slate-900 text-white border-b border-slate-800 h-10 overflow-hidden relative z-40 shadow-sm">
      <div className="app-container flex items-center h-full gap-3">
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 text-white px-3 py-1 text-[11px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 shrink-0 rounded-full shadow-md shadow-red-500/20 h-6.5">
          <Flame size={13} className="text-amber-300 animate-pulse" />
          <span>জরুরি নোটিশ</span>
        </div>

        <div className="flex-1 overflow-hidden whitespace-nowrap [mask-image:linear-gradient(to_right,transparent,black_20px,black_calc(100%-20px),transparent)]">
          <div className="notice-scroller text-xs sm:text-sm font-semibold text-slate-200 hover:text-white transition-colors">
            {notice}
          </div>
        </div>
      </div>
    </div>
  );
};
