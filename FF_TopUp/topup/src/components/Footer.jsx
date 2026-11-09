import React from 'react';
import { Zap, MessageCircle, Send, ShieldAlert, Heart, CheckCircle2 } from 'lucide-react';
import { sounds } from '../services/soundEffects';
import { useApp } from '../context/AppContext';

export const Footer = () => {
  const { paymentChannels } = useApp();
  const supportNumber = paymentChannels?.bkash?.number || '01738679399';
  const cleanWaNumber = supportNumber.replace(/\D/g, '').replace(/^0/, '880');

  return (
    <>
      <footer className="bg-white border-t border-slate-200 pt-12 pb-24 md:pb-12 text-slate-600 mt-12 transition-colors">
        <div className="app-container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-10 border-b border-slate-200">
            
            {/* Column 1: Brand & Mission */}
            <div>
              <div className="flex items-center gap-2.5 mb-3.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 via-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-sky-500/20">
                  <Zap size={20} className="fill-current text-white" />
                </div>
                <span className="text-xl font-black text-slate-900 tracking-tight">TOPUP BD</span>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed text-slate-600 font-medium">
                বাংলাদেশের সবচেয়ে নির্ভরযোগ্য ও সুপারফাস্ট ফ্রি ফায়ার ডায়মন্ড ও মেম্বারশিপ টপ-আপ প্ল্যাটফর্ম। বিকাশ, নগদ ও রকেটে ১-৩ মিনিটে স্বয়ংক্রিয় ডেলিভারি।
              </p>
              <div className="flex items-center gap-2 mt-4 text-xs font-bold text-emerald-700">
                <CheckCircle2 size={15} />
                <span>অফিশিয়াল ও নিরাপদ গেমিং সার্ভিস</span>
              </div>
            </div>

            {/* Column 2: Safety & Rules */}
            <div>
              <div className="flex items-center gap-2 text-amber-700 text-sm font-bold mb-3">
                <ShieldAlert size={17} />
                <span>সতর্কবার্তা ও নীতিমালা</span>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed text-slate-600 font-medium">
                মা-বাবা বা পরিবারের কারো মোবাইল থেকে না বলে টাকা পাঠিয়ে অর্ডার করা সম্পূর্ণ নিষিদ্ধ। কোনো নিয়ম ভঙ্গ করলে বা ফেক TrxID দিলে অ্যাকাউন্ট স্থায়ীভাবে ব্যান করা হবে।
              </p>
            </div>

            {/* Column 3: Contact & Community */}
            <div>
              <div className="text-sm font-bold text-slate-900 mb-3">
                কমিউনিটি ও হেল্পলাইন
              </div>
              <div className="flex flex-col gap-3 text-xs sm:text-sm">
                <a 
                  href={`https://wa.me/${cleanWaNumber}`} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="flex items-center gap-2.5 text-emerald-700 hover:text-emerald-800 font-semibold transition-colors"
                  onClick={() => sounds.playClick()}
                >
                  <MessageCircle size={18} />
                  <span>WhatsApp: {supportNumber}</span>
                </a>
                <a 
                  href="https://t.me/topupshopapps" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="flex items-center gap-2.5 text-sky-700 hover:text-sky-800 font-semibold transition-colors"
                  onClick={() => sounds.playClick()}
                >
                  <Send size={18} />
                  <span>Telegram Community Channel</span>
                </a>
              </div>
            </div>

          </div>

          {/* Bottom Copyright */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-medium">
            <div>
              © {new Date().getFullYear()} <span className="text-slate-800 font-bold">TopUp BD</span>. সর্বস্বত্ব সংরক্ষিত।
            </div>
            <div className="flex items-center gap-1 text-slate-600">
              <span>Made with</span>
              <Heart size={13} className="text-rose-500 fill-rose-500" />
              <span>for Bangladeshi Gamers</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Action Button */}
      <a 
        href={`https://wa.me/${cleanWaNumber}`}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-20 md:bottom-6 right-5 z-40 w-12 h-12 md:w-14 md:h-14 rounded-full bg-[#25d366] text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 hover:scale-110 active:scale-95 transition-all cursor-pointer"
        title="WhatsApp সরাসরি চ্যাট করুন"
        onClick={() => sounds.playClick()}
      >
        <MessageCircle size={26} />
      </a>
    </>
  );
};
