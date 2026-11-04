import React from 'react';
import { Zap, MessageCircle, Send, ShieldAlert } from 'lucide-react';
import { sounds } from '../services/soundEffects';
import { useApp } from '../context/AppContext';

export const Footer = () => {
  const { paymentChannels } = useApp();
  const supportNumber = paymentChannels?.bkash?.number || '01738679399';
  const cleanWaNumber = supportNumber.replace(/\D/g, '').replace(/^0/, '880');

  return (
    <>
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-10 mt-10 text-slate-600 dark:text-slate-400 pb-20 md:pb-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Column 1: Brand */}
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 to-rose-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Zap size={18} fill="currentColor" />
                </div>
                <span className="text-xl font-black text-slate-900 dark:text-white tracking-wider">TOPUP BD</span>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                বাংলাদেশের সবচেয়ে নির্ভরযোগ্য ও দ্রুততম ফ্রি ফায়ার ডায়মন্ড ও মেম্বারশিপ টপ-আপ প্ল্যাটফর্ম। বিকাশ, নগদ ও রকেটে ১-৩ মিনিটে স্বয়ংক্রিয় ডেলিভারি।
              </p>
            </div>

            {/* Column 2: Legal & Safety Notice */}
            <div>
              <div className="flex items-center gap-1.5 text-amber-500 text-sm font-bold mb-2.5">
                <ShieldAlert size={16} />
                <span>সতর্কবার্তা ও নীতিমালা</span>
              </div>
              <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                মা-বাবা বা পরিবারের কারো মোবাইল থেকে না বলে টাকা পাঠিয়ে অর্ডার করা সম্পূর্ণ নিষিদ্ধ। কোনো নিয়ম ভঙ্গ করলে বা ফেক TrxID দিলে একাউন্ট স্থায়ীভাবে ব্লক করা হবে।
              </p>
            </div>

            {/* Column 3: Contact & Community */}
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-white mb-2.5">
                কমিউনিটি ও হেল্পলাইন
              </div>
              <div className="flex flex-col gap-2.5 text-xs sm:text-sm">
                <a 
                  href={`https://wa.me/${cleanWaNumber}`} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="flex items-center gap-2 text-emerald-500 hover:text-emerald-600 font-semibold"
                  onClick={() => sounds.playClick()}
                >
                  <MessageCircle size={16} />
                  <span>WhatsApp: {supportNumber}</span>
                </a>
                <a 
                  href="https://t.me/topupshopapps" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="flex items-center gap-2 text-sky-500 hover:text-sky-600 font-semibold"
                  onClick={() => sounds.playClick()}
                >
                  <Send size={16} />
                  <span>টেলিগ্রাম অফিশিয়াল গ্রুপ</span>
                </a>
              </div>
            </div>

          </div>

          <div className="border-t border-slate-200 dark:border-slate-800 mt-8 pt-5 text-center text-xs text-slate-400 dark:text-slate-500">
            © {new Date().getFullYear()} TopUp BD. All rights reserved. Crafted with gaming passion.
          </div>
        </div>
      </footer>

      {/* Floating 24/7 WhatsApp Button */}
      <a 
        href={`https://wa.me/${cleanWaNumber}`} 
        target="_blank" 
        rel="noreferrer" 
        className="fixed bottom-20 md:bottom-6 right-5 w-13 h-13 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/30 hover:scale-110 active:scale-95 transition-all z-40 cursor-pointer"
        title={`২৪ ঘন্টা WhatsApp কাস্টমার সাপোর্ট (${supportNumber})`}
        onClick={() => sounds.playClick()}
      >
        <MessageCircle size={26} fill="currentColor" />
      </a>
    </>
  );
};
