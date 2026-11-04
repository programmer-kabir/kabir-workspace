import React from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { X, History, CheckCircle2, Clock, Eye, AlertCircle } from 'lucide-react';
import { sounds } from '../services/soundEffects';

export const OrderHistoryModal = () => {
  const { isOrdersHistoryOpen, setIsOrdersHistoryOpen, orders, setActiveReceipt } = useApp();
  const { currentUser } = useAuth();

  if (!isOrdersHistoryOpen) return null;

  // Filter orders strictly for current logged-in user
  const userOrders = currentUser 
    ? orders.filter(o => o.userId === currentUser.uid)
    : [];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4" onClick={() => setIsOrdersHistoryOpen(false)}>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        
        <button 
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer" 
          onClick={() => {
            sounds.playClick();
            setIsOrdersHistoryOpen(false);
          }}
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-2 mb-4 text-base sm:text-lg font-bold text-slate-900 dark:text-white">
          <History size={20} className="text-sky-500" />
          <span>আমার অর্ডার হিস্ট্রি</span>
        </div>

        {userOrders.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <AlertCircle size={36} className="mx-auto mb-2 opacity-40 text-slate-400" />
            <p className="text-sm">আপনার কোনো পূর্ববর্তী অর্ডার পাওয়া যায়নি।</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5 overflow-y-auto pr-1">
            {userOrders.map(order => {
              const isCompleted = order.status === 'Completed';
              return (
                <div 
                  key={order.id} 
                  className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 flex flex-col gap-2 shadow-xs"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sky-500 text-xs sm:text-sm">
                        {order.id}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                      isCompleted 
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25' 
                        : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25'
                    }`}>
                      {isCompleted ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                      <span>{isCompleted ? 'ডেলিভারি সম্পন্ন' : order.status}</span>
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs sm:text-sm">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">{order.packageName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">UID: {order.uid} ({order.playerNickname || 'Player'})</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-black text-amber-500 text-base">
                        ৳{order.amount}
                      </div>
                      <button 
                        className="text-[11px] text-sky-500 hover:text-sky-600 font-semibold inline-flex items-center gap-0.5 cursor-pointer"
                        onClick={() => {
                          sounds.playClick();
                          setActiveReceipt(order);
                        }}
                      >
                        <Eye size={12} /> মেমো দেখুন
                      </button>
                    </div>
                  </div>

                  {/* Real-time Order Progress Bar */}
                  <div className="bg-slate-200 dark:bg-slate-700 h-1 rounded-full overflow-hidden mt-1">
                    <div 
                      className={`h-full transition-all duration-500 ${isCompleted ? 'bg-emerald-500 w-full' : 'bg-sky-500 w-3/5'}`} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};
