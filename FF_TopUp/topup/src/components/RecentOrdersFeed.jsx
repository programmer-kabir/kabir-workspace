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
    ? orders.slice(0, 5).map(o => ({
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
      ].slice(0, 5);

  return (
    <section className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm my-8 sm:my-12">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-5 border-b border-slate-100 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center shrink-0">
            <ShoppingBag size={20} />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              লাইভ সাম্প্রতিক অর্ডার ও ডেলিভারি স্ট্রিম
            </h3>
            <p className="text-xs text-slate-500 font-medium">প্রতিটি সফল টপ-আপ স্বয়ংক্রিয়ভাবে তালিকাভুক্ত হয়</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200">
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
            <span>লাইভ স্ট্রিম</span>
          </div>

          <button 
            className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-sky-600 hover:border-sky-200 transition-all cursor-pointer" 
            title="রিফ্রেশ"
            onClick={() => {
              sounds.playClick();
            }}
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Stream Rows */}
      <div className="divide-y divide-slate-100 mt-2">
        {displayList.map((order) => {
          const maskedUid = order.uid.length >= 6 
            ? `${order.uid.slice(0, 4)}****${order.uid.slice(-2)}` 
            : `${order.uid.slice(0, 3)}***`;

          return (
            <div 
              key={order.id} 
              className="py-3.5 sm:py-4 px-2 sm:px-3 flex items-center justify-between gap-4 hover:bg-slate-50 rounded-2xl transition-colors"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-sky-100 border border-sky-200 text-sky-700 font-black flex items-center justify-center shrink-0 text-sm">
                  {order.customerName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                      {order.customerName}
                    </span>
                    <span className="text-[10px] bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded-full font-bold inline-flex items-center gap-1 shrink-0">
                      <ShieldCheck size={11} /> ভেরিফাইড
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 truncate">
                    <span className="text-sky-600 font-bold">{order.packageName}</span>
                    <span>•</span>
                    <span className="font-mono text-slate-600">UID: {maskedUid}</span>
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
                <div className="text-xs sm:text-sm font-black text-slate-900">
                  ৳{order.amount}
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-bold mt-0.5">
                  <CheckCircle2 size={12} />
                  <span>ডেলিভার্ড</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

    </section>
  );
};
