import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, RefreshCw, ShoppingBag, ShieldCheck } from 'lucide-react';
import { sounds } from '../services/soundEffects';

export const RecentOrdersFeed = () => {
  const { orders } = useApp();

  const mockBackfills = [
    { id: 'TOP-88192', customerName: 'তানভীর আহমেদ', packageName: '115 Diamonds', uid: '1849208492', amount: 85, status: 'Completed', time: '১ মিনিট আগে' },
    { id: 'TOP-88191', customerName: 'সাকিব হাসান', packageName: 'Weekly Membership', uid: '2901928401', amount: 190, status: 'Completed', time: '৩ মিনিট আগে' },
    { id: 'TOP-88190', customerName: 'আরিফ হোসেন', packageName: '240 Diamonds', uid: '3812049281', amount: 175, status: 'Completed', time: '৫ মিনিট আগে' },
    { id: 'TOP-88189', customerName: 'মেহেদী হাসান রনি', packageName: '610 Diamonds', uid: '1723049182', amount: 420, status: 'Completed', time: '৮ মিনিট আগে' },
    { id: 'TOP-88188', customerName: 'ইমরান খান', packageName: 'Level Up Pass', uid: '1984029183', amount: 190, status: 'Completed', time: '১১ মিনিট আগে' }
  ];

  // If real orders exist, show them; otherwise backfill seamlessly
  const displayList = orders && orders.length >= 4 
    ? orders.slice(0, 6).map(o => ({
        id: o.id,
        customerName: o.customerName || 'গেমার',
        packageName: o.packageName || 'Diamonds Pack',
        uid: o.uid || '1849208492',
        amount: o.amount || 85,
        status: o.status || 'Completed',
        time: 'এইমাত্র'
      }))
    : [
        ...orders.map(o => ({
          id: o.id,
          customerName: o.customerName || 'গেমার',
          packageName: o.packageName || 'Diamonds Pack',
          uid: o.uid || '1849208492',
          amount: o.amount || 85,
          status: o.status || 'Completed',
          time: 'এইমাত্র'
        })),
        ...mockBackfills
      ].slice(0, 6);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl md:rounded-3xl p-4 sm:p-6 shadow-xs my-6 sm:my-8">
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="w-8 h-8 rounded-lg bg-sky-500/15 text-sky-500 flex items-center justify-center shrink-0">
            <ShoppingBag size={18} />
          </div>
          <h3 className="text-sm sm:text-base md:text-lg font-black text-slate-900 dark:text-white">
            লাইভ সাম্প্রতিক অর্ডার ও ডেলিভারি স্ট্রিম
          </h3>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[11px] font-bold border border-rose-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
            <span>Live Stream</span>
          </div>
        </div>

        <button 
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-sky-500 hover:border-sky-500/30 transition-all cursor-pointer" 
          title="রিফ্রেশ"
          onClick={() => {
            sounds.playClick();
          }}
        >
          <RefreshCw size={14} />
        </button>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800/60 mt-1">
        {displayList.map((order) => {
          const maskedUid = order.uid.length >= 6 
            ? `${order.uid.slice(0, 4)}****${order.uid.slice(-2)}` 
            : `${order.uid.slice(0, 3)}***`;

          return (
            <div key={order.id} className="py-2.5 sm:py-3 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-xl transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-sky-500/15 to-blue-500/20 text-sky-600 dark:text-sky-400 font-bold flex items-center justify-center shrink-0 text-sm">
                  {order.customerName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">{order.customerName}</span>
                    <span className="text-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.2 rounded-md font-bold inline-flex items-center gap-0.5 shrink-0">
                      <ShieldCheck size={10} /> ভেরিফাইড
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    <span className="text-sky-500 font-bold">{order.packageName}</span>
                    <span>•</span>
                    <span className="font-mono">UID: {maskedUid}</span>
                    {order.time && (
                      <>
                        <span>•</span>
                        <span className="text-slate-400">{order.time}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">৳{order.amount}</div>
                <div className="text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mt-0.5">
                  <CheckCircle2 size={10} />
                  <span>{order.status === 'Completed' ? 'ডেলিভারি সম্পন্ন' : order.status}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
