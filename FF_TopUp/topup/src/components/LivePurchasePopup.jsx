import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, X } from 'lucide-react';
import { sounds } from '../services/soundEffects';

export const LivePurchasePopup = () => {
  const { orders } = useApp();
  const [currentNotification, setCurrentNotification] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Fallback realistic recent purchases for Bangladeshi Free Fire gamers
  const mockPurchases = [
    { name: 'তানভীর আহমেদ', uid: '1849****02', package: '115 Diamonds', time: '১ মিনিট আগে', amount: '৮৫' },
    { name: 'সাকিবুল হাসান', uid: '2901****88', package: '240 Diamonds', time: '২ মিনিট আগে', amount: '১৭৫' },
    { name: 'আরিফ হোসেন', uid: '3812****54', package: 'Weekly Membership', time: 'এইমাত্র', amount: '১৯০' },
    { name: 'মেহেদী হাসান রনি', uid: '1723****90', package: '610 Diamonds', time: '৩ মিনিট আগে', amount: '৪২০' },
    { name: 'রাকিবুল ইসলাম', uid: '2049****15', package: 'Level Up Pass', time: '৪ মিনিট আগে', amount: '১৯০' },
    { name: 'ফারহান চৌধুরী', uid: '3182****77', package: '1240 Diamonds', time: '৫ মিনিট আগে', amount: '৮৪০' },
    { name: 'ইমরান খান', uid: '1984****33', package: 'Monthly Membership', time: 'এইমাত্র', amount: '৯২০' }
  ];

  useEffect(() => {
    if (isDismissed) return;

    let timer;
    let hideTimer;

    const showRandomOrder = () => {
      const realOrders = orders.filter(o => o.status === 'Completed' || o.status === 'Processing');
      let item;

      if (realOrders.length > 0 && Math.random() > 0.4) {
        const rand = realOrders[Math.floor(Math.random() * realOrders.length)];
        item = {
          name: rand.customerName || 'গেমার',
          uid: rand.uid ? `${rand.uid.slice(0, 4)}****${rand.uid.slice(-2)}` : '1849****02',
          package: rand.packageName || 'Diamonds Pack',
          time: 'এইমাত্র',
          amount: rand.amount || '৮৫'
        };
      } else {
        item = mockPurchases[Math.floor(Math.random() * mockPurchases.length)];
      }

      setCurrentNotification(item);
      setIsVisible(true);

      hideTimer = setTimeout(() => {
        setIsVisible(false);
      }, 5000);
    };

    const initialDelay = setTimeout(() => {
      showRandomOrder();
      timer = setInterval(showRandomOrder, 14000);
    }, 3000);

    return () => {
      clearTimeout(initialDelay);
      clearInterval(timer);
      clearTimeout(hideTimer);
    };
  }, [orders, isDismissed]);

  if (isDismissed || !currentNotification || !isVisible) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 z-40 max-w-[340px] w-[calc(100vw-32px)] bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-xl backdrop-blur-md flex items-center gap-3 transition-all">
      {/* Gamer Avatar with glowing badge */}
      <div className="relative shrink-0">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500/15 to-rose-500/15 border border-sky-500 flex items-center justify-center font-black text-sky-600 dark:text-sky-400 text-sm">
          {currentNotification.name.charAt(0)}
        </div>
        <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full w-4 h-4 flex items-center justify-center border-2 border-white dark:border-slate-900">
          <CheckCircle2 size={10} className="text-white" />
        </div>
      </div>

      {/* Info Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1.5">
          <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
            {currentNotification.name}
          </div>
          <span className="text-[10px] text-sky-500 font-bold shrink-0">
            {currentNotification.time}
          </span>
        </div>

        <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
          🔥 <b className="text-rose-500">{currentNotification.package}</b> সফল ডেলিভারি!
        </div>

        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
          <span>UID: {currentNotification.uid}</span>
          <span>•</span>
          <span className="text-emerald-500 font-bold">৳{currentNotification.amount} পরিশোধিত</span>
        </div>
      </div>

      {/* Close button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          sounds.playClick();
          setIsVisible(false);
          setIsDismissed(true);
        }}
        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md self-start shrink-0 cursor-pointer"
        title="বন্ধ করুন"
      >
        <X size={14} />
      </button>
    </div>
  );
};
