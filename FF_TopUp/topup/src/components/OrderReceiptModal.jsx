import React from 'react';
import { useApp } from '../context/AppContext';
import { X, Printer, Share2, MessageCircle } from 'lucide-react';
import { sounds } from '../services/soundEffects';

export const OrderReceiptModal = () => {
  const { activeReceipt, setActiveReceipt, paymentChannels, showToast } = useApp();

  if (!activeReceipt) return null;

  const getWhatsAppNumber = () => {
    const raw = paymentChannels?.bkash?.number || paymentChannels?.nagad?.number || '01738679399';
    const digits = raw.replace(/\D/g, '');
    if (digits.startsWith('880')) return digits;
    if (digits.startsWith('0')) return '88' + digits;
    return '880' + digits;
  };

  const handleWhatsAppSend = () => {
    sounds.playClick();
    const phone = getWhatsAppNumber();
    const formattedDate = activeReceipt.createdAt ? new Date(activeReceipt.createdAt).toLocaleString('bn-BD') : '';
    const msg = `⚡ *TopUp BD Order Slip* ⚡\n` +
      `------------------------------------\n` +
      `🆔 *অর্ডার আইডি:* ${activeReceipt.id}\n` +
      `👤 *প্লেয়ার UID:* ${activeReceipt.uid}\n` +
      `🎮 *প্লেয়ার নাম:* ${activeReceipt.playerNickname || 'Player'}\n` +
      `💎 *প্যাকেজ:* ${activeReceipt.packageName}\n` +
      `💰 *টাকার পরিমাণ:* ৳${activeReceipt.amount} (${activeReceipt.method})\n` +
      (activeReceipt.trxId ? `🧾 *TrxID:* ${activeReceipt.trxId}\n` : '') +
      (formattedDate ? `🕒 *সময়:* ${formattedDate}\n` : '') +
      `------------------------------------\n` +
      `এডমিন ভাই, আমি টাকা পাঠিয়েছি। দয়া করে দ্রুত চেক করে ডেলিভারি দিন। ধন্যবাদ!`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const handlePrint = () => {
    sounds.playClick();
    window.print();
  };

  const handleShare = () => {
    sounds.playClick();
    const text = `অর্ডার আইডি: ${activeReceipt.id} | প্যাকেজ: ${activeReceipt.packageName} | প্লেয়ার UID: ${activeReceipt.uid} | স্ট্যাটাস: ${activeReceipt.status}`;
    navigator.clipboard.writeText(text);
    showToast('অর্ডারের বিবরণ কপি করা হয়েছে!', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4" onClick={() => setActiveReceipt(null)}>
      <div className="bg-white text-slate-900 border border-slate-200 rounded-2xl max-w-sm sm:max-w-md w-full shadow-2xl relative overflow-hidden" onClick={(e) => e.stopPropagation()}>
        
        <button 
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 cursor-pointer z-10" 
          onClick={() => {
            sounds.playClick();
            setActiveReceipt(null);
          }}
        >
          <X size={18} />
        </button>

        <div className="p-5 sm:p-6 bg-white text-slate-900">
          
          <div className="text-center pb-3 border-b border-dashed border-slate-300">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-wider">TOPUP BD</h2>
            <p className="text-xs text-slate-500">অফিসিয়াল ডিজিটাল ক্যাশ মেমো</p>
            <div className="inline-block bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full mt-2">
              ✓ {activeReceipt.status === 'Completed' ? 'ডেলিভারি সম্পন্ন' : 'অর্ডার গৃহীত হয়েছে'}
            </div>
          </div>

          <table className="w-full text-xs sm:text-sm my-3 divide-y divide-slate-100">
            <tbody>
              <tr>
                <td className="py-1.5 text-slate-500">অর্ডার নং:</td>
                <td className="py-1.5 font-mono font-bold text-slate-900 text-right">{activeReceipt.id}</td>
              </tr>
              <tr>
                <td className="py-1.5 text-slate-500">গ্রাহক নাম:</td>
                <td className="py-1.5 font-medium text-slate-900 text-right">{activeReceipt.customerName}</td>
              </tr>
              <tr>
                <td className="py-1.5 text-slate-500">প্লেয়ার UID:</td>
                <td className="py-1.5 font-mono font-bold text-slate-900 text-right">{activeReceipt.uid}</td>
              </tr>
              <tr>
                <td className="py-1.5 text-slate-500">প্লেয়ার নাম:</td>
                <td className="py-1.5 font-medium text-slate-900 text-right">{activeReceipt.playerNickname || 'Player Verified'}</td>
              </tr>
              <tr>
                <td className="py-1.5 text-slate-500">সার্ভিস:</td>
                <td className="py-1.5 font-medium text-slate-900 text-right">{activeReceipt.productName}</td>
              </tr>
              <tr>
                <td className="py-1.5 text-slate-500">প্যাকেজ:</td>
                <td className="py-1.5 font-bold text-sky-600 text-right">{activeReceipt.packageName}</td>
              </tr>
              <tr>
                <td className="py-1.5 text-slate-500">পেমেন্ট মেথড:</td>
                <td className="py-1.5 font-medium text-slate-900 text-right">{activeReceipt.method}</td>
              </tr>
              {activeReceipt.trxId && (
                <tr>
                  <td className="py-1.5 text-slate-500">TrxID:</td>
                  <td className="py-1.5 font-mono text-xs font-bold text-slate-900 text-right">{activeReceipt.trxId}</td>
                </tr>
              )}
              <tr>
                <td className="py-1.5 text-slate-500">তারিখ ও সময়:</td>
                <td className="py-1.5 text-xs text-slate-500 text-right">{new Date(activeReceipt.createdAt).toLocaleTimeString()}</td>
              </tr>
              <tr className="border-t-2 border-slate-900 font-bold text-base">
                <td className="pt-2 text-slate-900">পরিশোধিত টাকা:</td>
                <td className="pt-2 text-rose-600 text-right font-black">৳{activeReceipt.amount}</td>
              </tr>
            </tbody>
          </table>

          {/* Simulated Barcode */}
          <div className="flex items-center justify-center gap-0.5 h-7 my-3 overflow-hidden opacity-70">
            {[3, 1, 4, 2, 5, 2, 3, 1, 4, 2, 3, 1, 2, 4, 3, 5, 1, 2, 3, 2, 4, 1, 3, 2, 4].map((w, idx) => (
              <span key={idx} className="bg-slate-900 h-full inline-block" style={{ width: `${w}px` }}></span>
            ))}
          </div>

          <div className="flex flex-col gap-2 mt-3">
            <button 
              type="button" 
              className="w-full bg-[#25d366] hover:bg-[#20bd5a] text-white font-bold text-xs sm:text-sm py-3 rounded-xl shadow-md shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
              onClick={handleWhatsAppSend}
            >
              <MessageCircle size={18} /> 
              <span>WhatsApp এ স্লিপ পাঠান (দ্রুত ডেলিভারি)</span>
            </button>

            <div className="flex gap-2">
              <button 
                type="button" 
                className="flex-1 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                onClick={handlePrint}
              >
                <Printer size={15} /> প্রিন্ট / সেভ
              </button>
              <button 
                type="button" 
                className="flex-1 py-2 rounded-xl bg-slate-600 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                onClick={handleShare}
              >
                <Share2 size={15} /> কপি মেমো
              </button>
            </div>
          </div>

          <button 
            type="button" 
            className="w-full mt-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs text-center border border-slate-200 cursor-pointer transition-colors"
            onClick={() => {
              sounds.playClick();
              setActiveReceipt(null);
            }}
          >
            বন্ধ করুন (Close)
          </button>
        </div>

      </div>
    </div>
  );
};
